#!/usr/bin/env python3
"""Build compact venue extras (gallery, hours, facilities) from the SQL dump + CSV."""
from __future__ import annotations

import csv
import json
import re
from collections import defaultdict
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL_PATH = ROOT / "sports_almanac_db_2026-08-11.sql"
CSV_PATH = ROOT / "Apps" / "data" / "public" / "stadiums.csv"
OUT_DIR = ROOT / "Version2" / "assets" / "data"
OUT_COVERS = OUT_DIR / "venue-covers.json"
OUT_SHARDS = OUT_DIR / "venue-shards"
MAP_PATH = OUT_DIR / "national-sports-map.json"
SHARD_COUNT = 40

IMG_BASE = "https://api.sports-almanac.go.th"
WP_UPLOAD_BASE = "https://sports-almanac.go.th/wp-content/uploads/"
MEDIA_MAP: dict[int, str] = {}
DAYS = ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์"]
OWNER = {
    "1": "ส่วนราชการ",
    "2": "รัฐวิสาหกิจ",
    "3": "เอกชน",
    "4": "องค์การมหาชน",
    "5": "สมาคมกีฬาแห่งประเทศไทย",
    "6": "สมาคมกีฬาแห่งจังหวัด",
}
STATUS = {"1": "เปิดให้บริการตามปกติ", "2": "ปิดให้บริการชั่วคราว", "3": "ปิดให้บริการถาวร"}
AREA = {"1": "ไร่", "2": "งาน", "3": "ตารางวา", "4": "ตารางเมตร"}
AUDIENCE = {
    1: "บุคคลภายนอก",
    2: "นักกีฬา",
    3: "บุคลากรภายในองค์กร",
}
STADIUM_TYPE = {
    1: "สนามกีฬา",
    2: "ฟิตเนส / ยิม",
    3: "ลานกีฬา",
    4: "สวนสาธารณะ",
    5: "อาคารอเนกประสงค์",
}
SURFACE: dict[int, str] = {}
SPORT_TYPE: dict[int, str] = {}
FACILITY = {
    1: "Wi-Fi",
    2: "ที่จอดรถ",
    3: "ห้องน้ำ",
    4: "เครื่อง AED",
    5: "ทางลาด",
    6: "ทางหนีไฟ",
    7: "ห้องเปลี่ยนเครื่องแต่งกาย",
    8: "ห้องอาบน้ำ",
    9: "ห้องพักนักกีฬา",
    10: "ห้องรับรองพิเศษ",
    11: "ห้องแถลงข่าว",
    12: "เจ้าหน้าที่ปฐมพยาบาล",
    13: "จุดปฐมพยาบาล",
    14: "ร้านอาหาร",
    15: "ร้านสะดวกซื้อ",
    16: "ตู้กดสินค้า",
    17: "กล้องวงจรปิด",
    18: "เครื่องตรวจโลหะ",
    19: "อุปกรณ์ดับเพลิง",
    20: "รักษาความปลอดภัย",
    21: "จอขนาดใหญ่",
    22: "โปรเจคเตอร์",
    23: "ระบบเสียง",
    24: "เครื่องปรับอากาศ",
}


def split_sql_values(chunk: str) -> list[str]:
    fields: list[str] = []
    buf: list[str] = []
    in_str = False
    i = 0
    while i < len(chunk):
        ch = chunk[i]
        if in_str:
            if ch == "\\" and i + 1 < len(chunk):
                nxt = chunk[i + 1]
                if nxt == "n":
                    buf.append("\n")
                elif nxt == "r":
                    buf.append("\r")
                elif nxt == "t":
                    buf.append("\t")
                elif nxt == "0":
                    buf.append("\0")
                else:
                    buf.append(nxt)
                i += 2
                continue
            if ch == "'":
                if i + 1 < len(chunk) and chunk[i + 1] == "'":
                    buf.append("'")
                    i += 2
                    continue
                in_str = False
                i += 1
                continue
            buf.append(ch)
            i += 1
            continue
        if ch == "'":
            in_str = True
            i += 1
            continue
        if ch == ",":
            fields.append("".join(buf).strip())
            buf = []
            i += 1
            continue
        buf.append(ch)
        i += 1
    if buf or chunk.endswith(","):
        fields.append("".join(buf).strip())
    return fields


def image_url(raw: str) -> str:
    value = (raw or "").strip()
    if not value or value.upper() == "NULL":
        return ""
    if value.isdigit():
        relative = MEDIA_MAP.get(int(value), "")
        return f"{WP_UPLOAD_BASE}{relative}" if relative else ""
    if "uploads" in value:
        if value.startswith("http"):
            return value
        if value.startswith("wp-content/"):
            return "https://sports-almanac.go.th/" + value
        return IMG_BASE + (value if value.startswith("/") else "/" + value)
    if "firebasestorage" in value or "storage.googleapis.com" in value:
        return value
    return ""


def parse_media_map() -> dict[int, str]:
    """Map WordPress attachment IDs -> relative upload paths."""
    media: dict[int, str] = {}
    pattern = re.compile(r"\((\d+),\s*(\d+),\s*'_wp_attached_file',\s*'([^']+)'\)")
    with SQL_PATH.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if "_wp_attached_file" not in line:
                continue
            for match in pattern.finditer(line):
                media[int(match.group(2))] = match.group(3).replace("\\/", "/")
    return media


def parse_lookup_table(table: str) -> dict[int, str]:
    rows: dict[int, str] = {}
    capturing = False
    insert_re = re.compile(rf"INSERT INTO `{table}`")
    row_re = re.compile(r"\((\d+),\s*'((?:\\'|[^'])*)'")
    with SQL_PATH.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if insert_re.search(line):
                capturing = True
                continue
            if capturing and (line.startswith("-- Dumping") or (line.startswith("CREATE TABLE") and table not in line)):
                break
            if not capturing:
                continue
            for match in row_re.finditer(line):
                rows[int(match.group(1))] = match.group(2).replace("\\'", "'")
    return rows


def map_csv_ids(raw: str, lookup: dict[int, str] | dict[str, str]) -> list[str]:
    values = []
    for part in str(raw or "").split(","):
        token = part.strip()
        if not token or token.upper() == "NULL":
            continue
        label = ""
        try:
            label = lookup.get(int(token), "")  # type: ignore[arg-type]
        except ValueError:
            label = lookup.get(token, "")  # type: ignore[arg-type]
        if label:
            values.append(label)
    return values


def parse_service_fee(raw: str) -> str:
    value = (raw or "").strip()
    if not value or value in ("NULL", "[]"):
        return "ไม่มีค่าใช้จ่าย"
    try:
        items = json.loads(value)
    except json.JSONDecodeError:
        text = strip_html(value)
        return text or "ไม่มีค่าใช้จ่าย"
    if not items:
        return "ไม่มีค่าใช้จ่าย"
    labels = []
    for item in items:
        if isinstance(item, dict):
            name = str(item.get("name") or item.get("title") or "").strip()
            price = str(item.get("price") or item.get("amount") or "").strip()
            if name and price:
                labels.append(f"{name}: {price}")
            elif name:
                labels.append(name)
            elif price:
                labels.append(price)
        elif item:
            labels.append(str(item))
    return " · ".join(labels) if labels else "ไม่มีค่าใช้จ่าย"


def unique_urls(urls: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for url in urls:
        if not url:
            continue
        key = url.split("?")[0].rstrip("/").lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(url)
    return out


def strip_html(text: str) -> str:
    text = unescape(text or "")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p\s*>", "\n", text)
    text = re.sub(r"(?i)</li\s*>", "\n", text)
    text = re.sub(r"(?i)</h[1-6]\s*>", "\n", text)
    text = re.sub(r"(?i)<li[^>]*>", "• ", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("\xa0", " ")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return re.sub(r"[ \t]{2,}", " ", text).strip()


def parse_contacts(raw: str) -> list[dict]:
    raw = (raw or "").strip()
    if not raw or raw in ("NULL", "[]"):
        return []
    try:
        items = json.loads(raw)
    except json.JSONDecodeError:
        return []
    contacts = []
    for item in items:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "").strip()
        phone = str(item.get("phone") or "").strip()
        if not name and not phone:
            continue
        contacts.append({"name": name, "phone": phone})
    return contacts


def clean_url(raw: str) -> str:
    value = (raw or "").strip()
    if not value or value.upper() == "NULL" or value in ("-", "0"):
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    if value.startswith("www."):
        return "https://" + value
    if "facebook.com" in value or "fb.com" in value:
        return value if value.startswith("http") else "https://" + value.lstrip("/")
    if "." in value and " " not in value and len(value) < 120:
        return "https://" + value
    return ""


def parse_hours(status_open: str, open_time: str, close_time: str) -> list[list[str]]:
    statuses = [part.strip() for part in (status_open or "").split(",")]
    opens = [part.strip() for part in (open_time or "").split(",")]
    closes = [part.strip() for part in (close_time or "").split(",")]
    if not any(statuses):
        return []
    rows = []
    same = len(set(statuses[:7] or [""])) <= 1 and len(set(opens[:7] or [""])) <= 1 and len(set(closes[:7] or [""])) <= 1
    if same and statuses and statuses[0] == "open" and opens and opens[0] not in ("", "00:00"):
        return [["ทุกวัน", f"{opens[0]} - {closes[0]} น."]]
    for i, day in enumerate(DAYS):
        st = statuses[i] if i < len(statuses) else ""
        op = opens[i] if i < len(opens) else ""
        cl = closes[i] if i < len(closes) else ""
        if st == "open" and op:
            rows.append([day, f"{op} - {cl} น."])
        else:
            rows.append([day, "ปิดให้บริการ"])
    if all(row[1] == "ปิดให้บริการ" for row in rows):
        return []
    return rows


def parse_facilities(raw: str) -> list[str]:
    raw = (raw or "").strip()
    if not raw or raw in ("NULL", "[]"):
        return []
    try:
        items = json.loads(raw)
    except json.JSONDecodeError:
        return []
    labels = []
    for item in items:
        if not isinstance(item, dict):
            continue
        if str(item.get("status")) != "1":
            continue
        fid = int(item.get("id") or 0)
        name = FACILITY.get(fid)
        if not name:
            continue
        amount = item.get("amount")
        if amount not in (None, "", 0, "0"):
            labels.append(f"{name} ({amount})")
        else:
            labels.append(name)
    return labels


def parse_stadium_rows() -> dict[int, dict]:
    records: dict[int, dict] = {}
    capturing = False
    with SQL_PATH.open("r", encoding="utf-8", errors="replace", newline="") as handle:
        for line in handle:
            if "INSERT INTO `wp_stadiums`" in line:
                capturing = True
                continue
            if capturing and line.startswith("-- Dumping"):
                break
            if not capturing or not line.lstrip().startswith("("):
                continue
            body = line.strip()
            if body.endswith(","):
                body = body[:-1]
            if body.endswith(";"):
                body = body[:-1]
            if body.startswith("(") and body.endswith(")"):
                body = body[1:-1]
            fields = split_sql_values(body)
            if len(fields) < 36:
                continue
            try:
                sid = int(fields[0])
            except ValueError:
                continue
            cover_raw = fields[4].strip()
            cover = image_url(cover_raw)
            gallery_parts = [part.strip() for part in fields[5].split(",") if part.strip()]
            gallery = unique_urls([
                image_url(part)
                for part in gallery_parts
                if part != cover_raw
            ])
            email = "" if fields[29] in ("", "NULL", "0@gmail.com", "test@test.com", "aaaaa@gmail.com", "tast@tast.com", "AAA@hotmail.com") else fields[29]
            fb_raw = "" if fields[31] in ("", "NULL") else fields[31].strip()
            fb_url = clean_url(fb_raw)
            audience_raw = fields[45] if len(fields) > 45 else ""
            records[sid] = {
                "id": sid,
                "name": fields[1],
                "cover": cover,
                "gallery": gallery,
                "stadiumType": STADIUM_TYPE.get(int(fields[2]) if str(fields[2]).isdigit() else -1, ""),
                "sports": map_csv_ids(fields[3], SPORT_TYPE),
                "surfaces": map_csv_ids(fields[13], SURFACE),
                "audience": map_csv_ids(audience_raw, AUDIENCE),
                "ownerType": OWNER.get(fields[7], ""),
                "owner": fields[8],
                "status": STATUS.get(fields[12], ""),
                "area": " ".join(part for part in [fields[14], AREA.get(fields[15], "")] if part and part != "-").strip(),
                "place": fields[16],
                "travel": strip_html(fields[22]),
                "detail": strip_html(fields[23]),
                "hours": parse_hours(fields[24], fields[25], fields[26]),
                "facilities": parse_facilities(fields[27]),
                "fee": parse_service_fee(fields[28]),
                "email": email,
                "line": "" if fields[30] in ("", "NULL") else fields[30].strip(),
                "facebook": fb_url,
                "facebookName": "" if fb_url else fb_raw,
                "instagram": clean_url(fields[32]),
                "website": clean_url(fields[33]),
                "contacts": parse_contacts(fields[34]),
                "lat": fields[20],
                "lon": fields[21],
            }
    return records


def parse_sub_stadiums() -> dict[int, list[int]]:
    mapping: dict[int, list[int]] = defaultdict(list)
    capturing = False
    with SQL_PATH.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if "INSERT INTO `wp_stadium_sub_stadium`" in line:
                capturing = True
                continue
            if capturing and line.startswith("-- Dumping"):
                break
            if not capturing:
                continue
            for match in re.finditer(r"\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)", line):
                parent = int(match.group(2))
                child = int(match.group(3))
                if child != parent:
                    mapping[parent].append(child)
    return mapping


def csv_index() -> dict[str, dict]:
    index = {}
    with CSV_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            key = f"{row['name'].strip()}|{row['latitude'].strip()}|{row['longitude'].strip()}"
            index[key] = {
                "id": int(row["id"]),
                "district": (row.get("place_district_name") or "").strip(),
                "subdistrict": (row.get("place_subdistrict_name") or "").strip(),
                "province": (row.get("place_province_name") or "").strip(),
                "sport": (row.get("sport_name") or "").strip(),
                "env": (row.get("environment") or "").strip(),
                "place": (row.get("place_name") or "").strip(),
            }
    return index


def compact_detail(row: dict, csv_row: dict | None, subs: list[dict]) -> dict:
    payload = {
        "id": row["id"],
        "name": row["name"],
        "cover": row["cover"],
        "gallery": row["gallery"],
        "detail": row["detail"],
        "travel": row["travel"],
        "place": row["place"] or (csv_row or {}).get("place", ""),
        "stadiumType": row["stadiumType"],
        "sports": row["sports"],
        "surfaces": row["surfaces"],
        "audience": row["audience"],
        "owner": row["owner"],
        "ownerType": row["ownerType"],
        "status": row["status"],
        "area": row["area"],
        "hours": row["hours"],
        "facilities": row["facilities"],
        "fee": row["fee"],
        "email": row["email"],
        "line": row["line"],
        "facebook": row["facebook"],
        "facebookName": row["facebookName"],
        "instagram": row["instagram"],
        "website": row["website"],
        "contacts": row["contacts"],
        "district": (csv_row or {}).get("district", ""),
        "subdistrict": (csv_row or {}).get("subdistrict", ""),
        "province": (csv_row or {}).get("province", ""),
        "lat": row["lat"],
        "lon": row["lon"],
        "subs": subs,
    }
    return {key: value for key, value in payload.items() if value not in ("", [], None)}


def main() -> None:
    global MEDIA_MAP, SURFACE, SPORT_TYPE
    print("Parsing WordPress media attachments…")
    MEDIA_MAP = parse_media_map()
    print(f"  {len(MEDIA_MAP):,} attached files")
    print("Parsing sport / surface lookups…")
    SPORT_TYPE = parse_lookup_table("wp_sport_types")
    SURFACE = parse_lookup_table("wp_stadium_surface")
    print(f"  sports {len(SPORT_TYPE):,} · surfaces {len(SURFACE):,}")
    print("Parsing stadium SQL rows…")
    stadiums = parse_stadium_rows()
    print(f"  {len(stadiums):,} stadiums")
    with_cover = sum(1 for row in stadiums.values() if row.get("cover"))
    with_gallery = sum(1 for row in stadiums.values() if row.get("gallery"))
    print(f"  with cover: {with_cover:,} · with gallery: {with_gallery:,}")
    print("Parsing sub-stadiums…")
    sub_map = parse_sub_stadiums()
    print(f"  {sum(len(v) for v in sub_map.values()):,} links")
    print("Reading CSV index…")
    by_key = csv_index()
    csv_by_id = {row["id"]: row for row in by_key.values()}
    print(f"  {len(by_key):,} csv rows")

    details = {}
    covers = {}
    for sid, row in stadiums.items():
        children = []
        for child_id in sub_map.get(sid, []):
            child = stadiums.get(child_id)
            if not child:
                continue
            child_cover = child["cover"] or ((child.get("gallery") or [""])[0])
            children.append({
                "id": child_id,
                "name": child["name"],
                "cover": child_cover,
            })
        details[str(sid)] = compact_detail(row, csv_by_id.get(sid), children)
        if row["cover"]:
            if row["cover"].startswith(IMG_BASE):
                covers[str(sid)] = row["cover"][len(IMG_BASE) :]
            else:
                covers[str(sid)] = row["cover"]

    print("Patching map venue ids…")
    lookup = {}
    for key, row in by_key.items():
        lookup[key] = row["id"]
        name, lat, lon = key.split("|", 2)
        if not lat or not lon:
            continue
        try:
            lookup[f"{name}|{float(lat):.5f}|{float(lon):.5f}"] = row["id"]
        except ValueError:
            continue

    map_payload = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    matched = 0
    for venue in map_payload.get("venues", []):
        name = str(venue[2]).strip()
        lat = venue[0]
        lon = venue[1]
        sid = lookup.get(f"{name}|{lat}|{lon}") or lookup.get(f"{name}|{float(lat):.5f}|{float(lon):.5f}")
        if sid is None:
            sid = lookup.get(f"{name}|{str(lat).strip()}|{str(lon).strip()}")
        if sid is not None:
            if len(venue) < 7:
                venue.append(sid)
            else:
                venue[6] = sid
            matched += 1
        elif len(venue) > 6:
            venue[:] = venue[:6]
    MAP_PATH.write_text(json.dumps(map_payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  matched {matched:,} / {len(map_payload.get('venues', [])):,} venues")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if OUT_SHARDS.exists():
        for old in OUT_SHARDS.glob("*.json"):
            old.unlink()
    else:
        OUT_SHARDS.mkdir(parents=True, exist_ok=True)

    shards = [ {} for _ in range(SHARD_COUNT) ]
    for sid, payload in details.items():
        shards[int(sid) % SHARD_COUNT][sid] = payload
    for i, shard in enumerate(shards):
        (OUT_SHARDS / f"{i}.json").write_text(json.dumps(shard, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    OUT_COVERS.write_text(json.dumps(covers, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    leftover = OUT_DIR / "venue-details.json"
    leftover_index = OUT_DIR / "venue-index.json"
    if leftover.exists():
        leftover.unlink()
    if leftover_index.exists():
        leftover_index.unlink()
    print(f"Wrote {len(shards)} shards + {len(covers):,} covers")


if __name__ == "__main__":
    main()
