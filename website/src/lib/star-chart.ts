/**
 * star-chart — the almanac's sky: real stars, real time, engraved on paper.
 *
 * A bright-star catalog (~90 stars, the named skeletons of ~20
 * constellations), sidereal-time math, and a zenith-centered
 * stereographic projection. Everything is pure: give it a Date and an
 * observer latitude/longitude, get back plottable positions in a unit
 * disc (r=1 is the horizon).
 *
 * Accuracy notes: catalog positions are J2000, good to ~0.1°; no
 * precession/refraction — invisible at engraving scale. The moon rides
 * the ecliptic by elongation from the sun (ignores its ±5° latitude).
 */

export interface Star {
  /** Right ascension, hours (J2000). */
  ra: number;
  /** Declination, degrees (J2000). */
  dec: number;
  /** Apparent visual magnitude. */
  mag: number;
  /** Proper name, when the star has a famous one. */
  name?: string;
}

export interface Constellation {
  name: string;
  nameUk: string;
  /** Indices into STARS; each pair-run is a polyline. */
  lines: number[][];
}

/* Catalog order matters — constellation lines index into it. */
export const STARS: Star[] = [
  // Orion 0-6
  { ra: 5.919, dec: 7.407, mag: 0.5, name: "Betelgeuse" },
  { ra: 5.242, dec: -8.202, mag: 0.13, name: "Rigel" },
  { ra: 5.418, dec: 6.35, mag: 1.64, name: "Bellatrix" },
  { ra: 5.679, dec: -1.943, mag: 1.77, name: "Alnitak" },
  { ra: 5.603, dec: -1.202, mag: 1.69, name: "Alnilam" },
  { ra: 5.533, dec: -0.299, mag: 2.23, name: "Mintaka" },
  { ra: 5.796, dec: -9.67, mag: 2.09, name: "Saiph" },
  // Canis Major / Minor 7-8
  { ra: 6.752, dec: -16.716, mag: -1.46, name: "Sirius" },
  { ra: 7.655, dec: 5.225, mag: 0.34, name: "Procyon" },
  // Taurus 9-11
  { ra: 4.599, dec: 16.509, mag: 0.85, name: "Aldebaran" },
  { ra: 5.438, dec: 28.608, mag: 1.68, name: "Elnath" },
  { ra: 3.791, dec: 24.105, mag: 2.87, name: "Alcyone" },
  // Auriga 12
  { ra: 5.278, dec: 45.998, mag: 0.08, name: "Capella" },
  // Gemini 13-14
  { ra: 7.577, dec: 31.888, mag: 1.62, name: "Castor" },
  { ra: 7.755, dec: 28.026, mag: 1.14, name: "Pollux" },
  // Leo 15-17
  { ra: 10.14, dec: 11.967, mag: 1.35, name: "Regulus" },
  { ra: 11.818, dec: 14.572, mag: 2.14, name: "Denebola" },
  { ra: 10.333, dec: 19.842, mag: 2.08, name: "Algieba" },
  // Virgo 18
  { ra: 13.42, dec: -11.161, mag: 0.97, name: "Spica" },
  // Boötes 19-20
  { ra: 14.261, dec: 19.182, mag: -0.05, name: "Arcturus" },
  { ra: 14.75, dec: 27.074, mag: 2.37, name: "Izar" },
  // Ursa Major 21-27
  { ra: 11.062, dec: 61.751, mag: 1.79, name: "Dubhe" },
  { ra: 11.031, dec: 56.382, mag: 2.37, name: "Merak" },
  { ra: 11.897, dec: 53.695, mag: 2.44, name: "Phecda" },
  { ra: 12.257, dec: 57.033, mag: 3.31, name: "Megrez" },
  { ra: 12.9, dec: 55.96, mag: 1.77, name: "Alioth" },
  { ra: 13.399, dec: 54.925, mag: 2.27, name: "Mizar" },
  { ra: 13.792, dec: 49.313, mag: 1.86, name: "Alkaid" },
  // Ursa Minor 28-30
  { ra: 2.53, dec: 89.264, mag: 1.98, name: "Polaris" },
  { ra: 14.845, dec: 74.156, mag: 2.08, name: "Kochab" },
  { ra: 15.345, dec: 71.834, mag: 3.05, name: "Pherkad" },
  // Cassiopeia 31-35
  { ra: 0.675, dec: 56.537, mag: 2.24, name: "Schedar" },
  { ra: 0.153, dec: 59.15, mag: 2.27, name: "Caph" },
  { ra: 0.945, dec: 60.717, mag: 2.47 },
  { ra: 1.43, dec: 60.235, mag: 2.68, name: "Ruchbah" },
  { ra: 1.907, dec: 63.67, mag: 3.38, name: "Segin" },
  // Cygnus 36-40
  { ra: 20.69, dec: 45.28, mag: 1.25, name: "Deneb" },
  { ra: 19.512, dec: 27.96, mag: 3.18, name: "Albireo" },
  { ra: 20.371, dec: 40.257, mag: 2.2, name: "Sadr" },
  { ra: 20.77, dec: 33.97, mag: 2.46 },
  { ra: 19.75, dec: 45.131, mag: 2.87 },
  // Lyra 41-43
  { ra: 18.616, dec: 38.784, mag: 0.03, name: "Vega" },
  { ra: 18.835, dec: 33.363, mag: 3.45, name: "Sheliak" },
  { ra: 18.982, dec: 32.69, mag: 3.24, name: "Sulafat" },
  // Aquila 44-45
  { ra: 19.846, dec: 8.868, mag: 0.77, name: "Altair" },
  { ra: 19.771, dec: 10.613, mag: 2.72, name: "Tarazed" },
  // Scorpius 46-48
  { ra: 16.49, dec: -26.432, mag: 0.96, name: "Antares" },
  { ra: 17.56, dec: -37.104, mag: 1.63, name: "Shaula" },
  { ra: 16.005, dec: -22.622, mag: 2.29, name: "Dschubba" },
  // Sagittarius 49-50
  { ra: 18.403, dec: -34.385, mag: 1.85, name: "Kaus Australis" },
  { ra: 18.921, dec: -26.297, mag: 2.06, name: "Nunki" },
  // Pegasus square + Andromeda 51-57
  { ra: 23.079, dec: 15.205, mag: 2.48, name: "Markab" },
  { ra: 23.063, dec: 28.083, mag: 2.42, name: "Scheat" },
  { ra: 0.221, dec: 15.184, mag: 2.83, name: "Algenib" },
  { ra: 0.14, dec: 29.09, mag: 2.06, name: "Alpheratz" },
  { ra: 21.736, dec: 9.875, mag: 2.4, name: "Enif" },
  { ra: 1.162, dec: 35.62, mag: 2.05, name: "Mirach" },
  { ra: 2.065, dec: 42.33, mag: 2.26, name: "Almach" },
  // Perseus 58-59
  { ra: 3.405, dec: 49.861, mag: 1.79, name: "Mirfak" },
  { ra: 3.136, dec: 40.956, mag: 2.12, name: "Algol" },
  // Ophiuchus / Hercules / CrB 60-62
  { ra: 17.582, dec: 12.56, mag: 2.07, name: "Rasalhague" },
  { ra: 16.504, dec: 21.49, mag: 2.77, name: "Kornephoros" },
  { ra: 15.578, dec: 26.715, mag: 2.23, name: "Alphecca" },
  // Piscis Austrinus / Cetus 63-64
  { ra: 22.961, dec: -29.622, mag: 1.16, name: "Fomalhaut" },
  { ra: 0.726, dec: -17.987, mag: 2.04, name: "Diphda" },
  // Zodiac fillers: Aries 65-66, Capricornus 67, Aquarius 68-69, Libra 70-71, Pisces 72, Cancer 73
  { ra: 2.12, dec: 23.463, mag: 2.0, name: "Hamal" },
  { ra: 1.911, dec: 20.808, mag: 2.64, name: "Sheratan" },
  { ra: 21.784, dec: -16.127, mag: 2.85, name: "Deneb Algedi" },
  { ra: 21.526, dec: -5.571, mag: 2.87, name: "Sadalsuud" },
  { ra: 22.096, dec: -0.32, mag: 2.94, name: "Sadalmelik" },
  { ra: 15.283, dec: -9.383, mag: 2.61, name: "Zubeneschamali" },
  { ra: 14.848, dec: -16.042, mag: 2.75, name: "Zubenelgenubi" },
  { ra: 1.525, dec: 15.346, mag: 3.62 },
  { ra: 8.745, dec: 18.154, mag: 3.94 },
  // Draco 74-76, Cepheus 77
  { ra: 17.943, dec: 51.489, mag: 2.23, name: "Eltanin" },
  { ra: 17.507, dec: 52.301, mag: 2.79, name: "Rastaban" },
  { ra: 14.073, dec: 64.376, mag: 3.65, name: "Thuban" },
  { ra: 21.31, dec: 62.585, mag: 2.51, name: "Alderamin" },
  // Gemini feet 78-79 (Alhena, Tejat) — the twins need bodies
  { ra: 6.629, dec: 16.399, mag: 1.93, name: "Alhena" },
  { ra: 6.383, dec: 22.514, mag: 2.87, name: "Tejat" },
  // Leo sickle helpers 80-81
  { ra: 10.278, dec: 23.417, mag: 3.44 },
  { ra: 9.879, dec: 26.007, mag: 2.98, name: "Algenubi" },
  // Scorpius tail joint 82
  { ra: 16.836, dec: -34.293, mag: 2.29 },
  // Hercules keystone 83-85
  { ra: 16.688, dec: 31.603, mag: 3.53 },
  { ra: 16.715, dec: 38.922, mag: 3.16 },
  { ra: 17.251, dec: 36.809, mag: 3.42 },
];

export const CONSTELLATIONS: Constellation[] = [
  { name: "Orion", nameUk: "Оріон", lines: [[2, 0, 3, 4, 5, 2], [5, 1], [3, 6]] },
  { name: "Ursa Major", nameUk: "Велика Ведмедиця", lines: [[21, 22, 23, 24, 25, 26, 27], [24, 21]] },
  { name: "Ursa Minor", nameUk: "Мала Ведмедиця", lines: [[28, 30, 29]] },
  { name: "Cassiopeia", nameUk: "Кассіопея", lines: [[32, 31, 33, 34, 35]] },
  { name: "Cygnus", nameUk: "Лебідь", lines: [[36, 38, 37], [40, 38, 39]] },
  { name: "Lyra", nameUk: "Ліра", lines: [[41, 42, 43, 41]] },
  { name: "Aquila", nameUk: "Орел", lines: [[45, 44]] },
  { name: "Scorpius", nameUk: "Скорпіон", lines: [[48, 46, 82, 47]] },
  { name: "Sagittarius", nameUk: "Стрілець", lines: [[49, 50]] },
  { name: "Taurus", nameUk: "Телець", lines: [[9, 10], [9, 11]] },
  { name: "Gemini", nameUk: "Близнюки", lines: [[13, 79, 78], [13, 14], [14, 78]] },
  { name: "Leo", nameUk: "Лев", lines: [[15, 17, 80, 81], [15, 16], [17, 16]] },
  { name: "Boötes", nameUk: "Волопас", lines: [[19, 20]] },
  { name: "Pegasus", nameUk: "Пегас", lines: [[51, 52, 54, 53, 51], [55, 51], [54, 56, 57]] },
  { name: "Perseus", nameUk: "Персей", lines: [[57, 58, 59]] },
  { name: "Andromeda", nameUk: "Андромеда", lines: [[54, 56, 57]] },
  { name: "Virgo", nameUk: "Діва", lines: [[18]] },
  { name: "Hercules", nameUk: "Геркулес", lines: [[83, 84, 85], [83, 61]] },
  { name: "Draco", nameUk: "Дракон", lines: [[74, 75], [75, 76]] },
  { name: "Piscis Austrinus", nameUk: "Південна Риба", lines: [[63]] },
];

const RAD = Math.PI / 180;

/** Greenwich mean sidereal time, hours [0,24). */
export function gmst(date: Date): number {
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86400000;
  const t = 18.697374558 + 24.06570982441908 * d;
  return ((t % 24) + 24) % 24;
}

/** Local sidereal time, hours [0,24). East longitude positive, degrees. */
export function lst(date: Date, lonDeg: number): number {
  return (((gmst(date) + lonDeg / 15) % 24) + 24) % 24;
}

export interface SkyPoint {
  /** Unit-disc coordinates: r=1 is the horizon, +y down-screen = south. */
  x: number;
  y: number;
  /** Altitude, degrees; negative = below the horizon. */
  alt: number;
}

/**
 * Project an equatorial position onto the zenith-centered stereographic
 * disc for an observer. North is up, east is LEFT — a chart of the sky
 * seen lying on one's back, the way printed planispheres are cut.
 */
export function project(raH: number, decDeg: number, lstH: number, latDeg: number): SkyPoint {
  const H = ((lstH - raH) * 15) * RAD;
  const dec = decDeg * RAD;
  const lat = latDeg * RAD;
  const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const cosAlt = Math.cos(alt);
  let x = 0;
  let y = 0;
  if (cosAlt > 1e-9) {
    const sinA = (-Math.cos(dec) * Math.sin(H)) / cosAlt;
    const cosA = (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * cosAlt);
    const r = Math.tan((Math.PI / 2 - alt) / 2) / Math.tan(Math.PI / 4); // horizon → 1
    x = -sinA * r; // east to the left
    y = -cosA * r; // north up
  }
  return { x, y, alt: alt / RAD };
}

const OBLIQUITY = 23.4393 * RAD;

/** Ecliptic longitude (deg) → equatorial RA (h) / Dec (deg). */
export function eclipticToEquatorial(lambdaDeg: number): { ra: number; dec: number } {
  const l = lambdaDeg * RAD;
  const dec = Math.asin(Math.sin(OBLIQUITY) * Math.sin(l));
  const ra = Math.atan2(Math.cos(OBLIQUITY) * Math.sin(l), Math.cos(l));
  return { ra: (((ra / RAD / 15) % 24) + 24) % 24, dec: dec / RAD };
}

/**
 * The moon's approximate ecliptic longitude from the sun's, using the
 * illuminated fraction: elongation = acos(1 − 2f), east of the sun when
 * waxing. Art-chart accuracy (±5° latitude ignored).
 */
export function moonLongitude(sunLongitude: number, fraction: number, waxing: boolean): number {
  const el = Math.acos(Math.max(-1, Math.min(1, 1 - 2 * fraction))) / RAD;
  return (((sunLongitude + (waxing ? el : -el)) % 360) + 360) % 360;
}

/* ── The Milky Way, as a stipple band ──────────────────────────
   Period atlases render the galaxy as a river of fine stipple. We
   scatter dots along the true galactic plane (north galactic pole
   RA 12.857h, Dec +27.13°), denser and wider toward the galactic
   centre in Sagittarius. Seeded PRNG: the same sky every visit —
   this is a printed chart, not a screensaver. */

export interface MilkyDot {
  ra: number;
  dec: number;
  /** 0..1 weight — size/alpha of the stipple dot. */
  w: number;
}

/** Deterministic LCG in [0,1). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function milkyWay(count = 900): MilkyDot[] {
  const rnd = lcg(20260820);
  // North galactic pole, J2000.
  const pra = 12.857 * 15 * RAD;
  const pdec = 27.13 * RAD;
  const p = [Math.cos(pdec) * Math.cos(pra), Math.cos(pdec) * Math.sin(pra), Math.sin(pdec)];
  // Basis in the galactic plane, anchored so λg=0 points at the
  // galactic centre (RA 17.761h, Dec −28.94°).
  const cra = 17.761 * 15 * RAD;
  const cdec = -28.94 * RAD;
  const c0 = [Math.cos(cdec) * Math.cos(cra), Math.cos(cdec) * Math.sin(cra), Math.sin(cdec)];
  const dotPC = p[0] * c0[0] + p[1] * c0[1] + p[2] * c0[2];
  const a = [c0[0] - dotPC * p[0], c0[1] - dotPC * p[1], c0[2] - dotPC * p[2]];
  const an = Math.hypot(a[0], a[1], a[2]);
  a[0] /= an;
  a[1] /= an;
  a[2] /= an;
  const b = [p[1] * a[2] - p[2] * a[1], p[2] * a[0] - p[0] * a[2], p[0] * a[1] - p[1] * a[0]];

  const dots: MilkyDot[] = [];
  for (let i = 0; i < count; i++) {
    const lam = rnd() * Math.PI * 2;
    // Band density and width: heavier near the centre (λg ≈ 0).
    const centreness = (1 + Math.cos(lam)) / 2;
    if (rnd() > 0.45 + 0.55 * centreness) continue;
    // Gaussian-ish scatter in galactic latitude, wider near centre.
    const spread = (5 + 6 * centreness) * RAD;
    const beta = (rnd() + rnd() + rnd() - 1.5) * spread;
    const cb = Math.cos(beta);
    const v = [
      cb * (Math.cos(lam) * a[0] + Math.sin(lam) * b[0]) + Math.sin(beta) * p[0],
      cb * (Math.cos(lam) * a[1] + Math.sin(lam) * b[1]) + Math.sin(beta) * p[1],
      cb * (Math.cos(lam) * a[2] + Math.sin(lam) * b[2]) + Math.sin(beta) * p[2],
    ];
    const dec = Math.asin(v[2]);
    const ra = Math.atan2(v[1], v[0]);
    dots.push({
      ra: ((ra / RAD / 15) % 24 + 24) % 24,
      dec: dec / RAD,
      w: 0.35 + 0.65 * centreness * rnd(),
    });
  }
  return dots;
}

/* ── Field stars ────────────────────────────────────────────────
   A second tier of anonymous mag 4.5–6 stars, uniform on the sphere,
   seeded. Invisible at rest; they resolve as the camera dives and
   under the lens — approaching the sky deepens it. */

export function fieldStars(count = 260): MilkyDot[] {
  const rnd = lcg(19270412);
  const dots: MilkyDot[] = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      ra: rnd() * 24,
      dec: (Math.asin(2 * rnd() - 1) * 180) / Math.PI,
      w: 0.3 + rnd() * 0.7,
    });
  }
  return dots;
}

/* ── Deep-sky objects ──────────────────────────────────────────
   The classic Messier furniture of a serious chart, with the period
   symbol grammar: galaxies, globulars, open clusters, nebulae. Real
   J2000 positions; the famous ones carry names for the lens. */

export interface DeepSky {
  id: string;
  ra: number;
  dec: number;
  type: "gx" | "gc" | "oc" | "nb" | "pn";
  name?: string;
  nameUk?: string;
}

export const DEEP_SKY: DeepSky[] = [
  { id: "M31", ra: 0.712, dec: 41.27, type: "gx", name: "Andromeda Galaxy", nameUk: "Галактика Андромеди" },
  { id: "M33", ra: 1.564, dec: 30.66, type: "gx" },
  { id: "M45", ra: 3.79, dec: 24.12, type: "oc", name: "Pleiades", nameUk: "Плеяди" },
  { id: "M42", ra: 5.588, dec: -5.39, type: "nb", name: "Orion Nebula", nameUk: "Туманність Оріона" },
  { id: "M44", ra: 8.67, dec: 19.67, type: "oc", name: "Praesepe", nameUk: "Ясла" },
  { id: "M81", ra: 9.926, dec: 69.07, type: "gx", name: "Bode's Galaxy", nameUk: "Галактика Боде" },
  { id: "M104", ra: 12.666, dec: -11.62, type: "gx", name: "Sombrero", nameUk: "Сомбреро" },
  { id: "M3", ra: 13.703, dec: 28.38, type: "gc" },
  { id: "M51", ra: 13.497, dec: 47.2, type: "gx", name: "Whirlpool", nameUk: "Вир" },
  { id: "M101", ra: 14.053, dec: 54.35, type: "gx" },
  { id: "M5", ra: 15.31, dec: 2.08, type: "gc" },
  { id: "M13", ra: 16.695, dec: 36.46, type: "gc", name: "Hercules Cluster", nameUk: "Скупчення Геркулеса" },
  { id: "M8", ra: 18.06, dec: -24.38, type: "nb", name: "Lagoon Nebula", nameUk: "Лагуна" },
  { id: "M22", ra: 18.606, dec: -23.9, type: "gc" },
  { id: "M11", ra: 18.85, dec: -6.27, type: "oc" },
  { id: "M57", ra: 18.885, dec: 33.03, type: "pn", name: "Ring Nebula", nameUk: "Кільцева туманність" },
  { id: "M27", ra: 19.99, dec: 22.72, type: "pn", name: "Dumbbell", nameUk: "Гантель" },
  { id: "M39", ra: 21.53, dec: 48.43, type: "oc" },
  { id: "M15", ra: 21.5, dec: 12.17, type: "gc" },
  { id: "NGC 869", ra: 2.32, dec: 57.13, type: "oc", name: "Double Cluster", nameUk: "Подвійне скупчення" },
];

/** Latin sign abbreviations, chart convention, in zodiac order. */
export const SIGN_ABBR = ["ARI", "TAU", "GEM", "CNC", "LEO", "VIR", "LIB", "SCO", "SGR", "CAP", "AQR", "PSC"];

/**
 * Inverse of the stereographic projection: screen-disc coords (unit
 * horizon) → azimuth/altitude. For the lens readout.
 */
export function unproject(x: number, y: number): { az: number; alt: number } {
  const r = Math.hypot(x, y);
  const alt = 90 - (2 * Math.atan(r)) / RAD;
  let az = Math.atan2(-x, -y) / RAD;
  az = ((az % 360) + 360) % 360;
  return { az, alt };
}

/** Solar altitude (deg) for twilight truth: >0 day, <−12 true night. */
export function sunAltitude(sunLongitude: number, date: Date, latDeg: number, lonDeg: number): number {
  const eq = eclipticToEquatorial(sunLongitude);
  return project(eq.ra, eq.dec, lst(date, lonDeg), latDeg).alt;
}
