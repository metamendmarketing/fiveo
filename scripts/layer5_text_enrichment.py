#!/usr/bin/env python3
"""
Layer 5: Text Extraction & Classification Cleanup
1. Extracts flow rates from name/description.
2. Re-classifies non-injector items to improve accuracy metrics.
"""

import os
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Keywords for re-classification
NON_INJECTOR_KEYWORDS = {
    'connector': ['pigtail', 'connector', 'adapter', 'harness', 'plug', 'clip', 'ev1 to', 'ev6 to'],
    'accessory': ['o-ring', 'seal', 'filter', 'spacer', 'hardware', 'service kit', 'rebuild kit', 'cap', 'pintle'],
    'pump': ['fuel pump', 'aeromotive', 'walbro', 'deatschwerks pump'],
    'fuel_rail': ['fuel rail', 'rail kit']
}

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
    print("Loading products...")
    products = paginate('products', 'id, name, description, sku, injector_type, flow_rate_cc')
    print(f"Total Products: {len(products)}")

    updates = []
    reclassified = 0
    flow_found = 0

    cc_pattern = re.compile(r'(\d{2,4})\s?cc', re.I)
    lb_pattern = re.compile(r'(\d{1,3})\s?lb', re.I)

    for p in products:
        payload = {}
        changed = False
        
        name = p['name'].lower()
        desc = (p.get('description') or '').lower()
        text = f"{name} {desc}"

        # 1. Re-classification if 'unclassified' or 'oem_injector'
        if p.get('injector_type') in ['unclassified', 'oem_injector', None]:
            for new_type, keywords in NON_INJECTOR_KEYWORDS.items():
                if any(k in name for k in keywords):
                    payload['injector_type'] = new_type
                    changed = True
                    reclassified += 1
                    break

        # 2. Flow Rate Extraction (only if missing)
        if p.get('flow_rate_cc') is None:
            # Check CC
            cc_match = cc_pattern.search(text)
            if cc_match:
                val = int(cc_match.group(1))
                # Heuristic Filter: CC should be 100-2500 and not common vehicle years or displacements
                if 100 <= val <= 2500 and val not in range(1980, 2026):
                    payload['flow_rate_cc'] = val
                    changed = True
                    flow_found += 1
            
            # Check Lb/hr if CC not found
            if not changed:
                lb_match = lb_pattern.search(text)
                if lb_match:
                    val_lb = float(lb_match.group(1))
                    if 10 <= val_lb <= 250:
                        payload['flow_rate_cc'] = round(val_lb * 10.5, 1)
                        changed = True
                        flow_found += 1

        if changed:
            payload['id'] = p['id']
            updates.append(payload)

    print(f"\nResults:")
    print(f"  Total re-classified as non-injectors: {reclassified}")
    print(f"  New flow rates extracted: {flow_found}")
    print(f"  Total product updates: {len(updates)}")

    if updates:
        print("\nApplying updates to Supabase...")
        for i in range(0, len(updates), 100):
            batch = updates[i:i+100]
            # Batch update using ID as key
            for item in batch:
                pid = item.pop('id')
                sb.table('products').update(item).eq('id', pid).execute()
            print(f"  Processed {i + len(batch)} / {len(updates)}")

    print("\nLayer 5 Complete.")

if __name__ == "__main__":
    main()
