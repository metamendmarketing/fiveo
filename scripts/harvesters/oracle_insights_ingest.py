#!/usr/bin/env python3
"""
Oracle Insights Ingester
Populates the knowledge_base with bite-sized expert advice in the 'Problem/Mistake' format.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

INSIGHTS = [
    {
        "category": "oracle_insight",
        "title": "The Flex Fuel Future-Proof Trap",
        "content": """
**The Problem**: Buying injectors that are sized perfectly for Gasoline (e.g., 750cc for 500HP).
**The Mistake**: Deciding to run E85 six months later for more power. Suddenly, your injectors are maxed out because E85 requires ~35% more volume.
**The Oracle Says**: If you even THINK you might run Flex Fuel later, buy the 1000cc set now. It saves you from buying two sets in one year.
""",
        "metadata": {"tags": ["e85", "flex_fuel", "headroom"], "impact": "high"}
    },
    {
        "category": "oracle_insight",
        "title": "The HP-at-the-Wheels Math Error",
        "content": """
**The Problem**: Calculating injector size based on 'Wheel Horsepower' (WHP) instead of 'Crank Horsepower'.
**The Mistake**: Ordering injectors that are 15-20% too small because you didn't account for drivetrain loss.
**The Oracle Says**: Always size for the Crank. If you want 400 at the wheels, you need to feed 460 at the crank.
""",
        "metadata": {"tags": ["math", "horsepower", "sizing"], "impact": "medium"}
    },
    {
        "category": "oracle_insight",
        "title": "The Single-Beam vs. Split-Port Mismatch",
        "content": """
**The Problem**: Using a single-cone spray injector on a head with two intake valves.
**The Mistake**: The fuel hits the 'bridge' between the valves, causes massive wall-wetting, and destroys your low-end throttle response and fuel economy.
**The Oracle Says**: For 4-valve heads, use a split-beam pattern to target the valves directly.
""",
        "metadata": {"tags": ["spray_pattern", "drivability", "valves"], "impact": "high"}
    },
    {
        "category": "oracle_insight",
        "title": "The Duty Cycle Redline Lock-up",
        "content": """
**The Problem**: Sizing your injectors to run at 100% duty cycle at peak RPM.
**The Mistake**: The injector coil gets so hot it 'locks up'—staying open when it should be closed—leaning out the engine and melting a piston.
**The Oracle Says**: Size for 80%. That extra 20% isn't just headroom; it’s your engine’s life insurance.
""",
        "metadata": {"tags": ["safety", "tuning", "duty_cycle"], "impact": "critical"}
    },
    {
        "category": "oracle_insight",
        "title": "The Low-Impedance Driver Fry",
        "content": """
**The Problem**: Running Low-Impedance injectors on a modern, high-impedance (Saturated) ECU driver.
**The Mistake**: Frying the ECU’s fuel drivers, leading to permanent hardware failure or intermittent stutters.
**The Oracle Says**: Check your ECU first. If it's a factory ECU, you almost certainly need High-Impedance injectors.
""",
        "metadata": {"tags": ["electrical", "ecu", "impedance"], "impact": "critical"}
    }
]

def main():
    print(f"Ingesting {len(INSIGHTS)} Oracle Insights...")
    for insight in INSIGHTS:
        sb.table('knowledge_base').upsert(insight).execute()
        print(f"  Ingested: {insight['title']}")
    print("Oracle Insights Ingestion Complete.")

if __name__ == "__main__":
    main()
