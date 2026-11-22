/* ------------------------------------------------------------------
   SCRAMBLE — small technical labels decode themselves as they enter.
   ------------------------------------------------------------------ */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+·—";

export function initScramble({ reduce = false } = {}) {
  const els = Array.from(document.querySelectorAll("[data-scramble], .eyebrow"));
  if (!els.length || reduce) return;
  if (!("IntersectionObserver" in window)) return;

  const run = (el) => {
    const finalText = (el.dataset.scramble || el.textContent || "").trim();
    if (!finalText) return;
    let frame = 0;
    const total = 20 + finalText.length;

    const tick = () => {
      frame += 1;
      const revealed = Math.floor((frame / total) * finalText.length);
      let out = "";
      for (let i = 0; i < finalText.length; i += 1) {
        const ch = finalText[i];
        if (ch === " " || ch === "·") {
          out += ch;
        } else if (i < revealed) {
          out += ch;
        } else {
          out += CHARS[(Math.random() * CHARS.length) | 0];
        }
      }
      el.textContent = out;
      if (frame < total) requestAnimationFrame(tick);
      else el.textContent = finalText;
    };
    tick();
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.55, rootMargin: "0px 0px -6% 0px" }
  );

  els.forEach((el) => io.observe(el));
}
