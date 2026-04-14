#!/usr/bin/env python3
"""
Brand-Specific Stage Translator Ingester
Provides mapping between manufacturer-specific build stages (like Harley Screamin' Eagle) 
and actual fuel requirements.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

BRAND_STAGES = [
    {
        "category": "brand_stage_mapping",
        "title": "Harley-Davidson Screamin' Eagle Stage 1",
        "content": "Intake & Exhaust only. Stock injectors (4.38 gm/s / 365cc) are 100% sufficient. No upgrade required unless planning for Stage 4.",
        "metadata": {"make": "Harley-Davidson", "brand_stage": 1, "req_flow_gm_s": 4.38, "fiveo_recommendation": "Stock / Stage 1"}
    },
    {
        "category": "brand_stage_mapping",
        "title": "Harley-Davidson Screamin' Eagle Stage 2",
        "content": "Camshaft upgrade. Stock injectors are typically sufficient but will reach higher duty cycles. upgrading to 5.3/5.5 gm/s provides headroom for the increased air velocity.",
        "metadata": {"make": "Harley-Davidson", "brand_stage": 2, "req_flow_gm_s": 5.5, "fiveo_recommendation": "Stage 2 (5.5 gm/s)"}
    },
    {
        "category": "brand_stage_mapping",
        "title": "Harley-Davidson Screamin' Eagle Stage 3",
        "content": "Big Bore / Displacement increase. Requires higher fuel volume. FiveO recommends the 5.5 gm/s or 6.2 gm/s High-Flow sets depending on the displacement (114ci to 128ci).",
        "metadata": {"make": "Harley-Davidson", "brand_stage": 3, "req_flow_gm_s": 6.2, "fiveo_recommendation": "Stage 2 or 3"}
    },
    {
        "category": "brand_stage_mapping",
        "title": "Harley-Davidson Screamin' Eagle Stage 4",
        "content": "Ported Heads & Throttle Body. Mandatory injector upgrade. 5.5 gm/s is the H-D standard, but FiveO 6.2 gm/s ensures safety at top-end RPM.",
        "metadata": {"make": "Harley-Davidson", "brand_stage": 4, "req_flow_gm_s": 6.2, "fiveo_recommendation": "Stage 3"}
    }
]

def main():
    print(f"Ingesting {len(BRAND_STAGES)} Brand Stage Translations...")
    for s in BRAND_STAGES:
        sb.table('knowledge_base').upsert(s).execute()
        print(f"  Ingested: {s['title']}")
    print("Stage Translation Ingestion Complete.")

if __name__ == "__main__":
    main()
