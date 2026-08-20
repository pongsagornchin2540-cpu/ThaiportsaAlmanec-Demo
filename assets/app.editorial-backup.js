const events = [
  {date:'18 ส.ค. 69',end:'18 ส.ค. 69',name:'บางพระฟรีแดนซ์ “Dance for Fun & Good Health @ BangPhra”',type:'นันทนาการ',place:'อาคารอเนกประสงค์ วัดบางปรงธรรมโชติการาม',province:'ฉะเชิงเทรา',icon:'✦'},
  {date:'18 ส.ค. 69',end:'31 ส.ค. 69',name:'การแข่งขันกีฬานักเรียนประจำจังหวัดและอำเภอ ประจำปี 2569',type:'กีฬานักเรียน',place:'สำนักงานการท่องเที่ยวและกีฬาจังหวัดหนองคาย',province:'หนองคาย',icon:'★'},
  {date:'20 ส.ค. 69',end:'21 ส.ค. 69',name:'การแข่งขันกรีฑา ชิงชนะเลิศจังหวัดหนองคาย',type:'กรีฑา',place:'สนามกีฬากลางจังหวัดหนองคาย',province:'หนองคาย',icon:'➜'},
  {date:'21 ส.ค. 69',end:'21 ส.ค. 69',name:'โครงการแข่งขันกีฬาสานสัมพันธ์ชุมชนตำบลสวนแตง',type:'กีฬาชุมชน',place:'โรงเรียนวัดสังฆจายเถร',province:'สุพรรณบุรี',icon:'◎'},
  {date:'21 ส.ค. 69',end:'30 ส.ค. 69',name:'งานเทศกาลส้มโอและของดีอำเภอเวียงแก่น 2569',type:'นันทนาการ',place:'ที่ว่าการอำเภอเวียงแก่น',province:'เชียงราย',icon:'✦'},
  {date:'22 ส.ค. 69',end:'22 ส.ค. 69',name:'โครงการแข่งขันกีฬาดอนกำยานสัมพันธ์',type:'ฟุตบอล',place:'ลานออกกำลังกายวัดดอนกุ่มทิพย์',province:'สุพรรณบุรี',icon:'⚽'},
  {date:'22 ส.ค. 69',end:'23 ส.ค. 69',name:'ท่างามโอเพ่นคัพ',type:'ฟุตบอล',place:'สนามฟุตบอล 7 คน โรงเรียนวัดตุ้มหู',province:'สิงห์บุรี',icon:'⚽'},
  {date:'22 ส.ค. 69',end:'23 ส.ค. 69',name:'singburi open',type:'วอลเลย์บอล',place:'สนามกีฬาวอลเลย์บอลโรงเรียนบางระจันวิทยา',province:'สิงห์บุรี',icon:'●'}
];

const venues = [
  {name:'อินดอร์สเตเดียมหัวหมาก',type:'สนามกีฬาในร่ม',sport:'วอลเลย์บอล',province:'กรุงเทพมหานคร',image:'assets/images/stadium-2.jpg'},
  {name:'สนามกีฬาองค์การบริหารส่วนจังหวัดสระบุรี',type:'สนามกีฬากลางแจ้ง',sport:'กีฬาหลากหลายประเภท',province:'สระบุรี',image:'assets/images/stadium-1.jpg'},
  {name:'ศูนย์ฝึกกีฬาแห่งชาติมวกเหล็ก จังหวัดสระบุรี',type:'ศูนย์ฝึกกีฬา',sport:'7 ประเภทกีฬา',province:'สระบุรี',image:'assets/images/training-1.jpg'},
  {name:'สระว่ายน้ำสวนกุหลาบวิทยาลัย',type:'สนามกีฬาในร่ม',sport:'ว่ายน้ำ',province:'กรุงเทพมหานคร',image:'assets/images/stadium-3.jpg'}
];

const sports = ['ฟุตบอล','วอลเลย์บอล','แบดมินตัน','กรีฑา','ว่ายน้ำ','มวยสากล','จักรยาน','เทควันโด','ตะกร้อ','เปตอง'];

const eventTrack = document.querySelector('#event-track');
function renderEvents(filter='all') {
  const shown = filter === 'all' ? events : events.filter(e => e.type.includes(filter));
  eventTrack.innerHTML = shown.map((e,i) => `<article class="event-card reveal visible" style="--accent:${['#1b7cf0','#7a75ef','#16a77c','#f59b45'][i%4]}"><div class="event-top"><span class="sport-icon" aria-hidden="true">${e.icon}</span><time class="event-date"><strong>${e.date}</strong><small>${e.date===e.end?'วันเดียว':`ถึง ${e.end}`}</small></time></div><h3>${e.name}</h3><div class="event-meta"><span>⌖ ${e.place}</span><span>${e.province}</span></div><span class="event-type">${e.type}</span></article>`).join('');
  if (!shown.length) eventTrack.innerHTML = '<p>ยังไม่พบกิจกรรมในหมวดนี้</p>';
}
renderEvents();

const venueGrid = document.querySelector('#venue-grid');
venueGrid.innerHTML = venues.map((v,i)=>`<button class="venue-card reveal" data-index="${i}" type="button"><div class="venue-image"><img src="${v.image}" alt="${v.name}" loading="lazy"><span>${v.type}</span></div><div class="venue-info"><h3>${v.name}</h3><p>⌖ ${v.province} · ${v.sport}</p><b>ดูรายละเอียด →</b></div></button>`).join('');

const doubled = [...sports,...sports];
document.querySelector('#association-track').innerHTML = doubled.map((s,i)=>`<div class="association-card"><i>${s.slice(0,1)}</i><span>${s}<small>เครือข่ายกีฬาไทย</small></span></div>`).join('');

document.querySelectorAll('.filter-chip').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.filter-chip').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); renderEvents(btn.dataset.filter);
}));
document.querySelector('#event-next').addEventListener('click',()=>eventTrack.scrollBy({left:378,behavior:'smooth'}));
document.querySelector('#event-prev').addEventListener('click',()=>eventTrack.scrollBy({left:-378,behavior:'smooth'}));

const menu = document.querySelector('.primary-nav');
const menuToggle = document.querySelector('.menu-toggle');
menuToggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');menuToggle.setAttribute('aria-expanded',open);menuToggle.setAttribute('aria-label',open?'ปิดเมนู':'เปิดเมนู')});
document.querySelector('.nav-group>button').addEventListener('click',e=>{const group=e.currentTarget.parentElement;const open=group.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',open)});
document.querySelectorAll('.primary-nav a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');menuToggle.setAttribute('aria-expanded','false')}));

const modal = document.querySelector('#venue-modal');
function openVenue(v){document.querySelector('#modal-title').textContent=v.name;document.querySelector('#modal-detail').textContent=`${v.type} สำหรับ${v.sport} ตั้งอยู่ใน${v.province} ข้อมูลสถานที่จากฐานข้อมูล Sports Almanac`;const img=document.querySelector('#modal-image');img.src=v.image;img.alt=v.name;modal.showModal()}
venueGrid.addEventListener('click',e=>{const card=e.target.closest('.venue-card');if(card)openVenue(venues[card.dataset.index])});
document.querySelectorAll('.map-pin').forEach(pin=>pin.addEventListener('click',()=>{const match=venues.find(v=>v.name.includes(pin.dataset.venue)||pin.dataset.venue.includes(v.name));if(match)openVenue(match)}));
document.querySelector('.modal-close').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});

const searchData=[...events.map(e=>({title:e.name,meta:`กิจกรรม · ${e.type} · ${e.province}`,icon:'◉'})),...venues.map(v=>({title:v.name,meta:`${v.type} · ${v.sport} · ${v.province}`,icon:'⌖'}))];
const searchInput=document.querySelector('#search-input'),results=document.querySelector('#search-results');
function doSearch(raw){const q=raw.trim().toLowerCase();if(!q){results.classList.remove('open');return}const found=searchData.filter(x=>(x.title+' '+x.meta).toLowerCase().includes(q)).slice(0,5);results.innerHTML=found.length?found.map(x=>`<button type="button" class="search-result"><i>${x.icon}</i><span><strong>${x.title}</strong><small>${x.meta}</small></span></button>`).join(''):`<div class="search-result"><i>⌕</i><span><strong>ไม่พบข้อมูล “${raw}”</strong><small>ลองค้นด้วยชื่อจังหวัดหรือประเภทกีฬา</small></span></div>`;results.classList.add('open')}
document.querySelector('#quick-search').addEventListener('submit',e=>{e.preventDefault();doSearch(searchInput.value)});
searchInput.addEventListener('input',()=>doSearch(searchInput.value));
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{searchInput.value=b.dataset.query;doSearch(b.dataset.query);searchInput.focus()}));
document.addEventListener('click',e=>{if(!e.target.closest('#quick-search')&&!e.target.closest('[data-query]'))results.classList.remove('open')});

const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');revealObserver.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>revealObserver.observe(el));

let counted=false;
function countStats(){if(counted)return;counted=true;document.querySelectorAll('.stat-number').forEach((el,index)=>{const target=+el.dataset.count;if(reduceMotion){el.textContent=target.toLocaleString('th-TH');return}const start=performance.now()+index*120;const duration=1300;function tick(now){const progress=Math.max(0,Math.min(1,(now-start)/duration));const eased=1-Math.pow(1-progress,3);el.textContent=Math.floor(target*eased).toLocaleString('th-TH');if(progress<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)})}
new IntersectionObserver(entries=>{if(entries[0].isIntersecting)countStats()},{threshold:.3}).observe(document.querySelector('.stats'));

if(!reduceMotion){let ticking=false;addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(()=>{const y=Math.min(scrollY,700);document.querySelector('.hero-media').style.transform=`scale(1.025) translateY(${y*.07}px)`;ticking=false});ticking=true}},{passive:true})}
