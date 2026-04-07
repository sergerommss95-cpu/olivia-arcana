/**
 * natal-chart.ts — Full natal chart computation
 *
 * Computes a complete astrological birth chart from date, time, and location.
 * Includes: planet positions, houses (Placidus approximation), aspects with orbs,
 * dignity/detriment scoring, dominant element/modality, chart pattern detection,
 * and full personality decode.
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
  name?: string;
  city?: string;
}

export interface NatalPlanet extends CelestialBody {
  house: number;        // 1-12
  dignity: Dignity;
  speed: "direct" | "retrograde" | "stationary";
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
  applying: boolean;   // approaching exact or separating
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

export interface NatalChart {
  input: BirthInput;
  planets: NatalPlanet[];
  houses: HouseData[];
  aspects: NatalAspect[];
  ascendant: { sign: string; signGlyph: string; degree: number; longitude: number };
  midheaven: { sign: string; signGlyph: string; degree: number; longitude: number };
  moonPhase: MoonPhaseData;
  elementBalance: ElementBalance;
  modalityBalance: ModalityBalance;
  chartPattern: ChartPattern;
  dominantPlanets: string[];  // top 3 most aspected
  sunSign: string;
  moonSign: string;
  risingSign: string;
  bigThree: string;  // "Sun in Pisces, Moon in Cancer, Aries Rising"
  interpretation: ChartInterpretation;
}

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

// ── Ascendant calculation (simplified Placidus) ──
function computeAscendant(date: Date, latitude: number, lstHours: number): number {
  // Local Sidereal Time in degrees
  const lst = (lstHours * 15) % 360;
  const latRad = latitude * Math.PI / 180;

  // RAMC (Right Ascension of Midheaven) = LST in degrees
  const ramc = lst;

  // Obliquity of ecliptic (approximate for current epoch)
  const T = ((date.getTime() / 86400000) - 10957.5) / 36525;
  const obliquity = 23.4393 - 0.013 * T;
  const oblRad = obliquity * Math.PI / 180;

  // Ascendant formula (simplified)
  const y = -Math.cos(ramc * Math.PI / 180);
  const x = Math.sin(ramc * Math.PI / 180) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;

  return asc;
}

function computeLST(date: Date, longitudeDeg: number, timezoneOffset: number): number {
  // UTC time
  const utcHours = date.getHours() - timezoneOffset + date.getMinutes() / 60;

  // Julian Date
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  let yr = y, mo = m;
  if (mo <= 2) { yr--; mo += 12; }
  const A = Math.floor(yr / 100);
  const B = 2 - A + Math.floor(A / 4);
  const JD = Math.floor(365.25 * (yr + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + B - 1524.5;

  // Greenwich Mean Sidereal Time at 0h UT
  const T = (JD - 2451545.0) / 36525.0;
  let GMST0 = 100.46061837 + 36000.770053608 * T + 0.000387933 * T * T;
  GMST0 = ((GMST0 % 360) + 360) % 360;

  // GMST at observation time
  const GMST = GMST0 + 360.98564724 * (utcHours / 24);

  // Local Sidereal Time
  const LST = ((GMST + longitudeDeg) % 360 + 360) % 360;

  return LST / 15; // return in hours
}

// ── House cusps (Equal House system from Ascendant) ──
function computeHouses(ascendantLon: number): HouseData[] {
  const houses: HouseData[] = [];
  for (let i = 0; i < 12; i++) {
    const cusp = (ascendantLon + i * 30) % 360;
    const signInfo = signFromLongitude(cusp);
    houses.push({ number: i + 1, cusp, ...signInfo });
  }
  return houses;
}

function getHouse(longitude: number, houses: HouseData[]): number {
  for (let i = 0; i < 12; i++) {
    const nextIdx = (i + 1) % 12;
    let start = houses[i].cusp;
    let end = houses[nextIdx].cusp;
    if (end < start) end += 360;
    let lon = longitude;
    if (lon < start) lon += 360;
    if (lon >= start && lon < end) return i + 1;
  }
  return 1;
}

// ── Chart pattern detection ──
function detectPattern(longitudes: number[]): ChartPattern {
  const sorted = [...longitudes].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const next = i === sorted.length - 1 ? sorted[0] + 360 : sorted[i + 1];
    gaps.push(next - sorted[i]);
  }
  const maxGap = Math.max(...gaps);
  const minGap = Math.min(...gaps);
  const spread = 360 - maxGap;

  if (maxGap > 180) {
    if (spread < 120) return "bundle";
    return "bowl";
  }
  if (maxGap > 150) return "locomotive";
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

function computeInterpretation(
  sunSign: string, moonSign: string, risingSign: string,
  pattern: ChartPattern, elementBal: ElementBalance, modalityBal: ModalityBalance,
  planets: NatalPlanet[], aspects: NatalAspect[],
): ChartInterpretation {
  const summary = `${sunSign} Sun, ${moonSign} Moon, ${risingSign} Rising — a ${elementBal.dominant}-dominant chart with ${modalityBal.dominant} energy and a ${pattern} pattern. This is a person who ${elementBal.dominant === "Fire" ? "leads with passion" : elementBal.dominant === "Earth" ? "builds with patience" : elementBal.dominant === "Air" ? "connects through ideas" : "navigates through feeling"}.`;

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
    outerPersona: RISING_IN[risingSign] || RISING_IN.Aries,
    lifeTheme: PATTERN_THEMES[pattern],
    strengths: strengths.slice(0, 4),
    challenges: challenges.slice(0, 3),
    soulPurpose: `With ${risingSign} Rising, your soul's growth direction points toward developing the qualities of your Descendant (${SIGNS[(SIGNS.indexOf(risingSign) + 6) % 12]}). You are learning to integrate what feels unfamiliar — and that integration is your deepest transformation.`,
  };
}

// ── Main computation ──

export function computeNatalChart(input: BirthInput): NatalChart {
  const birthDate = new Date(input.year, input.month - 1, input.day, input.hour, input.minute);

  // Get planet positions for birth date/time
  const bodies = getAllPositions(birthDate);

  // Compute Ascendant
  const lst = computeLST(birthDate, input.longitude, input.timezone);
  const ascLon = computeAscendant(birthDate, input.latitude, lst);
  const ascSign = signFromLongitude(ascLon);
  const ascendant = { ...ascSign, longitude: ascLon };

  // Midheaven (MC) = LST in degrees (simplified)
  const mcLon = (lst * 15) % 360;
  const mcSign = signFromLongitude(mcLon);
  const midheaven = { ...mcSign, longitude: mcLon };

  // Houses
  const houses = computeHouses(ascLon);

  // Natal planets with houses + dignity
  const planets: NatalPlanet[] = bodies.map(body => ({
    ...body,
    house: getHouse(body.longitude, houses),
    dignity: getDignity(body.name, body.sign),
    speed: body.retrograde ? "retrograde" as const : "direct" as const,
  }));

  // Aspects
  const aspects: NatalAspect[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const diff = angleDiff(planets[i].longitude, planets[j].longitude);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        // Tighter orbs for outer planets
        const maxOrb = (i < 2 || j < 2) ? def.orb : def.orb * 0.7;
        if (orb <= maxOrb) {
          aspects.push({
            planet1: planets[i].name, planet1Glyph: planets[i].glyph,
            planet2: planets[j].name, planet2Glyph: planets[j].glyph,
            type: def.type, angle: diff,
            orb: Math.round(orb * 10) / 10,
            applying: diff < def.angle, // simplified
            harmony: def.harmony,
          });
          break; // only closest aspect per pair
        }
      }
    }
  }

  // Sort aspects by orb (tightest first)
  aspects.sort((a, b) => a.orb - b.orb);

  // Moon phase at birth
  const moonPhase = getMoonPhase(birthDate);

  // Element balance (weight: Sun=3, Moon=2.5, Asc=2.5, personal planets=2, outer=1)
  const elWeights: Record<string, number> = { Sun: 3, Moon: 2.5, Mercury: 2, Venus: 2, Mars: 2, Jupiter: 1.5, Saturn: 1.5, Uranus: 1, Neptune: 1, Pluto: 1 };
  const elScores = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  for (const p of planets) {
    const el = ELEMENTS[p.sign] as keyof typeof elScores;
    if (el && el in elScores) elScores[el] += (elWeights[p.name] || 1);
  }
  const ascEl = ELEMENTS[ascSign.sign] as keyof typeof elScores;
  if (ascEl) elScores[ascEl] += 2.5;
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
  if (ascMod) modScores[ascMod] += 2.5;
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
  const risingSign = ascSign.sign;

  const interpretation = computeInterpretation(
    sunSign, moonSign, risingSign,
    chartPattern, elementBalance, modalityBalance,
    planets, aspects,
  );

  return {
    input,
    planets,
    houses,
    aspects,
    ascendant,
    midheaven,
    moonPhase,
    elementBalance,
    modalityBalance,
    chartPattern,
    dominantPlanets,
    sunSign,
    moonSign,
    risingSign,
    bigThree: `Sun in ${sunSign}, Moon in ${moonSign}, ${risingSign} Rising`,
    interpretation,
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
