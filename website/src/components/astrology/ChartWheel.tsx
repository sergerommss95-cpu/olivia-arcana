"use client";

/**
 * The birth chart as an astrolabe, in the deck's language of ivory relief
 * on lapis. The zodiac is a carved ivory ring; behind it lie the real stars
 * around the ecliptic (seen from above its north pole, so they share the
 * wheel's longitudes, with the Milky Way crossing at Gemini and
 * Sagittarius). Planets are ivory medallions, the Sun gold; gold pointers
 * mark the Ascendant and Midheaven; threads join the closest aspects.
 * Rising sign on the left, as charts are drawn; 0° Aries without a time.
 */

import { useId, useMemo, useState } from "react";
import { BODY_GLYPHS, SIGN_GLYPHS } from "@/lib/astrology/chart.js";
import { CONSTELLATIONS, STARS, fieldStars, milkyWay } from "@/lib/star-chart";
import type { AspectFound, Placement } from "@/lib/astrology/types";
import styles from "./astrology.module.css";

const C = 360;
const R = { rim: 344, bandOut: 330, bandIn: 276, house: 258, planet: 212, chord: 158, sky: 272 };
const TEXT = "︎"; // text presentation: glyphs never become emoji
const HARMONIOUS = new Set(["trine", "sextile"]);
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const DEG = Math.PI / 180;
const EPS = 23.4393 * DEG;

/** J2000 RA (hours) / Dec (degrees) → ecliptic longitude and latitude, degrees. */
function toEcliptic(raHours: number, decDeg: number) {
  const a = raHours * 15 * DEG, d = decDeg * DEG;
  const beta = Math.asin(Math.sin(d) * Math.cos(EPS) - Math.cos(d) * Math.sin(EPS) * Math.sin(a));
  const lambda = Math.atan2(Math.sin(a) * Math.cos(EPS) + Math.tan(d) * Math.sin(EPS), Math.cos(a));
  return { lon: ((lambda / DEG) % 360 + 360) % 360, lat: beta / DEG };
}

type Sky = { stars: { lon: number; lat: number; r: number; bright: boolean }[]; lines: { lon: number; lat: number }[][]; milky: { lon: number; lat: number; w: number }[]; field: { lon: number; lat: number; w: number }[] };
let skyCache: Sky | null = null;
function sky(): Sky {
  if (skyCache) return skyCache;
  const stars = STARS.map((s) => ({ ...toEcliptic(s.ra, s.dec), r: Math.max(0.7, 2.7 - 0.55 * s.mag), bright: s.mag < 1.2 }));
  const lines = CONSTELLATIONS.flatMap((c) => c.lines.filter((run) => run.length > 1).map((run) => run.map((i) => ({ lon: stars[i].lon, lat: stars[i].lat }))));
  const milky = milkyWay(2200).map((m) => ({ ...toEcliptic(m.ra, m.dec), w: m.w }));
  const field = fieldStars(360).map((m) => ({ ...toEcliptic(m.ra, m.dec), w: m.w }));
  skyCache = { stars, lines, milky, field };
  return skyCache;
}

type Props = {
  bodies: Placement[];
  ascendant: Placement | null;
  midheaven: Placement | null;
  aspects: AspectFound[];
  title: string;
  description: string;
  /** Short hover label per body key, e.g. "Venus in Taurus · 18°47′". */
  labels: Record<string, string>;
};

export default function ChartWheel({ bodies, ascendant, midheaven, aspects, title, description, labels }: Props) {
  const uid = useId().replace(/:/g, "");
  const [focus, setFocus] = useState<string | null>(null);
  const start = ascendant?.longitude ?? 0;
  const point = (longitude: number, radius: number) => {
    const angle = Math.PI + (longitude - start) * DEG;
    return { x: C + radius * Math.cos(angle), y: C - radius * Math.sin(angle) };
  };
  /** Ecliptic north pole at the centre, the ecliptic at the inner edge of the ivory ring. */
  const skyPoint = (lon: number, lat: number) => point(lon, (R.sky * (90 - lat)) / 90);
  const stars = sky();
  const spread = useMemo(() => spreadLongitudes(bodies.map((b) => b.longitude), 10.5), [bodies]);
  const byKey = new Map([...bodies, ...(ascendant ? [ascendant] : []), ...(midheaven ? [midheaven] : [])].map((p) => [p.key, p]));
  const shown = aspects.filter((found) => found.aspect !== "conjunction").slice(0, 12);
  const f = (n: number) => n.toFixed(1);

  return (
    <svg className={styles.wheel} viewBox="-28 -28 776 776" role="img" aria-labelledby={`${uid}-t ${uid}-d`} data-focus={focus ? "" : undefined}>
      <title id={`${uid}-t`}>{title}</title>
      <desc id={`${uid}-d`}>{description}</desc>
      <defs>
        <radialGradient id={`${uid}-night`} cx="50%" cy="46%" r="60%">
          <stop offset="0" stopColor="#15304a" />
          <stop offset="0.7" stopColor="#0b1e31" />
          <stop offset="1" stopColor="#071522" />
        </radialGradient>
        <radialGradient id={`${uid}-ivory`} cx="38%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fbf4e3" />
          <stop offset="0.55" stopColor="#eadcbc" />
          <stop offset="1" stopColor="#c9b58d" />
        </radialGradient>
        <radialGradient id={`${uid}-pearl`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.6" stopColor="#e9dcc0" />
          <stop offset="1" stopColor="#bca885" />
        </radialGradient>
        <radialGradient id={`${uid}-gold`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#f6e6bd" />
          <stop offset="0.6" stopColor="#d7bd83" />
          <stop offset="1" stopColor="#9c7f4c" />
        </radialGradient>
        <radialGradient id={`${uid}-halo`}>
          <stop offset="0" stopColor="#e6cf9e" stopOpacity="0.35" />
          <stop offset="1" stopColor="#e6cf9e" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-disc`}><circle cx={C} cy={C} r={R.bandIn - 1} /></clipPath>
      </defs>

      {/* Night: the disc and the real stars around the ecliptic */}
      <circle cx={C} cy={C} r={R.bandIn} fill={`url(#${uid}-night)`} />
      <g className={styles.sky} clipPath={`url(#${uid}-disc)`} aria-hidden>
        <g className={styles.milky}>
          {stars.milky.map((m, i) => { const p = skyPoint(m.lon, m.lat); return <circle key={i} cx={f(p.x)} cy={f(p.y)} r={1.4} opacity={f(0.05 + 0.12 * m.w)} />; })}
        </g>
        <g className={styles.field}>
          {stars.field.map((m, i) => { const p = skyPoint(m.lon, m.lat); return <circle key={i} cx={f(p.x)} cy={f(p.y)} r={f(0.35 + 0.45 * m.w)} />; })}
        </g>
        <g className={styles.constellations}>
          {stars.lines.map((run, i) => <polyline key={i} points={run.map((s) => { const p = skyPoint(s.lon, s.lat); return `${f(p.x)},${f(p.y)}`; }).join(" ")} />)}
        </g>
        <g className={styles.stars}>
          {stars.stars.map((s, i) => { const p = skyPoint(s.lon, s.lat); return <circle key={i} cx={f(p.x)} cy={f(p.y)} r={f(s.r)} className={s.bright ? styles.twinkle : undefined} style={s.bright ? { animationDelay: `${(i % 7) * 0.9}s` } : undefined} />; })}
        </g>
      </g>

      {/* The rosette at the ecliptic pole: straight and wavy rays, as on the deck's Sun and Moon */}
      <g className={styles.rosette} aria-hidden>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i * 22.5) * DEG, long = i % 2 === 0, len = long ? 34 : 22;
          const x2 = C + len * Math.cos(a), y2 = C - len * Math.sin(a);
          if (long) return <line key={i} x1={C} y1={C} x2={f(x2)} y2={f(y2)} />;
          const mx = C + (len / 2) * Math.cos(a) + 3 * Math.cos(a + Math.PI / 2), my = C - (len / 2) * Math.sin(a) - 3 * Math.sin(a + Math.PI / 2);
          return <path key={i} d={`M${C},${C} Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}`} />;
        })}
        <circle cx={C} cy={C} r={4} />
      </g>

      {/* Aspect threads */}
      <circle cx={C} cy={C} r={R.chord} className={styles.chordRing} />
      <g className={styles.threads}>
        {shown.map((found, i) => {
          const a = byKey.get(found.a), b = byKey.get(found.b);
          if (!a || !b) return null;
          const p = point(a.longitude, R.chord), q = point(b.longitude, R.chord);
          const lit = !focus || found.a === focus || found.b === focus;
          return <line key={`${found.a}-${found.b}`} x1={f(p.x)} y1={f(p.y)} x2={f(q.x)} y2={f(q.y)} pathLength={1}
            className={`${HARMONIOUS.has(found.aspect) ? styles.threadEase : styles.threadTension} ${lit ? "" : styles.dim}`} style={{ animationDelay: `${1.3 + i * 0.07}s` }} />;
        })}
      </g>

      {/* The carved ivory zodiac */}
      <g className={styles.rete}>
        <circle cx={C} cy={C} r={R.rim} className={styles.rimLine} />
        <circle cx={C} cy={C} r={R.rim - 5} className={styles.rimFaint} />
        <path d={`M ${C - R.bandOut},${C} a ${R.bandOut},${R.bandOut} 0 1,0 ${R.bandOut * 2},0 a ${R.bandOut},${R.bandOut} 0 1,0 ${-R.bandOut * 2},0 M ${C - R.bandIn},${C} a ${R.bandIn},${R.bandIn} 0 1,1 ${R.bandIn * 2},0 a ${R.bandIn},${R.bandIn} 0 1,1 ${-R.bandIn * 2},0 Z`}
          fill={`url(#${uid}-ivory)`} fillRule="evenodd" className={styles.band} />
        <circle cx={C} cy={C} r={R.bandOut - 0.8} className={styles.bevelLight} />
        <circle cx={C} cy={C} r={R.bandIn + 0.8} className={styles.bevelDark} />
        <circle cx={C} cy={C} r={R.bandIn + 11} className={styles.groove} />
        {Array.from({ length: 360 }, (_, d) => {
          if (d % 30 === 0) return null;
          const a = point(d, R.bandIn + 1), b = point(d, R.bandIn + (d % 10 === 0 ? 10 : d % 5 === 0 ? 7 : 4));
          return <line key={d} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} className={d % 5 === 0 ? styles.tickMajor : styles.tick} />;
        })}
        {SIGN_GLYPHS.map((glyph, i) => {
          const a = point(i * 30, R.bandIn), b = point(i * 30, R.bandOut);
          const label = point(i * 30 + 15, (R.bandOut + R.bandIn + 11) / 2);
          return (
            <g key={glyph}>
              <line x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} className={styles.carve} />
              <line x1={f(a.x + 0.9)} y1={f(a.y + 0.9)} x2={f(b.x + 0.9)} y2={f(b.y + 0.9)} className={styles.carveLight} />
              <text x={f(label.x + 0.9)} y={f(label.y + 0.9)} className={styles.glyphLight}>{glyph + TEXT}</text>
              <text x={f(label.x)} y={f(label.y)} className={styles.glyphCarved}>{glyph + TEXT}</text>
            </g>
          );
        })}
      </g>

      {/* Houses, in Roman numerals, when the time is known */}
      {ascendant && (
        <g className={styles.houses} aria-hidden>
          <circle cx={C} cy={C} r={R.house - 10} className={styles.rimFaint} />
          {ROMAN.map((numeral, i) => {
            const at = point((ascendant.index + i) * 30 + 15, R.house);
            const edge = point((ascendant.index + i) * 30, R.house - 10), edge2 = point((ascendant.index + i) * 30, R.bandIn);
            return (
              <g key={numeral}>
                <line x1={f(edge.x)} y1={f(edge.y)} x2={f(edge2.x)} y2={f(edge2.y)} className={styles.rimFaint} />
                <text x={f(at.x)} y={f(at.y)}>{numeral}</text>
              </g>
            );
          })}
        </g>
      )}

      {/* Ascendant and Midheaven: gold pointers from rim to rim, parted at the rosette */}
      {ascendant && midheaven && (
        <g className={styles.angles}>
          {[ascendant, midheaven].map((angle) => {
            const outer = point(angle.longitude, R.rim + 12), inner = point(angle.longitude, 44);
            const back = point(angle.longitude + 180, 44), far = point(angle.longitude + 180, R.bandIn);
            const label = point(angle.longitude, R.rim + 12 + 14);
            const tipL = point(angle.longitude - 1.6, R.rim - 2), tipR = point(angle.longitude + 1.6, R.rim - 2);
            return (
              <g key={angle.key}>
                <line x1={f(outer.x)} y1={f(outer.y)} x2={f(inner.x)} y2={f(inner.y)} />
                <line x1={f(back.x)} y1={f(back.y)} x2={f(far.x)} y2={f(far.y)} className={styles.angleFaint} />
                <path d={`M${f(outer.x)},${f(outer.y)} L${f(tipL.x)},${f(tipL.y)} L${f(tipR.x)},${f(tipR.y)} Z`} className={styles.pointer} />
                <text x={f(label.x)} y={f(label.y)}>{angle.key === "ascendant" ? "ASC" : "MC"}</text>
              </g>
            );
          })}
        </g>
      )}

      {/* Planets: ivory medallions (the Sun in gold) with a thread to their exact degree */}
      <g className={styles.planets}>
        {bodies.map((body, i) => {
          const exact = point(body.longitude, R.bandIn - 1);
          const knee = point(body.longitude, R.bandIn - 14);
          const at = point(spread[i], R.planet);
          const near = point(spread[i], R.planet + 16);
          const fill = body.key === "sun" ? `url(#${uid}-gold)` : `url(#${uid}-pearl)`;
          const active = focus === body.key;
          return (
            <g key={body.key} className={`${styles.planet} ${active ? styles.planetActive : ""}`} style={{ animationDelay: `${0.9 + i * 0.06}s` }}
              onMouseEnter={() => setFocus(body.key)} onMouseLeave={() => setFocus(null)}>
              <polyline points={`${f(exact.x)},${f(exact.y)} ${f(knee.x)},${f(knee.y)} ${f(near.x)},${f(near.y)}`} className={styles.leader} />
              <circle cx={f(exact.x)} cy={f(exact.y)} r={2.2} className={styles.degreeMark} />
              {body.key === "sun" && <circle cx={f(at.x)} cy={f(at.y)} r={30} fill={`url(#${uid}-halo)`} />}
              <circle cx={f(at.x)} cy={f(at.y)} r={15} fill={fill} className={styles.medallion} />
              <text x={f(at.x)} y={f(at.y + 0.5)} className={styles.planetGlyph}>{BODY_GLYPHS[body.key] + TEXT}</text>
              {body.retrograde && <text x={f(at.x + 13)} y={f(at.y + 13)} className={styles.retro}>R</text>}
              {active && labels[body.key] && (() => {
                const tag = point(spread[i], R.planet - 34);
                return <text x={f(tag.x)} y={f(tag.y)} className={styles.tag}>{labels[body.key]}</text>;
              })()}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** Nudges crowded medallions apart so none sit closer than `gap` degrees; keeps order. */
function spreadLongitudes(longitudes: number[], gap: number): number[] {
  const order = longitudes.map((lon, i) => ({ lon, i })).sort((a, b) => a.lon - b.lon);
  const shown = order.map((entry) => entry.lon);
  for (let pass = 0; pass < 60; pass++) {
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
