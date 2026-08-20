"""Generate Version2 portal HTML pages — Field Poster design."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

NAV = '''  <header class="nav-shell">
    <a class="brand" href="index.html#top" aria-label="หน้าหลัก"><img src="assets/images/logo-new-transparent.png" alt="Thailand Sports Almanac"></a>
    <nav class="desktop-nav" aria-label="เมนูหลัก">
      <a class="nav-primary-link" href="index.html">หน้าหลัก</a>
      <a class="nav-primary-link" href="abouts.html">เกี่ยวกับเรา</a>
      <div class="nav-group">
        <button class="nav-primary-link nav-dropdown-trigger" type="button" aria-expanded="false"{venue_current}>สนาม <span>⌄</span></button>
        <div class="nav-dropdown venue-dropdown">
          <a href="venues.html?type=stadium">สนามกีฬา</a>
          <a href="venues.html?type=multipurpose">อาคารอเนกประสงค์</a>
          <a href="venues.html?type=public">ลานกีฬา / สวนสาธารณะ</a>
          <a href="venues.html?type=fitness">ฟิตเนส / ยิม</a>
          <a href="venues.html?type=training">ศูนย์ฝึกกีฬา</a>
          <a href="venues.html?type=science">ศูนย์วิทยาศาสตร์การกีฬา</a>
        </div>
      </div>
      <div class="nav-group">
        <button class="nav-primary-link nav-dropdown-trigger" type="button" aria-expanded="false"{news_current}>ข่าวและกิจกรรม <span>⌄</span></button>
        <div class="nav-dropdown compact-dropdown"><a href="index.html#gateway-services">ข่าวประกาศ</a><a href="activities.html">ปฏิทินกิจกรรม</a></div>
      </div>
      <div class="nav-group">
        <button class="nav-primary-link nav-dropdown-trigger" type="button" aria-expanded="false"{stats_current}>ข้อมูลและสถิติ <span>⌄</span></button>
        <div class="nav-dropdown compact-dropdown stats-dropdown">
          <div class="nav-subgroup">
            <b>แดชบอร์ด</b>
            <a href="athletes.html">นักกีฬา / บุคลากร</a>
            <a href="results.html">ผลการแข่งขัน</a>
            <a href="overview.html">สรุปภาพรวม</a>
            <a href="provinces.html">ข้อมูลรายจังหวัด</a>
          </div>
          <a href="courses.html">หลักสูตรอบรม</a>
          <a href="index.html#story">คลังความรู้</a>
        </div>
      </div>
      <div class="nav-group">
        <button class="nav-primary-link nav-dropdown-trigger" type="button" aria-expanded="false"{help_current}>ช่วยเหลือ <span>⌄</span></button>
        <div class="nav-dropdown compact-dropdown"><a href="index.html#footer">คู่มือใช้งาน</a><a href="index.html#footer">คำถามที่พบบ่อย (FAQ)</a><a href="contact.html">ติดต่อเรา</a></div>
      </div>
    </nav>
    <div class="nav-actions"><a class="login" href="#login">เข้าสู่ระบบ <span>↗</span></a><button class="menu-button" type="button" aria-label="เปิดเมนูหลัก" aria-expanded="false" aria-controls="mobile-menu"><i></i><i></i></button></div>
    <div class="mobile-menu" id="mobile-menu">
      <a class="mobile-direct" href="index.html">หน้าหลัก</a>
      <a class="mobile-direct" href="abouts.html">เกี่ยวกับเรา</a>
      <div class="mobile-accordion"><button class="mobile-accordion-trigger" type="button" aria-expanded="false">สนาม <span>＋</span></button><div class="mobile-submenu"><a href="venues.html?type=stadium">สนามกีฬา</a><a href="venues.html?type=multipurpose">อาคารอเนกประสงค์</a><a href="venues.html?type=public">ลานกีฬา / สวนสาธารณะ</a><a href="venues.html?type=fitness">ฟิตเนส / ยิม</a><a href="venues.html?type=training">ศูนย์ฝึกกีฬา</a><a href="venues.html?type=science">ศูนย์วิทยาศาสตร์การกีฬา</a></div></div>
      <div class="mobile-accordion"><button class="mobile-accordion-trigger" type="button" aria-expanded="false">ข่าวและกิจกรรม <span>＋</span></button><div class="mobile-submenu"><a href="index.html#gateway-services">ข่าวประกาศ</a><a href="activities.html">ปฏิทินกิจกรรม</a></div></div>
      <div class="mobile-accordion"><button class="mobile-accordion-trigger" type="button" aria-expanded="false">ข้อมูลและสถิติ <span>＋</span></button><div class="mobile-submenu"><b>แดชบอร์ด</b><a class="nav-nested" href="athletes.html">นักกีฬา / บุคลากร</a><a class="nav-nested" href="results.html">ผลการแข่งขัน</a><a class="nav-nested" href="overview.html">สรุปภาพรวม</a><a class="nav-nested" href="provinces.html">ข้อมูลรายจังหวัด</a><a href="courses.html">หลักสูตรอบรม</a><a href="index.html#story">คลังความรู้</a></div></div>
      <div class="mobile-accordion"><button class="mobile-accordion-trigger" type="button" aria-expanded="false">ช่วยเหลือ <span>＋</span></button><div class="mobile-submenu"><a href="index.html#footer">คู่มือใช้งาน</a><a href="index.html#footer">คำถามที่พบบ่อย (FAQ)</a><a href="contact.html">ติดต่อเรา</a></div></div>
    </div>
  </header>'''

FOOTER = '''  <footer id="footer">
    <div class="footer-brand"><img src="assets/images/logo-new-transparent.png" alt="Thailand Sports Almanac"><p>DIGITAL SPORTS GATEWAY FOR ALL</p></div>
    <div><h3>สำรวจ</h3><a href="index.html#nation">แผนที่กีฬา</a><a href="venues.html">สนามกีฬา</a><a href="activities.html">กิจกรรม</a></div>
    <div><h3>ข้อมูล</h3><a href="overview.html">สรุปภาพรวม</a><a href="athletes.html">นักกีฬา</a><a href="results.html">ผลการแข่งขัน</a><a href="courses.html">หลักสูตรอบรม</a><a href="provinces.html">ข้อมูลรายจังหวัด</a></div>
    <address><h3>สำนักงานปลัดกระทรวง<br>การท่องเที่ยวและกีฬา</h3><p>เลขที่ 120 หมู่ 3 ศูนย์ราชการเฉลิมพระเกียรติฯ<br>อาคาร C ถนนแจ้งวัฒนะ<br>เขตหลักสี่ กรุงเทพฯ 10210</p><a href="mailto:policy.tkc@mots.go.th">policy.tkc@mots.go.th</a><br><a href="tel:022831555">0 2283 1555</a></address>
    <div class="footer-bottom"><span>© 2026 THAILAND SPORTS ALMANAC</span><span>WCAG 2.1 AA</span></div>
  </footer>'''

HEAD = '''<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <script>
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
  </script>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#0a2744">
  <title>{title} — Thailand Sports Almanac</title>
  <link rel="icon" href="assets/images/logo-new-transparent.png" type="image/png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/cinematic.css?v=20260820-29">
  <link rel="stylesheet" href="assets/visitor-gateway.css?v=20260820-38">
  <link rel="stylesheet" href="assets/portal.css?v=20260820-2">
</head>
<body id="top" class="portal-page {body_class}">
  <a class="skip" href="#main">ข้ามไปยังเนื้อหาหลัก</a>
  <div class="noise" aria-hidden="true"></div>
'''

SWOOSH = '''    <div class="fp-swoosh" aria-hidden="true">
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" focusable="false">
        <path fill="currentColor" d="M0,18 C180,52 360,4 540,28 C780,60 980,6 1200,32 C1320,44 1380,40 1440,22 L1440,56 L0,56 Z"></path>
      </svg>
    </div>'''


def mast(eyebrow, title_html, lead, image, watermark, chips=""):
    return f'''    <section class="fp-mast">
      <div class="fp-mast-media" aria-hidden="true"><img src="{image}" alt="" decoding="async"></div>
      <div class="fp-mast-watermark" aria-hidden="true">{watermark}</div>
      <div class="fp-mast-inner">
        <p class="fp-eyebrow">{eyebrow}</p>
        <h1>{title_html}</h1>
        <p class="fp-mast-lead">{lead}</p>
        {f'<div class="fp-mast-meta">{chips}</div>' if chips else ""}
      </div>
    </section>
{SWOOSH}'''


def nav(flags=None):
    flags = flags or {}
    return NAV.format(
        venue_current=' aria-current="true"' if flags.get("venue") else "",
        news_current=' aria-current="true"' if flags.get("news") else "",
        stats_current=' aria-current="true"' if flags.get("stats") else "",
        help_current=' aria-current="true"' if flags.get("help") else "",
    )


def page(name, title, desc, body_class, flags, main, scripts):
    html = (
        HEAD.format(title=title, desc=desc, body_class=body_class)
        + nav(flags)
        + "\n  <main id=\"main\">\n"
        + main
        + "\n  </main>\n\n"
        + FOOTER
        + "\n\n"
        + "\n".join(f'  <script src="{s}"></script>' for s in scripts)
        + "\n</body>\n</html>\n"
    )
    (ROOT / name).write_text(html, encoding="utf-8")
    print("wrote", name)


def main():
    page(
        "activities.html",
        "ปฏิทินกิจกรรม",
        "ปฏิทินและกิจกรรมเด่นกีฬาทั่วประเทศไทย",
        "activities-page",
        {"news": True},
        mast(
            "ข่าวและกิจกรรม",
            "ปฏิทิน<br><em>กิจกรรมกีฬา</em>",
            "เลื่อนดูโปสเตอร์กิจกรรมเด่น สำรวจกระดานปฏิทิน แล้วกรองตามจังหวัดหรือคำค้น — แตะเพื่อเปิดรายละเอียด",
            "assets/images/stadium-1.jpg",
            "CALENDAR",
            '<span class="fp-chip" id="act-total-chip">กำลังโหลด…</span><span class="fp-chip">ทั่วประเทศ</span>',
        )
        + '''
    <div class="fp-stage">
      <div id="act-skeleton" class="fp-skel" aria-hidden="true"></div>

      <section class="fp-block">
        <div class="fp-block-head">
          <div>
            <h2>กิจกรรมเด่น</h2>
            <p>โปสเตอร์แนวนอน — ปัดซ้ายขวาเพื่อสำรวจ</p>
          </div>
        </div>
        <div class="fp-rail" id="featured-grid" role="list"></div>
      </section>

      <section class="fp-block">
        <div class="fp-block-head">
          <div>
            <h2>กระดานปฏิทิน</h2>
            <p>วันที่มีกิจกรรมจะไฮไลต์เป็นสีเข้ม — กดเพื่อเปิดรายละเอียด</p>
          </div>
        </div>
        <div class="fp-cal-wrap">
          <div class="fp-cal-nav">
            <button type="button" id="cal-prev" aria-label="เดือนก่อน">‹</button>
            <h2 id="cal-title">ปฏิทิน</h2>
            <button type="button" id="cal-next" aria-label="เดือนถัดไป">›</button>
          </div>
          <div class="fp-cal" id="cal-grid" aria-label="ปฏิทินกิจกรรม"></div>
        </div>
      </section>

      <section class="fp-block">
        <div class="fp-block-head">
          <div>
            <h2>รายการทั้งหมด</h2>
            <p>ไทม์ไลน์ตามวันที่ พร้อมตัวกรองติดขอบบน</p>
          </div>
        </div>
        <div class="fp-filters is-2">
          <label><span>ค้นหากิจกรรม</span><input id="act-search" type="search" placeholder="ชื่อ ชนิดกีฬา ผู้จัด…" autocomplete="off"></label>
          <label><span>จังหวัด</span><select id="act-province"><option value="">ทุกจังหวัด</option></select></label>
        </div>
        <p class="fp-count" id="act-count">กำลังโหลด…</p>
        <div class="fp-timeline" id="act-list"></div>
        <nav class="fp-pages" id="act-pagination" aria-label="หน้าของรายการกิจกรรม"></nav>
      </section>
    </div>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
            "assets/activities.js?v=20260820-2",
        ],
    )

    page(
        "activity.html",
        "รายละเอียดกิจกรรม",
        "รายละเอียดกิจกรรมกีฬา",
        "activity-detail-page",
        {"news": True},
        '''    <div class="fp-detail-hero"><img id="act-hero-img" src="assets/images/hero-sports-thailand.png" alt=""></div>
    <article class="fp-detail-sheet fp-reveal">
      <p class="fp-eyebrow">รายละเอียดกิจกรรม</p>
      <h1 id="act-title">กำลังโหลด…</h1>
      <p class="fp-lead" id="act-lead"></p>
      <dl class="fp-facts" id="act-meta"></dl>
      <div class="fp-detail-body" id="act-body"></div>
      <div id="act-actions" class="fp-cta-row"></div>
    </article>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
            "assets/activity.js?v=20260820-2",
        ],
    )

    page(
        "athletes.html",
        "นักกีฬา / บุคลากร",
        "รายชื่อนักกีฬาและบุคลากรกีฬา",
        "athletes-page",
        {"stats": True},
        mast(
            "ข้อมูลและสถิติ",
            "นักกีฬา<br><em>และบุคลากร</em>",
            "บัญชีรายชื่อแบบ roster — กรองตามบทบาท ชนิดกีฬา และจังหวัด แล้วเลื่อนดูทีละคน",
            "assets/images/about-human.jpg",
            "ROSTER",
            '<span class="fp-chip">นักกีฬา</span><span class="fp-chip">ผู้ฝึกสอน</span><span class="fp-chip">บุคลากร</span>',
        )
        + '''
    <div class="fp-stage">
      <div class="fp-stats" id="people-stats" aria-label="สรุปจำนวน"></div>
      <div class="fp-filters">
        <label><span>ค้นหา</span><input id="people-search" type="search" placeholder="ชื่อ ชนิดกีฬา…"></label>
        <label><span>ประเภท</span><select id="people-kind"><option value="">ทั้งหมด</option><option value="athlete">นักกีฬา</option><option value="personnel">บุคลากร</option></select></label>
        <label><span>ชนิดกีฬา</span><select id="people-sport"><option value="">ทุกชนิดกีฬา</option></select></label>
        <label><span>จังหวัด</span><select id="people-province"><option value="">ทุกจังหวัด</option></select></label>
      </div>
      <p class="fp-count" id="people-count">กำลังโหลด…</p>
      <div id="people-skeleton" class="fp-skel"></div>
      <div class="fp-roster" id="people-grid" role="list"></div>
    </div>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
            "assets/athletes.js?v=20260820-2",
        ],
    )

    page(
        "results.html",
        "ผลการแข่งขัน",
        "ผลการแข่งขันและเหรียญรางวัล",
        "results-page",
        {"stats": True},
        mast(
            "ข้อมูลและสถิติ",
            "ผลการ<br><em>แข่งขัน</em>",
            "บอร์ดเหรียญทอง–เงิน–ทองแดง ตามรายการแข่งขัน พร้อมจังหวัดของผู้ชนะ",
            "assets/images/stadium-2.jpg",
            "RESULTS",
            '<span class="fp-chip">เหรียญ</span><span class="fp-chip">อันดับ</span>',
        )
        + '''
    <div class="fp-stage">
      <div class="fp-stats" id="res-stats"></div>
      <div class="fp-filters is-2">
        <label><span>ค้นหา</span><input id="res-search" type="search" placeholder="ชื่อรายการ กีฬา จังหวัด…"></label>
        <label><span>ปีการแข่งขัน</span><select id="res-year"><option value="">ทุกปี</option></select></label>
      </div>
      <p class="fp-count" id="res-count">กำลังโหลด…</p>
      <div id="res-skeleton" class="fp-skel"></div>
      <div id="res-list"></div>
    </div>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
            "assets/results.js?v=20260820-2",
        ],
    )

    page(
        "overview.html",
        "สรุปภาพรวม",
        "สรุปภาพรวมข้อมูลกีฬาประเทศไทย",
        "overview-page",
        {"stats": True},
        mast(
            "ข้อมูลและสถิติ",
            "สรุป<br><em>ภาพรวมชาติ</em>",
            "ชั้นข้อมูลซ้อนกัน: ปริมาณทั้งประเทศ ความหนาแน่นรายจังหวัด และจังหวะการเติบโต",
            "assets/images/about-depth.jpg",
            "NATION",
            '<span class="fp-chip">สนาม</span><span class="fp-chip">กิจกรรม</span><span class="fp-chip">คน</span>',
        )
        + '''
    <div class="fp-stage">
      <div id="ov-skeleton" class="fp-skel"></div>
      <div class="fp-stats" id="ov-stats" style="grid-template-columns:repeat(4,minmax(0,1fr))"></div>

      <div class="fp-layers">
        <section class="fp-layer fp-reveal">
          <div class="fp-layer-visual"><img src="assets/images/stadium-1.jpg" alt="" loading="lazy"></div>
          <div class="fp-layer-body">
            <h2>ชนิดกีฬายอดนิยมในสนาม</h2>
            <div id="ov-sports"></div>
          </div>
        </section>
        <section class="fp-layer fp-reveal">
          <div class="fp-layer-visual"><img src="assets/images/hero-sports-thailand.png" alt="" loading="lazy"></div>
          <div class="fp-layer-body">
            <h2>จังหวัดที่มีสนามมาก</h2>
            <div id="ov-provinces"></div>
          </div>
        </section>
        <section class="fp-layer fp-reveal">
          <div class="fp-layer-visual"><img src="assets/images/about-hero.jpg" alt="" loading="lazy"></div>
          <div class="fp-layer-body">
            <h2>จังหวะกิจกรรมรายเดือน</h2>
            <div id="ov-growth"></div>
          </div>
        </section>
        <section class="fp-layer fp-reveal">
          <div class="fp-layer-visual"><img src="assets/images/about-human.jpg" alt="" loading="lazy"></div>
          <div class="fp-layer-body">
            <h2>คุณภาพข้อมูล</h2>
            <div id="ov-quality"></div>
          </div>
        </section>
      </div>

      <div class="fp-cta-row">
        <a class="fp-btn" href="venues.html">สำรวจสนาม</a>
        <a class="fp-btn fp-btn-ghost" href="activities.html">ปฏิทินกิจกรรม</a>
        <a class="fp-btn fp-btn-ghost" href="athletes.html">นักกีฬา</a>
        <a class="fp-btn fp-btn-ghost" href="provinces.html">รายจังหวัด</a>
      </div>
    </div>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
            "assets/overview.js?v=20260820-2",
        ],
    )

    page(
        "courses.html",
        "หลักสูตรอบรม",
        "หลักสูตรอบรมด้านกีฬาและพลศึกษา",
        "courses-page",
        {"stats": True},
        mast(
            "ข้อมูลและสถิติ",
            "หลักสูตร<br><em>อบรม</em>",
            "รายการอบรมแนว editorial — ภาพซ้าย รายละเอียดกลาง เปิดไปหน้ารายละเอียดได้ทันที",
            "assets/images/training-1.jpg",
            "TRAIN",
            '<span class="fp-chip">ครูพลศึกษา</span><span class="fp-chip">ระดับชาติ</span>',
        )
        + '''
    <div class="fp-stage">
      <div class="fp-filters is-1">
        <label><span>ค้นหาหลักสูตร</span><input id="course-search" type="search" placeholder="ชื่อหลักสูตร สถานที่ หมวด…"></label>
      </div>
      <p class="fp-count" id="course-count">กำลังโหลด…</p>
      <div id="course-skeleton" class="fp-skel"></div>
      <div id="course-grid"></div>
    </div>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
            "assets/courses.js?v=20260820-2",
        ],
    )

    page(
        "contact.html",
        "ติดต่อเรา",
        "ช่องทางติดต่อ Thailand Sports Almanac",
        "contact-page",
        {"help": True},
        mast(
            "ช่วยเหลือ",
            "ติดต่อ<br><em>เรา</em>",
            "ช่องทางตรงถึงหน่วยงานและทีมดูแลระบบข้อมูลกีฬาแห่งชาติ",
            "assets/images/about-hero.jpg",
            "CONTACT",
        )
        + '''
    <div class="fp-stage">
      <div class="fp-contact">
        <article class="fp-contact-panel fp-reveal">
          <h2>สำนักงานปลัดกระทรวงการท่องเที่ยวและกีฬา</h2>
          <p>เลขที่ 120 หมู่ 3 ศูนย์ราชการเฉลิมพระเกียรติ 80 พรรษา<br>
          อาคารรัฐประศาสนภักดี (อาคาร B) ชั้น 2<br>
          ถนนแจ้งวัฒนะ แขวงทุ่งสองห้อง เขตหลักสี่<br>
          กรุงเทพมหานคร 10210</p>
          <p style="margin-top:18px">
            <a href="tel:022831555">โทรศัพท์ 0 2283 1555</a><br>
            <a href="mailto:policy.tkc@mots.go.th">policy.tkc@mots.go.th</a>
          </p>
        </article>
        <article class="fp-contact-panel alt fp-reveal">
          <h2>Thailand Sports Almanac</h2>
          <p>แพลตฟอร์มข้อมูลกีฬาแห่งชาติ เพื่อให้ประชาชน หน่วยงาน และนักกีฬาเข้าถึงข้อมูลสนาม กิจกรรม และสถิติได้อย่างโปร่งใส</p>
          <p style="margin-top:18px">
            <a href="https://sports-almanac.go.th/" target="_blank" rel="noopener">เว็บไซต์หลัก ↗</a><br>
            <a href="abouts.html">เกี่ยวกับโครงการ</a><br>
            <a href="overview.html">สรุปภาพรวมข้อมูล</a>
          </p>
        </article>
      </div>
    </div>''',
        [
            "assets/design-language.js?v=20260820-3",
            "assets/portal-nav.js?v=20260820-1",
        ],
    )


if __name__ == "__main__":
    main()
