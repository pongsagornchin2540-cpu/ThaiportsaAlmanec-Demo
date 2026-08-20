(() => {
  const scrollPageToTop = () => window.scrollTo(0, 0);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollPageToTop();
  addEventListener('pageshow', () => {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav?.type === 'reload') scrollPageToTop();
  });
  addEventListener('DOMContentLoaded', scrollPageToTop, {once: true});
  addEventListener('load', scrollPageToTop, {once: true});

  const hero = document.querySelector('#motion-hero');
  const services = document.querySelector('#gateway-services');
  const statsRibbon = document.querySelector('.gateway-stats-ribbon');
  const greenHeartEvents = document.querySelector('#green-heart-events');
  const trainingCourses = document.querySelector('#training-courses');
  const sportRibbon = document.querySelector('.sport-ribbon');
  const ribbonLead = document.querySelector('.ribbon-lead');
  const events = document.querySelector('#events');
  const nation = document.querySelector('#nation');

  if (hero && statsRibbon) hero.after(statsRibbon);
  if (statsRibbon && services) statsRibbon.after(services);
  else if (hero && services) hero.after(services);
  if (services && greenHeartEvents) services.after(greenHeartEvents);
  if (greenHeartEvents && nation) greenHeartEvents.after(nation);
  else if (services && nation) services.after(nation);
  const mapApp = document.querySelector('#nation .map-app');
  const nationShell = document.querySelector('#nation .nation-shell');
  if (trainingCourses && mapApp) mapApp.before(trainingCourses);

  // Keep courses at the top of #nation, then full-bleed ribbon, then map.
  if (nation && nationShell && trainingCourses && mapApp && sportRibbon) {
    if (trainingCourses.parentElement !== nationShell) {
      nationShell.prepend(trainingCourses);
    }
    const shellBottom = document.createElement('div');
    shellBottom.className = 'nation-shell';
    shellBottom.appendChild(mapApp);
    nation.prepend(nationShell);
    nationShell.after(sportRibbon);
    if (ribbonLead) sportRibbon.after(ribbonLead);
    (ribbonLead || sportRibbon).after(shellBottom);
  } else {
    if (trainingCourses && sportRibbon) trainingCourses.after(sportRibbon);
    else if (mapApp && sportRibbon) mapApp.before(sportRibbon);
    if (sportRibbon && ribbonLead) sportRibbon.after(ribbonLead);
    else if (mapApp && ribbonLead) mapApp.before(ribbonLead);
  }
  if (nation && events) nation.after(events);

  const mapSearch = document.querySelector('#map-search');
  const mapSearchTerms = {
    training: 'ศูนย์ฝึกกีฬา',
    science: 'วิทยาศาสตร์การกีฬา'
  };

  document.querySelectorAll('[data-map-filter]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const term = mapSearchTerms[link.dataset.mapFilter];
      if (mapSearch && term) {
        mapSearch.value = term;
        mapSearch.dispatchEvent(new Event('input', {bubbles:true}));
      }
      nation?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
    });
  });

  const provinceSelect = document.querySelector('#province-select');
  document.querySelectorAll('[data-near-province]').forEach(button => {
    button.addEventListener('click', () => {
      if (!provinceSelect) return;
      provinceSelect.value = button.dataset.nearProvince;
      provinceSelect.dispatchEvent(new Event('change', {bubbles:true}));
      document.querySelectorAll('[data-near-province]').forEach(item => item.classList.toggle('active', item === button));
    });
  });

  const counters = document.querySelectorAll('[data-gateway-count]');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const numberFormat = new Intl.NumberFormat('en-US');
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const target = Number(element.dataset.gatewayCount);
        const start = performance.now();
        const duration = 900;
        const tick = now => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = numberFormat.format(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        element.textContent = '0';
        requestAnimationFrame(tick);
        counterObserver.unobserve(element);
      });
    }, {threshold:.45});
    counters.forEach(counter => counterObserver.observe(counter));
  }

  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kineticTitles = document.querySelectorAll('.activity-editorial-lead h2,.green-heart-intro h2,.nation-intro h2,.gateway-section-intro h2,.places-head h2');
  kineticTitles.forEach(title => title.classList.add('kinetic-title'));

  const revealObserver = !motionReduced && 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      }, {threshold:.16})
    : null;

  function observeReveal(element) {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add('is-visible');
  }

  document.querySelectorAll('.kinetic-title,.insight-layout article,.activity-editorial-list article').forEach(observeReveal);

  const swooshPaths = [
    {main: 'M-40 92C260 18 520 112 790 62S1190 7 1480 72', accent: 'M-25 103C278 29 520 122 798 72S1195 18 1470 83'},
    {main: 'M-40 78C220 34 480 98 760 48S1160 12 1480 66', accent: 'M-20 96C240 52 500 116 780 66S1170 30 1490 84'},
    {main: 'M-40 86C280 24 540 108 820 58S1210 4 1480 74', accent: 'M-25 100C295 38 555 122 835 72S1225 18 1495 88'},
    {main: 'M-40 72C240 28 500 92 780 42S1180 8 1480 62', accent: 'M-15 90C260 46 520 110 800 60S1190 26 1490 80'},
    {main: 'M-40 88C260 22 520 106 800 56S1195 10 1480 70', accent: 'M-25 102C275 36 535 120 815 70S1210 24 1495 84'},
    {main: 'M-40 80C250 30 510 94 790 44S1185 6 1480 64', accent: 'M-20 98C265 48 525 112 805 62S1200 24 1495 82'}
  ];

  function createSwooshConnector(index, variant) {
    const paths = swooshPaths[index % swooshPaths.length];
    const connector = document.createElement('div');
    connector.className = `journey-connector journey-connector-${(index % swooshPaths.length) + 1}${variant ? ` journey-connector-${variant}` : ''}`;
    connector.setAttribute('aria-hidden', 'true');
    connector.innerHTML = `<svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path class="swoosh-main" d="${paths.main}"/><path class="swoosh-accent" d="${paths.accent}"/></svg>`;
    return connector;
  }

  // One swoosh before each major homepage heading block.
  const journeySections = [statsRibbon, services, greenHeartEvents, nation].filter(Boolean);
  let connectorIndex = 0;
  journeySections.slice(0, -1).forEach((section) => {
    section.after(createSwooshConnector(connectorIndex));
    connectorIndex += 1;
  });

  // Into "ประเทศไทย บนแผนที่กีฬา" after the sport ribbon band.
  if (sportRibbon) {
    const connector = createSwooshConnector(connectorIndex, 'ribbon');
    if (ribbonLead) ribbonLead.after(connector);
    else sportRibbon.after(connector);
    connectorIndex += 1;
  }

  // Fallback if ribbon reorder did not place a connector before the map shell.
  const mapShell = document.querySelector('#nation .nation-shell:last-of-type');
  if (mapShell && !mapShell.previousElementSibling?.classList?.contains('journey-connector')) {
    mapShell.before(createSwooshConnector(connectorIndex));
    connectorIndex += 1;
  }

  const mobileMenu = document.querySelector('#mobile-menu');
  if (mobileMenu) {
    new MutationObserver(() => document.body.classList.toggle('menu-open', mobileMenu.classList.contains('open')))
      .observe(mobileMenu, {attributes:true, attributeFilter:['class']});
  }

  function initEditorialRail(config) {
    const {
      rail,
      railWrap,
      filters,
      levelFilters,
      secondaryPicker,
      secondaryTrigger,
      secondaryMenu,
      secondaryLabel,
      prev,
      next,
      dataUrl,
      itemsKey,
      emptyFilterMessage,
      emptyLoadMessage,
      renderCard,
      getLevelField,
      getSecondaryField,
      secondaryAllLabel,
      levelTabLabel
    } = config;

    if (!rail) return;

    const state = {
      allItems: [],
      filters: {level:'all', secondary:'all'},
      autoScrollPaused: false,
      autoScrollFrame: null,
      resumeTimer: null
    };

    function getFilteredItems() {
      return state.allItems.filter(item => {
        const levelMatch = state.filters.level === 'all' || getLevelField(item) === state.filters.level;
        const secondaryMatch = state.filters.secondary === 'all' || getSecondaryField(item) === state.filters.secondary;
        return levelMatch && secondaryMatch;
      });
    }

    function buildLevelTabs(levels) {
      if (!levelFilters) return;
      levelFilters.innerHTML = [
        `<button type="button" class="green-heart-tab active" data-level="all" role="tab" aria-selected="true">ทั้งหมด</button>`,
        ...levels.map(level => `<button type="button" class="green-heart-tab" data-level="${level}" role="tab" aria-selected="false">${levelTabLabel(level)}</button>`)
      ].join('');
    }

    function buildSecondaryMenu(options) {
      if (!secondaryMenu) return;
      secondaryMenu.innerHTML = options.map(option => (
        `<button type="button" class="green-heart-province-option${option.value === 'all' ? ' is-selected' : ''}" data-value="${option.value}" role="option" aria-selected="${option.value === 'all' ? 'true' : 'false'}" tabindex="${option.value === 'all' ? '0' : '-1'}">${option.label}</button>`
      )).join('');
    }

    function closeSecondaryMenu() {
      if (!secondaryTrigger || !secondaryMenu) return;
      secondaryTrigger.classList.remove('is-open');
      secondaryTrigger.setAttribute('aria-expanded', 'false');
      secondaryMenu.hidden = true;
    }

    function openSecondaryMenu() {
      if (!secondaryTrigger || !secondaryMenu) return;
      secondaryTrigger.classList.add('is-open');
      secondaryTrigger.setAttribute('aria-expanded', 'true');
      secondaryMenu.hidden = false;
      secondaryMenu.querySelector('.green-heart-province-option.is-selected')?.focus();
    }

    function setSecondaryFilter(value, label) {
      state.filters.secondary = value;
      if (secondaryLabel) secondaryLabel.textContent = label;
      secondaryMenu?.querySelectorAll('.green-heart-province-option').forEach(option => {
        const selected = option.dataset.value === value;
        option.classList.toggle('is-selected', selected);
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
        option.setAttribute('tabindex', selected ? '0' : '-1');
      });
      closeSecondaryMenu();
      applyFilters();
    }

    function setupSecondaryPicker(values) {
      if (!secondaryPicker || !secondaryTrigger || !secondaryMenu) return;

      const options = [
        {value:'all', label: secondaryAllLabel},
        ...values.map(value => ({value, label: value}))
      ];
      buildSecondaryMenu(options);

      secondaryTrigger.addEventListener('click', () => {
        const isOpen = secondaryTrigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) closeSecondaryMenu();
        else openSecondaryMenu();
      });

      secondaryMenu.querySelectorAll('.green-heart-province-option').forEach(option => {
        option.addEventListener('click', () => {
          setSecondaryFilter(option.dataset.value, option.textContent.trim());
        });
      });

      document.addEventListener('click', event => {
        if (!secondaryPicker.contains(event.target)) closeSecondaryMenu();
      });

      secondaryTrigger.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          closeSecondaryMenu();
          return;
        }
        if (!secondaryMenu || secondaryMenu.hidden) return;
        const options = [...secondaryMenu.querySelectorAll('.green-heart-province-option')];
        const currentIndex = options.findIndex(option => option.classList.contains('is-selected'));
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          options[Math.min(currentIndex + 1, options.length - 1)]?.focus();
        } else if (event.key === 'ArrowUp') {
          event.preventDefault();
          options[Math.max(currentIndex - 1, 0)]?.focus();
        } else if (event.key === 'Enter' && document.activeElement?.classList.contains('green-heart-province-option')) {
          const active = document.activeElement;
          setSecondaryFilter(active.dataset.value, active.textContent.trim());
        }
      });

      secondaryMenu.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeSecondaryMenu();
      });
    }

    function setupFilters(items) {
      if (!filters || !levelFilters) return;

      const levels = [...new Set(items.map(getLevelField).filter(Boolean))].sort();
      const secondaryValues = [...new Set(items.map(getSecondaryField).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th'));

      buildLevelTabs(levels);
      setupSecondaryPicker(secondaryValues);
      filters.hidden = false;

      levelFilters.querySelectorAll('.green-heart-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          state.filters.level = tab.dataset.level;
          levelFilters.querySelectorAll('.green-heart-tab').forEach(item => {
            const active = item === tab;
            item.classList.toggle('active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          applyFilters();
        });
      });
    }

    function stopAutoScroll() {
      if (state.autoScrollFrame) cancelAnimationFrame(state.autoScrollFrame);
      state.autoScrollFrame = null;
    }

    function startAutoScroll() {
      if (motionReduced || !rail) return;
      stopAutoScroll();

      const tick = () => {
        if (!state.autoScrollPaused && rail.classList.contains('is-auto-scroll')) {
          rail.scrollLeft += 0.45;
          const loopPoint = rail.scrollWidth / 2;
          if (loopPoint > 0 && rail.scrollLeft >= loopPoint) {
            rail.scrollLeft = 0;
          }
        }
        state.autoScrollFrame = requestAnimationFrame(tick);
      };

      state.autoScrollFrame = requestAnimationFrame(tick);
    }

    function pauseAutoScroll(permanent = false) {
      state.autoScrollPaused = true;
      rail?.classList.add('is-paused');
      if (state.resumeTimer) clearTimeout(state.resumeTimer);
      if (!permanent) {
        state.resumeTimer = setTimeout(() => {
          state.autoScrollPaused = false;
          rail?.classList.remove('is-paused');
        }, 3200);
      }
    }

    function renderRail() {
      stopAutoScroll();
      const filtered = getFilteredItems();

      if (!filtered.length) {
        rail.classList.remove('is-auto-scroll');
        rail.innerHTML = `<p class="green-heart-empty">${emptyFilterMessage}</p>`;
        return;
      }

      const cardsHtml = filtered.map(renderCard).join('');
      const canLoop = filtered.length > 1 && state.filters.level === 'all' && state.filters.secondary === 'all';
      rail.innerHTML = canLoop ? cardsHtml + cardsHtml : cardsHtml;
      rail.scrollLeft = 0;
      rail.classList.toggle('is-auto-scroll', canLoop && !motionReduced);

      rail.querySelectorAll('.green-heart-card').forEach((card, index) => {
        card.style.animationDelay = `${Math.min(index * 70, 560)}ms`;
        observeReveal(card);
      });

      if (canLoop && !motionReduced) startAutoScroll();
    }

    function applyFilters() {
      pauseAutoScroll(true);
      renderRail();
    }

    async function initRail() {
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error('cache unavailable');
        const payload = await response.json();
        state.allItems = payload[itemsKey] || [];
        setupFilters(state.allItems);
        renderRail();
      } catch {
        rail.innerHTML = `<p class="green-heart-empty">${emptyLoadMessage}</p>`;
      }
    }

    const scrollRail = direction => {
      pauseAutoScroll();
      const card = rail.querySelector('.green-heart-card');
      const cardWidth = card ? card.getBoundingClientRect().width + 20 : 400;
      rail.scrollBy({
        left: direction * cardWidth,
        behavior: motionReduced ? 'auto' : 'smooth'
      });
    };

    prev?.addEventListener('click', () => scrollRail(-1));
    next?.addEventListener('click', () => scrollRail(1));

    rail?.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollRail(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollRail(-1);
      }
    });

    railWrap?.addEventListener('mouseenter', () => pauseAutoScroll(true));
    railWrap?.addEventListener('mouseleave', () => {
      state.autoScrollPaused = false;
      rail?.classList.remove('is-paused');
    });
    railWrap?.addEventListener('focusin', () => pauseAutoScroll(true));
    railWrap?.addEventListener('focusout', event => {
      if (!railWrap.contains(event.relatedTarget)) {
        state.autoScrollPaused = false;
        rail?.classList.remove('is-paused');
      }
    });
    rail?.addEventListener('wheel', () => pauseAutoScroll(), {passive:true});
    rail?.addEventListener('touchstart', () => pauseAutoScroll(), {passive:true});
    rail?.addEventListener('pointerdown', () => pauseAutoScroll());

    initRail();
  }

  function renderGreenHeartCard(event, index) {
    const image = event.image_cover || 'assets/images/stadium-2.jpg';
    const location = event.location_display || event.province_name || '';
    const level = event.level_name || '';
    const date = event.date_display || '';
    const name = event.name || 'กิจกรรมหัวใจสีเขียว';

    return `<article class="green-heart-card" data-event-id="${event.id}" style="animation-delay:${Math.min(index * 70, 560)}ms">
      <figure class="green-heart-card-media">
        <img src="${image}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async">
        <figcaption class="green-heart-card-overlay">
          <time>${date}</time>
          <h3>${name}</h3>
          <p>⌖ ${location}</p>
          ${level ? `<span class="green-heart-level">${level.replace(/^ระดับ\s*/, '')}</span>` : ''}
        </figcaption>
      </figure>
    </article>`;
  }

  function renderTrainingCourseCard(course, index) {
    const image = course.image_cover || 'assets/images/training-1.jpg';
    const location = course.location_display || '';
    const category = course.category_name || '';
    const date = course.date_display || '';
    const name = course.name || 'หลักสูตรอบรม';
    const url = course.url || 'https://sports-almanac.go.th/course/';

    return `<article class="training-course-card" data-course-id="${course.id}" style="animation-delay:${Math.min(index * 70, 560)}ms">
      <figure class="training-course-card-media">
        <img src="${image}" alt="${name.replace(/"/g, '&quot;')}" loading="lazy" decoding="async">
      </figure>
      <div class="training-course-card-body">
        <time>${date}</time>
        <h3>${name}</h3>
        <p>⌖ ${location}</p>
        ${category ? `<span class="training-course-tag">${category}</span>` : ''}
        <a class="training-course-detail-btn" href="${url}" target="_blank" rel="noopener">ดูรายละเอียดหลักสูตร ↗</a>
      </div>
    </article>`;
  }

  async function initTrainingCourseGrid() {
    const grid = document.querySelector('#training-course-grid');
    if (!grid) return;

    try {
      const response = await fetch('assets/data/training-courses.json');
      if (!response.ok) throw new Error('cache unavailable');
      const payload = await response.json();
      const courses = (payload.courses || []).slice(0, 4);

      if (!courses.length) {
        grid.innerHTML = '<p class="green-heart-empty">ไม่พบหลักสูตรอบรมในขณะนี้</p>';
        return;
      }

      grid.innerHTML = courses.map(renderTrainingCourseCard).join('');
      grid.querySelectorAll('.training-course-card').forEach(card => observeReveal(card));
    } catch {
      grid.innerHTML = '<p class="green-heart-empty">ไม่สามารถโหลดข้อมูลหลักสูตรอบรมได้ในขณะนี้</p>';
    }
  }

  initTrainingCourseGrid();

  async function initUpcomingActivityCalendar() {
    const list = document.querySelector('#activity-calendar');
    if (!list) return;

    const MONTH_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const esc = value => String(value ?? '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    let events = [];
    try {
      const response = await fetch('assets/data/events-index.json');
      if (!response.ok) throw new Error('unavailable');
      const payload = await response.json();
      events = (payload.events || [])
        .filter(ev => ev.start && ev.start >= todayKey)
        .sort((a, b) => String(a.start).localeCompare(String(b.start)))
        .slice(0, 8);
    } catch {
      // Keep static markup as fallback when data cannot load.
    }

    if (events.length) {
      list.innerHTML = events.map(ev => {
        const day = String(Number(ev.start.slice(8, 10)));
        const mon = MONTH_SHORT[Number(ev.start.slice(5, 7)) - 1] || '';
        const place = ev.province || ev.location || 'ทั่วประเทศ';
        return `<article role="button" tabindex="0" data-activity-id="${esc(ev.id)}">
          <time datetime="${esc(ev.start)}"><strong>${esc(day)}</strong><small>${esc(mon)}</small></time>
          <div><h3>${esc(ev.name || 'กิจกรรม')}</h3><p>⌖ ${esc(place)}</p></div>
          <span aria-hidden="true">↗</span>
        </article>`;
      }).join('');
    }

    const byId = new Map(events.map(ev => [String(ev.id), ev]));
    const openFromArticle = async article => {
      const id = article?.dataset?.activityId;
      if (!id) return;
      let ev = byId.get(String(id));
      if (!ev) {
        try {
          const response = await fetch('assets/data/events-index.json');
          const payload = await response.json();
          ev = (payload.events || []).find(item => String(item.id) === String(id));
          if (ev) byId.set(String(id), ev);
        } catch {/* ignore */}
      }
      if (ev && window.ActivityModal) window.ActivityModal.open(ev);
      else if (id) location.href = `activity.html?id=${encodeURIComponent(id)}`;
    };

    list.querySelectorAll('article').forEach(article => {
      // Match static fallback cards by title when data-activity-id is missing.
      if (!article.dataset.activityId) {
        const title = article.querySelector('h3')?.textContent?.trim();
        const match = events.find(ev => ev.name === title);
        if (match) article.dataset.activityId = match.id;
        article.setAttribute('role', 'button');
        if (!article.hasAttribute('tabindex')) article.tabIndex = 0;
      }
      observeReveal(article);
      article.addEventListener('click', () => openFromArticle(article));
      article.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openFromArticle(article);
        }
      });
    });
  }

  initUpcomingActivityCalendar();

  initEditorialRail({
    rail: document.querySelector('#green-heart-rail'),
    railWrap: document.querySelector('#green-heart-events .green-heart-rail-wrap'),
    filters: document.querySelector('#green-heart-filters'),
    levelFilters: document.querySelector('#green-heart-level-filters'),
    secondaryPicker: document.querySelector('#green-heart-province-picker'),
    secondaryTrigger: document.querySelector('#green-heart-province-trigger'),
    secondaryMenu: document.querySelector('#green-heart-province-menu'),
    secondaryLabel: document.querySelector('#green-heart-province-label'),
    prev: document.querySelector('#green-heart-prev'),
    next: document.querySelector('#green-heart-next'),
    dataUrl: 'assets/data/green-heart-events.json',
    itemsKey: 'events',
    emptyFilterMessage: 'ไม่พบกิจกรรมตามตัวกรองที่เลือก',
    emptyLoadMessage: 'ไม่สามารถโหลดข้อมูลกิจกรรมหัวใจสีเขียวได้ในขณะนี้',
    renderCard: renderGreenHeartCard,
    getLevelField: item => item.level_name,
    getSecondaryField: item => item.province_name,
    secondaryAllLabel: 'ทุกจังหวัด',
    levelTabLabel: level => level.replace(/^ระดับ\s*/, '')
  });
})();
