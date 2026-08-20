(() => {
  const TYPE_LABELS = {
    stadium: "สนามกีฬา",
    multipurpose: "อาคารอเนกประสงค์",
    public: "ลานกีฬา / สวนสาธารณะ",
    fitness: "ฟิตเนส / ยิม",
    training: "ศูนย์ฝึกกีฬา",
    science: "ศูนย์วิทยาศาสตร์การกีฬา",
  };

  const FALLBACKS = [
    "assets/images/stadium-1.jpg",
    "assets/images/stadium-2.jpg",
    "assets/images/stadium-3.jpg",
    "assets/images/training-1.jpg",
  ];

  const extras = window.VenueExtras;
  const params = new URLSearchParams(location.search);

  const els = {
    back: document.getElementById("venue-back-link"),
    heroImg: document.getElementById("venue-hero-img"),
    thumbs: document.getElementById("venue-thumbs"),
    count: document.getElementById("venue-gallery-count"),
    prev: document.getElementById("venue-gallery-prev"),
    next: document.getElementById("venue-gallery-next"),
    tags: document.getElementById("venue-tags"),
    title: document.getElementById("venue-title"),
    summary: document.getElementById("venue-summary"),
    quickActions: document.getElementById("venue-quick-actions"),
    callBtn: document.getElementById("venue-call-btn"),
    stickyBar: document.getElementById("venue-sticky-bar"),
    stickyCall: document.getElementById("venue-sticky-call"),
    stickyNav: document.getElementById("venue-sticky-nav"),
    sportsSection: document.getElementById("venue-sports-section"),
    sports: document.getElementById("venue-sports"),
    detailSection: document.getElementById("venue-detail-section"),
    detailText: document.getElementById("venue-detail-text"),
    travelSection: document.getElementById("venue-travel-section"),
    travelText: document.getElementById("venue-travel-text"),
    facilitiesSection: document.getElementById("venue-facilities-section"),
    facilities: document.getElementById("venue-facilities"),
    subsSection: document.getElementById("venue-subs-section"),
    subs: document.getElementById("venue-subs"),
    meta: document.getElementById("venue-meta"),
    hoursSection: document.getElementById("venue-hours-section"),
    hours: document.getElementById("venue-hours"),
    contactsSection: document.getElementById("venue-contacts-section"),
    contacts: document.getElementById("venue-contacts"),
    links: document.getElementById("venue-links"),
    mapSection: document.getElementById("venue-map-section"),
    map: document.getElementById("venue-map"),
    mapLink: document.getElementById("venue-map-link"),
    almanac: document.getElementById("venue-almanac-link"),
  };

  let galleryList = [];
  let galleryIndex = 0;
  let actionState = { phoneHref: "", mapHref: "" };
  let leafletMap = null;
  let leafletMarker = null;

  const ICO_EXTERNAL =
    '<svg class="venue-ico" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function classifyName(name = "") {
    const value = String(name).toLowerCase();
    if (/วิทยาศาสตร์การกีฬา|sports science/.test(value)) return "science";
    if (/ศูนย์ฝึก|ศูนย์กีฬา|training|สถาบันกีฬา|โรงเรียนกีฬา/.test(value)) return "training";
    if (/ฟิตเนส|fitness|ยิม|gym|ห้องออกกำลังกาย|ศูนย์ออกกำลังกาย|เพาะกาย/.test(value)) return "fitness";
    if (/ลานกีฬา|สวนสาธารณะ|สวนสุขภาพ|สนามเด็กเล่น|ลานอเนกประสงค์/.test(value)) return "public";
    if (/อาคารอเนกประสงค์|อเนกประสงค์|ยิมเนเซียม|gymnasium|โดมกีฬา|อาคารกีฬา/.test(value)) return "multipurpose";
    return "stadium";
  }

  function envLabel(env) {
    if (env === "indoor") return "ในร่ม";
    if (env === "outdoor") return "กลางแจ้ง";
    return "";
  }

  function phoneHref(phone) {
    const digits = String(phone || "").replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : "";
  }

  function firstPhoneHref(detail) {
    const contacts = detail?.contacts || [];
    for (const item of contacts) {
      const href = phoneHref(item?.phone);
      if (href) return href;
    }
    return "";
  }

  function syncActions() {
    const hasCall = Boolean(actionState.phoneHref);
    const hasNav = Boolean(actionState.mapHref);
    const show = hasCall || hasNav;

    const applyLink = (el, href, on) => {
      if (!el) return;
      el.hidden = !on;
      if (on) el.href = href;
    };

    applyLink(els.callBtn, actionState.phoneHref, hasCall);
    applyLink(els.stickyCall, actionState.phoneHref, hasCall);
    applyLink(els.stickyNav, actionState.mapHref, hasNav);
    applyLink(els.mapLink, actionState.mapHref, hasNav);

    if (els.quickActions) els.quickActions.hidden = !hasCall;
    if (els.stickyBar) {
      els.stickyBar.hidden = !show;
      if (show && hasCall && hasNav) {
        els.stickyBar.style.gridTemplateColumns = "1fr 1fr";
      } else if (show) {
        els.stickyBar.style.gridTemplateColumns = "1fr";
      }
    }
    document.body.classList.toggle("has-sticky-actions", show);
  }

  function setCallAction(href) {
    actionState.phoneHref = href || "";
    syncActions();
  }

  function setNavAction(href) {
    actionState.mapHref = href || "";
    syncActions();
  }

  function setHero(url, index) {
    if (!els.heroImg || !url) return;
    galleryIndex = typeof index === "number" ? index : galleryList.indexOf(url);
    if (galleryIndex < 0) galleryIndex = 0;
    const hero = document.getElementById("venue-hero");
    hero?.classList.add("is-switching");
    els.heroImg.src = galleryList[galleryIndex] || url;
    els.heroImg.onerror = () => {
      if (els.heroImg.src !== FALLBACKS[0]) els.heroImg.src = FALLBACKS[0];
    };
    els.heroImg.onload = () => {
      requestAnimationFrame(() => hero?.classList.remove("is-switching"));
    };
    setTimeout(() => hero?.classList.remove("is-switching"), 600);
    els.thumbs?.querySelectorAll("button").forEach((btn, i) => {
      btn.classList.toggle("is-active", i === galleryIndex);
    });
    if (els.count && galleryList.length > 1) {
      els.count.hidden = false;
      els.count.textContent = `${galleryIndex + 1} / ${galleryList.length}`;
    }
    const activeThumb = els.thumbs?.querySelector("button.is-active");
    activeThumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function stepGallery(delta) {
    if (galleryList.length < 2) return;
    const next = (galleryIndex + delta + galleryList.length) % galleryList.length;
    setHero(galleryList[next], next);
  }

  function renderGallery(images, alt) {
    const seen = new Set();
    const unique = [];
    for (const src of images.filter(Boolean)) {
      const key = String(src).split("?")[0].replace(/\/+$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(src);
    }
    galleryList = unique.length ? unique : [FALLBACKS[0]];
    galleryIndex = 0;
    els.heroImg.alt = alt || "";
    setHero(galleryList[0], 0);

    const multi = galleryList.length > 1;
    if (els.prev) els.prev.hidden = !multi;
    if (els.next) els.next.hidden = !multi;

    if (!els.thumbs) return;
    if (!multi) {
      els.thumbs.hidden = true;
      els.thumbs.innerHTML = "";
      return;
    }

    els.thumbs.hidden = false;
    els.thumbs.innerHTML = galleryList
      .map(
        (src, i) =>
          `<button type="button" data-index="${i}" data-src="${escapeHtml(src)}" class="${i === 0 ? "is-active" : ""}" aria-label="ดูรูปที่ ${i + 1}"><img src="${escapeHtml(src)}" alt="" loading="lazy"></button>`
      )
      .join("");
    els.thumbs.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => setHero(btn.dataset.src, Number(btn.dataset.index)));
      btn.querySelector("img")?.addEventListener("error", () => {
        btn.querySelector("img").src = FALLBACKS[0];
      });
    });
  }

  function renderChipList(section, listEl, items) {
    if (!items?.length) {
      showSection(section, false);
      if (listEl) listEl.innerHTML = "";
      return;
    }
    showSection(section, true);
    listEl.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function renderMeta(rows) {
    els.meta.innerHTML = rows
      .filter(([, value]) => value && value !== "—")
      .map(
        ([label, value]) =>
          `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
      )
      .join("");
  }

  function showSection(section, on) {
    if (section) section.hidden = !on;
  }

  function renderHours(items) {
    if (!items?.length) {
      showSection(els.hoursSection, false);
      return;
    }
    showSection(els.hoursSection, true);
    els.hours.innerHTML = items
      .map(([day, time]) => `<li><span>${escapeHtml(day)}</span><span>${escapeHtml(time)}</span></li>`)
      .join("");
  }

  function renderFacilities(items) {
    if (!items?.length) {
      showSection(els.facilitiesSection, false);
      return;
    }
    showSection(els.facilitiesSection, true);
    els.facilities.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function renderSubs(subs) {
    if (!subs?.length) {
      showSection(els.subsSection, false);
      return;
    }
    showSection(els.subsSection, true);
    els.subs.innerHTML = subs
      .map((sub) => {
        const cover =
          extras?.absUrl(sub.cover) ||
          extras?.coverFor(sub.id, "") ||
          FALLBACKS[0];
        const href = extras?.detailHref({ id: sub.id, name: sub.name }) || `venue.html?id=${sub.id}`;
        return `<a class="venue-sub" href="${escapeHtml(href)}">
          <img src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.src='${FALLBACKS[0]}'">
          <strong>${escapeHtml(sub.name)}</strong>
        </a>`;
      })
      .join("");
  }

  function renderContacts(detail) {
    const contacts = detail?.contacts || [];
    const links = [];
    if (detail?.website) links.push(["เว็บไซต์", detail.website]);
    if (detail?.facebook) links.push(["Facebook", detail.facebook]);
    if (detail?.instagram) links.push(["Instagram", detail.instagram]);
    if (detail?.line) {
      links.push([
        "LINE",
        detail.line.startsWith("http") ? detail.line : `https://line.me/ti/p/~${detail.line}`,
      ]);
    }
    if (detail?.email) links.push(["อีเมล", `mailto:${detail.email}`]);

    const hasFacebookName = Boolean(detail?.facebookName && !detail?.facebook);
    if (!contacts.length && !links.length && !hasFacebookName) {
      showSection(els.contactsSection, false);
      setCallAction("");
      return;
    }

    showSection(els.contactsSection, true);
    els.contacts.innerHTML =
      contacts
        .map((item) => {
          const phone = item.phone || "";
          const href = phoneHref(phone);
          return `<li>
          <strong>${escapeHtml(item.name || "ติดต่อ")}</strong>
          ${phone ? (href ? `<a href="${href}">${escapeHtml(phone)}</a>` : `<span>${escapeHtml(phone)}</span>`) : ""}
        </li>`;
        })
        .join("") +
      (hasFacebookName
        ? `<li><strong>Facebook</strong><span>${escapeHtml(detail.facebookName)}</span></li>`
        : "");

    els.links.innerHTML = links
      .map(([label, href]) => {
        const isMail = href.startsWith("mailto:");
        return `<a href="${escapeHtml(href)}" ${isMail ? "" : 'target="_blank" rel="noopener noreferrer"'}>${escapeHtml(label)}${isMail ? "" : ` ${ICO_EXTERNAL}`}</a>`;
      })
      .join("");

    setCallAction(firstPhoneHref(detail));
  }

  function setMap(lat, lon, name) {
    const la = Number(lat);
    const lo = Number(lon);
    const ok = Number.isFinite(la) && Number.isFinite(lo) && !(la === 0 && lo === 0);
    if (!ok || !els.map) {
      showSection(els.mapSection, false);
      setNavAction("");
      if (leafletMap) {
        leafletMap.remove();
        leafletMap = null;
        leafletMarker = null;
      }
      return;
    }

    showSection(els.mapSection, true);
    setNavAction(`https://www.google.com/maps?q=${encodeURIComponent(`${la},${lo}`)}`);

    const L = window.L;
    if (!L) {
      // Fallback: Google Maps embed เมื่อ Leaflet โหลดไม่สำเร็จ
      els.map.innerHTML = `<iframe
        title="แผนที่ ${escapeHtml(name || "สนาม")}"
        src="https://maps.google.com/maps?q=${encodeURIComponent(`${la},${lo}`)}&z=15&output=embed"
        width="100%"
        height="280"
        loading="eager"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>`;
      return;
    }

    if (!leafletMap) {
      els.map.innerHTML = "";
      leafletMap = L.map(els.map, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(leafletMap);
    }

    leafletMap.setView([la, lo], 15);
    if (leafletMarker) {
      leafletMarker.setLatLng([la, lo]);
    } else {
      leafletMarker = L.marker([la, lo]).addTo(leafletMap);
    }
    if (name) leafletMarker.bindPopup(escapeHtml(name));

    // Leaflet ต้อง invalidate หลัง section แสดง (เคยถูก hidden)
    requestAnimationFrame(() => {
      leafletMap?.invalidateSize();
      setTimeout(() => leafletMap?.invalidateSize(), 200);
    });
  }

  async function findMapVenue(id) {
    if (id == null || id === "") return null;
    try {
      const res = await fetch("assets/data/national-sports-map.json");
      if (!res.ok) return null;
      const data = await res.json();
      const want = String(id);
      const row = (data.venues || []).find((item) => String(item[6]) === want);
      if (!row) return null;
      return {
        lat: row[0],
        lon: row[1],
        name: row[2] || "",
        province: row[3] || "",
        sport: row[4] || "",
        env: row[5] || "",
        id: row[6],
      };
    } catch {
      return null;
    }
  }

  function wireReveals() {
    const nodes = [...document.querySelectorAll(".venue-reveal")].filter(
      (node) => !node.classList.contains("is-in")
    );
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-in"));
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
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((node) => io.observe(node));
  }

  function markHeroLoaded() {
    document.querySelector(".venue-hero-copy")?.classList.remove("is-loading");
    document.querySelector(".venue-hero-copy")?.classList.add("is-in");
  }

  async function init() {
    wireReveals();
    els.prev?.addEventListener("click", () => stepGallery(-1));
    els.next?.addEventListener("click", () => stepGallery(1));
    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") stepGallery(-1);
      if (event.key === "ArrowRight") stepGallery(1);
    });

    const ref = document.referrer || "";
    if (ref.includes("provinces.html")) {
      els.back.href = "provinces.html";
      els.back.textContent = "← กลับไปข้อมูลรายจังหวัด";
    } else if (ref.includes("venues.html")) {
      try {
        const prev = new URL(ref);
        els.back.href = prev.pathname.split("/").pop() + prev.search;
      } catch {
        els.back.href = "venues.html";
      }
    }

    const idParam = params.get("id");
    const id = idParam != null && idParam !== "" ? Number(idParam) || idParam : null;
    let venue = {
      id,
      name: params.get("name") || "กำลังโหลด…",
      province: params.get("province") || "",
      sport: params.get("sport") || "",
      env: params.get("env") || "",
      lat: params.get("lat") != null ? Number(params.get("lat")) : null,
      lon: params.get("lon") != null ? Number(params.get("lon")) : null,
      type: params.get("type") || "",
    };

    const typeKey = TYPE_LABELS[venue.type] ? venue.type : classifyName(venue.name);
    const typeLabel = TYPE_LABELS[typeKey] || "สนามกีฬา";
    const fallback = FALLBACKS[Math.abs(Number(id) || 0) % FALLBACKS.length];

    els.title.textContent = venue.name;
    els.summary.textContent = "กำลังโหลดรายละเอียดสนาม…";
    els.summary.classList.add("venue-skeleton");
    els.tags.innerHTML = `<span>${escapeHtml(typeLabel)}</span>`;
    document.title = `${venue.name} — Thailand Sports Almanac`;
    els.almanac.href = extras?.almanacUrl(venue.id) || "https://sports-almanac.go.th/stadium/";

    await extras?.loadCovers();
    const cover = extras?.coverFor(venue.id, fallback) || fallback;
    renderGallery([cover], venue.name);
    renderMeta([
      ["จังหวัด", venue.province || "—"],
      ["สภาพแวดล้อม", envLabel(venue.env) || "—"],
    ]);
    setMap(venue.lat, venue.lon, venue.name);

    const [detail, mapVenue] = await Promise.all([
      venue.id != null ? extras?.loadDetail(venue.id) : null,
      venue.id != null ? findMapVenue(venue.id) : Promise.resolve(null),
    ]);

    els.summary.classList.remove("venue-skeleton");

    if (mapVenue) {
      venue = {
        ...venue,
        ...mapVenue,
        name: venue.name && venue.name !== "กำลังโหลด…" ? venue.name : mapVenue.name,
        type: venue.type || classifyName(mapVenue.name),
      };
    }

    const lat =
      detail?.lat != null && detail.lat !== ""
        ? Number(detail.lat)
        : venue.lat != null
          ? Number(venue.lat)
          : null;
    const lon =
      detail?.lon != null && detail.lon !== ""
        ? Number(detail.lon)
        : venue.lon != null
          ? Number(venue.lon)
          : null;
    setMap(lat, lon, detail?.name || venue.name);

    if (!detail) {
      els.summary.textContent =
        [venue.province, envLabel(venue.env)].filter(Boolean).join(" · ") ||
        "ไม่พบรายละเอียดเพิ่มเติมจากฐานข้อมูล";
      if (venue.name && venue.name !== "กำลังโหลด…") {
        document.title = `${venue.name} — Thailand Sports Almanac`;
        els.title.textContent = venue.name;
      }
      markHeroLoaded();
      return;
    }

    const name = detail.name || venue.name;
    els.title.textContent = name;
    document.title = `${name} — Thailand Sports Almanac`;

    const address = [detail.subdistrict, detail.district, venue.province || detail.province]
      .filter(Boolean)
      .join(" · ");
    const leadBits = [address, detail.status].filter(Boolean);
    els.summary.textContent = leadBits.join(" · ") || "—";

    const resolvedType = detail.stadiumType || TYPE_LABELS[classifyName(name)] || typeLabel;
    const tags = [resolvedType, detail.ownerType, detail.status].filter(Boolean);
    els.tags.innerHTML = tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");

    const gallery = [
      extras?.absUrl(detail.cover) || cover,
      ...(detail.gallery || []).map((src) => extras?.absUrl(src) || src),
    ];
    renderGallery(gallery, name);

    renderChipList(els.sportsSection, els.sports, detail.sports || []);

    if (detail.detail) {
      showSection(els.detailSection, true);
      els.detailText.textContent = detail.detail;
    } else {
      showSection(els.detailSection, false);
    }

    if (detail.travel) {
      showSection(els.travelSection, true);
      els.travelText.textContent = detail.travel;
    } else {
      showSection(els.travelSection, false);
    }

    renderMeta([
      ["ที่ตั้ง", detail.place || address || "—"],
      ["ตำบล / แขวง", detail.subdistrict || "—"],
      ["อำเภอ / เขต", detail.district || "—"],
      ["จังหวัด", venue.province || detail.province || "—"],
      ["พื้นผิวสนาม", (detail.surfaces || []).join(", ") || "—"],
      ["เปิดบริการสำหรับ", (detail.audience || []).join(", ") || "—"],
      ["สภาพแวดล้อม", envLabel(venue.env) || envLabel(detail.env) || "—"],
      ["ผู้ดูแล", detail.owner || "—"],
      ["ขนาดพื้นที่", detail.area || "—"],
      ["ค่าบริการ", detail.fee || "—"],
      ["อีเมล", detail.email || "—"],
    ]);

    renderHours(detail.hours || []);
    renderFacilities(detail.facilities || []);
    renderContacts(detail);
    renderSubs(detail.subs || []);
    markHeroLoaded();
    wireReveals();
  }

  init();
})();
