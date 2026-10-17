"use client";

/**
 * Your day, set as one printed leaf of Olivia's almanac: today's real sky, worked out on the reader's device
 * and read for their sign the way the cards are read — for reflection, never a forecast.
 *
 * The sky engine and the writing come from Olivia Today (src/lib/daily, ported from the prototype): positions
 * at noon in Kyiv, whole-sign houses from the Sun sign, the day's leading event solved to the minute, three
 * life areas and a folded almanac. Every composed line is shown intact and in its order; the page only sets it.
 *
 * Chapters (each a full-bleed tonal band): I the frontispiece — the leading event as card art on a Kyiv day
 * ruler; II the reading beside the reader's sign card; III the pause — the closing question on a paper slip
 * and the card of the day (moved up from after the areas in one block, so it can be reverted); IV where the
 * day touches you, three area spreads; V the sky; VI the almanac; VII the door to the birth chart.
 *
 * Motion is spent at three thresholds (arrival, the card of the day, the sky); everything else is a single
 * opacity fade. The end state is the default CSS: entry states exist only under data attributes set here or by
 * IntersectionObserver, so the prerender, JS-off, hidden tabs and reduced motion show the whole page.
 */

import { Fragment, startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ENGINE from "@/lib/daily/engine.js";
import COMPOSE from "@/lib/daily/compose.js";
import { SIGNS, SIGN_CARDS, BODY_CARDS, birthMoment, skyAt, signOf } from "@/lib/astrology/chart.js";
import { loadProfile } from "@/lib/astrology/profile";
import type { AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import type { DeckCard } from "@/lib/daily/deck";
import TonightSky, { TonightMoon } from "@/components/astrology/TonightSky";
import { aspectNames } from "@/components/astrology/scene-data";
import AspectGlyph from "./AspectGlyph";
import DayCard from "./DayCard";
import DailyAlmanac, { type DailyReading } from "./DailyAlmanac";
import HeroPlate from "./HeroPlate";
import ReadingFigure from "./ReadingFigure";
import AreaSpread from "./AreaSpread";
import CardFigure from "./CardFigure";
import SignControl from "./SignControl";
import DayRuler from "./DayRuler";
import QuestionSlip from "./QuestionSlip";
import { leadEvent } from "./lead-event";
import { typeset } from "./typeset";
import { hasPlayed, markPlayed } from "./once";
import { useEntry, prefersReducedMotion } from "./useEntry";
import a from "@/components/astrology/astrology.module.css";
import d from "./daily.module.css";

type Locale = "en" | "uk";
type Sign = (typeof SIGNS)[number];
type Reading = DailyReading & { topSignal: { kind: string; planet: string; house: number | null } };
type Body = { key: string; signIndex: number; retro?: boolean };
type Day = { date: string; dayStart: number; dayEnd: number; asOf: number; bodies: Body[]; sun?: { rise: number | null; set: number | null } | null };
type Days = { today: Day; history: Day[] };

const SIGN_KEY = "olivia:daily-sign";
const TURNED_KEY = "olivia:daily-card-turned";
const arrivalKey = (date: string, sign: string) => `olivia:daily-arrived:${date}:${sign}`;

/* What this page view has already worked out. ClientShell remounts the page once after hydration (and a
   client navigation may bring it back), so a later mount starts from here instead of the prerendered
   state: no flash of the generic copy, and the three days of sky are never computed twice. */
let booted: { sign: Sign | null; date: string; turned: boolean; signInUrl: boolean } | null = null;
const skyCache = new Map<string, Days>();
const libCache: Partial<Record<Locale, object>> = {};
/* The text library (285–513KB) is requested during the first client render, not after commit, so it loads
   alongside hydration instead of after it. One request per locale per page view. */
const libLoads: Partial<Record<Locale, Promise<object>>> = {};
const loadLib = (l: Locale) => (libLoads[l] ??= (l === "uk" ? import("@/lib/daily/lib-uk.js") : import("@/lib/daily/lib-en.js")).then((m) => (libCache[l] = m.default)));

/* The planets' cards are named as correspondences ("Mars’s card"), never as omens. */
const POSSESSIVE: Record<string, string> = { sun: "The Sun’s", moon: "The Moon’s", mercury: "Mercury’s", venus: "Venus’s", mars: "Mars’s", jupiter: "Jupiter’s", saturn: "Saturn’s", uranus: "Uranus’s", neptune: "Neptune’s", pluto: "Pluto’s" };
const GENITIVE: Record<string, string> = { sun: "Сонця", moon: "Місяця", mercury: "Меркурія", venus: "Венери", mars: "Марса", jupiter: "Юпітера", saturn: "Сатурна", uranus: "Урана", neptune: "Нептуна", pluto: "Плутона" };
const SIGN_GENITIVE: Record<string, string> = { aries: "Овна", taurus: "Тельця", gemini: "Близнюків", cancer: "Рака", leo: "Лева", virgo: "Діви", libra: "Терезів", scorpio: "Скорпіона", sagittarius: "Стрільця", capricorn: "Козорога", aquarius: "Водолія", pisces: "Риб" };

const COPY = {
  en: {
    home: "Home", crumb: "Breadcrumb", section: "Your day",
    title: ["Your day", "in the sky and the cards"],
    lead: "Choose your sign and today’s real sky is read for you: the event that leads the day, the houses it falls in and the hours that matter. Read the way the cards are read, for reflection and never as a forecast.",
    calculating: "Working out today’s sky…",
    signs: { choose: "Choose your sign", yours: "Your sign", change: "Change sign", list: "The twelve signs" },
    signCard: (sign: Sign, name: string) => `The card of ${name}`,
    planetCard: (planet: string) => `${POSSESSIVE[planet] ?? planet} card`,
    signOfPlanet: (sign: Sign, name: string, planet: string) => `${name}’s card — ${(POSSESSIVE[planet] ?? planet).replace(/^The /, "the ")} sign today`,
    event: "The day’s leading event",
    kyiv: "Kyiv\u00a0time", now: "Now",
    reading: "today’s reading",
    readingOn: (date: string) => `the reading for ${date}`,
    scene: "How it might look", doLabel: "Worth doing", avoidLabel: "Worth leaving", ask: "A question for today",
    areasHead: ["Where the day", "touches you"],
    areasLead: "Each area follows its ruling planet through today’s sky, shown with that planet’s Major Arcana card — or, when that card already leads the day, with the card of the sign the planet stands in.",
    until: (when: string) => `until ${when}`,
    cardHead: ["One card", "for everyone today"],
    cardLead: "Chosen by the date, the same for every reader and independent of your sign. It adds a second voice to the reading.",
    skyNow: ["The sky", "right now"],
    skyOn: (date: string) => ["The sky", `at noon on ${date}`],
    chartKicker: "Beyond today", chartHead: ["Your", "birth chart"], chartTag: "Your birth chart",
    chartText: "A card for your Sun, your Moon and your Rising sign, and the whole sky dealt in cards at the moment you were born. Worked out on your device.",
    chartCta: "Read my chart",
    methodKicker: "How this is read",
    method: "Positions are calculated for noon in Kyiv with Astronomy Engine (apparent geocentric, tropical zodiac). Houses are whole-sign houses counted from your Sun sign, the usual method for a sign reading, not your birth-time houses. Exact moments are solved to the minute. The writing is Olivia’s own and offers a way of looking at the day.",
    boundary: "A way of looking at the day, never a forecast.",
    otherDay: "This leaf is for another day.", backToday: "Back to today", backShort: "Back to today",
    announce: (sign: string, headline: string) => `Today’s reading for ${sign}: ${headline}`,
    announceOn: (sign: string, date: string, headline: string) => `${sign}, the reading for ${date}: ${headline}`,
    areas: { love: ["Love"], work: ["Work", "and", "money"], self: ["Body", "and", "mood"] } as Record<string, string[]>,
  },
  uk: {
    home: "Головна", crumb: "Навігаційний шлях", section: "Ваш день",
    title: ["Ваш день", "у небі й картах"],
    lead: "Оберіть свій знак, і сьогоднішнє справжнє небо буде прочитано для вас: подія, що веде день, будинки, на які вона припадає, і години, що мають значення. Його читають так само, як карти: для роздумів, а не для прогнозу.",
    calculating: "Розраховуємо сьогоднішнє небо…",
    signs: { choose: "Оберіть свій знак", yours: "Ваш знак", change: "Змінити знак", list: "Дванадцять знаків" },
    signCard: (sign: Sign) => `Карта ${SIGN_GENITIVE[sign]}`,
    planetCard: (planet: string) => `Карта ${GENITIVE[planet] ?? planet}`,
    signOfPlanet: (sign: Sign, name: string, planet: string) => `Карта ${SIGN_GENITIVE[sign] ?? name} — знак ${GENITIVE[planet] ?? planet} сьогодні`,
    event: "Головна подія дня",
    kyiv: "за\u00a0Києвом", now: "Зараз",
    reading: "читання на сьогодні",
    readingOn: (date: string) => `читання на ${date}`,
    scene: "Як це може виглядати", doLabel: "Варто зробити", avoidLabel: "Варто облишити", ask: "Запитання на сьогодні",
    areasHead: ["Де день", "вас торкається"],
    areasLead: "Кожну сферу веде її планета-управитель. Поруч — карта цієї планети зі Старших Арканів, а якщо вона вже веде день, — карта знака, у якому планета стоїть сьогодні.",
    until: (when: string) => `до ${when}`,
    cardHead: ["Одна карта", "для всіх сьогодні"],
    cardLead: "Її обирає дата: вона однакова для всіх і не залежить від вашого знака. Вона додає до читання другий голос.",
    skyNow: ["Небо", "цієї миті"],
    skyOn: (date: string) => ["Небо", `опівдні ${date}`],
    chartKicker: "Поза цим днем", chartHead: ["Ваша", "натальна карта"], chartTag: "Ваша натальна карта",
    chartText: "Карта для вашого Сонця, Місяця й Асцендента та все небо, розкладене картами, у мить вашого народження. Розраховується на вашому пристрої.",
    chartCta: "Прочитати мою карту",
    methodKicker: "Як це прочитано",
    method: "Положення розраховано на полудень за київським часом за Astronomy Engine (видимі геоцентричні, тропічний зодіак). Будинки — цілознакові, відлічені від вашого сонячного знака, як заведено для читання за знаком; це не будинки вашого часу народження. Точні моменти розраховано до хвилини. Текст написала Olivia, щоб запропонувати погляд на день.",
    boundary: "Погляд на день, а не прогноз.",
    otherDay: "Цей аркуш — за інший день.", backToday: "Повернутися до сьогодні", backShort: "До сьогодні",
    announce: (sign: string, headline: string) => `Читання на сьогодні для знака ${sign}: ${headline}`,
    announceOn: (sign: string, date: string, headline: string) => `Читання на ${date} для знака ${sign}: ${headline}`,
    areas: { love: ["Кохання"], work: ["Робота", "й", "гроші"], self: ["Тіло", "й", "настрій"] } as Record<string, string[]>,
  },
};

/* The kicker's aspect glyphs, set in the symbols face and read aloud by name ("trine", «з’єднання»). */
const ASPECT_OF: Record<string, string> = Object.fromEntries(Object.entries(COMPOSE.ASP_GLYPH as Record<string, string>).map(([key, glyph]) => [glyph, key]));

const shiftDate = (date: string, k: number) => new Date(Date.parse(date + "T12:00:00Z") + k * 864e5).toISOString().slice(0, 10);
/** A real calendar day in range: 2026-02-30 (read as 2 March) or 2026-13-01 fails the round trip and falls back to today. */
const validDate = (s: string | null) => {
  const t = s && /^\d{4}-\d{2}-\d{2}$/.test(s) && +s.slice(0, 4) >= 1900 && +s.slice(0, 4) <= 2100 ? Date.parse(s + "T00:00:00Z") : NaN;
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10) === s ? s : null;
};

/** The same card for every reader on one Kyiv date (the formula of lib/daily-card, over the deck order). */
function cardOfTheDay(date: string, size: number) {
  const [y, m, day] = date.split("-").map(Number);
  const dayOfYear = Math.round((Date.UTC(y, m - 1, day) - Date.UTC(y, 0, 0)) / 86400000);
  const seed = dayOfYear * 2654435761;
  return { index: Math.abs(seed) % size, reversed: Math.abs(seed >> 8) % 3 === 0 };
}

/** Play the arrival only for a (date, sign) this tab has not seen settle, with motion allowed and the page visible. */
function arrivalFor(date: string, sign: string): "pending" | "rest" {
  return !hasPlayed(arrivalKey(date, sign)) && !prefersReducedMotion() && !document.hidden ? "pending" : "rest";
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

/** A homepage two-line head: roman first line, italic second. */
function Head({ id, lines, className }: { id?: string; lines: string[]; className?: string }) {
  return <h2 id={id} className={`${d.head} ${className ?? ""}`}><span>{lines[0]}</span> <em>{lines[1]}</em></h2>;
}

export default function DailyLeaf({ locale, copy, cards, deck }: { locale: Locale; copy: AstroCopy; cards: MajorCard[]; deck: DeckCard[] }) {
  const c = COPY[locale];
  const base = locale === "uk" ? "/uk" : "";
  if (typeof window !== "undefined") void loadLib(locale);
  // the first mount hydrates the prerender, so it starts generic; a remount starts from what is known
  const [sign, setSign] = useState<Sign | null>(() => booted?.sign ?? null);
  const [mode, setMode] = useState<"pending" | "compact" | "open">(() => (booted ? (booted.sign ? "compact" : "open") : "pending"));
  const [date, setDate] = useState<string | null>(() => booted?.date ?? null);
  const [days, setDays] = useState<Days | null>(() => (booted ? skyCache.get(booted.date) ?? null : null));
  const [lib, setLib] = useState<object | null>(() => (booted ? libCache[locale] ?? null : null));
  const [turned, setTurned] = useState<boolean | null>(() => booted?.turned ?? null);
  const [now, setNow] = useState<number | null>(null);
  // a link that named its sign keeps naming it ("Back to today" carries ?sign= along)
  const [signInUrl, setSignInUrl] = useState(() => booted?.signInUrl ?? false);
  // arrival: "pending" waits for the reading, "play" runs it, "done"/"rest" are the still page
  const [arrival, setArrival] = useState<"pending" | "play" | "done" | "rest">(() => (booted?.sign ? arrivalFor(booted.date, booted.sign) : "rest"));
  const [awaiting, setAwaiting] = useState(() => !!booted?.sign);
  const [swap, setSwap] = useState<"out" | "in" | null>(null);
  const [changed, setChanged] = useState(false);
  // the sign whose reading is announced once it has been worked out (never the reading it replaces)
  const [announceFor, setAnnounceFor] = useState<Sign | null>(null);
  const hero = useRef<HTMLElement | null>(null);
  const title = useRef<HTMLHeadingElement | null>(null);
  // a first visit's choice moves focus to the new headline once its reading is worked out
  const focusTitle = useRef(false);
  const readingHead = useRef<HTMLHeadingElement | null>(null);
  const readingEntry = useEntry(readingHead, 0.3);

  // everything here depends on the reader's own moment and device, so it starts after mounting
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const asked = params.get("sign");
    const timer = setTimeout(() => {
      const known = asked && (SIGNS as readonly string[]).includes(asked) ? (asked as Sign) : knownSign();
      const leaf = validDate(params.get("date")) || ENGINE.todayISO();
      const wasTurned = readStored(TURNED_KEY) === leaf;
      booted = { sign: known, date: leaf, turned: wasTurned, signInUrl: params.has("sign") };
      setSign(known); setDate(leaf); setMode(known ? "compact" : "open"); setSignInUrl(booted.signInUrl);
      setTurned(wasTurned);
      if (known) {
        setAwaiting(true);
        setArrival((p) => (p === "play" || p === "done" ? p : arrivalFor(leaf, known)));
      }
    }, 0);
    const tick = () => setNow(Date.now());
    const clock = setInterval(tick, 60_000); tick();
    let live = true;
    loadLib(locale).then((m) => { if (live) setLib(m); });
    return () => { live = false; clearTimeout(timer); clearInterval(clock); };
  }, [locale]);

  // the three days of sky (51–111ms on a desktop) run after the skeleton has painted, never inside render
  useEffect(() => {
    if (!date) return;
    const timer = setTimeout(() => {
      const cached = skyCache.get(date);
      if (cached) { setDays((d0) => (d0 === cached ? d0 : cached)); return; }
      try {
        const sky = { today: ENGINE.day({ date }), history: [ENGINE.day({ date: shiftDate(date, -1) }), ENGINE.day({ date: shiftDate(date, -2) })] };
        skyCache.set(date, sky);
        setDays(sky);
      } catch { setDate(ENGINE.todayISO()); }
    }, 0);
    return () => clearTimeout(timer);
  }, [date]);

  const reading: Reading | null = useMemo(() => {
    if (!days || !lib || !sign) return null;
    COMPOSE.setLibrary(lib);
    return COMPOSE.compose({ day: days.today, sign, lang: locale, natal: null, cardId: null, history: days.history });
  }, [days, lib, sign, locale]);

  // the plate's art needs no text library, so it is requested as soon as the sky is known
  const lead = useMemo(() => (days && sign ? leadEvent(days, sign, reading?.topSignal) : null), [days, sign, reading]);
  // a pending arrival plays as soon as its reading exists (derived, so no effect has to set it)
  const phase = arrival === "pending" && reading ? "play" : arrival;

  // never hide the prerendered copy for long: after 1.5s it returns, and a late reading then simply appears
  const ready = useRef(false);
  useEffect(() => { ready.current = !!reading; });
  useEffect(() => {
    if (!awaiting) return;
    const timer = setTimeout(() => {
      if (ready.current) return;
      setAwaiting(false);
      setArrival((p) => (p === "pending" ? "rest" : p));
    }, 1500);
    return () => clearTimeout(timer);
  }, [awaiting]);

  // the generic copy is hidden only while awaiting a reading that does not exist yet (data-await below)
  useEffect(() => {
    if (reading && focusTitle.current) { focusTitle.current = false; title.current?.focus({ preventScroll: true }); }
  }, [reading]);

  // a plate that never reports its landing (a card hidden by the layout, a stalled tab) still frees the arrival
  useEffect(() => {
    if (phase !== "play") return;
    const timer = setTimeout(() => setArrival("done"), 2400);
    return () => clearTimeout(timer);
  }, [phase]);

  // a sign change: 160ms out, the new reading swapped in a transition, 340ms in, then announced
  useEffect(() => {
    if (swap !== "in") return;
    const timer = setTimeout(() => setSwap(null), 340);
    return () => clearTimeout(timer);
  }, [swap]);

  const choose = (next: Sign) => {
    if (next === sign) return;
    store(SIGN_KEY, next);
    if (booted) booted.sign = next;
    // a link that names the sign keeps the chosen one, so a reload or a shared link shows it
    if (/[?&]sign=/.test(location.search)) history.replaceState(history.state, "", location.pathname + location.search.replace(/([?&])sign=[^&]*/, `$1sign=${next}`) + location.hash);
    const reduce = prefersReducedMotion();
    // a first visit's choice is the arrival: the reading lands as on a return visit, read from the top
    const first = !sign && mode === "open";
    if (first) {
      if (date) setArrival(arrivalFor(date, next));
      hero.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      focusTitle.current = true;
    } else if (hero.current && hero.current.getBoundingClientRect().top < 0) hero.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setAnnounceFor(next);
    if (reduce || !reading) { startTransition(() => { setSign(next); setChanged(true); }); return; }
    setSwap("out");
    setTimeout(() => startTransition(() => { setSign(next); setChanged(true); setSwap("in"); }), 160);
  };

  const settle = () => {
    if (date && sign) markPlayed(arrivalKey(date, sign));
    setArrival((p) => (p === "play" || p === "pending" ? "done" : p));
  };

  const fmt = (t: number, o: Intl.DateTimeFormatOptions) => ENGINE.fmt(t, locale, o) as string;
  const hm = (t: number) => fmt(t, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const dayMonth = (t: number) => fmt(t, { day: "numeric", month: "long" });
  const dateLine = date ? fmt(ENGINE.kyivInstant(date), { weekday: "long", day: "numeric", month: "long" }).replace(/^([A-Za-z]+) (\d)/, "$1, $2").replace(/ʼ/g, "’") : "";
  const isToday = !date || !now || date === ENGINE.todayISO(now);
  const leafDay = date ? dayMonth(ENGINE.kyivInstant(date, 12, 0)) : "";
  const signName = sign ? copy.signs[sign].name : "";
  const signCard = sign ? cards[SIGN_CARDS[SIGNS.indexOf(sign)]] : null;
  const houseName = (n: number | null | undefined) => (n ? copy.houses[String(n)]?.name ?? "" : "");
  const ts = (s: string) => typeset(s, locale);
  const asp = aspectNames(copy);
  const kicker = reading?.kicker ? ts(reading.kicker).replace(/(\d{1,2}:\d{2})/, `$1\u00a0${c.kyiv}`) : "";
  const bodyOf = (key: string) => days?.today.bodies.find((b) => b.key === key);
  const houseOf = (key: string) => { const b = bodyOf(key); return sign && b ? (ENGINE.house(sign, b.signIndex) as number) : null; };
  /** A plate caption's role: the planet's card, then its house. */
  const plateRole = (p: string) => ts([c.planetCard(p), houseName(houseOf(p))].filter(Boolean).join(" · "));
  const daily = useMemo(() => (date ? cardOfTheDay(date, deck.length) : null), [date, deck.length]);
  const arrive = phase === "play";
  const announce = announceFor && sign === announceFor && reading
    ? (isToday ? c.announce(copy.signs[sign].name, reading.headline) : c.announceOn(copy.signs[sign].name, leafDay, reading.headline)) : "";

  /** "until 15:56" on the same Kyiv day; the date (and time for the Moon or within three days) otherwise, never a bare weekday. */
  const until = (planet: string, t: number | null) => {
    if (!t || !days) return "";
    if (t >= days.today.dayStart && t <= days.today.dayEnd) return c.until(hm(t));
    return c.until(planet === "moon" || t - days.today.dayEnd < 3 * 864e5 ? `${dayMonth(t)}, ${hm(t)}` : dayMonth(t));
  };
  const areaTitle = (key: string): ReactNode => {
    const [first, joint, last] = c.areas[key] ?? [key];
    return joint ? <>{first} <em>{joint}</em> {last}</> : first;
  };

  // which copy is generic (shown before the reading): it fades out while a known sign's reading is worked out
  const awaitCls = reading ? "" : d.generic;
  const showEvent = !!reading || mode === "pending" || (!!sign && !reading);
  const paragraphs = reading ? reading.lead.slice(1) : [];
  const capIndex = paragraphs.findIndex((p) => !/^(For you|Для вас)/.test(p) && /^\p{L}/u.test(p));
  const plateLand = arrival === "pending" && !reading ? "hold" : arrive ? "arrival" : changed && !prefersReducedMotion() ? "pair" : false;

  const figure = (variant: "aside" | "inline") => signCard && sign
    ? <ReadingFigure card={signCard} role={locale === "uk" ? COPY.uk.signCard(sign) : COPY.en.signCard(sign, signName)} essence={ts(copy.signs[sign].essence)} variant={variant} />
    : null;

  return (
    <div className={`${a.page} ${d.folio}`} lang={locale} data-daily="" data-ready={reading ? "" : undefined}
      data-await={awaiting && !reading ? "" : undefined} data-arrive={arrive ? "" : undefined} data-swap={swap ?? undefined}>
      <nav aria-label={c.crumb} className={d.crumb}>
        <ol><li><a href={`${base}/`}>{c.home}</a></li><li aria-hidden>/</li><li aria-current="page">{c.section}</li></ol>
      </nav>

      {/* I · Frontispiece */}
      <section className={`${d.band} ${d.front}`} ref={hero} aria-labelledby="leaf-title">
        {/* one row: a dated leaf's notice sits beside its date (on phones only its link shows), so it never pushes the headline down */}
        <div className={d.dateRow}>
          <p className={d.dateLine}>{dateLine || "\u00a0"}</p>
          {date && !isToday && <p className={d.otherDay}><span className={d.otherNote}>{ts(c.otherDay)} </span><a href={`${base}/daily/${signInUrl && sign ? `?sign=${sign}` : ""}`}>{c.backShort === c.backToday ? c.backToday : <><span className={d.backLong}>{c.backToday}</span><span className={d.backShort} aria-hidden>{c.backShort}</span></>}</a></p>}
        </div>
        <h1 id="leaf-title" ref={title} tabIndex={-1} className={`${d.h1} ${d.swap} ${awaitCls}`}>{reading ? ts(reading.headline) : <><span>{ts(c.title[0])}</span> <em>{ts(c.title[1])}</em></>}</h1>
        {showEvent && (
          <div className={`${d.event} ${d.swap}`} aria-hidden={reading ? undefined : true}>
            {reading && days ? (
              <>
                <p className={d.eventLabel}>{c.event}</p>
                <p className={d.kicker}>
                  {kicker.split(/([☌⚹□△☍])/).map((part, i) => (i % 2
                    ? <Fragment key={i}><AspectGlyph aspect={ASPECT_OF[part]} className={d.kGlyph} /><span className={d.srOnly}>{asp[ASPECT_OF[part]]}</span></Fragment>
                    : part))}
                </p>
                {/* a day without a timed event has no ruler: a bare 00–24 track would read as clock chrome */}
                {lead?.at !== undefined && <DayRuler date={days.today.date} dayStart={days.today.dayStart} dayEnd={days.today.dayEnd} at={lead.at}
                  now={isToday && now ? now : undefined} eventLabel={c.event} nowLabel={c.now} hm={hm} />}
              </>
            ) : <div className={d.eventReserve} />}
          </div>
        )}
        <div className={d.plateCol}>
          {mode === "pending" ? <div className={d.plateReserve} aria-hidden />
            : lead && sign ? <HeroPlate key={lead.cards.join("-")} event={lead} cards={cards} day={+(date ?? "").slice(8)} land={plateLand} onSettled={settle} roles={lead.roles.map(plateRole)} />
            : !sign ? <TonightMoon locale={locale} copy={copy} cards={cards} sans /> : <div className={d.plateReserve} aria-hidden />}
        </div>
        <p className={`${d.lead} ${d.swap} ${awaitCls}`}>{reading ? ts(reading.lead[0]) : sign ? c.calculating : ts(c.lead)}</p>
        <div className={d.control}>
          <SignControl mode={mode} sign={sign} names={Object.fromEntries(SIGNS.map((k) => [k, copy.signs[k].name]))} onChoose={choose} labels={c.signs} />
        </div>
      </section>

      {/* II · The reading */}
      {reading && sign && (
        <section className={`${d.band} ${d.readingBand}`} aria-labelledby="reading-title" data-entry={readingEntry}>
          <h2 id="reading-title" ref={readingHead} className={`${d.head} ${d.swap}`}><span>{signName}</span> <em>{isToday ? c.reading : c.readingOn(leafDay)}</em></h2>
          <div className={`${d.readingGrid} ${d.swap}`}>
            <div className={d.readingText}>
              {paragraphs.length === 0 && figure("inline")}
              {paragraphs.map((p, i) => (
                <Fragment key={i}>
                  <p className={/^(For you|Для вас)/.test(p) ? d.bridge : i === capIndex ? d.dropCap : undefined}>{ts(p)}</p>
                  {/* after the first real paragraph, so the bridge stays with the text it introduces */}
                  {i === (capIndex >= 0 ? capIndex : 0) && figure("inline")}
                </Fragment>
              ))}
              {reading.scene && (
                <figure className={d.scene}>
                  <figcaption className={d.eyebrow}>{c.scene}</figcaption>
                  <blockquote>{ts(reading.scene)}</blockquote>
                </figure>
              )}
              {reading.dos.length > 0 && (
                <div className={d.worth}>
                  <section><h3>{c.doLabel}</h3><ul>{reading.dos.map((x, i) => <li key={i}>{ts(x)}</li>)}</ul></section>
                  <span className={d.worthRule} aria-hidden />
                  <section><h3>{c.avoidLabel}</h3><ul>{reading.avoids.map((x, i) => <li key={i}>{ts(x)}</li>)}</ul></section>
                </div>
              )}
            </div>
            {figure("aside")}
          </div>
        </section>
      )}

      {/* III · The pause: the reading's question beside the card of the day (moved up from after the areas; revert this one block to restore the old order) */}
      {date && (
        <section className={`${d.band} ${d.pauseBand}`} aria-labelledby="card-title">
          <div className={`${d.pause} ${reading?.ask ? "" : d.pauseSolo}`}>
            <div className={d.pauseHead}>
              <Head id="card-title" lines={c.cardHead} />
              <p className={d.sectionLead}>{ts(c.cardLead)}</p>
            </div>
            {reading?.ask && <QuestionSlip label={c.ask} question={ts(reading.ask)} />}
            <div className={d.pauseCard}>
              {daily && turned !== null && <DayCard key={`${date}:${turned}`} locale={locale} card={deck[daily.index]} reversed={daily.reversed} faceUp={turned}
                onTurn={() => { store(TURNED_KEY, date); if (booted) booted.turned = true; }} />}
            </div>
          </div>
        </section>
      )}

      {/* IV · Where the day touches you */}
      {reading && reading.areas.length > 0 && days && (
        <section className={`${d.band} ${d.areasBand}`} aria-labelledby="areas-title">
          <Head id="areas-title" lines={c.areasHead} />
          <p className={d.sectionLead}>{ts(c.areasLead)}</p>
          <div className={d.spreads}>
            {(() => {
              // an area shows its planet's card unless the hero already shows it; then the card of the sign the
              // planet stands in today, unless that card is already on the page above too
              const heroIds = new Set(lead?.cards ?? []);
              const used = new Set<number>([...heroIds, ...(signCard ? [signCard.id] : [])]);
              return reading.areas.map((area, i) => {
                const planetId = (BODY_CARDS as Record<string, number>)[area.planet];
                const b = bodyOf(area.planet);
                let id = planetId;
                let corr: string | null = null;
                if (heroIds.has(planetId) && b) {
                  const sid = SIGN_CARDS[b.signIndex];
                  if (!used.has(sid)) { id = sid; corr = c.signOfPlanet(SIGNS[b.signIndex], copy.signs[SIGNS[b.signIndex]].name, area.planet); }
                }
                used.add(id);
                const place = [copy.bodies[area.planet]?.name + (b?.retro ? " ℞" : ""), houseName(area.house)].filter(Boolean).join(" · ");
                const roles = [corr, place, until(area.planet, area.leaves)].filter((x): x is string => !!x);
                return <AreaSpread key={area.key} index={i} card={cards[id]} house={area.house} ghost={i === 0 || area.house !== reading.areas[i - 1].house} title={areaTitle(area.key)} roles={roles} text={ts(area.text)} />;
              });
            })()}
          </div>
        </section>
      )}

      {/* V · The sky */}
      <div className={`${d.band} ${d.skyBand}`}>
        <TonightSky locale={locale} copy={copy} cards={cards}
          title={(date && !isToday ? c.skyOn(leafDay) : c.skyNow).map(ts) as [string, string]}
          at={date && !isToday ? ENGINE.kyivInstant(date, 12, 0) : undefined}
          // another day's chip would only repeat the heading's "at noon on …"
          nudge={false} listCards="names" playWhenSeen nameCards stamp={isToday} lightKey={reading?.topSignal.planet} />
      </div>

      {/* VI · The almanac */}
      {reading && days && now && (
        <div className={`${d.band} ${d.almanacBand}`}>
          <DailyAlmanac locale={locale} reading={reading} day={days.today} copy={copy} now={now} />
        </div>
      )}

      {/* VII · The door to the birth chart, and the colophon */}
      <section className={`${d.band} ${d.doorBand}`} aria-labelledby="chart-title">
        <div className={d.door}>
          <CardFigure as="div" className={d.doorCard} name={c.chartTag} href={`${base}/astrology/birth-chart/`} image="/cards/back-448.webp"
            rotate={-3} elevation="lie" priority="low" inert sizes="(min-width: 900px) 14rem, min(52vw, 13rem)" />
          <div className={d.doorText}>
            <p className={d.eyebrow}>{c.chartKicker}</p>
            <Head id="chart-title" lines={c.chartHead} />
            <p className={d.doorBody}>{ts(c.chartText)}</p>
            <a href={`${base}/astrology/birth-chart/`} className={d.primary}>{c.chartCta}<i aria-hidden>↗</i></a>
          </div>
        </div>
        <div className={d.colophon}>
          <h2 className={d.eyebrow}>{c.methodKicker}</h2>
          <p className={d.method}>{ts(c.method)}</p>
          <p className={d.boundary}>{c.boundary}</p>
        </div>
      </section>

      <p className={d.srOnly} aria-live="polite">{announce}</p>
    </div>
  );
}
