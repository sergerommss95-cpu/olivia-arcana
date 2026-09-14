"use client";

/**
 * THE RIFFLE — the physical draw.
 *
 * The full 78-card shuffle stands on edge in a shallow arc across the
 * stage. Press and hold grips the deck; a horizontal drag riffles it
 * past the thumb on a 1D inertia model; a pull past the threshold slides
 * the card under the thumb out of the ribbon. Pull toward the reader =
 * upright, push away = reversed.
 *
 * All 78 card backs are plain DOM nodes sharing one data-URI paint;
 * every transform is written imperatively inside ONE rAF — no React
 * state per frame. Ritual events go out on the shared "oa-ritual" bus.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type MachineState = "focusing" | "drawing" | "preparing" | "spread" | "result";
type Device = "mobile" | "tablet" | "desktop";

/* ── the engraved night back, serialized once — 78 nodes, one paint ── */
function buildCardBack(): string {
  let flecks = "";
  for (let i = 0; i < 34; i++) {
    const t = i / 33;
    const x = (14 + t * 102 + Math.sin(i * 2.7) * 7).toFixed(1);
    const y = (210 - t * 196 + Math.cos(i * 1.9) * 5).toFixed(1);
    const r = (0.4 + ((i * 37) % 10) / 14).toFixed(2);
    const o = (0.14 + ((i * 53) % 10) / 22).toFixed(2);
    flecks += `<circle cx="${x}" cy="${y}" r="${r}" opacity="${o}"/>`;
  }
  const rays = [
    [76, 112.5, 90, 112.5],
    [72.8, 120.3, 82.7, 130.2],
    [65, 123.5, 65, 137.5],
    [57.2, 120.3, 47.3, 130.2],
    [54, 112.5, 40, 112.5],
    [57.2, 104.7, 47.3, 94.8],
    [65, 101.5, 65, 87.5],
    [72.8, 104.7, 82.7, 94.8],
  ]
    .map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`)
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 225">` +
    `<defs><radialGradient id="g" cx="50%" cy="38%" r="85%">` +
    `<stop offset="0%" stop-color="#181d7a"/><stop offset="55%" stop-color="#10134d"/>` +
    `<stop offset="100%" stop-color="#0a0d38"/></radialGradient></defs>` +
    `<rect width="136" height="225" fill="url(#g)"/>` +
    `<g fill="#b7bce9" opacity="0.5">${flecks}</g>` +
    `<g fill="#e0b768"><circle cx="24" cy="30" r="0.9" opacity="0.8"/><circle cx="104" cy="48" r="0.7" opacity="0.65"/>` +
    `<circle cx="36" cy="188" r="0.7" opacity="0.6"/><circle cx="98" cy="170" r="0.9" opacity="0.75"/>` +
    `<circle cx="65" cy="52" r="0.6" opacity="0.55"/><circle cx="20" cy="120" r="0.6" opacity="0.5"/>` +
    `<circle cx="110" cy="112" r="0.6" opacity="0.5"/></g>` +
    `<rect x="5" y="5" width="126" height="215" rx="10" fill="none" stroke="#e8e9ff" stroke-opacity="0.5"/>` +
    `<rect x="11" y="11" width="114" height="203" rx="6" fill="none" stroke="#e8e9ff" stroke-opacity="0.22" stroke-width="0.75"/>` +
    `<g stroke="#e8e9ff" stroke-opacity="0.55" stroke-width="0.75" fill="none">` +
    `<path d="M 25 21 v 8 M 21 25 h 8"/><path d="M 111 21 v 8 M 107 25 h 8"/>` +
    `<path d="M 25 196 v 8 M 21 200 h 8"/><path d="M 111 196 v 8 M 107 200 h 8"/></g>` +
    `<g fill="none" stroke="#e8e9ff" transform="translate(3 0)">` +
    `<circle cx="65" cy="112.5" r="27" stroke-opacity="0.6" stroke-width="0.9"/>` +
    `<circle cx="65" cy="112.5" r="19" stroke-opacity="0.3" stroke-width="0.75" stroke-dasharray="1.5 3"/>` +
    `<g stroke-opacity="0.7" stroke-width="0.9">${rays}</g>` +
    `<circle cx="65" cy="112.5" r="3.4" fill="#e0b768" fill-opacity="0.95" stroke="none"/>` +
    `<circle cx="65" cy="112.5" r="6.5" stroke="#e0b768" stroke-opacity="0.5" stroke-width="0.6"/>` +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const CARD_BACK = buildCardBack();

function emitRitual(detail: Record<string, unknown>) {
  // fire-and-forget: the ritual bus must never throw back into the hand
  try {
    window.dispatchEvent(new CustomEvent("oa-ritual", { detail }));
  } catch {
    /* listeners' problems are their own */
  }
}

/* feel numbers — from the Balatro research */
const DRAW_THRESHOLD = 56; // px of vertical pull that commits a draw
const GRIP_COMPRESS = 8; // px neighbors squeeze toward the thumb
const HOVER_LIFT = 12; // px idle lean-out near the pointer
const FLICK_K = 900; // stiff flick spring — settles ~0.15s
const FLICK_C = 26;
const FRICTION = 3.1; // 1/s inertia decay after a flung release

type Flight = {
  idx: number;
  x0: number;
  y0: number;
  r0: number;
  tx: number;
  ty: number;
  rEnd: number;
  t0: number;
  dur: number;
  up: boolean;
};

export default function RiffleRibbon({
  count,
  selected,
  machineState,
  device,
  reducedMotion,
  canDraw,
  uk,
  onDraw,
}: {
  count: number;
  selected: number[];
  machineState: MachineState;
  device: Device;
  reducedMotion: boolean;
  canDraw: boolean;
  uk: boolean;
  onDraw: (index: number, reversed: boolean) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);

  // ── static per-card hand jitter: ±3° landing randomness, ±2px seat ──
  const jitter = useMemo(() => {
    const rot = new Float32Array(count);
    const dy = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const h = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      const a = h - Math.floor(h);
      const h2 = Math.sin(i * 269.5 + 183.3) * 28001.8384;
      const b = h2 - Math.floor(h2);
      rot[i] = (a - 0.5) * 6; // ±3°
      dy[i] = (b - 0.5) * 4;
    }
    return { rot, dy };
  }, [count]);

  // ── mutable simulation state (never React state) ──
  const sim = useRef({
    pos: 0,
    vel: 0,
    posInit: false,
    slots: new Float32Array(count),
    slotInit: new Uint8Array(count),
    flick: new Float32Array(count),
    flickV: new Float32Array(count),
    side: new Int8Array(count),
    remaining: [] as number[],
    drawn: new Set<number>(),
    flights: [] as Flight[],
    pointer: { x: 0, y: 0, inBand: false },
    grip: null as null | {
      startX: number;
      startY: number;
      lastX: number;
      lastT: number;
      dy: number;
      pulled: boolean;
      moved: boolean;
      downT: number;
    },
    kbActive: false,
    cursor: 0,
    posTarget: null as number | null,
    hoverEl: null as HTMLDivElement | null,
    mountT: 0,
    geom: {
      w: 1440,
      h: 900,
      left: 0,
      top: 0,
      cardW: 96,
      cardH: 159,
      spacing: 26,
      baseline: 0,
      arcH: 30,
      edge: 40,
    },
  });

  const [announce, setAnnounce] = useState("");

  // live mirrors of props for the rAF/pointer world
  const canDrawRef = useRef(canDraw);
  canDrawRef.current = canDraw && machineState === "drawing";
  const onDrawRef = useRef(onDraw);
  onDrawRef.current = onDraw;
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const measure = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const g = sim.current.geom;
    g.w = r.width;
    g.h = r.height;
    g.left = r.left;
    g.top = r.top;
    if (device === "mobile") {
      g.cardW = 62;
      g.cardH = 103;
      g.spacing = 13;
      g.arcH = 18;
      g.edge = 14;
      g.baseline = r.height / 2 + 148;
    } else if (device === "tablet") {
      g.cardW = 84;
      g.cardH = 139;
      g.spacing = 22;
      g.arcH = 26;
      g.edge = 28;
      g.baseline = r.height / 2 + 150;
    } else {
      g.cardW = 96;
      g.cardH = 159;
      g.spacing = 26;
      g.arcH = 30;
      g.edge = 40;
      g.baseline = r.height / 2 + 156;
    }
  }, [device]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // ── remaining deck ← selection; drawn cards return when deselected ──
  useEffect(() => {
    const s = sim.current;
    const sel = new Set(selected);
    for (const idx of Array.from(s.drawn)) {
      if (!sel.has(idx)) {
        s.drawn.delete(idx); // shelf gave the card back — reseat it
        const el = cardEls.current[idx];
        if (el) {
          el.style.display = "";
          el.style.zIndex = "";
        }
      }
    }
    s.remaining = [];
    for (let i = 0; i < count; i++) if (!sel.has(i)) s.remaining.push(i);
    if (s.cursor >= s.remaining.length) s.cursor = Math.max(0, s.remaining.length - 1);
  }, [selected, count]);

  /* ── the draw itself: slide out, fly to the shelf, hand off ── */
  const performDraw = useCallback(
    (idx: number, reversed: boolean) => {
      const s = sim.current;
      const g = s.geom;
      if (!canDrawRef.current || s.drawn.has(idx)) return;
      const rank = s.remaining.indexOf(idx);
      if (rank < 0) return;
      const screenX = g.w / 2 + (s.slots[idx] - s.pos);
      const nx = Math.max(-1.2, Math.min(1.2, (screenX - g.w / 2) / (g.w * 0.55)));
      const y = g.baseline - g.arcH * (1 - nx * nx) + (s.grip ? s.grip.dy * 0.55 : 0);
      s.drawn.add(idx);
      const el = cardEls.current[idx];
      if (el) el.style.zIndex = "200"; // the pulled card crosses above the ribbon
      s.flights.push({
        idx,
        x0: screenX,
        y0: y,
        r0: nx * 10 + jitter.rot[idx] * 0.6,
        tx: g.w / 2,
        ty: g.h / 2 - (device === "mobile" ? 175 : 200),
        rEnd: jitter.rot[idx], // lands with its own ±3°
        t0: performance.now(),
        dur: reducedRef.current ? 1 : 460,
        up: reversed,
      });
      emitRitual({ type: "card-pull" });
      onDrawRef.current(idx, reversed);
    },
    [device, jitter]
  );

  const nearestToPointer = useCallback(() => {
    const s = sim.current;
    const g = s.geom;
    let best = -1;
    let bestD = Infinity;
    for (const i of s.remaining) {
      const d = Math.abs(g.w / 2 + (s.slots[i] - s.pos) - s.pointer.x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return bestD < g.spacing * 3 + g.cardW / 2 ? best : -1;
  }, []);

  /* ── pointer gestures: grip → riffle → pull ── */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (machineState !== "drawing") return;
      const s = sim.current;
      const g = s.geom;
      bandRef.current?.setPointerCapture(e.pointerId);
      s.pointer.x = e.clientX - g.left;
      s.pointer.y = e.clientY - g.top;
      s.kbActive = false;
      s.posTarget = null;
      s.vel = 0;
      s.grip = {
        startX: s.pointer.x,
        startY: s.pointer.y,
        lastX: s.pointer.x,
        lastT: performance.now(),
        dy: 0,
        pulled: false,
        moved: false,
        downT: performance.now(),
      };
      // seed crossing sides so the first frame doesn't tick the whole deck
      for (const i of s.remaining) {
        s.side[i] = g.w / 2 + (s.slots[i] - s.pos) > s.pointer.x ? 1 : -1;
      }
      stageRef.current?.classList.add("oa-gripped");
      emitRitual({ type: "grip" });
    },
    [machineState]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const g = s.geom;
    s.pointer.x = e.clientX - g.left;
    s.pointer.y = e.clientY - g.top;
    s.pointer.inBand = true;
    const grip = s.grip;
    if (!grip || grip.pulled) return;
    const now = performance.now();
    const dx = s.pointer.x - grip.lastX;
    const dt = Math.max(1, now - grip.lastT);
    grip.lastX = s.pointer.x;
    grip.lastT = now;
    const dxTotal = s.pointer.x - grip.startX;
    const dyTotal = s.pointer.y - grip.startY;
    grip.dy = Math.max(-70, Math.min(70, dyTotal));
    if (Math.abs(dxTotal) > 8 || Math.abs(dyTotal) > 8) grip.moved = true;

    // the riffle: the deck scrubs past the thumb, with rubber at the ends
    if (!reducedRef.current) {
      const ribbonW = Math.max(0, (s.remaining.length - 1) * g.spacing);
      const usable = g.w - g.edge * 2;
      const minP = ribbonW <= usable ? ribbonW / 2 : usable / 2;
      const maxP = ribbonW <= usable ? ribbonW / 2 : ribbonW - usable / 2;
      const out = s.pos < minP || s.pos > maxP;
      s.pos -= dx * (out ? 0.35 : 1);
      s.vel = 0.75 * s.vel + 0.25 * (-dx / dt) * 1000;
    }

    // the pull: past the threshold, mostly vertical → the card comes out
    if (
      Math.abs(dyTotal) > DRAW_THRESHOLD &&
      Math.abs(dyTotal) > Math.abs(dxTotal) * 0.7 &&
      canDrawRef.current
    ) {
      const idx = nearestToPointer();
      if (idx >= 0) {
        grip.pulled = true;
        performDraw(idx, dyTotal < 0); // push-away = reversed
      }
    }
  }, [nearestToPointer, performDraw]);

  const endGrip = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const s = sim.current;
      const grip = s.grip;
      stageRef.current?.classList.remove("oa-gripped");
      if (!grip) return;
      s.grip = null;
      try {
        bandRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      // a clean tap is still a draw — upright, as the still hand intends
      if (
        !grip.pulled &&
        !grip.moved &&
        performance.now() - grip.downT < 280 &&
        canDrawRef.current
      ) {
        const idx = nearestToPointer();
        if (idx >= 0) performDraw(idx, false);
        s.vel = 0;
      }
      if (reducedRef.current) s.vel = 0;
    },
    [nearestToPointer, performDraw]
  );

  const onPointerLeaveBand = useCallback(() => {
    sim.current.pointer.inBand = false;
  }, []);

  /* ── keyboard: arrows scrub, Enter draws, Shift+Enter reversed ── */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const s = sim.current;
      const g = s.geom;
      if (machineState !== "drawing" || s.remaining.length === 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        s.kbActive = true;
        s.cursor = Math.max(
          0,
          Math.min(s.remaining.length - 1, s.cursor + (e.key === "ArrowRight" ? 1 : -1))
        );
        const idx = s.remaining[s.cursor];
        s.posTarget = s.slots[idx];
        if (reducedRef.current) s.pos = s.posTarget;
        setAnnounce(
          uk
            ? `Карта ${s.cursor + 1} з ${s.remaining.length}`
            : `Card ${s.cursor + 1} of ${s.remaining.length}`
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        s.kbActive = true;
        const idx = s.remaining[Math.min(s.cursor, s.remaining.length - 1)];
        if (idx !== undefined) {
          performDraw(idx, e.shiftKey); // Shift+Enter = reversed
          const left = s.remaining.length - 1;
          setAnnounce(
            uk
              ? `Витягнуто${e.shiftKey ? " перевернуту" : ""} · залишилось ${left}`
              : `Drawn${e.shiftKey ? " reversed" : ""} · ${left} remain`
          );
        }
      }
    },
    [machineState, performDraw, uk]
  );

  /* ── THE ONE rAF: slots, arc, grip, flicks, inertia, flights ── */
  useEffect(() => {
    if (machineState !== "focusing" && machineState !== "drawing") return;
    const s = sim.current;
    s.mountT = performance.now();
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const g = s.geom;
      const reduced = reducedRef.current;
      const n = s.remaining.length;
      const ribbonW = Math.max(0, (n - 1) * g.spacing);
      const usable = g.w - g.edge * 2;
      const minP = ribbonW <= usable ? ribbonW / 2 : usable / 2;
      const maxP = ribbonW <= usable ? ribbonW / 2 : ribbonW - usable / 2;
      if (!s.posInit) {
        s.pos = ribbonW / 2;
        s.posInit = true;
      }

      // inertia — flick-release keeps rolling, decelerating
      if (!s.grip && !reduced) {
        if (s.posTarget != null && s.kbActive) {
          s.pos += (s.posTarget - s.pos) * Math.min(1, dt * 10);
          s.vel = 0;
        } else {
          s.pos += s.vel * dt;
          s.vel *= Math.exp(-FRICTION * dt);
          if (Math.abs(s.vel) < 4) s.vel = 0;
          if (s.pos < minP) {
            s.pos += (minP - s.pos) * Math.min(1, dt * 9);
            s.vel *= 0.6;
          } else if (s.pos > maxP) {
            s.pos += (maxP - s.pos) * Math.min(1, dt * 9);
            s.vel *= 0.6;
          }
        }
      }
      if (reduced) s.pos = Math.max(minP, Math.min(maxP, s.pos));

      const gripping = !!s.grip && !s.grip.pulled;
      const gripX = gripping ? s.grip!.lastX : s.pointer.x;
      const gripIdx = gripping ? nearestToPointer() : -1;
      const kbIdx =
        s.kbActive && s.remaining.length > 0
          ? s.remaining[Math.min(s.cursor, s.remaining.length - 1)]
          : -1;
      const scrubVel = gripping || Math.abs(s.vel) > 60 ? s.vel : 0;
      const flexDeg = Math.max(-4, Math.min(4, scrubVel * 0.004)); // fake flex, <4°
      let tickedThisFrame = false;
      const introSpan = reduced ? 0 : 420;

      for (let r = 0; r < n; r++) {
        const i = s.remaining[r];
        const el = cardEls.current[i];
        if (!el) continue;

        // gap-close: each card eases into its rank's seat
        const target = r * g.spacing;
        if (!s.slotInit[i] || reduced) {
          s.slots[i] = target;
          s.slotInit[i] = 1;
        } else {
          s.slots[i] += (target - s.slots[i]) * Math.min(1, dt * 9);
        }

        let x = g.w / 2 + (s.slots[i] - s.pos);
        const nx = Math.max(-1.2, Math.min(1.2, (x - g.w / 2) / (g.w * 0.55)));
        let y = g.baseline - g.arcH * (1 - nx * nx) + jitter.dy[i];
        let rot = nx * 10 + jitter.rot[i] * 0.6;

        // crossing the thumb → flick upright + one ritual tick
        if ((gripping || Math.abs(s.vel) > 80) && !reduced) {
          const sideNow: 1 | -1 = x > gripX ? 1 : -1;
          if (s.side[i] !== 0 && s.side[i] !== sideNow) {
            s.flickV[i] += 10;
            if (!tickedThisFrame) {
              tickedThisFrame = true;
              emitRitual({ type: "riffle-tick", velocity: Math.round(s.vel) });
            }
          }
          s.side[i] = sideNow;
        }

        // stiff flick spring — rises fast, settles ~0.15s, lands askew
        let f = s.flick[i];
        if (f !== 0 || s.flickV[i] !== 0) {
          const fv = s.flickV[i] + (-FLICK_K * f - FLICK_C * s.flickV[i]) * dt;
          f += fv * dt;
          if (Math.abs(f) < 0.004 && Math.abs(fv) < 0.05) {
            f = 0;
            s.flickV[i] = 0;
          } else {
            s.flickV[i] = fv;
          }
          s.flick[i] = f;
        }
        const fl = Math.min(1, Math.abs(f));
        rot *= 1 - 0.85 * fl; // flicks upright…
        y -= 11 * fl; // …with a slight lift
        const skew = flexDeg * fl;

        if (!reduced) {
          // idle breath
          y += Math.sin(now / 2100 + i * 0.37) * 2.2;
          // hover lean-out near the still pointer
          if (!gripping && s.pointer.inBand && machineState === "drawing") {
            const d = (x - s.pointer.x) / 110;
            const inf = Math.exp(-d * d);
            y -= HOVER_LIFT * inf;
            rot *= 1 - 0.35 * inf;
          }
          // grip: neighbors compress toward the thumb
          if (gripping) {
            const dN = (x - gripX) / 150;
            x += -GRIP_COMPRESS * dN * Math.exp(-dN * dN) * 1.7;
            if (i === gripIdx) {
              y += s.grip!.dy * 0.55; // the card rides the pull
              rot *= 0.5;
            }
          }
          if (i === kbIdx) {
            y -= HOVER_LIFT;
            rot *= 0.6;
          }
        }

        // dealt-in entrance, center outward — well under the 1.6s budget
        let alpha = 1;
        if (!reduced && now - s.mountT < introSpan + n * 5) {
          const delay = Math.abs(r - n / 2) * 9;
          const p = Math.max(0, Math.min(1, (now - s.mountT - delay) / introSpan));
          const ep = 1 - Math.pow(1 - p, 3);
          y += (1 - ep) * 46;
          alpha = ep;
        }

        const lifted = i === gripIdx || i === kbIdx;
        if (lifted !== (s.hoverEl === el)) {
          if (s.hoverEl) s.hoverEl.style.zIndex = "";
          s.hoverEl = lifted ? el : null;
          if (lifted) el.style.zIndex = "90";
        }
        el.style.opacity = String(alpha);
        el.style.transform = `translate3d(${(x - g.cardW / 2).toFixed(2)}px, ${(y - g.cardH / 2).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg)${skew ? ` skewX(${skew.toFixed(2)}deg)` : ""}`;
      }

      // flights: the drawn card slides out and crosses to the shelf
      for (let k = s.flights.length - 1; k >= 0; k--) {
        const fl = s.flights[k];
        const el = cardEls.current[fl.idx];
        const p = Math.min(1, (now - fl.t0) / fl.dur);
        if (!el) {
          s.flights.splice(k, 1);
          continue;
        }
        const e =
          p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // easeInOutCubic
        const x = fl.x0 + (fl.tx - fl.x0) * e;
        const bump = (fl.up ? -90 : -34) * Math.sin(Math.PI * e);
        const y = fl.y0 + (fl.ty - fl.y0) * e + bump;
        const rot = fl.r0 + (fl.rEnd - fl.r0) * e;
        el.style.opacity = String(p < 0.62 ? 1 : Math.max(0, 1 - (p - 0.62) / 0.3));
        el.style.transform = `translate3d(${(x - s.geom.cardW / 2).toFixed(2)}px, ${(y - s.geom.cardH / 2).toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${(1 + 0.06 * Math.sin(Math.PI * e)).toFixed(3)})`;
        if (p >= 1) {
          el.style.display = "none";
          el.style.opacity = "0";
          if (s.hoverEl === el) s.hoverEl = null;
          s.flights.splice(k, 1);
          emitRitual({ type: "card-land", index: fl.idx });
        }
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [machineState, jitter, nearestToPointer]);

  if (machineState === "spread" || machineState === "result") return null;
  const active = machineState === "drawing";
  const g = sim.current.geom;
  const bandTop = device === "mobile" ? "calc(50% + 44px)" : "calc(50% + 24px)";
  const bandH = device === "mobile" ? 250 : 280;

  return (
    <div
      ref={stageRef}
      className="oa-riffle absolute inset-0 z-10"
      style={{
        pointerEvents: "none",
        opacity: machineState === "preparing" ? 0 : active ? 1 : 0.35,
        transition: "opacity 700ms cubic-bezier(0.625, 0.05, 0, 1)",
      }}
    >
      {/* the 78 standing backs — stage coordinates, transforms only */}
      <div className="absolute inset-0" style={{ pointerEvents: "none" }} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cardEls.current[i] = el;
            }}
            className="oa-riffle-card"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: g.cardW,
              height: g.cardH,
              borderRadius: 8,
              backgroundImage: CARD_BACK,
              backgroundSize: "100% 100%",
              boxShadow: "0 8px 18px rgba(5,7,32,0.5)",
              willChange: "transform",
              opacity: 0,
              display: selected.includes(i) ? "none" : undefined,
            }}
          />
        ))}
      </div>

      {/* the hand's band: grip, riffle, pull */}
      <div
        ref={bandRef}
        role="group"
        aria-label={
          uk
            ? "Колода з 78 карт. Стрілки — гортати, Enter — витягнути, Shift+Enter — перевернуту."
            : "Deck of 78 cards. Arrow keys riffle, Enter draws upright, Shift+Enter draws reversed."
        }
        tabIndex={active ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGrip}
        onPointerCancel={endGrip}
        onPointerLeave={onPointerLeaveBand}
        onKeyDown={onKeyDown}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: bandTop,
          height: bandH,
          pointerEvents: active ? "auto" : "none",
          touchAction: "none",
          cursor: "grab",
          outline: "none",
        }}
      />

      <div
        aria-live="polite"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clipPath: "inset(50%)",
        }}
      >
        {announce}
      </div>

      <style>{`
        .oa-riffle-card { transition: box-shadow 250ms cubic-bezier(0.625, 0.05, 0, 1); }
        .oa-riffle.oa-gripped .oa-riffle-card { box-shadow: 0 14px 26px rgba(5, 7, 32, 0.72); }
        .oa-riffle.oa-gripped [role="group"] { cursor: grabbing; }
        .oa-riffle [role="group"]:focus-visible {
          outline: 1px solid rgba(224, 183, 104, 0.9);
          outline-offset: -1px;
        }
      `}</style>
    </div>
  );
}
