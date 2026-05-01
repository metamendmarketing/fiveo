import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

response = supabase.table("products").select("sku, url_key, product_url").eq("sku", "55562599-280").execute()
print(response.data)

response2 = supabase.table("products").select("sku, url_key, product_url").eq("url_key", "55562599-280").execute()
print("By url_key:", response2.data)
