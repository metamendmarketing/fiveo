#!/usr/bin/env python3
"""
Project Injector Infinity Ingester
Ingests Motorcycle fitment, Use-case intelligence, and Engineering benchmarks.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

MOTORCYCLE_DATA = [
    {"make": "Harley-Davidson", "model": "Milwaukee-8 (All)", "years": "2017-2025", "engine": "107/114/117ci", "stock_flow": 4.38, "unit": "gm/s"},
    {"make": "Harley-Davidson", "model": "Milwaukee-8 (Gen 2)", "years": "2023.5-later", "engine": "Center Cooled", "stock_flow": 5.5, "unit": "gm/s"},
    {"make": "Harley-Davidson", "model": "Twin Cam (TBW)", "years": "2008-2016", "engine": "96/103/110ci", "stock_flow": 4.35, "unit": "gm/s"},
    {"make": "Harley-Davidson", "model": "Twin Cam (Cable)", "years": "2006-2017", "engine": "88/96/103ci", "stock_flow": 3.91, "unit": "gm/s"},
    {"make": "Yamaha", "model": "R6", "years": "2003-2007", "engine": "600cc", "stock_flow": 235, "unit": "cc/min"},
    {"make": "Yamaha", "model": "R1", "years": "2002-2003", "engine": "1000cc", "stock_flow": 245, "unit": "cc/min"},
    {"make": "Honda", "model": "CBR600RR", "years": "2003-2004", "engine": "600cc", "stock_flow": 230, "unit": "cc/min"},
    {"make": "Suzuki", "model": "GSX-R 1000", "years": "2001-2004", "engine": "1000cc", "stock_flow": 245, "unit": "cc/min"},
    {"make": "Kawasaki", "model": "ZX-6R", "years": "2003-2004", "engine": "636cc", "stock_flow": 235, "unit": "cc/min"}
]

USE_CASES = [
    {
        "use_case": "Street",
        "key_attribute": "Idle Quality & Linearity",
        "recommended_brands": ["Bosch", "Injector Dynamics"],
        "advice_snippet": "In street applications, the smallest pulse width behavior determines idle quality. A precisely matched set ensures each cylinder receives identical fuel at idle, preventing 'choppy' low-RPM response."
    },
    {
        "use_case": "Drift",
        "key_attribute": "Dynamic Response & Heat Consistency",
        "recommended_brands": ["Injector Dynamics", "Black-Ops"],
        "advice_snippet": "Drifting involves rapid throttle transitions and extreme heat soak. Injectors must have low thermal drift, meaning their flow rate doesn't change significantly as the engine bay temperatures skyrocket during a run."
    },
    {
        "use_case": "Drag",
        "key_attribute": "Peak Flow & Staged Support",
        "recommended_brands": ["Bosch", "Fuel Injector Clinic"],
        "advice_snippet": "Drag racing prioritizes maximum flow. Staged injection is common, where primary injectors handle idle/part-throttle and massive secondary injectors kick in under boost to provide the required volume for high horsepower."
    }
]

def main():
    print("Ingesting Motorcycle Fitment...")
    for m in MOTORCYCLE_DATA:
        # Normalize unit
        if m['unit'] == 'gm/s':
            m['flow_rate_cc_normalized'] = round(m['stock_flow'] * 83.265, 1)
        else:
            m['flow_rate_cc_normalized'] = m['stock_flow']
        
        # Ingest into knowledge_base as specialized entries
        entry = {
            "category": "motorcycle_fitment",
            "title": f"Stock Fitment: {m['make']} {m['model']} ({m['years']})",
            "content": f"Stock Flow Rate: {m['stock_flow']} {m['unit']} ({m.get('flow_rate_cc_normalized')} cc/min normalized).",
            "metadata": m,
            "source": "fuel_moto_witchhunter"
        }
        sb.table('knowledge_base').upsert(entry).execute()

    print("Ingesting Usage Recommendations...")
    for u in USE_CASES:
        entry = {
            "category": "usage_recommendations",
            "title": f"Usage Expert: {u['use_case']}",
            "content": u['advice_snippet'],
            "metadata": u,
            "source": "tuning_expert_synthesis"
        }
        sb.table('knowledge_base').upsert(entry).execute()

    print("Infinity Ingestion Complete.")

if __name__ == "__main__":
    main()
