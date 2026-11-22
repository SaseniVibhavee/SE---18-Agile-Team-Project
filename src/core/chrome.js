import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountFingerprint } from "./fingerprint.js";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   Chrome: sticky nav, overlay index, scroll rail, anchor routing.
   ------------------------------------------------------------------ */

export function initChrome({ lenis = null, reduce = false } = {}) {
  const nav = document.querySelector("[data-nav]");
  const menu = document.querySelector("[data-menu]");
  const openBtn = document.querySelector("[data-menu-open]");
  const closeBtn = document.querySelector("[data-menu-close]");
  const railFill = document.querySelector("[data-rail-fill]");
  const railLabel = document.querySelector("[data-rail-label]");

  /* menu ridges */
  const menuSvg = document.querySelector("[data-menu-svg]");
  if (menuSvg) {
    menuSvg.setAttribute("viewBox", "0 0 800 800");
    mountFingerprint(menuSvg, {
      count: 27,
      cx: 400,
      cy: 400,
      rx: 46,
      ry: 58,
      stepX: 13.1,
      stepY: 13.5,
    });
  }

  /* ---------- nav + rail ---------- */

  let lastY = window.scrollY;
  let ticking = false;

  const updateScrollChrome = () => {
    const y = window.scrollY;
    const delta = y - lastY;

    if (nav) {
      nav.classList.toggle("is-scrolled", y > 40);
      if (y > 220 && delta > 5) nav.classList.add("is-hidden");
      if (delta < -5 || y < 120) nav.classList.remove("is-hidden");
    }

    if (railFill && railLabel) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
      railFill.style.transform = `scaleY(${pct / 100})`;
      railLabel.textContent = String(Math.round(pct)).padStart(3, "0");
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateScrollChrome);
      }
    },
    { passive: true }
  );
  updateScrollChrome();

  /* ---------- overlay menu ---------- */

  let menuOpen = false;
  let lastFocus = null;
  let closeTimer = 0;

  const scrollLock = (locked) => {
    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
    } else {
      document.documentElement.style.overflow = locked ? "hidden" : "";
    }
  };

  const focusables = () =>
    menu
      ? Array.from(
          menu.querySelectorAll("a[href], button:not([disabled])")
        ).filter((el) => el.offsetParent !== null)
      : [];

  const openMenu = () => {
    if (!menu || menuOpen) return;
    menuOpen = true;
    lastFocus = document.activeElement;
    window.clearTimeout(closeTimer);
    menu.hidden = false;
    scrollLock(true);
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => menu.classList.add("is-open"));
    });
    window.setTimeout(() => {
      const first = focusables()[0];
      if (first) first.focus({ preventScroll: true });
    }, 120);
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!menu || !menuOpen) return;
    menuOpen = false;
    menu.classList.remove("is-open");
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
    scrollLock(false);
    closeTimer = window.setTimeout(() => {
      if (!menuOpen) menu.hidden = true;
    }, 850);
    if (restoreFocus && lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
  };

  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", () => closeMenu());

  if (menu) {
    menu.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menuOpen) closeMenu();
  });

  /* ---------- anchors ---------- */

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (!hash || hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    if (menuOpen) closeMenu({ restoreFocus: false });

    const go = () => {
      if (lenis) {
        lenis.scrollTo(target, { offset: -70, duration: 1.25 });
      } else {
        target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
      if (history.replaceState) history.replaceState(null, "", hash);
    };

    if (menuOpen) window.setTimeout(go, 60);
    else go();
  });

  /* gentle fade for the oversized footer wordmark */
  if (!reduce) {
    const wordmark = document.querySelector(".footer__mark");
    if (wordmark) {
      gsap.fromTo(
        wordmark,
        { yPercent: 18, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".footer",
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );
    }
  }
}
