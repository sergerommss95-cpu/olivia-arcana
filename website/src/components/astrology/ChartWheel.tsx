"use client";

/**
 * The birth chart dealt in cards. The twelve signs are their Major Arcana
 * cards, upright around the wheel; the Sun, Moon and Rising cards are
 * lifted in gold. Inside lies the real sky around the ecliptic (stars,
 * constellations and the Milky Way, seen from above the ecliptic pole so
 * they share the wheel's longitudes), a thin ivory degree ring, the planets
 * as pearl medallions (the Sun gold), gold pointers for the Ascendant and
 * Midheaven and threads for the closest aspects. Rising sign on the left,
 * as charts are drawn; 0° Aries on the left without a birth time.
 */

import { useId, useMemo, useState } from "react";
import { BODY_GLYPHS, SIGN_GLYPHS } from "@/lib/astrology/chart.js";
import { CONSTELLATIONS, STARS, fieldStars, milkyWay } from "@/lib/star-chart";
import type { AspectFound, Placement } from "@/lib/astrology/types";
import styles from "./astrology.module.css";

const C = 400;
const R = { cards: 345, seal: 256, scaleOut: 240, scaleIn: 228, house: 214, planet: 182, chord: 140, sky: 226, pointer: 440 };
// 86 × 147 at radius 345: neighbours never overlap, whatever the rotation.
const CARD = { w: 86, h: 147 };
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
  const stars = STARS.map((s) => ({ ...toEcliptic(s.ra, s.dec), r: Math.max(0.7, 2.6 - 0.55 * s.mag), bright: s.mag < 1.2 }));
  const lines = CONSTELLATIONS.flatMap((c) => c.lines.filter((run) => run.length > 1).map((run) => run.map((i) => ({ lon: stars[i].lon, lat: stars[i].lat }))));
  const milky = milkyWay(2200).map((m) => ({ ...toEcliptic(m.ra, m.dec), w: m.w }));
  const field = fieldStars(360).map((m) => ({ ...toEcliptic(m.ra, m.dec), w: m.w }));
  skyCache = { stars, lines, milky, field };
  return skyCache;
}

export type WheelCard = { image: string; href: string; name: string };

type Props = {
  bodies: Placement[];
  ascendant: Placement | null;
  midheaven: Placement | null;
  aspects: AspectFound[];
  /** The twelve sign cards, Aries first. */
  signCards: WheelCard[];
  title: string;
  description: string;
  /** Short hover label per body key, e.g. "Venus in Taurus · 18°47′". */
  labels: Record<string, string>;
};

export default function ChartWheel({ bodies, ascendant, midheaven, aspects, signCards, title, description, labels }: Props) {
  const uid = useId().replace(/:/g, "");
  const [focus, setFocus] = useState<string | null>(null);
  const start = ascendant?.longitude ?? 0;
  const point = (longitude: number, radius: number) => {
    const angle = Math.PI + (longitude - start) * DEG;
    return { x: C + radius * Math.cos(angle), y: C - radius * Math.sin(angle) };
  };
  const skyPoint = (lon: number, lat: number) => point(lon, (R.sky * (90 - lat)) / 90);
  const stars = sky();
  const spread = useMemo(() => spreadLongitudes(bodies.map((b) => b.longitude), 12), [bodies]);
  const byKey = new Map([...bodies, ...(ascendant ? [ascendant] : []), ...(midheaven ? [midheaven] : [])].map((p) => [p.key, p]));
  const shown = aspects.filter((found) => found.aspect !== "conjunction").slice(0, 12);
  const f = (n: number) => n.toFixed(1);

  // Which signs hold the Sun, the Moon and the Rising point.
  const roles = new Map<number, string[]>();
  const mark = (index: number, glyph: string) => roles.set(index, [...(roles.get(index) ?? []), glyph]);
  const sun = bodies.find((b) => b.key === "sun"), moon = bodies.find((b) => b.key === "moon");
  if (sun) mark(sun.index, "☉");
  if (moon) mark(moon.index, "☽");
  if (ascendant) mark(ascendant.index, "AC");
  // Deal from the Rising sign (or Aries) round the wheel.
  const dealFrom = ascendant?.index ?? 0;

  return (
    <svg className={styles.wheel} viewBox="-80 -80 960 960" role="img" aria-labelledby={`${uid}-t ${uid}-d`} data-focus={focus ? "" : undefined}>
      <title id={`${uid}-t`}>{title}</title>
      <desc id={`${uid}-d`}>{description}</desc>
      <defs>
        <radialGradient id={`${uid}-night`} cx="50%" cy="46%" r="60%">
          <stop offset="0" stopColor="#173451" />
          <stop offset="0.7" stopColor="#0c1f33" />
          <stop offset="1" stopColor="#071522" />
        </radialGradient>
        <radialGradient id={`${uid}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0.55" stopColor="#1a3a58" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0b192a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${uid}-ivory`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbf4e3" />
          <stop offset="0.5" stopColor="#e7d8b6" />
          <stop offset="1" stopColor="#bfa87e" />
        </linearGradient>
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
          <stop offset="0" stopColor="#e6cf9e" stopOpacity="0.45" />
          <stop offset="1" stopColor="#e6cf9e" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`${uid}-disc`}><circle cx={C} cy={C} r={R.sky} /></clipPath>
        <clipPath id={`${uid}-card`}><rect x={-CARD.w / 2} y={-CARD.h / 2} width={CARD.w} height={CARD.h} rx={6} /></clipPath>
      </defs>

      {/* A soft pool of light under the whole wheel */}
      <circle cx={C} cy={C} r={450} fill={`url(#${uid}-glow)`} aria-hidden />

      {/* Sector lines between the cards, from the degree ring out */}
      <g className={styles.sectorLines} aria-hidden>
        {SIGN_GLYPHS.map((_, i) => {
          const a = point(i * 30, R.scaleOut), b = point(i * 30, R.pointer - 16);
          return <line key={i} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} />;
        })}
        <circle cx={C} cy={C} r={R.pointer - 16} />
      </g>

      {/* The twelve sign cards, dealt round the wheel */}
      <g className={styles.deal}>
        {signCards.map((card, i) => {
          const at = point(i * 30 + 15, R.cards);
          const role = roles.get(i);
          const order = (i - dealFrom + 12) % 12;
          return (
            <a key={i} href={card.href} className={`${styles.wheelCard} ${role ? styles.wheelCardLit : ""}`} style={{ animationDelay: `${0.15 + order * 0.09}s` }} aria-label={card.name}>
              <g transform={`translate(${f(at.x)} ${f(at.y)})`}>
                {role && <ellipse cx={0} cy={0} rx={CARD.w * 0.95} ry={CARD.h * 0.72} fill={`url(#${uid}-halo)`} />}
                <image href={card.image} x={-CARD.w / 2} y={-CARD.h / 2} width={CARD.w} height={CARD.h} clipPath={`url(#${uid}-card)`} preserveAspectRatio="xMidYMid slice" />
                <rect x={-CARD.w / 2} y={-CARD.h / 2} width={CARD.w} height={CARD.h} rx={6} className={styles.cardEdge} />
                {role && (
                  <g transform={`translate(0 ${-CARD.h / 2 - 2})`} className={styles.roleChip}>
                    <rect x={-role.length * 11 - 6} y={-11} width={role.length * 22 + 12} height={22} rx={11} />
                    <text x={0} y={0}>{role.map((glyph) => glyph + TEXT).join(" ")}</text>
                  </g>
                )}
              </g>
            </a>
          );
        })}
      </g>

      {/* Sign seals between cards and sky */}
      <g className={styles.seals} aria-hidden>
        {SIGN_GLYPHS.map((glyph, i) => {
          const at = point(i * 30 + 15, R.seal);
          return (
            <g key={glyph} transform={`translate(${f(at.x)} ${f(at.y)})`}>
              <circle r={12} />
              <text x={0} y={0.5}>{glyph + TEXT}</text>
            </g>
          );
        })}
      </g>

      {/* Night: the disc and the real stars around the ecliptic */}
      <circle cx={C} cy={C} r={R.sky} fill={`url(#${uid}-night)`} />
      <g className={styles.sky} clipPath={`url(#${uid}-disc)`} aria-hidden>
        <g className={styles.milky}>
          {stars.milky.map((m, i) => { const p = skyPoint(m.lon, m.lat); return <circle key={i} cx={f(p.x)} cy={f(p.y)} r={1.3} opacity={f(0.05 + 0.12 * m.w)} />; })}
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

      {/* Thin carved ivory degree ring */}
      <g className={styles.scale}>
        <path d={`M ${C - R.scaleOut},${C} a ${R.scaleOut},${R.scaleOut} 0 1,0 ${R.scaleOut * 2},0 a ${R.scaleOut},${R.scaleOut} 0 1,0 ${-R.scaleOut * 2},0 M ${C - R.scaleIn},${C} a ${R.scaleIn},${R.scaleIn} 0 1,1 ${R.scaleIn * 2},0 a ${R.scaleIn},${R.scaleIn} 0 1,1 ${-R.scaleIn * 2},0 Z`}
          fill={`url(#${uid}-ivory)`} fillRule="evenodd" className={styles.scaleBand} />
        {Array.from({ length: 72 }, (_, k) => {
          const d = k * 5, major = d % 30 === 0;
          const a = point(d, R.scaleIn), b = point(d, major ? R.scaleOut : R.scaleIn + (d % 10 === 0 ? 8 : 5));
          return <line key={d} x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} className={major ? styles.tickMajor : styles.tick} />;
        })}
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
      <g className={styles.threads}>
        {shown.map((found, i) => {
          const a = byKey.get(found.a), b = byKey.get(found.b);
          if (!a || !b) return null;
          const p = point(a.longitude, R.chord), q = point(b.longitude, R.chord);
          const lit = !focus || found.a === focus || found.b === focus;
          return <line key={`${found.a}-${found.b}`} x1={f(p.x)} y1={f(p.y)} x2={f(q.x)} y2={f(q.y)} pathLength={1}
            className={`${HARMONIOUS.has(found.aspect) ? styles.threadEase : styles.threadTension} ${lit ? "" : styles.dim}`} style={{ animationDelay: `${1.6 + i * 0.07}s` }} />;
        })}
      </g>

      {/* Houses, in Roman numerals, when the time is known */}
      {ascendant && (
        <g className={styles.houses} aria-hidden>
          {ROMAN.map((numeral, i) => {
            const at = point((ascendant.index + i) * 30 + 15, R.house);
            return <text key={numeral} x={f(at.x)} y={f(at.y)}>{numeral}</text>;
          })}
        </g>
      )}

      {/* Ascendant and Midheaven: gold pointers outside the cards and through the sky */}
      {ascendant && midheaven && (
        <g className={styles.angles}>
          {[ascendant, midheaven].map((angle) => {
            const tip = point(angle.longitude, R.pointer - 14), tipL = point(angle.longitude - 1.5, R.pointer), tipR = point(angle.longitude + 1.5, R.pointer);
            const inA = point(angle.longitude, R.scaleIn), inB = point(angle.longitude, 44);
            const far = point(angle.longitude + 180, 44), farB = point(angle.longitude + 180, R.scaleIn);
            const label = point(angle.longitude, R.pointer + 18);
            return (
              <g key={angle.key}>
                <path d={`M${f(tip.x)},${f(tip.y)} L${f(tipL.x)},${f(tipL.y)} L${f(tipR.x)},${f(tipR.y)} Z`} className={styles.pointer} />
                <line x1={f(inA.x)} y1={f(inA.y)} x2={f(inB.x)} y2={f(inB.y)} />
                <line x1={f(far.x)} y1={f(far.y)} x2={f(farB.x)} y2={f(farB.y)} className={styles.angleFaint} />
                <text x={f(label.x)} y={f(label.y)}>{angle.key === "ascendant" ? "ASC" : "MC"}</text>
              </g>
            );
          })}
        </g>
      )}

      {/* Planets: pearl medallions (the Sun gold) with a thread to their exact degree */}
      <g className={styles.planets}>
        {bodies.map((body, i) => {
          const exact = point(body.longitude, R.scaleIn);
          const knee = point(body.longitude, R.scaleIn - 10);
          const at = point(spread[i], R.planet);
          const near = point(spread[i], R.planet + 15);
          const fill = body.key === "sun" ? `url(#${uid}-gold)` : `url(#${uid}-pearl)`;
          const active = focus === body.key;
          return (
            <g key={body.key} className={`${styles.planet} ${active ? styles.planetActive : ""}`} style={{ animationDelay: `${1.2 + i * 0.06}s` }}
              onMouseEnter={() => setFocus(body.key)} onMouseLeave={() => setFocus(null)}>
              <polyline points={`${f(exact.x)},${f(exact.y)} ${f(knee.x)},${f(knee.y)} ${f(near.x)},${f(near.y)}`} className={styles.leader} />
              <circle cx={f(exact.x)} cy={f(exact.y)} r={2.2} className={styles.degreeMark} />
              {body.key === "sun" && <circle cx={f(at.x)} cy={f(at.y)} r={30} fill={`url(#${uid}-halo)`} />}
              <circle cx={f(at.x)} cy={f(at.y)} r={14} fill={fill} className={styles.medallion} />
              <text x={f(at.x)} y={f(at.y + 0.5)} className={styles.planetGlyph}>{BODY_GLYPHS[body.key] + TEXT}</text>
              {body.retrograde && <text x={f(at.x + 12)} y={f(at.y + 12)} className={styles.retro}>R</text>}
              {active && labels[body.key] && (() => {
                const tag = point(spread[i], R.planet - 32);
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
