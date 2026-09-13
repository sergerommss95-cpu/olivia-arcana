/**
 * almanac-today.ts — composes "today's edition" of the Personal Almanac.
 *
 * Client-only by design: everything here depends on the reader's clock, so
 * the page renders neutral placeholders on the server and fills this in
 * after hydration. Built on the existing astronomy in celestial.ts /
 * cosmic-time.ts (sub-degree sun longitude, moon age, planetary hours).
 */

import { getSunPosition, getMoonPhase } from "@/lib/celestial";
import { getCosmicMoment } from "@/lib/cosmic-time";

export interface AlmanacToday {
  /** "No. 231" — edition number = day of the year. */
  editionNo: string;
  /** "Tuesday, 19 August" / "вівторок, 19 серпня" (localized). */
  dateLine: string;
  /** "MMXXVI" */
  romanYear: string;
  /** Weekday alone, capitalized — nominative, for date lines. */
  weekday: string;
  /** Weekday inflected for "Counsel for …" — accusative in Ukrainian
   *  («Порада на середу»), plain lowercase weekday in English. */
  weekdayCounsel: string;
  /** Ecliptic longitude of the Sun, degrees 0–360 (0° = Aries). */
  sunLongitude: number;
  /** Index 0–11 of the sun's zodiac sign (0 = Aries). */
  seasonIndex: number;
  /** Localized "Leo season" line. */
  seasonLine: string;
  /** Moon illuminated fraction 0–1. */
  moonFraction: number;
  /** True while the moon is waxing (age below half synodic month). */
  moonWaxing: boolean;
  /** Localized moon phase name. */
  moonPhaseName: string;
  /** Localized "the hour of Mercury" line + glyph. */
  hourLine: string;
  hourGlyph: string;
  /** Counsel rotation index: day of month minus one, so 0-based (0–30). */
  counselIndex: number;
  /** Where the sun stands along the day's arc: 0 at 06:00, 1 at 21:00,
   *  clamped outside that window (dawn/dusk rest at the horizon). */
  dayFraction: number;
  /** Local "HH:MM" for the panorama's caption. */
  clock: string;
}

const SIGN_UK = [
  "Овна", "Тельця", "Близнюків", "Рака", "Лева", "Діви",
  "Терезів", "Скорпіона", "Стрільця", "Козорога", "Водолія", "Риб",
];

const SIGN_EN = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const MOON_UK: Record<string, string> = {
  "New Moon": "новий місяць",
  "Waxing Crescent": "молодий серп",
  "First Quarter": "перша чверть",
  "Waxing Gibbous": "місяць, що прибуває",
  "Full Moon": "повний місяць",
  "Waning Gibbous": "місяць, що спадає",
  "Last Quarter": "остання чверть",
  "Waning Crescent": "старий серп",
};

/** Weekdays in the accusative, keyed by Date#getDay() (0 = Sunday). */
const WEEKDAY_UK_ACC = [
  "неділю", "понеділок", "вівторок", "середу", "четвер", "п’ятницю", "суботу",
];

const PLANET_UK: Record<string, string> = {
  Saturn: "Сатурна",
  Jupiter: "Юпітера",
  Mars: "Марса",
  Sun: "Сонця",
  Venus: "Венери",
  Mercury: "Меркурія",
  Moon: "Місяця",
};

function toRoman(n: number): string {
  const table: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let rest = n;
  for (const [value, glyph] of table) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

function dayOfYear(date: Date): number {
  // UTC arithmetic on the CALENDAR date — local-time subtraction goes off
  // by one during the DST half of the year (wall-clock elapsed time is an
  // hour short after spring-forward).
  const utcDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const utcJan1 = Date.UTC(date.getFullYear(), 0, 1);
  return (utcDay - utcJan1) / 86400000 + 1;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getAlmanacToday(locale: string, date: Date = new Date()): AlmanacToday {
  const isUk = locale === "uk";
  const intl = isUk ? "uk-UA" : "en-GB";

  const sun = getSunPosition(date);
  const moon = getMoonPhase(date);
  const moment = getCosmicMoment(date);

  const sunLongitude = ((sun.longitude % 360) + 360) % 360;
  const seasonIndex = Math.floor(sunLongitude / 30) % 12;

  const weekday = capitalize(date.toLocaleDateString(intl, { weekday: "long" }));
  const dateLine = `${weekday}, ${date.toLocaleDateString(intl, { day: "numeric", month: "long" })}`;

  const planetName = moment.planetaryHour.replace("Hour of ", "");

  return {
    editionNo: `No. ${dayOfYear(date)}`,
    dateLine,
    romanYear: toRoman(date.getFullYear()),
    weekday,
    weekdayCounsel: isUk ? WEEKDAY_UK_ACC[date.getDay()] : weekday.toLowerCase(),
    sunLongitude,
    seasonIndex,
    seasonLine: isUk ? `сезон ${SIGN_UK[seasonIndex]}` : `${SIGN_EN[seasonIndex]} season`,
    moonFraction: Math.min(1, Math.max(0, moon.illumination / 100)),
    moonWaxing: moon.age < 29.53059 / 2,
    moonPhaseName: isUk ? MOON_UK[moon.phase] ?? moon.phase : moon.phase.toLowerCase(),
    // Inflected to follow «набрано в …» in the colophon.
    hourLine: isUk ? `годину ${PLANET_UK[planetName] ?? planetName}` : `the hour of ${planetName}`,
    hourGlyph: moment.planetaryHourGlyph,
    counselIndex: date.getDate() - 1,
    dayFraction: Math.min(1, Math.max(0, (date.getHours() * 60 + date.getMinutes() - 360) / 900)),
    clock: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  };
}

/**
 * moonPath — the moon's lit region as one SVG path, drawn as an engraving.
 *
 * Geometry: the outer limb is a half-circle on the lit side; the terminator
 * is a half-ellipse whose semi-minor axis is r·|2f−1|. It bows toward the
 * lit limb for crescents (f < ½) and away from it for gibbous (f > ½);
 * at f = ½ it degenerates to the vertical diameter.
 *
 * Returns "" for f ≈ 0 (new moon: nothing lit) — callers draw only the
 * outline. For f ≈ 1 the full disc is returned.
 */
export function moonPath(cx: number, cy: number, r: number, f: number, waxing: boolean): string {
  const fraction = Math.min(1, Math.max(0, f));
  if (fraction < 0.02) return "";
  if (fraction > 0.98) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  }

  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  const rx = r * Math.abs(2 * fraction - 1);

  // Outer limb: right half-circle when waxing (sweep 1 = 12→3→6 o'clock),
  // left when waning.
  const limbSweep = waxing ? 1 : 0;
  // Terminator, drawn bottom→top. SVG sweep 1 travels clockwise (6→9→12,
  // the LEFT side); sweep 0 counterclockwise (6→3→12, the RIGHT side).
  // Crescents bow toward the lit limb, gibbous away from it:
  //   waxing crescent → right → 0     waxing gibbous → left → 1
  //   waning crescent → left  → 1     waning gibbous → right → 0
  const bowsTowardLimb = fraction < 0.5;
  const terminatorSweep = waxing !== bowsTowardLimb ? 1 : 0;

  if (rx < 0.5) {
    return `M ${top} A ${r} ${r} 0 0 ${limbSweep} ${bottom} L ${top} Z`;
  }

  return `M ${top} A ${r} ${r} 0 0 ${limbSweep} ${bottom} A ${rx} ${r} 0 0 ${terminatorSweep} ${top} Z`;
}
