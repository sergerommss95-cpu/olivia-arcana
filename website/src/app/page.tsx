"use client";

/**
 * Home — "The Personal Almanac."
 *
 * A complete visual reboot: warm bone paper, warm-black ink, one oxblood
 * accent, plate-engraving line diagrams. Astrology and tarot presented as
 * a beautifully printed reference atlas — masthead, numbered plates, a
 * specimen letter, a tariff table, questions, colophon. No WebGL, no
 * starfields, no gold-on-void: the whole page is typography, hairlines,
 * and hand-drawn SVG.
 *
 * The site's dark chrome (nav, cosmic layers) is switched off for "/" in
 * ClientShell; this page carries its own masthead and colophon.
 */

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import TransitionLink from "@/components/transitions/TransitionLink";
import SpreadTheater from "@/components/almanac/SpreadTheater";
import TonightPlate from "@/components/almanac/TonightPlate";
import EphemerisNote from "@/components/almanac/EphemerisNote";
import TheArrival from "@/components/hero/TheArrival";
import StarMotes from "@/components/arrival/StarMotes";
import ShaderBackdrop from "@/components/almanac/ShaderBackdrop";
import InkCursor from "@/components/almanac/InkCursor";
import MagnetRig from "@/components/almanac/MagnetRig";
import { useLocale } from "@/lib/i18n/useLocale";
import { splitLines } from "@/lib/motion";
import { getAlmanacToday, moonPath, type AlmanacToday } from "@/lib/almanac-today";
import { buildSkyPlate, currentHourIndex, horizontalAt, PLATE_LATITUDE, type PlanetaryHour, type PlateEvent, type SkyPlate, type SkyPoint, type SkyTrack } from "@/lib/diurnal";
import { getStoredBirth, storeBirth, birthInfo, type BirthInfo } from "@/lib/birth";
import { getLastCut } from "@/lib/ahead";
import { SIGN_PAGES } from "@/lib/sign-data";
import { STARS, CONSTELLATIONS, DEEP_SKY, SIGN_ABBR, lst, project, unproject, eclipticToEquatorial, moonLongitude, milkyWay, fieldStars, sunAltitude } from "@/lib/star-chart";

// The galaxy's stipple and the anonymous field stars, cast once — a
// printed chart, identical every visit.
const MILKY = milkyWay();
const FIELD = fieldStars(420);

const ALM = {
  en: {
    masthead: "Personal Almanac",
    established: "Anno MMXXVI · Kyiv — Everywhere",
    nav: [
      { label: "Academy", href: "/academy" },
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
        body: "Bring one question. Three cards are drawn against your chart and the current sky, and read in plain language.",
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
      { label: "Академія", href: "/academy" },
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
        body: "Принесіть одне запитання. Три карти витягуються з огляду на вашу карту й поточне небо — і читаються простою мовою.",
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

/* ── Plate diagrams — hand-drawn line engravings ────────────────── */

const SIGN_SLUGS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

/** Annular-sector path for the interactive wedges (r0..r1, sector i of 12). */
function wedgePath(i: number, r0: number, r1: number): string {
  const a0 = (i * Math.PI) / 6;
  const a1 = ((i + 1) * Math.PI) / 6;
  const sx0 = 160 + r0 * Math.sin(a0);
  const sy0 = 160 - r0 * Math.cos(a0);
  const sx1 = 160 + r1 * Math.sin(a0);
  const sy1 = 160 - r1 * Math.cos(a0);
  const ex1 = 160 + r1 * Math.sin(a1);
  const ey1 = 160 - r1 * Math.cos(a1);
  const ex0 = 160 + r0 * Math.sin(a1);
  const ey0 = 160 - r0 * Math.cos(a1);
  return `M ${sx0} ${sy0} L ${sx1} ${sy1} A ${r1} ${r1} 0 0 1 ${ex1} ${ey1} L ${ex0} ${ey0} A ${r0} ${r0} 0 0 0 ${sx0} ${sy0} Z`;
}

/* Server and client stringify full-precision floats differently, which
   breaks hydration on every computed SVG attribute. Three decimals is
   far finer than a pixel and prints identically on both sides. */
const r3 = (n: number) => Math.round(n * 1000) / 1000;

function WheelDiagram({
  className,
  today,
  rotation = 0,
  activeIndex = null,
  onSectorEnter,
  onSectorLeave,
  onSectorClick,
}: {
  className?: string;
  today?: AlmanacToday | null;
  rotation?: number;
  activeIndex?: number | null;
  onSectorEnter?: (i: number) => void;
  onSectorLeave?: () => void;
  onSectorClick?: (i: number) => void;
}) {
  // Sun marker: ecliptic longitude mapped clockwise from 12 o'clock, the
  // same orientation the sign glyphs use (sign i spans [i·30°, (i+1)·30°)).
  const sunAngle = today ? (today.sunLongitude * Math.PI) / 180 : 0;
  const sunX = r3(160 + 104 * Math.sin(sunAngle));
  const sunY = r3(160 - 104 * Math.cos(sunAngle));

  // Season band: an arc inked over the sun-sign's segment of the glyph ring.
  const seasonArc = (() => {
    if (!today) return null;
    const a0 = (today.seasonIndex * Math.PI) / 6;
    const a1 = ((today.seasonIndex + 1) * Math.PI) / 6;
    const r = 136;
    const x0 = r3(160 + r * Math.sin(a0));
    const y0 = r3(160 - r * Math.cos(a0));
    const x1 = r3(160 + r * Math.sin(a1));
    const y1 = r3(160 - r * Math.cos(a1));
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  })();

  const interactive = Boolean(onSectorClick);

  return (
    <svg viewBox="0 0 320 320" className={className} aria-hidden={interactive ? undefined : true}>
      <g transform={`rotate(${rotation} 160 160)`}>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle className="etch" style={{ "--ei": 0 } as React.CSSProperties} pathLength={1} cx="160" cy="160" r="150" />
        <circle className="etch" style={{ "--ei": 1 } as React.CSSProperties} pathLength={1} cx="160" cy="160" r="122" strokeWidth="0.6" />
        <circle className="etch" style={{ "--ei": 2 } as React.CSSProperties} pathLength={1} cx="160" cy="160" r="86" strokeWidth="0.6" />
        <circle className="etch" style={{ "--ei": 3 } as React.CSSProperties} pathLength={1} cx="160" cy="160" r="24" />
        {/* idle breath: a faint ticked ring turning once a minute —
            imperceptible at a glance, alive on a long look */}
        <circle
          className="svg-fade wheel-breathe"
          style={{ "--ei": 5.75 } as React.CSSProperties}
          cx="160"
          cy="160"
          r="104"
          strokeWidth="0.5"
          strokeDasharray="1 6.2"
          strokeOpacity="0.45"
        />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = r3(160 + 86 * Math.sin(a));
          const y1 = r3(160 - 86 * Math.cos(a));
          const x2 = r3(160 + 150 * Math.sin(a));
          const y2 = r3(160 - 150 * Math.cos(a));
          return (
            <line
              key={i}
              className="etch"
              style={{ "--ei": 4 + i * 0.25 } as React.CSSProperties}
              pathLength={1}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              strokeWidth="0.6"
            />
          );
        })}
        <line className="svg-fade" style={{ "--ei": 5 } as React.CSSProperties} x1="10" y1="160" x2="310" y2="160" strokeWidth="0.6" strokeDasharray="2 4" />
        <line className="svg-fade" style={{ "--ei": 5.5 } as React.CSSProperties} x1="160" y1="10" x2="160" y2="310" strokeWidth="0.6" strokeDasharray="2 4" />
      </g>
      {seasonArc && <path d={seasonArc} pathLength={1} fill="none" stroke="var(--ox, #e0b768)" strokeWidth="26" opacity="0.1" className="arc-spread" />}
      <g fill="currentColor" fontSize="15" textAnchor="middle" dominantBaseline="central" fontFamily="serif">
        {ZODIAC.map((glyph, i) => {
          const a = ((i + 0.5) * Math.PI) / 6;
          const x = r3(160 + 136 * Math.sin(a));
          const y = r3(160 - 136 * Math.cos(a));
          const isSeason = today?.seasonIndex === i;
          const isActive = activeIndex === i;
          return (
            <text
              key={i}
              x={x}
              y={y}
              fill={isActive || isSeason ? "var(--ox, #e0b768)" : "currentColor"}
              fontWeight={isActive ? 700 : 400}
              className="svg-stamp"
              style={{ "--ei": 6 + i * 0.35 } as React.CSSProperties}
            >
              {glyph}
            </text>
          );
        })}
      </g>
      <g fill="currentColor" className="svg-fade" style={{ "--ei": 7 } as React.CSSProperties}>
        <circle cx="160" cy="160" r="3" />
        <circle cx="103" cy="196" r="3" />
        <circle cx="228" cy="205" r="2.5" />
      </g>
      {today && (
        <g>
          <circle className="sun-ring" pathLength={1} cx={sunX} cy={sunY} r="8.5" fill="var(--ink, #e8e9ff)" stroke="var(--ox, #e0b768)" strokeWidth="1" />
          <circle className="sun-dot" cx={sunX} cy={sunY} r="2.6" fill="var(--ox, #e0b768)" />
        </g>
      )}

      {/* Active-sector wash + interactive wedges: the hit areas live
          inside the rotated group, so the wheel can turn under the hand
          and each wedge still knows exactly which sign it is. */}
      {interactive && activeIndex !== null && (
        <path d={wedgePath(activeIndex, 86, 150)} fill="var(--ox, #e0b768)" opacity="0.07" pointerEvents="none" />
      )}
      {interactive &&
        SIGN_SLUGS.map((slug, i) => (
          <path
            key={slug}
            d={wedgePath(i, 86, 150)}
            fill="transparent"
            role="link"
            tabIndex={0}
            aria-label={`${slug.charAt(0).toUpperCase()}${slug.slice(1)} — open sign plate`}
            style={{ cursor: "pointer", outline: "none" }}
            onPointerEnter={() => onSectorEnter?.(i)}
            onPointerLeave={() => onSectorLeave?.()}
            onFocus={() => onSectorEnter?.(i)}
            onBlur={() => onSectorLeave?.()}
            onClick={() => onSectorClick?.(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSectorClick?.(i);
              }
            }}
          />
        ))}
      </g>
    </svg>
  );
}

function SynastryDiagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 320" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor">
        <g className="meet meet-l">
          <circle className="etch" style={{ "--ei": 0 } as React.CSSProperties} pathLength={1} cx="124" cy="160" r="92" strokeWidth="1" />
          <circle className="svg-fade" style={{ "--ei": 2 } as React.CSSProperties} cx="124" cy="160" r="66" strokeWidth="0.5" strokeDasharray="2 4" />
        </g>
        <g className="meet meet-r">
          <circle className="etch" style={{ "--ei": 1 } as React.CSSProperties} pathLength={1} cx="196" cy="160" r="92" strokeWidth="1" />
          <circle className="svg-fade" style={{ "--ei": 3 } as React.CSSProperties} cx="196" cy="160" r="66" strokeWidth="0.5" strokeDasharray="2 4" />
        </g>
        <path className="lens-glow" d="M160 75.3 A92 92 0 0 1 160 244.7 A92 92 0 0 1 160 75.3 Z" strokeWidth="0" fill="currentColor" opacity="0.07" />
      </g>
      <g fill="currentColor" textAnchor="middle" dominantBaseline="central" fontFamily="serif">
        <text className="glyph-in glyph-in-l" x="97" y="160" fontSize="17">
          ☉
        </text>
        <text className="glyph-in glyph-in-r" x="223" y="160" fontSize="17">
          ☽
        </text>
        <text className="lens-star" x="160" y="160" fontSize="13">
          ✦
        </text>
      </g>
    </svg>
  );
}

/** UK tooltip strings for the zodiac band, in SIGN_SLUGS order. */
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

/** UK names for the stars bright enough to be labelled on the chart. */
const STAR_NAME_UK: Record<string, string> = {
  Sirius: "СІРІУС",
  Arcturus: "АРКТУР",
  Vega: "ВЕГА",
  Capella: "КАПЕЛЛА",
  Rigel: "РІГЕЛЬ",
  Procyon: "ПРОЦІОН",
  Betelgeuse: "БЕТЕЛЬГЕЙЗЕ",
  Altair: "АЛЬТАЇР",
  Aldebaran: "АЛЬДЕБАРАН",
  Antares: "АНТАРЕС",
  Spica: "СПІКА",
  Pollux: "ПОЛЛУКС",
  Fomalhaut: "ФОМАЛЬГАУТ",
  Deneb: "ДЕНЕБ",
};

/**
 * SkyChart — the sky above the reader, tonight, engraved on the paper.
 *
 * A canvas planisphere: the ~90 brightest stars at their true positions
 * for this hour (sidereal time from the reader's clock and timezone),
 * constellation figures in hairline, the ecliptic crossing the sky as a
 * dashed oxblood road with the twelve signs standing where they truly
 * stand. The sun and moon ride the ecliptic at today's longitudes when
 * they are above the horizon.
 *
 * Three behaviours:
 *  · LENS — on fine pointers the cursor is a magnifying glass: within
 *    it the chart re-renders at 1.45×, faint lines strengthen, star and
 *    constellation names ink in. (The chart resolves under the glass.)
 *  · ZODIAC BAND — the ecliptic is the instrument now: nearing it
 *    highlights the sector under the hand, names its dates, and a click
 *    opens that sign's plate.
 *  · THE DIVE — the hero is pinned for a second viewport of scroll; the
 *    camera pushes into the sky (scale toward the ecliptic's heart)
 *    while the display lines part. `--dive` is written to the pin for
 *    the CSS side of the exit.
 *
 * Entrance: stars appear in magnitude order — the bright ones first, as
 * at dusk. Reduced motion: static chart, no lens drift, no dive.
 */
function SkyChart({ today, locale, reader, skyDate }: { today: AlmanacToday | null; locale: string; reader: number | null; skyDate: Date | null }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; sector: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const pin = canvas.closest(".front-pin") as HTMLElement | null;

    // The observatory: longitude from the reader's clock (solar time ≈
    // 15°/h), latitude a mid-northern default — the chart is honest to
    // the hour everywhere and to the horizon for most of our readers.
    const lonDeg = (-new Date().getTimezoneOffset() / 60) * 15;
    const latDeg = 48;

    // Night plate: bone strokes on deep ink, ember for the road and
    // the lights — the almanac's own night register, engraved reversed.
    const INK = "223, 231, 252";
    const OX = "224, 183, 104";
    let W = 0;
    let H = 0;
    let raf = 0;
    let dirty = true;
    let dive = 0;
    let lastDive = -1;
    let mx = -1e4;
    let my = -1e4;
    let lx = -1e4;
    let ly = -1e4;
    let hover = -1;
    let disposed = false;
    const t0 = performance.now();
    let entrance = reduce ? 1 : 0;
    // The kindling waits for the bloom: t0 arms on the first frame the
    // page is actually revealed, so no star lights behind the curtain.
    let tEntr = reduce ? t0 : -1;
    const rootEl = canvas.closest(".almanac");
    // The camera carries mass: the drawn dive lags the scrubbed dive.
    let diveDraw = 0;
    // The zodiac road's pulsed invitation: after the kindling, then
    // re-armed up to twice if the reader never touches the road.
    let pulseAt = -1;
    let pulseCount = 0;
    // Ecliptic screen samples from the last main pass, for hit-testing.
    let eclScreen: Array<{ x: number; y: number; lambda: number }> = [];
    // A meteor, when the sky grants one; and the lens's readout line.
    let meteor: { x0: number; y0: number; x1: number; y1: number; born: number; life: number } | null = null;
    let nextMeteor = t0 + 9000 + Math.random() * 6000;
    let lensRead: string | null = null;
    // Halation sprites — candlelight through the telescope. Rendered
    // once: a bone core and a warm ember-fringed halo, composited
    // additively over the brightest stars only.
    const makeSprite = (size: number, stops: Array<[number, string]>) => {
      const c = document.createElement("canvas");
      c.width = size;
      c.height = size;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      for (const [o, col] of stops) grad.addColorStop(o, col);
      g.fillStyle = grad;
      g.fillRect(0, 0, size, size);
      return c;
    };
    const HALO = makeSprite(96, [
      [0, "rgba(244, 238, 222, 0.4)"],
      [0.3, "rgba(238, 230, 210, 0.22)"],
      [0.55, "rgba(210, 120, 70, 0.08)"],
      [0.8, "rgba(224, 183, 104, 0)"],
      [1, "rgba(224, 183, 104, 0)"],
    ]);
    // The eyepiece: three magnification stops, cycled by a click on
    // open sky. Higher power resolves more names — real optics.
    let lensZoom = 1.6;
    let lensReadStar: string | null = null;
    let lensReadPos: string | null = null;
    let frameFlip = false;
    // The display block's box in canvas space — the lens stands down
    // there. Refreshed twice a second; sticky scrolling moves it.
    let dispRect: DOMRect | null = null;
    let rectTick = 0;
    // The chart's live geometry, published by the main pass — the lens
    // exists only over the sky disc itself.
    let chartGeom: { ox: number; oy: number; scale: number } | null = null;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    };

    /** One full chart pass. `zoomed` = the lens interior. */
    const drawSky = (zoomed: boolean, tSec: number) => {
      const now = skyDate ?? new Date();
      const Ltrue = lst(now, lonDeg);
      // The dome turns — a few times sidereal, invisible in a glance,
      // alive over half a minute of staring. The cartouche keeps the
      // true hour.
      const L = Ltrue + (reduce ? 0 : tSec * 0.00028);
      const narrow = W < 900;
      const cx = W * (narrow ? 0.5 : 0.62);
      const cy = H * 0.5;
      // The camera's dive accelerates toward the deep — and it carries
      // mass: diveDraw lags the raw scrub (CSS keeps the raw value, so
      // the type tracks the hand while the world trails it).
      const dv = Math.pow(diveDraw, 1.35);
      const scale = Math.min(W, H) * 0.56 * (1 + dv * 0.95);
      // Aim: the sun if it stands in the sky, else the moon, else the
      // highest point of the ecliptic — the road itself, never a void.
      let target: { x: number; y: number; alt: number } = { x: 0, y: 0, alt: 90 };
      if (today) {
        const sEq = eclipticToEquatorial(today.sunLongitude);
        const sP = project(sEq.ra, sEq.dec, L, latDeg);
        if (sP.alt > 8) target = sP;
        else {
          const mEq = eclipticToEquatorial(moonLongitude(today.sunLongitude, today.moonFraction, today.moonWaxing));
          const mP = project(mEq.ra, mEq.dec, L, latDeg);
          if (mP.alt > 8) target = mP;
          else {
            let bestAlt = -90;
            for (let lam = 0; lam < 360; lam += 15) {
              const eq = eclipticToEquatorial(lam);
              const p = project(eq.ra, eq.dec, L, latDeg);
              if (p.alt > bestAlt) {
                bestAlt = p.alt;
                target = p;
              }
            }
          }
        }
      }
      const ox = cx - target.x * dv * 0.7 * scale;
      const oy = cy - target.y * dv * 0.7 * scale;
      const S = (p: { x: number; y: number }) => ({ x: ox + p.x * scale, y: oy + p.y * scale });
      const lineA = zoomed ? 0.46 : 0.28;
      const lineE = Math.max(0, Math.min(1, (entrance - 0.45) * 2.2));
      const sunAlt = today ? sunAltitude(today.sunLongitude, now, latDeg, lonDeg) : -30;

      if (!zoomed) chartGeom = { ox, oy, scale };

      ctx.save();
      // Everything lives inside the horizon.
      ctx.beginPath();
      ctx.arc(ox, oy, scale, 0, Math.PI * 2);
      ctx.clip();

      // Twilight truth: a breath of warmth while the sun is up, a lean
      // toward ink in deep night. Barely there — paper first.
      if (sunAlt > 0) {
        ctx.fillStyle = "rgba(255, 220, 160, 0.05)";
        ctx.fillRect(ox - scale, oy - scale, scale * 2, scale * 2);
      }

      // The blue hour breathes: two aurora veils drift across the upper
      // dome — cold periwinkle and a fainter warm sand answer — barely
      // above the threshold of sight, alive only over seconds of staring.
      if (!zoomed && lineE > 0.1) {
        const tA = reduce ? 0 : tSec;
        for (let vi = 0; vi < 2; vi++) {
          const hue = vi === 0 ? "138, 147, 200" : "224, 204, 187";
          const base = vi === 0 ? 0.05 : 0.028;
          for (let i = 0; i < 3; i++) {
            const drift = Math.sin(tA * 0.045 + i * 2.1 + vi * 3.3);
            const vx = ox + scale * (-0.55 + i * 0.55 + 0.14 * drift);
            const vy = oy - scale * (0.5 + vi * 0.12) + scale * 0.05 * Math.sin(tA * 0.06 + i * 1.4);
            const a = (base + 0.016 * Math.sin(tA * 0.07 + i * 1.9 + vi)) * lineE;
            if (a <= 0.004) continue;
            ctx.save();
            ctx.translate(vx, vy);
            ctx.scale(0.42, 1.5);
            const veil = ctx.createRadialGradient(0, 0, 0, 0, 0, scale * 0.52);
            veil.addColorStop(0, `rgba(${hue}, ${a})`);
            veil.addColorStop(0.6, `rgba(${hue}, ${a * 0.4})`);
            veil.addColorStop(1, `rgba(${hue}, 0)`);
            ctx.fillStyle = veil;
            ctx.beginPath();
            ctx.arc(0, 0, scale * 0.52, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }

      // Horizon rim — the last of the sunk sun: a cold blue ring just
      // inside the horizon with one warm kiss at the very edge.
      {
        const rim = ctx.createRadialGradient(ox, oy, scale * 0.74, ox, oy, scale);
        rim.addColorStop(0, "rgba(76, 94, 158, 0)");
        rim.addColorStop(0.62, `rgba(76, 94, 158, ${0.1 * lineE})`);
        rim.addColorStop(0.9, `rgba(120, 96, 70, ${0.055 * lineE})`);
        rim.addColorStop(1, "rgba(24, 30, 54, 0)");
        ctx.fillStyle = rim;
        ctx.beginPath();
        ctx.arc(ox, oy, scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // The Milky Way — a river of stipple along the true galactic
      // plane, the way the old atlases cut it.
      if (lineE > 0) {
        for (const d of MILKY) {
          const p = project(d.ra, d.dec, L, latDeg);
          if (p.alt < -2) continue;
          const q = S(p);
          ctx.fillStyle = `rgba(${INK}, ${(zoomed ? 0.2 : 0.13 * (1 + diveDraw * 1.2)) * d.w * lineE})`;
          ctx.fillRect(q.x, q.y, d.w > 0.7 ? 1.4 : 1, d.w > 0.7 ? 1.4 : 1);
        }
      }

      // Field stars: the sky deepens on approach — anonymous faint
      // stars resolve as the camera dives, and under the glass.
      const fieldA = Math.max(zoomed ? 0.3 : 0, Math.min(0.55, (diveDraw - 0.28) * 1.7)) * lineE;
      if (fieldA > 0.01) {
        for (const d of FIELD) {
          const p = project(d.ra, d.dec, L, latDeg);
          if (p.alt < 0) continue;
          const q = S(p);
          ctx.fillStyle = `rgba(${INK}, ${fieldA * d.w})`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 0.7 + d.w * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Altitude circles (30°, 60°) — the chart's graticule.
      ctx.strokeStyle = `rgba(${INK}, ${0.15 * lineE})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      for (const alt of [30, 60]) {
        const r = Math.tan(((90 - alt) * Math.PI) / 360) / Math.tan(Math.PI / 4);
        ctx.beginPath();
        ctx.arc(ox, oy, r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // The celestial equator — a fine solid line, labelled in the
      // chart Latin, distinct from the dashed altitude graticule.
      ctx.strokeStyle = `rgba(${INK}, ${0.16 * lineE})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      let eqPen = false;
      let eqTop: { x: number; y: number } | null = null;
      let eqTopAlt = -90;
      for (let raH = 0; raH <= 24; raH += 0.25) {
        const p = project(raH, 0, L, latDeg);
        if (p.alt < -2) {
          eqPen = false;
          continue;
        }
        const q = S(p);
        if (eqPen) ctx.lineTo(q.x, q.y);
        else ctx.moveTo(q.x, q.y);
        eqPen = true;
        if (p.alt > eqTopAlt) {
          eqTopAlt = p.alt;
          eqTop = q;
        }
      }
      ctx.stroke();
      if (eqTop && !zoomed) {
        ctx.font = '7px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(${INK}, ${0.34 * lineE})`;
        ctx.fillText("A E Q U A T O R", eqTop.x, eqTop.y - 9);
      }

      // The meridian: the observer's own line, zenith to both horizons.
      ctx.strokeStyle = `rgba(${INK}, ${0.09 * lineE})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 5]);
      ctx.beginPath();
      ctx.moveTo(ox, oy - scale);
      ctx.lineTo(ox, oy + scale);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!zoomed) {
        ctx.font = '7px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(${INK}, ${0.26 * lineE})`;
        ctx.fillText("M E R I D I E S", ox, oy - scale * 0.86);
      }

      // Star positions (projected once per pass).
      const pts = STARS.map((s) => project(s.ra, s.dec, L, latDeg));

      // Constellation figures — inked one after another at the
      // entrance, west to east across the catalog.
      if (lineE > 0) {
        ctx.lineWidth = 1;
        for (let cIdx = 0; cIdx < CONSTELLATIONS.length; cIdx++) {
          const c = CONSTELLATIONS[cIdx];
          const cE = Math.max(0, Math.min(1, (entrance - 0.4 - cIdx * 0.022) * 3.4));
          if (cE === 0) continue;
          ctx.strokeStyle = `rgba(${INK}, ${lineA * cE})`;
          for (const run of c.lines) {
            ctx.beginPath();
            let pen = false;
            for (const i of run) {
              const p = pts[i];
              if (p.alt < -8) {
                pen = false;
                continue;
              }
              const q = S(p);
              if (pen) ctx.lineTo(q.x, q.y);
              else ctx.moveTo(q.x, q.y);
              pen = true;
            }
            ctx.stroke();
          }
        }
      }

      // The ecliptic — a dashed oxblood road with the signs on it.
      const ecl: Array<{ x: number; y: number; lambda: number; alt: number }> = [];
      for (let lam = 0; lam <= 360; lam += 3) {
        const eq = eclipticToEquatorial(lam % 360);
        const p = project(eq.ra, eq.dec, L, latDeg);
        ecl.push({ ...S(p), lambda: lam % 360, alt: p.alt });
      }
      // The zodiac road, in the period grammar for the ecliptic: a soft
      // ember ribbon, twin rails, graduated rungs, sign boundaries
      // extended — a ladder laid across the sky, unmistakably an
      // invitation to the hand.
      let pen = false;
      ctx.strokeStyle = `rgba(${OX}, ${0.05 * lineE})`;
      ctx.lineWidth = 20;
      ctx.beginPath();
      for (const p of ecl) {
        if (p.alt < -2) {
          pen = false;
          continue;
        }
        if (pen) ctx.lineTo(p.x, p.y);
        else ctx.moveTo(p.x, p.y);
        pen = true;
      }
      ctx.stroke();
      const railOff = (i: number, sgn: number) => {
        const a0 = ecl[Math.max(0, i - 1)];
        const a1 = ecl[Math.min(ecl.length - 1, i + 1)];
        const dx = a1.x - a0.x;
        const dy = a1.y - a0.y;
        const dl = Math.hypot(dx, dy) || 1;
        return { x: ecl[i].x + (-dy / dl) * 2.2 * sgn, y: ecl[i].y + (dx / dl) * 2.2 * sgn };
      };
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = `rgba(${OX}, ${0.5 * lineE})`;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        pen = false;
        for (let i = 0; i < ecl.length; i++) {
          if (ecl[i].alt < -2) {
            pen = false;
            continue;
          }
          const q = railOff(i, sgn);
          if (pen) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
          pen = true;
        }
        ctx.stroke();
      }
      ctx.lineWidth = 0.7;
      for (let i = 0; i < ecl.length; i += 2) {
        if (ecl[i].alt < -2) continue;
        const bound = ecl[i].lambda % 30 === 0;
        const qa = railOff(i, bound ? -2.4 : -1);
        const qb = railOff(i, bound ? 2.4 : 1);
        ctx.strokeStyle = `rgba(${OX}, ${(bound ? 0.6 : 0.34) * lineE})`;
        ctx.lineWidth = bound ? 1 : 0.7;
        ctx.beginPath();
        ctx.moveTo(qa.x, qa.y);
        ctx.lineTo(qb.x, qb.y);
        ctx.stroke();
      }
      if (!zoomed) eclScreen = ecl.filter((p) => p.alt >= -2);

      // Sign glyphs at sector midpoints; the hovered sector re-inks.
      // They grow with the camera, and once — just after the kindling —
      // the whole road pulses, telling the hand where the signs live.
      const gs = Math.pow(1 + dv * 0.95, 0.7);
      const nowMs = tSec * 1000;
      const pulseP = pulseAt > 0 ? Math.max(0, Math.min(1, (nowMs - pulseAt) / 1300)) : 1;
      const swell = pulseP < 1 ? Math.sin(pulseP * Math.PI) : 0;
      for (let k = 0; k < 12; k++) {
        const eq = eclipticToEquatorial(k * 30 + 15);
        const p = project(eq.ra, eq.dec, L, latDeg);
        if (p.alt < 2) continue;
        const q = S(p);
        const hot = k === hover;
        const mine = k === reader;
        const size = (hot ? 20 : (mine ? 17 : 15) + swell * 8) * gs;
        ctx.font = `${size.toFixed(1)}px "Cormorant Garamond", serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = hot ? `rgba(${OX}, 0.95)` : `rgba(${OX}, ${((mine ? 0.95 : 0.85) + swell * 0.15) * lineE})`;
        ctx.fillText(ZODIAC_GLYPHS[k] + "︎", q.x, q.y);
      }
      // The reader's own sector stays gently inked — the almanac has
      // turned to their page.
      if (reader !== null && reader !== hover && lineE > 0) {
        ctx.strokeStyle = `rgba(${OX}, ${0.3 * lineE})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        pen = false;
        for (const p of ecl) {
          if (p.alt < -2 || p.lambda < reader * 30 || p.lambda > reader * 30 + 30) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
          pen = true;
        }
        ctx.stroke();
      }
      if (hover >= 0 && lineE > 0) {
        // The chosen sector's stretch of road, inked solid.
        ctx.strokeStyle = `rgba(${OX}, 0.55)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        pen = false;
        for (const p of ecl) {
          if (p.alt < -2 || p.lambda < hover * 30 || p.lambda > hover * 30 + 30) {
            pen = false;
            continue;
          }
          if (pen) ctx.lineTo(p.x, p.y);
          else ctx.moveTo(p.x, p.y);
          pen = true;
        }
        ctx.stroke();
      }

      // Stars, brightest first at dusk.
      for (let i = 0; i < STARS.length; i++) {
        const s = STARS[i];
        const p = pts[i];
        if (p.alt < 0) continue;
        const magNorm = (s.mag + 1.5) / 5.6;
        if (magNorm > entrance) continue;
        // A ~220ms swell as each star kindles — nothing blinks on.
        const kin = Math.min(1, (entrance - magNorm) * 11);
        const q = S(p);
        const r = Math.max(0.9, 3.3 - s.mag * 0.6);
        ctx.fillStyle = `rgba(${INK}, ${Math.max(0.45, 0.95 - s.mag * 0.15) * kin})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (s.mag < 0.8) {
          ctx.strokeStyle = `rgba(${INK}, ${0.5 * kin})`;
          ctx.lineWidth = 0.8;
          for (let a = 0; a < 4; a++) {
            const t = (a * Math.PI) / 2 + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(q.x + Math.cos(t) * (r + 1.5), q.y + Math.sin(t) * (r + 1.5));
            ctx.lineTo(q.x + Math.cos(t) * (r + 5), q.y + Math.sin(t) * (r + 5));
            ctx.stroke();
          }
        }
        if (s.mag >= 0.8 && s.mag < 1.6) {
          ctx.strokeStyle = `rgba(${INK}, ${0.32 * kin})`;
          ctx.lineWidth = 0.7;
          for (let a = 0; a < 4; a++) {
            const t = (a * Math.PI) / 2;
            ctx.beginPath();
            ctx.moveTo(q.x + Math.cos(t) * (r + 1), q.y + Math.sin(t) * (r + 1));
            ctx.lineTo(q.x + Math.cos(t) * (r + 3.2), q.y + Math.sin(t) * (r + 3.2));
            ctx.stroke();
          }
        }
        // Halation: the bright tier flares warm against the deep ink —
        // candlelight on smoked glass. Additive sprite, per-star phase
        // so the field shimmers and never pulses in unison.
        if (s.mag < 1.0) {
          const breath = reduce ? 1 : 1 + 0.06 * Math.sin((tSec * Math.PI * 2) / 4.5 + i * 1.7);
          const hr = (13 + 22 * (1.0 - s.mag)) * breath * kin;
          const prevOp = ctx.globalCompositeOperation;
          ctx.globalCompositeOperation = "lighter";
          ctx.drawImage(HALO, q.x - hr, q.y - hr, hr * 2, hr * 2);
          ctx.globalCompositeOperation = prevOp;
        }
        if (s.mag < 0.5 && !reduce) {
          const ph = tSec / 3.2 + i * 1.7;
          ctx.strokeStyle = `rgba(${INK}, ${0.07 + 0.07 * Math.sin(ph)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(q.x, q.y, r + 3.8 + Math.sin(ph) * 1.2, 0, Math.PI * 2);
          ctx.stroke();
        }
        const nameA = zoomed ? 0.74 : Math.max(0, Math.min(0.7, (diveDraw - 0.4) * 2.2));
        const nameCut = zoomed ? (lensZoom >= 2.2 ? 2.5 : 1.35) : 1.35;
        if (nameA > 0.02 && s.name && s.mag < nameCut) {
          const label = locale === "uk" ? (STAR_NAME_UK[s.name] ?? s.name.toUpperCase()) : s.name.toUpperCase();
          ctx.font = '9px "IBM Plex Mono", ui-monospace, monospace';
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${INK}, ${nameA})`;
          // Under the glass, keep the label inside the rim — flip it to
          // the star's left when the right side would be clipped.
          const lw = ctx.measureText(label).width;
          if (zoomed && q.x + r + 5 + lw > lx + LENS_R / lensZoom - 10) {
            ctx.textAlign = "right";
            ctx.fillText(label, q.x - r - 5, q.y);
          } else {
            ctx.textAlign = "left";
            ctx.fillText(label, q.x + r + 5, q.y);
          }
        }
      }

      // Deep-sky objects, in the period symbol grammar: ellipse for a
      // galaxy, crossed circle for a globular, dotted ring for an open
      // cluster, diamond for nebulae. Faint furniture at rest; the
      // lens and the dive resolve their catalog numbers and names.
      const dsoA = (zoomed ? 0.55 : 0.3 + Math.min(0.2, diveDraw * 0.5)) * lineE;
      const dsoLabelA = zoomed ? 0.6 : Math.max(0, Math.min(0.55, (diveDraw - 0.45) * 2));
      ctx.lineWidth = 0.8;
      for (const o of DEEP_SKY) {
        const p = project(o.ra, o.dec, L, latDeg);
        if (p.alt < 2) continue;
        const q = S(p);
        ctx.strokeStyle = `rgba(${INK}, ${dsoA})`;
        ctx.beginPath();
        if (o.type === "gx") {
          ctx.save();
          ctx.translate(q.x, q.y);
          ctx.rotate(-0.45);
          ctx.ellipse(0, 0, 4.4, 1.9, 0, 0, Math.PI * 2);
          ctx.restore();
          ctx.stroke();
        } else if (o.type === "gc") {
          ctx.arc(q.x, q.y, 3.1, 0, Math.PI * 2);
          ctx.moveTo(q.x - 3.1, q.y);
          ctx.lineTo(q.x + 3.1, q.y);
          ctx.moveTo(q.x, q.y - 3.1);
          ctx.lineTo(q.x, q.y + 3.1);
          ctx.stroke();
        } else if (o.type === "oc") {
          ctx.setLineDash([1.5, 2]);
          ctx.arc(q.x, q.y, 3.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (o.type === "nb") {
          ctx.moveTo(q.x, q.y - 3.6);
          ctx.lineTo(q.x + 3.6, q.y);
          ctx.lineTo(q.x, q.y + 3.6);
          ctx.lineTo(q.x - 3.6, q.y);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.arc(q.x, q.y, 2.1, 0, Math.PI * 2);
          ctx.stroke();
          for (let a = 0; a < 4; a++) {
            const t = (a * Math.PI) / 2 + Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(q.x + Math.cos(t) * 3, q.y + Math.sin(t) * 3);
            ctx.lineTo(q.x + Math.cos(t) * 4.6, q.y + Math.sin(t) * 4.6);
            ctx.stroke();
          }
        }
        if (dsoLabelA > 0.03) {
          ctx.font = '7px "IBM Plex Mono", ui-monospace, monospace';
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${INK}, ${dsoLabelA})`;
          ctx.fillText(o.id, q.x + 6.5, q.y - 1);
          const fam = locale === "uk" ? o.nameUk : o.name;
          if (zoomed && fam && lensZoom >= 2.2) {
            ctx.fillStyle = `rgba(${INK}, ${dsoLabelA * 0.8})`;
            ctx.fillText(fam.toUpperCase(), q.x + 6.5, q.y + 8);
          }
        }
      }

      // The lens readout: which figure stands under the glass, and how
      // high it rides. Computed on the main pass, drawn with the rim.
      if (!zoomed && fine && lx > -1e3) {
        lensRead = null;
        lensReadStar = null;
        lensReadPos = null;
        // The eyepiece's own pointing, from the inverse projection.
        const sky = unproject((lx - ox) / scale, (ly - oy) / scale);
        if (sky.alt > -1) {
          lensReadPos = `${locale === "uk" ? "АЗ" : "AZ"} ${Math.round(sky.az)}° · ${locale === "uk" ? "ВИС" : "ALT"} ${Math.round(
            Math.max(0, sky.alt),
          )}° · ×${lensZoom.toFixed(1)}`;
        }
        let sd = 70;
        for (let i = 0; i < STARS.length; i++) {
          const st = STARS[i];
          if (!st.name) continue;
          const pp = pts[i];
          if (pp.alt < 0) continue;
          const qq = S(pp);
          const d = Math.hypot(qq.x - lx, qq.y - ly);
          if (d < sd) {
            sd = d;
            const nm = locale === "uk" ? (STAR_NAME_UK[st.name] ?? st.name.toUpperCase()) : st.name.toUpperCase();
            lensReadStar = `${nm} · MAG ${st.mag.toFixed(1)}`;
          }
        }
        let bd = 118;
        for (const c of CONSTELLATIONS) {
          const idx = [...new Set(c.lines.flat())];
          let sx = 0;
          let sy = 0;
          let n = 0;
          for (const i of idx) {
            const p = pts[i];
            if (p.alt < 2) continue;
            const q = S(p);
            sx += q.x;
            sy += q.y;
            n++;
          }
          if (n < 2) continue;
          const d = Math.hypot(sx / n - lx, sy / n - ly);
          if (d < bd) {
            bd = d;
            lensRead = (locale === "uk" ? c.nameUk : c.name).toUpperCase();
          }
        }
      }

      // Constellation names live under the glass only.
      if (zoomed) {
        ctx.font = '8.5px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = "center";
        ctx.fillStyle = `rgba(${INK}, 0.52)`;
        for (const c of CONSTELLATIONS) {
          const idx = [...new Set(c.lines.flat())];
          let sx = 0;
          let sy = 0;
          let n = 0;
          for (const i of idx) {
            const p = pts[i];
            if (p.alt < 4) continue;
            const q = S(p);
            sx += q.x;
            sy += q.y;
            n++;
          }
          if (n >= 2) {
            const label = (locale === "uk" ? c.nameUk : c.name).toUpperCase();
            const w2 = ctx.measureText(label).width / 2;
            const R = LENS_R / lensZoom - 10;
            ctx.fillText(label, Math.max(lx - R + w2, Math.min(lx + R - w2, sx / n)), sy / n - 12);
          }
        }
      }

      // The sun and moon, when the sky holds them.
      if (today) {
        const sunEq = eclipticToEquatorial(today.sunLongitude);
        const sp = project(sunEq.ra, sunEq.dec, L, latDeg);
        if (sp.alt > 0) {
          const q = S(sp);
          ctx.strokeStyle = `rgba(${OX}, 0.85)`;
          ctx.fillStyle = `rgba(${OX}, 0.9)`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(q.x, q.y, 7 * gs, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(q.x, q.y, 2.2 * gs, 0, Math.PI * 2);
          ctx.fill();
          for (let a = 0; a < 8; a++) {
            const t = (a * Math.PI) / 4;
            ctx.beginPath();
            ctx.moveTo(q.x + Math.cos(t) * 9.5 * gs, q.y + Math.sin(t) * 9.5 * gs);
            ctx.lineTo(q.x + Math.cos(t) * 13 * gs, q.y + Math.sin(t) * 13 * gs);
            ctx.stroke();
          }
        }
        const moonLam = moonLongitude(today.sunLongitude, today.moonFraction, today.moonWaxing);
        const moonEq = eclipticToEquatorial(moonLam);
        const mp = project(moonEq.ra, moonEq.dec, L, latDeg);
        if (mp.alt > 0) {
          const q = S(mp);
          const mr = 8 * gs;
          // Engraving grammar: the DARK limb carries the ink, the lit
          // limb stays paper — legible on paper, unlike a pale fill.
          ctx.fillStyle = `rgba(${INK}, 0.1)`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, mr, 0, Math.PI * 2);
          ctx.fill();
          const lit = moonPath(q.x, q.y, mr, today.moonFraction, today.moonWaxing);
          if (lit) {
            ctx.fillStyle = "#e8e9ff";
            ctx.fill(new Path2D(lit));
          }
          ctx.strokeStyle = `rgba(${INK}, 0.7)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(q.x, q.y, mr, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // A meteor, perhaps — once in a long while a hairline crosses
      // the chart and burns out. Main pass only; never under the glass.
      if (!zoomed && meteor && !reduce) {
        const mt = (tSec * 1000 - meteor.born) / meteor.life;
        if (mt >= 0 && mt < 1) {
          const hx = meteor.x0 + (meteor.x1 - meteor.x0) * mt;
          const hy = meteor.y0 + (meteor.y1 - meteor.y0) * mt;
          const tail = 0.3;
          const tx0 = meteor.x0 + (meteor.x1 - meteor.x0) * Math.max(0, mt - tail);
          const ty0 = meteor.y0 + (meteor.y1 - meteor.y0) * Math.max(0, mt - tail);
          const fade = mt < 0.7 ? 1 : 1 - (mt - 0.7) / 0.3;
          const g = ctx.createLinearGradient(tx0, ty0, hx, hy);
          g.addColorStop(0, `rgba(${INK}, 0)`);
          g.addColorStop(1, `rgba(${INK}, ${0.7 * fade})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(tx0, ty0);
          ctx.lineTo(hx, hy);
          ctx.stroke();
        }
      }

      // The flare act: passing the ecliptic's heart, three quarters
      // into the dive, the aim-point kindles ember before the dawn.
      if (!zoomed && dive > 0.56 && dive < 0.86) {
        const act = 1 - Math.abs((dive - 0.71) / 0.15);
        const fx = ox + target.x * scale;
        const fy = oy + target.y * scale;
        const fr = 70 + act * 90;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        g.addColorStop(0, `rgba(${OX}, ${0.3 * act})`);
        g.addColorStop(0.55, `rgba(${OX}, ${0.11 * act})`);
        g.addColorStop(1, `rgba(${OX}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(fx, fy, fr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // The instrument's rim (outside the clip): the earth's ground
      // hatched away from the horizon, then a graduated bezel — the
      // chart as a brass-and-paper device, not a diagram.
      if (!zoomed) {
        // Radial hatching outside the horizon: the world below.
        ctx.strokeStyle = `rgba(${INK}, ${0.055 * lineE})`;
        ctx.lineWidth = 1;
        for (let d = 0; d < 360; d += 2) {
          const a = (d * Math.PI) / 180;
          const j = 20 + ((d * 7919) % 13); // fixed jitter, printed once
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * (scale + 24), oy + Math.sin(a) * (scale + 24));
          ctx.lineTo(ox + Math.cos(a) * (scale + 24 + j), oy + Math.sin(a) * (scale + 24 + j));
          ctx.stroke();
        }

        // The bezel: double ring, minor tick each 2°, major each 10°,
        // azimuth figures each 30°.
        ctx.strokeStyle = `rgba(${INK}, ${0.32 * lineE})`;
        ctx.beginPath();
        ctx.arc(ox, oy, scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${INK}, ${0.22 * lineE})`;
        ctx.beginPath();
        ctx.arc(ox, oy, scale + 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${INK}, ${0.3 * lineE})`;
        for (let d = 0; d < 360; d += 2) {
          const a = ((d - 90) * Math.PI) / 180;
          const len = d % 30 === 0 ? 0 : d % 10 === 0 ? 9 : 4;
          if (!len) continue;
          ctx.beginPath();
          ctx.moveTo(ox + Math.cos(a) * (scale + 2), oy + Math.sin(a) * (scale + 2));
          ctx.lineTo(ox + Math.cos(a) * (scale + 2 + len), oy + Math.sin(a) * (scale + 2 + len));
          ctx.stroke();
        }
        ctx.font = '8px "IBM Plex Mono", ui-monospace, monospace';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(${INK}, ${0.42 * lineE})`;
        for (let d = 0; d < 360; d += 30) {
          const a = ((d - 90) * Math.PI) / 180;
          ctx.fillText(String(d), ox + Math.cos(a) * (scale + 15), oy + Math.sin(a) * (scale + 15));
        }

        const cards = locale === "uk" ? ["Пн", "Сх", "Пд", "Зх"] : ["N", "E", "S", "W"];
        ctx.font = '10px "IBM Plex Mono", ui-monospace, monospace';
        ctx.fillStyle = `rgba(${INK}, ${0.62 * lineE})`;
        // North up, east LEFT — the sky seen lying on one's back.
        const at = [
          { x: ox, y: oy - scale - 34 },
          { x: ox - scale - 34, y: oy },
          { x: ox, y: oy + scale + 34 },
          { x: ox + scale + 34, y: oy },
        ];
        for (let i = 0; i < 4; i++) {
          if (at[i].x > -30 && at[i].x < W + 30 && at[i].y > -20 && at[i].y < H + 20) {
            ctx.fillText(cards[i], at[i].x, at[i].y);
          }
        }

        // The cartouche: the map signs itself. An opaque paper label
        // seated on the chart, as every engraved atlas plate carries.
        if (lineE > 0.5 && dive < 0.3 && !narrow) {
          const cw = 176;
          const chh = reader !== null ? 84 : 70;
          const cxx = W - cw - 30;
          const cyy = 126;
          ctx.globalAlpha = Math.min(1, (lineE - 0.5) * 2.5) * (1 - dive * 3.3);
          ctx.fillStyle = "#10134d";
          ctx.fillRect(cxx, cyy, cw, chh);
          ctx.strokeStyle = `rgba(${INK}, 0.45)`;
          ctx.lineWidth = 1;
          ctx.strokeRect(cxx + 0.5, cyy + 0.5, cw - 1, chh - 1);
          ctx.strokeStyle = `rgba(${INK}, 0.2)`;
          ctx.strokeRect(cxx + 3.5, cyy + 3.5, cw - 7, chh - 7);
          ctx.fillStyle = `rgba(${INK}, 0.78)`;
          ctx.font = '11px "Cormorant Garamond", serif';
          ctx.textAlign = "center";
          ctx.fillText(skyDate ? "VT STABAT" : locale === "uk" ? "КАРТА НЕБА" : "CARTA COELI", cxx + cw / 2, cyy + 17);
          ctx.font = '7px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = `rgba(${INK}, 0.55)`;
          const lstH = Math.floor(Ltrue);
          const lstM = String(Math.floor((Ltrue - lstH) * 60)).padStart(2, "0");
          const lstS = String(Math.floor((((Ltrue - lstH) * 60) % 1) * 60)).padStart(2, "0");
          ctx.fillText(`LAT 48° N · LST ${String(lstH).padStart(2, "0")}:${lstM}:${lstS}`, cxx + cw / 2, cyy + 32);
          ctx.fillText(
            (today ? today.dateLine : "").toUpperCase() || "—",
            cxx + cw / 2,
            cyy + 44,
          );
          if (today) {
            const sIdx = Math.floor(((today.sunLongitude % 360) + 360) % 360 / 30);
            const sDeg = Math.round(today.sunLongitude % 30);
            ctx.fillText(
              `SOL ${sDeg}° ${SIGN_ABBR[sIdx]} · LUNA ${Math.round(today.moonFraction * 100)}%`,
              cxx + cw / 2,
              cyy + 56,
            );
          }
          if (reader !== null) {
            ctx.fillStyle = `rgba(${OX}, 0.8)`;
            ctx.fillText(`LECTOR · ${SIGN_ABBR[reader]}`, cxx + cw / 2, cyy + 70);
          }
          // The truth claim, in one dry line: the chart is computed,
          // not decorated — and it says so exactly once.
          ctx.font = '6.5px "IBM Plex Mono", ui-monospace, monospace';
          ctx.fillStyle = `rgba(${INK}, 0.38)`;
          ctx.fillText(
            skyDate
              ? locale === "uk"
                ? "ЯК СТОЯЛО НЕБО У НІЧ ВАШОГО НАРОДЖЕННЯ"
                : "AS THE SKY STOOD ON THE NIGHT YOU WERE BORN"
              : locale === "uk"
                ? "ОБЧИСЛЕНО ДЛЯ ЦІЄЇ ГОДИНИ · НАД ВАШИМ ОБРІЄМ"
                : "COMPUTED FOR THIS HOUR · ABOVE YOUR HORIZON",
            cxx + cw / 2,
            cyy + chh + 11,
          );
          ctx.globalAlpha = 1;
        }

        // SIGNA — the chart's key: the magnitude ladder and the deep-
        // sky symbol grammar. Every serious plate carries one.
        if (lineE > 0.5 && dive < 0.25 && !narrow) {
          const gw = 196;
          const gh = 56;
          // Under the cartouche, clear of the cluster's text block.
          const gx0 = W - gw - 30;
          const gy0 = 208;
          ctx.globalAlpha = Math.min(1, (lineE - 0.5) * 2.5) * Math.max(0, 1 - dive * 4);
          ctx.fillStyle = "#10134d";
          ctx.fillRect(gx0, gy0, gw, gh);
          ctx.strokeStyle = `rgba(${INK}, 0.4)`;
          ctx.lineWidth = 1;
          ctx.strokeRect(gx0 + 0.5, gy0 + 0.5, gw - 1, gh - 1);
          ctx.fillStyle = `rgba(${INK}, 0.7)`;
          ctx.font = '9px "Cormorant Garamond", serif';
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText("SIGNA", gx0 + 10, gy0 + 12);
          // magnitude ladder
          const my0 = gy0 + 28;
          const mags = [
            { r: 3, label: "I" },
            { r: 2.1, label: "II" },
            { r: 1.4, label: "III" },
            { r: 0.9, label: "IV" },
          ];
          let mx0 = gx0 + 12;
          ctx.font = '6.5px "IBM Plex Mono", ui-monospace, monospace';
          for (const m of mags) {
            ctx.fillStyle = `rgba(${INK}, 0.85)`;
            ctx.beginPath();
            ctx.arc(mx0, my0, m.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(${INK}, 0.5)`;
            ctx.fillText(m.label, mx0 + 6, my0 + 1);
            mx0 += 26 + m.label.length * 2;
          }
          ctx.fillStyle = `rgba(${INK}, 0.5)`;
          ctx.fillText("MAG", gx0 + gw - 34, my0 + 1);
          // symbol key
          const sy0 = gy0 + 44;
          ctx.strokeStyle = `rgba(${INK}, 0.6)`;
          ctx.lineWidth = 0.8;
          let sx0 = gx0 + 12;
          ctx.save();
          ctx.translate(sx0, sy0);
          ctx.rotate(-0.45);
          ctx.beginPath();
          ctx.ellipse(0, 0, 4, 1.7, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          ctx.fillText("GX", sx0 + 8, sy0 + 1);
          sx0 += 42;
          ctx.beginPath();
          ctx.arc(sx0, sy0, 2.8, 0, Math.PI * 2);
          ctx.moveTo(sx0 - 2.8, sy0);
          ctx.lineTo(sx0 + 2.8, sy0);
          ctx.stroke();
          ctx.fillText("GC", sx0 + 8, sy0 + 1);
          sx0 += 42;
          ctx.setLineDash([1.5, 2]);
          ctx.beginPath();
          ctx.arc(sx0, sy0, 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillText("OC", sx0 + 8, sy0 + 1);
          sx0 += 42;
          ctx.beginPath();
          ctx.moveTo(sx0, sy0 - 3.2);
          ctx.lineTo(sx0 + 3.2, sy0);
          ctx.lineTo(sx0, sy0 + 3.2);
          ctx.lineTo(sx0 - 3.2, sy0);
          ctx.closePath();
          ctx.stroke();
          ctx.fillText("NEB", sx0 + 8, sy0 + 1);
          ctx.globalAlpha = 1;
        }
      }
    };

    const LENS_R = 132;

    // ── The optic: a real ground-glass eyepiece ─────────────────
    // A lens-sized WebGL quad floats over the chart. Each frame the
    // region under the glass is uploaded and refracted: barrel
    // magnification easing to the rim, chromatic fringe only at the
    // edge, a darkened rim band and one specular arc. The 2D zoom
    // pass below remains as the complete fallback.
    let glOK = false;
    let glCanvas: HTMLCanvasElement | null = null;
    let glCtx: WebGLRenderingContext | null = null;
    let glZoomLoc: WebGLUniformLocation | null = null;
    const staging = document.createElement("canvas");
    staging.width = 512;
    staging.height = 512;
    const stagingCtx = staging.getContext("2d");

    if (fine && !reduce) {
      try {
        glCanvas = document.createElement("canvas");
        glCanvas.className = "lens-gl";
        glCanvas.width = 512;
        glCanvas.height = 512;
        Object.assign(glCanvas.style, {
          position: "absolute",
          left: "0",
          top: "0",
          width: `${LENS_R * 2}px`,
          height: `${LENS_R * 2}px`,
          borderRadius: "50%",
          pointerEvents: "none",
          display: "none",
          zIndex: "3",
        });
        canvas.parentElement?.appendChild(glCanvas);
        const gl = glCanvas.getContext("webgl", { premultipliedAlpha: true, alpha: true });
        if (!gl) throw new Error("no webgl");
        glCtx = gl;
        const vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, "attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; v.y = 1.0 - v.y; gl_Position = vec4(p, 0.0, 1.0); }");
        gl.compileShader(vs);
        const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, `
          precision mediump float;
          varying vec2 v;
          uniform sampler2D t;
          uniform float z; // 1/lensZoom
          void main() {
            vec2 c = v - 0.5;
            float r = clamp(length(c) / 0.5, 0.0, 1.0);
            if (r > 1.0) { gl_FragColor = vec4(0.0); return; }
            float mag = mix(z, 1.0, smoothstep(0.55, 1.0, r));
            vec2 uv = 0.5 + c * mag * (1.0 - 0.12 * r * r);
            float w = pow(r, 3.0);
            float rr = texture2D(t, 0.5 + (uv - 0.5) * mix(1.0, 1.006, w)).r;
            float gg = texture2D(t, uv).g;
            float bb = texture2D(t, 0.5 + (uv - 0.5) * mix(1.0, 1.013, w)).b;
            vec3 col = vec3(rr, gg, bb);
            // A magnifier gathers light: the glass runs brighter than
            // the plate around it, with a whisper of warm film.
            col = col * 1.22 + vec3(0.018, 0.011, 0.004);
            col *= 1.0 - 0.16 * smoothstep(0.94, 0.99, r);
            float ring = smoothstep(0.955, 0.968, r) * (1.0 - smoothstep(0.985, 1.0, r));
            col = mix(col, vec3(0.05, 0.055, 0.09), ring * 0.85);
            float spec = smoothstep(0.92, 0.985, dot(normalize(c + vec2(0.0001)), normalize(vec2(-0.6, -0.75))))
                       * smoothstep(0.82, 0.94, r) * (1.0 - smoothstep(0.97, 1.0, r));
            col += spec * 0.13;
            float edgeA = 1.0 - smoothstep(0.985, 1.0, r);
            gl_FragColor = vec4(col * edgeA, edgeA);
          }
        `);
        gl.compileShader(fs);
        const prog = gl.createProgram()!;
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(prog)));
        gl.useProgram(prog);
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        glZoomLoc = gl.getUniformLocation(prog, "z");
        glOK = true;
      } catch {
        glOK = false;
        glCanvas?.remove();
        glCanvas = null;
      }
    }

    const renderLens = () => {
      if (!glOK || !glCanvas || !glCtx || !stagingCtx) return;
      const dpr2 = Math.min(window.devicePixelRatio || 1, 2);
      // The chart's night ground lives in CSS behind a transparent
      // canvas — lay it into the staging first or the glass magnifies
      // bone strokes on nothing.
      const ground = stagingCtx.createRadialGradient(256, 256, 0, 256, 256, 360);
      ground.addColorStop(0, "#232c94");
      ground.addColorStop(0.55, "#151b66");
      ground.addColorStop(1, "#0a0d38");
      stagingCtx.fillStyle = ground;
      stagingCtx.fillRect(0, 0, 512, 512);
      stagingCtx.drawImage(
        canvas,
        (lx - LENS_R) * dpr2,
        (ly - LENS_R) * dpr2,
        LENS_R * 2 * dpr2,
        LENS_R * 2 * dpr2,
        0, 0, 512, 512,
      );
      const gl = glCtx;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, staging);
      gl.uniform1f(glZoomLoc, 1 / lensZoom);
      gl.viewport(0, 0, 512, 512);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      glCanvas.style.transform = `translate(${(lx - LENS_R).toFixed(1)}px, ${(ly - LENS_R).toFixed(1)}px)`;
      glCanvas.style.display = "block";
    };

    const draw = (tSec: number) => {
      ctx.clearRect(0, 0, W, H);
      drawSky(false, tSec);
      // The glass: within it the sky re-renders enlarged and resolved.
      // The glass belongs to the open sky: it stands down over the
      // display block, where the ink-pressure rig owns the cursor.
      const overType =
        dispRect !== null &&
        mx > dispRect.left - 30 &&
        mx < dispRect.right + 30 &&
        my > dispRect.top - 20 &&
        my < dispRect.bottom + 20;
      // ...and only over the sky itself: no orphan fragments over the
      // masthead or beyond the plate. It breathes out at the edges.
      let lensA = 1;
      if (chartGeom) {
        const dc = Math.hypot(lx - chartGeom.ox, ly - chartGeom.oy);
        lensA = Math.min(lensA, Math.max(0, (chartGeom.scale + 40 - dc) / 60));
      }
      lensA = Math.min(lensA, Math.max(0, (ly - 6) / 40), Math.max(0, (lx - 6) / 40));
      lensA = Math.min(lensA, Math.max(0, (H - 6 - ly) / 40), Math.max(0, (W - 6 - lx) / 40));
      const lensOn = fine && !reduce && dive < 0.45 && lx > -1e3 && entrance > 0.6 && !overType && lensA > 0.04;
      if (lensOn && glOK) {
        // The real optic replaces the 2D interior entirely; only the
        // readout card is still set in ink below the glass.
        renderLens();
        if (lensRead || lensReadStar || lensReadPos) {
          const rows2: string[] = [];
          if (lensRead) rows2.push(lensRead);
          if (lensReadStar) rows2.push(lensReadStar);
          if (lensReadPos) rows2.push(lensReadPos);
          ctx.font = '8px "IBM Plex Mono", ui-monospace, monospace';
          let tw2 = 0;
          for (const t2 of rows2) tw2 = Math.max(tw2, ctx.measureText(t2).width);
          tw2 += 20;
          const rh2 = 14;
          const th2 = rows2.length * rh2 + 8;
          const bx2 = lx - tw2 / 2;
          const by2 = ly + LENS_R + 10;
          ctx.fillStyle = "rgba(223, 231, 252, 0.94)";
          ctx.fillRect(bx2, by2, tw2, th2);
          ctx.strokeStyle = "rgba(9, 10, 16, 0.35)";
          ctx.lineWidth = 1;
          ctx.strokeRect(bx2 + 0.5, by2 + 0.5, tw2 - 1, th2 - 1);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          rows2.forEach((t2, i2) => {
            ctx.font = i2 === 0 && lensRead ? '600 9px "IBM Plex Mono", ui-monospace, monospace' : '8px "IBM Plex Mono", ui-monospace, monospace';
            ctx.fillStyle = i2 === 0 && lensRead ? "rgba(9, 10, 16, 0.95)" : "rgba(9, 10, 16, 0.7)";
            ctx.fillText(t2, lx, by2 + 4 + rh2 * i2 + rh2 / 2);
          });
        }
      } else if (glCanvas) {
        glCanvas.style.display = "none";
      }
      if (lensOn && !glOK) {
        ctx.globalAlpha = Math.min(1, lensA);
        ctx.save();
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2);
        ctx.clip();
        // Opaque ground: the base chart must not survive under the
        // magnified pass — a glass shows one sky, not two.
        ctx.fillStyle = "#1c2488";
        ctx.fillRect(lx - LENS_R, ly - LENS_R, LENS_R * 2, LENS_R * 2);
        ctx.translate(lx, ly);
        ctx.scale(lensZoom, lensZoom);
        ctx.translate(-lx, -ly);
        drawSky(true, tSec);
        ctx.fillStyle = "rgba(255, 224, 178, 0.07)";
        ctx.fillRect(lx - LENS_R, ly - LENS_R, LENS_R * 2, LENS_R * 2);
        ctx.restore();
        // Rim: a graduated instrument bezel — double hairline, a
        // degree scale, four setting ticks.
        ctx.strokeStyle = `rgba(${INK}, 0.5)`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${INK}, 0.2)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(lx, ly, LENS_R - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = `rgba(${INK}, 0.3)`;
        for (let d = 0; d < 360; d += 15) {
          const t = (d * Math.PI) / 180;
          const len = d % 90 === 0 ? 0 : 3;
          if (!len) continue;
          ctx.beginPath();
          ctx.moveTo(lx + Math.cos(t) * (LENS_R - 4), ly + Math.sin(t) * (LENS_R - 4));
          ctx.lineTo(lx + Math.cos(t) * (LENS_R - 4 - len), ly + Math.sin(t) * (LENS_R - 4 - len));
          ctx.stroke();
        }
        ctx.strokeStyle = `rgba(${INK}, 0.5)`;
        for (let a = 0; a < 4; a++) {
          const t = (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(lx + Math.cos(t) * (LENS_R - 4), ly + Math.sin(t) * (LENS_R - 4));
          ctx.lineTo(lx + Math.cos(t) * (LENS_R + 3), ly + Math.sin(t) * (LENS_R + 3));
          ctx.stroke();
        }

        // Crosshair: fine setting ticks at the eyepiece's center.
        ctx.strokeStyle = `rgba(${INK}, 0.4)`;
        ctx.lineWidth = 0.7;
        for (let a = 0; a < 4; a++) {
          const t = (a * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(lx + Math.cos(t) * 4, ly + Math.sin(t) * 4);
          ctx.lineTo(lx + Math.cos(t) * 11, ly + Math.sin(t) * 11);
          ctx.stroke();
        }

        // The readout card: constellation under glass, nearest named
        // star with its magnitude, and the instrument's own pointing.
        const rows: Array<[string, boolean]> = [];
        if (lensRead) rows.push([lensRead, true]);
        if (lensReadStar) rows.push([lensReadStar, false]);
        if (lensReadPos) rows.push([lensReadPos, false]);
        if (rows.length) {
          ctx.font = '8px "IBM Plex Mono", ui-monospace, monospace';
          let tw = 0;
          for (const [txt] of rows) tw = Math.max(tw, ctx.measureText(txt).width);
          tw += 20;
          const rh = 14;
          const th = rows.length * rh + 8;
          const bx = lx - tw / 2;
          const by = ly + LENS_R + 10;
          ctx.fillStyle = "rgba(223, 231, 252, 0.94)";
          ctx.fillRect(bx, by, tw, th);
          ctx.strokeStyle = "rgba(9, 10, 16, 0.35)";
          ctx.lineWidth = 1;
          ctx.strokeRect(bx + 0.5, by + 0.5, tw - 1, th - 1);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          rows.forEach(([txt, head], i) => {
            ctx.font = head ? '600 9px "IBM Plex Mono", ui-monospace, monospace' : '8px "IBM Plex Mono", ui-monospace, monospace';
            ctx.fillStyle = head ? "rgba(9, 10, 16, 0.95)" : "rgba(9, 10, 16, 0.7)";
            ctx.fillText(txt, lx, by + 4 + rh * i + rh / 2);
          });
        }
        ctx.globalAlpha = 1;
      }
    };

    let lastTip = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (disposed) return;

      // Scroll dive.
      if (pin && !reduce) {
        const r = pin.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        const raw = span > 40 ? Math.max(0, Math.min(1, -r.top / span)) : 0;
        // The dive is now the act's EXIT only: the film and the landing
        // hero own the first three quarters of the pin (--cp), and the
        // old dive drama — lines parting, dawn flare — plays out in the
        // last stretch on its own remapped clock.
        const p = Math.max(0, Math.min(1, (raw - 0.72) / 0.28));
        if (Math.abs(p - dive) > 0.002) {
          dive = p;
          dirty = true;
        }
        if (Math.abs(dive - lastDive) > 0.002) {
          lastDive = dive;
          pin.style.setProperty("--dive", dive.toFixed(3));
          pin.classList.toggle("is-diving", dive > 0.38);
          // The dive ends in dawn: after the flare the sky dissolves
          // into the paper, handing the scroll to the day panorama. A
          // whisper of roll on the way in — the dome turning overhead.
          canvas.style.opacity = String(dive < 0.8 ? 1 : Math.max(0, 1 - (dive - 0.8) * 5).toFixed(3));
          if (dive > 0.97) {
            try {
              if (!localStorage.getItem("olivia-diver")) {
                localStorage.setItem("olivia-diver", "1");
                window.dispatchEvent(new Event("alm-diver"));
              }
            } catch {
              /* the fall still happened */
            }
          }
        }
      }

      // Entrance: stars kindle in magnitude order — but only once the
      // bloom has actually revealed the page. No star lights behind
      // the curtain.
      if (tEntr < 0) {
        if (rootEl && /stage-(bloom|done)/.test(rootEl.className)) tEntr = performance.now();
      } else if (entrance < 1.15) {
        entrance = Math.min(1.15, (performance.now() - tEntr) / 2400);
        dirty = true;
      }
      // Once kindled, the zodiac road pulses its invitation — and if
      // the hand never comes, it asks again, at most twice more.
      if (pulseAt < 0 && entrance >= 1 && !reduce) pulseAt = performance.now() + 900;
      if (pulseAt > 0) {
        const pd = performance.now() - pulseAt;
        if (pd > -50 && pd < 1400) dirty = true;
        if (pd > 1500 && pulseCount < 2 && dive < 0.05) {
          pulseCount++;
          pulseAt = performance.now() + 21000;
        }
      }
      if (hover >= 0) pulseCount = 99; // the invitation was heard
      // The world has mass: the drawn camera trails the scrubbed dive —
      // and the compositor roll rides the same massed value, so a fast
      // flick never splits frame from sky.
      diveDraw += (dive - diveDraw) * 0.12;
      if (Math.abs(dive - diveDraw) > 0.0015) {
        dirty = true;
        canvas.style.transform = `rotate(${(diveDraw * 3.2).toFixed(2)}deg) scale(${(1 + diveDraw * 0.06).toFixed(3)})`;
      }

      // The living sky: halo breathing at half frame-rate, and now and
      // then a meteor — only while the chart is on stage and the tab
      // is watched. Never under reduced motion.
      if (!reduce && document.visibilityState === "visible" && window.scrollY < window.innerHeight * 2.4) {
        const nowMs = performance.now();
        if ((!meteor || nowMs - meteor.born > meteor.life) && nowMs > nextMeteor && dive < 0.1) {
          const mcx = W * (W < 900 ? 0.5 : 0.62) + (Math.random() - 0.5) * W * 0.36;
          const mcy = H * (0.14 + Math.random() * 0.38);
          const ang = Math.PI * (0.12 + Math.random() * 0.76);
          const len = 130 + Math.random() * 150;
          meteor = {
            x0: mcx,
            y0: mcy,
            x1: mcx + Math.cos(ang) * len,
            y1: mcy + Math.sin(ang) * len,
            born: nowMs,
            life: 1000,
          };
          nextMeteor = nowMs + 25000 + Math.random() * 20000;
        }
        frameFlip = !frameFlip;
        if (frameFlip || (meteor && nowMs - meteor.born < meteor.life)) dirty = true;
      }

      // Lens drift.
      if (fine && mx > -1e3) {
        if (lx < -1e3) {
          lx = mx;
          ly = my;
        }
        lx += (mx - lx) * 0.22;
        ly += (my - ly) * 0.22;
        if (Math.abs(mx - lx) + Math.abs(my - ly) > 0.25) dirty = true;
      }

      // Zodiac band hit-test against the last pass's ecliptic.
      if (fine && mx > -1e3 && dive < 0.45) {
        let best = 1e9;
        let bestLam = -1;
        for (const p of eclScreen) {
          const d = (p.x - mx) * (p.x - mx) + (p.y - my) * (p.y - my);
          if (d < best) {
            best = d;
            bestLam = p.lambda;
          }
        }
        const h = best < 44 * 44 ? Math.floor((bestLam % 360) / 30) : -1;
        if (h !== hover) {
          hover = h;
          canvas.style.cursor = h >= 0 ? "pointer" : "zoom-in";
          dirty = true;
        }
      } else if (hover !== -1) {
        hover = -1;
        canvas.style.cursor = "";
        dirty = true;
      }
      if (hover !== lastTip) {
        lastTip = hover;
        setTip(hover >= 0 ? { x: Math.min(Math.max(mx, 130), W - 130), y: Math.max(my - 26, 40), sector: hover } : null);
      }

      if (fine && ++rectTick % 30 === 0) {
        const cr = canvas.getBoundingClientRect();
        const dr = document.querySelector(".front-display")?.getBoundingClientRect();
        dispRect = dr ? new DOMRect(dr.left - cr.left, dr.top - cr.top, dr.width, dr.height) : null;
      }

      if (dirty && W > 0) {
        dirty = false;
        draw(performance.now() / 1000);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    };
    const onLeave = () => {
      mx = -1e4;
      my = -1e4;
      lx = -1e4;
      ly = -1e4;
      if (glCanvas) glCanvas.style.display = "none";
      dirty = true;
    };
    const onClick = () => {
      if (hover >= 0) {
        router.push(`/signs/${SIGN_SLUGS[hover]}/`);
        return;
      }
      // A click on open sky turns the focus ring: three stops.
      if (fine && !reduce && dive < 0.45 && lx > -1e3) {
        lensZoom = lensZoom >= 3 ? 1.6 : lensZoom >= 2.2 ? 3 : 2.2;
        dirty = true;
      }
    };
    const onResize = () => resize();
    // "Save the plate": the live chart, taken away as a keepsake PNG.
    const onSavePlate = () => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "olivia-arcana-birth-sky.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }, "image/png");
    };
    window.addEventListener("alm-save-plate", onSavePlate);

    resize();
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("click", onClick);
    }
    window.addEventListener("resize", onResize);
    // The sky itself turns — a redraw a minute keeps it honest.
    const tick = window.setInterval(() => {
      dirty = true;
    }, 60000);
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("alm-save-plate", onSavePlate);
      glCanvas?.remove();
      if (fine) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        canvas.removeEventListener("click", onClick);
      }
    };
  }, [today, locale, router, reader, skyDate]);

  const sign = tip ? SIGN_PAGES[SIGN_SLUGS[tip.sector]] : null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="sky-canvas"
        aria-label={locale === "uk" ? "Мапа зоряного неба цієї миті — торкніться знака на екліптиці" : "A chart of tonight's sky — touch a sign on the ecliptic"}
        role="img"
      />
      {tip && sign && (
        <div className="instrument-tip" style={{ left: tip.x, top: tip.y }} aria-hidden>
          <span className="tip-name">{locale === "uk" ? SIGN_TIP_UK[tip.sector].name : sign.name}</span>
          <span className="tip-dates">{(locale === "uk" ? SIGN_TIP_UK[tip.sector].dates : sign.dateRange) + " →"}</span>
        </div>
      )}
    </>
  );
}

/* ── Fig. 0: the plate's own geometry ─────────────────────────────
   A chart, so plain coordinates: azimuth across, altitude up. The
   window runs from 40° (north-east) round to 320° (north-west), which
   holds every sunrise and sunset this latitude can produce, and it
   reaches 72° up, which is above anything the sun reaches at 50°N. */

const PLATE_W = 1200;
const PLATE_H = 700;
const MARGIN_X = 92;
const FRAME_TOP = 60;
const FRAME_BOTTOM = 548;
const HORIZON_Y = 448;
const ALT_K = 4.6; // plate units per degree of altitude
const AZ_MIN = 40;
const AZ_MAX = 320;

const LEDGER_Y = 570;
const LEDGER_H = 30;
const COLOPHON_Y = 646;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Azimuth (degrees clockwise from north) → plate x. */
function plateX(az: number): number {
  return r1(MARGIN_X + ((az - AZ_MIN) / (AZ_MAX - AZ_MIN)) * (PLATE_W - 2 * MARGIN_X));
}

/** Altitude (degrees) → plate y. */
function plateY(alt: number): number {
  return r1(HORIZON_Y - alt * ALT_K);
}

function inWindow(az: number): boolean {
  return az >= AZ_MIN && az <= AZ_MAX;
}

const ALTITUDES = [0, 10, 20, 30, 40, 50, 60, 70];

/** The compass along the ground: every 10°, named every 30°. */
const AZ_TICKS: Array<{ az: number; label?: string }> = (() => {
  const NAMES: Record<number, string> = {
    60: "ENE", 90: "E", 120: "ESE", 150: "SSE", 180: "S",
    210: "SSW", 240: "WSW", 270: "W", 300: "WNW",
  };
  const out: Array<{ az: number; label?: string }> = [];
  for (let a = AZ_MIN; a <= AZ_MAX; a += 10) out.push({ az: a, label: NAMES[a] });
  return out;
})();

const TWILIGHT_NAMES = ["CIVIL", "NAUTICAL", "ASTRONOMICAL"];

/** Civil, nautical, astronomical — depth pairs and their tint. */
const TWILIGHT_TINTS: Array<[number, number, number]> = [
  [0, 6, 0.5],
  [6, 12, 0.34],
  [12, 18, 0.2],
];


/**
 * A body's path, cut into the runs that are actually drawable: inside
 * the azimuth window, on the requested side of the horizon, and not
 * jumping the seam where azimuth wraps past north.
 */
function runs(points: SkyPoint[], keep: (p: SkyPoint) => boolean): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let lastX = NaN;
  const flush = () => {
    if (cur.length > 1) out.push(`M ${cur.join(" L ")}`);
    cur = [];
  };
  for (const p of points) {
    if (!keep(p) || !inWindow(p.az)) {
      flush();
      lastX = NaN;
      continue;
    }
    const x = plateX(p.az);
    if (!Number.isNaN(lastX) && Math.abs(x - lastX) > 200) flush();
    cur.push(`${x} ${plateY(p.alt)}`);
    lastX = x;
  }
  flush();
  return out;
}

/**
 * Whole hours struck on a body's own road, each with the outward normal
 * of the track so a graduation can point away from it.
 */
function hourStations(
  track: SkyTrack,
  step = 1
): Array<{ h: number; x: number; y: number; nx: number; ny: number }> {
  const out: Array<{ h: number; x: number; y: number; nx: number; ny: number }> = [];
  const at = (h: number) => track.points.reduce((best, p) =>
    Math.abs(p.h - h) < Math.abs(best.h - h) ? p : best, track.points[0]);
  for (let h = 0; h < 24; h += step) {
    const p = at(h);
    if (Math.abs(p.h - h) > 0.15 || p.alt < 1 || !inWindow(p.az)) continue;
    const a = at(h - 0.4);
    const b = at(h + 0.4);
    let dx = plateX(b.az) - plateX(a.az);
    let dy = plateY(b.alt) - plateY(a.alt);
    const m = Math.hypot(dx, dy) || 1;
    dx /= m;
    dy /= m;
    // Perpendicular, taken on the side that points away from the ground.
    let nx = dy;
    let ny = -dx;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    out.push({ h, x: plateX(p.az), y: plateY(p.alt), nx: r1(nx), ny: r1(ny) });
  }
  return out;
}

const hhmm = (h: number) =>
  `${String(Math.floor(h) % 24).padStart(2, "0")}:${String(Math.round((h % 1) * 60) % 60).padStart(2, "0")}`;

/** Where the sun and moon meet the ground, and at what hour. */
function stations(sky: SkyPlate): Array<{ x: number; label: string; gilt: boolean }> {
  const out: Array<{ x: number; label: string; gilt: boolean }> = [];
  const add = (az: number | null, h: number | null, glyph: string, gilt: boolean) => {
    if (az === null || h === null || !inWindow(az)) return;
    out.push({ x: plateX(az), label: `${glyph} ${hhmm(h)}`, gilt });
  };
  add(sky.sun.riseAz, sky.sun.rise, "☉︎", true);
  add(sky.sun.setAz, sky.sun.set, "☉︎", true);
  add(sky.moon.riseAz, sky.moon.rise, "☽︎", false);
  add(sky.moon.setAz, sky.moon.set, "☽︎", false);
  return out;
}

/** The ledger's cell edges — unequal, because the hours are. */
function ledgerX(sky: SkyPlate, i: number): number {
  const dayHour = sky.dayLength / 12;
  const nightHour = (24 - sky.dayLength) / 12;
  const elapsed = i <= 12 ? i * dayHour : sky.dayLength + (i - 12) * nightHour;
  return r1(MARGIN_X + (elapsed / 24) * (PLATE_W - 2 * MARGIN_X));
}

/* ── The real sky ─────────────────────────────────────────────────
   The vault stops being empty air: the stars that actually stand over
   the reader right now, from the same catalogue the star-chart page
   draws, projected through the same spherical astronomy as the sun.
   The plate becomes a planetarium print of THIS night. */

export interface PlacedStar {
  idx: number;
  mag: number;
  name?: string;
  alt: number;
  az: number;
}

function placeSky(sky: SkyPlate): PlacedStar[] {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return STARS.map((st, idx) => ({
    idx,
    mag: st.mag,
    name: st.name,
    ...horizontalAt(st.ra * 15, st.dec, sky.nowHour, sky.latitude, sky.longitude, midnight),
  }));
}

/** Star radius from magnitude — the engraver's five weights. */
function starR(mag: number): number {
  return mag <= 0.5 ? 2 : mag <= 1.2 ? 1.6 : mag <= 2 ? 1.25 : mag <= 2.8 ? 0.95 : 0.7;
}

/** Fade a star into the horizon haze over its last ten degrees. */
function starO(mag: number, alt: number): number {
  const base = mag <= 1 ? 0.85 : mag <= 2 ? 0.62 : 0.42;
  return Math.round(base * Math.min(1, alt / 10) * 100) / 100;
}

/** Constellation line segments whose both ends stand above the ground. */
function constellationSegs(
  placed: PlacedStar[],
  toX: (az: number) => number,
  toY: (alt: number) => number,
  visible: (az: number) => boolean
): Array<{ d: string; name: string }> {
  const out: Array<{ d: string; name: string }> = [];
  for (const c of CONSTELLATIONS) {
    const parts: string[] = [];
    for (const line of c.lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = placed[line[i]];
        const b = placed[line[i + 1]];
        if (!a || !b || a.alt < 1 || b.alt < 1 || !visible(a.az) || !visible(b.az)) continue;
        if (Math.abs(toX(a.az) - toX(b.az)) > 260) continue;
        parts.push(`M ${toX(a.az)} ${toY(a.alt)} L ${toX(b.az)} ${toY(b.alt)}`);
      }
    }
    if (parts.length) out.push({ d: parts.join(" "), name: c.name });
  }
  return out;
}

/** The named figures standing highest tonight, for quiet labels. */
function constellationLabels(
  placed: PlacedStar[],
  visible: (az: number) => boolean
): Array<{ name: string; az: number; alt: number }> {
  const out: Array<{ name: string; az: number; alt: number; score: number }> = [];
  for (const c of CONSTELLATIONS) {
    const members = new Set<number>();
    for (const line of c.lines) for (const i of line) members.add(i);
    const up = [...members]
      .map((i) => placed[i])
      .filter((p) => p && p.alt > 8 && visible(p.az));
    if (up.length < 3) continue;
    const az = up.reduce((a, p) => a + p.az, 0) / up.length;
    const alt = up.reduce((a, p) => a + p.alt, 0) / up.length;
    out.push({ name: c.name, az, alt, score: alt + up.length * 2 });
  }
  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ name, az, alt }) => ({ name, az, alt }));
}

/** Sixteen winds, for saying where on the horizon a thing happens. */
const WINDS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const windOf = (az: number | null) =>
  az === null ? "" : WINDS[Math.round((((az % 360) + 360) % 360) / 22.5) % 16];

/** "2h 14m", "41m", "under a minute" — the pulse line's clock. */
function fmtDur(hours: number): string {
  const m = Math.round(hours * 60);
  if (m < 1) return "under a minute";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** Day-length change, to the second — the number that changes daily. */
function fmtDelta(deltaHours: number): string {
  const s = Math.round(Math.abs(deltaHours) * 3600);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

/** "45° N" / "34° S" wherever the plate states its latitude. */
const latLabel = (lat: number) => `${Math.abs(Math.round(lat))}° ${lat < 0 ? "S" : "N"}`;

/** One pulse clause: "☉ sets in 1h 32m at WNW". */
function eventClause(e: PlateEvent, sky: SkyPlate): string {
  const at =
    e.label === "sunset" ? windOf(sky.sun.setAz)
    : e.label === "sunrise" ? windOf(sky.sun.riseAz)
    : e.label === "moonrise" ? windOf(sky.moon.riseAz)
    : e.label === "moonset" ? windOf(sky.moon.setAz)
    : "";
  const verb =
    e.label === "sunset" || e.label === "moonset" ? "sets"
    : e.label === "sunrise" || e.label === "moonrise" ? "rises"
    : "";
  const head = verb ? `${e.glyph} ${verb}` : `${e.glyph} ${e.label}`;
  return `${head} in ${fmtDur(e.dt)}${at ? ` at ${at}` : ""}`;
}

/** The numbers printed along the foot of the plate. */
function colophon(sky: SkyPlate, today: AlmanacToday | null): Array<{ k: string; v: string }> {
  const sun = sky.sun.body;
  const deg = Math.floor(sun.degree);
  const min = Math.floor((sun.degree - deg) * 60);
  const dayH = Math.floor(sky.dayLength);
  const dayM = Math.round((sky.dayLength - dayH) * 60);
  const hour = sky.hours[sky.hourIndex];
  return [
    { k: "☉︎", v: `${sun.signGlyph}\uFE0E ${deg}°${String(min).padStart(2, "0")}′` },
    { k: "☽︎", v: `${Math.round(sky.moonFraction * 100)}% ${sky.moonWaxing ? "waxing" : "waning"}` },
    { k: "DAY", v: `${dayH}h ${String(dayM).padStart(2, "0")}m` },
    { k: "HOUR", v: hour ? `${hour.glyph} ${hour.name}` : "—" },
    { k: "LAT", v: latLabel(sky.latitude) },
    (() => {
      // The standing countdown: the coming lunation while it is near,
      // the turn of the season while the moon's is weeks out.
      if (sky.lunation.days <= 14) {
        const d = sky.lunation.days;
        return { k: "NEXT", v: `${sky.lunation.kind} ☽\uFE0E ${d < 0.75 ? "tonight" : `in ${Math.round(d)}d`}` };
      }
      const lam = ((sky.sun.body.longitude % 360) + 360) % 360;
      const target = (Math.floor(lam / 90) + 1) * 90;
      const days = Math.round((target - lam) / 0.98565);
      return { k: "NEXT", v: `${target % 180 === 0 ? "equinox" : "solstice"} in ${days}d` };
    })(),
    { k: "No.", v: today ? today.editionNo.replace("No. ", "") : "—" },
  ];
}

/** Roman numeral for a whole hour 0–23. */
function roman(h: number): string {
  const T: Array<[number, string]> = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  if (h === 0) return "XXIV";
  let n = h, out = "";
  for (const [v, sym] of T) while (n >= v) { out += sym; n -= v; }
  return out;
}

/* ── The plate at phone width ──────────────────────────────────────
   The wide plate is about 1000 units across and sets its labels at 10.
   At 390px that ratio puts every word at four pixels, which is not a
   small version of the chart — it is a smudge. So the phone gets its
   own composition from the same numbers: a shorter azimuth window,
   three altitude rules instead of eight, the twenty-four hour ledger
   collapsed to the one hour you are actually in, and type set at a
   size that survives the scale. */

const NARROW_W = 480;
const NARROW_H = 520;
const NARROW_MX = 46;
const NARROW_HOR = 306;
const NARROW_ALT_K = 3.3;
const NARROW_AZ_MIN = 60;
const NARROW_AZ_MAX = 300;

const nX = (az: number) =>
  r1(NARROW_MX + ((az - NARROW_AZ_MIN) / (NARROW_AZ_MAX - NARROW_AZ_MIN)) * (NARROW_W - 2 * NARROW_MX));
const nY = (alt: number) => r1(NARROW_HOR - alt * NARROW_ALT_K);
const nIn = (az: number) => az >= NARROW_AZ_MIN && az <= NARROW_AZ_MAX;

function narrowRuns(points: SkyPoint[], keep: (p: SkyPoint) => boolean): string[] {
  const out: string[] = [];
  let cur: string[] = [];
  let lastX = NaN;
  const flush = () => {
    if (cur.length > 1) out.push(`M ${cur.join(" L ")}`);
    cur = [];
  };
  for (const p of points) {
    if (!keep(p) || !nIn(p.az)) {
      flush();
      lastX = NaN;
      continue;
    }
    const x = nX(p.az);
    if (!Number.isNaN(lastX) && Math.abs(x - lastX) > 90) flush();
    cur.push(`${x} ${nY(p.alt)}`);
    lastX = x;
  }
  flush();
  return out;
}

function NarrowPlate({
  sky,
  today,
  placed,
}: {
  sky: SkyPlate | null;
  today: AlmanacToday | null;
  placed: PlacedStar[];
}) {
  const hour = sky && sky.hourIndex >= 0 ? sky.hours[sky.hourIndex] : null;
  return (
    <svg viewBox={`0 0 ${NARROW_W} ${NARROW_H}`} className="panorama-svg" aria-hidden="true">
      <defs>
        <radialGradient id="pann-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--ox, #e0b768)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--ox, #e0b768)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pann-face" cx="38%" cy="34%" r="76%">
          <stop offset="0%" stopColor="#fff6e2" stopOpacity="0.96" />
          <stop offset="100%" stopColor="var(--ox, #e0b768)" stopOpacity="0.3" />
        </radialGradient>
      </defs>

      {/* the ground, and the civil dusk just under it */}
      <rect
        className="pan-fade"
        style={{ "--s": 0.14, "--o": 0.22 } as React.CSSProperties}
        x={NARROW_MX}
        y={nY(0)}
        width={NARROW_W - 2 * NARROW_MX}
        height={nY(-8) - nY(0)}
        fill="#20279b"
      />

      {/* three altitude rules is enough to read a curve by */}
      {[20, 40, 60].map((a, i) => (
        <g key={`na${a}`} className="pan-fade" style={{ "--s": 0.08 + i * 0.02, "--o": 0.26 } as React.CSSProperties}>
          <line
            x1={NARROW_MX}
            y1={nY(a)}
            x2={NARROW_W - NARROW_MX}
            y2={nY(a)}
            stroke="currentColor"
            strokeWidth="0.6"
            strokeDasharray="2 6"
          />
          <text className="pan-numeral" x={NARROW_MX - 7} y={nY(a) + 4} textAnchor="end" fontSize="11" fill="currentColor">
            {a}°
          </text>
        </g>
      ))}

      {sky && (
        <>
          <g className="pan-realsky" aria-hidden>
            {placed
              .filter((st) => st.alt > 4 && st.mag <= 2.1 && nIn(st.az))
              .map((st, i) => (
                <circle
                  key={st.idx}
                  className={`pan-fade pan-star pan-star-${i % 3}`}
                  style={{ "--s": 0.7 + (i % 5) * 0.01, "--o": starO(st.mag, st.alt) } as React.CSSProperties}
                  cx={nX(st.az)}
                  cy={nY(st.alt)}
                  r={starR(st.mag) * 0.9}
                  fill="#e8e9ff"
                />
              ))}
          </g>
          {narrowRuns(sky.moon.points, (p) => p.alt < 0).map((d, i) => (
            <path key={`nmb${i}`} className="pan-fade" style={{ "--s": 0.3, "--o": 0.18 } as React.CSSProperties}
              d={d} fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
          ))}
          {narrowRuns(sky.moon.points, (p) => p.alt >= 0).map((d, i) => (
            <path key={`nma${i}`} className="pan-draw" style={{ "--s": 0.34 } as React.CSSProperties}
              pathLength={1} d={d} fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.6" />
          ))}
          {narrowRuns(sky.sun.points, (p) => p.alt < 0).map((d, i) => (
            <path key={`nsb${i}`} className="pan-fade" style={{ "--s": 0.2, "--o": 0.3 } as React.CSSProperties}
              d={d} fill="none" stroke="var(--ox, #e0b768)" strokeWidth="1" strokeDasharray="3 5" />
          ))}
          {narrowRuns(sky.sun.points, (p) => p.alt >= 0).map((d, i) => (
            <path key={`nsa${i}`} className="pan-draw" style={{ "--s": 0.24 } as React.CSSProperties}
              pathLength={1} d={d} fill="none" stroke="var(--ox, #e0b768)" strokeWidth="2.1" opacity="0.92" />
          ))}
          {narrowRuns(sky.sun.points, (p) => p.alt >= 0 && p.alt < 6).map((d, i) => (
            <path key={`ng${i}`} className="pan-fade" style={{ "--s": 0.3, "--o": 1 } as React.CSSProperties}
              d={d} fill="none" stroke="var(--ox, #e0b768)" strokeWidth="3" strokeLinecap="round" />
          ))}
        </>
      )}

      {/* the ground */}
      <line
        className="pan-draw"
        style={{ "--s": 0 } as React.CSSProperties}
        pathLength={1}
        x1={NARROW_MX}
        y1={NARROW_HOR}
        x2={NARROW_W - NARROW_MX}
        y2={NARROW_HOR}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {[
        [90, "E"],
        [180, "S"],
        [270, "W"],
      ].map(([az, l], i) => (
        <g key={`nc${i}`} className="pan-fade" style={{ "--s": 0.1 + i * 0.02, "--o": 0.6 } as React.CSSProperties}>
          <line x1={nX(az as number)} y1={NARROW_HOR} x2={nX(az as number)} y2={NARROW_HOR + 8} stroke="currentColor" strokeWidth="0.9" />
          <text className="pan-numeral" x={nX(az as number)} y={NARROW_HOR + 24} textAnchor="middle" fontSize="12" letterSpacing="1.5" fill="currentColor" paintOrder="stroke" stroke="var(--paper, #10134d)" strokeWidth="3" strokeLinejoin="round">
            {l as string}
          </text>
        </g>
      ))}

      {/* the two bodies, where they stand */}
      {sky && sky.sun.now.alt > -14 && nIn(sky.sun.now.az) && (
        <g className="pan-fade" style={{ "--s": 0.5, "--o": 1 } as React.CSSProperties}>
          <circle className="pan-bloom" cx={nX(sky.sun.now.az)} cy={nY(sky.sun.now.alt)} r="30" fill="url(#pann-glow)" />
          <circle cx={nX(sky.sun.now.az)} cy={nY(sky.sun.now.alt)} r="11" fill="url(#pann-face)" />
          <circle cx={nX(sky.sun.now.az)} cy={nY(sky.sun.now.alt)} r="11" fill="none" stroke="var(--ox, #e0b768)" strokeWidth="1.2" />
        </g>
      )}
      {sky && sky.moon.now.alt > -14 && nIn(sky.moon.now.az) && (
        <g className="pan-fade" style={{ "--s": 0.54, "--o": 1 } as React.CSSProperties}>
          <circle cx={nX(sky.moon.now.az)} cy={nY(sky.moon.now.alt)} r="10" fill="#10134d" />
          <path d={moonPath(nX(sky.moon.now.az), nY(sky.moon.now.alt), 10, sky.moonFraction, sky.moonWaxing)} fill="#e8e9ff" />
          <circle cx={nX(sky.moon.now.az)} cy={nY(sky.moon.now.alt)} r="10" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.85" />
        </g>
      )}

      {/* the head */}
      <text
        className="pan-fade pan-numeral"
        style={{ "--s": 0.6, "--o": 0.86 } as React.CSSProperties}
        x={NARROW_W / 2}
        y={38}
        textAnchor="middle"
        fontSize="11"
        letterSpacing="2.6"
        fill="var(--ox, #e0b768)"
      >
        {sky ? `THE SKY OVER ${latLabel(sky.latitude)}` : "THE SKY"}
      </text>

      {/* the foot: the ledger collapsed to the hour you are in */}
      {sky && (
        <g className="pl pl-fore">
          <line
            className="pan-fade"
            style={{ "--s": 0.62, "--o": 0.24 } as React.CSSProperties}
            x1={NARROW_MX}
            y1={NARROW_HOR + 60}
            x2={NARROW_W - NARROW_MX}
            y2={NARROW_HOR + 60}
            stroke="currentColor"
            strokeWidth="0.5"
          />
          {[
            sky.sun.rise !== null && sky.sun.set !== null
              ? { k: "☉", v: `${hhmm(sky.sun.rise)} → ${hhmm(sky.sun.set)}` }
              : { k: "☉", v: "—" },
            { k: "☽", v: `${Math.round(sky.moonFraction * 100)}% ${sky.moonWaxing ? "waxing" : "waning"}` },
            hour ? { k: "HOUR", v: `${hour.glyph} ${hour.name}` } : { k: "HOUR", v: "—" },
          ].map((row, i) => (
            <text
              key={`nf${i}`}
              className="pan-fade pan-numeral"
              style={{ "--s": 0.66 + i * 0.02, "--o": 0.84 } as React.CSSProperties}
              x={NARROW_MX}
              y={NARROW_HOR + 84 + i * 22}
              fontSize="12.5"
              letterSpacing="1"
              fill="currentColor"
            >
              <tspan fill="var(--ox, #e0b768)">{row.k}</tspan>
              <tspan dx="9">{row.v}</tspan>
            </text>
          ))}
          <text
            className="pan-fade pan-numeral"
            style={{ "--s": 0.72, "--o": 0.6 } as React.CSSProperties}
            x={NARROW_W - NARROW_MX}
            y={NARROW_HOR + 84}
            textAnchor="end"
            fontSize="12.5"
            fill="currentColor"
          >
            {today ? today.editionNo : ""}
          </text>
        </g>
      )}
    </svg>
  );
}

/**
 * DayPanorama — "Fig. 0": the sky over the reader, drawn as it stands.
 *
 * This is a real chart, not a stylised one. The horizontal axis is
 * azimuth and the vertical is altitude, so the sun's arc is the arc the
 * sun actually makes today at this latitude — flat and southerly in
 * December, tall and long in June — and the moon's crosses it at its own
 * height and its own hour. An ellipse cannot fake either.
 *
 * The wheel further up this page answers WHERE the bodies are, along the
 * ecliptic. This answers WHEN: rise, culmination, set, the three dusks,
 * and the twenty-four unequal hours the old almanacs ruled the day into.
 *
 * Everything is computed on the client from the reader's own clock (see
 * lib/diurnal), which is also why the server renders only the empty
 * plate: the sky arrives on hydration, and nothing can mismatch.
 */
function DayPanorama({ today, caption }: { today: AlmanacToday | null; caption: string }) {
  const ref = useRef<HTMLElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const ghostTimeRef = useRef<SVGTextElement>(null);
  const trackRef = useRef<SkyPoint[]>([]);
  const hoursRef = useRef<PlanetaryHour[]>([]);
  const ledgerRef = useRef<SVGGElement>(null);

  const [sky, setSky] = useState<SkyPlate | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [lat, setLat] = useState(PLATE_LATITUDE);
  const [editingLat, setEditingLat] = useState(false);
  const [since, setSince] = useState<string | null>(null);
  const firstTick = useRef(true);

  // The reader's own latitude, kept in the browser and nowhere else.
  useEffect(() => {
    try {
      const v = parseFloat(localStorage.getItem("oa-lat") ?? "");
      if (Number.isFinite(v) && v >= 23 && v <= 66) setLat(v);
    } catch {}
  }, []);

  const commitLat = (raw: string) => {
    setEditingLat(false);
    const v = Math.max(23, Math.min(66, parseFloat(raw)));
    if (!Number.isFinite(v)) return;
    setLat(v);
    try {
      localStorage.setItem("oa-lat", String(v));
    } catch {}
  };

  // A phone gets the compact plate. Decided after mount so the server
  // and the first client render agree.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // The sky is a function of the reader's clock, so it belongs to the
  // client alone. Re-reckoned every half minute — the sun moves about
  // an eighth of a degree in that time, which is under one plate unit.
  useEffect(() => {
    const tick = () => {
      const plate = buildSkyPlate(new Date(), lat);
      setSky(plate);

      // What moved while the reader was away — measured, not guessed.
      // One line, once per visit, only after a real absence.
      if (firstTick.current) {
        firstTick.current = false;
        try {
          const raw = localStorage.getItem("oa-fig0-visit");
          if (raw) {
            const v = JSON.parse(raw) as { t: number; dayLength: number; moonFraction: number };
            const away = (Date.now() - v.t) / 3600000;
            if (away > 20 && Number.isFinite(v.dayLength)) {
              const dd = plate.dayLength - v.dayLength;
              const dm = plate.moonFraction - v.moonFraction;
              const parts: string[] = [];
              const mins = Math.round(Math.abs(dd) * 60);
              if (mins >= 2) parts.push(`the day has ${dd < 0 ? "shrunk" : "grown"} ${mins}m`);
              if (Math.abs(dm) >= 0.06)
                parts.push(`the moon has ${dm > 0 ? "filled" : "emptied"} by ${Math.round(Math.abs(dm) * 100)}%`);
              if (parts.length) setSince(`since you last looked — ${parts.join("; ")}`);
            }
          }
          localStorage.setItem(
            "oa-fig0-visit",
            JSON.stringify({ t: Date.now(), dayLength: plate.dayLength, moonFraction: plate.moonFraction })
          );
        } catch {}
      }
    };
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, [lat]);

  useEffect(() => {
    trackRef.current = sky ? sky.sun.points : [];
    hoursRef.current = sky ? sky.hours : [];
  }, [sky]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) el.style.setProperty("--p", "1");

    let raf = 0;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;
    let ghostAz = -1;
    let litHour = -1;

    const svg = el.querySelector("svg");

    // Geometry is MEASURED, never read per frame: a getBoundingClientRect
    // inside rAF forces layout every tick and fights the compositor while
    // the reader scrolls. We take the plate's document-space top once and
    // derive its screen position from scrollY, which costs nothing.
    let docTop = 0;
    let elH = 1;
    let svgRect: DOMRect | null = null;
    const measure = () => {
      const r = el.getBoundingClientRect();
      docTop = r.top + window.scrollY;
      elH = r.height || 1;
      svgRect = svg ? svg.getBoundingClientRect() : null;
    };

    const onMove = (e: PointerEvent) => {
      const top = docTop - window.scrollY;
      tx = ((e.clientX - (svgRect?.left ?? 0)) / (svgRect?.width || 1)) * 2 - 1;
      ty = ((e.clientY - top) / elH) * 2 - 1;
      if (svgRect) {
        const vx = ((e.clientX - svgRect.left) / svgRect.width) * PLATE_W;
        const vy = ((e.clientY - svgRect.top) / svgRect.height) * PLATE_H;
        // Only the vault answers to the hand; the ledger below does not.
        ghostAz = vy < HORIZON_Y + 20 && vx > MARGIN_X && vx < PLATE_W - MARGIN_X
          ? AZ_MIN + ((vx - MARGIN_X) / (PLATE_W - 2 * MARGIN_X)) * (AZ_MAX - AZ_MIN)
          : -1;
      }
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      ghostAz = -1;
    };

    let pCur = 0;
    let pWritten = -1;
    let running = false;

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);

      const top = docTop - window.scrollY;
      const vh = window.innerHeight || 1;
      // The plate draws itself across the span where it is entering the
      // viewport, and holds once it has arrived.
      const raw = 1 - (top - vh * 0.1) / (vh * 0.72);
      const pTarget = reduce ? 1 : Math.min(1, Math.max(0, raw));
      // Reduced motion gets the finished plate, not a gentler build.
      pCur = reduce ? 1 : pCur + (pTarget - pCur) * 0.16;
      const rounded = Math.round(pCur * 1000) / 1000;
      if (rounded !== pWritten) {
        el.style.setProperty("--p", String(rounded));
        pWritten = rounded;
      }

      if (fine && !reduce) {
        px += (tx - px) * 0.08;
        py += (ty - py) * 0.08;
        el.style.setProperty("--px", px.toFixed(3));
        el.style.setProperty("--py", py.toFixed(3));

        // The ghost: the sun's own station at the azimuth under the hand,
        // and the hour at which it stands there.
        const g = ghostRef.current;
        const t = ghostTimeRef.current;
        const pts = trackRef.current;
        if (g && t) {
          let best: SkyPoint | null = null;
          if (ghostAz >= 0 && pts.length) {
            let bestD = Infinity;
            for (const p of pts) {
              if (p.alt < -2) continue;
              const d = Math.abs(p.az - ghostAz);
              if (d < bestD) {
                bestD = d;
                best = p;
              }
            }
            if (bestD > 6) best = null;
          }
          const lit = best ? currentHourIndex(hoursRef.current, best.h) : -1;
          if (lit !== litHour) {
            const led = ledgerRef.current;
            if (led) {
              const cells = led.querySelectorAll<SVGRectElement>("[data-cell]");
              if (litHour >= 0 && cells[litHour]) cells[litHour].removeAttribute("data-lit");
              if (lit >= 0 && cells[lit]) cells[lit].setAttribute("data-lit", "");
            }
            litHour = lit;
          }
          if (best) {
            g.setAttribute(
              "transform",
              `translate(${plateX(best.az).toFixed(1)}, ${plateY(best.alt).toFixed(1)})`
            );
            g.style.opacity = "1";
            const mins = Math.round(best.h * 60);
            t.textContent = `☉ ${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(
              mins % 60
            ).padStart(2, "0")} · ${best.alt.toFixed(0)}°`;
          } else {
            g.style.opacity = "0";
          }
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      el.classList.add("is-live");
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      el.classList.remove("is-live");
      cancelAnimationFrame(raf);
    };

    measure();
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: "200px 0px" }
    );
    io.observe(el);

    const onResize = () => measure();
    const onVis = () => (document.hidden ? stop() : measure());
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    if (fine && !reduce) {
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerleave", onLeave, { passive: true });
    }

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("visibilitychange", onVis);
      if (fine && !reduce) {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      }
    };
  }, []);

  const isNight = sky ? !sky.sun.up : false;
  const altNow = sky ? sky.sun.now.alt : 20;
  // The whole catalogue, stood over the reader's own horizon.
  const placed = React.useMemo(() => (sky ? placeSky(sky) : []), [sky]);
  const moodCls = [
    "panorama",
    isNight ? "is-night" : "",
    sky && altNow < 8 && altNow >= 0 ? "is-golden" : "",
    sky && altNow < 0 && altNow >= -12 ? "is-dusk" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={ref} className={moodCls} aria-label={caption}>
      {narrow ? (
        <NarrowPlate sky={sky} today={today} placed={placed} />
      ) : (
      <svg viewBox={`0 0 ${PLATE_W} ${PLATE_H}`} className="panorama-svg" aria-hidden="true">
        <defs>
          <radialGradient id="pan-orb-face" cx="38%" cy="34%" r="76%">
            <stop offset="0%" stopColor="#fff6e2" stopOpacity="0.96" />
            <stop offset="46%" stopColor="var(--ox, #e0b768)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--ox, #e0b768)" stopOpacity="0.16" />
          </radialGradient>
          <radialGradient id="pan-orb-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--ox, #e0b768)" stopOpacity="0.3" />
            <stop offset="52%" stopColor="var(--ox, #e0b768)" stopOpacity="0.075" />
            <stop offset="100%" stopColor="var(--ox, #e0b768)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="pan-moon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e2e5ff" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#b7bce9" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#b7bce9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pan-vault" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#20279b" stopOpacity="0" />
            <stop offset="64%" stopColor="#20279b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8d97ff" stopOpacity="0.17" />
          </linearGradient>
          {/* engraver's ground: vertical strokes fading with depth */}
          <pattern id="pan-ground" width="13" height="26" patternUnits="userSpaceOnUse">
            <line x1="6.5" y1="1" x2="6.5" y2="8" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          {/* fine lateral shading for the twilight strata */}
          <pattern id="pan-strata" width="8" height="7" patternUnits="userSpaceOnUse">
            <line x1="0" y1="3.5" x2="8" y2="3.5" stroke="#e2e5ff" strokeWidth="0.3" />
          </pattern>
          <linearGradient id="pan-mood-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ox, #e0b768)" stopOpacity="0" />
            <stop offset="55%" stopColor="var(--ox, #e0b768)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--ox, #e0b768)" stopOpacity="0.5" />
          </linearGradient>
          <radialGradient id="pan-scrim" cx="50%" cy="52%" r="62%">
            <stop offset="0%" stopColor="#0a0d38" stopOpacity="0.6" />
            <stop offset="58%" stopColor="#0a0d38" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#0a0d38" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pan-edgefade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="9%" stopColor="#ffffff" />
            <stop offset="91%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <mask id="pan-softedge">
            <rect
              x={MARGIN_X}
              y={FRAME_TOP}
              width={PLATE_W - 2 * MARGIN_X}
              height={FRAME_BOTTOM - FRAME_TOP}
              fill="url(#pan-edgefade)"
            />
          </mask>
          <clipPath id="pan-field">
            <rect
              x={MARGIN_X}
              y={FRAME_TOP}
              width={PLATE_W - 2 * MARGIN_X}
              height={FRAME_BOTTOM - FRAME_TOP}
            />
          </clipPath>
        </defs>

        {/* ══ REGISTER 0 — the plate ══ */}
        <g className="pl pl-far" mask="url(#pan-softedge)">
          <rect
            className="pan-fade"
            style={{ "--s": 0, "--o": 1 } as React.CSSProperties}
            x={MARGIN_X - 40}
            y={FRAME_TOP - 20}
            width={PLATE_W - 2 * MARGIN_X + 80}
            height={COLOPHON_Y - FRAME_TOP + 40}
            fill="url(#pan-scrim)"
          />
          <rect
            className="pan-mood"
            x={MARGIN_X}
            y={FRAME_TOP}
            width={PLATE_W - 2 * MARGIN_X}
            height={HORIZON_Y - FRAME_TOP}
            fill="url(#pan-mood-grad)"
          />
          <rect
            className="pan-fade"
            style={{ "--s": 0.18, "--o": 1 } as React.CSSProperties}
            x={MARGIN_X}
            y={FRAME_TOP}
            width={PLATE_W - 2 * MARGIN_X}
            height={HORIZON_Y - FRAME_TOP}
            fill="url(#pan-vault)"
          />
          <rect
            className="pan-fade"
            style={{ "--s": 0.2, "--o": 1 } as React.CSSProperties}
            x={MARGIN_X}
            y={HORIZON_Y}
            width={PLATE_W - 2 * MARGIN_X}
            height={FRAME_BOTTOM - HORIZON_Y}
            fill="#0a0d38"
            opacity="0.3"
          />

          {/* the engraver's ground: a band of vertical strokes hanging
              from the horizon, the way every plate has shaded its earth */}
          <rect
            className="pan-fade"
            style={{ "--s": 0.1, "--o": 0.4 } as React.CSSProperties}
            x={MARGIN_X}
            y={HORIZON_Y + 3}
            width={PLATE_W - 2 * MARGIN_X}
            height={26}
            fill="url(#pan-ground)"
          />

          {/* the three dusks, as strata — the sun's depth below the
              ground is what actually divides them */}
          {sky &&
            TWILIGHT_TINTS.map(([depthA, depthB, tint], i) => (
              <rect
                key={`tw${i}`}
                className="pan-fade"
                style={{ "--s": 0.16 + i * 0.02, "--o": tint } as React.CSSProperties}
                x={MARGIN_X}
                y={plateY(-depthA)}
                width={PLATE_W - 2 * MARGIN_X}
                height={plateY(-depthB) - plateY(-depthA)}
                fill="#20279b"
              />
            ))}
          {sky &&
            TWILIGHT_TINTS.map(([depthA, depthB], i) => (
              <rect
                key={`tws${i}`}
                className="pan-fade"
                style={{ "--s": 0.18 + i * 0.02, "--o": 0.05 } as React.CSSProperties}
                x={MARGIN_X}
                y={plateY(-depthA)}
                width={PLATE_W - 2 * MARGIN_X}
                height={plateY(-depthB) - plateY(-depthA)}
                fill="url(#pan-strata)"
              />
            ))}

        </g>

        <g className="pl pl-far">
          {/* the dusks, ruled and named at their own depth */}
          {sky &&
            TWILIGHT_TINTS.map(([, depth], i) => (
              <g
                key={`twl${i}`}
                className="pan-fade"
                style={{ "--s": 0.2 + i * 0.02, "--o": 0.44 } as React.CSSProperties}
              >
                <line
                  x1={MARGIN_X}
                  y1={plateY(-depth)}
                  x2={PLATE_W - MARGIN_X}
                  y2={plateY(-depth)}
                  stroke="currentColor"
                  strokeWidth="0.4"
                  strokeDasharray="1 5"
                />
                <text
                  className="pan-numeral"
                  x={PLATE_W - MARGIN_X - 6}
                  y={plateY(-depth) + 10}
                  textAnchor="end"
                  fontSize="7.5"
                  letterSpacing="1.8"
                  fill="currentColor"
                  paintOrder="stroke"
                  stroke="var(--paper, #10134d)"
                  strokeWidth="2.6"
                  strokeLinejoin="round"
                >
                  {TWILIGHT_NAMES[i]} −{depth}°
                </text>
              </g>
            ))}

          {/* ══ REGISTER 1 — the altitude graticule ══ */}
          {ALTITUDES.map((a, i) => (
            <g key={`alt${a}`} className="pan-fade" style={{ "--s": 0.06 + i * 0.01, "--o": a === 0 ? 0 : 0.24 } as React.CSSProperties}>
              <line
                x1={MARGIN_X}
                y1={plateY(a)}
                x2={PLATE_W - MARGIN_X}
                y2={plateY(a)}
                stroke="currentColor"
                strokeWidth="0.4"
                strokeDasharray={a % 30 === 0 ? undefined : "2 6"}
              />
            </g>
          ))}
          {ALTITUDES.filter((a) => a > 0).map((a, i) => (
            <text
              key={`altl${a}`}
              className="pan-fade pan-numeral"
              style={{ "--s": 0.08 + i * 0.01, "--o": 0.42 } as React.CSSProperties}
              x={MARGIN_X - 8}
              y={plateY(a) + 3}
              textAnchor="end"
              fontSize="9"
              fill="currentColor"
            >
              {a}°
            </text>
          ))}

          {/* ══ REGISTER 2 — azimuth along the ground ══ */}
          {AZ_TICKS.map(({ az, label }, i) => (
            <g
              key={`az${az}`}
              className="pan-fade"
              style={{ "--s": 0.1 + i * 0.006, "--o": label ? 0.5 : 0.24 } as React.CSSProperties}
            >
              <line
                x1={plateX(az)}
                y1={HORIZON_Y}
                x2={plateX(az)}
                y2={HORIZON_Y + (label ? 10 : 5)}
                stroke="currentColor"
                strokeWidth={label ? 0.8 : 0.45}
              />
              {label && (
                <text
                  className="pan-numeral"
                  x={plateX(az)}
                  y={HORIZON_Y + 23}
                  textAnchor="middle"
                  fontSize="9.5"
                  letterSpacing="1.6"
                  fill="currentColor"
                  paintOrder="stroke"
                  stroke="var(--paper, #10134d)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                >
                  {label}
                </text>
              )}
            </g>
          ))}
        </g>

        {/* corner marks — the engraver's claim on the field, no box */}
        <g className="pl pl-far">
          {[
            [MARGIN_X, FRAME_TOP + 26, 1, 1],
            [PLATE_W - MARGIN_X, FRAME_TOP + 26, -1, 1],
            [MARGIN_X, COLOPHON_Y - 24, 1, -1],
            [PLATE_W - MARGIN_X, COLOPHON_Y - 24, -1, -1],
          ].map(([x, y, dx, dy], i) => (
            <g key={`cm${i}`} className="pan-fade" style={{ "--s": 0.04 + i * 0.015, "--o": 0.4 } as React.CSSProperties}>
              <path
                d={`M ${x + dx * 16} ${y} L ${x} ${y} L ${x} ${y + dy * 16}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.9"
              />
              <path
                d={`M ${x + dx * 10} ${y + dy * 3.5} L ${x + dx * 3.5} ${y + dy * 3.5} L ${x + dx * 3.5} ${y + dy * 10}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.4"
              />
            </g>
          ))}
        </g>

        {/* ══ REGISTER 3 — the head, and the line of culmination ══ */}
        <g className="pl pl-far">
          <line
            className="pan-fade"
            style={{ "--s": 0.12, "--o": 0.26 } as React.CSSProperties}
            x1={plateX(180)}
            y1={FRAME_TOP + 26}
            x2={plateX(180)}
            y2={HORIZON_Y}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="1 6"
          />
          <text
            className="pan-fade pan-numeral"
            style={{ "--s": 0.14, "--o": 0.38 } as React.CSSProperties}
            x={plateX(180) + 5}
            y={FRAME_TOP + 40}
            fontSize="7.5"
            letterSpacing="2.4"
            fill="currentColor"
            transform={`rotate(90 ${plateX(180) + 5} ${FRAME_TOP + 40})`}
          >
            MERIDIAN
          </text>

          {/* ── THE CARTOUCHE ──
              The title carried the way a plate carries its name: display
              serif between double rules, diamond finials, and the two
              bodies engraved small at the rule ends. */}
          {[
            [MARGIN_X + 36, 364],
            [836, PLATE_W - MARGIN_X - 36],
          ].map(([xa, xb], i) => (
            <g key={`tr${i}`} className="pan-fade" style={{ "--s": 0.08 + i * 0.02, "--o": 0.55 } as React.CSSProperties}>
              <line x1={xa} y1={FRAME_TOP + 4} x2={xb} y2={FRAME_TOP + 4} stroke="var(--ox, #e0b768)" strokeWidth="0.8" />
              <line x1={xa} y1={FRAME_TOP + 8.5} x2={xb} y2={FRAME_TOP + 8.5} stroke="var(--ox, #e0b768)" strokeWidth="0.35" />
              <path
                d={`M ${i === 0 ? xb + 10 : xa - 10} ${FRAME_TOP + 6.2} l 4.5 -4.5 l 4.5 4.5 l -4.5 4.5 Z`}
                transform={i === 0 ? undefined : `translate(${-9} 0)`}
                fill="var(--ox, #e0b768)"
                opacity="0.85"
              />
            </g>
          ))}
          {/* the sun engraved at the west end of the rule, the moon at the east */}
          <g className="pan-fade" style={{ "--s": 0.12, "--o": 0.6 } as React.CSSProperties}>
            <circle cx={MARGIN_X + 14} cy={FRAME_TOP + 6.2} r="5" fill="none" stroke="var(--ox, #e0b768)" strokeWidth="0.7" />
            <circle cx={MARGIN_X + 14} cy={FRAME_TOP + 6.2} r="1.4" fill="var(--ox, #e0b768)" />
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i * Math.PI) / 4;
              return (
                <line
                  key={i}
                  x1={r1(MARGIN_X + 14 + 6.6 * Math.sin(a))}
                  y1={r1(FRAME_TOP + 6.2 - 6.6 * Math.cos(a))}
                  x2={r1(MARGIN_X + 14 + 9 * Math.sin(a))}
                  y2={r1(FRAME_TOP + 6.2 - 9 * Math.cos(a))}
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="0.5"
                />
              );
            })}
            <path
              d={`M ${PLATE_W - MARGIN_X - 10} ${FRAME_TOP - 0.8} a 7 7 0 1 0 0 14 a 5.6 5.6 0 1 1 0 -14 Z`}
              fill="var(--ox, #e0b768)"
              opacity="0.75"
            />
          </g>
          <text
            className="pan-fade pan-title"
            style={{ "--s": 0.6, "--o": 0.92 } as React.CSSProperties}
            x={600}
            y={FRAME_TOP + 11}
            textAnchor="middle"
            fontSize="16.5"
            letterSpacing="4.2"
            fill="var(--ox, #e0b768)"
          >
            {sky ? `THE SUN AND MOON OVER ${latLabel(sky.latitude)}` : "THE SUN AND MOON"}
          </text>

          {/* marginalia */}
          <text
            className="pan-fade"
            style={{ "--s": 0.7, "--o": 0.34 } as React.CSSProperties}
            x={MARGIN_X - 26}
            y={HORIZON_Y - 130}
            textAnchor="middle"
            fontSize="14"
            fontStyle="italic"
            fontFamily="var(--font-heading, 'Cormorant Garamond'), serif"
            fill="currentColor"
            transform={`rotate(-90 ${MARGIN_X - 26} ${HORIZON_Y - 130})`}
          >
            Altitude
          </text>
          <text
            className="pan-fade"
            style={{ "--s": 0.72, "--o": 0.34 } as React.CSSProperties}
            x={600}
            y={HORIZON_Y + 40}
            textAnchor="middle"
            fontSize="14"
            fontStyle="italic"
            fontFamily="var(--font-heading, 'Cormorant Garamond'), serif"
            fill="currentColor"
          >
            Azimuth
          </text>
        </g>

        {/* ══ THE SKY ══ */}
        <g className="pl pl-sky" clipPath="url(#pan-field)">
          {sky && (
            <>
              {/* the moon's road — drawn under the sun's, it is the
                  quieter of the two and must not fight it */}
              {runs(sky.moon.points, (p) => p.alt < 0).map((d, i) => (
                <path
                  key={`mb${i}`}
                  className="pan-fade"
                  style={{ "--s": 0.4, "--o": 0.18 } as React.CSSProperties}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  strokeDasharray="3 5"
                />
              ))}
              {runs(sky.moon.points, (p) => p.alt >= 0).map((d, i) => (
                <path
                  key={`ma${i}`}
                  className="pan-draw"
                  style={{ "--s": 0.42 } as React.CSSProperties}
                  pathLength={1}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  opacity="0.62"
                />
              ))}

              {/* the moon's road glows faintly, cold */}
              {runs(sky.moon.points, (p) => p.alt >= 0).map((d, i) => (
                <path
                  key={`mg${i}`}
                  className="pan-fade"
                  style={{ "--s": 0.44, "--o": 0.07 } as React.CSSProperties}
                  d={d}
                  fill="none"
                  stroke="#dfe3ff"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
              ))}

              {/* the sun's road */}
              {runs(sky.sun.points, (p) => p.alt < 0).map((d, i) => (
                <path
                  key={`sb${i}`}
                  className="pan-fade"
                  style={{ "--s": 0.22, "--o": 0.3 } as React.CSSProperties}
                  d={d}
                  fill="none"
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="0.8"
                  strokeDasharray="3 5"
                />
              ))}
              {runs(sky.sun.points, (p) => p.alt >= 0).map((d, i) => (
                <path
                  key={`sw${i}`}
                  className="pan-fade"
                  style={{ "--s": 0.28, "--o": 0.09 } as React.CSSProperties}
                  d={d}
                  fill="none"
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              ))}
              {runs(sky.sun.points, (p) => p.alt >= 0).map((d, i) => (
                <path
                  key={`sa${i}`}
                  className="pan-draw"
                  style={{ "--s": 0.26 } as React.CSSProperties}
                  pathLength={1}
                  d={d}
                  fill="none"
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="1.7"
                  opacity="0.9"
                />
              ))}

              {/* The golden hour, said with weight: the road thickens and
                  glows where the sun rides its last six degrees. Same
                  gilt — the plate keeps its one accent. */}
              {runs(sky.sun.points, (p) => p.alt >= 0 && p.alt < 6).map((d, i) => (
                <g key={`gh${i}`}>
                  <path
                    className="pan-fade"
                    style={{ "--s": 0.34, "--o": 0.22 } as React.CSSProperties}
                    d={d}
                    fill="none"
                    stroke="var(--ox, #e0b768)"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <path
                    className="pan-fade"
                    style={{ "--s": 0.34, "--o": 1 } as React.CSSProperties}
                    d={d}
                    fill="none"
                    stroke="var(--ox, #e0b768)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* The day's own maximum, printed under the apex. */}
              {(() => {
                const ap = sky.sun.points.reduce(
                  (b, p) => (Math.abs(p.h - sky.sun.transit) < Math.abs(b.h - sky.sun.transit) ? p : b),
                  sky.sun.points[0]
                );
                if (ap.alt < 5 || !inWindow(ap.az)) return null;
                return (
                  <text
                    className="pan-fade pan-numeral"
                    style={{ "--s": 0.5, "--o": 0.55 } as React.CSSProperties}
                    x={plateX(ap.az)}
                    y={plateY(ap.alt) + 17}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--ox, #e0b768)"
                    paintOrder="stroke"
                    stroke="var(--paper, #10134d)"
                    strokeWidth="2.8"
                    strokeLinejoin="round"
                  >
                    {Math.round(sky.sun.maxAltitude)}°
                  </text>
                );
              })()}

              {/* every hour the sun is up, struck on its own road */}
              {hourStations(sky.sun).map(({ h, x, y, nx, ny }, i) => {
                const major = h % 2 === 0;
                return (
                  <g
                    key={`sh${h}`}
                    className="pan-fade"
                    style={{
                      "--s": 0.32 + i * 0.008,
                      "--o": h <= sky.nowHour ? 0.9 : 0.44,
                    } as React.CSSProperties}
                  >
                    <line
                      x1={x}
                      y1={y}
                      x2={x + nx * (major ? 9 : 5)}
                      y2={y + ny * (major ? 9 : 5)}
                      stroke="var(--ox, #e0b768)"
                      strokeWidth={major ? 0.9 : 0.5}
                    />
                    {major && (
                      <text
                        className="pan-numeral"
                        x={x + nx * 20}
                        y={y + ny * 20 + 3.5}
                        textAnchor="middle"
                        fontSize="10.5"
                        fill="var(--ox, #e0b768)"
                        paintOrder="stroke"
                        stroke="var(--paper, #10134d)"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      >
                        {roman(h)}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* the moon's hours, every third, kept quiet */}
              {hourStations(sky.moon, 3).map(({ h, x, y, nx, ny }, i) => (
                <g
                  key={`mh${h}`}
                  className="pan-fade"
                  style={{ "--s": 0.46 + i * 0.01, "--o": 0.42 } as React.CSSProperties}
                >
                  <line x1={x} y1={y} x2={x + nx * 6} y2={y + ny * 6} stroke="currentColor" strokeWidth="0.6" />
                  <text
                    className="pan-numeral"
                    x={x + nx * 16}
                    y={y + ny * 16 + 3}
                    textAnchor="middle"
                    fontSize="8.5"
                    fill="currentColor"
                    paintOrder="stroke"
                    stroke="var(--paper, #10134d)"
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                  >
                    {roman(h)}
                  </text>
                </g>
              ))}

              {/* ── THE REAL SKY ──
                  The stars actually standing over the reader at this
                  minute, joined into their figures. The vault is a
                  planetarium print of tonight, not decoration. */}
              <g className="pan-realsky" aria-hidden>
                {constellationSegs(placed, plateX, plateY, inWindow).map((c) => (
                  <path
                    key={c.name}
                    className="pan-fade"
                    style={{ "--s": 0.74, "--o": 0.2 } as React.CSSProperties}
                    d={c.d}
                    fill="none"
                    stroke="var(--lg-peri, #b7bce9)"
                    strokeWidth="0.5"
                  />
                ))}
                {placed
                  .filter((st) => st.alt > 2 && st.mag <= 3.4 && inWindow(st.az))
                  .map((st, i) => (
                    <circle
                      key={st.idx}
                      className={`pan-fade pan-star pan-star-${i % 3}`}
                      style={{ "--s": 0.76 + (i % 6) * 0.008, "--o": starO(st.mag, st.alt) } as React.CSSProperties}
                      cx={plateX(st.az)}
                      cy={plateY(st.alt)}
                      r={starR(st.mag)}
                      fill="#e8e9ff"
                    />
                  ))}
                {constellationLabels(placed, inWindow).map((c) => (
                  <text
                    key={c.name}
                    className="pan-fade"
                    style={{ "--s": 0.82, "--o": 0.3 } as React.CSSProperties}
                    x={plateX(c.az)}
                    y={plateY(c.alt) - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontStyle="italic"
                    fontFamily="var(--font-heading, 'Cormorant Garamond'), serif"
                    letterSpacing="0.12em"
                    fill="var(--lg-peri, #b7bce9)"
                    paintOrder="stroke"
                    stroke="var(--paper, #10134d)"
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                  >
                    {c.name}
                  </text>
                ))}
              </g>
            </>
          )}

          {/* The ghost: the sun's station at the azimuth under the hand. */}
          <g ref={ghostRef} className="pan-ghost" style={{ opacity: 0 }}>
            <circle r="9" fill="none" stroke="var(--ox, #e0b768)" strokeWidth="0.9" strokeDasharray="2 3" />
            <circle r="2" fill="var(--ox, #e0b768)" opacity="0.7" />
            <line y1="-13" y2="-21" stroke="var(--ox, #e0b768)" strokeWidth="0.6" opacity="0.6" />
            <text
              ref={ghostTimeRef}
              y="-27"
              textAnchor="middle"
              fontSize="10.5"
              fontFamily="var(--font-mono, monospace)"
              fill="var(--ox, #e0b768)"
              paintOrder="stroke"
              stroke="var(--paper, #10134d)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </g>
        </g>

        {/* ══ REGISTER 3 — the horizon, and the stations on it ══ */}
        <g className="pl pl-far">
          <line
            className="pan-fade"
            style={{ "--s": 0.05, "--o": 0.1 } as React.CSSProperties}
            x1={MARGIN_X}
            y1={HORIZON_Y}
            x2={PLATE_W - MARGIN_X}
            y2={HORIZON_Y}
            stroke="#f2ece0"
            strokeWidth="5"
          />
          <line
            className="pan-draw"
            style={{ "--s": 0 } as React.CSSProperties}
            pathLength={1}
            x1={MARGIN_X}
            y1={HORIZON_Y}
            x2={PLATE_W - MARGIN_X}
            y2={HORIZON_Y}
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {sky &&
            stations(sky).map((st, i) => (
              <g
                key={`st${i}`}
                className="pan-fade"
                style={{ "--s": 0.52 + i * 0.02, "--o": 0.72 } as React.CSSProperties}
              >
                <path
                  d={`M ${st.x - 4} ${HORIZON_Y} L ${st.x} ${HORIZON_Y - 5} L ${st.x + 4} ${HORIZON_Y} L ${st.x} ${HORIZON_Y + 5} Z`}
                  fill={st.gilt ? "var(--ox, #e0b768)" : "currentColor"}
                />
                <text
                  className="pan-numeral"
                  x={st.x}
                  y={HORIZON_Y - 12}
                  textAnchor="middle"
                  fontSize="9"
                  fill={st.gilt ? "var(--ox, #e0b768)" : "currentColor"}
                  paintOrder="stroke"
                  stroke="var(--paper, #10134d)"
                  strokeWidth="3"
                  strokeLinejoin="round"
                >
                  {st.label}
                </text>
              </g>
            ))}
        </g>

        {/* ══ REGISTER 4 — the riders, where they stand right now ══ */}
        {sky && (
          <g className="pl pl-sky" clipPath="url(#pan-field)">
            {sky.sun.now.alt <= -1 && sky.sun.now.alt > -10 && inWindow(sky.sun.now.az) && (
              <g className="pan-fade" style={{ "--s": 0.7, "--o": 0.55 } as React.CSSProperties}>
                <circle
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="24"
                  fill="url(#pan-orb-glow)"
                />
                <circle
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="10"
                  fill="none"
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
                <circle cx={plateX(sky.sun.now.az)} cy={plateY(sky.sun.now.alt)} r="2.5" fill="var(--ox, #e0b768)" opacity="0.7" />
              </g>
            )}
            {sky.sun.now.alt > -1 && inWindow(sky.sun.now.az) && (
              <g className="pan-fade pan-sun" style={{ "--s": 0.7, "--o": 1 } as React.CSSProperties}>
                <line
                  x1={plateX(sky.sun.now.az)}
                  y1={plateY(sky.sun.now.alt)}
                  x2={plateX(sky.sun.now.az)}
                  y2={HORIZON_Y}
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="0.5"
                  strokeDasharray="2 4"
                  opacity="0.4"
                />
                <circle
                  className="pan-bloom"
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="54"
                  fill="url(#pan-orb-glow)"
                />
                <g
                  className="pan-corona"
                  style={{
                    "--hx": `${plateX(sky.sun.now.az)}px`,
                    "--hy": `${plateY(sky.sun.now.alt)}px`,
                  } as React.CSSProperties}
                >
                  {Array.from({ length: 32 }, (_, i) => {
                    const a = (i * Math.PI) / 16;
                    const inner = 20;
                    const outer = i % 2 === 0 ? 31 : 25.5;
                    const cx = plateX(sky.sun.now.az);
                    const cy = plateY(sky.sun.now.alt);
                    return (
                      <line
                        key={i}
                        x1={r1(cx + inner * Math.sin(a))}
                        y1={r1(cy - inner * Math.cos(a))}
                        x2={r1(cx + outer * Math.sin(a))}
                        y2={r1(cy - outer * Math.cos(a))}
                        stroke="var(--ox, #e0b768)"
                        strokeWidth={i % 2 === 0 ? 0.8 : 0.5}
                        opacity={i % 2 === 0 ? 0.7 : 0.45}
                      />
                    );
                  })}
                </g>
                <circle
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="17"
                  fill="url(#pan-orb-face)"
                />
                <circle
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="17"
                  fill="none"
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="1.2"
                />
                <circle
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="14"
                  fill="none"
                  stroke="#f6e3b8"
                  strokeWidth="0.4"
                  opacity="0.65"
                />
                <circle
                  className="pan-halo"
                  cx={plateX(sky.sun.now.az)}
                  cy={plateY(sky.sun.now.alt)}
                  r="37"
                  fill="none"
                  stroke="var(--ox, #e0b768)"
                  strokeWidth="0.5"
                  strokeDasharray="1 5"
                  opacity="0.5"
                  style={{
                    "--hx": `${plateX(sky.sun.now.az)}px`,
                    "--hy": `${plateY(sky.sun.now.alt)}px`,
                  } as React.CSSProperties}
                />
              </g>
            )}

            {sky.moon.now.alt > -2 && inWindow(sky.moon.now.az) && (
              <g className="pan-fade pan-sun" style={{ "--s": 0.74, "--o": 1 } as React.CSSProperties}>
                <line
                  x1={plateX(sky.moon.now.az)}
                  y1={plateY(sky.moon.now.alt)}
                  x2={plateX(sky.moon.now.az)}
                  y2={HORIZON_Y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  strokeDasharray="2 4"
                  opacity="0.26"
                />
                <circle
                  className="pan-bloom"
                  cx={plateX(sky.moon.now.az)}
                  cy={plateY(sky.moon.now.alt)}
                  r="34"
                  fill="url(#pan-moon-glow)"
                />
                <circle
                  cx={plateX(sky.moon.now.az)}
                  cy={plateY(sky.moon.now.alt)}
                  r="13"
                  fill="#10134d"
                />
                <path
                  d={moonPath(
                    plateX(sky.moon.now.az),
                    plateY(sky.moon.now.alt),
                    13,
                    sky.moonFraction,
                    sky.moonWaxing
                  )}
                  fill="#e8e9ff"
                />
                <circle
                  cx={plateX(sky.moon.now.az)}
                  cy={plateY(sky.moon.now.alt)}
                  r="13.6"
                  fill="none"
                  stroke="#10134d"
                  strokeWidth="2.2"
                />
                <circle
                  cx={plateX(sky.moon.now.az)}
                  cy={plateY(sky.moon.now.alt)}
                  r="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.85"
                />
              </g>
            )}
          </g>
        )}

        {/* ══ REGISTER 5 — the twenty-four unequal hours ══ */}
        {sky && sky.hours.length > 0 && (
          <g className="pl pl-fore" ref={ledgerRef}>
            <text
              className="pan-fade pan-numeral"
              style={{ "--s": 0.56, "--o": 0.6 } as React.CSSProperties}
              x={MARGIN_X}
              y={LEDGER_Y - 9}
              fontSize="8.5"
              letterSpacing="2.2"
              fill="currentColor"
            >
              THE PLANETARY HOURS · UNEQUAL, FROM SUNRISE
            </text>
            {([
              [0, sky.sun.rise, "start"],
              [12, sky.sun.set, "middle"],
              [24, sky.sun.rise, "end"],
            ] as Array<[number, number | null, "start" | "middle" | "end"]>).map(
              ([i, h, anchor], k) =>
                h === null ? null : (
                  <text
                    key={`lt${k}`}
                    className="pan-fade pan-numeral"
                    style={{ "--s": 0.62, "--o": 0.6 } as React.CSSProperties}
                    x={ledgerX(sky, i) + (anchor === "start" ? 0 : anchor === "end" ? 0 : 0)}
                    y={LEDGER_Y + LEDGER_H + 13}
                    textAnchor={anchor}
                    fontSize="8"
                    letterSpacing="1.2"
                    fill="var(--ox, #e0b768)"
                  >
                    {k === 1 ? `SUNSET ${hhmm(h)}` : `SUNRISE ${hhmm(h)}`}
                  </text>
                )
            )}
            {sky.sun.rise !== null &&
              (() => {
                const el = (((sky.nowHour - sky.sun.rise) % 24) + 24) % 24;
                const x = r1(MARGIN_X + (el / 24) * (PLATE_W - 2 * MARGIN_X));
                return (
                  <g
                    className="pan-fade pan-now"
                    style={{ "--s": 0.62, "--o": 0.95 } as React.CSSProperties}
                  >
                    <path
                      d={`M ${x - 3.5} ${LEDGER_Y - 8} L ${x + 3.5} ${LEDGER_Y - 8} L ${x} ${LEDGER_Y - 3} Z`}
                      fill="var(--ox, #e0b768)"
                    />
                    <line
                      x1={x}
                      y1={LEDGER_Y - 2}
                      x2={x}
                      y2={LEDGER_Y + LEDGER_H + 2}
                      stroke="var(--ox, #e0b768)"
                      strokeWidth="1.1"
                    />
                  </g>
                );
              })()}
            {sky.hours.map((hr, i) => {
              const a = ledgerX(sky, i);
              const b = ledgerX(sky, i + 1);
              const w = Math.max(0, b - a);
              const on = i === sky.hourIndex;
              return (
                <g
                  key={`ph${i}`}
                  className="pan-fade"
                  style={{
                    "--s": 0.58 + i * 0.004,
                    "--o": on ? 1 : hr.day ? 0.66 : 0.46,
                  } as React.CSSProperties}
                >
                  <rect
                    data-cell={i}
                    className="ph-cell"
                    x={a}
                    y={LEDGER_Y}
                    width={w}
                    height={LEDGER_H}
                    fill={on ? "var(--ox, #e0b768)" : "none"}
                    fillOpacity={on ? 0.16 : 0}
                    stroke="currentColor"
                    strokeWidth="0.4"
                    strokeOpacity="0.5"
                  />
                  {w > 11 && (
                    <text
                      x={a + w / 2}
                      y={LEDGER_Y + LEDGER_H / 2 + 4.5}
                      textAnchor="middle"
                      fontSize="13"
                      fill={on ? "var(--ox, #e0b768)" : "currentColor"}
                    >
                      {hr.glyph}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ══ REGISTER 6 — the colophon ══ */}
        {sky && (
          <g className="pl pl-fore">
            <line
              className="pan-fade"
              style={{ "--s": 0.64, "--o": 0.2 } as React.CSSProperties}
              x1={MARGIN_X}
              y1={COLOPHON_Y - 16}
              x2={568}
              y2={COLOPHON_Y - 16}
              stroke="currentColor"
              strokeWidth="0.4"
            />
            <line
              className="pan-fade"
              style={{ "--s": 0.64, "--o": 0.2 } as React.CSSProperties}
              x1={632}
              y1={COLOPHON_Y - 16}
              x2={PLATE_W - MARGIN_X}
              y2={COLOPHON_Y - 16}
              stroke="currentColor"
              strokeWidth="0.4"
            />
            <path
              className="pan-fade"
              style={{ "--s": 0.66, "--o": 0.6 } as React.CSSProperties}
              d={`M 594 ${COLOPHON_Y - 16} l 6 -4 l 6 4 l -6 4 Z`}
              fill="none"
              stroke="var(--ox, #e0b768)"
              strokeWidth="0.7"
            />
            {colophon(sky, today).map((col, i, all) => (
              <text
                key={`co${i}`}
                className="pan-fade pan-numeral"
                style={{ "--s": 0.66 + i * 0.015, "--o": 0.84 } as React.CSSProperties}
                x={MARGIN_X + (i / all.length) * (PLATE_W - 2 * MARGIN_X)}
                y={COLOPHON_Y}
                fontSize="10.5"
                letterSpacing="1.4"
                fill="currentColor"
              >
                <tspan fill="var(--ox, #e0b768)">{col.k}</tspan>
                <tspan dx="7">{col.v}</tspan>
              </text>
            ))}
          </g>
        )}
      </svg>
      )}

      <p className="fig-caption pan-caption">{caption}</p>

      {/* The pulse: what the sky does next, and what changed today.
          The reason this page is worth opening again tomorrow. */}
      {sky && (
        <p className="pan-pulse">
          {(() => {
            const items: string[] = [];
            const [e1, e2] = sky.events;
            if (e1) items.push(eventClause(e1, sky));
            if (e2 && (e2.label.startsWith("the hour") ? e2.dt < 1.6 : e2.dt < 6)) {
              items.push(eventClause(e2, sky));
            }
            if (sky.dayDelta !== null && Math.abs(sky.dayDelta) * 3600 >= 5) {
              items.push(`the day ${sky.dayDelta < 0 ? "shrinks" : "grows"} ${fmtDelta(sky.dayDelta)}`);
            }
            return items.map((t, i) => (
              <span key={i} className="pp-item">
                {t}
              </span>
            ));
          })()}
        </p>
      )}

      {/* What moved while the reader was away. */}
      {since && <p className="pan-since">{since}</p>}

      {/* The plate states its latitude the way printed almanacs always
          did — and lets the reader make it their own. */}
      {sky && (
        <p className="pan-latline">
          {editingLat ? (
            <>
              drawn for{" "}
              <input
                className="pan-latinput"
                type="number"
                min={23}
                max={66}
                step={1}
                defaultValue={Math.round(lat)}
                autoFocus
                aria-label="Latitude in degrees north, 23 to 66"
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitLat((e.target as HTMLInputElement).value);
                  if (e.key === "Escape") setEditingLat(false);
                }}
                onBlur={(e) => commitLat(e.target.value)}
              />
              ° N (23–66)
            </>
          ) : (
            <>
              drawn for {latLabel(lat)} —{" "}
              <button type="button" className="pan-latbtn" onClick={() => setEditingLat(true)}>
                set yours
              </button>
            </>
          )}
        </p>
      )}
    </section>
  );
}

/**
 * HoldMark — the wordmark alone on blank paper during the HOLD movement,
 * docking into the masthead as the page blooms open. Portaled to <body>
 * (ancestor transforms from the page transition would re-anchor fixed
 * positioning). The dock is a measured FLIP: from viewport center to the
 * live masthead wordmark's rect.
 */
function HoldMark({ stage }: { stage: "hold" | "bloom" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setHost(document.body));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (stage !== "bloom" || !ref.current) return;
    const target = document.querySelector(".masthead .wordmark");
    if (!target) return;
    const from = ref.current.getBoundingClientRect();
    const to = (target as HTMLElement).getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const scale = to.width / from.width;
    ref.current.style.transition = "transform 1100ms cubic-bezier(0.76, 0, 0.24, 1), opacity 250ms linear 850ms";
    ref.current.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    ref.current.style.opacity = "0";
  }, [stage]);

  if (!host) return null;
  return createPortal(
    <div className="hold-veil" data-stage={stage} aria-hidden>
      <div ref={ref} className="hold-mark">
        Olivia Arcana
      </div>

      <style jsx>{`
        .hold-veil {
          position: fixed;
          inset: 0;
          z-index: 10050;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .hold-mark {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2rem, 4.4vw, 3.4rem);
          font-weight: 600;
          color: var(--ink);
          will-change: transform, opacity;
        }
      `}</style>
    </div>,
    host,
  );
}

/**
 * LampLight — a reading lamp over the desk. A warm pool of light rides
 * the pointer (lagged, compositor-only: one layer moved by transform).
 * It lives UNDER the type, an absolute child of the almanac painted
 * before everything else — it brightens the paper, never the ink, so
 * the pressure rig's darkening and the lamp's lightening cannot fight.
 * Fine pointers only; gone under reduced motion.
 */
function LampLight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight * 0.35;
    let x = tx;
    let y = ty;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
    };
    const loop = () => {
      x += (tx - x) * 0.09;
      y += (ty - y) * 0.09;
      // Page coordinates: the lamp is absolute in the document, the
      // pointer is in viewport space.
      el.style.transform = `translate3d(${x}px, ${y + window.scrollY}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="lamp-veil" aria-hidden>
      <div ref={ref} className="lamp-pool" />

      <style jsx>{`
        .lamp-veil {
          position: absolute;
          inset: 0;
          /* Below every in-flow element, above the almanac's paper —
             the root carries isolation: isolate so -1 cannot escape
             beneath the page background. */
          z-index: -1;
          overflow: hidden;
          pointer-events: none;
        }

        .lamp-pool {
          position: absolute;
          top: 0;
          left: 0;
          width: clamp(560px, 58vw, 900px);
          height: clamp(560px, 58vw, 900px);
          margin: calc(clamp(560px, 58vw, 900px) / -2) 0 0 calc(clamp(560px, 58vw, 900px) / -2);
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(255, 248, 226, 0.55) 0%,
            rgba(255, 248, 226, 0.22) 42%,
            rgba(255, 248, 226, 0) 70%
          );
          opacity: 0;
          transition: opacity 600ms ease;
          will-change: transform;
        }

        /* Raking light reveals the paper's tooth: laid lines and chain
           wires live only inside the pool — the sheet is flat until a
           candle is carried across it. */
        .lamp-pool::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background-image:
            repeating-linear-gradient(
              88deg,
              rgba(110, 86, 52, 0.3) 0px,
              rgba(110, 86, 52, 0) 1px,
              rgba(255, 252, 240, 0.28) 2px,
              rgba(255, 252, 240, 0) 3px
            ),
            repeating-linear-gradient(
              -2deg,
              rgba(110, 86, 52, 0.2) 0px,
              rgba(110, 86, 52, 0) 1px,
              rgba(110, 86, 52, 0) 26px
            ),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23f)' opacity='0.5'/%3E%3C/svg%3E");
          background-size: auto, auto, 180px 180px;
          mix-blend-mode: multiply;
          opacity: 0.5;
          -webkit-mask-image: radial-gradient(circle, black 0%, rgba(0, 0, 0, 0.55) 40%, transparent 68%);
          mask-image: radial-gradient(circle, black 0%, rgba(0, 0, 0, 0.55) 40%, transparent 68%);
        }

        @media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
          .lamp-veil {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const { t, locale } = useLocale();
  const copy = locale === "uk" ? ALM.uk : ALM.en;
  const rootRef = useRef<HTMLDivElement>(null);
  // Today's edition — reader-clock dependent, so client-only: SSR shows
  // the static masthead and the page "comes up to date" after hydration.
  // Only the DATE lives in state; the localized strings derive during
  // render so a runtime locale switch never paints a mixed-language frame.
  const [now, setNow] = useState<Date | null>(null);
  // The Inscription: the almanac's single question, kept in this
  // browser. Read after mount (SSR knows no reader).
  const [birth, setBirth] = useState<string | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setBirth(getStoredBirth()));
    return () => cancelAnimationFrame(id);
  }, []);
  const birthI = React.useMemo<BirthInfo | null>(() => (birth ? birthInfo(birth, locale) : null), [birth, locale]);
  // The flashback: the hero chart redrawn as the sky of the birth
  // night. The rest of the page keeps today.
  const [flashOn, setFlashOn] = useState(false);
  // The Diver's Mark — a thing the reader DID, remembered.
  const [diver, setDiver] = useState(false);
  const [lastCut, setLastCut] = useState<{ year: number; no: number } | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLastCut(getLastCut()));
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    try {
      if (localStorage.getItem("olivia-diver")) setDiver(true);
    } catch {
      /* unmarked */
    }
    const on = () => setDiver(true);
    window.addEventListener("alm-diver", on);
    return () => window.removeEventListener("alm-diver", on);
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setNow(new Date()));
    return () => cancelAnimationFrame(id);
  }, []);

  const today = React.useMemo<AlmanacToday | null>(() => (now ? getAlmanacToday(locale, now) : null), [now, locale]);
  const skyView = React.useMemo<AlmanacToday | null>(
    () => (flashOn && birthI ? getAlmanacToday(locale, birthI.date) : today),
    [flashOn, birthI, locale, today],
  );
  // editionNo is a formatted string ("No. 232") — the day as a number.
  const editionDay = today ? Number(today.editionNo.replace(/\D/g, "")) : 0;

  // Printing: open every FAQ entry so the paper copy is complete, then
  // restore the reader's state.
  useEffect(() => {
    const opened: HTMLDetailsElement[] = [];
    const before = () => {
      document.querySelectorAll<HTMLDetailsElement>(".almanac details:not([open])").forEach((d) => {
        d.open = true;
        opened.push(d);
      });
    };
    const after = () => {
      opened.splice(0).forEach((d) => {
        d.open = false;
      });
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const counselLines = locale === "uk" ? COUNSEL.uk : COUNSEL.en;
  const counsel = today ? counselLines[today.counselIndex % counselLines.length] : "";

  const FAQ_ROWS = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: t(`faq_q${n}` as Parameters<typeof t>[0]),
    a: t(`faq_a${n}` as Parameters<typeof t>[0]),
  }));

  // The site shell paints a dark body; the Almanac owns its ground.
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#10134d";
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, []);

  // Quiet print-register reveals.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // [data-set] keeps the letterpress fade; [data-act] arms the
    // Ephemeris choreography (plate reveal, ink rise, hairline, gilt).
    const targets = root.querySelectorAll("[data-set], [data-act]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.classList.add("is-set"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-set");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // today-gated blocks (the colophon's end matter) enter the DOM after
    // hydration — re-arm the observer so they still ink in.
  }, [today]);

  // EPHEMERIS · INK RISE — line-mask the plate titles and the colophon
  // verse (line-level ONLY; characters are never split). Splitting waits
  // for the display face so the measured wraps are the printed wraps.
  // Locale swaps remount the keyed nodes, handing the splitter fresh
  // unsplit text. Paragraphs that carry richer DOM (buttons, the edition
  // number) are not split — they get the quiet .oa-fade instead.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    const split = () => {
      if (disposed) return;
      root.querySelectorAll<HTMLElement>("[data-ink]").forEach((el) => {
        if (el.classList.contains("colophon-end")) {
          el.querySelectorAll<HTMLElement>(":scope > p").forEach((p) => {
            // the edition line rerenders live (the diver's mark) — never split it
            const splittable = !p.classList.contains("colophon-end-no");
            if (!splittable || splitLines(p).length === 0) p.classList.add("oa-fade");
          });
        } else {
          splitLines(el);
        }
      });
    };
    document.fonts?.ready ? document.fonts.ready.then(split) : split();
    return () => {
      disposed = true;
    };
  }, [today, locale]);

  const heroWords = (t("hero_title") as string).split(" ");
  // Display stack: the last two words become their own lines — a stepped
  // masthead in three movements, whatever the locale's word count.
  const heroLines =
    heroWords.length >= 3
      ? [heroWords.slice(0, -2).join(" "), heroWords[heroWords.length - 2], heroWords[heroWords.length - 1]]
      : [heroWords.join(" ")];

  // The frontispiece entrance, in three movements: HOLD (blank paper, the
  // wordmark alone, ~1s of patience), BLOOM (the page opens from a center
  // slit over 1.8s while the wordmark docks into the masthead), DONE (the
  // display lines slide in, the small type rises through masks). Once per
  // session; reduced motion and repeat visits land on the finished page.
  const [stage, setStage] = useState<"idle" | "hold" | "bloom" | "done">("idle");
  useLayoutEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem("alm-pressed"));
    } catch {
      seen = true;
    }
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Pre-paint: land on the finished page silently.
      setStage("done");
      return;
    }
    // Pre-paint arming: the closed slit must be applied before first
    // paint or the open page flashes.
    setStage("hold");
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStage("bloom"), 450));
    timers.push(
      window.setTimeout(() => {
        setStage("done");
        try {
          sessionStorage.setItem("alm-pressed", "1");
        } catch {
          /* replay next visit; harmless */
        }
      }, 1600),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  // The page cannot be scrolled while it is still opening.
  useEffect(() => {
    if (stage === "hold" || stage === "bloom") {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    return undefined;
  }, [stage]);

  // One rig for the page's continuous life: the reading line (document
  // progress), mouse depth (the desk tilting under the hand), and
  // scroll-breath (figures drifting with the scroll, both directions).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const driftEls = Array.from(root.querySelectorAll<HTMLElement>("[data-drift]"));
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let raf = 0;
    let lastRead = -1;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    const loop = () => {
      const vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (Math.abs(p - lastRead) > 0.002) {
        lastRead = p;
        root.style.setProperty("--read-p", p.toFixed(3));
      }

      if (fine) {
        mx += (tx - mx) * 0.06;
        my += (ty - my) * 0.06;
        root.style.setProperty("--mx", mx.toFixed(3));
        root.style.setProperty("--my", my.toFixed(3));
      }

      for (const el of driftEls) {
        const r = el.getBoundingClientRect();
        const dp = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        el.style.setProperty("--dp", dp.toFixed(3));
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (fine) window.removeEventListener("pointermove", onMove);
    };
  }, []);

  // ── Ink pressure ────────────────────────────────────────────
  // The display type answers the hand: letters under the pointer take
  // more weight, and at the hot core the ink bleeds oxblood — a pressman's
  // thumb on wet type. Per-letter cells are frozen at peak-weight width so
  // the line never reflows; values lerp so the field moves like liquid.
  // Touch devices get a ghost hand sweeping the headline instead.
  useEffect(() => {
    if (stage !== "done") return;
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chs = Array.from(root.querySelectorAll<HTMLElement>(".front-display .ch"));
    if (!chs.length) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const W_REST = 430;
    const W_PEAK = 680;
    // Night plate: bone rest → lit-ember peak, channel-lerped per
    // letter — the type warms and glows under the hand.
    const INK = [223, 231, 252];
    const OX = [232, 196, 126];

    type Cell = { el: HTMLElement; px: number; py: number; cur: number; wr: number };
    let cells: Cell[] = [];
    let radius = 200;
    let heroL = 0;
    let heroR = 0;
    let heroT = 0;
    let heroB = 0;
    let measured = false;
    let raf = 0;
    let resizeT = 0;
    let disposed = false;

    const measure = () => {
      // Freeze each cell at its peak-weight advance (one batch of writes,
      // one batch of reads) so weight changes never move neighbours.
      chs.forEach((el) => {
        el.style.width = "";
        el.style.fontWeight = String(W_PEAK);
      });
      const widths = chs.map((el) => el.getBoundingClientRect().width);
      chs.forEach((el, i) => {
        el.style.width = `${widths[i]}px`;
        el.style.fontWeight = "";
      });
      const sy = window.scrollY;
      heroL = Infinity;
      heroR = -Infinity;
      heroT = Infinity;
      heroB = -Infinity;
      // Centers via offset* against the line's rect — offsets ignore the
      // entrance transform, so measuring mid-rise still lands on the
      // letters' settled positions.
      const lineRects = new Map<Element, DOMRect>();
      cells = chs.map((el) => {
        const dl = el.closest(".dl");
        let lr = dl ? lineRects.get(dl) : undefined;
        if (dl && !lr) {
          lr = dl.getBoundingClientRect();
          lineRects.set(dl, lr);
        }
        const base = lr ?? el.getBoundingClientRect();
        const px = (lr ? lr.left + el.offsetLeft : base.left) + el.offsetWidth / 2;
        const py = (lr ? lr.top + el.offsetTop : base.top) + el.offsetHeight / 2 + sy;
        heroL = Math.min(heroL, px);
        heroR = Math.max(heroR, px);
        heroT = Math.min(heroT, py);
        heroB = Math.max(heroB, py);
        return { el, px, py, cur: 0, wr: -1 };
      });
      const fs = parseFloat(getComputedStyle(chs[0]).fontSize) || 90;
      radius = fs * 2.2;
      measured = true;
    };

    let tx = -9999;
    let ty = -9999;
    let mx = -9999;
    let my = -9999;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    const start = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!measured) return;
      const sy = window.scrollY;
      // The field sleeps once the headline has left the stage.
      if (sy > window.innerHeight * 0.5) return;

      if (fine) {
        if (mx < -5000) {
          mx = tx;
          my = ty;
        }
        mx += (tx - mx) * 0.18;
        my += (ty - my) * 0.18;
      } else {
        // Ghost hand: a slow figure sweeping the headline, left to right
        // and back, dipping through the lines.
        const t = (now - start) / 1000;
        mx = (heroL + heroR) / 2 + ((heroR - heroL) / 2) * Math.sin(t * 0.55);
        my = (heroT + heroB) / 2 + ((heroB - heroT) / 2) * Math.sin(t * 0.23) - sy;
      }

      const pmy = my + sy;
      for (const cell of cells) {
        const d = Math.hypot(mx - cell.px, pmy - cell.py);
        const norm = Math.min(Math.max(1 - d / radius, 0), 1);
        const target = norm * norm;
        cell.cur += (target - cell.cur) * 0.14;
        const f = cell.cur < 0.004 ? 0 : cell.cur;
        if (Math.abs(f - cell.wr) < 0.008) continue;
        cell.wr = f;
        if (f === 0) {
          cell.el.style.fontWeight = "";
          cell.el.style.color = "";
        } else {
          cell.el.style.fontWeight = String(Math.round(W_REST + (W_PEAK - W_REST) * f));
          cell.el.style.color = `rgb(${Math.round(INK[0] + (OX[0] - INK[0]) * f)}, ${Math.round(
            INK[1] + (OX[1] - INK[1]) * f,
          )}, ${Math.round(INK[2] + (OX[2] - INK[2]) * f)})`;
        }
      }
    };

    document.fonts.ready.then(() => {
      if (disposed) return;
      measure();
      raf = requestAnimationFrame(loop);
    });

    const onResize = () => {
      window.clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        if (!disposed) measure();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeT);
      window.removeEventListener("resize", onResize);
      if (fine) window.removeEventListener("pointermove", onMove);
      chs.forEach((el) => {
        el.style.fontWeight = "";
        el.style.color = "";
        el.style.width = "";
      });
    };
  }, [stage, locale]);

  return (
    <div ref={rootRef} className={`almanac stage-${stage}`}>
      {(stage === "hold" || stage === "bloom") && <HoldMark stage={stage} />}
      <InkCursor />
      <MagnetRig />
      <ShaderBackdrop />
      <LampLight />
      <span className="read-line" aria-hidden />
      {/* ── Masthead ──────────────────────────────────────────── */}
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
                      document.getElementById("inscription")?.scrollIntoView({ behavior: "smooth", block: "center" });
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
            <details className="mast-more">
              <summary>{locale === "uk" ? "Ще" : "More"} ✦</summary>
              <div className="mast-menu">
                {(locale === "uk"
                  ? [
                      ["Сумісність", "/synastry"],
                      ["Знаки", "/signs"],
                      ["Космос", "/cosmos"],
                      ["Транзити", "/transits"],
                      ["Журнал", "/journal"],
                      ["Питання", "/ask"],
                      ["Про нас", "/about"],
                    ]
                  : [
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
        {/* ── The Arrival — the frontispiece. Olivia drifts toward the
               reader across the moonlit sea; one pinned act of scroll,
               rendered live over the scene plate. */}
        <TheArrival
          locale={locale}
          kicker={locale === "uk" ? "Персональний альманах" : "A personal almanac"}
          titleLines={heroLines}
          subtitle={t("hero_subtitle") as string}
          trust={t("hero_trust_line") as string}
          primaryHref="/oracle"
          primaryLabel={copy.navCta}
          secondaryHref="/daily"
          secondaryLabel={`${copy.nav[1].label} →`}
          captionMain={locale === "uk" ? "I. Наближення" : "I. The arrival"}
          captionSub={locale === "uk" ? "Між відомим і можливим" : "Between the known & the possible"}
        />

        {/* ── Seam: a star-thread stitches the hero's exit to Plate I —
               the hairline draws down with the scroll, the ✦ riding its tip. */}
        <div className="star-thread" data-drift aria-hidden>
          <span className="thread-line" />
          <span className="thread-tip">✦</span>
        </div>

        {/* ── The plates ──────────────────────────────────────── */}
        <section className="plates" id="plates" tabIndex={-1} aria-label={copy.platesLabel}>
          {copy.plates.slice(0, 2).map((plate, i) => (
            <article key={plate.numeral} className={`plate ${i % 2 ? "flip" : ""}${i === 0 ? " plate-oracle" : ""}`} data-act>
              <figure className="plate-figure" aria-hidden={i === 0 ? undefined : true} data-drift data-plate style={{ "--drift": i % 2 ? "-14px" : "14px", "--rock": i % 2 ? "-0.7deg" : "0.7deg" } as React.CSSProperties}>
                {/* PLATE REVEAL — the figure is uncovered from its lower
                    edge while the print settles out of a 1.12 enlargement. */}
                <div className="oa-plate-clip">
                  <div className="oa-plate-in">
                    {i === 0 ? (
                      <SpreadTheater href={plate.href} label={`${plate.title} — ${plate.cta}`} />
                    ) : i === 1 ? (
                      <WheelDiagram className="plate-svg" today={today} />
                    ) : (
                      <SynastryDiagram className="plate-svg" />
                    )}
                  </div>
                </div>
                <figcaption className="fig-caption">{plate.caption}</figcaption>
              </figure>
              <div className="plate-copy">
                <p className="plate-numeral">
                  {copy.platesLabel} · {plate.numeral}
                </p>
                {/* INK RISE — line-masked title; keyed so a locale swap
                    hands the splitter a fresh, unsplit node. */}
                <h2 key={locale} data-ink>{plate.title}</h2>
                <p className="plate-body">{plate.body}</p>
                {i === 0 && <EphemerisNote locale={locale} />}
                {i === 1 ? (
                  <div className="plate-inscribe" id="inscription">

          <StarMotes density="rich" />
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
              <div className="ins-charts">
                <TransitionLink href="/portrait" className="btn-ink ins-portrait">
                  {locale === "uk" ? "Накреслити повну карту неба" : "Draw my full birth chart"} →
                </TransitionLink>
                <TransitionLink href={`/signs/${SIGN_SLUGS[birthI.signIndex]}/`} className="link-ox">
                  {locale === "uk" ? "Ваша гравюра" : "Your plate"} →
                </TransitionLink>
              </div>
              <div className="ins-actions">
                {/* The birth-sky flashback rode the retired SkyChart; the
                    printable leaf remains. */}
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
                  setFlashOn(false);
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
                  e.currentTarget.classList.remove("ins-shake");
                  void (e.currentTarget as HTMLElement).offsetWidth;
                  e.currentTarget.classList.add("ins-shake");
                  return;
                }
                const v = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                if (birthInfo(v, locale)) {
                  storeBirth(v);
                  setBirth(v);
                }
              }}
            >
              <p className="ins-kicker" aria-hidden>
                {locale === "uk" ? "ФІГ. X — ВПИС" : "FIG. X — THE INSCRIPTION"}
              </p>
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
              <p className="ins-priv">{locale === "uk" ? "зберігається у цьому браузері · нікуди не надсилається" : "kept in this browser · never sent anywhere"}</p>
            </form>
          )}
        
                  </div>
                ) : (
                  <TransitionLink href={plate.href} className="link-ox oa-gilt">
                    {plate.cta} →
                  </TransitionLink>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* ── Seam: the same thread lowers the reader from Plate II
               into the colophon. */}
        <div className="star-thread" data-drift aria-hidden>
          <span className="thread-line" />
          <span className="thread-tip">✦</span>
        </div>

      </main>

      {/* ── Colophon ──────────────────────────────────────────── */}
      <footer className="colophon">
        <div className="masthead-rule thick" aria-hidden />
        <div className="colophon-zodiac" data-set aria-hidden>
          {ZODIAC.map((z, i) => (
            <span key={i}>{z}</span>
          ))}
        </div>
        {today && (
          <div className="colophon-end" data-act data-ink key={locale}>
            <p>
              {locale === "uk" ? "Тут закінчується Особистий альманах Olivia Arcana" : "Here ends the Personal Almanac of Olivia Arcana"}
            </p>
            <p>
              {locale === "uk"
                ? "заснований під місячним затемненням · друкарня тримає зоряний час"
                : "founded under a lunar eclipse · the press keeps sidereal hours"}
            </p>
            <p>
              {locale === "uk"
                ? "шрифт розбирається в сутінках і набирається знову на світанку"
                : "the type is distributed at dusk and set again at dawn"}
            </p>
            <p>{locale === "uk" ? "набрано шрифтами Cormorant Garamond і DM Sans на теплій кістяній основі" : "set in Cormorant Garamond & DM Sans upon warm bone"}</p>
            <p>
              {copy.setIn} {today.hourLine} {today.hourGlyph} · {today.seasonLine}
            </p>
            {lastCut !== null && lastCut.year === new Date().getFullYear() && editionDay - lastCut.no >= 2 && (
              <p className="colophon-uncut">
                {locale === "uk"
                  ? `востаннє ви розрізали сторінки № ${lastCut.no}`
                  : `you last cut the pages of No. ${lastCut.no}`}
              </p>
            )}
            <p>
              {locale === "uk"
                ? `завтрашнє число друкується опівночі · № ${editionDay + 1}`
                : `tomorrow's edition prints at midnight · No. ${editionDay + 1}`}
              {"  "}
              <button type="button" className="colophon-print" onClick={() => window.print()}>
                {locale === "uk" ? "надрукувати цей лист" : "print this leaf"}
              </button>
            </p>
            <p className="colophon-end-no">
              {today.editionNo} · {today.romanYear}
              {diver && (
                <span className="diver-mark" aria-label={locale === "uk" ? "для читача, що впав до самого дна" : "for the reader who fell the whole way"}>
                  {" "}⁂
                </span>
              )}
            </p>
          </div>
        )}

        {/* Print-only imprint: the paper copy testifies. */}
        {today && (
          <div className="print-imprint" aria-hidden>
            <p className="pi-sig">Olivia Arcana</p>
            <p className="pi-line">
              {locale === "uk"
                ? `відтиснуто для свого читача · ${today.dateLine} · ${today.hourLine}`
                : `pulled for its reader · ${today.dateLine} · ${today.hourLine}`}
              {diver ? " · ⁂" : ""}
            </p>
          </div>
        )}
        <div className="colophon-grid" data-set>
          <div className="colophon-brand">
            <p className="wordmark as-text">Olivia Arcana</p>
            <p className="colophon-desc">{copy.colophonDesc}</p>
            <p className="colophon-note">{copy.colophonNote}</p>
          </div>
          <nav className="colophon-links" aria-label={copy.colophonAria}>
            {copy.colophonLinks.map((l) => (
              <TransitionLink key={l.href} href={l.href} className="colophon-link">
                {l.label}
              </TransitionLink>
            ))}
          </nav>
        </div>
        <p className="colophon-line" data-set>{copy.colophonLine}</p>
      </footer>

      <style jsx>{`
        /* ── Ground ──────────────────────────────────────────── */
        .almanac {
          /* LIQUID GLASS — the palette is taken from the deck itself:
             lapis night for every ground, the marble figures' ivory for
             type, and the carvings' gilt as the single warm accent.
             Azure and its cyan halo carry interaction. Nothing here is
             warm except the gilt, and nothing is opaque except type. */
          --paper: #10134d;
          --paper-bone: #181d7a;
          --paper-shade: #0a0d38;
          --paper-key: #20279b;
          --paper-deep: #10134d;
          --ink: #e8e9ff;
          --ink-body: rgba(232, 233, 255, 0.86);
          --ink-soft: rgba(232, 233, 255, 0.78);
          --ink-faint: rgba(183, 188, 233, 0.66);
          --hairline: rgba(183, 188, 233, 0.2);
          --ox: #e0b768;
          --ox-fill: #8d97ff;
          --verdis: #b7bce9;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          min-height: 100svh;
          background: transparent;
          color: var(--ink);
          font-family: var(--font-body, system-ui), sans-serif;
          overflow-x: clip;
          isolation: isolate;
        }

        /* Paper grain — one inline turbulence tile, multiply, whisper. */
        .almanac::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: screen;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .almanac > :global(*) {
          position: relative;
          z-index: 1;
        }

        .almanac ::selection {
          background: rgba(224, 183, 104, 0.16);
        }

        /* ── Shared type ─────────────────────────────────────── */
        .kicker {
          margin: 0 0 1rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        h1,
        h2 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 400;
          color: var(--ink);
          text-wrap: balance;
        }

        h2 {
          font-size: clamp(2rem, 4.2vw, 3.3rem);
          line-height: 1.05;
        }

        .ox {
          color: var(--ox);
          font-style: italic;
        }

        :global(.almanac .link-ox) {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 1.4rem;
          color: var(--ox);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.3);
          padding-bottom: 0.25rem;
          transition: border-color 250ms var(--ease);
        }

        :global(.almanac .link-ox:hover),
        :global(.almanac .link-ox:focus-visible) {
          border-color: var(--ox);
        }

        :global(.almanac .btn-ink) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 1.4rem;
          min-height: 3.25rem;
          padding: 0.85rem 1.6rem;
          position: relative;
          color: #15174c;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          text-decoration: none;
          border-radius: 2px;
          /* The Arrival's one warm hand: a flat gilt rectangle. */
          background: var(--ox);
          transition: background 300ms var(--ease), transform 300ms var(--ease), box-shadow 300ms var(--ease);
        }

        /* ── GILT REGISTER — gold never first ─────────────────────
           The plate's one gilt CTA arrives LAST: tracking settles from
           wide to rest while it fades in, well after title and body.
           --oa-ls-rest keeps each control's own resting tracking. */
        :global(.almanac .oa-gilt) {
          --oa-ls-rest: 0.01em;
          opacity: 0;
          letter-spacing: calc(var(--oa-ls-rest) + 0.1em);
          transition:
            opacity var(--dur-element) var(--ease-engrave) 1.05s,
            letter-spacing var(--dur-element) var(--ease-engrave) 1.05s,
            background 300ms var(--ease),
            transform 300ms var(--ease),
            box-shadow 300ms var(--ease),
            border-color 250ms var(--ease);
        }

        :global(.almanac .link-ox.oa-gilt) {
          --oa-ls-rest: 0.14em;
        }

        :global(.almanac .is-set .oa-gilt) {
          opacity: 1;
          letter-spacing: var(--oa-ls-rest);
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.almanac .oa-gilt) {
            opacity: 1;
            letter-spacing: var(--oa-ls-rest);
            transition: opacity var(--dur-micro) ease;
          }
        }

        :global(.almanac .btn-ink:hover),
        :global(.almanac .btn-ink:focus-visible) {
          background: #edca8b;
          color: #15174c;
          transform: translateY(-2px);
          box-shadow: 0 0.6rem 1.4rem rgba(5, 7, 32, 0.35);
        }

        :global(.almanac .btn-ink.small) {
          min-height: 2.8rem;
          padding: 0.6rem 1.6rem;
        }

        :global(.almanac a:focus-visible) {
          outline: 2px solid var(--ox);
          outline-offset: 4px;
        }

        /* Reveal: letterpress settle — no theatrics. */
        .almanac [data-set] {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 800ms var(--ease), transform 800ms var(--ease);
        }

        .almanac :global(.is-set) {
          opacity: 1 !important;
          transform: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac [data-set] {
            opacity: 1;
            transform: none;
            transition: none;
          }
        }

        /* ═══ EPHEMERIS — the plate act ═══════════════════════════
           One trigger (the article's is-set) conducts the whole plate:
           the figure is uncovered (PLATE REVEAL), the title rises
           through its line masks (INK RISE — globals.css), the copy
           settles, the section rule draws (HAIRLINE DRAW, landing just
           after the text), and the gilt CTA registers LAST. */

        /* PLATE REVEAL — replaces the plain fade for the two figures. */
        .almanac :global(.plate .oa-plate-clip) {
          clip-path: inset(100% 0 0 0);
          transition: clip-path var(--dur-plate) var(--ease-engrave);
          will-change: clip-path;
        }

        .almanac :global(.plate .oa-plate-in) {
          transform: scale(1.12);
          transform-origin: 50% 72%;
          transition: transform var(--dur-plate) var(--ease-engrave);
          will-change: transform;
        }

        .almanac :global(.plate.is-set .oa-plate-clip) {
          clip-path: inset(0% 0 0 0);
        }

        .almanac :global(.plate.is-set .oa-plate-in) {
          transform: scale(1);
        }

        .almanac :global(.plate .fig-caption) {
          opacity: 0;
          transition: opacity var(--dur-element) var(--ease-engrave) 0.8s;
        }

        .almanac :global(.plate.is-set .fig-caption) {
          opacity: 1;
        }

        /* The copy settles in register: numeral first, body after the
           title's lines have begun their rise. The h2 itself never
           fades — its masked lines carry the reveal. */
        .almanac :global(.plate .plate-copy > :not(h2):not(.oa-gilt)) {
          opacity: 0;
          transform: translateY(12px);
          transition:
            opacity var(--dur-element) var(--ease-engrave) 0.35s,
            transform var(--dur-element) var(--ease-engrave) 0.35s;
        }

        .almanac :global(.plate .plate-copy > .plate-numeral) {
          transition-delay: 0.05s, 0.05s;
        }

        .almanac :global(.plate.is-set .plate-copy > :not(h2):not(.oa-gilt)) {
          opacity: 1;
          transform: translateY(0);
        }

        /* HAIRLINE DRAW — the rule between plates draws origin-left,
           0.8s on the wipe curve, landing ~.15s after the title text. */
        .almanac :global(.plate + .plate::before) {
          content: "";
          grid-column: 1 / -1;
          height: 1px;
          background: var(--hairline);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.8s var(--ease-wipe) 0.4s;
        }

        .almanac :global(.plate + .plate.is-set::before) {
          transform: scaleX(1);
        }

        /* The inscription frame's rule — same draw, keyed to Plate II. */
        .almanac :global(.plate .plate-inscribe::before) {
          content: "";
          display: block;
          height: 1px;
          margin-bottom: 1.1rem;
          background: var(--hairline);
          transform: scaleX(0);
          transform-origin: left center;
          transition: transform 0.8s var(--ease-wipe) 0.55s;
        }

        .almanac :global(.plate.is-set .plate-inscribe::before) {
          transform: scaleX(1);
        }

        /* The colophon verse: masked lines rise (split in JS); the
           richer paragraphs take the quiet fade instead. */
        .almanac :global(.colophon-end .oa-fade) {
          opacity: 0;
          transition: opacity var(--dur-element) var(--ease-engrave) 0.5s;
        }

        .almanac :global(.colophon-end.is-set .oa-fade) {
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac :global(.plate .oa-plate-clip) {
            clip-path: none;
            transition: opacity var(--dur-micro) ease;
          }
          .almanac :global(.plate .oa-plate-in) {
            transform: none;
            transition: opacity var(--dur-micro) ease;
          }
          .almanac :global(.plate .fig-caption),
          .almanac :global(.plate .plate-copy > :not(h2):not(.oa-gilt)),
          .almanac :global(.colophon-end .oa-fade) {
            opacity: 1;
            transform: none;
            transition: opacity var(--dur-micro) ease;
          }
          .almanac :global(.plate + .plate::before),
          .almanac :global(.plate .plate-inscribe::before) {
            transform: none;
            transition: none;
          }
        }

        /* ── Masthead ────────────────────────────────────────── */
        .masthead {
          padding: 1.1rem clamp(1.1rem, 4vw, 3rem) 0;
          /* the drawer must open OVER the hero that follows in the flow */
          position: relative;
          z-index: 130;
        }

        .masthead-rule {
          height: 1px;
          background: var(--hairline);
        }

        /* Oxford rule: thick over thin, the masthead's full stop. */
        .masthead-rule.thick {
          height: 6px;
          background: linear-gradient(180deg, var(--ink) 0 3px, transparent 3px 4.5px, var(--ink) 4.5px 5.5px, transparent 5.5px);
        }

        .edition-line {
          display: inline-flex;
          align-items: center;
          gap: 0.55em;
          white-space: nowrap;
        }

        .edition-line :global(.moon-engraving) {
          margin-left: 0.2em;
          transform: translateY(-1px);
          color: var(--ink);
        }

        /* Counsel of the day — the epigraph under the Oxford rule. */
        .counsel {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 0.7rem;
          min-height: 2.9rem;
          padding: 0.8rem clamp(1rem, 4vw, 3rem) 0.15rem;
          opacity: 0;
          transition: opacity 900ms var(--ease) 150ms;
        }

        .counsel.is-inked {
          opacity: 1;
        }

        /* The daily line inks in on load: the ⁂ settles first, then the
           counsel reveals left→right like a fresh pull from the press. */
        .counsel-mark {
          color: var(--ox);
          font-size: 0.9rem;
          transform: translateY(1px);
        }

        .counsel.is-inked .counsel-mark {
          animation: counsel-mark-in 420ms var(--ease) both;
        }

        .counsel.is-inked .counsel-line {
          animation: counsel-line-in 900ms var(--ease) 280ms both;
        }

        @keyframes counsel-mark-in {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.6);
          }
          to {
            opacity: 1;
            transform: translateY(1px);
          }
        }

        @keyframes counsel-line-in {
          from {
            clip-path: inset(0 100% 0 0);
          }
          to {
            clip-path: inset(0 -2% 0 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .counsel.is-inked .counsel-mark,
          .counsel.is-inked .counsel-line {
            animation: none;
          }
        }

        .counsel-line {
          margin: 0;
          max-width: 64ch;
          text-align: center;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.02rem, 1.8vw, 1.22rem);
          line-height: 1.45;
          color: var(--ink);
        }

        .counsel-for {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-right: 0.35rem;
        }

        .counsel-line em {
          font-style: italic;
        }

        .masthead-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 0.85rem 0;
        }

        :global(.almanac .wordmark) {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.28rem;
          font-weight: 600;
          color: var(--ink);
          text-decoration: none;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .masthead-est {
          display: none;
          margin: 0;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .masthead-nav {
          display: flex;
          align-items: center;
          gap: clamp(0.9rem, 2.5vw, 1.8rem);
        }

        :global(.almanac .masthead-link) {
          color: var(--ink-soft);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        :global(.almanac .masthead-link:hover) {
          color: var(--ox);
        }

        :global(.almanac .masthead-cta) {
          color: var(--ox);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1px solid rgba(224, 183, 104, 0.45);
          border-radius: 999px;
          padding: 0.5rem 1.05rem;
          /* explicit list — 'all' fought MagnetRig's per-frame transform */
          transition: background 250ms var(--ease), color 250ms var(--ease), border-color 250ms var(--ease);
          white-space: nowrap;
        }

        :global(.almanac .masthead-cta:hover) {
          background: var(--ox);
          color: #f6f1e5;
          border-color: var(--ox);
        }

        .masthead-title {
          margin: 0 0 0.6rem;
          text-align: center;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.5em;
          text-transform: uppercase;
        }

        /* ── Frontispiece ────────────────────────────────────── */
        /* ── Frontispiece: the bloom + display stack ──────────
           The whole page opens from a horizontal slit at viewport
           center; the wordmark docks into the masthead as it opens. */
        .almanac.stage-hold {
          clip-path: inset(50% 0);
        }

        .almanac.stage-bloom {
          clip-path: inset(0 0);
          transition: clip-path 1100ms cubic-bezier(0.76, 0, 0.24, 1);
        }

        .almanac.stage-hold .masthead :global(.wordmark) {
          opacity: 0;
        }

        /* The masthead prints in, rule by line, once the page is open —
           the press rig the markup always carried. */
        .stage-hold .press-t,
        .stage-hold .press-rule,
        .stage-bloom .press-t,
        .stage-bloom .press-rule {
          opacity: 0;
        }

        .stage-done .press-t,
        .stage-done .press-rule {
          opacity: 1;
          transition: opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) calc(var(--pi, 0) * 90ms);
        }

        /* The masthead mark fades in beneath the landing HoldMark —
           a crossfade at the dock seam, no blink. */
        .almanac.stage-bloom .masthead :global(.wordmark) {
          opacity: 1;
          transition: opacity 250ms linear 900ms;
        }

        .almanac.stage-done .masthead :global(.wordmark) {
          opacity: 1;
          transition: opacity 300ms linear;
        }

        /* The pin: the frontispiece holds the viewport for one extra
           screen of scroll while the camera dives into the chart. */
        .front-pin {
          position: relative;
          /* Three beats on one pin: the carving, the dissolve, the hero. */
          height: 340vh;
          z-index: 1;
        }

        /* The hero's own voice waits for the stone to finish speaking,
           then lands and stays — the act's resting state. */
        .front-pin .front {
          --in: clamp(0, (var(--cp, 1) - 0.38) * 4, 1);
          opacity: calc(var(--in) * var(--in) * (3 - 2 * var(--in)));
        }

        @media (prefers-reduced-motion: reduce) {
          .front-pin {
            height: 220vh;
          }
          .front-pin .front {
            opacity: 1;
          }
        }

        .front-stage {
          position: sticky;
          top: 0;
          height: 100svh;
          overflow: hidden;
        }

        .front-stage :global(.sky-canvas) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .front {
          position: relative;
          width: min(100%, 88rem);
          margin: 0 auto;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.1rem, 4vw, 3rem) clamp(2rem, 5vw, 3.5rem);
          pointer-events: none;
        }

        /* Only the cluster and the caption take the hand back — the
           display type stays transparent so the sky is hoverable
           through and around the letters. */
        .front .front-cluster,
        .front .front-ground-cap {
          pointer-events: auto;
        }

        /* The dive, CSS side: the lines part and the small type sets
           while the camera pushes into the sky. Scrubbed, no easing. */
        .front-pin .dl-1 {
          transform: translate3d(calc(var(--dive, 0) * -46vw), 0, 0);
        }

        .front-pin .dl-2 {
          transform: translate3d(calc(var(--dive, 0) * 52vw), 0, 0);
        }

        .front-pin .dl-3 {
          transform: translate3d(calc(var(--dive, 0) * -34vw), 0, 0);
        }

        .front-pin .front-display {
          opacity: clamp(0, calc((0.74 - var(--dive, 0)) / 0.2), 1);
        }

        /* The hairline rules leave first — no orphan rules crossing
           the open sky while the lines part. */
        .front-pin .dl {
          border-bottom-color: rgba(223, 231, 252, clamp(0, calc(0.22 - var(--dive, 0) * 0.66), 0.22));
        }

        .front-pin .front-cluster,
        .front-pin .front-ground-cap {
          opacity: calc(1 - var(--dive, 0) * 2.6);
        }

        .front-pin.is-diving .front-cluster :global(a),
        .front-pin.is-diving .front-ground-cap {
          pointer-events: none;
        }

        /* The display stack: three stepped lines of live type. Each letter
           is its own frozen-width cell (the ink-pressure rig fattens it
           without moving its neighbours); letters rise through the line
           masks at the entrance, one after another. */
        .front-display {
          position: relative;
          z-index: 2;
          margin: 0;
          font-family: var(--font-display, "Cormorant"), var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 430;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 0.98;
          color: var(--ink);
          contain: layout;
        }

        .dl {
          position: relative;
          display: block;
          overflow: hidden;
          font-size: clamp(3rem, 7.5vw, 8.2rem);
          border-bottom: 1px solid rgba(223, 231, 252, 0.22);
          padding: 0.04em 0 0.07em;
        }

        .dl-1 {
          margin-left: 4%;
        }

        .dl-2 {
          margin-left: 26%;
        }

        .dl-3 {
          margin-left: 11%;
        }

        .dw {
          display: inline-block;
          white-space: nowrap;
        }

        .ch {
          display: inline-block;
          text-align: center;
          will-change: transform;
          /* Paper reserve: a halo of ground around each letter, the way
             an engraver clears the plate around type set over a map —
             the stack sits IN the sky, not printed over it. */
          text-shadow:
            0 0 2px rgba(9, 10, 16, 0.9),
            0 0 10px rgba(9, 10, 16, 0.8),
            0 0 24px rgba(9, 10, 16, 0.45);
          transition: text-shadow 240ms var(--ease);
        }

        /* The press slips out of register while a leaf turns — the .ch
           spans declare their own shadow, so the effect has to be spoken
           at their level or the site's largest type never shows it. */
        :global(.is-turning) .ch {
          text-shadow:
            0.16em 0.02em 0 rgba(201, 97, 64, 0.55),
            0 0 10px rgba(9, 10, 16, 0.8);
        }

        .stage-hold .ch,
        .stage-bloom .ch {
          transform: translateY(118%);
        }

        .stage-done .ch {
          transform: none;
          transition: transform 900ms var(--ease)
            calc(var(--li, 0) * 140ms + var(--ci, 0) * 22ms);
        }

        .front-ground-cap {
          position: absolute;
          right: clamp(1.1rem, 4vw, 3rem);
          bottom: clamp(2rem, 5vw, 3.5rem);
          z-index: 4;
          margin: 0;
          text-align: right;
        }

        /* The bottom cluster: small type rising through line masks —
           one bezier, one stagger constant. */
        .front-cluster {
          position: relative;
          z-index: 4;
          max-width: 46rem;
          margin-top: clamp(1.6rem, 4vw, 3rem);
        }

        .mr {
          margin: 0.5rem 0 0;
          overflow: hidden;
        }

        /* The kicker's bottom margin must live on the mask, not the
           masked span — else translateY(101%) never clears the box and
           the line reads through the closed mask. */
        .front-cluster .mr-i.kicker {
          margin-bottom: 0;
        }

        .front-cluster .mr:first-child {
          margin-bottom: 1rem;
        }

        .mr-i {
          display: inline-block;
          will-change: transform;
        }

        .stage-hold .mr-i,
        .stage-bloom .mr-i {
          transform: translateY(101%);
        }

        .stage-done .mr-i {
          transform: none;
          transition: transform 1000ms var(--ease) calc(400ms + var(--mi, 0) * 140ms);
        }

        .front-sub .mr-i {
          max-width: 44ch;
          color: rgba(223, 231, 252, 0.78);
          font-size: clamp(1rem, 1.5vw, 1.12rem);
          line-height: 1.6;
        }

        .front-trust {
          margin-top: 0.7rem;
        }

        /* Marker-highlight: an oxblood pen sweep across the trust line,
           after everything has settled. */
        .hl {
          color: var(--ink);
          font-weight: 600;
          font-size: 0.98rem;
          background-image: linear-gradient(rgba(224, 183, 104, 0.38), rgba(224, 183, 104, 0.38));
          background-repeat: no-repeat;
          background-position: 0 62%;
          background-size: 0% 0.5em;
        }

        .stage-done .hl {
          background-size: 100% 0.5em;
          transition: background-size 400ms linear 1500ms;
        }

        .front-actions .mr-i {
          display: inline-flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1.2rem 1.8rem;
          margin-top: 1.1rem;
        }

        .front-actions :global(.link-ox) {
          margin-top: 0;
        }

        .front-foot .mr-i {
          margin-top: 1.4rem;
          color: rgba(223, 231, 252, 0.45);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac.stage-hold,
          .almanac.stage-bloom {
            clip-path: none;
          }
          .stage-hold .ch,
          .stage-bloom .ch,
          .stage-hold .mr-i,
          .stage-bloom .mr-i {
            opacity: 1;
            transform: none;
          }
          .stage-done .ch,
          .stage-done .mr-i,
          .stage-done .hl {
            transition: none !important;
          }
          .stage-hold .press-t,
          .stage-hold .press-rule,
          .stage-bloom .press-t,
          .stage-bloom .press-rule {
            opacity: 1;
          }
          .stage-done .press-t,
          .stage-done .press-rule {
            transition: none !important;
          }
          .descend {
            display: none;
          }
          /* No pin, no dive: the frontispiece is one quiet screen. */
          .front-pin {
            height: auto;
          }
          .front-stage {
            position: relative;
          }
          .front-pin .dl-1,
          .front-pin .dl-2,
          .front-pin .dl-3 {
            transform: none;
          }
          .front-pin .front-display,
          .front-pin .front-cluster,
          .front-pin .front-ground-cap {
            opacity: 1;
          }
        }

        /* ── The descend cue: an invitation, not an autoplay ──── */
        .descend {
          position: absolute;
          left: 50%;
          bottom: clamp(0.7rem, 2vw, 1.4rem);
          transform: translateX(-50%);
          z-index: 4;
          background: none;
          border: 0;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.34em;
          text-transform: uppercase;
          color: rgba(223, 231, 252, 0.55);
          opacity: 0;
          pointer-events: none;
          transition: color 250ms ease, opacity 400ms ease;
        }

        .descend span {
          color: var(--ox);
        }

        .stage-done .descend {
          animation: alm-descend-in 1200ms ease 12s forwards;
        }

        @keyframes alm-descend-in {
          to {
            opacity: 1;
            pointer-events: auto;
          }
        }

        .descend:hover {
          color: var(--ink);
        }

        .front-pin.is-diving .descend {
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* ── The Inscription strip ─────────────────────────────── */
        .inscribe {
          position: relative;
          width: min(100%, 52rem);
          margin: clamp(2.2rem, 6vw, 4rem) auto 0;
          padding: clamp(2.4rem, 6vw, 3.8rem) clamp(1.2rem, 4vw, 3rem);
          border: 1px solid var(--hairline);
          outline: 1px solid rgba(232, 233, 255, 0.08);
          outline-offset: 7px;
          background: rgba(16, 19, 77, 0.3);
          text-align: center;
        }

        .ins-kicker {
          margin: 0 0 1.4rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--ox, #e0b768);
        }

        .ins-q {
          display: block;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 400;
          margin-bottom: 1.4rem;
        }

        .ins-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.1rem;
          flex-wrap: wrap;
        }

        /* Three engraved cells — the date set in the almanac's own type,
           the browser's calendar dismissed entirely. */
        .ins-dmy {
          display: flex;
          align-items: baseline;
          gap: 0.55rem;
          margin: 0;
          padding: 0 0.3rem 0.15rem;
          border: 0;
        }

        .ins-cell {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: clamp(1.25rem, 2.6vw, 1.6rem);
          letter-spacing: 0.1em;
          text-align: center;
          color: var(--ink);
          background: transparent;
          border: 0;
          border-bottom: 1px solid rgba(232, 233, 255, 0.32);
          border-radius: 0;
          padding: 0.25rem 0.1rem 0.4rem;
          transition: border-color 240ms var(--ease);
          caret-color: var(--ox, #e0b768);
        }

        .ins-cell::placeholder {
          color: rgba(183, 188, 233, 0.4);
        }

        .ins-cell:focus-visible {
          outline: none;
          border-bottom-color: var(--ox, #e0b768);
        }

        /* the filled tick: a cell holding a plausible value keeps a
           gilt underline even after the hand moves on */
        .ins-cell.is-filled {
          border-bottom-color: rgba(224, 183, 104, 0.75);
        }

        .ins-sep {
          font-size: 1.1rem;
          color: rgba(183, 188, 233, 0.45);
        }

        .ins-shake {
          animation: ins-shake 320ms ease;
        }

        @keyframes ins-shake {
          25% { transform: translateX(-5px); }
          50% { transform: translateX(4px); }
          75% { transform: translateX(-2px); }
        }

        .ins-charts {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.4rem;
          flex-wrap: wrap;
          margin-top: 0.4rem;
        }

        .ins-priv {
          margin: 0.8rem 0 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .ins-done {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
        }

        .ins-glyph {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 2rem;
          color: var(--ox);
          line-height: 1;
        }

        .ins-line {
          margin: 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-soft);
          max-width: 34rem;
        }

        .ins-actions {
          display: flex;
          gap: 1.4rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.3rem;
        }

        .ins-flash {
          background: none;
          border: 0;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ox);
          border-bottom: 1px solid rgba(224, 183, 104, 0.4);
          padding: 0.2rem 0 2px;
        }

        .ins-flash:hover {
          border-bottom-color: var(--ox);
        }

        .standing {
          margin: 1.3rem 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.05rem;
          line-height: 1.55;
          color: var(--ink-soft);
          max-width: 30rem;
        }

        .letter-dated {
          display: block;
          margin-top: 0.5rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .colophon-uncut {
          color: var(--ox) !important;
        }

        .colophon-print {
          background: none;
          border: 0;
          cursor: pointer;
          font: inherit;
          color: var(--ox);
          text-decoration: underline dotted;
          padding: 0;
        }

        .diver-mark {
          color: var(--ox);
        }

        .print-imprint {
          display: none;
        }

        .ins-forget {
          background: none;
          border: 0;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.55rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          text-decoration: underline dotted;
          padding: 0.2rem;
        }

        .ins-forget:hover {
          color: var(--ox);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        .fig-caption {
          margin-top: 1.1rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        /* ── Section divider ─────────────────────────────────── */
        .rule-star {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          width: min(100%, 76rem);
          margin: 0 auto;
          padding: 0 clamp(1.1rem, 4vw, 3rem);
          color: var(--ink-faint);
        }

        .rule-star::before,
        .rule-star::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--hairline);
        }

        .rule-star span {
          font-size: 0.8rem;
        }

        /* ── Star-thread seam: a vertical hairline that draws itself
           down as the seam crosses the viewport ([data-drift] feeds
           --dp 0→1), the ✦ riding its tip. Reduced motion (no rig):
           --dp defaults to 1 — the thread stands complete. */
        .star-thread {
          position: relative;
          width: 1rem;
          height: clamp(6.5rem, 15vh, 9.5rem);
          margin: 0.4rem auto;
        }

        .thread-line {
          position: absolute;
          left: 50%;
          top: 0;
          height: calc(100% - 1.3rem);
          width: 1px;
          background: var(--hairline);
          transform: scaleY(var(--dp, 1));
          transform-origin: top;
        }

        .thread-tip {
          position: absolute;
          left: 50%;
          top: calc(var(--dp, 1) * (100% - 1.3rem));
          transform: translateX(-50%);
          color: var(--ink-faint);
          font-size: 0.75rem;
          line-height: 1.3rem;
        }

        /* ── Plates ──────────────────────────────────────────── */
        .plates {
          width: min(100%, 76rem);
          margin: 0 auto;
          padding: clamp(1.5rem, 4vw, 3rem) clamp(1.1rem, 4vw, 3rem);
        }

        .plate {
          display: grid;
          grid-template-columns: minmax(15rem, 0.8fr) minmax(0, 1fr);
        }

        /* Plate I carries the living table — give it the wider column */
        .plate-oracle {
          grid-template-columns: minmax(20rem, 1.05fr) minmax(0, 1fr);
          gap: clamp(2rem, 6vw, 5.5rem);
          align-items: center;
          padding: clamp(2.2rem, 5vw, 4rem) 0;
        }

        /* the rule between plates is drawn by the Ephemeris (see the
           HAIRLINE DRAW block) — no static border here anymore */

        .plate.flip {
          grid-template-columns: minmax(0, 1fr) minmax(15rem, 0.8fr);
        }

        .plate.flip .plate-figure {
          order: 2;
        }

        .plate-figure {
          margin: 0;
          text-align: center;
          color: var(--ink);
        }

        .plate-svg {
          width: min(19rem, 64vw);
          height: auto;
        }

        .plate-numeral {
          margin: 0 0 0.9rem;
          color: var(--ox);
          opacity: 0.9;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .plate-copy h2 {
          font-size: clamp(2.2rem, 4.6vw, 3.6rem);
        }

        .plate-body {
          color: var(--ink-body);
          margin: 1.1rem 0 0;
          max-width: 44ch;
          color: var(--ink-soft);
          font-size: clamp(0.98rem, 1.5vw, 1.08rem);
          line-height: 1.66;
        }

        /* ── Specimen ────────────────────────────────────────── */
        .specimen {
          display: grid;
          grid-template-columns: minmax(0, 0.8fr) minmax(19rem, 1fr);
          gap: clamp(2rem, 6vw, 5rem);
          align-items: center;
          width: min(100%, 76rem);
          margin: 0 auto;
          padding: clamp(2.5rem, 6vw, 5rem) clamp(1.1rem, 4vw, 3rem);
        }

        .specimen-stage {
          position: relative;
          border-radius: 18px;
          background: var(--lg-tint);
          -webkit-backdrop-filter: var(--lg-blur);
          backdrop-filter: var(--lg-blur);
          box-shadow: var(--lg-rim), var(--lg-cast);

          display: grid;
          gap: 1.4rem;
        }

        .doc-label {
          display: block;
          margin-bottom: 0.65rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          font-weight: 600;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .ox-label {
          color: var(--ox);
        }

        .scrap {
          background: var(--paper-bone);
          box-shadow: 0 1rem 2rem var(--paper-shade);
          justify-self: start;
          max-width: 26rem;
          padding: 1.2rem 1.4rem;
          border: 1px dashed var(--hairline);
          background: rgba(223, 231, 252, 0.04);
          transform: rotate(-1.1deg);
          opacity: 0.75;
        }

        .scrap p {
          margin: 0;
          color: var(--ink-soft);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.8rem;
          line-height: 1.7;
        }

        .letter {
          background: var(--paper-bone);
          box-shadow: 0 1.2rem 2.4rem var(--paper-shade);
          position: relative;
          justify-self: end;
          max-width: 30rem;
          padding: 1.8rem 2rem 1.6rem;
          background: #0f1240;
          border: 1px solid var(--hairline);
          box-shadow: 0 1.4rem 2.8rem rgba(4, 6, 32, 0.6);
          transform: rotate(0.8deg);
        }

        .letter p {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.16rem, 2vw, 1.4rem);
          font-style: italic;
          line-height: 1.5;
        }

        .letter-sig {
          display: block;
          margin-top: 1rem;
          color: var(--ox);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.05rem;
          font-style: italic;
        }

        .wax {
          position: absolute;
          right: 1.3rem;
          bottom: 1.1rem;
          display: grid;
          place-items: center;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(158deg, rgba(224, 183, 104, 0.34) 0%, rgba(38, 72, 152, 0.42) 100%);
          -webkit-backdrop-filter: blur(14px) saturate(160%);
          backdrop-filter: blur(14px) saturate(160%);
          color: var(--ox);
          font-size: 0.8rem;
          box-shadow:
            inset 0 1px 0 rgba(240, 214, 160, 0.4),
            inset 0 -1px 0 rgba(120, 130, 220, 0.16),
            0 0.5rem 1.2rem rgba(5, 7, 32, 0.45);
        }

        /* ── Tariff ──────────────────────────────────────────── */
        .tariff {
          width: min(100%, 60rem);
          margin: 0 auto;
          padding: clamp(2.5rem, 6vw, 5rem) clamp(1.1rem, 4vw, 3rem);
          text-align: center;
        }

        .tariff-body {
          color: var(--ink-body);
          margin: 1rem auto 0;
          max-width: 52ch;
          color: var(--ink-soft);
          line-height: 1.65;
        }

        .tariff-table {
          position: relative;
          border-radius: 18px;
          background: var(--lg-tint);
          -webkit-backdrop-filter: var(--lg-blur);
          backdrop-filter: var(--lg-blur);
          box-shadow: var(--lg-rim), var(--lg-cast);

          margin-top: clamp(1.8rem, 4vw, 2.8rem);
          border-top: 3px solid var(--ink);
          text-align: left;
        }

        .tariff-row {
          display: flex;
          align-items: baseline;
          gap: 1.1rem;
          padding: 1.05rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .tariff-name {
          flex: 0 0 7.5rem;
        }

        /* Dot leaders — the almanac table's connective tissue. */
        .tariff-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(223, 231, 252, 0.35);
          transform: translateY(-0.28em);
        }

        .tariff-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.35rem;
          font-weight: 600;
        }

        .tariff-what {
          flex: 0 1 auto;
          color: var(--ink-soft);
          font-size: 0.92rem;
        }

        .tariff-price {
          flex: 0 0 auto;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.82rem;
          letter-spacing: 0.06em;
          font-variant-numeric: lining-nums tabular-nums;
          color: var(--ink);
          white-space: nowrap;
        }

        .tariff-foot {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem 1.6rem;
          padding-top: 1.6rem;
        }

        .tariff-small {
          margin: 0;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }

        /* ── Questions ───────────────────────────────────────── */
        .questions {
          width: min(100%, 52rem);
          margin: 0 auto;
          padding: clamp(2.5rem, 6vw, 5rem) clamp(1.1rem, 4vw, 3rem) clamp(3.5rem, 7vw, 6rem);
          text-align: center;
        }

        .questions h2 {
          font-style: italic;
        }

        .q-list {
          margin-top: clamp(1.6rem, 4vw, 2.6rem);
          text-align: left;
          border-top: 1px solid var(--hairline);
        }

        .q-row {
          border-bottom: 1px solid var(--hairline);
          padding: 1.15rem 0.2rem;
        }

        .q-row summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.4rem;
          cursor: pointer;
          list-style: none;
          min-height: 44px;
        }

        .q-row summary::-webkit-details-marker {
          display: none;
        }

        .q-q {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.28rem;
          font-style: italic;
          font-weight: 600;
          line-height: 1.35;
        }

        .q-mark {
          flex: 0 0 auto;
          color: var(--ox);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1.15rem;
          font-weight: 400;
          transition: transform 350ms var(--ease);
        }

        .q-row[open] .q-mark {
          transform: rotate(45deg);
        }

        .q-a {
          color: var(--ink-body);
          margin: 1rem 0 0.3rem;
          max-width: 62ch;
          color: var(--ink-soft);
          font-size: 0.98rem;
          line-height: 1.65;
        }

        .q-row summary:focus-visible {
          outline: 2px solid var(--ox);
          outline-offset: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .q-mark {
            transition: none;
          }
        }

        /* ── Colophon ────────────────────────────────────────── */
        .colophon {
          padding: 0 clamp(1.1rem, 4vw, 3rem) 2.4rem;
        }

        .colophon-zodiac {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.9rem 1.15rem;
          padding: 1.4rem 0 0.4rem;
          color: var(--ink-faint);
          font-size: 0.95rem;
        }

        .colophon-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
          gap: 2rem;
          align-items: start;
          width: min(100%, 68rem);
          margin: 1.2rem auto 0;
        }

        .wordmark.as-text {
          margin: 0 0 0.6rem;
        }

        .colophon-desc {
          margin: 0;
          max-width: 44ch;
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .colophon-note {
          margin: 0.6rem 0 0;
          color: var(--ink-faint);
          font-size: 0.74rem;
        }

        .colophon-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.8rem 1.6rem;
          justify-content: flex-end;
          align-items: baseline;
          padding-top: 0.4rem;
        }

        :global(.almanac .colophon-link) {
          color: var(--ink-soft);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        :global(.almanac .colophon-link:hover) {
          color: var(--ox);
        }

        /* "Here ends…" — the colophon proper, an inverted triangle of
           shortening italic lines, closed by the live edition number. */
        .colophon-end {
          margin: 1.8rem auto 0;
          text-align: center;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: var(--ink-soft);
        }

        .colophon-end p {
          margin: 0.2rem 0;
          line-height: 1.5;
        }

        .colophon-end p:nth-child(1) {
          font-size: 1.06rem;
        }

        .colophon-end p:nth-child(2) {
          font-size: 0.92rem;
          max-width: 40ch;
          margin-left: auto;
          margin-right: auto;
        }

        .colophon-end p:nth-child(3) {
          font-size: 0.82rem;
          color: var(--ink-faint);
        }

        .colophon-end-no {
          font-style: normal;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem !important;
          letter-spacing: 0.26em;
          color: var(--ox) !important;
          margin-top: 0.7rem !important;
        }

        .colophon-line {
          width: min(100%, 68rem);
          margin: 2rem auto 0;
          padding-top: 1rem;
          border-top: 1px solid var(--hairline);
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        /* ── Responsive ──────────────────────────────────────── */
        @media (min-width: 900px) {
          .masthead-est {
            display: block;
          }
        }

        @media (max-width: 899px) {
          .specimen {
            grid-template-columns: 1fr;
          }

          /* Mobile frontispiece: a shorter dive, the chart centered
             behind the stack. */
          .front-pin {
            height: 170vh;
          }

          .front-ground-cap {
            right: 50%;
            transform: translateX(50%);
            text-align: center;
            white-space: nowrap;
          }

          .dl-1 {
            margin-left: 0;
          }

          .dl-2 {
            margin-left: 10%;
          }

          .dl-3 {
            margin-left: 4%;
          }

          .plate,
          .plate.flip {
            grid-template-columns: 1fr;
            gap: 1.6rem;
          }

          .plate.flip .plate-figure {
            order: 0;
          }

          .plate-copy {
            text-align: center;
          }

          .plate-body {
            margin-left: auto;
            margin-right: auto;
          }


          .specimen-copy {
            text-align: center;
          }

          .scrap,
          .letter {
            justify-self: center;
          }

          .colophon-grid {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .colophon-desc {
            margin: 0 auto;
          }

          .colophon-links {
            justify-content: center;
          }
        }

        /* ── The drawer of further rooms ──────────────────────── */
        .mast-more {
          position: relative;
        }
        .mast-more summary {
          list-style: none;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-soft, rgba(232, 233, 255, 0.78));
          padding: 0.45rem 0;
          transition: color 200ms ease;
        }
        .mast-more summary::-webkit-details-marker {
          display: none;
        }
        .mast-more summary:hover,
        .mast-more[open] summary {
          color: var(--ox, #e0b768);
        }
        .mast-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          z-index: 120;
          min-width: 11rem;
          display: grid;
          padding: 0.5rem 0;
          background: rgba(16, 19, 77, 0.97);
          border: 1px solid var(--hairline);
          outline: 1px solid rgba(232, 233, 255, 0.07);
          outline-offset: 4px;
        }
        .mast-menu :global(.mast-menu-link) {
          padding: 0.55rem 1.1rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-soft, rgba(232, 233, 255, 0.78));
          text-decoration: none;
          transition: color 180ms ease, background 180ms ease;
        }
        .mast-menu :global(.mast-menu-link:hover) {
          color: var(--ox, #e0b768);
          background: rgba(232, 233, 255, 0.04);
        }

        .plate-inscribe {
          margin-top: 0.6rem;
          position: relative;
          text-align: left;
        }
        /* Inside the plate the inscription speaks smaller — the plate's
           own numeral and title already carry the ceremony. */
        .plate-inscribe .ins-kicker {
          display: none;
        }
        .plate-inscribe .ins-q {
          font-size: 1.3rem;
          margin-bottom: 0.9rem;
        }
        .plate-inscribe .ins-row {
          justify-content: flex-start;
          gap: 0.9rem;
        }
        .plate-inscribe .ins-cell {
          font-size: 1.15rem;
        }
        .plate-inscribe .ins-done {
          display: grid;
          justify-items: start;
          gap: 0.5rem;
        }
        .plate-inscribe .ins-glyph {
          font-size: 1.8rem;
        }
        .plate-inscribe .ins-charts {
          justify-content: flex-start;
        }

        @media (max-width: 640px) {
          .masthead-nav :global(.masthead-link) {
            display: none;
          }

          .masthead-title {
            letter-spacing: 0.34em;
          }

          /* Compress the masthead stack — on a phone the opening scene
             deserves the fold, not the chrome. */
          .masthead {
            padding-top: 0.5rem;
          }
          .masthead-row {
            padding: 0.45rem 0;
          }
          .masthead-title {
            font-size: 0.56rem;
            margin: 0.15rem 0 0.3rem;
          }
          .counsel {
            min-height: 0;
            padding: 0.45rem 1rem 0.1rem;
          }
          .counsel-line {
            font-size: 0.92rem;
            line-height: 1.4;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .tariff-row {
            flex-wrap: wrap;
            row-gap: 0.15rem;
          }

          .tariff-name {
            flex: 1 1 auto;
          }

          .tariff-what {
            flex: 1 1 100%;
            order: 3;
          }
        }
      `}</style>

      <style jsx global>{`
        /* ── The etching: strokes draw themselves when a figure is set.
           pathLength=1 normalizes every shape, so one rule serves circles,
           lines, and paths alike. Text and dots fade in after the strokes. */
        .almanac .etch {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          transition: stroke-dashoffset 1500ms cubic-bezier(0.65, 0, 0.35, 1) calc(var(--ei, 0) * 140ms);
        }

        .almanac .is-set .etch,
        .almanac .is-set.etch {
          stroke-dashoffset: 0;
        }

        .almanac .svg-fade {
          opacity: 0;
          transition: opacity 900ms cubic-bezier(0.16, 1, 0.3, 1) calc(var(--ei, 0) * 140ms + 500ms);
        }

        .almanac .is-set .svg-fade {
          opacity: 1;
        }

        .almanac .wheel-live {
          opacity: 0;
          transition: opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1) 1600ms;
        }

        .almanac .is-set .wheel-live {
          opacity: 1;
        }

        /* The wheel's idle breath: the ticked ring turns once a minute. */
        .almanac .wheel-breathe {
          transform-box: view-box;
          transform-origin: 160px 160px;
          animation: alm-wheel-breathe 60s linear infinite;
        }

        @keyframes alm-wheel-breathe {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac .etch {
            stroke-dashoffset: 0 !important;
            transition: none !important;
          }
          .almanac .svg-fade,
          .almanac .wheel-live {
            opacity: 1 !important;
            transition: none !important;
          }
          .almanac .wheel-breathe {
            animation: none !important;
          }
        }

        @keyframes alm-tip-in {
          from {
            opacity: 0;
            transform: translate(-50%, -44%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        /* ── The night plate ────────────────────────────────────
           The frontispiece is a mezzotint tipped into the paper
           almanac: a deep-ink night window under the paper masthead,
           bone stars, the ember road — and at the dive's end a dawn
           veil returns the page to paper. */
        .almanac .front-stage {
          /* isolation + the ::before sky live on the SAME sticky element —
             an extra position here once silently killed the hero's pin
             (this selector outweighs the base .front-stage rule). */
          isolation: isolate;
          border-top: 1px solid rgba(223, 231, 252, 0.12);
        }

        /* The stage sky lives on a layer of its own so it can dissolve
           into the plate below instead of stopping at a hard edge. */
        .almanac .front-stage::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background:
            radial-gradient(130vmin at 62% 46%, rgba(32, 39, 155, 0.62) 0%, rgba(24, 29, 122, 0.72) 52%, rgba(16, 19, 77, 0.86) 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 76%, transparent 100%);
          mask-image: linear-gradient(to bottom, black 76%, transparent 100%);
        }

        @media (max-width: 899px) {
          .almanac .front-stage::before {
            background:
              radial-gradient(120vmin at 50% 42%, rgba(32, 39, 155, 0.62) 0%, rgba(24, 29, 122, 0.72) 52%, rgba(16, 19, 77, 0.86) 100%);
          }
        }

        .almanac .dawn-veil {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: #10134d;
          opacity: clamp(0, calc((var(--dive, 0) - 0.78) / 0.2), 1);
          pointer-events: none;
        }

        /* Dawn blushes before it pales: an ember wash swells mid-
           dissolve (product of two ramps = a bell over the scrub),
           then the paper takes the page. */
        .almanac .dawn-blush {
          position: absolute;
          inset: 0;
          z-index: 1;
          background: linear-gradient(180deg, rgba(224, 183, 104, 0.4) 0%, rgba(224, 183, 104, 0.18) 60%, rgba(224, 183, 104, 0.05) 100%);
          opacity: calc(
            clamp(0, calc((var(--dive, 0) - 0.58) / 0.14), 1) *
            clamp(0, calc((0.96 - var(--dive, 0)) / 0.14), 1)
          );
          pointer-events: none;
        }

        .almanac .front-stage .front {
          position: relative;
          z-index: 2;
        }

        .almanac .front-pin .kicker {
          color: rgba(223, 231, 252, 0.55);
        }

        .almanac .front-pin .front-ground-cap {
          color: rgba(223, 231, 252, 0.5);
        }

        .almanac .front-pin .link-ox {
          color: var(--ox);
        }

        /* The reader's chip in the masthead: the almanac has turned
           to their page — or invites them to be inscribed. */
        .almanac .reader-chip {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          color: var(--ox);
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.4);
          padding-bottom: 1px;
          white-space: nowrap;
        }

        .almanac .reader-chip:hover {
          border-bottom-color: var(--ox);
        }

        .almanac .reader-chip.ghost {
          color: var(--ink-faint);
          border-bottom-style: dotted;
          border-bottom-color: rgba(223, 231, 252, 0.35);
        }

        .almanac .reader-chip.ghost:hover {
          color: var(--ox);
        }

        /* The tooltip chip inverts on the night plate. */
        .almanac .front-stage .instrument-tip {
          background: var(--ink);
          color: #10134d;
          box-shadow: 0 0.5rem 1.4rem rgba(0, 0, 0, 0.5);
        }

        @media print {
          .almanac .front-stage {
            background: none !important;
          }
          .almanac .dawn-veil,
          .almanac .dawn-blush {
            display: none !important;
          }
          .almanac .front-pin .front-display,
          .almanac .front-pin .kicker,
          .almanac .front-pin .front-ground-cap {
            color: #000000 !important;
          }
        }

        /* ── The sky's furniture ────────────────────────────────
           The display type lets the hand through — the chart stays
           hoverable beneath and between the letters; the tooltip
           chip serves the zodiac band. */
        .almanac .front-display {
          pointer-events: none;
        }

        .almanac .instrument-tip {
          position: absolute;
          transform: translate(-50%, -50%);
          animation: alm-tip-in 160ms var(--ease);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;
          padding: 0.45rem 0.8rem;
          background: var(--ink);
          color: #10134d;
          border-radius: 0.3rem;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 0.5rem 1.2rem rgba(4, 6, 32, 0.55);
          z-index: 5;
        }

        .almanac .tip-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1.1;
        }

        .almanac .tip-dates {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          opacity: 0.75;
        }


        /* ── The panorama: strokes drawn by scroll ─────────────
           Each stroke owns --s (its start inside the scrub window);
           the section feeds --p. dashoffset resolves per-stroke, so
           the scene assembles in drawing order under the hand. */
        .almanac .panorama {
          --p: 0;
          position: relative;
          z-index: 2;
          width: min(100%, 76rem);
          /* The Arrival releases cleanly; the panorama begins on its own
             ground (the old -30svh under-pin pull is retired). */
          margin: 0 auto;
          padding: clamp(1rem, 3vw, 2rem) clamp(1.1rem, 4vw, 3rem) 0;
          text-align: center;
        }

        /* An abyss pool under the plate: the vault's hairline engraving
           needs a floor darker than the liquid night behind the page. */
        .almanac .panorama::before {
          content: "";
          position: absolute;
          inset: -4% -10%;
          z-index: -1;
          background: radial-gradient(
            62% 58% at 50% 44%,
            rgba(6, 8, 40, 0.85),
            rgba(10, 13, 56, 0.45) 62%,
            transparent 82%
          );
          pointer-events: none;
        }

        @media (max-width: 899px) {
          .almanac .panorama {
            margin-top: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac .panorama {
            margin-top: 0;
          }
          .almanac .instrument-tip {
            animation: none;
          }
          .almanac .counsel {
            transition: none !important;
          }
        }

        .almanac .panorama-svg {
          width: 100%;
          height: auto;
          color: var(--ink);
        }

        .almanac .pan-draw {
          --k: clamp(0, (var(--p) - var(--s, 0)) * 5, 1);
          stroke-dasharray: 1;
          stroke-dashoffset: calc(1 - var(--k) * var(--k) * (3 - 2 * var(--k)));
        }
        .almanac .pan-fade {
          --k: clamp(0, (var(--p) - var(--s, 0)) * 5, 1);
          --e: calc(var(--k) * var(--k) * (3 - 2 * var(--k)));
          /* Ink boost: the plate's faint registers were tuned for the old
             near-black ground; on the ultramarine night they need double
             weight to read as engraving rather than vanish. */
          opacity: calc(var(--e) * min(1, var(--o, 1) * 2.1));
        }

        /* Numerals belong to the almanac's mono, not the browser's. */
        .almanac .pan-numeral {
          --o: 0.5;
          font-family: var(--font-mono, ui-monospace, monospace);
          letter-spacing: 0.08em;
        }

        /* Glyphs — planet and sign — are the one place the plate is not
           set in its mono; the sign faces come from the system's own. */
        .almanac .panorama-svg text {
          font-family: var(--font-mono, ui-monospace, monospace);
        }

        /* The orb breathes — the one moving thing on a still instrument. */
        .almanac .pan-bloom {
          transform-box: fill-box;
          transform-origin: 50% 50%;
        }

        .almanac .panorama.is-live .pan-bloom {
          animation: pan-breathe 9s ease-in-out infinite;
        }

        @keyframes pan-breathe {
          0%, 100% { transform: scale(0.92); opacity: 0.75; }
          50% { transform: scale(1.06); opacity: 1; }
        }

        /* The plate's name is set in the display serif, not the mono —
           a cartouche, not a data label. */
        .almanac .pan-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
        }

        /* The corona turns once in five minutes — jewel-work, not motion. */
        .almanac .pan-corona {
          transform-origin: var(--hx) var(--hy);
        }

        .almanac .panorama.is-live .pan-corona {
          animation: pan-halo-turn 300s linear infinite;
        }

        /* The real sky arrives with the dark and withdraws with the day. */
        .almanac .pan-realsky {
          opacity: 0;
          transition: opacity 2600ms ease;
        }

        .almanac .panorama.is-night .pan-realsky {
          opacity: 1;
        }

        .almanac .panorama.is-dusk .pan-realsky {
          opacity: 0.55;
        }

        /* The pulse: one quiet line of what comes next. Tabular figures
           so the countdowns never make the line breathe sideways. */
        .almanac .pan-pulse {
          margin: 0.55rem auto 0;
          max-width: 64ch;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-variant-numeric: tabular-nums;
          font-size: 0.62rem;
          letter-spacing: 0.13em;
          line-height: 2;
          color: var(--ink-soft, rgba(232, 233, 255, 0.78));
          text-align: center;
        }

        .almanac .pan-pulse .pp-item + .pp-item::before {
          content: "·";
          margin: 0 0.75em;
          color: rgba(224, 183, 104, 0.6);
        }

        /* The memory: what moved while the reader was away. */
        .almanac .pan-since {
          margin: 0.65rem auto 0;
          max-width: 44ch;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.02rem;
          line-height: 1.5;
          color: var(--ink-faint, rgba(183, 188, 233, 0.66));
          text-align: center;
        }

        /* The latitude line: stated like a printed almanac's colophon,
           editable like nothing else on the page. */
        .almanac .pan-latline {
          margin: 0.5rem auto 0;
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-faint, rgba(183, 188, 233, 0.55));
          text-align: center;
        }

        .almanac .pan-latbtn {
          background: none;
          border: 0;
          padding: 0;
          font: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          color: var(--ox, #e0b768);
          border-bottom: 1px solid rgba(224, 183, 104, 0.4);
          cursor: pointer;
        }

        .almanac .pan-latbtn:hover,
        .almanac .pan-latbtn:focus-visible {
          border-bottom-color: var(--ox, #e0b768);
        }

        .almanac .pan-latinput {
          width: 3.4em;
          background: rgba(183, 188, 233, 0.1);
          border: 0;
          border-bottom: 1px solid rgba(224, 183, 104, 0.55);
          border-radius: 3px 3px 0 0;
          padding: 0.1em 0.25em;
          font: inherit;
          letter-spacing: inherit;
          color: var(--ink, #e8e9ff);
          text-align: center;
        }

        .almanac .pan-latinput:focus {
          outline: none;
          border-bottom-color: var(--ox, #e0b768);
        }

        /* The mood: the vault warms toward sunset, dims through dusk —
           the plate is never twice the same. */
        .almanac .pan-mood {
          opacity: 0;
          transition: opacity 2400ms ease;
          pointer-events: none;
        }

        .almanac .panorama.is-golden .pan-mood {
          opacity: 0.36;
        }

        .almanac .panorama.is-dusk .pan-mood {
          opacity: 0.16;
        }

        /* The NOW cursor breathes — the one pulse on a still instrument. */
        .almanac .panorama.is-live .pan-now line {
          animation: pan-now-breathe 3.4s ease-in-out infinite;
        }

        @keyframes pan-now-breathe {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .almanac .pan-caption {
          margin-top: 0.4rem;
        }

        /* ── The diorama: depth under the hand ─────────────────
           Four layers lean at different rates against the pointer —
           the plate becomes an object with thickness, not a print. */
        .almanac .panorama .pl {
          transition: transform 120ms linear;
          will-change: transform;
        }

        /* Depth dolly — the plate opens as the reader comes down into it.
           Compositor-only transforms; nothing here can force layout. */
        .almanac .panorama .pl {
          will-change: auto;
        }
        .almanac .panorama.is-live .pl {
          will-change: transform;
        }

        .almanac .panorama .pl-sky {
          transform:
            translate(calc(var(--px, 0) * -7px), calc(var(--py, 0) * -4px + var(--pz, 0) * 10px))
            scale(calc(1 + var(--pz, 0) * 0.012));
        }

        .almanac .panorama .pl-fore {
          transform:
            translate(calc(var(--px, 0) * 4px), calc(var(--py, 0) * 2px - var(--pz, 0) * 5px));
        }

        .almanac .panorama .pl-far {
          transform:
            translate(calc(var(--px, 0) * -2px), calc(var(--py, 0) * -1px + var(--pz, 0) * 4px))
            scale(calc(1 + var(--pz, 0) * 0.02));
        }



        /* Valley haze: two bands drifting against each other. Opacity is
           tied to the dolly, so the air thickens as you come down into
           the scene. Transform-only — safe at any scroll speed. */
        /* Tied to the dolly — the light thickens as the reader comes down
           into the plate — but held back until the ground is drawn. */
        .almanac .pan-air {
          opacity: calc(
            (0.35 + var(--pz, 0) * 0.5) * clamp(0, (var(--p) - 0.24) * 3.4, 1)
          );
          pointer-events: none;
        }




          to { transform: translateX(120px); }
        }

          to { transform: translateX(-160px); }
        }

        /* Rules are engraved at a fixed weight, not a scaled one: a 0.4
           unit hairline is a third of a pixel on a phone, which renders
           as haze rather than a line. */
        .almanac .panorama-svg line,
        .almanac .panorama-svg rect,
        .almanac .ph-cell {
          vector-effect: non-scaling-stroke;
        }

        /* The hour the hand is over, lit in the ledger at the foot. */
        .almanac .ph-cell {
          transition: fill-opacity 200ms ease;
        }
        .almanac .ph-cell[data-lit] {
          fill: var(--ox, #e0b768);
          fill-opacity: 0.28;
        }

        /* The ghost sun follows the hand along the arc, naming the hour. */
        .almanac .pan-ghost {
          transition: opacity 250ms ease;
          pointer-events: none;
        }

        /* The halo counts on, slower than any hand.  */

        @keyframes pan-halo-turn {
          to { transform: rotate(360deg); }
        }

        .almanac .pan-halo {
          transform-origin: var(--hx) var(--hy);
          animation: pan-halo-turn 110s linear infinite reverse;
        }

        /* Night: stars scintillate on coprime counts. */
        .almanac .pan-star-0 { animation: pan-twinkle 4.7s ease-in-out infinite; }
        .almanac .pan-star-1 { animation: pan-twinkle 6.1s ease-in-out infinite 1.4s; }
        .almanac .pan-star-2 { animation: pan-twinkle 7.7s ease-in-out infinite 2.9s; }

        @keyframes pan-twinkle {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.85; }
        }

        /* One shooting star crosses the plate, then a long rest. */
        .almanac .pan-shoot {
          opacity: 0;
          animation: pan-shoot 41s linear infinite 9s;
        }

        @keyframes pan-shoot {
          0% { transform: translate(1150px, 40px); opacity: 0; }
          1% { opacity: 0.7; }
          3.2% { transform: translate(820px, 140px); opacity: 0; }
          100% { transform: translate(820px, 140px); opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          /* The plate still draws — it simply stops moving. */
          .almanac .panorama .pl,
          .almanac .pan-halo,
          .almanac .pan-star,
          .almanac .pan-now line,
          .almanac .pan-corona,
          .almanac .pan-bloom {
            animation: none !important;
            transition: none !important;
          }
          /* These two exist only as motion. */
          .almanac .pan-shoot,
          .almanac .pan-ghost {
            display: none;
          }
        }

        /* After dusk Fig. 0 turns over: a whisper of ink floods the
           plate and the observatory lights its window. */
        .almanac .panorama.is-night .panorama-svg {
          background: none;
        }

        @keyframes pan-drift-a {
          to { transform: translateX(46px); }
        }

        @keyframes pan-drift-b {
          to { transform: translateX(-34px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac .panorama {
            --p: 1;
          }
        }

        /* ── The reading line: a pen tracking the reader ──────── */
        .almanac .read-line {
          position: fixed;
          top: 0;
          left: clamp(0.4rem, 1.2vw, 1rem);
          width: 1px;
          height: 100vh;
          background: linear-gradient(180deg, rgba(224, 183, 104, 0.5), rgba(224, 183, 104, 0.18));
          transform: scaleY(var(--read-p, 0));
          transform-origin: top;
          pointer-events: none;
          z-index: 40;
        }

        .almanac .read-line::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: -2px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--ox);
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac .read-line {
            display: none;
          }
        }

        /* ── The desk under the hand: mouse depth ──────────────
           The page tilts a few pixels toward the reader's pointer —
           copy and figures on opposing planes, so the paper reads as
           an object on a desk, not pixels on glass. */
        .almanac .front-cluster {
          transform: translate3d(calc(var(--mx, 0) * -5px), calc(var(--my, 0) * -3px), 0);
        }

        /* ── Scroll-breath: figures drift with the reader ────────
           SKY DRIFT: --scroll-vel (Lenis velocity, -1..1, lerped back
           to rest by ClientShell) leans the figures with the scroll —
           transform only, a few px and under 2° of skew. */
        .almanac [data-drift] {
          transform: translate3d(0, calc((0.5 - var(--dp, 0.5)) * var(--drift, 14px) + var(--scroll-vel, 0) * -9px), 0)
            rotate(calc((0.5 - var(--dp, 0.5)) * var(--rock, 0.7deg)))
            skewY(calc(var(--scroll-vel, 0) * -1.4deg));
          will-change: transform;
        }

        /* ── Ambient breath ────────────────────────────────────── */
        .almanac .pan-sun {
          transform-box: fill-box;
          transform-origin: center;
          animation: alm-sun-breathe 7s ease-in-out infinite;
        }

        @keyframes alm-sun-breathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }

        .almanac .edition-line .moon-engraving {
          animation: alm-moon-bob 6s ease-in-out infinite;
        }

        @keyframes alm-moon-bob {
          0%,
          100% {
            transform: translateY(-1px);
          }
          50% {
            transform: translateY(-2.6px);
          }
        }

        .almanac .rule-star span {
          display: inline-block;
          animation: alm-star-breathe 8s ease-in-out infinite;
        }

        @keyframes alm-star-breathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.18);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac .front-cluster,
          .almanac .instrument,
          .almanac [data-drift] {
            transform: none !important;
          }
          .almanac .pan-sun,
          .almanac .edition-line .moon-engraving,
          .almanac .rule-star span {
            animation: none !important;
          }
        }

        /* ── Engraving choreography: stamps, deals, meetings ───
           Every diagram animates the way its subject behaves — glyphs
           are stamped, cards are dealt, two skies approach and meet,
           the moon waxes in. One quint-out curve throughout. */

        /* Glyphs stamp into the paper: pressure, then rest. */
        .almanac .svg-stamp {
          opacity: 0;
          transform: scale(1.5);
          transform-box: fill-box;
          transform-origin: center;
          transition:
            opacity 420ms var(--ease) calc(var(--ei, 0) * 90ms + 700ms),
            transform 420ms cubic-bezier(0.34, 1.4, 0.5, 1) calc(var(--ei, 0) * 90ms + 700ms);
        }

        .almanac .is-set .svg-stamp {
          opacity: 1;
          transform: scale(1);
        }

        /* The season wash spreads along its arc. */
        .almanac .arc-spread {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          transition: stroke-dashoffset 900ms var(--ease) 1900ms;
        }

        .almanac .is-set .arc-spread {
          stroke-dashoffset: 0;
        }

        /* The sun takes its seat: ring inscribes, then the dot drops. */
        .almanac .sun-ring {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          fill-opacity: 0;
          transition:
            stroke-dashoffset 700ms var(--ease) 2100ms,
            fill-opacity 300ms linear 2400ms;
        }

        .almanac .is-set .sun-ring {
          stroke-dashoffset: 0;
          fill-opacity: 1;
        }

        .almanac .sun-dot {
          opacity: 0;
          transform: scale(2.4);
          transform-box: fill-box;
          transform-origin: center;
          transition:
            opacity 260ms linear 2500ms,
            transform 380ms cubic-bezier(0.34, 1.5, 0.5, 1) 2500ms;
        }

        .almanac .is-set .sun-dot {
          opacity: 1;
          transform: scale(1);
        }

        /* The deal: side cards start stacked under the center card,
           then slide and turn out to the fan. */
        .almanac .deal {
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 950ms var(--ease);
        }

        .almanac .deal-l {
          transform: translate(42px, -22px) rotate(14deg);
          transition-delay: 350ms;
        }

        .almanac .deal-r {
          transform: translate(-42px, -22px) rotate(-14deg);
          transition-delay: 500ms;
        }

        .almanac .is-set .deal-l,
        .almanac .is-set .deal-r {
          transform: translate(0, 0) rotate(0deg);
        }

        /* Two skies approach until their lens forms. */
        .almanac .meet {
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 1100ms var(--ease) 250ms;
        }

        .almanac .meet-l {
          transform: translateX(-26px);
        }

        .almanac .meet-r {
          transform: translateX(26px);
        }

        .almanac .is-set .meet-l,
        .almanac .is-set .meet-r {
          transform: translateX(0);
        }

        .almanac .lens-glow,
        .almanac .lens-star {
          opacity: 0;
          transition: opacity 700ms var(--ease) 1350ms;
        }

        .almanac .is-set .lens-glow {
          opacity: 0.07;
        }

        .almanac .is-set .lens-star {
          opacity: 1;
        }

        .almanac .glyph-in {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          transition:
            opacity 600ms var(--ease) 900ms,
            transform 900ms var(--ease) 900ms;
        }

        .almanac .glyph-in-l {
          transform: translateX(-14px);
        }

        .almanac .glyph-in-r {
          transform: translateX(14px);
        }

        .almanac .is-set .glyph-in {
          opacity: 1;
          transform: translateX(0);
        }

        /* The masthead moon waxes in from its terminator. */
        .almanac .moon-engraving path {
          animation: alm-moon-wax 900ms var(--ease) 300ms backwards;
        }

        @keyframes alm-moon-wax {
          from {
            opacity: 0;
            transform: translateX(2px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .almanac .svg-stamp,
          .almanac .arc-spread,
          .almanac .sun-ring,
          .almanac .sun-dot,
          .almanac .deal,
          .almanac .meet,
          .almanac .lens-glow,
          .almanac .lens-star,
          .almanac .glyph-in {
            opacity: 1 !important;
            transform: none !important;
            stroke-dashoffset: 0 !important;
            fill-opacity: 1 !important;
            transition: none !important;
          }
          .almanac .moon-engraving path {
            animation: none !important;
          }
        }

        /* Old-style figures in running prose; tables opt back into lining. */
        .almanac {
          font-variant-numeric: oldstyle-nums;
        }

        /* ── The almanac prints as an almanac. ─────────────────── */
        @media print {
          @page {
            size: A4;
            margin: 18mm 16mm 22mm;
          }

          html,
          body {
            background: #ffffff !important;
          }

          .almanac {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #ffffff !important;
            color: #000000 !important;
          }

          .almanac::before {
            display: none !important;
          }

          /* The pressure rig writes inline weight/colour/width on the
             display letters — the paper copy gets set type, not a
             snapshot of the hand. */
          .almanac .front-display .ch {
            font-weight: 430 !important;
            color: #000000 !important;
            width: auto !important;
            text-shadow: none !important;
          }

          .almanac .front-sub .mr-i,
          .almanac .front-trust,
          .almanac .front-foot .mr-i,
          .almanac .front-pin .kicker,
          .almanac .front-ground-cap {
            color: #000000 !important;
            text-shadow: none !important;
          }

          .almanac .hl {
            color: #000000 !important;
            background: none !important;
            text-shadow: none !important;
          }

          /* The pinned sky is a screen thing — the paper copy gets
             the set type alone. */
          .almanac .front-pin {
            height: auto !important;
          }

          .almanac .front-stage {
            position: static !important;
            height: auto !important;
            overflow: visible !important;
          }

          .almanac .front {
            height: auto !important;
          }

          .almanac .sky-canvas,
          .almanac .instrument-tip {
            display: none !important;
          }

          .almanac .panorama {
            margin-top: 0 !important;
          }

          .almanac .inscribe,
          .almanac .descend,
          .almanac .colophon-print {
            display: none !important;
          }

          .almanac .print-imprint {
            display: block !important;
            text-align: center;
            margin: 8mm 0 0;
          }

          .almanac .print-imprint .pi-sig {
            font-family: var(--font-heading, "Cormorant Garamond"), serif;
            font-style: italic;
            font-size: 16pt;
            margin: 0;
          }

          .almanac .print-imprint .pi-line {
            font-family: var(--font-mono, ui-monospace), monospace;
            font-size: 6.5pt;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            margin: 2mm 0 0;
          }

          .almanac nav,
          .almanac .masthead-cta,
          .almanac .btn-ink,
          .almanac [data-screen-only],
          a[href="#main-content"] {
            display: none !important;
          }

          /* A4 is narrower than the desktop breakpoint — the edition line
             still belongs on the printed masthead. */
          .almanac .masthead-est {
            display: block !important;
            text-align: center;
          }

          .almanac .plate,
          .almanac .specimen,
          .almanac .tariff,
          .almanac .questions {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .almanac figure,
          .almanac .tariff-table,
          .almanac .letter,
          .almanac .scrap {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .almanac h1,
          .almanac h2 {
            break-after: avoid;
            page-break-after: avoid;
            color: #000000 !important;
          }

          .almanac p {
            orphans: 3;
            widows: 3;
          }

          .almanac a,
          .almanac a:visited {
            color: #000000 !important;
            text-decoration: none;
            border: none !important;
          }

          .almanac .q-row {
            break-inside: avoid;
          }

          .almanac .etch {
            stroke-dashoffset: 0 !important;
          }

          .almanac .svg-fade,
          .almanac .wheel-live,
          .almanac .counsel,
          .almanac [data-set],
          .almanac [data-act],
          .almanac :global(.oa-fade),
          .almanac :global(.oa-gilt),
          .almanac :global(.fig-caption),
          .almanac :global(.plate-copy > *) {
            opacity: 1 !important;
            transform: none !important;
          }

          .almanac :global(.oa-plate-clip) {
            clip-path: none !important;
          }

          .almanac :global(.oa-plate-in) {
            transform: none !important;
          }

          .almanac :global(.plate + .plate::before),
          .almanac :global(.plate .plate-inscribe::before) {
            transform: none !important;
          }

          .almanac .counsel-mark,
          .almanac .counsel-line,
          .almanac .wheel-breathe {
            animation: none !important;
            opacity: 1 !important;
            clip-path: none !important;
          }

          .almanac .star-thread {
            display: none !important;
          }

        }
      `}</style>
    </div>
  );
}
