import os
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(url, key)

print("Checking for duplicate SKUs...")
# We use a raw RPC or just query and check logic
res = supabase.table("products").select("sku").execute()
skus = [r["sku"] for r in res.data]
from collections import Counter
counts = Counter(skus)
dupes = [sku for sku, count in counts.items() if count > 1]

if dupes:
    print(f"Found {len(dupes)} duplicate SKUs. Cleaning up...")
    for sku in dupes:
        # Keep the most recent one (highest ID)
        all_with_sku = supabase.table("products").select("id").eq("sku", sku).order("id").execute()
        ids = [r["id"] for r in all_with_sku.data]
        if len(ids) > 1:
            supabase.table("products").delete().in_("id", ids[:-1]).eq("sku", sku).execute()
    print("Cleanup complete.")
else:
    print("No duplicates found.")

print("Adding unique constraint...")
# NOTE: supabase-py doesn't have a direct 'run_sql' method for security reasons.
# However, we can try to apply it via a unique index if the table is manageable,
# but usually this requires the SQL Editor.
