(() => {
  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "";

  const els = {
    hero: document.getElementById("act-hero-img"),
    title: document.getElementById("act-title"),
    lead: document.getElementById("act-lead"),
    meta: document.getElementById("act-meta"),
    body: document.getElementById("act-body"),
    actions: document.getElementById("act-actions"),
  };

  function esc(s) {
    return window.Portal.escapeHtml(s);
  }

  function fact(label, value) {
    if (!value) return "";
    return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  }

  async function init() {
    if (!id) {
      if (els.title) els.title.textContent = "ไม่พบกิจกรรม";
      if (els.lead) els.lead.textContent = "กรุณาเลือกกิจกรรมจากปฏิทินหรือรายการ";
      return;
    }

    let data;
    try {
      const res = await fetch("assets/data/events-index.json");
      data = await res.json();
    } catch {
      if (els.title) els.title.textContent = "โหลดข้อมูลไม่สำเร็จ";
      return;
    }

    const ev = (data.events || []).find((e) => String(e.id) === String(id));
    if (!ev) {
      if (els.title) els.title.textContent = "ไม่พบกิจกรรมนี้";
      if (els.lead) els.lead.textContent = "กิจกรรมอาจถูกลบหรือรหัสไม่ถูกต้อง";
      return;
    }

    document.title = `${ev.name} — Thailand Sports Almanac`;
    if (els.hero) {
      els.hero.src = window.Portal.coverOr(ev.cover);
      els.hero.alt = ev.name || "";
    }
    if (els.title) els.title.textContent = ev.name || "กิจกรรม";
    if (els.lead) {
      els.lead.textContent = [ev.sport, ev.level, ev.dateDisplay].filter(Boolean).join(" · ");
    }
    if (els.meta) {
      els.meta.innerHTML = [
        fact("วันที่", ev.dateDisplay),
        fact("ชนิดกีฬา", ev.sport),
        fact("ระดับ", ev.level),
        fact("จังหวัด", ev.province),
        fact("อำเภอ / เขต", ev.district),
        fact("สถานที่", ev.place || ev.location),
        fact("ผู้จัด", ev.owner),
      ].join("");
    }
    if (els.body) {
      els.body.innerHTML = `<p>กิจกรรมนี้รวบรวมจากฐานข้อมูล Thailand Sports Almanac เพื่อให้ประชาชนติดตามปฏิทินกีฬาและวางแผนเข้าร่วมได้สะดวกขึ้น</p>
        <p>${esc(ev.location ? `จัดขึ้นที่ ${ev.location}` : "สถานที่จัดจะอัปเดตเมื่อมีข้อมูลเพิ่มเติม")}${ev.province ? ` จังหวัด${esc(ev.province)}` : ""}</p>`;
    }
    if (els.actions) {
      const links = [`<a class="fp-btn fp-btn-ghost" href="activities.html">← กลับปฏิทิน</a>`];
      if (ev.mapUrl) {
        links.push(`<a class="fp-btn" href="${esc(ev.mapUrl)}" target="_blank" rel="noopener">เปิดแผนที่ ↗</a>`);
      }
      els.actions.innerHTML = links.join("");
    }
    window.DesignLanguage?.wireReveals(".fp-reveal");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
