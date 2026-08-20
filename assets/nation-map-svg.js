/* Nation map — SVG + transform zoom (mockup-style) */
(() => {
  const MAP_VBW = 600, MAP_VBH = 900;
  const NATIONAL_SCALE = 1.1;
  const NS = 'http://www.w3.org/2000/svg';
  const mapSvg = document.querySelector('#map-svg');
  const mapGroup = document.querySelector('#map-group');
  const mapProvincesLayer = document.querySelector('#map-provinces');
  const mapDistrictsLayer = document.querySelector('#map-districts');
  const mapVenuesLayer = document.querySelector('#map-venues');
  const mapStage = document.querySelector('#map-stage');
  const mapLoading = document.querySelector('#map-loading');
  const tooltip = document.querySelector('#map-tooltip');

  if (!mapSvg || !mapGroup) return;

  let mapBaseBounds = null;
  let mapProj = null;
  let mapTransform = {scale: 1, tx: 0, ty: 0};
  const mapSvgMeta = new Map();
  let mapCameraToken = 0;
  let mapDistrictReveal = 0;
  let districtsBuiltFor = null;
  let venueRenderKey = '';
  let nationMapActive = false;
  let hoveredVenueDot = null;

  const state = {
    get provinces() { return window.__nationMapState?.provinces || []; },
    get venues() { return window.__nationMapState?.venues || []; },
    get selectedProvince() { return window.__nationMapState?.selectedProvince || 'all'; },
    set selectedProvince(v) { if (window.__nationMapState) window.__nationMapState.selectedProvince = v; },
    get mapSelectedDistrict() { return window.__nationMapState?.mapSelectedDistrict || null; },
    set mapSelectedDistrict(v) { if (window.__nationMapState) window.__nationMapState.mapSelectedDistrict = v; },
    get mapHoveredDistrict() { return window.__nationMapState?.mapHoveredDistrict || null; },
    set mapHoveredDistrict(v) { if (window.__nationMapState) window.__nationMapState.mapHoveredDistrict = v; },
    get envFilter() { return window.__nationMapState?.envFilter || 'all'; },
    get mapCategoryFilter() { return window.__nationMapState?.mapCategoryFilter || 'all'; },
    get query() { return window.__nationMapState?.query || ''; },
    get heroDistrictData() { return window.__nationMapState?.heroDistrictData || null; },
    get reduceMotion() { return window.__nationMapState?.reduceMotion || false; }
  };

  function eachRing(geometry, callback) {
    if (geometry.type === 'Polygon') geometry.coordinates.forEach(callback);
    else geometry.coordinates.forEach(polygon => polygon.forEach(callback));
  }

  function geometryBounds(geometry) {
    const result = {minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity};
    eachRing(geometry, ring => ring.forEach(([lon, lat]) => {
      result.minLon = Math.min(result.minLon, lon); result.maxLon = Math.max(result.maxLon, lon);
      result.minLat = Math.min(result.minLat, lat); result.maxLat = Math.max(result.maxLat, lat);
    }));
    return result;
  }

  function mainGeometryBounds(geometry) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    let bestRing = polygons[0]?.[0], bestArea = 0;
    polygons.forEach(polygon => {
      const ring = polygon[0];
      let area = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
      if (Math.abs(area) > bestArea) { bestArea = Math.abs(area); bestRing = ring; }
    });
    if (!bestRing?.length) return geometryBounds(geometry);
    const result = {minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity};
    bestRing.forEach(([lon, lat]) => {
      result.minLon = Math.min(result.minLon, lon); result.maxLon = Math.max(result.maxLon, lon);
      result.minLat = Math.min(result.minLat, lat); result.maxLat = Math.max(result.maxLat, lat);
    });
    return result;
  }

  function setMapProjection(box, pad = 0.04) {
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

  function boxToSvgMeta(box) {
    const [x0, y0] = svgPoint(box.minLon, box.maxLat);
    const [x1, y1] = svgPoint(box.maxLon, box.minLat);
    const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
    return {x: (minX + maxX) / 2, y: (minY + maxY) / 2, b: [minX, minY, maxX, maxY]};
  }

  function geometryToPath(geometry) {
    const ringToPath = ring => ring.map((pt, index) => {
      const [x, y] = svgPoint(pt[0], pt[1]);
      return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ') + ' Z';
    if (geometry.type === 'Polygon') return geometry.coordinates.map(ringToPath).join(' ');
    return geometry.coordinates.map(polygon => polygon.map(ringToPath).join(' ')).join(' ');
  }

  function transformForBox(meta, fill = 0.79, minScale = 1.5, maxScale = 12) {
    const [x0, y0, x1, y1] = meta.b;
    const w = Math.max(x1 - x0, 1), h = Math.max(y1 - y0, 1);
    let scale = Math.min(MAP_VBW * fill / w, MAP_VBH * fill / h);
    scale = Math.max(minScale, Math.min(scale, maxScale));
    return {scale, tx: MAP_VBW / 2 - scale * meta.x, ty: MAP_VBH / 2 - scale * meta.y};
  }

  function nationalTransform() {
    return {
      scale: NATIONAL_SCALE,
      tx: (MAP_VBW - MAP_VBW * NATIONAL_SCALE) / 2,
      ty: (MAP_VBH - MAP_VBH * NATIONAL_SCALE) / 2
    };
  }

  function applyTransform(t) {
    mapTransform = {...t};
    mapGroup.setAttribute('transform', `translate(${t.tx} ${t.ty}) scale(${t.scale})`);
  }

  function animateTransform(target, duration = 750, token = mapCameraToken) {
    const from = {...mapTransform};
    if (state.reduceMotion) { applyTransform(target); return Promise.resolve(true); }
    return new Promise(resolve => {
      const start = performance.now();
      const frame = now => {
        if (token !== mapCameraToken) { resolve(false); return; }
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        applyTransform({
          scale: from.scale + (target.scale - from.scale) * eased,
          tx: from.tx + (target.tx - from.tx) * eased,
          ty: from.ty + (target.ty - from.ty) * eased
        });
        if (progress < 1) requestAnimationFrame(frame);
        else resolve(true);
      };
      requestAnimationFrame(frame);
    });
  }

  function provinceContains(feature, lon, lat) {
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
    return feature.geometry.type === 'Polygon'
      ? containsPolygon(feature.geometry.coordinates)
      : feature.geometry.coordinates.some(containsPolygon);
  }

  function districtContainsVenue(district, venue) {
    return !district || provinceContains({geometry: district.g}, venue[1], venue[0]);
  }

  function selectedProvinceFeature() {
    if (state.selectedProvince === 'all') return null;
    return state.provinces.find(item => item.properties.name === state.selectedProvince) || null;
  }

  function venueVisible(v) {
    if (state.selectedProvince !== 'all' && v[3] !== state.selectedProvince) return false;
    const feature = selectedProvinceFeature();
    if (feature && !provinceContains(feature, v[1], v[0])) return false;
    return districtContainsVenue(state.mapSelectedDistrict, v)
      && (state.envFilter === 'all' || v[5] === state.envFilter)
      && (state.mapCategoryFilter === 'all' || window.__nationMapApi?.venueFacilityType?.(v[2]) === state.mapCategoryFilter)
      && (!state.query || (`${v[2]} ${v[3]} ${v[4]}`).toLowerCase().includes(state.query));
  }

  function currentMapDistricts() {
    const feature = state.provinces.find(item => item.properties.name === state.selectedProvince);
    return state.heroDistrictData?.provinces?.[feature?.properties.id] || [];
  }

  function positionTooltip(clientX, clientY) {
    const rect = mapStage.getBoundingClientRect();
    tooltip.style.left = `${clientX - rect.left}px`;
    tooltip.style.top = `${clientY - rect.top}px`;
  }

  function showVenueTooltip(venue, clientX, clientY) {
    const type = window.__nationMapApi?.venueFacilityType?.(venue[2]) || 'stadium';
    const labels = window.__nationMapApi?.FACILITY_LABELS || {};
    const env = venue[5] === 'indoor' ? 'ในร่ม' : venue[5] === 'outdoor' ? 'กลางแจ้ง' : '';
    tooltip.innerHTML = `<strong>${venue[2]}</strong><span>${labels[type] || type} · ${venue[3]} · ${venue[4]}${env ? ` · ${env}` : ''}</span>`;
    positionTooltip(clientX, clientY);
    tooltip.classList.add('visible');
  }

  function updateProvinceStyles() {
    const zoomed = state.selectedProvince !== 'all';
    mapStage?.classList.toggle('is-province', zoomed);
    mapProvincesLayer.querySelectorAll('.province-path').forEach(path => {
      const name = path.dataset.name;
      const active = name === state.selectedProvince;
      path.classList.toggle('active', active);
      path.classList.toggle('hidden', zoomed && !active);
    });
  }

  function updateDistrictStyles() {
    mapDistrictsLayer.querySelectorAll('.district-path').forEach(path => {
      const district = path._district;
      path.classList.toggle('active', district === state.mapSelectedDistrict);
      path.classList.toggle('hovered', district === state.mapHoveredDistrict);
    });
  }

  function setDistrictLayerOpacity(value) {
    mapDistrictsLayer.style.opacity = String(Math.min(1, value));
  }

  function renderDistricts(force = false) {
    const province = state.selectedProvince;
    if (province === 'all' || !state.heroDistrictData || mapDistrictReveal <= 0) {
      mapDistrictsLayer.innerHTML = '';
      districtsBuiltFor = null;
      return;
    }
    if (!force && districtsBuiltFor === province) {
      setDistrictLayerOpacity(mapDistrictReveal);
      updateDistrictStyles();
      return;
    }
    const districts = currentMapDistricts();
    if (!districts.length) return;
    mapDistrictsLayer.innerHTML = '';
    districts.forEach(district => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', geometryToPath(district.g));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(255,255,255,0.32)');
      path.setAttribute('stroke-width', '0.55');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.classList.add('district-path');
      path._district = district;
      path.addEventListener('click', e => {
        e.stopPropagation();
        window.__nationMapApi?.selectDistrictOnMap(district);
      });
      path.addEventListener('mouseenter', e => {
        state.mapHoveredDistrict = district;
        updateDistrictStyles();
        tooltip.innerHTML = `<strong>${district.n}</strong><span>${Number(district.c || 0).toLocaleString('th-TH')} สนาม · คลิกเพื่อซูม</span>`;
        positionTooltip(e.clientX, e.clientY);
        tooltip.classList.add('visible');
      });
      path.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
      mapDistrictsLayer.appendChild(path);
    });
    districtsBuiltFor = province;
    setDistrictLayerOpacity(mapDistrictReveal);
    updateDistrictStyles();
  }

  function updateMapKey() {
    const key = document.querySelector('.map-key');
    if (!key) return;
    const zoomed = state.selectedProvince !== 'all';
    const labels = window.__nationMapApi?.FACILITY_LABELS || {};
    const colors = window.__nationMapApi?.FACILITY_COLORS || {};
    const types = ['stadium', 'multipurpose', 'public', 'fitness', 'training', 'science'];
    if (zoomed) {
      key.innerHTML = types.map(type =>
        `<span><i style="background:${colors[type]}"></i>${labels[type] || type}</span>`
      ).join('');
      key.classList.add('is-types');
    } else {
      key.innerHTML = '<span><i style="background:#1677ff"></i>เลือกจังหวัดเพื่อดูหมุด</span><span><i style="background:#20a779"></i>พื้นที่ที่เลือก</span>';
      key.classList.remove('is-types');
    }
  }

  function venueRenderSignature() {
    return `${state.selectedProvince}|${state.mapSelectedDistrict?.n || ''}|${state.envFilter}|${state.mapCategoryFilter}|${state.query}|${nationMapActive}|${mapTransform.scale.toFixed(2)}|${innerWidth >= 961 ? 'd' : 'm'}`;
  }

  function pinSizes(nationalView) {
    const desktop = innerWidth >= 961;
    const zoom = Math.max(mapTransform.scale, 1);
    // Target apparent radius in SVG viewBox units (local r / zoom * zoom = viewBR)
    const viewBR = nationalView
      ? (desktop ? 1.7 : 2.1)
      : (desktop ? 3.1 : 3.5);
    const viewHit = nationalView
      ? (desktop ? 4.8 : 5.3)
      : (desktop ? 5.4 : 6.2);
    return {
      visualR: viewBR / zoom,
      hitR: viewHit / zoom
    };
  }

  function shouldRenderVenues() {
    return true;
  }

  function markerPositions(venueList) {
    const zoom = Math.max(mapTransform.scale, 1);
    const siteCell = 0.004;
    const groups = new Map();
    venueList.forEach(venue => {
      const [x, y] = svgPoint(venue[1], venue[0]);
      const key = `${Math.round(venue[0] / siteCell)}_${Math.round(venue[1] / siteCell)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ venue, x, y });
    });

    const markers = [];
    groups.forEach(group => {
      if (group.length === 1) {
        markers.push(group[0]);
        return;
      }
      const cx = group.reduce((sum, point) => sum + point.x, 0) / group.length;
      const cy = group.reduce((sum, point) => sum + point.y, 0) / group.length;
      // Vogel/sunflower spiral — avoids obvious circular rings when coords collide
      const golden = Math.PI * (3 - Math.sqrt(5));
      const step = Math.min(2.8, 1.15 + Math.sqrt(group.length) * 0.22) / zoom;
      group.forEach((point, index) => {
        const angle = index * golden;
        const radius = step * Math.sqrt(index + 0.35);
        markers.push({
          venue: point.venue,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius
        });
      });
    });
    return markers;
  }

  function updateVenueClip() {
    let defs = mapSvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS(NS, 'defs');
      mapSvg.insertBefore(defs, mapGroup);
    }
    let clip = defs.querySelector('#map-venue-clip');
    if (!clip) {
      clip = document.createElementNS(NS, 'clipPath');
      clip.setAttribute('id', 'map-venue-clip');
      defs.appendChild(clip);
    }
    clip.replaceChildren();
    const feature = selectedProvinceFeature();
    if (!feature) {
      mapVenuesLayer.removeAttribute('clip-path');
      return;
    }
    const clipPath = document.createElementNS(NS, 'path');
    clipPath.setAttribute('d', geometryToPath(feature.geometry));
    clip.appendChild(clipPath);
    mapVenuesLayer.setAttribute('clip-path', 'url(#map-venue-clip)');
  }

  function renderVenues() {
    if (!shouldRenderVenues()) {
      mapVenuesLayer.innerHTML = '';
      venueRenderKey = '';
      return;
    }
    const key = venueRenderSignature();
    if (key === venueRenderKey) return;
    venueRenderKey = key;

    mapVenuesLayer.innerHTML = '';
    const visibleVenues = state.venues.filter(venueVisible);
    const nationalView = state.selectedProvince === 'all';
    const maxDots = nationalView ? 900 : 1400;
    const step = nationalView
      ? Math.max(1, Math.ceil(visibleVenues.length / maxDots))
      : (visibleVenues.length > maxDots ? Math.ceil(visibleVenues.length / maxDots) : 1);
    const sampled = [];
    for (let i = 0; i < visibleVenues.length; i += step) sampled.push(visibleVenues[i]);
    updateVenueClip();
    const markers = markerPositions(sampled);
    const {visualR, hitR} = pinSizes(nationalView);
    const colors = window.__nationMapApi?.FACILITY_COLORS || {stadium: '#5eb3ff'};
    const frag = document.createDocumentFragment();

    markers.forEach(({venue, x, y}) => {
      const type = window.__nationMapApi?.venueFacilityType?.(venue[2]) || 'stadium';
      const color = colors[type] || '#1677ff';
      const g = document.createElementNS(NS, 'g');
      g.classList.add('venue-marker');
      g._venue = venue;
      g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);

      const hit = document.createElementNS(NS, 'circle');
      hit.setAttribute('r', String(hitR));
      hit.setAttribute('fill', 'transparent');
      hit.classList.add('venue-hit');

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('r', String(visualR));
      dot.setAttribute('fill', color);
      dot.setAttribute('stroke', 'none');
      dot.setAttribute('stroke-width', '0');
      dot.setAttribute('opacity', '1');
      dot.classList.add('venue-dot', `venue-dot--${type}`);
      dot.dataset.baseR = String(visualR);

      g.appendChild(hit);
      g.appendChild(dot);
      frag.appendChild(g);
    });
    mapVenuesLayer.appendChild(frag);
  }

  function scheduleVenueRender(force = false) {
    if (force) venueRenderKey = '';
    if (!shouldRenderVenues()) {
      mapVenuesLayer.innerHTML = '';
      venueRenderKey = '';
      return;
    }
    renderVenues();
  }

  function drawMap(options = {}) {
    if (!mapBaseBounds) return;
    updateProvinceStyles();
    renderDistricts(Boolean(options.forceDistricts));
    if (options.venues !== false) scheduleVenueRender(Boolean(options.forceVenues));
    updateMapKey();
  }

  function animateDistrictLines(token = mapCameraToken) {
    mapDistrictReveal = 0;
    renderDistricts(true);
    if (state.reduceMotion) {
      mapDistrictReveal = 1;
      setDistrictLayerOpacity(1);
      return;
    }
    const start = performance.now(), duration = 420;
    const frame = now => {
      if (token !== mapCameraToken) return;
      const progress = Math.min(1, (now - start) / duration);
      mapDistrictReveal = 0.4 + (1 - Math.pow(1 - progress, 3)) * 0.6;
      setDistrictLayerOpacity(mapDistrictReveal);
      if (progress < 1) requestAnimationFrame(frame);
      else { mapDistrictReveal = 1; setDistrictLayerOpacity(1); }
    };
    requestAnimationFrame(frame);
  }

  function setupVenueInteraction() {
    mapVenuesLayer.addEventListener('click', e => {
      const marker = e.target.closest('.venue-marker');
      if (!marker?._venue) return;
      e.stopPropagation();
      window.__nationMapApi?.selectVenueOnMap?.(marker._venue);
    });
    mapVenuesLayer.addEventListener('mouseover', e => {
      const marker = e.target.closest('.venue-marker');
      if (!marker?._venue) return;
      hoveredVenueDot = marker.querySelector('.venue-dot');
      if (hoveredVenueDot) {
        const base = parseFloat(hoveredVenueDot.dataset.baseR || '1.35');
        hoveredVenueDot.setAttribute('r', String(base * 1.45));
      }
      showVenueTooltip(marker._venue, e.clientX, e.clientY);
    });
    mapVenuesLayer.addEventListener('mousemove', e => {
      if (!e.target.closest('.venue-marker')) return;
      positionTooltip(e.clientX, e.clientY);
    });
    mapVenuesLayer.addEventListener('mouseout', e => {
      const marker = e.target.closest('.venue-marker');
      if (!marker || marker.contains(e.relatedTarget)) return;
      if (hoveredVenueDot) {
        hoveredVenueDot.setAttribute('r', hoveredVenueDot.dataset.baseR || '1.35');
        hoveredVenueDot = null;
      }
      tooltip.classList.remove('visible');
    });
  }

  function buildMap(provinces) {
    const box = {minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity};
    provinces.forEach(feature => {
      const geo = geometryBounds(feature.geometry);
      box.minLon = Math.min(box.minLon, geo.minLon); box.maxLon = Math.max(box.maxLon, geo.maxLon);
      box.minLat = Math.min(box.minLat, geo.minLat); box.maxLat = Math.max(box.maxLat, geo.maxLat);
    });
    setMapProjection(box);
    mapProvincesLayer.innerHTML = '';
    mapDistrictsLayer.innerHTML = '';
    mapVenuesLayer.innerHTML = '';
    districtsBuiltFor = null;
    venueRenderKey = '';
    let bg = mapGroup.querySelector('.map-bg');
    if (!bg) {
      bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('class', 'map-bg');
      bg.setAttribute('x', '0');
      bg.setAttribute('y', '0');
      bg.setAttribute('width', String(MAP_VBW));
      bg.setAttribute('height', String(MAP_VBH));
      bg.setAttribute('fill', 'transparent');
      mapGroup.insertBefore(bg, mapProvincesLayer);
    }
    mapSvgMeta.clear();
    provinces.forEach(feature => {
      const name = feature.properties.name;
      const meta = boxToSvgMeta(mainGeometryBounds(feature.geometry));
      mapSvgMeta.set(name, meta);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', geometryToPath(feature.geometry));
      path.classList.add('province-path');
      path.dataset.name = name;
      const title = document.createElementNS(NS, 'title');
      title.textContent = `${name} (${Number(feature.properties.count || 0).toLocaleString('th-TH')} สนาม)`;
      path.appendChild(title);
      path.addEventListener('click', () => window.__nationMapApi?.selectProvince(name));
      path.addEventListener('mouseenter', e => {
        tooltip.innerHTML = `<strong>${name}</strong><span>${Number(feature.properties.count || 0).toLocaleString('th-TH')} สนาม · คลิกเพื่อซูม</span>`;
        positionTooltip(e.clientX, e.clientY);
        tooltip.classList.add('visible');
      });
      path.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
      mapProvincesLayer.appendChild(path);
    });
    applyTransform(nationalTransform());
    drawMap({venues: false});
    mapLoading?.classList.add('done');
    window.__nationMapApi?.loadDistrictBoundaries?.().catch(() => null);
  }

  async function zoomToProvince(feature, {animate = true} = {}) {
    const token = ++mapCameraToken;
    mapDistrictReveal = 0;
    districtsBuiltFor = null;
    venueRenderKey = '';
    mapStage?.classList.add('is-zooming');
    const target = transformForBox(mapSvgMeta.get(feature.properties.name) || boxToSvgMeta(mainGeometryBounds(feature.geometry)));
    const districtPromise = window.__nationMapApi?.loadDistrictBoundaries?.().catch(() => null);
    if (animate && !state.reduceMotion) await animateTransform(target, 750, token);
    if (token !== mapCameraToken) return;
    applyTransform(target);
    drawMap({forceDistricts: true, forceVenues: true});
    mapStage?.classList.remove('is-zooming');
    const districtData = await districtPromise;
    if (token !== mapCameraToken) return;
    const districts = districtData?.provinces?.[feature.properties.id] || [];
    window.__nationMapApi?.assignDistrictCounts?.(districts, feature.properties.name);
    window.__nationMapApi?.populateDistrictSelect?.(feature.properties.name);
    animateDistrictLines(token);
  }

  async function zoomToDistrict(district, {animate = true} = {}) {
    const token = ++mapCameraToken;
    venueRenderKey = '';
    const meta = boxToSvgMeta(mainGeometryBounds(district.g));
    const target = transformForBox(meta, 0.78, 2, 14);
    if (animate && !state.reduceMotion) await animateTransform(target, 720, token);
    if (token === mapCameraToken) { applyTransform(target); drawMap({forceVenues: true}); }
  }

  async function resetMap({animate = true} = {}) {
    const token = ++mapCameraToken;
    mapDistrictReveal = 0;
    districtsBuiltFor = null;
    venueRenderKey = '';
    const target = nationalTransform();
    // Keep province layout while camera eases out, then caller syncs UI.
    if (animate && !state.reduceMotion) await animateTransform(target, 1280, token);
    if (token !== mapCameraToken) return;
    applyTransform(target);
    mapStage?.classList.remove('is-province');
    drawMap({forceVenues: true});
  }

  setupVenueInteraction();
  if (mapStage) {
    new IntersectionObserver(entries => {
      nationMapActive = entries[0]?.isIntersecting || false;
      if (nationMapActive && state.selectedProvince !== 'all') scheduleVenueRender(true);
      else if (!nationMapActive) {
        mapVenuesLayer.innerHTML = '';
        venueRenderKey = '';
      }
    }, {rootMargin: '160px', threshold: 0.06}).observe(mapStage);
  }

  window.__nationMapSvg = {buildMap, drawMap, zoomToProvince, zoomToDistrict, resetMap, MAP_VBW, MAP_VBH};
})();
