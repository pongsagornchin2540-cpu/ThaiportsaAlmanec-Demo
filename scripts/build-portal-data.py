"""Build Version2 portal JSON datasets from Apps CSV + existing Version2 JSON."""
from __future__ import annotations

import csv
import json
import shutil
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APPS = ROOT.parent / "Apps" / "data"
PUBLIC = APPS / "public"
OUT = ROOT / "assets" / "data"


def read_csv(name: str) -> list[dict]:
    path = PUBLIC / name
    with path.open(encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def thai_date(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw or raw.startswith("0000"):
        return ""
    try:
        dt = datetime.fromisoformat(raw.replace(" ", "T")[:19])
    except ValueError:
        return raw[:10]
    months = [
        "",
        "ม.ค.",
        "ก.พ.",
        "มี.ค.",
        "เม.ย.",
        "พ.ค.",
        "มิ.ย.",
        "ก.ค.",
        "ส.ค.",
        "ก.ย.",
        "ต.ค.",
        "พ.ย.",
        "ธ.ค.",
    ]
    return f"{dt.day} {months[dt.month]} {dt.year + 543}"


def date_range(start: str, end: str) -> str:
    a, b = thai_date(start), thai_date(end)
    if a and b and a != b:
        return f"{a} – {b}"
    return a or b or "ไม่ระบุวันที่"


GENDER = {"1": "ชาย", "2": "หญิง"}
LEVEL = {"0": "ไม่ระบุ", "1": "ระดับชาติ", "2": "ระดับนานาชาติ", "3": "ระดับท้องถิ่น"}
EVENT_LEVEL = {"1": "ระดับนานาชาติ", "2": "ระดับชาติ", "3": "ระดับท้องถิ่น", "4": "ระดับภูมิภาค"}
PERSONAL_TYPE = {
    "1": "ผู้ฝึกสอน",
    "2": "ผู้ตัดสิน",
    "3": "ผู้บริหารกีฬา",
    "4": "นักวิทยาศาสตร์การกีฬา",
    "5": "บุคลากรกีฬา",
}


def build_events() -> dict:
    rows = read_csv("events.csv")
    gh_path = OUT / "green-heart-events.json"
    gh_by_id = {}
    if gh_path.exists():
        gh = json.loads(gh_path.read_text(encoding="utf-8-sig"))
        for ev in gh.get("events") or []:
            gh_by_id[str(ev.get("id"))] = ev

    events = []
    for row in rows:
        eid = str(row.get("id") or "")
        gh = gh_by_id.get(eid) or {}
        start = row.get("event_start_date") or ""
        end = row.get("event_end_date") or ""
        province = (row.get("place_province_name") or "").strip()
        district = (row.get("place_district_name") or "").strip()
        place = (row.get("place_name") or "").strip()
        location = gh.get("location_display") or ", ".join(x for x in [district, province] if x) or place
        events.append(
            {
                "id": eid,
                "name": (row.get("name") or "").strip(),
                "sport": (row.get("sport_name") or "").strip(),
                "level": EVENT_LEVEL.get(str(row.get("event_level") or ""), ""),
                "levelId": str(row.get("event_level") or ""),
                "owner": (row.get("event_owner_name") or "").strip(),
                "start": start[:10],
                "end": end[:10],
                "dateDisplay": gh.get("date_display") or date_range(start, end),
                "province": province or gh.get("province_name") or "",
                "district": district or gh.get("district_name") or "",
                "place": place,
                "location": location,
                "lat": row.get("latitude") or gh.get("lat") or "",
                "lon": row.get("longitude") or gh.get("lng") or "",
                "cover": gh.get("image_cover") or "",
                "isGreenHeart": bool(gh),
                "mapUrl": gh.get("event_google_map_link")
                or (
                    f"https://www.google.com/maps?q={row.get('latitude')},{row.get('longitude')}"
                    if row.get("latitude") and row.get("longitude")
                    else ""
                ),
                "status": str(row.get("status") or ""),
            }
        )

    events.sort(key=lambda e: e["start"] or "0000", reverse=True)
    provinces = sorted({e["province"] for e in events if e["province"]}, key=lambda x: x)
    featured = [e for e in events if e.get("cover") or e.get("isGreenHeart")][:12]
    if len(featured) < 8:
        featured = events[:12]
    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "total": len(events),
        "provinces": provinces,
        "featured": featured,
        "events": events,
    }


def build_people() -> dict:
    athletes = []
    for row in read_csv("athletes.csv"):
        athletes.append(
            {
                "id": str(row.get("id") or ""),
                "kind": "athlete",
                "firstName": (row.get("first_name") or "").strip(),
                "lastName": (row.get("last_name") or "").strip(),
                "name": f"{(row.get('first_name') or '').strip()} {(row.get('last_name') or '').strip()}".strip(),
                "gender": GENDER.get(str(row.get("gender") or ""), ""),
                "sport": (row.get("sport_name") or "").strip(),
                "province": (row.get("province_name") or "").strip(),
                "level": LEVEL.get(str(row.get("level") or ""), "ไม่ระบุ"),
                "year": (row.get("registration_year") or "").strip(),
                "status": str(row.get("status") or ""),
            }
        )

    personnel = []
    for row in read_csv("sport_personal.csv"):
        personnel.append(
            {
                "id": str(row.get("id") or ""),
                "kind": "personnel",
                "firstName": (row.get("first_name") or "").strip(),
                "lastName": (row.get("last_name") or "").strip(),
                "name": f"{(row.get('first_name') or '').strip()} {(row.get('last_name') or '').strip()}".strip(),
                "gender": GENDER.get(str(row.get("gender") or ""), ""),
                "role": PERSONAL_TYPE.get(str(row.get("sport_personal_type") or ""), "บุคลากรกีฬา"),
                "sport": (row.get("sport_name") or "").strip(),
                "province": (row.get("province_name") or "").strip(),
                "level": LEVEL.get(str(row.get("level") or ""), "ไม่ระบุ"),
                "year": (row.get("registration_year") or "").strip(),
                "status": str(row.get("status") or ""),
            }
        )

    by_sport = Counter(a["sport"] for a in athletes if a["sport"])
    by_province = Counter(a["province"] for a in athletes if a["province"])
    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "athletes": athletes,
        "personnel": personnel,
        "stats": {
            "athletes": len(athletes),
            "personnel": len(personnel),
            "sports": len(by_sport),
            "provinces": len(by_province),
            "topSports": by_sport.most_common(8),
            "topProvinces": by_province.most_common(8),
        },
    }


def build_results() -> dict:
    athletes = {str(a["id"]): a["name"] for a in build_people()["athletes"]}
    # rebuild athletes map lightly
    athletes = {}
    for row in read_csv("athletes.csv"):
        athletes[str(row["id"])] = f"{row.get('first_name','').strip()} {row.get('last_name','').strip()}".strip()

    comps = []
    for row in read_csv("competition_list.csv"):
        comps.append(
            {
                "id": str(row.get("id") or ""),
                "name": (row.get("name") or "").strip(),
                "year": (row.get("competition_year") or "").strip(),
                "level": LEVEL.get(str(row.get("competition_level") or ""), ""),
                "start": (row.get("competition_start_date") or "")[:10],
                "end": (row.get("competition_end_date") or "")[:10],
                "dateDisplay": date_range(row.get("competition_start_date") or "", row.get("competition_end_date") or ""),
                "province": (row.get("place_province_name") or "").strip(),
                "district": (row.get("place_district_name") or "").strip(),
                "place": (row.get("place_name") or row.get("competition_location") or "").strip(),
                "lat": row.get("latitude") or "",
                "lon": row.get("longitude") or "",
                "results": [],
            }
        )
    by_id = {c["id"]: c for c in comps}

    results = []
    for row in read_csv("competition_results.csv"):
        cid = str(row.get("competition_id") or "")
        item = {
            "id": str(row.get("id") or ""),
            "competitionId": cid,
            "sport": (row.get("sport_name") or "").strip(),
            "gold": athletes.get(str(row.get("gold_winner") or ""), str(row.get("gold_winner") or "")),
            "silver": athletes.get(str(row.get("silver_winner") or ""), str(row.get("silver_winner") or "")),
            "bronze": athletes.get(str(row.get("bronze_winner") or ""), str(row.get("bronze_winner") or "")),
            "goldProvince": (row.get("gold_winner_province_name") or "").strip(),
            "silverProvince": (row.get("silver_winner_province_name") or "").strip(),
            "bronzeProvince": (row.get("bronze_winner_province_name") or "").strip(),
        }
        results.append(item)
        if cid in by_id:
            by_id[cid]["results"].append(item)

    comps.sort(key=lambda c: c["start"] or "0000", reverse=True)
    return {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "competitions": comps,
        "results": results,
        "stats": {
            "competitions": len(comps),
            "results": len(results),
            "gold": sum(1 for r in results if r["gold"]),
            "silver": sum(1 for r in results if r["silver"]),
            "bronze": sum(1 for r in results if r["bronze"]),
        },
    }


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    events = build_events()
    (OUT / "events-index.json").write_text(
        json.dumps(events, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"events {events['total']:,} · featured {len(events['featured'])}")

    people = build_people()
    (OUT / "people.json").write_text(
        json.dumps(people, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"athletes {people['stats']['athletes']} · personnel {people['stats']['personnel']}")

    results = build_results()
    (OUT / "results.json").write_text(
        json.dumps(results, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(f"competitions {results['stats']['competitions']} · results {results['stats']['results']}")

    ov_src = APPS / "overview-summary.json"
    if ov_src.exists():
        shutil.copyfile(ov_src, OUT / "overview-summary.json")
        print("copied overview-summary.json")

    print("done")


if __name__ == "__main__":
    main()
