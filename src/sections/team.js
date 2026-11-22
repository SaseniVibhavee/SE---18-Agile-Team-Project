/* ------------------------------------------------------------------
   TEAM / SQUAD SECTION — Interactive group photo with a hand-drawn
   annotation that tracks whoever you hover, tap or select.
   ------------------------------------------------------------------ */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playBlip } from "../core/audio.js";

gsap.registerPlugin(ScrollTrigger);

const TEAM_MEMBERS = [
  {
    name: "Damsith",
    note: "this is Damsith — he turns ideas into working code",
  },
  {
    name: "Saseni",
    note: "Saseni — she built this site and every screen on it",
  },
  {
    name: "Sanuth",
    note: "Sanuth — our leader, and the bridge to the hardware",
  },
  {
    name: "Tharushi",
    note: "Tharushi — the mind training the AI to help you catch up",
  },
  {
    name: "Sasith",
    note: "Sasith — he puts Attesta in your pocket",
  },
];

export function initTeam({ reduce = false } = {}) {
  const container = document.querySelector("#team");
  if (!container) return;

  const members = container.querySelectorAll("[data-team-member]");
  const buttons = container.querySelectorAll("[data-team-btn]");
  const note = container.querySelector("[data-team-note]");
  const noteText = container.querySelector("[data-note-text]");
  const photoWrapper = container.querySelector(".team-group");

  let activeIndex = 2; // Default to Sanuth (Center)

  /* Keep the hand-drawn note centred over the active figure while
     clamping it inside the group so it never spills off-stage. */
  const positionNote = () => {
    if (!note || !photoWrapper || !members[activeIndex]) return;
    const memberRect = members[activeIndex].getBoundingClientRect();
    const wrapRect = photoWrapper.getBoundingClientRect();
    const center = memberRect.left - wrapRect.left + memberRect.width / 2;
    const half = note.offsetWidth / 2;
    const max = Math.max(half, wrapRect.width - half);
    const x = Math.min(Math.max(center, half), max);
    const top = Math.max(0, memberRect.top - wrapRect.top - note.offsetHeight - 4);
    note.style.setProperty("--x", `${x}px`);
    note.style.setProperty("--y", `${top}px`);
  };

  function updateActive(idx, playSound = true) {
    if (idx < 0 || idx >= TEAM_MEMBERS.length) return;
    const data = TEAM_MEMBERS[idx];
    activeIndex = idx;

    // Active / dimmed figures
    members.forEach((m, i) => {
      const on = i === idx;
      m.classList.toggle("is-active", on);
      m.classList.toggle("is-dimmed", !on);
    });

    // Selector buttons
    buttons.forEach((btn, i) => {
      btn.classList.toggle("is-active", i === idx);
      btn.setAttribute("aria-selected", i === idx ? "true" : "false");
    });

    // Handwritten annotation
    if (noteText) {
      noteText.textContent = data.note;
      if (!reduce) {
        gsap.fromTo(
          noteText,
          { opacity: 0.15, y: 6 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      }
    }

    if (note) {
      positionNote();
      note.classList.add("is-active");
    }

    if (playSound) playBlip(620 + idx * 80);
  }

  // Hover & pointer events on group figures
  members.forEach((member, i) => {
    member.addEventListener("pointerenter", () => updateActive(i, true));
    member.addEventListener("focus", () => updateActive(i, true));
    member.addEventListener("click", () => updateActive(i, true));
  });

  // Selector buttons
  buttons.forEach((btn, i) => {
    btn.addEventListener("click", () => updateActive(i, true));
  });

  // Initialize with the centre figure (Sanuth)
  updateActive(2, false);

  // Keep the annotation aligned through resizes and late image loads
  window.addEventListener("resize", positionNote);
  window.addEventListener("load", positionNote);

  if ("ResizeObserver" in window && photoWrapper) {
    const ro = new ResizeObserver(() => positionNote());
    ro.observe(photoWrapper);
    members.forEach((m) => ro.observe(m));
  }

  // Lazy images settle after first paint — reposition once they decode.
  members.forEach((m) => {
    const img = m.querySelector("img");
    if (img && !img.complete) {
      img.addEventListener("load", positionNote, { once: true });
    }
  });
  window.setTimeout(positionNote, 400);

  // ScrollTrigger subtle reveal animation
  if (!reduce) {
    gsap.fromTo(
      members,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
        onComplete: positionNote,
        scrollTrigger: {
          trigger: container,
          start: "top 75%",
          once: true,
        },
      }
    );
  }
}