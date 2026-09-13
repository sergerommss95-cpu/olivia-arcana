/**
 * natal-chart.ts — Full natal chart computation
 *
 * Computes a complete astrological birth chart from date, time, and location.
 * Includes: planet positions, houses (whole-sign system), aspects with orbs,
 * dignity/detriment scoring, dominant element/modality, chart pattern detection,
 * and full personality decode.
 *
 * The birth instant is a single UT moment derived from local civil time and the
 * given UTC offset — used for planet positions AND sidereal time.
 *
 * All client-side. No API. Accurate to ~1-2° for planets (sufficient for sign/house placement).
 */

import { getAllPositions, getMoonPhase, type CelestialBody, type MoonPhaseData } from "./celestial";

// ── Types ──

export interface BirthInput {
  year: number;
  month: number;
  day: number;
  hour: number;    // 0-23
  minute: number;  // 0-59
  latitude: number;
  longitude: number;
  timezone: number; // UTC offset in hours (e.g., +2 for EET)
  timeKnown?: boolean; // default true; false = birth time unknown (no Asc/houses/MC)
  name?: string;
  city?: string;
}

export interface NatalPlanet extends CelestialBody {
  house: number;        // 1-12 (0 when houses unavailable — unknown birth time)
  dignity: Dignity;
  motion: "direct" | "retrograde" | "stationary";
}

export type Dignity = "domicile" | "exaltation" | "detriment" | "fall" | "peregrine";

export interface NatalAspect {
  planet1: string;
  planet1Glyph: string;
  planet2: string;
  planet2Glyph: string;
  type: AspectType;
  angle: number;       // exact angle between
  orb: number;         // how far from exact
  applying?: boolean;  // approaching exact (from real speeds); omitted when speeds unavailable
  harmony: "harmonious" | "tense" | "neutral";
}

export type AspectType = "conjunction" | "sextile" | "square" | "trine" | "opposition" | "quincunx";

export interface HouseData {
  number: number;    // 1-12
  sign: string;
  signGlyph: string;
  degree: number;    // cusp degree within sign
  cusp: number;      // absolute ecliptic degree (0-360)
}

export type ChartPattern = "splash" | "bundle" | "bowl" | "bucket" | "locomotive" | "seesaw" | "splay" | "balanced";

export interface ElementBalance {
  Fire: number;
  Earth: number;
  Air: number;
  Water: number;
  dominant: string;
}

export interface ModalityBalance {
  Cardinal: number;
  Fixed: number;
  Mutable: number;
  dominant: string;
}

export interface ChartAngle { sign: string; signGlyph: string; degree: number; longitude: number }

/** Full chart — birth time known (the default). */
export interface NatalChart {
  input: BirthInput;
  timeKnown: boolean;
  planets: NatalPlanet[];
  houses: HouseData[];          // whole-sign houses
  aspects: NatalAspect[];
  ascendant: ChartAngle;
  midheaven: ChartAngle;        // ecliptic MC (not RAMC)
  northNode: ChartAngle;        // Moon's mean ascending node
  moonPhase: MoonPhaseData;
  elementBalance: ElementBalance;
  modalityBalance: ModalityBalance;
  chartPattern: ChartPattern;
  dominantPlanets: string[];  // top 3 most aspected
  sunSign: string;
  moonSign: string;
  moonSignUncertain?: boolean;  // Moon changes sign during the civil birth day (unknown time)
  moonSignNote?: string;
  risingSign: string;
  bigThree: string;  // "Sun in Pisces, Moon in Cancer, Aries Rising"
  interpretation: ChartInterpretation;
}

/**
 * Chart computed without a known birth time: ascendant, midheaven, houses and
 * risingSign are OMITTED (typed as absent so consumers must distinguish).
 */
export type UntimedNatalChart = Omit<NatalChart, "ascendant" | "midheaven" | "houses" | "risingSign"> & {
  timeKnown: false;
  ascendant?: undefined;
  midheaven?: undefined;
  houses?: undefined;
  risingSign?: undefined;
};

export interface ChartInterpretation {
  summary: string;
  coreIdentity: string;   // Sun interpretation
  emotionalNature: string; // Moon interpretation
  outerPersona: string;    // Rising interpretation
  lifeTheme: string;       // Based on chart pattern + dominant element
  strengths: string[];
  challenges: string[];
  soulPurpose: string;     // North Node theme (simplified)
}

// ── Constants ──

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const SIGN_GLYPHS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const ELEMENTS: Record<string, string> = {
  Aries: "Fire", Taurus: "Earth", Gemini: "Air", Cancer: "Water",
  Leo: "Fire", Virgo: "Earth", Libra: "Air", Scorpio: "Water",
  Sagittarius: "Fire", Capricorn: "Earth", Aquarius: "Air", Pisces: "Water",
};

const MODALITIES: Record<string, string> = {
  Aries: "Cardinal", Taurus: "Fixed", Gemini: "Mutable", Cancer: "Cardinal",
  Leo: "Fixed", Virgo: "Mutable", Libra: "Cardinal", Scorpio: "Fixed",
  Sagittarius: "Mutable", Capricorn: "Cardinal", Aquarius: "Fixed", Pisces: "Mutable",
};

// ── Dignity system (traditional rulerships) ──
const DOMICILE: Record<string, string[]> = {
  Sun: ["Leo"], Moon: ["Cancer"], Mercury: ["Gemini", "Virgo"],
  Venus: ["Taurus", "Libra"], Mars: ["Aries", "Scorpio"],
  Jupiter: ["Sagittarius", "Pisces"], Saturn: ["Capricorn", "Aquarius"],
  Uranus: ["Aquarius"], Neptune: ["Pisces"], Pluto: ["Scorpio"],
};

const EXALTATION: Record<string, string> = {
  Sun: "Aries", Moon: "Taurus", Mercury: "Virgo",
  Venus: "Pisces", Mars: "Capricorn", Jupiter: "Cancer",
  Saturn: "Libra",
};

const DETRIMENT: Record<string, string[]> = {
  Sun: ["Aquarius"], Moon: ["Capricorn"], Mercury: ["Sagittarius", "Pisces"],
  Venus: ["Aries", "Scorpio"], Mars: ["Taurus", "Libra"],
  Jupiter: ["Gemini", "Virgo"], Saturn: ["Cancer", "Leo"],
  Uranus: ["Leo"], Neptune: ["Virgo"], Pluto: ["Taurus"],
};

const FALL: Record<string, string> = {
  Sun: "Libra", Moon: "Scorpio", Mercury: "Pisces",
  Venus: "Virgo", Mars: "Cancer", Jupiter: "Capricorn",
  Saturn: "Aries",
};

// ── Aspect definitions ──
const ASPECT_DEFS: { type: AspectType; angle: number; orb: number; harmony: "harmonious" | "tense" | "neutral" }[] = [
  { type: "conjunction", angle: 0, orb: 8, harmony: "neutral" },
  { type: "sextile", angle: 60, orb: 5, harmony: "harmonious" },
  { type: "square", angle: 90, orb: 7, harmony: "tense" },
  { type: "trine", angle: 120, orb: 7, harmony: "harmonious" },
  { type: "opposition", angle: 180, orb: 8, harmony: "tense" },
  { type: "quincunx", angle: 150, orb: 3, harmony: "tense" },
];

// ── Helpers ──

function signFromLongitude(lon: number): { sign: string; signGlyph: string; degree: number } {
  const normalized = ((lon % 360) + 360) % 360;
  const idx = Math.floor(normalized / 30);
  return { sign: SIGNS[idx], signGlyph: SIGN_GLYPHS[idx], degree: Math.round((normalized % 30) * 10) / 10 };
}

function getDignity(planetName: string, sign: string): Dignity {
  if (DOMICILE[planetName]?.includes(sign)) return "domicile";
  if (EXALTATION[planetName] === sign) return "exaltation";
  if (DETRIMENT[planetName]?.includes(sign)) return "detriment";
  if (FALL[planetName] === sign) return "fall";
  return "peregrine";
}

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

// ── Sidereal time / angles (all from a single UT instant) ──

const DEG = Math.PI / 180;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Days since J2000.0 (2000-01-01 12:00 UT) for a UT instant */
function daysSinceJ2000(utc: Date): number {
  return (utc.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / 86400000;
}

/** True-ish obliquity of the ecliptic, degrees */
function obliquityDeg(utc: Date): number {
  return 23.4393 - 0.0000004 * daysSinceJ2000(utc);
}

/** RAMC (= Local Sidereal Time) in DEGREES for a UT instant at east-positive longitude */
function computeRAMC(utc: Date, longitudeDeg: number): number {
  const dWhole = daysSinceJ2000(new Date(Date.UTC(
    utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), 0, 0, 0,
  )));
  const T = dWhole / 36525.0; // dWhole = JD0(0h UT) − 2451545.0 (J2000 epoch is at 12h UT)
  let GMST0 = 100.46061837 + 36000.770053608 * T + 0.000387933 * T * T;
  GMST0 = norm360(GMST0);
  const utHours = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600;
  const GMST = GMST0 + 360.98564724 * (utHours / 24);
  return norm360(GMST + longitudeDeg);
}

/**
 * Ascendant (geocentric ecliptic longitude of the eastern horizon intersection).
 * asc = atan2( cos(RAMC), -( sin(RAMC)·cos(ε) + tan(φ)·sin(ε) ) )
 */
function computeAscendant(ramcDeg: number, latitudeDeg: number, epsDeg: number): number {
  const ramc = ramcDeg * DEG, eps = epsDeg * DEG, lat = latitudeDeg * DEG;
  const asc = Math.atan2(
    Math.cos(ramc),
    -(Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)),
  ) / DEG;
  return norm360(asc);
}

/** Ecliptic Midheaven: mc = atan2( sin(RAMC), cos(RAMC)·cos(ε) ) — quadrant-consistent with RAMC */
function computeMC(ramcDeg: number, epsDeg: number): number {
  const ramc = ramcDeg * DEG, eps = epsDeg * DEG;
  const mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) / DEG;
  return norm360(mc);
}

/** Moon's mean ascending node (geocentric ecliptic longitude), degrees */
function computeMeanNode(utc: Date): number {
  return norm360(125.0445479 - 0.05295376 * daysSinceJ2000(utc));
}

// ── House cusps (whole-sign system) ──
// House 1 = the Ascendant's whole sign, starting at 0° of that sign; houses follow sign by sign.
function computeHouses(ascendantLon: number): HouseData[] {
  const ascSignIdx = Math.floor(norm360(ascendantLon) / 30);
  const houses: HouseData[] = [];
  for (let i = 0; i < 12; i++) {
    const cusp = ((ascSignIdx + i) % 12) * 30;
    const signInfo = signFromLongitude(cusp);
    houses.push({ number: i + 1, cusp, ...signInfo });
  }
  return houses;
}

function getHouse(longitude: number, houses: HouseData[]): number {
  for (let i = 0; i < 12; i++) {
    const nextIdx = (i + 1) % 12;
    const start = houses[i].cusp;
    let end = houses[nextIdx].cusp;
    if (end < start) end += 360;
    let lon = longitude;
    if (lon < start) lon += 360;
    if (lon >= start && lon < end) return i + 1;
  }
  return 1;
}

// ── Chart pattern detection (Jones patterns) ──
export function detectPattern(longitudes: number[]): ChartPattern {
  const n = longitudes.length;
  if (n < 3) return "balanced";
  const sorted = [...longitudes].map(norm360).sort((a, b) => a - b);
  // gaps[i] = empty arc after sorted[i] (circular)
  const gaps: number[] = [];
  for (let i = 0; i < n; i++) {
    const next = i === n - 1 ? sorted[0] + 360 : sorted[i + 1];
    gaps.push(next - sorted[i]);
  }
  const maxGap = Math.max(...gaps);

  // Bundle: all planets within 120° (largest empty gap ≥ 240°)
  if (maxGap >= 240) return "bundle";

  // Bucket: exactly one planet isolated ≥60° on both sides, the other nine within ~180°
  const isolated: number[] = [];
  for (let i = 0; i < n; i++) {
    const gapBefore = gaps[(i - 1 + n) % n];
    const gapAfter = gaps[i];
    if (gapBefore >= 60 && gapAfter >= 60) isolated.push(i);
  }
  if (isolated.length === 1) {
    const i = isolated[0];
    const othersSpan = 360 - gaps[(i - 1 + n) % n] - gaps[i];
    if (othersSpan <= 185) return "bucket"; // ~180° with tolerance
  }

  // Bowl: largest empty gap ≥ 180° (inclusive)
  if (maxGap >= 180) return "bowl";

  // Locomotive: largest empty gap between 120° and 180°
  if (maxGap >= 120) return "locomotive";

  const bigGaps = gaps.filter(g => g > 60).length;
  if (bigGaps >= 2 && maxGap > 100) return "seesaw";
  if (bigGaps >= 3) return "splay";
  if (maxGap < 60) return "splash";
  return "balanced";
}

// ── Interpretation engine ──

const SUN_IN: Record<string, string> = {
  Aries: "Your core identity burns with pioneering fire. You lead instinctively, crave new frontiers, and possess an unstoppable drive that inspires others to act. Your challenge is learning that patience is also a form of strength.",
  Taurus: "Your core identity is rooted in sensory wisdom and steadfast determination. You build things that last, value beauty and comfort, and possess a quiet power that moves mountains through persistence rather than force.",
  Gemini: "Your core identity is the eternal student and communicator. Your mind operates on multiple frequencies simultaneously, making connections others miss. Your gift is bridging different worlds through words and ideas.",
  Cancer: "Your core identity flows with deep emotional intelligence. You create belonging wherever you go, nurturing others with an intuitive understanding of what they need. Your strength is feeling everything — and surviving it.",
  Leo: "Your core identity radiates with creative confidence and generous warmth. You were born to express, to lead by inspiration, and to remind others of their own magnificence. Your heart is your greatest power.",
  Virgo: "Your core identity is built on precision, service, and sacred devotion to craft. You see the pattern in the chaos, the solution in the problem. Your analytical mind serves a deeply compassionate purpose.",
  Libra: "Your core identity seeks beauty, justice, and harmonious connection. You are the natural diplomat, the aesthetic visionary, the one who sees all sides. Your grace under pressure transforms conflict into art.",
  Scorpio: "Your core identity is forged in the fires of transformation. You penetrate beneath surfaces to find truth, possess unshakeable willpower, and understand that destruction is always the first step of creation.",
  Sagittarius: "Your core identity is the eternal seeker — of truth, meaning, and experience. Your optimism is philosophical, not naive. You expand every room you enter and every mind you touch.",
  Capricorn: "Your core identity is the master builder of the zodiac. You understand that lasting achievement requires structure, patience, and discipline. Time is your ally — you only grow more powerful with age.",
  Aquarius: "Your core identity is the visionary rebel. You see the future before others can imagine it, value authenticity over approval, and serve humanity through innovation. Your detachment is actually higher love.",
  Pisces: "Your core identity dissolves boundaries between self and universe. You are the mystic, the artist, the empath who feels the collective pulse. Your imagination is not escape — it's your deepest form of knowing.",
};

const MOON_IN: Record<string, string> = {
  Aries: "Emotionally, you need action and independence. Your feelings are direct, passionate, and sometimes impatient. You process emotions by doing, moving, and confronting.",
  Taurus: "Emotionally, you need stability and sensory comfort. Your feelings run deep and steady. You process through beauty, touch, nature, and the reliable rhythms of daily life.",
  Gemini: "Emotionally, you need mental stimulation and variety. You process feelings through talking, writing, and analyzing. Your emotional landscape shifts quickly — this is your agility, not instability.",
  Cancer: "Emotionally, you feel everything with oceanic depth. You need safety, intimacy, and a sanctuary to return to. Your moods follow lunar cycles — honour them as wisdom, not weakness.",
  Leo: "Emotionally, you need recognition and creative expression. You process feelings dramatically, generously, and warmly. Your emotional world is a stage — performing your truth is how you heal.",
  Virgo: "Emotionally, you need order and purpose. You process feelings by organizing, fixing, and being useful. Your anxiety is often misplaced care — learning to receive is your emotional growth edge.",
  Libra: "Emotionally, you need harmony and partnership. You process feelings through relationships and aesthetic beauty. Your challenge is not losing yourself in others' emotional needs.",
  Scorpio: "Emotionally, you experience volcanic depth. Your feelings are intense, transformative, and often hidden. You process through solitude, intimacy, and unflinching self-honesty.",
  Sagittarius: "Emotionally, you need freedom and meaning. You process feelings through adventure, philosophy, and humor. Your optimism isn't denial — it's genuine faith in life's purpose.",
  Capricorn: "Emotionally, you value control and achievement. You process feelings privately, practically, and often through work. Vulnerability feels dangerous — but it's your path to deeper connection.",
  Aquarius: "Emotionally, you need intellectual space and humanitarian purpose. You process feelings from a detached perspective. Your apparent coolness protects a deeply caring inner world.",
  Pisces: "Emotionally, you are the sponge of the zodiac — absorbing everyone's feelings. You process through art, music, solitude, and spiritual practice. Boundaries are your lifelong lesson and liberation.",
};

const RISING_IN: Record<string, string> = {
  Aries: "You enter rooms with bold, magnetic energy. First impressions: confident, direct, slightly intimidating. Your life unfolds as a hero's journey — always beginning new chapters.",
  Taurus: "You present as grounded, calm, and aesthetically aware. First impressions: reliable, attractive, soothing. Your life unfolds as a slow cultivation of beauty and value.",
  Gemini: "You present as curious, witty, and adaptable. First impressions: interesting, chatty, youthful. Your life unfolds as an endless gathering and sharing of ideas.",
  Cancer: "You present as warm, protective, and emotionally perceptive. First impressions: nurturing, gentle, approachable. Your life unfolds around themes of home, family, and belonging.",
  Leo: "You present as radiant, confident, and impossible to ignore. First impressions: charismatic, warm, commanding. Your life unfolds as a creative performance — always in the spotlight.",
  Virgo: "You present as composed, intelligent, and observant. First impressions: put-together, helpful, discerning. Your life unfolds through service, health, and the pursuit of perfection.",
  Libra: "You present as charming, balanced, and aesthetically refined. First impressions: elegant, diplomatic, attractive. Your life unfolds through partnerships and the pursuit of justice.",
  Scorpio: "You present as intense, magnetic, and penetrating. First impressions: powerful, mysterious, unforgettable. Your life unfolds through cycles of death and rebirth.",
  Sagittarius: "You present as enthusiastic, open, and philosophical. First impressions: adventurous, jovial, expansive. Your life unfolds as a quest for truth and meaning.",
  Capricorn: "You present as serious, ambitious, and capable. First impressions: mature, authoritative, trustworthy. Your life unfolds through career, status, and building lasting legacy.",
  Aquarius: "You present as unique, progressive, and intellectually stimulating. First impressions: unusual, friendly, detached. Your life unfolds through innovation and community.",
  Pisces: "You present as dreamy, compassionate, and otherworldly. First impressions: gentle, artistic, slightly elusive. Your life unfolds through imagination, empathy, and spiritual growth.",
};

const PATTERN_THEMES: Record<ChartPattern, string> = {
  splash: "You are a renaissance soul — your energy spreads across all life areas. Jack of all trades, master of adaptation. Your challenge is focus; your gift is versatility.",
  bundle: "Intensely focused energy concentrated in a narrow band of life. You are a specialist with laser precision. Your challenge is broadening perspective; your gift is depth.",
  bowl: "Half of your chart is occupied, the other half empty — creating a container that must be filled through experience. You seek what's missing and become it.",
  bucket: "Your energy funnels through a single 'handle' planet that becomes your point of purpose. Everything flows through one channel of expression.",
  locomotive: "Driven, purposeful energy with a leading planet that pulls the rest forward. You are always moving toward something. Stagnation is your kryptonite.",
  seesaw: "Life oscillates between two poles, demanding constant rebalancing. You see every perspective and must integrate opposing forces. Diplomacy is your destiny.",
  splay: "Individualistic energy spread in uneven clusters. You resist conformity and create your own categories. Your life defies easy description — and that's the point.",
  balanced: "Evenly distributed energy with no extreme concentrations. You are naturally well-rounded, adaptable, and capable of thriving in any domain.",
};

// North Node themes ("soul purpose" = growth direction of the Moon's mean node sign)
const NODE_IN: Record<string, string> = {
  Aries: "courageous self-definition — learning to act on your own behalf instead of endlessly accommodating others",
  Taurus: "embodied stability — building self-worth, patience, and simple material peace rather than living in crisis",
  Gemini: "curious exchange — asking questions, gathering perspectives, and staying a student instead of preaching certainty",
  Cancer: "emotional belonging — tending home, feeling, and care rather than hiding behind achievement and control",
  Leo: "creative self-expression — daring to be seen and to lead from the heart instead of dissolving into the crowd",
  Virgo: "devoted craft — bringing order, service, and practical skill to what was once only dreamed",
  Libra: "true partnership — learning cooperation, fairness, and the art of considering another as fully as yourself",
  Scorpio: "deep transformation — releasing comfortable attachments and trusting the power of shared depth",
  Sagittarius: "lived faith — committing to a truth and an adventure instead of drowning in endless options",
  Capricorn: "earned mastery — taking responsibility and building something lasting rather than retreating into the past",
  Aquarius: "collective vision — serving the wider circle and your own strangeness instead of performing for applause",
  Pisces: "surrendered trust — softening analysis into compassion, imagination, and spiritual flow",
};

function computeInterpretation(
  sunSign: string, moonSign: string, risingSign: string | undefined,
  pattern: ChartPattern, elementBal: ElementBalance, modalityBal: ModalityBalance,
  planets: NatalPlanet[], nodeSign: string,
): ChartInterpretation {
  const bigThreePart = risingSign
    ? `${sunSign} Sun, ${moonSign} Moon, ${risingSign} Rising`
    : `${sunSign} Sun, ${moonSign} Moon`;
  const summary = `${bigThreePart} — a ${elementBal.dominant}-dominant chart with ${modalityBal.dominant} energy and a ${pattern} pattern. This is a person who ${elementBal.dominant === "Fire" ? "leads with passion" : elementBal.dominant === "Earth" ? "builds with patience" : elementBal.dominant === "Air" ? "connects through ideas" : "navigates through feeling"}.`;

  const strengths: string[] = [];
  const challenges: string[] = [];

  // Strengths from dignified planets
  for (const p of planets) {
    if (p.dignity === "domicile") strengths.push(`${p.name} in ${p.sign}: operating at full power in its home sign`);
    if (p.dignity === "exaltation") strengths.push(`${p.name} exalted in ${p.sign}: elevated expression of ${p.name.toLowerCase()} energy`);
  }
  // Challenges from debilitated planets
  for (const p of planets) {
    if (p.dignity === "detriment") challenges.push(`${p.name} in detriment (${p.sign}): must work harder to express ${p.name.toLowerCase()} energy authentically`);
    if (p.dignity === "fall") challenges.push(`${p.name} in fall (${p.sign}): ${p.name.toLowerCase()} lessons come through difficulty and growth`);
  }

  // Add from chart pattern
  if (pattern === "bundle") challenges.push("Concentrated chart: risk of narrow perspective, need to intentionally broaden horizons");
  if (pattern === "splash") challenges.push("Scattered energy: risk of spreading too thin, need to cultivate focus and commitment");

  // Ensure at least 2 each
  if (strengths.length < 2) strengths.push(`Strong ${elementBal.dominant} element: natural ${elementBal.dominant === "Fire" ? "leader" : elementBal.dominant === "Earth" ? "builder" : elementBal.dominant === "Air" ? "communicator" : "intuitive"}`);
  if (strengths.length < 2) strengths.push(`${modalityBal.dominant} modality dominance: ${modalityBal.dominant === "Cardinal" ? "natural initiator" : modalityBal.dominant === "Fixed" ? "unshakeable determination" : "extraordinary adaptability"}`);
  if (challenges.length < 2) challenges.push(`Weaker ${["Fire","Earth","Air","Water"].find(e => elementBal[e as keyof ElementBalance] === Math.min(elementBal.Fire, elementBal.Earth, elementBal.Air, elementBal.Water)) || "Water"} element: area requiring conscious development`);

  return {
    summary,
    coreIdentity: SUN_IN[sunSign] || SUN_IN.Aries,
    emotionalNature: MOON_IN[moonSign] || MOON_IN.Aries,
    outerPersona: risingSign
      ? (RISING_IN[risingSign] || RISING_IN.Aries)
      : "Birth time unknown — the Ascendant (your outer persona) cannot be computed without it.",
    lifeTheme: PATTERN_THEMES[pattern],
    strengths: strengths.slice(0, 4),
    challenges: challenges.slice(0, 3),
    soulPurpose: `Your North Node — the Moon's ascending node — falls in ${nodeSign}. Your soul's growth direction points toward ${NODE_IN[nodeSign] || NODE_IN.Aries}. What feels unfamiliar there is precisely the path; its integration is your deepest transformation.`,
  };
}

// ── Main computation ──

/** Signed circular difference a−b in (−180, 180] */
function signedDiff(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

export function computeNatalChart(input: BirthInput & { timeKnown: false }): UntimedNatalChart;
export function computeNatalChart(input: BirthInput): NatalChart;
export function computeNatalChart(input: BirthInput): NatalChart | UntimedNatalChart {
  const timeKnown = input.timeKnown !== false;

  // ONE UT instant for everything: local civil time minus UTC offset
  const utc = new Date(
    Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute) - input.timezone * 3600e3,
  );

  // Get planet positions for the birth instant
  const bodies = getAllPositions(utc);

  // Angles (only meaningful when birth time is known)
  const eps = obliquityDeg(utc);
  const ramc = computeRAMC(utc, input.longitude);
  const ascLon = computeAscendant(ramc, input.latitude, eps);
  const ascSign = signFromLongitude(ascLon);
  const ascendant: ChartAngle = { ...ascSign, longitude: ascLon };

  // Ecliptic Midheaven (quadrant-consistent with RAMC)
  const mcLon = computeMC(ramc, eps);
  const midheaven: ChartAngle = { ...signFromLongitude(mcLon), longitude: mcLon };

  // Moon's mean north node
  const nodeLon = computeMeanNode(utc);
  const northNode: ChartAngle = { ...signFromLongitude(nodeLon), longitude: nodeLon };

  // Houses (whole-sign)
  const houses = computeHouses(ascLon);

  // Natal planets with houses + dignity
  const planets: NatalPlanet[] = bodies.map(body => {
    const speed = (body as CelestialBody & { speed?: number }).speed;
    const motion: NatalPlanet["motion"] =
      typeof speed === "number"
        ? (Math.abs(speed) < 0.01 ? "stationary" : speed < 0 ? "retrograde" : "direct")
        : (body.retrograde ? "retrograde" : "direct");
    return {
      ...body,
      house: timeKnown ? getHouse(body.longitude, houses) : 0,
      dignity: getDignity(body.name, body.sign),
      motion,
    };
  });

  // Aspects
  const aspects: NatalAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const delta = signedDiff(planets[i].longitude, planets[j].longitude);
      const diff = Math.abs(delta);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        // Tighter orbs for outer planets
        const maxOrb = (i < 2 || j < 2) ? def.orb : def.orb * 0.7;
        if (orb <= maxOrb) {
          const aspect: NatalAspect = {
            planet1: planets[i].name, planet1Glyph: planets[i].glyph,
            planet2: planets[j].name, planet2Glyph: planets[j].glyph,
            type: def.type, angle: diff,
            orb: Math.round(orb * 10) / 10,
            harmony: def.harmony,
          };
          // applying/separating from real speeds (deg/day), when available
          const s1 = (planets[i] as NatalPlanet & { speed?: number }).speed;
          const s2 = (planets[j] as NatalPlanet & { speed?: number }).speed;
          if (typeof s1 === "number" && typeof s2 === "number") {
            // d(separation)/dt; aspect applies if the separation moves toward the exact angle
            const dDiffDt = Math.sign(delta) * (s1 - s2);
            aspect.applying = (diff - def.angle) * dDiffDt < 0;
          }
          aspects.push(aspect);
          break; // only closest aspect per pair
        }
      }
    }
  }

  // Sort aspects by orb (tightest first)
  aspects.sort((a, b) => a.orb - b.orb);

  // Moon phase at birth
  const moonPhase = getMoonPhase(utc);

  // Element balance (weight: Sun=3, Moon=2.5, Asc=2.5, personal planets=2, outer=1)
  const elWeights: Record<string, number> = { Sun: 3, Moon: 2.5, Mercury: 2, Venus: 2, Mars: 2, Jupiter: 1.5, Saturn: 1.5, Uranus: 1, Neptune: 1, Pluto: 1 };
  const elScores = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of planets) {
    const el = ELEMENTS[p.sign] as keyof typeof elScores;
    if (el && el in elScores) elScores[el] += (elWeights[p.name] || 1);
  }
  const ascEl = ELEMENTS[ascSign.sign] as keyof typeof elScores;
  if (timeKnown && ascEl) elScores[ascEl] += 2.5;
  const elementBalance: ElementBalance = { ...elScores, dominant: "" };
  elementBalance.dominant = (["Fire", "Earth", "Air", "Water"] as const)
    .reduce((a, b) => elementBalance[a] > elementBalance[b] ? a : b);

  // Modality balance
  const modScores = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of planets) {
    const mod = MODALITIES[p.sign] as keyof typeof modScores;
    if (mod && mod in modScores) modScores[mod] += (elWeights[p.name] || 1);
  }
  const ascMod = MODALITIES[ascSign.sign] as keyof typeof modScores;
  if (timeKnown && ascMod) modScores[ascMod] += 2.5;
  const modalityBalance: ModalityBalance = { ...modScores, dominant: "" };
  modalityBalance.dominant = (["Cardinal", "Fixed", "Mutable"] as const)
    .reduce((a, b) => modScores[a] > modScores[b] ? a : b);

  // Chart pattern
  const chartPattern = detectPattern(planets.map(p => p.longitude));

  // Dominant planets (most aspected)
  const aspectCounts: Record<string, number> = {};
  for (const a of aspects) {
    aspectCounts[a.planet1] = (aspectCounts[a.planet1] || 0) + 1;
    aspectCounts[a.planet2] = (aspectCounts[a.planet2] || 0) + 1;
  }
  const dominantPlanets = Object.entries(aspectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const sunSign = planets[0].sign;
  const moonSign = planets[1].sign;
  const risingSign = timeKnown ? ascSign.sign : undefined;

  const interpretation = computeInterpretation(
    sunSign, moonSign, risingSign,
    chartPattern, elementBalance, modalityBalance,
    planets, northNode.sign,
  );

  const base = {
    input,
    planets,
    aspects,
    northNode,
    moonPhase,
    elementBalance,
    modalityBalance,
    chartPattern,
    dominantPlanets,
    sunSign,
    moonSign,
    interpretation,
  };

  if (!timeKnown) {
    // Moon moves ~12-15°/day: flag if it changes sign during the civil birth day
    const dayStart = new Date(Date.UTC(input.year, input.month - 1, input.day, 0, 0) - input.timezone * 3600e3);
    const dayEnd = new Date(dayStart.getTime() + 86400e3);
    const moonStart = getAllPositions(dayStart)[1];
    const moonEnd = getAllPositions(dayEnd)[1];
    const moonSignUncertain = moonStart.sign !== moonEnd.sign;
    return {
      ...base,
      timeKnown: false,
      moonSignUncertain,
      ...(moonSignUncertain ? {
        moonSignNote: `The Moon moved from ${moonStart.sign} into ${moonEnd.sign} on this day — without a birth time, the Moon sign could be either.`,
      } : {}),
      bigThree: `Sun in ${sunSign}, Moon in ${moonSign}`,
    };
  }

  return {
    ...base,
    timeKnown: true,
    houses,
    ascendant,
    midheaven,
    risingSign: ascSign.sign,
    bigThree: `Sun in ${sunSign}, Moon in ${moonSign}, ${ascSign.sign} Rising`,
  };
}

// ── Common city coordinates for quick lookup ──
export const CITY_COORDS: Record<string, { lat: number; lon: number; tz: number }> = {
  "new york": { lat: 40.71, lon: -74.01, tz: -5 },
  "los angeles": { lat: 34.05, lon: -118.24, tz: -8 },
  "london": { lat: 51.51, lon: -0.13, tz: 0 },
  "paris": { lat: 48.86, lon: 2.35, tz: 1 },
  "tokyo": { lat: 35.68, lon: 139.69, tz: 9 },
  "sydney": { lat: -33.87, lon: 151.21, tz: 10 },
  "berlin": { lat: 52.52, lon: 13.41, tz: 1 },
  "moscow": { lat: 55.76, lon: 37.62, tz: 3 },
  "kyiv": { lat: 50.45, lon: 30.52, tz: 2 },
  "odesa": { lat: 46.48, lon: 30.73, tz: 2 },
  "odessa": { lat: 46.48, lon: 30.73, tz: 2 },
  "lviv": { lat: 49.84, lon: 24.03, tz: 2 },
  "kharkiv": { lat: 49.99, lon: 36.23, tz: 2 },
  "dnipro": { lat: 48.46, lon: 35.05, tz: 2 },
  "dubai": { lat: 25.20, lon: 55.27, tz: 4 },
  "mumbai": { lat: 19.08, lon: 72.88, tz: 5.5 },
  "beijing": { lat: 39.90, lon: 116.41, tz: 8 },
  "são paulo": { lat: -23.55, lon: -46.63, tz: -3 },
  "cairo": { lat: 30.04, lon: 31.24, tz: 2 },
  "toronto": { lat: 43.65, lon: -79.38, tz: -5 },
  "chicago": { lat: 41.88, lon: -87.63, tz: -6 },
  "miami": { lat: 25.76, lon: -80.19, tz: -5 },
  "san francisco": { lat: 37.77, lon: -122.42, tz: -8 },
  "amsterdam": { lat: 52.37, lon: 4.90, tz: 1 },
  "rome": { lat: 41.90, lon: 12.50, tz: 1 },
  "bangkok": { lat: 13.76, lon: 100.50, tz: 7 },
  "seoul": { lat: 37.57, lon: 126.98, tz: 9 },
  "istanbul": { lat: 41.01, lon: 28.98, tz: 3 },
  "singapore": { lat: 1.35, lon: 103.82, tz: 8 },
  "mexico city": { lat: 19.43, lon: -99.13, tz: -6 },
  "buenos aires": { lat: -34.60, lon: -58.38, tz: -3 },
  "lagos": { lat: 6.52, lon: 3.38, tz: 1 },
  "nairobi": { lat: -1.29, lon: 36.82, tz: 3 },
  "tel aviv": { lat: 32.08, lon: 34.78, tz: 2 },
  "warsaw": { lat: 52.23, lon: 21.01, tz: 1 },
};

export function lookupCity(name: string): { lat: number; lon: number; tz: number } | null {
  return CITY_COORDS[name.toLowerCase().trim()] || null;
}
