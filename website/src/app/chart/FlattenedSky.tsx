/**
 * FlattenedSky — THE FLATTENED SKY: the chart wheel revealed as the
 * actual birth sky, folded flat.
 *
 * One canvas, two states, one fold control. STATE A — THE SKY: a
 * zenith-centered stereographic dome of the true sky over the
 * birthplace at the birth minute (catalog stars, the Moon at her true
 * phase, the classical seven as gilt points, the ecliptic as a faint
 * arc, the Ascendant marked where it meets the eastern rim). STATE B —
 * THE PLATE: the flat wheel of houses. The fold control drives t∈[0,1];
 * planets glide between their two positions, stars sink to the wheel's
 * outer ring and fade, the wheel's rings draw themselves in. The sky
 * BECOMES the diagram — then hands over to the untouched SVG wheel.
 *
 * Render-on-demand canvas 2D: redraws only while folding, scrubbing,
 * resizing, or on selection. No idle rAF.
 */

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STARS, project, eclipticToEquatorial } from "@/lib/star-chart";
import { moonPathD } from "@/components/sky/TrueMoon";
import type { NatalChart } from "@/lib/natal-chart";

/* ── Palette (The Arrival) ─────────────────────────────────────── */
const ABYSS = "#0a0d38";
const NIGHT = "#10134d";
const MOONSTONE = "#e8e9ff";
const MIST = "#b7bce9";
const GILT = "#e0b768";
const UNDER_EARTH = "#060827";

const RAD = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

/* ── LST exactly as natal-chart.ts computes RAMC ───────────────── */
function daysSinceJ2000(utc: Date): number {
  return (utc.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
}

function computeRAMC(utc: Date, longitudeDeg: number): number {
  const dWhole = daysSinceJ2000(
    new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), 0, 0, 0)),
  );
  const T = dWhole / 36525.0;
  const GMST0 = norm360(100.46061837 + 36000.770053608 * T + 0.000387933 * T * T);
  const utHours = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  const GMST = GMST0 + 360.98564724 * (utHours / 24);
  return norm360(GMST + longitudeDeg);
}

/** Azimuth from north through east, degrees — same triangle as project(). */
function azimuthDeg(raH: number, decDeg: number, lstH: number, latDeg: number): number {
  const H = (lstH - raH) * 15 * RAD;
  const dec = decDeg * RAD;
  const lat = latDeg * RAD;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAlt = Math.cos(alt);
  if (cosAlt < 1e-9) return 0;
  const sinA = (-Math.cos(dec) * Math.sin(H)) / cosAlt;
  const cosA = (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * cosAlt);
  return norm360(Math.atan2(sinA, cosA) / RAD);
}

/* ── The master ease — "engrave", cubic-bezier(0.625, 0.05, 0, 1) ── */
function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const sampleDX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let u = x;
    for (let i = 0; i < 6; i++) {
      const d = sampleDX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= (sampleX(u) - x) / d;
    }
    u = Math.max(0, Math.min(1, u));
    return sampleY(u);
  };
}
const engrave = cubicBezier(0.625, 0.05, 0, 1);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const DIR_WORDS = [
  "NORTHERN", "NORTHEASTERN", "EASTERN", "SOUTHEASTERN",
  "SOUTHERN", "SOUTHWESTERN", "WESTERN", "NORTHWESTERN",
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Classical seven: indices 0–6 of chart.planets (Sun..Saturn). */
const SEVEN = 7;

interface PlanetGeo {
  name: string;
  glyph: string;
  longitude: number;
  x: number; // unit-disc dome coords
  y: number;
  alt: number;
  az: number;
}

interface Props {
  chart: NatalChart;
  selected: number | null;
  onSelect: (i: number | null) => void;
  /** "raise" starts folded (t=1) and unfolds on mount. */
  entry?: "sky" | "raise";
  /** Called when the fold lands on the plate — parent shows the real wheel. */
  onFoldedToPlate: () => void;
}

export default function FlattenedSky({ chart, selected, onSelect, entry = "sky", onFoldedToPlate }: Props) {
  const hasAsc = !!chart.ascendant;
  const timeKnown = chart.timeKnown !== false;

  /* ── Static geometry for this chart ── */
  const geo = useMemo(() => {
    const inp = chart.input;
    const utc = new Date(
      Date.UTC(inp.year, inp.month - 1, inp.day, inp.hour, inp.minute) - inp.timezone * 3600e3,
    );
    const lstH = computeRAMC(utc, inp.longitude) / 15;
    const lat = inp.latitude;

    const stars = STARS.map((s) => {
      const p = project(s.ra, s.dec, lstH, lat);
      return { x: p.x, y: p.y, alt: p.alt, mag: s.mag };
    });

    const planets: PlanetGeo[] = chart.planets.slice(0, SEVEN).map((p) => {
      const eq = eclipticToEquatorial(p.longitude);
      const sp = project(eq.ra, eq.dec, lstH, lat);
      return {
        name: p.name,
        glyph: p.glyph,
        longitude: p.longitude,
        x: sp.x,
        y: sp.y,
        alt: sp.alt,
        az: azimuthDeg(eq.ra, eq.dec, lstH, lat),
      };
    });

    // The ecliptic as a sampled arc through the dome.
    const ecliptic: { x: number; y: number; alt: number }[] = [];
    for (let lon = 0; lon <= 360; lon += 2) {
      const eq = eclipticToEquatorial(lon);
      const p = project(eq.ra, eq.dec, lstH, lat);
      ecliptic.push({ x: p.x, y: p.y, alt: p.alt });
    }

    // The Ascendant on the eastern rim.
    let asc: { x: number; y: number } | null = null;
    if (chart.ascendant) {
      const eq = eclipticToEquatorial(chart.ascendant.longitude);
      const p = project(eq.ra, eq.dec, lstH, lat);
      asc = { x: p.x, y: p.y };
    }

    const sunLon = chart.planets[0].longitude;
    const moonLon = chart.planets[1].longitude;
    const phaseDeg = norm360(moonLon - sunLon);

    // Aspects among the classical seven only.
    const sevenNames = new Set(planets.map((p) => p.name));
    const aspects = chart.aspects
      .filter((a) => sevenNames.has(a.planet1) && sevenNames.has(a.planet2))
      .slice(0, 12)
      .map((a) => ({
        i1: planets.findIndex((p) => p.name === a.planet1),
        i2: planets.findIndex((p) => p.name === a.planet2),
        tense: a.harmony === "tense",
        orb: a.orb,
      }));

    return { planets, stars, ecliptic, asc, phaseDeg, aspects, sunUp: planets[0].alt > 0 };
  }, [chart]);

  /* ── Fold state ── */
  const [t, setT] = useState(entry === "raise" ? 1 : 0);
  const tRef = useRef(t);
  tRef.current = t;
  const animRef = useRef<number | null>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const stopAnim = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const animateTo = useCallback(
    (target: number, done?: () => void) => {
      stopAnim();
      if (reducedRef.current) {
        setT(target);
        done?.();
        return;
      }
      const from = tRef.current;
      if (Math.abs(target - from) < 0.001) {
        setT(target);
        done?.();
        return;
      }
      const dur = 1400 * Math.abs(target - from);
      const t0 = performance.now();
      const step = (now: number) => {
        const u = clamp01((now - t0) / dur);
        setT(from + (target - from) * engrave(u));
        if (u < 1) {
          animRef.current = requestAnimationFrame(step);
        } else {
          animRef.current = null;
          done?.();
        }
      };
      animRef.current = requestAnimationFrame(step);
    },
    [stopAnim],
  );

  useEffect(() => stopAnim, [stopAnim]);

  // Entering by "raise the sky": unfold from the plate.
  useEffect(() => {
    if (entry === "raise") {
      if (reducedRef.current) setT(0);
      else animateTo(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  const foldToPlate = useCallback(() => {
    animateTo(1, onFoldedToPlate);
  }, [animateTo, onFoldedToPlate]);

  /* ── Canvas ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  // Current on-screen planet positions (CSS px) for hit-testing.
  const hitRef = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      if (w > 0) setSize(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* The one draw. Called only on t / selection / size / chart change. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.4; // dome horizon radius (unit r = 1)
    const sw = size / 500; // wheel-coordinate scale (SVG viewBox 500)
    const skyA = 1 - t; // the sky's overall presence
    const wheelP = engrave(clamp01((t - 0.18) / 0.82)); // rings draw-in

    // Dome→screen; radial clamp keeps deep under-earth points on the plate.
    const domeXY = (p: { x: number; y: number }) => {
      const r = Math.hypot(p.x, p.y);
      const k = r > 1.42 ? 1.42 / r : 1;
      return { x: cx + p.x * k * R, y: cy + p.y * k * R };
    };
    const wheelXY = (lonDeg: number, radius: number) => {
      const a = (lonDeg - 90) * RAD;
      return { x: cx + radius * sw * Math.cos(a), y: cy + radius * sw * Math.sin(a) };
    };

    /* ── The fields: sky above, earth beneath ── */
    if (skyA > 0.004) {
      // Under the earth — the darker ground outside the horizon ring.
      ctx.globalAlpha = skyA;
      ctx.fillStyle = UNDER_EARTH;
      ctx.fillRect(0, 0, size, size);
      // The dome itself, faintly lifting toward the zenith.
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, NIGHT);
      g.addColorStop(1, ABYSS);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // Horizon rim.
      ctx.strokeStyle = "rgba(232,233,255,0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      // Cardinal marks — east LEFT: a planisphere, read lying on one's back.
      ctx.fillStyle = "rgba(183,188,233,0.55)";
      ctx.font = `${Math.max(8, 9 * (size / 440))}px var(--font-mono, ui-monospace), monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const co = 11 * (size / 440);
      ctx.fillText("N", cx, cy - R - co);
      ctx.fillText("S", cx, cy + R + co);
      ctx.fillText("E", cx - R - co, cy);
      ctx.fillText("W", cx + R + co, cy);
      ctx.globalAlpha = 1;
    }

    /* ── Stars: ivory points sized by magnitude; sink + fade as t→1 ── */
    const starFade = Math.pow(skyA, 1.6);
    if (starFade > 0.004) {
      ctx.fillStyle = MOONSTONE;
      for (const s of geo.stars) {
        if (s.alt <= 0) continue; // below the horizon — under the earth
        const d = domeXY(s);
        // Sink toward the wheel's outer ring along its own bearing.
        const dx = d.x - cx;
        const dy = d.y - cy;
        const rr = Math.hypot(dx, dy) || 1;
        const tx = cx + (dx / rr) * 219 * sw;
        const ty = cy + (dy / rr) * 219 * sw;
        const et = engrave(t);
        const x = lerp(d.x, tx, et);
        const y = lerp(d.y, ty, et);
        const rad = Math.max(0.7, (2.5 - s.mag * 0.42) * (size / 440));
        ctx.globalAlpha = starFade * Math.max(0.28, Math.min(0.95, 1.02 - s.mag * 0.17));
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* ── The ecliptic — a faint arc through the dome ── */
    if (skyA > 0.004) {
      ctx.globalAlpha = skyA * 0.4;
      ctx.strokeStyle = MIST;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      let pen = false;
      for (const p of geo.ecliptic) {
        if (Math.hypot(p.x, p.y) > 1.01) {
          pen = false;
          continue;
        }
        const d = domeXY(p);
        if (pen) ctx.lineTo(d.x, d.y);
        else ctx.moveTo(d.x, d.y);
        pen = true;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    /* ── The Ascendant, marked where the ecliptic meets the eastern rim ── */
    if (geo.asc && skyA > 0.004) {
      const a = domeXY(geo.asc);
      ctx.globalAlpha = skyA;
      ctx.strokeStyle = GILT;
      ctx.lineWidth = 1;
      // A tick crossing the rim.
      const ur = Math.hypot(geo.asc.x, geo.asc.y) || 1;
      const nx = geo.asc.x / ur;
      const ny = geo.asc.y / ur;
      const tick = 7 * (size / 440);
      ctx.beginPath();
      ctx.moveTo(a.x - nx * tick, a.y - ny * tick);
      ctx.lineTo(a.x + nx * tick, a.y + ny * tick);
      ctx.stroke();
      ctx.fillStyle = GILT;
      ctx.beginPath();
      ctx.arc(a.x, a.y, 2.4 * (size / 440), 0, Math.PI * 2);
      ctx.fill();
      // Mono caption, set inward from the eastern rim.
      const fs = Math.max(8, 8.6 * (size / 440));
      ctx.font = `${fs}px var(--font-mono, ui-monospace), monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const txx = a.x + 12 * (size / 440);
      ctx.fillText("THE RISING POINT", txx, a.y - fs * 0.7);
      ctx.fillStyle = "rgba(183,188,233,0.75)";
      ctx.fillText("WHY IT IS CALLED RISING", txx, a.y + fs * 0.7);
      ctx.globalAlpha = 1;
    }

    /* ── The wheel drawing itself in as the sky folds ── */
    if (wheelP > 0.004) {
      const ink = "rgba(232,233,255,";
      const arc = (r: number, width: number, alpha: number) => {
        ctx.strokeStyle = `${ink}${alpha})`;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.arc(cx, cy, r * sw, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * wheelP);
        ctx.stroke();
      };
      arc(244, 1, 0.9);
      arc(238, 0.5, 0.45);
      arc(200, 0.6, 0.55);
      arc(180, 0.6, 0.33);
      // Sign dividers + glyphs, appearing with the sweep.
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const SIGN_GLYPHS = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];
      for (let i = 0; i < 12; i++) {
        const show = wheelP > (i + 0.5) / 12.5;
        if (!show) continue;
        const a1 = wheelXY(i * 30, 200);
        const a2 = wheelXY(i * 30, 238);
        ctx.strokeStyle = `${ink}${0.5 * wheelP})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y);
        ctx.lineTo(a2.x, a2.y);
        ctx.stroke();
        const g = wheelXY(i * 30 + 15, 219);
        ctx.fillStyle = `${ink}${0.7 * wheelP})`;
        ctx.font = `${16 * sw}px serif`;
        ctx.fillText(SIGN_GLYPHS[i], g.x, g.y);
      }
      // Center seal.
      ctx.globalAlpha = wheelP;
      ctx.fillStyle = NIGHT;
      ctx.strokeStyle = `${ink}0.9)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 20 * sw, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = GILT;
      ctx.font = `${13 * sw}px serif`;
      ctx.fillText("✦", cx, cy + 1 * sw);
      ctx.globalAlpha = 1;
    }

    /* ── Aspect threads — gilt hairlines with a slight sag ── */
    const planetScreen: { x: number; y: number }[] = [];
    const pt = (i: number) => {
      // Per-planet staggered fold — markers ripple, they don't march.
      return engrave(clamp01(t * 1.22 - i * 0.036));
    };
    for (let i = 0; i < geo.planets.length; i++) {
      const p = geo.planets[i];
      const d = domeXY(p);
      const w = wheelXY(p.longitude, 140);
      const e = pt(i);
      planetScreen.push({ x: lerp(d.x, w.x, e), y: lerp(d.y, w.y, e) });
    }
    hitRef.current = planetScreen;
    // Hit positions in CSS px, exposed for tests/tooling; no visual effect.
    canvas.dataset.planets = planetScreen
      .map((p) => `${Math.round(p.x)},${Math.round(p.y)}`)
      .join(";");

    const selName = selected !== null && selected < SEVEN ? geo.planets[selected]?.name : null;
    for (const a of geo.aspects) {
      const p1 = planetScreen[a.i1];
      const p2 = planetScreen[a.i2];
      if (!p1 || !p2) continue;
      const below = geo.planets[a.i1].alt < 0 || geo.planets[a.i2].alt < 0;
      const involves =
        selName !== null &&
        (geo.planets[a.i1].name === selName || geo.planets[a.i2].name === selName);
      let alpha = selName ? (involves ? 0.75 : 0.06) : 0.3;
      if (below) alpha *= 0.55;
      // Threads belong to the sky reading; the plate has its own web.
      alpha *= Math.pow(skyA, 0.8);
      if (alpha < 0.01) continue;
      // Slight quadratic sag toward the plate's center — hung threads.
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const sag = 0.09;
      const qx = mx + (cx - mx) * sag;
      const qy = my + (cy - my) * sag;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = GILT;
      ctx.lineWidth = involves ? 1.1 : 0.7;
      if (a.tense) ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(qx, qy, p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    /* ── The classical seven ── */
    for (let i = 0; i < geo.planets.length; i++) {
      const p = geo.planets[i];
      const pos = planetScreen[i];
      const e = pt(i);
      const isSel = selected === i;
      const below = p.alt < 0;
      const domeAlpha = (1 - e) * (below ? 0.42 : 1);
      const wheelAlpha = e;

      // STATE A marker — a gilt-lit point (the Moon gets her true face).
      if (domeAlpha > 0.01) {
        ctx.globalAlpha = domeAlpha;
        if (p.name === "Moon") {
          const mr = 8.5 * (size / 440);
          ctx.fillStyle = "rgba(232,233,255,0.1)";
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, mr, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(232,233,255,0.28)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, mr, 0, Math.PI * 2);
          ctx.stroke();
          const ph = norm360(geo.phaseDeg);
          if (ph >= 178 && ph <= 182) {
            ctx.fillStyle = MOONSTONE;
            ctx.globalAlpha = domeAlpha * 0.92;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, mr, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const d = moonPathD(ph, mr, pos.x, pos.y);
            if (d) {
              ctx.fillStyle = MOONSTONE;
              ctx.globalAlpha = domeAlpha * 0.92;
              ctx.fill(new Path2D(d));
            }
          }
          ctx.globalAlpha = domeAlpha;
        } else {
          ctx.fillStyle = GILT;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, (p.name === "Sun" ? 4.4 : 3) * (size / 440), 0, Math.PI * 2);
          ctx.fill();
          if (p.name === "Sun") {
            ctx.strokeStyle = "rgba(224,183,104,0.5)";
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 7.5 * (size / 440), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        // Glyph beside the point, engraved small.
        ctx.fillStyle = below ? "rgba(183,188,233,0.8)" : MOONSTONE;
        ctx.font = `${Math.max(10, 11 * (size / 440))}px serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, pos.x + 9 * (size / 440), pos.y - 8 * (size / 440));
        ctx.globalAlpha = 1;
      }

      // STATE B marker — the wheel node, exactly as the plate prints it.
      if (wheelAlpha > 0.01) {
        ctx.globalAlpha = wheelAlpha;
        // Spoke.
        ctx.strokeStyle = isSel ? GILT : `rgba(232,233,255,${isSel ? 0.55 : 0.12})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.fillStyle = NIGHT;
        ctx.strokeStyle = isSel ? GILT : "rgba(232,233,255,0.9)";
        ctx.lineWidth = isSel ? 1.6 : 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, (isSel ? 15 : 10) * sw, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isSel ? GILT : MOONSTONE;
        ctx.font = `${(isSel ? 13 : 10) * sw}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.glyph, pos.x, pos.y + 1 * sw);
        ctx.globalAlpha = 1;
      }

      // Selection halo in the sky state.
      if (isSel && domeAlpha > 0.01) {
        ctx.globalAlpha = domeAlpha * 0.9;
        ctx.strokeStyle = GILT;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 13 * (size / 440), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  }, [t, selected, size, geo]);

  /* ── Tap a planet in either state → the page's own panel ── */
  const onCanvasPointer = useCallback(
    (ev: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = ev.currentTarget.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      let best = -1;
      let bestD = 22 * (rect.width / 440) + 6;
      hitRef.current.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best >= 0) onSelect(selected === best ? null : best);
    },
    [onSelect, selected],
  );

  /* ── The fold control: one rail, dragged or thrown ── */
  const railRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const scrubTo = useCallback((clientX: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    setT(clamp01((clientX - r.left) / r.width));
  }, []);

  const onRailDown = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      stopAnim();
      draggingRef.current = true;
      ev.currentTarget.setPointerCapture(ev.pointerId);
      scrubTo(ev.clientX);
    },
    [scrubTo, stopAnim],
  );

  const onRailMove = useCallback(
    (ev: React.PointerEvent<HTMLDivElement>) => {
      if (draggingRef.current) scrubTo(ev.clientX);
    },
    [scrubTo],
  );

  const onRailUp = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const v = tRef.current;
    if (v > 0.92) animateTo(1, onFoldedToPlate);
    else if (v < 0.08) animateTo(0);
  }, [animateTo, onFoldedToPlate]);

  const folded = t >= 0.5;

  /* ── Captions ── */
  const inp = chart.input;
  const latHemi = inp.latitude >= 0 ? "N" : "S";
  const lonHemi = inp.longitude >= 0 ? "E" : "W";
  const placeLine = [
    inp.city ? inp.city.toUpperCase() : "THE BIRTHPLACE",
    `${Math.abs(inp.latitude).toFixed(2)}°${latHemi} ${Math.abs(inp.longitude).toFixed(2)}°${lonHemi}`,
    `${String(inp.day).padStart(2, "0")} ${MONTHS[inp.month - 1]} ${inp.year}`,
    timeKnown
      ? `${String(inp.hour).padStart(2, "0")}:${String(inp.minute).padStart(2, "0")} LOCAL`
      : "NOON ASSUMED — BIRTH HOUR UNKNOWN",
  ].join(" · ");

  const selGeo = selected !== null && selected < SEVEN ? geo.planets[selected] : null;
  let selLine: string | null = null;
  if (selGeo) {
    const altAbs = Math.round(Math.abs(selGeo.alt));
    if (selGeo.alt >= 0) {
      const dir = DIR_WORDS[Math.round(selGeo.az / 45) % 8];
      const motion = selGeo.az > 5 && selGeo.az < 175 ? ", RISING" : selGeo.az > 185 && selGeo.az < 355 ? ", SETTING" : ", ON THE MERIDIAN";
      selLine = `${selGeo.name.toUpperCase()} — ${altAbs}° ABOVE THE ${dir} HORIZON${motion}`;
    } else {
      selLine = `${selGeo.name.toUpperCase()} — ${altAbs}° BELOW THE HORIZON · UNDER THE EARTH`;
    }
  }

  return (
    <figure className="fs alm-card">
      {/* THE FOLD — one control, both directions */}
      <div className="fs-fold">
        <span className={`fs-pole ${!folded ? "on" : ""}`}>THE SKY</span>
        <div
          ref={railRef}
          className="fs-rail"
          role="slider"
          aria-label="Fold the sky into the plate"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(t * 100)}
          tabIndex={0}
          onPointerDown={onRailDown}
          onPointerMove={onRailMove}
          onPointerUp={onRailUp}
          onPointerCancel={onRailUp}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") animateTo(Math.min(1, tRef.current + 0.1));
            else if (e.key === "ArrowLeft") animateTo(Math.max(0, tRef.current - 0.1));
            else if (e.key === "Enter") (folded ? animateTo(0) : foldToPlate());
          }}
        >
          <div className="fs-rail-line" aria-hidden />
          <div className="fs-rail-fill" style={{ width: `${t * 100}%` }} aria-hidden />
          <div className="fs-thumb" style={{ left: `${t * 100}%` }} aria-hidden>✦</div>
        </div>
        <span className={`fs-pole ${folded ? "on" : ""}`}>THE PLATE</span>
        <button
          type="button"
          className="fs-foldbtn"
          onClick={() => (folded ? animateTo(0) : foldToPlate())}
        >
          {folded ? "✦ RAISE THE SKY" : "FOLD THE SKY ✦"}
        </button>
      </div>

      <div ref={wrapRef} className="fs-wrap">
        <canvas
          ref={canvasRef}
          className="fs-canvas"
          style={{ width: size || undefined, height: size || undefined }}
          onPointerDown={onCanvasPointer}
          role="img"
          aria-label={`The sky over ${inp.city || "the birthplace"} at the birth minute, folding into the chart wheel`}
        />
      </div>

      <figcaption className="fs-cap">
        <span className="fs-meta">{placeLine}</span>
        {!timeKnown && (
          <span className="fs-note">THE RISING POINT LEFT UNMARKED — IT NEEDS THE HOUR</span>
        )}
        {timeKnown && geo.sunUp && (
          <span className="fs-note">DAY BIRTH — THE STARS STOOD THERE STILL, HIDDEN IN THE BLUE</span>
        )}
        {selLine && <span className="fs-sel">{selLine}</span>}
        <span className="alm-caption fs-fig">
          Fig. 2 — the sky that night, folded flat. Tap a light to read it.
        </span>
      </figcaption>

      <style jsx>{`
        .fs {
          margin: 0;
          width: min(90vw, 480px);
          color: var(--ink);
        }

        .fs-wrap {
          width: 100%;
        }

        .fs-canvas {
          display: block;
          width: 100%;
          cursor: pointer;
          touch-action: pan-y;
        }

        /* ── The fold control ── */
        .fs-fold {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 0.9rem;
        }

        .fs-pole {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.54rem;
          letter-spacing: 0.22em;
          color: var(--ink-faint);
          transition: color 300ms var(--ease);
          white-space: nowrap;
        }

        .fs-pole.on {
          color: var(--ox);
        }

        .fs-rail {
          position: relative;
          flex: 1;
          height: 22px;
          cursor: ew-resize;
          touch-action: none;
        }

        .fs-rail:focus-visible {
          outline: 1px solid var(--ox);
          outline-offset: 3px;
        }

        .fs-rail-line {
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 1px;
          background: var(--hairline);
        }

        .fs-rail-fill {
          position: absolute;
          left: 0;
          top: 50%;
          height: 1px;
          background: rgba(224, 183, 104, 0.6);
        }

        .fs-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          color: var(--ox);
          font-size: 0.8rem;
          line-height: 1;
          pointer-events: none;
        }

        .fs-foldbtn {
          background: none;
          border: 1px solid var(--hairline);
          padding: 0.34rem 0.7rem;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.54rem;
          letter-spacing: 0.18em;
          color: var(--ink-soft);
          white-space: nowrap;
          transition: color 250ms var(--ease), border-color 250ms var(--ease);
        }

        .fs-foldbtn:hover {
          color: var(--ox);
          border-color: rgba(224, 183, 104, 0.45);
        }

        /* ── Captions ── */
        .fs-cap {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          margin-top: 0.9rem;
          text-align: center;
        }

        .fs-meta {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.16em;
          color: var(--ink-faint);
        }

        .fs-note {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.54rem;
          letter-spacing: 0.16em;
          color: var(--ink-faint);
          opacity: 0.8;
        }

        .fs-sel {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.16em;
          color: var(--ox);
        }

        .fs-fig {
          margin-top: 0.25rem;
        }

        @media (max-width: 560px) {
          .fs-fold {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .fs-foldbtn {
            order: 4;
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .fs-pole,
          .fs-foldbtn {
            transition: none;
          }
        }
      `}</style>
    </figure>
  );
}
