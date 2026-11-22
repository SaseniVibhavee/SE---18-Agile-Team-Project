import "../styles/tokens.css";
import "../styles/base.css";
import "../styles/sections.css";
import "../styles/solution.css";
import "../styles/story.css";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { runPreloader } from "./core/preloader.js";
import { initTubesCursor } from "./core/tubes.js";
import { initReveals } from "./core/reveal.js";
import { initChrome } from "./core/chrome.js";
import { initMagnetic } from "./core/magnetic.js";
import { initTilt } from "./core/tilt.js";
import { initScramble } from "./core/scramble.js";
import { initMarquee } from "./core/marquee.js";
import { initHero } from "./scenes/hero.js";
import { initMorph } from "./scenes/morph.js";

import { initProblem } from "./sections/problem.js";
import { initStudent } from "./sections/student.js";
import { initAI } from "./sections/ai.js";
import { initLecturer } from "./sections/lecturer.js";
import { initStory } from "./sections/story.js";
import { initFinale } from "./sections/finale.js";
import { initWaitlist } from "./sections/waitlist.js";
import { initTeam } from "./sections/team.js";
import { initAudio } from "./core/audio.js";
import { initRidgeBackground } from "./core/ridge.js";
import { initTheme } from "./core/theme.js";
import { initMetrics } from "./sections/metrics.js";

gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduce) {
  document.documentElement.classList.add("reduced", "no-anim");
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

/* ---------- smooth scroll ---------- */

let lenis = null;

if (!reduce) {
  lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.4,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
}

/* ---------- chrome starts immediately ---------- */

initChrome({ lenis, reduce });
initTheme();
const tubeCursor = initTubesCursor({ reduce });
initMagnetic({ reduce });
initTilt({ reduce });
initAudio();
initRidgeBackground({ reduce });

/* ---------- hero preloads behind the scanner ---------- */

const heroPromise = initHero({ reduce }).catch((err) => {
  console.warn("Hero scene unavailable:", err);
  return { intro() {} };
});

/* ---------- intro choreography ---------- */

const animateHeroIntro = () => {
  if (reduce) return;

  const lines = gsap.utils.toArray(".hero__title .line__inner");
  if (lines.length) {
    gsap.to(lines, {
      y: 0,
      duration: 1.35,
      stagger: 0.09,
      ease: "power4.out",
      delay: 0.05,
    });
  }

  const chromeBits = gsap.utils.toArray(
    ".hero__top, .hero__foot, .hero__device-note, .hero__scroll"
  );
  if (chromeBits.length) {
    gsap.fromTo(
      chromeBits,
      { opacity: 0, y: 18 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.06,
        ease: "power3.out",
        delay: 0.42,
      }
    );
  }
};

/* ---------- boot ---------- */

const boot = async () => {
  const preloaderPromise = runPreloader({ reduce });

  try {
    await preloaderPromise;
  } catch {
    document.querySelector("[data-preloader]")?.remove();
    document.body.classList.remove("is-loading");
  }

  initReveals({ reduce });
  initScramble({ reduce });
  initMarquee({ reduce });
  initMorph({ reduce });
  initProblem({ reduce });
  initStudent({ reduce });
  initAI({ reduce });
  initLecturer({ reduce });
  initStory({ reduce, lenis });
  initWaitlist({ lenis, reduce });
  initFinale({ reduce });
  initTeam({ reduce });
  initMetrics({ reduce });

  const hero = await heroPromise;
  hero.intro();
  animateHeroIntro();
  tubeCursor?.reveal();

  lenis?.start();
  ScrollTrigger.refresh();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  window.setTimeout(() => ScrollTrigger.refresh(), 1200);
};

boot();

/* ---------- dev-only niceties ---------- */

if (import.meta.env.DEV) {
  window.__attesta = { gsap, ScrollTrigger, lenis };
}
