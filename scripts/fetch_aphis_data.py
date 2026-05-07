"""
Fetch HPAI wild bird detections CSV from USDA APHIS and convert to JSON.
Used by GitHub Actions to keep dashboard data current.
"""
import csv
import json
import sys
import urllib.request

APHIS_CSV_URL = "https://www.aphis.usda.gov/sites/default/files/hpai-wild-birds.csv"
OUTPUT_FILE = "data/hpai-wild-birds.json"

# Map CSV column names to the property names the dashboard expects
COLUMN_MAP = {
    "State": "State",
    "County": "County",
    "Collection Date": "Collection_Date",
    "Date Detected": "Date_Detected",
    "HPAI Strain": "HPAI_Strain",
    "Bird Species": "Bird_species",
    "WOAH Classification": "WOAH_Classification",
    "Sampling Method": "Sampling_Method",
    "Submitting Agency": "Submitting_Agency",
}


def fetch_and_convert():
    print(f"Fetching CSV from {APHIS_CSV_URL} ...")
    req = urllib.request.Request(APHIS_CSV_URL, headers={"User-Agent": "HPAI-Dashboard/1.0"})
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode("utf-8-sig")

    reader = csv.DictReader(raw.splitlines())
    records = []
    for row in reader:
        record = {}
        for csv_col, js_key in COLUMN_MAP.items():
            record[js_key] = row.get(csv_col, "").strip()
        records.append(record)

    print(f"Parsed {len(records):,} records")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, separators=(",", ":"))

    print(f"Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    fetch_and_convert()
