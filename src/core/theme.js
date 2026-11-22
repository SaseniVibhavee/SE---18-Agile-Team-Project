/* ------------------------------------------------------------------
   THEME CONTROLLER — Seamless Black & White / Obsidian & Light Paper
   Instant hardware-level toggle with contrast guard and audio feedback
   ------------------------------------------------------------------ */

import { playClick, playChime } from "./audio.js";

const THEME_KEY = "attesta_theme";

export function initTheme() {
  const root = document.documentElement;
  const toggleBtn = document.querySelector("[data-theme-toggle]");
  const label = document.querySelector("[data-theme-label]");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  // Check saved or default to dark (Obsidian)
  let currentTheme = localStorage.getItem(THEME_KEY) || "dark";

  function applyTheme(theme, isUserAction = false) {
    currentTheme = theme;
    root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    const isLight = theme === "light";

    if (toggleBtn) {
      toggleBtn.setAttribute("aria-pressed", isLight ? "true" : "false");
      toggleBtn.classList.toggle("is-light", isLight);
    }

    if (label) {
      label.textContent = isLight ? "LIGHT" : "DARK";
    }

    if (metaTheme) {
      metaTheme.setAttribute("content", isLight ? "#f6faf6" : "#010302");
    }

    // Broadcast theme change for Canvas and 3D scenes
    window.dispatchEvent(
      new CustomEvent("attesta:theme", {
        detail: { theme, isLight },
      })
    );

    if (isUserAction) {
      if (isLight) {
        playChime(659.25); // Bright chime
      } else {
        playClick();
      }
    }
  }

  // Initial apply without audio
  applyTheme(currentTheme, false);

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  }

  // Keyboard shortcut: Shift + T for quick theme toggle
  window.addEventListener("keydown", (e) => {
    if (e.shiftKey && (e.key === "T" || e.key === "t")) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) return;
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    }
  });

  return {
    getTheme: () => currentTheme,
    setTheme: (t) => applyTheme(t, true),
  };
}
