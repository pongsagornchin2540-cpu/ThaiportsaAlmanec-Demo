"""Build the compact national venue dataset consumed by the landing page."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "Apps" / "data" / "public"
GEOJSON = ROOT / "Apps" / "data" / "thailand-adm1.geojson"
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "data" / "national-sports-map.json"


def normalize(value: str) -> str:
    value = value.lower().replace("province", "").strip()
    return re.sub(r"[^a-z]", "", value)


with (PUBLIC / "province.csv").open(encoding="utf-8-sig", newline="") as source:
    provinces = list(csv.DictReader(source))

english_to_thai = {normalize(row["name_eng"]): row["name"] for row in provinces}
english_to_thai[normalize("Samut Prakan")] = "สมุทรปราการ"

with GEOJSON.open(encoding="utf-8") as source:
    geography = json.load(source)

counts: Counter[str] = Counter()
venues = []
with (PUBLIC / "stadiums.csv").open(encoding="utf-8-sig", newline="") as source:
    for row in csv.DictReader(source):
        try:
            latitude = round(float(row["latitude"]), 5)
            longitude = round(float(row["longitude"]), 5)
        except (TypeError, ValueError):
            continue
        if not (5 <= latitude <= 21 and 97 <= longitude <= 106):
            continue
        province = row["place_province_name"] or "ไม่ระบุจังหวัด"
        counts[province] += 1
        venues.append([
            latitude,
            longitude,
            row["name"],
            province,
            row["sport_name"] or "กีฬาทั่วไป",
            row["environment"] or "ไม่ระบุ",
        ])

for feature in geography["features"]:
    properties = feature["properties"]
    thai_name = english_to_thai.get(normalize(properties["shapeName"]), properties["shapeName"])
    feature["properties"] = {
        "id": properties["shapeISO"],
        "name": thai_name,
        "count": counts[thai_name],
    }

payload = {
    "meta": {
        "totalRecords": 21454,
        "mappableVenues": len(venues),
        "provinces": 77,
        "generatedFrom": "Apps/data/public/stadiums.csv",
    },
    "provinces": geography,
    "venues": venues,
}

OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Wrote {len(venues):,} venue points to {OUTPUT}")
