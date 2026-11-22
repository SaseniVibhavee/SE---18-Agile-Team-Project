import gsap from "gsap";

/* ------------------------------------------------------------------
   TILT — a card or mockup leans toward the cursor in 3D.
   Illustration only; it reads nothing and changes nothing.
   ------------------------------------------------------------------ */

export function initTilt({ reduce = false } = {}) {
  if (reduce) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const els = Array.from(document.querySelectorAll("[data-tilt]"));
  if (!els.length) return;

  els.forEach((el) => {
    const max = Number(el.dataset.tilt) || 12;
    gsap.set(el, { transformPerspective: 1000, transformOrigin: "center" });

    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * max * 2);
      rx(-py * max * 2);
    });

    el.addEventListener("pointerleave", () => {
      rx(0);
      ry(0);
    });
  });
}
