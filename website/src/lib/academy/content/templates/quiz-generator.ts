/**
 * quiz-generator.ts — Generates quiz content for academy lessons
 *
 * Handles lessons with slugs containing "quiz", "memory", "assessment", or "final-integration".
 * All questions are deterministic (hardcoded arrays) and pull from real data sources.
 */

import type { LessonContent, QuizQuestion } from "../types";

// ─── Cosmic Alphabet (signs, elements, modalities) ───

const SIGNS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Which element does Scorpio belong to?",
    options: ["Fire", "Earth", "Air", "Water"],
    correctIndex: 3,
    explanation: "Scorpio is a Water sign, along with Cancer and Pisces. As the Fixed Water sign, Scorpio represents emotional intensity sustained over time.",
  },
  {
    question: "What is the modality of Gemini?",
    options: ["Cardinal", "Fixed", "Mutable"],
    correctIndex: 2,
    explanation: "Gemini is a Mutable sign. Mutable signs (Gemini, Virgo, Sagittarius, Pisces) are adaptable and flexible, bridging the end of one season into the next.",
  },
  {
    question: "Which planet rules Taurus?",
    options: ["Mars", "Venus", "Mercury", "Jupiter"],
    correctIndex: 1,
    explanation: "Venus rules Taurus, giving it an appreciation for beauty, comfort, and sensory pleasure. Venus also rules Libra, but expresses differently in each sign.",
  },
  {
    question: "What element is Aquarius?",
    options: ["Water", "Air", "Fire", "Earth"],
    correctIndex: 1,
    explanation: "Despite the 'aqua' in its name, Aquarius is an Air sign. Air signs govern the intellect and communication. Aquarius represents fixed intellectual conviction.",
  },
  {
    question: "Which sign is Cardinal Fire?",
    options: ["Leo", "Sagittarius", "Aries", "Capricorn"],
    correctIndex: 2,
    explanation: "Aries is the Cardinal Fire sign — it initiates fire energy. Leo is Fixed Fire (sustains it), and Sagittarius is Mutable Fire (spreads it).",
  },
  {
    question: "What is the ruling planet of Cancer?",
    options: ["Venus", "Neptune", "Moon", "Pluto"],
    correctIndex: 2,
    explanation: "The Moon rules Cancer, giving it extraordinary emotional intelligence, psychic sensitivity, and deep connection to memory and ancestry.",
  },
  {
    question: "Which modality do Taurus, Leo, Scorpio, and Aquarius share?",
    options: ["Cardinal", "Fixed", "Mutable"],
    correctIndex: 1,
    explanation: "These are the four Fixed signs. Fixed signs sustain and maintain energy with extraordinary tenacity — they are the stabilizers of the zodiac.",
  },
  {
    question: "What element do Gemini, Libra, and Aquarius share?",
    options: ["Fire", "Earth", "Air", "Water"],
    correctIndex: 2,
    explanation: "These are the three Air signs. Air signs govern the intellect, communication, and social connections. Gemini collects ideas, Libra balances them, Aquarius revolutionizes them.",
  },
  {
    question: "Which planet rules both Gemini and Virgo?",
    options: ["Venus", "Jupiter", "Mercury", "Saturn"],
    correctIndex: 2,
    explanation: "Mercury rules both Gemini and Virgo, but expresses differently. In Gemini, Mercury gathers information broadly. In Virgo, Mercury analyzes it deeply.",
  },
  {
    question: "Sagittarius is ruled by which planet?",
    options: ["Saturn", "Mars", "Neptune", "Jupiter"],
    correctIndex: 3,
    explanation: "Jupiter rules Sagittarius, giving it boundless optimism, philosophical depth, and luck that seems almost supernatural. Jupiter is the planet of expansion and wisdom.",
  },
  {
    question: "What is the opposite (polarity) sign of Aries?",
    options: ["Scorpio", "Capricorn", "Libra", "Cancer"],
    correctIndex: 2,
    explanation: "Aries and Libra are opposite signs — the axis of self (Aries) versus partnership (Libra). Opposite signs are mirrors that need each other for balance.",
  },
  {
    question: "Which sign has the motto 'I Transform'?",
    options: ["Pisces", "Scorpio", "Pluto", "Capricorn"],
    correctIndex: 1,
    explanation: "Scorpio's motto is 'I Transform.' Ruled by Pluto, Scorpio understands that destruction is the prerequisite for creation and power comes from facing the hidden.",
  },
];

// ─── Celestial Players (planets) ───

const PLANETS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "What does the Moon represent in your birth chart?",
    options: ["Your core identity", "Your emotional instincts and inner needs", "How you communicate", "Where you find growth"],
    correctIndex: 1,
    explanation: "The Moon governs your emotional instincts — how you feel, need, and nurture. It represents your inner world, subconscious patterns, and childhood conditioning.",
  },
  {
    question: "Mercury governs which area of life?",
    options: ["Emotions and nurturing", "Communication and thinking", "Love and beauty", "Discipline and limits"],
    correctIndex: 1,
    explanation: "Mercury is your mind — how you think, communicate, and process information. It rules both Gemini (broad information gathering) and Virgo (deep analysis).",
  },
  {
    question: "Which planet represents your drive and desire?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"],
    correctIndex: 2,
    explanation: "Mars is your drive — how you take action, fight, and pursue desire. It represents physical energy, assertion, anger, and the warrior within.",
  },
  {
    question: "Saturn is known as the planet of:",
    options: ["Expansion and luck", "Rebellion and innovation", "Discipline and mastery", "Dreams and dissolution"],
    correctIndex: 2,
    explanation: "Saturn governs discipline — where you face limits and build mastery. Often feared in astrology, Saturn is actually the strict teacher whose lessons create unshakeable competence.",
  },
  {
    question: "Which planet is associated with revolution and breaking rules?",
    options: ["Pluto", "Neptune", "Uranus", "Mars"],
    correctIndex: 2,
    explanation: "Uranus governs rebellion — where you break rules and innovate. It orbits on its side, literally unlike every other planet, and Aquarians share this unconventional quality.",
  },
  {
    question: "Neptune rules which domain?",
    options: ["Structure and authority", "Dreams and imagination", "Communication and travel", "Passion and conflict"],
    correctIndex: 1,
    explanation: "Neptune governs dreams — where you dissolve boundaries and imagine. It rules spirituality, creativity, illusion, and transcendence.",
  },
  {
    question: "What does Venus represent?",
    options: ["How you fight", "How you think", "How you love and what you value", "Where you rebel"],
    correctIndex: 2,
    explanation: "Venus is your heart — how you love, what you find beautiful, and what you value. It governs relationships, aesthetics, pleasure, and self-worth.",
  },
  {
    question: "Jupiter is associated with:",
    options: ["Limitation and testing", "Growth, expansion, and meaning", "Emotional instincts", "Power and transformation"],
    correctIndex: 1,
    explanation: "Jupiter governs growth — where you expand, get lucky, and find meaning. It is the largest planet, and its energy is expansive, generous, and philosophical.",
  },
  {
    question: "Pluto represents:",
    options: ["Daily routines", "Superficial changes", "Power, transformation, and regeneration", "Quick communication"],
    correctIndex: 2,
    explanation: "Pluto governs power — where you transform, destroy, and regenerate. It rules the process of death and rebirth, psychological depth, and hidden resources.",
  },
  {
    question: "The Sun in your chart represents:",
    options: ["Your emotional needs", "Your core identity and life purpose", "How you communicate with others", "Where you find discipline"],
    correctIndex: 1,
    explanation: "The Sun is your core identity — who you are when no one is watching. It represents vitality, ego, life purpose, and the central theme of your existence.",
  },
];

// ─── Life Arenas (houses) ───

const HOUSES_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Which house governs career and public reputation?",
    options: ["7th House", "10th House", "12th House", "3rd House"],
    correctIndex: 1,
    explanation: "The 10th House rules career, public reputation, ambition, authority, and life direction. It represents how the world sees you professionally.",
  },
  {
    question: "The 7th House is associated with:",
    options: ["Self and identity", "Home and family", "Partnership and marriage", "Career and legacy"],
    correctIndex: 2,
    explanation: "The 7th House governs partnership — marriage, committed relationships, open enemies, and contracts. It sits opposite the 1st House of self.",
  },
  {
    question: "Which house rules the subconscious and hidden matters?",
    options: ["8th House", "4th House", "12th House", "6th House"],
    correctIndex: 2,
    explanation: "The 12th House rules the subconscious — hidden things, solitude, spirituality, self-undoing, and healing. It is the most mysterious house in the chart.",
  },
  {
    question: "The 1st House governs:",
    options: ["Money and possessions", "Self, identity, and first impressions", "Creativity and romance", "Communication and siblings"],
    correctIndex: 1,
    explanation: "The 1st House rules self and identity — first impressions, physical body, and how the world sees you. It is defined by your Ascendant (Rising sign).",
  },
  {
    question: "Which house is associated with creativity, romance, and children?",
    options: ["3rd House", "5th House", "9th House", "11th House"],
    correctIndex: 1,
    explanation: "The 5th House rules creativity and romance — self-expression, dating, children, play, and joy. It is the house of what you create and enjoy.",
  },
  {
    question: "The 8th House rules:",
    options: ["Daily routines and health", "Transformation, shared resources, and intimacy", "Communication and short trips", "Home and private life"],
    correctIndex: 1,
    explanation: "The 8th House governs transformation — shared resources, sex, death, rebirth, and other people's money. It deals with deep psychological change.",
  },
  {
    question: "Which house governs higher education and philosophy?",
    options: ["3rd House", "6th House", "9th House", "11th House"],
    correctIndex: 2,
    explanation: "The 9th House rules philosophy and travel — higher education, foreign lands, belief systems, and publishing. It represents the search for meaning.",
  },
  {
    question: "The 4th House is associated with:",
    options: ["Career and public life", "Home, family, and emotional roots", "Partnership and contracts", "Friends and community"],
    correctIndex: 1,
    explanation: "The 4th House governs home and roots — family, ancestry, emotional foundation, and private life. It sits at the bottom of the chart, representing your foundation.",
  },
  {
    question: "Which house rules daily health routines and service?",
    options: ["2nd House", "6th House", "10th House", "12th House"],
    correctIndex: 1,
    explanation: "The 6th House rules health and service — daily routines, work, wellness, pets, and being useful. It governs the mundane tasks that sustain your life.",
  },
  {
    question: "The 11th House governs:",
    options: ["Self and physical body", "Partnerships and marriage", "Community, friendships, and future hopes", "Subconscious and solitude"],
    correctIndex: 2,
    explanation: "The 11th House rules community and dreams — friendships, groups, hopes, wishes, and social causes. It represents your role in the collective.",
  },
];

// ─── Aspects & Patterns ───

const ASPECTS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "A conjunction occurs when two planets are at:",
    options: ["60 degrees apart", "90 degrees apart", "0 degrees apart", "180 degrees apart"],
    correctIndex: 2,
    explanation: "A conjunction is 0 degrees — planets merge and amplify each other. It is the most powerful aspect, fusing the energies of both planets into one force.",
  },
  {
    question: "Which aspect is considered the most tense?",
    options: ["Trine", "Sextile", "Conjunction", "Square"],
    correctIndex: 3,
    explanation: "The square (90 degrees) creates the most friction. It is the engine of the chart — tension that builds strength and drives action. Challenging but productive.",
  },
  {
    question: "A trine represents:",
    options: ["Tension and conflict", "Natural ease and flow", "Awareness and polarity", "Subtle discomfort"],
    correctIndex: 1,
    explanation: "The trine (120 degrees) represents natural ease and gifts so innate they may go unnoticed. It connects planets of the same element in harmonious flow.",
  },
  {
    question: "What degree separation defines an opposition?",
    options: ["60 degrees", "90 degrees", "120 degrees", "180 degrees"],
    correctIndex: 3,
    explanation: "The opposition is 180 degrees — a seesaw between polarities that demands integration. It creates awareness of opposing needs that must be balanced.",
  },
  {
    question: "A Grand Trine involves how many planets?",
    options: ["Two", "Three", "Four", "Five"],
    correctIndex: 1,
    explanation: "A Grand Trine connects three planets, each 120 degrees apart, forming an equilateral triangle. It represents natural talent — but also the risk of complacency.",
  },
  {
    question: "What is a T-Square?",
    options: ["Three planets forming a triangle", "Two planets in opposition with a third squaring both", "Four planets in a cross pattern", "A planet conjunct the Midheaven"],
    correctIndex: 1,
    explanation: "A T-Square has two planets in opposition with a third planet squaring both — creating dynamic tension pointed at an apex planet that drives tremendous motivation.",
  },
  {
    question: "The Yod (Finger of God) involves:",
    options: ["Two trines and a sextile", "Two quincunxes pointing to an apex planet", "Three squares and an opposition", "Two conjunctions and a trine"],
    correctIndex: 1,
    explanation: "The Yod consists of two planets in sextile (60 degrees), both forming quincunxes (150 degrees) to a third planet. It represents fated redirection and crisis that reveals purpose.",
  },
  {
    question: "A sextile is an aspect of:",
    options: ["30 degrees", "60 degrees", "90 degrees", "150 degrees"],
    correctIndex: 1,
    explanation: "The sextile is 60 degrees — gentle cooperation that rewards conscious effort. It represents opportunity that must be actively pursued to bear fruit.",
  },
  {
    question: "What is an 'orb' in aspect interpretation?",
    options: ["The speed at which a planet moves", "The allowable deviation from an exact aspect angle", "A type of celestial body", "The house a planet occupies"],
    correctIndex: 1,
    explanation: "An orb is the acceptable deviation from exactness. A tight orb (within 1-2 degrees) makes an aspect very potent, while a wide orb (8-10 degrees) weakens it.",
  },
  {
    question: "A Grand Cross consists of:",
    options: ["Three trines", "Four planets, each squaring two neighbors and opposing one", "Two sextiles and a trine", "A conjunction of four planets"],
    correctIndex: 1,
    explanation: "A Grand Cross has four planets forming a cross — each squares its two neighbors and opposes the planet across. It is the hardest pattern but carries the greatest potential.",
  },
];

// ─── Predictive Astrology (transits) ───

const TRANSITS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "How long does Saturn spend in each zodiac sign?",
    options: ["About 1 year", "About 2.5 years", "About 7 years", "About 12 years"],
    correctIndex: 1,
    explanation: "Saturn spends approximately 2.5 years in each sign, restructuring and testing the life areas associated with that sign and the houses it transits in your chart.",
  },
  {
    question: "At what age does the first Saturn Return occur?",
    options: ["Around 21", "Around 25", "Around 29", "Around 33"],
    correctIndex: 2,
    explanation: "The first Saturn Return happens around age 29 (28-30). It is the most important transit, marking a cosmic graduation into true adulthood and forcing you to get serious about your life path.",
  },
  {
    question: "Jupiter spends approximately how long in each sign?",
    options: ["About 1 month", "About 1 year", "About 2.5 years", "About 7 years"],
    correctIndex: 1,
    explanation: "Jupiter spends about 1 year per sign, bringing expansion, luck, and growth opportunities to the life areas associated with that sign and house placement.",
  },
  {
    question: "What happens during an eclipse?",
    options: ["All planets retrograde simultaneously", "A sudden catalyst for change accelerates life events", "Saturn and Jupiter conjoin", "The Moon leaves the chart"],
    correctIndex: 1,
    explanation: "Eclipses — both solar and lunar — act as catalysts for sudden change. They accelerate events and can bring beginnings (solar) or endings (lunar) within a six-month window.",
  },
  {
    question: "Uranus takes approximately how long to transit each sign?",
    options: ["1 year", "2.5 years", "7 years", "14 years"],
    correctIndex: 2,
    explanation: "Uranus spends about 7 years in each sign, bringing disruption, awakening, and freedom to an entire generation and the personal houses it touches in your chart.",
  },
  {
    question: "What are secondary progressions?",
    options: ["Planets moving backward", "A technique where one day after birth equals one year of life", "The speed of the Moon's orbit", "The angles of your relocated chart"],
    correctIndex: 1,
    explanation: "Secondary progressions use a 'day for a year' ratio. Your chart on the 30th day after birth represents your internal evolution at age 30. It reveals inner psychological shifts.",
  },
  {
    question: "A Solar Return chart is cast for:",
    options: ["The first day of each zodiac season", "Your exact birthday each year", "Every Saturn opposition", "The winter solstice"],
    correctIndex: 1,
    explanation: "A Solar Return chart is calculated for the exact moment the Sun returns to its natal position each year. It provides a forecast for the year ahead from birthday to birthday.",
  },
  {
    question: "Mercury retrograde occurs approximately:",
    options: ["Once a year for 6 months", "Three to four times a year for about 3 weeks each", "Once a month for one week", "Twice a year for 2 months"],
    correctIndex: 1,
    explanation: "Mercury retrogrades 3-4 times per year, each lasting about 3 weeks. These are review periods for communication, travel, and technology — not times to panic, but times to double-check.",
  },
  {
    question: "Annual Profections assign a ruling planet based on:",
    options: ["Your Moon sign", "Which house number matches your age", "The current eclipse cycle", "Your Midheaven sign"],
    correctIndex: 1,
    explanation: "Annual Profections are an ancient technique: at age 0 the 1st house is activated, at age 1 the 2nd house, and so on in a cycle. The ruler of the activated house becomes your 'Lord of the Year.'",
  },
  {
    question: "Neptune's transit through a single sign lasts approximately:",
    options: ["2.5 years", "7 years", "14 years", "30 years"],
    correctIndex: 2,
    explanation: "Neptune spends roughly 14 years in each sign, making it a generational planet. Its transits dissolve illusions slowly and bring spiritual evolution to the life areas it touches.",
  },
];

// ─── Relationship Astrology ───

const RELATIONSHIPS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "In synastry, what does it mean when someone's Venus conjuncts your Mars?",
    options: ["There is strong intellectual chemistry", "There is strong romantic and physical attraction", "There are power struggles", "There is karmic debt"],
    correctIndex: 1,
    explanation: "Venus-Mars conjunctions in synastry indicate potent romantic and physical chemistry. Venus represents what attracts us; Mars represents how we pursue. Together, they create magnetic pull.",
  },
  {
    question: "A composite chart represents:",
    options: ["One person's chart overlaid on another's", "The midpoint chart of a relationship — the relationship as its own entity", "A chart cast for the wedding day", "The transits at the time two people met"],
    correctIndex: 1,
    explanation: "A composite chart calculates the midpoints of each planet between two people, creating a single chart that represents the relationship itself as a third entity with its own identity.",
  },
  {
    question: "The Descendant (7th house cusp) shows:",
    options: ["Your childhood conditioning", "What you seek in a partner and project onto others", "Your career path", "Your hidden fears"],
    correctIndex: 1,
    explanation: "The Descendant reveals what you attract and need in partnership. It is the sign opposite your Ascendant and represents qualities you may project onto others before integrating them.",
  },
  {
    question: "Saturn in synastry typically indicates:",
    options: ["Lighthearted fun without commitment", "Commitment, stability, or karmic restriction", "Instant physical chemistry", "Short-lived excitement"],
    correctIndex: 1,
    explanation: "Saturn contacts in synastry bring commitment and staying power — but also potential restriction. Saturn is the glue that binds relationships for the long term, for better or worse.",
  },
  {
    question: "North Node connections in synastry suggest:",
    options: ["Financial partnership", "Karmic or fated connections pushing growth", "Intellectual incompatibility", "Temporary attractions"],
    correctIndex: 1,
    explanation: "North Node connections in synastry often feel fated. The North Node represents our growth direction, so when someone's planets activate it, they catalyze our spiritual evolution.",
  },
  {
    question: "In a composite chart, the Sun represents:",
    options: ["Each partner's individual ego", "The relationship's core identity and purpose", "The date the couple met", "How the outside world sees the couple"],
    correctIndex: 1,
    explanation: "The composite Sun represents the relationship's core identity — its purpose, vitality, and reason for existing. It shows what the relationship is fundamentally about.",
  },
  {
    question: "Sun-Moon contacts in synastry indicate:",
    options: ["Only intellectual connection", "Deep compatibility between identity and emotions", "Financial tension", "Lack of commitment"],
    correctIndex: 1,
    explanation: "Sun-Moon connections are among the deepest compatibility indicators. One person's identity (Sun) harmonizes with the other's emotional nature (Moon), creating mutual understanding.",
  },
  {
    question: "Pluto contacts in synastry often bring:",
    options: ["Boredom and routine", "Intense power dynamics and transformative experiences", "Simple friendship", "Financial prosperity"],
    correctIndex: 1,
    explanation: "Pluto in synastry brings intensity, power dynamics, and deep transformation. These connections can be obsessive and life-changing — for better or worse, nothing stays the same.",
  },
  {
    question: "When transits hit a composite chart, it means:",
    options: ["Only one partner is affected", "The relationship itself is evolving or being tested", "The composite chart is invalid", "Individual natal charts override it"],
    correctIndex: 1,
    explanation: "Transits to the composite chart affect the relationship as an entity. A Saturn transit might test its commitment, while Jupiter could bring expansion and growth as a couple.",
  },
  {
    question: "What does Neptune in synastry often create?",
    options: ["Grounded practicality", "Idealization, romance, but potential disillusion", "Aggressive conflict", "Intellectual debate"],
    correctIndex: 1,
    explanation: "Neptune in synastry can create a beautiful, romantic, almost spiritual connection — but also idealization that may lead to disillusion when reality sets in. Discernment is key.",
  },
];

// ─── Tarot: Major Arcana Memory / Quiz ───

const MAJOR_ARCANA_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "The Fool is associated with which keywords?",
    options: ["Authority, structure, stability", "Beginnings, innocence, spontaneity", "Transformation, endings, rebirth", "Intuition, mystery, subconscious"],
    correctIndex: 1,
    explanation: "The Fool (card 0) represents beginnings, innocence, spontaneity, and a free spirit. It is the first card — the start of every new journey taken with trust and openness.",
  },
  {
    question: "Which element corresponds to the suit of Cups?",
    options: ["Fire", "Earth", "Air", "Water"],
    correctIndex: 3,
    explanation: "Cups correspond to Water — the element of emotions, intuition, relationships, and the subconscious. Water signs (Cancer, Scorpio, Pisces) share this emotional depth.",
  },
  {
    question: "What does The Tower card signify?",
    options: ["Slow, gentle growth", "Sudden upheaval and breakthrough", "Financial abundance", "Peaceful meditation"],
    correctIndex: 1,
    explanation: "The Tower represents sudden upheaval, revelation, and breakthrough. It destroys structures built on false foundations — painful but necessary for truth to emerge.",
  },
  {
    question: "Death (card XIII) primarily represents:",
    options: ["Physical death", "Transformation, endings, and new beginnings", "Bad luck", "Punishment"],
    correctIndex: 1,
    explanation: "Death represents transformation — the end of one chapter so a new one can begin. It is not about physical death, but about the necessary ending of identities, beliefs, or situations.",
  },
  {
    question: "Which suit represents the element of Fire?",
    options: ["Cups", "Swords", "Pentacles", "Wands"],
    correctIndex: 3,
    explanation: "Wands correspond to Fire — the element of passion, creativity, ambition, and action. Fire signs (Aries, Leo, Sagittarius) embody this creative, driven energy.",
  },
  {
    question: "The High Priestess is associated with:",
    options: ["Leadership and authority", "Intuition, mystery, and the subconscious", "Material wealth and security", "Conflict and tension"],
    correctIndex: 1,
    explanation: "The High Priestess represents intuition, mystery, and the subconscious inner voice. She is connected to the Moon and encourages trusting what you feel over what you think.",
  },
  {
    question: "Swords correspond to which element?",
    options: ["Fire", "Water", "Air", "Earth"],
    correctIndex: 2,
    explanation: "Swords correspond to Air — the element of the mind, truth, conflict, and communication. Air signs (Gemini, Libra, Aquarius) share this intellectual, truth-seeking quality.",
  },
  {
    question: "What does The World card represent?",
    options: ["A new beginning", "Completion, integration, and wholeness", "Conflict and competition", "Hidden fears and anxiety"],
    correctIndex: 1,
    explanation: "The World (card XXI) represents completion, integration, and fulfillment. It is the final Major Arcana — the journey fulfilled, everything learned integrated into wholeness.",
  },
  {
    question: "Pentacles correspond to which element?",
    options: ["Fire", "Water", "Air", "Earth"],
    correctIndex: 3,
    explanation: "Pentacles correspond to Earth — the element of material reality, money, health, and the physical world. Earth signs (Taurus, Virgo, Capricorn) share this grounded, practical nature.",
  },
  {
    question: "The Wheel of Fortune is astrologically associated with:",
    options: ["Saturn", "Mars", "Jupiter", "Mercury"],
    correctIndex: 2,
    explanation: "The Wheel of Fortune is associated with Jupiter — the planet of luck, expansion, and cycles. Both represent turning points, fate, and the experience of life getting bigger.",
  },
];

// ─── Minor Arcana Quiz ───

const MINOR_ARCANA_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "The Ace of Cups represents:",
    options: ["New financial opportunity", "New emotional or romantic beginning", "Mental breakthrough", "Creative spark"],
    correctIndex: 1,
    explanation: "The Ace of Cups signals a new emotional beginning — love, compassion, or creative inspiration welling up from the depths. It invites you to open your heart.",
  },
  {
    question: "Which card often signals anxiety and overwhelm?",
    options: ["Nine of Pentacles", "Nine of Swords", "Nine of Cups", "Nine of Wands"],
    correctIndex: 1,
    explanation: "The Nine of Swords depicts anxiety, nightmares, and mental overwhelm. The fears feel crushing, but the card reminds us that most are projections, not predictions.",
  },
  {
    question: "The Ten of Pentacles represents:",
    options: ["Financial ruin", "Generational wealth and family legacy", "Emotional completion", "Swift change"],
    correctIndex: 1,
    explanation: "The Ten of Pentacles represents generational wealth, family legacy, and the culmination of material success — what you build now lasts beyond your lifetime.",
  },
  {
    question: "Court Cards represent:",
    options: ["Only specific people in your life", "Personality types, energies, or stages of development", "Only future events", "Only past events"],
    correctIndex: 1,
    explanation: "Court Cards can represent specific people, personality types, energies you are embodying, or stages of mastery within an element — from student (Page) to master (King).",
  },
  {
    question: "The Three of Swords typically indicates:",
    options: ["Celebration", "Heartbreak and grief", "Travel plans", "Financial gain"],
    correctIndex: 1,
    explanation: "The Three of Swords depicts heartbreak, grief, and sorrow. Three swords pierce a heart — the image is direct. It encourages feeling the pain as the path through it.",
  },
  {
    question: "What does the Ace of Wands represent?",
    options: ["Emotional healing", "A spark of creative inspiration and new beginnings", "Mental clarity after confusion", "Material security"],
    correctIndex: 1,
    explanation: "The Ace of Wands is pure creative fire — a new idea, project, or passion ignites. It demands action: this energy is urgent and will not wait.",
  },
  {
    question: "The Nine of Cups is known as:",
    options: ["The worry card", "The wish card", "The change card", "The conflict card"],
    correctIndex: 1,
    explanation: "The Nine of Cups is called the 'wish card' — it represents deep contentment, emotional satisfaction, and gratitude. You have what you need; feel it fully.",
  },
  {
    question: "Queens in the tarot generally represent:",
    options: ["Action and pursuit", "Mastery of the inner realm and nurturing command", "New messages and beginnings", "External authority and leadership"],
    correctIndex: 1,
    explanation: "Queens represent mastery of the inner realm — emotional intelligence, intuitive command, and nurturing power within their element.",
  },
  {
    question: "The Five of Pentacles indicates:",
    options: ["Great wealth", "Hardship, poverty, or feeling left out in the cold", "Victory and celebration", "Spiritual enlightenment"],
    correctIndex: 1,
    explanation: "The Five of Pentacles signals material hardship or spiritual poverty — feeling left out, isolated, or lacking. But help exists; you may just need to ask for it.",
  },
  {
    question: "What pattern do all the 'Eights' across suits share?",
    options: ["Completion and fulfillment", "New beginnings and potential", "Movement, action, and dynamic change", "Rest and contemplation"],
    correctIndex: 2,
    explanation: "Eights across all suits share themes of movement and dynamic energy — Eight of Wands (speed), Eight of Cups (walking away), Eight of Swords (mental restriction), Eight of Pentacles (dedicated skill-building).",
  },
];

// ─── Tarot: Court Card Personality Quiz ───

const COURT_CARD_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "The Queen of Cups embodies:",
    options: ["Aggressive ambition", "Emotional security, compassion, and intuition", "Intellectual analysis", "Material wealth"],
    correctIndex: 1,
    explanation: "The Queen of Cups represents emotional security, deep compassion, and powerful intuition. She feels everything and holds space for all of it.",
  },
  {
    question: "Pages in tarot typically represent:",
    options: ["Authority and mastery", "Enthusiasm, curiosity, and new beginnings", "Mature emotional balance", "Aggressive pursuit"],
    correctIndex: 1,
    explanation: "Pages are the students and messengers — they bring new energy, curiosity, and the excitement of a beginner's mind to their element.",
  },
  {
    question: "The Knight of Swords is characterized by:",
    options: ["Slow patience", "Swift, determined, sometimes ruthless mental pursuit", "Emotional sensitivity", "Material caution"],
    correctIndex: 1,
    explanation: "The Knight of Swords charges forward with mental clarity and sharp determination. Fast and decisive, sometimes ruthlessly so — think before you slash.",
  },
  {
    question: "The King of Pentacles represents:",
    options: ["Emotional turmoil", "Poverty and lack", "Disciplined wealth, generous authority, and material mastery", "Creative chaos"],
    correctIndex: 2,
    explanation: "The King of Pentacles is the master of the material world — disciplined wealth, generous authority, and everything he touches prospers through competence.",
  },
  {
    question: "Which court card represents following the heart with romantic passion?",
    options: ["Knight of Pentacles", "Knight of Swords", "Knight of Cups", "Knight of Wands"],
    correctIndex: 2,
    explanation: "The Knight of Cups is the romantic — pursuing what moves him, following his heart, charming and imaginative. The question is whether he chases a feeling or a real person.",
  },
  {
    question: "The Queen of Wands embodies:",
    options: ["Quiet withdrawal", "Radiant confidence, independence, and creative warmth", "Cold intellectual analysis", "Material conservatism"],
    correctIndex: 1,
    explanation: "The Queen of Wands radiates confidence, independence, determination, and warmth. She knows her power and wields it brilliantly.",
  },
  {
    question: "The King of Swords represents:",
    options: ["Emotional volatility", "Fair judgment, intellectual authority, and ethical leadership", "Creative spontaneity", "Material generosity"],
    correctIndex: 1,
    explanation: "The King of Swords embodies fair and authoritative judgment. He cuts through complexity with clarity — representing justice, intellectual power, and ethical leadership.",
  },
  {
    question: "The Page of Pentacles indicates:",
    options: ["Emotional crisis", "A new skill, financial opportunity, or ambitious study", "Reckless adventure", "Spiritual transcendence"],
    correctIndex: 1,
    explanation: "The Page of Pentacles is the student of the material world — a new skill, a financial opportunity, or ambitious beginnings that require study, practice, and growth.",
  },
  {
    question: "What element does the Knight of Wands embody?",
    options: ["Water", "Earth", "Fire", "Air"],
    correctIndex: 2,
    explanation: "The Knight of Wands embodies Fire — passionate, adventurous, energetic, and sometimes impulsive. He charges forward with creative enthusiasm.",
  },
  {
    question: "The Queen of Swords is known for:",
    options: ["Emotional dependency", "Independent truth, clear boundaries, and sharp perception", "Material hoarding", "Passive acceptance"],
    correctIndex: 1,
    explanation: "The Queen of Swords sees the truth and speaks it without flinching. She represents clear boundaries, independence, and emotional intelligence through intellect.",
  },
];

// ─── Spreads & Reading Quiz ───

const SPREADS_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "The Celtic Cross spread uses how many cards?",
    options: ["5", "7", "10", "12"],
    correctIndex: 2,
    explanation: "The Celtic Cross uses 10 cards across 10 positions, making it the most comprehensive standard spread. It covers the situation, challenges, past, future, subconscious, and outcome.",
  },
  {
    question: "In a three-card spread, the most common layout represents:",
    options: ["Body, mind, spirit only", "Past, present, future (among other variations)", "Three different people", "Only yes, no, maybe"],
    correctIndex: 1,
    explanation: "The three-card spread is versatile: past/present/future, situation/action/outcome, mind/body/spirit, and many more. Its simplicity makes it endlessly adaptable.",
  },
  {
    question: "When reading for others, what is the most important ethical guideline?",
    options: ["Always predict specific dates", "Never deliver uncomfortable messages", "Set clear boundaries and deliver messages with empathy and honesty", "Tell the client exactly what they want to hear"],
    correctIndex: 2,
    explanation: "Ethical reading means setting boundaries, being honest even with difficult messages, and delivering them with empathy. Never predict death/illness specifically, and know when to refer out.",
  },
  {
    question: "How should a yes/no question ideally be reframed?",
    options: ["Keep it as yes or no", "Rephrase as an open-ended question that invites deeper insight", "Refuse to answer it", "Always answer yes"],
    correctIndex: 1,
    explanation: "Reframing yes/no into open-ended questions unlocks deeper insight. Instead of 'Will I get the job?' try 'What do I need to know about this career opportunity?' The cards reveal more.",
  },
  {
    question: "Elemental dignity refers to:",
    options: ["How dignified a reader appears", "How suits interact and strengthen or weaken each other when adjacent", "The element of the querent's Sun sign", "A spread layout shaped like a diamond"],
    correctIndex: 1,
    explanation: "Elemental dignity is how suits interact when cards appear together. Fire and Air strengthen each other; Water and Earth support each other; Fire and Water weaken each other.",
  },
  {
    question: "What is a significator card?",
    options: ["The first card drawn", "A card intentionally chosen to represent the querent or situation", "The card at the bottom of the deck", "Any reversed card"],
    correctIndex: 1,
    explanation: "A significator is deliberately chosen (or pulled) to represent the person or question. Some readers use Court Cards matching the querent's sign; others let the deck choose.",
  },
  {
    question: "When creating a custom spread, the most important factor is:",
    options: ["Using at least 10 cards", "That each position answers a specific aspect of the question", "Making it visually symmetrical", "Including reversed meanings for every card"],
    correctIndex: 1,
    explanation: "The power of a custom spread is that each position addresses a specific aspect of your question. Design with intention: what do you actually need to know?",
  },
  {
    question: "Card combinations in a reading refer to:",
    options: ["Shuffling two decks together", "How adjacent cards modify and influence each other's meaning", "Reading multiple spreads simultaneously", "Combining tarot with astrology"],
    correctIndex: 1,
    explanation: "Card combinations are how adjacent cards talk to each other. A seemingly positive card next to a challenging one changes the nuance. Context is everything in tarot reading.",
  },
  {
    question: "Reading reversals (upside-down cards) can indicate:",
    options: ["The card's meaning is completely opposite", "Blocked energy, internal experience, or a softer version of the upright meaning", "The card should be ignored", "Only negative outcomes"],
    correctIndex: 1,
    explanation: "Reversals can indicate blocked or internalized energy, delays, the shadow side, or a softer expression of the upright meaning. They are nuanced, not simple opposites.",
  },
  {
    question: "When is it appropriate to refuse a reading for a client?",
    options: ["Never — always read for anyone who asks", "When the reader's intuition says the timing is wrong or the question crosses ethical boundaries", "Only when the client cannot pay", "Only for legal questions"],
    correctIndex: 1,
    explanation: "Readers should trust their intuition to decline readings when the timing feels wrong, when questions cross ethical lines (predicting death, diagnosing illness), or when the client's state is concerning.",
  },
];

// ─── Correspondences Quiz ───

const CORRESPONDENCES_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Which Major Arcana card corresponds to the planet Mercury?",
    options: ["The Fool", "The Magician", "The High Priestess", "The Emperor"],
    correctIndex: 1,
    explanation: "The Magician corresponds to Mercury — the planet of communication, skill, and willpower. Both represent the ability to channel intention into manifestation.",
  },
  {
    question: "The Emperor corresponds to which zodiac sign?",
    options: ["Taurus", "Leo", "Aries", "Capricorn"],
    correctIndex: 2,
    explanation: "The Emperor corresponds to Aries — cardinal fire energy. Both embody authority, initiative, leadership, and the drive to build structure from raw ambition.",
  },
  {
    question: "Death (XIII) corresponds to:",
    options: ["Pluto", "Saturn", "Scorpio", "Neptune"],
    correctIndex: 2,
    explanation: "The Death card corresponds to Scorpio — the sign of transformation, endings, and rebirth. Both deal with the necessity of letting the old die so the new can emerge.",
  },
  {
    question: "Which card is linked to the Moon?",
    options: ["The Star", "The High Priestess", "The Empress", "Temperance"],
    correctIndex: 1,
    explanation: "The High Priestess corresponds to the Moon — both govern intuition, the subconscious, mystery, and inner knowing. They represent what is felt rather than seen.",
  },
  {
    question: "The suit of Wands corresponds to which zodiac element group?",
    options: ["Taurus, Virgo, Capricorn", "Cancer, Scorpio, Pisces", "Gemini, Libra, Aquarius", "Aries, Leo, Sagittarius"],
    correctIndex: 3,
    explanation: "Wands correspond to Fire and thus the fire signs: Aries, Leo, Sagittarius. These cards deal with passion, creativity, ambition, and spiritual energy.",
  },
  {
    question: "Temperance corresponds to which sign?",
    options: ["Libra", "Sagittarius", "Pisces", "Virgo"],
    correctIndex: 1,
    explanation: "Temperance corresponds to Sagittarius — the seeker of balance through exploration. Both represent the art of blending opposites into something greater than the sum.",
  },
  {
    question: "The World card is associated with:",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctIndex: 1,
    explanation: "The World corresponds to Saturn — the planet of completion, mastery, and earned achievement. Both represent the culmination of a long journey and the wisdom gained from it.",
  },
  {
    question: "In the Kabbalistic Tree of Life, the Aces correspond to:",
    options: ["Malkuth (Kingdom)", "Kether (Crown)", "Tiphareth (Beauty)", "Yesod (Foundation)"],
    correctIndex: 1,
    explanation: "Aces correspond to Kether — the first Sephirah, the Crown, the point of pure potential from which everything flows. Each Ace is the seed of its element.",
  },
  {
    question: "Which Major Arcana card corresponds to Venus?",
    options: ["The Empress", "The Lovers", "The Star", "Strength"],
    correctIndex: 0,
    explanation: "The Empress corresponds to Venus — the planet of beauty, abundance, fertility, and sensory pleasure. Both embody the nurturing, creative, receiving principle.",
  },
  {
    question: "Strength is associated with which zodiac sign?",
    options: ["Aries", "Scorpio", "Leo", "Taurus"],
    correctIndex: 2,
    explanation: "Strength corresponds to Leo — the sign of courage, heart, and inner power. Both represent true strength that comes from compassion, patience, and the courage of the heart.",
  },
];

// ─── Advanced Techniques Quiz ───

const ADVANCED_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "In sect theory, which planets are members of the 'day team'?",
    options: ["Moon, Venus, Mars", "Sun, Jupiter, Saturn", "Mercury, Uranus, Neptune", "Mars, Pluto, Saturn"],
    correctIndex: 1,
    explanation: "The day sect consists of the Sun, Jupiter, and Saturn. In a day chart (Sun above the horizon), these planets express more beneficently and effectively.",
  },
  {
    question: "What is the first step in chart synthesis?",
    options: ["Reading every planet in order", "Identifying the chart ruler and most prominent placements", "Looking at transits first", "Counting how many planets are retrograde"],
    correctIndex: 1,
    explanation: "Chart synthesis begins with identifying the chart ruler (planet ruling the Ascendant), the most aspected planet, and angular planets. These form the narrative backbone.",
  },
  {
    question: "In horary astrology, you cast a chart for:",
    options: ["The querent's birth time", "The exact moment a specific question is asked", "The next full moon", "The last solar eclipse"],
    correctIndex: 1,
    explanation: "Horary astrology casts a chart for the moment a specific question is asked (and understood by the astrologer). That chart contains the answer within its symbolism.",
  },
  {
    question: "Electional astrology is used to:",
    options: ["Predict disasters", "Choose the most favorable time to begin something", "Read past lives", "Calculate house systems"],
    correctIndex: 1,
    explanation: "Electional astrology picks the best time to start something — launching a business, signing a contract, getting married. You select a chart that supports your intentions.",
  },
  {
    question: "A planet in its domicile means:",
    options: ["It is at its weakest", "It is in the sign it rules and expresses most naturally", "It is retrograde", "It is conjunct the Sun"],
    correctIndex: 1,
    explanation: "A planet in domicile is in the sign it rules — like being at home. It expresses its energy most naturally and effectively. Venus in Taurus or Mars in Aries, for example.",
  },
  {
    question: "What is mutual reception?",
    options: ["Two planets in the same sign", "Two planets each in the sign the other rules", "A planet opposite its ruler", "Two conjunct planets"],
    correctIndex: 1,
    explanation: "Mutual reception occurs when two planets occupy each other's ruling signs — like Mars in Cancer and Moon in Aries. They cooperate, each hosting the other as a guest.",
  },
  {
    question: "The Part of Fortune is calculated from:",
    options: ["Jupiter and Venus only", "Ascendant, Sun, and Moon positions", "The Midheaven and Saturn", "The North Node and South Node"],
    correctIndex: 1,
    explanation: "The Part of Fortune (Lot of Fortune) is calculated from the Ascendant, Sun, and Moon. In day charts: ASC + Moon - Sun. In night charts: ASC + Sun - Moon. It shows where fortune flows.",
  },
  {
    question: "When is it ethically inappropriate to give an astrological reading?",
    options: ["When the client is a beginner", "When the question involves diagnosing medical conditions or predicting death", "When the chart has many squares", "When Mercury is retrograde"],
    correctIndex: 1,
    explanation: "Ethical boundaries are critical. Never diagnose medical conditions, predict specific deaths, or read for third parties without their consent. Know your scope and when to refer out.",
  },
  {
    question: "Zodiacal Releasing is a timing technique that uses:",
    options: ["The Part of Fortune for career and the Part of Spirit for overall direction", "Only solar returns", "The Moon's nodes exclusively", "Only eclipse cycles"],
    correctIndex: 0,
    explanation: "Zodiacal Releasing uses the Lot of Spirit (for career/direction) and the Lot of Fortune (for circumstances/body) to map major life chapters and peak periods.",
  },
  {
    question: "Chart rectification involves:",
    options: ["Correcting calculation errors", "Determining an unknown birth time using life events", "Adjusting for daylight saving time", "Changing house systems"],
    correctIndex: 1,
    explanation: "Chart rectification is the process of determining an unknown birth time by working backward from major life events to find which time produces a chart consistent with those events.",
  },
];

// ─── Advanced Tarot Assessment ───

const ADVANCED_TAROT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "In the Astrological Spread (12 cards in a wheel), each card position represents:",
    options: ["A month of the year", "An astrological house and its life domain", "A zodiac sign", "A planetary energy"],
    correctIndex: 1,
    explanation: "The Astrological Spread maps 12 cards to the 12 houses — each position represents the corresponding life domain, from self-identity (1st) through subconscious (12th).",
  },
  {
    question: "Shadow work with tarot primarily involves:",
    options: ["Only reading reversed cards", "Exploring hidden or denied aspects of the self using cards like The Devil, The Moon, and Swords", "Performing readings in the dark", "Only using the Major Arcana"],
    correctIndex: 1,
    explanation: "Shadow work uses tarot as a mirror for the subconscious — The Devil (chains and addictions), The Moon (fears and illusions), and Swords (mental pain) are key allies in facing what is hidden.",
  },
  {
    question: "When a client becomes emotional during a reading, the best approach is:",
    options: ["Stop the reading immediately", "Ignore their emotions and continue", "Hold space with compassion, pause if needed, and never push", "Tell them what they want to hear to calm them down"],
    correctIndex: 2,
    explanation: "When emotions arise, hold space with compassion. Pause if needed, offer tissue and silence, never push past their comfort, and never rush to 'fix' their feelings. Presence is the gift.",
  },
  {
    question: "Predictive tarot timing using suits assigns:",
    options: ["Each suit to a season: Wands/Spring, Cups/Summer, Swords/Autumn, Pentacles/Winter", "No timing — tarot cannot predict timing", "Suits to specific months only", "Only Court Cards carry timing information"],
    correctIndex: 0,
    explanation: "One common timing system assigns suits to seasons: Wands (Spring/days), Cups (Summer/weeks), Swords (Autumn/weeks), Pentacles (Winter/months-years). Numbers can indicate specific counts.",
  },
  {
    question: "The psychological approach to tarot views the cards as:",
    options: ["Literal future predictions", "Mirrors of the subconscious and tools for self-reflection", "Only historical artifacts", "Entertainment without meaning"],
    correctIndex: 1,
    explanation: "Psychological tarot uses cards as mirrors for the subconscious. Rather than predicting fixed futures, it illuminates patterns, motivations, and choices — empowering the querent.",
  },
  {
    question: "When should a tarot reader refer a client to a professional?",
    options: ["Never — tarot handles everything", "When the client's concerns involve mental health, medical issues, or legal matters beyond your scope", "Only when the client asks", "When difficult cards appear"],
    correctIndex: 1,
    explanation: "Know your limits. Refer to mental health professionals, doctors, or lawyers when concerns cross into their domain. Tarot can complement but never replace professional care.",
  },
  {
    question: "The Tree of Life Spread maps 10 cards to:",
    options: ["The 10 planets", "The 10 Sephiroth of the Kabbalistic Tree", "The 10 numbered Minor Arcana", "The 10 most important readings"],
    correctIndex: 1,
    explanation: "The Tree of Life Spread places 10 cards on the Sephiroth — from Kether (divine spark) to Malkuth (material reality), mapping a spiritual journey from potential to manifestation.",
  },
  {
    question: "Working with 'difficult' cards like the Tower or 10 of Swords requires:",
    options: ["Sugarcoating the message", "Honest reframing without denial — acknowledging the challenge while showing the growth potential", "Pretending the card was not drawn", "Only reading them reversed"],
    correctIndex: 1,
    explanation: "Difficult cards deserve honesty without cruelty. Acknowledge the challenge, reframe without denial, and illuminate the growth hidden within — the Tower destroys illusion to reveal truth.",
  },
  {
    question: "A Chakra Spread uses how many cards?",
    options: ["5", "7", "10", "12"],
    correctIndex: 1,
    explanation: "The Chakra Spread uses 7 cards — one for each energy center from Root (survival) to Crown (spiritual connection), providing an energetic assessment of the whole person.",
  },
  {
    question: "What is the most important quality for a professional tarot reader?",
    options: ["Memorizing every card meaning perfectly", "Developing genuine empathy balanced with clear boundaries", "Having the most expensive deck", "Reading for as many people as possible"],
    correctIndex: 1,
    explanation: "Genuine empathy balanced with clear boundaries is the foundation of professional practice. Technical knowledge is essential, but the ability to hold space with care is what makes a reader great.",
  },
];

// ─── Speed Round Quiz ───

const SPEED_ROUND_QUIZ_QUESTIONS: QuizQuestion[] = [
  { question: "Ace of Wands — primary keyword?", options: ["Loss", "Inspiration", "Deception", "Rest"], correctIndex: 1, explanation: "The Ace of Wands is a spark of creative inspiration. A new beginning in the realm of Fire." },
  { question: "Three of Swords — primary keyword?", options: ["Victory", "Heartbreak", "Abundance", "Adventure"], correctIndex: 1, explanation: "The Three of Swords unmistakably represents heartbreak, grief, and sorrow." },
  { question: "Ten of Cups — primary keyword?", options: ["Burden", "Deception", "Emotional fulfillment", "Anxiety"], correctIndex: 2, explanation: "The Ten of Cups represents complete emotional fulfillment — family harmony and lasting love." },
  { question: "Seven of Swords — primary keyword?", options: ["Generosity", "Deception", "Celebration", "Patience"], correctIndex: 1, explanation: "The Seven of Swords deals with deception, strategy, and stealth. Someone is being too clever." },
  { question: "Four of Pentacles — primary keyword?", options: ["Loss", "Security", "Conflict", "Adventure"], correctIndex: 1, explanation: "The Four of Pentacles represents financial security through careful management — but watch for hoarding." },
  { question: "Eight of Cups — primary keyword?", options: ["Celebration", "Walking away", "Victory", "New love"], correctIndex: 1, explanation: "The Eight of Cups is walking away from something that no longer fills you. A brave, necessary departure." },
  { question: "Six of Wands — primary keyword?", options: ["Defeat", "Isolation", "Victory", "Sacrifice"], correctIndex: 2, explanation: "The Six of Wands is public recognition and victory after struggle. Your efforts are celebrated." },
  { question: "Two of Cups — primary keyword?", options: ["Stalemate", "Partnership", "Anxiety", "Burden"], correctIndex: 1, explanation: "The Two of Cups represents deep partnership — mutual attraction, respect, and genuine connection." },
  { question: "Five of Pentacles — primary keyword?", options: ["Abundance", "Hardship", "Joy", "Wisdom"], correctIndex: 1, explanation: "The Five of Pentacles signals material hardship, poverty, or feeling left out in the cold." },
  { question: "Knight of Wands — primary keyword?", options: ["Patience", "Caution", "Adventure", "Withdrawal"], correctIndex: 2, explanation: "The Knight of Wands charges forward with passionate, adventurous energy — sometimes impulsive, always exciting." },
];

// ─── Quiz map by course/lesson slug ───

const QUIZ_MAP: Record<string, Record<string, { questions: QuizQuestion[]; intro: string; minutes: number }>> = {
  "cosmic-alphabet": {
    "signs-quiz": {
      questions: SIGNS_QUIZ_QUESTIONS,
      intro: "Test your knowledge of the zodiac signs, their elements, modalities, and ruling planets. You have studied the full zodiac wheel — now let us see how deeply it has landed.",
      minutes: 10,
    },
  },
  "celestial-players": {
    "planets-quiz": {
      questions: PLANETS_QUIZ_QUESTIONS,
      intro: "The planets are the actors on your chart's stage. Match each planet to its domain, recognize what it governs, and demonstrate your understanding of the celestial cast.",
      minutes: 10,
    },
  },
  "life-arenas": {
    "houses-quiz": {
      questions: HOUSES_QUIZ_QUESTIONS,
      intro: "The 12 houses divide your life into domains. Match life areas to their houses and prove you can navigate the full wheel of experience.",
      minutes: 10,
    },
  },
  "conversation-between-planets": {
    "aspects-quiz": {
      questions: ASPECTS_QUIZ_QUESTIONS,
      intro: "Aspects are the angular relationships that bring your chart to life. Identify degrees, qualities, and major patterns in this comprehensive quiz.",
      minutes: 10,
    },
  },
  "unfolding-story": {
    "transits-quiz": {
      questions: TRANSITS_QUIZ_QUESTIONS,
      intro: "Your birth chart is a snapshot, but the planets keep moving. Test your knowledge of transits, timing techniques, and predictive astrology.",
      minutes: 10,
    },
  },
  "astrology-of-relationships": {
    "relationships-quiz": {
      questions: RELATIONSHIPS_QUIZ_QUESTIONS,
      intro: "Relationship astrology reveals the chemistry, challenges, and karmic bonds between two charts. Show your mastery of synastry and composite dynamics.",
      minutes: 10,
    },
  },
  "advanced-interpretation": {
    "advanced-quiz": {
      questions: ADVANCED_QUIZ_QUESTIONS,
      intro: "The advanced assessment covers chart synthesis, sect theory, horary and electional astrology, dignities, and professional ethics. This is the comprehensive final test.",
      minutes: 15,
    },
  },
  "fools-journey": {
    "major-arcana-memory": {
      questions: MAJOR_ARCANA_QUIZ_QUESTIONS,
      intro: "The 22 Major Arcana tell the story of the soul's journey. Match cards to keywords, identify correspondences, and prove your knowledge of the archetypal sequence.",
      minutes: 10,
    },
  },
  "world-in-four-suits": {
    "court-card-quiz-personality": {
      questions: COURT_CARD_QUIZ_QUESTIONS,
      intro: "Court Cards represent personality types and stages of elemental mastery. Identify each court card's qualities, element, and role in a reading.",
      minutes: 10,
    },
    "speed-round": {
      questions: SPEED_ROUND_QUIZ_QUESTIONS,
      intro: "Flash drill: see a card, name the keyword. Speed builds fluency. Trust your gut — the first answer is usually the right one.",
      minutes: 8,
    },
    "minor-arcana-quiz": {
      questions: MINOR_ARCANA_QUIZ_QUESTIONS,
      intro: "All 56 Minor Arcana cards across four suits. Keywords, meanings, suit correspondences, and number patterns — the comprehensive test.",
      minutes: 12,
    },
  },
  "art-of-the-spread": {
    "spreads-quiz": {
      questions: SPREADS_QUIZ_QUESTIONS,
      intro: "Spreads, reading technique, ethics, and intuition development. Demonstrate your ability to conduct meaningful, responsible tarot readings.",
      minutes: 10,
    },
  },
  "stars-meet-cards": {
    "correspondences-quiz": {
      questions: CORRESPONDENCES_QUIZ_QUESTIONS,
      intro: "Tarot and astrology share the same symbolic DNA. Match Major Arcana to planets and signs, and demonstrate your knowledge of the unified system.",
      minutes: 10,
    },
  },
  "readers-path": {
    "advanced-tarot-quiz": {
      questions: ADVANCED_TAROT_QUIZ_QUESTIONS,
      intro: "The final comprehensive tarot assessment. Advanced spreads, psychological approaches, predictive techniques, ethics, and professional practice.",
      minutes: 15,
    },
  },
};

/**
 * Generate quiz content for a lesson.
 * Returns null if the lesson slug does not match a quiz/memory/assessment pattern.
 */
export function generateQuizContent(
  courseSlug: string,
  lessonSlug: string,
  locale: string = "en",
): LessonContent | null {
  // Only handle quiz-like lessons
  const isQuizLesson =
    lessonSlug.includes("quiz") ||
    lessonSlug.includes("memory") ||
    lessonSlug.includes("assessment") ||
    lessonSlug.includes("final-integration");

  if (!isQuizLesson) return null;

  const courseMap = QUIZ_MAP[courseSlug];
  if (!courseMap) return null;

  const quizData = courseMap[lessonSlug];
  if (!quizData) return null;

  return {
    sections: [
      {
        type: "text",
        title: "Test Your Knowledge",
        body: quizData.intro,
      },
      {
        type: "callout",
        style: "tip",
        body: "Take your time with each question. If you get one wrong, read the explanation carefully — it contains the teaching moment. You can retake this quiz as many times as you like.",
      },
      {
        type: "quiz",
        questions: quizData.questions,
      },
    ],
    estimatedMinutes: quizData.minutes,
    keyTakeaway: "Review any questions you missed. Understanding the 'why' behind each answer deepens your knowledge far more than memorizing the correct option.",
  };
}
