#!/usr/bin/env python3
"""
Layer 4 Sync Pipeline (V3)
Matches products to harvested data and performs updates using .update() to avoid SKU constraints.
"""

import json
import os
import re
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def main():
    print("Loading local data...")
    with open(ROOT / "data" / "pn_master_list.json") as f:
        pn_master = json.load(f)
    with open(ROOT / "data" / "harvested_reference_table.json") as f:
        harvester_data = json.load(f)
    
    # Create lookup map: PN_CLEAN -> Data
    ref_map = {}
    for entry in harvester_data:
        pn = entry['pn_clean']
        if pn not in ref_map or entry['source'] == 'injectorrx':
            ref_map[pn] = entry

    print("Loading products from Supabase...")
    r = sb.table('products').select('id, flow_rate_cc, impedance').execute()
    prod_state = {p['id']: p for p in r.data}
    
    updates = []
    
    print("Calculating updates...")
    for item in pn_master:
        pn = item['part_number']
        ids = item['product_ids']
        
        if pn in ref_map:
            found_ref = ref_map[pn]
            for pid in ids:
                p = prod_state.get(pid)
                if not p: continue
                
                update_payload = {}
                changed = False
                
                if p.get('flow_rate_cc') is None and found_ref.get('cc_min'):
                    update_payload['flow_rate_cc'] = found_ref['cc_min']
                    changed = True
                
                if p.get('impedance') is None and found_ref.get('impedance'):
                    update_payload['impedance'] = found_ref['impedance']
                    changed = True
                
                if changed:
                    updates.append((pid, update_payload))

    print(f"Total Updates Prepared: {len(updates)}")

    if updates:
        # Deduplicate
        unique_updates = {}
        for pid, payload in updates:
            if pid not in unique_updates:
                unique_updates[pid] = payload
            else:
                unique_updates[pid].update(payload)

        print(f"Final Deduplicated Updates: {len(unique_updates)}")

        # Perform individual updates to be safe
        print("Sending updates to Supabase...")
        count = 0
        for pid, payload in unique_updates.items():
            sb.table('products').update(payload).eq('id', pid).execute()
            count += 1
            if count % 10 == 0:
                print(f"  Processed {count} / {len(unique_updates)}")

    print("Sync complete.")

if __name__ == "__main__":
    main()
