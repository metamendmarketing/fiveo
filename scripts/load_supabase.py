#!/usr/bin/env python3
"""
FiveO Motorsport — Supabase Database Loader
=============================================
Loads the vehicle fitment tree and product catalog into Supabase/PostgreSQL.

Usage:
    python3 scripts/load_supabase.py

Requires .env with:
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_KEY=sb_secret_xxx
"""

import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# ── Config ───────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

FITMENT_FILE = ROOT / "data" / "raw" / "fiveo_fitment_extract.json"
PRODUCTS_FILE = ROOT / "data" / "normalized" / "products.enriched.json"
SCHEMA_FILE = ROOT / "data" / "docs" / "schema.sql"

BATCH_SIZE = 200  # rows per upsert batch (smaller = fewer dupe conflicts)


# ── Helpers ──────────────────────────────────────────────────

def load_json(path):
    print(f"  Loading {path.name} ({path.stat().st_size / 1024 / 1024:.1f} MB)...")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def parse_engine_label(label):
    """Parse engine label like 'LS, L4, 1.6L, D16A1, GAS' into components."""
    parts = [p.strip() for p in label.split(",")]
    result = {"trim": None, "config": None, "displacement": None,
              "engine_code": None, "fuel_type": None}

    for part in parts:
        p = part.upper()
        # Fuel type
        if p in ("GAS", "GASOLINE", "DIESEL", "FLEX", "E85", "CNG", "HYBRID"):
            result["fuel_type"] = part
        # Engine config (L4, V6, V8, H4, L5, L6, W12, etc.)
        elif re.match(r'^[LVHWI]\d{1,2}$', p):
            result["config"] = part
        # Displacement (1.6L, 2.0L, 5.7L, etc.)
        elif re.match(r'^\d+\.\d+L$', p):
            result["displacement"] = part
        # Engine code (alphanumeric, 3+ chars, not a pure number, not a known pattern)
        elif (re.match(r'^[A-Z0-9]{3,}$', p) and not p.isdigit()
              and not re.match(r'^\d+CID$', p)  # skip displacement in CID
              and result["engine_code"] is None):
            result["engine_code"] = part
        # CID displacement
        elif re.match(r'^\d+CID$', p):
            result["displacement"] = part
        # Trim (first unmatched part, usually)
        elif result["trim"] is None and len(parts) > 2:
            result["trim"] = part

    return result


def dedup_rows(rows, key_fields):
    """Remove duplicate rows based on key_fields to avoid upsert conflicts."""
    seen = set()
    unique = []
    for row in rows:
        # Build a key from the specified fields, using None-safe string conversion
        key = tuple(str(row.get(f, '')) for f in key_fields)
        if key not in seen:
            seen.add(key)
            unique.append(row)
    dupes = len(rows) - len(unique)
    if dupes:
        print(f"    (deduped: {dupes} duplicate rows removed, {len(unique)} unique)")
    return unique


def batch_upsert(supabase, table, rows, on_conflict=None, batch_size=BATCH_SIZE):
    """Insert rows in batches. Uses upsert to handle re-runs."""
    # Deduplicate based on on_conflict columns
    if on_conflict:
        key_fields = [f.strip() for f in on_conflict.split(',')]
        rows = dedup_rows(rows, key_fields)

    total = len(rows)
    inserted = 0
    for i in range(0, total, batch_size):
        chunk = rows[i:i + batch_size]
        try:
            q = supabase.table(table).upsert(chunk, on_conflict=on_conflict)
            q.execute()
            inserted += len(chunk)
            if (i // batch_size) % 5 == 0:
                print(f"    batch {i // batch_size + 1}/{(total + batch_size - 1) // batch_size} ({inserted}/{total})")
        except Exception as e:
            print(f"    ⚠ Batch error in {table}: {e}")
            # Try one-by-one for this batch
            for row in chunk:
                try:
                    supabase.table(table).upsert(row, on_conflict=on_conflict).execute()
                    inserted += 1
                except Exception as e2:
                    sku_hint = row.get('sku', row.get('name', row.get('label', '?')))
                    print(f"    ✗ Skipped ({sku_hint}): {e2}")
    return inserted


# ── Step 1: Load Vehicle Fitment Tree ────────────────────────

def load_vehicles(supabase):
    print("\n═══ Step 1: Loading Vehicle Fitment Tree ═══")
    data = load_json(FITMENT_FILE)
    tree = data["tree"]

    # The tree structure:
    # depth 0: category wrapper (skip — label is an artifact)
    # depth 1: Make (ACURA, BMW, ...)
    # depth 2: Model (CL, INTEGRA, ...)
    # depth 3: Year (1986, 1987, ...)
    # depth 4: Engine (LS, L4, 1.6L, D16A1, GAS)

    main_branch = tree["children"][0]  # The main vehicles branch
    makes_data = main_branch["subtree"]["children"]

    makes_rows = []
    models_rows = []
    years_rows = []
    engines_rows = []

    for make_node in makes_data:
        make_name = make_node["label"]
        makes_rows.append({
            "name": make_name,
            "finder_value": make_node["value"],
            "finder_path": make_node["subtree"]["path"]
        })

    # Insert makes first to get IDs
    print(f"  Inserting {len(makes_rows)} makes...")
    batch_upsert(supabase, "makes", makes_rows, on_conflict="name")

    # Fetch make IDs
    result = supabase.table("makes").select("id, name").execute()
    make_id_map = {r["name"]: r["id"] for r in result.data}
    print(f"  ✓ {len(make_id_map)} makes loaded")

    # Now process models
    for make_node in makes_data:
        make_name = make_node["label"]
        make_id = make_id_map.get(make_name)
        if not make_id:
            continue

        for model_node in make_node["subtree"].get("children", []):
            model_name = model_node["label"]
            models_rows.append({
                "make_id": make_id,
                "name": model_name,
                "finder_value": model_node["value"],
                "finder_path": model_node["subtree"]["path"]
            })

    print(f"  Inserting {len(models_rows)} models...")
    batch_upsert(supabase, "models", models_rows, on_conflict="make_id,name")

    # Fetch model IDs
    result = supabase.table("models").select("id, make_id, name").execute()
    model_id_map = {(r["make_id"], r["name"]): r["id"] for r in result.data}
    print(f"  ✓ {len(model_id_map)} models loaded")

    # Process years
    for make_node in makes_data:
        make_name = make_node["label"]
        make_id = make_id_map.get(make_name)
        if not make_id:
            continue

        for model_node in make_node["subtree"].get("children", []):
            model_name = model_node["label"]
            model_id = model_id_map.get((make_id, model_name))
            if not model_id:
                continue

            for year_node in model_node["subtree"].get("children", []):
                year_label = year_node["label"]
                try:
                    year_int = int(year_label)
                except ValueError:
                    # Some "years" are actually engine labels at wrong depth
                    continue

                years_rows.append({
                    "model_id": model_id,
                    "year": year_int,
                    "finder_value": year_node["value"],
                    "finder_path": year_node["subtree"]["path"]
                })

    print(f"  Inserting {len(years_rows)} year records...")
    batch_upsert(supabase, "years", years_rows, on_conflict="model_id,year")

    # Fetch year IDs
    all_years = []
    # Paginate — Supabase has a 1000-row default limit
    offset = 0
    page_size = 1000
    while True:
        result = (supabase.table("years")
                  .select("id, model_id, year")
                  .range(offset, offset + page_size - 1)
                  .execute())
        all_years.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    year_id_map = {(r["model_id"], r["year"]): r["id"] for r in all_years}
    print(f"  ✓ {len(year_id_map)} years loaded")

    # Process engines
    for make_node in makes_data:
        make_name = make_node["label"]
        make_id = make_id_map.get(make_name)
        if not make_id:
            continue

        for model_node in make_node["subtree"].get("children", []):
            model_name = model_node["label"]
            model_id = model_id_map.get((make_id, model_name))
            if not model_id:
                continue

            for year_node in model_node["subtree"].get("children", []):
                try:
                    year_int = int(year_node["label"])
                except ValueError:
                    continue

                year_id = year_id_map.get((model_id, year_int))
                if not year_id:
                    continue

                for eng_node in year_node["subtree"].get("children", []):
                    parsed = parse_engine_label(eng_node["label"])
                    engines_rows.append({
                        "year_id": year_id,
                        "label": eng_node["label"],
                        "trim": parsed["trim"],
                        "config": parsed["config"],
                        "displacement": parsed["displacement"],
                        "engine_code": parsed["engine_code"],
                        "fuel_type": parsed["fuel_type"],
                        "finder_value": eng_node["value"],
                        "finder_path": eng_node["subtree"]["path"]
                    })

    print(f"  Inserting {len(engines_rows)} engine records...")
    batch_upsert(supabase, "engines", engines_rows, on_conflict="year_id,label")
    print(f"  ✓ Engines loaded")

    return make_id_map, model_id_map


# ── Step 2: Load Products ────────────────────────────────────

def load_products(supabase):
    print("\n═══ Step 2: Loading Products ═══")
    data = load_json(PRODUCTS_FILE)
    products = data["products"]

    rows = []
    for p in products:
        specs = p.get("specs", {})
        other_specs = specs.get("other_relevant_specs", {})

        row = {
            "sku": p["sku"],
            "name": p["name"],
            "price": p.get("price"),
            "url_key": p.get("url_key"),
            "product_url": p.get("product_page_url"),
            "hero_image_url": p.get("hero_image_url"),
            "description": p.get("description") or None,
            "flow_rate_cc": specs.get("flow_rate_cc"),
            "impedance": specs.get("impedance"),
            "connector_type": specs.get("connector_type"),
            "injector_type": specs.get("injector_type"),
            "fuel_types": specs.get("fuel_types", []),
            "manufacturer": other_specs.get("manufacturer"),
            "raw_specs": json.dumps(specs) if specs else None,
            "raw_categories": p.get("categories", []),
            "notes": p.get("notes", [])
        }
        rows.append(row)

    print(f"  Inserting {len(rows)} products...")
    inserted = batch_upsert(supabase, "products", rows, on_conflict="sku")
    print(f"  ✓ {inserted} products loaded")

    return products


# ── Step 3: Build Product ↔ Vehicle Mappings ─────────────────

def build_fitment_mappings(supabase, products):
    print("\n═══ Step 3: Building Product-Vehicle Mappings ═══")

    # Fetch make & model data with names
    makes_result = supabase.table("makes").select("id, name").execute()
    make_lookup = {}
    for m in makes_result.data:
        make_lookup[m["name"].upper()] = m["id"]

    # Fetch all models with pagination
    all_models = []
    offset = 0
    page_size = 1000
    while True:
        result = (supabase.table("models")
                  .select("id, make_id, name")
                  .range(offset, offset + page_size - 1)
                  .execute())
        all_models.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    # Build model lookup: {(make_id, MODEL_NAME_UPPER): model_id}
    model_lookup = {}
    for m in all_models:
        model_lookup[(m["make_id"], m["name"].upper())] = m["id"]

    # Fetch product IDs
    all_products = []
    offset = 0
    while True:
        result = (supabase.table("products")
                  .select("id, sku")
                  .range(offset, offset + page_size - 1)
                  .execute())
        all_products.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    product_id_map = {r["sku"]: r["id"] for r in all_products}

    # Build mappings from product categories
    fitment_rows = []
    matched = 0
    unmatched = 0

    for p in products:
        pid = product_id_map.get(p["sku"])
        if not pid:
            continue

        cats = p.get("categories", [])
        seen_combos = set()

        for cat in cats:
            parts = cat.split("/")
            if len(parts) < 3 or parts[0] != "Search By Vehicle" or parts[1] != "Makes":
                continue

            cat_make = parts[2].upper()
            make_id = make_lookup.get(cat_make)
            if not make_id:
                continue

            if len(parts) >= 4:
                # Make + Model level
                cat_model = parts[3].upper()
                model_id = model_lookup.get((make_id, cat_model))
                if model_id:
                    combo = (pid, make_id, model_id)
                    if combo not in seen_combos:
                        seen_combos.add(combo)
                        fitment_rows.append({
                            "product_id": pid,
                            "make_id": make_id,
                            "model_id": model_id,
                            "match_source": "category_make_model"
                        })
                        matched += 1
                else:
                    # Model name didn't match — try fuzzy
                    # (some catalog names differ from finder names)
                    unmatched += 1
            else:
                # Make-only level (no model specified)
                combo = (pid, make_id, None)
                if combo not in seen_combos:
                    seen_combos.add(combo)
                    fitment_rows.append({
                        "product_id": pid,
                        "make_id": make_id,
                        "model_id": None,
                        "match_source": "category_make_only"
                    })
                    matched += 1

    print(f"  Generated {len(fitment_rows)} fitment mappings")
    print(f"    Matched: {matched}, Unmatched model names: {unmatched}")

    if fitment_rows:
        print(f"  Inserting fitment mappings...")
        inserted = batch_upsert(
            supabase, "product_fitment", fitment_rows,
            on_conflict="product_id,make_id,model_id"
        )
        print(f"  ✓ {inserted} fitment mappings loaded")

    return len(fitment_rows)


# ── Step 4: Summary ──────────────────────────────────────────

def print_summary(supabase):
    print("\n═══ Summary ═══")
    for table in ["makes", "models", "years", "engines", "products", "product_fitment"]:
        try:
            result = supabase.table(table).select("id", count="exact").limit(0).execute()
            count = result.count
        except Exception:
            count = "?"
        print(f"  {table:20s} {count} rows")


# ── Main ─────────────────────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════════╗")
    print("║  FiveO Database Loader — Starting...         ║")
    print("╚══════════════════════════════════════════════╝")
    print(f"  Supabase: {SUPABASE_URL}")

    skip_vehicles = "--products-only" in sys.argv

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if skip_vehicles:
        print("\n  Skipping vehicles (--products-only mode)")
    else:
        load_vehicles(supabase)

    products = load_products(supabase)
    build_fitment_mappings(supabase, products)
    print_summary(supabase)

    print("\n✅ Done!")


if __name__ == "__main__":
    main()
