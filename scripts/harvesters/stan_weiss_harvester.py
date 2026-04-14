#!/usr/bin/env python3
"""
Stan Weiss EFI Table Parser
Parses the downloaded HTML file into a structured JSON reference.
"""

import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent.parent
HTML_FILE = ROOT / "data" / "raw" / "stan_weiss_table.html"
OUT_FILE = ROOT / "data" / "stan_weiss_reference.json"

def parse_val(val):
    if not val or val.strip() == '-' or val.strip() == '':
        return None
    try:
        # Remove any non-numeric chars except .
        cleaned = re.sub(r'[^\d.]', '', val)
        return float(cleaned)
    except:
        return val.strip()

def main():
    if not HTML_FILE.exists():
        print(f"File not found: {HTML_FILE}")
        return

    print(f"Parsing {HTML_FILE}...")
    with open(HTML_FILE, 'r', encoding='latin-1') as f:
        soup = BeautifulSoup(f, 'lxml')

    results = []
    tables = soup.find_all('table', border='4')
    print(f"Found {len(tables)} potential tables.")

    for table in tables:
        # Find manufacturer name (usually in a LightBlue cell)
        title_cell = table.find('td', bgcolor='LightBlue')
        if not title_cell:
            continue
        
        mfr_tag = title_cell.find('font', size='+3')
        if not mfr_tag:
            mfr_tag = title_cell.find('b')
        mfr_name = mfr_tag.get_text(strip=True) if mfr_tag else "Unknown"
        
        # Determine headers based on first rows
        # The structure is usually:
        # Row 1: Title
        # Row 2: Header Labels
        # Row 3 onwards: Data
        
        rows = table.find_all('tr')
        if len(rows) < 3:
            continue

        # Simple greedy row parser
        for row in rows:
            if 'class' in row.attrs and row.attrs['class'][0] in ['DatL1', 'DatL2']:
                cols = row.find_all('td')
                if len(cols) < 5: continue
                
                # Stan Weiss table columns (standard):
                # 0: Part Number
                # 1: lbs/hr
                # 2: cc/min
                # 3: Grams
                # 4: PSI
                # 5: Bar
                # 6: lbs-n
                # 7: cc-n
                # 8: HP 80%
                # 9: HP 95%
                # 10: Feed
                # 11: Impedance
                # 12: Application
                
                pn = cols[0].get_text(strip=True)
                if not pn: continue
                
                # Clean up PN
                pn_clean = re.sub(r'\s+', '', pn).upper()
                
                entry = {
                    "mfr": mfr_name,
                    "pn_raw": pn,
                    "pn_clean": pn_clean,
                    "lbs_hr": parse_val(cols[1].get_text(strip=True)),
                    "cc_min": parse_val(cols[2].get_text(strip=True)),
                    "grams_min": parse_val(cols[3].get_text(strip=True)) if len(cols) > 3 else None,
                    "psi": parse_val(cols[4].get_text(strip=True)) if len(cols) > 4 else None,
                    "bar": parse_val(cols[5].get_text(strip=True)) if len(cols) > 5 else None,
                    "impedance": cols[11].get_text(strip=True) if len(cols) > 11 else None,
                    "application": cols[12].get_text(strip=True) if len(cols) > 12 else None
                }
                
                # Adjust for some tables having different column counts
                if len(cols) > 11 and "Low" in entry["impedance"] or "High" in entry["impedance"]:
                    pass # logic seems fine
                else:
                    # fallback search for impedance in all cols
                    for c in cols:
                        txt = c.get_text(strip=True)
                        if txt in ["Low", "High"]:
                            entry["impedance"] = txt
                            break

                results.append(entry)

    print(f"Parsed {len(results)} injector entries.")
    
    with open(OUT_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Saved results to {OUT_FILE}")

if __name__ == "__main__":
    main()
