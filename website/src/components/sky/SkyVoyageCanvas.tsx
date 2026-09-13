"use client";

/**
 * SkyVoyageCanvas — CARTA COELI's persistent firmament.
 *
 * One fixed, pointer-transparent canvas behind the whole site. The
 * camera rests at the current page's berth (voyage.ts PORTS), flies
 * great circles between berths on "oa-sky-fly" / route changes, and
 * dispatches "oa-sky-arrive" when it settles. Stereographic projection,
 * moonstone stars, hairline figures, one gilt constellation.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { STARS, CONSTELLATIONS } from "@/lib/star-chart";
import { PORTS, FLIGHT_MS, type SkyPort } from "./voyage";

/* ── palette (The Arrival) ─────────────────────────────────── */
const MOONSTONE = "232,233,255"; // #e8e9ff
const GILT = "224,183,104"; //      #e0b768
const HAIRLINE = "rgba(183,188,233,0.16)";

const REST_FOV = 55; // vertical, degrees
const SWELL_FOV = 68; // mid-flight breath
const DRIFT_H_PER_MS = 0.02 / 60000; // sidereal breath: +0.02h/min
const LANTERN_R = 110; // px
const IDLE_FPS_MS = 1000 / 30;

const RAD = Math.PI / 180;

/* ── the house ease, cubic-bezier(0.16, 1, 0.3, 1) ─────────── */
function makeBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleY = (u: number) => ((ay * u + by) * u + cy) * u;
  const sampleDX = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = sampleX(u) - t;
      const d = sampleDX(u);
      if (Math.abs(x) < 1e-6) return sampleY(u);
      if (Math.abs(d) < 1e-6) break;
      u -= x / d;
    }
    let lo = 0;
    let hi = 1;
    u = t;
    while (hi - lo > 1e-6) {
      if (sampleX(u) < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return sampleY(u);
  };
}
const houseEase = makeBezier(0.16, 1, 0.3, 1);

/* ── sphere math ───────────────────────────────────────────── */
type Vec3 = [number, number, number];

function vecOf(raH: number, decDeg: number): Vec3 {
  const a = raH * 15 * RAD;
  const d = decDeg * RAD;
  const c = Math.cos(d);
  return [c * Math.cos(a), c * Math.sin(a), Math.sin(d)];
}

function raDecOf(v: Vec3): { ra: number; dec: number } {
  const ra = ((Math.atan2(v[1], v[0]) / RAD / 15) % 24 + 24) % 24;
  const dec = Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD;
  return { ra, dec };
}

function slerp(a: Vec3, b: Vec3, t: number, omega: number, sinOmega: number): Vec3 {
  if (sinOmega < 1e-6) return [...a] as Vec3;
  const wa = Math.sin((1 - t) * omega) / sinOmega;
  const wb = Math.sin(t * omega) / sinOmega;
  return [
    wa * a[0] + wb * b[0],
    wa * a[1] + wb * b[1],
    wa * a[2] + wb * b[2],
  ];
}

/** Resolve a pathname to its berth key ("/signs/leo" → "/signs"). */
function portKeyFor(pathname: string): string | null {
  if (PORTS[pathname]) return pathname;
  const root = "/" + (pathname.split("/")[1] ?? "");
  return PORTS[root] ? root : null;
}

/* ── per-star twinkle: coprime periods, tiny amplitudes ────── */
const N = STARS.length;
const starVec = new Float64Array(N * 3);
const twPeriod = new Float64Array(N); // ms
const twPhase = new Float64Array(N);
const twAmp = new Float64Array(N);
const baseR = new Float64Array(N);
const baseA = new Float64Array(N);
for (let i = 0; i < N; i++) {
  const v = vecOf(STARS[i].ra, STARS[i].dec);
  starVec[i * 3] = v[0];
  starVec[i * 3 + 1] = v[1];
  starVec[i * 3 + 2] = v[2];
  twPeriod[i] = 1900 + ((i * 97) % 53) * 57 + ((i * 41) % 29) * 13;
  twPhase[i] = ((i * 61) % 47) / 47 * Math.PI * 2;
  twAmp[i] = 0.03 + ((i * 31) % 5) * 0.005; // 3–5%
  const mag = STARS[i].mag;
  baseR[i] = mag <= 1 ? Math.min(2, 1.6 + (1 - mag) * 0.15) : Math.max(0.5, 1.6 - (mag - 1) * (1.1 / 2.9));
  baseA[i] = Math.max(0.35, Math.min(1, 0.95 - mag * 0.13));
}

const CONST_BY_NAME = new Map(CONSTELLATIONS.map((c) => [c.name, c]));

type Flight = {
  from: Vec3;
  to: Vec3;
  omega: number;
  sinOmega: number;
  start: number;
  path: string; // as passed to the fly event / route
  key: string; //  resolved berth key
  port: SkyPort;
  sameFigure: boolean; // berths share one constellation — keep it lit
};

export default function SkyVoyageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const routeRef = useRef<((path: string) => void) | null>(null);
  const pathname = usePathname();

  /* Route changes without a fly event (back button, hard links). */
  useEffect(() => {
    routeRef.current?.(pathname);
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* ── state ── */
    const initialKey = portKeyFor(window.location.pathname) ?? "/";
    const initialPort = PORTS[initialKey];
    const cam = { ra: initialPort.ra, dec: initialPort.dec };
    let fov = REST_FOV;
    let flight: Flight | null = null;
    let activeKey: string = initialKey; //   berth whose figure is gilt
    let activePort: SkyPort = initialPort;
    let giltProgress = 1; //                 draw-on of the active figure
    let giltTailStart = 0; //                post-landing tail of the draw-on
    let giltTailFrom = 1;
    let fadeConst: string | null = null; //  previous figure, fading
    let fadeAlpha = 0;
    let pointer: { x: number; y: number } | null = null;
    let needsRedraw = true;
    let lastDraw = 0;
    let lastTs = 0;
    let raf = 0;
    let running = false;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let lastUp: Vec3 = [0, 0, 1];

    const rmQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rm = rmQuery.matches;

    const monoVar = getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mono")
      .trim();
    const monoFont = monoVar || '"IBM Plex Mono", ui-monospace, monospace';

    /* projected scratch buffers */
    const px = new Float64Array(N);
    const py = new Float64Array(N);
    const pw = new Float64Array(N);

    /* ── sizing ── */
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      needsRedraw = true;
    }

    /* ── projection of the whole catalog for the current camera ── */
    function projectAll() {
      const f = vecOf(cam.ra, cam.dec);
      // up: celestial north, made orthogonal to the view axis
      let ux = -f[2] * f[0];
      let uy = -f[2] * f[1];
      let uz = 1 - f[2] * f[2];
      const ul = Math.hypot(ux, uy, uz);
      if (ul > 1e-6) {
        ux /= ul;
        uy /= ul;
        uz /= ul;
        lastUp = [ux, uy, uz];
      } else {
        [ux, uy, uz] = lastUp; // camera staring at the pole
      }
      // east = north-pole × forward (east drawn LEFT, chart convention)
      let ex = -f[1];
      let ey = f[0];
      let ez = 0;
      const el = Math.hypot(ex, ey, ez);
      if (el > 1e-6) {
        ex /= el;
        ey /= el;
      } else {
        // at the pole east is degenerate; any horizontal axis serves
        ex = uy * f[2] - uz * f[1];
        ey = uz * f[0] - ux * f[2];
        ez = ux * f[1] - uy * f[0];
      }
      const cx = w / 2;
      const cy = h / 2;
      const scale = h / 2 / (2 * Math.tan((fov / 2) * RAD * 0.5));
      for (let i = 0; i < N; i++) {
        const sx = starVec[i * 3];
        const sy = starVec[i * 3 + 1];
        const sz = starVec[i * 3 + 2];
        const dw = sx * f[0] + sy * f[1] + sz * f[2];
        pw[i] = dw;
        if (dw <= 0.02) continue; // behind / too far around the sphere
        const k = 2 / (1 + dw);
        const ue = k * (sx * ex + sy * ey + sz * ez);
        const vn = k * (sx * ux + sy * uy + sz * uz);
        px[i] = cx - ue * scale;
        py[i] = cy - vn * scale;
      }
    }

    /* ── drawing ── */
    function drawPolyline(indices: number[]): number {
      // returns total on-screen length; path left open in ctx
      let total = 0;
      let started = false;
      ctx!.beginPath();
      for (let s = 0; s < indices.length - 1; s++) {
        const a = indices[s];
        const b = indices[s + 1];
        if (pw[a] <= 0.02 || pw[b] <= 0.02) {
          started = false;
          continue;
        }
        if (!started) {
          ctx!.moveTo(px[a], py[a]);
          started = true;
        }
        ctx!.lineTo(px[b], py[b]);
        total += Math.hypot(px[b] - px[a], py[b] - py[a]);
      }
      return total;
    }

    function drawFigure(name: string, stroke: string, dashProgress: number) {
      const con = CONST_BY_NAME.get(name);
      if (!con) return;
      ctx!.strokeStyle = stroke;
      ctx!.lineWidth = 1;
      for (const poly of con.lines) {
        if (poly.length < 2) continue;
        const total = drawPolyline(poly);
        if (total <= 0) continue;
        if (dashProgress < 1) {
          ctx!.setLineDash([total * dashProgress, total + 8]);
          ctx!.stroke();
          ctx!.setLineDash([]);
        } else {
          ctx!.stroke();
        }
      }
    }

    function memberSet(name: string): Set<number> {
      const con = CONST_BY_NAME.get(name);
      const set = new Set<number>();
      if (con) for (const poly of con.lines) for (const i of poly) set.add(i);
      return set;
    }

    function drawCartouche(port: SkyPort, alpha: number) {
      const members = memberSet(port.constellation);
      let sx = 0;
      let sy = 0;
      let n = 0;
      let maxY = -Infinity;
      for (const i of members) {
        if (pw[i] <= 0.02) continue;
        sx += px[i];
        sy += py[i];
        if (py[i] > maxY) maxY = py[i];
        n++;
      }
      if (n === 0) return;
      const lang = (document.documentElement.lang || "").toLowerCase();
      const text = (lang.startsWith("uk") ? port.labelUk : port.label).toUpperCase();
      let lx = sx / n;
      let ly = Math.max(sy / n + 26, maxY + 22);
      ctx!.font = `10px ${monoFont}`;
      const c = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
      const prevSpacing = c.letterSpacing;
      if (typeof prevSpacing === "string") c.letterSpacing = "2px";
      const tw = ctx!.measureText(text).width;
      const rule = 18;
      const gap = 9;
      const half = tw / 2 + gap + rule;
      lx = Math.min(Math.max(lx, half + 16), w - half - 16);
      ly = Math.min(Math.max(ly, 32), h - 24);
      ctx!.fillStyle = `rgba(${GILT},${(0.92 * alpha).toFixed(3)})`;
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.fillText(text, lx, ly);
      ctx!.strokeStyle = `rgba(${GILT},${(0.5 * alpha).toFixed(3)})`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(lx - half, ly + 0.5);
      ctx!.lineTo(lx - half + rule, ly + 0.5);
      ctx!.moveTo(lx + half - rule, ly + 0.5);
      ctx!.lineTo(lx + half, ly + 0.5);
      ctx!.stroke();
      if (typeof prevSpacing === "string") c.letterSpacing = prevSpacing;
    }

    function draw(now: number) {
      projectAll();
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, w, h);

      /* 2 — every figure, hairline */
      ctx!.strokeStyle = HAIRLINE;
      ctx!.lineWidth = 1;
      for (const con of CONSTELLATIONS) {
        for (const poly of con.lines) {
          if (poly.length < 2) continue;
          if (drawPolyline(poly) > 0) ctx!.stroke();
        }
      }

      /* 3 — the berth figure in gilt (and the last one, fading) */
      const gilt = flight ? flight.port : activePort;
      if (fadeConst && fadeAlpha > 0.01 && fadeConst !== gilt.constellation) {
        drawFigure(fadeConst, `rgba(${GILT},${(0.8 * fadeAlpha).toFixed(3)})`, 1);
      }
      if (giltProgress > 0.001) {
        drawFigure(gilt.constellation, `rgba(${GILT},${(0.8 * Math.min(1, giltProgress)).toFixed(3)})`, giltProgress);
      }
      const brightSet = giltProgress > 0.5 ? memberSet(gilt.constellation) : null;

      /* 1 — stars */
      for (let i = 0; i < N; i++) {
        if (pw[i] <= 0.02) continue;
        const x = px[i];
        const y = py[i];
        if (x < -8 || x > w + 8 || y < -8 || y > h + 8) continue;
        let r = baseR[i];
        let a = baseA[i];
        if (!rm) a *= 1 + twAmp[i] * Math.sin(now / twPeriod[i] + twPhase[i]);
        if (brightSet && brightSet.has(i)) {
          a = Math.min(1, a * 1.35);
          r += 0.2;
        }
        /* 4 — cursor lantern */
        if (pointer) {
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          if (d < LANTERN_R) {
            const t = 1 - d / LANTERN_R;
            const s = t * t * (3 - 2 * t); // smoothstep — no popping at the rim
            // The lantern breathes like a flame. Driven by the clock, not
            // the frame count, so every framerate sees the same candle;
            // steady under reduced motion.
            const fl = rm
              ? 1
              : 1 + 0.05 * Math.sin(now / 130) + 0.03 * Math.sin(now / 47 + 1.7);
            a = Math.min(1, a * (1 + 0.7 * s * fl));
            r += 0.4 * s * (0.85 + 0.15 * fl);
          }
        }
        ctx!.globalAlpha = 1;
        ctx!.fillStyle = `rgba(${MOONSTONE},${a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(x, y, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      /* the cartouche — fades up with the figure's own inking, so it
         also finishes settling just after landing */
      const labelAlpha = Math.min(1, Math.max(0, (giltProgress - 0.5) * 2));
      if (labelAlpha > 0.01) drawCartouche(gilt, labelAlpha * 0.45);

      lastDraw = now;
      needsRedraw = false;
    }

    /* ── camera / flight ── */
    function settle(fl: Flight, instant = false) {
      cam.ra = fl.port.ra;
      cam.dec = fl.port.dec;
      fov = REST_FOV;
      activeKey = fl.key;
      activePort = fl.port;
      if (instant || giltProgress >= 1) {
        giltProgress = 1;
        giltTailStart = 0;
      } else {
        // The figure finishes inking JUST AFTER landing — the pen keeps
        // moving a beat past the camera's rest.
        giltTailFrom = giltProgress;
        giltTailStart = performance.now();
      }
      fadeConst = null;
      fadeAlpha = 0;
      flight = null;
      needsRedraw = true;
      window.dispatchEvent(new CustomEvent("oa-sky-arrive", { detail: { path: fl.path } }));
    }

    function startFlight(path: string) {
      const key = portKeyFor(path);
      if (!key) return;
      const port = PORTS[key];
      if (flight && flight.key === key) return;
      const from = vecOf(cam.ra, cam.dec);
      const to = vecOf(port.ra, port.dec);
      const dot = Math.max(-1, Math.min(1, from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
      const omega = Math.acos(dot);
      if (!flight && key === activeKey && omega < 0.5 * RAD) return; // moored already
      const fromConst = (flight ? flight.port : activePort).constellation;
      const fl: Flight = {
        from,
        to,
        omega,
        sinOmega: Math.sin(omega),
        start: performance.now(),
        path,
        key,
        port,
        sameFigure: fromConst === port.constellation,
      };
      if (rm || omega < 0.05 * RAD) {
        settle(fl, true); // instant jump — reduced motion, or a hair away
        return;
      }
      if (fl.sameFigure) {
        fadeConst = null;
        fadeAlpha = 0;
        giltProgress = 1; // Andromeda stays lit between Chart and Portrait
      } else {
        fadeConst = fromConst;
        fadeAlpha = 1;
        giltProgress = 0;
      }
      flight = fl;
      needsRedraw = true;
    }

    function stepFlight(now: number) {
      const fl = flight;
      if (!fl) return;
      const p = Math.min(1, (now - fl.start) / FLIGHT_MS);
      // Gentle overshoot: the camera glides a breath past the berth in
      // the last stretch and eases back — never a hard stop. The pass-by
      // is capped in absolute sky angle (≤ ~1.1°) so short hops don't
      // wobble and long hauls don't lurch.
      const os = Math.min(0.045, (1.1 * RAD) / Math.max(fl.omega, 1e-4));
      const e =
        houseEase(p) +
        os * Math.sin(Math.PI * Math.min(1, Math.max(0, (p - 0.62) / 0.38)));
      const v = slerp(fl.from, fl.to, e, fl.omega, fl.sinOmega);
      const rd = raDecOf(v);
      cam.ra = rd.ra;
      cam.dec = rd.dec;
      fov = REST_FOV + (SWELL_FOV - REST_FOV) * Math.sin(Math.PI * p); // the breath
      if (!fl.sameFigure) {
        fadeAlpha = Math.max(0, 1 - p / 0.25);
        // draw-on, last 40% — reaching only 0.9 at touchdown; the tail
        // in settle() completes the figure just after landing
        giltProgress = p < 0.6 ? 0 : 0.9 * houseEase((p - 0.6) / 0.4);
      }
      if (p >= 1) settle(fl);
    }

    /** Post-landing: the last tenth of the figure inks in over ~350ms. */
    function stepGiltTail(now: number) {
      if (!giltTailStart) return;
      const t = Math.min(1, (now - giltTailStart) / 350);
      giltProgress = giltTailFrom + (1 - giltTailFrom) * houseEase(t);
      needsRedraw = true;
      if (t >= 1) {
        giltProgress = 1;
        giltTailStart = 0;
      }
    }

    /* ── loop ── */
    function loop(now: number) {
      raf = requestAnimationFrame(loop);
      const dt = lastTs ? now - lastTs : 0;
      lastTs = now;
      if (flight) {
        stepFlight(now);
        draw(now); // flights render at full rate
        return;
      }
      if (giltTailStart) {
        stepGiltTail(now);
        draw(now); // the finishing pen-stroke renders at full rate too
        return;
      }
      if (!rm) cam.ra = (cam.ra + DRIFT_H_PER_MS * dt) % 24; // sidereal breath
      if (needsRedraw || (!rm && now - lastDraw >= IDLE_FPS_MS)) draw(now);
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = 0;
      needsRedraw = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    /* ── wiring ── */
    routeRef.current = (path: string) => {
      const key = portKeyFor(path);
      if (!key) return;
      if (key === activeKey && !flight) return;
      if (flight && flight.key === key) return;
      startFlight(path);
    };

    const onFly = (e: Event) => {
      const detail = (e as CustomEvent<{ path?: string }>).detail;
      if (detail && typeof detail.path === "string") startFlight(detail.path);
    };
    const onPointerMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      needsRedraw = true;
    };
    const onPointerGone = () => {
      pointer = null;
      needsRedraw = true;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onRmChange = () => {
      rm = rmQuery.matches;
      needsRedraw = true;
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("oa-sky-fly", onFly);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerGone);
    document.documentElement.addEventListener("pointerleave", onPointerGone);
    document.addEventListener("visibilitychange", onVisibility);
    rmQuery.addEventListener("change", onRmChange);
    if (!document.hidden) start();

    return () => {
      stop();
      routeRef.current = null;
      window.removeEventListener("resize", resize);
      window.removeEventListener("oa-sky-fly", onFly);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerGone);
      document.documentElement.removeEventListener("pointerleave", onPointerGone);
      document.removeEventListener("visibilitychange", onVisibility);
      rmQuery.removeEventListener("change", onRmChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
