(() => {
  const els = {
    search: document.getElementById("people-search"),
    kind: document.getElementById("people-kind"),
    sport: document.getElementById("people-sport"),
    province: document.getElementById("people-province"),
    count: document.getElementById("people-count"),
    grid: document.getElementById("people-grid"),
    stats: document.getElementById("people-stats"),
    skeleton: document.getElementById("people-skeleton"),
  };

  let data = null;
  let filtered = [];

  function esc(s) {
    return window.Portal.escapeHtml(s);
  }

  function allPeople() {
    const athletes = (data.athletes || []).map((a) => ({ ...a, roleLabel: "นักกีฬา" }));
    const personnel = (data.personnel || []).map((p) => ({ ...p, roleLabel: p.role || "บุคลากร" }));
    return [...athletes, ...personnel];
  }

  function renderStats() {
    if (!els.stats || !data) return;
    const s = data.stats || {};
    els.stats.innerHTML = [
      ["athletes", "นักกีฬา"],
      ["personnel", "บุคลากร"],
      ["sports", "ชนิดกีฬา"],
      ["provinces", "จังหวัด"],
    ]
      .map(
        ([key, label]) =>
          `<div class="fp-stat fp-reveal"><strong data-count="${s[key] || 0}">0</strong><span>${label}</span></div>`
      )
      .join("");
    els.stats.querySelectorAll("[data-count]").forEach((el) => {
      window.DesignLanguage?.animateCount(el, el.dataset.count);
    });
  }

  function fillFilters() {
    const people = allPeople();
    const sports = [...new Set(people.map((p) => p.sport).filter(Boolean))].sort((a, b) => a.localeCompare(b, "th"));
    const provinces = [...new Set(people.map((p) => p.province).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "th")
    );
    if (els.sport) {
      els.sport.innerHTML =
        '<option value="">ทุกชนิดกีฬา</option>' + sports.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("");
    }
    if (els.province) {
      els.province.innerHTML =
        '<option value="">ทุกจังหวัด</option>' +
        provinces.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
    }
  }

  function applyFilter() {
    const q = (els.search?.value || "").trim().toLowerCase();
    const kind = els.kind?.value || "";
    const sport = els.sport?.value || "";
    const province = els.province?.value || "";
    filtered = allPeople().filter((p) => {
      if (kind === "athlete" && p.kind !== "athlete") return false;
      if (kind === "personnel" && p.kind !== "personnel") return false;
      if (sport && p.sport !== sport) return false;
      if (province && p.province !== province) return false;
      if (!q) return true;
      return [p.name, p.sport, p.province, p.roleLabel, p.level].join(" ").toLowerCase().includes(q);
    });
    renderGrid();
  }

  function renderGrid() {
    if (els.count) {
      els.count.innerHTML = filtered.length
        ? `แสดง <b>${filtered.length.toLocaleString("th-TH")}</b> รายชื่อ`
        : "ไม่พบรายชื่อที่ตรงเงื่อนไข";
    }
    if (!els.grid) return;
    if (!filtered.length) {
      els.grid.innerHTML = `<div class="fp-empty">ลองเปลี่ยนตัวกรองหรือคำค้น</div>`;
      return;
    }
    els.grid.innerHTML = filtered
      .map((p) => {
        const initial = (p.firstName || p.name || "?").charAt(0);
        return `<article class="fp-player fp-reveal">
          <div class="fp-jersey" aria-hidden="true">${esc(initial)}</div>
          <div>
            <strong>${esc(p.name)}</strong>
            <span>${esc([p.sport, p.province, p.gender, p.year ? `ปี ${p.year}` : ""].filter(Boolean).join(" · "))}</span>
          </div>
          <em>${esc(p.roleLabel)}${p.level ? ` · ${esc(p.level)}` : ""}</em>
        </article>`;
      })
      .join("");
    window.DesignLanguage?.wireReveals(".fp-reveal");
  }

  async function init() {
    try {
      const res = await fetch("assets/data/people.json");
      data = await res.json();
    } catch {
      if (els.count) els.count.textContent = "โหลดข้อมูลไม่สำเร็จ";
      if (els.skeleton) els.skeleton.hidden = true;
      return;
    }
    if (els.skeleton) els.skeleton.hidden = true;
    renderStats();
    fillFilters();
    applyFilter();

    let t;
    els.search?.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(applyFilter, 160);
    });
    els.kind?.addEventListener("change", applyFilter);
    els.sport?.addEventListener("change", applyFilter);
    els.province?.addEventListener("change", applyFilter);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
