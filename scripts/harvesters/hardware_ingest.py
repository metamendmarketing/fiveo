#!/usr/bin/env python3
"""
Hardware Intelligence Ingester
Populates the hardware_mappings table with transition paths and Oracle advice.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# Transition Data with Oracle Advice (Pros/Cons)
# Harness -> Injector logic
MAPPINGS = [
    {
        "harness_type": "Jetronic (EV1)",
        "injector_type": "USCAR (EV6)",
        "adapter_style": "Wireless",
        "product_sku": "EV1F/EV6M WL",
        "oracle_advice": "Wireless adapters are the 'Gold Standard' for aesthetics. They offer the cleanest engine bay look with no extra wiring to manage. Best for show cars and tight spaces."
    },
    {
        "harness_type": "Jetronic (EV1)",
        "injector_type": "USCAR (EV6)",
        "adapter_style": "Wired",
        "product_sku": "EV1F/EV6M W",
        "oracle_advice": "Wired pigtails provide superior flexibility. If your factory harness is tight or you have aftermarket fuel rails, the extra 2 inches of wire ensures there is no stress on the connector. Recommended for race builds."
    },
    {
        "harness_type": "USCAR (EV6)",
        "injector_type": "Jetronic (EV1)",
        "adapter_style": "Wired",
        "product_sku": "EV6F/EV1M",
        "oracle_advice": "Standard transition pigtail. Reliable and durable for high-heat environments."
    },
    {
        "harness_type": "Denso / Sumitomo",
        "injector_type": "USCAR (EV6)",
        "adapter_style": "Wireless",
        "product_sku": "EV14/Sumitomo WL",
        "oracle_advice": "Converts your import harness to modern EV14 injectors with a compact, plug-and-play profile."
    },
    {
        "harness_type": "Denso / Sumitomo",
        "injector_type": "Jetronic (EV1)",
        "adapter_style": "Wired",
        "product_sku": "Adapters DENF/EV1M",
        "oracle_advice": "Provides the 2-inch 'swing' room needed for bulky EV1 injectors on tight Japanese import manifolds."
    }
]

def main():
    print(f"Ingesting {len(MAPPINGS)} Hardware Intelligence scenarios...")
    for m in MAPPINGS:
        sb.table('hardware_mappings').upsert(m).execute()
        print(f"  Ingested transition: {m['harness_type']} -> {m['injector_type']} ({m['adapter_style']})")
    print("Hardware Ingestion Complete.")

if __name__ == "__main__":
    main()
