"""Patch index.html and remaining abouts body links."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def patch_index():
    p = ROOT / "index.html"
    t = p.read_text(encoding="utf-8")
    pairs = [
        ('href="#activity-calendar"', 'href="activities.html"'),
        ('href="dashboard.html#athletes"', 'href="athletes.html"'),
        ('href="dashboard.html#results"', 'href="results.html"'),
        ('href="dashboard.html#overview"', 'href="overview.html"'),
        ('href="#training-courses"', 'href="courses.html"'),
        ('href="#footer">ติดต่อเรา<', 'href="contact.html">ติดต่อเรา<'),
        ('data-section="footer" href="#footer">ติดต่อเรา<', 'href="contact.html">ติดต่อเรา<'),
        ('href="#gateway-services">กิจกรรมกีฬา<', 'href="activities.html">กิจกรรมกีฬา<'),
    ]
    for a, b in pairs:
        t = t.replace(a, b)
    # mobile footer with data-section left
    t = re.sub(
        r'<a class="mobile-direct" data-section="footer" href="contact\.html">ติดต่อเรา</a>',
        '<a class="mobile-direct" href="contact.html">ติดต่อเรา</a>',
        t,
    )
    t = re.sub(
        r'<a class="nav-primary-link" data-section="footer" href="contact\.html">ติดต่อเรา</a>',
        '<a class="nav-primary-link" href="contact.html">ติดต่อเรา</a>',
        t,
    )
    p.write_text(t, encoding="utf-8")
    print("index patched")


def patch_abouts():
    p = ROOT / "abouts.html"
    t = p.read_text(encoding="utf-8")
    t = t.replace('<a href="index.html#training-courses">', '<a href="courses.html">')
    t = t.replace(
        '<a href="index.html#gateway-services">\n              <i aria-hidden="true">01</i>',
        '<a href="activities.html">\n              <i aria-hidden="true">01</i>',
    )
    p.write_text(t, encoding="utf-8")
    print("abouts patched")


def patch_dashboard_nav():
    # ensure dashboard nav uses new routes (already via patch-portal-nav)
    p = ROOT / "dashboard.html"
    t = p.read_text(encoding="utf-8")
    t = t.replace('href="dashboard.html#athletes"', 'href="athletes.html"')
    t = t.replace('href="dashboard.html#results"', 'href="results.html"')
    t = t.replace('href="dashboard.html#overview"', 'href="overview.html"')
    p.write_text(t, encoding="utf-8")
    print("dashboard nav ok")


if __name__ == "__main__":
    patch_index()
    patch_abouts()
    patch_dashboard_nav()
