/**
 * zodiac-utils.ts — Sun sign calculator + cosmic identity data + daily horoscopes
 * Pure date-range math, no API calls, no dependencies.
 */

// ─── Element types ───
export type ZodiacElement = "Fire" | "Water" | "Air" | "Earth";
export type Modality = "Cardinal" | "Fixed" | "Mutable";

export interface CosmicProfile {
  name: string;
  glyph: string;
  index: number;
  dateRange: string;
  element: ZodiacElement;
  elementEmoji: string;
  modality: Modality;
  ruler: string;
  rulerEmoji: string;
  traits: string[];
  bestMatch: string[];
  luckyNumbers: number[];
  luckyColor: string;
  luckyColorHex: string;
  luckyDay: string;
  gemstone: string;
  elementParticleColors: [string, string, string]; // CSS colors for aura
  horoscope: string;
}

// ─── Rich sign metadata ───
const SIGN_META: Record<string, Omit<CosmicProfile, "name" | "glyph" | "index" | "horoscope">> = {
  Aries: {
    dateRange: "Mar 21 — Apr 19",
    element: "Fire", elementEmoji: "🔥", modality: "Cardinal",
    ruler: "Mars", rulerEmoji: "♂",
    traits: ["Fearless pioneer with unstoppable drive", "Natural-born leader who thrives under pressure", "Passionate and fiercely loyal to their people", "Courageous spirit that inspires others to act"],
    bestMatch: ["Leo", "Sagittarius"],
    luckyNumbers: [1, 9, 17], luckyColor: "Scarlet Red", luckyColorHex: "#FF2400",
    luckyDay: "Tuesday", gemstone: "Diamond",
    elementParticleColors: ["#FF6B35", "#FF4500", "#FFD700"],
  },
  Taurus: {
    dateRange: "Apr 20 — May 20",
    element: "Earth", elementEmoji: "🌿", modality: "Fixed",
    ruler: "Venus", rulerEmoji: "♀",
    traits: ["Unshakable loyalty and quiet strength", "Refined taste for beauty and luxury", "Patient builder who turns visions into reality", "Deeply sensual connection to the physical world"],
    bestMatch: ["Virgo", "Capricorn"],
    luckyNumbers: [2, 6, 24], luckyColor: "Emerald Green", luckyColorHex: "#50C878",
    luckyDay: "Friday", gemstone: "Emerald",
    elementParticleColors: ["#7CB342", "#C6A962", "#8D6E63"],
  },
  Gemini: {
    dateRange: "May 21 — Jun 20",
    element: "Air", elementEmoji: "💨", modality: "Mutable",
    ruler: "Mercury", rulerEmoji: "☿",
    traits: ["Brilliant mind that sees all angles at once", "Effortless communicator and storyteller", "Endlessly curious with electric adaptability", "Social alchemist who connects different worlds"],
    bestMatch: ["Libra", "Aquarius"],
    luckyNumbers: [5, 7, 14], luckyColor: "Electric Yellow", luckyColorHex: "#FFD700",
    luckyDay: "Wednesday", gemstone: "Agate",
    elementParticleColors: ["#E0E0E0", "#B0BEC5", "#CFD8DC"],
  },
  Cancer: {
    dateRange: "Jun 21 — Jul 22",
    element: "Water", elementEmoji: "🌊", modality: "Cardinal",
    ruler: "Moon", rulerEmoji: "☽",
    traits: ["Emotional intelligence that reads any room", "Fierce protector of those they love", "Intuitive healer with nurturing depth", "Creates home and belonging wherever they go"],
    bestMatch: ["Scorpio", "Pisces"],
    luckyNumbers: [2, 7, 11], luckyColor: "Silver", luckyColorHex: "#C0C0C0",
    luckyDay: "Monday", gemstone: "Pearl",
    elementParticleColors: ["#4FC3F7", "#0288D1", "#80DEEA"],
  },
  Leo: {
    dateRange: "Jul 23 — Aug 22",
    element: "Fire", elementEmoji: "🔥", modality: "Fixed",
    ruler: "Sun", rulerEmoji: "☉",
    traits: ["Magnetic presence that lights up every room", "Generous heart with royal confidence", "Creative visionary who leads by inspiration", "Unwavering courage in the face of doubt"],
    bestMatch: ["Aries", "Sagittarius"],
    luckyNumbers: [1, 4, 19], luckyColor: "Gold", luckyColorHex: "#FFD700",
    luckyDay: "Sunday", gemstone: "Ruby",
    elementParticleColors: ["#FF8F00", "#FF6D00", "#FFAB00"],
  },
  Virgo: {
    dateRange: "Aug 23 — Sep 22",
    element: "Earth", elementEmoji: "🌿", modality: "Mutable",
    ruler: "Mercury", rulerEmoji: "☿",
    traits: ["Precision mind that finds order in chaos", "Quietly powerful service-oriented soul", "Master analyst with an eye for perfection", "Heals through knowledge and devoted care"],
    bestMatch: ["Taurus", "Capricorn"],
    luckyNumbers: [5, 14, 23], luckyColor: "Forest Green", luckyColorHex: "#228B22",
    luckyDay: "Wednesday", gemstone: "Sapphire",
    elementParticleColors: ["#66BB6A", "#A1887F", "#D4C79A"],
  },
  Libra: {
    dateRange: "Sep 23 — Oct 22",
    element: "Air", elementEmoji: "💨", modality: "Cardinal",
    ruler: "Venus", rulerEmoji: "♀",
    traits: ["Natural diplomat who creates harmony", "Aesthetic visionary with impeccable taste", "Fair-minded seeker of truth and justice", "Graceful connector who bridges all divides"],
    bestMatch: ["Gemini", "Aquarius"],
    luckyNumbers: [6, 15, 24], luckyColor: "Pastel Blue", luckyColorHex: "#89CFF0",
    luckyDay: "Friday", gemstone: "Opal",
    elementParticleColors: ["#ECEFF1", "#B0BEC5", "#E8EAF6"],
  },
  Scorpio: {
    dateRange: "Oct 23 — Nov 21",
    element: "Water", elementEmoji: "🌊", modality: "Fixed",
    ruler: "Pluto", rulerEmoji: "♇",
    traits: ["Penetrating insight that sees beneath all surfaces", "Transformative power that turns pain into wisdom", "Magnetic intensity that draws others in", "Unbreakable will and strategic brilliance"],
    bestMatch: ["Cancer", "Pisces"],
    luckyNumbers: [8, 11, 18], luckyColor: "Deep Crimson", luckyColorHex: "#990000",
    luckyDay: "Tuesday", gemstone: "Topaz",
    elementParticleColors: ["#1565C0", "#0D47A1", "#4DD0E1"],
  },
  Sagittarius: {
    dateRange: "Nov 22 — Dec 21",
    element: "Fire", elementEmoji: "🔥", modality: "Mutable",
    ruler: "Jupiter", rulerEmoji: "♃",
    traits: ["Boundless optimism that opens every door", "Truth-seeker on an endless quest for meaning", "Adventurous spirit that lives without limits", "Philosophical mind with infectious enthusiasm"],
    bestMatch: ["Aries", "Leo"],
    luckyNumbers: [3, 12, 21], luckyColor: "Royal Purple", luckyColorHex: "#7851A9",
    luckyDay: "Thursday", gemstone: "Turquoise",
    elementParticleColors: ["#FF7043", "#FF5722", "#FFC107"],
  },
  Capricorn: {
    dateRange: "Dec 22 — Jan 19",
    element: "Earth", elementEmoji: "🌿", modality: "Cardinal",
    ruler: "Saturn", rulerEmoji: "♄",
    traits: ["Relentless ambition with strategic patience", "Disciplined architect of lasting empires", "Quiet authority that commands respect naturally", "Timeless wisdom beyond their years"],
    bestMatch: ["Taurus", "Virgo"],
    luckyNumbers: [4, 8, 22], luckyColor: "Charcoal", luckyColorHex: "#36454F",
    luckyDay: "Saturday", gemstone: "Garnet",
    elementParticleColors: ["#8D6E63", "#A1887F", "#BCAAA4"],
  },
  Aquarius: {
    dateRange: "Jan 20 — Feb 18",
    element: "Air", elementEmoji: "💨", modality: "Fixed",
    ruler: "Uranus", rulerEmoji: "♅",
    traits: ["Visionary rebel who sees the future first", "Humanitarian heart with electric intellect", "Fearlessly authentic in a world of conformity", "Inventive genius who rewrites the rules"],
    bestMatch: ["Gemini", "Libra"],
    luckyNumbers: [4, 7, 11], luckyColor: "Electric Blue", luckyColorHex: "#00BFFF",
    luckyDay: "Saturday", gemstone: "Amethyst",
    elementParticleColors: ["#E0E0E0", "#90CAF9", "#CE93D8"],
  },
  Pisces: {
    dateRange: "Feb 19 — Mar 20",
    element: "Water", elementEmoji: "🌊", modality: "Mutable",
    ruler: "Neptune", rulerEmoji: "♆",
    traits: ["Boundless empathy that feels the world deeply", "Creative dreamer with visionary imagination", "Intuitive wisdom that transcends logic", "Spiritual depth that connects to the unseen"],
    bestMatch: ["Cancer", "Scorpio"],
    luckyNumbers: [3, 9, 12], luckyColor: "Sea Green", luckyColorHex: "#2E8B57",
    luckyDay: "Thursday", gemstone: "Aquamarine",
    elementParticleColors: ["#4FC3F7", "#26C6DA", "#80CBC4"],
  },
};

const SIGNS = [
  { name: "Capricorn",    glyph: "♑", start: [12, 22], end: [1, 19] },
  { name: "Aquarius",     glyph: "♒", start: [1, 20],  end: [2, 18] },
  { name: "Pisces",       glyph: "♓", start: [2, 19],  end: [3, 20] },
  { name: "Aries",        glyph: "♈", start: [3, 21],  end: [4, 19] },
  { name: "Taurus",       glyph: "♉", start: [4, 20],  end: [5, 20] },
  { name: "Gemini",       glyph: "♊", start: [5, 21],  end: [6, 20] },
  { name: "Cancer",       glyph: "♋", start: [6, 21],  end: [7, 22] },
  { name: "Leo",          glyph: "♌", start: [7, 23],  end: [8, 22] },
  { name: "Virgo",        glyph: "♍", start: [8, 23],  end: [9, 22] },
  { name: "Libra",        glyph: "♎", start: [9, 23],  end: [10, 22] },
  { name: "Scorpio",      glyph: "♏", start: [10, 23], end: [11, 21] },
  { name: "Sagittarius",  glyph: "♐", start: [11, 22], end: [12, 21] },
];

// Map sign names to their index in ZODIAC array (constellations.ts order)
const ZODIAC_INDEX: Record<string, number> = {
  Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3,
  Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7,
  Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
};

export function getSunSign(month: number, day: number): { name: string; glyph: string; index: number } | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  for (const sign of SIGNS) {
    const [sm, sd] = sign.start;
    const [em, ed] = sign.end;

    if (sm === em) {
      if (month === sm && day >= sd && day <= ed) {
        return { name: sign.name, glyph: sign.glyph, index: ZODIAC_INDEX[sign.name] };
      }
    } else if (sm > em) {
      // Capricorn wraps Dec→Jan
      if ((month === sm && day >= sd) || (month === em && day <= ed)) {
        return { name: sign.name, glyph: sign.glyph, index: ZODIAC_INDEX[sign.name] };
      }
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed)) {
        return { name: sign.name, glyph: sign.glyph, index: ZODIAC_INDEX[sign.name] };
      }
    }
  }
  return null;
}

// Pre-written daily horoscopes (one per sign, rotated by day-of-year)
const HOROSCOPES: Record<string, string[]> = {
  Aries: [
    "A surge of clarity arrives today. The direction you've been sensing is real — trust the impulse, but time your move with care.",
    "Old tension dissolves as Mars aligns with your ambition. What felt blocked last week now opens. Act decisively before evening.",
    "Someone from your past orbit re-enters the frame. Their timing is not coincidence — listen to what they represent, not just what they say.",
  ],
  Taurus: [
    "The ground beneath you is more solid than it feels. Today rewards patience over action — let what you've planted continue to root.",
    "A financial or material question resolves in your favour. The universe is affirming your value — accept it without deflecting.",
    "Venus draws your attention inward. What do you truly desire beneath the surface? Today's quiet holds your answer.",
  ],
  Gemini: [
    "Two paths crystallise today. You don't need to choose yet — but notice which one excites you and which one merely reassures.",
    "A conversation today carries more weight than it appears. Listen between the lines — the real message is in what isn't said.",
    "Your restlessness today is creative energy looking for a container. Write, speak, move — channel it before it scatters.",
  ],
  Cancer: [
    "Emotional clarity arrives like tide receding — suddenly you can see the ground. Trust what's revealed today.",
    "Home and inner world align. Something you've been building privately is ready to be shared. Let one person see it.",
    "The Moon illuminates a family pattern you've been repeating. Today offers the chance to choose differently.",
  ],
  Leo: [
    "Your presence today is magnetic. Others are drawn to your light — use it to elevate, not to perform. The difference matters.",
    "A creative project reaches a turning point. The vision is solid — now comes the craft. Refine with the same passion you began with.",
    "Recognition arrives from an unexpected direction. Accept it gracefully — you earned this more than you realize.",
  ],
  Virgo: [
    "The detail you've been obsessing over is the right one. Your instinct for precision serves you today — follow it to completion.",
    "Your body is sending a message your mind has been ignoring. Slow down enough to hear it. Rest is not retreat.",
    "A system you built is working better than you think. Stop optimizing for a moment and appreciate what you've created.",
  ],
  Libra: [
    "Balance today isn't about equal weight — it's about knowing which side deserves more of your attention right now.",
    "A relationship dynamic shifts subtly in your favour. You didn't force it — your fairness created the opening naturally.",
    "Beauty calls to you today in unexpected forms. Follow that aesthetic pull — it's leading you toward something important.",
  ],
  Scorpio: [
    "Something hidden becomes visible today. Your instinct to probe deeper is validated — but handle what you find with care, not force.",
    "Power dynamics shift in a key relationship. You sense it before it's spoken. Use your insight to heal, not to control.",
    "An old wound whispers for attention. Today is safe to look at it. What you transform now won't need transforming again.",
  ],
  Sagittarius: [
    "The horizon expands today. An idea, invitation, or insight opens a door you didn't know existed. Walk through it with curiosity.",
    "Your optimism is not naivety — it's a compass. Trust where it points today, even if the path isn't fully mapped.",
    "A truth you've been carrying alone finds its audience today. Speak it clearly — the right people are ready to hear it.",
  ],
  Capricorn: [
    "Today's progress is invisible but real. The mountain doesn't show its summit until you've climbed past the clouds. Keep ascending.",
    "Structure and discipline serve you, but today, allow one spontaneous choice. The best plans leave room for the unexpected.",
    "An authority figure acknowledges your work. This isn't luck — it's the compound interest of consistency finally paying out.",
  ],
  Aquarius: [
    "Your unconventional approach is about to be vindicated. What seemed strange to others was always clear to you. Stay the course.",
    "A community or group needs exactly what you offer. Today is not about fitting in — it's about standing out so the right people find you.",
    "An electric idea arrives without warning. Capture it immediately — this one has legs. Implementation can wait, but the spark won't.",
  ],
  Pisces: [
    "The boundary between intuition and imagination blurs today. Both are speaking truth — the art is knowing which to act on now.",
    "A dream from recent nights carries a real message. Revisit it today with waking eyes — the symbolism will decode itself.",
    "Your empathy is a superpower, not a weakness. Today, someone needs exactly the understanding only you can offer. Don't hold back.",
  ],
};

export function getTodayHoroscope(signName: string): string {
  const pool = HOROSCOPES[signName];
  if (!pool) return "";
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return pool[dayOfYear % pool.length];
}

/** Compute deterministic "cosmic energy" percentage for today (0–100) */
export function getCosmicEnergy(signName: string): number {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  // Simple hash: sign name chars + day → pseudo-random 60-95 range
  let hash = 0;
  for (let i = 0; i < signName.length; i++) hash = (hash * 31 + signName.charCodeAt(i)) | 0;
  hash = Math.abs((hash ^ (dayOfYear * 2654435761)) | 0);
  return 60 + (hash % 36); // 60–95
}

/** Get the full cosmic identity profile for a sign */
export function getCosmicProfile(signName: string, glyph: string, index: number): CosmicProfile | null {
  const meta = SIGN_META[signName];
  if (!meta) return null;
  return {
    name: signName,
    glyph,
    index,
    horoscope: getTodayHoroscope(signName),
    ...meta,
  };
}
