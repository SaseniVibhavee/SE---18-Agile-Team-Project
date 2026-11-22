import gsap from "gsap";

/* ------------------------------------------------------------------
   MAGNETIC — buttons and links lean toward the cursor, then settle.
   Pure delight. Nothing here performs an action.
   ------------------------------------------------------------------ */

export function initMagnetic({ reduce = false } = {}) {
  if (reduce) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const targets = Array.from(
    document.querySelectorAll(
      "[data-magnetic], .btn, .nav__cta, .scan-button__meta, .overlay-menu__close"
    )
  );

  targets.forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.3;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const reset = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    el.addEventListener("blur", reset);
  });
}
