(() => {
  const TYPE_META = {
    stadium: {
      label: "สนามกีฬา",
      lead: "สนามกีฬารายจังหวัดและสถานที่แข่งขันหลักทั่วประเทศ",
    },
    multipurpose: {
      label: "อาคารอเนกประสงค์",
      lead: "อาคารอเนกประสงค์และฮอลล์สำหรับกิจกรรมกีฬารวม",
    },
    public: {
      label: "ลานกีฬา / สวนสาธารณะ",
      lead: "ลานกีฬาชุมชน สวนสาธารณะ และพื้นที่ออกกำลังกายเปิดโล่ง",
    },
    fitness: {
      label: "ฟิตเนส / ยิม",
      lead: "ห้องฟิตเนส ยิม และสถานที่ออกกำลังกายในร่ม",
    },
    training: {
      label: "ศูนย์ฝึกกีฬา",
      lead: "ศูนย์ฝึกและค่ายฝึกนักกีฬาระดับจังหวัดถึงชาติ",
    },
    science: {
      label: "ศูนย์วิทยาศาสตร์การกีฬา",
      lead: "ศูนย์วิทยาศาสตร์การกีฬาและการประเมินสมรรถภาพ",
    },
  };

  const HUMAN_BANDS = [
    {
      img: "assets/images/about-human.jpg",
      kicker: "Human Touch",
      text: "สนามกีฬาไม่ใช่แค่พิกัดบนแผนที่ แต่คือพื้นที่ที่คนไทยได้วิ่ง ได้แข่ง และได้เชียร์ด้วยกัน",
    },
    {
      img: "assets/images/hero-sports-thailand.png",
      kicker: "ทุกจังหวัด",
      text: "จากลานชุมชนถึงสนามใหญ่ — เลือกสถานที่ที่เหมาะกับการฝึกซ้อมและการแข่งขันของคุณ",
    },
    {
      img: "assets/images/training-1.jpg",
      kicker: "พร้อมลงสนาม",
      text: "ดูชนิดกีฬา ค่าบริการ และแผนที่ก่อนออกเดินทาง เพื่อให้ทุกครั้งที่ไปสนามคุ้มค่าที่สุด",
    },
  ];

  function venueFacilityType(name = "") {
    const value = String(name).toLowerCase();
    if (/วิทยาศาสตร์การกีฬา|sports science/.test(value)) return "science";
    if (/ศูนย์ฝึก|ศูนย์กีฬา|training|สถาบันกีฬา|โรงเรียนกีฬา/.test(value)) return "training";
    if (/ฟิตเนส|fitness|ยิม|gym|ห้องออกกำลังกาย|ศูนย์ออกกำลังกาย|เพาะกาย/.test(value)) return "fitness";
    if (/ลานกีฬา|สวนสาธารณะ|สวนสุขภาพ|สนามเด็กเล่น|ลานอเนกประสงค์/.test(value)) return "public";
    if (/อาคารอเนกประสงค์|อเนกประสงค์|ยิมเนเซียม|gymnasium|โดมกีฬา|อาคารกีฬา/.test(value)) return "multipurpose";
    return "stadium";
  }

  const VENUE_IMAGES = [
    "assets/images/stadium-1.jpg",
    "assets/images/stadium-2.jpg",
    "assets/images/stadium-3.jpg",
    "assets/images/training-1.jpg",
  ];

  const PAGE_SIZE = 18;
  const HUMAN_EVERY = 6;
  const extras = window.VenueExtras;

  const params = new URLSearchParams(location.search);
  let currentType = TYPE_META[params.get("type")] ? params.get("type") : "stadium";
  let currentProvince = params.get("province") || "";
  let searchQuery = "";
  let page = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
  let allVenues = [];
  let filtered = [];
  let renderToken = 0;

  const els = {
    title: document.getElementById("venues-title"),
    lead: document.getElementById("venues-lead"),
    search: document.getElementById("venues-search"),
    province: document.getElementById("venues-province"),
    count: document.getElementById("venues-count"),
    grid: document.getElementById("venues-grid"),
    pagination: document.getElementById("venues-pagination"),
    typeRow: document.getElementById("venues-type-row"),
  };

  function fallbackImage(index) {
    return VENUE_IMAGES[index % VENUE_IMAGES.length];
  }

  function classifyVenue(v) {
    return venueFacilityType(v.name);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function isFreeFee(fee = "") {
    return /ไม่มีค่าใช้จ่าย|ฟรี|ไม่เก็บ|ไม่มีค่า/.test(String(fee));
  }

  function isClosedStatus(status = "") {
    return /ปิด/.test(String(status));
  }

  function syncUrl() {
    const next = new URLSearchParams();
    next.set("type", currentType);
    if (currentProvince) next.set("province", currentProvince);
    if (searchQuery) next.set("q", searchQuery);
    if (page > 1) next.set("page", String(page));
    history.replaceState(null, "", `${location.pathname}?${next.toString()}`);
  }

  function updateHero() {
    const meta = TYPE_META[currentType];
    els.title.textContent = meta.label;
    els.lead.textContent = meta.lead;
    document.title = `${meta.label} — Thailand Sports Almanac`;
    renderTypeChips();
  }

  function renderTypeChips() {
    if (!els.typeRow) return;
    els.typeRow.innerHTML = Object.entries(TYPE_META)
      .map(
        ([key, meta]) =>
          `<button type="button" class="venues-type-chip${key === currentType ? " is-active" : ""}" data-type="${key}">${escapeHtml(meta.label)}</button>`
      )
      .join("");
    els.typeRow.querySelectorAll("[data-type]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.type;
        if (!TYPE_META[next] || next === currentType) return;
        currentType = next;
        page = 1;
        applyFilters();
      });
    });
  }

  function populateProvinces(venues) {
    const set = new Set();
    venues.forEach((v) => {
      if (v.province) set.add(v.province);
    });
    const list = [...set].sort((a, b) => a.localeCompare(b, "th"));
    els.province.innerHTML =
      `<option value="">ทุกจังหวัด</option>` +
      list.map((p) => `<option value="${escapeHtml(p)}"${p === currentProvince ? " selected" : ""}>${escapeHtml(p)}</option>`).join("");
  }

  function applyFilters() {
    const q = searchQuery.trim().toLowerCase();
    filtered = allVenues.filter((v) => {
      if (classifyVenue(v) !== currentType) return false;
      if (currentProvince && v.province !== currentProvince) return false;
      if (!q) return true;
      const hay = `${v.name} ${v.sport} ${v.province}`.toLowerCase();
      return hay.includes(q);
    });
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > maxPage) page = maxPage;
    render();
  }

  function cardImage(venue, index) {
    return extras?.coverFor(venue.id, fallbackImage(index)) || fallbackImage(index);
  }

  function renderSkeleton() {
    els.grid.innerHTML = Array.from({ length: 6 }, () => {
      return `<div class="venues-skel-card venues-reveal is-in" aria-hidden="true">
        <div class="venues-skel venues-skel-media"></div>
        <div class="venues-skel venues-skel-line"></div>
        <div class="venues-skel venues-skel-line short"></div>
      </div>`;
    }).join("");
  }

  function envLabel(env) {
    if (env === "indoor") return "ในร่ม";
    if (env === "outdoor") return "กลางแจ้ง";
    return "";
  }

  function badgeHtml(detail, venue) {
    const badges = [];
    const typeLabel = detail?.stadiumType || TYPE_META[classifyVenue(venue)].label;
    badges.push(`<span class="venue-badge">${escapeHtml(typeLabel)}</span>`);

    if (detail?.status) {
      const closed = isClosedStatus(detail.status);
      badges.push(
        `<span class="venue-badge ${closed ? "is-closed" : "is-open"}">${escapeHtml(
          closed ? detail.status : "เปิดบริการ"
        )}</span>`
      );
    }

    if (detail?.fee && isFreeFee(detail.fee)) {
      badges.push(`<span class="venue-badge is-free">เข้าฟรี</span>`);
    }

    const sportCount = (detail?.sports || []).length;
    if (sportCount > 1) {
      badges.push(`<span class="venue-badge">${sportCount} ชนิดกีฬา</span>`);
    }

    return badges.slice(0, 3).join("");
  }

  function chipHtml(detail, venue) {
    const chips = [];
    const sports = detail?.sports?.length ? detail.sports.slice(0, 3) : venue.sport ? [venue.sport] : [];
    sports.forEach((s) => chips.push(`<span>${escapeHtml(s)}</span>`));
    const env = envLabel(venue.env);
    if (env) chips.push(`<span>${env}</span>`);
    if (!chips.length) return "";
    return chips.join("");
  }

  function humanBandHtml(index) {
    const band = HUMAN_BANDS[index % HUMAN_BANDS.length];
    return `<article class="venues-human-band venues-reveal">
      <img src="${band.img}" alt="" loading="lazy" width="800" height="500">
      <div class="venues-human-copy">
        <p class="venues-kicker">${escapeHtml(band.kicker)}</p>
        <p>${escapeHtml(band.text)}</p>
      </div>
    </article>`;
  }

  function cardHtml(v, idx, detail) {
    const img = cardImage(v, idx);
    const href = extras?.detailHref({ ...v, type: currentType }) || `venue.html?id=${encodeURIComponent(v.id || "")}`;
    const provinceLine = [v.province, detail?.district].filter(Boolean).join(" · ");
    return `
      <a class="venue-card venues-reveal" role="listitem" href="${escapeHtml(href)}" data-venue-id="${escapeHtml(String(v.id || ""))}">
        <div class="venue-card-media">
          <img src="${img}" alt="" loading="lazy" width="640" height="400">
          <div class="venue-card-badges" data-badges>${badgeHtml(detail, v)}</div>
        </div>
        <div class="venue-card-body">
          <small data-type-label>${escapeHtml(detail?.stadiumType || TYPE_META[classifyVenue(v)].label)}</small>
          <strong>${escapeHtml(v.name)}</strong>
          <p>${escapeHtml(provinceLine || "—")}</p>
          <div class="venue-card-chips" data-chips>${chipHtml(detail, v)}</div>
        </div>
      </a>`;
  }

  function wireReveals() {
    const nodes = [...document.querySelectorAll(".venues-reveal")].filter((n) => !n.classList.contains("is-in"));
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    nodes.forEach((n, i) => {
      n.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
      io.observe(n);
    });
  }

  async function enrichVisible(slice, token) {
    await Promise.all(
      slice.map(async (v) => {
        if (!v?.id) return;
        try {
          const detail = await extras?.loadDetail(v.id);
          if (token !== renderToken || !detail) return;
          const card = els.grid.querySelector(`[data-venue-id="${String(v.id).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`);
          if (!card) return;
          const badges = card.querySelector("[data-badges]");
          const chips = card.querySelector("[data-chips]");
          const typeLabel = card.querySelector("[data-type-label]");
          if (badges) badges.innerHTML = badgeHtml(detail, v);
          if (chips) chips.innerHTML = chipHtml(detail, v);
          if (typeLabel && detail.stadiumType) typeLabel.textContent = detail.stadiumType;
        } catch {
          /* ignore enrich errors */
        }
      })
    );
  }

  function render() {
    updateHero();
    const total = filtered.length;
    const start = (page - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);
    const token = ++renderToken;

    els.count.textContent =
      total === 0
        ? "ไม่พบสนามที่ตรงกับเงื่อนไข"
        : `แสดง ${start + 1}–${Math.min(start + PAGE_SIZE, total)} จาก ${total.toLocaleString("th-TH")} แห่ง`;

    if (!slice.length) {
      els.grid.innerHTML = `<p class="venues-empty">ลองเปลี่ยนคำค้น หรือจังหวัด</p>`;
      els.pagination.innerHTML = "";
      syncUrl();
      return;
    }

    const parts = [];
    let humanIndex = 0;
    slice.forEach((v, i) => {
      if (i > 0 && i % HUMAN_EVERY === 0) {
        parts.push(humanBandHtml(humanIndex));
        humanIndex += 1;
      }
      parts.push(cardHtml(v, start + i, null));
    });

    els.grid.innerHTML = parts.join("");
    renderPagination(total);
    syncUrl();
    wireReveals();
    enrichVisible(slice, token);
  }

  function renderPagination(total) {
    const pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) {
      els.pagination.innerHTML = "";
      return;
    }

    const buttons = [];
    buttons.push(`<button type="button" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>ก่อนหน้า</button>`);

    const windowStart = Math.max(1, page - 2);
    const windowEnd = Math.min(pages, page + 2);
    if (windowStart > 1) {
      buttons.push(`<button type="button" data-page="1">1</button>`);
      if (windowStart > 2) buttons.push(`<span aria-hidden="true">…</span>`);
    }
    for (let p = windowStart; p <= windowEnd; p += 1) {
      buttons.push(
        `<button type="button" data-page="${p}" ${p === page ? 'aria-current="page"' : ""}>${p}</button>`
      );
    }
    if (windowEnd < pages) {
      if (windowEnd < pages - 1) buttons.push(`<span aria-hidden="true">…</span>`);
      buttons.push(`<button type="button" data-page="${pages}">${pages}</button>`);
    }
    buttons.push(`<button type="button" data-page="${page + 1}" ${page >= pages ? "disabled" : ""}>ถัดไป</button>`);

    els.pagination.innerHTML = buttons.join("");
    els.pagination.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = Number(btn.dataset.page);
        if (!next || next === page) return;
        page = next;
        applyFilters();
        window.scrollTo({ top: Math.max(0, els.grid.offsetTop - 100), behavior: "smooth" });
      });
    });
  }

  async function init() {
    updateHero();
    renderSkeleton();
    els.count.textContent = "กำลังโหลดข้อมูลสนาม…";
    await extras?.loadCovers();

    if (params.get("q")) {
      searchQuery = params.get("q");
      els.search.value = searchQuery;
    }

    els.province.addEventListener("change", () => {
      currentProvince = els.province.value;
      page = 1;
      applyFilters();
    });

    let debounce;
    els.search.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        searchQuery = els.search.value;
        page = 1;
        applyFilters();
      }, 220);
    });

    try {
      const res = await fetch("assets/data/national-sports-map.json");
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      const rows = data.venues || data || [];
      allVenues = rows.map((row) => {
        if (Array.isArray(row)) {
          return {
            lat: row[0],
            lon: row[1],
            name: row[2] || "สนามไม่ระบุชื่อ",
            province: row[3] || "",
            sport: row[4] || "",
            env: row[5] || "outdoor",
            id: row[6] || null,
          };
        }
        return row;
      });
      populateProvinces(allVenues);
      applyFilters();
    } catch (err) {
      els.count.textContent = "โหลดข้อมูลสนามไม่สำเร็จ กรุณาลองใหม่";
      els.grid.innerHTML = `<p class="venues-empty">ไม่สามารถโหลดข้อมูลสนามได้</p>`;
      console.error(err);
    }
  }

  init();
})();
