"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { STARS } from "@/lib/star-chart";
import { moonPathD } from "@/components/sky/TrueMoon";
import type { NatalChart } from "@/lib/natal-chart";
import { birthSkyGeometry } from "@/components/chart/flattened-sky-geometry";
import { point, separateLabels, wheelAngle } from "@/components/chart/natal-atlas-geometry";
import styles from "./FlattenedSky.module.css";
import { UK_PLANETS } from "@/components/chart/chart-copy";

const GILT = "#e0b768";
const MOONSTONE = "#e8e9ff";
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => 1 - Math.pow(1 - clamp(n), 4);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const DIRECTIONS = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];

interface Props {
  chart: NatalChart;
  locale?: string;
  selected: number | null;
  onSelect: (index: number | null) => void;
  /** The actual interactive SVG plate, never a second approximation of it. */
  plate: ReactNode;
  /** A new request exposes the plate immediately, for navigation/aspect choices. */
  requestPlate?: number;
  onFoldedToPlate?: () => void;
}

/** THE FLATTENED SKY: a topocentric dome folds into the same fixed SVG atlas.
 * Only the fold renders frames. The sky is still at rest; every control also
 * works with keyboard and reduced motion. The chart engine remains untouched.
 */
export default function FlattenedSky({ chart, selected, onSelect, plate, requestPlate = 0, onFoldedToPlate, locale = "en" }: Props) {
  const uk = locale === "uk";
  const c = (en: string, translated: string) => uk ? translated : en;
  const id = useId();
  const geo = useMemo(() => birthSkyGeometry(chart, STARS), [chart]);
  const labels = useMemo(() => separateLabels(chart.planets.map(p => p.longitude)), [chart.planets]);
  const rotation = chart.timeKnown !== false && chart.ascendant ? chart.ascendant.longitude : 0;
  const [t, setT] = useState(0);
  const progress = useRef(0);
  const frame = useRef<number | null>(null);
  const target = useRef(0);
  const completed = useRef(false);
  const reduced = useRef(false);
  const dragging = useRef(false);
  const dragStart = useRef(0);
  const completion = useRef(onFoldedToPlate);
  const [size, setSize] = useState(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const hits = useRef<{ x: number; y: number }[]>([]);
  const tapStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { completion.current = onFoldedToPlate; }, [onFoldedToPlate]);
  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }, []);
  const update = useCallback((value: number) => {
    progress.current = clamp(value);
    setT(progress.current);
    if (value < 1) completed.current = false;
  }, []);
  // Button, range, keyboard, reduced motion and navigation share one landing.
  const land = useCallback((value: number) => {
    update(value);
    if (value === 1 && !completed.current) {
      completed.current = true;
      completion.current?.();
    }
  }, [update]);
  const animateTo = useCallback((value: number, immediate = false) => {
    stop(); target.current = value;
    if (reduced.current || immediate || Math.abs(progress.current - value) < .001) { land(value); return; }
    const from = progress.current; const start = performance.now(); const duration = 780 * Math.abs(value - from);
    const step = (now: number) => {
      const elapsed = clamp((now - start) / duration);
      if (elapsed === 1) { frame.current = null; land(value); }
      else { update(mix(from, value, ease(elapsed))); frame.current = requestAnimationFrame(step); }
    };
    frame.current = requestAnimationFrame(step);
  }, [land, stop, update]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      reduced.current = query.matches;
      if (query.matches && frame.current !== null) { stop(); land(target.current); }
    };
    change(); query.addEventListener("change", change);
    return () => { query.removeEventListener("change", change); stop(); };
  }, [land, stop]);
  useEffect(() => {
    if (!requestPlate) return;
    const pending = requestAnimationFrame(() => animateTo(1, true));
    return () => cancelAnimationFrame(pending);
  }, [requestPlate, animateTo]);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const width = Math.round(entries[0]?.contentRect.width || 0);
      if (width) setSize(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !size || t === 1) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (element.width !== Math.round(size * dpr)) { element.width = Math.round(size * dpr); element.height = Math.round(size * dpr); }
    const ctx = element.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    const center = size / 2; const radius = size * .39; const scale = size / 520; const skyAlpha = 1 - t;
    const dome = (p: { x: number; y: number }) => ({ x: center + p.x * radius, y: center + p.y * radius });
    const platePoint = (longitude: number, r: number) => {
      const p = point(r, wheelAngle(longitude, rotation)); return { x: p.x * scale, y: p.y * scale };
    };
    const circle = (x: number, y: number, r: number) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); };
    // Canvas cannot resolve CSS variables; resolve the actual family before drawing.
    const font = getComputedStyle(element).getPropertyValue("--font-mono").trim() || "monospace";
    ctx.globalAlpha = skyAlpha; ctx.fillStyle = "#060827"; ctx.fillRect(0, 0, size, size);
    const field = ctx.createRadialGradient(center, center, 0, center, center, radius);
    field.addColorStop(0, "#161948"); field.addColorStop(1, "#0a0d38");
    ctx.fillStyle = field; circle(center, center, radius); ctx.fill();
    ctx.strokeStyle = "rgba(232,233,255,.38)"; ctx.lineWidth = .8; circle(center, center, radius); ctx.stroke();
    ctx.fillStyle = "#b7bce9"; ctx.font = `${Math.max(10, 11 * scale)}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const offset = radius + 14;
    ctx.fillText("N", center, center - offset); ctx.fillText("S", center, center + offset);
    ctx.fillText("E", center - offset, center); ctx.fillText("W", center + offset, center);
    // Catalog stars sink to the rim; below-horizon bodies remain explicitly schematic.
    for (const star of geo.stars) {
      if (star.alt <= 0) continue;
      const p = dome(star); const dx = p.x - center; const dy = p.y - center; const distance = Math.hypot(dx, dy) || 1;
      ctx.globalAlpha = Math.pow(skyAlpha, 1.5) * Math.max(.25, Math.min(1, 1 - star.mag * .16)); ctx.fillStyle = MOONSTONE;
      circle(mix(p.x, center + dx / distance * 249 * scale, t), mix(p.y, center + dy / distance * 249 * scale, t), Math.max(.7, (2.4 - star.mag * .4) * scale)); ctx.fill();
    }
    ctx.globalAlpha = skyAlpha * .55; ctx.strokeStyle = "#b7bce9"; ctx.lineWidth = .75; ctx.beginPath(); let pen = false;
    for (const sample of geo.ecliptic) {
      if (sample.alt < 0) { pen = false; continue; }
      const p = dome(sample); if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true;
    }
    ctx.stroke();
    if (geo.asc) {
      const p = dome(geo.asc); ctx.globalAlpha = skyAlpha; ctx.strokeStyle = GILT; ctx.fillStyle = GILT;
      circle(p.x, p.y, 3); ctx.fill(); circle(p.x, p.y, 8); ctx.stroke();
      ctx.textAlign = p.x < center ? "left" : "right";
      const x = p.x < center ? p.x + 13 : p.x - 13;
      const y = Math.min(size - 20, Math.max(20, p.y + (p.y < center ? 18 : -18)));
      ctx.font = `${Math.max(9, 10 * scale)}px ${font}`; ctx.fillText(uk ? "АСЦЕНДЕНТ" : "RISING POINT", x, y);
    }
    const positions = geo.planets.map((planet, i) => {
      const from = dome(planet); const to = platePoint(labels[i], 127);
      // Each body reaches the actual separated SVG label at t=1.
      const phase = ease(clamp((t - i * .009) / (1 - i * .009)));
      return { x: mix(from.x, to.x, phase), y: mix(from.y, to.y, phase) };
    });
    hits.current = positions;
    element.dataset.planets = positions.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(";");
    const name = selected === null ? null : geo.planets[selected]?.name;
    for (const aspect of chart.aspects) {
      if (!name || (aspect.planet1 !== name && aspect.planet2 !== name)) continue;
      const i = geo.planets.findIndex(p => p.name === aspect.planet1); const j = geo.planets.findIndex(p => p.name === aspect.planet2);
      if (i < 0 || j < 0) continue;
      const a = positions[i]; const b = positions[j];
      ctx.globalAlpha = skyAlpha * .55; ctx.strokeStyle = GILT; ctx.lineWidth = .8;
      ctx.setLineDash(aspect.harmony === "tense" ? [3, 4] : []); ctx.beginPath(); ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mix((a.x + b.x) / 2, center, .08), mix((a.y + b.y) / 2, center, .08), b.x, b.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    const markerAlpha = 1 - ease(clamp((t - .82) / .18));
    geo.planets.forEach((planet, i) => {
      const p = positions[i]; ctx.globalAlpha = markerAlpha * (planet.alt < 0 ? .52 : 1);
      ctx.fillStyle = GILT; ctx.strokeStyle = GILT; ctx.lineWidth = .8;
      if (planet.name === "Moon") {
        circle(p.x, p.y, 8); ctx.stroke(); const phase = moonPathD(geo.phase, 8, p.x, p.y);
        if (phase) { ctx.fillStyle = MOONSTONE; ctx.fill(new Path2D(phase)); }
      } else { circle(p.x, p.y, planet.name === "Sun" ? 4.3 : 3); ctx.fill(); }
      if (selected === i) { circle(p.x, p.y, 13); ctx.stroke(); }
      ctx.fillStyle = MOONSTONE; ctx.font = `${Math.max(13, 15 * scale)}px serif`;
      ctx.textAlign = p.x > size - 38 ? "right" : "left";
      ctx.fillText(planet.glyph, p.x + (p.x > size - 38 ? -10 : 10), p.y - 8);
    });
    ctx.globalAlpha = 1;
  }, [chart, geo, labels, rotation, selected, size, t, uk]);

  const onCanvasUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const start = tapStart.current; tapStart.current = null;
    if (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8) return;
    const rect = event.currentTarget.getBoundingClientRect(); let nearest = -1; let distance = 24;
    hits.current.forEach((p, i) => {
      const d = Math.hypot(p.x - (event.clientX - rect.left), p.y - (event.clientY - rect.top));
      if (d < distance) { nearest = i; distance = d; }
    });
    if (nearest >= 0) onSelect(nearest);
  };
  const known = chart.timeKnown !== false;
  const chosen = selected === null ? null : geo.planets[selected];
  const location = chosen ? (uk ? `${UK_PLANETS[chosen.name]}: ${Math.abs(chosen.alt).toFixed(1)}° ${chosen.alt >= 0 ? "над горизонтом" : "під горизонтом"}.` : `${chosen.name}: ${Math.abs(chosen.alt).toFixed(1)}° ${chosen.alt >= 0 ? `above the ${DIRECTIONS[Math.round(chosen.az / 45) % 8]} horizon` : "below the horizon"}.`) : c("Select a planet below to locate it in the sky.", "Оберіть планету нижче, щоб знайти її на небі.");
  const plateOpacity = ease(clamp((t - .45) / .55));

  return <div className={styles.sky}>
    <div className={styles.surface} ref={wrap}>
      <div className={styles.plate} style={{ opacity: plateOpacity }} inert={t < 1} aria-hidden={t < 1}>{plate}</div>
      {t < 1 && <canvas ref={canvas} className={styles.canvas} role="img" aria-label={`${known ? "Birth sky" : "Illustrative local-noon sky"} over ${chart.input.city || "the birthplace"}. ${location} Named planet controls follow the image.`}
        onPointerDown={event => { tapStart.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={onCanvasUp} onPointerCancel={() => { tapStart.current = null; }} />}
    </div>
    <div className={styles.control}>
      <label htmlFor={`${id}-fold`}>{c("Sky", "Небо")} <span aria-hidden>→</span> {c("chart", "карта")}</label>
      <input id={`${id}-fold`} type="range" min="0" max="100" step="1" value={Math.round(t * 100)}
        aria-label={c("Fold the sky into your chart", "Перетворити небо на натальну карту")} aria-valuetext={t === 1 ? c("Chart unfolded on the page", "Натальна карта") : t === 0 ? c("The sky above the birthplace", "Небо над місцем народження") : `${Math.round(t * 100)} ${c("percent folded", "відсотків перетворення")}`}
        onPointerDown={() => { stop(); dragging.current = true; dragStart.current = progress.current; }}
        onChange={event => { stop(); const value = Number(event.target.value) / 100; update(value); if (!dragging.current && value === 1) land(1); }}
        onPointerUp={() => { dragging.current = false; if (progress.current >= .98) animateTo(1); }}
        onPointerCancel={() => { dragging.current = false; stop(); update(dragStart.current); }}
        onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); animateTo(progress.current < 1 ? 1 : 0); } }} />
      <button type="button" onClick={() => animateTo(t === 1 ? 0 : 1)}>{t === 1 ? c("Raise the sky ↑", "Повернутися до неба ↑") : c("Fold the sky ↓", "Перетворити на карту ↓")}</button>
    </div>
    <div className={styles.caption}>
      <p className={styles.location} aria-live="polite" aria-atomic="true">{t === 1 ? c("The sky, translated into a fixed zodiac scale.", "Небо, перенесене на незмінну шкалу зодіаку.") : location}</p>
      <p>{t === 1 ? c("The small dots hold the true longitudes. Fine lines separate overlapping symbols.", "Малі точки позначають точні довготи. Тонкі лінії розділяють символи, що накладаються.") : known ? (geo.sunUp ? c("A daytime sky: the stars are shown even though daylight would hide them.", "Денне небо: зорі показано, хоча сонячне світло приховувало б їх.") : c("A view looking up: north above, east to the left. The rim marks the horizon.", "Погляд угору: північ зверху, схід ліворуч. Коло позначає горизонт.")) : c("A local-noon illustration, not your known birth sky. No rising point is shown.", "Ілюстрація неба опівдні: точний час народження невідомий. Асцендент не показано.")}</p>
      {t < 1 && <p>{c("Dim points are below the horizon, placed schematically outside the rim. Lines show astrological relationships.", "Тьмяні точки перебувають під горизонтом і умовно винесені за коло. Лінії позначають астрологічні зв’язки.")}</p>}
    </div>
  </div>;
}
