"use client";

/** The sky at this moment: the Moon as it is tonight, and where each planet stands, with its sign's card. */

import { useEffect, useMemo, useRef, useState } from "react";
import { aspectsBetween, moonNow, skyAt, BODY_GLYPHS, SIGN_CARDS } from "@/lib/astrology/chart.js";
import { formatDegree, type AspectFound, type Placement } from "@/lib/astrology/types";
import { placedIn } from "@/lib/astrology/grammar";
import type { AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import MoonDisc from "./MoonDisc";
import SkyScene from "./SkyScene";
import { SCENE_STRINGS, aspectNames, sceneBodies, sceneSigns } from "./scene-data";
import styles from "./astrology.module.css";
import scene from "./scene.module.css";

const UI = {
  en: {
    kicker: "Tonight", title: "The sky right now", computed: "Worked out for this moment on your device.",
    nextNew: "Next new Moon", nextFull: "Next full Moon", retrograde: "retrograde", lit: (p: number) => `${p}% lit`,
    phases: { new: "New Moon", "waxing-crescent": "Waxing crescent", "first-quarter": "First quarter", "waxing-gibbous": "Waxing gibbous", full: "Full Moon", "waning-gibbous": "Waning gibbous", "last-quarter": "Last quarter", "waning-crescent": "Waning crescent" } as Record<string, string>,
    moonIn: "The Moon is", dates: "en-GB", yours: "This is the sky now. See the sky you were born under",  wheel: "The sky right now, dealt in cards", sun: "Sun", moon: "Moon", tonight: "The Moon tonight",
    caption: "Twelve Major Arcana cards are laid round the sky, one for each sign; the Sun’s and the Moon’s stand up in gold. At the centre lie the real stars of the zodiac and every planet where it stands at this moment, from 0° Aries on the left.",
    // A fixed moment (`at`) is not "this moment"
    computedAt: "Worked out on your device for the moment shown.",
    captionAt: "Twelve Major Arcana cards are laid round the sky, one for each sign; the Sun’s and the Moon’s stand up in gold. At the centre lie the real stars of the zodiac and every planet where it stood at the moment shown, from 0° Aries on the left.",
    kyiv: (when: string) => `${when} Kyiv`,
  },
  uk: {
    kicker: "Сьогодні", title: "Небо просто зараз", computed: "Розраховано для цієї миті на вашому пристрої.",
    nextNew: "Наступний молодик", nextFull: "Наступна повня", retrograde: "ретроградний", lit: (p: number) => `освітлено ${p}%`,
    phases: { new: "Молодик", "waxing-crescent": "Молодий серп", "first-quarter": "Перша чверть", "waxing-gibbous": "Місяць, що росте", full: "Повня", "waning-gibbous": "Місяць, що спадає", "last-quarter": "Остання чверть", "waning-crescent": "Старий серп" } as Record<string, string>,
    moonIn: "Місяць зараз", dates: "uk-UA", yours: "Це небо зараз. Подивіться на небо, під яким ви народилися",  wheel: "Небо просто зараз, розкладене картами", sun: "Сонце", moon: "Місяць", tonight: "Місяць сьогодні",
    caption: "Навколо неба розкладено дванадцять карт Старших Арканів, по одній на кожен знак; карти Сонця й Місяця встають у золоті. У центрі — справжні зорі зодіаку й кожна планета там, де вона стоїть цієї миті, від 0° Овна ліворуч.",
    computedAt: "Розраховано на вашому пристрої для показаної миті.",
    captionAt: "Навколо неба розкладено дванадцять карт Старших Арканів, по одній на кожен знак; карти Сонця й Місяця встають у золоті. У центрі — справжні зорі зодіаку й кожна планета там, де вона стояла в показану мить, від 0° Овна ліворуч.",
    kyiv: (when: string) => `${when} за Києвом`,
  },
};

/** "Mars and Jupiter" / «Марс і Юпітер», «Сонце й Меркурій»: «й» after a vowel before a consonant (милозвучність). */
function together(locale: "en" | "uk", names: string[]): string {
  const and = (before: string, after: string) => locale === "en" ? " and " : /[аеєиіїоуюя]$/i.test(before) && !/^[аеєиіїоуюяйв]/i.test(after) ? " й " : " і ";
  return names.reduce((list, name, i) => (i === 0 ? name : `${list}${i === names.length - 1 ? and(names[i - 1], name) : ", "}${name}`), "");
}

/**
 * The current moment, on the client only (the export was built at another moment), refreshed every minute.
 * With `at`, that fixed moment instead, never ticking; `onTheMinute` lines the refresh up with the clock's
 * minute, so a printed time is never a minute behind.
 */
function useNow(at?: number, onTheMinute = false): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    if (at !== undefined) {
      const fixed = setTimeout(() => setNow(new Date(at)), 0);
      return () => clearTimeout(fixed);
    }
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    if (!onTheMinute) {
      const every = setInterval(tick, 60_000);
      return () => { clearTimeout(first); clearInterval(every); };
    }
    let every: ReturnType<typeof setInterval> | undefined;
    const edge = setTimeout(() => { tick(); every = setInterval(tick, 60_000); }, 60_000 - (Date.now() % 60_000) + 50);
    return () => { clearTimeout(first); clearTimeout(edge); clearInterval(every); };
  }, [at, onTheMinute]);
  return now;
}

/** "16 Oct · 21:40 Kyiv" / «16 жовтня · 21:40 за Києвом»: the sky's moment on the Kyiv clock. */
function kyivStamp(locale: "en" | "uk", moment: Date): string {
  const parts = new Intl.DateTimeFormat(UI[locale].dates, { day: "numeric", month: locale === "uk" ? "long" : "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Kyiv" }).formatToParts(moment);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return UI[locale].kyiv(`${part("day")} ${part("month").replace(/\.$/, "")} · ${part("hour")}:${part("minute")}`);
}

/**
 * The Moon tonight, for the head of the page: its phase drawn, its sign's card, the next new and full Moons.
 * `sans` (the daily folio's opt-in) sets its date labels in the body face, never IBM Plex Mono, and stacks it
 * on the narrowest phones; left out, it renders exactly as on /astrology.
 */
export function TonightMoon({ locale, copy, cards, sans = false }: { locale: "en" | "uk"; copy: AstroCopy; cards: MajorCard[]; sans?: boolean }) {
  const t = UI[locale];
  const now = useNow();
  const moon = now ? moonNow(now) : null;
  const place = now ? (skyAt(now) as Placement[]).find((body) => body.key === "moon") : undefined;
  const day = new Intl.DateTimeFormat(t.dates, { day: "numeric", month: "long" });
  const card = place ? cards[SIGN_CARDS[place.index]] : null;
  return (
    <aside className={sans ? `${styles.moonHero} ${scene.moonSans}` : styles.moonHero} aria-label={t.tonight} aria-busy={!now}>
      <MoonDisc angle={moon ? moon.angle : null} label={moon ? `${t.phases[moon.phase]}, ${t.lit(Math.round(moon.lit * 100))}` : ""} />
      <div className={styles.moonText}>
        <p className={styles.moonPhase}>{moon ? t.phases[moon.phase] : " "}</p>
        <p className={styles.moonWhere}>
          {place && card ? <>{placedIn(locale, t.moonIn, place.sign, copy.signs[place.sign].name)} · {formatDegree(place.degree)} · <a href={card.href}>{card.name}</a></> : " "}
        </p>
        <dl className={styles.moonDates}>
          <div><dt>{t.nextNew}</dt><dd>{moon?.nextNew ? day.format(moon.nextNew) : " "}</dd></div>
          <div><dt>{t.nextFull}</dt><dd>{moon?.nextFull ? day.format(moon.nextFull) : " "}</dd></div>
        </dl>
      </div>
    </aside>
  );
}

export type TonightSkyProps = {
  locale: "en" | "uk";
  copy: AstroCopy;
  cards: MajorCard[];
  // Opt-ins for the daily folio. Left out, the section renders exactly as on /astrology.
  /** A two-line Cormorant head, the second line italic, in place of the kicker and h2. It also sets the
      sky's small labels (roles, panel kickers) in the body face instead of IBM Plex Mono. */
  title?: [string, string];
  /** Show the sky at this instant (epoch ms) and hold it there: no ticking. */
  at?: number;
  /** The link to the birth chart under the scene (default true). */
  nudge?: boolean;
  /** The planet ledger: sign-card thumbnails (default), or card names as text with planets in one sign grouped. */
  listCards?: "thumbs" | "names";
  /** Deal the sky when it is seen rather than on mount; rest its loops while out of sight. */
  playWhenSeen?: boolean;
  /** Light the lying sign cards and name each on hover or keyboard focus. */
  nameCards?: boolean;
  /** A chip with the sky's moment on the Kyiv clock, refreshed each minute. */
  stamp?: boolean;
  /** A body key (the day's leading planet) whose aspect threads are lit and drawn first. */
  lightKey?: string;
  className?: string;
};

type Group = { sign: string; index: number; bodies: Placement[] };

export default function TonightSky({ locale, copy, cards, title, at, nudge = true, listCards = "thumbs", playWhenSeen, nameCards, stamp, lightKey, className }: TonightSkyProps) {
  const t = UI[locale];
  const now = useNow(at, !!stamp);
  // playWhenSeen: the scene (its star plate and twelve wheel cards) mounts only as it comes within reach of the
  // viewport, so a page whose sky is far below the fold does not fetch it beside its first images
  const fig = useRef<HTMLElement | null>(null);
  const [near, setNear] = useState(() => !playWhenSeen || typeof IntersectionObserver !== "function");
  useEffect(() => {
    const el = fig.current;
    if (near || !el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { setNear(true); io.disconnect(); }
    }, { rootMargin: "150% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  // Memoised on the moment, so a re-rendering parent does not redraw the star plate beneath
  const all = useMemo(() => (now ? (skyAt(now) as Placement[]) : []), [now]);
  const sky = useMemo(() => all.filter((body) => body.key !== "node"), [all]);
  const aspects = useMemo(() => (now ? aspectsBetween(sky) : []) as AspectFound[], [now, sky]);
  const signName = (sign: string) => copy.signs[sign].name;
  const bodyName = (key: string) => copy.bodies[key].name;
  // The folio names the standing cards as sign correspondences ("☽ Moon in Capricorn"), never as the planet's own card
  const placed = (key: "sun" | "moon") => { const body = all.find((b) => b.key === key); return body ? placedIn(locale, t[key], body.sign, signName(body.sign)) : t[key]; };

  // «ретроградна» agrees with Venus, the one feminine planet name in Ukrainian
  const retro = (key: string) => (locale === "uk" && key === "venus" ? "ретроградна" : t.retrograde);
  // The ledger by name: one row per occupied sign, in the order its first planet comes
  const groups = useMemo(() => {
    const bySign = new Map<string, Group>();
    for (const body of sky) {
      const group = bySign.get(body.sign) ?? { sign: body.sign, index: body.index, bodies: [] };
      group.bodies.push(body);
      bySign.set(body.sign, group);
    }
    return [...bySign.values()];
  }, [sky]);

  const head = title ? (
    <h2 id="tonight-title" className={scene.skyTitle}><span>{title[0]}</span> <span>{title[1]}</span></h2>
  ) : <h2 id="tonight-title" className={styles.h2}>{t.title}</h2>;

  return (
    <section className={className ? `${styles.tonight} ${className}` : styles.tonight} aria-labelledby="tonight-title">
      {!title && <p className={styles.kicker}>{t.kicker}</p>}
      {stamp ? (
        <div className={scene.skyHead}>
          {head}
          <p className={scene.stamp}>{now ? <time dateTime={now.toISOString()}>{kyivStamp(locale, now)}</time> : " "}</p>
        </div>
      ) : head}
      <figure className={styles.skyFigure} aria-busy={!now} ref={fig}>
        {now && near ? (
          <SkyScene locale={locale} bodies={all} ascendant={null} midheaven={null} aspects={aspects} roleNames={title ? { sun: placed("sun"), moon: placed("moon") } : { sun: t.sun, moon: t.moon }}
            description={sky.map((body) => placedIn(locale, copy.bodies[body.key].name, body.sign, signName(body.sign))).join("; ")}
            signCards={sceneSigns(copy, cards)} strings={SCENE_STRINGS[locale]} aspectNames={aspectNames(copy)}
            bodyInfo={sceneBodies(locale, copy, all, { retrograde: t.retrograde, rising: "" })}
            labels={Object.fromEntries(all.map((body) => [body.key, `${placedIn(locale, copy.bodies[body.key].name, body.sign, signName(body.sign))} · ${formatDegree(body.degree)}`]))}
            playWhenSeen={playWhenSeen} nameCards={nameCards} lightKey={lightKey} sans={!!title} />
        ) : <div className={styles.scenePlaceholder} />}
        <figcaption className={styles.caption}>{at === undefined ? t.caption : t.captionAt}</figcaption>
        {nudge && <p className={styles.skyNudge}><a href={`${locale === "uk" ? "/uk" : ""}/astrology/birth-chart/`}>{t.yours}<span aria-hidden> →</span></a></p>}
      </figure>
      {listCards === "names" ? (
        <ul className={`${styles.skyList} ${scene.ledger}`} aria-busy={!now}>
          {groups.map((group) => {
            const major = cards[SIGN_CARDS[group.index]];
            const one = group.bodies.length === 1;
            const where = (body: Placement) => `${formatDegree(body.degree)}${body.retrograde ? ` · ${retro(body.key)}` : ""}`;
            return (
              <li key={group.sign}>
                <span className={`${styles.glyph} ${scene.ledgerGlyphs}`} aria-hidden>
                  {group.bodies.map((body) => <span key={body.key}>{BODY_GLYPHS[body.key] + "︎"}</span>)}
                </span>
                <span className={styles.skyWhere}>
                  <span className={styles.rowName}>{placedIn(locale, together(locale, group.bodies.map((body) => bodyName(body.key))), group.sign, signName(group.sign))}</span>
                  <span className={scene.ledgerMeta}>
                    {one ? where(group.bodies[0]) : group.bodies.map((body) => `${bodyName(body.key)} ${where(body)}`).join(" · ")}
                    {" · "}<a href={major.href} className={scene.ledgerCard}>{major.name}</a>
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
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
      )}
      <p className={styles.hint}>{at === undefined ? t.computed : t.computedAt}</p>
    </section>
  );
}
