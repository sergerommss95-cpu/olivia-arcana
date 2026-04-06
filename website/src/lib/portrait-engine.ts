/**
 * portrait-engine.ts — Generative Cosmic DNA renderer
 *
 * Maps birth data to visual parameters and renders a unique,
 * animated, full-viewport canvas artwork.
 *
 * Visual mapping:
 *   Element → color palette (fire/water/air/earth)
 *   Sign → central constellation structure
 *   Aspects → sacred geometry lines (trines=triangles, squares=crosses, sextiles=hexagrams)
 *   Moon phase at birth → ambient light intensity
 *   Planets → luminous orbital points
 *   Modality → symmetry type (cardinal=4-fold, fixed=6-fold, mutable=12-fold)
 *
 * Renders on Canvas 2D for maximum compatibility + easy PNG export.
 */

import { getSunSign } from "./zodiac-utils";

// ── Types ──
export interface BirthData {
  month: number;
  day: number;
  year?: number;
}

export interface PortraitConfig {
  signName: string;
  signIndex: number;
  element: "Fire" | "Water" | "Air" | "Earth";
  modality: "Cardinal" | "Fixed" | "Mutable";
  palette: ColorPalette;
  symmetry: number;      // fold count: 4, 6, or 12
  moonBrightness: number; // 0-1, derived from birth day
  seed: number;           // deterministic random seed from birth data
  planetAngles: number[]; // 10 angles (0-360) for planets
  aspects: Aspect[];      // geometric connections between planets
}

interface ColorPalette {
  bg: string;
  bgDeep: string;
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  particle: string;
  dim: string;
}

interface Aspect {
  from: number; // planet index
  to: number;
  type: "trine" | "square" | "sextile" | "conjunction" | "opposition";
  strength: number; // 0-1
}

// ── Element Palettes ──
const PALETTES: Record<string, ColorPalette> = {
  Fire: {
    bg: "#0a0404", bgDeep: "#120606",
    primary: "#FF6B35", secondary: "#FFB347", accent: "#FF4500",
    glow: "rgba(255,107,53,0.15)", particle: "#FFD700", dim: "rgba(255,150,80,0.08)",
  },
  Water: {
    bg: "#030812", bgDeep: "#040a18",
    primary: "#4FC3F7", secondary: "#0288D1", accent: "#80DEEA",
    glow: "rgba(79,195,247,0.12)", particle: "#26C6DA", dim: "rgba(79,195,247,0.06)",
  },
  Air: {
    bg: "#080810", bgDeep: "#0a0a14",
    primary: "#B0BEC5", secondary: "#CE93D8", accent: "#E0E0E0",
    glow: "rgba(200,200,220,0.1)", particle: "#E8EAF6", dim: "rgba(200,200,220,0.05)",
  },
  Earth: {
    bg: "#060804", bgDeep: "#081008",
    primary: "#7CB342", secondary: "#C6A962", accent: "#A1887F",
    glow: "rgba(124,179,66,0.12)", particle: "#D4C79A", dim: "rgba(124,179,66,0.06)",
  },
};

const ELEMENTS: Record<string, "Fire" | "Water" | "Air" | "Earth"> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const MODALITIES: Record<string, "Cardinal" | "Fixed" | "Mutable"> = {
  Aries: "Cardinal", Cancer: "Cardinal", Libra: "Cardinal", Capricorn: "Cardinal",
  Taurus: "Fixed", Leo: "Fixed", Scorpio: "Fixed", Aquarius: "Fixed",
  Gemini: "Mutable", Virgo: "Mutable", Sagittarius: "Mutable", Pisces: "Mutable",
};

// ── Deterministic pseudo-random ──
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

// ── Constellation star positions per sign (normalized 0-1) ──
const CONSTELLATIONS: Record<string, [number, number][]> = {
  Aries: [[0.5,0.15],[0.38,0.35],[0.62,0.35],[0.45,0.55],[0.55,0.55],[0.50,0.80]],
  Taurus: [[0.30,0.20],[0.50,0.18],[0.70,0.22],[0.35,0.45],[0.55,0.50],[0.65,0.42],[0.45,0.70],[0.55,0.75]],
  Gemini: [[0.35,0.15],[0.65,0.15],[0.35,0.40],[0.65,0.40],[0.38,0.65],[0.62,0.65],[0.50,0.50]],
  Cancer: [[0.50,0.20],[0.35,0.35],[0.65,0.35],[0.30,0.55],[0.70,0.55],[0.50,0.75]],
  Leo: [[0.50,0.12],[0.35,0.30],[0.65,0.28],[0.30,0.50],[0.70,0.48],[0.40,0.70],[0.60,0.72],[0.50,0.85]],
  Virgo: [[0.50,0.10],[0.35,0.28],[0.65,0.25],[0.40,0.48],[0.60,0.45],[0.35,0.65],[0.55,0.68],[0.50,0.85]],
  Libra: [[0.50,0.15],[0.30,0.35],[0.70,0.35],[0.25,0.60],[0.75,0.60],[0.50,0.50]],
  Scorpio: [[0.20,0.30],[0.32,0.25],[0.44,0.32],[0.55,0.28],[0.65,0.35],[0.72,0.45],[0.78,0.55],[0.82,0.48],[0.85,0.40]],
  Sagittarius: [[0.50,0.15],[0.40,0.35],[0.60,0.30],[0.35,0.55],[0.65,0.50],[0.50,0.70],[0.70,0.65]],
  Capricorn: [[0.50,0.12],[0.35,0.30],[0.60,0.28],[0.30,0.52],[0.55,0.48],[0.40,0.72],[0.60,0.70]],
  Aquarius: [[0.30,0.20],[0.50,0.18],[0.70,0.22],[0.25,0.42],[0.50,0.40],[0.75,0.44],[0.35,0.65],[0.65,0.62]],
  Pisces: [[0.30,0.30],[0.35,0.45],[0.40,0.60],[0.45,0.50],[0.55,0.50],[0.60,0.40],[0.65,0.55],[0.70,0.30]],
};

// ── Config builder ──
export function buildPortraitConfig(data: BirthData): PortraitConfig | null {
  const sign = getSunSign(data.month, data.day);
  if (!sign) return null;

  const element = ELEMENTS[sign.name];
  const modality = MODALITIES[sign.name];
  const palette = PALETTES[element];
  const symmetry = modality === "Cardinal" ? 4 : modality === "Fixed" ? 6 : 12;

  // Seed from birth data
  const seed = data.month * 10000 + data.day * 100 + (data.year || 1990) % 100;
  const rng = seededRandom(seed);

  // Generate planet angles (deterministic from seed)
  const planetAngles = Array.from({ length: 10 }, () => rng() * 360);

  // Generate aspects between planets
  const aspects: Aspect[] = [];
  for (let i = 0; i < 10; i++) {
    for (let j = i + 1; j < 10; j++) {
      const diff = Math.abs(planetAngles[i] - planetAngles[j]);
      const angle = diff > 180 ? 360 - diff : diff;
      if (Math.abs(angle - 120) < 12) aspects.push({ from: i, to: j, type: "trine", strength: 1 - Math.abs(angle - 120) / 12 });
      else if (Math.abs(angle - 90) < 10) aspects.push({ from: i, to: j, type: "square", strength: 1 - Math.abs(angle - 90) / 10 });
      else if (Math.abs(angle - 60) < 8) aspects.push({ from: i, to: j, type: "sextile", strength: 1 - Math.abs(angle - 60) / 8 });
      else if (angle < 10) aspects.push({ from: i, to: j, type: "conjunction", strength: 1 - angle / 10 });
      else if (Math.abs(angle - 180) < 10) aspects.push({ from: i, to: j, type: "opposition", strength: 1 - Math.abs(angle - 180) / 10 });
    }
  }

  // Moon brightness from day of month (roughly maps to moon phase)
  const moonBrightness = 0.3 + Math.abs(((data.day % 30) / 30) * 2 - 1) * 0.7;

  return {
    signName: sign.name,
    signIndex: sign.index,
    element,
    modality,
    palette,
    symmetry,
    moonBrightness,
    seed,
    planetAngles,
    aspects,
  };
}

// ── Renderer ──
export class PortraitRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: PortraitConfig;
  private rng: () => number;
  private time = 0;
  private raf = 0;
  private particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; aspect: number }[] = [];
  private w = 0;
  private h = 0;
  private cx = 0;
  private cy = 0;

  constructor(canvas: HTMLCanvasElement, config: PortraitConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.config = config;
    this.rng = seededRandom(config.seed);
  }

  init() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cx = this.w / 2;
    this.cy = this.h / 2;

    // Init particles along aspect lines
    this.particles = [];
    for (let i = 0; i < 120; i++) {
      this.spawnParticle();
    }
  }

  private spawnParticle() {
    if (this.config.aspects.length === 0) return;
    const ai = Math.floor(this.rng() * this.config.aspects.length);
    const a = this.config.aspects[ai];
    const r = Math.min(this.w, this.h) * 0.32;
    const fromAngle = (this.config.planetAngles[a.from] - 90) * Math.PI / 180;
    const toAngle = (this.config.planetAngles[a.to] - 90) * Math.PI / 180;
    const t = this.rng();
    const fx = this.cx + Math.cos(fromAngle) * r;
    const fy = this.cy + Math.sin(fromAngle) * r;
    const tx = this.cx + Math.cos(toAngle) * r;
    const ty = this.cy + Math.sin(toAngle) * r;

    this.particles.push({
      x: fx + (tx - fx) * t,
      y: fy + (ty - fy) * t,
      vx: (tx - fx) * 0.002 + (this.rng() - 0.5) * 0.3,
      vy: (ty - fy) * 0.002 + (this.rng() - 0.5) * 0.3,
      life: 0,
      maxLife: 80 + this.rng() * 120,
      aspect: ai,
    });
  }

  start() {
    const loop = () => {
      this.time += 0.016;
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }

  private render() {
    const { ctx, w, h, cx, cy, config, time } = this;
    const { palette, symmetry, moonBrightness, planetAngles, aspects, signName } = config;
    const r = Math.min(w, h) * 0.32;

    // ── Background ──
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, w, h);

    // Ambient glow from center (moon brightness)
    const ambientR = Math.min(w, h) * 0.6;
    const ambGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, ambientR);
    ambGrd.addColorStop(0, palette.glow.replace(/[\d.]+\)$/, `${moonBrightness * 0.3})`));
    ambGrd.addColorStop(1, "transparent");
    ctx.fillStyle = ambGrd;
    ctx.fillRect(0, 0, w, h);

    // ── Sacred geometry rings ──
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = palette.dim;
    ctx.lineWidth = 0.5;

    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    // Symmetry lines
    for (let i = 0; i < symmetry; i++) {
      const angle = (i / symmetry) * Math.PI * 2 + time * 0.02;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * r * 0.35, Math.sin(angle) * r * 0.35);
      ctx.lineTo(Math.cos(angle) * r * 1.2, Math.sin(angle) * r * 1.2);
      ctx.stroke();
    }

    // Rotating dashed circle
    ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.75, time * 0.05, Math.PI * 2 + time * 0.05);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── Aspect lines (sacred geometry) ──
    ctx.save();
    for (const a of aspects) {
      const fromAngle = (planetAngles[a.from] - 90) * Math.PI / 180;
      const toAngle = (planetAngles[a.to] - 90) * Math.PI / 180;
      const fx = cx + Math.cos(fromAngle) * r;
      const fy = cy + Math.sin(fromAngle) * r;
      const tx = cx + Math.cos(toAngle) * r;
      const ty = cy + Math.sin(toAngle) * r;

      // Aspect type determines color
      let color: string;
      switch (a.type) {
        case "trine": color = palette.primary; break;
        case "sextile": color = palette.secondary; break;
        case "square": color = palette.accent; break;
        case "opposition": color = palette.accent; break;
        case "conjunction": color = palette.primary; break;
        default: color = palette.dim;
      }

      // Pulsing alpha
      const pulse = 0.15 + Math.sin(time * 0.8 + a.from * 0.5) * 0.08;

      ctx.beginPath();
      ctx.moveTo(fx, fy);

      // Curved aspect lines through center for trines/sextiles
      if (a.type === "trine" || a.type === "sextile") {
        const cpx = cx + (fx + tx - 2 * cx) * 0.2;
        const cpy = cy + (fy + ty - 2 * cy) * 0.2;
        ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      } else {
        ctx.lineTo(tx, ty);
      }

      ctx.strokeStyle = color;
      ctx.globalAlpha = pulse * a.strength;
      ctx.lineWidth = a.type === "trine" ? 1.5 : 0.8;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Constellation skeleton at center ──
    const stars = CONSTELLATIONS[signName] || CONSTELLATIONS.Aries;
    const constellR = r * 0.45;
    ctx.save();
    ctx.globalAlpha = 0.25 + Math.sin(time * 0.3) * 0.05;
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < stars.length - 1; i++) {
      const [x1, y1] = stars[i];
      const [x2, y2] = stars[i + 1];
      ctx.beginPath();
      ctx.moveTo(cx + (x1 - 0.5) * constellR * 2, cy + (y1 - 0.5) * constellR * 2);
      ctx.lineTo(cx + (x2 - 0.5) * constellR * 2, cy + (y2 - 0.5) * constellR * 2);
      ctx.stroke();
    }
    // Star nodes
    for (const [sx, sy] of stars) {
      const px = cx + (sx - 0.5) * constellR * 2;
      const py = cy + (sy - 0.5) * constellR * 2;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = palette.primary;
      ctx.globalAlpha = 0.4 + Math.sin(time * 1.5 + sx * 10) * 0.15;
      ctx.fill();
      // Glow
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = palette.glow;
      ctx.globalAlpha = 0.2;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Planet orbs ──
    ctx.save();
    const PLANET_GLYPHS = ["☉", "☽", "☿", "♀", "♂", "♃", "♄", "♅", "♆", "♇"];
    for (let i = 0; i < planetAngles.length; i++) {
      const angle = (planetAngles[i] - 90) * Math.PI / 180;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;

      // Orbit position slowly drifts
      const drift = Math.sin(time * 0.2 + i * 0.7) * 3;
      const dpx = px + Math.cos(angle + Math.PI / 2) * drift;
      const dpy = py + Math.sin(angle + Math.PI / 2) * drift;

      // Glow halo
      const grd = ctx.createRadialGradient(dpx, dpy, 0, dpx, dpy, 18);
      grd.addColorStop(0, i === 0 ? "rgba(255,215,0,0.25)" : palette.glow);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(dpx, dpy, 18, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.beginPath();
      ctx.arc(dpx, dpy, i === 0 ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : palette.primary;
      ctx.fill();

      // Glyph
      ctx.fillStyle = "rgba(240,236,255,0.5)";
      ctx.font = "9px serif";
      ctx.textAlign = "center";
      ctx.fillText(PLANET_GLYPHS[i], dpx, dpy - 10);
    }
    ctx.restore();

    // ── Particles flowing along aspect lines ──
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;

      const lifeRatio = p.life / p.maxLife;
      let alpha: number;
      if (lifeRatio < 0.1) alpha = lifeRatio / 0.1;
      else if (lifeRatio > 0.8) alpha = (1 - lifeRatio) / 0.2;
      else alpha = 1;
      alpha *= 0.35;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        this.spawnParticle();
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = palette.particle;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // ── Outer star dust (ambient) ──
    ctx.save();
    const rng2 = seededRandom(config.seed + 999);
    for (let i = 0; i < 80; i++) {
      const angle = rng2() * Math.PI * 2;
      const dist = r * 1.1 + rng2() * r * 0.5;
      const twinkle = 0.1 + Math.sin(time * (0.5 + rng2() * 2) + i) * 0.08;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.8 + rng2(), 0, Math.PI * 2);
      ctx.fillStyle = palette.particle;
      ctx.globalAlpha = twinkle;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /** Export current frame as data URL */
  toDataURL(): string {
    return this.canvas.toDataURL("image/png");
  }
}
