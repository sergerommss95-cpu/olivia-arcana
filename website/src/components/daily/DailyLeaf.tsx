"use client";

/**
 * Your day: today's real sky, worked out on the reader's device and read for their sign the way
 * the cards are read — for reflection, never a forecast. Built from the Olivia Astrology pieces
 * (tokens, Moon, the sky in cards, the one-turn card) so the page reads as part of the same practice.
 *
 * The sky engine and the writing come from Olivia Today (src/lib/daily, ported from the prototype):
 * positions at noon in Kyiv, whole-sign houses from the Sun sign, the day's leading event solved to
 * the minute, three life areas, and a folded almanac of timing, the Moon and the weeks ahead.
 */

import { useEffect, useMemo, useState } from "react";
import ENGINE from "@/lib/daily/engine.js";
import COMPOSE from "@/lib/daily/compose.js";
import { SIGNS, SIGN_CARDS, SIGN_GLYPHS, BODY_CARDS, birthMoment, skyAt, signOf } from "@/lib/astrology/chart.js";
import { loadProfile } from "@/lib/astrology/profile";
import type { AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import type { DeckCard } from "@/lib/daily/deck";
import TonightSky, { TonightMoon } from "@/components/astrology/TonightSky";
import DayCard from "./DayCard";
import DailyAlmanac, { type DailyReading } from "./DailyAlmanac";
import a from "@/components/astrology/astrology.module.css";
import d from "./daily.module.css";

type Locale = "en" | "uk";
type Sign = (typeof SIGNS)[number];

const SIGN_KEY = "olivia:daily-sign";
const TURNED_KEY = "olivia:daily-card-turned";

const COPY = {
  en: {
    home: "Home", crumb: "Breadcrumb", section: "Your day",
    kicker: (date: string) => `Today · ${date}`,
    title: "Your day",
    lead: "Choose your sign and today’s real sky is read for you: the event that leads the day, the houses it falls in and the hours that matter. Read the way the cards are read, for reflection and never as a forecast.",
    calculating: "Working out today’s sky…",
    signKicker: "Your sign", signLabel: "Choose your sign",
    signCard: (sign: string) => `The card of ${sign}`,
    event: "The day’s leading event",
    kyiv: "Kyiv time",
    readingKicker: "Today’s reading", scene: "How it might look", doLabel: "Worth doing", avoidLabel: "Worth leaving", ask: "A question for today",
    areasKicker: "Three areas", areasTitle: "Where the day touches you",
    areasLead: "Each area follows the planet that rules it today, shown with its Major Arcana card.",
    until: (when: string) => `in this sign until ${when}`,
    cardKicker: "The card of the day", cardTitle: "One card for everyone today",
    cardLead: "Chosen by the date, the same for every reader and independent of your sign. It adds a second voice to the reading.",
    chartKicker: "Your birth", chartTitle: "Your birth chart",
    chartText: "A card for your Sun, your Moon and your Rising sign, and the whole sky dealt in cards at the moment you were born. Worked out on your device.",
    chartCta: "Read my chart",
    methodKicker: "How this is read",
    method: "Positions are calculated for noon in Kyiv with Astronomy Engine (apparent geocentric, tropical zodiac). Houses are whole-sign houses counted from your Sun sign, the usual method for a sign reading, not your birth-time houses. Exact moments are solved to the minute. The writing is Olivia’s own and offers a way of looking at the day.",
    boundary: "A way of looking at the day, never a forecast.",
    otherDay: "This leaf is for another day.", backToday: "Back to today",
  },
  uk: {
    home: "Головна", crumb: "Навігаційний шлях", section: "Ваш день",
    kicker: (date: string) => `Сьогодні · ${date}`,
    title: "Ваш день",
    lead: "Оберіть свій знак, і сьогоднішнє справжнє небо буде прочитано для вас: подія, що веде день, будинки, у які вона припадає, і години, що мають значення. Його читають так само, як карти: для роздумів, а не як прогноз.",
    calculating: "Розраховуємо сьогоднішнє небо…",
    signKicker: "Ваш знак", signLabel: "Оберіть свій знак",
    signCard: (sign: string) => `Карта знака ${sign}`,
    event: "Подія, що веде день",
    kyiv: "за Києвом",
    readingKicker: "Читання на сьогодні", scene: "Як це може виглядати", doLabel: "Варто зробити", avoidLabel: "Варто відкласти", ask: "Запитання на сьогодні",
    areasKicker: "Три сфери", areasTitle: "Де день вас торкається",
    areasLead: "Кожна сфера йде за планетою, яка сьогодні нею править, і показана з її картою Старших Арканів.",
    until: (when: string) => `у цьому знаку до ${when}`,
    cardKicker: "Карта дня", cardTitle: "Одна карта для всіх сьогодні",
    cardLead: "Її обирає дата: вона однакова для всіх і не залежить від вашого знака. Вона додає до читання другий голос.",
    chartKicker: "Ваше народження", chartTitle: "Ваша натальна карта",
    chartText: "Карта для вашого Сонця, Місяця й Асцендента та все небо, розкладене картами, в мить вашого народження. Розраховується на вашому пристрої.",
    chartCta: "Прочитати мою карту",
    methodKicker: "Як це прочитано",
    method: "Положення розраховано на полудень за київським часом за Astronomy Engine (видимі геоцентричні, тропічний зодіак). Будинки — цілознакові, відлічені від вашого сонячного знака, як заведено для читання за знаком; це не будинки вашого часу народження. Точні моменти розраховано до хвилини. Текст написала Olivia, щоб запропонувати погляд на день.",
    boundary: "Погляд на день, а не прогноз.",
    otherDay: "Цей аркуш — за інший день.", backToday: "Повернутися до сьогодні",
  },
};

const AREA_NAMES = {
  en: { love: "Love", work: "Work and money", self: "Body and mood" },
  uk: { love: "Кохання", work: "Робота й гроші", self: "Тіло й настрій" },
} as const;

const shiftDate = (date: string, k: number) => new Date(Date.parse(date + "T12:00:00Z") + k * 864e5).toISOString().slice(0, 10);

/** The same card for every reader on a local day — the formula of lib/daily-card, over the deck order. */
function cardOfTheDay(now: Date, size: number) {
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = dayOfYear * 2654435761;
  return { index: Math.abs(seed) % size, reversed: Math.abs(seed >> 8) % 3 === 0 };
}

function readStored(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function store(key: string, value: string) { try { localStorage.setItem(key, value); } catch { /* visit only */ } }

/** The reader's sign, if this device already knows it: their own choice here, then their birth chart. */
function knownSign(): Sign | null {
  const own = readStored(SIGN_KEY);
  if (own && (SIGNS as readonly string[]).includes(own)) return own as Sign;
  try {
    const legacy = JSON.parse(readStored("olivia:profile") || "null");
    if (legacy?.signSlug && (SIGNS as readonly string[]).includes(legacy.signSlug)) return legacy.signSlug as Sign;
  } catch { /* none */ }
  const birth = loadProfile();
  if (birth) {
    try {
      const sun = (skyAt(birthMoment({ date: birth.date, time: birth.time, zone: birth.place.zone }).utc) as { key: string; longitude: number }[]).find((b) => b.key === "sun");
      if (sun) return signOf(sun.longitude).sign as Sign;
    } catch { /* fall through */ }
  }
  return null;
}

export default function DailyLeaf({ locale, copy, cards, deck }: { locale: Locale; copy: AstroCopy; cards: MajorCard[]; deck: DeckCard[] }) {
  const c = COPY[locale];
  const base = locale === "uk" ? "/uk" : "";
  const [sign, setSign] = useState<Sign | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [lib, setLib] = useState<object | null>(null);
  const [turned, setTurned] = useState<boolean | null>(null);
  const [now, setNow] = useState<number | null>(null);

  // everything here depends on the reader's own moment and device, so it starts after mounting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const asked = params.get("sign");
    const timer = setTimeout(() => {
      setSign(asked && (SIGNS as readonly string[]).includes(asked) ? (asked as Sign) : knownSign());
      setDate(params.get("date") || ENGINE.todayISO());
      setTurned(readStored(TURNED_KEY) === ENGINE.todayISO());
    }, 0);
    const tick = () => setNow(Date.now());
    const clock = setInterval(tick, 60_000); tick();
    let live = true;
    (locale === "uk" ? import("@/lib/daily/lib-uk.js") : import("@/lib/daily/lib-en.js")).then((m) => { if (live) setLib(m.default); });
    return () => { live = false; clearTimeout(timer); clearInterval(clock); };
  }, [locale]);

  const days = useMemo(() => (date ? { today: ENGINE.day({ date }), history: [ENGINE.day({ date: shiftDate(date, -1) }), ENGINE.day({ date: shiftDate(date, -2) })] } : null), [date]);
  const reading: DailyReading | null = useMemo(() => {
    if (!days || !lib || !sign) return null;
    COMPOSE.setLibrary(lib);
    return COMPOSE.compose({ day: days.today, sign, lang: locale, natal: null, cardId: null, history: days.history });
  }, [days, lib, sign, locale]);

  const choose = (next: Sign) => { setSign(next); store(SIGN_KEY, next); };
  const fmt = (t: number, o: Intl.DateTimeFormatOptions) => ENGINE.fmt(t, locale, o);
  const hm = (t: number) => fmt(t, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const today = date ? fmt(ENGINE.kyivInstant(date), { weekday: "long", day: "numeric", month: "long" }) : "";
  const isToday = !date || !now || date === ENGINE.todayISO(now);
  const signName = sign ? copy.signs[sign].name : "";
  const signCard = sign ? cards[SIGN_CARDS[SIGNS.indexOf(sign)]] : null;
  const houseName = (n: number) => copy.houses[String(n)]?.name ?? "";
  const kicker = reading?.kicker ? reading.kicker.replace(/(\d{1,2}:\d{2})/, `$1 ${c.kyiv}`) : "";

  const daily = useMemo(() => (date && now ? cardOfTheDay(new Date(now), deck.length) : null), [date, now, deck.length]);


  return (
    <div className={a.page} lang={locale}>
      <nav aria-label={c.crumb} className={a.crumb}>
        <ol><li><a href={`${base}/`}>{c.home}</a></li><li aria-hidden>/</li><li aria-current="page">{c.section}</li></ol>
      </nav>

      <div className={a.hero}>
        <header className={a.head}>
          <p className={a.kicker}>{date ? c.kicker(today) : " "}</p>
          <h1 className={a.h1}>{reading ? reading.headline : c.title}</h1>
          {reading ? (
            <>
              {kicker && <p className={d.eventLine}><span className={d.eventLabel}>{c.event}</span> {kicker}</p>}
              <p className={a.lead}>{reading.lead[0]}</p>
            </>
          ) : (
            <p className={a.lead}>{sign && !lib ? c.calculating : c.lead}</p>
          )}
          {date && !isToday && <p className={a.hint}>{c.otherDay} <a href={`${base}/daily/`}>{c.backToday}</a></p>}
        </header>
        {signCard ? (
          <a href={signCard.href} className={d.signCard} aria-label={`${c.signCard(signName)}: ${signCard.name}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static card art */}
            <img src={signCard.image} alt="" width={448} height={768} />
            <span className={d.signCardText}>
              <span className={a.kicker}>{c.signCard(signName)}</span>
              <span className={d.signCardName}>{signCard.name}</span>
              <span className={a.note}>{copy.signs[sign!].essence}</span>
            </span>
          </a>
        ) : (
          <TonightMoon locale={locale} copy={copy} cards={cards} />
        )}
      </div>

      <section className={d.signs} aria-labelledby="sign-title">
        <h2 id="sign-title" className={a.kicker}>{sign ? c.signKicker : c.signLabel}</h2>
        <ul className={d.signList}>
          {SIGNS.map((key, i) => (
            <li key={key}>
              <button type="button" className={d.signChip} aria-pressed={sign === key} onClick={() => choose(key)}>
                <span className={d.signGlyph} aria-hidden>{SIGN_GLYPHS[i] + "︎"}</span>
                {copy.signs[key].name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {reading && (
        <section className={a.block} aria-labelledby="reading-title">
          <p className={a.kicker}>{c.readingKicker}</p>
          <h2 id="reading-title" className={a.h2}>{signName}</h2>
          <div className={d.reading}>
            {reading.lead.slice(1).map((p, i) => <p key={i} className={/^(For you|Для вас)/.test(p) ? d.bridge : undefined}>{p}</p>)}
            {reading.scene && (
              <figure className={d.scene}>
                <figcaption className={a.kicker}>{c.scene}</figcaption>
                <blockquote>{reading.scene}</blockquote>
              </figure>
            )}
            {reading.dos.length > 0 && (
              <div className={d.doAvoid}>
                <section className={d.panel}><h3 className={a.kicker}>{c.doLabel}</h3><ul>{reading.dos.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
                <section className={d.panel}><h3 className={a.kicker}>{c.avoidLabel}</h3><ul>{reading.avoids.map((x, i) => <li key={i}>{x}</li>)}</ul></section>
              </div>
            )}
            {reading.ask && (
              <div className={d.ask}>
                <p className={a.kicker}>{c.ask}</p>
                <p className={d.askQ}>{reading.ask}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {reading && reading.areas.length > 0 && (
        <section className={a.block} aria-labelledby="areas-title">
          <p className={a.kicker}>{c.areasKicker}</p>
          <h2 id="areas-title" className={a.h2}>{c.areasTitle}</h2>
          <p className={a.blockLead}>{c.areasLead}</p>
          <ul className={d.areas}>
            {reading.areas.map((area) => {
              const card = cards[(BODY_CARDS as Record<string, number>)[area.planet]];
              const body = days!.today.bodies.find((b: { key: string }) => b.key === area.planet);
              const when = area.leaves ? (area.planet === "moon" ? fmt(area.leaves, { weekday: "long" }) + " " + hm(area.leaves) : fmt(area.leaves, { day: "numeric", month: "long" })) : "";
              const meta = [copy.bodies[area.planet]?.name + (body?.retro ? " ℞" : ""), houseName(area.house), when && c.until(when)].filter(Boolean).join(" · ");
              return (
                <li key={area.key} className={d.area}>
                  <a href={card.href} className={d.areaCard} aria-label={card.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
                    <img src={card.thumb} alt="" width={120} height={206} loading="lazy" />
                  </a>
                  <div className={d.areaText}>
                    <h3 className={d.areaName}>{AREA_NAMES[locale][area.key as keyof (typeof AREA_NAMES)["en"]]}</h3>
                    <p className={d.areaMeta}>{meta}</p>
                    <p className={a.note}>{area.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {date && (
        <section className={a.block} aria-labelledby="card-title">
          <p className={a.kicker}>{c.cardKicker}</p>
          <h2 id="card-title" className={a.h2}>{c.cardTitle}</h2>
          <p className={a.blockLead}>{c.cardLead}</p>
          {daily && turned !== null && <DayCard locale={locale} card={deck[daily.index]} reversed={daily.reversed} faceUp={turned} onTurn={() => store(TURNED_KEY, ENGINE.todayISO())} />}
        </section>
      )}

      <TonightSky locale={locale} copy={copy} cards={cards} />

      {reading && days && now && <DailyAlmanac locale={locale} reading={reading} day={days.today} copy={copy} now={now} />}

      <a href={`${base}/astrology/birth-chart/`} className={a.door}>
        <span className={a.doorArt} aria-hidden>
          {[19, 2, 10].map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail
            <img key={id} src={cards[id].thumb} alt="" width={120} height={206} />
          ))}
        </span>
        <span className={a.doorText}>
          <span className={a.kicker}>{c.chartKicker}</span>
          <span className={a.doorTitle}>{c.chartTitle}</span>
          <span className={a.note}>{c.chartText}</span>
          <span className={a.primary}>{c.chartCta}</span>
        </span>
      </a>

      <section className={a.method} aria-labelledby="method-title">
        <h2 id="method-title" className={a.kicker}>{c.methodKicker}</h2>
        <p>{c.method}</p>
        <p className={a.boundary}>{c.boundary}</p>
      </section>
    </div>
  );
}
