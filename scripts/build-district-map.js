const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const provinces = JSON.parse(fs.readFileSync(path.join(root, 'Apps/data/thailand-adm1.geojson'), 'utf8')).features;
const districts = JSON.parse(fs.readFileSync(path.join(root, 'Apps/data/thailand-adm2.geojson'), 'utf8')).features;
const districtRows = fs.readFileSync(path.join(root, 'Apps/data/public/districts.csv'), 'utf8').trim().split(/\r?\n/).slice(1);
const normalizeName = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const thaiDistrictNames = new Map(districtRows.map(line => {
  const columns = [...line.matchAll(/"([^"]*)"/g)].map(match => match[1]);
  return [normalizeName(columns[2]), columns[1]];
}));
const districtNameAliases = new Map(Object.entries({
  chun: 'จุน', dokkhamtai: 'ดอกคำใต้', phukamyao: 'ภูกามยาว', maepoen: 'แม่เปิน',
  vibhavadi: 'วิภาวดี', vadhana: 'เขต วัฒนา', rongkwang: 'ร้องกวาง', nonsuwan: 'โนนสุวรรณ',
  mueangbuengkan: 'บึงกาฬ', bacho: 'บาเจาะ', galyanivadhana: 'กัลยาณิวัฒนา'
}));
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) { let previous = row[0];row[0] = i;for (let j = 1; j <= b.length; j++) { const old = row[j];row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));previous = old; } }
  return row[b.length];
}
function thaiDistrictName(englishName) {
  const key = normalizeName(englishName), alias = districtNameAliases.get(key), exact = thaiDistrictNames.get(key);if (alias) return alias;if (exact) return exact;
  let bestKey = '', bestScore = Infinity;for (const candidate of thaiDistrictNames.keys()) { const score = editDistance(key, candidate) / Math.max(key.length, candidate.length, 1);if (score < bestScore) { bestScore = score;bestKey = candidate; } }
  return bestScore <= .28 ? thaiDistrictNames.get(bestKey) : englishName;
}

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function contains(feature, x, y) {
  const polygonContains = polygon => pointInRing(x, y, polygon[0]) && !polygon.slice(1).some(ring => pointInRing(x, y, ring));
  return feature.geometry.type === 'Polygon'
    ? polygonContains(feature.geometry.coordinates)
    : feature.geometry.coordinates.some(polygonContains);
}

function outerRings(geometry) {
  return geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map(polygon => polygon[0]);
}

function centroid(ring) {
  let area = 0, x = 0, y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;x += (ring[j][0] + ring[i][0]) * cross;y += (ring[j][1] + ring[i][1]) * cross;
  }
  return Math.abs(area) < 1e-12 ? ring[0] : [x / (3 * area), y / (3 * area)];
}

function perpendicularDistance(point, start, end) {
  const dx = end[0] - start[0], dy = end[1] - start[1];
  if (!dx && !dy) return Math.hypot(point[0] - start[0], point[1] - start[1]);
  const t = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function simplify(points, tolerance = .0018) {
  if (points.length <= 5) return points;
  let maxDistance = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) { maxDistance = distance; index = i; }
  }
  if (maxDistance <= tolerance) return [points[0], points[points.length - 1]];
  return simplify(points.slice(0, index + 1), tolerance).slice(0, -1).concat(simplify(points.slice(index), tolerance));
}

function simplifyGeometry(geometry) {
  const round = point => [Number(point[0].toFixed(5)), Number(point[1].toFixed(5))];
  const simplifyRing = ring => simplify(ring).map(round);
  return geometry.type === 'Polygon'
    ? { type: 'Polygon', coordinates: geometry.coordinates.map(simplifyRing) }
    : { type: 'MultiPolygon', coordinates: geometry.coordinates.map(polygon => polygon.map(simplifyRing)) };
}

const grouped = Object.fromEntries(provinces.map(feature => [feature.properties.shapeISO, []]));
for (const district of districts) {
  const rings = outerRings(district.geometry).sort((a, b) => b.length - a.length);
  const sample = centroid(rings[0]);
  let province = provinces.find(feature => contains(feature, sample[0], sample[1]));
  if (!province) province = provinces.find(feature => contains(feature, rings[0][Math.floor(rings[0].length / 2)][0], rings[0][Math.floor(rings[0].length / 2)][1]));
  if (!province && district.properties.shapeName === 'Ko Yao') province = provinces.find(feature => feature.properties.shapeISO === 'TH-82');
  if (!province) throw new Error(`Unable to assign district: ${district.properties.shapeName}`);
  grouped[province.properties.shapeISO].push({ n: thaiDistrictName(district.properties.shapeName), g: simplifyGeometry(district.geometry) });
}

const output = { meta: { districts: districts.length, source: 'Apps/data/thailand-adm2.geojson' }, provinces: grouped };
fs.writeFileSync(path.join(__dirname, '../assets/data/thailand-districts.json'), JSON.stringify(output));
console.log(`Built ${output.meta.districts} district boundaries.`);
