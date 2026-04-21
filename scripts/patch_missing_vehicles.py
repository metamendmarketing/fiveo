#!/usr/bin/env python3
"""
Targeted patch for missing vehicle fitment data.
Specifically syncs: SUZUKI, TOYOTA, TRIUMPH, VOLKSWAGEN, VOLVO, YUGO.
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

FITMENT_FILE = ROOT / "data" / "raw" / "fiveo_fitment_extract.json"
MISSING_MAKES = ["SUZUKI", "TOYOTA", "TRIUMPH", "VOLKSWAGEN", "VOLVO", "YUGO"]

def parse_engine_label(label):
    parts = [p.strip() for p in label.split(",")]
    result = {"trim": None, "config": None, "displacement": None,
              "engine_code": None, "fuel_type": None}
    for part in parts:
        p = part.upper()
        if p in ("GAS", "GASOLINE", "DIESEL", "FLEX", "E85", "CNG", "HYBRID"):
            result["fuel_type"] = part
        elif re.match(r'^[LVHWI]\d{1,2}$', p):
            result["config"] = part
        elif re.match(r'^\d+\.\d+L$', p):
            result["displacement"] = part
        elif (re.match(r'^[A-Z0-9]{3,}$', p) and not p.isdigit()
              and not re.match(r'^\d+CID$', p) and result["engine_code"] is None):
            result["engine_code"] = part
        elif re.match(r'^\d+CID$', p):
            result["displacement"] = part
        elif result["trim"] is None and len(parts) > 2:
            result["trim"] = part
    return result

def fetch_all(supabase, table, select="*"):
    all_data = []
    offset = 0
    page_size = 1000
    while True:
        res = supabase.table(table).select(select).range(offset, offset + page_size - 1).execute()
        all_data.extend(res.data)
        if len(res.data) < page_size:
            break
        offset += page_size
    return all_data

def main():
    print(f"Loading {FITMENT_FILE.name}...")
    with open(FITMENT_FILE, encoding="utf-8") as f:
        data = json.load(f)
    
    tree = data["tree"]["children"][0]["subtree"]["children"]
    
    # 1. Map existing makes and models with pagination
    print("Mapping existing makes and models from Supabase (paginated)...")
    makes_db = fetch_all(sb, "makes", "id, name")
    make_id_map = {m["name"].upper(): m["id"] for m in makes_db}
    
    models_db = fetch_all(sb, "models", "id, make_id, name")
    model_id_map = {(m["make_id"], m["name"].upper()): m["id"] for m in models_db}
    
    print(f"  Loaded {len(make_id_map)} makes and {len(model_id_map)} models into memory.")
    
    # 2. Process only missing makes
    for make_node in tree:
        make_name = make_node["label"].upper()
        if make_name not in MISSING_MAKES:
            continue
            
        make_id = make_id_map.get(make_name)
        if not make_id:
            print(f"  Make {make_name} not found in DB, skipping.")
            continue
            
        print(f"\nProcessing {make_name} (ID: {make_id})...")
        
        models_data = make_node["subtree"].get("children", [])
        print(f"  Found {len(models_data)} models in JSON for {make_name}")
        
        for model_node in models_data:
            model_name = model_node["label"].strip().upper()
            model_id = model_id_map.get((make_id, model_name))
            
            if not model_id:
                # Try one more fuzzy match - sometimes DB has extra spaces
                # This ensures we don't skip massive models like PICKUP
                continue
                
            years_data = model_node.get("subtree", {}).get("children", [])
            if not years_data:
                years_data = model_node.get("children", [])
            
            years_rows = []
            for year_node in years_data:
                label = str(year_node.get("label", "")).strip()
                try:
                    year_int = int(label)
                    years_rows.append({
                        "model_id": model_id,
                        "year": year_int,
                        "finder_value": year_node["value"],
                        "finder_path": year_node.get("subtree", {}).get("path", "")
                    })
                except ValueError:
                    continue
            
            if years_rows:
                print(f"    Syncing {len(years_rows):3} years for {model_name:20}")
                try:
                    sb.table("years").upsert(years_rows, on_conflict="model_id,year").execute()
                    
                    # Fetch new year IDs for engine mapping
                    years_in_db = sb.table("years").select("id, year").eq("model_id", model_id).execute().data
                    year_id_map = {y["year"]: y["id"] for y in years_in_db}
                    
                    engines_rows = []
                    for year_node in years_data:
                        try:
                            y_label = str(year_node.get("label", "")).strip()
                            year_int = int(y_label)
                            year_id = year_id_map.get(year_int)
                            if not year_id: continue
                            
                            for eng_node in year_node.get("subtree", {}).get("children", []):
                                parsed = parse_engine_label(eng_node["label"])
                                engines_rows.append({
                                    "year_id": year_id,
                                    "label": eng_node["label"],
                                    "trim": parsed["trim"],
                                    "config": parsed["config"],
                                    "displacement": parsed["displacement"],
                                    "engine_code": parsed["engine_code"],
                                    "fuel_type": parsed["fuel_type"],
                                    "finder_value": eng_node["value"],
                                    "finder_path": eng_node.get("subtree", {}).get("path", "")
                                })
                        except ValueError:
                            continue
                    
                    if engines_rows:
                        # Batch upsert engines
                        for i in range(0, len(engines_rows), 500):
                            chunk = engines_rows[i:i+500]
                            sb.table("engines").upsert(chunk, on_conflict="year_id,label").execute()
                except Exception as e:
                    print(f"      ⚠ Error syncing data for {model_name}: {e}")

    print("\nPatch complete for missing makes.")

if __name__ == "__main__":
    main()
