#!/usr/bin/env python3
"""
FiveO Motorsport — Fix "-each" URL Keys
=========================================
Strips the "-each" suffix from all product url_key values in Supabase.
These are single-unit Magento variants whose URLs 404 on the live site.

Usage:
    python3 scripts/fix_each_urls.py          # Dry run (preview only)
    python3 scripts/fix_each_urls.py --apply  # Apply changes to database

Requires .env with:
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_KEY=sb_secret_xxx
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

DRY_RUN = "--apply" not in sys.argv


def main():
    print("╔══════════════════════════════════════════════╗")
    print("║  FiveO — Fix '-each' URL Keys                ║")
    print(f"║  Mode: {'DRY RUN (preview only)' if DRY_RUN else '⚠  APPLYING CHANGES'}              ║")
    print("╚══════════════════════════════════════════════╝")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all products with -each url_keys (paginated)
    all_each = []
    offset = 0
    page_size = 1000
    while True:
        result = (supabase.table("products")
                  .select("id, sku, url_key, product_url")
                  .ilike("url_key", "%-each")
                  .range(offset, offset + page_size - 1)
                  .execute())
        all_each.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    print(f"\n  Found {len(all_each)} products with '-each' url_key\n")

    if not all_each:
        print("  ✅ No '-each' url_keys found. Database is clean!")
        return

    updated = 0
    errors = 0

    for p in all_each:
        old_key = p["url_key"]
        new_key = old_key[:-5] if old_key.endswith("-each") else old_key  # strip "-each"

        # Also clean up product_url
        old_url = p.get("product_url") or ""
        new_url = old_url.replace("-each.html", ".html").replace("-each/", "/") if old_url else old_url

        print(f"  [{p['id']:>5}] {p['sku'][:50]}")
        print(f"         url_key:     {old_key}")
        print(f"         → fixed:     {new_key}")
        if old_url != new_url:
            print(f"         product_url: {old_url}")
            print(f"         → fixed:     {new_url}")
        print()

        if not DRY_RUN:
            try:
                update_data = {"url_key": new_key}
                if old_url != new_url:
                    update_data["product_url"] = new_url

                supabase.table("products").update(update_data).eq("id", p["id"]).execute()
                updated += 1
            except Exception as e:
                print(f"  ⚠ Error updating {p['sku']}: {e}")
                errors += 1

    print(f"\n{'═' * 50}")
    if DRY_RUN:
        print(f"  DRY RUN COMPLETE: {len(all_each)} products would be updated")
        print(f"  Run with --apply to commit changes:")
        print(f"    python3 scripts/fix_each_urls.py --apply")
    else:
        print(f"  ✅ Updated: {updated}")
        print(f"  ⚠  Errors:  {errors}")

    # Verification query
    if not DRY_RUN:
        verify = (supabase.table("products")
                  .select("id", count="exact")
                  .ilike("url_key", "%-each")
                  .limit(0)
                  .execute())
        remaining = verify.count
        print(f"\n  Verification: {remaining} products still have '-each' url_key")
        if remaining == 0:
            print("  ✅ Database is fully clean!")
        else:
            print(f"  ⚠  {remaining} products still need attention")

    print("\n✅ Done!")


if __name__ == "__main__":
    main()
