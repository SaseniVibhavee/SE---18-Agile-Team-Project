/* ------------------------------------------------------------------
   AUDIO SYNTHESIZER — procedural sound effects via Web Audio API.
   No mp3/wav files required. Synthesizes biometric chimes and clicks.
   ------------------------------------------------------------------ */

let audioCtx = null;
let soundEnabled = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playChime(freq = 587.33) { // D5 note
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(freq, now);
  osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);

  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(freq * 2, now);
  osc2.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.22);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.55);
  osc2.stop(now + 0.55);
}

export function playClick() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.035);
}

export function playBlip(freq = 780) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.06);

  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

export function playAlert() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.linearRampToValueAtTime(140, now + 0.25);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

export function initAudio() {
  const btn = document.querySelector("[data-sound-toggle]");
  if (!btn) return;

  const saved = localStorage.getItem("attesta_sound");
  if (saved === "1") {
    soundEnabled = true;
    btn.setAttribute("aria-pressed", "true");
    btn.classList.add("is-active");
  }

  btn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem("attesta_sound", soundEnabled ? "1" : "0");
    btn.setAttribute("aria-pressed", String(soundEnabled));
    btn.classList.toggle("is-active", soundEnabled);

    if (soundEnabled) {
      getAudioContext();
      playChime(659.25); // E5
    }
  });

  // Attach subtle audio feedback to key interactions
  document.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a, input[type=range], [data-qr]")) {
      playClick();
    }
  });
}
