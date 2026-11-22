import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------
   HERO — a procedural device, lit like a product shot, floating over
   a field of ridge particles. No GLB, no stock render: everything is
   built from primitives so it loads instantly and can be re-skinned.
   ------------------------------------------------------------------ */

const PAPER = 0x060907;
const INK = 0x00ff66;
const VERMILION = 0xff6a00;
const LIME = 0x00ff66;
const TEAL = 0x031208;

export async function initHero({ reduce = false } = {}) {
  const mount = document.querySelector("#hero-canvas");
  if (!mount) return { intro() {} };

  let THREE;
  let RoundedBoxGeometry;
  try {
    THREE = await import("three");
    ({ RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js"));
  } catch (err) {
    mount.classList.add("is-fallback");
    return { intro() {} };
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (err) {
    mount.classList.add("is-fallback");
    return { intro() {} };
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  /* soft studio environment for the plastic shell */
  try {
    const { RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js");
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  } catch {
    /* environment is a bonus, not a requirement */
  }

  const scrollGroup = new THREE.Group();
  scene.add(scrollGroup);

  const device = new THREE.Group();
  scrollGroup.add(device);

  /* ---------- textures drawn in 2D ---------- */

  const makeRidgeTexture = () => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 512);
    ctx.save();
    ctx.beginPath();
    ctx.arc(256, 256, 238, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = "rgba(0,255,102,0.95)";
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 24; i += 1) {
      const rx = 26 + i * 9.2;
      const ry = 32 + i * 9;
      ctx.beginPath();
      for (let s = 0; s <= 120; s += 1) {
        const t = (s / 120) * Math.PI * 2;
        const w = 1 + 0.05 * Math.sin(t * 3 + i * 0.6) + 0.025 * Math.sin(t * 7 - i);
        const x = 256 + Math.cos(t) * rx * w;
        const y = 256 + Math.sin(t) * ry * w;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const makeScreenTexture = () => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 320;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#020703";
    ctx.fillRect(0, 0, 512, 320);
    ctx.strokeStyle = "rgba(0,255,102,0.35)";
    ctx.strokeRect(10, 10, 492, 300);

    ctx.fillStyle = "rgba(0,255,102,0.7)";
    ctx.font = "500 20px monospace";
    ctx.fillText("IS2103 · HALL 04", 32, 58);

    ctx.fillStyle = "#00ff66";
    ctx.font = "600 58px monospace";
    ctx.fillText("PRESENT", 30, 146);

    ctx.fillStyle = "#f2fbf4";
    ctx.font = "500 26px monospace";
    ctx.fillText("84%  ·  21/25", 32, 208);

    ctx.fillStyle = "rgba(0,255,102,0.5)";
    ctx.font = "400 18px monospace";
    ctx.fillText("DEV-01 · ONLINE", 32, 272);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  };

  const makeBrandTexture = () => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = "rgba(243,244,238,0.45)";
    ctx.font = "500 54px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("attesta", 256, 82);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const makeShadowTexture = () => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, "rgba(203,255,74,0.22)");
    g.addColorStop(0.5, "rgba(203,255,74,0.06)");
    g.addColorStop(1, "rgba(203,255,74,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  /* ---------- the device ---------- */

  const bodyGeo = new RoundedBoxGeometry(2.5, 4.3, 0.6, 7, 0.3);
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: PAPER,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.55,
    sheen: 0.35,
    sheenColor: new THREE.Color(0xffffff),
    envMapIntensity: 0.6,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  device.add(body);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(bodyGeo, 24),
    new THREE.LineBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.16 })
  );
  device.add(edges);

  /* sensor */
  const plateGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.06, 64);
  const plateMat = new THREE.MeshPhysicalMaterial({
    color: 0x030604,
    roughness: 0.42,
    metalness: 0.2,
    clearcoat: 0.8,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.rotation.x = Math.PI / 2;
  plate.position.set(0, 1.0, 0.31);
  device.add(plate);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.018, 8, 96),
    new THREE.MeshStandardMaterial({
      color: LIME,
      emissive: LIME,
      emissiveIntensity: 1.8,
      roughness: 0.3,
    })
  );
  ring.position.set(0, 1.0, 0.35);
  device.add(ring);

  const glass = new THREE.Mesh(
    new THREE.CircleGeometry(0.58, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x04070a,
      roughness: 0.14,
      metalness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    })
  );
  glass.position.set(0, 1.0, 0.37);
  device.add(glass);

  const ridgePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.96),
    new THREE.MeshBasicMaterial({
      map: makeRidgeTexture(),
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  ridgePlane.position.set(0, 1.0, 0.381);
  device.add(ridgePlane);

  /* screen */
  const screenShell = new THREE.Mesh(
    new RoundedBoxGeometry(1.16, 0.78, 0.05, 4, 0.07),
    new THREE.MeshPhysicalMaterial({ color: 0x0a2022, roughness: 0.3, metalness: 0.2 })
  );
  screenShell.position.set(0, -0.32, 0.31);
  device.add(screenShell);

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.04, 0.66),
    new THREE.MeshBasicMaterial({ map: makeScreenTexture() })
  );
  screen.position.set(0, -0.32, 0.342);
  device.add(screen);

  /* brand */
  const brand = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.24),
    new THREE.MeshBasicMaterial({
      map: makeBrandTexture(),
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    })
  );
  brand.position.set(0, -1.25, 0.315);
  device.add(brand);

  /* status LED */
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.046, 20, 20),
    new THREE.MeshStandardMaterial({
      color: LIME,
      emissive: LIME,
      emissiveIntensity: 3.2,
      roughness: 0.4,
    })
  );
  led.position.set(1.0, -1.72, 0.315);
  device.add(led);

  const ledLight = new THREE.PointLight(LIME, 2.2, 1.6, 2);
  ledLight.position.copy(led.position);
  ledLight.position.z += 0.15;
  device.add(ledLight);

  /* side buttons */
  const buttonMat = new THREE.MeshPhysicalMaterial({ color: 0x2a303c, roughness: 0.5 });
  const button1 = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.34, 0.2, 3, 0.03), buttonMat);
  button1.position.set(1.26, 0.45, 0);
  device.add(button1);
  const button2 = button1.clone();
  button2.position.y = 0.02;
  device.add(button2);

  /* lanyard eyelet */
  const eyelet = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.035, 10, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x2a303c, roughness: 0.45 })
  );
  eyelet.position.set(0, 2.16, 0);
  device.add(eyelet);

  /* backdrop shadow */
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 6.4),
    new THREE.MeshBasicMaterial({
      map: makeShadowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 1,
    })
  );
  shadow.position.set(2.45, 0.1, -1.2);
  scrollGroup.add(shadow);

  /* ---------- lights ---------- */

  scene.add(new THREE.AmbientLight(0x33405c, 0.45));

  const key = new THREE.DirectionalLight(0xfff4e2, 2.9);
  key.position.set(5, 7, 8);
  scene.add(key);

  const rim = new THREE.DirectionalLight(VERMILION, 3.2);
  rim.position.set(-6, 2, -3);
  scene.add(rim);

  const fill = new THREE.DirectionalLight(0x6fe3ff, 1.2);
  fill.position.set(0, -5, 5);
  scene.add(fill);

  const limeKey = new THREE.DirectionalLight(LIME, 2.0);
  limeKey.position.set(-3, 6, 4);
  scene.add(limeKey);

  /* ---------- ridge particle field ---------- */

  const PARTICLES = 6800;
  const positions = new Float32Array(PARTICLES * 3);
  const colors = new Float32Array(PARTICLES * 3);
  const baseC = new THREE.Color(LIME);
  const accentC = new THREE.Color(VERMILION);

  const rings = 28;
  let p = 0;
  for (let i = 0; i < rings && p < PARTICLES; i += 1) {
    const rx = 0.34 + i * 0.155;
    const ry = 0.48 + i * 0.108;
    const perRing = Math.ceil(PARTICLES / rings);
    for (let s = 0; s < perRing && p < PARTICLES; s += 1) {
      const t = Math.random() * Math.PI * 2;
      const wob =
        1 + 0.035 * Math.sin(t * 3 + i * 0.6) + 0.02 * Math.sin(t * 7 - i * 1.2);
      const x = Math.cos(t) * rx * wob * 1.35 + (Math.random() - 0.5) * 0.06;
      const y = Math.sin(t) * ry * wob + (Math.random() - 0.5) * 0.06;
      const z = (Math.random() - 0.5) * 0.7;
      positions[p * 3] = x;
      positions[p * 3 + 1] = y;
      positions[p * 3 + 2] = z;
      const c = Math.random() < 0.03 ? accentC : baseC;
      colors[p * 3] = c.r;
      colors[p * 3 + 1] = c.g;
      colors[p * 3 + 2] = c.b;
      p += 1;
    }
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const particles = new THREE.Points(
    particleGeo,
    new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
  );
  particles.position.set(0.25, 0, -2.4);
  scrollGroup.add(particles);

  /* ---------- layout ---------- */

  let deviceBase = new THREE.Vector3();
  let particleBase = particles.position.clone();

  const layout = () => {
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;
    const aspect = width / height;

    renderer.setSize(width, height, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    if (width < 780) {
      deviceBase.set(0.15, 1.5, -0.2);
      device.scale.setScalar(0.66);
      particles.position.set(0, 0.6, -2.8);
      particles.scale.setScalar(1.05);
      shadow.position.set(0.15, 1.5, -1.1);
    } else {
      deviceBase.set(2.45, 0.15, 0);
      device.scale.setScalar(1);
      particles.position.set(0.35, 0, -2.6);
      particles.scale.setScalar(1);
      shadow.position.set(2.45, 0.1, -1.2);
    }

    device.position.copy(deviceBase);
    particleBase = particles.position.clone();
  };

  layout();

  /* ---------- pointer ---------- */

  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  let scrollSpin = 0;
  let burst = 0;

  const onPointer = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };

  if (!reduce && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("pointermove", onPointer, { passive: true });
  }

  /* click / tap scatters the ridge field — pure play, nothing permanent */
  if (!reduce) {
    window.addEventListener(
      "pointerdown",
      () => {
        if (visible) burst = 1;
      },
      { passive: true }
    );
  }

  /* ---------- loop ---------- */

  let visible = true;
  const clock = new THREE.Clock();

  const render = () => {
    const t = clock.getElapsedTime();
    smooth.x += (pointer.x - smooth.x) * 0.045;
    smooth.y += (pointer.y - smooth.y) * 0.045;
    burst *= 0.94;

    const targetRotY = -0.16 + smooth.x * 0.3 + scrollSpin;
    const targetRotX = 0.05 + smooth.y * -0.14 + scrollSpin * 0.12;
    device.rotation.y += (targetRotY - device.rotation.y) * 0.06;
    device.rotation.x += (targetRotX - device.rotation.x) * 0.06;
    device.rotation.z = -0.02 + Math.sin(t * 0.45) * 0.016;

    device.position.y = deviceBase.y + Math.sin(t * 0.75) * 0.07;
    device.position.x = deviceBase.x + smooth.x * 0.12;

    particles.rotation.z = Math.sin(t * 0.12) * 0.03 + smooth.x * 0.02 + burst * 0.4;
    particles.rotation.y = smooth.x * 0.03 + burst * 0.9;
    particles.rotation.x = burst * 0.5;
    particles.position.x = particleBase.x + smooth.x * 0.22;
    particles.position.y = particleBase.y - smooth.y * 0.16;

    ring.material.emissiveIntensity = 1.1 + Math.sin(t * 1.6) * 0.35;
    led.material.emissiveIntensity = 2.6 + Math.sin(t * 2.2) * 0.6;

    renderer.render(scene, camera);
  };

  const loop = () => {
    if (document.hidden || !visible) {
      requestAnimationFrame(loop);
      return;
    }
    render();
    requestAnimationFrame(loop);
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
    },
    { threshold: 0.02 }
  );
  io.observe(document.querySelector(".hero"));

  const ro = new ResizeObserver(layout);
  ro.observe(mount);

  if (reduce) {
    renderer.render(scene, camera);
  } else {
    loop();
  }

  /* ---------- scroll response ---------- */

  if (!reduce) {
    gsap.to(scrollGroup.position, {
      y: 1.1,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(particles.rotation, {
      z: 0.35,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        scrollSpin = self.progress * 1.7;
      },
    });
  }

  mount.style.opacity = reduce ? "1" : "0";

  const intro = () => {
    if (reduce) {
      mount.style.opacity = "1";
      return;
    }
    gsap.fromTo(
      mount,
      { opacity: 0 },
      { opacity: 1, duration: 1.4, ease: "power2.out" }
    );
    gsap.fromTo(
      camera.position,
      { z: 13.4 },
      { z: 11, duration: 2.6, ease: "power3.out", onUpdate: () => camera.updateProjectionMatrix() }
    );
    gsap.fromTo(
      device.rotation,
      { y: -0.75, x: 0.22 },
      { y: -0.16, x: 0.05, duration: 2.4, ease: "power3.out" }
    );
    gsap.fromTo(
      particles.scale,
      { x: 0.82, y: 0.82, z: 0.82 },
      { x: 1, y: 1, z: 1, duration: 2.8, ease: "power3.out", delay: 0.2 }
    );
  };

  return { intro };
}
