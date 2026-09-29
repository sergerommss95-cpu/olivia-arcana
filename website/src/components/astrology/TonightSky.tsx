"use client";

/** The sky at this moment: the Moon as it is tonight, and where each planet stands, with its sign's card. */

import { useEffect, useState } from "react";
import { aspectsBetween, moonNow, skyAt, BODY_GLYPHS, SIGN_CARDS } from "@/lib/astrology/chart.js";
import { formatDegree, type AspectFound, type Placement } from "@/lib/astrology/types";
import { placedIn } from "@/lib/astrology/grammar";
import type { AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import MoonDisc from "./MoonDisc";
import SkyScene from "./SkyScene";
import { SCENE_STRINGS, aspectNames, sceneBodies, sceneSigns } from "./scene-data";
import styles from "./astrology.module.css";

const UI = {
  en: {
    kicker: "Tonight", title: "The sky right now", computed: "Worked out for this moment on your device.",
    nextNew: "Next new Moon", nextFull: "Next full Moon", retrograde: "retrograde", lit: (p: number) => `${p}% lit`,
    phases: { new: "New Moon", "waxing-crescent": "Waxing crescent", "first-quarter": "First quarter", "waxing-gibbous": "Waxing gibbous", full: "Full Moon", "waning-gibbous": "Waning gibbous", "last-quarter": "Last quarter", "waning-crescent": "Waning crescent" } as Record<string, string>,
    moonIn: "The Moon is", dates: "en-GB", wheel: "The sky right now, dealt in cards", sun: "Sun", moon: "Moon", tonight: "The Moon tonight",
    caption: "Twelve Major Arcana cards are laid round the sky, one for each sign; the Sun’s and the Moon’s stand up in gold. At the centre lie the real stars of the zodiac and every planet where it stands at this moment, from 0° Aries on the left.",
  },
  uk: {
    kicker: "Сьогодні", title: "Небо просто зараз", computed: "Розраховано для цієї миті на вашому пристрої.",
    nextNew: "Наступний молодик", nextFull: "Наступна повня", retrograde: "ретроградний", lit: (p: number) => `освітлено ${p}%`,
    phases: { new: "Молодик", "waxing-crescent": "Молодий серп", "first-quarter": "Перша чверть", "waxing-gibbous": "Місяць, що росте", full: "Повня", "waning-gibbous": "Місяць, що спадає", "last-quarter": "Остання чверть", "waning-crescent": "Старий серп" } as Record<string, string>,
    moonIn: "Місяць зараз", dates: "uk-UA", wheel: "Небо просто зараз, розкладене картами", sun: "Сонце", moon: "Місяць", tonight: "Місяць сьогодні",
    caption: "Навколо неба розкладено дванадцять карт Старших Арканів, по одній на кожен знак; карти Сонця й Місяця встають у золоті. У центрі — справжні зорі зодіаку й кожна планета там, де вона стоїть цієї миті, від 0° Овна ліворуч.",
  },
};

/** The current moment, on the client only (the export was built at another moment), refreshed every minute. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const every = setInterval(tick, 60_000);
    return () => { clearTimeout(first); clearInterval(every); };
  }, []);
  return now;
}

/** The Moon tonight, for the head of the page: its phase drawn, its sign's card, the next new and full Moons. */
export function TonightMoon({ locale, copy, cards }: { locale: "en" | "uk"; copy: AstroCopy; cards: MajorCard[] }) {
  const t = UI[locale];
  const now = useNow();
  const moon = now ? moonNow(now) : null;
  const place = now ? (skyAt(now) as Placement[]).find((body) => body.key === "moon") : undefined;
  const day = new Intl.DateTimeFormat(t.dates, { day: "numeric", month: "long" });
  const card = place ? cards[SIGN_CARDS[place.index]] : null;
  return (
    <aside className={styles.moonHero} aria-label={t.tonight} aria-busy={!now}>
      <MoonDisc angle={moon ? moon.angle : null} label={moon ? `${t.phases[moon.phase]}, ${t.lit(Math.round(moon.lit * 100))}` : ""} />
      <div className={styles.moonText}>
        <p className={styles.moonPhase}>{moon ? t.phases[moon.phase] : "\u00a0"}</p>
        <p className={styles.moonWhere}>
          {place && card ? <>{placedIn(locale, t.moonIn, place.sign, copy.signs[place.sign].name)} · {formatDegree(place.degree)} · <a href={card.href}>{card.name}</a></> : "\u00a0"}
        </p>
        <dl className={styles.moonDates}>
          <div><dt>{t.nextNew}</dt><dd>{moon?.nextNew ? day.format(moon.nextNew) : "\u00a0"}</dd></div>
          <div><dt>{t.nextFull}</dt><dd>{moon?.nextFull ? day.format(moon.nextFull) : "\u00a0"}</dd></div>
        </dl>
      </div>
    </aside>
  );
}

export default function TonightSky({ locale, copy, cards }: { locale: "en" | "uk"; copy: AstroCopy; cards: MajorCard[] }) {
  const t = UI[locale];
  const now = useNow();

  const all = now ? (skyAt(now) as Placement[]) : [];
  const sky = all.filter((body) => body.key !== "node");
  const aspects = (now ? aspectsBetween(sky) : []) as AspectFound[];
  const signName = (sign: string) => copy.signs[sign].name;

  return (
    <section className={styles.tonight} aria-labelledby="tonight-title">
      <p className={styles.kicker}>{t.kicker}</p>
      <h2 id="tonight-title" className={styles.h2}>{t.title}</h2>
      <figure className={styles.skyFigure} aria-busy={!now}>
        {now ? (
          <SkyScene locale={locale} bodies={all} ascendant={null} midheaven={null} aspects={aspects} roleNames={{ sun: t.sun, moon: t.moon }}
            description={sky.map((body) => placedIn(locale, copy.bodies[body.key].name, body.sign, signName(body.sign))).join("; ")}
            signCards={sceneSigns(copy, cards)} strings={SCENE_STRINGS[locale]} aspectNames={aspectNames(copy)}
            bodyInfo={sceneBodies(locale, copy, all, { retrograde: t.retrograde, rising: "" })}
            labels={Object.fromEntries(all.map((body) => [body.key, `${placedIn(locale, copy.bodies[body.key].name, body.sign, signName(body.sign))} · ${formatDegree(body.degree)}`]))} />
        ) : <div className={styles.scenePlaceholder} />}
        <figcaption className={styles.caption}>{t.caption}</figcaption>
      </figure>
      <ul className={styles.skyList} aria-busy={!now}>
        {sky.map((body) => {
          const major = cards[SIGN_CARDS[body.index]];
          return (
            <li key={body.key}>
              <span className={styles.glyph} aria-hidden>{BODY_GLYPHS[body.key] + "︎"}</span>
              <span className={styles.skyWhere}>
                <span className={styles.rowName}>{placedIn(locale, copy.bodies[body.key].name, body.sign, signName(body.sign))}</span>
                <span className={styles.skyMeta}>{formatDegree(body.degree)}{body.retrograde ? ` · ${t.retrograde}` : ""}</span>
              </span>
              <a href={major.href} className={styles.skyCard}>
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
                <img src={major.thumb} alt="" width={120} height={206} loading="lazy" />
                <span>{major.name}</span>
              </a>
            </li>
          );
        })}
      </ul>
      <p className={styles.hint}>{t.computed}</p>
    </section>
  );
}
