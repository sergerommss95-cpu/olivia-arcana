/**
 * SkyAtlas.tsx — CARTA COELI, the Atlas of the Edition.
 *
 * A full-screen engraved star chart of the entire site: every page's
 * berth constellation drawn as a cartouche on one equirectangular
 * plate. Opened by the "oa-sky-map" event, the M key, or the fixed
 * <SkyAtlasButton/>. Clicking a port closes the atlas, launches the
 * sky flight (voyage contract), then routes.
 *
 * Plate conventions: RA 0..24h right-to-left (astronomical), dec
 * +75°..−45°. Hairlines are vector-effect non-scaling-stroke; the
 * whole chart is one SVG so it stays crisp at any density.
 */

"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { PORTS, flyTo, openAtlas, chartedPorts, CHARTED_EVENT } from "./voyage";
import { STARS, CONSTELLATIONS, lst, eclipticToEquatorial, type Constellation } from "@/lib/star-chart";
import {
  moonState,
  wanderers as wanderersNow,
  resolveObserver,
  altitudeDeg,
  type MoonState,
  type Wanderer,
  type SkyObserver,
} from "@/lib/sky/live";
import { moonPathD } from "@/components/sky/TrueMoon";
import { useLocale } from "@/lib/i18n/useLocale";

/* ── Palette (The Arrival) ─────────────────────────────────────── */
const MOON = "#e8e9ff";
const PERI = "#b7bce9";
const GILT = "#e0b768";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const SERIF = "var(--font-heading), Cormorant, Georgia, serif";
const MONO = "var(--font-mono), 'IBM Plex Mono', monospace";

/* ── Plate geometry (viewBox units) ────────────────────────────── */
const VB_W = 1080;
const VB_H = 620;
const CX = 60; // chart left
const CY = 92; // chart top
const CW = 960; // 24h → 40 units per hour
const CH = 480; // 120° → 4 units per degree
const KYIV_LON = 30.5;

/** RA hours → x. Right-to-left: 0h at the right edge. */
const xOf = (ra: number) => CX + (CW * (24 - ra)) / 24;
/** Dec degrees → y. +75° at the top, −45° at the bottom. */
const yOf = (dec: number) => CY + (CH * (75 - dec)) / 120;

const starR = (mag: number) => Math.max(0.9, 3.2 - mag * 0.58);
const starO = (mag: number) => Math.min(0.95, Math.max(0.45, 1.05 - mag * 0.14));

/* ── Figures ───────────────────────────────────────────────────
   Libra berths /pricing but has no entry in CONSTELLATIONS; every
   serious atlas draws its α–β beam, so the plate adds it locally. */
const EXTRA_FIGURES: Constellation[] = [
  { name: "Libra", nameUk: "Терези", lines: [[71, 70]] },
];
const ALL_FIGURES: Constellation[] = [...CONSTELLATIONS, ...EXTRA_FIGURES];

const UK_BY_NAME = new Map(ALL_FIGURES.map((c) => [c.name, c.nameUk]));

/** Constellations that hold at least one berth. */
const PORT_CONSTELLATIONS = new Set(Object.values(PORTS).map((p) => p.constellation));
/** Constellation → first berth path (for clicking the figure itself). */
const PRIMARY_PORT = new Map<string, string>();
for (const [path, p] of Object.entries(PORTS)) {
  if (!PRIMARY_PORT.has(p.constellation)) PRIMARY_PORT.set(p.constellation, path);
}

interface Figure {
  name: string;
  nameUk: string;
  d: string;
  /** Figure crosses the RA 0/24 seam — draw ±one plate width too. */
  wraps: boolean;
  isPort: boolean;
  labelX: number;
  labelY: number;
}

/** Unwrap a polyline across the RA seam and emit a path. */
function buildFigure(c: Constellation): Figure {
  let d = "";
  let wraps = false;
  for (const line of c.lines) {
    if (line.length < 2) continue;
    const ras: number[] = [];
    for (let i = 0; i < line.length; i++) {
      const ra = STARS[line[i]].ra;
      if (i === 0) {
        ras.push(ra);
      } else {
        const prev = ras[i - 1];
        let best = ra;
        for (const s of [-24, 24]) {
          if (Math.abs(ra + s - prev) < Math.abs(best - prev)) best = ra + s;
        }
        ras.push(best);
      }
    }
    if (ras.some((r) => r < 0 || r > 24)) wraps = true;
    d += ras
      .map(
        (r, i) =>
          `${i === 0 ? "M" : "L"}${xOf(r).toFixed(1)} ${yOf(STARS[line[i]].dec).toFixed(1)}`
      )
      .join("");
  }
  // Label anchor: centroid of the figure's own stars (seam-free ones only).
  const idx = Array.from(new Set(c.lines.flat()));
  let sx = 0;
  let sy = 0;
  for (const i of idx) {
    sx += xOf(STARS[i].ra);
    sy += yOf(STARS[i].dec);
  }
  return {
    name: c.name,
    nameUk: c.nameUk,
    d,
    wraps,
    isPort: PORT_CONSTELLATIONS.has(c.name),
    labelX: sx / idx.length,
    labelY: sy / idx.length + 16,
  };
}

const FIGURES: Figure[] = ALL_FIGURES.map(buildFigure);

/* ── The ecliptic — the wanderers' road, engraved once ─────────── */
const ECLIPTIC_D = (() => {
  let d = "";
  for (let lam = 0; lam <= 360; lam += 6) {
    const { ra, dec } = eclipticToEquatorial(lam);
    const r = lam === 360 ? 24 : ra; // close the road at the seam
    d += `${lam === 0 ? "M" : "L"}${xOf(r).toFixed(1)} ${yOf(dec).toFixed(1)}`;
  }
  return d;
})();

/* ── Graticule: one compound path, 2h / 15° steps ─────────────── */
const GRATICULE_D = (() => {
  let d = "";
  for (let h = 0; h <= 24; h += 2) d += `M${xOf(h)} ${CY}V${CY + CH}`;
  for (let deg = 75; deg >= -45; deg -= 15) d += `M${CX} ${yOf(deg)}H${CX + CW}`;
  return d;
})();

/* ── Cartouches: one per berth, collision-relaxed ─────────────── */
interface Cart {
  path: string;
  label: string;
  name: string;
  /** Anchor star on the plate (leader target). */
  sx: number;
  sy: number;
  /** Box centre after relaxation. */
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Berths whose anchor star sits off the plate get a visible stand-in. */
const ANCHOR_OVERRIDE: Record<string, { ra: number; dec: number }> = {
  "/daily": { ra: 14.845, dec: 74.156 }, // Polaris is above +75°; anchor Kochab
};

/** Preferred vertical offset from the anchor star (default: above). */
const PREF_DY: Record<string, number> = {
  "/timing": 46, // Boötes berths two pages — Transits above Arcturus, Timing below
};

function layoutCartouches(uk: boolean): Cart[] {
  const items: Cart[] = Object.entries(PORTS).map(([path, p]) => {
    const a = ANCHOR_OVERRIDE[path] ?? p;
    const label = uk ? p.labelUk : p.label;
    const name = (uk ? UK_BY_NAME.get(p.constellation) ?? p.constellation : p.constellation).toUpperCase();
    const w = Math.min(200, Math.max(label.length * 7.4, name.length * 5.8, 72) + 30);
    const sx = xOf(a.ra);
    const sy = yOf(a.dec);
    return { path, label, name, sx, sy, x: sx, y: sy + (PREF_DY[path] ?? -42), w, h: 46 };
  });

  const X0 = CX + 8;
  const X1 = CX + CW - 8;
  const Y0 = CY + 10;
  const Y1 = CY + CH - 10;
  const clamp = (c: Cart) => {
    c.x = Math.min(Math.max(c.x, X0 + c.w / 2), X1 - c.w / 2);
    c.y = Math.min(Math.max(c.y, Y0 + c.h / 2), Y1 - c.h / 2);
  };
  items.forEach(clamp);

  // Deterministic AABB relaxation — push overlapping plates apart.
  for (let pass = 0; pass < 80; pass++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const ox = (a.w + b.w) / 2 + 10 - Math.abs(dx);
        const oy = (a.h + b.h) / 2 + 8 - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (oy <= ox) {
          const s = ((dy >= 0 ? 1 : -1) * oy) / 2;
          a.y -= s;
          b.y += s;
        } else {
          const s = ((dx >= 0 ? 1 : -1) * ox) / 2;
          a.x -= s;
          b.x += s;
        }
        clamp(a);
        clamp(b);
      }
    }
    if (!moved) break;
  }
  return items;
}

/** Dotted leader from a cartouche edge toward its anchor star. */
function leaderFor(c: Cart): { x1: number; y1: number; x2: number; y2: number } | null {
  const vx = c.sx - c.x;
  const vy = c.sy - c.y;
  const tx = vx !== 0 ? (c.w / 2 + 4) / Math.abs(vx) : Infinity;
  const ty = vy !== 0 ? (c.h / 2 + 4) / Math.abs(vy) : Infinity;
  const t = Math.min(tx, ty);
  if (!isFinite(t) || t >= 1) return null; // star inside/very near the box
  const d = Math.hypot(vx, vy);
  const x1 = c.x + vx * t;
  const y1 = c.y + vy * t;
  const x2 = c.sx - (vx / d) * 7;
  const y2 = c.sy - (vy / d) * 7;
  if (Math.hypot(x2 - x1, y2 - y1) < 10) return null;
  return { x1, y1, x2, y2 };
}

/* ── Shared style (entrance draw-on, hover, reduced motion) ───── */
const CSS = `
.oa-atlas{position:fixed;inset:0;z-index:300;background:rgba(10,13,56,0.96);
  display:flex;overflow:auto;overscroll-behavior:contain;
  animation:oaFade .32s ${EASE} both}
.oa-atlas.oa-closing{animation:none;opacity:0;transition:opacity .22s ease}
.oa-atlas svg{margin:auto;display:block}
.oa-atlas .draw{stroke-dasharray:1;stroke-dashoffset:1;
  animation:oaDraw .46s ${EASE} both}
.oa-atlas .d1{animation-delay:.09s}
.oa-atlas .d2{animation-delay:.18s}
.oa-atlas .fadein{opacity:0;animation:oaIn .34s ease-out .2s forwards}
.oa-atlas .tr{transition:stroke .18s ease,fill .18s ease,opacity .18s ease}
.oa-cart{cursor:pointer;outline:none}
.oa-cart:focus-visible .oa-cart-box{stroke:rgba(224,183,104,.65)}
.oa-fig-hit{cursor:pointer}
.oa-atlas-close{position:fixed;top:22px;right:30px;
  font:10px ${MONO};letter-spacing:.18em;color:${PERI};
  background:none;border:none;border-bottom:1px solid transparent;
  padding:8px 2px;cursor:pointer;transition:color .2s,border-color .2s}
.oa-atlas-close:hover,.oa-atlas-close:focus-visible{color:${MOON};
  border-bottom-color:rgba(232,233,255,.16);outline:none}
@keyframes oaFade{from{opacity:0}to{opacity:1}}
@keyframes oaDraw{to{stroke-dashoffset:0}}
@keyframes oaIn{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){
  .oa-atlas,.oa-atlas .draw,.oa-atlas .fadein{animation:none}
  .oa-atlas .draw{stroke-dashoffset:0}
  .oa-atlas .fadein{opacity:1}
  .oa-atlas.oa-closing{transition:none}
}`;

const BTN_CSS = `
.oa-atlas-btn{position:fixed;right:22px;
  bottom:calc(52px + env(safe-area-inset-bottom,0px));z-index:90;
  font:10px ${MONO};letter-spacing:.18em;text-transform:uppercase;
  color:${PERI};background:none;border:none;
  border-bottom:1px solid transparent;padding:8px 2px;cursor:pointer;
  transition:color .2s,border-color .2s}
.oa-atlas-btn .oa-atlas-key{color:rgba(224,183,104,.85)}
.oa-atlas-btn:hover,.oa-atlas-btn:focus-visible{color:${MOON};
  border-bottom-color:rgba(232,233,255,.16);outline:none}
@media (hover: none), (pointer: coarse){
  .oa-atlas-btn .oa-atlas-key{display:none}
}
@media (max-width: 640px){
  .oa-atlas-btn{right:14px;bottom:calc(96px + env(safe-area-inset-bottom,0px));
    font-size:9px;letter-spacing:.14em}
}`;

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Resolve the current pathname to its berth key, if any. */
function portKeyFor(pathname: string | null): string | null {
  if (!pathname) return null;
  if (PORTS[pathname]) return pathname;
  const root = "/" + (pathname.split("/")[1] ?? "");
  return PORTS[root] ? root : null;
}

/* ════════════════════════════════════════════════════════════════
   The Atlas overlay
   ════════════════════════════════════════════════════════════════ */
export default function SkyAtlas() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useLocale();
  const uk = locale === "uk";

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hoverPath, setHoverPath] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  /* Carta Incognita — berths this visitor has inked. */
  const [charted, setCharted] = useState<Set<string>>(() => new Set(["/"]));
  /* Coelum Vivum — the real Moon and wanderers at this minute. */
  const [sky, setSky] = useState<{ moon: MoonState; wands: Wanderer[]; obs: SkyObserver } | null>(null);

  useEffect(() => {
    const sync = () => setCharted(chartedPorts());
    sync();
    window.addEventListener(CHARTED_EVENT, sync);
    return () => window.removeEventListener(CHARTED_EVENT, sync);
  }, []);

  const dialogRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(false);
  const closeTimerRef = useRef<number | null>(null);
  const navTimerRef = useRef<number | null>(null);
  openRef.current = open;

  /* Contract: the "oa-sky-map" event is the single open/close switch. */
  useEffect(() => {
    const onMap = (e: Event) => {
      const want = Boolean((e as CustomEvent<{ open?: boolean }>).detail?.open);
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      if (want) {
        setNow(new Date());
        setClosing(false);
        setOpen(true);
      } else if (openRef.current) {
        if (prefersReducedMotion()) {
          setOpen(false);
          setClosing(false);
        } else {
          setClosing(true);
          closeTimerRef.current = window.setTimeout(() => {
            setOpen(false);
            setClosing(false);
            closeTimerRef.current = null;
          }, 230);
        }
      }
    };
    window.addEventListener("oa-sky-map", onMap);
    return () => {
      window.removeEventListener("oa-sky-map", onMap);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
      if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);
    };
  }, []);

  /* M toggles (layout-independent KeyM; never while typing). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyM" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      e.preventDefault();
      openAtlas(!openRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ESC closes while open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        openAtlas(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  /* Focus capture + scroll lock while open; restore on close. */
  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const raf = requestAnimationFrame(() => dialogRef.current?.focus());
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = prevOverflow;
      prevFocusRef.current?.focus?.();
      setHoverPath(null);
    };
  }, [open]);

  /* Tonight's meridian keeps time while the plate is up (paused hidden). */
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      if (!document.hidden) setNow(new Date());
    };
    const id = window.setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [open]);

  /* Tab trap. */
  const onDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const els = Array.from(
      root.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]')
    );
    if (els.length === 0) {
      e.preventDefault();
      return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  /* Close → fly → route. */
  const go = useCallback(
    (path: string) => {
      openAtlas(false);
      if (pathname === path) return;
      flyTo(path);
      if (navTimerRef.current !== null) window.clearTimeout(navTimerRef.current);
      navTimerRef.current = window.setTimeout(
        () => router.push(path),
        prefersReducedMotion() ? 0 : 180
      );
    },
    [pathname, router]
  );

  const carts = useMemo(() => layoutCartouches(uk), [uk]);
  const currentKey = portKeyFor(pathname);
  const currentConst = currentKey ? PORTS[currentKey].constellation : null;
  const hoverConst = hoverPath ? PORTS[hoverPath].constellation : null;

  /* A figure is inked once any of its berths has been travelled. */
  const chartedConsts = useMemo(() => {
    const s = new Set<string>();
    for (const p of charted) if (PORTS[p]) s.add(PORTS[p].constellation);
    return s;
  }, [charted]);

  /* Which berths stand above the visitor's horizon at this minute. */
  const risen = useMemo(() => {
    if (!sky || !now) return null;
    const m = new Map<string, boolean>();
    for (const [path, p] of Object.entries(PORTS)) {
      const a = ANCHOR_OVERRIDE[path] ?? p;
      m.set(path, altitudeDeg(a.ra, a.dec, sky.obs, now) > 0);
    }
    return m;
  }, [sky, now]);

  const meridianX = useMemo(
    () => (now ? xOf(lst(now, KYIV_LON)) : null),
    [now]
  );

  /* Recompute the living sky whenever the plate's clock ticks. The
     chart survives an ephemeris failure — it just prints no wanderers. */
  useEffect(() => {
    if (!now) return;
    try {
      setSky({ moon: moonState(now), wands: wanderersNow(now), obs: resolveObserver() });
    } catch {
      setSky(null);
    }
  }, [now]);

  if (!open && !closing) return null;

  const title = "CARTA COELI";
  const portTotal = Object.keys(PORTS).length;
  const chartedCount = Math.min(charted.size, portTotal);
  const subtitle =
    (uk ? "АТЛАС ВИДАННЯ · КЛАВІША M · НАНЕСЕНО " : "THE ATLAS OF THE EDITION · PRESS M · CHARTED ") +
    `${chartedCount}/${portTotal}`;
  const closeLabel = uk ? "ESC ✦ ЗАКРИТИ" : "ESC ✦ CLOSE";
  const legend = sky
    ? uk
      ? `LUNA І МАНДРІВНІ СВІТИЛА — СПРАВЖНІ, ЦІЄЇ ХВИЛИНИ · ЗОЛОТИЙ ✦ = НАД ОБРІЄМ (${sky.obs.label})`
      : `LUNA & THE WANDERERS ARE REAL, THIS MINUTE · GILT ✦ = RISEN NOW (${sky.obs.label})`
    : null;

  /* Stroke for a constellation figure. Uncharted ports are drawn the
     way an old map draws an unexplored coast: a faint dotted guess. */
  const figStroke = (f: Figure): { stroke: string; width: number; dash?: string } => {
    if (f.isPort && !chartedConsts.has(f.name)) {
      if (hoverConst === f.name) return { stroke: "rgba(183,188,233,0.55)", width: 1, dash: "2 5" };
      return { stroke: "rgba(183,188,233,0.28)", width: 1, dash: "2 5" };
    }
    if (f.isPort && (hoverConst === f.name))
      return { stroke: "rgba(224,183,104,0.9)", width: 1.4 };
    if (f.isPort && currentConst === f.name)
      return { stroke: "rgba(224,183,104,0.55)", width: 1.1 };
    if (f.isPort) return { stroke: "rgba(183,188,233,0.55)", width: 1 };
    return { stroke: "rgba(183,188,233,0.35)", width: 1 };
  };

  const cartTone = (path: string, inked: boolean) => {
    const active = path === currentKey || path === hoverPath;
    if (!inked && !active)
      return {
        label: "rgba(183,188,233,0.5)",
        name: "rgba(183,188,233,0.32)",
        rule: "rgba(232,233,255,0.16)",
      };
    return {
      label: active ? "rgba(224,183,104,0.95)" : "rgba(232,233,255,0.82)",
      name: active ? "rgba(224,183,104,0.62)" : "rgba(183,188,233,0.5)",
      rule: active ? "rgba(224,183,104,0.5)" : "rgba(232,233,255,0.28)",
    };
  };

  return (
    <div
      ref={dialogRef}
      className={`oa-atlas${closing ? " oa-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={uk ? "Carta Coeli — атлас видання" : "Carta Coeli — atlas of the edition"}
      tabIndex={-1}
      onKeyDown={onDialogKeyDown}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) openAtlas(false);
      }}
      style={{ padding: 20 }}
    >
      <style>{CSS}</style>

      <button type="button" className="oa-atlas-close" onClick={() => openAtlas(false)}>
        {closeLabel}
      </button>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ width: "clamp(880px, min(96vw, 160vh), 1360px)", height: "auto", flex: "none" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="oa-atlas-clip">
            <rect x={CX} y={CY} width={CW} height={CH} />
          </clipPath>
        </defs>

        {/* Plate ground */}
        <g className="fadein">
          <rect x={24} y={22} width={1032} height={576} fill="rgba(16,19,77,0.38)" />
        </g>

        {/* Graticule — 2h / 15° */}
        <path
          className="draw"
          d={GRATICULE_D}
          pathLength={1}
          fill="none"
          stroke="rgba(183,188,233,0.12)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />

        {/* Graticule figures */}
        <g className="fadein" fontFamily={MONO} fontSize={6.5} fill="rgba(183,188,233,0.28)">
          {Array.from({ length: 12 }, (_, i) => i * 2).map((h) => (
            <text key={`ra${h}`} x={xOf(h)} y={CY + CH + 13} textAnchor="middle">
              {h}ʰ
            </text>
          ))}
          {Array.from({ length: 9 }, (_, i) => 75 - i * 15).map((d) => (
            <text key={`de${d}`} x={CX - 8} y={yOf(d) + 2} textAnchor="end">
              {d > 0 ? `+${d}°` : `${d}°`}
            </text>
          ))}
        </g>

        {/* Tonight's meridian at Kyiv longitude */}
        {meridianX !== null && (
          <g clipPath="url(#oa-atlas-clip)">
            <path
              className="draw d2"
              d={`M${meridianX.toFixed(1)} ${CY}V${CY + CH}`}
              pathLength={1}
              stroke="rgba(224,183,104,0.25)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <text
              className="fadein"
              x={meridianX + (meridianX > 950 ? -9 : 9)}
              y={CY + 16}
              transform={`rotate(90 ${meridianX + (meridianX > 950 ? -9 : 9)} ${CY + 16})`}
              fontFamily={MONO}
              fontSize={6.5}
              letterSpacing={2}
              fill="rgba(224,183,104,0.55)"
            >
              {uk ? "МЕРИДІАН ЗАРАЗ" : "MERIDIAN NOW"}
            </text>
          </g>
        )}

        {/* The ecliptic — the wanderers' road */}
        <g clipPath="url(#oa-atlas-clip)">
          <path
            className="draw d2"
            d={ECLIPTIC_D}
            pathLength={1}
            fill="none"
            stroke="rgba(224,183,104,0.22)"
            strokeWidth={1}
            strokeDasharray="1 4"
            vectorEffect="non-scaling-stroke"
          />
        </g>

        {/* Constellation figures */}
        <g clipPath="url(#oa-atlas-clip)">
          {FIGURES.map((f) => {
            if (!f.d) return null;
            const { stroke, width, dash } = figStroke(f);
            const primary = PRIMARY_PORT.get(f.name);
            const copies = f.wraps ? [0, -CW, CW] : [0];
            return (
              <g key={f.name}>
                {copies.map((dx) => (
                  <path
                    key={dx}
                    className={dash ? "tr" : "draw d1 tr"}
                    d={f.d}
                    pathLength={dash ? undefined : 1}
                    transform={dx ? `translate(${dx} 0)` : undefined}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={width}
                    strokeDasharray={dash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {f.isPort &&
                  primary &&
                  copies.map((dx) => (
                    <path
                      key={`hit${dx}`}
                      className="oa-fig-hit"
                      d={f.d}
                      transform={dx ? `translate(${dx} 0)` : undefined}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={9}
                      pointerEvents="stroke"
                      vectorEffect="non-scaling-stroke"
                      aria-hidden="true"
                      onMouseEnter={() => setHoverPath(primary)}
                      onMouseLeave={() => setHoverPath(null)}
                      onClick={() => go(primary)}
                    />
                  ))}
              </g>
            );
          })}
        </g>

        {/* The catalog, mag-sized */}
        <g className="fadein" clipPath="url(#oa-atlas-clip)">
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={xOf(s.ra)}
              cy={yOf(s.dec)}
              r={starR(s.mag)}
              fill={MOON}
              opacity={starO(s.mag)}
            />
          ))}
        </g>

        {/* COELUM VIVUM — Luna and the wanderers, at this minute, real */}
        {sky && (
          <g className="fadein" clipPath="url(#oa-atlas-clip)">
            {sky.wands.map((w) => {
              const wx = xOf(w.raH);
              const wy = yOf(w.decDeg);
              return (
                <g key={w.key}>
                  <circle cx={wx} cy={wy} r={2.1} fill={GILT} opacity={0.92} />
                  <circle cx={wx} cy={wy} r={4.6} fill="none" stroke="rgba(224,183,104,0.35)" strokeWidth={0.6} />
                  <text
                    x={wx + 7}
                    y={wy - 4}
                    fontFamily={SERIF}
                    fontSize={9.5}
                    fill="rgba(224,183,104,0.9)"
                  >
                    {w.symbol}
                  </text>
                  <text
                    x={wx + 7}
                    y={wy + 6}
                    fontFamily={MONO}
                    fontSize={5}
                    letterSpacing={1.4}
                    fill="rgba(224,183,104,0.55)"
                  >
                    {(uk ? w.nameUk : w.nameEn).toUpperCase()}
                  </text>
                </g>
              );
            })}
            {(() => {
              const mx = xOf(sky.moon.raH);
              const my = yOf(sky.moon.decDeg);
              const lit = moonPathD(sky.moon.phaseDeg, 5, mx, my);
              return (
                <g>
                  <circle cx={mx} cy={my} r={5} fill="rgba(232,233,255,0.12)" stroke="rgba(232,233,255,0.4)" strokeWidth={0.6} />
                  {sky.moon.phaseDeg > 178 && sky.moon.phaseDeg < 182 ? (
                    <circle cx={mx} cy={my} r={5} fill="rgba(232,233,255,0.92)" />
                  ) : (
                    lit && <path d={lit} fill="rgba(232,233,255,0.92)" />
                  )}
                  <text
                    x={mx + 9}
                    y={my + 2.5}
                    fontFamily={MONO}
                    fontSize={5}
                    letterSpacing={1.6}
                    fill="rgba(232,233,255,0.55)"
                  >
                    LUNA
                  </text>
                </g>
              );
            })()}
          </g>
        )}

        {/* Names of figures without a berth */}
        <g
          className="fadein"
          fontFamily={MONO}
          fontSize={8}
          letterSpacing={2.2}
          fill="rgba(232,233,255,0.3)"
          textAnchor="middle"
          clipPath="url(#oa-atlas-clip)"
        >
          {FIGURES.filter((f) => !f.isPort).map((f) => (
            <text key={f.name} x={f.labelX} y={f.labelY}>
              {(uk ? f.nameUk : f.name).toUpperCase()}
            </text>
          ))}
        </g>

        {/* Cartouches of the edition */}
        <g className="fadein">
          {carts.map((c) => {
            const inked = charted.has(c.path);
            const tone = cartTone(c.path, inked);
            const lead = leaderFor(c);
            const aria = `${c.label} — ${c.name}`;
            const shownLabel = inked ? c.label : uk ? "Не звідано" : "Uncharted";
            const shownName = inked ? c.name : "TERRA INCOGNITA";
            const up = risen?.get(c.path) ?? false;
            return (
              <g
                key={c.path}
                className="oa-cart"
                role="button"
                tabIndex={0}
                aria-label={aria}
                onMouseEnter={() => setHoverPath(c.path)}
                onMouseLeave={() => setHoverPath(null)}
                onFocus={() => setHoverPath(c.path)}
                onBlur={() => setHoverPath(null)}
                onClick={() => go(c.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    go(c.path);
                  }
                }}
              >
                {lead && (
                  <line
                    x1={lead.x1}
                    y1={lead.y1}
                    x2={lead.x2}
                    y2={lead.y2}
                    stroke="rgba(183,188,233,0.3)"
                    strokeWidth={1}
                    strokeDasharray="1 3"
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <text
                  className="tr"
                  x={c.x}
                  y={c.y - 5}
                  textAnchor="middle"
                  fontFamily={SERIF}
                  fontStyle="italic"
                  fontSize={15}
                  fill={tone.label}
                >
                  {shownLabel}
                </text>
                <g className="tr" stroke={tone.rule} strokeWidth={1}>
                  <line x1={c.x - c.w / 2 + 12} y1={c.y + 5} x2={c.x - 8} y2={c.y + 5} vectorEffect="non-scaling-stroke" />
                  <line x1={c.x + 8} y1={c.y + 5} x2={c.x + c.w / 2 - 12} y2={c.y + 5} vectorEffect="non-scaling-stroke" />
                </g>
                <text
                  className="tr"
                  x={c.x}
                  y={c.y + 7.2}
                  textAnchor="middle"
                  fontSize={6}
                  fill={up ? "rgba(224,183,104,0.85)" : tone.rule}
                  stroke="none"
                >
                  ✦
                </text>
                <text
                  className="tr"
                  x={c.x}
                  y={c.y + 19}
                  textAnchor="middle"
                  fontFamily={MONO}
                  fontSize={6.5}
                  letterSpacing={1.8}
                  fill={tone.name}
                >
                  {shownName}
                </text>
                <rect
                  className="oa-cart-box"
                  x={c.x - c.w / 2}
                  y={c.y - c.h / 2}
                  width={c.w}
                  height={c.h}
                  fill="transparent"
                  stroke="none"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            );
          })}
        </g>

        {/* House double rule + corner marks */}
        <g fill="none" stroke="rgba(232,233,255,0.16)" strokeWidth={1}>
          <path className="draw" d={`M16 14H1064V606H16Z`} pathLength={1} vectorEffect="non-scaling-stroke" />
          <path className="draw d1" d={`M24 22H1056V598H24Z`} pathLength={1} vectorEffect="non-scaling-stroke" />
        </g>
        <g className="fadein" fill="none" stroke="rgba(232,233,255,0.35)" strokeWidth={1}>
          {(
            [
              [16, 14, 1, 1],
              [1064, 14, -1, 1],
              [16, 606, 1, -1],
              [1064, 606, -1, -1],
            ] as const
          ).map(([px, py, mx, my]) => (
            <path
              key={`${px}${py}`}
              d={`M${px - 7 * mx} ${py}H${px}V${py - 7 * my}`}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {/* Title cartouche */}
        <g className="fadein" textAnchor="middle">
          <text x={540} y={54} fontFamily={SERIF} fontSize={25} letterSpacing={7} fill={MOON}>
            {title}
          </text>
          <text x={368} y={49} fontSize={7} fill="rgba(183,188,233,0.6)">
            ✦
          </text>
          <text x={712} y={49} fontSize={7} fill="rgba(183,188,233,0.6)">
            ✦
          </text>
          <g stroke="rgba(232,233,255,0.16)" strokeWidth={1}>
            <line x1={272} y1={47} x2={356} y2={47} vectorEffect="non-scaling-stroke" />
            <line x1={724} y1={47} x2={808} y2={47} vectorEffect="non-scaling-stroke" />
          </g>
          <text x={540} y={74} fontFamily={MONO} fontSize={8} letterSpacing={3} fill="rgba(183,188,233,0.6)">
            {subtitle}
          </text>
        </g>

        {/* Coelum Vivum legend — the plate's oath of truth */}
        {legend && (
          <text
            className="fadein"
            x={540}
            y={593}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={6.5}
            letterSpacing={2}
            fill="rgba(183,188,233,0.45)"
          >
            {legend}
          </text>
        )}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   The fixed trigger — "THE SKY ✦ M"
   ════════════════════════════════════════════════════════════════ */
export function SkyAtlasButton() {
  const { locale } = useLocale();
  const uk = locale === "uk";
  return (
    <>
      <style>{BTN_CSS}</style>
      <button
        type="button"
        className="oa-atlas-btn"
        aria-label={uk ? "Відкрити атлас неба" : "Open the sky atlas"}
        aria-keyshortcuts="m"
        onClick={() => openAtlas(true)}
      >
        {uk ? "АТЛАС НЕБА" : "SKY ATLAS"}
        <span className="oa-atlas-key" aria-hidden>
          {" "}✦ {uk ? "КЛАВІША M" : "PRESS M"}
        </span>
      </button>
    </>
  );
}
