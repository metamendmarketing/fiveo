#!/usr/bin/env python3
"""
FiveO — Layer 2 Enrichment: Parse & Store Year/Engine Data on Products,
then build YMME-specific fitment mappings with confidence scores.

Usage:
    python3 scripts/layer2_enrich.py
"""

import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
PRODUCTS_FILE = ROOT / "data" / "normalized" / "products.enriched.json"


def paginate(table, select="*", page_size=1000):
    rows = []
    offset = 0
    while True:
        r = sb.table(table).select(select).range(offset, offset + page_size - 1).execute()
        rows.extend(r.data)
        if len(r.data) < page_size:
            break
        offset += page_size
    return rows


def parse_attrs(addl):
    attrs = {}
    if addl:
        for m in re.finditer(r'(\w+)="([^"]*)"', addl):
            attrs[m.group(1)] = m.group(2)
    return attrs


def extract_year_range(name, attr_year=None):
    """Extract best year range from product name + attribute."""
    # Range: 1996-2001
    m = re.search(r'(19[6-9]\d|20[0-2]\d)\s*[-–]\s*(19[6-9]\d|20[0-2]\d)', name)
    if m:
        s, e = int(m.group(1)), int(m.group(2))
        if 1960 <= s <= 2035 and s <= e <= s + 40:
            return s, e

    # Multiple single years
    years = [int(y) for y in re.findall(r'\b(19[6-9]\d|20[0-2]\d)\b', name)
             if 1960 <= int(y) <= 2035]

    # Add attribute year if valid
    if attr_year and attr_year != '2016' and attr_year.isdigit():
        yr = int(attr_year)
        if 1960 <= yr <= 2035:
            years.append(yr)

    if years:
        return min(years), max(years)
    return None, None


def extract_engine_info(name, attr_engine=None):
    """Extract displacement, config, engine code from name and attributes."""
    disp = None
    config = None
    engine_code = None

    # From attribute (most reliable)
    if attr_engine and attr_engine.upper() not in ('ALL', 'PLEASE SELECT', ''):
        parts = [p.strip().upper() for p in attr_engine.split(',')]
        for p in parts:
            if re.match(r'^\d+\.\d+L$', p) and not disp:
                disp = p
            elif re.match(r'^[LVHWI]\d{1,2}$', p) and not config:
                config = p
            elif (re.match(r'^[A-Z]\d{1,2}[A-Z]{0,3}\d{0,2}$', p) and len(p) >= 3
                  and not p.isdigit() and not re.match(r'^\d+CID$', p) and not engine_code):
                engine_code = p

    # From name (fill gaps)
    name_upper = name.upper()
    if not disp:
        m = re.search(r'\b(\d\.\d+)\s*[Ll]\b', name)
        if m:
            disp = m.group(1) + 'L'

    if not config:
        m = re.search(r'\b([VLH]\d{1,2})\b', name_upper)
        if m:
            config = m.group(1)

    if not engine_code:
        # Common engine code patterns
        m = re.search(r'\b([A-Z]\d{2}[A-Z]\d[A-Z]?\d?)\b', name_upper)
        if m:
            engine_code = m.group(1)

    return disp, config, engine_code


# ═══════════════════════════════════════════
# Step 1: Enrich products table
# ═══════════════════════════════════════════

def enrich_products():
    print("═══ Step 1: Enriching Products with Parsed Year/Engine Data ═══")

    with open(PRODUCTS_FILE) as f:
        products_source = json.load(f)["products"]

    product_ids = {r["sku"]: r["id"] for r in paginate("products", "id, sku")}

    updates = []
    enriched = 0

    for p in products_source:
        pid = product_ids.get(p["sku"])
        if not pid:
            continue

        raw = p.get("raw_source_fields", {})
        addl = raw.get("additional_attributes", "") if isinstance(raw, dict) else ""
        attrs = parse_attrs(addl)

        attr_year = attrs.get("year")
        attr_engine = attrs.get("engine")
        attr_make = attrs.get("make", "").strip() or None
        attr_model = attrs.get("model", "").strip() or None

        year_start, year_end = extract_year_range(p["name"], attr_year)
        disp, config, engine_code = extract_engine_info(p["name"], attr_engine)

        if any([year_start, disp, config, engine_code, attr_make, attr_model, attr_engine]):
            update = {"id": pid}
            if year_start:
                update["year_start"] = year_start
            if year_end:
                update["year_end"] = year_end
            if engine_code:
                update["parsed_engine_code"] = engine_code
            if disp:
                update["parsed_displacement"] = disp
            if config:
                update["parsed_config"] = config
            if attr_make and attr_make.upper() not in ("PLEASE SELECT", ""):
                update["magento_make"] = attr_make.upper()
            if attr_model and attr_model.upper() not in ("PLEASE SELECT", ""):
                update["magento_model"] = attr_model.upper()
            if attr_engine and attr_engine.upper() not in ("ALL", "PLEASE SELECT", ""):
                update["magento_engine"] = attr_engine

            updates.append(update)
            enriched += 1

    print(f"  Products to enrich: {enriched}")

    # Batch update
    written = 0
    batch_size = 100
    for i in range(0, len(updates), batch_size):
        chunk = updates[i:i + batch_size]
        for row in chunk:
            try:
                pid = row.pop("id")
                sb.table("products").update(row).eq("id", pid).execute()
                written += 1
            except Exception as e:
                print(f"    ⚠ Error updating product {pid}: {e}")
        if (i // batch_size) % 10 == 0:
            print(f"    {written}/{enriched} updated...")

    print(f"  ✓ {written} products enriched")
    return written


# ═══════════════════════════════════════════
# Step 2: Build YMME-specific fitment mappings
# ═══════════════════════════════════════════

def build_ymme_mappings():
    print("\n═══ Step 2: Building YMME-Specific Fitment Mappings ═══")

    # Load all reference data
    makes = {r["name"].upper(): r["id"] for r in paginate("makes", "id, name")}
    models_data = paginate("models", "id, make_id, name")
    models_by_mk = defaultdict(dict)
    for m in models_data:
        models_by_mk[m["make_id"]][m["name"].upper()] = m["id"]

    years_data = paginate("years", "id, model_id, year")
    years_by_model = defaultdict(list)
    for y in years_data:
        years_by_model[y["model_id"]].append(y)

    engines_data = paginate("engines", "id, year_id, label, config, displacement, engine_code")
    engines_by_year = defaultdict(list)
    for e in engines_data:
        engines_by_year[e["year_id"]].append(e)

    # Load enriched products
    enriched_products = paginate("products",
        "id, sku, name, year_start, year_end, parsed_engine_code, parsed_displacement, "
        "parsed_config, magento_make, magento_model, magento_engine, flow_rate_cc, impedance")

    # Load existing fitment for dedup
    existing = set()
    for r in paginate("product_fitment", "product_id, make_id, model_id, year_start, year_end, engine_pattern"):
        existing.add((
            r["product_id"], r["make_id"], r["model_id"],
            r.get("year_start"), r.get("year_end"), r.get("engine_pattern")
        ))

    new_mappings = []
    stats = {"matched": 0, "no_make": 0, "no_model": 0, "year_specific": 0,
             "engine_specific": 0, "skipped_existing": 0}

    for p in enriched_products:
        if not p.get("year_start") and not p.get("parsed_engine_code") and not p.get("magento_engine"):
            continue  # No enrichment data to work with

        # Determine make
        make_name = (p.get("magento_make") or "").upper()
        make_id = makes.get(make_name)
        if not make_id:
            stats["no_make"] += 1
            continue

        # Determine model
        model_name = (p.get("magento_model") or "").upper()
        model_id = models_by_mk.get(make_id, {}).get(model_name)
        if not model_id:
            stats["no_model"] += 1
            continue

        yr_start = p.get("year_start")
        yr_end = p.get("year_end")
        eng_code = p.get("parsed_engine_code")
        disp = p.get("parsed_displacement")
        config = p.get("parsed_config")

        # Build engine pattern string for matching
        engine_pattern_parts = []
        if config:
            engine_pattern_parts.append(config)
        if disp:
            engine_pattern_parts.append(disp)
        if eng_code:
            engine_pattern_parts.append(eng_code)
        engine_pattern = ", ".join(engine_pattern_parts) if engine_pattern_parts else None

        # Calculate confidence score
        confidence = 0
        if yr_start and yr_end:
            confidence += 30
            if yr_end - yr_start <= 5:
                confidence += 10  # Narrow year range = more specific
        if eng_code:
            confidence += 40
        if disp:
            confidence += 15
        if config:
            confidence += 5

        # Cross-validate: check if the year range actually has matching engines in our DB
        if yr_start and yr_end:
            model_years = years_by_model.get(model_id, [])
            matching_years = [y for y in model_years if yr_start <= y["year"] <= yr_end]
            if matching_years:
                confidence += 10  # Confirmed year exists in DB
                stats["year_specific"] += 1

                # Check if engine matches
                if engine_pattern:
                    for my in matching_years:
                        year_engs = engines_by_year.get(my["id"], [])
                        for eng in year_engs:
                            eng_label_upper = eng["label"].upper()
                            if eng_code and eng_code.upper() in eng_label_upper:
                                confidence += 20  # Engine code confirmed in DB
                                stats["engine_specific"] += 1
                                break
                        if confidence >= 80:
                            break

        # Create mapping
        key = (p["id"], make_id, model_id, yr_start, yr_end, engine_pattern)
        if key in existing:
            stats["skipped_existing"] += 1
            continue

        existing.add(key)
        new_mappings.append({
            "product_id": p["id"],
            "make_id": make_id,
            "model_id": model_id,
            "year_start": yr_start,
            "year_end": yr_end,
            "engine_pattern": engine_pattern,
            "confidence": min(confidence, 100),
            "match_source": "layer2_ymme_enrichment"
        })
        stats["matched"] += 1

    print(f"  Enriched products analyzed: {len(enriched_products)}")
    print(f"  New YMME mappings: {len(new_mappings)}")
    print(f"  Year-specific: {stats['year_specific']}")
    print(f"  Engine-specific: {stats['engine_specific']}")
    print(f"  No make found: {stats['no_make']}")
    print(f"  No model found: {stats['no_model']}")
    print(f"  Skipped existing: {stats['skipped_existing']}")

    # Write
    if new_mappings:
        print(f"\n  Writing {len(new_mappings)} YMME mappings...")
        written = 0
        batch_size = 200
        for i in range(0, len(new_mappings), batch_size):
            chunk = new_mappings[i:i + batch_size]
            try:
                sb.table("product_fitment").insert(chunk).execute()
                written += len(chunk)
            except Exception as e:
                # Row-by-row fallback
                for row in chunk:
                    try:
                        sb.table("product_fitment").insert(row).execute()
                        written += 1
                    except Exception as e2:
                        pass  # Skip duplicates silently
            if (i // batch_size) % 5 == 0:
                print(f"    {written}/{len(new_mappings)}...")
        print(f"  ✓ {written} YMME mappings written")

    # Confidence distribution
    if new_mappings:
        from collections import Counter
        conf_dist = Counter(m["confidence"] for m in new_mappings)
        print("\n  Confidence distribution:")
        for conf in sorted(conf_dist.keys(), reverse=True):
            bar = "█" * (conf_dist[conf] // 5)
            print(f"    {conf:3d}: {conf_dist[conf]:4d} {bar}")

    return len(new_mappings)


# ═══════════════════════════════════════════
# Step 3: Summary
# ═══════════════════════════════════════════

def final_summary():
    print("\n═══════════════════════════════════════════")
    print("           FINAL DATABASE SUMMARY")
    print("═══════════════════════════════════════════")

    for table in ["makes", "models", "years", "engines", "products", "product_fitment"]:
        r = sb.table(table).select("id", count="exact").limit(0).execute()
        print(f"  {table:20s} {r.count:>6,} rows")

    # Product data quality
    print("\n  Product enrichment coverage:")
    total = sb.table("products").select("id", count="exact").limit(0).execute().count

    for col in ["year_start", "parsed_displacement", "parsed_engine_code", "parsed_config",
                "magento_make", "magento_model", "magento_engine",
                "flow_rate_cc", "impedance", "connector_type"]:
        r = sb.table("products").select("id", count="exact").not_.is_(col, "null").limit(0).execute()
        pct = 100 * r.count // total
        bar = "█" * (pct // 2)
        print(f"    {col:25s} {r.count:>5,} ({pct:2d}%) {bar}")

    # Fitment quality
    print("\n  Fitment mapping quality:")
    total_fit = sb.table("product_fitment").select("id", count="exact").limit(0).execute().count

    # With year specificity
    r = sb.table("product_fitment").select("id", count="exact").not_.is_("year_start", "null").limit(0).execute()
    print(f"    With year range:    {r.count:>5,} / {total_fit:,}")
    r = sb.table("product_fitment").select("id", count="exact").not_.is_("engine_pattern", "null").limit(0).execute()
    print(f"    With engine pattern:{r.count:>5,} / {total_fit:,}")

    # Confidence breakdown
    for conf_threshold in [80, 50, 25]:
        r = sb.table("product_fitment").select("id", count="exact").gte("confidence", conf_threshold).limit(0).execute()
        print(f"    Confidence ≥ {conf_threshold}:     {r.count:>5,}")


if __name__ == "__main__":
    print("╔══════════════════════════════════════════════════╗")
    print("║  Layer 2 Enrichment: YMME-Specific Mappings      ║")
    print("╚══════════════════════════════════════════════════╝\n")

    enrich_products()
    build_ymme_mappings()
    final_summary()
    print("\n✅ Done!")
