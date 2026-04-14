#!/usr/bin/env python3
"""
Layer 4: Part Number Extractor
Extracts manufacturer part numbers from products table (sku, name, description, raw_specs).
"""

import json
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

PATTERNS = {
    'bosch': [
        r'0\s*280\s*1[56]\d\s*\d{3}',  # standard 0 280 15x xxx
        r'02801[56]\d{4}',             # no spaces
    ],
    'denso': [
        r'23250-?\d{5}',               # Toyota style
        r'23209-?\d{5}',               # Toyota alt style
        r'195500-?\d{4}',              # Mazda/Other style
    ],
    'delphi': [
        r'1711\d{4}',                  # GM style
        r'253\d{5}',                   # GM style
    ],
    'keihin': [
        r'16450-[A-Z0-9]{3}-[A-Z0-9]{3}', # Honda style
    ],
    'siemens_deka': [
        r'FL-?\d{4}',                  # Deka style
        r'107\d{3}',                   # Siemens Deka PN
        r'FI11\d{3}',                  # Deka II style
    ],
    'vw_audi': [
        r'06[A-Z]\s?906\s?031\s?[A-Z]{0,2}', # common VAG pattern
    ],
    'ford': [
        r'[A-Z0-9]{4}-9F593-[A-Z0-9]{1,3}', # Specific Ford fuel injector base PN
        r'[A-Z0-9]{4}-BA',                  # Specific Ford series
    ],
    'gm_short': [
         r'\b12[56]\d{5}\b',                # GM 8-digit injectors
    ]
}

def clean_pn(mfr, pn):
    if mfr == 'bosch':
        return re.sub(r'\s+', '', pn)
    if mfr == 'denso':
        return re.sub(r'[\s-]', '', pn)
    if mfr == 'delphi':
        return pn.strip()
    if mfr == 'keihin':
        return pn.replace(' ', '').upper()
    return pn.strip().upper()

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

def main():
    print("Collecting products from Supabase...")
    products = paginate("products", "id, sku, name, description, raw_specs")
    print(f"Loaded {len(products)} products.")

    found_count = 0
    pn_map = {} # pn -> list of product_ids

    for p in products:
        text = f"{p['sku']} {p['name']} {p.get('description', '')}"
        
        # Also check raw_specs
        rs = p.get('raw_specs')
        if rs:
            if isinstance(rs, dict):
                text += " " + json.dumps(rs)
            elif isinstance(rs, list):
                text += " " + " ".join(filter(None, rs))

        pns_for_prod = {}
        for mfr, pats in PATTERNS.items():
            for pat in pats:
                matches = re.findall(pat, text, re.I)
                if matches:
                    if mfr not in pns_for_prod: pns_for_prod[mfr] = set()
                    for m in matches:
                        cleaned = clean_pn(mfr, m)
                        pns_for_prod[mfr].add(cleaned)
                        
                        if (mfr, cleaned) not in pn_map: pn_map[(mfr, cleaned)] = []
                        pn_map[(mfr, cleaned)].append(p['id'])

        if pns_for_prod:
            found_count += 1

    print(f"Extraction complete.")
    print(f"Products with PNs: {found_count} / {len(products)}")
    print(f"Unique (Mfr, PN) pairs found: {len(pn_map)}")

    # Sort and structure findings
    output = []
    for (mfr, pn), ids in pn_map.items():
        output.append({
            "manufacturer": mfr,
            "part_number": pn,
            "product_ids": list(set(ids))
        })

    out_file = ROOT / "data" / "pn_master_list.json"
    os.makedirs(out_file.parent, exist_ok=True)
    with open(out_file, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"Master list saved to {out_file}")

if __name__ == "__main__":
    main()
