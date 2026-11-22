import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playAlert } from "../core/audio.js";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   THE PROBLEM — a QR that leaks on its own as you scroll.
   The code drifts from the sensor card into the group chat as the
   section passes through the viewport, demonstrating proxy attendance.
   Canvas QR is generated, not an image.
   ------------------------------------------------------------------ */

function mulberry32(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawQR(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const N = 33;
  const cell = canvas.width / N;
  const rand = mulberry32(1804);

  ctx.fillStyle = "#fbf7ee";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#12110f";

  const reserved = new Set();
  const key = (x, y) => `${x}:${y}`;

  const finder = (ox, oy) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        reserved.add(key(ox + x, oy + y));
        if (edge || core) {
          ctx.fillRect((ox + x) * cell, (oy + y) * cell, cell + 0.35, cell + 0.35);
        }
      }
    }
    for (let y = -1; y <= 7; y += 1) {
      for (let x = -1; x <= 7; x += 1) {
        if (x === -1 || y === -1 || x === 7 || y === 7) {
          reserved.add(key(ox + x, oy + y));
        }
      }
    }
  };

  finder(2, 2);
  finder(24, 2);
  finder(2, 24);

  /* alignment block */
  for (let y = 21; y < 26; y += 1) {
    for (let x = 21; x < 26; x += 1) {
      reserved.add(key(x, y));
      const outer = x === 21 || y === 21 || x === 25 || y === 25;
      const inner = x >= 23 && x <= 23 && y >= 23 && y <= 23;
      if (outer || inner) {
        ctx.fillRect(x * cell, y * cell, cell + 0.35, cell + 0.35);
      }
    }
  }

  for (let y = 2; y < 31; y += 1) {
    for (let x = 2; x < 31; x += 1) {
      if (reserved.has(key(x, y))) continue;
      if (rand() < 0.47) {
        ctx.fillRect(x * cell, y * cell, cell + 0.35, cell + 0.35);
      }
    }
  }
}

export function initProblem({ reduce = false } = {}) {
  const stage = document.querySelector("[data-share-stage]");
  const qr = document.querySelector("[data-qr]");
  const drop = document.querySelector("[data-share-drop]");
  const canvas = document.querySelector("[data-qr-canvas]");

  drawQR(canvas);
  if (!stage || !qr || !drop) return;

  let sent = false;
  let lastAlert = 0;

  /* Where the QR needs to travel so it lands inside the chat drop. */
  const target = { x: 0, y: 0 };

  const measure = () => {
    gsap.set(qr, { x: 0, y: 0, rotate: 0, scale: 1 });
    const q = qr.getBoundingClientRect();
    const d = drop.getBoundingClientRect();
    target.x = d.left + d.width / 2 - (q.left + q.width / 2);
    target.y = d.top + d.height * 0.34 - (q.top + q.height / 2);
  };

  const succeed = () => {
    if (sent) return;
    sent = true;
    qr.classList.add("is-sent");
    stage.classList.add("is-shared");
    const now = performance.now();
    if (now - lastAlert > 1200) {
      lastAlert = now;
      playAlert();
    }
  };

  const unsend = () => {
    if (!sent) return;
    sent = false;
    qr.classList.remove("is-sent");
    stage.classList.remove("is-shared");
  };

  measure();
  ScrollTrigger.addEventListener("refreshInit", measure);

  if (reduce) {
    /* Respect reduced motion: no travel, just reveal the outcome in view. */
    gsap.set(qr, { x: 0, y: 0 });
    ScrollTrigger.create({
      trigger: stage,
      start: "top 80%",
      onEnter: succeed,
      onLeaveBack: unsend,
    });
    return;
  }

  /* The QR leaks into the chat as the section scrolls through view. */
  ScrollTrigger.create({
    trigger: stage,
    start: "top 90%",
    end: "center 42%",
    scrub: 0.6,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(qr, {
        x: target.x * p,
        y: target.y * p,
        rotate: 8 * p,
        scale: 1 - 0.22 * p,
      });
      if (p > 0.9) {
        succeed();
      } else {
        unsend();
      }
    },
  });

  /* Re-anchor the travel distance whenever the layout changes. */
  const remeasure = () => {
    measure();
    ScrollTrigger.refresh();
  };
  window.addEventListener("resize", remeasure);
  window.addEventListener("load", remeasure);
  if ("fonts" in document) document.fonts.ready.then(remeasure);
}
