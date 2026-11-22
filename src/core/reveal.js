export function initReveals({ reduce = false } = {}) {
  const targets = Array.from(
    document.querySelectorAll(
      "[data-reveal], .reveal, .dont__list li, .matrix, .dash"
    )
  );

  if (!targets.length) return;

  if (reduce) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-inview"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-inview");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  targets.forEach((el) => io.observe(el));
}
