import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   MARQUEE — a band of type that drifts, then speeds up and skews
   with your scroll velocity. Direction flips when you scroll up.
   ------------------------------------------------------------------ */

export function initMarquee({ reduce = false } = {}) {
  const bands = Array.from(document.querySelectorAll("[data-marquee]"));
  if (!bands.length) return;

  bands.forEach((band) => {
    const track = band.querySelector("[data-marquee-track]");
    if (!track) return;

    if (reduce) {
      track.style.animation = "none";
      return;
    }

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: 28,
      ease: "none",
      repeat: -1,
    });

    ScrollTrigger.create({
      trigger: band,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const v = gsap.utils.clamp(-3.2, 3.2, self.getVelocity() / 700);
        gsap.to(tween, {
          timeScale: v < 0 ? -1 - Math.abs(v) : 1 + v,
          duration: 0.5,
          overwrite: true,
        });
        gsap.to(track, {
          skewX: gsap.utils.clamp(-10, 10, -v * 3.2),
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      },
    });
  });
}
