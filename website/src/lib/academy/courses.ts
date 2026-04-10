/**
 * courses.ts — Complete academy curriculum data
 *
 * 14 courses across 3 tracks (Astrology, Tarot, Integrated)
 * Each course has metadata + lesson list
 */

export type Track = "astrology" | "tarot" | "integrated";
export type Level = "beginner" | "intermediate" | "advanced" | "capstone";

export interface Lesson {
  slug: string;
  title: string;
  description: string;
  duration: number; // minutes
  type: "reading" | "interactive" | "quiz" | "practice";
}

export interface Course {
  slug: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  track: Track;
  level: Level;
  icon: string;
  color: string;
  lessons: Lesson[];
  duration: string; // e.g. "3-4 weeks"
  topics: string[];
}

export const COURSES: Course[] = [
  // ════════════════════════════════════════
  // TRACK 1: ASTROLOGY — BEGINNER
  // ════════════════════════════════════════
  {
    slug: "cosmic-alphabet",
    number: 1,
    title: "The Cosmic Alphabet",
    subtitle: "Your First Steps Into Astrology",
    description: "Learn the fundamental building blocks of astrology — the 12 zodiac signs, their elements, modalities, and how to read your birth chart as a map of your psyche.",
    track: "astrology",
    level: "beginner",
    icon: "♈",
    color: "#FF6B35",
    duration: "3-4 weeks",
    topics: ["Zodiac signs", "Elements & modalities", "The Big Three", "Reading a birth chart", "Polarities"],
    lessons: [
      { slug: "what-is-astrology", title: "What Is Astrology?", description: "History from Babylon to modern psychological astrology. What it is and what it isn't.", duration: 15, type: "reading" },
      { slug: "the-zodiac-wheel", title: "The Zodiac Wheel", description: "12 signs, their order, and the logic behind the cycle from Aries to Pisces.", duration: 12, type: "reading" },
      { slug: "elements-fire-earth-air-water", title: "The Four Elements", description: "Fire, Earth, Air, Water — the temperaments that color every sign.", duration: 15, type: "interactive" },
      { slug: "modalities-cardinal-fixed-mutable", title: "The Three Modalities", description: "Cardinal initiates, Fixed sustains, Mutable adapts — the operating modes.", duration: 12, type: "reading" },
      { slug: "aries-taurus-gemini", title: "Aries, Taurus & Gemini", description: "The first three signs: the pioneer, the builder, the communicator.", duration: 20, type: "reading" },
      { slug: "cancer-leo-virgo", title: "Cancer, Leo & Virgo", description: "The nurturer, the sovereign, the craftsperson.", duration: 20, type: "reading" },
      { slug: "libra-scorpio-sagittarius", title: "Libra, Scorpio & Sagittarius", description: "The diplomat, the alchemist, the explorer.", duration: 20, type: "reading" },
      { slug: "capricorn-aquarius-pisces", title: "Capricorn, Aquarius & Pisces", description: "The architect, the visionary, the mystic.", duration: 20, type: "reading" },
      { slug: "polarities-and-mirrors", title: "Polarities & Sign Relationships", description: "Opposite signs as mirrors — Aries/Libra, Taurus/Scorpio, and the rest.", duration: 12, type: "reading" },
      { slug: "reading-your-birth-chart", title: "Reading Your Birth Chart", description: "How to pull up your chart and understand the wheel, glyphs, and symbols.", duration: 15, type: "interactive" },
      { slug: "your-big-three", title: "Your Big Three Revealed", description: "Sun, Moon, and Rising — the three pillars of your cosmic identity.", duration: 18, type: "interactive" },
      { slug: "signs-quiz", title: "The Cosmic Alphabet Quiz", description: "Test your knowledge of signs, elements, and modalities.", duration: 10, type: "quiz" },
    ],
  },
  {
    slug: "celestial-players",
    number: 2,
    title: "The Celestial Players",
    subtitle: "Understanding the Planets",
    description: "The planets are the actors on your chart's stage. Each governs a different dimension of your psyche. Learn all 10 planets plus Chiron and the Lunar Nodes.",
    track: "astrology",
    level: "beginner",
    icon: "☉",
    color: "#FFD700",
    duration: "4 weeks",
    topics: ["Sun & Moon", "Personal planets", "Social planets", "Outer planets", "Chiron & Nodes", "Dignities", "Retrogrades"],
    lessons: [
      { slug: "planets-overview", title: "The Planetary Cast", description: "Why planets matter more than signs — they're the what, signs are the how.", duration: 12, type: "reading" },
      { slug: "the-sun", title: "The Sun — Your Core Identity", description: "Vitality, ego, life purpose. The center of your chart.", duration: 15, type: "reading" },
      { slug: "the-moon", title: "The Moon — Your Emotional Nature", description: "Instincts, needs, childhood patterns. Your inner world.", duration: 15, type: "reading" },
      { slug: "mercury", title: "Mercury — Your Mind", description: "Communication, thinking style, learning. How you process information.", duration: 12, type: "reading" },
      { slug: "venus", title: "Venus — Your Heart", description: "Love, beauty, values. What you attract and what you find worthy.", duration: 12, type: "reading" },
      { slug: "mars", title: "Mars — Your Drive", description: "Action, desire, assertion, anger. How you fight and pursue.", duration: 12, type: "reading" },
      { slug: "jupiter", title: "Jupiter — Your Growth", description: "Expansion, faith, abundance, luck. Where life gets bigger.", duration: 12, type: "reading" },
      { slug: "saturn", title: "Saturn — Your Discipline", description: "Structure, limits, karma, mastery. The teacher who tests before rewarding.", duration: 15, type: "reading" },
      { slug: "uranus-neptune-pluto", title: "The Outer Planets", description: "Uranus (revolution), Neptune (dreams), Pluto (transformation). Generational forces.", duration: 18, type: "reading" },
      { slug: "chiron-and-nodes", title: "Chiron & The Lunar Nodes", description: "The Wounded Healer and your karmic direction.", duration: 15, type: "reading" },
      { slug: "planetary-dignities", title: "Planetary Dignities", description: "Domicile, exaltation, detriment, fall — when planets are strong or struggling.", duration: 15, type: "reading" },
      { slug: "retrograde-motion", title: "Retrograde Motion", description: "What it really means when planets appear to move backward.", duration: 12, type: "reading" },
      { slug: "your-planets-revealed", title: "Your Planets Revealed", description: "Interactive walkthrough of every planet in YOUR chart.", duration: 20, type: "interactive" },
      { slug: "planets-quiz", title: "The Celestial Players Quiz", description: "Match planets to meanings, identify dignities, spot retrogrades.", duration: 10, type: "quiz" },
    ],
  },
  {
    slug: "life-arenas",
    number: 3,
    title: "The Life Arenas",
    subtitle: "The 12 Houses of Your Birth Chart",
    description: "If signs are 'how' and planets are 'what,' houses are 'where.' The 12 houses divide your life into domains — identity, money, love, career, and beyond.",
    track: "astrology",
    level: "beginner",
    icon: "◎",
    color: "#7B68EE",
    duration: "4 weeks",
    topics: ["House systems", "Angular houses", "Succedent houses", "Cadent houses", "Empty houses", "House rulers"],
    lessons: [
      { slug: "what-are-houses", title: "What Are Houses?", description: "The 12 life arenas and how they're calculated.", duration: 12, type: "reading" },
      { slug: "house-1-self", title: "1st House — Self & Identity", description: "First impressions, physical body, the mask you wear.", duration: 10, type: "reading" },
      { slug: "house-2-values", title: "2nd House — Money & Values", description: "Possessions, self-worth, what you earn and value.", duration: 10, type: "reading" },
      { slug: "house-3-communication", title: "3rd House — Communication", description: "Speaking, writing, siblings, local environment.", duration: 10, type: "reading" },
      { slug: "house-4-home", title: "4th House — Home & Roots", description: "Family, ancestry, emotional foundation, private life.", duration: 10, type: "reading" },
      { slug: "house-5-creativity", title: "5th House — Creativity & Romance", description: "Self-expression, dating, children, play, joy.", duration: 10, type: "reading" },
      { slug: "house-6-health", title: "6th House — Health & Service", description: "Daily routines, work, wellness, being useful.", duration: 10, type: "reading" },
      { slug: "house-7-partnership", title: "7th House — Partnership", description: "Marriage, committed relationships, contracts.", duration: 10, type: "reading" },
      { slug: "house-8-transformation", title: "8th House — Transformation", description: "Shared resources, sex, death, rebirth, other people's money.", duration: 10, type: "reading" },
      { slug: "house-9-philosophy", title: "9th House — Philosophy & Travel", description: "Higher education, foreign lands, belief systems.", duration: 10, type: "reading" },
      { slug: "house-10-career", title: "10th House — Career & Legacy", description: "Public reputation, ambition, authority, life direction.", duration: 10, type: "reading" },
      { slug: "house-11-community", title: "11th House — Community & Dreams", description: "Friendships, groups, hopes, social causes.", duration: 10, type: "reading" },
      { slug: "house-12-subconscious", title: "12th House — The Subconscious", description: "Hidden things, solitude, spirituality, self-undoing.", duration: 10, type: "reading" },
      { slug: "houses-quiz", title: "The Life Arenas Quiz", description: "Match life events to houses, identify house rulers.", duration: 10, type: "quiz" },
    ],
  },

  // ════════════════════════════════════════
  // TRACK 1: ASTROLOGY — INTERMEDIATE
  // ════════════════════════════════════════
  {
    slug: "conversation-between-planets",
    number: 4,
    title: "The Conversation Between Planets",
    subtitle: "Aspects, Patterns & Chart Geometry",
    description: "Aspects are the angular relationships between planets that create harmony, tension, and dynamic energy. This is where astrology comes alive.",
    track: "astrology",
    level: "intermediate",
    icon: "△",
    color: "#4ECDC4",
    duration: "5 weeks",
    topics: ["Conjunction", "Sextile", "Square", "Trine", "Opposition", "Minor aspects", "Orbs", "Grand Trine", "T-Square", "Yod"],
    lessons: [
      { slug: "what-are-aspects", title: "What Are Aspects?", description: "Angular relationships between planets — the conversation that makes your chart unique.", duration: 15, type: "reading" },
      { slug: "conjunction", title: "The Conjunction (0°)", description: "Fusion — planets merge and amplify. The most powerful aspect.", duration: 12, type: "reading" },
      { slug: "sextile", title: "The Sextile (60°)", description: "Opportunity — gentle cooperation that rewards conscious effort.", duration: 12, type: "reading" },
      { slug: "square", title: "The Square (90°)", description: "Tension — the engine of your chart. Friction that builds strength.", duration: 15, type: "reading" },
      { slug: "trine", title: "The Trine (120°)", description: "Flow — natural ease and gifts so innate they may go unnoticed.", duration: 12, type: "reading" },
      { slug: "opposition", title: "The Opposition (180°)", description: "Awareness — a seesaw between polarities that demands integration.", duration: 12, type: "reading" },
      { slug: "minor-aspects", title: "Minor Aspects", description: "Semi-sextile, quincunx, semi-square, quintile — subtle but real.", duration: 15, type: "reading" },
      { slug: "orbs-and-strength", title: "Orbs & Aspect Strength", description: "How close aspects need to be to 'count' — tight vs. wide orbs.", duration: 10, type: "reading" },
      { slug: "grand-trine", title: "The Grand Trine", description: "Three planets in harmony — natural talent with a risk of complacency.", duration: 12, type: "reading" },
      { slug: "t-square", title: "The T-Square", description: "Dynamic tension pointed at an apex — tremendous drive.", duration: 12, type: "reading" },
      { slug: "grand-cross", title: "The Grand Cross", description: "Four-way tension — the hardest pattern, the greatest potential.", duration: 12, type: "reading" },
      { slug: "yod-finger-of-god", title: "The Yod (Finger of God)", description: "Fated redirection — a crisis that reveals purpose.", duration: 12, type: "reading" },
      { slug: "stellium-and-patterns", title: "Stelliums & Other Patterns", description: "Concentrated energy, mystic rectangles, kites.", duration: 12, type: "reading" },
      { slug: "your-aspects-revealed", title: "Your Aspects Revealed", description: "Interactive visualizer showing every aspect in YOUR chart.", duration: 20, type: "interactive" },
      { slug: "aspect-scenarios", title: "Feel The Aspect", description: "Story-based scenarios — how does Mars square Venus play out?", duration: 15, type: "practice" },
      { slug: "aspects-quiz", title: "Aspects & Patterns Quiz", description: "Identify aspects, calculate orbs, spot patterns.", duration: 10, type: "quiz" },
    ],
  },
  {
    slug: "unfolding-story",
    number: 5,
    title: "The Unfolding Story",
    subtitle: "Transits, Progressions & Predictive Astrology",
    description: "Your birth chart is a snapshot — but the planets keep moving. Learn how transits activate your chart over time, enabling you to understand timing and life chapters.",
    track: "astrology",
    level: "intermediate",
    icon: "⟳",
    color: "#CE93D8",
    duration: "6 weeks",
    topics: ["Transits", "Saturn Return", "Eclipse cycles", "Progressions", "Solar Returns", "Profections"],
    lessons: [
      { slug: "transits-intro", title: "What Are Transits?", description: "The current sky touching your birth chart — cosmic weather.", duration: 12, type: "reading" },
      { slug: "fast-transits", title: "Fast-Moving Transits", description: "Moon, Mercury, Venus, Sun, Mars — daily and weekly shifts.", duration: 15, type: "reading" },
      { slug: "jupiter-transits", title: "Jupiter Transits", description: "One year per sign — expansion, luck, and growth cycles.", duration: 12, type: "reading" },
      { slug: "saturn-transits", title: "Saturn Transits", description: "2.5 years per sign — restructuring, testing, mastery.", duration: 15, type: "reading" },
      { slug: "saturn-return", title: "The Saturn Return", description: "The most important transit — ages 29, 58, 87. Your cosmic graduation.", duration: 18, type: "reading" },
      { slug: "uranus-transits", title: "Uranus Transits", description: "7 years per sign — disruption, awakening, freedom.", duration: 12, type: "reading" },
      { slug: "neptune-pluto-transits", title: "Neptune & Pluto Transits", description: "The longest, deepest transits — dissolution and transformation.", duration: 15, type: "reading" },
      { slug: "eclipse-cycles", title: "Eclipse Cycles", description: "Solar and lunar eclipses as catalysts for sudden change.", duration: 15, type: "reading" },
      { slug: "retrograde-transits", title: "Retrograde Transits", description: "Review periods — especially Mercury, Venus, Mars retrogrades.", duration: 12, type: "reading" },
      { slug: "secondary-progressions", title: "Secondary Progressions", description: "A day for a year — your internal evolution.", duration: 15, type: "reading" },
      { slug: "solar-returns", title: "Solar Returns", description: "Your birthday chart as a forecast for the year ahead.", duration: 15, type: "reading" },
      { slug: "profections", title: "Annual Profections", description: "Ancient technique: which house lord rules each year of your life.", duration: 12, type: "reading" },
      { slug: "your-transits-now", title: "Your Transits Right Now", description: "Live overlay of current transits hitting YOUR chart.", duration: 20, type: "interactive" },
      { slug: "transit-timeline", title: "Your Transit Timeline", description: "Scrub through past and future to see major life transits.", duration: 20, type: "interactive" },
      { slug: "what-happened-when", title: "What Happened When?", description: "Input a major life event and see which transits were active.", duration: 15, type: "practice" },
      { slug: "saturn-return-calculator", title: "Saturn Return Calculator", description: "Find your exact Saturn Return dates with a personal guide.", duration: 10, type: "interactive" },
      { slug: "solar-return-generator", title: "Your Solar Return", description: "Generate and interpret your next birthday chart.", duration: 15, type: "interactive" },
      { slug: "transits-quiz", title: "Predictive Astrology Quiz", description: "Identify transits, predict themes, calculate timing.", duration: 10, type: "quiz" },
    ],
  },
  {
    slug: "astrology-of-relationships",
    number: 6,
    title: "The Astrology of Relationships",
    subtitle: "Synastry, Composite Charts & Love Languages",
    description: "How do two charts interact? Learn to read chemistry, challenges, and karmic bonds between any two people.",
    track: "astrology",
    level: "intermediate",
    icon: "♡",
    color: "#FF69B4",
    duration: "5 weeks",
    topics: ["Synastry", "Composite charts", "Venus-Mars dynamics", "7th house", "Karmic ties", "Timing in love"],
    lessons: [
      { slug: "synastry-intro", title: "What Is Synastry?", description: "Comparing two charts — how your planets land in their houses.", duration: 15, type: "reading" },
      { slug: "venus-mars-attraction", title: "Venus-Mars Aspects", description: "The chemistry axis — attraction, desire, magnetic pull.", duration: 12, type: "reading" },
      { slug: "sun-moon-bond", title: "Sun-Moon Connections", description: "Identity meets emotion — the deepest compatibility indicator.", duration: 12, type: "reading" },
      { slug: "saturn-in-synastry", title: "Saturn in Synastry", description: "Commitment or restriction? The glue that binds — or suffocates.", duration: 12, type: "reading" },
      { slug: "outer-planets-synastry", title: "Pluto, Neptune & Uranus in Love", description: "Power dynamics, idealization, and electrifying instability.", duration: 15, type: "reading" },
      { slug: "nodal-connections", title: "Karmic Ties — The Nodes", description: "Past-life connections and fated encounters in synastry.", duration: 12, type: "reading" },
      { slug: "the-descendant", title: "Your Descendant", description: "The 7th house cusp — what you attract and need in partnership.", duration: 12, type: "reading" },
      { slug: "composite-charts", title: "Composite Charts", description: "The relationship's own birth chart — a third entity.", duration: 15, type: "reading" },
      { slug: "composite-sun-moon", title: "Composite Sun & Moon", description: "The relationship's identity and emotional climate.", duration: 12, type: "reading" },
      { slug: "composite-venus-mars-saturn", title: "Composite Venus, Mars & Saturn", description: "Love expression, passion dynamics, and what holds it together.", duration: 12, type: "reading" },
      { slug: "timing-in-relationships", title: "Timing in Relationships", description: "Transits to composite charts — when love evolves or ends.", duration: 12, type: "reading" },
      { slug: "synastry-builder", title: "Build Your Synastry", description: "Enter two birth dates and explore the overlay chart.", duration: 20, type: "interactive" },
      { slug: "famous-couples", title: "Famous Couples Analysis", description: "Analyze real relationship charts and spot the patterns.", duration: 15, type: "practice" },
      { slug: "relationships-quiz", title: "Relationship Astrology Quiz", description: "Identify synastry patterns, read composite charts.", duration: 10, type: "quiz" },
    ],
  },

  // ════════════════════════════════════════
  // TRACK 1: ASTROLOGY — ADVANCED
  // ════════════════════════════════════════
  {
    slug: "advanced-interpretation",
    number: 7,
    title: "Advanced Interpretation",
    subtitle: "Chart Synthesis & Specialized Techniques",
    description: "Move from reading individual pieces to weaving a coherent narrative. Hellenistic techniques, horary, electional, and professional-level synthesis.",
    track: "astrology",
    level: "advanced",
    icon: "◈",
    color: "#D4AF37",
    duration: "7 weeks",
    topics: ["Chart synthesis", "Sect", "Essential dignities", "Hellenistic techniques", "Horary", "Electional", "Mundane", "Ethics"],
    lessons: [
      { slug: "chart-synthesis", title: "Chart Synthesis", description: "How to prioritize: chart ruler, most aspected planet, angular planets.", duration: 20, type: "reading" },
      { slug: "sect", title: "Sect — Day vs Night Charts", description: "How being born during day or night changes planetary beneficence.", duration: 15, type: "reading" },
      { slug: "essential-dignities-deep", title: "Essential Dignities Deep Dive", description: "Peregrine, mutual reception, dispositorship chains.", duration: 18, type: "reading" },
      { slug: "house-systems-compared", title: "House Systems Compared", description: "Whole Sign vs Placidus vs Koch — when and why to use each.", duration: 15, type: "reading" },
      { slug: "hellenistic-lots", title: "Hellenistic Lots", description: "Part of Fortune, Part of Spirit, and other calculated points.", duration: 15, type: "reading" },
      { slug: "zodiacal-releasing", title: "Zodiacal Releasing", description: "Ancient timing technique using the Lot of Spirit.", duration: 18, type: "reading" },
      { slug: "horary-astrology", title: "Horary Astrology", description: "Answering specific questions with a chart for the moment asked.", duration: 20, type: "reading" },
      { slug: "electional-astrology", title: "Electional Astrology", description: "Choosing the best time to start something.", duration: 15, type: "reading" },
      { slug: "mundane-astrology", title: "Mundane Astrology", description: "Reading charts of nations, events, and world cycles.", duration: 15, type: "reading" },
      { slug: "medical-astrology", title: "Medical Astrology Foundations", description: "Planets and body parts, 6th house health indicators.", duration: 12, type: "reading" },
      { slug: "vocational-astrology", title: "Vocational Astrology", description: "Using the MC, 10th house ruler, and Saturn for career guidance.", duration: 15, type: "reading" },
      { slug: "chart-rectification", title: "Chart Rectification", description: "Determining an unknown birth time from life events.", duration: 18, type: "reading" },
      { slug: "synthesis-workshop-1", title: "Synthesis Workshop I", description: "Full chart interpretation practice with AI feedback.", duration: 25, type: "practice" },
      { slug: "synthesis-workshop-2", title: "Synthesis Workshop II", description: "Complex chart with stelliums and multiple patterns.", duration: 25, type: "practice" },
      { slug: "horary-practice", title: "Horary Practice Lab", description: "Submit real questions and work through the judgment.", duration: 20, type: "practice" },
      { slug: "electional-calendar", title: "Electional Calendar Tool", description: "Find favorable windows for activities using current transits.", duration: 15, type: "interactive" },
      { slug: "ethics-in-astrology", title: "Ethics & Boundaries", description: "What to do when clients ask about death, illness, third parties.", duration: 15, type: "reading" },
      { slug: "mock-consultation-1", title: "Mock Consultation I", description: "Deliver a practice reading with structure and empathy.", duration: 20, type: "practice" },
      { slug: "mock-consultation-2", title: "Mock Consultation II", description: "Handle a difficult chart with challenging aspects.", duration: 20, type: "practice" },
      { slug: "advanced-quiz", title: "Advanced Techniques Quiz", description: "Chart synthesis, sect, horary, electional — the full test.", duration: 15, type: "quiz" },
    ],
  },
  {
    slug: "living-practice",
    number: 8,
    title: "The Living Practice",
    subtitle: "Building Your Astrological Practice",
    description: "Bridge knowledge and real-world application. Conduct real readings, build a reference system, and develop your unique voice.",
    track: "astrology",
    level: "advanced",
    icon: "✦",
    color: "#B0BEC5",
    duration: "4 weeks",
    topics: ["Professional readings", "Reading structure", "Building a practice", "Content creation", "Burnout prevention"],
    lessons: [
      { slug: "structuring-a-reading", title: "Structuring a Professional Reading", description: "Intake, preparation, delivery, follow-up — the full arc.", duration: 18, type: "reading" },
      { slug: "reading-for-yourself", title: "Reading For Yourself vs Others", description: "Different skill sets, different blind spots, different ethics.", duration: 12, type: "reading" },
      { slug: "developing-your-style", title: "Developing Your Style", description: "Psychological, spiritual, predictive, or blended — find your voice.", duration: 15, type: "reading" },
      { slug: "building-a-portfolio", title: "Building a Portfolio", description: "Document your practice readings and build credibility.", duration: 12, type: "reading" },
      { slug: "business-of-astrology", title: "The Business Side", description: "Pricing, booking, online presence, client management.", duration: 15, type: "reading" },
      { slug: "creating-content", title: "Creating Astrological Content", description: "Writing horoscopes, teaching, social media, video.", duration: 15, type: "reading" },
      { slug: "integrating-with-tarot", title: "Integrating Astrology With Tarot", description: "How the two systems enhance each other in practice.", duration: 12, type: "reading" },
      { slug: "burnout-prevention", title: "The Astrologer's Self-Care", description: "Using your own chart for awareness and burnout prevention.", duration: 12, type: "reading" },
      { slug: "practice-reading-exchange", title: "Practice Reading Exchange", description: "Paired with another student for mutual chart readings.", duration: 30, type: "practice" },
      { slug: "graduation-reading", title: "Your Graduation Reading", description: "A personalized forecast for your next year — your cosmic gift.", duration: 20, type: "interactive" },
    ],
  },

  // ════════════════════════════════════════
  // TRACK 2: TAROT — BEGINNER
  // ════════════════════════════════════════
  {
    slug: "fools-journey",
    number: 9,
    title: "The Fool's Journey Begins",
    subtitle: "Introduction to Tarot & The Major Arcana",
    description: "The 22 Major Arcana tell the story of the soul's journey. Learn the meaning of each card, its symbolism, and begin developing your intuitive connection.",
    track: "tarot",
    level: "beginner",
    icon: "🃏",
    color: "#9C27B0",
    duration: "5 weeks",
    topics: ["Tarot history", "22 Major Arcana", "The Fool's Journey", "Symbolism", "Upright vs reversed"],
    lessons: [
      { slug: "tarot-intro", title: "What Is Tarot?", description: "From 15th-century Italian card games to modern divinatory tool.", duration: 15, type: "reading" },
      { slug: "deck-anatomy", title: "Anatomy of a Deck", description: "78 cards = 22 Major Arcana + 56 Minor Arcana. The structure.", duration: 10, type: "reading" },
      { slug: "fool-magician", title: "The Fool & The Magician", description: "Innocence meets willpower. The journey begins.", duration: 15, type: "reading" },
      { slug: "high-priestess-empress", title: "The High Priestess & The Empress", description: "Mystery and abundance. The feminine divine.", duration: 15, type: "reading" },
      { slug: "emperor-hierophant", title: "The Emperor & The Hierophant", description: "Authority and tradition. Structure and spiritual law.", duration: 15, type: "reading" },
      { slug: "lovers-chariot", title: "The Lovers & The Chariot", description: "Choice and determination. Alignment and triumph.", duration: 15, type: "reading" },
      { slug: "strength-hermit", title: "Strength & The Hermit", description: "Inner courage and inner guidance. Power through patience.", duration: 15, type: "reading" },
      { slug: "wheel-justice", title: "Wheel of Fortune & Justice", description: "Fate and fairness. What turns and what balances.", duration: 15, type: "reading" },
      { slug: "hanged-man-death", title: "The Hanged Man & Death", description: "Surrender and transformation. The hardest lessons.", duration: 15, type: "reading" },
      { slug: "temperance-devil", title: "Temperance & The Devil", description: "Balance and bondage. Moderation and shadow.", duration: 15, type: "reading" },
      { slug: "tower-star", title: "The Tower & The Star", description: "Destruction and hope. Breakthrough and healing.", duration: 15, type: "reading" },
      { slug: "moon-sun", title: "The Moon & The Sun", description: "Illusion and joy. Fear and vitality.", duration: 15, type: "reading" },
      { slug: "judgement-world", title: "Judgement & The World", description: "Reckoning and completion. The journey fulfilled.", duration: 15, type: "reading" },
      { slug: "upright-vs-reversed", title: "Upright vs Reversed", description: "The philosophy and practice of reading reversals.", duration: 12, type: "reading" },
      { slug: "symbolism-literacy", title: "Reading Card Symbolism", description: "Colors, numbers, animals, objects — the hidden language.", duration: 15, type: "reading" },
      { slug: "card-a-day-intro", title: "Card of the Day Practice", description: "Your daily draw ritual — meaning, journaling, tracking.", duration: 10, type: "interactive" },
      { slug: "fools-journey-story", title: "Tell The Story", description: "Arrange the Major Arcana and narrate the journey.", duration: 15, type: "practice" },
      { slug: "symbol-spotter", title: "Symbol Spotter", description: "Zoom into card imagery and identify hidden symbols.", duration: 12, type: "interactive" },
      { slug: "major-arcana-memory", title: "Major Arcana Memory Game", description: "Match cards to keywords in a timed game.", duration: 10, type: "quiz" },
    ],
  },
  {
    slug: "world-in-four-suits",
    number: 10,
    title: "The World in Four Suits",
    subtitle: "The Minor Arcana & Court Cards",
    description: "56 cards mapping everyday life. Four suits reveal the nuances of emotion, thought, action, and material reality. Court Cards represent personality types.",
    track: "tarot",
    level: "beginner",
    icon: "♠",
    color: "#4CAF50",
    duration: "5 weeks",
    topics: ["Wands (Fire)", "Cups (Water)", "Swords (Air)", "Pentacles (Earth)", "Court Cards", "Elemental dignity"],
    lessons: [
      { slug: "four-suits-overview", title: "The Four Suits", description: "Wands, Cups, Swords, Pentacles — elements in action.", duration: 12, type: "reading" },
      { slug: "wands-ace-to-five", title: "Wands: Ace Through Five", description: "Spark of inspiration to competition and conflict.", duration: 15, type: "reading" },
      { slug: "wands-six-to-ten", title: "Wands: Six Through Ten", description: "Victory, defense, swiftness, burden, completion.", duration: 15, type: "reading" },
      { slug: "cups-ace-to-five", title: "Cups: Ace Through Five", description: "New love to grief and loss.", duration: 15, type: "reading" },
      { slug: "cups-six-to-ten", title: "Cups: Six Through Ten", description: "Nostalgia, fantasy, walking away, fulfillment.", duration: 15, type: "reading" },
      { slug: "swords-ace-to-five", title: "Swords: Ace Through Five", description: "Mental clarity to heartbreak and defeat.", duration: 15, type: "reading" },
      { slug: "swords-six-to-ten", title: "Swords: Six Through Ten", description: "Transition, deception, trapped mind, rock bottom.", duration: 15, type: "reading" },
      { slug: "pentacles-ace-to-five", title: "Pentacles: Ace Through Five", description: "New opportunity to material hardship.", duration: 15, type: "reading" },
      { slug: "pentacles-six-to-ten", title: "Pentacles: Six Through Ten", description: "Generosity, patience, mastery, legacy, wealth.", duration: 15, type: "reading" },
      { slug: "pages", title: "The Pages", description: "Students, messages, new energy, curiosity across elements.", duration: 12, type: "reading" },
      { slug: "knights", title: "The Knights", description: "Action, movement, pursuit — sometimes excess.", duration: 12, type: "reading" },
      { slug: "queens", title: "The Queens", description: "Mastery of the inner realm. Nurturing command.", duration: 12, type: "reading" },
      { slug: "kings", title: "The Kings", description: "Mastery of the outer realm. Authority and experience.", duration: 12, type: "reading" },
      { slug: "elemental-dignity", title: "Elemental Dignity", description: "How suits interact when cards appear together.", duration: 12, type: "reading" },
      { slug: "number-patterns", title: "Number Patterns Across Suits", description: "All the 3s, all the 7s — the universal progression.", duration: 12, type: "reading" },
      { slug: "suit-explorer", title: "Suit Explorer", description: "Interactive grid of all 56 cards — click for full meanings.", duration: 15, type: "interactive" },
      { slug: "court-card-quiz-personality", title: "Which Court Card Are You?", description: "Personality quiz matching you to your court card archetype.", duration: 10, type: "quiz" },
      { slug: "number-journey", title: "Number Journey", description: "See all four cards of the same number side by side.", duration: 12, type: "interactive" },
      { slug: "speed-round", title: "Speed Round Quiz", description: "Flash drill — see an image, name the card and suit.", duration: 8, type: "quiz" },
      { slug: "minor-arcana-quiz", title: "Minor Arcana Quiz", description: "Comprehensive test on all 56 cards.", duration: 12, type: "quiz" },
    ],
  },

  // ════════════════════════════════════════
  // TRACK 2: TAROT — INTERMEDIATE
  // ════════════════════════════════════════
  {
    slug: "art-of-the-spread",
    number: 11,
    title: "The Art of the Spread",
    subtitle: "Spreads, Reading Techniques & Intuition",
    description: "Knowing meanings is the beginning. Learn to ask powerful questions, choose the right spread, weave cards into narrative, and develop genuine intuition.",
    track: "tarot",
    level: "intermediate",
    icon: "✧",
    color: "#FF9800",
    duration: "5 weeks",
    topics: ["Asking questions", "Core spreads", "Celtic Cross", "Custom spreads", "Intuition development", "Reading for others"],
    lessons: [
      { slug: "asking-right-questions", title: "Asking The Right Question", description: "Open vs closed, reframing yes/no into insight.", duration: 12, type: "reading" },
      { slug: "single-card-pull", title: "The Single Card Pull", description: "Daily guidance, quick answers — the simplest spread.", duration: 10, type: "reading" },
      { slug: "three-card-spread", title: "The Three-Card Spread", description: "Past/present/future, situation/action/outcome, and more.", duration: 12, type: "reading" },
      { slug: "five-card-cross", title: "The Five-Card Cross", description: "Situation, challenge, foundation, recent past, outcome.", duration: 12, type: "reading" },
      { slug: "celtic-cross", title: "The Celtic Cross", description: "The gold standard — 10 cards, fully unpacked.", duration: 20, type: "reading" },
      { slug: "relationship-spread", title: "The Relationship Spread", description: "Two-person dynamics — what each brings, what binds.", duration: 12, type: "reading" },
      { slug: "year-ahead-spread", title: "The Year Ahead Spread", description: "12 cards for 12 months — your cosmic forecast.", duration: 15, type: "reading" },
      { slug: "creating-custom-spreads", title: "Creating Your Own Spreads", description: "Design layouts for any specific question.", duration: 12, type: "reading" },
      { slug: "card-combinations", title: "Card Combinations", description: "How adjacent cards modify and talk to each other.", duration: 15, type: "reading" },
      { slug: "developing-intuition", title: "Developing Intuition", description: "Meditation, imagery, journaling — beyond book meanings.", duration: 15, type: "reading" },
      { slug: "reading-for-others", title: "Reading For Others", description: "Setting space, ethics, delivering difficult messages.", duration: 15, type: "reading" },
      { slug: "spread-builder", title: "Spread Builder Tool", description: "Drag positions onto canvas to design custom spreads.", duration: 15, type: "interactive" },
      { slug: "celtic-cross-simulator", title: "Celtic Cross Simulator", description: "Step-by-step guided reading with decision points.", duration: 20, type: "practice" },
      { slug: "spreads-quiz", title: "Spreads & Reading Quiz", description: "Identify spread types, interpret combinations, check ethics.", duration: 10, type: "quiz" },
    ],
  },
  {
    slug: "stars-meet-cards",
    number: 12,
    title: "Where Stars Meet Cards",
    subtitle: "Tarot-Astrology Correspondences",
    description: "Tarot and astrology are two branches of the same esoteric tree. Discover the deep connections between cards, planets, signs, and the Kabbalistic Tree of Life.",
    track: "tarot",
    level: "intermediate",
    icon: "⚝",
    color: "#E91E63",
    duration: "4 weeks",
    topics: ["Golden Dawn correspondences", "Major Arcana + planets/signs", "Minor Arcana decans", "Tree of Life", "Numerology"],
    lessons: [
      { slug: "correspondences-intro", title: "The Bridge Between Systems", description: "Why tarot and astrology share the same symbolic DNA.", duration: 12, type: "reading" },
      { slug: "major-arcana-planets", title: "Major Arcana & The Planets", description: "The Magician = Mercury, Wheel of Fortune = Jupiter, and more.", duration: 18, type: "reading" },
      { slug: "major-arcana-signs", title: "Major Arcana & The Signs", description: "The Emperor = Aries, Strength = Leo, Death = Scorpio.", duration: 18, type: "reading" },
      { slug: "four-elements-unified", title: "The Four Elements Unified", description: "Fire/Wands, Water/Cups, Air/Swords, Earth/Pentacles — one system.", duration: 15, type: "reading" },
      { slug: "minor-arcana-decans", title: "Minor Arcana & The Decans", description: "Each pip card maps to a 10-degree zodiac segment.", duration: 18, type: "reading" },
      { slug: "court-cards-modalities", title: "Court Cards & Modalities", description: "Pages/Knights/Queens/Kings linked to Cardinal/Fixed/Mutable.", duration: 12, type: "reading" },
      { slug: "tree-of-life-intro", title: "The Tree of Life", description: "Kabbalistic framework: 10 Sephiroth and 22 paths.", duration: 18, type: "reading" },
      { slug: "sephiroth-and-numbers", title: "Sephiroth & Numbered Cards", description: "Ace=Kether through 10=Malkuth — the universal progression.", duration: 15, type: "reading" },
      { slug: "numerology-in-tarot", title: "Numerology in Tarot", description: "Numbers 1-10 as archetypal stages.", duration: 12, type: "reading" },
      { slug: "correspondence-map", title: "Interactive Correspondence Map", description: "Click any Major Arcana to see its planet/sign connection.", duration: 15, type: "interactive" },
      { slug: "tree-of-life-explorer", title: "Tree of Life Explorer", description: "Visual tree — click each Sephirah for corresponding cards.", duration: 15, type: "interactive" },
      { slug: "correspondences-quiz", title: "Correspondences Quiz", description: "Given a transit, identify the matching tarot card.", duration: 10, type: "quiz" },
    ],
  },

  // ════════════════════════════════════════
  // TRACK 2: TAROT — ADVANCED
  // ════════════════════════════════════════
  {
    slug: "readers-path",
    number: 13,
    title: "The Reader's Path",
    subtitle: "Advanced Tarot Techniques & Professional Practice",
    description: "Complex spreads, predictive tarot, psychological approaches, and building a practice with depth and integrity.",
    track: "tarot",
    level: "advanced",
    icon: "◐",
    color: "#795548",
    duration: "5 weeks",
    topics: ["Advanced spreads", "Predictive tarot", "Psychological tarot", "Shadow work", "Client management", "Business"],
    lessons: [
      { slug: "astrological-spread", title: "The Astrological Spread", description: "12 cards in a wheel — one per house.", duration: 15, type: "reading" },
      { slug: "tree-of-life-spread", title: "The Tree of Life Spread", description: "10 cards mapped to the Sephiroth.", duration: 15, type: "reading" },
      { slug: "chakra-spread", title: "The Chakra Spread", description: "7 cards for energetic assessment.", duration: 12, type: "reading" },
      { slug: "karmic-spread", title: "The Karmic Spread", description: "Past lives, current lessons, future direction.", duration: 12, type: "reading" },
      { slug: "timing-with-tarot", title: "Timing With Tarot", description: "Suits as seasons, numbers as timing indicators.", duration: 15, type: "reading" },
      { slug: "yes-no-techniques", title: "Yes/No Techniques", description: "Beyond coin-flip — accurate binary readings.", duration: 12, type: "reading" },
      { slug: "psychological-tarot", title: "Psychological Tarot", description: "Tarot as a mirror for the subconscious.", duration: 15, type: "reading" },
      { slug: "shadow-work", title: "Shadow Work With Tarot", description: "The Devil, The Moon, Swords — facing what's hidden.", duration: 15, type: "reading" },
      { slug: "difficult-cards", title: "Working With Difficult Cards", description: "Tower, 10 of Swords, 3 of Swords — reframing without denial.", duration: 15, type: "reading" },
      { slug: "handling-emotions", title: "Handling Client Emotions", description: "When readings trigger tears, fear, or denial.", duration: 12, type: "reading" },
      { slug: "when-to-refer-out", title: "When To Refer Out", description: "Mental health, medical, legal — knowing your boundaries.", duration: 10, type: "reading" },
      { slug: "building-your-practice", title: "Building Your Practice", description: "Pricing, marketing, online vs in-person, legal disclaimers.", duration: 15, type: "reading" },
      { slug: "advanced-spread-simulator", title: "Advanced Spread Simulator", description: "Practice complex layouts with guided steps.", duration: 20, type: "interactive" },
      { slug: "shadow-work-journal", title: "Shadow Work Journal", description: "Structured self-reading exercises for inner work.", duration: 15, type: "practice" },
      { slug: "client-session-simulator", title: "Client Session Simulator", description: "AI mock client asks a question and responds to your reading.", duration: 20, type: "practice" },
      { slug: "advanced-tarot-quiz", title: "Advanced Tarot Assessment", description: "Final comprehensive tarot knowledge test.", duration: 15, type: "quiz" },
    ],
  },

  // ════════════════════════════════════════
  // TRACK 3: INTEGRATED CAPSTONE
  // ════════════════════════════════════════
  {
    slug: "oracles-synthesis",
    number: 14,
    title: "The Oracle's Synthesis",
    subtitle: "Combining Astrology & Tarot Into One Practice",
    description: "The capstone where both tracks merge. Use natal chart insights to inform tarot readings, time sessions with transits, and develop your signature approach.",
    track: "integrated",
    level: "capstone",
    icon: "✦",
    color: "#D4AF37",
    duration: "3 weeks",
    topics: ["Chart-informed readings", "Transit-triggered tarot", "House-based spreads", "Personal brand", "Final project"],
    lessons: [
      { slug: "using-chart-for-tarot", title: "Chart-Informed Tarot", description: "Use natal chart insights to select focus areas for readings.", duration: 15, type: "reading" },
      { slug: "transit-triggered-tarot", title: "Transit-Triggered Tarot", description: "Pull cards when major transits hit — explore their themes.", duration: 15, type: "reading" },
      { slug: "house-based-spreads", title: "House-Based Tarot Spreads", description: "Spreads using the client's actual chart houses.", duration: 15, type: "reading" },
      { slug: "yearly-forecast-combined", title: "Combined Yearly Forecast", description: "Solar Return + Year Ahead tarot spread together.", duration: 18, type: "reading" },
      { slug: "planetary-rituals", title: "Planetary Day & Hour Rituals", description: "Timing your readings with planetary hours.", duration: 12, type: "reading" },
      { slug: "card-of-the-year", title: "Your Card of the Year", description: "Numerological + astrological year themes merged.", duration: 12, type: "interactive" },
      { slug: "your-olivia-approach", title: "Developing Your Approach", description: "Personal brand, reading philosophy, unique voice.", duration: 15, type: "reading" },
      { slug: "capstone-project", title: "Capstone Project", description: "Full integrated reading: natal chart + tarot spread for a real client.", duration: 30, type: "practice" },
    ],
  },
];

// ── Helpers ──

export function getCourse(slug: string): Course | undefined {
  return COURSES.find(c => c.slug === slug);
}

export function getCoursesByTrack(track: Track): Course[] {
  return COURSES.filter(c => c.track === track);
}

export function getCoursesByLevel(level: Level): Course[] {
  return COURSES.filter(c => c.level === level);
}

export function getTotalLessons(): number {
  return COURSES.reduce((sum, c) => sum + c.lessons.length, 0);
}

export function getLesson(courseSlug: string, lessonSlug: string): { course: Course; lesson: Lesson } | undefined {
  const course = getCourse(courseSlug);
  if (!course) return undefined;
  const lesson = course.lessons.find(l => l.slug === lessonSlug);
  if (!lesson) return undefined;
  return { course, lesson };
}
