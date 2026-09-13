/**
 * live.ts — COELUM VIVUM, the living ephemeris of the Edition.
 *
 * Herein the site's engraved heavens are set to true time: the Moon's
 * phase and berth upon the ecliptic, the five wanderers with their
 * magnitudes and zodiacal houses, risings and settings for the
 * reader's meridian — all reckoned by astronomy-engine, J2000.
 */

import {
  Body,
  EclipticGeoMoon,
  Ecliptic,
  EquatorFromVector,
  GeoMoon,
  GeoVector,
  Illumination,
  MoonPhase,
  Observer,
  SearchRiseSet,
  SiderealTime,
} from "astronomy-engine";

import { CITIES } from "@/lib/cities";

// ── Observer ────────────────────────────────────────────────────────

export interface SkyObserver {
  lat: number;
  lon: number;
  label: string;
  approx: boolean;
}

/**
 * Resolve the reader's vantage point without asking permission:
 * IANA timezone city → CITIES database. Falls back to a synthetic
 * point on the reader's meridian, or Kyiv during SSR.
 */
export function resolveObserver(): SkyObserver {
  if (typeof window === "undefined") {
    return { lat: 50.45, lon: 30.52, label: "KYIV", approx: true };
  }

  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) {
      const segment = zone.split("/").pop() ?? "";
      let cityName = segment.replace(/_/g, " ").trim();
      if (cityName.toLowerCase() === "kiev") cityName = "Kyiv";
      const q = cityName.toLowerCase();
      const city = CITIES.find((c) => c.name.toLowerCase() === q);
      if (city) {
        return {
          lat: city.lat,
          lon: city.lon,
          label: city.name.toUpperCase(),
          approx: false,
        };
      }
    }
  } catch {
    // Intl unavailable or malformed zone — fall through to meridian guess.
  }

  return {
    lat: 48.5,
    lon: (-new Date().getTimezoneOffset() / 60) * 15,
    label: "YOUR MERIDIAN",
    approx: true,
  };
}

// ── Moon ────────────────────────────────────────────────────────────

export interface MoonState {
  phaseDeg: number;
  illum: number;
  waxing: boolean;
  eclipticLon: number;
  raH: number;
  decDeg: number;
  nameEn: string;
  nameUk: string;
}

const PHASE_NAMES: ReadonlyArray<readonly [string, string]> = [
  ["New Moon", "Новий Місяць"],
  ["Waxing Crescent", "Молодик росте"],
  ["First Quarter", "Перша чверть"],
  ["Waxing Gibbous", "Прибуває"],
  ["Full Moon", "Повня"],
  ["Waning Gibbous", "Спадає"],
  ["Last Quarter", "Остання чверть"],
  ["Waning Crescent", "Старий Місяць"],
];

/** Present state of the Moon: phase, illumination, ecliptic and equatorial berths. */
export function moonState(date?: Date): MoonState {
  const t = date ?? new Date();
  const phaseDeg = MoonPhase(t);
  const illum = Illumination(Body.Moon, t).phase_fraction;
  const eclipticLon = EclipticGeoMoon(t).lon;
  // Geocentric J2000 equatorial — matches a J2000 star catalog.
  const eq = EquatorFromVector(GeoMoon(t));
  const band = Math.round(phaseDeg / 45) % 8;
  const [nameEn, nameUk] = PHASE_NAMES[band];
  return {
    phaseDeg,
    illum,
    waxing: phaseDeg < 180,
    eclipticLon,
    raH: eq.ra,
    decDeg: eq.dec,
    nameEn,
    nameUk,
  };
}

// ── Wanderers ───────────────────────────────────────────────────────

export interface Wanderer {
  key: "mercury" | "venus" | "mars" | "jupiter" | "saturn";
  nameEn: string;
  nameUk: string;
  symbol: string;
  raH: number;
  decDeg: number;
  mag: number;
  zodiacEn: string;
  zodiacUk: string;
}

const ZODIAC: ReadonlyArray<readonly [string, string]> = [
  ["Aries", "Овен"],
  ["Taurus", "Телець"],
  ["Gemini", "Близнюки"],
  ["Cancer", "Рак"],
  ["Leo", "Лев"],
  ["Virgo", "Діва"],
  ["Libra", "Терези"],
  ["Scorpio", "Скорпіон"],
  ["Sagittarius", "Стрілець"],
  ["Capricorn", "Козоріг"],
  ["Aquarius", "Водолій"],
  ["Pisces", "Риби"],
];

const PLANETS: ReadonlyArray<{
  key: Wanderer["key"];
  body: Body;
  nameEn: string;
  nameUk: string;
  symbol: string;
}> = [
  { key: "mercury", body: Body.Mercury, nameEn: "Mercury", nameUk: "Меркурій", symbol: "☿" },
  { key: "venus", body: Body.Venus, nameEn: "Venus", nameUk: "Венера", symbol: "♀" },
  { key: "mars", body: Body.Mars, nameEn: "Mars", nameUk: "Марс", symbol: "♂" },
  { key: "jupiter", body: Body.Jupiter, nameEn: "Jupiter", nameUk: "Юпітер", symbol: "♃" },
  { key: "saturn", body: Body.Saturn, nameEn: "Saturn", nameUk: "Сатурн", symbol: "♄" },
];

/** The five classical planets: positions, magnitudes, zodiacal houses. */
export function wanderers(date?: Date): Wanderer[] {
  const t = date ?? new Date();
  return PLANETS.map((p) => {
    const vec = GeoVector(p.body, t, false);
    const eq = EquatorFromVector(vec);
    const elon = Ecliptic(vec).elon;
    const signIndex = ((Math.floor(elon / 30) % 12) + 12) % 12;
    const [zodiacEn, zodiacUk] = ZODIAC[signIndex];
    return {
      key: p.key,
      nameEn: p.nameEn,
      nameUk: p.nameUk,
      symbol: p.symbol,
      raH: eq.ra,
      decDeg: eq.dec,
      mag: Illumination(p.body, t).mag,
      zodiacEn,
      zodiacUk,
    };
  });
}

// ── Rise & set ──────────────────────────────────────────────────────

/** Next moonrise and moonset within one day of the given moment. */
export function moonRiseSet(
  obs: SkyObserver,
  date?: Date
): { rise: Date | null; set: Date | null } {
  const t = date ?? new Date();
  const observer = new Observer(obs.lat, obs.lon, 0);
  const rise = SearchRiseSet(Body.Moon, observer, +1, t, 1);
  const set = SearchRiseSet(Body.Moon, observer, -1, t, 1);
  return { rise: rise ? rise.date : null, set: set ? set.date : null };
}

// ── Altitude ────────────────────────────────────────────────────────

const DEG = Math.PI / 180;

/**
 * Altitude in degrees of a catalog object (J2000 ra/dec) above the
 * observer's horizon, by the classic hour-angle formula.
 */
export function altitudeDeg(
  raH: number,
  decDeg: number,
  obs: SkyObserver,
  date?: Date
): number {
  const t = date ?? new Date();
  const gmst = SiderealTime(t); // Greenwich sidereal hours
  const lstH = gmst + obs.lon / 15;
  const hourAngleDeg = (lstH - raH) * 15;
  const sinAlt =
    Math.sin(obs.lat * DEG) * Math.sin(decDeg * DEG) +
    Math.cos(obs.lat * DEG) * Math.cos(decDeg * DEG) * Math.cos(hourAngleDeg * DEG);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) / DEG;
}

// ── Lunar odometer ──────────────────────────────────────────────────

const SIDEREAL_MONTH_DAYS = 27.321582;

/**
 * Total degrees the Moon has travelled along the ecliptic since a past
 * recorded longitude & time: whole revolutions from elapsed days,
 * corrected so the fraction matches the actual longitude difference.
 * Integer degrees, never negative.
 */
export function moonDegreesSince(
  pastEclipticLon: number,
  pastTimeMs: number,
  now?: Date
): number {
  const t = now ?? new Date();
  const elapsedDays = (t.getTime() - pastTimeMs) / 86_400_000;
  const baseline = elapsedDays * (360 / SIDEREAL_MONTH_DAYS);
  const currentLon = EclipticGeoMoon(t).lon;
  const frac = (((currentLon - pastEclipticLon) % 360) + 360) % 360;
  const total = frac + 360 * Math.round((baseline - frac) / 360);
  return Math.max(0, Math.round(total));
}
