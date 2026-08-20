"""Patch nav links across Version2 HTML pages to new portal routes."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

REPLACEMENTS = [
    (r'href="index\.html#activity-calendar"', 'href="activities.html"'),
    (r'href="dashboard\.html#athletes"', 'href="athletes.html"'),
    (r'href="dashboard\.html#results"', 'href="results.html"'),
    (r'href="dashboard\.html#overview"', 'href="overview.html"'),
    (r'href="index\.html#training-courses"', 'href="courses.html"'),
    (r'href="index\.html#footer">ติดต่อเรา<', 'href="contact.html">ติดต่อเรา<'),
    (r'href="index\.html#gateway-services">กิจกรรมกีฬา<', 'href="activities.html">กิจกรรมกีฬา<'),
]


def patch(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    for pattern, repl in REPLACEMENTS:
        text = re.sub(pattern, repl, text)
    # mobile/direct contact variants already covered
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    changed = []
    for path in ROOT.glob("*.html"):
        if path.name.startswith("index.editorial"):
            continue
        if patch(path):
            changed.append(path.name)
    print("patched:", ", ".join(changed) or "(none)")


if __name__ == "__main__":
    main()
