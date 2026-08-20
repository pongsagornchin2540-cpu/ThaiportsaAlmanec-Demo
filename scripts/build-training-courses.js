/**
 * Build training-courses.json from sports_almanac DB dump.
 * Usage: node scripts/build-training-courses.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SQL_PATH = path.resolve(ROOT, '..', 'sports_almanac_db_2026-08-11.sql');
const OUT_PATH = path.resolve(ROOT, 'assets', 'data', 'training-courses.json');
const UPLOAD_BASE = 'https://sports-almanac.go.th/wp-content/uploads/';
const SITE_BASE = 'https://sports-almanac.go.th/course/';

function readSql() {
  if (!fs.existsSync(SQL_PATH)) throw new Error(`SQL dump not found: ${SQL_PATH}`);
  return fs.readFileSync(SQL_PATH, 'utf8');
}

function mapSimpleLookup(sql, table) {
  const map = new Map();
  const pattern = new RegExp(`INSERT INTO \\\`${table}\\\`[^;]+;`, 's');
  const block = sql.match(pattern)?.[0] || '';
  const rowPattern = /\((\d+),\s*'((?:\\'|[^'])*)'\)/g;
  let match;
  while ((match = rowPattern.exec(block))) {
    map.set(match[1], match[2].replace(/\\'/g, "'"));
  }
  return map;
}

function mapCourses(sql) {
  const map = new Map();
  const blockStart = sql.indexOf('INSERT INTO `wp_course`');
  const block = sql.slice(blockStart, blockStart + 120000);
  const rowPattern = /^\t\((\d+),\s*'((?:\\'|[^'])*)',\s*(\d+),\s*(\d+),\s*(\d+),/gm;
  let match;
  while ((match = rowPattern.exec(block))) {
    map.set(match[1], {
      name: match[2].replace(/\\'/g, "'"),
      course_level: match[4],
      course_type: match[5]
    });
  }
  return map;
}

function mapAttachments(sql) {
  const map = new Map();
  const filePattern = /\((\d+),\s*(\d+),\s*'_wp_attached_file',\s*'((?:\\'|[^'])*)'\)/g;
  let match;
  while ((match = filePattern.exec(sql))) {
    map.set(match[2], `${UPLOAD_BASE}${match[3].replace(/\\'/g, "'")}`);
  }
  const metaPattern = /\((\d+),\s*(\d+),\s*'_wp_attachment_metadata',\s*'[^']*s:6:"height";i:\d+;s:4:"file";s:\d+:"((?:\\'|[^"])*)"/g;
  while ((match = metaPattern.exec(sql))) {
    if (!map.has(match[2])) {
      map.set(match[2], `${UPLOAD_BASE}${match[3].replace(/\\'/g, "'")}`);
    }
  }
  return map;
}

function extractTrainingRows(sql) {
  const blockStart = sql.indexOf('INSERT INTO `wp_course_training`');
  const blockEnd = sql.indexOf('-- Dumping structure for table sports_almanac_db.wp_course_training_form', blockStart);
  const block = sql.slice(blockStart, blockEnd);
  return block
    .split('\n')
    .filter(line => line.trim().startsWith('('))
    .map(line => {
      const match = line.match(/^\t\((\d+),\s*(\d+),\s*'(\d+)',\s*'(\d+)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'(\d*)',\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'((?:\\'|[^'])*)',\s*'(\d+)'/);
      if (!match) return null;
      return {
        id: match[1],
        course_id: match[2],
        year: match[3],
        batch: match[4],
        image_id: match[5],
        place: match[6].replace(/\\'/g, "'"),
        province_id: match[7],
        status: /,\s*1,\s*\d+,\s*'/.test(line) ? '1' : '0'
      };
    })
    .filter(Boolean)
    .filter(row => row.status === '1');
}

function build() {
  const sql = readSql();
  const courses = mapCourses(sql);
  const levels = mapSimpleLookup(sql, 'wp_course_level');
  const types = mapSimpleLookup(sql, 'wp_course_types');
  const provinces = mapSimpleLookup(sql, 'wp_province');
  const attachments = mapAttachments(sql);
  const trainings = extractTrainingRows(sql);

  const fallbackImages = [
    'assets/images/training-1.jpg',
    'assets/images/stadium-1.jpg',
    'assets/images/stadium-2.jpg',
    'assets/images/stadium-3.jpg'
  ];

  const items = trainings
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map((row, index) => {
      const course = courses.get(row.course_id) || {name: 'หลักสูตรอบรม', course_level: '', course_type: ''};
      const level = levels.get(course.course_level) || '';
      const category = types.get(course.course_type) || '';
      const province = provinces.get(row.province_id) || '';
      const location = [row.place, province].filter(Boolean).join(', ');
      const image = attachments.get(row.image_id) || fallbackImages[index % fallbackImages.length];

      return {
        id: row.id,
        name: `${course.name} (${row.batch}/${row.year})`,
        category_name: category,
        level_name: level,
        year: row.year,
        date_display: `รุ่นที่ ${row.batch} · พ.ศ. ${row.year}`,
        image_cover: image,
        location_display: location,
        url: `${SITE_BASE}?page_display=course_detail&training_id=${row.id}`
      };
    });

  const payload = {
    status: 'success',
    source: 'sports_almanac_db',
    generated_at: new Date().toISOString(),
    courses: items,
    total_count: items.length
  };

  fs.mkdirSync(path.dirname(OUT_PATH), {recursive: true});
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${items.length} courses -> ${OUT_PATH}`);
}

build();
