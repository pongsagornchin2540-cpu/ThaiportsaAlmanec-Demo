(() => {
  const PAGE_SIZE = 12;
  const MONTHS_TH = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  let data = null;
  let filtered = [];
  let page = 1;
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  const els = {
    featured: document.getElementById("featured-grid"),
    search: document.getElementById("act-search"),
    province: document.getElementById("act-province"),
    count: document.getElementById("act-count"),
    list: document.getElementById("act-list"),
    pagination: document.getElementById("act-pagination"),
    calTitle: document.getElementById("cal-title"),
    calGrid: document.getElementById("cal-grid"),
    calPrev: document.getElementById("cal-prev"),
    calNext: document.getElementById("cal-next"),
    skeleton: document.getElementById("act-skeleton"),
    totalChip: document.getElementById("act-total-chip"),
  };

  function esc(s) {
    return window.Portal.escapeHtml(s);
  }

  function dayParts(start, dateDisplay) {
    if (start && /^\d{4}-\d{2}-\d{2}/.test(start)) {
      const d = Number(start.slice(8, 10));
      const m = Number(start.slice(5, 7));
      return { day: String(d), mon: MONTHS_TH[m - 1]?.slice(0, 3) || "" };
    }
    const bits = String(dateDisplay || "").split(/\s+/);
    return { day: bits[0] || "—", mon: bits[1] || "" };
  }

  function posterHtml(ev) {
    const cover = window.Portal.coverOr(ev.cover);
    return `<a class="fp-poster fp-reveal" href="activity.html?id=${encodeURIComponent(ev.id)}" data-activity-id="${esc(ev.id)}" role="listitem">
      <div class="fp-poster-bg"><img src="${esc(cover)}" alt="" loading="lazy" width="640" height="900"></div>
      <div class="fp-poster-body">
        <small>${esc(ev.dateDisplay || "กิจกรรมเด่น")}</small>
        <strong>${esc(ev.name || "กิจกรรม")}</strong>
        <span>${esc([ev.sport, ev.province || ev.location].filter(Boolean).join(" · ") || "ทั่วประเทศ")}</span>
      </div>
    </a>`;
  }

  function timeHtml(ev) {
    const { day, mon } = dayParts(ev.start, ev.dateDisplay);
    return `<a class="fp-time-item fp-reveal" href="activity.html?id=${encodeURIComponent(ev.id)}" data-activity-id="${esc(ev.id)}">
      <div class="fp-time-day"><strong>${esc(day)}</strong><small>${esc(mon)}</small></div>
      <div class="fp-time-copy">
        <strong>${esc(ev.name)}</strong>
        <span>${esc([ev.sport, ev.location || ev.province, ev.owner].filter(Boolean).join(" · "))}</span>
      </div>
      <span class="fp-time-tag">${esc(ev.level || ev.sport || "กิจกรรม")}</span>
    </a>`;
  }

  function openEvent(ev, event) {
    if (!ev) return;
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (event) event.preventDefault();
    if (window.ActivityModal) window.ActivityModal.open(ev);
    else location.href = `activity.html?id=${encodeURIComponent(ev.id)}`;
  }

  function wireActivityLinks(root) {
    (root || document).querySelectorAll("[data-activity-id]").forEach((el) => {
      if (el.dataset.modalBound === "1") return;
      el.dataset.modalBound = "1";
      el.addEventListener("click", (event) => {
        const id = el.dataset.activityId;
        const ev = (data?.events || []).find((item) => String(item.id) === String(id));
        openEvent(ev, event);
      });
    });
  }

  function applyFilter() {
    const q = (els.search?.value || "").trim().toLowerCase();
    const prov = els.province?.value || "";
    filtered = (data?.events || []).filter((ev) => {
      if (prov && ev.province !== prov) return false;
      if (!q) return true;
      const hay = [ev.name, ev.sport, ev.province, ev.location, ev.owner, ev.place].join(" ").toLowerCase();
      return hay.includes(q);
    });
    page = 1;
    renderList();
    renderCalendar();
  }

  const motionReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let featuredScrollFrame = null;
  let featuredPaused = false;
  let featuredResumeTimer = null;

  function stopFeaturedAutoScroll() {
    if (featuredScrollFrame) cancelAnimationFrame(featuredScrollFrame);
    featuredScrollFrame = null;
  }

  function startFeaturedAutoScroll() {
    const rail = els.featured;
    if (!rail || motionReduced) return;
    stopFeaturedAutoScroll();
    const tick = () => {
      if (!featuredPaused && rail.classList.contains("is-auto-scroll")) {
        rail.scrollLeft += 0.55;
        const loopPoint = rail.scrollWidth / 2;
        if (loopPoint > 0 && rail.scrollLeft >= loopPoint) rail.scrollLeft = 0;
      }
      featuredScrollFrame = requestAnimationFrame(tick);
    };
    featuredScrollFrame = requestAnimationFrame(tick);
  }

  function pauseFeaturedAutoScroll(permanent = false) {
    featuredPaused = true;
    els.featured?.classList.add("is-paused");
    if (featuredResumeTimer) clearTimeout(featuredResumeTimer);
    if (!permanent) {
      featuredResumeTimer = setTimeout(() => {
        featuredPaused = false;
        els.featured?.classList.remove("is-paused");
      }, 2800);
    }
  }

  function wireFeaturedAutoScroll(itemCount) {
    const rail = els.featured;
    if (!rail) return;
    if (rail.dataset.autoScrollBound === "1") return;
    rail.dataset.autoScrollBound = "1";

    rail.addEventListener("mouseenter", () => pauseFeaturedAutoScroll(true));
    rail.addEventListener("mouseleave", () => {
      featuredPaused = false;
      rail.classList.remove("is-paused");
    });
    rail.addEventListener("focusin", () => pauseFeaturedAutoScroll(true));
    rail.addEventListener("focusout", (event) => {
      if (!rail.contains(event.relatedTarget)) {
        featuredPaused = false;
        rail.classList.remove("is-paused");
      }
    });
    rail.addEventListener("wheel", () => pauseFeaturedAutoScroll(), { passive: true });
    rail.addEventListener("touchstart", () => pauseFeaturedAutoScroll(), { passive: true });
    rail.addEventListener("pointerdown", () => pauseFeaturedAutoScroll());
  }

  function renderFeatured() {
    if (!els.featured) return;
    const items = data.featured?.length ? data.featured : (data.events || []).slice(0, 8);
    const html = items.map(posterHtml).join("");
    const canLoop = items.length > 1 && !motionReduced;
    // Duplicate strip for seamless marquee loop.
    els.featured.innerHTML = canLoop ? html + html : html;
    els.featured.scrollLeft = 0;
    els.featured.classList.toggle("is-auto-scroll", canLoop);
    wireActivityLinks(els.featured);
    wireFeaturedAutoScroll(items.length);
    if (canLoop) startFeaturedAutoScroll();
    else stopFeaturedAutoScroll();
    reveal();
  }

  function renderList() {
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (page > pages) page = pages;
    const start = (page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    if (els.count) {
      els.count.innerHTML = total
        ? `พบ <b>${total.toLocaleString("th-TH")}</b> กิจกรรม${els.province?.value ? ` ใน${esc(els.province.value)}` : ""}`
        : "ไม่พบกิจกรรมที่ตรงเงื่อนไข";
    }

    if (els.list) {
      els.list.innerHTML = slice.length
        ? slice.map(timeHtml).join("")
        : `<div class="fp-empty">ลองเปลี่ยนคำค้นหรือจังหวัด</div>`;
      wireActivityLinks(els.list);
    }

    if (els.pagination) {
      if (pages <= 1) {
        els.pagination.innerHTML = "";
      } else {
        const windowStart = Math.max(1, page - 2);
        const windowEnd = Math.min(pages, windowStart + 4);
        const buttons = [];
        for (let i = windowStart; i <= windowEnd; i++) {
          buttons.push(
            `<button type="button" data-page="${i}" ${i === page ? 'aria-current="page"' : ""}>${i}</button>`
          );
        }
        els.pagination.innerHTML = buttons.join("");
        els.pagination.querySelectorAll("button").forEach((btn) => {
          btn.addEventListener("click", () => {
            page = Number(btn.dataset.page);
            renderList();
            els.list?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }
    }

    reveal();
  }

  function eventsOnDay(y, m, d) {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return filtered.filter((ev) => {
      if (!ev.start) return false;
      const s = ev.start;
      const e = ev.end || ev.start;
      return s <= key && key <= e;
    });
  }

  function renderCalendar() {
    if (!els.calGrid || !els.calTitle) return;
    els.calTitle.textContent = `${MONTHS_TH[calMonth]} ${calYear + 543}`;
    const first = new Date(calYear, calMonth, 1);
    const startDow = first.getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < 7; i++) {
      cells.push(`<div class="dow">${["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][i]}</div>`);
    }
    for (let i = 0; i < startDow; i++) cells.push(`<button type="button" class="fp-cal-day" disabled aria-hidden="true"></button>`);
    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = eventsOnDay(calYear, calMonth, d);
      const has = dayEvents.length > 0;
      const tip = has ? dayEvents[0].name : "";
      cells.push(`<button type="button" class="fp-cal-day${has ? " has-event" : ""}" data-day="${d}" ${has ? "" : "disabled"}>
        <b>${d}</b>
        ${has ? `<span title="${esc(tip)}">${esc(tip)}</span>` : ""}
      </button>`);
    }
    els.calGrid.innerHTML = cells.join("");
    els.calGrid.querySelectorAll(".has-event").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = Number(btn.dataset.day);
        const dayEvents = eventsOnDay(calYear, calMonth, d);
        if (dayEvents[0]) openEvent(dayEvents[0]);
      });
    });
  }

  function fillProvinces() {
    if (!els.province || !data) return;
    els.province.innerHTML =
      '<option value="">ทุกจังหวัด</option>' +
      (data.provinces || []).map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("");
  }

  function reveal() {
    window.DesignLanguage?.wireReveals(".fp-reveal");
  }

  async function init() {
    try {
      const res = await fetch("assets/data/events-index.json");
      if (!res.ok) throw new Error("load fail");
      data = await res.json();
    } catch {
      if (els.count) els.count.textContent = "โหลดข้อมูลกิจกรรมไม่สำเร็จ";
      if (els.skeleton) els.skeleton.hidden = true;
      return;
    }

    if (els.skeleton) els.skeleton.hidden = true;
    if (els.totalChip) els.totalChip.textContent = `${(data.total || 0).toLocaleString("th-TH")} กิจกรรม`;
    fillProvinces();
    renderFeatured();
    applyFilter();

    let t;
    els.search?.addEventListener("input", () => {
      clearTimeout(t);
      t = setTimeout(applyFilter, 180);
    });
    els.province?.addEventListener("change", applyFilter);
    els.calPrev?.addEventListener("click", () => {
      calMonth -= 1;
      if (calMonth < 0) {
        calMonth = 11;
        calYear -= 1;
      }
      renderCalendar();
    });
    els.calNext?.addEventListener("click", () => {
      calMonth += 1;
      if (calMonth > 11) {
        calMonth = 0;
        calYear += 1;
      }
      renderCalendar();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
