/**
 * ZODIAC CONSTELLATION RENDERER v3
 * ─────────────────────────────────
 * Redesigned to match the dark, minimal, weighted aesthetic.
 *
 * Philosophy:
 *   - Monochromatic. No colored glows. White/silver only.
 *   - Paper-thin lines. Barely there at idle. Draw in on hover.
 *   - No particle pools, no oracle rings, no flashy effects.
 *   - Each sign is unique through TIMING and DRAW ORDER, not spectacle.
 *   - The interaction should feel like discovering something hidden.
 *   - Restraint over excess. Mystery over clutter.
 */

import { ZODIAC, type ZodiacSign } from "../data/constellations";

// ── State per zodiac sign ──
export interface ZodiacState {
  hover: number;          // 0-1 smooth proximity
  dwell: number;          // ms spent within range
  activation: number;     // 0-1 reveal progress
  lineDraw: number[];     // per-connection draw progress 0-1
  starAlpha: number[];    // per-star visibility 0-1
  phase: number;          // idle animation phase
}

export function createZodiacStates(): ZodiacState[] {
  return ZODIAC.map((sign) => ({
    hover: 0,
    dwell: 0,
    activation: 0,
    lineDraw: new Array(sign.connections.length).fill(0),
    starAlpha: new Array(sign.stars.length).fill(0),
    phase: Math.random() * Math.PI * 2,
  }));
}

// ── Helpers ──
function pts(sign: ZodiacSign, w: number, h: number) {
  return sign.stars.map(([sx, sy]: [number, number]) => ({
    x: sign.cx * w + (sx - 0.5) * sign.scale,
    y: sign.cy * h + (sy - 0.5) * sign.scale,
  }));
}

function revealOrder(sign: ZodiacSign, stars: { x: number; y: number }[]): number[] {
  const n = stars.length;
  switch (sign.revealOrder) {
    case "burst":        return stars.map(() => Math.random() * 0.1);
    case "sequential":   return stars.map((_, i) => i / Math.max(1, n - 1));
    case "simultaneous": return stars.map(() => 0);
    case "center-out": {
      const cx = stars.reduce((s, p) => s + p.x, 0) / n;
      const cy = stars.reduce((s, p) => s + p.y, 0) / n;
      const d = stars.map((p) => Math.hypot(p.x - cx, p.y - cy));
      const mx = Math.max(...d, 1);
      return d.map((v) => v / mx);
    }
    case "bottom-up": {
      const ys = stars.map((p) => p.y);
      const mn = Math.min(...ys), r = Math.max(...ys) - mn || 1;
      return ys.map((y) => 1 - (y - mn) / r);
    }
    case "wave": {
      const xs = stars.map((p) => p.x);
      const mn = Math.min(...xs), r = Math.max(...xs) - mn || 1;
      return xs.map((x) => (x - mn) / r);
    }
    default: return stars.map(() => 0);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UPDATE — advance all animation state
// ═══════════════════════════════════════════════════════════════════════════

export function updateZodiacStates(
  states: ZodiacState[],
  mx: number, my: number,
  w: number, h: number,
  dt: number,
) {
  for (let ci = 0; ci < ZODIAC.length; ci++) {
    const sign = ZODIAC[ci];
    const state = states[ci];
    const stars = pts(sign, w, h);
    const cx = stars.reduce((s, p) => s + p.x, 0) / stars.length;
    const cy = stars.reduce((s, p) => s + p.y, 0) / stars.length;

    state.phase += dt * 0.0006 * (sign.idleSpeed || 1);

    // ── Proximity + dwell ──
    const dist = Math.hypot(mx - cx, my - cy);
    const near = dist < sign.scale * 1.8;
    state.dwell = near
      ? Math.min(state.dwell + dt, 3000)
      : Math.max(state.dwell - dt * 1.5, 0);

    const ready = state.dwell > 350; // 350ms dwell before activation
    const prox = near ? Math.pow(Math.max(0, 1 - dist / (sign.scale * 1.8)), 0.6) : 0;
    const target = ready ? prox : prox * 0.08; // barely visible pre-dwell

    // Spring-like easing (fast in, slow out — matches the WebGL engine's spring)
    const easeIn = 0.04;
    const easeOut = 0.012;
    state.hover += (target - state.hover) * (target > state.hover ? easeIn : easeOut);

    // Activation builds over time while hovering
    if (ready && state.hover > 0.15) {
      state.activation = Math.min(state.activation + dt * 0.0006, 1);
    } else {
      state.activation = Math.max(state.activation - dt * 0.0004, 0);
    }

    // ── Per-star reveal (staggered by sign's reveal order) ──
    const order = revealOrder(sign, stars);
    for (let si = 0; si < sign.stars.length; si++) {
      const threshold = order[si] * 0.5;
      const starTarget = state.activation > threshold
        ? Math.min(1, (state.activation - threshold) / 0.35)
        : state.hover * 0.06; // ghost-faint pre-reveal
      state.starAlpha[si] += (starTarget - state.starAlpha[si]) * 0.055;
    }

    // ── Per-line draw (follows star reveal) ──
    for (let li = 0; li < sign.connections.length; li++) {
      const [a, b] = sign.connections[li];
      const lineTarget = Math.min(state.starAlpha[a] || 0, state.starAlpha[b] || 0);
      state.lineDraw[li] += (lineTarget - state.lineDraw[li]) * 0.04;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAW — render all constellations
// ═══════════════════════════════════════════════════════════════════════════

export function drawZodiacConstellations(
  ctx: CanvasRenderingContext2D,
  states: ZodiacState[],
  w: number, h: number,
  time: number,
) {
  for (let ci = 0; ci < ZODIAC.length; ci++) {
    const sign = ZODIAC[ci];
    const state = states[ci];
    if (state.hover < 0.003 && state.activation < 0.003) continue;

    const stars = pts(sign, w, h);
    const cx = stars.reduce((s, p) => s + p.x, 0) / stars.length;
    const cy = stars.reduce((s, p) => s + p.y, 0) / stars.length;

    const hi = state.hover;
    const ap = state.activation;

    // ── Connection lines: paper-thin, white, draw-in animation ──
    for (let li = 0; li < sign.connections.length; li++) {
      const [a, b] = sign.connections[li];
      if (a >= stars.length || b >= stars.length) continue;
      const progress = state.lineDraw[li];
      if (progress < 0.005) continue;

      const sa = stars[a], sb = stars[b];
      const ex = sa.x + (sb.x - sa.x) * progress;
      const ey = sa.y + (sb.y - sa.y) * progress;

      // Per-sign line style: some signs get curved lines
      const isCurved = sign.motionStyle === "shell" || sign.motionStyle === "dissolution";

      ctx.beginPath();
      if (isCurved) {
        // Bezier curve — organic, flowing
        const wave = Math.sin(time * 0.6 + li * 0.8) * 6 * hi;
        const dx = sb.x - sa.x, dy = sb.y - sa.y;
        const len = Math.hypot(dx, dy) || 1;
        const cpx = (sa.x + ex) / 2 + (-dy / len) * wave;
        const cpy = (sa.y + ey) / 2 + (dx / len) * wave;
        ctx.moveTo(sa.x, sa.y);
        ctx.quadraticCurveTo(cpx, cpy, ex, ey);
      } else {
        ctx.moveTo(sa.x, sa.y);
        ctx.lineTo(ex, ey);
      }

      ctx.strokeStyle = `rgba(255,255,255,${progress * (0.12 + hi * 0.25)})`;
      ctx.lineWidth = 0.4 + hi * 0.4;
      ctx.stroke();
    }

    // ── Star nodes: tiny dots, barely visible ──
    for (let si = 0; si < stars.length; si++) {
      const alpha = state.starAlpha[si];
      if (alpha < 0.005) continue;

      const s = stars[si];
      const breath = 0.85 + 0.15 * Math.sin(time * 1.2 + state.phase + si * 1.1);
      const r = (1.0 + hi * 1.5) * breath;
      const a = alpha * (0.3 + hi * 0.5) * breath;

      // Core dot
      ctx.beginPath();
      ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(a, 0.9)})`;
      ctx.fill();

      // Subtle glow halo (only when activated)
      if (alpha > 0.3) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.04})`;
        ctx.fill();
      }
    }

    // ── Sign-specific accent (minimal, one unique touch per sign) ──
    if (ap > 0.5) {
      const fx = (ap - 0.5) / 0.5; // 0-1 for the final phase
      drawSignAccent(ctx, sign, state, stars, cx, cy, time, hi, fx);
    }

    // ── Label: glyph + name (whisper-quiet, appears last) ──
    if (ap > 0.4) {
      const labelAlpha = Math.min(1, (ap - 0.4) / 0.3) * hi * 0.7;
      if (labelAlpha > 0.02) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Glyph — small, not huge
        ctx.font = `${13 + hi * 5}px serif`;
        ctx.fillStyle = `rgba(255,255,255,${labelAlpha * 0.6})`;
        ctx.fillText(sign.glyph, cx, cy - sign.scale * 0.45 - 8);

        // Name — tiny uppercase tracked letters
        ctx.font = `300 ${7 + hi * 1.5}px Inter, system-ui, sans-serif`;
        ctx.letterSpacing = "2px";
        ctx.fillStyle = `rgba(200,195,220,${labelAlpha * 0.4})`;
        ctx.fillText(sign.name.toUpperCase(), cx, cy + sign.scale * 0.45 + 10);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Per-sign accents — ONE unique touch per sign, not a visual circus
// ═══════════════════════════════════════════════════════════════════════════

type Pt = { x: number; y: number };

function drawSignAccent(
  ctx: CanvasRenderingContext2D,
  sign: ZodiacSign,
  _state: ZodiacState,
  stars: Pt[], cx: number, cy: number,
  time: number, hi: number, fx: number,
) {
  const a = fx * hi * 0.15; // keep everything subtle
  if (a < 0.01) return;

  switch (sign.motionStyle) {

    // ARIES — brief radial pulse from center
    case "charge": {
      const pulse = sign.scale * (0.3 + fx * 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${a * (1 - fx * 0.6)})`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
      break;
    }

    // TAURUS — slow expanding ring from base
    case "emergence": {
      const r = sign.scale * 0.4 * fx;
      ctx.beginPath();
      ctx.arc(cx, cy + sign.scale * 0.2, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.8})`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
      break;
    }

    // GEMINI — mirror axis line
    case "mirror": {
      ctx.beginPath();
      ctx.moveTo(cx, cy - sign.scale * 0.4);
      ctx.lineTo(cx, cy + sign.scale * 0.4);
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.6})`;
      ctx.lineWidth = 0.3;
      ctx.setLineDash([3, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }

    // CANCER — concentric ripple
    case "shell": {
      for (let ring = 0; ring < 2; ring++) {
        const phase = (time * 0.3 + ring * 0.7) % 2;
        const r = sign.scale * (0.15 + phase * 0.3);
        const ra = a * Math.max(0, 1 - phase / 2) * 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${ra})`;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
      break;
    }

    // LEO — 4 subtle rays from center star
    case "throne": {
      const center = stars[3] || stars[0];
      const rayLen = sign.scale * 0.3 * fx;
      for (let r = 0; r < 4; r++) {
        const angle = (r / 4) * Math.PI * 2 + time * 0.05;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + Math.cos(angle) * rayLen, center.y + Math.sin(angle) * rayLen);
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
      break;
    }

    // VIRGO — faint geometric grid
    case "weave": {
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.3})`;
      ctx.lineWidth = 0.2;
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * sign.scale * 0.35, cy + Math.sin(angle) * sign.scale * 0.35);
        ctx.lineTo(cx - Math.cos(angle) * sign.scale * 0.35, cy - Math.sin(angle) * sign.scale * 0.35);
        ctx.stroke();
      }
      break;
    }

    // LIBRA — horizontal balance line
    case "balance": {
      ctx.beginPath();
      ctx.moveTo(cx - sign.scale * 0.35, cy);
      ctx.lineTo(cx + sign.scale * 0.35, cy);
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.7})`;
      ctx.lineWidth = 0.3;
      ctx.stroke();
      break;
    }

    // SCORPIO — tail star pulses independently
    case "depth": {
      const tail = stars[stars.length - 1];
      if (tail) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 2.5);
        ctx.beginPath();
        ctx.arc(tail.x, tail.y, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a * pulse * 0.5})`;
        ctx.fill();
      }
      break;
    }

    // SAGITTARIUS — directional line from bow toward target
    case "arc": {
      if (stars.length >= 5) {
        const bow = stars[0], arrow = stars[4];
        const dx = arrow.x - bow.x, dy = arrow.y - bow.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len, ny = dy / len;
        const ext = sign.scale * 0.4 * fx;
        ctx.beginPath();
        ctx.moveTo(arrow.x, arrow.y);
        ctx.lineTo(arrow.x + nx * ext, arrow.y + ny * ext);
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.6})`;
        ctx.lineWidth = 0.3;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      break;
    }

    // CAPRICORN — upward triangle hint
    case "ascent": {
      ctx.beginPath();
      ctx.moveTo(cx, cy - sign.scale * 0.35);
      ctx.lineTo(cx - sign.scale * 0.2, cy + sign.scale * 0.15);
      ctx.lineTo(cx + sign.scale * 0.2, cy + sign.scale * 0.15);
      ctx.closePath();
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.4})`;
      ctx.lineWidth = 0.2;
      ctx.stroke();
      break;
    }

    // AQUARIUS — brief electric flash between random stars
    case "wave": {
      const seed = Math.floor(time * 2);
      const si = seed % stars.length;
      const ti = (seed + 3) % stars.length;
      if (si !== ti) {
        const midx = (stars[si].x + stars[ti].x) / 2 + Math.sin(time * 15) * 5;
        const midy = (stars[si].y + stars[ti].y) / 2 + Math.cos(time * 12) * 5;
        ctx.beginPath();
        ctx.moveTo(stars[si].x, stars[si].y);
        ctx.lineTo(midx, midy);
        ctx.lineTo(stars[ti].x, stars[ti].y);
        ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
        ctx.lineWidth = 0.3;
        ctx.stroke();
      }
      break;
    }

    // PISCES — flowing bezier connections (already handled in line drawing)
    case "dissolution":
      // No extra accent — the curved lines ARE the accent
      break;
  }
}
