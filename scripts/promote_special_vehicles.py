#!/usr/bin/env python3
"""
Special Vehicle Promotion Script
-------------------------------
Extracts Motorcycle and Marine fitment data from product descriptions/names
and injects them into the structured vehicle fitment tables (makes, models, years, engines).
"""

import os
import re
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

def main():
    print("═══ Promoting Special Vehicles (Moto/Marine) ═══")

    # 1. Fetch products that mention Motorcycle or Marine
    res = sb.table("products").select("id, sku, name, description").or_("name.ilike.%motorcycle%,description.ilike.%motorcycle%,name.ilike.%marine%,description.ilike.%marine%,name.ilike.%atv%").execute()
    products = res.data
    print(f"  Found {len(products)} candidate products.")

    # 2. Define known special makes to look for
    SPECIAL_MAKES = ["KAWASAKI", "YAMAHA", "HONDA", "SUZUKI", "DUCATI", "HARLEY-DAVIDSON", "DELPHI MARINE", "MERCURY MARINE", "RAPTOR", "POLARIS", "SEA-DOO", "TRIUMPH"]
    
    fitment_to_add = []

    for p in products:
        text = (p["name"] + " " + (p["description"] or "")).upper()
        
        found_make = None
        for make in SPECIAL_MAKES:
            if make in text:
                found_make = make
                break
        
        if not found_make:
            continue

        # Try to extract a model (very basic extraction)
        # Look for things like ZX12, CBR600, 496, 8.1L
        model_match = re.search(r'(ZX-?\d+[R]?|CBR\d+|ROAD WARRIOR|496|8\.1L|VTX\s*\d+|RAPTOR\s*\d+)', text)
        model_name = model_match.group(0) if model_match else "Performance Series"

        # Try to extract years
        year_match = re.search(r'(19|20)\d{2}', text)
        year = int(year_match.group(0)) if year_match else 2024

        fitment_to_add.append({
            "product_id": p["id"],
            "make": found_make,
            "model": model_name,
            "year": year,
            "label": f"{found_make} {model_name} Spec"
        })

    print(f"  Extracted {len(fitment_to_add)} fitment records.")

    # 3. Inject into DB
    for f in fitment_to_add:
        # A. Upsert Make
        make_res = sb.table("makes").upsert({"name": f["make"]}, on_conflict="name").execute()
        make_id = make_res.data[0]["id"]

        # B. Upsert Model
        model_res = sb.table("models").upsert({"make_id": make_id, "name": f["model"]}, on_conflict="make_id,name").execute()
        model_id = model_res.data[0]["id"]

        # C. Upsert Year
        year_res = sb.table("years").upsert({"model_id": model_id, "year": f["year"]}, on_conflict="model_id,year").execute()
        year_id = year_res.data[0]["id"]

        # D. Upsert Engine
        engine_res = sb.table("engines").upsert({"year_id": year_id, "label": f["label"]}, on_conflict="year_id,label").execute()
        engine_id = engine_res.data[0]["id"]

        # E. Link Fitment
        sb.table("product_fitment").upsert({
            "product_id": f["product_id"],
            "make_id": make_id,
            "model_id": model_id,
            "match_source": "special_promotion"
        }, on_conflict="product_id,make_id,model_id").execute()

    print("✅ Special Vehicles Promoted Successfully.")

if __name__ == "__main__":
    main()
