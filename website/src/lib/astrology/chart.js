/**
 * The birth chart, computed on the reader's device.
 *
 * Positions come from astronomy-engine (geocentric, true ecliptic and
 * equinox of date, aberration applied), accurate to about an arcminute.
 * Angles use apparent sidereal time and the true obliquity. Houses are
 * whole-sign. Checked against Swiss Ephemeris in astrology-chart.test.mjs.
 *
 * Plain JS with JSDoc so the node test runner can import it directly.
 */

import { Body, Ecliptic, EclipticGeoMoon, GeoVector, MakeTime, MoonPhase, SearchMoonPhase, SiderealTime, SunPosition, e_tilt } from "astronomy-engine";

export const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
export const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const ELEMENTS = ["fire", "earth", "air", "water"];
const MODALITIES = ["cardinal", "fixed", "mutable"];

/** Ten bodies in the traditional order, then the Moon's north node. */
export const BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node"];
/** @type {Record<string, string>} */
export const BODY_GLYPHS = { sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂", jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇", node: "☊", ascendant: "AC", midheaven: "MC" };
const ENGINE_BODY = { mercury: Body.Mercury, venus: Body.Venus, mars: Body.Mars, jupiter: Body.Jupiter, saturn: Body.Saturn, uranus: Body.Uranus, neptune: Body.Neptune, pluto: Body.Pluto };

/**
 * Golden Dawn correspondences, as index into the 78-card deck
 * (src/lib/academy/tarot-cards.ts carries the same values on each Major).
 */
export const SIGN_CARDS = [4, 5, 6, 7, 8, 9, 11, 13, 14, 15, 17, 18];
/** @type {Record<string, number>} */
export const BODY_CARDS = { sun: 19, moon: 2, mercury: 1, venus: 3, mars: 16, jupiter: 10, saturn: 21, uranus: 0, neptune: 12, pluto: 20 };

/** Major aspects and their orbs in degrees. */
export const ASPECTS = [
  { key: "conjunction", angle: 0, orb: 8 },
  { key: "sextile", angle: 60, orb: 5 },
  { key: "square", angle: 90, orb: 7 },
  { key: "trine", angle: 120, orb: 7 },
  { key: "opposition", angle: 180, orb: 8 },
];

const DEG = Math.PI / 180;
const norm = (x) => ((x % 360) + 360) % 360;
const wrap = (x) => { const w = norm(x); return w > 180 ? w - 360 : w; };

/** @param {number} longitude */
export function signOf(longitude) {
  const lon = norm(longitude);
  const index = Math.floor(lon / 30);
  return { index, sign: SIGNS[index], degree: lon - index * 30, element: ELEMENTS[index % 4], modality: MODALITIES[index % 3] };
}

/* ── Birth moment: local wall clock in an IANA zone → UTC instant ── */

const offsetFormats = new Map();

/** UTC offset in minutes (east positive) that `zone` observed at `utcMs`. */
export function zoneOffsetMinutes(zone, utcMs) {
  let format = offsetFormats.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", { timeZone: zone, timeZoneName: "longOffset", year: "numeric" });
    offsetFormats.set(zone, format);
  }
  const name = format.formatToParts(new Date(utcMs)).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = name.match(/GMT([+-−])(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0) + Number(match[4] ?? 0) / 60);
}

/**
 * Resolves a birth date and time in a time zone to one UTC instant.
 * `status` is "ok", "skipped" (the clocks jumped over that time; the
 * instant uses the offset in force just before) or "repeated" (the
 * clocks went back and that time happened twice; the earlier is used).
 * Without a time, noon local time stands in and `timeKnown` is false.
 *
 * @param {{ date: string, time?: string | null, zone: string }} input  date "YYYY-MM-DD", time "HH:MM"
 */
export function birthMoment({ date, time, zone }) {
  const [y, m, d] = date.split("-").map(Number);
  const timeKnown = Boolean(time);
  const [hh, mm] = timeKnown ? time.split(":").map(Number) : [12, 0];
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Date.UTC maps years 0–99 to 1900–1999; set the year explicitly.
  const wallDate = new Date(wall);
  wallDate.setUTCFullYear(y);
  const wallMs = wallDate.getTime();

  const around = [...new Set([zoneOffsetMinutes(zone, wallMs - 86_400_000), zoneOffsetMinutes(zone, wallMs + 86_400_000), zoneOffsetMinutes(zone, wallMs)])];
  const fits = around.filter((offset) => zoneOffsetMinutes(zone, wallMs - offset * 60_000) === offset).map((offset) => wallMs - offset * 60_000).sort((a, b) => a - b);
  let utcMs, status;
  if (fits.length === 0) {
    status = "skipped";
    utcMs = wallMs - zoneOffsetMinutes(zone, wallMs - 86_400_000) * 60_000;
  } else {
    status = fits.length > 1 ? "repeated" : "ok";
    utcMs = fits[0];
  }
  return { utc: new Date(utcMs), offsetMinutes: Math.round((wallMs - utcMs) / 60_000), status, timeKnown };
}

/* ── Positions ── */

/** Geocentric apparent longitude (true ecliptic of date), degrees. */
function longitudeOf(key, date) {
  if (key === "sun") return norm(SunPosition(date).elon);
  if (key === "moon") return norm(EclipticGeoMoon(date).lon);
  if (key === "node") return meanNode(date);
  return norm(Ecliptic(GeoVector(ENGINE_BODY[key], date, true)).elon);
}

/** Mean lunar ascending node (Meeus, Astronomical Algorithms 47.7). */
function meanNode(date) {
  const T = MakeTime(date).tt / 36525;
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000);
}

/** Longitude motion in degrees per day, from ±6 hours. */
function speedOf(key, date) {
  const quarter = 21_600_000;
  return wrap(longitudeOf(key, new Date(date.getTime() + quarter)) - longitudeOf(key, new Date(date.getTime() - quarter))) * 2;
}

/** Ascendant and Midheaven for an instant and place (east-positive longitude). */
export function angles(date, latitude, longitude) {
  const ramc = norm(SiderealTime(date) * 15 + longitude) * DEG;
  const eps = e_tilt(MakeTime(date)).tobl * DEG;
  const lat = latitude * DEG;
  const midheaven = norm(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG);
  let ascendant = norm(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps))) / DEG);
  // Inside the polar circles the formula can return the setting point;
  // keep the Ascendant within 180° ahead of the Midheaven, as Swiss Ephemeris does.
  if (Math.abs(latitude) >= 90 - eps / DEG && wrap(ascendant - midheaven) < 0) ascendant = norm(ascendant + 180);
  return { ascendant, midheaven };
}

/** Every body at an instant, without houses: the sky itself. */
export function skyAt(date) {
  return BODIES.map((key) => {
    const longitude = longitudeOf(key, date);
    const speed = speedOf(key, date);
    return { key, longitude, speed, retrograde: key !== "node" && speed < 0, ...signOf(longitude) };
  });
}

/** Major aspects between the ten bodies (and the angles when given), tightest first. */
export function aspectsBetween(points) {
  const found = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const separation = Math.abs(wrap(points[i].longitude - points[j].longitude));
      for (const aspect of ASPECTS) {
        const orb = Math.abs(separation - aspect.angle);
        if (orb <= aspect.orb) found.push({ a: points[i].key, b: points[j].key, aspect: aspect.key, orb });
      }
    }
  }
  return found.sort((x, y) => x.orb - y.orb);
}

/**
 * The whole chart.
 * @param {{ date: string, time?: string | null, zone: string, latitude: number, longitude: number }} birth
 */
export function birthChart(birth) {
  const moment = birthMoment(birth);
  const bodies = skyAt(moment.utc);
  let ascendant = null, midheaven = null;
  if (moment.timeKnown) {
    const found = angles(moment.utc, birth.latitude, birth.longitude);
    ascendant = { key: "ascendant", longitude: found.ascendant, ...signOf(found.ascendant), house: 1 };
    midheaven = { key: "midheaven", longitude: found.midheaven, ...signOf(found.midheaven) };
    for (const body of bodies) body.house = ((body.index - ascendant.index + 12) % 12) + 1;
    midheaven.house = ((midheaven.index - ascendant.index + 12) % 12) + 1;
  }
  const aspectPoints = bodies.filter((body) => body.key !== "node");
  const aspects = aspectsBetween(moment.timeKnown ? [...aspectPoints, ascendant, midheaven] : aspectPoints)
    // Without a birth time, aspects to the fast Moon are too uncertain to show.
    .filter((found) => moment.timeKnown || (found.a !== "moon" && found.b !== "moon"));

  // Without a time the Moon may change sign during the day: report both.
  let moonSigns = null;
  if (!moment.timeKnown) {
    const start = birthMoment({ ...birth, time: "00:00" }).utc;
    const end = new Date(birthMoment({ ...birth, time: "23:59" }).utc.getTime() + 60_000);
    const first = signOf(longitudeOf("moon", start)).sign;
    const last = signOf(longitudeOf("moon", end)).sign;
    if (first !== last) moonSigns = [first, last];
  }
  return { moment, bodies, ascendant, midheaven, aspects, moonSigns };
}

/* ── The Moon tonight ── */

const PHASES = ["new", "waxing-crescent", "first-quarter", "waxing-gibbous", "full", "waning-gibbous", "last-quarter", "waning-crescent"];

/** Phase name, lit fraction and the next new and full Moons. */
export function moonNow(date) {
  const angle = MoonPhase(date);
  const phase = PHASES[Math.floor(((angle + 22.5) % 360) / 45)];
  const lit = (1 - Math.cos(angle * DEG)) / 2;
  const next = (target) => SearchMoonPhase(target, date, 40)?.date ?? null;
  return { angle, phase, lit, nextNew: next(0), nextFull: next(180) };
}
