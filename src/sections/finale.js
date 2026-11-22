import { mountFingerprint } from "../core/fingerprint.js";
import { playChime } from "../core/audio.js";

/* ------------------------------------------------------------------
   FINALE — hold the print, ridges fill, PRESENT lands.
   ------------------------------------------------------------------ */

export function initFinale({ reduce = false } = {}) {
  const button = document.querySelector("[data-scan-button]");
  const wrap = document.querySelector(".scan-button-wrap");
  const finale = document.querySelector(".finale");
  const fill = document.querySelector("[data-scan-fill]");
  const base = document.querySelector("[data-scan-base]");
  const hint = document.querySelector("[data-scan-hint]");
  const readout = document.querySelector("[data-scan-readout]");
  const live = document.querySelector("[data-scan-live]");
  const reset = document.querySelector("[data-scan-reset]");

  if (!button || !wrap || !finale) return;

  const paths = mountFingerprint(base, { count: 23 });
  mountFingerprint(fill, { count: 23 });
  void paths;

  const DURATION = 1200;
  let holding = false;
  let done = false;
  let progress = 0;
  let startedAt = 0;
  let raf = 0;
  let resetTimer = 0;

  const paint = (p) => {
    if (fill) fill.style.clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
  };

  const setReadout = (text) => {
    if (readout) readout.textContent = text;
  };
  const setHint = (text) => {
    if (hint) hint.textContent = text;
  };

  const success = () => {
    if (done) return;
    done = true;
    holding = false;
    cancelAnimationFrame(raf);
    paint(1);
    button.classList.remove("is-holding");
    wrap.classList.add("is-present");
    finale.classList.add("is-present");
    button.setAttribute("aria-label", "Marked present");
    setReadout("PRESENT · 0.31s");
    setHint("FINGERPRINT MATCHED");
    if (live) live.textContent = "You're marked present. Demo complete.";
    playChime(523.25);
    if (navigator.vibrate) navigator.vibrate([14, 40, 22]);
    document.dispatchEvent(
      new CustomEvent("attesta:present", { detail: { record: "0482" } })
    );
  };

  const cancelHold = () => {
    if (done || !holding) return;
    holding = false;
    cancelAnimationFrame(raf);
    button.classList.remove("is-holding");
    progress = 0;
    paint(0);
    setReadout("STOPPED");
    setHint("HOLD LONGER — 1.2s");
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      if (done) return;
      setReadout("IDLE");
      setHint(reduce ? "CLICK TO MARK PRESENT" : "HOLD 1.2s");
    }, 1000);
  };

  const tick = (now) => {
    if (!holding) return;
    progress = Math.min(1, (now - startedAt) / DURATION);
    paint(progress);
    setReadout(`SCANNING · ${String(Math.round(progress * 100)).padStart(2, "0")}%`);
    if (progress >= 1) {
      success();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (done || holding) return;
    if (reduce) {
      success();
      return;
    }
    holding = true;
    startedAt = performance.now();
    button.classList.add("is-holding");
    setHint("KEEP HOLDING…");
    setReadout("SCANNING · 00%");
    raf = requestAnimationFrame(tick);
  };

  button.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    start();
  });
  button.addEventListener("contextmenu", (e) => e.preventDefault());
  button.addEventListener("pointerup", cancelHold);
  button.addEventListener("pointerleave", cancelHold);
  button.addEventListener("pointercancel", cancelHold);

  button.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    if (e.repeat) return;
    e.preventDefault();
    start();
  });
  button.addEventListener("keyup", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    cancelHold();
  });

  if (reduce) {
    button.addEventListener("click", success);
    setHint("CLICK TO MARK PRESENT");
  }

  reset?.addEventListener("click", () => {
    done = false;
    holding = false;
    progress = 0;
    cancelAnimationFrame(raf);
    paint(0);
    wrap.classList.remove("is-present");
    finale.classList.remove("is-present");
    button.classList.remove("is-holding");
    button.setAttribute("aria-label", "Hold to mark yourself present");
    setReadout("IDLE");
    setHint(reduce ? "CLICK TO MARK PRESENT" : "HOLD 1.2s");
    if (live) live.textContent = "";
    button.focus({ preventScroll: true });
  });
}
