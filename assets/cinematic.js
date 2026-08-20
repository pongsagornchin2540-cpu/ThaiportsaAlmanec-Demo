const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const loader = document.querySelector('#loader');
addEventListener('load', () => setTimeout(() => loader.classList.add('done'), reduceMotion ? 0 : 1150));

const associationTicker = document.querySelector('#association-ticker');
const pageFooter = document.querySelector('#footer');
if (associationTicker && pageFooter) pageFooter.prepend(associationTicker);

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
menuButton.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'ปิดเมนูหลัก' : 'เปิดเมนูหลัก');
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'เปิดเมนูหลัก');
}));

document.querySelectorAll('.nav-dropdown-trigger').forEach(trigger => trigger.addEventListener('click', event => {
  event.stopPropagation();
  const group = trigger.closest('.nav-group');
  document.querySelectorAll('.nav-group.open').forEach(item => {if(item !== group){item.classList.remove('open');item.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded','false')}});
  const open = group.classList.toggle('open');
  trigger.setAttribute('aria-expanded',String(open));
}));
document.querySelectorAll('.mobile-accordion-trigger').forEach(trigger => trigger.addEventListener('click', () => {
  const item = trigger.closest('.mobile-accordion');
  const open = item.classList.toggle('open');
  trigger.setAttribute('aria-expanded',String(open));
}));
document.addEventListener('click', () => document.querySelectorAll('.nav-group.open').forEach(item => {item.classList.remove('open');item.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded','false')}));
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll('.nav-group.open').forEach(item => {
    item.classList.remove('open');
    item.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
  });
  if (document.activeElement?.matches('.nav-dropdown-trigger')) document.activeElement.blur();
  mobileMenu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'เปิดเมนูหลัก');
});

const navShell = document.querySelector('.nav-shell');
const navLinks = [...document.querySelectorAll('[data-section]')];
const navTargets = [...new Set(navLinks.map(link => document.querySelector(`#${link.dataset.section}`)).filter(Boolean))];
let navTicking = false;
function updateNavigation() {
  navShell.classList.toggle('is-scrolled', scrollY > 30);
  let activeId = '';
  let activeTop = -Infinity;
  navTargets.forEach(section => {
    const top = section.getBoundingClientRect().top;
    if(top <= innerHeight * .38 && top > activeTop) {activeTop = top;activeId = section.id;}
  });
  navLinks.forEach(link => {
    const active = link.dataset.section === activeId;
    link.classList.toggle('active', active);
    if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  navTicking = false;
}
addEventListener('scroll', () => {if(!navTicking){navTicking=true;requestAnimationFrame(updateNavigation)}}, {passive:true});
addEventListener('resize', updateNavigation, {passive:true});
updateNavigation();

const revealItems = document.querySelectorAll('.manifesto-text,.manifesto-foot,.nation-head,.map-app,.story-intro,.story-scene,.places-head,.place-card,.events-title,.finale>h2,.finale>a');
revealItems.forEach(item => item.classList.add('reveal'));
const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) {
    entry.target.classList.add('in');
    revealObserver.unobserve(entry.target);
  }
}), {threshold: .12});
revealItems.forEach(item => revealObserver.observe(item));

const mapIntro = document.querySelector('#map-intro');
let mapIntroVisible = false, mapIntroDataReady = false, mapIntroCounted = false;
function animateMapIntroMetrics() {
  if(!mapIntroVisible||!mapIntroDataReady||mapIntroCounted)return;
  mapIntroCounted=true;
  mapIntro.querySelectorAll('[data-map-target]').forEach(node=>{const decimals=Number(node.dataset.mapDecimals||0);node.textContent=`${Number(node.dataset.mapTarget).toLocaleString('en-US',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}${node.dataset.mapSuffix||''}`});
}
function updateMapIntroFade(){if(reduceMotion)return;const rect=mapIntro.getBoundingClientRect(),progress=Math.max(0,Math.min(1,(innerHeight-rect.top)/(innerHeight*.75)));mapIntro.style.setProperty('--map-reveal',progress.toFixed(3));}
new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){mapIntroVisible=true;mapIntro.classList.add('in-view');animateMapIntroMetrics();}}),{threshold:.38}).observe(mapIntro);
addEventListener('scroll',updateMapIntroFade,{passive:true});addEventListener('resize',updateMapIntroFade,{passive:true});updateMapIntroFade();
const sportsNetwork = document.querySelector('#sports-network');
if (sportsNetwork) {
  const networkNodes = [...sportsNetwork.querySelectorAll('.network-node')];
  const networkRoutes = [...sportsNetwork.querySelectorAll('.network-connections > path')];
  new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) sportsNetwork.classList.add('in-view');
  }), {threshold:.28}).observe(sportsNetwork);
  networkNodes.forEach((node, index) => {
    const route = networkRoutes[index];
    node.addEventListener('pointerenter', () => route?.classList.add('active'));
    node.addEventListener('pointerleave', () => route?.classList.remove('active'));
    node.addEventListener('focus', () => route?.classList.add('active'));
    node.addEventListener('blur', () => route?.classList.remove('active'));
  });
}

const motionHero = document.querySelector('#motion-hero');
const motionStage = motionHero.querySelector('.motion-stage');
const motionSports = document.querySelector('#motion-sports');
const motionCopy = document.querySelector('#motion-copy');
const heroSearchBox = document.querySelector('.hero-search-box');

if (!reduceMotion) {
  const updatePointerGlow = event => {
    const rect = heroSearchBox.getBoundingClientRect();
    heroSearchBox.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
    heroSearchBox.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
  };
  heroSearchBox.addEventListener('pointermove', updatePointerGlow, {passive:true});
  motionHero.addEventListener('pointermove', event => {
    const rect = motionHero.getBoundingClientRect();
    motionHero.querySelector('.motion-stage').style.setProperty('--stage-x', `${((event.clientX - rect.left) / rect.width * 100).toFixed(1)}%`);
    motionHero.querySelector('.motion-stage').style.setProperty('--stage-y', `${((event.clientY - rect.top) / rect.height * 100).toFixed(1)}%`);
  }, {passive:true});
}

function setMotionProgress(progress) {
  const p = Math.max(0, Math.min(1, progress));
  const handoff = Math.max(0,Math.min(1,(p-.52)/.48));
  motionStage.style.setProperty('--handoff',handoff.toFixed(3));
  motionSports.style.letterSpacing = `${-.1 + p * .14}em`;
  motionSports.style.transform = `translate(-50%,-50%) scale(${1 + p * .17})`;
  motionSports.style.opacity = String(.92 - p * .2);
  motionCopy.style.transform = `translate(-50%,${-p * 46}px)`;
  motionCopy.style.opacity = String(1 - Math.max(0, (p - .68) / .32) * .55);
}

function updateMotionHero() {
  const rect = motionHero.getBoundingClientRect();
  setMotionProgress(-rect.top / Math.max(1, innerHeight));
}

if (!reduceMotion) {
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, innerHeight);
      const heroImage = document.querySelector('.hero-visual img');
      const heroWord = document.querySelector('.hero-word');
      heroImage.style.transform = `scale(1) translate3d(0,${y * .055}px,0)`;
      heroWord.style.transform = `translate3d(0,${y * .1}px,0)`;
      updateMotionHero();
      ticking = false;
    });
  }, {passive:true});
  addEventListener('resize', updateMotionHero, {passive:true});
  updateMotionHero();
} else {
  setMotionProgress(1);
}

const statTakeover = document.querySelector('#data-stats');
if (statTakeover) {
  const statSlides = [...statTakeover.querySelectorAll('.stat-slide')];
  const statProgressItems = [...statTakeover.querySelectorAll('.stat-progress span')];
  let statFrame = 0;

  function animateTakeoverNumber(node) {
    if (!node || node.dataset.animated === 'true') return;
    node.dataset.animated = 'true';
    const target = Number(node.dataset.statTarget || 0);
    if (reduceMotion) { node.textContent = target.toLocaleString('en-US'); return; }
    const started = performance.now();
    const draw = now => {
      const progress = Math.min(1, (now - started) / 1050);
      node.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString('en-US');
      if (progress < 1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  function updateStatTakeover() {
    statFrame = 0;
    const rect = statTakeover.getBoundingClientRect();
    const travel = Math.max(1, statTakeover.offsetHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    const rawIndex = progress * statSlides.length;
    const activeIndex = Math.min(statSlides.length - 1, Math.floor(rawIndex));
    const segmentProgress = activeIndex === statSlides.length - 1 && progress === 1 ? 1 : Math.max(0,Math.min(1,rawIndex - activeIndex));
    const visible = rect.top < innerHeight && rect.bottom > 0;

    statSlides.forEach((slide,index) => {
      const active = index === activeIndex;
      slide.classList.toggle('active',active);
      slide.setAttribute('aria-hidden',String(!active));
      if (active && visible) animateTakeoverNumber(slide.querySelector('[data-stat-target]'));
    });
    statProgressItems.forEach((item,index) => {
      item.classList.toggle('done',index < activeIndex);
      item.classList.toggle('active',index === activeIndex);
      item.style.setProperty('--stat-progress',index === activeIndex ? `${segmentProgress * 100}%` : '0%');
    });
  }

  if (reduceMotion) {
    statSlides.forEach(slide => animateTakeoverNumber(slide.querySelector('[data-stat-target]')));
  } else {
    const requestStatUpdate = () => { if (!statFrame) statFrame = requestAnimationFrame(updateStatTakeover); };
    addEventListener('scroll',requestStatUpdate,{passive:true});
    addEventListener('resize',requestStatUpdate,{passive:true});
    updateStatTakeover();
  }
}

const events = [
  ['18','ส.ค. 69','บางพระฟรีแดนซ์ “Dance for Fun & Good Health @ BangPhra”','ฉะเชิงเทรา','นันทนาการ'],
  ['18','ส.ค. 69','การแข่งขันกีฬานักเรียนประจำจังหวัดและอำเภอ ประจำปี 2569','หนองคาย','กีฬานักเรียน'],
  ['20','ส.ค. 69','การแข่งขันกรีฑา ชิงชนะเลิศจังหวัดหนองคาย','หนองคาย','กรีฑา'],
  ['21','ส.ค. 69','โครงการแข่งขันกีฬาสานสัมพันธ์ชุมชนตำบลสวนแตง','สุพรรณบุรี','กีฬาชุมชน'],
  ['21','ส.ค. 69','งานเทศกาลส้มโอและของดีอำเภอเวียงแก่น 2569','เชียงราย','นันทนาการ'],
  ['22','ส.ค. 69','โครงการแข่งขันกีฬาดอนกำยานสัมพันธ์','สุพรรณบุรี','ฟุตบอล'],
  ['22','ส.ค. 69','ท่างามโอเพ่นคัพ','สิงห์บุรี','ฟุตบอล']
];
const eventTrack = document.querySelector('#events-track');
eventTrack.innerHTML = events.map((event,index) => `<article class="event-card"><div class="event-date">${event[0]}<small>${event[1]}</small></div><h3>${event[2]}</h3><p>⌖ ${event[3]}</p><footer><span>0${index + 1} / 0${events.length}</span><span>${event[4]} ↗</span></footer></article>`).join('');
document.querySelector('#event-next').addEventListener('click', () => eventTrack.scrollBy({left:378,behavior:'smooth'}));
document.querySelector('#event-prev').addEventListener('click', () => eventTrack.scrollBy({left:-378,behavior:'smooth'}));

const countObserver = new IntersectionObserver(entries => {
  if (!entries[0].isIntersecting) return;
  document.querySelectorAll('[data-count]').forEach((node,index) => {
    const value = Number(node.dataset.count);
    if (reduceMotion) { node.textContent = value.toLocaleString('th-TH'); return; }
    const start = performance.now() + index * 90;
    const draw = now => {
      const progress = Math.max(0,Math.min(1,(now-start)/1200));
      node.textContent = Math.floor(value*(1-Math.pow(1-progress,3))).toLocaleString('th-TH');
      if(progress<1) requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  });
  countObserver.disconnect();
},{threshold:.2});
const mapTotalsEl = document.querySelector('.map-totals');
if (mapTotalsEl) countObserver.observe(mapTotalsEl);

const tooltip = document.querySelector('#map-tooltip');
const provinceSelect = document.querySelector('#province-select');
const districtSelect = document.querySelector('#district-select');
const selectedPlace = document.querySelector('#selected-place');
const mapLoading = document.querySelector('#map-loading');
const searchInput = document.querySelector('#map-search');
const heroMapCanvas = document.querySelector('#hero-map-canvas');
const heroSearchForm = document.querySelector('#hero-search-form');
const heroSearchInput = document.querySelector('#hero-venue-search');
const heroSearchResults = document.querySelector('#hero-search-results');
const heroMapPanel = document.querySelector('.map-intro .motion-map-panel');
const provinceMapTooltip = document.querySelector('#province-map-tooltip');
const provinceDetail = document.querySelector('#province-detail');
const provinceSearchForm = document.querySelector('#province-search-form');
const provinceSearchInput = document.querySelector('#province-search-input');
const provinceSearchOptions = document.querySelector('#province-search-options');
heroSearchInput.value = '';
let mapData, provinces = [], venues = [], selectedProvince = 'all', envFilter = 'all', mapCategoryFilter = 'all', query = '', pendingProvinceSelection = null;
let mapSelectedDistrict = null, mapHoveredDistrict = null;
window.__nationMapState = {get provinces(){return provinces},get venues(){return venues},get selectedProvince(){return selectedProvince},set selectedProvince(v){selectedProvince=v},get mapSelectedDistrict(){return mapSelectedDistrict},set mapSelectedDistrict(v){mapSelectedDistrict=v},get mapHoveredDistrict(){return mapHoveredDistrict},set mapHoveredDistrict(v){mapHoveredDistrict=v},get envFilter(){return envFilter},get mapCategoryFilter(){return mapCategoryFilter},get query(){return query},get heroDistrictData(){return heroDistrictData},get reduceMotion(){return reduceMotion}};
function drawMap(){window.__nationMapSvg?.drawMap()}
let heroMapLayout, heroHoveredProvince = null, heroSelectedProvince = null, heroHoverFrame = 0;
let bounds = {minLon:97.32,maxLon:105.58,minLat:5.64,maxLat:20.52};
const MAP_FILL = .88;
function fitViewBounds(box, fill = MAP_FILL) {
  const margin = (1 - fill) / (2 * fill);
  const spanLon = box.maxLon - box.minLon, spanLat = box.maxLat - box.minLat;
  const padLon = Math.max(spanLon * margin, spanLon * .025, .018);
  const padLat = Math.max(spanLat * margin, spanLat * .025, .018);
  return {minLon: box.minLon - padLon, maxLon: box.maxLon + padLon, minLat: box.minLat - padLat, maxLat: box.maxLat + padLat};
}
function computeNationalBounds() {
  const box = {minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity};
  provinces.forEach(feature => {
    const geo = geometryBounds(feature.geometry);
    box.minLon = Math.min(box.minLon, geo.minLon); box.maxLon = Math.max(box.maxLon, geo.maxLon);
    box.minLat = Math.min(box.minLat, geo.minLat); box.maxLat = Math.max(box.maxLat, geo.maxLat);
  });
  return fitViewBounds(box, .96);
}
let heroViewBounds={...bounds},heroDistrictData=null,heroDistrictPromise=null,heroDistrictReveal=0,heroCameraToken=0,heroCategoryFilter='all',heroSelectedDistrict=null,heroHoveredDistrict=null;
const facilityTypes=['stadium','multipurpose','public','fitness','training','science'];
const FACILITY_LABELS={stadium:'สนามกีฬา',multipurpose:'อาคารอเนกประสงค์',public:'ลาน / สวนสาธารณะ',fitness:'ฟิตเนส / ยิม',training:'ศูนย์ฝึกกีฬา',science:'วิทยาศาสตร์การกีฬา'};
const FACILITY_COLORS={stadium:'#00F0FF',multipurpose:'#FF007F',public:'#39FF14',fitness:'#FF5722',training:'#CCFF00',science:'#BF00FF'};
const mapFacilityBreakdown=document.querySelector('#map-facility-breakdown');
const mapFacilityGrid=document.querySelector('#map-facility-grid');
const mapBody=document.querySelector('.map-body');
const mapProvinceCtaLink=document.querySelector('#map-province-cta-link');
const nearbyVenuesList=document.querySelector('.nearby-venues-list');

function syncMapLayoutState(){
  const isProvince=selectedProvince!=='all';
  mapBody?.classList.toggle('is-province',isProvince);
  if(!isProvince)mapBody?.classList.remove('is-collapsing');
  if(mapProvinceCtaLink){
    mapProvinceCtaLink.hidden=!isProvince;
    if(isProvince){
      mapProvinceCtaLink.href=`provinces.html?province=${encodeURIComponent(selectedProvince)}`;
    }else{
      mapProvinceCtaLink.href='provinces.html';
    }
  }
  if(selectedPlace)selectedPlace.hidden=!isProvince;
  if(nearbyVenuesList)nearbyVenuesList.hidden=!isProvince;
}

function eachRing(geometry, callback) {
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(callback);
  else geometry.coordinates.forEach(polygon => polygon.forEach(callback));
}
function pointInGeoRing(lon,lat,ring) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
    if(((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}
function provinceContains(feature,lon,lat) {
  const containsPolygon=polygon=>pointInGeoRing(lon,lat,polygon[0])&&!polygon.slice(1).some(ring=>pointInGeoRing(lon,lat,ring));
  return feature.geometry.type==='Polygon'?containsPolygon(feature.geometry.coordinates):feature.geometry.coordinates.some(containsPolygon);
}
function geometryBounds(geometry){
  const result={minLon:Infinity,maxLon:-Infinity,minLat:Infinity,maxLat:-Infinity};
  eachRing(geometry,ring=>ring.forEach(([lon,lat])=>{result.minLon=Math.min(result.minLon,lon);result.maxLon=Math.max(result.maxLon,lon);result.minLat=Math.min(result.minLat,lat);result.maxLat=Math.max(result.maxLat,lat)}));return result;
}
function mainGeometryBounds(geometry){
  const polygons=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;
  let bestRing=polygons[0]?.[0],bestArea=0;
  polygons.forEach(polygon=>{const ring=polygon[0];let area=0;for(let i=0,j=ring.length-1;i<ring.length;j=i++)area+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];if(Math.abs(area)>bestArea){bestArea=Math.abs(area);bestRing=ring}});
  if(!bestRing?.length)return geometryBounds(geometry);
  const result={minLon:Infinity,maxLon:-Infinity,minLat:Infinity,maxLat:-Infinity};
  bestRing.forEach(([lon,lat])=>{result.minLon=Math.min(result.minLon,lon);result.maxLon=Math.max(result.maxLon,lon);result.minLat=Math.min(result.minLat,lat);result.maxLat=Math.max(result.maxLat,lat)});
  return result;
}
function normalizeViewBounds(view){
  const minLon=Math.min(view.minLon,view.maxLon),maxLon=Math.max(view.minLon,view.maxLon);
  const minLat=Math.min(view.minLat,view.maxLat),maxLat=Math.max(view.minLat,view.maxLat);
  if(!Number.isFinite(minLon)||!Number.isFinite(maxLon)||maxLon-minLon<1e-6||maxLat-minLat<1e-6)return{...bounds};
  return{minLon,maxLon,minLat,maxLat};
}
function geometryLabelPoint(geometry){
  const rings=geometry.type==='Polygon'?[geometry.coordinates[0]]:geometry.coordinates.map(polygon=>polygon[0]);let best=rings[0],bestArea=0;
  rings.forEach(ring=>{let area=0;for(let i=0,j=ring.length-1;i<ring.length;j=i++)area+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];if(Math.abs(area)>bestArea){bestArea=Math.abs(area);best=ring}});
  let area=0,x=0,y=0;for(let i=0,j=best.length-1;i<best.length;j=i++){const cross=best[j][0]*best[i][1]-best[i][0]*best[j][1];area+=cross;x+=(best[j][0]+best[i][0])*cross;y+=(best[j][1]+best[i][1])*cross}return Math.abs(area)<1e-9?best[0]:[x/(3*area),y/(3*area)];
}
function provinceViewBounds(feature){return normalizeViewBounds(fitViewBounds(mainGeometryBounds(feature.geometry), MAP_FILL))}
function currentMapDistricts(){const feature=provinces.find(item=>item.properties.name===selectedProvince);return heroDistrictData?.provinces?.[feature?.properties.id]||[]}
function populateDistrictSelect(provinceName){
  if(!districtSelect)return;
  if(provinceName==='all'){districtSelect.disabled=true;districtSelect.innerHTML='<option value="">เลือกจังหวัดก่อน</option>';return}
  const feature=provinces.find(item=>item.properties.name===provinceName),districts=heroDistrictData?.provinces?.[feature?.properties.id]||[];
  districtSelect.disabled=!districts.length;
  districtSelect.innerHTML=`<option value="">— ทุกอำเภอ —</option>${districts.map(district=>`<option value="${district.n}">${district.n}</option>`).join('')}`;
}
function assignDistrictCounts(districts,provinceName){
  districts.forEach(district=>district.c=0);
  venues.filter(venue=>venue[3]===provinceName).forEach(venue=>{const district=districts.find(item=>provinceContains({geometry:item.g},venue[1],venue[0]));if(district)district.c++});
}
async function zoomMapToProvince(feature,{animate=true}={}){
  await window.__nationMapSvg?.zoomToProvince(feature,{animate});
}
async function findDistrictByTerm(term){
  const value=term.trim().replace(/^อำเภอ/,'');if(value.length<2)return null;
  if(!heroDistrictData){try{await loadDistrictBoundaries()}catch{return null}}
  for(const feature of provinces){
    const districts=heroDistrictData.provinces[feature.properties.id]||[];
    const district=districts.find(item=>item.n===value)||districts.find(item=>item.n.includes(value));
    if(district)return{feature,district};
  }
  return null;
}
async function openDistrict(district,provinceFeature,{zoomToDistrict=true}={}){
  if(!district||!provinceFeature)return;
  selectedProvince=provinceFeature.properties.name;provinceSelect.value=selectedProvince;mapSelectedDistrict=null;mapHoveredDistrict=null;query='';
  updateSelectedPlacePanel();
  await zoomMapToProvince(provinceFeature);
  mapSelectedDistrict=district;mapHoveredDistrict=district;if(districtSelect)districtSelect.value=district.n;
  updateSelectedPlacePanel();
  if(zoomToDistrict)await window.__nationMapSvg?.zoomToDistrict(district,{animate});
  else drawMap();
}
function loadDistrictBoundaries(){
  if(!heroDistrictPromise)heroDistrictPromise=fetch('assets/data/thailand-districts.json?v=20260818-2').then(response=>{if(!response.ok)throw new Error('District boundary data unavailable');return response.json()}).then(data=>(heroDistrictData=data,data));return heroDistrictPromise;
}
function animateHeroView(target,duration=900,token=++heroCameraToken){
  const from={...heroViewBounds};
  if(reduceMotion){heroViewBounds={...target};drawHeroMap();return Promise.resolve(true)}
  return new Promise(resolve=>{const start=performance.now();const frame=now=>{if(token!==heroCameraToken){resolve(false);return}const progress=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progress,4);heroViewBounds={minLon:from.minLon+(target.minLon-from.minLon)*eased,maxLon:from.maxLon+(target.maxLon-from.maxLon)*eased,minLat:from.minLat+(target.minLat-from.minLat)*eased,maxLat:from.maxLat+(target.maxLat-from.maxLat)*eased};drawHeroMap();if(progress<1)requestAnimationFrame(frame);else resolve(true)};requestAnimationFrame(frame)});
}
function animateDistrictLines(token=heroCameraToken){
  heroDistrictReveal=0;if(reduceMotion){heroDistrictReveal=1;drawHeroMap();return}
  const start=performance.now(),duration=720;const frame=now=>{if(token!==heroCameraToken)return;const progress=Math.min(1,(now-start)/duration);heroDistrictReveal=1-Math.pow(1-progress,3);drawHeroMap();if(progress<1)requestAnimationFrame(frame)};requestAnimationFrame(frame);
}
async function zoomHeroToProvince(feature){
  const token=++heroCameraToken;heroDistrictReveal=0;heroMapPanel.classList.add('is-zooming');document.querySelector('#province-detail-districts').textContent='…';
  const [zoomed,districtData]=await Promise.all([animateHeroView(provinceViewBounds(feature),950,token),loadDistrictBoundaries().catch(error=>{console.error(error);return null})]);
  if(!zoomed||token!==heroCameraToken)return;heroMapPanel.classList.remove('is-zooming');const districts=districtData?.provinces?.[feature.properties.id]||[],provinceVenues=venues.filter(venue=>venue[3]===feature.properties.name);districts.forEach(district=>district.c=0);provinceVenues.forEach(venue=>{const district=districts.find(item=>provinceContains({geometry:item.g},venue[1],venue[0]));if(district)district.c++});document.querySelector('#province-detail-districts').textContent=districts.length?districts.length.toLocaleString('th-TH'):'—';animateDistrictLines(token);
}
function venueFacilityType(name=''){
  const value=String(name).toLowerCase();
  if(/วิทยาศาสตร์การกีฬา|sports science/.test(value))return'science';
  if(/ศูนย์ฝึก|ศูนย์กีฬา|training|สถาบันกีฬา|โรงเรียนกีฬา/.test(value))return'training';
  if(/ฟิตเนส|fitness|ยิม|gym|ห้องออกกำลังกาย|ศูนย์ออกกำลังกาย|เพาะกาย/.test(value))return'fitness';
  if(/ลานกีฬา|สวนสาธารณะ|สวนสุขภาพ|สนามเด็กเล่น|ลานอเนกประสงค์/.test(value))return'public';
  if(/อาคารอเนกประสงค์|อเนกประสงค์|ยิมเนเซียม|gymnasium|โดมกีฬา|อาคารกีฬา/.test(value))return'multipurpose';
  return'stadium';
}
function drawVenueMarker(context,x,y,type,size,active){
  const colors={stadium:'#1677ff',multipurpose:'#7c5cff',public:'#14a87b',fitness:'#ff8a3d',training:'#0db7d6',science:'#d954b8'},color=colors[type],s=active?size:size*.58;context.save();context.globalAlpha=active?.78:.13;context.fillStyle=color;context.strokeStyle=color;context.lineWidth=.75;context.beginPath();
  if(type==='stadium')context.arc(x,y,s,0,Math.PI*2);
  else if(type==='multipurpose')context.rect(x-s,y-s,s*2,s*2);
  else if(type==='public'){context.moveTo(x,y-s*1.45);context.lineTo(x+s*1.25,y+s);context.lineTo(x-s*1.25,y+s);context.closePath()}
  else if(type==='fitness'){context.moveTo(x,y-s*1.35);context.lineTo(x+s*1.2,y);context.lineTo(x,y+s*1.35);context.lineTo(x-s*1.2,y);context.closePath()}
  else if(type==='training'){context.moveTo(x-s*1.4,y);context.lineTo(x+s*1.4,y);context.moveTo(x,y-s*1.4);context.lineTo(x,y+s*1.4);context.stroke();context.restore();return}
  else{for(let side=0;side<6;side++){const angle=Math.PI/3*side-Math.PI/2,px=x+Math.cos(angle)*s,py=y+Math.sin(angle)*s;side?context.lineTo(px,py):context.moveTo(px,py)}context.closePath()}
  context.fill();context.restore();
}
function currentDistricts(){const feature=provinces.find(item=>item.properties.name===heroSelectedProvince);return heroDistrictData?.provinces?.[feature?.properties.id]||[]}
function heroGeoAt(clientX,clientY){if(!heroMapLayout)return null;const rect=heroMapCanvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top,{x0,y0,mapW,mapH,view}=heroMapLayout;if(x<x0||x>x0+mapW||y<y0||y>y0+mapH)return null;return{lon:view.minLon+(x-x0)/mapW*(view.maxLon-view.minLon),lat:view.maxLat-(y-y0)/mapH*(view.maxLat-view.minLat)}}
function heroDistrictAt(clientX,clientY){if(!heroSelectedProvince||!heroDistrictData||heroDistrictReveal<.98)return null;const point=heroGeoAt(clientX,clientY);return point?currentDistricts().find(district=>provinceContains({geometry:district.g},point.lon,point.lat))||null:null}
function districtContainsVenue(district,venue){return !district||provinceContains({geometry:district.g},venue[1],venue[0])}
function updateFacilityCards(scopeVenues,contextLabel='พื้นที่นี้'){
  const counts=Object.fromEntries(facilityTypes.map(type=>[type,0]));scopeVenues.forEach(venue=>counts[venueFacilityType(venue[2])]++);heroCategoryFilter='all';document.querySelectorAll('[data-province-category]').forEach(card=>{const count=counts[card.dataset.provinceCategory]||0;card.querySelector('strong').textContent=count.toLocaleString('th-TH');card.classList.remove('active');card.setAttribute('aria-label',`${card.querySelector('span').textContent} ${count.toLocaleString('th-TH')} แห่งใน${contextLabel}`)});document.querySelectorAll('[data-category-line]').forEach(line=>line.classList.remove('active'));return counts;
}
function drawHeroMap() {
  if (!mapData || !heroMapCanvas) return;
  const heroCtx = heroMapCanvas.getContext('2d');
  const ratio = devicePixelRatio || 1, w = heroMapCanvas.clientWidth, h = heroMapCanvas.clientHeight;
  if (!w || !h) return;
  heroMapCanvas.width = Math.round(w * ratio);heroMapCanvas.height = Math.round(h * ratio);heroCtx.setTransform(ratio,0,0,ratio,0,0);heroCtx.clearRect(0,0,w,h);
  const view=heroViewBounds,pad = Math.min(w,h) * .055, geoRatio = (view.maxLon-view.minLon)/(view.maxLat-view.minLat);
  let mapH=h-pad*2,mapW=mapH*geoRatio;if(mapW>w-pad*2){mapW=w-pad*2;mapH=mapW/geoRatio;}
  const x0=(w-mapW)/2,y0=(h-mapH)/2;heroMapLayout={w,h,x0,y0,mapW,mapH,view};
  const heroProject=(lon,lat)=>[x0+(lon-view.minLon)/(view.maxLon-view.minLon)*mapW,y0+(view.maxLat-lat)/(view.maxLat-view.minLat)*mapH];
  provinces.forEach(feature=>{const name=feature.properties.name;if(heroSelectedProvince&&name!==heroSelectedProvince)return;const isSelected=name===heroSelectedProvince,isHovered=name===heroHoveredProvince;heroCtx.beginPath();eachRing(feature.geometry,ring=>{ring.forEach((point,index)=>{const [x,y]=heroProject(point[0],point[1]);index?heroCtx.lineTo(x,y):heroCtx.moveTo(x,y)});heroCtx.closePath();});heroCtx.fillStyle=isSelected?'rgba(17,118,243,.25)':isHovered?'rgba(80,187,255,.18)':'rgba(17,118,243,.025)';heroCtx.fill();heroCtx.strokeStyle=isSelected?'rgba(7,92,205,.95)':isHovered?'rgba(17,118,243,.7)':'rgba(17,92,173,.28)';heroCtx.lineWidth=isSelected?1.7:isHovered?1.2:.65;heroCtx.stroke();});
  if(heroSelectedProvince&&heroDistrictData&&heroDistrictReveal>0){
    const selectedFeature=provinces.find(feature=>feature.properties.name===heroSelectedProvince),districts=heroDistrictData.provinces[selectedFeature?.properties.id]||[],visibleCount=Math.ceil(districts.length*heroDistrictReveal);
    heroCtx.save();
    heroCtx.beginPath();eachRing(selectedFeature.geometry,ring=>{ring.forEach((point,index)=>{const[x,y]=heroProject(point[0],point[1]);index?heroCtx.lineTo(x,y):heroCtx.moveTo(x,y)});heroCtx.closePath()});heroCtx.clip('evenodd');
    districts.slice(0,visibleCount).forEach(district=>{const selected=district===heroSelectedDistrict,hovered=district===heroHoveredDistrict;heroCtx.beginPath();eachRing(district.g,ring=>{ring.forEach((point,index)=>{const[x,y]=heroProject(point[0],point[1]);index?heroCtx.lineTo(x,y):heroCtx.moveTo(x,y)});heroCtx.closePath()});if(selected||hovered){heroCtx.fillStyle=selected?'rgba(22,119,255,.2)':'rgba(90,190,255,.12)';heroCtx.fill()}heroCtx.strokeStyle=selected?'#1677ff':hovered?'rgba(22,119,255,.8)':`rgba(255,255,255,${.22+heroDistrictReveal*.68})`;heroCtx.lineWidth=selected?2.2:hovered?1.7:(innerWidth<760?1:1.15);heroCtx.stroke()});heroCtx.restore();
    if(heroDistrictReveal>.52){const labelAlpha=Math.min(1,(heroDistrictReveal-.52)/.3),fontSize=districts.length>35?10.5:districts.length>24?11:12;heroCtx.save();heroCtx.globalAlpha=labelAlpha;heroCtx.textAlign='center';heroCtx.textBaseline='middle';heroCtx.lineJoin='round';districts.slice(0,visibleCount).forEach(district=>{const[lon,lat]=geometryLabelPoint(district.g),[x,y]=heroProject(lon,lat),selected=district===heroSelectedDistrict;heroCtx.font=`${selected?750:650} ${fontSize}px 'Noto Sans Thai',sans-serif`;heroCtx.strokeStyle='rgba(255,255,255,.98)';heroCtx.lineWidth=4;heroCtx.fillStyle=selected?'#075ccd':'#173b66';heroCtx.strokeText(district.n,x,y-fontSize*.42);heroCtx.fillText(district.n,x,y-fontSize*.42);heroCtx.font=`700 ${Math.max(9,fontSize-2)}px 'Noto Sans Thai',sans-serif`;heroCtx.fillStyle=selected?'#075ccd':'#1677ff';const countText=`${Number(district.c||0).toLocaleString('th-TH')} แห่ง`;heroCtx.strokeText(countText,x,y+fontSize*.72);heroCtx.fillText(countText,x,y+fontSize*.72)});heroCtx.restore()}
    heroCtx.save();heroCtx.beginPath();eachRing(selectedFeature.geometry,ring=>{ring.forEach((point,index)=>{const[x,y]=heroProject(point[0],point[1]);index?heroCtx.lineTo(x,y):heroCtx.moveTo(x,y)});heroCtx.closePath()});heroCtx.strokeStyle='rgba(18,126,255,.98)';heroCtx.lineWidth=2;heroCtx.stroke();heroCtx.restore();
  }
  const visibleVenues=venues.filter(venue=>(!heroSelectedProvince||venue[3]===heroSelectedProvince)&&districtContainsVenue(heroSelectedDistrict,venue)&&(heroCategoryFilter==='all'||venueFacilityType(venue[2])===heroCategoryFilter)),step=heroSelectedProvince?1:(innerWidth<760?Math.max(1,Math.floor(visibleVenues.length/5200)):Math.max(1,Math.floor(visibleVenues.length/8500)));if(heroSelectedProvince){const selectedFeature=provinces.find(feature=>feature.properties.name===heroSelectedProvince);heroCtx.save();heroCtx.beginPath();eachRing(selectedFeature.geometry,ring=>{ring.forEach((point,index)=>{const[x,y]=heroProject(point[0],point[1]);index?heroCtx.lineTo(x,y):heroCtx.moveTo(x,y)});heroCtx.closePath()});heroCtx.clip('evenodd')}
  for(let index=0;index<visibleVenues.length;index+=step){const venue=visibleVenues[index],[x,y]=heroProject(venue[1],venue[0]);if(x<x0-4||x>x0+mapW+4||y<y0-4||y>y0+mapH+4)continue;drawVenueMarker(heroCtx,x,y,venueFacilityType(venue[2]),heroSelectedProvince?(innerWidth<760?1.45:1.7):(innerWidth<760?.78:.95),true)}
  if(heroSelectedProvince)heroCtx.restore();
}
function heroProvinceAt(clientX,clientY){
  if(!mapData||!heroMapLayout)return null;const rect=heroMapCanvas.getBoundingClientRect(),x=clientX-rect.left,y=clientY-rect.top,{x0,y0,mapW,mapH,view}=heroMapLayout;
  if(x<x0||x>x0+mapW||y<y0||y>y0+mapH)return null;
  const lon=view.minLon+(x-x0)/mapW*(view.maxLon-view.minLon),lat=view.maxLat-(y-y0)/mapH*(view.maxLat-view.minLat);
  if(heroSelectedProvince){const locked=provinces.find(feature=>feature.properties.name===heroSelectedProvince);return locked&&provinceContains(locked,lon,lat)?locked:null}return provinces.find(feature=>provinceContains(feature,lon,lat))||null;
}
function showProvinceTooltip(feature,event){
  if(!feature){provinceMapTooltip.classList.remove('visible');return}const panelRect=heroMapPanel.getBoundingClientRect();provinceMapTooltip.querySelector('strong').textContent=feature.properties.name;provinceMapTooltip.querySelector('span').textContent=`${Number(feature.properties.count||0).toLocaleString('th-TH')} สนาม · คลิกเพื่อดูข้อมูล`;provinceMapTooltip.style.left=`${event.clientX-panelRect.left}px`;provinceMapTooltip.style.top=`${event.clientY-panelRect.top}px`;provinceMapTooltip.classList.add('visible');
}
function showDistrictTooltip(district,event){
  if(!district){provinceMapTooltip.classList.remove('visible');return}const panelRect=heroMapPanel.getBoundingClientRect();provinceMapTooltip.querySelector('strong').textContent=district.n;provinceMapTooltip.querySelector('span').textContent=`${Number(district.c||0).toLocaleString('th-TH')} แห่ง · คลิกเพื่อกรองอำเภอนี้`;provinceMapTooltip.style.left=`${event.clientX-panelRect.left}px`;provinceMapTooltip.style.top=`${event.clientY-panelRect.top}px`;provinceMapTooltip.classList.add('visible');
}
function renderScopeSummary(scopeVenues,{name,subtitle,thirdValue,thirdLabel,buttonText,contextLabel}){
  const sportCounts=new Map();scopeVenues.forEach(venue=>sportCounts.set(venue[4],(sportCounts.get(venue[4])||0)+1));const sports=[...sportCounts].sort((a,b)=>b[1]-a[1]).slice(0,4),max=sports[0]?.[1]||1;updateFacilityCards(scopeVenues,contextLabel);
  document.querySelector('#province-detail-name').textContent=name;document.querySelector('#province-detail-region').textContent=subtitle;document.querySelector('#province-detail-total').textContent=scopeVenues.length.toLocaleString('th-TH');document.querySelector('#province-detail-sports').textContent=sportCounts.size.toLocaleString('th-TH');document.querySelector('#province-detail-districts').textContent=Number(thirdValue||0).toLocaleString('th-TH');document.querySelector('.province-detail-kpis div:nth-child(1) span').textContent='สถานที่มีพิกัด';document.querySelector('.province-detail-kpis div:nth-child(3) span').textContent=thirdLabel;
  const sportBox=document.querySelector('#province-sports');sportBox.innerHTML=sports.map(([sport,count])=>`<div class="province-sport-row"><b></b><em>${count.toLocaleString('th-TH')}</em><span><i style="--bar-scale:${(count/max).toFixed(3)}"></i></span></div>`).join('');sports.forEach(([sport],index)=>sportBox.children[index].querySelector('b').textContent=sport);document.querySelector('#province-detail-link').childNodes[0].textContent=`${buttonText} `;
}
function renderProvinceDetail(feature){
  const name=feature.properties.name,provinceVenues=venues.filter(venue=>venue[3]===name);heroSelectedProvince=name;heroSelectedDistrict=null;heroHoveredDistrict=null;heroMapPanel.dataset.district='';provinceDetail.querySelector(':scope > small').textContent='PROVINCE SNAPSHOT';renderScopeSummary(provinceVenues,{name,subtitle:`ข้อมูลสถานที่กีฬาที่เชื่อมโยงในจังหวัด${name}`,thirdValue:0,thirdLabel:'อำเภอ / เขต',buttonText:`ดูข้อมูลจังหวัด${name}`,contextLabel:`จังหวัด${name}`});document.querySelector('#province-detail-districts').textContent='…';heroHoveredProvince=null;heroMapPanel.classList.add('has-province');mapIntro.classList.add('province-focus');provinceDetail.setAttribute('aria-hidden','false');provinceMapTooltip.classList.remove('visible');drawHeroMap();zoomHeroToProvince(feature);
  provinceSearchInput.value=name;
  if(innerWidth<761)setTimeout(()=>provinceDetail.scrollIntoView({behavior:reduceMotion?'auto':'smooth',block:'center'}),180);
}
function renderDistrictDetail(district){
  const feature=provinces.find(item=>item.properties.name===heroSelectedProvince);if(!feature||!district)return;if(heroSelectedDistrict===district){renderProvinceDetail(feature);return}heroSelectedDistrict=district;heroHoveredDistrict=district;const districtVenues=venues.filter(venue=>venue[3]===heroSelectedProvince&&districtContainsVenue(district,venue)),nonzeroTypes=new Set(districtVenues.map(venue=>venueFacilityType(venue[2]))).size;heroMapPanel.dataset.district=district.n;provinceDetail.querySelector(':scope > small').textContent='DISTRICT SNAPSHOT';renderScopeSummary(districtVenues,{name:district.n,subtitle:`อำเภอ${district.n} · จังหวัด${heroSelectedProvince}`,thirdValue:nonzeroTypes,thirdLabel:'ประเภทสถานที่',buttonText:`กลับไปดูภาพรวมจังหวัด${heroSelectedProvince}`,contextLabel:`อำเภอ${district.n}`});provinceMapTooltip.classList.remove('visible');drawHeroMap();
}
function renderNationalProvinceDetail(){
  if(!mapData)return;
  heroSelectedDistrict=null;heroHoveredDistrict=null;heroMapPanel.dataset.district='';provinceDetail.querySelector(':scope > small').textContent='NATIONAL SNAPSHOT';renderScopeSummary(venues,{name:'ทั่วประเทศไทย',subtitle:'ภาพรวมสถานที่กีฬาที่มีพิกัด ครบทั้ง 77 จังหวัด',thirdValue:provinces.length,thirdLabel:'จังหวัด',buttonText:'สำรวจข้อมูลระดับจังหวัด',contextLabel:'ประเทศไทย'});const total=document.querySelector('#national-facility-total');if(total)total.textContent=venues.length.toLocaleString('th-TH');provinceDetail.setAttribute('aria-hidden','true');provinceSearchInput.value='';
}
heroMapCanvas.addEventListener('pointermove',event=>{if(heroHoverFrame)return;heroHoverFrame=requestAnimationFrame(()=>{heroHoverFrame=0;if(heroSelectedProvince){const district=heroDistrictAt(event.clientX,event.clientY);if(district!==heroHoveredDistrict){heroHoveredDistrict=district;drawHeroMap()}heroMapCanvas.style.cursor=district?'pointer':'default';showDistrictTooltip(district,event);return}const feature=heroProvinceAt(event.clientX,event.clientY),name=feature?.properties.name||null;if(name!==heroHoveredProvince){heroHoveredProvince=name;drawHeroMap()}heroMapCanvas.style.cursor=feature?'pointer':'crosshair';showProvinceTooltip(feature,event)})},{passive:true});
heroMapCanvas.addEventListener('pointerleave',()=>{heroHoveredProvince=null;heroHoveredDistrict=null;provinceMapTooltip.classList.remove('visible');drawHeroMap()},{passive:true});
heroMapCanvas.addEventListener('click',event=>{if(heroSelectedProvince){const district=heroDistrictAt(event.clientX,event.clientY);if(district)renderDistrictDetail(district);return}const feature=heroProvinceAt(event.clientX,event.clientY);if(feature)renderProvinceDetail(feature)});
function closeHeroProvince(){const token=++heroCameraToken;heroSelectedProvince=null;heroSelectedDistrict=null;heroHoveredDistrict=null;heroDistrictReveal=0;heroCategoryFilter='all';heroMapPanel.dataset.district='';heroMapPanel.classList.remove('has-province','is-zooming');mapIntro.classList.remove('province-focus');renderNationalProvinceDetail();animateHeroView(bounds,720,token)}
document.querySelector('.province-detail-close').addEventListener('click',closeHeroProvince);
document.querySelector('.map-focus-backdrop').addEventListener('click',closeHeroProvince);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&heroSelectedProvince)closeHeroProvince()});
document.querySelector('#province-detail-link').addEventListener('click',()=>{if(!heroSelectedProvince)return;if(heroSelectedDistrict){const feature=provinces.find(item=>item.properties.name===heroSelectedProvince);renderProvinceDetail(feature);return}location.hash='nation';selectProvince(heroSelectedProvince)});
provinceSearchForm.addEventListener('submit',event=>{event.preventDefault();const term=provinceSearchInput.value.trim().replace(/^จังหวัด/,'');const feature=provinces.find(item=>item.properties.name===term)||provinces.find(item=>item.properties.name.includes(term));if(!feature){provinceSearchInput.setCustomValidity('ไม่พบจังหวัดนี้ กรุณาเลือกชื่อจากรายการ');provinceSearchInput.reportValidity();return}provinceSearchInput.setCustomValidity('');renderProvinceDetail(feature)});
provinceSearchInput.addEventListener('input',()=>provinceSearchInput.setCustomValidity(''));
document.querySelectorAll('[data-province-category]').forEach(card=>card.addEventListener('click',()=>{const next=heroCategoryFilter===card.dataset.provinceCategory?'all':card.dataset.provinceCategory;heroCategoryFilter=next;document.querySelectorAll('[data-province-category]').forEach(item=>item.classList.toggle('active',item.dataset.provinceCategory===next));document.querySelectorAll('[data-category-line]').forEach(line=>line.classList.toggle('active',line.dataset.categoryLine===next));drawHeroMap()}));
function heroSearchMatches(value) {
  const term=value.trim().toLowerCase();
  if(term.length<2)return [];
  return venues.filter(venue=>(`${venue[2]} ${venue[3]} ${venue[4]}`).toLowerCase().includes(term)).slice(0,6);
}
function renderHeroSearch(value) {
  if(!mapData||value.trim().length<2){heroSearchResults.classList.remove('open');heroSearchResults.innerHTML='';return;}
  const matches=heroSearchMatches(value);heroSearchResults.innerHTML='';
  if(!matches.length){const empty=document.createElement('div');empty.className='hero-search-empty';empty.textContent='ไม่พบสนามที่ตรงกับคำค้นหา';heroSearchResults.append(empty);}
  matches.forEach((venue,index)=>{const button=document.createElement('button');button.type='button';button.className='hero-search-result';button.setAttribute('role','option');button.innerHTML=`<b></b><small></small><span aria-hidden="true">↗</span>`;button.querySelector('b').textContent=venue[2];button.querySelector('small').textContent=`${venue[3]} · ${venue[4]}`;button.addEventListener('click',()=>openHeroVenue(venue));heroSearchResults.append(button);});
  heroSearchResults.classList.add('open');
}
function openHeroVenue(venue) {
  heroSearchInput.value=venue[2];heroSearchResults.classList.remove('open');location.hash='nation';selectProvince(venue[3]);
  setTimeout(()=>{query=venue[2].toLowerCase();searchInput.value=venue[2];drawMap();selectedPlace.innerHTML='<small>SPORTS FACILITY</small><h3></h3><p></p><div><span></span></div>';selectedPlace.querySelector('h3').textContent=venue[2];selectedPlace.querySelector('p').textContent=`${venue[3]} · ${venue[4]} · ${venue[5]==='indoor'?'ในร่ม':venue[5]==='outdoor'?'กลางแจ้ง':'ไม่ระบุ'}`;selectedPlace.querySelector('span').textContent=`${venue[0].toFixed(3)}, ${venue[1].toFixed(3)}`;},500);
}
heroSearchInput.addEventListener('input',()=>renderHeroSearch(heroSearchInput.value));
heroSearchInput.addEventListener('focus',()=>renderHeroSearch(heroSearchInput.value));
heroSearchForm.addEventListener('submit',event=>{event.preventDefault();const match=heroSearchMatches(heroSearchInput.value)[0];if(match)openHeroVenue(match);else renderHeroSearch(heroSearchInput.value);});
document.addEventListener('click',event=>{if(!heroSearchForm.contains(event.target))heroSearchResults.classList.remove('open')});
function venueVisible(v) { return (selectedProvince==='all'||v[3]===selectedProvince)&&districtContainsVenue(mapSelectedDistrict,v)&&(envFilter==='all'||v[5]===envFilter)&&(mapCategoryFilter==='all'||venueFacilityType(v[2])===mapCategoryFilter)&&(!query||(v[2]+' '+v[3]+' '+v[4]).toLowerCase().includes(query)); }
function scopeVenuesForPanel(){
  return venues.filter(v=>(selectedProvince==='all'||v[3]===selectedProvince)&&districtContainsVenue(mapSelectedDistrict,v)&&(envFilter==='all'||v[5]===envFilter)&&(!query||(v[2]+' '+v[3]+' '+v[4]).toLowerCase().includes(query)));
}
function countVenuesByType(scopeVenues){
  const counts=Object.fromEntries(facilityTypes.map(type=>[type,0]));
  scopeVenues.forEach(venue=>counts[venueFacilityType(venue[2])]++);
  return counts;
}
function renderMapFacilityBreakdown(scopeVenues){
  if(!mapFacilityBreakdown||!mapFacilityGrid)return;
  if(selectedProvince==='all'||!scopeVenues.length){mapFacilityBreakdown.hidden=true;mapFacilityGrid.innerHTML='';return}
  const counts=countVenuesByType(scopeVenues);
  const chips=facilityTypes.filter(type=>counts[type]>0).map(type=>{
    const active=mapCategoryFilter===type?' active':'';
    return `<button type="button" class="map-facility-chip${active}" data-map-category="${type}" aria-pressed="${mapCategoryFilter===type}"><i style="background:${FACILITY_COLORS[type]}"></i><span>${FACILITY_LABELS[type]}</span><strong>${counts[type].toLocaleString('th-TH')}</strong></button>`;
  }).join('');
  mapFacilityGrid.innerHTML=chips;
  mapFacilityBreakdown.hidden=!chips;
}
function topVenuesForPanel(scopeVenues,limit=3){
  const typeRank=Object.fromEntries(facilityTypes.map((type,index)=>[type,index]));
  const filtered=mapCategoryFilter==='all'?scopeVenues:scopeVenues.filter(venue=>venueFacilityType(venue[2])===mapCategoryFilter);
  return [...filtered].sort((a,b)=>{
    const rank=typeRank[venueFacilityType(a[2])]-typeRank[venueFacilityType(b[2])];
    if(rank)return rank;
    return String(a[2]).localeCompare(String(b[2]),'th');
  }).slice(0,limit);
}
function renderNearbyVenuesList(scopeVenues){
  if(!nearbyVenuesList)return;
  if(selectedProvince==='all'){nearbyVenuesList.hidden=true;nearbyVenuesList.innerHTML='';return}
  const top=topVenuesForPanel(scopeVenues,3);
  const title=mapSelectedDistrict
    ?`ท็อป ${top.length} ในอำเภอ${mapSelectedDistrict.n}`
    :mapCategoryFilter!=='all'
      ?`ท็อป ${top.length} · ${FACILITY_LABELS[mapCategoryFilter]}`
      :`ท็อป ${top.length} สนามในจังหวัด`;
  if(!top.length){
    nearbyVenuesList.innerHTML=`<div><small>สนามกีฬาแนะนำ</small><strong id="nearby-venues-title">ไม่พบสนามในตัวกรองนี้</strong></div>`;
    nearbyVenuesList.hidden=false;
    return;
  }
  nearbyVenuesList.innerHTML=`<div><small>สนามกีฬาแนะนำ</small><strong id="nearby-venues-title">${title}</strong></div>${top.map((venue,index)=>{
    const type=venueFacilityType(venue[2]);
    return `<button type="button" data-nearby-venue="${index}"><span style="color:${FACILITY_COLORS[type]}">${String(index+1).padStart(2,'0')}</span><b></b><small></small></button>`;
  }).join('')}`;
  top.forEach((venue,index)=>{
    const type=venueFacilityType(venue[2]);
    const button=nearbyVenuesList.querySelector(`[data-nearby-venue="${index}"]`);
    if(!button)return;
    button.querySelector('b').textContent=venue[2];
    button.querySelector('small').textContent=`${venue[4]||selectedProvince} · ${FACILITY_LABELS[type]||type}`;
    button.addEventListener('click',()=>selectVenueOnMap(venue));
  });
  nearbyVenuesList.hidden=false;
}
function selectVenueOnMap(venue){
  if(!venue)return;
  const type=venueFacilityType(venue[2]);
  const env=venue[5]==='indoor'?'ในร่ม':venue[5]==='outdoor'?'กลางแจ้ง':'';
  selectedPlace.innerHTML=`<small>SPORTS FACILITY</small><h3>${venue[2]}</h3><p>${FACILITY_LABELS[type]||type} · ${venue[3]} · ${venue[4]}${env?` · ${env}`:''}</p>`;
}
function updateSelectedPlacePanel(){
  syncMapLayoutState();
  if(selectedProvince==='all'){selectedPlace.innerHTML='<h3>สำรวจสนามทั่วประเทศ</h3>';renderMapFacilityBreakdown([]);renderNearbyVenuesList([]);return}
  const scope=scopeVenuesForPanel(),visible=venues.filter(venueVisible),filterNote=mapCategoryFilter!=='all'?` · ${FACILITY_LABELS[mapCategoryFilter]}`:'';
  if(mapSelectedDistrict){selectedPlace.innerHTML=`<small>DISTRICT</small><h3>${mapSelectedDistrict.n}</h3><p>อำเภอ${mapSelectedDistrict.n} · จังหวัด${selectedProvince} · ${visible.length.toLocaleString('th-TH')} สนาม${filterNote}</p>`;renderMapFacilityBreakdown(scope);renderNearbyVenuesList(scope);return}
  const count=provinces.find(p=>p.properties.name===selectedProvince)?.properties.count||scope.length;
  selectedPlace.innerHTML=`<small>PROVINCE</small><h3>${selectedProvince}</h3><p>${visible.length.toLocaleString('th-TH')} สนาม${filterNote||` · รวม ${count.toLocaleString('th-TH')} แห่ง`} · คลิกหมุดหรืออำเภอบนแผนที่</p>`;
  renderMapFacilityBreakdown(scope);
  renderNearbyVenuesList(scope);
}
async function selectDistrictOnMap(district,{animate=true,provinceFeature=null}={}){
  if(!district)return;
  if(selectedProvince==='all'){
    let feature=provinceFeature;
    if(!feature&&!heroDistrictData){try{await loadDistrictBoundaries()}catch{}}
    if(!feature&&heroDistrictData){feature=provinces.find(item=>(heroDistrictData.provinces[item.properties.id]||[]).some(entry=>entry.n===district.n))}
    if(feature){await openDistrict(district,feature,{zoomToDistrict:animate});return}
  }
  if(selectedProvince==='all')return;
  if(mapSelectedDistrict===district){mapSelectedDistrict=null;mapHoveredDistrict=null;if(districtSelect)districtSelect.value='';const feature=provinces.find(item=>item.properties.name===selectedProvince);if(feature)await window.__nationMapSvg?.zoomToProvince(feature,{animate});updateSelectedPlacePanel();return}
  mapSelectedDistrict=district;mapHoveredDistrict=district;if(districtSelect)districtSelect.value=district.n;updateSelectedPlacePanel();
  await window.__nationMapSvg?.zoomToDistrict(district,{animate});
}
async function selectProvince(name,{animate=true,preserveSearch=false}={}){
  if(!preserveSearch){query='';searchInput.value='';}
  mapSelectedDistrict=null;mapHoveredDistrict=null;mapCategoryFilter='all';provinceSelect.value=name;
  if(name==='all'){
    pendingProvinceSelection=null;
    selectedProvince='all';
    populateDistrictSelect('all');
    mapBody?.classList.add('is-collapsing');
    await window.__nationMapSvg?.resetMap({animate});
    updateSelectedPlacePanel();
    return;
  }
  if(!mapData||!provinces.length){pendingProvinceSelection=name;return}
  const feature=provinces.find(p=>p.properties.name===name);if(!feature)return;
  pendingProvinceSelection=null;selectedProvince=name;
  updateSelectedPlacePanel();await zoomMapToProvince(feature,{animate});
}
function findProvinceByTerm(term){
  const value=term.trim().replace(/^จังหวัด/,'');if(value.length<2)return null;
  return provinces.find(item=>item.properties.name===value)||provinces.find(item=>item.properties.name.includes(value))||null;
}
async function applyMapSearch(raw){
  const districtMatch=await findDistrictByTerm(raw.replace(/^อำเภอ/,''));
  if(districtMatch){searchInput.value=districtMatch.district.n;await openDistrict(districtMatch.district,districtMatch.feature);return true}
  const provinceMatch=findProvinceByTerm(raw);
  if(provinceMatch){searchInput.value=provinceMatch.properties.name;await selectProvince(provinceMatch.properties.name,{preserveSearch:true});return true}
  query=raw.toLowerCase();
  const matches=venues.filter(venue=>(`${venue[2]} ${venue[3]} ${venue[4]}`).toLowerCase().includes(query));
  if(matches.length===1){const venue=matches[0];searchInput.value=venue[2];await selectProvince(venue[3],{preserveSearch:true});return true}
  drawMap();
  selectedPlace.hidden=false;
  selectedPlace.innerHTML=`<small>SEARCH</small><h3>${query?`“${raw}”`:'สนามทั่วประเทศ'}</h3><p>พบ ${matches.length.toLocaleString('th-TH')} สถานที่ — เลือกรายการที่ใกล้เคียงเพื่อซูม</p>`;
  syncMapLayoutState();
  return false;
}

districtSelect?.addEventListener('change',async()=>{
  const name=districtSelect.value;
  if(!name){mapSelectedDistrict=null;mapHoveredDistrict=null;const feature=provinces.find(item=>item.properties.name===selectedProvince);if(feature)await window.__nationMapSvg?.zoomToProvince(feature,{animate:true});updateSelectedPlacePanel();return}
  const district=currentMapDistricts().find(item=>item.n===name);if(district)await selectDistrictOnMap(district);
});
mapFacilityGrid?.addEventListener('click',event=>{
  const chip=event.target.closest('[data-map-category]');if(!chip)return;
  const type=chip.dataset.mapCategory;
  mapCategoryFilter=mapCategoryFilter===type?'all':type;
  updateSelectedPlacePanel();drawMap();
});
document.querySelector('#map-reset')?.addEventListener('click',()=>{searchInput.value='';selectProvince('all')});
let searchTimer;searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>applyMapSearch(searchInput.value.trim()),220)});
searchInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();clearTimeout(searchTimer);applyMapSearch(searchInput.value.trim())}});

document.querySelectorAll('.place-card').forEach(card=>card.addEventListener('click',()=>{const venue=venues.find(v=>v[2].includes(card.dataset.place)||card.dataset.place.includes(v[2]));if(!venue)return;location.hash='nation';selectProvince(venue[3]);setTimeout(()=>{selectedPlace.innerHTML=`<small>VENUE</small><h3>${venue[2]}</h3><p>${venue[3]} · ${venue[4]}</p>`;tooltip.innerHTML=`<strong>${venue[2]}</strong><span>${venue[3]}</span>`;tooltip.classList.add('visible')},700)}));

window.__nationMapApi={selectProvince,selectDistrictOnMap,selectVenueOnMap,loadDistrictBoundaries,assignDistrictCounts,populateDistrictSelect,venueFacilityType,FACILITY_COLORS,FACILITY_LABELS};
new ResizeObserver(drawHeroMap).observe(heroMapCanvas);
provinceSelect.addEventListener('change',()=>selectProvince(provinceSelect.value));
fetch('assets/data/national-sports-map.json').then(response=>response.json()).then(async data=>{
  mapData=data;provinces=data.provinces.features.sort((a,b)=>a.properties.name.localeCompare(b.properties.name,'th'));venues=data.venues;
  bounds=computeNationalBounds();heroViewBounds={...bounds};
  provinceSelect.insertAdjacentHTML('beforeend',provinces.map(p=>`<option value="${p.properties.name}">${p.properties.name} (${p.properties.count.toLocaleString('th-TH')})</option>`).join(''));
  provinceSearchOptions.innerHTML=provinces.map(feature=>`<option value="${feature.properties.name}"></option>`).join('');
  renderNationalProvinceDetail();
  mapIntroDataReady=true;animateMapIntroMetrics();
  drawHeroMap();
  window.__nationMapSvg?.buildMap(provinces);
  const queued=pendingProvinceSelection||(provinceSelect.value!=='all'?provinceSelect.value:null);
  if(queued){pendingProvinceSelection=null;await selectProvince(queued,{animate:false})}
  else updateSelectedPlacePanel();
}).catch(error=>{mapLoading.innerHTML='<span>ไม่สามารถโหลดข้อมูลแผนที่ได้ กรุณาเปิดผ่าน serve.bat</span>';console.error(error)});
