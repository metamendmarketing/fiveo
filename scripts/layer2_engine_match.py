#!/usr/bin/env python3
"""
FiveO Motorsport — Layer 2: Engine-Specific Fitment Matching
=============================================================
Parses engine data from:
  1. Magento additional_attributes (make/model/engine fields) — 1,323 products
  2. Product names (year ranges, displacement, engine codes) — ~600 more
  3. Cross-references against the engines table for YMME-specific mappings

Usage:
    python3 scripts/layer2_engine_match.py
    python3 scripts/layer2_engine_match.py --dry-run   # analyze without writing
"""

import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
PRODUCTS_FILE = ROOT / "data" / "normalized" / "products.enriched.json"

DRY_RUN = "--dry-run" in sys.argv


# ── Helpers ──────────────────────────────────────────────────

def paginate_all(sb, table, select="*", page_size=1000):
    """Fetch all rows from a Supabase table with pagination."""
    all_rows = []
    offset = 0
    while True:
        result = sb.table(table).select(select).range(offset, offset + page_size - 1).execute()
        all_rows.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size
    return all_rows


def parse_magento_attrs(addl_str):
    """Parse Magento additional_attributes string into a dict."""
    attrs = {}
    if not addl_str:
        return attrs
    for match in re.finditer(r'(\w+)="([^"]*)"', addl_str):
        attrs[match.group(1)] = match.group(2)
    return attrs


def parse_year_range_from_name(name):
    """Extract year range from product name. Returns (start, end) or None."""
    # Year range: 1996-2001
    m = re.search(r'(19[6-9]\d|20[0-2]\d)\s*[-–]\s*(19[6-9]\d|20[0-2]\d)', name)
    if m:
        start, end = int(m.group(1)), int(m.group(2))
        if 1960 <= start <= 2035 and 1960 <= end <= 2035 and start <= end:
            return (start, end)

    # Single year
    years = re.findall(r'\b(19[6-9]\d|20[0-2]\d)\b', name)
    valid_years = [int(y) for y in years if 1960 <= int(y) <= 2035]
    if valid_years:
        return (min(valid_years), max(valid_years))

    return None


def normalize_engine_label(label):
    """Normalize an engine label for fuzzy matching."""
    # Remove extra spaces, uppercase, remove trailing commas
    s = label.upper().strip().rstrip(",")
    # Normalize separators
    s = re.sub(r'\s*,\s*', ', ', s)
    return s


def engine_components(label):
    """Extract key matching components from an engine label."""
    parts = [p.strip().upper() for p in label.split(",")]
    result = {
        "config": None,       # L4, V6, V8, H4
        "displacement": None, # 1.8L, 5.7L
        "engine_code": None,  # B18B1, LS1
        "fuel_type": None,    # GAS, DIESEL
    }

    for part in parts:
        p = part.strip()
        if re.match(r'^[LVHWI]\d{1,2}$', p):
            result["config"] = p
        elif re.match(r'^\d+\.\d+L$', p):
            result["displacement"] = p
        elif re.match(r'^\d+CID$', p):
            result["displacement"] = p
        elif p in ("GAS", "GASOLINE", "DIESEL", "FLEX", "E85"):
            result["fuel_type"] = p
        elif (re.match(r'^[A-Z]\d{1,2}[A-Z]{0,3}\d{0,2}$', p) and len(p) >= 3
              and not p.isdigit() and result["engine_code"] is None):
            result["engine_code"] = p

    return result


def match_score(product_engine_components, db_engine_components):
    """Score how well a product engine spec matches a DB engine record.
    Returns 0-100. Higher = better match."""
    score = 0
    pe = product_engine_components
    de = db_engine_components

    # Engine code match is strongest signal
    if pe["engine_code"] and de["engine_code"]:
        if pe["engine_code"] == de["engine_code"]:
            score += 50
        elif pe["engine_code"][:3] == de["engine_code"][:3]:
            # Same family (e.g. B18B1 vs B18C1 — same block, different head)
            score += 20
        else:
            return 0  # Different engine code = definite non-match

    # Displacement match
    if pe["displacement"] and de["displacement"]:
        if pe["displacement"] == de["displacement"]:
            score += 25
        else:
            # Different displacement is a strong negative unless no engine code
            if pe["engine_code"] and de["engine_code"]:
                return 0
            score -= 20

    # Config match (L4, V6, etc.)
    if pe["config"] and de["config"]:
        if pe["config"] == de["config"]:
            score += 15
        else:
            return 0  # V6 injector won't fit L4

    # Fuel type match
    if pe["fuel_type"] and de["fuel_type"]:
        if pe["fuel_type"] == de["fuel_type"]:
            score += 10

    return max(0, score)


# ── Main ─────────────────────────────────────────────────────

def main():
    print("╔══════════════════════════════════════════════════╗")
    print("║  Layer 2: Engine-Specific Fitment Matching       ║")
    print("╚══════════════════════════════════════════════════╝")
    if DRY_RUN:
        print("  Mode: DRY RUN (analysis only, no DB writes)")
    print()

    sb = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── Load reference data ──
    print("Loading reference data from Supabase...")

    makes = {r["id"]: r["name"] for r in paginate_all(sb, "makes", "id, name")}
    makes_by_name = {v.upper(): k for k, v in makes.items()}

    models_data = paginate_all(sb, "models", "id, make_id, name")
    models = {r["id"]: r for r in models_data}
    models_by_make_name = {(r["make_id"], r["name"].upper()): r["id"] for r in models_data}

    years_data = paginate_all(sb, "years", "id, model_id, year")
    years_by_model_year = {(r["model_id"], r["year"]): r["id"] for r in years_data}

    engines_data = paginate_all(sb, "engines", "id, year_id, label, config, displacement, engine_code")
    engines_by_year = defaultdict(list)
    for e in engines_data:
        engines_by_year[e["year_id"]].append(e)

    products_db = paginate_all(sb, "products", "id, sku")
    product_id_map = {r["sku"]: r["id"] for r in products_db}

    # Load existing fitment to avoid duplicates
    existing_fitment = set()
    for r in paginate_all(sb, "product_fitment", "product_id, make_id, model_id"):
        existing_fitment.add((r["product_id"], r["make_id"], r["model_id"]))

    print(f"  Makes: {len(makes)}, Models: {len(models)}, Years: {len(years_data)}, Engines: {len(engines_data)}")
    print(f"  Products: {len(product_id_map)}, Existing fitment: {len(existing_fitment)}")
    print()

    # ── Load product source data ──
    with open(PRODUCTS_FILE) as f:
        products_source = json.load(f)["products"]

    # ── Strategy 1: Magento make/model/engine attributes ──
    print("═══ Strategy 1: Magento Attribute Matching ═══")

    new_mappings = []
    strat1_matched = 0
    strat1_engines_matched = 0
    strat1_skipped_existing = 0
    strat1_no_match = 0

    for p in products_source:
        raw = p.get("raw_source_fields", {})
        if not isinstance(raw, dict):
            continue
        addl = raw.get("additional_attributes", "")
        attrs = parse_magento_attrs(addl)

        attr_make = (attrs.get("make") or "").strip().upper()
        attr_model = (attrs.get("model") or "").strip().upper()
        attr_engine = (attrs.get("engine") or "").strip()

        if not attr_make or not attr_model or not attr_engine:
            continue
        if attr_engine.upper() in ("ALL", "PLEASE SELECT", ""):
            continue

        pid = product_id_map.get(p["sku"])
        if not pid:
            continue

        make_id = makes_by_name.get(attr_make)
        if not make_id:
            continue

        model_id = models_by_make_name.get((make_id, attr_model))
        if not model_id:
            continue

        strat1_matched += 1

        # Now try to match the engine attribute to specific year+engine combos
        pe_components = engine_components(attr_engine)

        # Get year range from product name or attributes
        year_range = parse_year_range_from_name(p["name"])
        attr_year = attrs.get("year")
        if attr_year and attr_year != "2016":  # 2016 is a Magento default
            try:
                yr = int(attr_year)
                if 1960 <= yr <= 2035:
                    if year_range:
                        year_range = (min(year_range[0], yr), max(year_range[1], yr))
                    else:
                        year_range = (yr, yr)
            except ValueError:
                pass

        # Find matching years for this model
        matched_years = []
        for (mid, yr), yid in years_by_model_year.items():
            if mid != model_id:
                continue
            if year_range and not (year_range[0] <= yr <= year_range[1]):
                continue
            matched_years.append((yr, yid))

        if not matched_years:
            # No year match — still useful as make+model mapping
            combo = (pid, make_id, model_id)
            if combo not in existing_fitment:
                new_mappings.append({
                    "product_id": pid,
                    "make_id": make_id,
                    "model_id": model_id,
                    "match_source": "magento_attr_make_model"
                })
                existing_fitment.add(combo)
            continue

        # For each matching year, find the best engine match
        for yr, yid in matched_years:
            year_engines = engines_by_year.get(yid, [])
            if not year_engines:
                continue

            best_score = 0
            best_engine = None
            for eng in year_engines:
                de_components = engine_components(eng["label"])
                score = match_score(pe_components, de_components)
                if score > best_score:
                    best_score = score
                    best_engine = eng

            if best_score >= 25:
                # Good enough match — map to this specific model
                combo = (pid, make_id, model_id)
                if combo not in existing_fitment:
                    new_mappings.append({
                        "product_id": pid,
                        "make_id": make_id,
                        "model_id": model_id,
                        "match_source": f"magento_attr_engine_score_{best_score}"
                    })
                    existing_fitment.add(combo)
                    strat1_engines_matched += 1
                else:
                    strat1_skipped_existing += 1
            else:
                strat1_no_match += 1

    print(f"  Products with make/model/engine attrs: {strat1_matched}")
    print(f"  Engine-matched: {strat1_engines_matched}")
    print(f"  Already existed: {strat1_skipped_existing}")
    print(f"  No engine match: {strat1_no_match}")
    print(f"  New mappings from Strategy 1: {len(new_mappings)}")
    print()

    # ── Strategy 2: Parse product names for year ranges ──
    print("═══ Strategy 2: Product Name Year Range Parsing ═══")

    strat2_before = len(new_mappings)

    for p in products_source:
        pid = product_id_map.get(p["sku"])
        if not pid:
            continue

        name = p["name"]
        year_range = parse_year_range_from_name(name)
        if not year_range:
            continue

        # Get this product's current make+model mappings
        cats = p.get("categories", [])
        for cat in cats:
            parts = cat.split("/")
            if len(parts) < 4 or parts[0] != "Search By Vehicle" or parts[1] != "Makes":
                continue

            cat_make = parts[2].upper()
            make_id = makes_by_name.get(cat_make)
            if not make_id:
                continue

            cat_model = parts[3].upper()
            model_id = models_by_make_name.get((make_id, cat_model))
            if not model_id:
                continue

            # We have make+model+year_range. Create mapping if not exists
            combo = (pid, make_id, model_id)
            if combo not in existing_fitment:
                new_mappings.append({
                    "product_id": pid,
                    "make_id": make_id,
                    "model_id": model_id,
                    "match_source": f"name_year_range_{year_range[0]}_{year_range[1]}"
                })
                existing_fitment.add(combo)

    strat2_new = len(new_mappings) - strat2_before
    print(f"  New mappings from Strategy 2: {strat2_new}")
    print()

    # ── Strategy 3: Make-only → upgrade to Make+Model via engine spec matching ──
    print("═══ Strategy 3: Upgrade Make-Only to Make+Model ═══")

    # Products currently mapped at make-only level
    make_only = paginate_all(sb, "product_fitment",
                             "product_id, make_id, model_id")
    make_only_products = defaultdict(set)
    for r in make_only:
        if r["model_id"] is None:
            make_only_products[r["product_id"]].add(r["make_id"])

    strat3_before = len(new_mappings)
    strat3_upgraded = 0

    for p in products_source:
        pid = product_id_map.get(p["sku"])
        if not pid or pid not in make_only_products:
            continue

        # Try to find model from name
        name_upper = p["name"].upper()
        raw = p.get("raw_source_fields", {})
        addl = raw.get("additional_attributes", "") if isinstance(raw, dict) else ""
        attrs = parse_magento_attrs(addl)

        attr_model = (attrs.get("model") or "").strip().upper()

        for make_id in make_only_products[pid]:
            # Try attribute model first
            if attr_model:
                model_id = models_by_make_name.get((make_id, attr_model))
                if model_id:
                    combo = (pid, make_id, model_id)
                    if combo not in existing_fitment:
                        new_mappings.append({
                            "product_id": pid,
                            "make_id": make_id,
                            "model_id": model_id,
                            "match_source": "upgraded_from_make_only_via_attr"
                        })
                        existing_fitment.add(combo)
                        strat3_upgraded += 1
                    continue

            # Try matching model name in product name
            make_name = makes.get(make_id, "")
            for (mid, mname), model_id in models_by_make_name.items():
                if mid != make_id:
                    continue
                # Only match if model name is ≥3 chars and appears as a word
                if len(mname) >= 3 and re.search(r'\b' + re.escape(mname) + r'\b', name_upper):
                    combo = (pid, make_id, model_id)
                    if combo not in existing_fitment:
                        new_mappings.append({
                            "product_id": pid,
                            "make_id": make_id,
                            "model_id": model_id,
                            "match_source": "upgraded_from_make_only_via_name"
                        })
                        existing_fitment.add(combo)
                        strat3_upgraded += 1

    strat3_new = len(new_mappings) - strat3_before
    print(f"  Make-only products analyzed: {len(make_only_products)}")
    print(f"  Upgraded to Make+Model: {strat3_upgraded}")
    print(f"  New mappings from Strategy 3: {strat3_new}")
    print()

    # ── Summary & Write ──
    total_new = len(new_mappings)
    print(f"═══ TOTAL NEW MAPPINGS: {total_new} ═══")

    if DRY_RUN:
        print("  DRY RUN — no changes written to database.")
        print("  Remove --dry-run flag to write mappings.")
    elif total_new > 0:
        print(f"  Writing {total_new} new mappings to product_fitment...")
        # Dedup before writing
        seen = set()
        unique = []
        for m in new_mappings:
            key = (m["product_id"], m["make_id"], m["model_id"])
            if key not in seen:
                seen.add(key)
                unique.append(m)

        # Batch insert
        batch_size = 200
        written = 0
        for i in range(0, len(unique), batch_size):
            chunk = unique[i:i + batch_size]
            try:
                sb.table("product_fitment").upsert(
                    chunk, on_conflict="product_id,make_id,model_id"
                ).execute()
                written += len(chunk)
                if (i // batch_size) % 5 == 0:
                    print(f"    batch {i // batch_size + 1} ({written}/{len(unique)})")
            except Exception as e:
                print(f"    ⚠ Batch error: {e}")
                for row in chunk:
                    try:
                        sb.table("product_fitment").upsert(
                            row, on_conflict="product_id,make_id,model_id"
                        ).execute()
                        written += 1
                    except Exception as e2:
                        print(f"    ✗ Skipped: {e2}")

        print(f"  ✓ {written} mappings written")

    # Final counts
    print()
    print("═══ Final Database State ═══")
    for table in ["products", "product_fitment"]:
        r = sb.table(table).select("id", count="exact").limit(0).execute()
        print(f"  {table:20s} {r.count:>6,} rows")

    # Mapping quality breakdown
    fitment_data = paginate_all(sb, "product_fitment", "match_source")
    source_counts = Counter(r["match_source"] for r in fitment_data)
    print()
    print("  Mapping sources:")
    for src, cnt in source_counts.most_common():
        print(f"    {src:45s} {cnt:>5,}")


if __name__ == "__main__":
    main()
