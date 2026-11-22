/* ------------------------------------------------------------------
   LECTURER MODE — heatmap, live risk threshold, request flow, export.
   ------------------------------------------------------------------ */

const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8];
const GROUPS = [
  { name: "A1", values: [92, 88, 84, 90, 86, 91, 88, 93] },
  { name: "A2", values: [78, 74, 69, 72, 66, 70, 74, 71] },
  { name: "A3", values: [86, 82, 79, 84, 88, 85, 81, 87] },
  { name: "A4", values: [64, 58, 61, 55, 52, 60, 57, 63] },
];

const STUDENTS = [
  { name: "A. Fernando", module: "IS2103", pct: 92 },
  { name: "N. Perera", module: "IS2201", pct: 71 },
  { name: "T. Jayasinghe", module: "IS2103", pct: 68 },
  { name: "S. Rajendran", module: "IS2304", pct: 84 },
  { name: "M. Fonseka", module: "IS2103", pct: 58 },
  { name: "K. Bandara", module: "IS2201", pct: 76 },
  { name: "D. Silva", module: "IS2304", pct: 63 },
  { name: "H. Weerasinghe", module: "IS2103", pct: 88 },
  { name: "R. Sivarajah", module: "IS2201", pct: 52 },
  { name: "L. Gunasekara", module: "IS2304", pct: 79 },
];

const FLOW_COPY = [
  "WAITING FOR A LECTURER TO PICK IT UP.",
  "ACCEPTED — OFFICE HOURS PROPOSED FOR TUE 14:00.",
  "REPLIED — WALKTHROUGH SENT. WAITING FOR THE STUDENT.",
  "SOLVED — STUDENT SAYS THE TUTORIAL MAKES SENSE NOW.",
];

function mix(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function cellColor(value) {
  if (value < 70) {
    const t = Math.min(1, (70 - value) / 26);
    const a = 0.1 + t * 0.44;
    return {
      bg: `rgba(255, 75, 43, ${a.toFixed(3)})`,
      fg: t > 0.45 ? "#ffd7cc" : "#f2a693",
    };
  }
  const t = Math.min(1, (value - 70) / 30);
  const a = 0.07 + t * 0.32;
  return {
    bg: `rgba(203, 255, 74, ${a.toFixed(3)})`,
    fg: t > 0.4 ? "#eaffc4" : "#c8dd9d",
  };
}

export function initLecturer({ reduce = false } = {}) {
  const heat = document.querySelector("[data-heat]");
  const weeksEl = document.querySelector("[data-heat-weeks]");
  const rowsEl = document.querySelector("[data-heat-rows]");
  const tip = document.querySelector("[data-heat-tip]");

  /* ---------- heatmap ---------- */

  if (heat && weeksEl && rowsEl) {
    WEEKS.forEach((week) => {
      const el = document.createElement("span");
      el.className = "heat__week";
      el.textContent = `W${String(week).padStart(2, "0")}`;
      weeksEl.appendChild(el);
    });

    GROUPS.forEach((group) => {
      const label = document.createElement("span");
      label.className = "heat__group";
      label.textContent = group.name;
      rowsEl.appendChild(label);

      group.values.forEach((value, i) => {
        const { bg, fg } = cellColor(value);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "heat__cell";
        if (value < 70) cell.classList.add("is-low");
        cell.style.background = bg;
        cell.style.color = fg;
        cell.textContent = String(value);
        cell.setAttribute(
          "aria-label",
          `Group ${group.name}, week ${WEEKS[i]}: ${value} percent present`
        );
        cell.dataset.tip = `W${String(WEEKS[i]).padStart(2, "0")} · GROUP ${group.name} · ${value}% PRESENT`;
        rowsEl.appendChild(cell);
      });
    });

    const showTip = (cell) => {
      if (!tip) return;
      const heatRect = heat.getBoundingClientRect();
      const rect = cell.getBoundingClientRect();
      tip.textContent = cell.dataset.tip;
      tip.hidden = false;
      tip.style.left = `${rect.left - heatRect.left + rect.width / 2}px`;
      tip.style.top = `${rect.top - heatRect.top}px`;
    };

    const hideTip = () => {
      if (tip) tip.hidden = true;
    };

    rowsEl.addEventListener("pointerover", (e) => {
      const cell = e.target.closest(".heat__cell");
      if (cell) showTip(cell);
    });
    rowsEl.addEventListener("pointerout", (e) => {
      if (e.target.closest(".heat__cell")) hideTip();
    });
    rowsEl.addEventListener("focusin", (e) => {
      const cell = e.target.closest(".heat__cell");
      if (cell) showTip(cell);
    });
    rowsEl.addEventListener("focusout", hideTip);
  }

  /* ---------- risk threshold ---------- */

  const riskRange = document.querySelector("[data-risk-range]");
  const riskList = document.querySelector("[data-risk-list]");
  const riskCount = document.querySelector("[data-risk-count]");
  const riskValue = document.querySelector("[data-risk-value]");

  if (riskList) {
    STUDENTS.forEach((student) => {
      const li = document.createElement("li");
      li.className = "risk__row";
      li.dataset.pct = String(student.pct);
      const name = document.createElement("span");
      name.className = "risk__name";
      name.innerHTML = `${student.name} <em>${student.module}</em> <span class="risk__flag">AT RISK</span>`;
      const pct = document.createElement("span");
      pct.className = "risk__pct";
      pct.textContent = `${student.pct}%`;
      li.append(name, pct);
      riskList.appendChild(li);
    });
  }

  const updateRisk = () => {
    if (!riskRange) return;
    const threshold = Number(riskRange.value);
    const min = Number(riskRange.min);
    const max = Number(riskRange.max);
    let count = 0;

    riskList?.querySelectorAll(".risk__row").forEach((row) => {
      const below = Number(row.dataset.pct) < threshold;
      row.classList.toggle("is-risk", below);
      if (below) count += 1;
    });

    if (riskCount) riskCount.textContent = String(count);
    if (riskValue) riskValue.textContent = `${threshold}%`;
    riskRange.style.setProperty("--fill", `${((threshold - min) / (max - min)) * 100}%`);
    riskRange.setAttribute("aria-valuetext", `${threshold} percent`);
  };

  riskRange?.addEventListener("input", updateRisk);
  updateRisk();

  /* ---------- support flow ---------- */

  const flow = document.querySelector("[data-flow]");
  const flowStatus = document.querySelector("[data-flow-status]");
  const advance = document.querySelector("[data-flow-advance]");
  let flowIndex = 0;

  const paintFlow = () => {
    flow?.querySelectorAll("[data-flow-step]").forEach((step) => {
      const i = Number(step.dataset.flowStep);
      step.classList.toggle("is-done", i < flowIndex);
      step.classList.toggle("is-active", i === flowIndex);
    });
    if (flowStatus) flowStatus.textContent = FLOW_COPY[flowIndex];
    if (advance) {
      advance.textContent =
        flowIndex === 3 ? "↻ Start over" : "Next step →";
    }
  };

  advance?.addEventListener("click", () => {
    flowIndex = flowIndex === 3 ? 0 : flowIndex + 1;
    paintFlow();
  });
  paintFlow();

  /* ---------- export ---------- */

  const exportRoot = document.querySelector(".export");
  const exportBtn = document.querySelector("[data-export]");
  const exportStatus = document.querySelector("[data-export-status]");
  let exporting = false;
  let exportTimer = 0;

  exportBtn?.addEventListener("click", () => {
    if (exporting || !exportRoot) return;
    exporting = true;
    exportRoot.classList.add("is-out");
    if (exportStatus) exportStatus.textContent = "BUILDING FILE…";
    if (navigator.vibrate) navigator.vibrate(10);

    window.clearTimeout(exportTimer);
    exportTimer = window.setTimeout(() => {
      exporting = false;
      if (exportStatus) {
        exportStatus.textContent = "EXPORTED · PDF + XLSX · 42 ROWS · 0 DUPLICATES";
      }
    }, reduce ? 120 : 1100);
  });
}
