/**
 * The birth chart as an engraved wheel: the zodiac band, whole-sign house
 * numbers, the planets with leader lines to their exact degree, the angles
 * in gold and the closest aspects as chords. Rising sign on the left, as
 * charts are traditionally drawn; 0° Aries on the left without a birth time.
 */

import { BODY_GLYPHS, SIGN_GLYPHS } from "@/lib/astrology/chart.js";
import type { AspectFound, Placement } from "@/lib/astrology/types";
import styles from "./astrology.module.css";

const C = 320;
const R = { outer: 300, band: 256, tick: 250, house: 236, planet: 196, chord: 150 };
const TEXT = "︎"; // text presentation, so glyphs never turn into emoji
const HARMONIOUS = new Set(["trine", "sextile"]);

type Props = {
  bodies: Placement[];
  ascendant: Placement | null;
  midheaven: Placement | null;
  aspects: AspectFound[];
  title: string;
  description: string;
};

export default function ChartWheel({ bodies, ascendant, midheaven, aspects, title, description }: Props) {
  const start = ascendant?.longitude ?? 0;
  const point = (longitude: number, radius: number) => {
    const angle = Math.PI + ((longitude - start) * Math.PI) / 180;
    return { x: C + radius * Math.cos(angle), y: C - radius * Math.sin(angle) };
  };
  const spread = spreadLongitudes(bodies.map((body) => body.longitude), 7.5);
  const byKey = new Map([...bodies, ...(ascendant ? [ascendant] : []), ...(midheaven ? [midheaven] : [])].map((p) => [p.key, p]));

  return (
    <svg className={styles.wheel} viewBox="0 0 640 640" role="img" aria-labelledby="wheel-title wheel-desc">
      <title id="wheel-title">{title}</title>
      <desc id="wheel-desc">{description}</desc>

      <g className={styles.wheelRings}>
        <circle cx={C} cy={C} r={R.outer} />
        <circle cx={C} cy={C} r={R.outer - 5} className={styles.wheelFaint} />
        <circle cx={C} cy={C} r={R.band} />
        <circle cx={C} cy={C} r={R.chord} className={styles.wheelFaint} />
      </g>

      <g className={styles.wheelSigns}>
        {SIGN_GLYPHS.map((glyph, i) => {
          const edgeA = point(i * 30, R.outer - 5);
          const edgeB = point(i * 30, R.band);
          const label = point(i * 30 + 15, (R.outer - 5 + R.band) / 2);
          return (
            <g key={glyph}>
              <line x1={edgeA.x} y1={edgeA.y} x2={edgeB.x} y2={edgeB.y} />
              <text x={label.x} y={label.y} dominantBaseline="central" textAnchor="middle">{glyph + TEXT}</text>
            </g>
          );
        })}
        {Array.from({ length: 72 }, (_, i) => {
          const a = point(i * 5, R.band);
          const b = point(i * 5, i % 6 === 0 ? R.band - 9 : R.band - 5);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className={styles.wheelFaint} />;
        })}
      </g>

      {ascendant && (
        <g className={styles.wheelHouses} aria-hidden>
          {Array.from({ length: 12 }, (_, i) => {
            const at = point((ascendant.index + i) * 30 + 15, R.house);
            return <text key={i} x={at.x} y={at.y} dominantBaseline="central" textAnchor="middle">{i + 1}</text>;
          })}
        </g>
      )}

      <g className={styles.wheelAspects}>
        {aspects.filter((found) => found.aspect !== "conjunction").slice(0, 12).map((found) => {
          const a = byKey.get(found.a), b = byKey.get(found.b);
          if (!a || !b) return null;
          const p = point(a.longitude, R.chord), q = point(b.longitude, R.chord);
          return <line key={`${found.a}-${found.b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} className={HARMONIOUS.has(found.aspect) ? styles.chordEase : styles.chordTension} />;
        })}
      </g>

      {ascendant && midheaven && (
        <g className={styles.wheelAngles}>
          {[ascendant, midheaven].map((angle) => {
            const a = point(angle.longitude, R.outer + 8);
            const b = point(angle.longitude + 180, R.outer);
            const label = point(angle.longitude, R.outer + 22);
            return (
              <g key={angle.key}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <text x={label.x} y={label.y} dominantBaseline="central" textAnchor="middle">{BODY_GLYPHS[angle.key]}</text>
              </g>
            );
          })}
        </g>
      )}

      <g className={styles.wheelBodies}>
        {bodies.map((body, i) => {
          const exact = point(body.longitude, R.tick);
          const elbow = point(spread[i], R.planet + 20);
          const glyph = point(spread[i], R.planet);
          return (
            <g key={body.key}>
              <polyline points={`${exact.x},${exact.y} ${point(body.longitude, R.tick - 10).x},${point(body.longitude, R.tick - 10).y} ${elbow.x},${elbow.y}`} />
              <circle cx={exact.x} cy={exact.y} r={2} />
              <text x={glyph.x} y={glyph.y} dominantBaseline="central" textAnchor="middle">
                {BODY_GLYPHS[body.key] + TEXT}
                {body.retrograde && <tspan className={styles.wheelRetro} dx={2} dy={6}>r</tspan>}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** Nudges crowded glyphs apart so none sit closer than `gap` degrees; keeps order. */
function spreadLongitudes(longitudes: number[], gap: number): number[] {
  const order = longitudes.map((lon, i) => ({ lon, i })).sort((a, b) => a.lon - b.lon);
  const shown = order.map((entry) => entry.lon);
  for (let pass = 0; pass < 40; pass++) {
    let moved = false;
    for (let k = 0; k < shown.length; k++) {
      const next = (k + 1) % shown.length;
      let distance = shown[next] - shown[k];
      if (next === 0) distance += 360;
      if (distance < gap) {
        const push = (gap - distance) / 2;
        shown[k] -= push;
        shown[next] += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const result = new Array<number>(longitudes.length);
  order.forEach((entry, k) => { result[entry.i] = shown[k]; });
  return result;
}
