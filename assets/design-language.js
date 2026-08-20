/* Shared reveal + count-up for premium pages */
(() => {
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

  function wireReveals(selector = ".dl-reveal") {
    const nodes = [...document.querySelectorAll(selector)].filter((n) => !n.classList.contains("is-in"));
    if (!nodes.length) return;
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
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
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );
    nodes.forEach((n, i) => {
      n.style.transitionDelay = `${Math.min(i * 40, 240)}ms`;
      io.observe(n);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireReveals(".fp-reveal");
    wireReveals(".dl-reveal");
  });

  function animateCount(el, to, { duration = 900, decimals = 0 } = {}) {
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = Number(to) || 0;
    if (reduced) {
      el.textContent = target.toLocaleString("th-TH", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return;
    }
    const start = performance.now();
    const from = 0;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      el.textContent = value.toLocaleString("th-TH", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function swooshHtml(extraClass = "") {
    return `<div class="dl-swoosh ${extraClass}" aria-hidden="true">
      <svg viewBox="0 0 1440 64" preserveAspectRatio="none" focusable="false">
        <path fill="currentColor" d="M0,26 C240,64 480,0 720,30 C960,60 1200,10 1440,38 L1440,64 L0,64 Z"></path>
      </svg>
    </div>`;
  }

  window.DesignLanguage = { wireReveals, animateCount, swooshHtml, EASE };
})();
