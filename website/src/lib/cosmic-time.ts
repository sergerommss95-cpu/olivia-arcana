/**
 * cosmic-time.ts — Cosmic Timestamp System
 *
 * Computes the current "cosmic moment" from real astronomical data:
 *   - Planetary hour (Chaldean order based on weekday + hour)
 *   - Moon phase (from celestial.ts)
 *   - Zodiac season (from Sun position)
 *   - Roman numeral date formatting
 *
 * Pure functions, no side effects. Uses existing celestial.ts math.
 */

import { getMoonPhase, getSunPosition } from "./celestial";

export interface CosmicMoment {
  /** e.g. "Hour of Venus" */
  planetaryHour: string;
  /** e.g. "~" */
  planetaryHourGlyph: string;
  /** e.g. "Waxing Crescent" */
  moonPhase: string;
  /** e.g. "moon emoji" */
  moonEmoji: string;
  /** e.g. "Aries Season" */
  season: string;
  /** e.g. "APRIL XI" */
  romanDate: string;
  /** e.g. "MMXXVI" */
  romanYear: string;
  /** e.g. "You return at the hour of Venus." */
  greeting: string;
  /** e.g. "HOUR OF VENUS . WAXING CRESCENT . ARIES SEASON . APRIL XI . MMXXVI" */
  fullStamp: string;
}

// ── Chaldean Planetary Order ──
// The 7 classical planets in descending orbital period
const CHALDEAN_ORDER = [
  { name: "Saturn", glyph: "\u2644" },
  { name: "Jupiter", glyph: "\u2643" },
  { name: "Mars", glyph: "\u2642" },
  { name: "Sun", glyph: "\u2609" },
  { name: "Venus", glyph: "\u2640" },
  { name: "Mercury", glyph: "\u263F" },
  { name: "Moon", glyph: "\u263D" },
] as const;

// Day rulers: Sun=0 (Sunday) through Sat=6
// Each day's first hour is ruled by the day's planet.
// Sunday=Sun, Monday=Moon, Tuesday=Mars, Wednesday=Mercury,
// Thursday=Jupiter, Friday=Venus, Saturday=Saturn
const DAY_RULER_INDEX: Record<number, number> = {
  0: 3, // Sunday    -> Sun (index 3 in Chaldean)
  1: 6, // Monday    -> Moon (index 6)
  2: 2, // Tuesday   -> Mars (index 2)
  3: 5, // Wednesday -> Mercury (index 5)
  4: 1, // Thursday  -> Jupiter (index 1)
  5: 4, // Friday    -> Venus (index 4)
  6: 0, // Saturday  -> Saturn (index 0)
};

function getPlanetaryHour(date: Date): { name: string; glyph: string } {
  const dayOfWeek = date.getDay();
  const hour = date.getHours();

  // The planetary hour sequence starts from the day ruler
  // and cycles through Chaldean order
  const startIndex = DAY_RULER_INDEX[dayOfWeek];
  const planetIndex = (startIndex + hour) % 7;

  return CHALDEAN_ORDER[planetIndex];
}

// ── Roman Numerals ──
function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let result = "";
  let remaining = num;
  for (let i = 0; i < vals.length; i++) {
    while (remaining >= vals[i]) {
      result += syms[i];
      remaining -= vals[i];
    }
  }
  return result;
}

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

// ── Greetings ──
const GREETINGS: Record<string, string> = {
  Saturn: "You return at the hour of Saturn. The old keeper watches.",
  Jupiter: "You return at the hour of Jupiter. Fortune opens a door.",
  Mars: "You return at the hour of Mars. Your will is a blade.",
  Sun: "You return at the hour of the Sun. All is illuminated.",
  Venus: "You return at the hour of Venus. Beauty finds you.",
  Mercury: "You return at the hour of Mercury. The message arrives.",
  Moon: "You return at the hour of the Moon. Listen to the tide.",
};

export function getCosmicMoment(date: Date = new Date()): CosmicMoment {
  // Planetary hour
  const planet = getPlanetaryHour(date);

  // Moon phase
  const moon = getMoonPhase(date);

  // Zodiac season (from Sun's sign)
  const sun = getSunPosition(date);
  const season = `${sun.sign} Season`;

  // Roman date
  const romanDate = `${MONTH_NAMES[date.getMonth()]} ${toRoman(date.getDate())}`;
  const romanYear = toRoman(date.getFullYear());

  // Greeting
  const greeting = GREETINGS[planet.name] || "You return under unknown skies.";

  // Full stamp
  const fullStamp = [
    `HOUR OF ${planet.name.toUpperCase()}`,
    moon.phase.toUpperCase(),
    season.toUpperCase(),
    romanDate,
    romanYear,
  ].join(" \u00B7 ");

  return {
    planetaryHour: `Hour of ${planet.name}`,
    planetaryHourGlyph: planet.glyph,
    moonPhase: moon.phase,
    moonEmoji: moon.emoji,
    season,
    romanDate,
    romanYear,
    greeting,
    fullStamp,
  };
}
