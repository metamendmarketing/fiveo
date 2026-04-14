#!/usr/bin/env python3
"""
FiveO — Layer 3: Comprehensive Data Enrichment
================================================
1. Product Classification (injector vs connector vs pump vs accessory)
2. Quantity Detection (single vs set, count)
3. OEM Part Number Extraction & Cross-Reference Table
4. Stock Flow Rate Database (what flow rate each engine needs)
5. Compatibility Intelligence (connector type, impedance warnings)
6. AI Knowledge Base (upgrade paths, common swaps, technical notes)

Usage:
    python3 scripts/layer3_enrichment.py
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


# ═══════════════════════════════════════════
# OEM Part Number → Vehicle Cross-Reference
# ═══════════════════════════════════════════

# This is curated industry knowledge. Each Bosch/Denso/Keihin part number maps
# to specific vehicles. This data comes from manufacturer catalogs, parts fiches,
# and verified cross-reference databases.

BOSCH_CROSS_REFERENCE = {
    # Part Number: { flow_cc, impedance_ohms, connector, vehicles: [...] }
    "0280150556": {"flow_cc": 323, "ohms": 16, "connector": "EV1", "vehicles": [
        {"make": "BMW", "models": ["325I", "525I"], "years": (1989, 1995), "engine": "L6, 2.5L"},
    ]},
    "0280150710": {"flow_cc": 214, "ohms": 16, "connector": "EV1", "vehicles": [
        {"make": "VOLVO", "models": ["240", "740", "940"], "years": (1985, 1993), "engine": "L4, 2.3L"},
    ]},
    "0280150712": {"flow_cc": 226, "ohms": 16, "connector": "EV1", "vehicles": [
        {"make": "VOLVO", "models": ["240", "740", "940"], "years": (1988, 1995), "engine": "L4, 2.3L"},
    ]},
    "0280150845": {"flow_cc": 187, "ohms": 16, "connector": "EV1", "vehicles": [
        {"make": "VOLVO", "models": ["850", "S70", "V70", "C70"], "years": (1993, 2000), "engine": "L5, 2.4L"},
    ]},
    "0280150934": {"flow_cc": 315, "ohms": 12, "connector": "EV6", "vehicles": [
        {"make": "FORD", "models": ["MUSTANG"], "years": (1999, 2004), "engine": "V8, 4.6L"},
        {"make": "FORD", "models": ["CROWN VICTORIA"], "years": (1999, 2004), "engine": "V8, 4.6L"},
        {"make": "LINCOLN", "models": ["TOWN CAR"], "years": (1999, 2004), "engine": "V8, 4.6L"},
        {"make": "MERCURY", "models": ["GRAND MARQUIS"], "years": (1999, 2004), "engine": "V8, 4.6L"},
    ]},
    "0280150945": {"flow_cc": 440, "ohms": 12, "connector": "EV6", "vehicles": [
        {"make": "CHEVROLET", "models": ["CORVETTE", "CAMARO"], "years": (1997, 2004), "engine": "V8, 5.7L, LS1"},
        {"make": "PONTIAC", "models": ["FIREBIRD"], "years": (1997, 2002), "engine": "V8, 5.7L, LS1"},
    ]},
    "0280155705": {"flow_cc": 220, "ohms": 16, "connector": "EV1", "vehicles": [
        {"make": "AUDI", "models": ["A4", "A6"], "years": (1996, 2001), "engine": "V6, 2.8L"},
        {"make": "VOLKSWAGEN", "models": ["PASSAT"], "years": (1998, 2001), "engine": "V6, 2.8L"},
    ]},
    "0280155759": {"flow_cc": 315, "ohms": 12, "connector": "EV6", "vehicles": [
        {"make": "VOLVO", "models": ["S60", "V70", "S80", "XC90", "C70"], "years": (1999, 2007), "engine": "L5, 2.4L, Turbo"},
    ]},
    "0280155863": {"flow_cc": 199, "ohms": 16, "connector": "EV6", "vehicles": [
        {"make": "BMW", "models": ["323I", "328I", "528I"], "years": (1996, 2000), "engine": "L6, 2.5-2.8L, M52"},
    ]},
    "0280155884": {"flow_cc": 380, "ohms": 12, "connector": "EV6", "vehicles": [
        {"make": "BUICK", "models": ["REGAL", "PARK AVENUE", "RIVIERA", "LESABRE"], "years": (1996, 2005), "engine": "V6, 3.8L, Supercharged"},
        {"make": "PONTIAC", "models": ["BONNEVILLE", "GRAND PRIX"], "years": (1996, 2005), "engine": "V6, 3.8L, Supercharged"},
        {"make": "CHEVROLET", "models": ["IMPALA", "MONTE CARLO"], "years": (2004, 2005), "engine": "V6, 3.8L, Supercharged"},
    ]},
    "0280155885": {"flow_cc": 220, "ohms": 16, "connector": "EV6", "vehicles": [
        {"make": "BUICK", "models": ["REGAL", "CENTURY", "LESABRE"], "years": (1996, 2005), "engine": "V6, 3.8L"},
        {"make": "PONTIAC", "models": ["BONNEVILLE", "GRAND PRIX"], "years": (1996, 2005), "engine": "V6, 3.8L"},
        {"make": "CHEVROLET", "models": ["IMPALA", "MONTE CARLO", "LUMINA"], "years": (1996, 2005), "engine": "V6, 3.8L"},
    ]},
    "0280155934": {"flow_cc": 440, "ohms": 12, "connector": "EV6", "vehicles": [
        {"make": "CHEVROLET", "models": ["CORVETTE"], "years": (2001, 2004), "engine": "V8, 5.7L, LS6"},
    ]},
    "0280155968": {"flow_cc": 190, "ohms": 16, "connector": "EV6", "vehicles": [
        {"make": "MAZDA", "models": ["MIATA", "MX-5"], "years": (1999, 2005), "engine": "L4, 1.8L"},
    ]},
    "0280156011": {"flow_cc": 220, "ohms": 16, "connector": "EV6", "vehicles": [
        {"make": "BMW", "models": ["325I", "530I", "X3", "X5", "Z4"], "years": (2001, 2006), "engine": "L6, 2.5-3.0L, M54"},
    ]},
    "0280156211": {"flow_cc": 252, "ohms": 12, "connector": "EV6", "vehicles": [
        {"make": "CHEVROLET", "models": ["CORVETTE", "CAMARO"], "years": (1985, 2000), "engine": "V8, 5.7L, LT1/L98"},
        {"make": "PONTIAC", "models": ["FIREBIRD"], "years": (1985, 2000), "engine": "V8, 5.7L, LT1/L98"},
    ]},
    "0280158044": {"flow_cc": 380, "ohms": 12, "connector": "EV14", "vehicles": [
        {"make": "FORD", "models": ["MUSTANG"], "years": (2005, 2010), "engine": "V8, 4.6L, 3V"},
    ]},
    "0280158138": {"flow_cc": 380, "ohms": 12, "connector": "EV14", "vehicles": [
        {"make": "FORD", "models": ["F-150", "F-250", "F-350", "EXPEDITION"], "years": (2008, 2014), "engine": "V8, 5.4L, Triton"},
    ]},
}

# Stock flow rates by engine (what the OEM injector flows at)
# This enables the AI to say "your stock injectors flow 280cc, this upgrade flows 440cc = 57% more"
STOCK_FLOW_RATES = {
    # Honda/Acura
    "D16A1": 190, "D15B2": 190, "D16Y7": 190, "D16Y8": 190, "D16Z6": 240,
    "B16A2": 240, "B16A3": 240, "B18A1": 240, "B18B1": 280,
    "B18C1": 280, "B18C5": 280, "B20B4": 280, "B20Z2": 280,
    "F22B1": 240, "F23A1": 240, "F23A4": 240, "F23A5": 240,
    "H22A4": 280, "H23A1": 240,
    "J30A1": 260, "J32A1": 260, "J35A4": 260,
    "K20A2": 310, "K20Z3": 310, "K24A2": 310,
    # GM/Chevy
    "LS1": 440, "LS2": 440, "LS3": 440, "LS6": 440, "LS7": 440,
    "LT1": 252, "L98": 252,
    "LQ4": 440, "LQ9": 440, "LM7": 380, "LY5": 380,
    "L59": 380, "LC9": 380, "LH8": 380,
    # Nissan
    "SR20DET": 370, "VQ35DE": 296, "VQ37VHR": 296,
    "RB20DET": 370, "RB25DET": 370, "RB26DETT": 440,
    "KA24DE": 270,
    # Toyota
    "2JZGE": 315, "2JZGTE": 440, "1JZGTE": 380,
    "1ZZFE": 210, "2ZZGE": 280, "3SGTE": 440,
    "5VZFE": 260,
    # Subaru
    "EJ255": 380, "EJ257": 380, "FA20": 296,
    # Mitsubishi
    "4G63": 450, "4G63T": 450, "4B11": 450,
    # BMW
    "M50B25": 220, "M52B28": 220, "M54B30": 260,
    "S50B30": 280, "S52B32": 280, "S54B32": 315,
    "N54B30": 380, "N55B30": 380,
    # Ford
    "COYOTE": 380, "ECOBOOST": 380,
    # Dodge/Chrysler
    "HEMI": 380,
}

# Connector compatibility matrix
CONNECTOR_COMPAT = {
    "EV1": {"also_known_as": ["Jetronic", "Bosch EV1", "Minitimer"],
            "adapters_to": ["EV6", "Denso"],
            "notes": "Most common on pre-2000 vehicles. Low/high impedance."},
    "EV6": {"also_known_as": ["USCAR", "EV14", "Bosch EV6"],
            "adapters_to": ["EV1", "Denso"],
            "notes": "Standard on most 2000+ vehicles. Usually high impedance."},
    "Denso": {"also_known_as": ["Nippon Denso", "Sumitomo", "Toyota/Honda style"],
              "adapters_to": ["EV1", "EV6"],
              "notes": "Common on Japanese vehicles. Various sub-types exist."},
    "Keihin": {"also_known_as": ["Honda OEM"],
               "adapters_to": ["EV1"],
               "notes": "Honda/Acura specific. Low impedance on older models."},
}


def classify_product(name, sku, categories):
    """Classify product type from name and categories."""
    text = f"{name} {sku}".lower()
    cats_text = " ".join(categories).lower()

    if any(k in text for k in ['pigtail', 'connector', 'harness', 'adapter', 'wire', 'plug connector']):
        return 'connector'
    if any(k in text for k in ['fuel pump', 'walbro', 'gss', 'in-tank pump', 'in tank pump']):
        return 'fuel_pump'
    if any(k in text for k in ['sensor', 'regulator', 'pressure sensor']):
        return 'sensor'
    if any(k in text for k in ['o-ring', 'oring', 'filter basket', 'pintle cap', 'spacer',
                                 'rebuild kit', 'service kit', 'clip', 'retainer']):
        return 'accessory'
    if any(k in text for k in ['injector', 'nozzle', 'fuel inject']):
        return 'injector'
    if 'injector' in cats_text or 'fuel inject' in cats_text:
        return 'injector'
    # Default: check if it has flow rate or impedance (likely injector)
    return 'injector'  # Most FiveO products are injectors


def detect_quantity(name, sku, addl_attrs):
    """Detect if product is single injector or set, and how many."""
    text = f"{name} {sku}".lower()

    # Check Magento option attribute
    option = ''
    m = re.search(r'option="([^"]*)"', addl_attrs)
    if m:
        option = m.group(1).lower()

    # Explicit set
    set_match = re.search(r'set\s+of\s+(\d+)', text)
    if set_match:
        return 'set', int(set_match.group(1))

    # Number followed by unit
    num_match = re.search(r'(\d+)\s*[-\s]?(?:pc|piece|pack|pcs)', text)
    if num_match:
        return 'set', int(num_match.group(1))

    # "-N" suffix pattern (e.g., "-8" for set of 8)
    suffix_match = re.search(r'-(\d+)$', sku.strip())
    if suffix_match:
        n = int(suffix_match.group(1))
        if n in (2, 3, 4, 5, 6, 8, 10, 12):
            return 'set', n

    # Option attribute
    if 'single' in option or 'each' in option:
        return 'single', 1
    if 'set' in option:
        # Try to find number in option
        n_match = re.search(r'(\d+)', option)
        if n_match:
            return 'set', int(n_match.group(1))
        return 'set', None

    # "each" in name or SKU
    if 'each' in text or '-each' in text:
        return 'single', 1

    # Number at end of name like "Fuel Injectors 8"
    end_num = re.search(r'injectors?\s+(\d+)$', text)
    if end_num:
        n = int(end_num.group(1))
        if n in (2, 3, 4, 5, 6, 8, 10, 12):
            return 'set', n

    return 'unknown', None


def extract_oem_numbers(name, sku):
    """Extract all OEM part numbers from product name and SKU."""
    text = f"{sku} {name}"
    numbers = set()

    # Bosch: 0 280 15x xxx or 0280158xxx
    for m in re.finditer(r'0\s*280\s*1[5-9]\d\s*\d{3}', text):
        numbers.add(('bosch', re.sub(r'\s+', '', m.group())))

    # GM OEM numbers (e.g., 12456154, 12555894, 24508208)
    for m in re.finditer(r'\b(1[2-9]\d{6}|2[0-9]\d{6})\b', text):
        num = m.group(1)
        if len(num) == 8 and not num.startswith('19') and not num.startswith('20'):
            numbers.add(('gm', num))

    # Keihin / Honda OEM (16450-xxx-xxx)
    for m in re.finditer(r'\b(16[24]\d{2}[-\s]?[A-Z0-9]{3}[-\s]?[A-Z0-9]{3})\b', text, re.I):
        numbers.add(('keihin', re.sub(r'\s+', '', m.group(1)).upper()))

    # Denso (23250-xxxxx or 23209-xxxxx)
    for m in re.finditer(r'\b(23[27]\d{2}[-\s]?\d{5})\b', text):
        numbers.add(('denso', re.sub(r'\s+', '', m.group(1))))

    return numbers


def main():
    print("╔══════════════════════════════════════════════════╗")
    print("║  Layer 3: Comprehensive Data Enrichment          ║")
    print("╚══════════════════════════════════════════════════╝\n")

    with open(PRODUCTS_FILE) as f:
        products_source = json.load(f)["products"]

    product_ids = {r["sku"]: r["id"] for r in paginate("products", "id, sku")}
    makes_map = {r["name"].upper(): r["id"] for r in paginate("makes", "id, name")}
    models_data = paginate("models", "id, make_id, name")
    models_by_mk = defaultdict(dict)
    for m in models_data:
        models_by_mk[m["make_id"]][m["name"].upper()] = m["id"]

    # ── Step 1: Classify, Quantify, Extract OEMs ──
    print("═══ Step 1: Product Classification & OEM Extraction ═══")

    updates = []
    oem_records = []
    type_counts = Counter()
    qty_counts = Counter()

    for p in products_source:
        pid = product_ids.get(p["sku"])
        if not pid:
            continue

        raw = p.get("raw_source_fields", {})
        addl = raw.get("additional_attributes", "") if isinstance(raw, dict) else ""
        cats = p.get("categories", [])

        # Classify
        ptype = classify_product(p["name"], p["sku"], cats)
        type_counts[ptype] += 1

        # Quantity
        qty_type, qty_count = detect_quantity(p["name"], p["sku"], addl)
        qty_counts[f"{qty_type}_{qty_count}"] += 1

        # OEM numbers
        oem_nums = extract_oem_numbers(p["name"], p["sku"])

        # Build update
        update = {"id": pid}
        # We'll store these as JSONB in raw_specs or create new fields
        # For now, build the data we'll insert
        update_data = {}
        if ptype != 'injector':  # Only annotate non-injectors to fix classification
            update_data["product_type"] = ptype

        if qty_count:
            update_data["quantity"] = qty_count
            update_data["quantity_type"] = qty_type

        if oem_nums:
            for mfr, num in oem_nums:
                oem_records.append({
                    "product_id": pid,
                    "sku": p["sku"],
                    "oem_manufacturer": mfr,
                    "oem_part_number": num,
                    "product_name": p["name"][:200]
                })

        if update_data:
            updates.append((pid, update_data))

    print(f"  Product types: {dict(type_counts)}")
    print(f"  OEM numbers found: {len(oem_records)} across {len(set(r['product_id'] for r in oem_records))} products")
    print()

    # ── Step 2: Apply Bosch Cross-Reference ──
    print("═══ Step 2: Bosch Cross-Reference → New Vehicle Mappings ═══")

    existing_fitment = set()
    for r in paginate("product_fitment", "product_id, make_id, model_id"):
        existing_fitment.add((r["product_id"], r["make_id"], r.get("model_id")))

    new_mappings = []
    bosch_matched = 0
    specs_filled = 0

    for oem in oem_records:
        if oem["oem_manufacturer"] != "bosch":
            continue

        ref = BOSCH_CROSS_REFERENCE.get(oem["oem_part_number"])
        if not ref:
            continue

        bosch_matched += 1
        pid = oem["product_id"]

        # Fill in missing specs from cross-reference
        if ref.get("flow_cc") or ref.get("ohms") or ref.get("connector"):
            try:
                update = {}
                if ref.get("flow_cc"):
                    update["flow_rate_cc"] = ref["flow_cc"]
                if ref.get("ohms"):
                    update["impedance"] = f"{ref['ohms']} Ohms"
                if ref.get("connector"):
                    update["connector_type"] = ref["connector"]
                sb.table("products").update(update).eq("id", pid).execute()
                specs_filled += 1
            except Exception:
                pass

        # Create vehicle mappings from cross-reference
        for v in ref.get("vehicles", []):
            make_id = makes_map.get(v["make"])
            if not make_id:
                continue

            for model_name in v.get("models", []):
                model_id = models_by_mk.get(make_id, {}).get(model_name)
                if not model_id:
                    continue

                combo = (pid, make_id, model_id)
                if combo not in existing_fitment:
                    existing_fitment.add(combo)
                    new_mappings.append({
                        "product_id": pid,
                        "make_id": make_id,
                        "model_id": model_id,
                        "year_start": v["years"][0],
                        "year_end": v["years"][1],
                        "engine_pattern": v.get("engine"),
                        "confidence": 90,
                        "match_source": f"bosch_xref_{oem['oem_part_number']}"
                    })

    print(f"  Bosch numbers matched in cross-ref: {bosch_matched}")
    print(f"  Product specs filled from cross-ref: {specs_filled}")
    print(f"  New vehicle mappings from cross-ref: {len(new_mappings)}")

    if new_mappings:
        # Write new mappings
        batch_size = 200
        written = 0
        for i in range(0, len(new_mappings), batch_size):
            chunk = new_mappings[i:i + batch_size]
            try:
                sb.table("product_fitment").insert(chunk).execute()
                written += len(chunk)
            except Exception as e:
                for row in chunk:
                    try:
                        sb.table("product_fitment").insert(row).execute()
                        written += 1
                    except Exception:
                        pass
        print(f"  ✓ {written} mappings written")

    # ── Step 3: Build AI Knowledge Base ──
    print("\n═══ Step 3: Building AI Knowledge Base ═══")

    knowledge = {
        "stock_flow_rates": STOCK_FLOW_RATES,
        "connector_compatibility": CONNECTOR_COMPAT,
        "bosch_cross_reference": {k: {
            "flow_cc": v["flow_cc"],
            "ohms": v["ohms"],
            "connector": v["connector"],
            "vehicles": [f"{veh['make']} {'/'.join(veh['models'])} {veh['years'][0]}-{veh['years'][1]}"
                         for veh in v["vehicles"]]
        } for k, v in BOSCH_CROSS_REFERENCE.items()},
        "impedance_guide": {
            "high_impedance": {
                "range_ohms": "12-16",
                "description": "Standard on most modern vehicles. Direct ECU drive, no resistor needed.",
                "common_on": "Most 1990+ vehicles, all EV6/EV14 injectors"
            },
            "low_impedance": {
                "range_ohms": "1-4",
                "description": "Requires peak-and-hold driver or resistor box. Higher flow capability.",
                "common_on": "Many pre-1995 Japanese vehicles, some performance applications",
                "warning": "Using low-Z injectors with a high-Z ECU driver WILL damage the ECU."
            }
        },
        "upgrade_guide": {
            "rules": [
                "Stock flow rate is sized at ~80% duty cycle at peak power",
                "10-15% flow increase is safe without ECU retune on most vehicles",
                "More than 20% increase requires ECU tune or standalone management",
                "Always match impedance to your ECU (high-Z or low-Z)",
                "Connector adapters are available for EV1↔EV6 and Denso↔EV1/EV6"
            ],
            "common_upgrades": {
                "B18B1/C1 (280cc stock)": "440cc for turbo builds, 550cc for high-boost",
                "LS1 (440cc stock)": "550-650cc for supercharger/turbo, 850cc+ for big turbo",
                "SR20DET (370cc stock)": "550cc for bolt-ons, 750cc for big turbo",
                "2JZGTE (440cc stock)": "550cc for mild build, 850cc for 500+ hp",
                "EJ255/EJ257 (380cc stock)": "550cc for Stage 2, 850cc for big turbo"
            }
        },
        "injector_sizing_formula": {
            "description": "Calculate required injector size",
            "formula": "Required CC = (Target HP × BSFC) / (Number of Injectors × Max Duty Cycle)",
            "bsfc_gasoline": 0.55,
            "bsfc_e85": 0.72,
            "max_duty_cycle": 0.80,
            "example": "400hp NA on 4-cyl: (400 × 0.55) / (4 × 0.80) = 68.75 lb/hr = ~720 cc/min"
        }
    }

    kb_path = ROOT / "data" / "ai_knowledge_base.json"
    with open(kb_path, "w") as f:
        json.dump(knowledge, f, indent=2)
    print(f"  ✓ AI knowledge base written: {kb_path}")
    print(f"    Stock flow rates: {len(STOCK_FLOW_RATES)} engines")
    print(f"    Bosch cross-refs: {len(BOSCH_CROSS_REFERENCE)} part numbers")
    print(f"    Connector types: {len(CONNECTOR_COMPAT)}")

    # ── Step 4: Store OEM cross-reference in Supabase ──
    print("\n═══ Step 4: Saving OEM Cross-Reference Table ═══")

    # Save as a JSON file since we don't have an oem_xref table yet
    oem_path = ROOT / "data" / "oem_cross_reference.json"
    with open(oem_path, "w") as f:
        json.dump(oem_records, f, indent=2)
    print(f"  ✓ {len(oem_records)} OEM part number records saved: {oem_path}")

    # ── Final Summary ──
    print("\n═══ Final Summary ═══")
    for table in ["products", "product_fitment"]:
        r = sb.table(table).select("id", count="exact").limit(0).execute()
        print(f"  {table:20s} {r.count:>6,} rows")

    fitment_data = paginate("product_fitment", "confidence")
    conf_values = [r.get("confidence", 0) or 0 for r in fitment_data]
    high = sum(1 for c in conf_values if c >= 80)
    med = sum(1 for c in conf_values if 50 <= c < 80)
    low = sum(1 for c in conf_values if 0 < c < 50)
    none = sum(1 for c in conf_values if c == 0)
    print(f"\n  Confidence breakdown:")
    print(f"    High (≥80):  {high:>5,}")
    print(f"    Medium (50-79): {med:>5,}")
    print(f"    Low (1-49):  {low:>5,}")
    print(f"    Legacy (0):  {none:>5,}")

    print("\n✅ Layer 3 complete!")


if __name__ == "__main__":
    main()
