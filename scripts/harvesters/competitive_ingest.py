#!/usr/bin/env python3
"""
Competitive Knowledge Ingester
Populates the knowledge_base with competitor-sourced platform standards, 
diagnostic failure modes, and ECU-specific formatting logic.
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

COMPETITIVE_CONTENT = [
    {
        "category": "technical_guide",
        "title": "Ford Tuning Model: Slopes & Breakpoints",
        "source": "industry_standard_fic",
        "tags": ["Ford", "SCT", "Tuning", "Slope", "Breakpoint"],
        "metadata": {"platform": "Ford", "ecus": ["SCT", "Ford_OEM"]},
        "content": """
### Ford Fuel Injector Characterization
Ford ECUs use a mathematical model to calculate pulse width across the injector's entire flow curve, divided into two sections by a 'Breakpoint'.

1. **High Slope**: The flow rate at high pulse widths (the linear portion of the curve).
2. **Low Slope**: The flow rate at very low pulse widths (the non-linear portion). This is typically 10-15% higher than the High Slope to account for 'opening inertia'.
3. **Breakpoint**: The specific pulse width where the ECU switches from Low Slope to High Slope logic.
4. **Latency (Offset)**: The time (ms) it takes for the injector to physically open at a given voltage.

**Practical Tip**: Modern injectors like the EV14 have much tighter Breakpoints than older injectors, leading to smoother idling on large-bore Ford engines.
"""
    },
    {
        "category": "technical_guide",
        "title": "GM Tuning Model: Flow vs. kPa & Offsets",
        "source": "industry_standard_lsx",
        "tags": ["GM", "LSX", "HP Tuners", "Offset", "Short Pulse"],
        "metadata": {"platform": "GM", "ecus": ["HP_Tuners", "EFI_Live"]},
        "content": """
### GM Fuel Injector Characterization
GM ECUs (especially LS/LT series) require specific 3D tables to manage fuel delivery:

1. **Flow Rate vs. Pressure (kPa)**: Since GM systems often use a vacuum-referenced or returnless rail, the flow rate changes based on the manifold pressure difference.
2. **Offset vs. Volts vs. VAC**: A table that adjusts opening time based on both battery voltage and manifold vacuum.
3. **Short Pulse Adder**: A correction table for extremely small pulse widths (under 2ms) where the injector behavior is non-linear.

**Pro Tuner Note**: If you don't populate the 'Short Pulse Adder' correctly, the car will hunt or surge at idle.
"""
    },
    {
        "category": "compatibility",
        "title": "ECU Data Formats: Haltech, MoTeC, Holley",
        "source": "injector_dynamics_standard",
        "tags": ["Aftermarket", "Haltech", "MoTeC", "Holley", "Calibration"],
        "metadata": {"category": "aftermarket_ecus"},
        "content": """
### Formatting Data for Aftermarket ECUs
Different ECU manufacturers require data in specific formats. When using high-performance injectors, ensure your data matches these units:

- **Haltech (Elite/Nexus)**: Requires a 3D table for 'Fuel Injector Dead Time' (Voltage vs. Differential Fuel Pressure).
- **MoTeC M1**: Uses a 'Fuel Injector Feed Forward' model. Requires highly precise 'Minimum Characterized Pulse Width'.
- **Holley EFI**: Usually requires a 1D or 2D 'Offset' table. Holley systems often benefit from 'Rated Flow' being entered at 43.5 PSI or 58 PSI depending on the regulator.

**The Oracle says**: Always verify your fuel pressure *at the rail* before entering these values, as a 5 PSI error can throw off the entire fuel map.
"""
    },
    {
        "category": "diagnostic",
        "title": "ASNU Diagnostic Standard: Identifying Failure Modes",
        "source": "asnu_international",
        "tags": ["Diagnostic", "Testing", "Failure", "Spray Pattern"],
        "metadata": {"standard": "ASNU"},
        "content": """
### Professional Injector Diagnostics (ASNU Standard)
Beyond just 'Flow Rate', a healthy injector must meet the following visual and mechanical standards:

1. **Streaming (Failure)**: The fuel exits as a solid 'jet' or 'stream' instead of a fine mist. This causes poor atomization, low power, and high emissions.
2. **Dripping/Leaking (Failure)**: The injector 'weeps' fuel when closed under pressure. This causes hard starts and 'flooding'.
3. **Atomization Imbalance**: One injector creates a larger droplet size (SMD) than the others, leading to inconsistent burning in that specific cylinder.
4. **Thermal Drift**: The injector coil changes resistance as it gets hot, causing the flow to drop during long runs (common in drift/endurance).
"""
    }
]

def main():
    print(f" locust mode: Ingesting {len(COMPETITIVE_CONTENT)} competitive knowledge entries...")
    for entry in COMPETITIVE_CONTENT:
        sb.table('knowledge_base').upsert(entry).execute()
        print(f"  Consumed: {entry['title']}")

    print("Locust Harvest Complete.")

if __name__ == "__main__":
    main()
