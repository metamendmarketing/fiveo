#!/usr/bin/env python3
"""
Injector Oracle Ingester
Populates the knowledge_base table with technical data sheets, FAQs, and educational articles.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def main():
    # 1. Prepare Content
    content_list = [
        {
            "category": "tuning_data",
            "title": "Black-Ops 1000cc (95 lb/hr) - Technical Data Sheet",
            "source": "fiveo_technical_manual",
            "tags": ["Black-Ops", "1000cc", "Dead Time", "Latency", "Tuning"],
            "metadata": {"sku_pattern": "M114U1000X", "flow_rate": "1000cc"},
            "content": """
### Black-Ops 1000cc Technical Data
**Nominal Flow Rate:** 1000cc/min (95 lb/hr) at 3.0 BAR (43.5 PSI).
**Coil Resistance:** 12.5 Ohms (High Impedance/Saturated).

#### Dead Time (Latency) Table (ms)
| Voltage (V) | 3.0 BAR | 4.1 BAR | 4.8 BAR | 5.5 BAR | 6.2 BAR | 6.9 BAR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 6.0V | 4.2273 | 4.7956 | 5.0843 | 5.2438 | 5.3963 | 5.5501 |
| 8.0V | 1.9960 | 2.3890 | 2.5789 | 2.7206 | 2.8720 | 3.0027 |
| 10.0V | 1.4285 | 1.5887 | 1.7123 | 1.8634 | 2.0145 | 2.1655 |
| 12.0V | 1.0744 | 1.1946 | 1.2797 | 1.3782 | 1.4768 | 1.5753 |
| 14.0V | 0.8362 | 0.9042 | 0.9681 | 1.0556 | 1.1431 | 1.2306 |
| 16.0V | 0.6558 | 0.7099 | 0.7601 | 0.8291 | 0.8981 | 0.9671 |
| 18.0V | 0.5401 | 0.5843 | 0.6254 | 0.6819 | 0.7384 | 0.7949 |
"""
        },
        {
            "category": "tuning_data",
            "title": "Black-Ops 1600cc (152 lb/hr) - Technical Data Sheet",
            "source": "fiveo_technical_manual",
            "tags": ["Black-Ops", "1600cc", "Dead Time", "Latency", "Tuning"],
            "metadata": {"sku_pattern": "4670U1600", "flow_rate": "1600cc"},
            "content": """
### Black-Ops 1600cc Technical Data
**Nominal Flow Rate:** 1600cc/min (152 lb/hr) at 3.0 BAR (43.5 PSI).
**Coil Resistance:** 8.5–9.5 Ohms (High Impedance/Saturated).

#### Dead Time (Latency) Table (ms)
| Voltage (V) | 3.0 BAR | 4.1 BAR | 4.8 BAR | 5.5 BAR | 6.2 BAR | 6.9 BAR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 6.0V | 3.00 | 3.60 | 4.10 | 4.65 | 5.25 | 5.95 |
| 8.0V | 2.15 | 2.50 | 2.75 | 3.05 | 3.45 | 3.90 |
| 10.0V | 1.55 | 1.78 | 1.95 | 2.15 | 2.45 | 2.75 |
| 12.0V | 1.18 | 1.35 | 1.48 | 1.63 | 1.82 | 2.05 |
| 14.0V | 0.90 | 1.05 | 1.15 | 1.25 | 1.40 | 1.58 |
| 16.0V | 0.72 | 0.82 | 0.90 | 1.00 | 1.12 | 1.25 |
| 18.0V | 0.60 | 0.68 | 0.75 | 0.82 | 0.92 | 1.02 |
"""
        },
        {
            "category": "faq",
            "title": "FiveO Motorsport General Technical FAQ",
            "source": "fiveo_website",
            "tags": ["FAQ", "Troubleshooting", "Maintenance", "Testing"],
            "metadata": {"url": "https://www.fiveomotorsport.com/faq/"},
            "content": """
### Frequently Asked Questions (Technical)

**Q: Do I need a resistor box for my new injectors?**
A: If you are upgrading from Low-Impedance (Peak & Hold) to High-Impedance (Saturated) injectors on a factory ECU designed for Peak & Hold, you typically need to remove the resistor box or bypass it. Most FiveO high-performance injectors are High-Impedance to allow for faster response and compatibility with modern ECUs.

**Q: How often should fuel injectors be cleaned?**
A: We recommend inspection and cleaning every 30,000 to 50,000 miles for street vehicles. Racing applications using E85 should be flushed more frequently to prevent ethanol buildup (black goo).

**Q: Why is my idle rough after installing 1000cc+ injectors?**
A: Large injectors have a 'Minimum Pulse Width'. If your ECU cannot command a short enough pulse, the engine will run rich at idle. Specialized tuning of the 'Dead Time' or 'Offset' tables is required to stabilize ultra-large injectors.

**Q: Are FiveO fuel injectors flow-matched?**
A: Yes, every set is matched to within 1-2% dynamic flow variance to ensure consistent cylinder-to-cylinder performance.
"""
        }
    ]

    print(f"Ingesting {len(content_list)} entries into Knowledge Base...")
    for entry in content_list:
        sb.table('knowledge_base').upsert(entry).execute()
        print(f"  Ingested: {entry['title']}")

    print("Oracle Ingestion Complete.")

if __name__ == "__main__":
    main()
