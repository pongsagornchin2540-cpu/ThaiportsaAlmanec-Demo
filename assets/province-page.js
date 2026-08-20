(() => {
  'use strict';

  const MAP_VBW = 600;
  const MAP_VBH = 900;
  const NS = 'http://www.w3.org/2000/svg';
  const MAX_MAP_MARKERS = 420;
  const SPREAD_FULL_LIMIT = 64;
  const FACILITY_TYPES = ['stadium', 'multipurpose', 'public', 'fitness', 'training', 'science'];
  const FACILITY_LABELS = {
    stadium: 'สนามกีฬา',
    multipurpose: 'อาคารอเนกประสงค์',
    public: 'ลาน / สวนสาธารณะ',
    fitness: 'ฟิตเนส / ยิม',
    training: 'ศูนย์ฝึกกีฬา',
    science: 'วิทยาศาสตร์การกีฬา'
  };
  const FACILITY_COLORS = {
    stadium: '#00F0FF',
    multipurpose: '#FF007F',
    public: '#39FF14',
    fitness: '#FF5722',
    training: '#CCFF00',
    science: '#BF00FF'
  };

  const $ = (s, r = document) => r.querySelector(s);

  const mapSvg = $('#province-map-svg');
  const mapGroup = $('#province-map-group');
  const districtsLayer = $('#province-map-districts');
  const venuesLayer = $('#province-map-venues');
  const labelsLayer = $('#province-map-labels');
  const mapStage = $('#province-map-stage');
  const tooltip = $('#province-map-tooltip');
  const provinceSelect = $('#province-page-select');
  const districtSelect = $('#province-district-select');
  const categoryGrid = $('#province-category-grid');
  const venueArchiveGrid = $('#venue-archive-grid');
  const venueArchivePagination = $('#venue-archive-pagination');
  const venueArchiveSearch = $('#venue-archive-search');
  const venueArchivePerPage = $('#venue-archive-per-page');
  const searchInput = $('#province-page-search');

  const VENUE_IMAGES = {
    stadium: ['assets/images/stadium-1.jpg', 'assets/images/stadium-2.jpg', 'assets/images/stadium-3.jpg'],
    multipurpose: ['assets/images/stadium-2.jpg', 'assets/images/stadium-1.jpg'],
    public: ['assets/images/stadium-3.jpg', 'assets/images/stadium-1.jpg'],
    fitness: ['assets/images/stadium-2.jpg', 'assets/images/training-1.jpg'],
    training: ['assets/images/training-1.jpg', 'assets/images/stadium-2.jpg'],
    science: ['assets/images/training-1.jpg', 'assets/images/stadium-3.jpg']
  };

  let provinces = [];
  let venuesByProvince = new Map();
  let districtData = null;
  let provincePackCache = new Map();
  let activePack = null;
  let selectedProvince = '';
  let selectedDistrict = null;
  let categoryFilter = 'all';
  let mapBaseBounds = null;
  let mapProj = null;
  let mapTransform = { scale: 1, tx: 0, ty: 0 };
  let mapClipSignature = '';
  let markerMeta = [];
  let cardPage = 1;
  let cardQuery = '';
  let renderVenuesFrame = 0;
  let portalCache = null;
  let lastReport = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadPortalData() {
    if (portalCache) return portalCache;
    const [events, results, people, overview] = await Promise.all([
      fetch('assets/data/events-index.json').then(r => (r.ok ? r.json() : { events: [] })).catch(() => ({ events: [] })),
      fetch('assets/data/results.json').then(r => (r.ok ? r.json() : { competitions: [], results: [] })).catch(() => ({ competitions: [], results: [] })),
      fetch('assets/data/people.json').then(r => (r.ok ? r.json() : { athletes: [], personnel: [] })).catch(() => ({ athletes: [], personnel: [] })),
      fetch('assets/data/overview-summary.json').then(r => (r.ok ? r.json() : null)).catch(() => null)
    ]);
    portalCache = { events, results, people, overview };
    return portalCache;
  }

  function barRows(entries, max) {
    return entries.map(([label, value]) => {
      const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0;
      return `<div class="bar-row"><b>${escapeHtml(label)}</b><i style="--w:${pct}%"></i><strong>${value.toLocaleString('th-TH')}</strong></div>`;
    }).join('') || '<p style="margin:0;color:#617089;font-size:.88rem">ยังไม่มีข้อมูล</p>';
  }

  function districtRows(entries) {
    const byDistrict = new Map();
    entries.forEach(entry => {
      const name = districtName(entry);
      if (!byDistrict.has(name)) {
        byDistrict.set(name, {
          name,
          venues: 0,
          sports: new Map(),
          types: Object.fromEntries(FACILITY_TYPES.map(type => [type, 0]))
        });
      }
      const row = byDistrict.get(name);
      row.venues += 1;
      row.types[entry.type] += 1;
      const sport = entry.venue[4] || 'ไม่ระบุ';
      row.sports.set(sport, (row.sports.get(sport) || 0) + 1);
    });
    return [...byDistrict.values()]
      .map(row => {
        const topSport = [...row.sports].sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        return {
          ...row,
          sportCount: row.sports.size,
          topSport
        };
      })
      .sort((a, b) => b.venues - a.venues || a.name.localeCompare(b.name, 'th'));
  }

  function buildReportModel(entries) {
    const typeCounts = countByType(entries);
    const sportCounts = new Map();
    entries.forEach(entry => {
      const sport = entry.venue[4] || 'ไม่ระบุ';
      sportCounts.set(sport, (sportCounts.get(sport) || 0) + 1);
    });

    const districts = districtRows(entries);
    const portal = portalCache || { events: { events: [] }, results: { competitions: [] }, people: { athletes: [], personnel: [] }, overview: null };
    const provinceEvents = (portal.events.events || []).filter(ev => ev.province === selectedProvince);
    const competitions = (portal.results.competitions || []).filter(c => c.province === selectedProvince);
    const medalHits = (portal.results.results || []).filter(r =>
      r.goldProvince === selectedProvince || r.silverProvince === selectedProvince || r.bronzeProvince === selectedProvince
    );
    const athletes = (portal.people.athletes || []).filter(a => a.province === selectedProvince);
    const personnel = (portal.people.personnel || []).filter(p => p.province === selectedProvince);
    const overviewEventCount = portal.overview?.provinceCounts?.event?.[selectedProvince] || provinceEvents.length;
    const training = typeCounts.training || 0;
    const science = typeCounts.science || 0;

    return {
      province: selectedProvince,
      generatedAt: new Date().toISOString(),
      totals: {
        venues: entries.length,
        districts: activePack?.districts?.length || districts.length,
        sports: sportCounts.size,
        types: Object.values(typeCounts).filter(Boolean).length,
        events: overviewEventCount,
        competitions: competitions.length,
        medals: medalHits.length,
        athletes: athletes.length,
        personnel: personnel.length,
        training,
        science
      },
      typeCounts,
      sportTop: [...sportCounts].sort((a, b) => b[1] - a[1]).slice(0, 12),
      districts,
      events: provinceEvents.slice(0, 12),
      allEvents: provinceEvents,
      competitions,
      medalHits,
      athletes,
      personnel
    };
  }

  function renderReport(entries) {
    const reportRoot = $('#province-report');
    if (!reportRoot) return;
    if (!selectedProvince || !activePack) {
      reportRoot.classList.add('is-empty');
      lastReport = null;
      return;
    }
    reportRoot.classList.remove('is-empty');
    const model = buildReportModel(entries);
    lastReport = model;
    const t = model.totals;

    const kpis = $('#province-report-kpis');
    if (kpis) {
      kpis.innerHTML = [
        ['สถานที่มีพิกัด', t.venues],
        ['อำเภอ / เขต', t.districts],
        ['ชนิดกีฬา', t.sports],
        ['กิจกรรม', t.events],
        ['การแข่งขัน', t.competitions],
        ['ศูนย์สนับสนุน', t.training + t.science]
      ].map(([label, value]) => `<article><strong>${Number(value).toLocaleString('th-TH')}</strong><span>${label}</span></article>`).join('');
    }

    const insights = $('#province-insight-stack');
    if (insights) {
      const topDistrict = model.districts[0];
      const topSport = model.sportTop[0];
      const density = t.venues && t.districts ? (t.venues / t.districts) : 0;
      insights.innerHTML = `
        <article><small>อำเภอเด่น</small><strong>${escapeHtml(topDistrict?.name || '—')}</strong><p>${topDistrict ? `${topDistrict.venues.toLocaleString('th-TH')} สถานที่ · กีฬาหลัก ${escapeHtml(topDistrict.topSport)}` : 'ยังไม่มีข้อมูลอำเภอ'}</p></article>
        <article><small>กีฬาหลักของจังหวัด</small><strong>${escapeHtml(topSport?.[0] || '—')}</strong><p>${topSport ? `${topSport[1].toLocaleString('th-TH')} สถานที่รองรับชนิดนี้` : 'ยังไม่พบชนิดกีฬา'}</p></article>
        <article><small>ความหนาแน่นเฉลี่ย</small><strong>${density.toLocaleString('th-TH', { maximumFractionDigits: 1 })} สนาม/อำเภอ</strong><p>กิจกรรมในฐานข้อมูล ${t.events.toLocaleString('th-TH')} รายการ · ศูนย์สนับสนุน ${t.training + t.science} แห่ง</p></article>`;
    }

    const maxDistrict = model.districts[0]?.venues || 1;
    const districtBars = $('#province-district-bars');
    if (districtBars) {
      districtBars.innerHTML = barRows(model.districts.slice(0, 10).map(d => [d.name, d.venues]), maxDistrict);
    }
    const note = $('#province-district-table-note');
    if (note) note.textContent = `${model.districts.length.toLocaleString('th-TH')} อำเภอที่มีสถานที่ในชุดข้อมูล`;
    const table = $('#province-district-table');
    if (table) {
      table.innerHTML = model.districts.map((row, index) => `
        <tr data-district="${escapeHtml(row.name)}" class="${selectedDistrict?.n === row.name ? 'is-active' : ''}">
          <td>${index + 1}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${row.venues.toLocaleString('th-TH')}</td>
          <td>${row.sportCount.toLocaleString('th-TH')}</td>
          <td>${escapeHtml(row.topSport)}</td>
          ${FACILITY_TYPES.map(type => `<td>${row.types[type].toLocaleString('th-TH')}</td>`).join('')}
        </tr>`).join('') || '<tr><td colspan="11">ยังไม่มีข้อมูลอำเภอ</td></tr>';
    }

    const sportBars = $('#province-sport-bars');
    if (sportBars) sportBars.innerHTML = barRows(model.sportTop, model.sportTop[0]?.[1] || 1);
    const typeBars = $('#province-type-bars');
    if (typeBars) {
      const typeEntries = FACILITY_TYPES.map(type => [FACILITY_LABELS[type], model.typeCounts[type] || 0]).filter(([, n]) => n > 0);
      typeBars.innerHTML = barRows(typeEntries, typeEntries[0]?.[1] || 1);
    }

    const eventSummary = $('#province-event-summary');
    if (eventSummary) {
      eventSummary.innerHTML = `<span>กิจกรรมในจังหวัด <b>${t.events.toLocaleString('th-TH')}</b></span><span>แสดงล่าสุด <b>${Math.min(12, model.events.length).toLocaleString('th-TH')}</b></span>`;
    }
    const eventList = $('#province-event-list');
    if (eventList) {
      eventList.innerHTML = model.events.length
        ? model.events.map(ev => `<a href="activity.html?id=${encodeURIComponent(ev.id)}"><strong>${escapeHtml(ev.name)}</strong><span>${escapeHtml([ev.dateDisplay, ev.sport, ev.location].filter(Boolean).join(' · '))}</span></a>`).join('')
        : '<p style="margin:0;color:#617089">ยังไม่มีกิจกรรมที่ระบุจังหวัดนี้ในชุดข้อมูลปัจจุบัน</p>';
    }

    const resultSummary = $('#province-result-summary');
    if (resultSummary) {
      resultSummary.innerHTML = `<span>จัดการแข่งขันในจังหวัด <b>${t.competitions.toLocaleString('th-TH')}</b></span><span>เหรียญที่เกี่ยวกับจังหวัด <b>${t.medals.toLocaleString('th-TH')}</b></span>`;
    }
    const competitionList = $('#province-competition-list');
    if (competitionList) {
      competitionList.innerHTML = model.competitions.length
        ? model.competitions.slice(0, 10).map(c => `<article><strong>${escapeHtml(c.name)}</strong><span>${escapeHtml([c.dateDisplay || c.year, c.level, c.place].filter(Boolean).join(' · '))}</span></article>`).join('')
        : '<p style="margin:0;color:#617089">ยังไม่มีรายการแข่งขันที่ระบุจังหวัดนี้</p>';
    }

    const quality = $('#province-quality');
    if (quality) {
      quality.innerHTML = `
        <div><dt>สถานที่มีพิกัดในแผนที่</dt><dd>${t.venues.toLocaleString('th-TH')}</dd></div>
        <div><dt>อำเภอในขอบเขตจังหวัด</dt><dd>${t.districts.toLocaleString('th-TH')}</dd></div>
        <div><dt>กิจกรรมที่ระบุจังหวัด</dt><dd>${t.events.toLocaleString('th-TH')}</dd></div>
        <div><dt>ศูนย์ฝึก / วิทย์กีฬา</dt><dd>${t.training.toLocaleString('th-TH')} / ${t.science.toLocaleString('th-TH')}</dd></div>`;
    }

    const peopleSummary = $('#province-people-summary');
    if (peopleSummary) {
      peopleSummary.innerHTML = `<span>นักกีฬา <b>${t.athletes.toLocaleString('th-TH')}</b></span><span>บุคลากร <b>${t.personnel.toLocaleString('th-TH')}</b></span>`;
    }
    const peopleList = $('#province-people-list');
    if (peopleList) {
      const people = [...model.athletes.map(a => ({ ...a, role: 'นักกีฬา' })), ...model.personnel.map(p => ({ ...p, role: p.role || 'บุคลากร' }))].slice(0, 8);
      peopleList.innerHTML = people.length
        ? people.map(p => `<article><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml([p.role, p.sport, p.level].filter(Boolean).join(' · '))}</span></article>`).join('')
        : '<p style="margin:0;color:#617089">ยังไม่มีรายชื่อที่ระบุจังหวัดนี้ในชุดข้อมูลนักกีฬา/บุคลากร</p>';
    }
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toCsv(rows) {
    const escape = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return `\uFEFF${rows.map(row => row.map(escape).join(',')).join('\r\n')}`;
  }

  function exportReport(kind) {
    if (!lastReport) {
      alert('เลือกจังหวัดก่อนส่งออกรายงาน');
      return;
    }
    const slug = lastReport.province.replace(/\s+/g, '_');
    if (kind === 'print') {
      window.print();
      return;
    }
    if (kind === 'json') {
      downloadBlob(`province-report_${slug}.json`, new Blob([JSON.stringify(lastReport, null, 2)], { type: 'application/json;charset=utf-8' }));
      return;
    }
    if (kind === 'csv-venues') {
      const rows = [['ชื่อสนาม', 'อำเภอ', 'ชนิดกีฬา', 'ประเภทสถานที่', 'สภาพแวดล้อม', 'ละติจูด', 'ลองจิจูด', 'รหัส']];
      provinceEntries().forEach(entry => {
        const venue = entry.venue;
        rows.push([venue[2], districtName(entry), venue[4], FACILITY_LABELS[entry.type], envLabel(venue[5]), venue[0], venue[1], venue[6] || '']);
      });
      downloadBlob(`province-venues_${slug}.csv`, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
      return;
    }
    if (kind === 'csv-districts') {
      const rows = [['อันดับ', 'อำเภอ', 'สนาม', 'ชนิดกีฬา', 'กีฬาหลัก', ...FACILITY_TYPES.map(type => FACILITY_LABELS[type])]];
      lastReport.districts.forEach((row, index) => {
        rows.push([index + 1, row.name, row.venues, row.sportCount, row.topSport, ...FACILITY_TYPES.map(type => row.types[type])]);
      });
      downloadBlob(`province-districts_${slug}.csv`, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
      return;
    }
    if (kind === 'csv-events') {
      const rows = [['ชื่อกิจกรรม', 'วันที่', 'ชนิดกีฬา', 'ระดับ', 'สถานที่', 'รหัส']];
      (lastReport.allEvents || []).forEach(ev => {
        rows.push([ev.name, ev.dateDisplay, ev.sport, ev.level, ev.location || ev.place, ev.id]);
      });
      downloadBlob(`province-events_${slug}.csv`, new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' }));
    }
  }

  function venueFacilityType(name = '') {
    const value = String(name).toLowerCase();
    if (/วิทยาศาสตร์การกีฬา|sports science/.test(value)) return 'science';
    if (/ศูนย์ฝึก|ศูนย์กีฬา|training|สถาบันกีฬา|โรงเรียนกีฬา/.test(value)) return 'training';
    if (/ฟิตเนส|fitness|ยิม|gym|ห้องออกกำลังกาย|ศูนย์ออกกำลังกาย|เพาะกาย/.test(value)) return 'fitness';
    if (/ลานกีฬา|สวนสาธารณะ|สวนสุขภาพ|สนามเด็กเล่น|ลานอเนกประสงค์/.test(value)) return 'public';
    if (/อาคารอเนกประสงค์|อเนกประสงค์|ยิมเนเซียม|gymnasium|โดมกีฬา|อาคารกีฬา/.test(value)) return 'multipurpose';
    return 'stadium';
  }

  function eachRing(geometry, callback) {
    if (geometry.type === 'Polygon') geometry.coordinates.forEach(callback);
    else geometry.coordinates.forEach(polygon => polygon.forEach(callback));
  }

  function geometryBounds(geometry) {
    const result = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
    eachRing(geometry, ring => ring.forEach(([lon, lat]) => {
      result.minLon = Math.min(result.minLon, lon);
      result.maxLon = Math.max(result.maxLon, lon);
      result.minLat = Math.min(result.minLat, lat);
      result.maxLat = Math.max(result.maxLat, lat);
    }));
    return result;
  }

  function setMapProjection(box, pad = 0.09) {
    mapBaseBounds = box;
    const lonSpan = Math.max(box.maxLon - box.minLon, 1e-6);
    const latSpan = Math.max(box.maxLat - box.minLat, 1e-6);
    const midLat = (box.minLat + box.maxLat) / 2;
    const lonScale = Math.max(Math.cos(midLat * Math.PI / 180), 0.2);
    const usableW = MAP_VBW * (1 - pad * 2);
    const usableH = MAP_VBH * (1 - pad * 2);
    const scale = Math.min(usableW / (lonSpan * lonScale), usableH / latSpan);
    const mapW = lonSpan * lonScale * scale;
    const mapH = latSpan * scale;
    mapProj = { lonScale, scale, ox: (MAP_VBW - mapW) / 2, oy: (MAP_VBH - mapH) / 2 };
  }

  function svgPoint(lon, lat) {
    return [
      mapProj.ox + (lon - mapBaseBounds.minLon) * mapProj.lonScale * mapProj.scale,
      mapProj.oy + (mapBaseBounds.maxLat - lat) * mapProj.scale
    ];
  }

  function provinceContains(geometry, lon, lat) {
    const containsPolygon = polygon => {
      const ring = polygon[0];
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
      }
      return inside && !polygon.slice(1).some(hole => {
        let hInside = false;
        for (let i = 0, j = hole.length - 1; i < hole.length; j = i++) {
          const xi = hole[i][0], yi = hole[i][1], xj = hole[j][0], yj = hole[j][1];
          if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) hInside = !hInside;
        }
        return hInside;
      });
    };
    return geometry.type === 'Polygon'
      ? containsPolygon(geometry.coordinates)
      : geometry.coordinates.some(containsPolygon);
  }

  function geometryToPath(geometry) {
    const ringToPath = ring => ring.map((pt, index) => {
      const [x, y] = svgPoint(pt[0], pt[1]);
      return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ') + ' Z';
    if (geometry.type === 'Polygon') return geometry.coordinates.map(ringToPath).join(' ');
    return geometry.coordinates.map(polygon => polygon.map(ringToPath).join(' ')).join(' ');
  }

  function geometryLabelPoint(geometry) {
    const rings = [];
    eachRing(geometry, ring => rings.push(ring));
    const ring = rings.sort((a, b) => b.length - a.length)[0] || [];
    if (!ring.length) return [0, 0];
    let area = 0, x = 0, y = 0;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      area += cross;
      x += (ring[j][0] + ring[i][0]) * cross;
      y += (ring[j][1] + ring[i][1]) * cross;
    }
    if (Math.abs(area) < 1e-12) return ring[0];
    return [x / (3 * area), y / (3 * area)];
  }

  function applyTransform() {
    mapGroup.setAttribute('transform', `translate(${mapTransform.tx} ${mapTransform.ty}) scale(${mapTransform.scale})`);
  }

  function pinSizes() {
    const zoom = Math.max(mapTransform.scale, 1);
    const desktop = innerWidth >= 961;
    return {
      visualR: (desktop ? 2.4 : 2.8) / zoom,
      hitR: (desktop ? 4.8 : 5.4) / zoom
    };
  }

  function buildProvincePack(name) {
    if (provincePackCache.has(name)) return provincePackCache.get(name);
    const feature = provinces.find(item => item.properties.name === name);
    const districts = (feature && districtData?.provinces?.[feature.properties.id]) || [];
    districts.forEach(district => { district.c = 0; });
    const tagged = venuesByProvince.get(name) || [];
    const entries = [];
    const districtSportSets = districts.map(() => new Set());

    for (const venue of tagged) {
      for (let i = 0; i < districts.length; i++) {
        if (provinceContains(districts[i].g, venue[1], venue[0])) {
          entries.push({ venue, districtIndex: i, type: venueFacilityType(venue[2]) });
          districts[i].c = (districts[i].c || 0) + 1;
          districtSportSets[i].add(venue[4]);
          break;
        }
      }
    }

    const pack = { feature, districts, entries, districtSportSets };
    provincePackCache.set(name, pack);
    return pack;
  }

  function loadProvincePack(name) {
    activePack = buildProvincePack(name);
    return activePack;
  }

  function provinceEntries() {
    return activePack?.entries || [];
  }

  function visibleEntries() {
    const districtIndex = selectedDistrict
      ? activePack.districts.indexOf(selectedDistrict)
      : -1;
    return provinceEntries().filter(entry =>
      (districtIndex < 0 || entry.districtIndex === districtIndex)
      && (categoryFilter === 'all' || entry.type === categoryFilter)
    );
  }

  function ensurePathCache(pack) {
    if (!pack || !mapBaseBounds) return;
    const key = `${pack.feature.properties.id}|${mapBaseBounds.minLon.toFixed(4)}`;
    if (pack.pathKey === key) return;
    pack.pathKey = key;
    pack.boundaryPath = geometryToPath(pack.feature.geometry);
    pack.districtPaths = pack.districts.map(district => geometryToPath(district.g));
    pack.clipPath = pack.districtPaths.join(' ');
    pack.labelPoints = pack.districts.map(district => {
      const [lon, lat] = geometryLabelPoint(district.g);
      return svgPoint(lon, lat);
    });
  }

  function sampleList(list, max) {
    if (list.length <= max) return { items: list, sampled: false };
    const step = list.length / max;
    const items = [];
    for (let i = 0; i < max; i++) items.push(list[Math.floor(i * step)]);
    return { items, sampled: true };
  }

  function buildMarkers(entries) {
    const zoom = Math.max(mapTransform.scale, 1);
    const siteCell = 0.004;
    const groups = new Map();
    entries.forEach(entry => {
      const [x, y] = svgPoint(entry.venue[1], entry.venue[0]);
      const venue = entry.venue;
      const key = `${Math.round(venue[0] / siteCell)}_${Math.round(venue[1] / siteCell)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ entry, x, y });
    });

    const markers = [];
    groups.forEach(group => {
      if (group.length === 1) {
        markers.push({ ...group[0], clusterSize: 1 });
        return;
      }
      const cx = group.reduce((sum, point) => sum + point.x, 0) / group.length;
      const cy = group.reduce((sum, point) => sum + point.y, 0) / group.length;
      const golden = Math.PI * (3 - Math.sqrt(5));
      const step = Math.min(2.8, 1.15 + Math.sqrt(group.length) * 0.22) / zoom;
      group.forEach((point, index) => {
        const angle = index * golden;
        const radius = step * Math.sqrt(index + 0.35);
        markers.push({
          entry: point.entry,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          clusterSize: group.length
        });
      });
    });
    return markers;
  }

  function positionTooltip(clientX, clientY) {
    const rect = mapStage.getBoundingClientRect();
    tooltip.style.left = `${clientX - rect.left}px`;
    tooltip.style.top = `${clientY - rect.top}px`;
  }

  function updateMapClip(pack) {
    const signature = `${pack.feature.properties.id}|${pack.districts.length}`;
    if (signature === mapClipSignature) return;
    mapClipSignature = signature;

    let defs = mapSvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(NS, 'defs');
      mapSvg.insertBefore(defs, mapGroup);
    }
    let clip = defs.querySelector('#province-map-clip');
    if (!clip) {
      clip = document.createElementNS(NS, 'clipPath');
      clip.setAttribute('id', 'province-map-clip');
      defs.appendChild(clip);
    }
    clip.innerHTML = '';
    const clipPath = document.createElementNS(NS, 'path');
    clipPath.setAttribute('d', pack.clipPath || pack.boundaryPath);
    clip.appendChild(clipPath);
    venuesLayer.setAttribute('clip-path', 'url(#province-map-clip)');
  }

  function updateDistrictStyles() {
    districtsLayer.querySelectorAll('.province-district-path').forEach(path => {
      const active = path._district === selectedDistrict;
      path.setAttribute('fill', active ? 'rgba(22,119,255,.18)' : 'rgba(229,238,233,.92)');
      path.setAttribute('stroke', active ? '#1677ff' : '#769188');
      path.setAttribute('stroke-width', active ? '1.35' : '1.05');
    });
  }

  function renderDistricts(pack) {
    ensurePathCache(pack);
    districtsLayer.innerHTML = '';
    labelsLayer.innerHTML = '';
    const dense = pack.districts.length > 28;
    const frag = document.createDocumentFragment();
    const labelFrag = document.createDocumentFragment();

    pack.districts.forEach((district, index) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', pack.districtPaths[index]);
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.classList.add('province-district-path');
      path._district = district;
      path.addEventListener('click', () => selectDistrict(district));
      path.addEventListener('mouseenter', event => {
        tooltip.innerHTML = `<strong>${district.n}</strong><span>${Number(district.c || 0).toLocaleString('th-TH')} สถานที่ · คลิกเพื่อกรอง</span>`;
        positionTooltip(event.clientX, event.clientY);
        tooltip.classList.add('visible');
      });
      path.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
      frag.appendChild(path);

      if (!dense || district === selectedDistrict) {
        const [x, y] = pack.labelPoints[index];
        const label = document.createElementNS(NS, 'text');
        label.setAttribute('x', x.toFixed(2));
        label.setAttribute('y', y.toFixed(2));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.classList.add('province-district-label');
        label.textContent = district.n;
        labelFrag.appendChild(label);
      }
    });

    districtsLayer.appendChild(frag);
    labelsLayer.appendChild(labelFrag);
    updateDistrictStyles();
  }

  function paintVenues(entries, sampled) {
    markerMeta = [];
    updateMapClip(activePack);
    const { items, sampled: downsampled } = sampleList(entries, MAX_MAP_MARKERS);
    const markers = buildMarkers(items);
    const { visualR, hitR } = pinSizes();
    const frag = document.createDocumentFragment();

    markers.forEach((marker, index) => {
      const { entry, x, y, clusterSize } = marker;
      const { venue, type } = entry;
      const color = FACILITY_COLORS[type];
      markerMeta[index] = { entry, venue, type, clusterSize };

      const g = document.createElementNS(NS, 'g');
      g.classList.add('province-venue-marker');
      g.dataset.markerIndex = String(index);
      g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);

      const hit = document.createElementNS(NS, 'circle');
      hit.setAttribute('r', String(hitR));
      hit.setAttribute('fill', 'transparent');

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', String(visualR));
      dot.setAttribute('fill', color);
      dot.setAttribute('stroke', '#fff');
      dot.setAttribute('stroke-width', '0.45');
      dot.setAttribute('vector-effect', 'non-scaling-stroke');
      dot.classList.add('province-venue-dot');

      g.appendChild(hit);
      g.appendChild(dot);
      frag.appendChild(g);
    });

    venuesLayer.replaceChildren(frag);
    const note = $('#province-map-note');
    if (note) {
      note.textContent = (sampled || downsampled)
        ? `แสดง ${markers.length.toLocaleString('th-TH')} จุดบนแผนที่จาก ${entries.length.toLocaleString('th-TH')} สถานที่`
        : `${entries.length.toLocaleString('th-TH')} สถานที่บนแผนที่`;
    }
  }

  function scheduleVenuesRender() {
    const entries = visibleEntries();
    cancelAnimationFrame(renderVenuesFrame);
    renderVenuesFrame = requestAnimationFrame(() => paintVenues(entries, false));
  }

  function renderMap(pack) {
    setMapProjection(geometryBounds(pack.feature.geometry));
    mapTransform = { scale: 1, tx: 0, ty: 0 };
    mapClipSignature = '';
    applyTransform();
    ensurePathCache(pack);
    const boundary = $('#province-boundary-path');
    if (boundary) boundary.setAttribute('d', pack.boundaryPath || '');
    renderDistricts(pack);
    scheduleVenuesRender();
  }

  function countByType(entries) {
    const counts = Object.fromEntries(FACILITY_TYPES.map(type => [type, 0]));
    entries.forEach(entry => counts[entry.type]++);
    return counts;
  }

  function renderCategoryGrid(entries) {
    const counts = countByType(entries);
    categoryGrid.innerHTML = FACILITY_TYPES.map(type => `
      <button type="button" class="province-category-chip${categoryFilter === type ? ' active' : ''}" data-category="${type}">
        <i style="background:${FACILITY_COLORS[type]}"></i>
        <span>${FACILITY_LABELS[type]}</span>
        <strong>${counts[type].toLocaleString('th-TH')}</strong>
      </button>
    `).join('');
  }

  function renderDistrictSelect(pack) {
    if (!districtSelect) return;
    if (!pack) {
      districtSelect.innerHTML = '<option value="">เลือกจังหวัดก่อน</option>';
      return;
    }
    districtSelect.innerHTML = `<option value="">ทุกอำเภอ</option>${pack.districts
      .slice()
      .sort((a, b) => a.n.localeCompare(b.n, 'th'))
      .map(district => `<option value="${district.n}">${district.n} · ${(district.c || 0).toLocaleString('th-TH')}</option>`)
      .join('')}`;
    districtSelect.value = selectedDistrict?.n || '';
  }

  function envLabel(env) {
    if (env === 'indoor') return 'ในร่ม';
    if (env === 'outdoor') return 'กลางแจ้ง';
    return 'ไม่ระบุ';
  }

  function districtName(entry) {
    return activePack?.districts?.[entry.districtIndex]?.n || '—';
  }

  function archiveEntries() {
    const districtIndex = selectedDistrict
      ? activePack?.districts.indexOf(selectedDistrict)
      : -1;
    const query = cardQuery.trim().toLowerCase();
    return provinceEntries().filter(entry => {
      if (districtIndex >= 0 && entry.districtIndex !== districtIndex) return false;
      if (categoryFilter !== 'all' && entry.type !== categoryFilter) return false;
      if (!query) return true;
      const venue = entry.venue;
      const haystack = `${venue[2]} ${venue[4]} ${FACILITY_LABELS[entry.type]} ${districtName(entry)}`.toLowerCase();
      return haystack.includes(query);
    });
  }

  function venueImage(entry, index) {
    const list = VENUE_IMAGES[entry.type] || VENUE_IMAGES.stadium;
    return list[index % list.length];
  }

  function venueDetailHref(entry) {
    const venue = entry.venue;
    return window.VenueExtras?.detailHref({
      id: venue[6],
      lat: venue[0],
      lon: venue[1],
      name: venue[2],
      province: venue[3],
      sport: venue[4],
      env: venue[5],
      type: entry.type
    }) || `venue.html?id=${encodeURIComponent(venue[6] || '')}`;
  }

  function renderVenueArchive() {
    if (!venueArchiveGrid || !activePack) return;
    const entries = archiveEntries();
    const perPage = Math.max(9, Number(venueArchivePerPage?.value || 18));
    const totalPages = Math.max(1, Math.ceil(entries.length / perPage));
    if (cardPage > totalPages) cardPage = totalPages;
    const start = (cardPage - 1) * perPage;
    const pageEntries = entries.slice(start, start + perPage);

    const provinceEl = $('#venue-archive-province');
    if (provinceEl) provinceEl.textContent = selectedProvince;
    const countEl = $('#venue-archive-count');
    if (countEl) {
      countEl.textContent = entries.length
        ? `แสดง ${pageEntries.length.toLocaleString('th-TH')} จาก ${entries.length.toLocaleString('th-TH')} สถานที่ · หน้า ${cardPage}/${totalPages}`
        : 'ไม่พบสนามตามตัวกรองที่เลือก';
    }

    if (!pageEntries.length) {
      venueArchiveGrid.innerHTML = '<div class="venue-archive-empty">ไม่พบสนามตามตัวกรอง · ลองเปลี่ยนประเภท อำเภอ หรือคำค้นหา</div>';
    } else {
      venueArchiveGrid.innerHTML = pageEntries.map((entry, index) => {
        const venue = entry.venue;
        const image = window.VenueExtras?.coverFor(venue[6], venueImage(entry, start + index)) || venueImage(entry, start + index);
        const href = venueDetailHref(entry);
        return `<a class="venue-archive-card" href="${href}" data-type="${entry.type}" role="listitem">
          <div class="venue-archive-media"><img src="${image}" alt="" loading="lazy" onerror="this.style.display='none'"><span class="venue-archive-badge">${FACILITY_LABELS[entry.type]}</span></div>
          <div class="venue-archive-body">
            <small>${districtName(entry)} · ${envLabel(venue[5]).toUpperCase()}</small>
            <h3>${venue[2]}</h3>
            <p>${venue[4] || 'กีฬาทั่วไป'}</p>
            <b>ดูรายละเอียด →</b>
          </div>
        </a>`;
      }).join('');
    }

    if (venueArchivePagination) {
      if (totalPages <= 1) {
        venueArchivePagination.innerHTML = '';
      } else {
        const buttons = [];
        if (cardPage > 1) buttons.push(`<button type="button" data-page="${cardPage - 1}">‹</button>`);
        for (let page = 1; page <= totalPages; page++) {
          if (totalPages > 7 && Math.abs(page - cardPage) > 2 && page !== 1 && page !== totalPages) {
            if (page === 2 || page === totalPages - 1) buttons.push('<span>…</span>');
            continue;
          }
          buttons.push(`<button type="button" data-page="${page}" class="${page === cardPage ? 'active' : ''}">${page}</button>`);
        }
        if (cardPage < totalPages) buttons.push(`<button type="button" data-page="${cardPage + 1}">›</button>`);
        venueArchivePagination.innerHTML = buttons.join('');
      }
    }
  }

  function updateSummary(entries) {
    if (!activePack) return;
    const filtered = categoryFilter === 'all'
      ? entries
      : entries.filter(entry => entry.type === categoryFilter);
    const sports = new Set(filtered.map(entry => entry.venue[4])).size;
    const filterNote = categoryFilter !== 'all' ? ` · ${FACILITY_LABELS[categoryFilter]}` : '';

    $('#province-page-name').textContent = selectedProvince;
    $('#province-page-summary').textContent = `${filtered.length.toLocaleString('th-TH')} สถานที่${filterNote} · ${activePack.districts.length} อำเภอ · คลิกอำเภอบนแผนที่เพื่อกรอง`;
    const dl = window.DesignLanguage;
    if (dl?.animateCount) {
      dl.animateCount($('#province-stat-total'), filtered.length);
      dl.animateCount($('#province-stat-districts'), activePack.districts.length);
      dl.animateCount($('#province-stat-sports'), sports);
      dl.animateCount($('#province-stat-types'), new Set(filtered.map(entry => entry.type)).size);
    } else {
      $('#province-stat-total').textContent = filtered.length.toLocaleString('th-TH');
      $('#province-stat-districts').textContent = activePack.districts.length.toLocaleString('th-TH');
      $('#province-stat-sports').textContent = sports.toLocaleString('th-TH');
      $('#province-stat-types').textContent = new Set(filtered.map(entry => entry.type)).size.toLocaleString('th-TH');
    }

    const sportCounts = new Map();
    filtered.forEach(entry => sportCounts.set(entry.venue[4], (sportCounts.get(entry.venue[4]) || 0) + 1));
    const topSports = [...sportCounts].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const max = topSports[0]?.[1] || 1;
    $('#province-top-sports').innerHTML = topSports.map(([sport, count]) =>
      `<li style="--value:${(count / max * 100).toFixed(1)}%"><b>${sport}</b><i></i><strong>${count.toLocaleString('th-TH')}</strong></li>`
    ).join('') || '<li class="empty">ยังไม่มีข้อมูล</li>';
  }

  function syncUrl() {
    const url = new URL(location.href);
    if (selectedProvince) url.searchParams.set('province', selectedProvince);
    else url.searchParams.delete('province');
    history.replaceState(null, '', url);
  }

  function entriesForStats() {
    return provinceEntries().filter(entry => categoryFilter === 'all' || entry.type === categoryFilter);
  }

  function refreshPanels() {
    if (!activePack) {
      clearProvinceView();
      return;
    }
    const entries = provinceEntries();
    const statsEntries = entriesForStats();
    renderCategoryGrid(entries);
    renderDistrictSelect(activePack);
    updateSummary(statsEntries);
    renderVenueArchive();
    renderReport(entries);
    provinceSelect.value = selectedProvince;
    // Don't overwrite while the user is still typing in the search box.
    if (searchInput && document.activeElement !== searchInput) {
      searchInput.value = selectedProvince;
    }
    syncUrl();
  }

  function selectDistrict(district) {
    selectedDistrict = district;
    cardPage = 1;
    districtSelect.value = selectedDistrict?.n || '';
    updateDistrictStyles();
    scheduleVenuesRender();
    updateSummary(entriesForStats());
    renderVenueArchive();
    renderReport(provinceEntries());
  }

  function clearProvinceView() {
    selectedProvince = '';
    selectedDistrict = null;
    categoryFilter = 'all';
    cardPage = 1;
    cardQuery = '';
    activePack = null;
    markerMeta = [];
    if (venueArchiveSearch) venueArchiveSearch.value = '';
    if (searchInput) searchInput.value = '';
    provinceSelect.value = '';
    if (districtSelect) districtSelect.innerHTML = '<option value="">เลือกจังหวัดก่อน</option>';
    $('#province-page-name').textContent = 'เลือกจังหวัด';
    $('#province-page-summary').textContent = 'เลือกจังหวัดจากเมนูด้านบนเพื่อดูแผนที่ อำเภอ และรายการสนาม';
    $('#province-stat-total').textContent = '0';
    $('#province-stat-districts').textContent = '0';
    $('#province-stat-sports').textContent = '0';
    $('#province-stat-types').textContent = '0';
    if (categoryGrid) categoryGrid.innerHTML = '';
    $('#province-top-sports').innerHTML = '<li class="empty">เลือกจังหวัดเพื่อดูข้อมูล</li>';
    $('#province-map-title').textContent = 'แผนที่อำเภอและสถานที่กีฬา';
    $('#province-map-note').textContent = 'เลือกจังหวัดเพื่อเริ่มสำรวจ';
    if (districtsLayer) districtsLayer.innerHTML = '';
    if (venuesLayer) venuesLayer.innerHTML = '';
    if (labelsLayer) labelsLayer.innerHTML = '';
    const boundary = $('#province-boundary-path');
    if (boundary) boundary.setAttribute('d', '');
    if (venueArchiveGrid) {
      venueArchiveGrid.innerHTML = '<div class="venue-archive-empty">เลือกจังหวัดเพื่อดูสนามและสถานที่กีฬา</div>';
    }
    const provinceEl = $('#venue-archive-province');
    if (provinceEl) provinceEl.textContent = '—';
    const countEl = $('#venue-archive-count');
    if (countEl) countEl.textContent = 'ยังไม่ได้เลือกจังหวัด';
    if (venueArchivePagination) venueArchivePagination.innerHTML = '';
    renderReport([]);
    syncUrl();
  }

  function selectProvince(name) {
    if (!name) {
      clearProvinceView();
      return;
    }
    if (!venuesByProvince.has(name)) {
      $('#province-page-summary').textContent = `ไม่พบข้อมูลจังหวัด "${name}"`;
      return;
    }
    selectedProvince = name;
    selectedDistrict = null;
    categoryFilter = 'all';
    cardPage = 1;
    cardQuery = '';
    if (venueArchiveSearch) venueArchiveSearch.value = '';
    const pack = loadProvincePack(name);
    renderMap(pack);
    refreshPanels();
  }

  function bindDelegatedEvents() {
    categoryGrid?.addEventListener('click', event => {
      const chip = event.target.closest('[data-category]');
      if (!chip) return;
      categoryFilter = categoryFilter === chip.dataset.category ? 'all' : chip.dataset.category;
      cardPage = 1;
      refreshPanels();
      scheduleVenuesRender();
    });

    venuesLayer?.addEventListener('mouseover', event => {
      const marker = event.target.closest('.province-venue-marker');
      if (!marker) return;
      const meta = markerMeta[Number(marker.dataset.markerIndex)];
      if (!meta) return;
      tooltip.innerHTML = `<strong>${meta.venue[2]}</strong><span>${FACILITY_LABELS[meta.type]} · ${meta.venue[4]}${meta.clusterSize > 1 ? ` · กลุ่ม ${meta.clusterSize} แห่ง` : ''}</span>`;
      positionTooltip(event.clientX, event.clientY);
      tooltip.classList.add('visible');
    });
    venuesLayer?.addEventListener('mouseout', event => {
      if (event.target.closest('.province-venue-marker')) tooltip.classList.remove('visible');
    });
    venuesLayer?.addEventListener('click', event => {
      const marker = event.target.closest('.province-venue-marker');
      if (!marker) return;
      const meta = markerMeta[Number(marker.dataset.markerIndex)];
      if (meta?.entry) location.href = venueDetailHref(meta.entry);
    });

    venueArchivePagination?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button) return;
      cardPage = Number(button.dataset.page);
      renderVenueArchive();
      $('#venue-archive')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    venueArchiveSearch?.addEventListener('input', () => {
      cardQuery = venueArchiveSearch.value;
      cardPage = 1;
      renderVenueArchive();
    });

    venueArchivePerPage?.addEventListener('change', () => {
      cardPage = 1;
      renderVenueArchive();
    });

    document.querySelector('.province-export')?.addEventListener('click', event => {
      const button = event.target.closest('[data-export]');
      if (!button) return;
      exportReport(button.dataset.export);
    });

    $('#province-district-table')?.addEventListener('click', event => {
      const row = event.target.closest('tr[data-district]');
      if (!row || !activePack) return;
      const district = activePack.districts.find(item => item.n === row.dataset.district) || null;
      selectDistrict(district);
    });
  }

  async function init() {
    bindDelegatedEvents();

    const loadingEl = $('#province-page-loading');
    const [mapPayload, districtsPayload] = await Promise.all([
      fetch('assets/data/national-sports-map.json').then(r => r.json()),
      fetch('assets/data/thailand-districts.json').then(r => r.json())
    ]);

    provinces = mapPayload.provinces.features;
    districtData = districtsPayload;
    venuesByProvince = new Map();
    for (const venue of mapPayload.venues) {
      const provinceName = venue[3];
      if (!venuesByProvince.has(provinceName)) venuesByProvince.set(provinceName, []);
      venuesByProvince.get(provinceName).push(venue);
    }

    provinces.sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'th'));
    provinceSelect.innerHTML = `<option value="">เลือกจังหวัด</option>${provinces.map(feature =>
      `<option value="${feature.properties.name}">${feature.properties.name}</option>`
    ).join('')}`;

    const params = new URLSearchParams(location.search);
    const initial = params.get('province') || '';

    provinceSelect.addEventListener('change', () => {
      if (!provinceSelect.value) {
        clearProvinceView();
        return;
      }
      selectProvince(provinceSelect.value);
    });
    districtSelect.addEventListener('change', () => {
      const district = activePack?.districts.find(item => item.n === districtSelect.value) || null;
      selectDistrict(district);
    });

    if (searchInput) {
      let searchTimer = 0;

      const resolveProvince = (term, { allowPartial = false } = {}) => {
        const q = term.trim();
        if (!q) return null;
        const exact = provinces.find(feature => feature.properties.name === q);
        if (exact) return exact;
        if (!allowPartial || q.length < 2) return null;
        const partial = provinces.filter(feature => feature.properties.name.includes(q));
        return partial.length === 1 ? partial[0] : null;
      };

      const trySelectFromSearch = (allowPartial = false) => {
        const match = resolveProvince(searchInput.value, { allowPartial });
        if (!match) return;
        if (match.properties.name === selectedProvince) {
          // Keep typed text aligned without fighting the caret mid-edit.
          if (document.activeElement !== searchInput) {
            searchInput.value = match.properties.name;
          }
          return;
        }
        selectProvince(match.properties.name);
        // Sync after select only if focus left the field.
        if (document.activeElement !== searchInput) {
          searchInput.value = match.properties.name;
        }
      };

      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          // Auto-select only on exact province name so typing doesn't jump.
          trySelectFromSearch(false);
        }, 220);
      });

      searchInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        clearTimeout(searchTimer);
        trySelectFromSearch(true);
        if (selectedProvince) searchInput.value = selectedProvince;
      });

      searchInput.addEventListener('blur', () => {
        clearTimeout(searchTimer);
        trySelectFromSearch(true);
        if (selectedProvince && !searchInput.value.trim()) {
          searchInput.value = selectedProvince;
        } else if (selectedProvince && resolveProvince(searchInput.value, { allowPartial: false })) {
          searchInput.value = selectedProvince;
        }
      });
    }

    $('#province-map-reset')?.addEventListener('click', () => selectDistrict(null));
    window.VenueExtras?.loadCovers();

    if (loadingEl) loadingEl.textContent = 'กำลังเตรียมแผนที่และรายงานจังหวัด…';
    await loadPortalData().catch(() => null);
    if (initial) selectProvince(initial);
    else clearProvinceView();
    loadingEl?.classList.add('hidden');
    window.DesignLanguage?.wireReveals('.dl-reveal');
  }

  init().catch(error => {
    console.error('province-page init failed:', error);
    $('#province-page-loading')?.classList.add('hidden');
    const summary = $('#province-page-summary');
    if (summary) {
      summary.textContent = window.location.protocol === 'file:'
        ? 'เปิดผ่านเซิร์ver (serve.bat) ไม่ใช่ไฟล์โดยตรง'
        : 'ไม่สามารถโหลดข้อมูลได้ กรุณารีเฟรชหน้า';
    }
  });
})();
