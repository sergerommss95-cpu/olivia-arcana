/**
 * sign-group.ts — Lesson content templates for zodiac sign lessons
 *
 * Generates data-driven sections for sign groups, elements, modalities,
 * and introductory astrology lessons. Pulls from SIGN_PAGES for real sign data.
 */

import type { LessonContent, ContentSection } from "../types";
import { SIGN_PAGES } from "@/lib/sign-data";

// ── Helpers ──

function signProfile(name: string): ContentSection {
  return { type: "sign-profile", sign: name };
}

function text(title: string, body: string): ContentSection {
  return { type: "text", title, body };
}

function callout(style: "insight" | "warning" | "tip", body: string): ContentSection {
  return { type: "callout", style, body };
}

// ── Sign group data ──

const SIGN_GROUPS: Record<string, { signs: string[]; title: string; intro: string; insight: string }> = {
  "aries-taurus-gemini": {
    signs: ["Aries", "Taurus", "Gemini"],
    title: "The First Three Signs",
    intro:
      "The zodiac begins with a burst of primal energy. Aries ignites the spark of existence itself — raw will, " +
      "pure initiative. Taurus follows by giving that spark a body, grounding it in matter, sensation, and " +
      "endurance. Gemini then gives it a voice, splitting unity into duality so the self can reflect, question, " +
      "and communicate. Together these three signs map the most fundamental human arc: I exist, I have, I think. " +
      "Every journey through the zodiac begins here, moving from instinct through form to thought.",
    insight:
      "Notice the elemental progression: Fire (Aries) creates, Earth (Taurus) solidifies, Air (Gemini) circulates. " +
      "Each sign answers the limitation of the one before it. Aries acts but cannot sustain; Taurus sustains but " +
      "cannot adapt; Gemini adapts but cannot commit. Understanding this pattern is the first key to reading any chart.",
  },
  "cancer-leo-virgo": {
    signs: ["Cancer", "Leo", "Virgo"],
    title: "The Second Triad",
    intro:
      "After the self awakens (Aries-Taurus-Gemini), it must learn to feel, to shine, and to serve. Cancer opens " +
      "the emotional dimension — suddenly the self is not alone but part of a family, a lineage, a web of feeling. " +
      "Leo takes that emotional security and uses it as fuel for creative self-expression, discovering that the " +
      "self has a gift meant to be shared. Virgo completes the triad by asking: how do I make this gift useful? " +
      "The arc is from feeling to expression to refinement.",
    insight:
      "Water (Cancer) nurtures, Fire (Leo) expresses, Earth (Virgo) refines. This second triad mirrors the first " +
      "but at a deeper level — where Aries-Taurus-Gemini deal with raw existence, Cancer-Leo-Virgo deal with " +
      "personal development. Many people feel the shift from Leo to Virgo as a coming-down-to-earth moment: the " +
      "party of self-expression gives way to the discipline of craft.",
  },
  "libra-scorpio-sagittarius": {
    signs: ["Libra", "Scorpio", "Sagittarius"],
    title: "The Third Triad",
    intro:
      "The zodiac's second half begins with Libra, and the focus shifts from self-development to relationship " +
      "with others. Libra meets the Other as an equal and asks: how do we create harmony? Scorpio then plunges " +
      "beneath that surface harmony to confront the raw truth of intimacy — power, vulnerability, transformation. " +
      "Sagittarius rises from Scorpio's depths with a question that transcends both self and other: what does it " +
      "all mean? The arc moves from partnership to transformation to meaning.",
    insight:
      "Air (Libra) connects, Water (Scorpio) transforms, Fire (Sagittarius) expands. These three signs represent " +
      "the most intense stretch of the zodiac. Scorpio season (late October through November) is when the veil " +
      "between worlds feels thinnest, and Sagittarius season carries us into the philosophical territory that " +
      "only deep emotional truth can unlock.",
  },
  "capricorn-aquarius-pisces": {
    signs: ["Capricorn", "Aquarius", "Pisces"],
    title: "The Final Triad",
    intro:
      "The zodiac concludes with its most mature and cosmic signs. Capricorn builds the structure that will " +
      "outlast the individual — legacy, institutions, mastery earned through time. Aquarius shatters whatever " +
      "in that structure no longer serves the collective good, introducing revolution and vision. Pisces dissolves " +
      "all remaining boundaries, returning individual consciousness to the universal ocean from which it arose. " +
      "The arc is from structure to liberation to transcendence — and then the cycle begins again with Aries.",
    insight:
      "Earth (Capricorn) builds, Air (Aquarius) disrupts, Water (Pisces) dissolves. This final triad deals with " +
      "humanity's relationship to society, the future, and the infinite. Many spiritual traditions map onto Pisces " +
      "energy — the surrender of ego, the compassion that sees no separation. That Pisces is followed by Aries " +
      "is the zodiac's deepest teaching: dissolution always precedes new creation.",
  },
};

// ── Element data ──

const ELEMENTS: Record<string, { signs: string[]; quality: string; drive: string; shadow: string }> = {
  Fire: {
    signs: ["Aries", "Leo", "Sagittarius"],
    quality: "Initiating, energizing, transformative",
    drive: "Action, identity, inspiration",
    shadow: "Burnout, impulsiveness, ego inflation",
  },
  Earth: {
    signs: ["Taurus", "Virgo", "Capricorn"],
    quality: "Stabilizing, practical, enduring",
    drive: "Security, mastery, material reality",
    shadow: "Rigidity, materialism, resistance to change",
  },
  Air: {
    signs: ["Gemini", "Libra", "Aquarius"],
    quality: "Connecting, conceptual, circulating",
    drive: "Knowledge, relationships, ideas",
    shadow: "Detachment, overthinking, superficiality",
  },
  Water: {
    signs: ["Cancer", "Scorpio", "Pisces"],
    quality: "Feeling, intuitive, transforming",
    drive: "Emotional truth, healing, spiritual depth",
    shadow: "Overwhelm, manipulation, escapism",
  },
};

// ── Modality data ──

const MODALITIES: Record<string, { signs: string[]; role: string; strength: string; challenge: string }> = {
  Cardinal: {
    signs: ["Aries", "Cancer", "Libra", "Capricorn"],
    role: "Initiators — they start things",
    strength: "Decisive action and leadership",
    challenge: "Finishing what they begin",
  },
  Fixed: {
    signs: ["Taurus", "Leo", "Scorpio", "Aquarius"],
    role: "Sustainers — they maintain and deepen",
    strength: "Persistence and unwavering focus",
    challenge: "Adapting when change is necessary",
  },
  Mutable: {
    signs: ["Gemini", "Virgo", "Sagittarius", "Pisces"],
    role: "Adapters — they adjust and transform",
    strength: "Flexibility and resourcefulness",
    challenge: "Commitment and follow-through",
  },
};

// ── Polarity pairs ──

const POLARITY_PAIRS: { a: string; b: string; axis: string; tension: string }[] = [
  {
    a: "Aries", b: "Libra",
    axis: "Self vs. Other",
    tension: "Aries asserts individual will; Libra seeks harmony through partnership. The lesson: you cannot truly relate until you know who you are, and you cannot truly know yourself until you see your reflection in another.",
  },
  {
    a: "Taurus", b: "Scorpio",
    axis: "Having vs. Transforming",
    tension: "Taurus holds and preserves; Scorpio releases and transforms. The lesson: security is not found in what you keep but in your willingness to let go of what no longer serves you.",
  },
  {
    a: "Gemini", b: "Sagittarius",
    axis: "Information vs. Meaning",
    tension: "Gemini gathers data; Sagittarius seeks the story that data tells. The lesson: facts without philosophy are trivial, and philosophy without facts is delusion.",
  },
  {
    a: "Cancer", b: "Capricorn",
    axis: "Private Life vs. Public Life",
    tension: "Cancer nurtures the inner world; Capricorn builds the outer world. The lesson: a career without emotional roots is hollow, and a home without ambition stagnates.",
  },
  {
    a: "Leo", b: "Aquarius",
    axis: "Individual vs. Collective",
    tension: "Leo shines as a unique creative force; Aquarius serves the group vision. The lesson: your individual gifts find their highest expression when offered to something larger than yourself.",
  },
  {
    a: "Virgo", b: "Pisces",
    axis: "Analysis vs. Surrender",
    tension: "Virgo perfects through discernment; Pisces dissolves through compassion. The lesson: healing requires both precise attention to what is broken and faith in what cannot be seen.",
  },
];

// ── Main generator ──

export function generateSignContent(lessonSlug: string): LessonContent | null {
  // Sign group lessons
  const group = SIGN_GROUPS[lessonSlug];
  if (group) {
    const sections: ContentSection[] = [
      text(group.title, group.intro),
      ...group.signs.map((s) => signProfile(s)),
      callout("insight", group.insight),
    ];
    return { sections, estimatedMinutes: 12, keyTakeaway: group.insight.split(". ")[0] + "." };
  }

  // Elements lesson
  if (lessonSlug === "elements-fire-earth-air-water") {
    const rows = Object.entries(ELEMENTS).map(([el, data]) => [
      el,
      data.signs.join(", "),
      data.quality,
      data.drive,
      data.shadow,
    ]);
    const sections: ContentSection[] = [
      text(
        "The Four Elements",
        "Every zodiac sign belongs to one of four elements: Fire, Earth, Air, or Water. The elements are not " +
        "just categories — they describe fundamentally different ways of engaging with reality. Fire acts, Earth " +
        "builds, Air thinks, Water feels. Understanding a sign's element tells you more about its core nature " +
        "than almost any other single factor. Two signs that share an element will always have an instinctive " +
        "understanding, even if they express it very differently."
      ),
      {
        type: "comparison-table",
        headers: ["Element", "Signs", "Quality", "Drive", "Shadow"],
        rows,
      },
      text(
        "How Elements Interact",
        "Fire and Air feed each other — ideas (Air) fuel action (Fire), and action generates new ideas. Earth " +
        "and Water nourish each other — feelings (Water) give meaning to material reality (Earth), and material " +
        "security creates a container for emotional depth. Fire and Water create steam — passion meets emotion " +
        "in intense but sometimes volatile combinations. Earth and Air can struggle — practicality and abstraction " +
        "operate on different planes, though when they collaborate the results are both visionary and real."
      ),
      callout(
        "tip",
        "Look at the element balance in your birth chart. If you have most planets in Water signs, you lead with " +
        "emotion and intuition. Heavy Fire means you lead with action. Knowing your elemental balance helps you " +
        "understand your natural strengths and what you may need to consciously develop."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 10,
      keyTakeaway: "The four elements — Fire, Earth, Air, Water — are the foundational building blocks of astrological personality.",
    };
  }

  // Modalities lesson
  if (lessonSlug === "modalities-cardinal-fixed-mutable") {
    const rows = Object.entries(MODALITIES).map(([mod, data]) => [
      mod,
      data.signs.join(", "),
      data.role,
      data.strength,
      data.challenge,
    ]);
    const sections: ContentSection[] = [
      text(
        "The Three Modalities",
        "If elements describe what energy a sign carries, modalities describe how that energy moves. Cardinal " +
        "signs initiate — they are the starters, the leaders, the ones who kick things off. Fixed signs sustain — " +
        "they dig in, deepen, and refuse to quit. Mutable signs adapt — they shift, transform, and prepare the " +
        "ground for the next cycle. Every season of the year begins with a Cardinal sign, deepens through a " +
        "Fixed sign, and transitions through a Mutable sign."
      ),
      {
        type: "comparison-table",
        headers: ["Modality", "Signs", "Role", "Strength", "Challenge"],
        rows,
      },
      text(
        "Modalities in Practice",
        "When you see a chart loaded with Cardinal energy, you are looking at someone who starts many things but " +
        "may struggle to finish them. Heavy Fixed energy produces remarkable perseverance but can become stubborn " +
        "rigidity. A chart dominated by Mutable signs creates extraordinary adaptability but can lack the anchor " +
        "of firm commitment. The most effective approach, as always in astrology, is balance — though very few " +
        "charts are perfectly balanced, which is precisely what makes each person unique."
      ),
      callout(
        "insight",
        "Cardinal signs mark the start of each season (equinoxes and solstices). Fixed signs occupy the heart " +
        "of each season. Mutable signs mark the transition between seasons. This seasonal rhythm is not metaphorical — " +
        "it is the literal astronomical basis of the modality system."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: "Cardinal signs initiate, Fixed signs sustain, Mutable signs adapt — this rhythm mirrors the seasons themselves.",
    };
  }

  // Polarities lesson
  if (lessonSlug === "polarities-and-mirrors") {
    const rows = POLARITY_PAIRS.map((p) => [
      `${SIGN_PAGES[p.a.toLowerCase()]?.glyph || ""} ${p.a}`,
      `${SIGN_PAGES[p.b.toLowerCase()]?.glyph || ""} ${p.b}`,
      p.axis,
    ]);
    const sections: ContentSection[] = [
      text(
        "Opposite Signs Are Mirror Signs",
        "In the zodiac wheel, every sign sits directly across from another. These opposite pairs are not " +
        "enemies — they are mirrors. Each sign contains the quality its opposite needs to develop, and each " +
        "opposition represents a fundamental life tension that cannot be resolved by choosing one side. The goal " +
        "is integration: learning to hold both poles simultaneously. People often attract partners, friends, or " +
        "life circumstances that embody their opposite sign, precisely because the soul seeks wholeness."
      ),
      {
        type: "comparison-table",
        headers: ["Sign", "Opposite", "Axis"],
        rows,
      },
      ...POLARITY_PAIRS.map((p) =>
        text(`${p.a} — ${p.b}: ${p.axis}`, p.tension)
      ),
      callout(
        "insight",
        "When you have planets in opposite signs, you carry both poles within you. This can feel like inner " +
        "tension but is actually a gift — you have access to both perspectives and can integrate them more " +
        "consciously than someone who only sees one side."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 14,
      keyTakeaway: "Opposite signs are complementary forces that teach us balance and wholeness.",
    };
  }

  // What is astrology
  if (lessonSlug === "what-is-astrology") {
    const sections: ContentSection[] = [
      text(
        "What Is Astrology?",
        "Astrology is one of the oldest systems of meaning-making in human history, spanning at least 4,000 " +
        "years across Babylonian, Egyptian, Greek, Indian, Chinese, and Mesoamerican civilizations. At its core, " +
        "astrology proposes a relationship between celestial patterns and human experience — not as mechanical " +
        "causation but as meaningful correspondence. The positions of the Sun, Moon, and planets at the moment " +
        "of your birth form a unique map called a natal chart, which describes your psychological tendencies, " +
        "strengths, challenges, and the themes your life is likely to explore."
      ),
      text(
        "The Language of Symbols",
        "Astrology works through symbols, not literal forces. The Sun does not make you confident any more than " +
        "a clock makes the hour change. But just as a clock accurately reflects the time, astrological symbols " +
        "reflect patterns in human psychology with remarkable consistency. Learning astrology is learning a symbolic " +
        "language — one where planets are verbs (what happens), signs are adjectives (how it happens), and houses " +
        "are nouns (where in life it happens). Master these three layers and you can read any chart."
      ),
      text(
        "What Astrology Is Not",
        "Astrology is not fortune-telling. It does not predict specific events with certainty, nor does it " +
        "remove free will. A birth chart is a map of tendencies and potentials, not a script. Two people born " +
        "at the same moment in the same place will share a chart but live very different lives based on their " +
        "choices, environment, and consciousness. The chart shows the hand you were dealt; how you play it is " +
        "entirely up to you."
      ),
      callout(
        "tip",
        "Approach astrology with curiosity rather than belief or skepticism. The most productive stance is: " +
        "does this framework help me understand myself and others more deeply? If the answer is yes, it is " +
        "useful regardless of the mechanism."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 8,
      keyTakeaway: "Astrology is a symbolic language where planets are verbs, signs are adjectives, and houses are nouns.",
    };
  }

  // The zodiac wheel
  if (lessonSlug === "the-zodiac-wheel") {
    const wheelOrder = [
      "aries", "taurus", "gemini", "cancer", "leo", "virgo",
      "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
    ];
    const items = wheelOrder.map((key) => {
      const s = SIGN_PAGES[key];
      return {
        term: `${s.glyph} ${s.name} (${s.dateRange})`,
        definition: `${s.element} / ${s.modality} — Motto: "${s.motto}"`,
      };
    });
    const sections: ContentSection[] = [
      text(
        "The Zodiac Wheel",
        "The zodiac is a 360-degree circle divided into 12 equal segments of 30 degrees each. This circle " +
        "represents the apparent path of the Sun across the sky over the course of one year (the ecliptic). " +
        "Each segment is a zodiac sign, and the order is fixed: Aries always begins at the vernal equinox " +
        "(around March 21), and Pisces always ends the cycle just before the next equinox. This is not " +
        "arbitrary — it reflects the actual seasonal progression in the Northern Hemisphere, which is why " +
        "the signs carry the qualities they do."
      ),
      { type: "keyword-map", items },
      text(
        "Reading the Wheel",
        "The wheel moves counterclockwise, beginning with Aries at the 9 o'clock position (the Ascendant " +
        "or rising sign position in a birth chart). Each sign builds on the one before it and prepares the " +
        "ground for the one after. The zodiac tells a story of development: from the raw self-assertion of " +
        "Aries through the relational awareness of Libra to the transcendent dissolution of Pisces. Every " +
        "human life, in some form, travels this entire wheel."
      ),
      callout(
        "insight",
        "Your Sun sign is only one point on this wheel. Your Moon, Mercury, Venus, Mars, and the outer " +
        "planets all occupy their own positions, creating a complex web of energies. That is why no two " +
        "Aries are alike — the rest of the chart provides infinite variation within the same solar theme."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 7,
      keyTakeaway: "The zodiac wheel is a developmental story from Aries to Pisces, reflecting the seasonal cycle of the year.",
    };
  }

  // Decanates (decans) lesson
  if (lessonSlug === "decanates" || lessonSlug === "minor-arcana-decans") {
    const sections: ContentSection[] = [
      text(
        "The Decanates: Three Faces of Every Sign",
        "Each zodiac sign spans 30 degrees of the ecliptic, and each sign is divided into three 10-degree " +
        "sections called decanates (or decans). This ancient system — older than the zodiac signs themselves — " +
        "adds crucial nuance to sign interpretation. Two people may both be Aries, but an Aries born at 5 degrees " +
        "lives a very different flavor of Aries than one born at 25 degrees. The decan system explains why. " +
        "The first decan (0-10 degrees) is the purest expression of the sign, ruled by the sign's own planetary " +
        "ruler. The second decan (10-20 degrees) is colored by the next sign of the same element, blending in " +
        "that sign's ruler as a sub-influence. The third decan (20-30 degrees) is colored by the remaining sign " +
        "of the same element. This creates a triplicity within each triplicity — fire within fire, earth within " +
        "earth — adding a layer of specificity that the Sun sign alone cannot provide."
      ),
      text(
        "How Decan Rulers Work",
        "Consider Aries as an example. The first decan (0-10 degrees Aries) is pure Aries energy, ruled by Mars — " +
        "the most impulsive, initiating, and combative expression of the Ram. The second decan (10-20 degrees " +
        "Aries) is Aries colored by Leo, the next fire sign, with the Sun as sub-ruler — here Aries becomes more " +
        "regal, more concerned with recognition and creative self-expression. The third decan (20-30 degrees " +
        "Aries) is Aries colored by Sagittarius, with Jupiter as sub-ruler — this Aries is the philosopher-warrior, " +
        "driven not just by impulse but by a quest for meaning. The same triplicity logic applies to every sign: " +
        "each element's three signs rotate through as decan rulers."
      ),
      text(
        "The Chaldean Decan Order",
        "An even older system assigns decan rulers according to the Chaldean order of the planets — a sequence " +
        "based on apparent geocentric speed: Mars, Sun, Venus, Mercury, Moon, Saturn, Jupiter. This seven-planet " +
        "sequence repeats continuously through all 36 decans of the zodiac, beginning with Mars ruling the first " +
        "decan of Aries. The Chaldean system produces different sub-rulers than the triplicity system and is " +
        "particularly important when working with tarot, where the Chaldean decan rulers determine which planet " +
        "governs each numbered Minor Arcana card."
      ),
      text(
        "Decans and the Tarot",
        "The connection between decans and tarot is one of the most elegant correspondences in the Western " +
        "esoteric tradition. Each of the 36 decans corresponds to one of the numbered Minor Arcana cards (2 " +
        "through 10 of each suit). The Aces represent the pure elemental force of each suit, while cards 2-10 " +
        "map sequentially through the decans. This means every numbered tarot card carries a specific zodiacal " +
        "degree range and a Chaldean planetary ruler, giving it a precise astrological identity. T. Susan Chang's " +
        "'36 Secrets: A Decanate Journey Through the Minor Arcana' is the essential modern guide to this system, " +
        "bringing the decan-tarot connection to life with practical depth."
      ),
      {
        type: "comparison-table",
        headers: ["Sign", "Decan", "Degrees", "Triplicity Ruler", "Chaldean Ruler", "Tarot Card"],
        rows: [
          ["Aries", "1st", "0-10", "Mars (Aries)", "Mars", "2 of Wands"],
          ["Aries", "2nd", "10-20", "Sun (Leo)", "Sun", "3 of Wands"],
          ["Aries", "3rd", "20-30", "Jupiter (Sagittarius)", "Venus", "4 of Wands"],
          ["Taurus", "1st", "0-10", "Venus (Taurus)", "Mercury", "5 of Pentacles"],
          ["Taurus", "2nd", "10-20", "Mercury (Virgo)", "Moon", "6 of Pentacles"],
          ["Taurus", "3rd", "20-30", "Saturn (Capricorn)", "Saturn", "7 of Pentacles"],
          ["Gemini", "1st", "0-10", "Mercury (Gemini)", "Jupiter", "8 of Swords"],
          ["Gemini", "2nd", "10-20", "Venus (Libra)", "Mars", "9 of Swords"],
          ["Gemini", "3rd", "20-30", "Saturn (Aquarius)", "Sun", "10 of Swords"],
          ["Cancer", "1st", "0-10", "Moon (Cancer)", "Venus", "2 of Cups"],
          ["Cancer", "2nd", "10-20", "Pluto (Scorpio)", "Mercury", "3 of Cups"],
          ["Cancer", "3rd", "20-30", "Neptune (Pisces)", "Moon", "4 of Cups"],
          ["Leo", "1st", "0-10", "Sun (Leo)", "Saturn", "5 of Wands"],
          ["Leo", "2nd", "10-20", "Jupiter (Sagittarius)", "Jupiter", "6 of Wands"],
          ["Leo", "3rd", "20-30", "Mars (Aries)", "Mars", "7 of Wands"],
          ["Virgo", "1st", "0-10", "Mercury (Virgo)", "Sun", "8 of Pentacles"],
          ["Virgo", "2nd", "10-20", "Saturn (Capricorn)", "Venus", "9 of Pentacles"],
          ["Virgo", "3rd", "20-30", "Venus (Taurus)", "Mercury", "10 of Pentacles"],
          ["Libra", "1st", "0-10", "Venus (Libra)", "Moon", "2 of Swords"],
          ["Libra", "2nd", "10-20", "Saturn (Aquarius)", "Saturn", "3 of Swords"],
          ["Libra", "3rd", "20-30", "Mercury (Gemini)", "Jupiter", "4 of Swords"],
          ["Scorpio", "1st", "0-10", "Pluto (Scorpio)", "Mars", "5 of Cups"],
          ["Scorpio", "2nd", "10-20", "Neptune (Pisces)", "Sun", "6 of Cups"],
          ["Scorpio", "3rd", "20-30", "Moon (Cancer)", "Venus", "7 of Cups"],
          ["Sagittarius", "1st", "0-10", "Jupiter (Sagittarius)", "Mercury", "8 of Wands"],
          ["Sagittarius", "2nd", "10-20", "Mars (Aries)", "Moon", "9 of Wands"],
          ["Sagittarius", "3rd", "20-30", "Sun (Leo)", "Saturn", "10 of Wands"],
          ["Capricorn", "1st", "0-10", "Saturn (Capricorn)", "Jupiter", "2 of Pentacles"],
          ["Capricorn", "2nd", "10-20", "Venus (Taurus)", "Mars", "3 of Pentacles"],
          ["Capricorn", "3rd", "20-30", "Mercury (Virgo)", "Sun", "4 of Pentacles"],
          ["Aquarius", "1st", "0-10", "Saturn (Aquarius)", "Venus", "5 of Swords"],
          ["Aquarius", "2nd", "10-20", "Mercury (Gemini)", "Mercury", "6 of Swords"],
          ["Aquarius", "3rd", "20-30", "Venus (Libra)", "Moon", "7 of Swords"],
          ["Pisces", "1st", "0-10", "Neptune (Pisces)", "Saturn", "8 of Cups"],
          ["Pisces", "2nd", "10-20", "Moon (Cancer)", "Jupiter", "9 of Cups"],
          ["Pisces", "3rd", "20-30", "Pluto (Scorpio)", "Mars", "10 of Cups"],
        ],
      },
      callout(
        "tip",
        "Further Reading: '36 Secrets: A Decanate Journey Through the Minor Arcana' by T. Susan Chang — the " +
        "essential modern guide to the decan-tarot connection, weaving together astrology, tarot, and practical " +
        "interpretation for each of the 36 decans."
      ),
      callout(
        "insight",
        "When you know the exact degree of a planet in your chart, the decan adds a vital layer of interpretation. " +
        "A Venus at 3 degrees Scorpio (first decan, Pluto sub-ruler) expresses very differently from a Venus at " +
        "27 degrees Scorpio (third decan, Moon/Cancer coloring). The sign gives the broad theme; the decan gives " +
        "the specific flavor."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 14,
      keyTakeaway: "Each sign divides into three decans of 10 degrees, adding nuance through sub-rulers and connecting directly to the tarot's Minor Arcana.",
    };
  }

  return null;
}
