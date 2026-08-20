(() => {
  function setMobileOpen(open) {
    const menuBtn = document.querySelector(".menu-button");
    const mobileMenu = document.querySelector(".mobile-menu");
    mobileMenu?.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    menuBtn?.setAttribute("aria-expanded", String(open));
  }

  function wireNav() {
    const menuBtn = document.querySelector(".menu-button");
    const mobileMenu = document.querySelector(".mobile-menu");
    const navShell = document.querySelector(".nav-shell");

    menuBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      setMobileOpen(!mobileMenu?.classList.contains("open"));
    });

    document.querySelectorAll(".nav-dropdown-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const group = btn.closest(".nav-group");
        const willOpen = !group?.classList.contains("open");
        document.querySelectorAll(".nav-group.open").forEach((g) => {
          if (g === group) return;
          g.classList.remove("open");
          g.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", "false");
        });
        group?.classList.toggle("open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
      });
    });

    document.querySelectorAll(".mobile-accordion-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const item = btn.closest(".mobile-accordion");
        const open = !item?.classList.contains("open");
        document.querySelectorAll(".mobile-accordion.open").forEach((el) => {
          if (el !== item) {
            el.classList.remove("open");
            el.querySelector(".mobile-accordion-trigger")?.setAttribute("aria-expanded", "false");
          }
        });
        item?.classList.toggle("open", open);
        btn.setAttribute("aria-expanded", String(open));
      });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest?.(".nav-group")) {
        document.querySelectorAll(".nav-group.open").forEach((g) => {
          g.classList.remove("open");
          g.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", "false");
        });
      }
      if (mobileMenu?.classList.contains("open") && !e.target.closest?.(".nav-shell")) {
        setMobileOpen(false);
      }
    });

    document.querySelectorAll(".mobile-menu a").forEach((a) => {
      a.addEventListener("click", () => setMobileOpen(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".nav-group.open").forEach((g) => {
        g.classList.remove("open");
        g.querySelector(".nav-dropdown-trigger")?.setAttribute("aria-expanded", "false");
      });
      if (mobileMenu?.classList.contains("open")) setMobileOpen(false);
    });

    if (navShell) {
      const onScroll = () => {
        navShell.classList.toggle("is-scrolled", window.scrollY > 30);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const PLACEHOLDER = "assets/images/hero-sports-thailand.png";

  function coverOr(url) {
    return url && String(url).trim() ? String(url) : PLACEHOLDER;
  }

  window.Portal = { wireNav, escapeHtml, coverOr, PLACEHOLDER, setMobileOpen };
  document.addEventListener("DOMContentLoaded", wireNav);
})();
