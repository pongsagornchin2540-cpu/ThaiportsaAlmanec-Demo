(() => {
  const els = {
    grid: document.getElementById("course-grid"),
    count: document.getElementById("course-count"),
    search: document.getElementById("course-search"),
    skeleton: document.getElementById("course-skeleton"),
  };

  let courses = [];

  function esc(s) {
    return window.Portal.escapeHtml(s);
  }

  function render(list) {
    if (els.count) {
      els.count.innerHTML = list.length
        ? `แสดง <b>${list.length.toLocaleString("th-TH")}</b> หลักสูตร`
        : "ไม่พบหลักสูตร";
    }
    if (!els.grid) return;
    if (!list.length) {
      els.grid.innerHTML = `<div class="fp-empty">ลองเปลี่ยนคำค้น</div>`;
      return;
    }
    els.grid.innerHTML = list
      .map((c, index) => {
        const cover = window.Portal.coverOr(c.image_cover || "assets/images/training-1.jpg");
        return `<button type="button" class="fp-course fp-reveal" data-course-index="${index}">
          <div class="fp-course-media"><img src="${esc(cover)}" alt="" loading="lazy" width="400" height="300"></div>
          <div>
            <small>${esc([c.category_name, c.level_name, c.date_display].filter(Boolean).join(" · "))}</small>
            <strong>${esc(c.name)}</strong>
            <p>${esc(c.location_display || "สถานที่จัดอบรม")}</p>
          </div>
          <span class="fp-course-go" aria-hidden="true">↗</span>
        </button>`;
      })
      .join("");

    els.grid.querySelectorAll("[data-course-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const course = list[Number(btn.dataset.courseIndex)];
        if (course && window.ActivityModal?.openCourse) window.ActivityModal.openCourse(course);
      });
    });
    window.DesignLanguage?.wireReveals(".fp-reveal");
  }

  function applyFilter() {
    const q = (els.search?.value || "").trim().toLowerCase();
    const list = !q
      ? courses
      : courses.filter((c) =>
          [c.name, c.category_name, c.location_display, c.level_name].join(" ").toLowerCase().includes(q)
        );
    render(list);
  }

  async function init() {
    try {
      const res = await fetch("assets/data/training-courses.json");
      const data = await res.json();
      courses = data.courses || [];
    } catch {
      if (els.count) els.count.textContent = "โหลดหลักสูตรไม่สำเร็จ";
      if (els.skeleton) els.skeleton.hidden = true;
      return;
    }
    if (els.skeleton) els.skeleton.hidden = true;
    applyFilter();
    let t;
    els.search?.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(applyFilter, 160);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
