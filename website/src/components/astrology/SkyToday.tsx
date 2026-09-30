"use client";

/**
 * Your sky today (or on any day since you were born): where that day's Moon
 * and Sun fall among your houses, with a question for the house the Moon is
 * crossing, and where that day's planets meet yours. Present and past only:
 * a moment to notice, never a forecast.
 */

import { BODY_GLYPHS } from "@/lib/astrology/chart.js";
import type { AstroCopy } from "@/lib/astrology/copy";
import { placedIn } from "@/lib/astrology/grammar";
import type { Placement } from "@/lib/astrology/types";
import { contactsBetween } from "./SkyScene";
import styles from "./astrology.module.css";

const TEXT = "︎";
const UI = {
  en: {
    title: "Your sky today", titleOn: (date: string) => `Your sky on ${date}`,
    lead: "The sky moves and your chart stays. This is where the day’s Moon and Sun fall in your chart, and where its planets meet yours: a moment to notice, not a forecast.",
    moonNote: "The Moon crosses a house in about two and a half days.", sunNote: "The Sun stays about a month in each house.",
    meetings: "Where the day’s planets meet yours", none: "No close meetings on this day.",
  },
  uk: {
    title: "Ваше небо сьогодні", titleOn: (date: string) => `Ваше небо ${date}`,
    lead: "Небо рухається, а ваша карта лишається. Ось де Місяць і Сонце цього дня стоять у вашій карті та де його планети зустрічаються з вашими: мить, яку варто помітити, а не прогноз.",
    moonNote: "Місяць проходить будинок приблизно за два з половиною дні.", sunNote: "Сонце залишається в кожному будинку близько місяця.",
    meetings: "Де планети цього дня зустрічаються з вашими", none: "Цього дня близьких зустрічей немає.",
  },
};
// Ukrainian possessive by the grammatical gender of each body's name
const POSSESSIVE: Record<string, string> = { sun: "ваше", venus: "ваша", midheaven: "ваша" };

type Props = {
  locale: "en" | "uk";
  copy: AstroCopy;
  natal: Placement[];
  ascendant: Placement | null;
  transits: Placement[];
  dateLabel: string | null; // null for today
  prompts?: Record<string, string>;
};

export default function SkyToday({ locale, copy, natal, ascendant, transits, dateLabel, prompts }: Props) {
  const t = UI[locale];
  const moon = transits.find((b) => b.key === "moon"), sun = transits.find((b) => b.key === "sun");
  const houseOf = (body: Placement) => (ascendant ? ((body.index - ascendant.index + 12) % 12) + 1 : null);
  const name = (key: string) => (key === "ascendant" ? copy.bodies.ascendant.name : copy.bodies[key].name);
  const yours = (key: string) => (locale === "uk" ? `${POSSESSIVE[key] ?? "ваш"} ${name(key)}` : `your ${name(key)}`);
  const meetings = contactsBetween(transits, [...natal, ...(ascendant ? [ascendant] : [])], 5);

  const row = (body: Placement | undefined, note: string, withPrompt: boolean) => {
    if (!body) return null;
    const house = houseOf(body), h = house ? copy.houses[String(house)] : null;
    return (
      <li className={styles.todayRow}>
        <span className={styles.todayGlyph} aria-hidden>{BODY_GLYPHS[body.key as keyof typeof BODY_GLYPHS] + TEXT}</span>
        <div>
          <p className={styles.todayKicker}>{h ? `${h.name} · ${h.area}` : placedIn(locale, name(body.key), body.sign, copy.signs[body.sign].name)}</p>
          <p className={styles.todayTitle}>{placedIn(locale, name(body.key), body.sign, copy.signs[body.sign].name)}</p>
          {h && withPrompt && prompts?.[String(house)] ? <p className={styles.question}>{prompts[String(house)]}</p> : h ? <p className={styles.todayText}>{h.essence}</p> : null}
          <p className={styles.hint}>{note}</p>
        </div>
      </li>
    );
  };

  return (
    <section className={styles.block} aria-labelledby="today-title" aria-live="polite">
      <h2 id="today-title" className={styles.h2}>{dateLabel ? t.titleOn(dateLabel) : t.title}</h2>
      <p className={styles.blockLead}>{t.lead}</p>
      <ul className={styles.todayList}>
        {row(moon, t.moonNote, true)}
        {row(sun, t.sunNote, false)}
      </ul>
      <p className={styles.kicker} style={{ marginTop: "1.8rem" }}>{t.meetings}</p>
      {meetings.length ? (
        <ul className={styles.meetList}>
          {meetings.map((m) => (
            <li key={`${m.now}-${m.natal}-${m.aspect}`}>
              <span className={styles.meetGlyphs} aria-hidden>{BODY_GLYPHS[m.now as keyof typeof BODY_GLYPHS] + TEXT} {BODY_GLYPHS[m.natal as keyof typeof BODY_GLYPHS] + TEXT}</span>
              <div>
                <p className={styles.todayTitle}>{name(m.now)} · {copy.aspects[m.aspect].name.toLowerCase()} · {yours(m.natal)}</p>
                <p className={styles.todayText}>{copy.aspects[m.aspect].essence}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className={styles.note}>{t.none}</p>}
    </section>
  );
}
