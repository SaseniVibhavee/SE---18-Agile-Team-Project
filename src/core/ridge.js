/* ------------------------------------------------------------------
   RIDGE BACKGROUND CANVAS — mathematical biometric wave field that
   deforms fluidly on cursor proximity.
   ------------------------------------------------------------------ */

export function initRidgeBackground({ reduce = false } = {}) {
  const cv = document.getElementById("ridge-canvas");
  if (!cv) return;
  const cx = cv.getContext("2d");
  if (!cx) return;

  let W = 0;
  let H = 0;
  let running = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    W = r.width;
    H = r.height;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });

  const rm = { x: -999, y: -999, tx: -999, ty: -999 };
  window.addEventListener("pointermove", (e) => {
    rm.tx = e.clientX;
    rm.ty = e.clientY;
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    rm.tx = -999;
    rm.ty = -999;
  });

  const lerp = (a, b, t) => a + (b - a) * t;

  let raf = 0;
  function draw(t) {
    if (!running) return;
    rm.x = lerp(rm.x, rm.tx, 0.08);
    rm.y = lerp(rm.y, rm.ty, 0.08);

    cx.clearRect(0, 0, W, H);
    const gap = Math.max(16, H / 48);
    const time = reduce ? 0 : t * 0.00032;

    let row = 0;
    for (let y = -gap; y < H + gap * 2; y += gap, row++) {
      cx.beginPath();
      for (let x = 0; x <= W + 12; x += 12) {
        let off = Math.sin(x * 0.0035 + row * 0.22 + time * 1.6) * 7 + Math.sin(x * 0.009 - time * 2.2 + row * 0.3) * 3.5;
        const dx = x - rm.x;
        const dy = y - rm.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 160000) {
          off -= Math.exp(-distSq / (2 * 150 * 150)) * 36;
        }
        x ? cx.lineTo(x, y + off) : cx.moveTo(x, y + off);
      }
      const isAccent = row % 8 === 0;
      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      cx.strokeStyle = isLight
        ? (isAccent ? "rgba(0, 143, 55, 0.35)" : "rgba(6, 17, 8, 0.05)")
        : (isAccent ? "rgba(0, 255, 102, 0.22)" : "rgba(240, 255, 240, 0.035)");
      cx.lineWidth = isAccent ? 1.2 : 0.8;
      cx.stroke();
    }

    if (!reduce) {
      raf = requestAnimationFrame(draw);
    }
  }

  if (reduce) {
    draw(0);
  } else {
    raf = requestAnimationFrame(draw);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else if (!reduce) {
      raf = requestAnimationFrame(draw);
    }
  });
}
