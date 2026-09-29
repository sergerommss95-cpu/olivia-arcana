"use client";

/**
 * Birth chart: the form (folded to one line once a chart is showing), then
 * three cards (Sun, Moon, Rising), the sky dealt in cards, where everything
 * stood and the closest aspects. Everything is computed here in the
 * browser; the details are kept only if the reader asks.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { birthChart, zoneOffsetMinutes, SIGN_CARDS, BODY_GLYPHS } from "@/lib/astrology/chart.js";
import { customPlace, fixedOffsetZone, loadPlaces, searchPlaces, type Place } from "@/lib/astrology/places";
import { forgetProfile, legacyBirth, loadProfile, saveProfile } from "@/lib/astrology/profile";
import { formatDegree, type Chart, type Placement } from "@/lib/astrology/types";
import { placedIn } from "@/lib/astrology/grammar";
import type { AstroCopy } from "@/lib/astrology/copy";
import type { MajorCard } from "@/lib/astrology/deck";
import SkyScene from "./SkyScene";
import { SCENE_STRINGS, aspectNames, sceneBodies, sceneSigns } from "./scene-data";
import ThreeCards, { type Dealt } from "./ThreeCards";
import styles from "./astrology.module.css";

type Locale = "en" | "uk";

const UI = {
  en: {
    home: "Home", crumb: "Breadcrumb", section: "Astrology", kicker: "Olivia Astrology", title: "Your birth chart",
    lead: "The sky at the moment you were born, read as a practice: a card for your Sun, your Moon and your Rising sign, and a map of where everything stood. It is worked out on this device, and your details are not sent anywhere.",
    legend: "Your birth", date: "Date of birth", time: "Time of birth", unknownTime: "I don’t know the time",
    timeHint: "From a birth certificate if you have one. Even an hour can change the Rising sign.",
    place: "Place of birth", placeHint: "Start typing a town or city, in English or Ukrainian.", loading: "Loading places…",
    noMatch: "No match. Try another spelling, or enter coordinates.", coords: "Enter coordinates instead", list: "Choose from the list instead",
    lat: "Latitude", lon: "Longitude", zone: "Time zone", remember: "Remember on this device",
    rememberHint: "Kept only in this browser. Nothing is sent to us.", submit: "Read my chart", forget: "Forget my details", forgotten: "Your details have been removed from this browser.",
    change: "Change details", cancel: "Keep these details", born: "Born", needPlace: "Choose a place from the list, or enter coordinates.", needDate: "Enter a date between 1800 and 2100.",
    needCoords: "Enter a latitude between −90 and 90 and a longitude between −180 and 180.",
    summer: "summer time", localIs: (local: string, utc: string) => `${local} local time is ${utc} UTC`,
    skipped: (time: string, shifted: string) => `The clocks went forward that night, so ${time} never happened there. The chart reads it as ${shifted}; please check the certificate.`,
    repeated: (time: string) => `The clocks went back that night, so ${time} happened twice there. The chart uses the first of the two.`,
    noTime: "Birth time not known: the chart uses midday.",
    threeTitle: "Your three cards", threeLead: "Your Sun, Moon and Rising sign, each with the Major Arcana card of its sign.",
    sun: "Sun", moon: "Moon", rising: "Rising", or: "or", atMidday: (sign: string) => `${sign} at midday`,
    wheelTitle: "Your sky, dealt in cards", wheelCaption: "Twelve Major Arcana cards are laid round the sky, one for each sign, and your Sun, Moon and Rising cards stand up from the spread in gold. At the centre lie the real stars of the zodiac; the planets hover over their degrees and threads join the closest aspects.",
    wheelCaptionNoTime: "Twelve Major Arcana cards are laid round the sky, one for each sign, from 0° Aries on the left; your Sun and Moon cards stand up from the spread in gold. At the centre lie the real stars of the zodiac, with the planets over their degrees. The Rising sign needs a birth time.",
    wheelLabel: "Birth chart wheel", ledgerTitle: "Where everything stood", ledgerLead: "Open a line to read what it describes and a question to take with you.",
    house: "house", retrograde: "retrograde", aspectsTitle: "Conversations in the chart",
    aspectsLead: "The closest angles between planets. Each is a pairing to notice, not a verdict.", orb: "orb", method: "How this chart is made",
  },
  uk: {
    home: "Головна", crumb: "Навігаційний шлях", section: "Астрологія", kicker: "Астрологія Olivia", title: "Ваша натальна карта",
    lead: "Небо в мить вашого народження, прочитане як практика: карта для вашого Сонця, Місяця й Асцендента та мапа того, де все стояло. Усе розраховується на цьому пристрої, і ваші дані нікуди не надсилаються.",
    legend: "Ваше народження", date: "Дата народження", time: "Час народження", unknownTime: "Я не знаю часу",
    timeHint: "Зі свідоцтва про народження, якщо воно є. Навіть година може змінити Асцендент.",
    place: "Місце народження", placeHint: "Почніть вводити назву міста українською або англійською.", loading: "Завантажуємо міста…",
    noMatch: "Нічого не знайдено. Спробуйте інше написання або введіть координати.", coords: "Ввести координати", list: "Обрати зі списку",
    lat: "Широта", lon: "Довгота", zone: "Часовий пояс", remember: "Запам’ятати на цьому пристрої",
    rememberHint: "Зберігається лише в цьому браузері. Нам нічого не надсилається.", submit: "Прочитати мою карту", forget: "Забути мої дані", forgotten: "Ваші дані видалено з цього браузера.",
    change: "Змінити дані", cancel: "Залишити ці дані", born: "Народження", needPlace: "Оберіть місце зі списку або введіть координати.", needDate: "Введіть дату між 1800 і 2100 роками.",
    needCoords: "Введіть широту від −90 до 90 і довготу від −180 до 180.",
    summer: "літній час", localIs: (local: string, utc: string) => `${local} за місцевим часом — це ${utc} UTC`,
    skipped: (time: string, shifted: string) => `Тієї ночі годинники перевели вперед, тож часу ${time} там не було. Карта читає його як ${shifted}; перевірте, будь ласка, свідоцтво.`,
    repeated: (time: string) => `Тієї ночі годинники перевели назад, тож час ${time} там був двічі. Карта бере перший із двох.`,
    noTime: "Час народження невідомий: карта розрахована на полудень.",
    threeTitle: "Ваші три карти", threeLead: "Ваше Сонце, Місяць і Асцендент, кожен із картою Старших Арканів свого знака.",
    sun: "Сонце", moon: "Місяць", rising: "Асцендент", or: "або", atMidday: (sign: string) => `опівдні: ${sign}`,
    wheelTitle: "Ваше небо, розкладене картами", wheelCaption: "Навколо неба розкладено дванадцять карт Старших Арканів, по одній на кожен знак, а карти вашого Сонця, Місяця й Асцендента встають над розкладом у золоті. У центрі — справжні зорі зодіаку; планети зависають над своїми градусами, а нитки поєднують найточніші аспекти.",
    wheelCaptionNoTime: "Навколо неба розкладено дванадцять карт Старших Арканів, по одній на кожен знак, від 0° Овна ліворуч; карти вашого Сонця й Місяця встають над розкладом у золоті. У центрі — справжні зорі зодіаку й планети над своїми градусами. Для Асцендента потрібен час народження.",
    wheelLabel: "Коло натальної карти", ledgerTitle: "Де все стояло", ledgerLead: "Відкрийте рядок, щоб прочитати, що він описує, і запитання, яке варто взяти з собою.",
    house: "будинок", retrograde: "ретроградний", aspectsTitle: "Розмови в карті",
    aspectsLead: "Найточніші кути між планетами. Кожен — пара, яку варто помітити, а не вирок.", orb: "орбіс", method: "Як побудована ця карта",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const ASPECT_GLYPHS: Record<string, string> = { conjunction: "☌", sextile: "⚹", square: "□", trine: "△", opposition: "☍" };
const TEXT = "︎"; // text presentation: glyphs never become emoji
function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? "−" : "+";
  const abs = Math.abs(minutes);
  return `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ":" + pad(abs % 60) : ""}`;
}
function isSummer(zone: string, utc: Date, offset: number): boolean {
  const year = utc.getUTCFullYear();
  const standard = Math.min(zoneOffsetMinutes(zone, Date.UTC(year, 0, 15)), zoneOffsetMinutes(zone, Date.UTC(year, 6, 15)));
  return offset > standard;
}
function zones(): string[] {
  try { return (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf("timeZone"); }
  catch { return ["Europe/Kyiv", "Europe/London", "Europe/Warsaw", "Europe/Berlin", "America/New_York", "America/Toronto", "Etc/UTC"]; }
}

export default function BirthChart({ locale, copy, cards }: { locale: Locale; copy: AstroCopy; cards: MajorCard[] }) {
  const t = UI[locale];
  const id = useId();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [coords, setCoords] = useState(false);
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [zone, setZone] = useState("Europe/Kyiv");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<{ chart: Chart; place: Place; date: string; time: string | null; id: number } | null>(null);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const placeName = (p: Place) => (locale === "uk" ? p.uk : p.en);
  const countryName = (p: Place) => (locale === "uk" ? p.countryUk : p.countryEn);
  const suggestions = useMemo(() => (places && !place ? searchPlaces(places, query) : []), [places, place, query]);

  function show(birthDate: string, birthTime: string | null, birthPlace: Place, focus: boolean) {
    const chart = birthChart({ date: birthDate, time: birthTime, zone: birthPlace.zone, latitude: birthPlace.lat, longitude: birthPlace.lon }) as Chart;
    setResult({ chart, place: birthPlace, date: birthDate, time: birthTime, id: Date.now() });
    // A fresh chart is dealt face down; one reopened from this device arrives turned.
    setRevealed(focus ? [] : ["sun", "moon", "ascendant"]);
    if (focus) requestAnimationFrame(() => resultsRef.current?.focus());
  }

  // A saved profile (or details from the older chart pages) opens straight onto the chart.
  useEffect(() => {
    const saved = loadProfile();
    if (saved) {
      setDate(saved.date); setTime(saved.time ?? ""); setTimeUnknown(!saved.time); setPlace(saved.place); setQuery(placeName(saved.place));
      show(saved.date, saved.time, saved.place, false);
      return;
    }
    const legacy = legacyBirth();
    if (!legacy) return;
    loadPlaces().then((list) => {
      setPlaces(list);
      const named = legacy.city ? searchPlaces(list, legacy.city, 1)[0] : undefined;
      const zoneId = fixedOffsetZone(legacy.offsetHours);
      const found = named ?? (zoneId ? customPlace(legacy.latitude, legacy.longitude, zoneId) : null);
      setDate(legacy.date); setTime(legacy.time ?? ""); setTimeUnknown(!legacy.time);
      if (!found) return;
      setPlace(found); setQuery(placeName(found));
      show(legacy.date, legacy.time, found, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  function ensurePlaces() {
    if (!places) loadPlaces().then(setPlaces);
  }

  function choose(p: Place) {
    setPlace(p); setQuery(placeName(p)); setOpen(false); setError("");
  }

  function onPlaceKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActive((i) => (i + 1) % suggestions.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (event.key === "Enter" && open) { event.preventDefault(); choose(suggestions[active]); }
    else if (event.key === "Escape") setOpen(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setNotice("");
    const year = Number(date.slice(0, 4));
    if (!date || year < 1800 || year > 2100) return setError(t.needDate);
    let birthPlace = place;
    if (coords) {
      const la = Number(lat.replace(",", ".")), lo = Number(lon.replace(",", "."));
      if (!lat || !lon || !Number.isFinite(la) || !Number.isFinite(lo) || Math.abs(la) > 90 || Math.abs(lo) > 180) return setError(t.needCoords);
      birthPlace = customPlace(la, lo, zone);
    }
    if (!birthPlace) return setError(t.needPlace);
    setError("");
    const birthTime = timeUnknown || !time ? null : time;
    if (remember) saveProfile({ v: 1, date, time: birthTime, place: birthPlace });
    setEditing(false);
    show(date, birthTime, birthPlace, true);
  }

  function edit() {
    setEditing(true);
    requestAnimationFrame(() => { formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); dateRef.current?.focus({ preventScroll: true }); });
  }

  function cancel() {
    if (!result) return;
    setDate(result.date); setTime(result.time ?? ""); setTimeUnknown(!result.time); setPlace(result.place); setQuery(placeName(result.place));
    setCoords(false); setError(""); setEditing(false);
    requestAnimationFrame(() => changeRef.current?.focus());
  }

  function forget() {
    forgetProfile();
    setResult(null); setEditing(false); setDate(""); setTime(""); setTimeUnknown(false); setPlace(null); setQuery(""); setLat(""); setLon("");
    setNotice(t.forgotten);
  }

  const card = (index: number) => cards[index];
  const body = (key: string) => result?.chart.bodies.find((b) => b.key === key) as Placement;
  const signName = (sign: string) => copy.signs[sign].name;
  const listId = `${id}-places`;
  const longDate = (iso: string) => new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  const resolved = (chart: Chart, birth: { place: Place; time: string | null }) => {
    const local = birth.time ?? "12:00", offset = chart.moment.offsetMinutes;
    const utc = `${pad(chart.moment.utc.getUTCHours())}:${pad(chart.moment.utc.getUTCMinutes())}`;
    return `${offsetLabel(offset)}${isSummer(birth.place.zone, chart.moment.utc, offset) ? ` (${t.summer})` : ""} · ${chart.moment.timeKnown ? t.localIs(local, utc) : t.noTime}`;
  };

  return (
    <div className={styles.page} lang={locale}>
      <nav aria-label={t.crumb} className={styles.crumb}>
        <ol>
          <li><a href={locale === "uk" ? "/uk/" : "/"}>{t.home}</a></li><li aria-hidden>/</li>
          <li><a href={locale === "uk" ? "/uk/astrology/" : "/astrology/"}>{t.section}</a></li><li aria-hidden>/</li>
          <li aria-current="page">{t.title}</li>
        </ol>
      </nav>
      <header className={styles.head}>
        <p className={styles.kicker}>{t.kicker}</p>
        <h1 className={styles.h1}>{t.title}</h1>
        <p className={styles.lead}>{t.lead}</p>
      </header>

      {result && !editing && (
        <div className={styles.birthStrip}>
          <div>
            <p className={styles.kicker}>{t.born}</p>
            <p className={styles.birthLine}>
              {longDate(result.date)}{result.time ? `, ${result.time}` : ""}
              <span aria-hidden> · </span><span className={styles.birthPlace}>{placeName(result.place)}{countryName(result.place) ? `, ${countryName(result.place)}` : ""}</span>
            </p>
            <p className={styles.resolved}>{resolved(result.chart, result)}</p>
          </div>
          <div className={styles.stripActions}>
            <button ref={changeRef} type="button" className={styles.textButton} onClick={edit}>{t.change}</button>
            <button type="button" className={styles.textButton} onClick={forget}>{t.forget}</button>
          </div>
        </div>
      )}
      {notice && !result && <p className={styles.hint} role="status">{notice}</p>}

      {(!result || editing) && <form ref={formRef} className={styles.form} onSubmit={submit} noValidate>
        <fieldset>
          <legend className={styles.kicker}>{t.legend}</legend>
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>{t.date}</span>
              <input ref={dateRef} type="date" required min="1800-01-01" max="2100-12-31" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className={styles.field}>
              <span>{t.time}</span>
              <input type="time" value={time} disabled={timeUnknown} onChange={(e) => setTime(e.target.value)} aria-describedby={`${id}-time-hint`} />
            </label>
          </div>
          <label className={styles.check}>
            <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
            <span>{t.unknownTime}</span>
          </label>
          <p id={`${id}-time-hint`} className={styles.hint}>{t.timeHint}</p>

          {!coords ? (
            <div className={styles.field}>
              <label htmlFor={`${id}-place`}>{t.place}</label>
              <div className={styles.combo}>
                <input
                  id={`${id}-place`} type="text" autoComplete="off" role="combobox" aria-expanded={open && suggestions.length > 0}
                  aria-controls={listId} aria-autocomplete="list" aria-describedby={`${id}-place-hint`}
                  aria-activedescendant={open && suggestions.length ? `${listId}-${active}` : undefined}
                  value={query} onFocus={ensurePlaces}
                  onChange={(e) => { setQuery(e.target.value); setPlace(null); setOpen(true); setActive(0); }}
                  onKeyDown={onPlaceKey} onBlur={() => setTimeout(() => setOpen(false), 150)}
                />
                {open && suggestions.length > 0 && (
                  <ul id={listId} role="listbox" className={styles.options}>
                    {suggestions.map((p, i) => (
                      <li key={`${p.en}-${p.country}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                        onMouseDown={(e) => { e.preventDefault(); choose(p); }} onMouseEnter={() => setActive(i)}>
                        <span>{placeName(p)}</span> <span className={styles.optionMeta}>{countryName(p)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p id={`${id}-place-hint`} className={styles.hint} aria-live="polite">
                {place || query.length < 2 ? t.placeHint : !places ? t.loading : !suggestions.length ? t.noMatch : t.placeHint}
              </p>
            </div>
          ) : (
            <div className={styles.fieldRow}>
              <label className={styles.field}><span>{t.lat}</span><input inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="50.45" /></label>
              <label className={styles.field}><span>{t.lon}</span><input inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} placeholder="30.52" /></label>
              <label className={styles.field}><span>{t.zone}</span>
                <select value={zone} onChange={(e) => setZone(e.target.value)}>{zones().map((z) => <option key={z}>{z}</option>)}</select>
              </label>
            </div>
          )}
          <button type="button" className={styles.textButton} onClick={() => { setCoords(!coords); setError(""); }}>{coords ? t.list : t.coords}</button>

          <label className={styles.check}>
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>{t.remember}</span>
          </label>
          <p className={styles.hint}>{t.rememberHint}</p>

          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button type="submit" className={styles.primary}>{t.submit}</button>
            {result && <button type="button" className={styles.textButton} onClick={cancel}>{t.cancel}</button>}
          </div>
        </fieldset>
      </form>}

      {result && (() => {
        const { chart } = result;
        const sun = body("sun"), moon = body("moon");
        const local = result.time ?? "12:00";
        const offset = chart.moment.offsetMinutes;
        const shiftedWall = new Date(chart.moment.utc.getTime() + offset * 60_000);
        const shifted = `${pad(shiftedWall.getUTCHours())}:${pad(shiftedWall.getUTCMinutes())}`;
        const three = [
          { label: t.sun, key: "sun", placement: sun, note: copy.bigThree.sun[sun.sign] },
          { label: t.moon, key: "moon", placement: moon, note: copy.bigThree.moon[moon.sign], alternative: chart.moonSigns },
          ...(chart.ascendant ? [{ label: t.rising, key: "ascendant", placement: chart.ascendant, note: copy.bigThree.ascendant[chart.ascendant.sign] }] : []),
        ];
        const ledger = [...(chart.ascendant ? [chart.ascendant] : []), ...(chart.midheaven ? [chart.midheaven] : []), ...chart.bodies];
        return (
          <section className={styles.results} aria-labelledby={`${id}-results`}>
            <h2 id={`${id}-results`} ref={resultsRef} tabIndex={-1} className={styles.srOnly}>{t.title}</h2>
            {chart.moment.status === "skipped" && <p className={styles.notice}>{t.skipped(local, shifted)}</p>}
            {chart.moment.status === "repeated" && <p className={styles.notice}>{t.repeated(local)}</p>}

            <section className={styles.block} aria-labelledby={`${id}-three`}>
              <h2 id={`${id}-three`} className={styles.h2}>{t.threeTitle}</h2>
              <p className={styles.blockLead}>{t.threeLead}</p>
              <ThreeCards key={result.id} locale={locale} faceUp={revealed} onTurn={(key) => setRevealed((now) => [...now, key])}
                dealt={three.map((item): Dealt => {
                  const major = card(SIGN_CARDS[item.placement.index]);
                  const subject = item.key === "ascendant" ? t.rising : copy.bodies[item.key].name;
                  const alt = "alternative" in item && item.alternative ? item.alternative : null;
                  return {
                    key: item.key as Dealt["key"], label: item.label, note: item.note, card: major,
                    title: alt ? `${placedIn(locale, subject, alt[0], signName(alt[0]))} ${t.or} ${signName(alt[1])}` : placedIn(locale, subject, item.placement.sign, signName(item.placement.sign)),
                    degree: alt ? t.atMidday(signName(item.placement.sign)) : formatDegree(item.placement.degree),
                    aside: alt ? copy.ui.timeUnknownMoon : undefined,
                  };
                })}
                missing={chart.ascendant ? undefined : { label: t.rising, text: copy.ui.timeUnknownRising }} />
            </section>

            <figure className={styles.figure}>
              <h2 className={styles.h2}>{t.wheelTitle}</h2>
              <SkyScene locale={locale} revealed={revealed} roleNames={{ sun: t.sun, moon: t.moon, ascendant: t.rising }} bodies={chart.bodies} ascendant={chart.ascendant} midheaven={chart.midheaven} aspects={chart.aspects}
                signCards={sceneSigns(copy, cards, chart.ascendant?.index)} strings={SCENE_STRINGS[locale]} aspectNames={aspectNames(copy)}
                bodyInfo={sceneBodies(locale, copy, ledger, { retrograde: t.retrograde, rising: t.rising, houses: true, questions: true })}
                labels={Object.fromEntries(chart.bodies.map((p) => [p.key, `${placedIn(locale, copy.bodies[p.key].name, p.sign, signName(p.sign))} · ${formatDegree(p.degree)}`]))}
                description={`${placedIn(locale, copy.bodies.sun.name, sun.sign, signName(sun.sign))}; ${placedIn(locale, copy.bodies.moon.name, moon.sign, signName(moon.sign))}${chart.ascendant ? `; ${placedIn(locale, t.rising, chart.ascendant.sign, signName(chart.ascendant.sign))}` : ""}.`} />
              <figcaption className={styles.caption}>{chart.ascendant ? t.wheelCaption : t.wheelCaptionNoTime}</figcaption>
            </figure>

            <section className={styles.block} aria-labelledby={`${id}-ledger`}>
              <h2 id={`${id}-ledger`} className={styles.h2}>{t.ledgerTitle}</h2>
              <p className={styles.blockLead}>{t.ledgerLead}</p>
              <ul className={styles.ledger}>
                {ledger.map((p) => {
                  const text = copy.bodies[p.key];
                  const house = p.house ? copy.houses[String(p.house)] : null;
                  const major = card(SIGN_CARDS[p.index]);
                  return (
                    <li key={p.key}>
                      <details className={styles.row}>
                        <summary>
                          <span className={styles.glyph} aria-hidden>{BODY_GLYPHS[p.key] + TEXT}</span>
                          <span className={styles.rowName}>{placedIn(locale, text.name, p.sign, signName(p.sign))}</span>
                          <span className={styles.rowMeta}>
                            {formatDegree(p.degree)}{house ? ` · ${house.name}` : ""}{p.retrograde ? ` · ${t.retrograde}` : ""}
                          </span>
                        </summary>
                        <div className={styles.rowBody}>
                          <p>{text.essence}</p>
                          <p>{copy.signs[p.sign].essence}</p>
                          {house && <p><strong>{house.area}.</strong> {house.essence}</p>}
                          <p className={styles.question}>{text.question}</p>
                          <a href={major.href} className={styles.rowCard}>
                            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
                            <img src={major.thumb} alt="" width={120} height={206} loading="lazy" />
                            <span><span className={styles.rowCardSign}>{signName(p.sign)}</span>{major.name}</span>
                          </a>
                        </div>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </section>

            {chart.aspects.length > 0 && (
              <section className={styles.block} aria-labelledby={`${id}-aspects`}>
                <h2 id={`${id}-aspects`} className={styles.h2}>{t.aspectsTitle}</h2>
                <p className={styles.blockLead}>{t.aspectsLead}</p>
                <ul className={`${styles.ledger} ${styles.aspectRows}`}>
                  {chart.aspects.slice(0, 8).map((found) => {
                    const name = (key: string) => (key === "ascendant" ? t.rising : copy.bodies[key].name);
                    return (
                      <li key={`${found.a}-${found.b}`}>
                        <details className={styles.row}>
                          <summary>
                            <span className={`${styles.glyph} ${styles.pair}`} aria-hidden>{BODY_GLYPHS[found.a] + TEXT}<span className={styles.aspectGlyph}>{ASPECT_GLYPHS[found.aspect] + TEXT}</span>{BODY_GLYPHS[found.b] + TEXT}</span>
                            <span className={styles.rowName}>{name(found.a)} · {copy.aspects[found.aspect].name.toLowerCase()} · {name(found.b)}</span>
                            <span className={styles.rowMeta}>{t.orb} {formatDegree(found.orb)}</span>
                          </summary>
                          <div className={styles.rowBody}><p>{copy.aspects[found.aspect].essence}</p></div>
                        </details>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className={styles.method} aria-labelledby={`${id}-method`}>
              <h2 id={`${id}-method`} className={styles.kicker}>{t.method}</h2>
              <p>{copy.ui.method}</p>
              <p className={styles.boundary}>{copy.ui.boundary}</p>
              <button type="button" className={styles.textButton} onClick={edit}>{t.change}</button>
            </section>
          </section>
        );
      })()}
    </div>
  );
}
