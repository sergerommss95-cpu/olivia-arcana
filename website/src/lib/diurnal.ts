/**
 * diurnal.ts — when each body crosses the sky today.
 *
 * The wheel on this page answers WHERE the bodies are: their longitudes
 * along the ecliptic, which sign holds them. This file answers WHEN: at
 * what hour each one rises, culminates and sets, and how high it gets.
 * Same ephemeris, the other axis.
 *
 * Everything here is standard spherical astronomy on the longitudes
 * lib/celestial.ts already computes — no new tables, no network.
 *
 * ── On latitude ──
 * Altitude and rise/set depend on the observer's latitude, and the
 * almanac's front page has none: no birth record is needed to read it
 * and asking the browser for a fix would be an ugly first impression.
 * So the plate does what printed almanacs have always done — it states
 * the latitude it was calculated for. Longitude is taken from the
 * reader's own clock, which is exact enough for sidereal time.
 */

import { getAllPositions, type CelestialBody } from "@/lib/celestial";

/** The latitude the plate is drawn for when the reader has not set one. */
export const PLATE_LATITUDE = 50;

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Sidereal degrees per solar hour. */
const SIDEREAL_RATE = 360.98564736629 / 24;

const wrap360 = (d: number) => ((d % 360) + 360) % 360;
const wrap24 = (h: number) => ((h % 24) + 24) % 24;

/** Longitude implied by the reader's own UTC offset. */
export function observerLongitude(date: Date = new Date()): number {
  // getTimezoneOffset is minutes BEHIND UTC, so UTC+2 reports -120.
  return -date.getTimezoneOffset() / 4;
}

function julianDate(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function gmst(jd: number): number {
  const T = (jd - 2451545) / 36525;
  return wrap360(
    280.46061837 +
      360.98564736629 * (jd - 2451545) +
      T * T * 0.000387933 -
      (T * T * T) / 38710000
  );
}

export interface Equatorial {
  /** Right ascension, degrees 0–360. */
  ra: number;
  /** Declination, degrees −90…90. */
  dec: number;
}

/** Ecliptic longitude → equatorial coordinates (latitude taken as 0). */
export function toEquatorial(longitude: number, jd: number): Equatorial {
  const eps = (23.439291 - 0.0000003563 * (jd - 2451545)) * RAD;
  const l = longitude * RAD;
  return {
    ra: wrap360(Math.atan2(Math.sin(l) * Math.cos(eps), Math.cos(l)) * DEG),
    dec: Math.asin(Math.sin(eps) * Math.sin(l)) * DEG,
  };
}

export interface DiurnalTrack {
  body: CelestialBody;
  /** Local hour (0–24) the body crosses the meridian. */
  transit: number;
  /** Local hour it rises, or null when it never sets / never rises. */
  rise: number | null;
  /** Local hour it sets, or null in the same two cases. */
  set: number | null;
  /** Altitude at culmination, degrees. Negative = never clears the ground. */
  maxAltitude: number;
  /** Altitude right now, degrees. */
  altitude: number;
  /** Above the horizon at this moment. */
  up: boolean;
  /** True when the body stays up all day at this latitude. */
  circumpolar: boolean;
  /** True when it never clears the horizon today. */
  neverRises: boolean;
}

/**
 * Where one body stands in the day, for a given place.
 *
 * `transit` comes from sidereal time alone and is exact regardless of
 * latitude; `rise`/`set`/`altitude` are the parts latitude governs.
 */
export function trackFor(
  body: CelestialBody,
  date: Date,
  latitude: number,
  longitude: number
): DiurnalTrack {
  const jd = julianDate(date);
  const { ra, dec } = toEquatorial(body.longitude, jd);

  // Local sidereal time at this morning's local midnight, so transit can
  // be reported as a clock hour the reader recognises.
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  const lst0 = wrap360(gmst(julianDate(midnight)) + longitude);

  const transit = wrap24(wrap360(ra - lst0) / SIDEREAL_RATE);

  const latR = latitude * RAD;
  const decR = dec * RAD;

  // The hour angle at which the body meets the horizon. Outside ±1 it
  // never gets there: it is either always up or never up.
  const cosH = -Math.tan(latR) * Math.tan(decR);
  const circumpolar = cosH < -1;
  const neverRises = cosH > 1;
  const halfArc = circumpolar || neverRises ? null : (Math.acos(cosH) * DEG) / SIDEREAL_RATE;

  const maxAltitude = 90 - Math.abs(latitude - dec);

  // Altitude now, from the body's current hour angle.
  const lstNow = wrap360(gmst(jd) + longitude);
  const H = wrap360(lstNow - ra) * RAD;
  const sinAlt =
    Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(H);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * DEG;

  return {
    body,
    transit,
    rise: halfArc === null ? null : wrap24(transit - halfArc),
    set: halfArc === null ? null : wrap24(transit + halfArc),
    maxAltitude,
    altitude,
    up: altitude > 0,
    circumpolar,
    neverRises,
  };
}

/** The seven bodies an almanac has always printed, in Chaldean order. */
export const CLASSICAL = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];

/**
 * Every classical body's track for today, ordered as the almanac prints
 * them — slowest first, the Moon last.
 */
export function classicalTracks(
  date: Date = new Date(),
  latitude: number = PLATE_LATITUDE,
  longitude: number = observerLongitude(date)
): DiurnalTrack[] {
  const byName = new Map(getAllPositions(date).map((b) => [b.name, b]));
  return CLASSICAL.map((name) => byName.get(name))
    .filter((b): b is CelestialBody => Boolean(b))
    .map((b) => trackFor(b, date, latitude, longitude));
}

/* ── Aspects ──────────────────────────────────────────────────────
   The angles the bodies make with one another, which is the other
   thing an almanac page has always carried. Longitudes only — no
   latitude, no observer, nothing to assume. */

export interface Aspect {
  a: CelestialBody;
  b: CelestialBody;
  /** Exact angle of the aspect: 0, 60, 90, 120 or 180. */
  angle: number;
  name: string;
  glyph: string;
  /** Degrees away from exact. */
  orb: number;
}

const ASPECTS: Array<{ angle: number; name: string; glyph: string; orb: number }> = [
  { angle: 0, name: "conjunction", glyph: "☌", orb: 8 },
  { angle: 60, name: "sextile", glyph: "⚹", orb: 4 },
  { angle: 90, name: "square", glyph: "□", orb: 6 },
  { angle: 120, name: "trine", glyph: "△", orb: 6 },
  { angle: 180, name: "opposition", glyph: "☍", orb: 8 },
];

/** Every aspect standing between the classical bodies right now. */
export function aspectsAmong(bodies: CelestialBody[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      let d = Math.abs(bodies[i].longitude - bodies[j].longitude) % 360;
      if (d > 180) d = 360 - d;
      for (const asp of ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            a: bodies[i],
            b: bodies[j],
            angle: asp.angle,
            name: asp.name,
            glyph: asp.glyph,
            orb: Math.round(orb * 10) / 10,
          });
          break;
        }
      }
    }
  }
  // Tightest first — the ones actually worth printing.
  return out.sort((x, y) => x.orb - y.orb);
}

/* ── The planetary hours ──────────────────────────────────────────
   The oldest thing on any almanac page, and the one the almanac's own
   copy already speaks in ("the hour of Mercury").

   They are NOT clock hours. The daylight is cut into twelve equal
   parts and the night into twelve more, so an hour of a summer day
   runs long and an hour of its night runs short. The first hour of
   the day belongs to the planet that rules the weekday; the rest
   follow the Chaldean order, slowest planet to fastest, forever. */

const CHALDEAN: Array<{ name: string; glyph: string }> = [
  { name: "Saturn", glyph: "♄︎" },
  { name: "Jupiter", glyph: "♃︎" },
  { name: "Mars", glyph: "♂︎" },
  { name: "Sun", glyph: "☉︎" },
  { name: "Venus", glyph: "♀︎" },
  { name: "Mercury", glyph: "☿︎" },
  { name: "Moon", glyph: "☽︎" },
];

/** Chaldean index of each weekday's ruler, Sunday first. */
const DAY_RULER = [3, 6, 2, 5, 1, 4, 0];

export interface PlanetaryHour {
  index: number;
  name: string;
  glyph: string;
  /** Local hour the segment opens, 0–24. */
  start: number;
  /** Local hour it closes; may wrap past 24 for the last night hour. */
  end: number;
  /** Daylight hour rather than a night one. */
  day: boolean;
}

/**
 * The day's twenty-four unequal hours, opening at sunrise.
 *
 * `sunrise`/`sunset` are local hours — the ones trackFor returns for the
 * Sun. At latitudes where the sun does not rise or set the division has
 * no meaning, so the caller gets an empty list rather than a fiction.
 */
export function planetaryHours(
  date: Date,
  sunrise: number | null,
  sunset: number | null
): PlanetaryHour[] {
  if (sunrise === null || sunset === null) return [];

  const dayLength = wrap24(sunset - sunrise) || 24;
  const nightLength = 24 - dayLength;
  const dayHour = dayLength / 12;
  const nightHour = nightLength / 12;

  // The ruler of the first hour is the ruler of the day the SUNRISE
  // belongs to — before dawn you are still in yesterday's night hours.
  const weekday = date.getHours() < sunrise ? (date.getDay() + 6) % 7 : date.getDay();
  const first = DAY_RULER[weekday];

  return Array.from({ length: 24 }, (_, i) => {
    const day = i < 12;
    const start = day
      ? sunrise + i * dayHour
      : sunrise + dayLength + (i - 12) * nightHour;
    return {
      index: i,
      ...CHALDEAN[(first + i) % 7],
      start: start % 24,
      end: (start + (day ? dayHour : nightHour)) % 24,
      day,
    };
  });
}

/** Which of the twenty-four the reader is standing in. */
export function currentHourIndex(hours: PlanetaryHour[], nowHour: number): number {
  for (let i = 0; i < hours.length; i++) {
    const { start, end } = hours[i];
    const inside = start <= end ? nowHour >= start && nowHour < end : nowHour >= start || nowHour < end;
    if (inside) return i;
  }
  return -1;
}

/* ── Twilight ─────────────────────────────────────────────────────
   The three dusks an almanac distinguishes: civil (the sun 6° down,
   you can still read outdoors), nautical (12°, the horizon is still
   visible at sea) and astronomical (18°, true dark). */

export const TWILIGHTS = [
  { name: "civil", depth: 6 },
  { name: "nautical", depth: 12 },
  { name: "astronomical", depth: 18 },
];

/**
 * The local hours at which the sun passes a given depth below the
 * horizon, evening first. Null when it never gets that low.
 */
export function twilightBounds(
  dec: number,
  latitude: number,
  transit: number,
  depth: number
): { evening: number; morning: number } | null {
  const latR = latitude * RAD;
  const decR = dec * RAD;
  const cosH =
    (Math.sin(-depth * RAD) - Math.sin(latR) * Math.sin(decR)) /
    (Math.cos(latR) * Math.cos(decR));
  if (cosH < -1 || cosH > 1) return null;
  const half = (Math.acos(cosH) * DEG) / SIDEREAL_RATE;
  return { evening: wrap24(transit + half), morning: wrap24(transit - half) };
}

/* ── The sky itself ───────────────────────────────────────────────
   Altitude and azimuth, which is what you need to actually DRAW a
   body's path instead of stylising it. The shape that comes out is
   the real one: flat and southerly in December, tall and long in
   June, and different for the moon than for the sun on the same day.
   No ellipse can fake that. */

export interface SkyPoint {
  /** Local hour, 0–24. */
  h: number;
  /** Degrees above the horizon; negative below. */
  alt: number;
  /** Degrees clockwise from north. */
  az: number;
}

/** Horizontal coordinates of a fixed RA/Dec at a local hour. */
export function horizontalAt(
  ra: number,
  dec: number,
  hourLocal: number,
  latitude: number,
  longitude: number,
  midnight: Date
): { alt: number; az: number } {
  const t = new Date(midnight.getTime() + hourLocal * 3600000);
  const H = wrap360(wrap360(gmst(julianDate(t)) + longitude) - ra) * RAD;
  const latR = latitude * RAD;
  const decR = dec * RAD;
  const sinAlt =
    Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * DEG;
  const az = wrap360(
    Math.atan2(
      -Math.sin(H) * Math.cos(decR),
      Math.sin(decR) * Math.cos(latR) - Math.cos(decR) * Math.sin(latR) * Math.cos(H)
    ) * DEG
  );
  return { alt, az };
}

export interface SkyTrack extends DiurnalTrack {
  dec: number;
  ra: number;
  /** The whole day sampled, so the path can simply be drawn. */
  points: SkyPoint[];
  /** Where the body stands at this very moment. */
  now: { alt: number; az: number };
  /** Azimuth at rising and setting, when it does either. */
  riseAz: number | null;
  setAz: number | null;
}

/** One body's path across today's sky, sampled every twelve minutes. */
export function skyTrack(
  body: CelestialBody,
  date: Date,
  latitude: number,
  longitude: number
): SkyTrack {
  const base = trackFor(body, date, latitude, longitude);
  const jd = julianDate(date);
  const { ra, dec } = toEquatorial(body.longitude, jd);
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);

  const points: SkyPoint[] = [];
  for (let h = 0; h <= 24.0001; h += 0.2) {
    points.push({ h, ...horizontalAt(ra, dec, h, latitude, longitude, midnight) });
  }

  const nowHour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  return {
    ...base,
    ra,
    dec,
    points,
    now: horizontalAt(ra, dec, nowHour, latitude, longitude, midnight),
    riseAz: base.rise === null ? null : horizontalAt(ra, dec, base.rise, latitude, longitude, midnight).az,
    setAz: base.set === null ? null : horizontalAt(ra, dec, base.set, latitude, longitude, midnight).az,
  };
}

/* ── Everything the plate draws, in one object ────────────────── */

export interface SkyPlate {
  latitude: number;
  longitude: number;
  /** Local hour right now, fractional. */
  nowHour: number;
  sun: SkyTrack;
  moon: SkyTrack;
  moonFraction: number;
  moonWaxing: boolean;
  /** Civil / nautical / astronomical, evening and morning. */
  twilight: Array<{ name: string; depth: number; evening: number; morning: number }>;
  hours: PlanetaryHour[];
  hourIndex: number;
  /** Daylight length in hours. */
  dayLength: number;
  /** Moon − sun elongation, degrees 0–360. */
  elongation: number;
  /** Whichever of full or new moon comes first. */
  lunation: Lunation;
  /** Today's daylight minus yesterday's, hours; null at polar latitudes. */
  dayDelta: number | null;
  /** The next few things the sky will do, soonest first. */
  events: PlateEvent[];
}

/**
 * The whole figure's data for one instant. Called on the client only —
 * it depends on the reader's own clock and time zone.
 */
export function buildSkyPlate(
  date: Date = new Date(),
  latitude: number = PLATE_LATITUDE
): SkyPlate {
  const longitude = observerLongitude(date);
  const bodies = new Map(getAllPositions(date).map((b) => [b.name, b]));
  const sunBody = bodies.get("Sun")!;
  const moonBody = bodies.get("Moon")!;

  const sun = skyTrack(sunBody, date, latitude, longitude);
  const moon = skyTrack(moonBody, date, latitude, longitude);

  const twilight = TWILIGHTS.map((t) => {
    const b = twilightBounds(sun.dec, latitude, sun.transit, t.depth);
    return b ? { name: t.name, depth: t.depth, ...b } : null;
  }).filter((t): t is { name: string; depth: number; evening: number; morning: number } => t !== null);

  const hours = planetaryHours(date, sun.rise, sun.set);
  const nowHour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  // Moon phase from the sun–moon elongation: the same quantity the
  // almanac's own phase name comes from, so the two never disagree.
  const elong = wrap360(moonBody.longitude - sunBody.longitude);
  const moonFraction = (1 - Math.cos(elong * RAD)) / 2;

  const hourIndex = currentHourIndex(hours, nowHour);

  return {
    latitude,
    longitude,
    nowHour,
    sun,
    moon,
    moonFraction,
    moonWaxing: elong < 180,
    twilight,
    hours,
    hourIndex,
    dayLength: sun.rise !== null && sun.set !== null ? wrap24(sun.set - sun.rise) : 24,
    elongation: elong,
    lunation: nextLunation(elong),
    dayDelta: dayLengthDelta(date, latitude, longitude),
    events: upcomingEvents(sun, moon, twilight, hours, hourIndex, nowHour),
  };
}

/* ── What happens next ────────────────────────────────────────────
   The reason to come back tomorrow. A chart of today is a picture;
   a chart that says "the sun sets in 2h 14m, and the hour of Venus
   opens before it" is a companion. Everything here is derived from
   numbers the plate already computes — no new astronomy. */

export interface PlateEvent {
  /** Local hour it happens, 0–24. */
  h: number;
  /** Hours from now until it happens, wrapped forward. */
  dt: number;
  label: string;
  glyph: string;
}

/** Elongation gained per day — one synodic month over 360°. */
const LUNATION_RATE = 360 / 29.53059;

export interface Lunation {
  kind: "full" | "new";
  days: number;
}

/** Whichever of full or new moon comes first, in days from now. */
export function nextLunation(elongation: number): Lunation {
  const toFull = wrap360(180 - elongation) / LUNATION_RATE;
  const toNew = wrap360(360 - elongation) / LUNATION_RATE;
  return toFull <= toNew ? { kind: "full", days: toFull } : { kind: "new", days: toNew };
}

/**
 * Today's daylight minus yesterday's, in hours. Positive while the
 * days are lengthening. Null when either day never resolves a
 * sunrise (polar latitudes).
 */
export function dayLengthDelta(date: Date, latitude: number, longitude: number): number | null {
  const yesterday = new Date(date.getTime() - 86400000);
  const of = (d: Date) => {
    const sun = getAllPositions(d).find((b) => b.name === "Sun");
    if (!sun) return null;
    const t = trackFor(sun, d, latitude, longitude);
    return t.rise !== null && t.set !== null ? wrap24(t.set - t.rise) : null;
  };
  const today = of(date);
  const prior = of(yesterday);
  return today !== null && prior !== null ? today - prior : null;
}

/**
 * The next few things the sky will do, soonest first. The planetary
 * hour changing counts — it is the almanac's own unit of time.
 */
export function upcomingEvents(
  sun: DiurnalTrack,
  moon: DiurnalTrack,
  twilight: Array<{ name: string; evening: number; morning: number }>,
  hours: PlanetaryHour[],
  hourIndex: number,
  nowHour: number
): PlateEvent[] {
  const pool: Array<Omit<PlateEvent, "dt">> = [];
  const add = (h: number | null, label: string, glyph: string) => {
    if (h !== null) pool.push({ h, label, glyph });
  };

  add(sun.rise, "sunrise", "☉\uFE0E");
  add(sun.set, "sunset", "☉\uFE0E");
  add(sun.transit, "solar noon", "☉\uFE0E");
  add(moon.rise, "moonrise", "☽\uFE0E");
  add(moon.set, "moonset", "☽\uFE0E");
  const civil = twilight.find((t) => t.name === "civil");
  if (civil) {
    add(civil.evening, "civil dusk", "☉\uFE0E");
    add(civil.morning, "first light", "☉\uFE0E");
  }
  if (hourIndex >= 0 && hours.length === 24) {
    const next = hours[(hourIndex + 1) % 24];
    add(hours[hourIndex].end, `the hour of ${next.name}`, next.glyph);
  }

  return pool
    .map((e) => ({ ...e, dt: wrap24(e.h - nowHour) }))
    .filter((e) => e.dt > 0.008 && e.dt < 23.9)
    .sort((a, b) => a.dt - b.dt)
    .slice(0, 3);
}
