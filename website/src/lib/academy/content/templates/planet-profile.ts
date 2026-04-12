/**
 * planet-profile.ts — Lesson content templates for planetary lessons
 *
 * Generates data-driven sections for individual planet profiles,
 * planet overviews, outer planet groups, dignities, and retrogrades.
 * Pulls from PLANET_MEANING and PI for real interpretive data.
 */

import type { LessonContent, ContentSection } from "../types";
import { PLANET_MEANING } from "@/lib/planet-interpretations";

// ── Helpers ──

function text(title: string, body: string): ContentSection {
  return { type: "text", title, body };
}

function callout(style: "insight" | "warning" | "tip", body: string): ContentSection {
  return { type: "callout", style, body };
}

function planetProfile(planet: string): ContentSection {
  return { type: "planet-profile", planet };
}

// ── Individual planet data ──

interface PlanetLesson {
  slug: string;
  planet: string;
  title: string;
  intro: string;
  insight: string;
  minutes: number;
}

const PLANET_LESSONS: PlanetLesson[] = [
  {
    slug: "the-sun",
    planet: "Sun",
    title: "The Sun: Your Core Identity",
    intro:
      "In astrology, the Sun is not just a planet — it is the center of your chart, just as it is the " +
      "center of the solar system. Your Sun sign represents your conscious identity, your vitality, and " +
      "the qualities you are here to develop and express most fully. When people ask 'what's your sign?', " +
      "they are asking about your Sun sign. But the Sun is deeper than a personality type — it is the " +
      "creative principle at the heart of who you are. The Sun describes not who you already are but who " +
      "you are becoming. It takes a lifetime to fully grow into your Sun sign. The journey of self-actualization " +
      "is, in astrological terms, the journey of learning to shine as your Sun intends. " +
      "Mythologically, the Sun corresponds to Apollo — god of light, prophecy, music, and healing — the archetype " +
      "of radiant consciousness that illuminates everything it touches. In Jungian psychology, the Sun maps to the " +
      "Self, the totality toward which individuation strives. As Liz Greene wrote, your Sun sign represents 'the " +
      "myth you are born to live' — not a static label but a living story unfolding across your entire biography.",
    insight:
      "The Sun spends roughly 30 days in each sign. Because everyone born in the same month shares a Sun " +
      "sign, the Sun alone cannot describe your full personality. Your Moon sign, rising sign, and the rest " +
      "of your chart add the nuance. Think of the Sun as the main melody of your life, and the other planets " +
      "as the harmonies, rhythms, and counterpoints.",
    minutes: 10,
  },
  {
    slug: "the-moon",
    planet: "Moon",
    title: "The Moon: Your Emotional Core",
    intro:
      "If the Sun is who you are becoming, the Moon is who you already are at your most unguarded. The Moon " +
      "rules your emotional instincts, your subconscious patterns, and the way you nurture and need to be " +
      "nurtured. It describes what makes you feel safe, what triggers your deepest reactions, and how you " +
      "process the feelings that move beneath conscious awareness. The Moon changes signs every 2.5 days, " +
      "which means it is far more specific than the Sun — two people born a day apart can have entirely " +
      "different Moon signs and therefore entirely different emotional operating systems. In traditional " +
      "astrology, the Moon was considered as important as the Sun. In modern practice, understanding your " +
      "Moon is the key to understanding your inner life. " +
      "The Moon's mythological roots run through the triple goddess — Artemis the maiden huntress, Selene the " +
      "luminous mother, and Hecate the crone of crossroads and hidden knowledge. This threefold face mirrors " +
      "the Moon's phases: waxing, full, and waning. Ptolemy and William Lilly gave the Moon enormous weight " +
      "in chart interpretation, considering it co-equal with the Sun as a luminary. The Moon is not lesser — " +
      "it is the soul's memory, the body's wisdom, the tide that moves beneath reason.",
    insight:
      "Your Moon sign often describes the parent who nurtured you (or the way nurturing was absent). It " +
      "reveals the emotional patterns you absorbed in childhood — patterns that run on autopilot unless you " +
      "bring conscious awareness to them. Working with your Moon means learning to parent yourself in the " +
      "way your Moon sign needs.",
    minutes: 10,
  },
  {
    slug: "mercury",
    planet: "Mercury",
    title: "Mercury: Your Mind and Voice",
    intro:
      "Mercury is the planet of thought, communication, and perception. It governs how you process information, " +
      "how you speak and write, how you learn, and how you make connections between ideas. Mercury is the " +
      "messenger — the bridge between your inner world and the outer world. It determines whether you think " +
      "in images or words, whether you communicate directly or through implication, whether you learn by reading " +
      "or by doing. Mercury moves quickly, never straying more than 28 degrees from the Sun, which means your " +
      "Mercury is always in the same sign as your Sun or in one of the two adjacent signs. This tight " +
      "relationship means Mercury colors how your Sun sign expresses itself verbally and intellectually. " +
      "Mercury's mythological counterpart is Hermes — the trickster, the messenger between worlds, the " +
      "psychopomp who could travel freely between Olympus and the Underworld. Hermes rules liminal spaces: " +
      "thresholds, crossroads, translation, and the moment of understanding when meaning leaps between minds. " +
      "This is why Mercury governs both communication and commerce — both are acts of exchange across a boundary.",
    insight:
      "When Mercury goes retrograde (appears to move backward) roughly three times a year, communication and " +
      "technology famously glitch. But retrograde periods are also powerful times for re-thinking, re-vising, " +
      "and re-connecting. The 're-' prefix is Mercury retrograde's gift — any activity that involves revisiting " +
      "the past benefits from this cycle.",
    minutes: 9,
  },
  {
    slug: "venus",
    planet: "Venus",
    title: "Venus: Your Heart and Values",
    intro:
      "Venus is the planet of love, beauty, pleasure, and value. It governs what you find attractive — in " +
      "people, in art, in environments — and how you express affection. But Venus goes deeper than romance: " +
      "it describes your relationship with value itself. What do you consider worthy of your time, energy, " +
      "and devotion? What aesthetic moves you? What does comfort mean to you? Venus also governs money " +
      "insofar as money represents stored value and the ability to access what you love. Like Mercury, " +
      "Venus stays close to the Sun (never more than 48 degrees away), so your Venus is always in the same " +
      "sign as your Sun or within two signs of it. " +
      "Venus descends from Aphrodite, born from sea foam where sky met ocean — beauty emerging from the collision " +
      "of elements. But Venus also carries the older myth of Inanna, who descended to the underworld and was " +
      "stripped bare at each gate, teaching that love requires surrender. Astronomically, Venus alternates between " +
      "evening star (sensual, receptive, magnetic) and morning star (assertive, warrior-like, pursuing). The " +
      "Mayans and Babylonians tracked these phases carefully, recognizing Venus as two-faced — not fickle, but " +
      "complete, holding both desire and the courage to fight for what is desired.",
    insight:
      "Venus expresses very differently depending on its sign. Venus in Earth signs (Taurus, Virgo, Capricorn) " +
      "loves through tangible acts — gifts, presence, reliability. Venus in Fire signs (Aries, Leo, Sagittarius) " +
      "loves passionately and demonstratively. Venus in Air signs (Gemini, Libra, Aquarius) loves through " +
      "intellectual connection and shared ideas. Venus in Water signs (Cancer, Scorpio, Pisces) loves with " +
      "emotional depth and psychic attunement.",
    minutes: 9,
  },
  {
    slug: "mars",
    planet: "Mars",
    title: "Mars: Your Drive and Will",
    intro:
      "Mars is the planet of action, desire, aggression, and physical energy. Where Venus asks 'what do I " +
      "want?', Mars asks 'how do I get it?' Mars governs your assertion style — how you fight, compete, " +
      "pursue goals, and express anger. It also rules physical vitality, sexual drive, and the raw energy " +
      "you bring to any endeavor. Mars in your chart shows where you are willing to fight and how you fight. " +
      "Some Mars signs are direct and confrontational; others are strategic and patient; others avoid conflict " +
      "entirely and channel Martian energy into creative or physical outlets. Understanding your Mars is " +
      "essential for understanding your relationship with anger, ambition, and desire. " +
      "Mars carries the archetype of both Ares (raw, instinctual aggression) and Athena (strategic, disciplined " +
      "warfare). In traditional astrology, Mars is the 'lesser malefic' — not evil, but the planet that forces " +
      "confrontation with difficulty. Mars' sign placement describes your survival instinct: how you respond when " +
      "threatened, what triggers your fight-or-flight, and the style of courage you bring to life's battles.",
    insight:
      "Mars takes about two years to travel through all 12 signs, spending roughly six weeks in each. When " +
      "Mars goes retrograde (every two years for about ten weeks), external momentum slows and the warrior " +
      "turns inward. Mars retrograde periods are times to reconsider what you are fighting for and whether " +
      "your current strategy is working.",
    minutes: 9,
  },
  {
    slug: "jupiter",
    planet: "Jupiter",
    title: "Jupiter: Your Path to Growth",
    intro:
      "Jupiter is the planet of expansion, luck, wisdom, and abundance. Where it falls in your chart marks " +
      "the area of life where things come more easily, where you tend to be optimistic, and where growth " +
      "feels natural. Jupiter is the great benefic of traditional astrology — it bestows gifts, opens doors, " +
      "and expands whatever it touches. But expansion is not always comfortable. Jupiter can also bring " +
      "excess, overconfidence, and the kind of growth that happens too fast to integrate properly. Jupiter " +
      "spends about one year in each sign, creating generational themes that color the optimism and faith " +
      "of everyone born during that period. " +
      "Jupiter's mythology traces to Zeus, king of the gods — thunder-wielder, lawgiver, protector of oaths, " +
      "and embodiment of expansive authority. In Hellenistic astrology, Jupiter is the 'greater benefic,' and " +
      "sect matters: Jupiter performs best in day charts (diurnal sect), where its expansive warmth aligns with " +
      "the Sun's visibility. In night charts, Jupiter still helps but with less reliable generosity. Understanding " +
      "Jupiter's sect condition is one of the first steps from modern pop astrology into traditional depth.",
    insight:
      "Your Jupiter return — when Jupiter returns to the sign it occupied at your birth — happens every " +
      "12 years (around ages 12, 24, 36, 48, 60). These are natural turning points for growth, opportunity, " +
      "and expanded horizons. Many people experience significant positive shifts during their Jupiter return year.",
    minutes: 9,
  },
  {
    slug: "saturn",
    planet: "Saturn",
    title: "Saturn: Your Teacher and Taskmaster",
    intro:
      "Saturn is the planet of discipline, limitation, time, and mastery. Where Jupiter expands, Saturn " +
      "contracts. Where Jupiter gives freely, Saturn demands that you earn it. Saturn's placement in your " +
      "chart shows where you face your hardest lessons, your deepest fears, and the area of life where " +
      "mastery requires sustained effort over many years. Saturn is not punishing you — it is teaching you. " +
      "Every restriction Saturn imposes is designed to build a strength you could not develop through ease " +
      "alone. Saturn spends about 2.5 years in each sign, and its lessons tend to be slow, structural, and " +
      "deeply formative. " +
      "Saturn's myth is Kronos — lord of time, the harvest, and the golden age before the fall. Kronos devoured " +
      "his children to prevent being overthrown, yet was overthrown anyway, teaching that control through fear " +
      "ultimately fails. Liz Greene's 'Saturn: A New Look at an Old Devil' revolutionized Saturn's reputation, " +
      "reframing the 'greater malefic' as the master teacher and builder. Saturn does not punish — Saturn reveals " +
      "what is structurally unsound and demands that you rebuild it to last.",
    insight:
      "The Saturn return — when Saturn completes its orbit and returns to its natal position — happens around " +
      "ages 28-30 and again around 57-60. The first Saturn return is one of the most significant transitions " +
      "in adult life: it is when you leave youth behind and step fully into adult responsibility. Relationships, " +
      "careers, and identities that are not authentically yours tend to fall apart during this period, making " +
      "room for what is truly solid.",
    minutes: 10,
  },
  {
    slug: "uranus",
    planet: "Uranus",
    title: "Uranus: The Awakener",
    intro:
      "Uranus is the planet of sudden insight, liberation, revolution, and the shattering of outworn structures. " +
      "Discovered in 1781 during the American and French Revolutions, Uranus entered astrology carrying the " +
      "energy of its historical moment: the overthrow of the old order, the birth of individual rights, and the " +
      "radical insistence that the future need not repeat the past. Uranus takes 84 years to orbit the Sun, " +
      "spending roughly 7 years in each sign. Its sign placement defines generational attitudes toward freedom, " +
      "technology, and social change. In your chart, Uranus' house placement shows where you are most original, " +
      "most rebellious, and most likely to experience sudden, electrifying breakthroughs. Mythologically, Uranus " +
      "maps to Prometheus — the Titan who stole fire from the gods and gave it to humanity, enduring eternal " +
      "punishment for the act of liberation. Prometheus is the archetype of the awakener who pays a price for " +
      "bringing consciousness forward. Every Uranus transit asks: what must be freed, and what are you willing " +
      "to risk to free it?",
    insight:
      "The Uranus opposition — when transiting Uranus opposes its natal position around age 40-42 — is the " +
      "astrological midlife crisis. It is a powerful jolt of awareness that life is finite and that unlived " +
      "possibilities demand attention. People who resist this energy experience disruption; those who cooperate " +
      "with it experience reinvention. The full Uranus return at age 84 marks the completion of one entire " +
      "cycle of awakening.",
    minutes: 10,
  },
  {
    slug: "neptune",
    planet: "Neptune",
    title: "Neptune: The Dissolver",
    intro:
      "Neptune is the planet of imagination, dissolution, transcendence, and the longing for something beyond " +
      "material reality. Where Saturn builds walls, Neptune dissolves them. Where Uranus shatters with a bolt, " +
      "Neptune erodes with fog and water — slowly, imperceptibly, until solid ground becomes ocean. Discovered " +
      "in 1846 during the rise of Romanticism, photography, anesthesia, and spiritualism, Neptune entered " +
      "astrology as the planet of both inspiration and illusion. It takes 165 years to orbit the Sun, spending " +
      "roughly 14 years in each sign, so its sign placement defines entire generational dreams and collective " +
      "fantasies. In your chart, Neptune's house shows where you are most idealistic, most creative, and most " +
      "vulnerable to deception — including self-deception. Mythologically, Neptune connects to Poseidon, god of " +
      "the sea — the vast, formless, emotionally overwhelming realm that lies beneath the surface of conscious " +
      "life. Poseidon could raise storms or calm waters; Neptune in your chart can drown you in confusion or " +
      "baptize you in creative genius, depending on how consciously you engage its energy.",
    insight:
      "Neptune transits are the foggiest periods in life — the ground shifts beneath you, certainties dissolve, " +
      "and it becomes impossible to see clearly. This is by design. Neptune removes false clarity to make room " +
      "for a deeper, more compassionate vision. The key to Neptune transits is surrender without passivity: " +
      "let go of rigid expectations while staying engaged with the creative and spiritual possibilities that " +
      "emerge from the mist.",
    minutes: 10,
  },
  {
    slug: "pluto",
    planet: "Pluto",
    title: "Pluto: The Transformer",
    intro:
      "Pluto is the planet of death, rebirth, power, and irreversible transformation. It governs everything " +
      "that operates beneath the surface — the unconscious drives, the hidden power dynamics, the taboo desires, " +
      "and the evolutionary forces that destroy what has outlived its purpose so that new life can emerge. " +
      "Discovered in 1930 as fascism rose and nuclear physics advanced, Pluto entered astrology carrying the " +
      "energy of both totalitarian power and atomic transformation. With a 248-year orbit and a wildly elliptical " +
      "path, Pluto spends between 12 and 31 years in a single sign, defining the deepest generational obsessions " +
      "and power struggles. In your chart, Pluto's house placement marks the area of life where you experience " +
      "the most profound transformation — often through crisis, loss, or confrontation with power. Mythologically, " +
      "Pluto maps to Hades, lord of the underworld — the invisible realm where all that is buried eventually " +
      "surfaces. Richard Tarnas, in 'Cosmos and Psyche,' proposed reframing Pluto's archetype as Dionysus rather " +
      "than Hades — emphasizing ecstatic transformation, the death of the ego through overwhelming experience, " +
      "and the primal life force that destroys and renews in the same gesture.",
    insight:
      "Pluto transits are the most intense experiences in astrology — they strip away everything inauthentic " +
      "and leave only what is essential. A Pluto transit to your Sun, Moon, or Ascendant can feel like a death " +
      "and rebirth of identity itself. The process is rarely comfortable and cannot be rushed. But what emerges " +
      "from a Pluto transit is forged in fire: more powerful, more authentic, and more aligned with your deepest " +
      "truth than anything that came before.",
    minutes: 10,
  },
];

// ── Further reading per planet ──

const PLANET_FURTHER_READING: Record<string, string> = {
  Sun:
    "Further Reading: 'The Luminaries' by Liz Greene and Howard Sasportas — a deep exploration of the Sun and Moon as the twin pillars of the birth chart.",
  Moon:
    "Further Reading: 'The Luminaries' by Liz Greene and Howard Sasportas — essential for understanding the Moon's role in emotional development and the parental imago.",
  Mercury:
    "Further Reading: 'The Inner Planets' by Liz Greene and Howard Sasportas — includes an incisive treatment of Mercury as the bridge between inner and outer worlds.",
  Venus:
    "Further Reading: 'The Inner Planets' by Liz Greene and Howard Sasportas — covers Venus' dual nature (morning star and evening star) and its role in the psychology of desire.",
  Mars:
    "Further Reading: 'The Inner Planets' by Liz Greene and Howard Sasportas — Mars' chapter explores aggression, assertion, and the warrior archetype in the birth chart.",
  Jupiter:
    "Further Reading: 'The Development of the Personality' by Liz Greene and Howard Sasportas — includes Jupiter's role in the search for meaning and the inflation trap.",
  Saturn:
    "Further Reading: 'Saturn: A New Look at an Old Devil' by Liz Greene — the definitive psychological astrology text on Saturn's role in personal growth, fear, and mastery.",
  Uranus:
    "Further Reading: 'Prometheus the Awakener' by Richard Tarnas — a brilliant exploration of the Uranus-Prometheus archetype and its role in cultural and personal breakthroughs.",
  Neptune:
    "Further Reading: 'The Astrological Neptune and the Quest for Redemption' by Liz Greene — the most comprehensive psychological treatment of Neptune's role in longing, illusion, and creative transcendence.",
  Pluto:
    "Further Reading: 'Cosmos and Psyche' by Richard Tarnas — reframes Pluto as the Dionysian principle and traces its archetypal influence through history.",
};

// ── Main generator ──

export function generatePlanetContent(lessonSlug: string): LessonContent | null {
  // Individual planet lessons
  const lesson = PLANET_LESSONS.find((l) => l.slug === lessonSlug);
  if (lesson) {
    const meaning = PLANET_MEANING[lesson.planet] || "";
    const sections: ContentSection[] = [
      text(lesson.title, lesson.intro),
      callout("tip", meaning),
      planetProfile(lesson.planet),
      callout("insight", lesson.insight),
    ];
    // Add planetary journey widget to Saturn lesson (Saturn Return AHA moment)
    if (lesson.planet === "Saturn" || lesson.planet === "Jupiter") {
      sections.push({ type: "planetary-journey" });
    }
    const furtherReading = PLANET_FURTHER_READING[lesson.planet];
    if (furtherReading) {
      sections.push(callout("tip", furtherReading));
    }
    return { sections, estimatedMinutes: lesson.minutes, keyTakeaway: meaning };
  }

  // Planets overview
  if (lessonSlug === "planets-overview") {
    const items = Object.entries(PLANET_MEANING).map(([planet, meaning]) => ({
      term: planet,
      definition: meaning,
    }));
    const sections: ContentSection[] = [
      text(
        "The Ten Planets",
        "In astrology, the word 'planet' is used loosely to include the Sun and Moon (technically a star and " +
        "a satellite), along with Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, and Pluto. Each " +
        "planet governs a specific dimension of human experience. The inner planets (Sun through Mars) move " +
        "quickly and describe personal, day-to-day psychology. The social planets (Jupiter and Saturn) move " +
        "more slowly and describe your relationship with society, growth, and discipline. The outer planets " +
        "(Uranus, Neptune, Pluto) move so slowly they define entire generations — their effects in your chart " +
        "are felt most strongly through the house they occupy and the aspects they make to personal planets."
      ),
      { type: "planetary-journey" },
      { type: "keyword-map", items },
      text(
        "Personal vs. Generational Planets",
        "The Sun, Moon, Mercury, Venus, and Mars change signs frequently enough that they create highly " +
        "individual chart signatures. These are the planets that describe your personality in the most " +
        "immediate sense. Jupiter and Saturn bridge the personal and collective — they describe how you " +
        "relate to social structures and growth cycles. Uranus, Neptune, and Pluto spend years or decades " +
        "in a single sign, so everyone born during that period shares their sign placement. Their personal " +
        "significance comes from which house they occupy and how they interact with your faster-moving planets."
      ),
      callout(
        "insight",
        "When interpreting a chart, always start with the Sun, Moon, and Ascendant (rising sign). These " +
        "three points form the foundation of identity. Then examine Mercury, Venus, and Mars for mental, " +
        "emotional, and action styles. Finally, look at Jupiter through Pluto for broader life themes and " +
        "generational influences."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 10,
      keyTakeaway: "Each planet governs a specific dimension of experience, from personal identity (Sun) to collective transformation (Pluto).",
    };
  }

  // Outer planets group
  if (lessonSlug === "uranus-neptune-pluto") {
    const sections: ContentSection[] = [
      text(
        "The Outer Planets: Uranus, Neptune, and Pluto",
        "Beyond Saturn lies the territory of the transpersonal. Uranus, Neptune, and Pluto were not known to " +
        "ancient astrologers — they were discovered in 1781, 1846, and 1930 respectively. Their orbital periods " +
        "are so long (84, 165, and 248 years) that they define entire generational cohorts rather than individual " +
        "personalities. Uranus spends about 7 years in each sign, Neptune about 14 years, and Pluto anywhere " +
        "from 12 to 31 years depending on its elliptical orbit. When these planets aspect your personal planets " +
        "or occupy angular houses in your chart, their effects are profound, transformative, and often feel " +
        "larger than your individual life."
      ),
      planetProfile("Uranus"),
      planetProfile("Neptune"),
      planetProfile("Pluto"),
      callout(
        "insight",
        "The outer planets act as agents of collective evolution. Uranus disrupts what has stagnated, " +
        "Neptune dissolves what has hardened, and Pluto destroys what is corrupt. Their transits through " +
        "your chart mark the periods of deepest and most irreversible change — the kind of change that " +
        "you recognize as necessary only in hindsight."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 14,
      keyTakeaway: "Uranus, Neptune, and Pluto define generational themes and catalyze the deepest personal transformations.",
    };
  }

  // Chiron and the Nodes
  if (lessonSlug === "chiron-and-nodes") {
    const sections: ContentSection[] = [
      text(
        "Chiron: The Wounded Healer",
        "Chiron is a small body orbiting between Saturn and Uranus, discovered in 1977. In mythology, Chiron " +
        "was a centaur who was a gifted healer but could not heal his own wound. In your chart, Chiron's " +
        "position shows your deepest wound — the place where you carry pain that feels unhealable. But the " +
        "paradox of Chiron is that this very wound becomes the source of your greatest gift to others. By " +
        "sitting with your own pain rather than running from it, you develop a compassion and wisdom that " +
        "allows you to guide others through similar suffering. Chiron's orbit takes about 50 years, and the " +
        "Chiron return (around age 50) marks a profound reckoning with your core wound and healing mission."
      ),
      text(
        "The Lunar Nodes: Your Karmic Path",
        "The North Node and South Node are not physical bodies — they are the points where the Moon's orbit " +
        "crosses the ecliptic (the Sun's apparent path). The South Node represents what you have already " +
        "mastered — skills, patterns, and comfort zones you bring from the past (some astrologers say past " +
        "lives). The North Node represents where you are headed — the qualities your soul is trying to develop " +
        "in this lifetime. The South Node feels easy but can become a trap of repetition. The North Node feels " +
        "uncomfortable but brings deep fulfillment when pursued. Together, the Nodes describe the axis of your " +
        "spiritual growth."
      ),
      callout(
        "insight",
        "The Nodes always fall in opposite signs. If your North Node is in Aries, your South Node is in Libra, " +
        "meaning you have mastered the art of partnership and harmony but need to develop individual courage and " +
        "self-assertion. The nodal axis is one of the most personally revealing points in any chart — it cuts " +
        "straight to the purpose of your life."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 10,
      keyTakeaway: "Chiron reveals your deepest wound and healing gift; the Lunar Nodes map the direction of your soul's growth.",
    };
  }

  // Dignities and debilities
  if (lessonSlug === "dignities-and-debilities") {
    const sections: ContentSection[] = [
      text(
        "Planetary Dignity: Where Planets Thrive and Struggle",
        "Not every planet is equally comfortable in every sign. The ancient system of dignities and debilities " +
        "describes how well a planet can express its nature depending on its sign placement. A planet in its " +
        "domicile (the sign it rules) is like a person in their own home — fully empowered and at ease. A " +
        "planet in its exaltation is honored and elevated, performing at its best. A planet in its detriment " +
        "(the sign opposite its domicile) is in foreign territory, forced to express itself in an unfamiliar " +
        "way. A planet in its fall (the sign opposite its exaltation) is at its most challenged, needing extra " +
        "effort to function well."
      ),
      {
        type: "comparison-table",
        headers: ["Planet", "Domicile (Rules)", "Exaltation", "Detriment", "Fall"],
        rows: [
          ["Sun", "Leo", "Aries", "Aquarius", "Libra"],
          ["Moon", "Cancer", "Taurus", "Capricorn", "Scorpio"],
          ["Mercury", "Gemini, Virgo", "Virgo", "Sagittarius, Pisces", "Pisces"],
          ["Venus", "Taurus, Libra", "Pisces", "Scorpio, Aries", "Virgo"],
          ["Mars", "Aries, Scorpio", "Capricorn", "Libra, Taurus", "Cancer"],
          ["Jupiter", "Sagittarius, Pisces", "Cancer", "Gemini, Virgo", "Capricorn"],
          ["Saturn", "Capricorn, Aquarius", "Libra", "Cancer, Leo", "Aries"],
        ],
      },
      text(
        "Working with Difficult Placements",
        "A planet in detriment or fall is not 'bad' — it simply requires more conscious effort to express " +
        "constructively. Venus in Scorpio (detriment) loves with more intensity and transformative power than " +
        "Venus in any other sign, precisely because it must work harder. Mars in Cancer (fall) may not be " +
        "aggressive in conventional ways but develops a fierce protective instinct that is uniquely powerful. " +
        "Some of the most compelling people in history had heavily debilitated charts — the struggle created " +
        "depth and originality that comfortable placements never would."
      ),
      callout(
        "tip",
        "When reading a chart, note which planets are dignified and which are debilitated. Dignified planets " +
        "represent natural strengths. Debilitated planets represent growth edges — areas where the person " +
        "must develop skills that do not come easily but ultimately become their most hard-won wisdom."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 12,
      keyTakeaway: "Planetary dignity shows where each planet thrives or struggles — debilitated placements demand effort but produce depth.",
    };
  }

  // Retrograde reality
  if (lessonSlug === "retrograde-reality") {
    const sections: ContentSection[] = [
      text(
        "What Retrograde Actually Means",
        "When a planet is retrograde, it appears to move backward through the zodiac from Earth's perspective. " +
        "This is an optical illusion caused by the relative speeds and positions of Earth and the other planet " +
        "in their orbits — like when you pass a slower car on the highway and it appears to move backward " +
        "relative to you. No planet actually reverses direction. But in astrological practice, retrograde " +
        "periods correspond to a turning inward of the planet's energy. What normally operates outwardly and " +
        "automatically becomes reflective, reviewing, and sometimes unreliable in its external expression."
      ),
      text(
        "Mercury Retrograde",
        "Mercury retrogrades three to four times per year, each lasting about three weeks. During these periods, " +
        "communication can become confused, technology may glitch, travel plans may shift, and misunderstandings " +
        "are more common. But Mercury retrograde is also an excellent time for revision, reunion, reorganization, " +
        "and any activity beginning with 're-'. The key is to avoid launching brand-new initiatives during " +
        "retrograde and instead use the period to revisit and refine existing work."
      ),
      text(
        "Venus and Mars Retrograde",
        "Venus retrogrades for about 40 days every 18 months, turning the lens of love and values inward. " +
        "Old lovers may resurface, relationship values get reassessed, and aesthetic preferences shift. It is " +
        "traditionally not recommended to begin new relationships or make major purchases during Venus retrograde. " +
        "Mars retrogrades for about 10 weeks every two years, slowing physical energy and forcing a reassessment " +
        "of goals and assertion strategies. Anger that has been suppressed may surface during Mars retrograde."
      ),
      text(
        "Outer Planet Retrogrades",
        "Jupiter, Saturn, Uranus, Neptune, and Pluto are retrograde for months at a time each year. Because " +
        "their retrogrades are so common, they are less dramatic in their effects. However, when an outer planet " +
        "stations (the moment it appears to stop before changing direction), its energy concentrates powerfully. " +
        "Transiting outer planet stations that land on sensitive points in your natal chart often correspond with " +
        "significant turning points."
      ),
      callout(
        "insight",
        "If you were born during a retrograde period of any planet, that planet's energy operates differently " +
        "for you throughout life. Natal retrograde planets tend to internalize their expression — a natal Mercury " +
        "retrograde person may be a deep, original thinker who processes internally before speaking. About 20% " +
        "of people have Mercury retrograde in their birth chart."
      ),
    ];
    return {
      sections,
      estimatedMinutes: 12,
      keyTakeaway: "Retrograde periods turn a planet's energy inward — they are times for revision, reflection, and re-evaluation.",
    };
  }

  return null;
}
