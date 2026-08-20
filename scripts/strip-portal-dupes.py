"""Patch nav: remove duplicate primary links; strip fp-insert bands; regen portal pages."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# Remove top-level duplicate nav items (desktop + mobile)
NAV_REMOVALS = [
    re.compile(r'\s*<a class="nav-primary-link"[^>]*>กิจกรรมกีฬา</a>\n?'),
    re.compile(r'\s*<a class="nav-primary-link"[^>]*>ติดต่อเรา</a>\n?'),
    re.compile(r'\s*<a class="mobile-direct"[^>]*>กิจกรรมกีฬา</a>\n?'),
    re.compile(r'\s*<a class="mobile-direct"[^>]*>ติดต่อเรา</a>\n?'),
]

# Ensure ติดต่อเรา exists under ช่วยเหลือ dropdown
HELP_DESKTOP = re.compile(
    r'(<div class="nav-dropdown compact-dropdown">)'
    r'(<a href="[^"]*#footer">คู่มือใช้งาน</a><a href="[^"]*#footer">คำถามที่พบบ่อย \(FAQ\)</a>)'
    r'(</div>\s*</div>\s*)'
    r'(?:<a class="nav-primary-link"[^>]*>ติดต่อเรา</a>)?',
    re.M,
)

HELP_MOBILE = re.compile(
    r'(<div class="mobile-submenu">)'
    r'(<a href="[^"]*#footer">คู่มือใช้งาน</a><a href="[^"]*#footer">คำถามที่พบบ่อย \(FAQ\)</a>)'
    r'(</div></div>)'
    r'(?:\s*<a class="mobile-direct"[^>]*>ติดต่อเรา</a>)?',
)


def ensure_contact_in_help(text: str) -> str:
    def desk(m):
        inner = m.group(2)
        if "contact.html" not in inner:
            inner = inner + '<a href="contact.html">ติดต่อเรา</a>'
        return m.group(1) + inner + m.group(3)

    def mob(m):
        inner = m.group(2)
        if "contact.html" not in inner:
            inner = inner + '<a href="contact.html">ติดต่อเรา</a>'
        return m.group(1) + inner + m.group(3)

    text = HELP_DESKTOP.sub(desk, text)
    text = HELP_MOBILE.sub(mob, text)
    return text


def strip_fp_insert(text: str) -> str:
    return re.sub(
        r'\s*<article class="fp-insert[^"]*"[^>]*>.*?</article>\s*',
        "\n",
        text,
        flags=re.S,
    )


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    for rx in NAV_REMOVALS:
        text = rx.sub("\n", text)
    text = ensure_contact_in_help(text)
    if "fp-insert" in text:
        text = strip_fp_insert(text)
    # collapse excess blank lines lightly
    text = re.sub(r"\n{3,}", "\n\n", text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main():
    changed = []
    for path in ROOT.glob("*.html"):
        if path.name.startswith("index.editorial"):
            continue
        if patch_file(path):
            changed.append(path.name)
    print("patched:", ", ".join(changed) or "(none)")


if __name__ == "__main__":
    main()
