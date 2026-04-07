/**
 * planet-interpretations.ts — What each planet means in each sign
 *
 * Co-Star style: short, punchy, personal. "Your X in Y means..."
 * Covers all 10 planets × 12 signs = 120 interpretations.
 * Also includes house meanings and life area categories.
 */

// ── Life area categories (Co-Star style) ──
export const LIFE_AREAS = [
  { key: "self", label: "Self", icon: "◐", desc: "Identity, ego, sense of self" },
  { key: "thinking", label: "Thinking & Creativity", icon: "◈", desc: "Mind, communication, ideas" },
  { key: "love", label: "Sex & Love", icon: "♡", desc: "Romance, attraction, intimacy" },
  { key: "routine", label: "Routine", icon: "⟳", desc: "Daily habits, work, health" },
  { key: "spirituality", label: "Spirituality", icon: "✦", desc: "Inner world, dreams, intuition" },
  { key: "social", label: "Social Life", icon: "◎", desc: "Friendships, community, groups" },
] as const;

// ── Planet → Life area mapping ──
export const PLANET_LIFE_AREA: Record<string, string> = {
  Sun: "self",
  Moon: "spirituality",
  Mercury: "thinking",
  Venus: "love",
  Mars: "routine",
  Jupiter: "social",
  Saturn: "routine",
  Uranus: "social",
  Neptune: "spirituality",
  Pluto: "self",
};

// ── Planet meanings (what this planet governs) ──
export const PLANET_MEANING: Record<string, string> = {
  Sun: "Your core identity. Who you are when no one is watching.",
  Moon: "Your emotional instincts. How you feel, need, and nurture.",
  Mercury: "Your mind. How you think, communicate, and process information.",
  Venus: "Your heart. How you love, what you find beautiful, what you value.",
  Mars: "Your drive. How you take action, fight, and pursue desire.",
  Jupiter: "Your growth. Where you expand, get lucky, and find meaning.",
  Saturn: "Your discipline. Where you face limits and build mastery.",
  Uranus: "Your rebellion. Where you break rules and innovate.",
  Neptune: "Your dreams. Where you dissolve boundaries and imagine.",
  Pluto: "Your power. Where you transform, destroy, and regenerate.",
};

// ── House meanings ──
export const HOUSE_MEANING: Record<number, { area: string; rules: string }> = {
  1:  { area: "Self & Identity", rules: "First impressions, physical body, how the world sees you" },
  2:  { area: "Money & Values", rules: "Possessions, self-worth, what you earn and value" },
  3:  { area: "Communication", rules: "Speaking, writing, siblings, local travel, learning" },
  4:  { area: "Home & Roots", rules: "Family, ancestry, emotional foundation, private life" },
  5:  { area: "Creativity & Romance", rules: "Self-expression, dating, children, play, joy" },
  6:  { area: "Health & Service", rules: "Daily routines, work, wellness, pets, being useful" },
  7:  { area: "Partnership", rules: "Marriage, committed relationships, open enemies, contracts" },
  8:  { area: "Transformation", rules: "Shared resources, sex, death, rebirth, other people's money" },
  9:  { area: "Philosophy & Travel", rules: "Higher education, foreign lands, belief systems, publishing" },
  10: { area: "Career & Legacy", rules: "Public reputation, ambition, authority, life direction" },
  11: { area: "Community & Dreams", rules: "Friendships, groups, hopes, wishes, social causes" },
  12: { area: "Subconscious", rules: "Hidden things, solitude, spirituality, self-undoing, healing" },
};

// ── Planet in Sign interpretations (short, punchy, personal) ──
// Format: "You [verb] [how]."
const PI: Record<string, Record<string, string>> = {
  Sun: {
    Aries: "You lead with instinct. You don't ask for permission — you act, and the world catches up.",
    Taurus: "You build slowly and permanently. What you create has weight, texture, and staying power.",
    Gemini: "You exist in multiplicity. Your mind never stops connecting, questioning, reframing.",
    Cancer: "You feel everything first. Your emotional intelligence is your greatest strategic asset.",
    Leo: "You radiate. When you walk in, the room rearranges itself around your energy.",
    Virgo: "You see the flaw and the fix simultaneously. Your precision is a form of devotion.",
    Libra: "You seek balance as a life philosophy. Beauty isn't superficial to you — it's structural.",
    Scorpio: "You go where others won't look. Your power comes from facing what everyone else avoids.",
    Sagittarius: "You chase horizons. Every ending is just a new beginning in disguise.",
    Capricorn: "You play the long game. Time is your greatest ally — you only get more powerful.",
    Aquarius: "You see the future before it arrives. Your detachment isn't cold — it's visionary.",
    Pisces: "You dissolve boundaries between self and universe. Your imagination is a form of knowing.",
  },
  Moon: {
    Aries: "You process emotions by doing. Stillness feels like stagnation. Move through it.",
    Taurus: "You need sensory comfort to feel safe. Touch, food, nature — these are your medicine.",
    Gemini: "You talk through your feelings. Processing is verbal. Silence is not your friend.",
    Cancer: "You feel the room before you enter it. Your moods are tidal — honor their rhythm.",
    Leo: "You need to be seen in your feelings. Performing your truth is how you heal.",
    Virgo: "You organize your way through emotion. Anxiety is often misplaced care.",
    Libra: "You need harmony to function. Discord physically unsettles you.",
    Scorpio: "You feel with volcanic intensity. Your emotions are transformative, not decorative.",
    Sagittarius: "You need meaning to process pain. Philosophy is your emotional first aid.",
    Capricorn: "You control your feelings like assets. Vulnerability feels expensive.",
    Aquarius: "You observe your emotions from a distance. Detachment protects a deeply caring heart.",
    Pisces: "You absorb everyone's feelings like a sponge. Boundaries are your lifelong lesson.",
  },
  Mercury: {
    Aries: "You think fast and speak faster. Your ideas arrive like sparks — immediate and urgent.",
    Taurus: "You think slowly and thoroughly. Your conclusions are built to last.",
    Gemini: "Your mind operates on multiple frequencies. You see connections invisible to others.",
    Cancer: "You think with your feelings. Memory and emotion shape every conclusion.",
    Leo: "You communicate with authority and warmth. Your words carry presence.",
    Virgo: "You analyze with surgical precision. Details speak to you in a language others can't hear.",
    Libra: "You weigh every perspective before deciding. Fairness shapes your thinking.",
    Scorpio: "You think beneath the surface. You read subtext like text.",
    Sagittarius: "You think in big pictures and grand narratives. Details bore you; meaning doesn't.",
    Capricorn: "You think strategically. Every idea is evaluated for practical application.",
    Aquarius: "You think in revolutionary patterns. Your mind breaks conventions effortlessly.",
    Pisces: "You think in images, metaphors, and feelings. Logic is your second language.",
  },
  Venus: {
    Aries: "You love with intensity and impatience. You pursue — you don't wait.",
    Taurus: "You love with your senses. Touch, presence, commitment — these are your currency.",
    Gemini: "You love through conversation. Boredom kills attraction faster than anything.",
    Cancer: "You love by nurturing. You create emotional homes inside your relationships.",
    Leo: "You love dramatically and generously. You need to feel special — and you make others feel it too.",
    Virgo: "You love through acts of service. Devotion lives in your details.",
    Libra: "You love with grace and intentionality. Partnership is your art form.",
    Scorpio: "You love with consuming intensity. Half-measures don't exist in your emotional vocabulary.",
    Sagittarius: "You love with freedom. The relationship that tries to cage you loses you.",
    Capricorn: "You love with commitment and structure. You build relationships like careers.",
    Aquarius: "You love unconventionally. Your ideal partner is also your intellectual equal.",
    Pisces: "You love without boundaries. Merging is natural — separating is the challenge.",
  },
  Mars: {
    Aries: "You act on instinct. Hesitation is foreign to you. You were born to initiate.",
    Taurus: "You act slowly but unstoppably. When you commit, nothing moves you.",
    Gemini: "You fight with words. Your weapon is information, not force.",
    Cancer: "You fight to protect. Your aggression is defensive — fierce when home is threatened.",
    Leo: "You act with dramatic confidence. Your courage inspires others to be braver.",
    Virgo: "You act with precision. Your productivity is your superpower.",
    Libra: "You act through diplomacy. Conflict isn't avoided — it's transformed.",
    Scorpio: "You act with strategic intensity. You never reveal your full power until necessary.",
    Sagittarius: "You act on faith. Your optimism propels you through obstacles others won't attempt.",
    Capricorn: "You act with calculated ambition. Every move serves the long-term strategy.",
    Aquarius: "You act for the collective. Personal gain motivates less than systemic change.",
    Pisces: "You act on intuition. Your approach is fluid — you go around obstacles, not through them.",
  },
  Jupiter: {
    Aries: "Growth comes through bold action. You expand by being first.",
    Taurus: "Growth comes through material mastery. Abundance is your birthright.",
    Gemini: "Growth comes through knowledge. Every conversation is an opportunity.",
    Cancer: "Growth comes through emotional depth. Family and home are your expansion.",
    Leo: "Growth comes through creative expression. Generosity multiplies your fortune.",
    Virgo: "Growth comes through service. Helping others is how you help yourself.",
    Libra: "Growth comes through partnership. Your luck doubles when shared.",
    Scorpio: "Growth comes through transformation. Your breakthroughs require breakdowns first.",
    Sagittarius: "Growth is your natural state. You expand effortlessly — the universe wants you bigger.",
    Capricorn: "Growth comes through discipline. Your expansion is structured and lasting.",
    Aquarius: "Growth comes through innovation. Your ideas are ahead of their time — and that's the point.",
    Pisces: "Growth comes through surrender. Let go and the universe rushes in.",
  },
  Saturn: {
    Aries: "Your lesson is patience. Learning to wait is your path to mastery.",
    Taurus: "Your lesson is non-attachment. What you cling to teaches you to release.",
    Gemini: "Your lesson is depth over breadth. Focus transforms scattered brilliance into mastery.",
    Cancer: "Your lesson is emotional boundaries. Not every feeling needs to be hosted.",
    Leo: "Your lesson is humility. True confidence doesn't need an audience.",
    Virgo: "Your lesson is self-compassion. Perfection is the enemy of your peace.",
    Libra: "Your lesson is independence. You must be whole alone before partnership works.",
    Scorpio: "Your lesson is surrender of control. Power comes from trust, not grip.",
    Sagittarius: "Your lesson is commitment. Freedom means nothing without structure to support it.",
    Capricorn: "Your lesson is already your strength. Time rewards everything you build.",
    Aquarius: "Your lesson is vulnerability. Ideas can't replace emotional connection.",
    Pisces: "Your lesson is reality. Dreams need form to become real.",
  },
  Uranus: {
    Aries: "You revolutionize identity. You refuse to be categorized.",
    Taurus: "You revolutionize value systems. Money and worth are being redefined through you.",
    Gemini: "You revolutionize communication. Your ideas arrive from the future.",
    Cancer: "You revolutionize family. Home means something entirely new.",
    Leo: "You revolutionize self-expression. Your creativity breaks every mold.",
    Virgo: "You revolutionize systems. Health, work, service — all being reinvented.",
    Libra: "You revolutionize relationships. Partnership on your terms only.",
    Scorpio: "You revolutionize power structures. Transformation accelerates around you.",
    Sagittarius: "You revolutionize belief. Truth has no sacred cows in your world.",
    Capricorn: "You revolutionize institutions. The old structures crumble to make way.",
    Aquarius: "You revolutionize everything. This is Uranus at full power — expect the unexpected.",
    Pisces: "You revolutionize consciousness. Spiritual awakening arrives like lightning.",
  },
  Neptune: {
    Aries: "You dream of pioneering new realities. Your imagination is a weapon.",
    Taurus: "You dream of beauty made tangible. Art and nature merge in your vision.",
    Gemini: "You dream in words and ideas. Language carries spiritual weight for you.",
    Cancer: "You dream of perfect belonging. Nostalgia is your portal to the divine.",
    Leo: "You dream of creative transcendence. Performance is your meditation.",
    Virgo: "You dream of healing. Service to others is your spiritual practice.",
    Libra: "You dream of perfect love. Every relationship is a spiritual mirror.",
    Scorpio: "You dream of the underworld. Your psychic perception is razor-sharp.",
    Sagittarius: "You dream of meaning. Your quest for truth is genuinely spiritual.",
    Capricorn: "You dream of mastery. Your ambition has a mystical dimension.",
    Aquarius: "You dream of utopia. Your vision for humanity is genuinely transcendent.",
    Pisces: "You dream of dissolving all separation. This is Neptune at home — oceanic consciousness.",
  },
  Pluto: {
    Aries: "You transform through action. Every crisis makes you more powerful.",
    Taurus: "You transform through material change. Loss teaches you what's truly valuable.",
    Gemini: "You transform through knowledge. Information is power — and you know it.",
    Cancer: "You transform through emotional depth. Family patterns end with you.",
    Leo: "You transform through creative destruction. You reinvent yourself repeatedly.",
    Virgo: "You transform through purification. Health crises become spiritual awakenings.",
    Libra: "You transform through relationships. Partners trigger your deepest evolution.",
    Scorpio: "You transform at the molecular level. Death and rebirth are not metaphors — they're your process.",
    Sagittarius: "You transform through belief crisis. What you lose faith in shows you what's real.",
    Capricorn: "You transform power structures. Authority and control are being dismantled.",
    Aquarius: "You transform collective consciousness. Group dynamics are your crucible.",
    Pisces: "You transform through surrender. Ego dissolution is your path to power.",
  },
};

/** Get planet-in-sign interpretation */
export function getPlanetInSign(planet: string, sign: string): string {
  return PI[planet]?.[sign] || `Your ${planet} in ${sign} shapes how you express ${PLANET_MEANING[planet]?.split(".")[0]?.toLowerCase() || "this energy"}.`;
}

/** Get all planet interpretations for a chart */
export function getChartInterpretations(planets: { name: string; sign: string; house: number }[]): {
  planet: string;
  sign: string;
  house: number;
  meaning: string;
  interpretation: string;
  lifeArea: string;
  houseMeaning: string;
}[] {
  return planets.map(p => ({
    planet: p.name,
    sign: p.sign,
    house: p.house,
    meaning: PLANET_MEANING[p.name] || "",
    interpretation: getPlanetInSign(p.name, p.sign),
    lifeArea: PLANET_LIFE_AREA[p.name] || "self",
    houseMeaning: HOUSE_MEANING[p.house]?.area || "",
  }));
}
