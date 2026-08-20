(() => {
  "use strict";

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const swooshPaths = [
    { main: "M-40 78C220 34 480 98 760 48S1160 12 1480 66", accent: "M-20 96C240 52 500 116 780 66S1170 30 1490 84" },
    { main: "M-40 86C280 24 540 108 820 58S1210 4 1480 74", accent: "M-25 100C295 38 555 122 835 72S1225 18 1495 88" },
    { main: "M-40 72C240 28 500 92 780 42S1180 8 1480 62", accent: "M-15 90C260 46 520 110 800 60S1190 26 1490 80" },
    { main: "M-40 88C260 22 520 106 800 56S1195 10 1480 70", accent: "M-25 102C275 36 535 120 815 70S1210 24 1495 84" },
  ];

  const createSwoosh = (index) => {
    const paths = swooshPaths[index % swooshPaths.length];
    const connector = document.createElement("div");
    connector.className = `journey-connector journey-connector-${index + 1}`;
    connector.setAttribute("aria-hidden", "true");
    connector.innerHTML = `<svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path class="swoosh-main" d="${paths.main}"/><path class="swoosh-accent" d="${paths.accent}"/></svg>`;
    return connector;
  };

  const journey = [
    "#about-hero",
    "#about-story",
    "#about-objectives",
    "#about-store",
    "#about-people",
    "#about-promise",
  ]
    .map((sel) => document.querySelector(sel))
    .filter(Boolean);

  journey.slice(0, -1).forEach((section, index) => {
    section.after(createSwoosh(index));
  });

  const revealTargets = [
    ...document.querySelectorAll(".ab-prose-col"),
    ...document.querySelectorAll(".ab-section-head"),
    ...document.querySelectorAll(".ab-goal-grid li"),
    ...document.querySelectorAll(".ab-data-list li"),
    ...document.querySelectorAll(".ab-people-copy > *"),
    ...document.querySelectorAll(".ab-close-grid > *"),
  ];

  revealTargets.forEach((el) => el.setAttribute("data-ab-reveal", ""));
  document.querySelectorAll(".ab-hero-copy > *").forEach((el) => el.classList.add("is-visible"));

  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index % 4, 3) * 60}ms`;
      observer.observe(node);
    });
  } else {
    revealTargets.forEach((node) => node.classList.add("is-visible"));
  }
})();
