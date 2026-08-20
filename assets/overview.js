(() => {
  const els = {
    stats: document.getElementById("ov-stats"),
    sports: document.getElementById("ov-sports"),
    provinces: document.getElementById("ov-provinces"),
    growth: document.getElementById("ov-growth"),
    quality: document.getElementById("ov-quality"),
    skeleton: document.getElementById("ov-skeleton"),
  };

  function esc(s) {
    return window.Portal.escapeHtml(s);
  }

  function topEntries(obj, n = 8) {
    return Object.entries(obj || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }

  function barRows(entries, max) {
    return entries
      .map(([label, value]) => {
        const pct = max ? Math.max(8, Math.round((value / max) * 100)) : 0;
        return `<div class="fp-bar fp-reveal">
          <span>${esc(label)}</span>
          <strong>${value.toLocaleString("th-TH")}</strong>
          <i style="--w:${pct}%"></i>
        </div>`;
      })
      .join("");
  }

  async function init() {
    let data;
    try {
      const res = await fetch("assets/data/overview-summary.json");
      data = await res.json();
    } catch {
      if (els.skeleton) els.skeleton.innerHTML = `<div class="fp-empty">โหลดสรุปภาพรวมไม่สำเร็จ</div>`;
      return;
    }
    if (els.skeleton) els.skeleton.hidden = true;

    const t = data.totals || {};
    if (els.stats) {
      const cards = [
        ["สนาม / สถานที่", t.stadiums],
        ["กิจกรรม", t.events],
        ["นักกีฬา", t.athletes],
        ["บุคลากร", t.personal],
        ["การแข่งขัน", t.competitions],
        ["ผลการแข่งขัน", t.results],
        ["ศูนย์ฝึก", t.training],
        ["ศูนย์วิทยาศาสตร์", t.science],
      ];
      els.stats.innerHTML = cards
        .map(
          ([label, value]) =>
            `<div class="fp-stat fp-reveal"><strong data-count="${value || 0}">0</strong><span>${esc(label)}</span></div>`
        )
        .join("");
      els.stats.querySelectorAll("[data-count]").forEach((el) => {
        window.DesignLanguage?.animateCount(el, el.dataset.count);
      });
    }

    const sportTop = topEntries(data.sportCounts?.stadium, 10);
    if (els.sports) els.sports.innerHTML = barRows(sportTop, sportTop[0]?.[1] || 1);

    const provTop = topEntries(data.provinceCounts?.stadium, 10);
    if (els.provinces) els.provinces.innerHTML = barRows(provTop, provTop[0]?.[1] || 1);

    const months = Object.entries(data.growth?.eventMonths || {}).slice(-8);
    if (els.growth) {
      const max = Math.max(...months.map(([, v]) => v), 1);
      els.growth.innerHTML = barRows(
        months.map(([k, v]) => {
          const [y, m] = k.split("-");
          return [`${Number(m)}/${Number(y) + 543}`, v];
        }),
        max
      );
    }

    if (els.quality) {
      const q = data.quality || {};
      const sig = data.signals || {};
      els.quality.innerHTML = `
        <div class="fp-quality">
          <div><dt>สนามมีพิกัด</dt><dd>${(q.coordinates?.stadium || 0).toLocaleString("th-TH")}</dd></div>
          <div><dt>กิจกรรมมีพิกัด</dt><dd>${(q.coordinates?.event || 0).toLocaleString("th-TH")}</dd></div>
          <div><dt>เหรียญทองที่บันทึก</dt><dd>${(q.awards?.gold || 0).toLocaleString("th-TH")}</dd></div>
          <div><dt>กิจกรรมในอนาคต</dt><dd>${(sig.futureEvents || 0).toLocaleString("th-TH")}</dd></div>
        </div>`;
    }

    window.DesignLanguage?.wireReveals(".fp-reveal");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
