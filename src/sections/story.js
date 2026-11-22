/* ------------------------------------------------------------------
   IN ACTION — one story, three views.
   Student → AI tutor → lecturer.

   Desktop: the stage is sticky and the slides scrub with the page
   scroll (GSAP ScrollTrigger). Clicking a tab scrolls to that step.
   Touch / small screens: a plain carousel with tabs, arrows and swipe.
   ------------------------------------------------------------------ */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initStory({ reduce = false, lenis = null } = {}) {
  const root = document.querySelector("#story");
  if (!root) return;

  const shell = root.querySelector(".story__shell");
  const pin = root.querySelector("[data-story-pin]");
  const stage = root.querySelector("[data-story-stage]");
  const viewport = root.querySelector("[data-story-viewport]");
  const track = root.querySelector("[data-story-track]");
  const slides = Array.from(root.querySelectorAll("[data-story-slide]"));
  const tabs = Array.from(root.querySelectorAll("[data-story-tab]"));
  const prev = root.querySelector("[data-story-prev]");
  const next = root.querySelector("[data-story-next]");
  const count = root.querySelector("[data-story-count]");
  const bar = root.querySelector("[data-story-bar]");

  if (!viewport || !track || !slides.length) return;

  const last = slides.length - 1;
  const pad = (n) => String(n + 1).padStart(2, "0");
  const clamp = (n) => Math.max(0, Math.min(last, n));

  let index = 0;
  let scrollMode = false;
  let trigger = null;
  let resizeTimer = 0;

  const tallest = () => Math.max(...slides.map((slide) => slide.offsetHeight));

  const setHeight = () => {
    // In scroll mode every slide shares the tallest height, so the
    // sticky stage never jumps while the track scrubs.
    const height = scrollMode ? tallest() : slides[index].offsetHeight;
    viewport.style.height = `${height}px`;
  };

  /* ---------- state paint (no scrolling) ---------- */

  const paint = (i, { move = true } = {}) => {
    const changed = i !== index;
    index = i;

    slides.forEach((slide, n) => {
      const active = n === i;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });

    tabs.forEach((tab, n) => {
      const active = n === i;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.setAttribute("tabindex", active ? "0" : "-1");
    });

    if (count) count.textContent = `${pad(i)} / ${pad(last)}`;
    if (bar && !scrollMode) bar.style.width = `${((i + 1) / slides.length) * 100}%`;

    if (move && !scrollMode) track.style.transform = `translateX(-${i * 100}%)`;
    if (!scrollMode) setHeight();

    if (changed) {
      root.dispatchEvent(new CustomEvent("story:change", { detail: { index: i } }));
    }
  };

  /* ---------- scroll progress → horizontal position ---------- */

  const setProgress = (p) => {
    const x = Math.max(0, Math.min(1, p)) * last;
    track.style.transform = `translateX(-${x * 100}%)`;
    if (bar) bar.style.width = `${((x + 1) / slides.length) * 100}%`;

    const nearest = Math.round(x);
    if (nearest !== index) paint(nearest, { move: false });
  };

  /* ---------- navigation ---------- */

  const scrollToStep = (i) => {
    if (!trigger) return;
    const span = trigger.end - trigger.start;
    const y = trigger.start + (span * i) / last;
    if (lenis) lenis.scrollTo(y, { duration: 1 });
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  };

  const go = (target, { focus = false } = {}) => {
    const i = clamp(target);

    if (scrollMode) scrollToStep(i);
    else paint(i);

    if (focus && tabs[i]) tabs[i].focus({ preventScroll: true });
  };

  tabs.forEach((tab, i) => tab.addEventListener("click", () => go(i)));
  prev?.addEventListener("click", () => go(index - 1));
  next?.addEventListener("click", () => go(index + 1));

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1, { focus: true });
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1, { focus: true });
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0, { focus: true });
    } else if (e.key === "End") {
      e.preventDefault();
      go(last, { focus: true });
    }
  });

  /* ---------- swipe (touch / pen, small screens) ---------- */

  let startX = 0;
  let startY = 0;
  let tracking = false;

  viewport.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" || scrollMode) return;
    tracking = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  viewport.addEventListener("pointerup", (e) => {
    if (!tracking) return;
    tracking = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    go(dx < 0 ? index + 1 : index - 1);
  });

  viewport.addEventListener("pointercancel", () => {
    tracking = false;
  });

  /* ---------- fit the stage inside the viewport ---------- */

  const fitStage = () => {
    if (!stage) return;
    stage.style.transform = "";
    if (!scrollMode) return;

    const navH = document.querySelector(".nav")?.offsetHeight || 0;
    const available = window.innerHeight - navH - 28;
    const natural = stage.offsetHeight;
    const scale = natural > 0 ? Math.min(1, available / natural) : 1;
    stage.style.transform = scale < 0.995 ? `scale(${scale})` : "";
  };

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      setHeight();
      fitStage();
      ScrollTrigger.refresh();
    }, 140);
  };
  window.addEventListener("resize", onResize);

  /* ---------- scroll-driven mode (desktop) ---------- */

  const mm = gsap.matchMedia();

  mm.add("(min-width: 981px)", () => {
    if (reduce || !pin || !shell) return;

    scrollMode = true;
    root.classList.add("is-scroll");

    setHeight();
    fitStage();

    trigger = ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      endTrigger: shell,
      end: "bottom bottom",
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: (self) => setProgress(self.progress),
      onRefresh: () => {
        setHeight();
        fitStage();
      },
    });

    setProgress(trigger.progress);
    ScrollTrigger.refresh();

    return () => {
      trigger = null;
      scrollMode = false;
      root.classList.remove("is-scroll");
      if (stage) stage.style.transform = "";
      track.style.transform = `translateX(-${index * 100}%)`;
      setHeight();
    };
  });

  /* ---------- initialize ---------- */

  paint(0);
  requestAnimationFrame(() => {
    setHeight();
    fitStage();
  });
  window.setTimeout(() => {
    setHeight();
    fitStage();
    ScrollTrigger.refresh();
  }, 400);
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      setHeight();
      fitStage();
      ScrollTrigger.refresh();
    });
  }
}
