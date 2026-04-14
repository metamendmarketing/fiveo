#!/usr/bin/env python3
"""
Layer 6: Advanced Spec Sync
Extracts Connector Type, Fuel Types, and Body Style from product text and reference data.
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

MAPS = {
    'connector': {
        'uscar': 'USCAR / EV6',
        'minitimer': 'EV1 / Jetronic',
        'jetronic': 'EV1 / Jetronic',
        'ev1': 'EV1 / Jetronic',
        'ev6': 'USCAR / EV6',
        'sumitomo': 'Denso / Sumitomo',
        'denso': 'Denso / Sumitomo',
        'keihin': 'Honda / Keihin',
        'obd1': 'OBD1 / Minitimer',
        'obd2': 'OBD2 / USCAR'
    },
    'body_style': {
        'ev14': 'EV14',
        'ev6': 'EV6',
        'ev1': 'EV1',
        'pico': 'Pico / Short',
        'compact': 'Compact',
        'standard': 'Standard',
        'side feed': 'Side-Feed',
        'top feed': 'Top-Feed'
    }
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
    print("Loading data...")
    products = paginate('products', 'id, name, description, connector_type, fuel_types, notes')
    
    updates = []
    
    conn_pattern = re.compile(r'\b(uscar|minitimer|jetronic|ev1|ev6|sumitomo|denso|keihin|obd1|obd2)\b', re.I)
    fuel_pattern = re.compile(r'\b(e85|flex\s?fuel|methanol|alcohol)\b', re.I)
    style_pattern = re.compile(r'\b(ev14|ev6|ev1|pico|compact|standard|side\s?feed|top\s?feed)\b', re.I)

    for p in products:
        text = f"{p['name']} {p.get('description') or ''} {' '.join(p.get('notes') or [])}".lower()
        
        update = {}
        changed = False
        
        # 1. Connector Type (if missing)
        if not p.get('connector_type'):
            match = conn_pattern.search(text)
            if match:
                kw = match.group(1).lower()
                update['connector_type'] = MAPS['connector'].get(kw)
                changed = True
        
        # 2. Fuel Types
        current_fuels = p.get('fuel_types') or []
        matches = fuel_pattern.findall(text)
        if matches:
            found_fuels = set()
            for m in matches:
                m = m.lower()
                if 'e85' in m or 'flex' in m: found_fuels.add('E85')
                if 'methanol' in m or 'alcohol' in m: found_fuels.add('Methanol/Alcohol')
            
            # Combine
            new_fuels = list(set(current_fuels) | found_fuels)
            if len(new_fuels) > len(current_fuels):
                update['fuel_types'] = new_fuels
                changed = True

        if changed:
            update['id'] = p['id']
            updates.append(update)

    print(f"Total updates calculated: {len(updates)}")

    if updates:
        print("Sending updates to Supabase...")
        count = 0
        for u in updates:
            pid = u.pop('id')
            sb.table('products').update(u).eq('id', pid).execute()
            count += 1
            if count % 50 == 0:
                print(f"  Processed {count} / {len(updates)}")

    print("Layer 6 Sync Complete.")

if __name__ == "__main__":
    main()
