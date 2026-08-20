(() => {
  const els = {
    search: document.getElementById("res-search"),
    year: document.getElementById("res-year"),
    count: document.getElementById("res-count"),
    list: document.getElementById("res-list"),
    stats: document.getElementById("res-stats"),
    skeleton: document.getElementById("res-skeleton"),
  };

  let data = null;

  function esc(s) {
    return window.Portal.escapeHtml(s);
  }

  function renderStats() {
    if (!els.stats || !data) return;
    const s = data.stats || {};
    els.stats.innerHTML = [
      [s.competitions, "รายการแข่งขัน"],
      [s.results, "ผลที่บันทึก"],
      [s.gold, "เหรียญทอง"],
      [s.silver, "เหรียญเงิน"],
    ]
      .map(
        ([n, label]) =>
          `<div class="fp-stat fp-reveal"><strong data-count="${n || 0}">0</strong><span>${label}</span></div>`
      )
      .join("");
    els.stats.querySelectorAll("[data-count]").forEach((el) => {
      window.DesignLanguage?.animateCount(el, el.dataset.count);
    });
  }

  function fillYears() {
    if (!els.year) return;
    const years = [...new Set((data.competitions || []).map((c) => c.year).filter(Boolean))].sort((a, b) =>
      b.localeCompare(a)
    );
    els.year.innerHTML =
      '<option value="">ทุกปี</option>' + years.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
  }

  function medals(r) {
    return [
      r.gold
        ? `<div class="fp-medal gold"><i>GOLD</i><span>${esc(r.gold)}${r.goldProvince ? ` · ${esc(r.goldProvince)}` : ""}</span></div>`
        : "",
      r.silver
        ? `<div class="fp-medal silver"><i>SILVER</i><span>${esc(r.silver)}${r.silverProvince ? ` · ${esc(r.silverProvince)}` : ""}</span></div>`
        : "",
      r.bronze
        ? `<div class="fp-medal bronze"><i>BRONZE</i><span>${esc(r.bronze)}${r.bronzeProvince ? ` · ${esc(r.bronzeProvince)}` : ""}</span></div>`
        : "",
    ]
      .filter(Boolean)
      .join("");
  }

  function applyFilter() {
    const q = (els.search?.value || "").trim().toLowerCase();
    const year = els.year?.value || "";
    const comps = (data.competitions || []).filter((c) => {
      if (year && c.year !== year) return false;
      if (!q) return true;
      const hay = [c.name, c.province, c.place, ...(c.results || []).map((r) => r.sport)].join(" ").toLowerCase();
      return hay.includes(q);
    });

    if (els.count) {
      els.count.innerHTML = comps.length
        ? `แสดง <b>${comps.length.toLocaleString("th-TH")}</b> รายการ`
        : "ไม่พบรายการที่ตรงเงื่อนไข";
    }

    if (!els.list) return;
    if (!comps.length) {
      els.list.innerHTML = `<div class="fp-empty">ลองเปลี่ยนปีหรือคำค้น</div>`;
      return;
    }

    els.list.innerHTML = comps
      .map((c) => {
        const results = (c.results || [])
          .map(
            (r) => `<div style="margin-top:12px">
              <strong style="display:block;font-size:.88rem;margin-bottom:8px">${esc(r.sport || "ชนิดกีฬา")}</strong>
              <div class="fp-podium">${medals(r) || "<p style='margin:0;color:#5a6f86;font-size:.88rem'>ยังไม่มีรายชื่อผู้ชนะ</p>"}</div>
            </div>`
          )
          .join("");
        return `<article class="fp-board fp-reveal">
          <div class="fp-board-top"><small>${esc(c.dateDisplay || c.year || "")}</small></div>
          <h3>${esc(c.name)}</h3>
          <p>${esc([c.level, c.province, c.place || c.district].filter(Boolean).join(" · "))}</p>
          ${results || "<p>ยังไม่มีผลการแข่งขันในรายการนี้</p>"}
        </article>`;
      })
      .join("");
    window.DesignLanguage?.wireReveals(".fp-reveal");
  }

  async function init() {
    try {
      const res = await fetch("assets/data/results.json");
      data = await res.json();
    } catch {
      if (els.count) els.count.textContent = "โหลดข้อมูลไม่สำเร็จ";
      if (els.skeleton) els.skeleton.hidden = true;
      return;
    }
    if (els.skeleton) els.skeleton.hidden = true;
    renderStats();
    fillYears();
    applyFilter();
    let t;
    els.search?.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(applyFilter, 160);
    });
    els.year?.addEventListener("change", applyFilter);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
