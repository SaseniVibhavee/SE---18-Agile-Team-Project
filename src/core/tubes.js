/* ------------------------------------------------------------------
   Three.js tube cursor.
   A bundle of glowing metallic tubes that chase the pointer. Coloured
   with the Attesta palette: electric emerald, data cyan, and a single
   ember accent in the lights. Clicking discharges the lights.

   Loaded lazily so the rest of the page can paint first.
   ------------------------------------------------------------------ */

import gsap from "gsap";

const TUBE_COLORS = ["#00ff66", "#a8ffcb", "#00f0ff"];
const LIGHT_COLORS = ["#00ff66", "#00f0ff", "#00ff66", "#eafff2"];
const LIGHT_BASE = 105;

export function initTubesCursor({ reduce = false } = {}) {
  if (reduce) return null;
  if (!window.matchMedia("(pointer: fine)").matches) return null;

  const wrap = document.querySelector("[data-tubes-cursor]");
  const canvas = wrap?.querySelector("canvas");
  if (!wrap || !canvas) return null;

  const state = { revealed: false, disposed: false, app: null };
  let onDown = null;

  const show = () => {
    if (!state.revealed || state.disposed || !state.app) return;
    wrap.classList.add("is-ready");
  };

  import("threejs-components")
    .then(({ Tubes1Cursor }) => {
      if (state.disposed) return;

      const app = Tubes1Cursor(canvas, {
        bloom: { threshold: 0.42, strength: 0.35, radius: 0.18 },
        tubes: {
          count: 11,
          colors: TUBE_COLORS,
          minRadius: 0.006,
          maxRadius: 0.04,
          minTubularSegments: 48,
          maxTubularSegments: 128,
          material: { metalness: 1, roughness: 0.32 },
          lights: { intensity: LIGHT_BASE, colors: LIGHT_COLORS },
          lerp: 0.5,
          noise: 0.04,
        },
        sleepRadiusX: 120,
        sleepRadiusY: 60,
        sleepTimeScale1: 0.8,
        sleepTimeScale2: 1.6,
      });

      state.app = app;

      /* The library renders at 2x by default. A softer ratio keeps the
         glow but leaves headroom for the rest of the WebGL scenes. */
      if (app.three) {
        app.three.minPixelRatio = 1.5;
        app.three.maxPixelRatio = 1.5;
        app.three.resize();
      }

      /* Click = a short discharge of the tube lights. */

      const lights = { value: LIGHT_BASE };
      const applyLights = () => app.tubes?.setLightsIntensity?.(lights.value);

      onDown = () => {
        gsap.killTweensOf(lights);
        lights.value = 120;
        applyLights();
        gsap.to(lights, {
          value: LIGHT_BASE,
          duration: 0.75,
          ease: "power3.out",
          onUpdate: applyLights,
        });
      };

      window.addEventListener("pointerdown", onDown, { passive: true });

      show();
    })
    .catch((error) => {
      console.warn("Tube cursor unavailable:", error);
      wrap.remove();
    });

  return {
    reveal: () => {
      state.revealed = true;
      show();
    },
    dispose: () => {
      state.disposed = true;
      if (onDown) window.removeEventListener("pointerdown", onDown);
      state.app?.dispose?.();
    },
  };
}
