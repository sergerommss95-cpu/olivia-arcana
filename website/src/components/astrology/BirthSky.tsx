"use client";

/**
 * The sky you were born under: the real sky over the birthplace at the
 * moment of birth, drawn as a star map held overhead (north at the top, east
 * on the left), in the deck's materials: a lapis disc, engraved stars, the
 * constellations named, the ecliptic, and whichever planets were above the
 * horizon, the Sun as the Star card's gold star. Beside it, the Moon's phase
 * that night. Daylight and twilight are said plainly: the stars were there,
 * hidden or half-hidden.
 */

import { useId, useMemo } from "react";
import { BODY_GLYPHS, moonNow } from "@/lib/astrology/chart.js";
import { CONSTELLATIONS, STARS, eclipticToEquatorial, fieldStars, lst, milkyWay, project } from "@/lib/star-chart";
import type { Placement } from "@/lib/astrology/types";
import MoonDisc from "./MoonDisc";
import styles from "./astrology.module.css";

const C = 500, R = 440;
const TEXT = "︎";
const f = (n: number) => n.toFixed(1);

const UI = {
  en: {
    title: "The sky you were born under",
    lead: "The real sky over your birthplace at the moment you were born, as if you lay on your back and looked up: north at the top, east on the left.",
    day: "The Sun was up, so these stars were there but hidden by daylight.",
    twilight: "You were born in twilight, as the first or last stars showed.",
    night: "You were born at night, under these stars.",
    noTime: "Without a birth time the sky is drawn for midday, so read it as a sketch.",
    moon: (phase: string, lit: number) => `The Moon when you were born: ${phase.toLowerCase()}, ${lit}% lit.`,
    above: "Above the horizon", below: "Below the horizon", none: "None",
    directions: ["N", "E", "S", "W"],
    label: (place: string) => `The sky over ${place} at the moment of birth`,
    phases: { new: "New Moon", "waxing-crescent": "Waxing crescent", "first-quarter": "First quarter", "waxing-gibbous": "Waxing gibbous", full: "Full Moon", "waning-gibbous": "Waning gibbous", "last-quarter": "Last quarter", "waning-crescent": "Waning crescent" } as Record<string, string>,
  },
  uk: {
    title: "Небо, під яким ви народилися",
    lead: "Справжнє небо над місцем вашого народження в ту мить, коли ви з’явилися на світ, ніби ви лежите на спині й дивитеся вгору: північ угорі, схід ліворуч.",
    day: "Сонце було над обрієм, тож ці зорі були на місці, але їх ховало денне світло.",
    twilight: "Ви народилися в сутінках, коли з’являлися або згасали перші зорі.",
    night: "Ви народилися вночі, під цими зорями.",
    noTime: "Без часу народження небо намальоване на полудень, тож сприймайте його як ескіз.",
    moon: (phase: string, lit: number) => `Місяць у мить вашого народження: ${phase.toLowerCase()}, освітлено ${lit}%.`,
    above: "Над обрієм", below: "Під обрієм", none: "Жодної",
    directions: ["Пн", "Сх", "Пд", "Зх"],
    label: (place: string) => `Небо над місцем «${place}» у мить народження`,
    phases: { new: "Молодик", "waxing-crescent": "Молодий серп", "first-quarter": "Перша чверть", "waxing-gibbous": "Місяць, що росте", full: "Повня", "waning-gibbous": "Місяць, що спадає", "last-quarter": "Остання чверть", "waning-crescent": "Старий серп" } as Record<string, string>,
  },
};

/** An eight-pointed star as the cards engrave it. */
function star(x: number, y: number, size: number): string {
  let d = "";
  for (let k = 0; k < 16; k++) {
    const r = k % 2 ? size * 0.2 : (k / 2) % 2 ? size * 0.55 : size;
    const a = (k * Math.PI) / 8 - Math.PI / 2;
    d += `${k ? "L" : "M"}${f(x + r * Math.cos(a))},${f(y + r * Math.sin(a))}`;
  }
  return d + "Z";
}

type Props = {
  locale: "en" | "uk";
  moment: Date;
  latitude: number;
  longitude: number;
  timeKnown: boolean;
  bodies: Placement[];
  bodyNames: Record<string, string>;
  place: string;
};

export default function BirthSky({ locale, moment, latitude, longitude, timeKnown, bodies, bodyNames, place }: Props) {
  const t = UI[locale];
  const uid = useId().replace(/:/g, "");
  const sky = useMemo(() => {
    const sidereal = lst(moment, longitude);
    const at = (ra: number, dec: number) => { const p = project(ra, dec, sidereal, latitude); return { x: C + p.x * R, y: C + p.y * R, alt: p.alt }; };
    const stars = STARS.map((s) => ({ ...at(s.ra, s.dec), mag: s.mag }));
    const up = (p: { alt: number }) => p.alt > -1;
    const lines = CONSTELLATIONS.flatMap((c) => c.lines.filter((run) => run.length > 1).map((run) => run.map((i) => stars[i])));
    const names = CONSTELLATIONS.map((c) => {
      const members = [...new Set(c.lines.flat())].map((i) => stars[i]).filter(up);
      if (!members.length) return null;
      return { name: locale === "uk" ? c.nameUk : c.name, x: members.reduce((s, m) => s + m.x, 0) / members.length, y: members.reduce((s, m) => s + m.y, 0) / members.length };
    }).filter((n): n is { name: string; x: number; y: number } => !!n && Math.hypot(n.x - C, n.y - C) < R - 30);
    const milky = milkyWay(1600).map((m) => ({ ...at(m.ra, m.dec), w: m.w })).filter(up);
    const field = fieldStars(520).map((m) => ({ ...at(m.ra, m.dec), w: m.w })).filter(up);
    const ecliptic = Array.from({ length: 181 }, (_, k) => { const eq = eclipticToEquatorial(k * 2); return at(eq.ra, eq.dec); });
    const planets = bodies.filter((b) => b.key !== "node").map((b) => { const eq = eclipticToEquatorial(b.longitude); return { key: b.key, ...at(eq.ra, eq.dec) }; });
    const sun = planets.find((p) => p.key === "sun");
    return { stars, lines, names, milky, field, ecliptic, planets, sunAlt: sun?.alt ?? -90 };
  }, [moment, latitude, longitude, bodies, locale]);
  const moon = useMemo(() => moonNow(moment), [moment]);

  const light = sky.sunAlt > 0 ? "day" : sky.sunAlt > -12 ? "twilight" : "night";
  const above = sky.planets.filter((p) => p.alt > 0), below = sky.planets.filter((p) => p.alt <= 0);
  const dots = (list: { x: number; y: number; w: number }[], size: (w: number) => number) => list.map((m) => { const r = size(m.w); return `M${f(m.x - r)},${f(m.y)}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0`; }).join("");
  // Altitude circles at 30° and 60° on the stereographic disc
  const altRing = (alt: number) => (Math.tan(((90 - alt) / 2) * (Math.PI / 180)) / Math.tan(Math.PI / 4)) * R;

  return (
    <section className={styles.block} aria-labelledby={`${uid}-title`}>
      <h2 id={`${uid}-title`} className={styles.h2}>{t.title}</h2>
      <p className={styles.blockLead}>{t.lead}</p>
      <div className={styles.birthSky}>
        <svg viewBox="0 0 1000 1000" className={styles.birthMap} role="img" aria-label={t.label(place)}>
          <defs>
            <clipPath id={`${uid}-disc`}><circle cx={C} cy={C} r={R} /></clipPath>
            <radialGradient id={`${uid}-inset`} cx="50%" cy="50%" r="50%">
              <stop offset="0.6" stopColor="#020812" stopOpacity="0" />
              <stop offset="1" stopColor="#020812" stopOpacity="0.6" />
            </radialGradient>
            <radialGradient id={`${uid}-day`} cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#9fb9d8" stopOpacity={light === "day" ? 0.12 : 0.05} />
              <stop offset="1" stopColor={light === "day" ? "#c9d9ec" : "#d9a860"} stopOpacity={light === "day" ? 0.26 : 0.16} />
            </radialGradient>
            <linearGradient id={`${uid}-ivory`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbf4e3" /><stop offset="0.5" stopColor="#e7d8b6" /><stop offset="1" stopColor="#bfa87e" />
            </linearGradient>
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fdebb8" /><stop offset="0.5" stopColor="#dfb866" /><stop offset="1" stopColor="#a47a37" />
            </linearGradient>
            <radialGradient id={`${uid}-halo`}><stop offset="0" stopColor="#e8eef8" stopOpacity="0.5" /><stop offset="1" stopColor="#e8eef8" stopOpacity="0" /></radialGradient>
            <filter id={`${uid}-soft`} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          {/* The rim: an ivory band with the directions and a tick every ten degrees of azimuth */}
          <circle cx={C} cy={C} r={R + 34} fill={`url(#${uid}-ivory)`} />
          {Array.from({ length: 36 }, (_, k) => {
            const a = (k * 10 * Math.PI) / 180, long = k % 9 === 0;
            const x1 = C - Math.sin(a) * R, y1 = C - Math.cos(a) * R, x2 = C - Math.sin(a) * (R + (long ? 14 : 7)), y2 = C - Math.cos(a) * (R + (long ? 14 : 7));
            return <line key={k} x1={f(x1)} y1={f(y1)} x2={f(x2)} y2={f(y2)} className={styles.mapTick} />;
          })}
          {t.directions.map((d, k) => {
            const a = (k * 90 * Math.PI) / 180; // north, then east (left), south, west (right)
            return <text key={d} x={f(C - Math.sin(a) * (R + 23))} y={f(C - Math.cos(a) * (R + 23))} className={styles.mapDirection} dominantBaseline="central" textAnchor="middle">{d}</text>;
          })}
          <g clipPath={`url(#${uid}-disc)`}>
            <rect x={C - R} y={C - R} width={R * 2} height={R * 2} fill="#0a1832" />
            <image href="/astrology/lapis.webp" x={C - R} y={C - R} width={R * 2} height={R * 2} preserveAspectRatio="xMidYMid slice" />
            <path d={dots(sky.milky.filter((m) => m.w > 0.35), (w) => 5 + w * 6)} className={styles.mapMilky} filter={`url(#${uid}-soft)`} />
            <path d={dots(sky.milky, () => 1.1)} className={styles.mapMilkyGrain} />
            <path d={dots(sky.field, (w) => 0.5 + w * 0.8)} className={styles.mapField} />
            {[30, 60].map((alt) => <circle key={alt} cx={C} cy={C} r={f(altRing(alt))} className={styles.mapAltitude} />)}
            <polyline points={sky.ecliptic.map((p) => `${f(p.x)},${f(p.y)}`).join(" ")} className={styles.mapEcliptic} />
            {sky.lines.map((run, i) => <polyline key={i} points={run.map((p) => `${f(p.x)},${f(p.y)}`).join(" ")} className={styles.mapLine} />)}
            {sky.stars.filter((s) => s.alt > -1).map((s, i) => { const r = Math.max(1.2, 4.2 - 0.9 * s.mag); return <circle key={`h${i}`} cx={f(s.x)} cy={f(s.y)} r={f(r * 4)} fill={`url(#${uid}-halo)`} opacity={Math.min(0.9, r / 4)} />; })}
            <path d={sky.stars.filter((s) => s.alt > -1 && s.mag >= 1).map((s) => { const r = Math.max(1.1, 4.2 - 0.9 * s.mag); return `M${f(s.x - r)},${f(s.y)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`; }).join("")} className={styles.mapStar} />
            <path d={sky.stars.filter((s) => s.alt > -1 && s.mag < 1).map((s) => star(s.x, s.y, 11 - 2.2 * s.mag)).join("")} className={styles.mapBright} />
            {sky.names.map((n) => <text key={n.name} x={f(n.x)} y={f(n.y + 22)} className={styles.mapName} textAnchor="middle">{n.name}</text>)}
            {light !== "night" && <circle cx={C} cy={C} r={R} fill={`url(#${uid}-day)`} />}
            <circle cx={C} cy={C} r={R} fill={`url(#${uid}-inset)`} />
            <path d={`M${C - 7},${C}H${C + 7}M${C},${C - 7}V${C + 7}`} className={styles.mapZenith} />
            {/* The planets above the horizon: ivory medallions; the Sun the gold star */}
            {above.map((p) => p.key === "sun"
              ? <g key={p.key}><circle cx={f(p.x)} cy={f(p.y)} r={46} fill="#f3d488" opacity={0.18} filter={`url(#${uid}-soft)`} /><path d={star(p.x, p.y, 24)} fill={`url(#${uid}-gold)`} className={styles.mapSun} /></g>
              : <g key={p.key} className={styles.mapPlanet}><circle cx={f(p.x)} cy={f(p.y)} r={15} /><text x={f(p.x)} y={f(p.y + 1)} textAnchor="middle" dominantBaseline="central">{BODY_GLYPHS[p.key as keyof typeof BODY_GLYPHS] + TEXT}</text></g>)}
          </g>
          <circle cx={C} cy={C} r={R} className={styles.mapHorizon} />
        </svg>
        <div className={styles.birthSkyNotes}>
          <MoonDisc angle={moon.angle} label={t.moon(t.phases[moon.phase], Math.round(moon.lit * 100))} className={styles.birthMoon} />
          <p className={styles.birthMoonLine}>{t.moon(t.phases[moon.phase], Math.round(moon.lit * 100))}</p>
          <p className={styles.note}>{timeKnown ? t[light] : t.noTime}</p>
          <dl className={styles.horizonList}>
            <div><dt>{t.above}</dt><dd>{above.length ? above.map((p) => bodyNames[p.key]).join(", ") : t.none}</dd></div>
            <div><dt>{t.below}</dt><dd>{below.length ? below.map((p) => bodyNames[p.key]).join(", ") : t.none}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
