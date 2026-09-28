"use client";

/** The sky at this moment: the Moon's phase and sign, and where each planet stands, with its sign's card. */

import { useEffect, useState } from "react";
import { moonNow, skyAt, BODY_GLYPHS, SIGN_CARDS } from "@/lib/astrology/chart.js";
import { formatDegree, type Placement } from "@/lib/astrology/types";
import { placedIn } from "@/lib/astrology/grammar";
import type { AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import styles from "./astrology.module.css";

const UI = {
  en: {
    kicker: "Tonight", title: "The sky right now", computed: "Worked out for this moment on your device.",
    nextNew: "Next new Moon", nextFull: "Next full Moon", retrograde: "retrograde", lit: (p: number) => `${p}% lit`,
    phases: { new: "New Moon", "waxing-crescent": "Waxing crescent", "first-quarter": "First quarter", "waxing-gibbous": "Waxing gibbous", full: "Full Moon", "waning-gibbous": "Waning gibbous", "last-quarter": "Last quarter", "waning-crescent": "Waning crescent" } as Record<string, string>,
    moonIn: "The Moon is", dates: "en-GB",
  },
  uk: {
    kicker: "Сьогодні", title: "Небо просто зараз", computed: "Розраховано для цієї миті на вашому пристрої.",
    nextNew: "Наступний молодик", nextFull: "Наступна повня", retrograde: "ретроградний", lit: (p: number) => `освітлено ${p}%`,
    phases: { new: "Молодик", "waxing-crescent": "Молодий серп", "first-quarter": "Перша чверть", "waxing-gibbous": "Місяць, що росте", full: "Повня", "waning-gibbous": "Місяць, що спадає", "last-quarter": "Остання чверть", "waning-crescent": "Старий серп" } as Record<string, string>,
    moonIn: "Місяць зараз", dates: "uk-UA",
  },
};

/** The lit part of the Moon as seen from the northern hemisphere. */
function moonPath(angle: number, r = 46, c = 50): string {
  const waxing = angle < 180;
  const rx = Math.abs(Math.cos((angle * Math.PI) / 180)) * r;
  const crescent = waxing ? angle < 90 : angle > 270;
  const limb = waxing ? 1 : 0;
  const terminator = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M ${c} ${c - r} A ${r} ${r} 0 0 ${limb} ${c} ${c + r} A ${rx} ${r} 0 0 ${terminator} ${c} ${c - r} Z`;
}

export default function TonightSky({ locale, copy, cards }: { locale: "en" | "uk"; copy: AstroCopy; cards: MajorCard[] }) {
  const t = UI[locale];
  const [now, setNow] = useState<Date | null>(null);
  // Client-only (the export was built at another moment); the sky is refreshed every minute.
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 60_000);
    return () => { clearTimeout(first); clearInterval(every); };
  }, []);

  const sky = now ? (skyAt(now) as Placement[]).filter((body) => body.key !== "node") : [];
  const moon = now ? moonNow(now) : null;
  const moonPlace = sky.find((body) => body.key === "moon");
  const day = new Intl.DateTimeFormat(t.dates, { weekday: "long", day: "numeric", month: "long" });
  const signName = (sign: string) => copy.signs[sign].name;

  return (
    <section className={styles.tonight} aria-labelledby="tonight-title">
      <p className={styles.kicker}>{t.kicker}</p>
      <h2 id="tonight-title" className={styles.h2}>{t.title}</h2>
      <div className={styles.tonightGrid} aria-busy={!now}>
        <div className={styles.moonPanel}>
          <svg viewBox="0 0 100 100" className={styles.moonDisc} role="img" aria-label={moon ? `${t.phases[moon.phase]}, ${t.lit(Math.round(moon.lit * 100))}` : ""}>
            <circle cx="50" cy="50" r="46" className={styles.moonDark} />
            {moon && <path d={moonPath(moon.angle)} className={styles.moonLit} />}
            <circle cx="50" cy="50" r="46" className={styles.moonRim} />
          </svg>
          {moon && moonPlace && (
            <div>
              <p className={styles.h3}>{t.phases[moon.phase]}</p>
              <p className={styles.note}>
                {placedIn(locale, t.moonIn, moonPlace.sign, signName(moonPlace.sign))} · {formatDegree(moonPlace.degree)} · <a href={cards[SIGN_CARDS[moonPlace.index]].href}>{cards[SIGN_CARDS[moonPlace.index]].name}</a>
              </p>
              <dl className={styles.moonDates}>
                {moon.nextNew && <div><dt>{t.nextNew}</dt><dd>{day.format(moon.nextNew)}</dd></div>}
                {moon.nextFull && <div><dt>{t.nextFull}</dt><dd>{day.format(moon.nextFull)}</dd></div>}
              </dl>
            </div>
          )}
        </div>
        <ul className={styles.skyList}>
          {sky.map((body) => {
            const major = cards[SIGN_CARDS[body.index]];
            return (
              <li key={body.key}>
                <span className={styles.glyph} aria-hidden>{BODY_GLYPHS[body.key] + "︎"}</span>
                <span className={styles.rowName}>{placedIn(locale, copy.bodies[body.key].name, body.sign, signName(body.sign))}</span>
                <span className={styles.rowMeta}>{formatDegree(body.degree)}{body.retrograde ? ` · ${t.retrograde}` : ""}</span>
                <a href={major.href} className={styles.skyCard}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
                  <img src={major.thumb} alt="" width={120} height={206} loading="lazy" />
                  <span>{major.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <p className={styles.hint}>{t.computed}</p>
    </section>
  );
}
