/* ------------------------------------------------------------------
   WAITLIST — a single-purpose dialog that opens the moment a visitor
   completes the finale scan. Validated, keyboard-safe, remembered.
   ------------------------------------------------------------------ */

const STORAGE_KEY = "attesta:waitlist";

export function initWaitlist({ lenis = null, reduce = false } = {}) {
  const root = document.querySelector("[data-waitlist]");
  if (!root) return { open() {}, close() {} };

  const panel = root.querySelector(".waitlist__panel");
  const body = root.querySelector("[data-waitlist-body]");
  const form = root.querySelector("[data-waitlist-form]");
  const done = root.querySelector("[data-waitlist-done]");
  const status = root.querySelector("[data-waitlist-status]");
  const closeEls = Array.from(root.querySelectorAll("[data-waitlist-close]"));

  let open = false;
  let lastFocus = null;
  let hideTimer = 0;

  const stored = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  })();

  const focusables = () =>
    Array.from(
      panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);

  const scrollLock = (locked) => {
    if (lenis) {
      if (locked) lenis.stop();
      else lenis.start();
    } else {
      document.documentElement.style.overflow = locked ? "hidden" : "";
    }
  };

  const showDone = () => {
    if (body) body.hidden = true;
    if (done) done.hidden = false;
  };

  const showForm = () => {
    if (body) body.hidden = false;
    if (done) done.hidden = true;
  };

  const openDialog = () => {
    if (open) return;
    open = true;
    lastFocus = document.activeElement;
    window.clearTimeout(hideTimer);
    root.hidden = false;
    scrollLock(true);

    if (stored) showDone();
    else showForm();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.add("is-open"));
      const first = stored
        ? done?.querySelector("button")
        : form?.querySelector("input");
      first?.focus({ preventScroll: true });
    });
  };

  const closeDialog = ({ restoreFocus = true } = {}) => {
    if (!open) return;
    open = false;
    root.classList.remove("is-open");
    scrollLock(false);
    hideTimer = window.setTimeout(() => {
      if (!open) root.hidden = true;
    }, reduce ? 0 : 360);
    if (restoreFocus && lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    }
  };

  closeEls.forEach((el) => el.addEventListener("click", () => closeDialog()));

  document.addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeDialog();
      return;
    }
    if (e.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, at: Date.now() })
      );
    } catch {
      /* storage may be unavailable — the dialog still resolves */
    }

    if (status) status.textContent = "JOINING...";
    const submit = form.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;

    window.setTimeout(() => {
      showDone();
      done?.querySelector("button")?.focus({ preventScroll: true });
    }, reduce ? 0 : 520);
  });

  document.addEventListener("attesta:present", openDialog);

  return { open: openDialog, close: closeDialog };
}