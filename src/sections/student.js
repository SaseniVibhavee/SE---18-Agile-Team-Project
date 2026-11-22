import gsap from "gsap";

/* ------------------------------------------------------------------
   STUDENT MODE — attendance ring, catch-up check-in, a paper plane.
   ------------------------------------------------------------------ */

const CIRCUMFERENCE = 2 * Math.PI * 76;

export function initStudent({ reduce = false } = {}) {
  const dash = document.querySelector(".dash");
  const ring = document.querySelector("[data-ring]");
  const ringValue = document.querySelector("[data-ring-value]");
  const statusEl = document.querySelector("[data-task-status]");
  const tasks = Array.from(document.querySelectorAll("[data-task]"));
  const supportBtn = document.querySelector("[data-support-open]");
  const fly = document.querySelector("[data-support-fly]");

  /* ---------- ring ---------- */

  const setRing = (instant = false) => {
    if (!ring) return;
    const target = CIRCUMFERENCE * (1 - 0.84);
    if (instant) {
      ring.style.transition = "none";
      ring.style.strokeDashoffset = String(target);
    } else {
      window.setTimeout(() => {
        ring.style.strokeDashoffset = String(target);
      }, 220);
    }

    if (!ringValue) return;
    const start = performance.now();
    const duration = instant ? 1 : 1700;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(84 * eased);
      ringValue.innerHTML = `${value}<small>%</small>`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (dash) {
    if (reduce) {
      setRing(true);
    } else if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          setRing(false);
          io.disconnect();
        },
        { threshold: 0.25 }
      );
      io.observe(dash);
    } else {
      setRing(true);
    }
  }

  /* ---------- catch-up checklist ---------- */

  const updateStatus = () => {
    if (!statusEl) return;
    const done = tasks.filter((t) => t.classList.contains("is-done")).length;
    const help = tasks.filter((t) => t.classList.contains("is-help")).length;

    if (help > 0 && done === tasks.length) {
      statusEl.textContent = `ALL ${tasks.length} DONE + A SUPPORT NOTE — GOOD WEEK.`;
    } else if (help > 0) {
      statusEl.textContent = `HELP ASKED — DR. PERERA HAS YOUR NOTE · ${done} OF ${tasks.length} DONE.`;
    } else if (done === tasks.length) {
      statusEl.textContent = `${tasks.length} OF ${tasks.length} DONE — NOTHING TO CARRY INTO NEXT WEEK.`;
    } else if (done > 0) {
      statusEl.textContent = `${done} OF ${tasks.length} DONE — PICK UP WHERE YOU LIKE.`;
    } else {
      statusEl.textContent = `0 OF ${tasks.length} DONE — TAP AN ITEM TO START.`;
    }
  };

  tasks.forEach((task) => {
    const doneBtn = task.querySelector("[data-task-done]");
    const helpBtn = task.querySelector("[data-task-help]");

    doneBtn?.addEventListener("click", () => {
      const isDone = task.classList.contains("is-done");
      task.classList.remove("is-help", "is-done");
      doneBtn.setAttribute("aria-pressed", "false");
      helpBtn?.setAttribute("aria-pressed", "false");
      if (!isDone) {
        task.classList.add("is-done");
        doneBtn.setAttribute("aria-pressed", "true");
      }
      updateStatus();
    });

    helpBtn?.addEventListener("click", () => {
      const isHelp = task.classList.contains("is-help");
      task.classList.remove("is-done", "is-help");
      helpBtn.setAttribute("aria-pressed", "false");
      doneBtn?.setAttribute("aria-pressed", "false");
      if (!isHelp) {
        task.classList.add("is-help");
        helpBtn.setAttribute("aria-pressed", "true");
      }
      updateStatus();
    });
  });

  /* ---------- support request ---------- */

  const sendSupport = () => {
    if (statusEl) {
      statusEl.textContent = "HELP REQUEST SENT — YOU’LL HEAR BACK WITHIN 24 HOURS.";
    }

    if (supportBtn) {
      if (supportBtn.dataset.sent !== "true") {
        supportBtn.dataset.sent = "true";
        supportBtn.dataset.label = supportBtn.innerHTML;
        supportBtn.innerHTML = "Request sent <span>✓</span>";
        window.setTimeout(() => {
          if (supportBtn.dataset.label) {
            supportBtn.innerHTML = supportBtn.dataset.label;
            supportBtn.dataset.sent = "false";
          }
        }, 4200);
      }
    }

    if (!fly || reduce) return;

    gsap.killTweensOf(fly);
    gsap
      .timeline()
      .set(fly, { opacity: 0, x: 0, y: 0, rotation: -6, scale: 0.9 })
      .to(fly, { opacity: 1, duration: 0.2 })
      .to(fly, {
        x: 300,
        y: -120,
        rotation: 16,
        scale: 1.05,
        opacity: 0,
        duration: 1.35,
        ease: "power2.in",
      });
  };

  supportBtn?.addEventListener("click", sendSupport);

  updateStatus();
}
