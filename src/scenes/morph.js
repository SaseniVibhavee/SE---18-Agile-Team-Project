import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { mountFingerprint } from "../core/fingerprint.js";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   MORPH — one cloud of points that keeps changing its mind.
   A fingerprint becomes a lecture hall becomes a week. Scroll drives
   the morph; the cursor turns the cloud; a click scatters it and it
   pulls itself back together. Illustration only — it reads nothing.
   ------------------------------------------------------------------ */

const COUNT = 9000;
const SHAPE_LABELS = ["01 · BIOMETRIC", "02 · REAL-TIME", "03 · AI SUPPORT", "04 · ATTESTA"];

function dotTexture(THREE) {
  const s = 64;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---------------- shape builds ---------------- */

function buildFingerprint(n, THREE, COL) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const RIDGES = 15;
  const ridges = [];
  let totalW = 0;

  for (let i = 0; i < RIDGES; i += 1) {
    const t = i / (RIDGES - 1);
    const Rx = 0.072 + i * 0.062;
    const Ry = 0.082 + i * 0.074;
    const opening = 0.16 + t * 1.55;
    const ridge = {
      i,
      Rx,
      Ry,
      ox: Math.sin(i * 0.5) * 0.012 + t * 0.03,
      oy: Math.cos(i * 0.42) * 0.01 - t * 0.028,
      start: Math.PI / 2 + opening,
      end: Math.PI / 2 - opening + Math.PI * 2,
      w: (Rx + Ry) * 0.5,
    };
    ridges.push(ridge);
    totalW += ridge.w;
  }

  const scale = 0.9 / (0.082 + (RIDGES - 1) * 0.074 + 0.02);

  for (let k = 0; k < n; k += 1) {
    let pick = Math.random() * totalW;
    let r = ridges[RIDGES - 1];
    for (let i = 0; i < RIDGES; i += 1) {
      pick -= ridges[i].w;
      if (pick <= 0) {
        r = ridges[i];
        break;
      }
    }

    const p = Math.random();
    const ang = r.start + (r.end - r.start) * p;
    const wob =
      1 +
      0.03 * Math.sin(ang * 3 + r.i * 0.72) +
      0.018 * Math.sin(ang * 6 - r.i * 1.14) +
      0.008 * Math.sin(ang * 11 + r.i * 0.36);

    let x = r.ox + Math.cos(ang) * r.Rx * wob;
    let y = r.oy + Math.sin(ang) * r.Ry * wob;
    x += Math.sin(ang * 2 + r.i * 0.28) * 0.008;
    y += Math.cos(ang * 3 + r.i * 0.5) * 0.006;

    pos[k * 3] = x * scale;
    pos[k * 3 + 1] = -y * scale;
    pos[k * 3 + 2] = (Math.random() - 0.5) * 0.22;

    const c = Math.random() < 0.07 ? COL.ember : COL.signal;
    col[k * 3] = c.r;
    col[k * 3 + 1] = c.g;
    col[k * 3 + 2] = c.b;
  }

  return { pos, col };
}

function buildHall(n, THREE, COL) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const ROWS = 17;
  const COLS = 26;
  const SEATS = ROWS * COLS;

  for (let k = 0; k < n; k += 1) {
    const s = k % SEATS;
    const r = Math.floor(s / COLS);
    const c = s % COLS;
    const rt = r / (ROWS - 1);

    pos[k * 3] = ((c / (COLS - 1)) * 2 - 1) * 1.08 + (Math.random() - 0.5) * 0.014;
    pos[k * 3 + 1] = -0.55 + (1 - rt) * 0.98 + (Math.random() - 0.5) * 0.012;
    pos[k * 3 + 2] = -0.95 + rt * 1.85 + (Math.random() - 0.5) * 0.05;

    let c3 = COL.bone;
    if ((s * 7) % 100 < 9) c3 = COL.ember;
    else if ((s * 13) % 100 < 7) c3 = COL.signal;

    col[k * 3] = c3.r;
    col[k * 3 + 1] = c3.g;
    col[k * 3 + 2] = c3.b;
  }

  return { pos, col };
}

function buildWeek(n, THREE, COL) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const COLS = 7;
  const ROWS = 5;
  const CELLS = COLS * ROWS;

  for (let k = 0; k < n; k += 1) {
    const cell = k % CELLS;
    const r = Math.floor(cell / COLS);
    const c = cell % COLS;

    pos[k * 3] = (c - 3) * 0.245 + (Math.random() - 0.5) * 0.155;
    pos[k * 3 + 1] = (2 - r) * 0.245 + (Math.random() - 0.5) * 0.155;
    pos[k * 3 + 2] = (Math.random() - 0.5) * 0.16;

    let c3 = COL.bone;
    if ((cell * 11) % 100 < 16) c3 = COL.ember;
    else if ((cell * 5) % 100 < 26) c3 = COL.signal;

    col[k * 3] = c3.r;
    col[k * 3 + 1] = c3.g;
    col[k * 3 + 2] = c3.b;
  }

  return { pos, col };
}

/* two concentric rings — the week closes into the Attesta loop.
   Echoes the brand mark and bridges into "We close the loop". */
function buildLoop(n, THREE, COL) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const RINGS = [0.8, 0.46];
  const TUBE = 0.05;

  for (let k = 0; k < n; k += 1) {
    const outer = k % 3 !== 0;
    const R = outer ? RINGS[0] : RINGS[1];
    const tube = outer ? TUBE : TUBE * 0.78;

    const u = Math.random() * Math.PI * 2;
    const a = Math.random() * Math.PI * 2;
    const rad = tube * Math.sqrt(Math.random());

    const ringR = R + rad * Math.cos(a);
    pos[k * 3] = ringR * Math.cos(u);
    pos[k * 3 + 1] = ringR * Math.sin(u) * 0.94;
    pos[k * 3 + 2] = rad * Math.sin(a) + (Math.random() - 0.5) * 0.02;

    let c3 = COL.signal;
    if (!outer) c3 = Math.random() < 0.45 ? COL.bone : COL.signal;
    else if (Math.random() < 0.07) c3 = COL.ember;

    col[k * 3] = c3.r;
    col[k * 3 + 1] = c3.g;
    col[k * 3 + 2] = c3.b;
  }

  return { pos, col };
}

export async function initMorph({ reduce = false } = {}) {
  const mount = document.querySelector("#morph-canvas");
  const section = document.querySelector("[data-morph]");
  if (!mount || !section) return;

  let THREE;
  try {
    THREE = await import("three");
  } catch {
    mount.classList.add("is-fallback");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 400 500");
    mount.appendChild(svg);
    mountFingerprint(svg, { count: 29 });
    return;
  }

  const COL = {
    signal: new THREE.Color(0x00ff66),
    bone: new THREE.Color(0xd2f5db),
    ember: new THREE.Color(0xff6a00),
  };

  const shapes = [
    buildFingerprint(COUNT, THREE, COL),
    buildHall(COUNT, THREE, COL),
    buildWeek(COUNT, THREE, COL),
    buildLoop(COUNT, THREE, COL),
  ];

  window.addEventListener("attesta:theme", (e) => {
    const isLight = e.detail?.isLight;
    if (isLight) {
      COL.signal.setHex(0x008f37);
      COL.bone.setHex(0x183b22);
      COL.ember.setHex(0xd84300);
    } else {
      COL.signal.setHex(0x00ff66);
      COL.bone.setHex(0xd2f5db);
      COL.ember.setHex(0xff6a00);
    }
    const newShapes = [
      buildFingerprint(COUNT, THREE, COL),
      buildHall(COUNT, THREE, COL),
      buildWeek(COUNT, THREE, COL),
      buildLoop(COUNT, THREE, COL),
    ];
    for (let s = 0; s < shapes.length; s++) {
      shapes[s].col.set(newShapes[s].col);
    }
    colAttr.needsUpdate = true;
  });

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    mount.classList.add("is-fallback");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0.12, 3.45);
  camera.lookAt(0, 0.02, 0);

  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  /* random outward vectors for the click scatter */
  const burstDirs = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  for (let k = 0; k < COUNT; k += 1) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * 2 - 1;
    const r = Math.sqrt(1 - b * b);
    const len = 0.5 + Math.random() * 0.9;
    burstDirs[k * 3] = Math.cos(a) * r * len;
    burstDirs[k * 3 + 1] = b * len;
    burstDirs[k * 3 + 2] = Math.sin(a) * r * len;
    phases[k] = Math.random() * Math.PI * 2;
  }

  const material = new THREE.PointsMaterial({
    size: 0.027,
    map: dotTexture(THREE),
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  group.add(points);
  points.frustumCulled = false;

  /* ---------------- sizing ---------------- */
  const resize = () => {
    const w = mount.clientWidth || 1;
    const h = mount.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  /* ---------------- state ---------------- */
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  let target = 0;
  let progress = 0;
  let burst = 0;
  let active = true;
  let raf = 0;

  const posAttr = geometry.getAttribute("position");
  const colAttr = geometry.getAttribute("color");

  const onPointer = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const onBurst = () => {
    if (active) burst = 1;
  };

  if (!reduce) {
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerdown", onBurst, { passive: true });
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        active = entry.isIntersecting;
      });
    },
    { rootMargin: "300px 0px" }
  );
  io.observe(section);

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      target = self.progress;
    },
  });

  /* ---------------- overlay text ---------------- */
  const stageEls = Array.from(section.querySelectorAll("[data-morph-stage]"));
  const readout = section.querySelector("[data-morph-readout]");
  const ticks = Array.from(section.querySelectorAll(".morph__ticks i"));
  let lastStage = -1;

  const paintStage = (idx) => {
    if (idx === lastStage) return;
    lastStage = idx;
    stageEls.forEach((el, i) => el.classList.toggle("is-on", i === idx));
    ticks.forEach((el, i) => el.classList.toggle("is-on", i <= idx));
    if (readout) readout.textContent = SHAPE_LABELS[idx] || SHAPE_LABELS[0];
  };

  const writeFrame = (p) => {
    const steps = shapes.length - 1;
    const stage = p * steps;
    const fromIdx = Math.max(0, Math.min(steps - 1, Math.floor(stage)));
    const toIdx = Math.min(steps, fromIdx + 1);
    const raw = Math.max(0, Math.min(1, stage - fromIdx));
    const k = raw * raw * (3 - 2 * raw); /* smoothstep */
    const A = shapes[fromIdx];
    const B = shapes[toIdx];

    for (let i = 0; i < COUNT; i += 1) {
      const o = i * 3;
      positions[o] = A.pos[o] + (B.pos[o] - A.pos[o]) * k;
      positions[o + 1] = A.pos[o + 1] + (B.pos[o + 1] - A.pos[o + 1]) * k;
      positions[o + 2] = A.pos[o + 2] + (B.pos[o + 2] - A.pos[o + 2]) * k;
      colors[o] = A.col[o] + (B.col[o] - A.col[o]) * k;
      colors[o + 1] = A.col[o + 1] + (B.col[o + 1] - A.col[o + 1]) * k;
      colors[o + 2] = A.col[o + 2] + (B.col[o + 2] - A.col[o + 2]) * k;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    paintStage(Math.round(stage));
  };

  if (reduce) {
    writeFrame(0);
    group.rotation.set(0, 0, 0);
    renderer.render(scene, camera);
    window.addEventListener("resize", () => {
      resize();
      renderer.render(scene, camera);
    });
    return;
  }

  /* ---------------- loop ---------------- */
  const clock = new THREE.Clock();

  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!active || document.hidden) return;

    const t = clock.getElapsedTime();
    progress += (target - progress) * 0.08;
    smooth.x += (pointer.x - smooth.x) * 0.05;
    smooth.y += (pointer.y - smooth.y) * 0.05;
    burst *= 0.935;

    writeFrame(progress);

    /* breathing shimmer + click scatter */
    const breathe = Math.sin(t * 0.9) * 0.012;
    const scatter = burst * 1.35;
    const arr = posAttr.array;
    for (let i = 0; i < COUNT; i += 1) {
      const o = i * 3;
      const ph = phases[i];
      arr[o] += Math.sin(t * 1.3 + ph) * 0.004 + burstDirs[o] * scatter;
      arr[o + 1] += Math.cos(t * 1.1 + ph) * 0.004 + burstDirs[o + 1] * scatter + breathe;
      arr[o + 2] += Math.sin(t * 0.8 + ph) * 0.004 + burstDirs[o + 2] * scatter;
    }
    posAttr.needsUpdate = true;

    group.rotation.y = smooth.x * 0.42 + progress * 0.55;
    group.rotation.x = smooth.y * -0.24 + (progress - 0.5) * 0.12;
    group.rotation.z = Math.sin(t * 0.18) * 0.03;
    group.position.y = 0.16 + Math.sin(t * 0.5) * 0.03;

    material.size = 0.027 + burst * 0.02;

    renderer.render(scene, camera);
  };

  paintStage(0);
  tick();

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !raf) tick();
  });
}
