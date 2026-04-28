#!/usr/bin/env python3
"""
FiveO Motorsport — Full Product URL Audit
==========================================
Checks every product url_key in Supabase against the live site
to confirm each resolves to a 200 OK (not a 404 or redirect loop).

Usage:
    python3 scripts/audit_product_urls.py

Requires .env with:
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_KEY=sb_secret_xxx
"""

import os
import sys
import time
import json
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from dotenv import load_dotenv
from supabase import create_client

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
BASE_STORE = "https://www.fiveomotorsport.com"

# Mimic a real browser to avoid Cloudflare blocks
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

# Rate limit to avoid triggering Cloudflare
DELAY_BETWEEN_REQUESTS = 0.3  # seconds
MAX_WORKERS = 3


def build_url(url_key: str) -> str:
    """Replicate the getStoreUrl logic from constants.ts"""
    slug = url_key
    if slug.endswith("-each"):
        slug = slug[:-5]
    if slug.startswith("http"):
        return slug
    if slug.startswith("/"):
        slug = slug[1:]
    if not slug.endswith("/"):
        slug += "/"
    return f"{BASE_STORE}/{slug}"


def check_url(product: dict) -> dict:
    """Check a single product URL. Returns result dict."""
    url_key = product.get("url_key") or ""
    product_id = product["id"]
    sku = product.get("sku", "?")

    if not url_key:
        return {
            "id": product_id,
            "sku": sku,
            "url_key": None,
            "url": None,
            "status": "NO_URL_KEY",
            "ok": False,
        }

    url = build_url(url_key)

    try:
        # Use HEAD first (faster), fall back to GET if HEAD is blocked
        resp = requests.head(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if resp.status_code == 405:  # Method not allowed
            resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)

        return {
            "id": product_id,
            "sku": sku,
            "url_key": url_key,
            "url": url,
            "status": resp.status_code,
            "ok": resp.status_code == 200,
            "final_url": resp.url if resp.url != url else None,
        }
    except requests.exceptions.Timeout:
        return {
            "id": product_id,
            "sku": sku,
            "url_key": url_key,
            "url": url,
            "status": "TIMEOUT",
            "ok": False,
        }
    except Exception as e:
        return {
            "id": product_id,
            "sku": sku,
            "url_key": url_key,
            "url": url,
            "status": f"ERROR: {str(e)[:80]}",
            "ok": False,
        }


def main():
    print("╔══════════════════════════════════════════════╗")
    print("║  FiveO — Product URL Audit                   ║")
    print("╚══════════════════════════════════════════════╝")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Fetch all products with url_keys (paginated)
    all_products = []
    offset = 0
    page_size = 1000
    while True:
        result = (supabase.table("products")
                  .select("id, sku, url_key")
                  .range(offset, offset + page_size - 1)
                  .execute())
        all_products.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    has_url = [p for p in all_products if p.get("url_key")]
    no_url = [p for p in all_products if not p.get("url_key")]

    print(f"\n  Total products:     {len(all_products)}")
    print(f"  With url_key:       {len(has_url)}")
    print(f"  Without url_key:    {len(no_url)}")
    print(f"\n  Checking {len(has_url)} URLs against live site...")
    print(f"  (Rate limited to {MAX_WORKERS} concurrent, {DELAY_BETWEEN_REQUESTS}s delay)\n")

    results_ok = []
    results_fail = []
    checked = 0

    for p in has_url:
        result = check_url(p)
        checked += 1

        if result["ok"]:
            results_ok.append(result)
        else:
            results_fail.append(result)
            print(f"  ✗ [{result['id']:>5}] {result['status']:>6}  {result['url']}")

        if checked % 50 == 0:
            print(f"  ... checked {checked}/{len(has_url)} "
                  f"({len(results_ok)} ok, {len(results_fail)} fail)")

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Summary
    print(f"\n{'═' * 60}")
    print(f"  AUDIT COMPLETE")
    print(f"{'═' * 60}")
    print(f"  Total checked:  {checked}")
    print(f"  ✅ 200 OK:      {len(results_ok)}")
    print(f"  ✗  Failed:      {len(results_fail)}")
    print(f"  ⊘  No url_key:  {len(no_url)}")

    if results_fail:
        print(f"\n{'─' * 60}")
        print(f"  FAILED URLs ({len(results_fail)}):")
        print(f"{'─' * 60}")

        # Group by status code
        by_status = {}
        for r in results_fail:
            s = str(r["status"])
            by_status.setdefault(s, []).append(r)

        for status, items in sorted(by_status.items()):
            print(f"\n  Status {status} ({len(items)} products):")
            for r in items[:20]:  # Show first 20 per status
                print(f"    [{r['id']:>5}] {r['sku'][:45]}")
                print(f"           {r['url']}")
            if len(items) > 20:
                print(f"    ... and {len(items) - 20} more")

    # Save full report
    report_path = ROOT / "data" / "url_audit_report.json"
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_products": len(all_products),
        "checked": checked,
        "ok": len(results_ok),
        "failed": len(results_fail),
        "no_url_key": len(no_url),
        "failures": results_fail,
    }
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n  Full report saved to: {report_path.name}")
    print("\n✅ Done!")


if __name__ == "__main__":
    main()
