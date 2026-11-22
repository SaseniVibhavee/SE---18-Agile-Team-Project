import gsap from "gsap";
import { mountFingerprint } from "./fingerprint.js";

/* ------------------------------------------------------------------
   The cold open: ridges draw, a scan line passes, the word lands.
   Then the whole print expands and the paper wipes upward.
   ------------------------------------------------------------------ */

export function runPreloader({ reduce = false } = {}) {
  return new Promise((resolve) => {
    const root = document.querySelector("[data-preloader]");
    if (!root) {
      document.body.classList.remove("is-loading");
      resolve();
      return;
    }

    const svg = root.querySelector("[data-preloader-svg]");
    const scan = root.querySelector("[data-preloader-scan]");
    const percentEl = root.querySelector("[data-preloader-percent]");
    const statusEl = root.querySelector("[data-preloader-status]");
    const stamp = root.querySelector("[data-preloader-stamp]");
    const pulse = root.querySelector("[data-preloader-pulse]");
    const print = root.querySelector("[data-preloader-print]");
    const clock = root.querySelector("[data-preloader-clock]");
    const skip = root.querySelector("[data-preloader-skip]");

    let done = false;
    let tl = null;
    let ticker = null;

    const cleanup = () => {
      if (done) return;
      done = true;
      if (tl) tl.kill();
      if (ticker) clearInterval(ticker);
      root.style.display = "none";
      root.remove();
      document.body.classList.remove("is-loading");
      document.documentElement.classList.remove("is-loading");
      resolve();
    };

    const startClock = () => {
      const t0 = performance.now();
      const pad = (n) => String(n).padStart(2, "0");
      ticker = setInterval(() => {
        const s = Math.floor((performance.now() - t0) / 1000);
        if (clock) clock.textContent = `00:00:${pad(s % 60)}`;
      }, 1000);
    };

    let paths = [];
    try {
      paths = mountFingerprint(svg, { count: 23 });
    } catch {
      paths = [];
    }

    if (paths.length) {
      paths.forEach((p) => {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      });
    }

    if (reduce) {
      paths.forEach((p) => {
        p.style.strokeDashoffset = "0";
      });
      if (percentEl) percentEl.textContent = "100%";
      if (statusEl) statusEl.textContent = "FINGERPRINT MATCHED";
      if (stamp) {
        stamp.style.opacity = "1";
        stamp.style.transform = "translate(-50%, -50%) scale(1) rotate(-9deg)";
      }
      if (scan) scan.style.display = "none";
      startClock();
      window.setTimeout(cleanup, 650);
      return;
    }

    if (skip) {
      skip.addEventListener("click", cleanup, { once: true });
    }

    if (stamp) {
      gsap.set(stamp, {
        xPercent: -50,
        yPercent: -50,
        rotation: -16,
        scale: 2.8,
        opacity: 0,
      });
    }

    startClock();

    const state = { v: 0 };
    let lastStatus = "";

    const setProgress = () => {
      const v = state.v;
      if (percentEl) percentEl.textContent = `${Math.round(v)}%`;
      if (scan && print) {
        const h = print.clientHeight;
        scan.style.transform = `translateY(${(v / 100) * h}px)`;
        scan.style.opacity = v >= 100 ? "0" : "1";
      }
      if (statusEl) {
        const label =
          v < 34 ? "READING FINGER" : v < 72 ? "CHECKING" : "ALMOST DONE";
        if (label !== lastStatus) {
          lastStatus = label;
          statusEl.textContent = label;
        }
      }
    };

    tl = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      onComplete: cleanup,
    });

    if (paths.length) {
      tl.to(
        paths,
        {
          strokeDashoffset: 0,
          duration: 1.55,
          stagger: 0.016,
          ease: "power1.inOut",
        },
        0
      );
    }

    tl.to(
      state,
      {
        v: 100,
        duration: 1.95,
        ease: "power2.inOut",
        onUpdate: setProgress,
      },
      0
    );

    tl.add(() => {
      if (scan) scan.style.opacity = "0";
      if (statusEl) statusEl.textContent = "FINGERPRINT MATCHED";
      if (pulse) {
        gsap.fromTo(
          pulse,
          { opacity: 0.9, scale: 0.75 },
          { opacity: 0, scale: 1.4, duration: 0.9, ease: "power2.out" }
        );
      }
      if (stamp) {
        gsap.to(stamp, {
          opacity: 1,
          scale: 1,
          rotation: -9,
          duration: 0.5,
          ease: "back.out(1.9)",
        });
      }
    });
    tl.to(
      [root.querySelector(".preloader__meta"), root.querySelector(".preloader__readout"), root.querySelector(".preloader__foot")],
      { opacity: 0, duration: 0.22 },
      "+=0.42"
    );

    tl.to(
      print,
      { scale: 4.2, opacity: 0, duration: 0.85, ease: "power2.in" },
      "-=0.1"
    );

    tl.to(
      root,
      { clipPath: "inset(0 0 100% 0)", duration: 0.8, ease: "power3.inOut" },
      "-=0.7"
    );

    /* safety: never trap the page behind the loader */
    window.setTimeout(() => {
      if (!done) cleanup();
    }, 7000);
  });
}
