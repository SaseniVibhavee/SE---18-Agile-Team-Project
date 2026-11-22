/* Procedural ridge lines. No stock fingerprint asset — every path is
   generated so the print belongs to the site.

   The shape is a classic "loop" print: ridges wrap around a drifting
   core and open toward the bottom. Outer ridges carry breaks, the way
   real friction ridges end and resume. */

const NS = "http://www.w3.org/2000/svg";

export function ridgePaths({
  count = 23,
  cx = 200,
  cy = 245,
  rx = 19,
  ry = 25,
  stepX = 8.1,
  stepY = 9.2,
} = {}) {
  const out = [];

  for (let i = 0; i < count; i += 1) {
    const t = count > 1 ? i / (count - 1) : 0;

    const R = rx + i * stepX;
    const Ry = ry + i * stepY;

    /* the core drifts a little as it grows — no perfect concentricity */
    const ox = Math.sin(i * 0.5) * 1.4 + t * 4.2;
    const oy = Math.cos(i * 0.42) * 1.1 - t * 3.4;

    /* opening at the bottom of the loop widens toward the outside */
    const base = Math.PI / 2;
    const opening = 0.14 + t * 1.62;
    const start = base + opening;
    const end = base - opening + Math.PI * 2;

    const steps = 180;

    /* deterministic breaks, only on some ridges */
    const breaks = [];
    if (i > 2 && i % 3 === 1) breaks.push(0.3 + (i % 5) * 0.065);
    if (i > 4 && i % 4 === 2) breaks.push(0.66);
    if (i > 6 && i % 5 === 0) breaks.push(0.48);
    const inBreak = (p) => breaks.some((b) => Math.abs(p - b) < 0.016);

    let d = "";
    let pen = false;

    for (let s = 0; s <= steps; s += 1) {
      const p = s / steps;
      const ang = start + (end - start) * p;

      const wob =
        1 +
        0.03 * Math.sin(ang * 3 + i * 0.72) +
        0.018 * Math.sin(ang * 6 - i * 1.14) +
        0.008 * Math.sin(ang * 11 + i * 0.36);

      let x = cx + ox + Math.cos(ang) * R * wob;
      let y = cy + oy + Math.sin(ang) * Ry * wob;

      /* a gentle vertical crease, like a finger pressed on glass */
      x += Math.sin(ang * 2 + i * 0.28) * 2.4;
      y += Math.cos(ang * 3 + i * 0.5) * 1.2;

      if (inBreak(p)) {
        pen = false;
        continue;
      }

      const cmd = pen ? "L" : "M";
      pen = true;
      d += `${cmd}${x.toFixed(2)} ${y.toFixed(2)}`;
    }

    if (d) out.push(d);
  }

  return out;
}

export function mountFingerprint(target, options = {}) {
  if (!target) return [];
  target.innerHTML = "";
  const paths = ridgePaths(options);

  return paths.map((d) => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    target.appendChild(p);
    return p;
  });
}
