/**
 * synastry-engine.ts — Full synastry (compatibility) computation
 *
 * Compares two natal charts planet-by-planet to generate:
 *  - Overall compatibility score (0-100)
 *  - Category scores: love, emotion, communication, growth, challenge
 *  - Top 8 cross-chart aspects with interpretations
 *  - A synthesized verdict string
 *
 * All client-side. No API.
 */

import type { NatalChart } from "./natal-chart";

// ── Types ──

export interface SynastryResult {
  personA: { name?: string; sunSign: string; moonSign: string; risingSign: string };
  personB: { name?: string; sunSign: string; moonSign: string; risingSign: string };
  overall: number;
  scores: {
    love: number;
    emotion: number;
    communication: number;
    growth: number;
    challenge: number;
  };
  topAspects: CrossAspect[];
  verdict: string;
}

export interface CrossAspect {
  planetA: string;
  signA: string;
  planetB: string;
  signB: string;
  aspectType: string;
  orb: number;
  harmony: "harmonious" | "tense" | "neutral";
  interpretation: string;
}

// ── Aspect detection constants ──

interface AspectDef {
  type: string;
  angle: number;
  orb: number;
  harmony: "harmonious" | "tense" | "neutral";
}

const ASPECT_DEFS: AspectDef[] = [
  { type: "conjunction", angle: 0, orb: 8, harmony: "neutral" },
  { type: "sextile", angle: 60, orb: 6, harmony: "harmonious" },
  { type: "square", angle: 90, orb: 7, harmony: "tense" },
  { type: "trine", angle: 120, orb: 7, harmony: "harmonious" },
  { type: "opposition", angle: 180, orb: 8, harmony: "tense" },
];

function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

// ── Category mapping: which planet pairs feed which score ──

type ScoreCategory = "love" | "emotion" | "communication" | "growth" | "challenge";

const PLANET_CATEGORY: Record<string, ScoreCategory[]> = {
  Sun: ["love", "growth"],
  Moon: ["emotion"],
  Mercury: ["communication"],
  Venus: ["love"],
  Mars: ["love", "challenge"],
  Jupiter: ["growth"],
  Saturn: ["challenge"],
  Uranus: ["growth", "challenge"],
  Neptune: ["emotion", "love"],
  Pluto: ["challenge"],
};

// ── Interpretation strings keyed by "planetA-aspectType-planetB" ──

const INTERP: Record<string, string> = {
  // Sun aspects
  "Sun-conjunction-Sun": "Your egos and life purposes are fused. You instinctively understand each other's core motivations and share a fundamental life direction.",
  "Sun-trine-Sun": "A natural flow of mutual respect and admiration. You energize each other effortlessly and share compatible life goals.",
  "Sun-square-Sun": "Fundamental tension between your core identities creates friction — but also dynamic growth. You challenge each other to evolve.",
  "Sun-opposition-Sun": "Opposite yet complementary. You are mirrors for each other — what one lacks, the other provides, but compromise is essential.",
  "Sun-sextile-Sun": "A gentle, supportive connection between your core selves. You appreciate each other's individuality without feeling threatened.",
  "Sun-conjunction-Moon": "One of the most powerful bonds in synastry. The Sun person illuminates the Moon person's inner world, creating deep emotional belonging.",
  "Sun-trine-Moon": "Effortless emotional harmony. You naturally support each other's needs — the Sun provides direction, the Moon provides nurture.",
  "Sun-square-Moon": "Your conscious will and emotional needs clash periodically. Working through these friction points builds extraordinary intimacy.",
  "Sun-opposition-Moon": "A magnetic pull of opposites. The Sun person represents what the Moon person needs to integrate — powerful attraction with emotional tension.",

  // Venus-Mars (love/passion)
  "Venus-conjunction-Mars": "Intense romantic and physical chemistry. Venus attracts, Mars pursues — together you create electric passion that's hard to ignore.",
  "Venus-trine-Mars": "Smooth, natural attraction. Your desires and affections align beautifully — romance flows without force or game-playing.",
  "Venus-square-Mars": "Explosive chemistry with a push-pull dynamic. The tension creates irresistible attraction but requires maturity to sustain.",
  "Venus-opposition-Mars": "Powerful magnetic attraction across the zodiac. You fascinate and frustrate each other in equal measure — deeply passionate.",
  "Venus-sextile-Mars": "A gentle spark of attraction that grows with time. Affection and desire complement each other in a sustainable way.",
  "Mars-conjunction-Venus": "Raw desire meets refined love. The Mars person ignites the Venus person's deepest longings — physically and emotionally compelling.",
  "Mars-trine-Venus": "Your passion and affection flow together naturally. A deeply satisfying romantic and physical connection that feels fated.",
  "Mars-square-Venus": "Friction between desire and love creates heat. The tension is uncomfortable but undeniably magnetic.",
  "Mars-opposition-Venus": "Opposites attract powerfully. The dance between pursuit and reception never gets boring — but requires negotiation.",

  // Moon aspects (emotion)
  "Moon-conjunction-Moon": "Emotional twins. You feel the same things at the same time — extraordinary empathy, but also amplified moods.",
  "Moon-trine-Moon": "Your emotional rhythms harmonize naturally. You intuitively know how to comfort and support each other.",
  "Moon-square-Moon": "Your emotional needs conflict. What soothes one may irritate the other — growth comes from learning each other's emotional language.",
  "Moon-opposition-Moon": "Complementary emotional styles. You balance each other's emotional extremes but may struggle to meet in the middle.",
  "Moon-sextile-Moon": "A gentle emotional understanding. You give each other space while maintaining warmth — comfortable and steady.",
  "Moon-conjunction-Venus": "One of the sweetest aspects in synastry. Deep emotional tenderness, affection, and a sense of being truly loved.",
  "Moon-trine-Venus": "Natural warmth flows between you. Affection comes easily, and you genuinely enjoy each other's company and comfort.",
  "Moon-square-Venus": "Love is present but your emotional and aesthetic needs sometimes clash. Working through differences deepens the bond.",

  // Mercury aspects (communication)
  "Mercury-conjunction-Mercury": "Your minds operate on the same frequency. Conversations flow endlessly — you finish each other's thoughts and share intellectual wavelength.",
  "Mercury-trine-Mercury": "Communication is effortless. You understand each other's humor, logic, and way of processing information naturally.",
  "Mercury-square-Mercury": "Your thinking styles clash — misunderstandings happen. But the intellectual friction sparks new ideas neither would find alone.",
  "Mercury-opposition-Mercury": "Different perspectives on everything. You challenge each other's assumptions — frustrating but intellectually enriching.",
  "Mercury-sextile-Mercury": "A pleasant mental rapport. You stimulate each other's curiosity without overwhelming — good for long conversations.",

  // Jupiter aspects (growth)
  "Jupiter-conjunction-Jupiter": "You share the same vision of growth and expansion. Together you dream bigger and believe more — amplified optimism.",
  "Jupiter-trine-Jupiter": "Your philosophies and beliefs align naturally. You encourage each other's growth without pushing — expansive together.",
  "Jupiter-trine-Sun": "The Jupiter person expands the Sun person's horizons. A generous, uplifting connection that brings out the best in both.",
  "Jupiter-conjunction-Sun": "The Jupiter person magnifies the Sun person's confidence and life purpose. Together you feel larger than life.",
  "Sun-trine-Jupiter": "Mutual encouragement and optimism. You believe in each other's potential and make dreams feel achievable together.",
  "Sun-conjunction-Jupiter": "An expansive, joyful connection. The Sun person shines brighter with Jupiter's blessing — luck and growth together.",

  // Saturn aspects (challenge/commitment)
  "Saturn-conjunction-Sun": "A serious, stabilizing connection. Saturn grounds the Sun person — can feel limiting but builds lasting commitment.",
  "Saturn-square-Sun": "Tension between freedom and responsibility. The Saturn person may feel controlling; the Sun person may feel restricted. Growth through friction.",
  "Saturn-opposition-Sun": "A karmic quality to this bond. Responsibilities and commitments dominate — heavy but deeply transformative.",
  "Saturn-conjunction-Moon": "Emotional security through structure — or emotional suppression through control. The outcome depends on mutual awareness.",
  "Saturn-square-Moon": "Emotional coldness or distance can creep in. The Saturn person must learn warmth; the Moon person must develop resilience.",
  "Saturn-trine-Venus": "Love deepens over time. Saturn adds commitment and longevity to Venus's affection — a bond that ages like fine wine.",
  "Saturn-square-Venus": "Love meets duty. Affection feels tested by reality — but surviving the test creates unbreakable loyalty.",

  // Pluto aspects
  "Pluto-conjunction-Sun": "Transformative, intense, and unavoidable. The Pluto person catalyzes deep change in the Sun person — powerful and sometimes overwhelming.",
  "Pluto-square-Sun": "A power struggle that forces both people to confront their shadows. Deeply transformative if you survive the intensity.",
  "Pluto-conjunction-Venus": "Obsessive attraction. Love becomes all-consuming — this aspect creates the deepest bonds and the most dramatic breakups.",
  "Pluto-square-Venus": "Passion with possessiveness. Love triggers deep fears and desires — transformative but requires extraordinary honesty.",
  "Pluto-conjunction-Moon": "Emotionally overwhelming. The Pluto person stirs the Moon person's deepest feelings — healing and wounding are both possible.",
  "Pluto-opposition-Venus": "Magnetic, consuming attraction. Love becomes a mirror for deepest fears and desires — alchemical when handled with care.",

  // Neptune aspects
  "Neptune-conjunction-Venus": "A dream-like, romantic, almost spiritual love. Beautiful and idealistic — but requires grounding to avoid disillusionment.",
  "Neptune-trine-Venus": "Romantic idealism flows naturally. You see the best in each other — art, music, and beauty are shared languages.",
  "Neptune-square-Venus": "Idealized love that may not match reality. Beautiful illusions eventually need honest foundations.",
  "Neptune-conjunction-Moon": "Psychic emotional bond. You feel each other across distances — deeply empathetic but boundaries may dissolve.",

  // Uranus aspects
  "Uranus-conjunction-Venus": "Electric, unpredictable attraction. Exciting and liberating — but stability requires conscious effort.",
  "Uranus-opposition-Venus": "Thrilling but erratic romantic energy. Freedom and commitment must be constantly renegotiated.",
  "Uranus-square-Venus": "Exciting disruptions to love patterns. The relationship refuses to be boring — or conventional.",
};

// Fallback interpretations by aspect type
const ASPECT_FALLBACK: Record<string, string> = {
  conjunction: "A powerful fusion of energies. These planetary forces merge, amplifying each other for better or worse — demanding integration.",
  trine: "A harmonious flow between these energies. Natural compatibility that supports growth without effort — a gift in the chart.",
  square: "A dynamic tension that creates friction — and growth. This aspect demands work but produces the deepest transformation.",
  opposition: "A polarity that creates magnetic attraction and fundamental tension. You must learn to balance opposing needs.",
  sextile: "A gentle, supportive connection. Opportunities for harmony arise naturally — you bring out quiet strengths in each other.",
};

function getInterpretation(planetA: string, aspectType: string, planetB: string): string {
  return INTERP[`${planetA}-${aspectType}-${planetB}`]
    || INTERP[`${planetB}-${aspectType}-${planetA}`]
    || ASPECT_FALLBACK[aspectType]
    || "A significant cross-chart connection between your planetary energies.";
}

// ── Score helpers ──

function harmonicWeight(harmony: "harmonious" | "tense" | "neutral", orb: number, maxOrb: number): number {
  const closeness = 1 - orb / maxOrb;
  switch (harmony) {
    case "harmonious": return closeness * 1.0;
    case "neutral": return closeness * 0.6;
    case "tense": return closeness * -0.4;
  }
}

function clampScore(val: number): number {
  return Math.round(Math.max(0, Math.min(100, val)));
}

// ── Verdict generator ──

function generateVerdict(overall: number, scores: SynastryResult["scores"], personA: SynastryResult["personA"], personB: SynastryResult["personB"]): string {
  const signA = personA.sunSign;
  const signB = personB.sunSign;

  if (overall >= 85) {
    return `${signA} and ${signB} share a rare cosmic alignment. Your charts interlock with extraordinary harmony — this is a connection written in the stars. Nurture it, and it will only deepen with time.`;
  }
  if (overall >= 70) {
    return `${signA} and ${signB} bring genuine compatibility with just enough creative tension to keep things interesting. Your bond has natural strength — the areas of friction are invitations to grow together.`;
  }
  if (overall >= 55) {
    return `${signA} and ${signB} create a dynamic interplay of harmony and challenge. Neither boring nor easy — this connection has real depth for those willing to do the work.`;
  }
  if (overall >= 40) {
    return `${signA} and ${signB} face significant cosmic friction, but friction creates heat — and heat creates transformation. This bond demands growth from both of you.`;
  }
  return `${signA} and ${signB} are cosmically challenged, but the most unlikely connections sometimes forge the strongest bonds. Awareness of your differences is the first step toward bridging them.`;
}

// ── Main computation ──

export function computeSynastry(chartA: NatalChart, chartB: NatalChart): SynastryResult {
  const allAspects: CrossAspect[] = [];

  // Compare every planet in A against every planet in B (10x10)
  for (const pA of chartA.planets) {
    for (const pB of chartB.planets) {
      const diff = angleDiff(pA.longitude, pB.longitude);

      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          allAspects.push({
            planetA: pA.name,
            signA: pA.sign,
            planetB: pB.name,
            signB: pB.sign,
            aspectType: def.type,
            orb: Math.round(orb * 10) / 10,
            harmony: def.type === "conjunction"
              ? (pA.name === "Saturn" || pA.name === "Pluto" || pB.name === "Saturn" || pB.name === "Pluto" ? "tense" : "harmonious")
              : def.harmony,
            interpretation: getInterpretation(pA.name, def.type, pB.name),
          });
          break; // one aspect per pair
        }
      }
    }
  }

  // Sort by significance: tighter orbs + personal planets first
  const personalPlanets = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars"]);
  allAspects.sort((a, b) => {
    const aPersonal = (personalPlanets.has(a.planetA) ? 1 : 0) + (personalPlanets.has(a.planetB) ? 1 : 0);
    const bPersonal = (personalPlanets.has(b.planetA) ? 1 : 0) + (personalPlanets.has(b.planetB) ? 1 : 0);
    if (bPersonal !== aPersonal) return bPersonal - aPersonal;
    return a.orb - b.orb;
  });

  const topAspects = allAspects.slice(0, 8);

  // Score each category
  const categoryRaw: Record<ScoreCategory, number[]> = {
    love: [], emotion: [], communication: [], growth: [], challenge: [],
  };

  for (const asp of allAspects) {
    const categoriesA = PLANET_CATEGORY[asp.planetA] || [];
    const categoriesB = PLANET_CATEGORY[asp.planetB] || [];
    const cats = new Set([...categoriesA, ...categoriesB]);

    const maxOrb = ASPECT_DEFS.find(d => d.type === asp.aspectType)?.orb || 8;
    const weight = harmonicWeight(asp.harmony, asp.orb, maxOrb);

    for (const cat of cats) {
      categoryRaw[cat].push(weight);
    }
  }

  // Convert raw weights to 0-100 score
  function categoryScore(raw: number[]): number {
    if (raw.length === 0) return 50;
    const sum = raw.reduce((a, b) => a + b, 0);
    // Normalize: assume ~5 aspects is typical. Each can contribute -0.4 to 1.0.
    // Scale so 0 maps to 50, positive to 50-100, negative to 0-50
    const normalized = sum / Math.max(raw.length, 3);
    return clampScore(50 + normalized * 50);
  }

  const scores = {
    love: categoryScore(categoryRaw.love),
    emotion: categoryScore(categoryRaw.emotion),
    communication: categoryScore(categoryRaw.communication),
    growth: categoryScore(categoryRaw.growth),
    challenge: categoryScore(categoryRaw.challenge),
  };

  // Overall = weighted average (challenge is inverted — high challenge = lower overall)
  const overall = clampScore(
    scores.love * 0.30 +
    scores.emotion * 0.25 +
    scores.communication * 0.20 +
    scores.growth * 0.15 +
    (100 - scores.challenge) * 0.10
  );

  const personA = {
    name: chartA.input.name,
    sunSign: chartA.sunSign,
    moonSign: chartA.moonSign,
    risingSign: chartA.risingSign,
  };

  const personB = {
    name: chartB.input.name,
    sunSign: chartB.sunSign,
    moonSign: chartB.moonSign,
    risingSign: chartB.risingSign,
  };

  return {
    personA,
    personB,
    overall,
    scores,
    topAspects,
    verdict: generateVerdict(overall, scores, personA, personB),
  };
}
