(() => {
  const PLACEHOLDER = "assets/images/stadium-1.jpg";

  function esc(s) {
    if (window.Portal?.escapeHtml) return window.Portal.escapeHtml(s);
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function coverOr(src) {
    if (window.Portal?.coverOr) return window.Portal.coverOr(src);
    return src && String(src).trim() ? src : PLACEHOLDER;
  }

  function ensureModal() {
    let dialog = document.getElementById("activity-modal");
    if (dialog) return dialog;

    dialog = document.createElement("dialog");
    dialog.id = "activity-modal";
    dialog.className = "activity-modal";
    dialog.setAttribute("aria-labelledby", "activity-modal-title");
    dialog.innerHTML = `
      <div class="activity-modal-media">
        <img id="activity-modal-image" src="${PLACEHOLDER}" alt="">
        <button type="button" class="activity-modal-close" aria-label="ปิด">×</button>
      </div>
      <div class="activity-modal-body">
        <small id="activity-modal-eyebrow">รายละเอียด</small>
        <h2 id="activity-modal-title">รายการ</h2>
        <p id="activity-modal-lead"></p>
        <dl class="activity-modal-meta" id="activity-modal-meta"></dl>
        <div class="activity-modal-actions" id="activity-modal-actions"></div>
      </div>`;
    document.body.appendChild(dialog);

    dialog.querySelector(".activity-modal-close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    return dialog;
  }

  function fact(label, value) {
    if (!value) return "";
    return `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;
  }

  function normalize(item, kind = "activity") {
    if (!item) return null;
    if (kind === "course") {
      return {
        kind: "course",
        id: item.id,
        name: item.name,
        cover: item.image_cover || item.cover,
        eyebrow: [item.category_name, item.level_name].filter(Boolean).join(" · ") || "หลักสูตรอบรม",
        lead: item.date_display ? `กำหนดการ ${item.date_display}` : "หลักสูตรจากกระทรวงการท่องเที่ยวและกีฬา",
        facts: [
          ["วันที่", item.date_display],
          ["หมวด", item.category_name],
          ["ระดับ", item.level_name],
          ["สถานที่", item.location_display],
        ],
        primaryHref: item.url || null,
        primaryLabel: "เปิดแหล่งข้อมูลหลักสูตร ↗",
        secondaryHref: "courses.html",
        secondaryLabel: "ดูหลักสูตรทั้งหมด",
      };
    }
    if (kind === "venue") {
      return {
        kind: "venue",
        id: item.id,
        name: item.name,
        cover: item.cover || item.image,
        eyebrow: [item.typeLabel, item.sport].filter(Boolean).join(" · ") || "สนามกีฬา",
        lead: item.province ? `ตั้งอยู่ในจังหวัด${item.province}` : "ข้อมูลสนามจาก Sports Almanac",
        facts: [
          ["ประเภท", item.typeLabel],
          ["ชนิดกีฬา", item.sport],
          ["จังหวัด", item.province],
          ["อำเภอ", item.district],
          ["ในร่ม/กลางแจ้ง", item.env],
        ],
        primaryHref: item.detailHref || (item.id ? `venue.html?id=${encodeURIComponent(item.id)}` : null),
        primaryLabel: "เปิดหน้ารายละเอียด ↗",
        mapUrl: item.mapUrl,
        secondaryHref: item.province
          ? `provinces.html?province=${encodeURIComponent(item.province)}`
          : "venues.html",
        secondaryLabel: "สำรวจสนามเพิ่ม",
      };
    }
    return {
      kind: "activity",
      id: item.id,
      name: item.name,
      cover: item.cover,
      eyebrow: [item.sport, item.level].filter(Boolean).join(" · ") || "รายละเอียดกิจกรรม",
      lead: item.dateDisplay
        ? `กำหนดการ ${item.dateDisplay}`
        : "กิจกรรมจากฐานข้อมูล Thailand Sports Almanac",
      facts: [
        ["วันที่", item.dateDisplay],
        ["ชนิดกีฬา", item.sport],
        ["ระดับ", item.level],
        ["จังหวัด", item.province],
        ["อำเภอ / เขต", item.district],
        ["สถานที่", item.place || item.location],
        ["ผู้จัด", item.owner],
      ],
      primaryHref: item.id ? `activity.html?id=${encodeURIComponent(item.id)}` : "activities.html",
      primaryLabel: "เปิดหน้ารายละเอียด ↗",
      mapUrl: item.mapUrl,
      secondaryHref: "activities.html",
      secondaryLabel: "ไปปฏิทินทั้งหมด",
    };
  }

  function openModal(item, kind = "activity") {
    const view = normalize(item, kind);
    if (!view) return;
    const dialog = ensureModal();
    const img = dialog.querySelector("#activity-modal-image");
    const title = dialog.querySelector("#activity-modal-title");
    const lead = dialog.querySelector("#activity-modal-lead");
    const meta = dialog.querySelector("#activity-modal-meta");
    const actions = dialog.querySelector("#activity-modal-actions");
    const eyebrow = dialog.querySelector("#activity-modal-eyebrow");

    if (img) {
      img.src = coverOr(view.cover);
      img.alt = view.name || "";
    }
    if (eyebrow) eyebrow.textContent = view.eyebrow;
    if (title) title.textContent = view.name || "รายการ";
    if (lead) lead.textContent = view.lead || "";
    if (meta) {
      meta.innerHTML = view.facts.map(([label, value]) => fact(label, value)).join("");
    }
    if (actions) {
      const links = [];
      if (view.primaryHref) {
        links.push(
          `<a class="primary" href="${esc(view.primaryHref)}"${view.kind === "course" && view.primaryHref.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(view.primaryLabel)}</a>`
        );
      }
      if (view.mapUrl) {
        links.push(`<a class="ghost" href="${esc(view.mapUrl)}" target="_blank" rel="noopener">เปิดแผนที่</a>`);
      }
      if (view.secondaryHref) {
        links.push(`<a class="ghost" href="${esc(view.secondaryHref)}">${esc(view.secondaryLabel)}</a>`);
      }
      actions.innerHTML = links.join("");
    }

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  window.ActivityModal = {
    open: (ev) => openModal(ev, "activity"),
    openCourse: (course) => openModal(course, "course"),
    openVenue: (venue) => openModal(venue, "venue"),
    ensure: ensureModal,
  };
})();
