"use client";

/** The personal almanac: one cinematic opening, followed by two readable plates. */
import React, { useEffect, useState } from "react";
import Image from "next/image";
import TransitionLink from "@/components/transitions/TransitionLink";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import TheArrival from "@/components/hero/TheArrival";
import EphemerisNote from "@/components/almanac/EphemerisNote";
import { useLocale } from "@/lib/i18n/useLocale";
import { getAlmanacToday, moonPath, type AlmanacToday } from "@/lib/almanac-today";
import { getStoredBirth, storeBirth, birthInfo, type BirthInfo } from "@/lib/birth";
import { SIGN_PAGES } from "@/lib/sign-data";
import styles from "./home.module.css";

const ALM = {
  en: {
    masthead: "Personal Almanac",
    established: "Anno MMXXVI · Kyiv — Everywhere",
    nav: [
      { label: "Birth chart", href: "/chart" },
      { label: "Daily card", href: "/daily" },
      { label: "Tariff", href: "/pricing" },
    ],
    navCta: "Ask the Oracle",
    navAria: "Primary",
    colophonAria: "Legal and about",

    heroKicker: "Plates I–III · A specimen letter · The tariff",
    heroFoot: "Compiled for one reader at a time.",
    counselFor: "Counsel for",
    skyCaption: "Fig. 1 — the sky above you, this hour · every star true · touch a sign on the ecliptic",
    panCaption: "Fig. 0 — the day, drawn as it stands",
    setIn: "This edition set in",

    platesLabel: "The plates",
    plates: [
      {
        numeral: "I",
        title: "The Oracle",
        body: "Bring a question. Choose your spread, turn each card, and follow the thread from symbol to meaning.",
        href: "/oracle",
        cta: "Begin a reading",
        caption: "Fig. 1 — the three-card spread",
      },
      {
        numeral: "II",
        title: "The Birth Chart",
        body: "Date, hour, and place, drawn as a wheel. The baseline every personal reading in this almanac stands on.",
        href: "/portrait",
        cta: "Draw your chart",
        caption: "Fig. 2 — the wheel of houses",
      },
      {
        numeral: "III",
        title: "Synastry",
        body: "Two charts laid over one another. Where two skies meet, hold, and pull — written without jargon.",
        href: "/synastry",
        cta: "Compare two charts",
        caption: "Fig. 3 — two skies, one figure",
      },
    ],

    letterLabel: "A specimen",
    letterTitle: "Context is the whole craft.",
    letterGenericLabel: "Any horoscope",
    letterGeneric: "“You will have good luck today. Stay positive and open to new opportunities.”",
    letterPersonalLabel: "Written for you",
    letterPersonal: "“Your chart points to visibility right now. Initiate the conversation instead of waiting to be chosen.”",
    letterSigned: "— Olivia",
    letterCta: "Read a full specimen",

    tariffLabel: "The tariff",
    tariffTitle: "Begin for nothing.",
    tariffBody: "The daily card and basic chart context are free. Paid plans add full readings, compatibility, and deep spreads.",
    tariffRows: [
      ["Free", "Daily card · basic chart context", "0"],
      ["Insight", "Full readings · the journal", "$4.99 / mo"],
      ["Astronomer", "Compatibility · deep spreads", "$14.99 / mo"],
      ["Patron", "Everything · first in line", "$34.99 / mo"],
    ],
    tariffCta: "Full tariff",
    tariffSmall: "Cancel any time. No fear-selling.",

    faqLabel: "Questions",

    colophonDesc: "Personal astrology and tarot readings for reflection. Your chart gives the context; your choices stay yours.",
    colophonNote: "For entertainment and self-reflection, not professional advice.",
    colophonLinks: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
    colophonLine: "© MMXXVI Olivia Arcana LLC — The stars guide, you decide.",
  },
  uk: {
    masthead: "Особистий альманах",
    established: "Anno MMXXVI · Київ — усюди",
    nav: [
      { label: "Натальна карта", href: "/chart" },
      { label: "Карта дня", href: "/daily" },
      { label: "Тариф", href: "/pricing" },
    ],
    navCta: "Запитати Оракула",
    navAria: "Головна навігація",
    colophonAria: "Правове та про нас",

    heroKicker: "Таблиці I–III · Зразок листа · Тариф",
    heroFoot: "Укладено для одного читача за раз.",
    counselFor: "Порада на",
    skyCaption: "Мал. 1 — небо над вами цієї години · кожна зірка справжня · торкніться знака на екліптиці",
    panCaption: "Мал. 0 — день, накреслений як він є",
    setIn: "Це видання набрано в",

    platesLabel: "Таблиці",
    plates: [
      {
        numeral: "I",
        title: "Оракул",
        body: "Принесіть запитання. Оберіть розклад, переверніть кожну карту й простежте шлях від символу до значення.",
        href: "/oracle",
        cta: "Почати читання",
        caption: "Мал. 1 — розклад із трьох карт",
      },
      {
        numeral: "II",
        title: "Натальна карта",
        body: "Дата, година й місце, накреслені колесом. Основа кожного особистого читання в цьому альманасі.",
        href: "/portrait",
        cta: "Накреслити карту",
        caption: "Мал. 2 — колесо домів",
      },
      {
        numeral: "III",
        title: "Синастрія",
        body: "Дві карти, накладені одна на одну. Де два неба зустрічаються, тримаються і тягнуть — без жаргону.",
        href: "/synastry",
        cta: "Порівняти дві карти",
        caption: "Мал. 3 — два неба, одна фігура",
      },
    ],

    letterLabel: "Зразок",
    letterTitle: "Контекст — усе ремесло.",
    letterGenericLabel: "Будь-який гороскоп",
    letterGeneric: "«Сьогодні вам пощастить. Будьте позитивними та відкритими до нових можливостей.»",
    letterPersonalLabel: "Написано для вас",
    letterPersonal: "«Ваша карта підсвічує тему видимості. Почніть розмову, замість чекати вибору ззовні.»",
    letterSigned: "— Olivia",
    letterCta: "Повний зразок читання",

    tariffLabel: "Тариф",
    tariffTitle: "Почніть безкоштовно.",
    tariffBody: "Карта дня та базовий контекст — безкоштовні. Платні плани додають повні читання, сумісність і глибокі розклади.",
    tariffRows: [
      ["Free", "Карта дня · базовий контекст", "0"],
      ["Insight", "Повні читання · журнал", "$4.99 / міс"],
      ["Astronomer", "Сумісність · глибокі розклади", "$14.99 / міс"],
      ["Patron", "Усе · поза чергою", "$34.99 / міс"],
    ],
    tariffCta: "Повний тариф",
    tariffSmall: "Скасування будь-коли. Без залякування.",

    faqLabel: "Запитання",

    colophonDesc: "Особисті астрологічні й таро-читання для рефлексії. Ваша карта дає контекст; рішення лишаються вашими.",
    colophonNote: "Для розваги та саморефлексії, не професійна порада.",
    colophonLinks: [
      { label: "Про нас", href: "/about" },
      { label: "Контакт", href: "/contact" },
      { label: "Умови", href: "/terms" },
      { label: "Приватність", href: "/privacy" },
      { label: "Застереження", href: "/disclaimer" },
    ],
    colophonLine: "© MMXXVI Olivia Arcana LLC — Зорі підказують, вирішуєте ви.",
  },
};

const ZODIAC = ["♈︎", "♉︎", "♊︎", "♋︎", "♌︎", "♍︎", "♎︎", "♏︎", "♐︎", "♑︎", "♒︎", "♓︎"];

/* Counsel of the day — rotates by day of month, no backend. */
const COUNSEL = {
  en: [
    "Begin the small thing you keep postponing; momentum is quieter than you expect.",
    "What you are waiting for is also ripening; check on it less often.",
    "Notice what you reread three times today — it is asking for a decision.",
    "Say no once, plainly, and skip the paragraph of apology.",
    "Rest before you are empty; repair costs more than maintenance.",
    "Tell one person the true version today, including the boring parts.",
    "If the door will not open, set down the key; you may be early, not wrong.",
    "Put down the argument you keep winning in your head.",
    "Give ten unhurried minutes to something you usually rush.",
    "Send the message before you have perfected it; clarity beats polish.",
    "Let the answer arrive more slowly than your worry wants it to.",
    "Your time is a room; today, decide who actually gets a key.",
    "Do less today on purpose, and watch what still gets done.",
    "Ask the question you already suspect the answer to.",
    "Not every ripe idea needs harvesting today; note it and let it hang.",
    "Return what you keep carrying from your past self: the guilt, mostly.",
    "Listen once today without preparing your reply.",
    "Pick the errand you have been circling and land it before noon.",
    "Move slowly through the part you know best; that is where errors nest.",
    "Leave a little of yourself unexplained today.",
    "Trade one scroll for one stretch of quiet and compare the returns.",
    "Name the thing you want out loud, even if only to the kettle.",
    "Make the difficult call while your morning courage is still warm.",
    "Keep the lesson, misplace the grudge.",
    "Look up on your usual route; a street only repeats itself if you let it.",
    "Write the first ugly draft; the good one is hiding inside it.",
    "Practice giving up your place in line without narrating it.",
    "Reply when you are ready, not when the notification insists.",
    "An early night is also a decision; make it like one.",
    "Correct the small misunderstanding today, while it is still small.",
    "Close one tab, one open loop, one story that no longer fits — start with the tab.",
  ],
  uk: [
    "Почніть ту дрібницю, яку постійно відкладаєте; розгін тихіший, ніж здається.",
    "Те, чого ви чекаєте, теж дозріває; зазирайте до нього рідше.",
    "Помічайте, що сьогодні перечитуєте втретє — воно просить рішення.",
    "Скажіть «ні» один раз, просто, і пропустіть абзац вибачень.",
    "Відпочивайте раніше, ніж скінчаться сили: ремонт коштує дорожче за догляд.",
    "Розкажіть сьогодні комусь одному правдиву версію — разом із нудними подробицями.",
    "Якщо двері не відчиняються, відкладіть ключ — можливо, річ у часі, а не у вас.",
    "Відпустіть суперечку, яку щоразу виграєте подумки.",
    "Подаруйте десять неквапних хвилин тому, що зазвичай робите поспіхом.",
    "Надішліть повідомлення до того, як воно стане ідеальним; ясність важливіша за глянець.",
    "Дайте відповіді прийти повільніше, ніж хоче ваша тривога.",
    "Ваш час — це кімната; сьогодні вирішіть, хто справді має від неї ключ.",
    "Зробіть сьогодні менше навмисно — і подивіться, скільки все одно зробиться.",
    "Поставте питання, відповідь на яке вже підозрюєте.",
    "Не кожну дозрілу ідею треба зривати сьогодні; запишіть — і хай повисить.",
    "Поверніть те, що тягнете з минулого: передусім провину.",
    "Хоч раз сьогодні вислухайте, не готуючи відповідь.",
    "Оберіть справу, навколо якої давно кружляєте, і закрийте її до обіду.",
    "Пройдіть повільно те, що знаєте найкраще; саме там гніздяться помилки.",
    "Залиште сьогодні трохи себе без пояснень.",
    "Обміняйте одну стрічку новин на смугу тиші й порівняйте, що вигідніше.",
    "Назвіть вголос те, чого хочете, — хай навіть тільки чайнику.",
    "Зробіть складний дзвінок, поки ранкова сміливість ще тепла.",
    "Урок збережіть, образу — загубіть.",
    "Підведіть погляд на звичному маршруті; вулиця повторюється, лише якщо їй дозволити.",
    "Напишіть першу негарну чернетку; хороша ховається всередині неї.",
    "Потренуйтеся поступитися чергою без внутрішнього коментаря.",
    "Відповідайте у свій час, а не тоді, коли наполягає сповіщення.",
    "Ранній сон — теж рішення; ухвалюйте його як рішення.",
    "Виправте маленьке непорозуміння сьогодні, поки воно маленьке.",
    "Закрийте одну вкладку, одне незавершене коло, одну історію, що вже тісна, — почніть із вкладки.",
  ],
};

/* Moon as a line engraving: hatched disc, lit region in paper. */
function MoonEngraving({ today, size = 22 }: { today: AlmanacToday; size?: number }) {
  const lit = moonPath(12, 12, 9, today.moonFraction, today.moonWaxing);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="moon-engraving">
      <defs>
        <pattern id="moon-hatch" width="2.4" height="2.4" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="2.4" stroke="currentColor" strokeWidth="0.55" />
        </pattern>
      </defs>
      <circle cx="12" cy="12" r="9" fill="url(#moon-hatch)" opacity="0.55" />
      {lit && <path d={lit} fill="var(--ink, #e8e9ff)" />}
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

const SIGN_SLUGS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const SIGN_TIP_UK: Array<{ name: string; dates: string }> = [
  { name: "Овен", dates: "21 березня — 19 квітня" },
  { name: "Телець", dates: "20 квітня — 20 травня" },
  { name: "Близнюки", dates: "21 травня — 20 червня" },
  { name: "Рак", dates: "21 червня — 22 липня" },
  { name: "Лев", dates: "23 липня — 22 серпня" },
  { name: "Діва", dates: "23 серпня — 22 вересня" },
  { name: "Терези", dates: "23 вересня — 22 жовтня" },
  { name: "Скорпіон", dates: "23 жовтня — 21 листопада" },
  { name: "Стрілець", dates: "22 листопада — 21 грудня" },
  { name: "Козеріг", dates: "22 грудня — 19 січня" },
  { name: "Водолій", dates: "20 січня — 18 лютого" },
  { name: "Риби", dates: "19 лютого — 20 березня" },
];

const ZODIAC_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const DECK_SPECIMENS = [
  "/cards-portal/02_the_high_priestess.webp",
  "/cards-portal/17_the_star.webp",
  "/cards-portal/19_the_sun.webp",
];

function DeckSpecimen({ locale }: { locale: string }) {
  return (
    <TransitionLink href="/oracle" className="deck-specimen" aria-label={locale === "uk" ? "Відкрити Оракул — почати читання" : "Open the Oracle — begin a reading"}>
      <span className="deck-baseline" aria-hidden />
      {DECK_SPECIMENS.map((src, index) => (
        <span key={src} className={`deck-card deck-card-${index}`} aria-hidden>
          <Image src={src} alt="" width={184} height={318} loading="lazy" decoding="async" />
        </span>
      ))}
      <span className="deck-invitation">{locale === "uk" ? "Відкрийте свою історію" : "Open your story"}<span aria-hidden>↗</span></span>
    </TransitionLink>
  );
}

const round = (value: number) => Math.round(value * 1000) / 1000;

/** A stationary zodiac reference. Only the live Sun marker is data-driven;
 * this specimen never invents a reader's houses, planets or aspects. */
function ZodiacSpecimen({ today }: { today: AlmanacToday | null }) {
  const point = (angle: number, radius: number) => ({
    x: round(180 + radius * Math.sin(angle * Math.PI / 180)),
    y: round(180 - radius * Math.cos(angle * Math.PI / 180)),
  });
  const sun = today ? point(today.sunLongitude, 120) : null;
  return (
    <svg viewBox="0 0 360 360" className="zodiac-specimen" aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <circle cx="180" cy="180" r="165" opacity=".28" />
        <circle cx="180" cy="180" r="139" opacity=".5" />
        <circle cx="180" cy="180" r="101" opacity=".28" />
        <circle cx="180" cy="180" r="55" opacity=".13" />
        {Array.from({ length: 72 }, (_, i) => {
          const outer = point(i * 5, 165);
          const inner = point(i * 5, i % 6 === 0 ? 157 : 161);
          return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} opacity={i % 6 === 0 ? .8 : .3} />;
        })}
        {ZODIAC.map((_, i) => {
          const inner = point(i * 30, 101);
          const outer = point(i * 30, 139);
          return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} opacity=".4" />;
        })}
        <path d="M 180 74 V 286 M 74 180 H 286" opacity=".16" />
      </g>
      <g fill="currentColor" fontSize="17" textAnchor="middle" dominantBaseline="central" fontFamily="serif">
        {ZODIAC.map((glyph, i) => {
          const p = point(i * 30 + 15, 152);
          return <text key={i} x={p.x} y={p.y}>{glyph}</text>;
        })}
      </g>
      <circle cx="180" cy="180" r="3" fill="currentColor" />
      {sun && <g>
        <line x1="180" y1="180" x2={sun.x} y2={sun.y} stroke="#d8bb84" opacity=".65" />
        <circle cx={sun.x} cy={sun.y} r="8" fill="#0c1029" stroke="#d8bb84" />
        <circle cx={sun.x} cy={sun.y} r="3" fill="#d8bb84" />
      </g>}
    </svg>
  );
}

function BirthInscription({ locale, birth, setBirth }: {
  locale: string;
  birth: string | null;
  setBirth: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const [dateError, setDateError] = useState("");
  const birthI = React.useMemo<BirthInfo | null>(() => birth ? birthInfo(birth, locale) : null, [birth, locale]);
  return <div className="plate-inscribe" id="inscription">
          {birthI ? (
            <div className="ins-done">
              <span className="ins-glyph" aria-hidden>
                {ZODIAC_GLYPHS[birthI.signIndex]}︎
              </span>
              <p className="ins-line">
                {locale === "uk"
                  ? `СОНЦЕ · ${SIGN_TIP_UK[birthI.signIndex].name.toUpperCase()} — ${birthI.moonPhaseName.toLowerCase()} у ніч вашого народження`
                  : `SOL · ${SIGN_PAGES[SIGN_SLUGS[birthI.signIndex]].name.toUpperCase()} — the moon was ${birthI.moonPhaseName.toLowerCase()} on the night you were born`}
              </p>
              <p className="ins-priv">{locale === "uk" ? "Попередній огляд за датою. Для точного положення Сонця додайте час і місце у повній карті." : "A date-only preview. Add time and place in your full chart for the precise Sun position."}</p>
              <div className="ins-charts">
                <TransitionLink href="/chart" className="btn-ink ins-portrait">
                  {locale === "uk" ? "Накреслити повну карту неба" : "Draw my full birth chart"} →
                </TransitionLink>
                <TransitionLink href={`/signs/${SIGN_SLUGS[birthI.signIndex]}/`} className="link-ox">
                  {locale === "uk" ? "Ваша гравюра" : "Your plate"} →
                </TransitionLink>
              </div>
              <div className="ins-actions">
                <button type="button" className="ins-flash" onClick={() => window.print()}>
                  {locale === "uk" ? "Надрукувати лист" : "Print the leaf"}
                </button>
              </div>
              <button
                type="button"
                className="ins-forget"
                onClick={() => {
                  try {
                    localStorage.removeItem("olivia-birth");
                  } catch {
                    /* nothing to forget */
                  }
                  setBirth(null);
                }}
              >
                {locale === "uk" ? "забути" : "forget"}
              </button>
            </div>
          ) : (
            <form
              className="ins-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const d = parseInt(String(fd.get("bd") ?? ""), 10);
                const m = parseInt(String(fd.get("bm") ?? ""), 10);
                const y = parseInt(String(fd.get("by") ?? ""), 10);
                if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2035)) {
                  setDateError(locale === "uk" ? "Введіть повну дату народження." : "Enter a complete birth date.");
                  return;
                }
                const v = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const date = new Date(`${v}T12:00:00Z`);
                if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
                  setDateError(locale === "uk" ? "Перевірте дату: такого дня немає в календарі." : "Check the date: that day is not in the calendar.");
                  return;
                }
                setDateError("");
                if (birthInfo(v, locale)) {
                  storeBirth(v);
                  setBirth(v);
                }
              }}
            >
              <label className="ins-q" htmlFor="ins-bd">
                {locale === "uk" ? "Коли ви народилися?" : "When were you born?"}
              </label>
              <div className="ins-row">
                {/* The date is set in the almanac's own type — three engraved
                    cells, no browser calendar. */}
                <fieldset className="ins-dmy" aria-label={locale === "uk" ? "Дата народження" : "Birth date"}>
                  {(
                    [
                      { name: "bd", ph: locale === "uk" ? "ДД" : "DD", len: 2, w: "2.6ch", ac: "bday-day", id: "ins-bd", min: 1, max: 31 },
                      { name: "bm", ph: locale === "uk" ? "ММ" : "MM", len: 2, w: "2.6ch", ac: "bday-month", id: "ins-bm", min: 1, max: 12 },
                      { name: "by", ph: locale === "uk" ? "РРРР" : "YYYY", len: 4, w: "4.8ch", ac: "bday-year", id: "ins-by", min: 1900, max: 2035 },
                    ] as const
                  ).map((f, fi) => (
                    <React.Fragment key={f.name}>
                      {fi > 0 && <span className="ins-sep" aria-hidden>·</span>}
                      <input
                        id={f.id}
                        name={f.name}
                        aria-label={locale === "uk" ? ({ bd: "День", bm: "Місяць", by: "Рік" }[f.name]) : ({ bd: "Day", bm: "Month", by: "Year" }[f.name])}
                        aria-invalid={Boolean(dateError)}
                        aria-describedby={dateError ? "ins-date-error" : undefined}
                        className="ins-cell"
                        style={{ width: f.w }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={f.len}
                        placeholder={f.ph}
                        required
                        autoComplete={f.ac}
                        onInput={(e) => {
                          const el = e.currentTarget;
                          el.value = el.value.replace(/\D/g, "");
                          // the filled tick: the underline turns gilt once
                          // the cell holds a plausible value
                          const v = parseInt(el.value, 10);
                          el.classList.toggle(
                            "is-filled",
                            el.value.length > 0 && v >= f.min && v <= f.max && (f.name !== "by" || el.value.length === 4),
                          );
                          if (el.value.length >= f.len) {
                            const all = el.form?.querySelectorAll<HTMLInputElement>(".ins-cell");
                            all?.[fi + 1]?.focus();
                          }
                        }}
                      />
                    </React.Fragment>
                  ))}
                </fieldset>
                <button type="submit" className="btn-ink oa-gilt">
                  {locale === "uk" ? "Вписати" : "Inscribe"}
                </button>
              </div>
              {dateError && <p id="ins-date-error" role="alert" style={{ color: "#e0b768", marginTop: 12 }}>{dateError}</p>}
              <p className="ins-priv">{locale === "uk" ? "зберігається у цьому браузері · нікуди не надсилається" : "kept in this browser · never sent anywhere"}</p>
            </form>
          )}
  </div>;
}

export default function Home() {
  const { t, locale } = useLocale();
  const copy = locale === "uk" ? ALM.uk : ALM.en;
  const [now, setNow] = useState<Date | null>(null);
  const [birth, setBirth] = useState<string | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setNow(new Date());
      setBirth(getStoredBirth());
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const today = React.useMemo(() => now ? getAlmanacToday(locale, now) : null, [now, locale]);
  const birthI = React.useMemo(() => birth ? birthInfo(birth, locale) : null, [birth, locale]);
  const counselLines = locale === "uk" ? COUNSEL.uk : COUNSEL.en;
  const counsel = today ? counselLines[today.counselIndex % counselLines.length] : "";
  const heroTitle = t("hero_title") as string;
  const heroLines = locale === "en" ? ["Your stars,", "translated clearly."]
    : locale === "uk" ? ["Ваші зірки —", "людською мовою."] : [heroTitle];

  return (
    <div className={`almanac ${styles.home}`}>
      <header className="masthead">
        <div className="masthead-rule press-rule" style={{ "--pi": 0 } as React.CSSProperties} aria-hidden />
        <div className="masthead-row press-t" style={{ "--pi": 1 } as React.CSSProperties}>
          <TransitionLink href="/" className="wordmark">
            Olivia Arcana
          </TransitionLink>
          <p className="masthead-est">
            {today ? (
              <span className="edition-line">
                <span>{today.editionNo}</span>
                <span aria-hidden>·</span>
                <span>{today.dateLine}</span>
                <span aria-hidden>·</span>
                <span>{today.romanYear}</span>
                <MoonEngraving today={today} />
                <span>{today.moonPhaseName}</span>
                <span aria-hidden>·</span>
                {birthI ? (
                  <TransitionLink
                    href={`/signs/${SIGN_SLUGS[birthI.signIndex]}/`}
                    className="reader-chip"
                  >
                    {ZODIAC_GLYPHS[birthI.signIndex]}︎ {(locale === "uk" ? SIGN_TIP_UK[birthI.signIndex].name : SIGN_PAGES[SIGN_SLUGS[birthI.signIndex]].name).toUpperCase()}
                  </TransitionLink>
                ) : (
                  <a
                    href="#inscription"
                    className="reader-chip ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("inscription")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
                    }}
                  >
                    ☉︎ {locale === "uk" ? "впишіть себе" : "set your sky"}
                  </a>
                )}
              </span>
            ) : (
              copy.established
            )}
          </p>
          <nav className="masthead-nav" aria-label={copy.navAria}>
            {copy.nav.map((item) => (
              <TransitionLink key={item.href} href={item.href} className="masthead-link">
                {item.label}
              </TransitionLink>
            ))}
            {/* Every further room of the edition, one quiet drawer. */}
            <details className="mast-more" onKeyDown={(e) => { if (e.key === "Escape") { e.currentTarget.open = false; e.currentTarget.querySelector("summary")?.focus(); } }}>
              <summary>{locale === "uk" ? "Ще" : "More"} ✦</summary>
              <div className="mast-menu">
                {(locale === "uk"
                  ? [
                      ["Натальна карта", "/chart"],
                      ["Карта дня", "/daily"],
                      ["Тариф", "/pricing"],
                      ["Академія", "/academy"],
                      ["Сумісність", "/synastry"],
                      ["Знаки", "/signs"],
                      ["Космос", "/cosmos"],
                      ["Транзити", "/transits"],
                      ["Журнал", "/journal"],
                      ["Питання", "/ask"],
                      ["Про нас", "/about"],
                    ]
                  : [
                      ["Birth chart", "/chart"],
                      ["Daily card", "/daily"],
                      ["Pricing", "/pricing"],
                      ["Academy", "/academy"],
                      ["Synastry", "/synastry"],
                      ["Signs", "/signs"],
                      ["Cosmos", "/cosmos"],
                      ["Transits", "/transits"],
                      ["Journal", "/journal"],
                      ["Ask", "/ask"],
                      ["About", "/about"],
                    ]
                ).map(([label, href]) => (
                  <TransitionLink key={href} href={href} className="mast-menu-link">
                    {label}
                  </TransitionLink>
                ))}
                <div className="mast-language"><LanguageSwitcher /></div>
              </div>
            </details>
            <TransitionLink href="/oracle" className="masthead-cta">
              {copy.navCta}
            </TransitionLink>
          </nav>
        </div>
        <p className="masthead-title press-t" style={{ "--pi": 2 } as React.CSSProperties}>{copy.masthead}</p>
        <div className="masthead-rule thick press-rule" style={{ "--pi": 3 } as React.CSSProperties} aria-hidden />
        <div className={`counsel ${today ? "is-inked" : ""}`}>
          {today && (
            <>
              <span className="counsel-mark" aria-hidden>
                ⁂
              </span>
              <p className="counsel-line">
                <span className="counsel-for">
                  {copy.counselFor} {today.weekdayCounsel} —
                </span>{" "}
                <em>{counsel}</em>
              </p>
            </>
          )}
        </div>
      </header>

      <main id="main-content">
        <TheArrival
          locale={locale}
          kicker={locale === "uk" ? "Персональний альманах" : "A personal almanac"}
          titleLines={heroLines}
          subtitle={locale === "en" ? "Explore your birth chart. Bring a question to the tarot. Make space for a clearer perspective." : locale === "uk" ? "Дослідіть свою натальну карту. Зверніться з питанням до Таро. Знайдіть простір для яснішого погляду." : t("hero_subtitle") as string}
          trust={t("hero_trust_line") as string}
          primaryHref="/oracle"
          primaryLabel={copy.navCta}
          secondaryHref="/chart"
          secondaryLabel={locale === "uk" ? "Дослідити натальну карту" : "Explore your birth chart"}
          captionMain={locale === "uk" ? "I. Наближення" : "I. The arrival"}
          captionSub={locale === "uk" ? "Між відомим і можливим" : "Between the known & the possible"}
        />


        <section className="plates" id="plates" tabIndex={-1} aria-labelledby="plates-title">
          <header className="plates-opening">
            <p className="section-label">{locale === "uk" ? "II. Особисті читання" : "II. The personal readings"}</p>
            <h2 id="plates-title">{locale === "uk" ? <>Почніть із того,<br /><em>що привело вас сюди.</em></> : <>Begin with what<br /><em>brought you here.</em></>}</h2>
            <p className="plates-promise">{locale === "uk" ? "Запитання на сьогодні. Карта на все життя." : "A question for today. A map for a lifetime."}</p>
          </header>

          <article className="service service-oracle" aria-labelledby="oracle-title">
            <div className="service-copy">
              <p className="section-label">{locale === "uk" ? "01 / Таро" : "01 / Tarot"}</p>
              <h3 id="oracle-title">{copy.plates[0].title}</h3>
              <p className="service-body">{copy.plates[0].body}</p>
              <TransitionLink href="/oracle" className="service-link">{copy.plates[0].cta}<span aria-hidden>↗</span></TransitionLink>
              <p className="service-note">{locale === "uk" ? "Ваше запитання задає напрямок. Ви обираєте карти." : "Your question sets the direction. Your hand chooses the cards."}</p>
            </div>
            <figure className="service-figure tarot-figure">
              <DeckSpecimen locale={locale} />
              <figcaption><span>{locale === "uk" ? "01 — Аркани" : "01 — The Arcana"}</span><span>{locale === "uk" ? "78 карт · безліч поглядів" : "78 cards · a different perspective"}</span></figcaption>
            </figure>
          </article>

          <article className="service service-chart" aria-labelledby="chart-title">
            <figure className="service-figure chart-figure">
              <div className="chart-specimen-frame"><ZodiacSpecimen today={today} /></div>
              <figcaption><span>{locale === "uk" ? "02 — Зодіакальне коло" : "02 — The zodiac wheel"}</span><span>{locale === "uk" ? "Сонце сьогодні позначено золотом" : "Today's Sun marked in gold"}</span></figcaption>
            </figure>
            <div className="service-copy">
              <p className="section-label">{locale === "uk" ? "02 / Астрологія" : "02 / Astrology"}</p>
              <h3 id="chart-title">{copy.plates[1].title}</h3>
              <p className="service-body">{copy.plates[1].body}</p>
              <TransitionLink href="/chart" className="service-link">{copy.plates[1].cta}<span aria-hidden>↗</span></TransitionLink>
              <BirthInscription locale={locale} birth={birth} setBirth={setBirth} />
            </div>
          </article>

          <div className="almanac-marginalia">
            <EphemerisNote locale={locale} />
            <TransitionLink href="/daily" className="daily-link">
              <span className="section-label">{locale === "uk" ? "Щоденна практика" : "A daily practice"}</span>
              <span>{locale === "uk" ? "Одна карта. Мить для себе." : "One card. A moment to yourself."}<span aria-hidden>↗</span></span>
            </TransitionLink>
          </div>
        </section>
      </main>

      <footer className="colophon">
        <div className="colophon-grid">
          <div className="colophon-brand">
            <p className="wordmark as-text">Olivia Arcana</p>
            <p className="colophon-desc">{copy.colophonDesc}</p>
            <p className="colophon-note">{copy.colophonNote}</p>
          </div>
          <nav className="colophon-links" aria-label={copy.colophonAria}>
            {copy.colophonLinks.map(link => <TransitionLink key={link.href} href={link.href} className="colophon-link">{link.label}</TransitionLink>)}
          </nav>
        </div>
        <div className="colophon-bottom">
          <p>{copy.colophonLine}</p>
          {today && <p className="edition-stamp">{today.editionNo} · {today.romanYear} <span aria-hidden>✦</span></p>}
        </div>
      </footer>
    </div>
  );
}
