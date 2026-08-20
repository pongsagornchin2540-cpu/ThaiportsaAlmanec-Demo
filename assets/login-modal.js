(() => {
  const MODAL_VERSION = "7";
  const LOGO_SRC = "assets/images/logo-almanac.png";

  function closeDialog(dialog) {
    if (!dialog) return;
    try {
      if (typeof dialog.close === "function") dialog.close();
    } catch (_) {
      /* ignore */
    }
    dialog.removeAttribute("open");
    dialog.setAttribute("aria-hidden", "true");
  }

  function ensureModal() {
    let dialog = document.getElementById("login-modal");
    if (dialog && dialog.dataset.modalVersion !== MODAL_VERSION) {
      dialog.remove();
      dialog = null;
    }
    if (dialog) {
      if (dialog.dataset.closeBound !== "1") wireClose(dialog);
      return dialog;
    }

    dialog = document.createElement("dialog");
    dialog.id = "login-modal";
    dialog.className = "login-modal";
    dialog.dataset.modalVersion = MODAL_VERSION;
    dialog.setAttribute("aria-labelledby", "login-modal-title");
    dialog.innerHTML = `
      <div class="login-modal-shell">
        <aside class="login-modal-brand" aria-label="Thailand Sports Almanac">
          <div class="login-modal-brand-inner">
            <a href="index.html" aria-label="หน้าหลัก">
              <img src="${LOGO_SRC}" alt="Thailand Sports Almanac" width="220" height="220">
            </a>
          </div>
        </aside>
        <div class="login-modal-panel">
          <button type="button" class="login-modal-close" aria-label="ปิด" data-login-close>&times;</button>
          <div class="login-modal-body">
            <h2 id="login-modal-title">ยินดีต้อนรับ</h2>
            <p class="login-modal-status" id="login-modal-status" role="status" aria-live="polite"></p>
            <form class="login-modal-form" id="login-modal-form" novalidate>
              <label>
                อีเมล
                <input id="login-username" name="username" type="email" autocomplete="username" required placeholder="โปรดระบุ">
              </label>
              <label class="login-modal-password">
                รหัสผ่าน
                <input id="login-password" name="password" type="password" autocomplete="current-password" required placeholder="โปรดระบุ">
                <button type="button" class="login-modal-toggle" id="login-password-toggle" aria-label="แสดงรหัสผ่าน">👁</button>
              </label>
              <div class="login-modal-row">
                <label class="login-modal-check"><input type="checkbox" name="remember"> จำฉันไว้ในระบบ</label>
                <a class="login-modal-link" href="#forgot-password">ลืมรหัสผ่าน?</a>
              </div>
              <button class="login-modal-submit" type="submit">เข้าสู่ระบบ</button>
              <p class="login-modal-register">ไม่เคยมีบัญชี? <a href="#register">สมัครสมาชิก</a></p>
              <div class="login-modal-divider" aria-hidden="true">หรือ</div>
              <button class="login-modal-google" type="button" id="login-google-btn">
                <span class="login-modal-google-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </span>
                เข้าสู่ระบบด้วย Google
              </button>
            </form>
          </div>
        </div>
      </div>`;
    document.body.appendChild(dialog);
    wireClose(dialog);
    wireForm(dialog);
    return dialog;
  }

  function wireClose(dialog) {
    if (dialog.dataset.closeBound === "1") return;
    dialog.dataset.closeBound = "1";

    const closeBtn = dialog.querySelector("[data-login-close], .login-modal-close");
    closeBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeDialog(dialog);
    });

    dialog.addEventListener("click", (event) => {
      const closer = event.target.closest?.("[data-login-close], .login-modal-close");
      if (closer) {
        event.preventDefault();
        event.stopPropagation();
        closeDialog(dialog);
        return;
      }
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });
  }

  function wireForm(dialog) {
    if (dialog.dataset.formBound === "1") return;
    dialog.dataset.formBound = "1";

    const status = dialog.querySelector("#login-modal-status");
    const form = dialog.querySelector("#login-modal-form");
    const googleBtn = dialog.querySelector("#login-google-btn");
    const toggleBtn = dialog.querySelector("#login-password-toggle");
    const passwordInput = dialog.querySelector("#login-password");

    const showStatus = (message, isError = false) => {
      if (!status) return;
      status.textContent = message;
      status.classList.add("is-visible");
      status.classList.toggle("is-error", isError);
    };

    const clearStatus = () => {
      if (!status) return;
      status.textContent = "";
      status.classList.remove("is-visible", "is-error");
    };

    dialog.addEventListener("close", () => {
      clearStatus();
      form?.reset();
      if (passwordInput) passwordInput.type = "password";
      if (toggleBtn) toggleBtn.setAttribute("aria-label", "แสดงรหัสผ่าน");
    });

    toggleBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!passwordInput) return;
      const show = passwordInput.type === "password";
      passwordInput.type = show ? "text" : "password";
      toggleBtn.setAttribute("aria-label", show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน");
    });

    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = form.username?.value?.trim();
      const password = form.password?.value || "";
      if (!username || !password) {
        showStatus("กรุณากรอกอีเมลและรหัสผ่านให้ครบ", true);
        return;
      }
      const submit = form.querySelector(".login-modal-submit");
      if (submit) submit.disabled = true;
      showStatus("กำลังตรวจสอบข้อมูลเข้าสู่ระบบ…");
      setTimeout(() => {
        if (submit) submit.disabled = false;
        showStatus("ระบบเข้าสู่ระบบจะพร้อมใช้งานเมื่อเปิดบริการจริง — ข้อมูลที่กรอกยังไม่ถูกส่งออก");
      }, 700);
    });

    googleBtn?.addEventListener("click", () => {
      showStatus("Google จะเชื่อมต่อเมื่อเปิดใช้งานจริงบนระบบของหน่วยงาน");
    });

    dialog.querySelector('a[href="#forgot-password"]')?.addEventListener("click", (event) => {
      event.preventDefault();
      showStatus("ฟีเจอร์กู้รหัสผ่านจะพร้อมใช้งานในระยะถัดไป");
    });

    dialog.querySelector('a[href="#register"]')?.addEventListener("click", (event) => {
      event.preventDefault();
      showStatus("การสมัครสมาชิกจะพร้อมใช้งานในระยะถัดไป — หรือใช้ Google เมื่อเปิดบริการ");
    });
  }

  function openLoginModal(event) {
    if (event) event.preventDefault();
    const existing = document.getElementById("login-modal");
    if (existing && (existing.dataset.modalVersion !== MODAL_VERSION || !existing.querySelector("[data-login-close]"))) {
      existing.remove();
    }
    const dialog = ensureModal();
    dialog.removeAttribute("aria-hidden");
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    queueMicrotask(() => dialog.querySelector("#login-username")?.focus());
  }

  function wireLoginTriggers() {
    document.querySelectorAll('a.login[href="#login"], a.login[href$="#login"], a.mobile-login').forEach((link) => {
      if (link.dataset.loginBound === "1") return;
      link.dataset.loginBound = "1";
      link.setAttribute("role", "button");
      link.addEventListener("click", openLoginModal);
    });
  }

  function ensureMobileLoginEntry() {
    const mobileMenu = document.querySelector("#mobile-menu, .mobile-menu");
    if (!mobileMenu || mobileMenu.querySelector(".mobile-login")) return;
    const link = document.createElement("a");
    link.className = "mobile-login";
    link.href = "#login";
    link.innerHTML = 'เข้าสู่ระบบ <span aria-hidden="true">↗</span>';
    mobileMenu.appendChild(link);
  }

  function boot() {
    ensureMobileLoginEntry();
    wireLoginTriggers();
  }

  window.LoginModal = {
    open: openLoginModal,
    ensure: ensureModal,
    wire: wireLoginTriggers,
    close: () => closeDialog(document.getElementById("login-modal")),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
