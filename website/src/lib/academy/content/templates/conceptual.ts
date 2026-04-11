/**
 * conceptual.ts — Fallback content generator for any lesson without a specific template
 *
 * Generates substantive educational paragraphs for astrology concepts,
 * tarot concepts, professional topics, and any unmapped lesson slug.
 * This is the FALLBACK — it produces real content, not filler.
 */

import type { LessonContent, ContentSection } from "../types";

// ─── Content map by slug patterns ───
// Each entry produces a full set of content sections.

interface ConceptualEntry {
  sections: ContentSection[];
  minutes: number;
  takeaway?: string;
}

const CONTENT_MAP: Record<string, ConceptualEntry> = {
  // ═══════════════════════════════════════
  // ASTROLOGY FOUNDATIONS
  // ═══════════════════════════════════════

  "what-is-astrology": {
    sections: [
      {
        type: "text",
        title: "The Oldest Language of Meaning",
        body: "Astrology is a symbolic system that maps the positions of celestial bodies to human experience. It is not a claim that distant planets push your life around — it is a framework for understanding the patterns, themes, and rhythms that shape who you are and how your life unfolds. For over four thousand years, cultures across the globe have looked up and found meaning in the sky.",
      },
      {
        type: "text",
        title: "From Babylon to the Birth Chart",
        body: "Modern astrology traces its roots to ancient Mesopotamia, where priests tracked planetary cycles to advise kings. The Greeks formalized the zodiac, houses, and aspects into a system recognizable today. The Hellenistic period produced the foundational techniques still used in professional astrology. During the Renaissance, astrology and astronomy were a single discipline — Kepler himself was a practicing astrologer.\n\nThe twentieth century brought psychological astrology, pioneered by Dane Rudhyar and Liz Greene, which reframed the chart as a map of the psyche rather than a predictive tool. Today, astrology blends ancient technique with modern psychological insight — and Olivia Arcana teaches both.",
      },
      {
        type: "text",
        title: "What Astrology Is and What It Is Not",
        body: "Astrology does not claim to predict exact events with certainty. It identifies themes, timing, and tendencies. Your birth chart is a map, not a sentence. It shows your potential, your challenges, and the terrain you are navigating — but you hold the steering wheel.\n\nAstrology also does not require belief in a supernatural mechanism. Whether you understand it as a cosmic correspondence, a psychological projection tool, or a symbolic language for self-reflection, it works because the symbols are rich enough to illuminate real human experience.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Natal chart", definition: "A map of the sky at the exact moment and location of your birth" },
          { term: "Zodiac", definition: "The 12-sign belt of constellations the Sun appears to travel through" },
          { term: "Transits", definition: "Current planetary positions and how they interact with your birth chart" },
          { term: "Houses", definition: "12 sectors of the chart representing different life areas" },
          { term: "Aspects", definition: "Angular relationships between planets that create harmony or tension" },
        ],
      },
      { type: "callout", style: "tip", body: "You do not need to 'believe in' astrology to study it. Approach it as a language. Learn the vocabulary, practice the grammar, and judge its usefulness by whether it helps you understand yourself and others more deeply." },
    ],
    minutes: 15,
    takeaway: "Astrology is a symbolic language for understanding human experience, not a supernatural prediction system. Its value lies in the depth of self-knowledge it enables.",
  },

  "the-zodiac-wheel": {
    sections: [
      {
        type: "text",
        title: "The Zodiac: A Cycle of Becoming",
        body: "The zodiac is not an arbitrary collection of personality types — it is a cycle. It tells the story of consciousness evolving from raw impulse (Aries) to cosmic dissolution (Pisces), through every stage of human development in between. Understanding the zodiac as a sequence, not a list, is the first insight that separates a beginner from a student.",
      },
      {
        type: "text",
        title: "The Logic of the Sequence",
        body: "Aries initiates — pure self, raw will, the spark of 'I exist.' Taurus grounds that existence in the physical world — 'I have.' Gemini names and communicates — 'I think.' Cancer creates emotional bonds — 'I feel.' Leo expresses creatively — 'I will.' Virgo refines and serves — 'I analyze.'\n\nAt Libra, the axis shifts from self to other. Libra balances — 'I relate.' Scorpio transforms through depth — 'I transform.' Sagittarius seeks meaning — 'I seek.' Capricorn builds lasting structures — 'I use.' Aquarius envisions the collective future — 'I know.' Pisces dissolves all boundaries — 'I believe.' And then the cycle begins again.",
      },
      {
        type: "text",
        title: "Every Chart Contains Every Sign",
        body: "A common misconception is that you 'are' your Sun sign. In reality, every chart contains all 12 signs. The signs populate your houses, and planets move through them. You are not one sign — you are the entire zodiac, with different areas emphasized. Your Sun sign is the brightest spotlight, but the whole stage is yours.",
      },
      { type: "callout", style: "insight", body: "Think of the zodiac as a journey, not a menu. Each sign builds on what came before. Understanding the sequence helps you understand why Virgo follows Leo, why Scorpio follows Libra, and why Pisces ends the cycle before Aries begins it again." },
    ],
    minutes: 12,
    takeaway: "The zodiac is a developmental cycle from raw impulse to cosmic consciousness. Every chart contains every sign — you are the entire wheel.",
  },

  "elements-fire-earth-air-water": {
    sections: [
      {
        type: "text",
        title: "The Four Elements: Temperaments of the Cosmos",
        body: "The four elements — Fire, Earth, Air, Water — are the most fundamental division in astrology. Each element represents a way of engaging with reality. Fire acts through inspiration and will. Earth acts through the senses and practical effort. Air acts through thought and communication. Water acts through emotion and intuition.",
      },
      {
        type: "text",
        title: "Element Signatures",
        body: "Fire signs (Aries, Leo, Sagittarius) are driven by passion, creativity, and the need to express themselves. They are warm, energetic, and sometimes impulsive. Fire energy is about doing.\n\nEarth signs (Taurus, Virgo, Capricorn) are grounded in material reality. They value security, craftsmanship, and tangible results. Earth energy is about building.\n\nAir signs (Gemini, Libra, Aquarius) process life through ideas, conversation, and social connection. They are intellectual, communicative, and sometimes detached. Air energy is about thinking.\n\nWater signs (Cancer, Scorpio, Pisces) navigate life through feeling, intuition, and emotional depth. They are empathic, sensitive, and sometimes overwhelmed. Water energy is about feeling.",
      },
      {
        type: "comparison-table",
        headers: ["Element", "Signs", "Core Drive", "Gift", "Challenge"],
        rows: [
          ["Fire", "Aries, Leo, Sagittarius", "Action and inspiration", "Courage and creativity", "Burnout and impatience"],
          ["Earth", "Taurus, Virgo, Capricorn", "Material mastery", "Reliability and skill", "Rigidity and overwork"],
          ["Air", "Gemini, Libra, Aquarius", "Ideas and connection", "Intelligence and fairness", "Detachment and overthinking"],
          ["Water", "Cancer, Scorpio, Pisces", "Emotion and intuition", "Empathy and depth", "Overwhelm and escapism"],
        ],
      },
      { type: "callout", style: "tip", body: "Count the elements in your chart — how many planets are in Fire, Earth, Air, Water signs? A dominant element reveals your default operating mode. A missing element reveals your growth edge." },
    ],
    minutes: 15,
    takeaway: "The four elements describe your fundamental approach to life. Understanding your element balance reveals both your natural strengths and your developmental opportunities.",
  },

  "modalities-cardinal-fixed-mutable": {
    sections: [
      {
        type: "text",
        title: "The Three Modalities: How Energy Moves",
        body: "If elements describe what kind of energy you have, modalities describe how that energy operates. Cardinal energy initiates. Fixed energy sustains. Mutable energy adapts. Every sign belongs to both an element and a modality, creating 12 unique combinations.",
      },
      {
        type: "text",
        title: "Cardinal: The Starters",
        body: "Cardinal signs (Aries, Cancer, Libra, Capricorn) open each season. They are the initiators, the ones who start projects, begin conversations, and set things in motion. Cardinal energy is proactive — it sees what needs to happen and takes the first step. The challenge for cardinal energy is follow-through; starting is easy, finishing requires a different muscle.",
      },
      {
        type: "text",
        title: "Fixed: The Sustainers",
        body: "Fixed signs (Taurus, Leo, Scorpio, Aquarius) occupy the middle of each season. They sustain, deepen, and commit. Fixed energy is tenacious — once it locks on, it does not let go. This makes fixed signs incredibly reliable and determined, but also prone to stubbornness and resistance to change when change is necessary.",
      },
      {
        type: "text",
        title: "Mutable: The Adapters",
        body: "Mutable signs (Gemini, Virgo, Sagittarius, Pisces) close each season, bridging into the next. They are flexible, resourceful, and comfortable with change. Mutable energy excels in transitions — finishing what cardinal started and fixed maintained. The challenge for mutable energy is rootlessness; adaptability without direction can become restlessness.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Cardinal", definition: "Initiates action, starts new cycles, leads" },
          { term: "Fixed", definition: "Sustains effort, deepens commitment, persists" },
          { term: "Mutable", definition: "Adapts to change, bridges transitions, flexible" },
        ],
      },
    ],
    minutes: 12,
    takeaway: "Modalities describe how your energy moves: Cardinal starts, Fixed sustains, Mutable adapts. Your modality balance determines your relationship with change and commitment.",
  },

  "polarities-and-mirrors": {
    sections: [
      {
        type: "text",
        title: "Opposite Signs as Mirrors",
        body: "Each zodiac sign has an opposite — a complementary sign 180 degrees across the wheel. These are not enemies; they are mirrors. Each sign contains qualities the other lacks, and understanding polarities reveals the full spectrum of any zodiac axis.",
      },
      {
        type: "text",
        title: "The Six Polarities",
        body: "Aries-Libra: Self versus partnership. Independence versus cooperation. Both are needed.\n\nTaurus-Scorpio: Material security versus emotional transformation. Holding on versus letting go.\n\nGemini-Sagittarius: Local knowledge versus global wisdom. Facts versus meaning.\n\nCancer-Capricorn: Private emotional life versus public ambition. Home versus career.\n\nLeo-Aquarius: Individual creative expression versus collective vision. The star versus the network.\n\nVirgo-Pisces: Practical service versus spiritual transcendence. Analysis versus faith.",
      },
      {
        type: "text",
        title: "Working With Your Polarities",
        body: "When a sign is emphasized in your chart, its opposite sign represents your growth edge. Heavy Aries energy needs Libra's diplomatic awareness. Heavy Cancer energy needs Capricorn's structural ambition. The opposite sign is not your weakness — it is your unrealized potential.\n\nPeople are often attracted to partners who embody their opposite sign. This is not coincidence; it is the psyche seeking integration through relationship.",
      },
      { type: "callout", style: "insight", body: "Your opposite sign is not your antagonist — it is your other half. The zodiac is a complete system, and wholeness comes from integrating both ends of every axis." },
    ],
    minutes: 12,
    takeaway: "Opposite signs are complementary mirrors. Understanding your polarities reveals your unrealized potential and explains the dynamics of your closest relationships.",
  },

  // ═══════════════════════════════════════
  // PLANET LESSONS
  // ═══════════════════════════════════════

  "planets-overview": {
    sections: [
      {
        type: "text",
        title: "Why Planets Matter More Than Signs",
        body: "Most people know their Sun sign. Far fewer know their planetary placements — and yet planets carry more weight in interpretation. Signs describe how energy expresses. Planets describe what is being expressed. A chart without planets is an empty stage. The planets are the actors.",
      },
      {
        type: "text",
        title: "The Planetary Hierarchy",
        body: "Personal planets (Sun, Moon, Mercury, Venus, Mars) change signs frequently and describe your individual personality. Social planets (Jupiter, Saturn) move slowly enough to shape generational cohorts while still carrying personal meaning. Outer planets (Uranus, Neptune, Pluto) spend years in each sign and describe generational themes — their personal impact comes through house placement and aspects to personal planets.\n\nWhen reading a chart, prioritize the personal planets first. They carry the most individual information. The outer planets add depth and context but should not be read in isolation.",
      },
      {
        type: "text",
        title: "Every Planet Has a Job",
        body: "Think of each planet as a department in the company of your psyche. The Sun is the CEO — your core identity and purpose. The Moon is HR — handling your emotional needs and internal culture. Mercury is communications. Venus is creative and relational. Mars is operations — getting things done. Jupiter is the expansion department. Saturn is quality control and compliance.\n\nUnderstanding what each planet does helps you read a chart systematically. When a planet is in a sign, the sign describes how that department operates. When a planet is in a house, the house describes where that department focuses its energy.",
      },
      { type: "callout", style: "tip", body: "Before learning what each planet means in each sign, make sure you know what each planet means on its own. The planet's function is the foundation; the sign just colors the style." },
    ],
    minutes: 12,
    takeaway: "Planets are the most important layer of your chart — they represent the core functions of your psyche. Signs describe how those functions express; houses describe where.",
  },

  "planetary-dignities": {
    sections: [
      {
        type: "text",
        title: "When Planets Are at Home",
        body: "Planetary dignities describe how comfortable and effective a planet is in a given sign. A planet in its own sign (domicile) is like a person in their own home — at ease, confident, and operating at full power. A planet in its exaltation is honored, elevated, working at peak performance in an environment that enhances its nature.",
      },
      {
        type: "text",
        title: "Domicile, Exaltation, Detriment, and Fall",
        body: "Domicile is where a planet rules: Venus in Taurus, Mars in Aries, Jupiter in Sagittarius. The planet expresses its nature most naturally here.\n\nExaltation is where a planet is elevated: Sun in Aries, Moon in Taurus, Venus in Pisces. The planet operates at its highest potential.\n\nDetriment is the sign opposite a planet's domicile: Venus in Scorpio, Mars in Libra. The planet must work harder because the environment is not aligned with its natural expression.\n\nFall is the sign opposite a planet's exaltation: Sun in Libra, Moon in Scorpio, Saturn in Aries. The planet struggles to express its best qualities and may overcompensate.",
      },
      {
        type: "text",
        title: "Dignities Are Not Destiny",
        body: "A planet in detriment or fall is not broken. It simply requires more conscious effort. Some of the most interesting and capable people have planets in challenging dignities because they have had to develop those functions deliberately rather than relying on natural ease.\n\nMars in Libra, for example, must learn to assert itself through diplomacy rather than directness. This is harder than Mars in Aries, but the result — assertiveness combined with social grace — is arguably more sophisticated.",
      },
      {
        type: "comparison-table",
        headers: ["Planet", "Domicile", "Exaltation", "Detriment", "Fall"],
        rows: [
          ["Sun", "Leo", "Aries", "Aquarius", "Libra"],
          ["Moon", "Cancer", "Taurus", "Capricorn", "Scorpio"],
          ["Mercury", "Gemini / Virgo", "Virgo", "Sagittarius / Pisces", "Pisces"],
          ["Venus", "Taurus / Libra", "Pisces", "Scorpio / Aries", "Virgo"],
          ["Mars", "Aries / Scorpio", "Capricorn", "Libra / Taurus", "Cancer"],
          ["Jupiter", "Sagittarius / Pisces", "Cancer", "Gemini / Virgo", "Capricorn"],
          ["Saturn", "Capricorn / Aquarius", "Libra", "Cancer / Leo", "Aries"],
        ],
      },
    ],
    minutes: 15,
    takeaway: "Planetary dignities reveal how naturally a planet can express itself in a given sign. Challenging dignities are not weaknesses — they are invitations to develop conscious mastery.",
  },

  "retrograde-motion": {
    sections: [
      {
        type: "text",
        title: "What Retrograde Actually Means",
        body: "Retrograde motion occurs when a planet appears to move backward through the zodiac from Earth's perspective. It is an optical illusion caused by orbital mechanics — the planet is not actually reversing course. But in astrology, this apparent reversal carries real symbolic meaning: retrograde periods are times of review, revision, and reflection.",
      },
      {
        type: "text",
        title: "How Retrograde Affects Each Planet",
        body: "Mercury retrograde (3-4 times per year, ~3 weeks each) invites you to review communications, revisit old ideas, and double-check details. It is not a time to panic, but a time to be more careful with contracts, technology, and travel plans.\n\nVenus retrograde (every 18 months, ~40 days) turns the heart inward. Old loves may resurface, current relationships get reassessed, and your relationship to beauty and money shifts.\n\nMars retrograde (every 2 years, ~2.5 months) slows your drive and assertiveness. Actions taken may stall or redirect. It is a time to reconsider strategy rather than charge forward.\n\nOuter planet retrogrades (4-5 months each year) affect generational themes more than personal ones, unless the retrograde activates a personal placement by transit.",
      },
      {
        type: "text",
        title: "Natal Retrograde Planets",
        body: "If a planet was retrograde at your birth, that planet's energy turns inward. Natal Mercury retrograde people often process information in nonlinear ways and may be better writers than speakers. Natal Venus retrograde people may have an unusual relationship with love and beauty — one that deepens over time rather than conforming to social norms.\n\nNatal retrogrades are not deficiencies. They indicate areas where your expression is more internalized, more reflective, and often more profound than the norm.",
      },
      { type: "callout", style: "tip", body: "Retrograde periods are not cursed times — they are review periods. Use them to revisit, revise, and refine. The universe is asking you to slow down, not stop." },
    ],
    minutes: 12,
    takeaway: "Retrograde periods are invitations to review and refine. Natal retrograde planets indicate internalized, reflective expressions of that planet's energy.",
  },

  // ═══════════════════════════════════════
  // SIGN-GROUP LESSONS
  // ═══════════════════════════════════════

  "aries-taurus-gemini": {
    sections: [
      { type: "text", title: "The First Quarter: Aries, Taurus, and Gemini", body: "The first three signs of the zodiac represent the emergence of individual identity. Aries is the spark — pure will, raw initiative, the cry of 'I exist.' Taurus grounds that existence in physical reality — sensation, security, the pleasure of embodiment. Gemini names and communicates what has been created — language, thought, connection.\n\nTogether, they form the foundation of selfhood: identity (Aries), embodiment (Taurus), and mind (Gemini). Every human being goes through this developmental sequence, and every chart contains these three signs somewhere." },
      { type: "sign-profile", sign: "aries" },
      { type: "sign-profile", sign: "taurus" },
      { type: "sign-profile", sign: "gemini" },
    ],
    minutes: 20,
    takeaway: "Aries initiates identity, Taurus grounds it in the body, and Gemini gives it a voice. This first quarter builds the foundation of the individual self.",
  },

  "cancer-leo-virgo": {
    sections: [
      { type: "text", title: "The Second Quarter: Cancer, Leo, and Virgo", body: "The second quarter deepens individual development through emotion, creativity, and service. Cancer creates the emotional foundation — belonging, nurture, the inner world. Leo radiates outward — creative self-expression, confidence, and the need to be seen. Virgo refines the whole package — analysis, craft, health, and devotion to useful work.\n\nThese signs take the raw identity built in the first quarter and develop it into something capable, expressive, and emotionally intelligent." },
      { type: "sign-profile", sign: "cancer" },
      { type: "sign-profile", sign: "leo" },
      { type: "sign-profile", sign: "virgo" },
    ],
    minutes: 20,
    takeaway: "Cancer nurtures emotional depth, Leo expresses creative confidence, and Virgo refines everything into practical mastery. This quarter develops the heart, the voice, and the craft.",
  },

  "libra-scorpio-sagittarius": {
    sections: [
      { type: "text", title: "The Third Quarter: Libra, Scorpio, and Sagittarius", body: "At Libra, the zodiac pivots from self-development to relationship with the other. Libra seeks balance and partnership. Scorpio plunges into the depths of shared intimacy and power. Sagittarius rises from the depths seeking meaning, truth, and the big picture.\n\nThis quarter is about learning through relationship, transformation, and the search for something larger than yourself. It is where astrology gets deep, because it deals with what happens when you encounter forces you cannot control." },
      { type: "sign-profile", sign: "libra" },
      { type: "sign-profile", sign: "scorpio" },
      { type: "sign-profile", sign: "sagittarius" },
    ],
    minutes: 20,
    takeaway: "Libra learns through partnership, Scorpio through transformation, and Sagittarius through the search for meaning. This quarter is about engaging with forces beyond the self.",
  },

  "capricorn-aquarius-pisces": {
    sections: [
      { type: "text", title: "The Final Quarter: Capricorn, Aquarius, and Pisces", body: "The final three signs represent the culmination of the zodiac journey. Capricorn builds structures that outlast the individual — legacy, authority, mastery. Aquarius envisions the collective future — revolution, innovation, humanitarian ideals. Pisces dissolves all boundaries — returning to the cosmic ocean of consciousness from which Aries will eventually re-emerge.\n\nThese signs operate on the largest scale. They are concerned not just with the individual, but with society, the future, and the transcendent." },
      { type: "sign-profile", sign: "capricorn" },
      { type: "sign-profile", sign: "aquarius" },
      { type: "sign-profile", sign: "pisces" },
    ],
    minutes: 20,
    takeaway: "Capricorn builds legacy, Aquarius envisions the future, and Pisces dissolves into transcendence. This final quarter carries the heaviest themes and the widest perspective.",
  },

  // ═══════════════════════════════════════
  // TAROT FOUNDATIONS
  // ═══════════════════════════════════════

  "tarot-intro": {
    sections: [
      {
        type: "text",
        title: "Tarot: A Mirror, Not a Crystal Ball",
        body: "Tarot is a system of 78 symbolic images that serve as a mirror for the subconscious mind. When you draw a card, you are not receiving a message from an external entity — you are engaging with a symbol rich enough to illuminate patterns, choices, and possibilities you might not see through ordinary thinking alone.",
      },
      {
        type: "text",
        title: "A Brief History",
        body: "Tarot cards originated as playing cards in 15th-century Italy — the tarocchi. They became associated with divination in the 18th century when French occultists connected them to Kabbalistic and astrological symbolism. The Rider-Waite-Smith deck (1909) was the first to include fully illustrated scenes on every card, making intuitive reading accessible to everyone.\n\nToday, tarot is used for self-reflection, creative inspiration, psychological exploration, and divinatory guidance. It does not require any specific spiritual belief — only a willingness to engage with symbols honestly.",
      },
      {
        type: "text",
        title: "How Tarot Works",
        body: "There is no scientific consensus on why tarot seems to provide meaningful insight. Some practitioners believe in synchronicity — the idea that the cards drawn are not random but reflect the moment's energy. Others view tarot purely as a projective tool — like a Rorschach test, the meaning you find in a card reveals your own unconscious patterns.\n\nRegardless of mechanism, tarot's track record of usefulness spans centuries. The images are archetypal enough to apply to any human situation, and the act of reading them cultivates a quality of attention that ordinary thinking does not provide.",
      },
      { type: "callout", style: "tip", body: "Approach tarot with curiosity rather than belief or skepticism. Let the cards show you what they show you, and judge the system by whether the insights are useful in your life." },
    ],
    minutes: 15,
    takeaway: "Tarot is a symbolic system that serves as a mirror for the subconscious. Its value lies not in supernatural prediction but in the quality of self-awareness it cultivates.",
  },

  "deck-anatomy": {
    sections: [
      {
        type: "text",
        title: "78 Cards, Two Worlds",
        body: "A standard tarot deck contains 78 cards divided into two main groups: the 22 Major Arcana and the 56 Minor Arcana. The Major Arcana represent major life themes, archetypal forces, and significant turning points. The Minor Arcana represent everyday experiences, emotions, thoughts, and material concerns.\n\nThink of the Major Arcana as the chapters of your life story — birth, death, love, crisis, triumph. The Minor Arcana are the sentences — the daily emotions, decisions, conflicts, and pleasures that fill those chapters.",
      },
      {
        type: "text",
        title: "The Four Suits",
        body: "The 56 Minor Arcana are divided into four suits of 14 cards each: Wands (Fire), Cups (Water), Swords (Air), and Pentacles (Earth). Each suit contains cards numbered Ace through Ten, plus four Court Cards: Page, Knight, Queen, and King.\n\nThe numbered cards (pips) tell a progression story within each suit — from the pure potential of the Ace to the completion of the Ten. The Court Cards represent personality types, stages of mastery, or people in your life who embody that element's energy.",
      },
      {
        type: "comparison-table",
        headers: ["Suit", "Element", "Domain", "Court Card Energy"],
        rows: [
          ["Wands", "Fire", "Passion, creativity, action, ambition", "Visionary leadership"],
          ["Cups", "Water", "Emotion, love, intuition, relationships", "Emotional intelligence"],
          ["Swords", "Air", "Mind, truth, conflict, communication", "Intellectual authority"],
          ["Pentacles", "Earth", "Money, health, work, material world", "Practical mastery"],
        ],
      },
      { type: "callout", style: "insight", body: "When a reading is dominated by one suit, it tells you which dimension of life is most active. All Cups? The situation is entirely emotional. All Swords? The mind is running the show." },
    ],
    minutes: 10,
    takeaway: "The 78-card deck splits into Major Arcana (big life themes) and four Minor Arcana suits (everyday experience across fire, water, air, and earth).",
  },

  "upright-vs-reversed": {
    sections: [
      {
        type: "text",
        title: "The Philosophy of Reversals",
        body: "When a card appears upside-down in a reading, it is called reversed. Not all readers use reversals — and whether to include them is a legitimate choice, not a right/wrong issue. But reversals add nuance to readings and double the vocabulary available to you.",
      },
      {
        type: "text",
        title: "What Reversals Mean",
        body: "A reversed card is not simply the opposite of its upright meaning. It can indicate several things depending on context: the card's energy is blocked or delayed, the energy is internalized rather than expressed, the shadow side of the card is active, or the energy is present at a reduced intensity.\n\nThe Ten of Cups upright is emotional fulfillment; reversed, it might mean the fulfillment is there but you are not letting yourself feel it. The Tower upright is sudden external upheaval; reversed, it might mean internal resistance to necessary change. The nuance matters.",
      },
      {
        type: "text",
        title: "Working With or Without Reversals",
        body: "If you choose to read reversals, consistency is key. Decide on your approach before the reading, not during. Some readers treat reversals as blocked energy. Others as the card's internal or private expression. Others use the full range of possible meanings and let intuition guide which applies.\n\nIf you choose not to read reversals, you lose nothing essential. Many experienced readers use upright-only and account for the full spectrum of each card's meaning through context and surrounding cards.",
      },
      { type: "callout", style: "tip", body: "Start without reversals. Master the upright meanings first. Once you feel fluent, add reversals — they will expand your reading vocabulary significantly." },
    ],
    minutes: 12,
    takeaway: "Reversals add nuance but are not required. They can indicate blocked, internalized, or shadow expressions of a card's energy. Start without them and add later.",
  },

  // ═══════════════════════════════════════
  // PROFESSIONAL PRACTICE
  // ═══════════════════════════════════════

  "ethics-in-astrology": {
    sections: [
      {
        type: "text",
        title: "The Ethical Foundations of Practice",
        body: "As a practicing astrologer or tarot reader, you hold space for people in vulnerable moments. They share their fears, hopes, and deepest questions with you. This trust comes with serious ethical responsibilities that must be understood before you read for anyone.",
      },
      {
        type: "text",
        title: "What You Must Not Do",
        body: "Never predict specific death, illness, or tragedy. You are not a medical professional, and astrological or tarot indicators are not diagnostic tools. If a client asks about health, you can discuss general themes — but always recommend they consult a qualified healthcare provider.\n\nNever read for a third party without their knowledge or consent. A client asking 'What is my ex thinking?' is asking you to invade someone's psychological space. Redirect to: 'What do you need to understand about this situation for your own growth?'\n\nNever create dependency. Your role is to empower clients to understand their own charts and make their own decisions — not to become their oracle for every life choice.",
      },
      {
        type: "text",
        title: "What You Must Always Do",
        body: "Always frame challenging information with growth potential. The chart shows tendencies, not fixed outcomes. A difficult Saturn transit is not a punishment — it is an opportunity for maturation. Always offer the redemptive reading alongside the difficult one.\n\nAlways maintain confidentiality. What a client shares in a reading is private. Never discuss client readings publicly or with other clients.\n\nAlways know when to refer out. If a client is in crisis, experiencing suicidal ideation, or dealing with domestic violence, you are not the right resource. Have referral information for mental health professionals available.",
      },
      { type: "callout", style: "warning", body: "Your words carry weight. When someone is vulnerable, a careless statement about 'a difficult year ahead' can cause real harm. Always choose empowerment over fatalism, and hope over fear." },
    ],
    minutes: 15,
    takeaway: "Ethical practice means never predicting harm, never creating dependency, always empowering the client, and knowing when to refer to qualified professionals.",
  },

  "structuring-a-reading": {
    sections: [
      {
        type: "text",
        title: "The Arc of a Professional Reading",
        body: "A great reading is not a data dump of astrological facts. It is a conversation with a clear structure: opening, body, and close. The reader guides the client through a journey — from context-gathering to insight to empowerment.",
      },
      {
        type: "text",
        title: "Preparation and Intake",
        body: "Before the reading, gather essential information: birth data (for astrology), the client's primary question or area of focus, and any context they choose to share. Do your chart preparation in advance so the session itself is devoted to interpretation and conversation.\n\nSet expectations: how long the session will be, what you will and will not cover, and that the reading is for guidance rather than fixed prediction.",
      },
      {
        type: "text",
        title: "Delivery and Close",
        body: "Start with something affirming — the client's chart ruler, their Big Three, or a gift in their chart. Build rapport before addressing challenges. When delivering difficult information, use the framework: name the pattern, normalize it, offer the growth path.\n\nClose with the most empowering insight. What is the chart's greatest gift? What is the single most useful thing the client can take away? End on this note. Follow up with brief written notes if appropriate.",
      },
      {
        type: "callout",
        style: "tip",
        body: "The best readings feel like the reader has seen you clearly and told you something you already knew but could not articulate. Aim for that quality of recognition, not surprise.",
      },
    ],
    minutes: 18,
    takeaway: "Professional readings follow a clear arc: gather context, open with strengths, address challenges with care, and close with empowerment. Structure serves both reader and client.",
  },

  "developing-your-style": {
    sections: [
      {
        type: "text",
        title: "Finding Your Voice as a Reader",
        body: "Every great astrologer and tarot reader develops a distinctive voice. Some are psychological — using the chart as a therapeutic mirror. Some are predictive — focusing on timing and events. Some are spiritual — reading the chart as a soul's blueprint. Your style emerges naturally from your own chart, your training, and the clients you attract.",
      },
      {
        type: "text",
        title: "The Three Major Approaches",
        body: "Psychological astrology uses the chart primarily for self-understanding. It draws from Jung, developmental psychology, and the idea that the chart maps the psyche. This approach excels at helping clients understand patterns, motivations, and growth edges.\n\nPredictive astrology focuses on timing — what will happen when, and how to prepare. It uses transits, progressions, solar returns, and traditional techniques to map future themes. This approach excels at practical life guidance.\n\nSpiritual astrology reads the chart as a map of the soul's journey across lifetimes. It uses nodes, past-life indicators, and evolutionary markers. This approach excels at meaning-making and existential guidance.",
      },
      {
        type: "text",
        title: "Blending Approaches",
        body: "Most skilled readers blend all three. A reading might start with psychological insight (your Saturn square Moon makes intimacy feel dangerous), move to predictive guidance (this Saturn transit is activating that exact pattern), and close with spiritual framing (the soul chose this challenge for a reason — here is what it is teaching you).\n\nYour unique blend will emerge through practice. Read for many people, notice what you do well, and lean into your natural strengths while developing the areas that feel less natural.",
      },
      { type: "callout", style: "insight", body: "Your own chart is your first clue to your reading style. Mercury-dominant charts produce great communicators. Neptune-dominant charts produce intuitive, spiritual readers. Pluto-dominant charts produce psychological depth readers." },
    ],
    minutes: 15,
    takeaway: "Your reading style emerges from your own chart, training, and practice. The best readers blend psychological, predictive, and spiritual approaches into a distinctive voice.",
  },

  "burnout-prevention": {
    sections: [
      {
        type: "text",
        title: "The Practitioner's Self-Care",
        body: "Reading for others is emotionally and energetically demanding work. You absorb stories of pain, crisis, and uncertainty. Without deliberate self-care, empathic fatigue and burnout are not just possible — they are likely. Your chart can guide you toward the self-care practices that actually work for your unique constitution.",
      },
      {
        type: "text",
        title: "Using Your Chart for Self-Awareness",
        body: "Your Moon sign tells you what you need to recharge. A Moon in Taurus needs physical comfort — good food, nature walks, physical touch. A Moon in Aquarius needs intellectual stimulation and alone time. A Moon in Pisces needs creative expression and spiritual practice.\n\nYour 6th house (health and daily routine) and 12th house (rest and spiritual retreat) reveal the specific practices that prevent burnout for you personally. Planets in these houses, and their rulers, provide a customized self-care plan that no generic wellness advice can match.",
      },
      {
        type: "text",
        title: "Practical Boundaries",
        body: "Limit the number of readings per day. Most practitioners find that three to four deep readings is the maximum before quality declines. Build buffer time between sessions. Do not read when you are emotionally depleted — your projections will contaminate the reading.\n\nDevelop a clearing ritual between clients. This can be as simple as washing your hands, taking three breaths, or stepping outside for a moment. The purpose is to mark a boundary between the last client's energy and the next.",
      },
      { type: "callout", style: "warning", body: "Burnout does not announce itself. It accumulates quietly. If you notice you are dreading sessions, feeling cynical about clients, or losing accuracy in your readings, these are signals that you need rest — not more effort." },
    ],
    minutes: 12,
    takeaway: "Your own chart is your best self-care guide. Know your Moon, your 6th and 12th houses, and build boundaries that honor your energy as carefully as you honor your clients'.",
  },

  // ═══════════════════════════════════════
  // TAROT INTERMEDIATE
  // ═══════════════════════════════════════

  "asking-right-questions": {
    sections: [
      {
        type: "text",
        title: "The Question Shapes the Answer",
        body: "In tarot, the quality of your question determines the quality of your reading. A vague question produces a vague answer. A precise, open-ended question opens the door to genuine insight. Learning to formulate good questions is one of the most important skills a tarot reader can develop.",
      },
      {
        type: "text",
        title: "Open vs. Closed Questions",
        body: "Closed questions (yes/no) limit the cards' ability to provide nuanced guidance. 'Will I get the promotion?' gives you a binary answer that misses the real story.\n\nOpen questions invite depth. 'What do I need to understand about my career situation right now?' allows the cards to address angles you have not considered — perhaps the promotion is not the real issue; perhaps your relationship to authority or your creative fulfillment is.\n\nThe best tarot questions start with 'What,' 'How,' or 'What do I need to know about...' They focus on understanding rather than predicting specific outcomes.",
      },
      {
        type: "text",
        title: "Reframing Common Questions",
        body: "'Will he come back?' becomes 'What do I need to understand about this relationship for my own growth?'\n\n'When will I find love?' becomes 'What is blocking me from receiving love, and how can I open to it?'\n\n'Should I take the job?' becomes 'What would each path offer me, and what does my intuition say?'\n\nThe reframed question does not avoid the issue — it addresses it from a position of empowerment rather than passivity.",
      },
      { type: "callout", style: "tip", body: "Before every reading, spend a full minute refining your question. The difference between a good reading and a great one often comes down to the quality of the question asked." },
    ],
    minutes: 12,
    takeaway: "The question shapes the answer. Open-ended questions that focus on understanding and empowerment produce dramatically better readings than closed yes/no queries.",
  },

  "developing-intuition": {
    sections: [
      {
        type: "text",
        title: "Beyond Book Meanings",
        body: "Memorizing card meanings is essential — but it is only the beginning. True tarot fluency comes when you move beyond the book and into direct, intuitive engagement with the images. The cards speak through symbols, colors, body posture, and the emotional response they trigger in you. Learning to hear this layer is what separates a card reader from a tarot reader.",
      },
      {
        type: "text",
        title: "Practices for Developing Intuition",
        body: "Daily draws are the foundation. Draw one card each morning and sit with the image before looking up its meaning. What do you see? What do you feel? Write your impression first, then compare it to the traditional meaning. Over time, your first impressions will become increasingly accurate.\n\nMeditation with cards deepens the connection. Choose a card, place it before you, and gaze softly at the image for five minutes. Let the symbols speak. Notice what draws your eye, what repels you, and what memories or emotions surface. This is your subconscious in dialogue with the archetype.\n\nJournaling builds a personal relationship with each card. Over months of daily draws, you will develop your own meanings — based on lived experience, not just textbook definitions.",
      },
      {
        type: "text",
        title: "Trusting the Process",
        body: "Intuition is not magical — it is pattern recognition operating below conscious awareness. The more you practice, the more data your subconscious accumulates. A seemingly random impression during a reading is often your brain connecting a visual cue in the card to something the client said, a pattern you have seen before, or a feeling that matches the situation.\n\nTrust your gut. When an impression arrives during a reading that does not match the book meaning, follow the impression. It is almost always more accurate for that specific situation.",
      },
      { type: "callout", style: "insight", body: "Intuition is a skill, not a gift. It develops through consistent practice, honest journaling, and the willingness to be wrong sometimes. Every experienced reader has a stack of journal entries that prove it." },
    ],
    minutes: 15,
    takeaway: "Intuition is developed through daily practice, meditation with cards, and journaling. Trust your impressions — they are pattern recognition, not guesswork.",
  },

  "reading-for-others": {
    sections: [
      {
        type: "text",
        title: "The Shift From Self to Service",
        body: "Reading for yourself and reading for others are fundamentally different skills. When you read for yourself, you know the context. When you read for someone else, you must navigate ambiguity, hold space for their emotions, and communicate clearly without projecting your own experience onto theirs.",
      },
      {
        type: "text",
        title: "Setting the Space",
        body: "Before a reading begins, create an environment of trust and presence. This does not require candles and incense (though those are fine). It requires your full attention, a clear statement of what the reading will involve, and an invitation for the client to share as much or as little context as they choose.\n\nEstablish boundaries: what you can and cannot do, how long the session will last, and that the reading is for guidance rather than absolute prediction. These boundaries protect both you and the client.",
      },
      {
        type: "text",
        title: "Delivering Difficult Messages",
        body: "Every reader encounters difficult cards in a reading. The Three of Swords. The Tower. The Ten of Swords. Your job is not to sugarcoat — denial helps no one — but to reframe with honesty and care.\n\nThe framework: name the challenge honestly, normalize it ('this is a pattern many people experience during this kind of transition'), and offer the growth perspective ('the Tower does not destroy what is real — it clears away what was built on a false foundation so something authentic can emerge').\n\nNever leave a client in darkness. Every challenging card has a redemptive reading. Find it and offer it sincerely.",
      },
      { type: "callout", style: "warning", body: "If a client becomes visibly distressed, pause the reading. Ask what they need. Sometimes the most powerful thing you can offer is silence and presence, not more cards." },
    ],
    minutes: 15,
    takeaway: "Reading for others requires setting clear boundaries, holding space with full presence, and delivering difficult messages with honesty, compassion, and redemptive framing.",
  },

  // ═══════════════════════════════════════
  // ADVANCED ASTROLOGY — TECHNIQUE & SYNTHESIS
  // ═══════════════════════════════════════

  "chart-synthesis": {
    sections: [
      {
        type: "text",
        title: "Seeing the Whole Before the Parts",
        body: "Reading a birth chart is not a matter of listing isolated placements — Sun in Gemini, Moon in Scorpio, Venus in Cancer — and hoping they add up. True chart synthesis means perceiving the chart as a unified whole, a single portrait of a human life. Robert Hand, in Horoscope Symbols, argues that the chart is a mandala: a symbolic diagram where every element relates to every other element, and the meaning emerges from the pattern, not the parts. The beginner reads placements. The intermediate reads aspects. The advanced reader reads the entire field at once, sensing where the energy concentrates, where it flows freely, and where it gets stuck. This lesson teaches the systematic approach that bridges isolated knowledge and holistic understanding.",
      },
      {
        type: "text",
        title: "Starting With the Big Three and Chart Ruler",
        body: "Begin with the Ascendant, Sun, and Moon — the Big Three. The Ascendant sets the lens through which the entire chart expresses. The Sun represents the conscious purpose and creative will. The Moon reveals emotional needs and instinctive reactions. Together, they form the core identity triangle. Next, identify the chart ruler: the planet that rules the Ascendant sign. This planet's sign, house, and condition tell you where the native's life energy is directed. A Scorpio Ascendant makes Mars (traditional) or Pluto (modern) the chart ruler. If that Mars sits in the 9th house in Cancer in its fall, the life path involves a struggle to assert oneself in the realm of higher learning, philosophy, or foreign cultures. The chart ruler is arguably the single most important planet in any chart.",
      },
      {
        type: "text",
        title: "Sect, Element Balance, and the Strongest Planet",
        body: "Determine the sect of the chart — is the Sun above the horizon (day chart) or below it (night chart)? This immediately tells you which benefic and malefic operate more favorably. Then scan the element and modality balance: count how many planets fall in Fire, Earth, Air, and Water signs, and how many in Cardinal, Fixed, and Mutable signs. An overloaded element reveals a dominant mode of engagement; a missing element reveals a blind spot. Finally, identify the strongest planet by essential dignity. Which planet is in its own domicile, exaltation, or triplicity? A planet with strong dignity acts with authority and confidence in the chart. A planet with no dignity — peregrine — wanders without resources and must rely on other planets for support.",
      },
      {
        type: "text",
        title: "Aspect Patterns and Final Integration",
        body: "Look for major aspect configurations: T-squares (two planets in opposition, both squaring a third), Grand Trines (three planets in mutual trine forming an equilateral triangle), Grand Crosses (four planets in mutual square and opposition), and Yod patterns (two planets sextile each other, both quincunx a third). These patterns dominate the chart and often describe the central drama of the life. A T-square creates relentless tension and drive; a Grand Trine creates ease that can become complacency. The final step is integration: hold all of these observations simultaneously and ask, what story does this chart tell? What is this person here to learn, to create, to transform? The chart is a single narrative, and synthesis means reading it as one.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Step 1: Big Three", definition: "Identify Ascendant, Sun sign/house, Moon sign/house — the core identity triangle" },
          { term: "Step 2: Chart Ruler", definition: "Find the planet ruling the Ascendant sign; assess its sign, house, dignity, and aspects" },
          { term: "Step 3: Sect", definition: "Determine day or night chart; identify the most and least favorable planets accordingly" },
          { term: "Step 4: Element/Modality Count", definition: "Tally planets by element and modality to find dominance and deficiency patterns" },
          { term: "Step 5: Strongest Planet", definition: "Identify the planet with the most essential dignity — it acts with greatest authority" },
          { term: "Step 6: Aspect Patterns", definition: "Look for T-squares, Grand Trines, Grand Crosses, Yods, and stelliums" },
          { term: "Step 7: Narrative Integration", definition: "Synthesize all observations into a single coherent life story" },
        ],
      },
      { type: "callout", style: "insight", body: "The mark of a skilled astrologer is not knowing more placements — it is seeing fewer, more meaningful patterns. A chart reading that lists every placement is an encyclopedia entry. A chart reading that tells a story is an act of understanding." },
      { type: "callout", style: "tip", body: "Further Reading: Horoscope Symbols by Robert Hand — the foundational text on reading charts as integrated symbolic wholes. Also: The Art of Chart Interpretation by Tracy Marks — a step-by-step workbook for developing synthesis skills." },
    ],
    minutes: 25,
    takeaway: "Chart synthesis means reading the birth chart as a unified narrative, not a list of isolated placements. Start with the Big Three and chart ruler, assess sect and dignity, identify aspect patterns, and integrate everything into a coherent life story.",
  },

  "sect": {
    sections: [
      {
        type: "text",
        title: "The Ancient Division of Day and Night",
        body: "Sect (from the Latin secta, meaning faction or party) is one of the most important concepts in Hellenistic astrology, and one that was nearly lost for centuries before its modern revival. The idea is elegantly simple: planets behave differently depending on whether you were born during the day or at night. A day chart has the Sun above the horizon (above the Ascendant-Descendant axis). A night chart has the Sun below the horizon. This single determination — day or night — reshuffles the hierarchy of every planet in the chart. Chris Brennan, in Hellenistic Astrology: The Study of Fate and Fortune, calls sect 'one of the most important and useful concepts that has been recovered from the Hellenistic tradition' because it immediately explains why two people with the same planet in the same sign can have radically different experiences.",
      },
      {
        type: "text",
        title: "The Two Teams",
        body: "The planets divide into two teams. The diurnal (day) sect is led by the Sun and includes Jupiter and Saturn. The nocturnal (night) sect is led by the Moon and includes Venus and Mars. Mercury is a wild card — it joins the sect of whatever planet it is most closely configured with, or is sometimes assigned based on whether it rises before or after the Sun. In a day chart, the Sun's team (Sun, Jupiter, Saturn) operates with greater ease, clarity, and constructive expression. In a night chart, the Moon's team (Moon, Venus, Mars) takes the lead. This does not mean the other team's planets are inactive — they still function, but they work with less support, like employees in a department that is not the current administration's priority.",
      },
      {
        type: "text",
        title: "Benefics and Malefics In and Out of Sect",
        body: "The most practical application of sect involves the benefics (Jupiter and Venus) and malefics (Saturn and Mars). Jupiter is the benefic of the day sect. When Jupiter is in a day chart, it operates at peak beneficence — opportunities flow, growth comes more easily, and protection is more reliable. Venus is the benefic of the night sect. In a night chart, Venus bestows its gifts of pleasure, connection, beauty, and harmony most generously. The malefics are even more dramatically affected. Saturn, though a day sect planet, is the more manageable malefic in a day chart — its discipline and restriction serve constructive purposes. Mars, a night sect planet, is more manageable in a night chart — its drive and aggression are better channeled. The malefic contrary to sect — Mars in a day chart or Saturn in a night chart — is the most difficult planet in the chart and often corresponds to the area of greatest struggle.",
      },
      {
        type: "comparison-table",
        headers: ["Factor", "Day Chart (Sun above horizon)", "Night Chart (Sun below horizon)"],
        rows: [
          ["Sect Light", "Sun — the guiding luminary", "Moon — the guiding luminary"],
          ["Benefic in Sect", "Jupiter — peak beneficence, greatest ease", "Venus — peak beneficence, greatest ease"],
          ["Benefic out of Sect", "Venus — still helpful, but less potent", "Jupiter — still helpful, but less potent"],
          ["Malefic in Sect", "Saturn — discipline serves constructive ends", "Mars — drive and assertion channeled productively"],
          ["Malefic out of Sect (MOST DIFFICULT)", "Mars — aggression poorly channeled, accidents, conflict", "Saturn — restriction feels crushing, isolation, chronic delays"],
          ["Mercury", "Joins whichever team it is configured with", "Joins whichever team it is configured with"],
        ],
      },
      { type: "callout", style: "warning", body: "The malefic contrary to sect is consistently the most problematic planet in a chart. If you were born at night and Saturn is your out-of-sect malefic, Saturn transits and Saturn-ruled houses will tend to be your areas of greatest difficulty. Identifying this planet immediately focuses your interpretation." },
      { type: "callout", style: "tip", body: "Further Reading: Hellenistic Astrology: The Study of Fate and Fortune by Chris Brennan — Chapter 11 covers sect in comprehensive detail with historical sources. Also: Ancient Astrology in Theory and Practice, Vol. I by Demetra George — provides extensive treatment of sect with chart examples." },
    ],
    minutes: 20,
    takeaway: "Sect divides charts into day (Sun above horizon) and night (Sun below). Each team has a benefic and malefic that perform better in their own sect. The malefic contrary to sect is typically the most challenging planet in the chart.",
  },

  "essential-dignities-deep": {
    sections: [
      {
        type: "text",
        title: "The Five-Fold Dignity System",
        body: "Modern astrologers often speak of only two dignities — domicile and exaltation — and their inverses, detriment and fall. But the original Hellenistic and medieval system recognized five levels of essential dignity, each granting a planet a different degree and type of authority. Understanding the full system transforms chart interpretation from a binary 'strong or weak' assessment into a nuanced picture of exactly how and how much power a planet possesses. Ptolemy codified these in the Tetrabiblos (2nd century CE), and Demetra George recovered their practical application in Ancient Astrology in Theory and Practice. A planet with multiple dignities is like an official with several titles and jurisdictions — it has layered authority. A planet with no dignity at all is called peregrine (literally 'wandering stranger') and must rely entirely on other planets for support.",
      },
      {
        type: "text",
        title: "Domicile and Exaltation",
        body: "Domicile (also called rulership or house) is the strongest dignity. A planet in its own domicile is the lord of that sign — it sets the agenda, controls the resources, and operates with full autonomy. The Sun rules Leo; the Moon rules Cancer; Mercury rules Gemini and Virgo; Venus rules Taurus and Libra; Mars rules Aries and Scorpio; Jupiter rules Sagittarius and Pisces; Saturn rules Capricorn and Aquarius. Exaltation is the second strongest dignity. Here the planet is honored and elevated, like a distinguished guest given a place of honor. The exaltations have ancient roots: Sun in Aries, Moon in Taurus, Mercury in Virgo, Venus in Pisces, Mars in Capricorn, Jupiter in Cancer, Saturn in Libra. A planet in exaltation is highly effective but does not own the sign — it performs brilliantly but is not ultimately in charge.",
      },
      {
        type: "text",
        title: "Triplicity, Terms, and Face",
        body: "Triplicity rulership assigns three rulers to each element — one for day charts, one for night charts, and one participating ruler. For Fire signs, the day ruler is the Sun, the night ruler is Jupiter, and the participating ruler is Saturn (by one common scheme). A planet as triplicity ruler of a sign it occupies has moderate dignity — like a regional manager, not the CEO. Terms (also called bounds) divide each sign into five unequal segments, each ruled by a different planet. The Egyptian terms were the most widely used. A planet in its own terms has a modest but real dignity — like holding a local office. Face (or decan) divides each sign into three 10-degree segments following the Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, repeating. Face is the weakest essential dignity — William Lilly compared it to a person who can barely maintain their position, 'as a man on the point of being turned out of doors.'",
      },
      {
        type: "comparison-table",
        headers: ["Dignity Level", "Lilly's Point Value", "Analogy", "Strength"],
        rows: [
          ["Domicile (Rulership)", "+5", "A king in his own kingdom — full authority", "Strongest"],
          ["Exaltation", "+4", "An honored guest given a place of distinction", "Very strong"],
          ["Triplicity", "+3", "A regional manager — respected, with real but limited power", "Moderate"],
          ["Terms (Bounds)", "+2", "A local official — modest authority in a small jurisdiction", "Mild"],
          ["Face (Decan)", "+1", "A person barely maintaining their station", "Weakest"],
          ["Peregrine (no dignity)", "0", "A wandering stranger with no resources or standing", "None"],
          ["Detriment", "-5", "A person in hostile territory, working against the grain", "Debility"],
          ["Fall", "-4", "A person stripped of their honors and influence", "Debility"],
        ],
      },
      { type: "callout", style: "insight", body: "When you calculate a planet's total essential dignity score, a planet might be in its detriment (-5) but also in its own terms (+2) and face (+1), netting -2 rather than -5. The layered system reveals that dignity is not all-or-nothing. Even a debilitated planet may hold some minor authority." },
      { type: "callout", style: "tip", body: "Further Reading: Tetrabiblos by Ptolemy (2nd century) — the origin of the dignity system. Ancient Astrology in Theory and Practice, Vol. II by Demetra George — the most thorough modern recovery of dignities with worked examples. Christian Astrology by William Lilly (1647) — the essential dignity scoring table that most traditional astrologers still use." },
    ],
    minutes: 25,
    takeaway: "The five essential dignities — Domicile, Exaltation, Triplicity, Terms, and Face — form a layered system of planetary strength. A planet's total dignity score reveals not just whether it is strong or weak, but exactly how much and what kind of authority it possesses.",
  },

  "house-systems-compared": {
    sections: [
      {
        type: "text",
        title: "Why House Systems Matter",
        body: "The house system you choose determines which house each planet falls in — and since houses represent the concrete domains of life (career, relationships, health, finances), changing house systems can change interpretation significantly. A planet at 28 degrees of a sign might fall in the 9th house in Placidus but the 10th in Whole Sign. This is not a minor technicality; it is the difference between interpreting that planet as acting in the realm of higher education versus the realm of career. Every serious astrologer should understand the major house systems, their mathematical basis, and their interpretive implications. The house system debate is one of the oldest and most consequential in astrology, and there is no single 'correct' answer — but there are informed choices.",
      },
      {
        type: "text",
        title: "Whole Sign Houses: The Original System",
        body: "Whole Sign Houses (WSH) is the oldest house system, used throughout the Hellenistic period and much of the medieval era. The principle is radical in its simplicity: whatever sign the Ascendant falls in becomes the entire 1st house. The next sign is the entire 2nd house. The sign after that is the 3rd house. And so on. Each house is exactly one sign, and each sign is exactly one house. There are no intercepted signs, no unequal house sizes, and no computational ambiguity. Chris Brennan's advocacy of WSH in Hellenistic Astrology and on The Astrology Podcast has been central to its modern revival. Many traditional practitioners now argue that WSH was the primary system for the first thousand years of horoscopic astrology and that quadrant systems were a later development that became dominant partly by historical accident.",
      },
      {
        type: "text",
        title: "Quadrant Systems: Placidus, Koch, and Others",
        body: "Placidus is the most widely used house system in modern Western astrology, largely because Raphael's ephemeris used it and because it was the default in early astrology software. Placidus divides the diurnal and nocturnal arcs of each degree of the ecliptic into three equal time segments. This produces unequal house sizes that vary dramatically at high latitudes — in extreme cases, some signs are entirely intercepted (contained within a house without touching either cusp). Equal House places each cusp exactly 30 degrees from the Ascendant, creating equal houses but potentially separating the MC from the 10th cusp. Koch is similar to Placidus but uses the birth location's time-based divisions differently. Porphyry simply trisects the arcs between the four angles. Regiomontanus, favored by horary astrologers including William Lilly, divides the celestial equator into equal arcs and projects them onto the ecliptic.",
      },
      {
        type: "comparison-table",
        headers: ["House System", "Origin Period", "Method", "Best Use Case", "Key Limitation"],
        rows: [
          ["Whole Sign", "Hellenistic (1st century BCE)", "Each sign = one house from the Ascendant sign", "Natal, general practice, traditional astrology", "MC may not fall in 10th house"],
          ["Placidus", "17th century (popularized)", "Trisects diurnal/nocturnal arcs by time", "Modern natal astrology, default in most software", "Breaks at extreme latitudes; intercepted signs"],
          ["Equal House", "Hellenistic (secondary)", "30° intervals from exact ASC degree", "Simple, consistent, works at all latitudes", "MC may not align with 10th cusp"],
          ["Koch", "20th century", "Birth-place time divisions", "Natal, popular in German-speaking countries", "Fails at extreme latitudes"],
          ["Porphyry", "3rd century CE", "Trisects angles between ASC, MC, DSC, IC", "Quick calculation, historical interest", "Oversimplified trisection"],
          ["Regiomontanus", "15th century", "Equator divided into equal arcs, projected to ecliptic", "Horary astrology (Lilly's preferred system)", "Less used in natal work"],
        ],
      },
      { type: "callout", style: "insight", body: "If you are just beginning, pick one system and learn it deeply before experimenting with others. Most traditional astrologers now use Whole Sign Houses. Most modern psychological astrologers use Placidus. The best approach is to test both against your own chart and life events to see which produces more accurate results." },
      { type: "callout", style: "tip", body: "Further Reading: Hellenistic Astrology by Chris Brennan — Chapter 11 provides the strongest modern case for Whole Sign Houses. Christian Astrology by William Lilly — uses Regiomontanus throughout and remains the standard horary reference. Also: The Houses: Temples of the Sky by Deborah Houlding — a comprehensive history of house systems." },
    ],
    minutes: 20,
    takeaway: "Different house systems can place planets in different houses, changing interpretation significantly. Whole Sign Houses was the original Hellenistic system and is experiencing a major revival. Placidus dominates modern practice. Choose based on your tradition and test against real charts.",
  },

  "hellenistic-lots": {
    sections: [
      {
        type: "text",
        title: "What Are the Lots?",
        body: "The Lots (later called Arabic Parts by medieval translators) are calculated sensitive points in the chart derived from the distance between two planets, projected from the Ascendant. They are not physical bodies — they are mathematical points that synthesize the relationship between three chart factors into a single symbolic location. The Lot of Fortune, the most famous, combines the Ascendant, Sun, and Moon into a point that represents bodily fortune, material circumstances, and physical well-being. Vettius Valens, the 2nd-century astrologer whose Anthology is our largest surviving Hellenistic text, used the Lots extensively and is our primary source for their interpretation. The Lots are not medieval additions to astrology — they are among the oldest technical features of the Hellenistic system.",
      },
      {
        type: "text",
        title: "The Lot of Fortune and the Lot of Spirit",
        body: "The two most important Lots form a pair. The Lot of Fortune (Tyche) is calculated differently for day and night charts: by day, Fortune = Ascendant + Moon - Sun; by night, Fortune = Ascendant + Sun - Moon. This reversal reflects the sect principle — in a day chart, the Sun is the sect light, so the formula measures the Moon's distance from the Sun. At night, the formula inverts. The Lot of Fortune represents bodily health, material fortune, prosperity, and the circumstances that happen to you — what fate delivers. The Lot of Spirit (Daimon) uses the reverse formula: by day, Spirit = Ascendant + Sun - Moon; by night, Spirit = Ascendant + Moon - Sun. Spirit represents the mind, intellect, will, career aptitude, and the actions you choose to take. Fortune is what happens to you; Spirit is what you do about it. Together they describe the full spectrum of fate and free will.",
      },
      {
        type: "text",
        title: "Other Major Lots",
        body: "Valens describes dozens of Lots, each synthesizing a different planetary pair. The Lot of Eros (Ascendant + Venus - Spirit, by day; reversed by night) relates to desire, appetite, and what the native is drawn toward. The Lot of Necessity (Ascendant + Fortune - Mercury, by day; reversed by night) relates to constraint, compulsion, and unavoidable obligations. The Lot of Courage (Ascendant + Fortune - Mars) relates to boldness, daring, and physical bravery. Each Lot takes its meaning from the two planets involved in its formula — Eros involves Venus (desire) and Spirit (will), so it represents what you willfully desire. Necessity involves Fortune (circumstances) and Mercury (mind), so it represents the mental constraints imposed by circumstance. The house the Lot falls in shows the life domain where its theme plays out most strongly.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Lot of Fortune (Tyche)", definition: "Day: ASC + Moon - Sun | Night: ASC + Sun - Moon. Bodily health, material circumstances, what fate delivers" },
          { term: "Lot of Spirit (Daimon)", definition: "Day: ASC + Sun - Moon | Night: ASC + Moon - Sun. Mind, will, career aptitude, chosen actions" },
          { term: "Lot of Eros", definition: "Day: ASC + Venus - Spirit | Night: reversed. Desire, appetite, attraction, what the soul is drawn toward" },
          { term: "Lot of Necessity", definition: "Day: ASC + Fortune - Mercury | Night: reversed. Compulsion, constraint, unavoidable obligations" },
          { term: "Lot of Courage", definition: "ASC + Fortune - Mars. Boldness, daring, physical bravery and initiative" },
          { term: "Lot of Victory", definition: "ASC + Jupiter - Spirit. Success, achievement, triumph through effort" },
          { term: "Lot of Nemesis", definition: "ASC + Saturn - Fortune. Downfall, hidden enemies, karmic debts" },
        ],
      },
      { type: "callout", style: "warning", body: "Always check whether a Lot formula reverses for night charts. Many online calculators fail to reverse the formula by sect, producing incorrect Lot positions for night-born individuals. Verify by hand until you trust your software." },
      { type: "callout", style: "tip", body: "Further Reading: Anthology by Vettius Valens (2nd century, Mark Riley translation available free online) — the primary source for Lots in Hellenistic practice. Hellenistic Astrology by Chris Brennan — Chapter 12 provides a clear modern treatment. Ancient Astrology in Theory and Practice, Vol. II by Demetra George — extensive worked examples with Lots." },
    ],
    minutes: 25,
    takeaway: "The Lots are calculated sensitive points that synthesize relationships between planets and the Ascendant. The Lot of Fortune shows material fate; the Lot of Spirit shows career and will. Their formulas reverse by sect.",
  },

  "zodiacal-releasing": {
    sections: [
      {
        type: "text",
        title: "The Most Powerful Timing Technique You Have Never Heard Of",
        body: "Zodiacal Releasing (ZR) is a time-lord technique from Vettius Valens' Anthology (2nd century CE) that divides your life into chapters and sub-chapters based on the Lots. It was virtually unknown in modern astrology until Chris Brennan and Leisa Schaim revived it in the early 2010s. Since then, it has become one of the most talked-about techniques in the traditional revival because it is strikingly accurate in identifying peak periods, career turning points, and major life transitions. ZR works by assigning each sign a number of years based on the minor period of its planetary ruler, then moving through the signs from whatever Lot you release from. When you release from the Lot of Fortune, the themes are bodily, material, and circumstantial. When you release from the Lot of Spirit, the themes are career, purpose, intellectual, and volitional.",
      },
      {
        type: "text",
        title: "The Four Levels",
        body: "ZR operates on four nested levels of time. Level 1 (L1) periods last from months to years — they define the major chapters of your life. Level 2 (L2) periods subdivide each L1 period into sub-chapters lasting weeks to months. Level 3 (L3) subdivides L2 into days to weeks. Level 4 (L4) subdivides further into hours to days. Most practical work focuses on L1 and L2. An L1 period in a sign ruled by a benefic in your chart, or the sign containing your Lot of Fortune, will tend to be a more fortunate chapter of life. An L1 period in a sign ruled by your out-of-sect malefic will often correspond to the most difficult years. The transitions between L1 periods — when your life chapter changes — often correspond to dramatic external shifts: career changes, relocations, marriages, losses.",
      },
      {
        type: "text",
        title: "Peak Periods and Loosing of the Bond",
        body: "Two special features make ZR remarkably precise. First, peak periods: when the L1 or L2 sign is angular relative to the Lot you are releasing from (the 1st, 4th, 7th, or 10th sign from the Lot), the period is heightened in activity and significance. Career peak periods when releasing from the Lot of Spirit often correspond to the most visible, productive, and publicly recognized phases of a person's professional life. Second, loosing of the bond: when the ZR sequence reaches the end of a sign's allotted years in the middle of a zodiacal run (i.e., the sub-period years run out before the major period ends), the sequence 'loosens' and jumps to the next sign. Valens calls this a critical transition point — the life undergoes an unexpected shift in direction, often experienced as a disruption or redirection that ultimately serves the larger trajectory.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Level 1 (L1)", definition: "Major life chapters lasting months to years, defined by sign sequence from the Lot" },
          { term: "Level 2 (L2)", definition: "Sub-chapters within each L1 period, lasting weeks to months" },
          { term: "Level 3 (L3)", definition: "Micro-periods within L2, lasting days to weeks" },
          { term: "Level 4 (L4)", definition: "The finest subdivision, lasting hours to days — rarely used in practice" },
          { term: "Peak Period", definition: "When the active sign is angular (1st, 4th, 7th, or 10th) from the Lot — heightened activity and visibility" },
          { term: "Loosing of the Bond", definition: "When sub-period years expire mid-sequence, causing a jump to the next sign — marks unexpected life redirections" },
          { term: "Fortune Releasing", definition: "Releasing from the Lot of Fortune — themes of body, material fortune, circumstances" },
          { term: "Spirit Releasing", definition: "Releasing from the Lot of Spirit — themes of career, purpose, will, and intellectual direction" },
        ],
      },
      { type: "callout", style: "insight", body: "Test ZR against your own life by releasing from the Lot of Spirit and matching L1 period transitions against major career changes. The correlations are often striking — many astrologers report that the technique 'sold itself' the first time they tested it on their own chart." },
      { type: "callout", style: "tip", body: "Further Reading: Anthology by Vettius Valens (Mark Riley translation) — Book IV contains the original zodiacal releasing material. Hellenistic Astrology by Chris Brennan — Chapter 14 provides the clearest modern explanation. Chris Brennan and Leisa Schaim's podcast episodes on The Astrology Podcast cover ZR with extensive celebrity chart examples." },
    ],
    minutes: 30,
    takeaway: "Zodiacal Releasing divides life into chapters based on the Lots, using four nested time levels. Peak periods mark heightened activity; loosing of the bond marks unexpected redirections. It is the most powerful timing technique recovered from the Hellenistic tradition.",
  },

  "horary-astrology": {
    sections: [
      {
        type: "text",
        title: "The Astrology of the Question",
        body: "Horary astrology is the art of answering specific questions by casting a chart for the moment the question is clearly understood by the astrologer. Unlike natal astrology, which interprets a lifelong chart, horary focuses on a single, concrete question: Will I get the job? Where is the lost item? Will this relationship work? The chart cast for that moment — the horary chart — contains the answer. William Lilly, the 17th-century English astrologer whose Christian Astrology remains the definitive horary textbook, demonstrated this method with hundreds of documented cases. Horary is the most testable branch of astrology because it produces specific, verifiable predictions. It does not deal in personality description or vague tendencies — it answers yes or no, describes outcomes, and locates lost objects. This concreteness makes it both the most challenging and the most convincing branch of the art.",
      },
      {
        type: "text",
        title: "Significators and the Houses of the Question",
        body: "In horary, the querent (the person asking the question) is always represented by the 1st house, its ruler, and the Moon. The quesited (the thing asked about) is derived from the house that naturally rules that topic. A question about marriage looks to the 7th house and its ruler. A question about career looks to the 10th. A question about a lost pet looks to the 6th. The ruler of the querent's house (the 1st) and the ruler of the quesited's house become the two significators. The question is answered by examining the relationship between these significators: Are they applying to an aspect? If so, the matter will come to completion. Is there a mutual reception between them? That indicates willingness on both sides. Is a third planet translating or collecting light between them? That suggests a mediator or go-between will help the matter conclude.",
      },
      {
        type: "text",
        title: "Strictures Against Judgment and Practical Limits",
        body: "Lilly and the horary tradition identify several strictures against judgment — conditions in the horary chart that warn the astrologer to proceed with caution or withhold judgment entirely. The most important strictures: early Ascendant (the first 3 degrees rising suggest the situation is too new to judge), late Ascendant (the last 3 degrees rising suggest the matter is already decided or the question comes too late), Saturn in the 7th house (warns the astrologer may err), and the Moon void of course (the Moon making no more applying aspects before leaving its sign — traditionally indicates 'nothing will come of the matter'). These strictures are not absolute prohibitions but serious cautions. Lilly himself occasionally judged charts with strictures present, but he noted the increased difficulty. Modern horary practitioners debate which strictures to retain, but the core principle remains: some questions are not fit to be answered, and the chart itself will tell you so.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Querent", definition: "The person asking the question — always represented by the 1st house and its ruler" },
          { term: "Quesited", definition: "The thing asked about — represented by the relevant house and its ruler" },
          { term: "Significator", definition: "The planet ruling the house of the querent or quesited — the main actors in the drama" },
          { term: "Applying aspect", definition: "An aspect the significator is moving toward — indicates the matter will develop" },
          { term: "Separating aspect", definition: "An aspect recently completed — indicates events that have already occurred" },
          { term: "Reception", definition: "When two planets are in each other's dignities — indicates willingness, hospitality, or agreement" },
          { term: "Translation of light", definition: "A faster planet separating from one significator and applying to another — a mediator brings the matter together" },
          { term: "Collection of light", definition: "A slower planet receiving aspects from both significators — a third party resolves the question" },
          { term: "Void of course Moon", definition: "The Moon makes no applying aspects before leaving its sign — traditionally, nothing will come of the matter" },
          { term: "Strictures against judgment", definition: "Chart conditions warning the astrologer to exercise caution or refuse to judge" },
        ],
      },
      { type: "callout", style: "warning", body: "Horary requires strict intellectual discipline. The temptation to ask the same question repeatedly until you get the answer you want will destroy your practice. Ask once. Accept the answer. If you are too emotionally invested in the outcome, you should not judge the chart — have another astrologer read it." },
      { type: "callout", style: "tip", body: "Further Reading: Christian Astrology by William Lilly (1647, available in modern reprints from Astrology Classics) — the foundational horary textbook, still unsurpassed. The Horary Textbook by John Frawley — a rigorous modern introduction grounded in Lilly's methods. Also: Simplifying Horary Astrology by Ivy Goldstein-Jacobson — a practical beginner-friendly approach." },
    ],
    minutes: 25,
    takeaway: "Horary astrology answers specific questions by casting a chart for the moment of the question. The querent is the 1st house; the quesited is the relevant derived house. Significators, receptions, and applying aspects determine the answer.",
  },

  "electional-astrology": {
    sections: [
      {
        type: "text",
        title: "Choosing Your Moment",
        body: "Electional astrology is the art of selecting the most auspicious time to begin an important undertaking — a business launch, a wedding, surgery, a legal filing, or any event where timing is within your control. It is the inverse of horary: instead of asking 'what will happen?', you ask 'when should I act to get the best outcome?' The principle is ancient and practical: if the birth chart of a person describes their life, then the 'birth chart' of a venture describes the venture's life. A business incorporated under a favorable election has a better-configured chart than one launched at a random moment. Demetra George, in Ancient Astrology in Theory and Practice, traces electional technique back to the Hellenistic period, where it was called katarchic astrology — the astrology of beginnings. Vettius Valens, Abu Ma'shar, and other classical authorities wrote extensively on choosing auspicious times.",
      },
      {
        type: "text",
        title: "Core Principles of Election",
        body: "The fundamental rules of electional astrology: First, identify the house that governs the matter. A wedding election strengthens the 7th house (partnerships). A business launch strengthens the 10th house (public standing) and the 2nd house (finances). Second, dignify the ruler of that house — place it in a sign where it has essential dignity, in a favorable house, and well-aspected. Third, strengthen the Ascendant and its ruler — the Ascendant represents the venture itself. Fourth, place benefics (Jupiter and Venus) in angular houses (1st, 4th, 7th, 10th) where they have maximum power to do good. Fifth, keep malefics (Mars and Saturn) out of angular houses and away from the Ascendant and its ruler. Sixth, ensure the Moon is applying to a benefic, not a malefic — the Moon carries events forward, and its next aspect describes the immediate trajectory of the venture.",
      },
      {
        type: "text",
        title: "Working With Imperfect Elections",
        body: "In practice, a perfect election is rare. You cannot always get Jupiter in the 1st house, Venus on the MC, and the Moon applying to a trine of the ruler of the relevant house while all malefics hide in cadent houses. Real elections are about trade-offs: which factors matter most for this particular venture, and how do you prioritize? The Moon's condition is usually the first priority — a Moon applying to Saturn or Mars by square or opposition will undermine even an otherwise excellent election. The Ascendant ruler's strength is second. The condition of the house ruling the specific matter is third. Benefics angular is a bonus but not always achievable. One critical practical point: the election must also work with the client's natal chart. An elected chart that is beautiful in isolation but forms a Grand Cross with the client's natal planets will not produce good results. Always check electional charts against the natal chart.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Election", definition: "A chart chosen in advance for the most favorable moment to begin a venture" },
          { term: "Katarchic astrology", definition: "The Hellenistic term for electional astrology — the astrology of beginnings" },
          { term: "Moon's applying aspect", definition: "The next aspect the Moon will form — describes the venture's immediate trajectory" },
          { term: "Angular benefics", definition: "Jupiter or Venus in the 1st, 4th, 7th, or 10th house — maximum positive influence" },
          { term: "Cadent malefics", definition: "Mars or Saturn in the 3rd, 6th, 9th, or 12th house — minimized negative influence" },
        ],
      },
      { type: "callout", style: "insight", body: "The single most impactful factor in most elections is the Moon. If you can only control one thing, make it the Moon — ensure it is applying to a benefic by a favorable aspect, is not void of course, and is in a sign where it has some dignity. A strong Moon can carry a mediocre election; a weak Moon can sink a good one." },
      { type: "callout", style: "tip", body: "Further Reading: Ancient Astrology in Theory and Practice, Vol. II by Demetra George — includes extensive electional technique. Electional Astrology by Joann Hampar — a practical modern guide. Also: The Astrology of the Macrocosm, edited by Joan McEvers — contains useful chapters on electional principles." },
    ],
    minutes: 20,
    takeaway: "Electional astrology selects the best moment to begin important ventures by strengthening the relevant house, dignifying its ruler, placing benefics in angular houses, and ensuring the Moon applies to favorable aspects.",
  },

  "mundane-astrology": {
    sections: [
      {
        type: "text",
        title: "Astrology of Nations and World Events",
        body: "Mundane astrology (from the Latin mundus, meaning 'world') is the oldest branch of astrology, predating natal chart interpretation by centuries. In ancient Mesopotamia, astrology was exclusively mundane — the priests of Babylon watched the sky to predict the fates of kingdoms, harvests, wars, and plagues. Individual horoscopes came later. Mundane astrology reads the charts of nations, inaugurations, eclipses, and planetary ingresses to understand collective trends and geopolitical shifts. Its tools include the charts of national founding (the US Sibley chart set for July 4, 1776), the charts of political leaders, ingress charts cast for the moment the Sun enters cardinal signs, eclipse charts, and the cycles formed by the conjunctions of Jupiter and Saturn. Nicholas Campion's The Book of World Horoscopes remains the standard reference, collecting hundreds of national charts with their historical contexts.",
      },
      {
        type: "text",
        title: "Great Conjunctions: The Clock of History",
        body: "The conjunction of Jupiter and Saturn, which occurs approximately every 20 years, has been considered the primary mundane timing mechanism since the medieval Arabic astrologers. These Great Conjunctions cycle through the elements: they spend roughly 200 years in Earth signs, then shift to Air, then Water, then Fire. Each 200-year element shift correlates with major civilizational transformations. The Great Conjunction of December 2020 at 0 degrees Aquarius marked the shift from a 200-year Earth era (which began in 1802 and coincided with industrialization, material production, and institutional capitalism) to a 200-year Air era (associated with information, networks, decentralization, and communication technology). This shift provides the broadest possible context for understanding early-21st-century upheavals — the rise of remote work, digital currencies, social media's restructuring of power, and the decline of centralized industrial-age institutions.",
      },
      {
        type: "text",
        title: "Ingress Charts and Eclipse Cycles",
        body: "Ingress charts — cast for the exact moment the Sun enters a cardinal sign (Aries, Cancer, Libra, Capricorn) — provide quarterly mundane forecasts. The Aries ingress chart, cast for the Sun's entry into Aries at the vernal equinox, is considered the most important and is read as a chart for the coming year for any given nation (cast for the capital city). Fixed signs on the angles of an ingress chart suggest stability; cardinal signs suggest change; mutable signs suggest uncertainty and transition. Eclipses are the most dramatic mundane indicators. A solar eclipse activating a sensitive degree in a nation's chart often precedes major political or social upheaval within the following six months. Eclipse charts are read for the capital city, and the house placement of the eclipse indicates the area of national life most affected — an eclipse in the 10th house affects leadership and government; in the 2nd, the economy.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Great Conjunction", definition: "Jupiter-Saturn conjunction every ~20 years — the primary cycle of mundane astrology" },
          { term: "Element shift", definition: "Every ~200 years, Great Conjunctions move to a new element — marks civilizational transformation" },
          { term: "Ingress chart", definition: "Chart cast for the Sun entering a cardinal sign — provides seasonal or annual forecasts for nations" },
          { term: "Eclipse chart", definition: "Chart cast for a solar or lunar eclipse at a nation's capital — marks periods of upheaval or change" },
          { term: "National chart", definition: "The horoscope of a nation's founding moment (e.g., the US Sibley chart for July 4, 1776)" },
        ],
      },
      { type: "callout", style: "insight", body: "The 2020 Jupiter-Saturn conjunction in Aquarius was the first Great Conjunction in an Air sign since 1405. The last Air era coincided with the Renaissance, the printing press, and the explosion of intellectual exchange across Europe. We are now in the early decades of an analogous transformation." },
      { type: "callout", style: "tip", body: "Further Reading: The Book of World Horoscopes by Nicholas Campion — the definitive reference on national charts and mundane technique. Mundane Astrology by Baigent, Campion, and Harvey — comprehensive treatment of all major techniques. Also: On the Great Conjunctions by Abu Ma'shar (9th century) — the foundational Arabic text on Jupiter-Saturn cycles." },
    ],
    minutes: 25,
    takeaway: "Mundane astrology interprets the charts of nations, eclipses, ingresses, and great conjunctions to understand collective trends. The 2020 Jupiter-Saturn conjunction in Aquarius opened a 200-year Air era of information, networks, and decentralization.",
  },

  "medical-astrology": {
    sections: [
      {
        type: "text",
        title: "The Zodiac and the Body",
        body: "Medical astrology — iatromathematics in the Greek tradition — maps the zodiac signs onto the human body from head to feet: Aries rules the head and face; Taurus the throat and neck; Gemini the arms, lungs, and hands; Cancer the chest and stomach; Leo the heart and upper back; Virgo the intestines and digestive system; Libra the kidneys and lower back; Scorpio the reproductive organs; Sagittarius the hips and thighs; Capricorn the knees, bones, and joints; Aquarius the ankles and circulatory system; Pisces the feet and lymphatic system. This is not merely symbolic — it was the basis of medical practice for centuries. Hippocrates reportedly said, 'A physician without a knowledge of astrology has no right to call himself a physician.' Whether or not the attribution is authentic, it reflects the deep integration of astrology and medicine in the ancient world.",
      },
      {
        type: "text",
        title: "Culpeper and the Herbal Tradition",
        body: "Nicholas Culpeper (1616-1654) was an English herbalist and astrologer who assigned planetary rulerships to herbs, diseases, and body parts, creating a system where the cure was found through astrological sympathy or antipathy. A disease caused by Mars (inflammation, fever, acute infection) might be treated with a cooling Venus-ruled herb, applying the principle of antipathy — opposing the cause with its contrary. Alternatively, a Mars-ruled herb might be used by the principle of sympathy — giving the planet what it wants so it stops causing trouble. Culpeper's Complete Herbal remains in print nearly four centuries later, and its astrological framework, while no longer the basis of medical practice, offers a fascinating model of how pre-modern practitioners understood the body as a microcosm reflecting the macrocosm of the planetary spheres.",
      },
      {
        type: "text",
        title: "Decumbiture: The Chart of Illness",
        body: "A decumbiture chart is cast for the moment a person falls ill or takes to their bed with an illness. In the medieval tradition, the decumbiture chart was used to diagnose the nature of the illness, predict its course, and determine the best timing for treatment. The Ascendant and its ruler represent the patient. The 6th house represents the illness. The 10th house represents the physician and treatment. Critical days in the illness were predicted by tracking the Moon's transits through the chart — when the Moon reached a square or opposition to its decumbiture position, a crisis or turning point was expected. While no responsible modern practitioner would use astrology as a diagnostic replacement for medicine, the decumbiture tradition offers insight into how astrological timing can be applied to health-related decisions within a broader framework of medical care.",
      },
      {
        type: "comparison-table",
        headers: ["Sign", "Body Region", "Planetary Ruler", "Associated Vulnerabilities"],
        rows: [
          ["Aries", "Head, face, brain", "Mars", "Headaches, fevers, head injuries"],
          ["Taurus", "Throat, neck, thyroid", "Venus", "Sore throats, thyroid issues, neck tension"],
          ["Gemini", "Arms, lungs, hands, nervous system", "Mercury", "Respiratory issues, nervous tension, arm injuries"],
          ["Cancer", "Chest, stomach, breasts", "Moon", "Digestive sensitivity, chest complaints"],
          ["Leo", "Heart, upper back, spine", "Sun", "Heart conditions, back problems"],
          ["Virgo", "Intestines, digestive system", "Mercury", "Digestive disorders, anxiety-related illness"],
          ["Libra", "Kidneys, lower back, adrenals", "Venus", "Kidney problems, lower back pain"],
          ["Scorpio", "Reproductive organs, elimination", "Mars/Pluto", "Reproductive issues, infections"],
          ["Sagittarius", "Hips, thighs, liver", "Jupiter", "Hip problems, liver complaints, sciatica"],
          ["Capricorn", "Knees, bones, joints, skin", "Saturn", "Joint issues, bone problems, skin conditions"],
          ["Aquarius", "Ankles, circulatory system, shins", "Saturn/Uranus", "Circulation problems, ankle injuries, varicose veins"],
          ["Pisces", "Feet, lymphatic system, immune system", "Jupiter/Neptune", "Foot problems, immune sensitivity, fluid retention"],
        ],
      },
      { type: "callout", style: "warning", body: "IMPORTANT DISCLAIMER: Medical astrology is a historical and educational tradition, not a substitute for professional medical diagnosis or treatment. Never use astrological indications to diagnose, treat, or delay treatment of any medical condition. Always consult qualified healthcare professionals for medical concerns." },
      { type: "callout", style: "tip", body: "Further Reading: Culpeper's Complete Herbal by Nicholas Culpeper — the classic astrological-herbal reference, still in print. Ancient Astrology in Theory and Practice, Vol. II by Demetra George — covers medical astrology in the Hellenistic context. Also: The Astrological Study of Medicine by Wanda Sellar — a modern overview of the tradition." },
    ],
    minutes: 20,
    takeaway: "Medical astrology maps zodiac signs to body parts and connects planetary influences to health patterns. Culpeper's herbal tradition paired astrological diagnosis with botanical treatment. This is a historical framework for understanding health themes — never a replacement for modern medicine.",
  },

  "vocational-astrology": {
    sections: [
      {
        type: "text",
        title: "Finding Your Calling in the Chart",
        body: "Vocational astrology uses the birth chart to identify career aptitudes, professional strengths, and the kind of work that aligns with someone's deepest nature. This is not Sun-sign career advice ('Virgos make good accountants'). It is a systematic analysis of the chart's vocational indicators — the Midheaven, the 10th house, the 6th house, the 2nd house, and the planets that connect them. Noel Tyl, in his influential Vocational Guidance Through Astrology series, developed a comprehensive method that examines the MC ruler, the Sun, the Moon, Saturn, and their midpoints to construct a vocational profile. The Hellenistic tradition offered its own approach, using the Lot of Spirit and its ruler to identify career direction. What both methods share is the conviction that the chart reveals not just what you can do, but what you are meant to do — the vocation that aligns your talents with your purpose.",
      },
      {
        type: "text",
        title: "The 10th, 6th, and 2nd House System",
        body: "Three houses form the vocational axis. The 10th house represents your public role, career calling, reputation, and highest professional aspirations — what you are known for. The 6th house represents daily work, routine tasks, service, and craft — what you actually do day-to-day. The 2nd house represents how you earn money, what you value, and your relationship with material resources. These three houses often tell different stories. Someone with Neptune on the MC may have a 10th house calling toward creative, spiritual, or healing work, but Saturn ruling the 6th may indicate that their daily work involves discipline, structure, and administration. The chart shows both the dream and the daily reality — and vocational astrology's job is to bridge them. Planets in these houses, the signs on their cusps, and the conditions of their rulers all contribute to the vocational picture.",
      },
      {
        type: "text",
        title: "Noel Tyl's Vocational Method",
        body: "Tyl's method begins with the Midheaven sign and its ruler. The MC ruler's sign, house, and aspects describe the vocational drive and the style of career expression. Next, Tyl examines the Sun (creative will), Moon (emotional needs and public appeal), and Saturn (discipline, structure, and the father's influence on career expectations). The midpoint picture Sun/Moon = MC or Sun/Moon = Saturn often reveals the core vocational motivation. Tyl also emphasized the importance of the final dispositor — the planet that ultimately 'rules' all others through a chain of dispositorship — as indicating the deepest motivational driver. Beyond technique, Tyl insisted that vocational astrology must serve the client's real-world needs. The astrologer is not a fortune-teller predicting career outcomes but a counselor helping the client recognize their own strengths, name their aspirations, and develop a realistic strategy for professional fulfillment.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Midheaven (MC)", definition: "The cusp of the 10th house — represents career calling, public reputation, and highest aspirations" },
          { term: "MC Ruler", definition: "The planet ruling the MC sign — its condition describes how the career drive manifests" },
          { term: "10th House", definition: "Career, vocation, public role, legacy — what you are known for in the world" },
          { term: "6th House", definition: "Daily work, service, routine, health in the workplace — what you do day-to-day" },
          { term: "2nd House", definition: "Income, earning style, values, material resources — how you make money" },
          { term: "Final Dispositor", definition: "The planet at the end of the dispositorship chain — the deepest motivational driver" },
          { term: "Sun/Moon Midpoint", definition: "The midpoint of Sun and Moon — its contacts reveal core identity integration and motivation" },
          { term: "Lot of Spirit", definition: "Hellenistic indicator of career and purpose — its ruler and house reveal professional direction" },
        ],
      },
      { type: "callout", style: "insight", body: "When the 10th house ruler and the 6th house ruler are in conflict (hard aspect, incompatible signs), the person often feels a gap between their calling and their daily work. Vocational astrology can name this gap and help the client strategize a path from where they are to where they want to be." },
      { type: "callout", style: "tip", body: "Further Reading: Vocational Guidance Through Astrology by Noel Tyl — the most comprehensive modern treatment of career astrology. Synthesis and Counseling in Astrology by Noel Tyl — integrates vocational analysis into therapeutic practice. Also: Ancient Astrology in Theory and Practice by Demetra George — covers the Lot of Spirit approach to career." },
    ],
    minutes: 20,
    takeaway: "Vocational astrology uses the 10th house (calling), 6th house (daily work), and 2nd house (income) along with the MC ruler, Sun, Moon, and Saturn to construct a career profile. Noel Tyl's method adds midpoint analysis for deeper vocational insight.",
  },

  "chart-rectification": {
    sections: [
      {
        type: "text",
        title: "When the Birth Time Is Uncertain",
        body: "An accurate birth time is essential for precise astrology because the Ascendant and house cusps shift approximately one degree every four minutes. A birth time off by even 15 minutes can change the Ascendant sign, alter house placements, and shift the Midheaven — potentially changing the entire interpretive framework. Many people do not know their exact birth time. Birth certificates may round to the nearest hour, hospitals may record the time inaccurately, or the time may simply be unknown. Chart rectification is the process of working backward from known life events to determine the most likely birth time. It is one of the most demanding skills in astrology, requiring both technical precision and interpretive experience. Noel Tyl considered rectification a core competency for any serious astrologer and devoted significant attention to it in his master's degree program in astrology.",
      },
      {
        type: "text",
        title: "The Rectification Method",
        body: "The basic approach to rectification: Start with whatever birth time information you have — even a broad range like 'morning' or 'after dinner' narrows the Ascendant possibilities. List the person's most significant life events with precise dates: marriages, divorces, births of children, major career changes, relocations, deaths of parents, serious illnesses, and major achievements. For each possible Ascendant, test whether Saturn's transits to the angles (Ascendant, MC, Descendant, IC) correspond to the timing of these major events. Saturn crossing an angle typically correlates with structural life changes within that angle's domain — Saturn crossing the MC often coincides with major career shifts. Test secondary progressions, particularly the progressed Moon's passage through houses (each house takes roughly two and a half years). Test solar arc directions to the angles. The Ascendant that produces the most consistent correlations across multiple techniques is most likely correct.",
      },
      {
        type: "text",
        title: "Why Rectification Matters and Its Limits",
        body: "Without an accurate birth time, all house-based interpretation becomes unreliable. The Ascendant defines the chart ruler, shapes every house cusp, and determines which planets are angular versus cadent. The MC defines career direction and public role. Even transits and progressions lose precision without accurate angles. However, rectification has limits. It is a probabilistic exercise, not an exact science. Two different astrologers may arrive at slightly different rectified times, and confirmation bias is a constant risk — you tend to find what you are looking for. The best practice is to use multiple independent techniques (transits, progressions, solar arcs, primary directions) and accept the time that satisfies the greatest number of tests. Tyl recommended testing at least five major life events against each candidate time. The more events that align, the higher the confidence in the rectification.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Rectification", definition: "Adjusting an uncertain birth time by testing life events against possible Ascendants and angles" },
          { term: "Angular transit", definition: "A planet crossing one of the four angles (ASC, MC, DSC, IC) — major life shift markers" },
          { term: "Saturn to angles", definition: "Saturn crossing an angle correlates with structural changes in that angle's domain" },
          { term: "Progressed Moon", definition: "Secondary progression of the Moon through houses — each house takes ~2.5 years" },
          { term: "Solar arc directions", definition: "Each planet advanced by the Sun's daily arc rate (~1° per year) — tested against angles" },
          { term: "Primary directions", definition: "The oldest predictive technique, measuring the rotation of the sky — historically used for rectification" },
          { term: "4-minute rule", definition: "House cusps shift ~1° every 4 minutes of birth time — small errors create large interpretive shifts" },
        ],
      },
      { type: "callout", style: "warning", body: "Rectification is not a beginner technique. It requires solid competence in transits, progressions, solar arcs, and ideally primary directions. Attempting rectification without strong foundational skills will produce unreliable results and false confidence." },
      { type: "callout", style: "tip", body: "Further Reading: Solar Arcs by Noel Tyl — includes extensive rectification methodology integrated with solar arc technique. Synthesis and Counseling in Astrology by Noel Tyl — devotes substantial attention to rectification in a counseling context. Also: Primary Directions by Martin Gansten — for advanced practitioners seeking to use the oldest directional technique." },
    ],
    minutes: 20,
    takeaway: "Chart rectification uses known life events to determine an uncertain birth time by testing possible Ascendants against transits, progressions, and solar arcs to the angles. Birth time accuracy matters because house cusps shift one degree every four minutes.",
  },

  // ═══════════════════════════════════════
  // ASPECTS AND CHART PATTERNS
  // ═══════════════════════════════════════

  "what-are-aspects": {
    sections: [
      {
        type: "text",
        title: "The Geometry of Relationship",
        body: "Aspects are angular relationships between planets in the birth chart. When two planets are a specific number of degrees apart, they form an aspect — a geometric connection that creates interaction between those planets' energies. Aspects are the verbs of the chart. Planets are the nouns (what), signs are the adjectives (how), houses are the adverbs (where), and aspects describe the dynamic relationship between planetary actors. Ptolemy, in the Tetrabiblos, codified the five major aspects that remain central to practice today. These five aspects are not arbitrary — they are derived from dividing the 360-degree circle by the whole numbers 1, 2, 3, 4, and 6. Division by 5 (the quintile at 72 degrees) was excluded from the Ptolemaic set, though it appears in later traditions. Understanding why these specific angles were chosen reveals the mathematical elegance underlying astrological tradition.",
      },
      {
        type: "text",
        title: "The Five Ptolemaic Aspects",
        body: "The conjunction (0 degrees) occurs when planets occupy the same degree of the zodiac — their energies merge completely, for better or worse. The nature of a conjunction depends entirely on the planets involved: Venus conjunct Jupiter is one of the most fortunate configurations possible; Mars conjunct Saturn is one of the most challenging. The sextile (60 degrees) is a harmonious aspect of opportunity — it connects signs of compatible elements (Fire with Air, Earth with Water) and offers support that must be actively used. The square (90 degrees) is a tense aspect of friction and drive — it connects signs that share a modality but clash in element, creating pressure that demands action. The trine (120 degrees) is the most harmonious aspect, connecting signs of the same element in a flow of natural ease. The opposition (180 degrees) creates awareness through polarity — it connects opposite signs and requires integration of competing demands.",
      },
      {
        type: "text",
        title: "Hard Aspects, Soft Aspects, and Growth",
        body: "Aspects are traditionally divided into hard (conjunction, square, opposition) and soft (sextile, trine). Hard aspects create tension, challenge, and drive. Soft aspects create ease, flow, and natural talent. But this division is oversimplified. Hard aspects are the engine of growth — they create the friction that forces development. Many of the most accomplished people have charts dominated by squares and oppositions because these aspects demand constant effort, producing capability through struggle. Soft aspects are gifts, but gifts that can be taken for granted. A Grand Trine (three planets in mutual trine) represents enormous natural talent in the element involved, but without hard aspects to activate it, that talent may remain latent — comfortable but undeveloped. The ideal chart contains both: hard aspects to drive development and soft aspects to provide resources and recovery.",
      },
      {
        type: "comparison-table",
        headers: ["Aspect", "Degrees", "Circle Division", "Quality", "Keyword"],
        rows: [
          ["Conjunction", "0°", "÷ 1", "Fusion — varies by planets involved", "Merger"],
          ["Sextile", "60°", "÷ 6", "Harmonious — compatible elements, active opportunity", "Opportunity"],
          ["Square", "90°", "÷ 4", "Tense — shared modality, clashing elements, friction", "Challenge"],
          ["Trine", "120°", "÷ 3", "Harmonious — same element, natural flow and ease", "Flow"],
          ["Opposition", "180°", "÷ 2", "Polarizing — opposite signs, awareness through tension", "Awareness"],
        ],
      },
      { type: "callout", style: "insight", body: "Do not fear squares and oppositions in a chart. These are the aspects that build character, develop skill, and drive achievement. A chart with only trines and sextiles is comfortable but rarely produces growth. The squares are where the interesting work happens." },
      { type: "callout", style: "tip", body: "Further Reading: Tetrabiblos by Ptolemy (2nd century CE) — the original codification of the five major aspects. Horoscope Symbols by Robert Hand — deeply philosophical exploration of what aspects mean. Also: Aspects in Astrology by Sue Tompkins — the most thorough modern reference on aspect interpretation." },
    ],
    minutes: 18,
    takeaway: "Aspects are geometric relationships between planets that create interaction. The five Ptolemaic aspects — conjunction, sextile, square, trine, opposition — come from dividing the circle by whole numbers. Hard aspects drive growth; soft aspects provide ease.",
  },

  "minor-aspects": {
    sections: [
      {
        type: "text",
        title: "Beyond the Ptolemaic Five",
        body: "While the five Ptolemaic aspects form the backbone of chart interpretation, a family of minor aspects adds nuance and subtlety. These aspects were developed primarily by Kepler (who championed the quintile series) and later by Dane Rudhyar, who explored their psychological significance in The Astrology of Personality and later works. Minor aspects should be read with tight orbs — typically 1 to 2 degrees maximum — and they should be treated as secondary influences that refine the picture painted by the major aspects. A chart interpretation should never begin with minor aspects. But once the major aspect structure is understood, minor aspects can reveal hidden tensions, creative gifts, and subtle dynamics that the major aspects miss.",
      },
      {
        type: "text",
        title: "The Quincunx: The Most Important Minor Aspect",
        body: "The quincunx (also called the inconjunct) at 150 degrees is by far the most significant minor aspect. It connects signs that share absolutely nothing in common — different element, different modality, different polarity. Aries (cardinal fire) quincunx Virgo (mutable earth): they have nothing to say to each other. This creates a persistent sense of adjustment, irritation, and incompatibility between the planets involved. The quincunx does not produce the dramatic crisis of a square or the open conflict of an opposition — it produces a nagging, low-grade discomfort that requires constant recalibration. Health issues are frequently associated with quincunx aspects because the body often expresses the adjustment tension that the mind cannot resolve. The Yod pattern (two planets sextile each other, both quincunx a third planet — the 'Finger of God') intensifies this energy to a focal crisis demanding transformation.",
      },
      {
        type: "text",
        title: "The Quintile Series and the Semi-Square Family",
        body: "The quintile (72 degrees) and bi-quintile (144 degrees) divide the circle by five — the number Ptolemy excluded. These aspects are associated with creative talent, unique gifts, and a quality of expression that does not fit conventional categories. A quintile between Mercury and Uranus might indicate a mind that solves problems through entirely original methods. The semi-square (45 degrees) and sesquiquadrate (135 degrees) belong to the eighth-harmonic family (dividing the circle by 8). They are irritant aspects — weaker than squares but persistent, like a pebble in your shoe. They create friction that is too mild to force a crisis but too constant to ignore. The semi-sextile (30 degrees) connects adjacent signs, which share neither element, modality, nor polarity. Like the quincunx, it requires adjustment, but at a milder level — the two signs are neighbors who must coexist despite having very different lifestyles.",
      },
      {
        type: "comparison-table",
        headers: ["Aspect", "Degrees", "Circle Division", "Orb", "Quality"],
        rows: [
          ["Semi-sextile", "30°", "÷ 12", "1-2°", "Mild adjustment between incompatible neighbors"],
          ["Semi-square", "45°", "÷ 8", "1-2°", "Persistent low-grade irritation and friction"],
          ["Quintile", "72°", "÷ 5", "1-2°", "Creative talent, unique gifts, originality"],
          ["Sesquiquadrate", "135°", "÷ 8", "1-2°", "Agitation, restlessness, unresolved tension"],
          ["Bi-quintile", "144°", "÷ 5", "1-2°", "Creative expression at a higher octave"],
          ["Quincunx", "150°", "÷ 12", "2-3°", "Constant adjustment, incompatibility requiring recalibration"],
        ],
      },
      { type: "callout", style: "warning", body: "Do not overweight minor aspects. If your chart interpretation hinges on a semi-sextile, you have missed the forest for the trees. Minor aspects add color to an already established picture — they do not define the picture itself." },
      { type: "callout", style: "tip", body: "Further Reading: The Astrology of Personality by Dane Rudhyar — pioneering work on the psychological meaning of minor aspects. Dynamics of Aspect Analysis by Bil Tierney — thorough treatment of both major and minor aspects with examples. Also: Aspects and Personality by Karen Hamaker-Zondag — explores the psychological dynamics of the quincunx in depth." },
    ],
    minutes: 18,
    takeaway: "Minor aspects add nuance beyond the Ptolemaic five. The quincunx (150 degrees) is the most important, connecting signs with nothing in common and requiring constant adjustment. Quintiles indicate creative talent; semi-squares create persistent irritation.",
  },

  "orbs-and-strength": {
    sections: [
      {
        type: "text",
        title: "How Wide Is an Aspect?",
        body: "An orb is the range of degrees within which an aspect is considered active. If a trine is exact at 120 degrees, is an aspect at 123 degrees still a trine? What about 127 degrees? The answer depends on which orb system you use. The traditional approach, used by Ptolemy, Lilly, and the Hellenistic astrologers, assigns orbs to planets rather than to aspects. Each planet has a sphere of influence — called its moiety — that extends a certain number of degrees in both directions. Two planets are in aspect when their combined moieties overlap at an aspect angle. This system recognizes that the Sun has a larger sphere of influence than Mercury, so a Sun-Mercury trine is allowed a wider orb than a Mercury-Saturn trine. Modern practice has largely simplified this into aspect-based orbs (trines get 8 degrees, squares get 7 degrees, etc.), but the traditional planet-based system is more astronomically grounded and more nuanced.",
      },
      {
        type: "text",
        title: "Applying Versus Separating Aspects",
        body: "An aspect's strength depends not only on its orb but on whether it is applying or separating. An applying aspect occurs when the faster planet is moving toward the exact degree of the aspect — the connection is forming, the energy is building. A separating aspect occurs when the faster planet has already passed the exact degree and is moving away — the connection is dissolving, the peak event has already occurred. In horary and electional astrology, only applying aspects are fully operative — a separating aspect indicates something that has already happened. In natal astrology, both applying and separating aspects are read, but applying aspects are considered stronger and more dynamic. A partile aspect — exact to the same degree — is the strongest of all. A partile conjunction of Venus and Jupiter at 15 degrees Pisces is far more powerful than the same conjunction with a 7-degree orb.",
      },
      {
        type: "text",
        title: "The Practical Art of Orb Selection",
        body: "Orb selection is partly science and partly art. The general principle: tighter orbs produce more reliable interpretations. Beginners often use orbs that are too wide, finding aspects everywhere and losing interpretive clarity. A useful starting framework: use generous orbs for the luminaries (Sun and Moon), moderate orbs for the visible planets (Mercury through Saturn), and tight orbs for the outer planets (Uranus, Neptune, Pluto). For minor aspects, use very tight orbs of 1-2 degrees. Some modern practitioners use only 1-degree orbs for all aspects, finding that the loss of quantity is compensated by a gain in quality — every aspect that survives a 1-degree filter is genuinely significant. Whichever system you adopt, be consistent. Changing your orbs to make a desired aspect fit is the fastest way to undermine your own practice.",
      },
      {
        type: "comparison-table",
        headers: ["Planet", "Traditional Moiety (one-half orb)", "Suggested Modern Orb (for any aspect)", "Notes"],
        rows: [
          ["Sun", "15° (moiety 7.5° each side)", "8-10°", "Largest orb — the Sun's light extends furthest"],
          ["Moon", "12° (moiety 6° each side)", "8-10°", "Second largest — the Moon is the other luminary"],
          ["Mercury", "7° (moiety 3.5° each side)", "5-7°", "Moderate orb for the messenger planet"],
          ["Venus", "7° (moiety 3.5° each side)", "5-7°", "Moderate orb, same class as Mercury"],
          ["Mars", "8° (moiety 4° each side)", "5-7°", "Slightly larger than Mercury/Venus traditionally"],
          ["Jupiter", "9° (moiety 4.5° each side)", "5-7°", "Generous orb reflecting Jupiter's expansive nature"],
          ["Saturn", "9° (moiety 4.5° each side)", "5-7°", "Equal to Jupiter — both are slow, visible planets"],
          ["Uranus", "5° (modern assignment)", "3-5°", "Tighter orb for outer planets"],
          ["Neptune", "5° (modern assignment)", "3-5°", "Tighter orb — influence is diffuse, requires closeness"],
          ["Pluto", "5° (modern assignment)", "3-5°", "Tighter orb — effect concentrated when close"],
        ],
      },
      { type: "callout", style: "insight", body: "When two aspects compete — say, a wide trine and a tight square — the tighter aspect almost always dominates experientially. Orb is a measure of intensity. An exact square will be felt more strongly than a wide trine in nearly every case." },
      { type: "callout", style: "tip", body: "Further Reading: Christian Astrology by William Lilly — includes the traditional moiety table used by most classical astrologers. Horoscope Symbols by Robert Hand — discusses orb theory with philosophical depth. Also: Aspects in Astrology by Sue Tompkins — provides practical orb guidelines for modern practitioners." },
    ],
    minutes: 18,
    takeaway: "Orbs determine how wide an aspect can be and still count. Traditional astrology assigns orbs to planets (the Sun gets the widest); modern practice often assigns orbs to aspects. Applying aspects are stronger than separating ones; partile (exact) aspects are the strongest.",
  },

  "stellium-and-patterns": {
    sections: [
      {
        type: "text",
        title: "When Planets Cluster: The Stellium",
        body: "A stellium is a concentration of three or more planets in a single sign or house. (Some astrologers require four planets; the exact threshold is debated, but the interpretive principle is the same.) A stellium dramatically intensifies the energy of that sign or house, making it the dominant theme of the chart. A person with Sun, Mercury, Venus, and Mars all in Scorpio experiences life through a profoundly Scorpionic lens — intensity, depth, transformation, and power dynamics pervade every area influenced by those planets. The house containing the stellium becomes the area of life that absorbs the most energy and attention. A stellium in the 7th house produces a life centered on relationships and partnerships. A stellium in the 10th house produces an overwhelming focus on career and public role. The stellium both concentrates talent and creates blind spots — so much energy in one area means other areas may be neglected.",
      },
      {
        type: "text",
        title: "Marc Edmund Jones' Pattern Classification",
        body: "Astrologer Marc Edmund Jones, in his Guide to Horoscope Interpretation (1941), identified seven planetary patterns based on how planets are distributed around the chart wheel. These patterns describe the overall 'shape' of a life. The Splash pattern has planets scattered evenly around the chart — the person is a generalist, interested in everything, master of nothing. The Bundle pattern has all planets within 120 degrees — the specialist, focused and concentrated but potentially limited. The Locomotive pattern has all planets within 240 degrees, leaving a 120-degree empty sector — the person is driven, with a leading planet at the front of the occupied sector acting as the engine. The Bucket pattern has all planets on one side of the chart except for a single 'handle' planet on the other — the handle planet becomes a crucial focal point, channeling all the energy of the occupied hemisphere. The Bowl occupies only one hemisphere — the empty hemisphere represents unrealized potential or projected qualities.",
      },
      {
        type: "text",
        title: "Grand Aspect Patterns",
        body: "Beyond simple distribution, planets form grand geometric patterns through aspects. The T-square (two planets in opposition, both squaring a third) is the most dynamic pattern — it creates relentless tension that drives achievement. The empty leg of the T-square (the point opposite the focal planet) is often where the person unconsciously seeks resolution. The Grand Trine (three planets in mutual trine, forming an equilateral triangle in one element) represents enormous natural ease and talent — but also potential complacency, since everything comes too easily. The Grand Cross (four planets in mutual squares and oppositions) is rare and demanding — it creates tension on all four fronts simultaneously and produces a person who is constantly challenged but also incredibly resilient. The Yod (two planets sextile each other, both quincunx a third) is called the 'Finger of God' and creates a fated sense of compulsive redirection toward the apex planet.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Stellium", definition: "3+ planets in one sign or house — intense concentration of energy in that area" },
          { term: "Splash", definition: "Planets scattered evenly — the generalist, broadly engaged with life" },
          { term: "Bundle", definition: "All planets within 120° — the specialist, intensely focused" },
          { term: "Locomotive", definition: "Planets within 240° — driven by the leading planet at the occupied edge" },
          { term: "Bucket", definition: "One hemisphere full, one handle planet — the handle channels all the chart's energy" },
          { term: "Bowl", definition: "All planets in one hemisphere — the empty half represents unrealized potential" },
          { term: "T-Square", definition: "Two planets oppose, both square a third — relentless drive and dynamic tension" },
          { term: "Grand Trine", definition: "Three mutual trines forming a triangle — natural talent that can become complacency" },
          { term: "Grand Cross", definition: "Four mutual squares and oppositions — constant challenge building exceptional resilience" },
          { term: "Yod", definition: "Two sextiles converging in a quincunx apex — compulsive redirection, a 'Finger of God'" },
        ],
      },
      { type: "callout", style: "insight", body: "The handle planet of a Bucket pattern and the focal planet of a T-square are often the most important planets in the chart — more important than the Sun or chart ruler. They are where the chart's energy converges and demands expression." },
      { type: "callout", style: "tip", body: "Further Reading: Guide to Horoscope Interpretation by Marc Edmund Jones — the original planetary pattern classification. Dynamics of Aspect Analysis by Bil Tierney — thorough coverage of grand aspect patterns. Also: The Astrology of Personality by Dane Rudhyar — philosophical treatment of chart patterns as expressions of psychological wholeness." },
    ],
    minutes: 22,
    takeaway: "Stelliums concentrate energy in one sign or house. Marc Edmund Jones classified chart shapes (Splash, Bundle, Locomotive, Bucket, Bowl) that describe overall life orientation. Grand aspect patterns like T-squares, Grand Trines, and Yods define a chart's central dynamics.",
  },

  // ═══════════════════════════════════════
  // HOUSES AND CHART READING FUNDAMENTALS
  // ═══════════════════════════════════════

  "what-are-houses": {
    sections: [
      {
        type: "text",
        title: "Houses: Where Life Happens",
        body: "If planets are the actors and signs describe how they perform, houses represent the stage — the specific areas of life where planetary energies play out. The 12 houses divide the chart into domains: self, money, communication, home, creativity, work, partnership, transformation, philosophy, career, community, and the unconscious. Every chart contains all 12 houses, and every house is active in your life whether or not it contains planets. A house with no planets is not an empty room — it is simply a room where the lights are not on. To understand that house, you look to its ruler: the planet that rules the sign on the cusp. Howard Sasportas, in The Twelve Houses, describes the houses as 'fields of experience' — the settings where the drama of your chart takes place. Understanding houses transforms a chart from an abstract list of planetary positions into a map of your actual life.",
      },
      {
        type: "text",
        title: "Angular, Succedent, and Cadent Houses",
        body: "The 12 houses are classified into three groups based on their strength and visibility. Angular houses (1st, 4th, 7th, 10th) are the most powerful. Planets in angular houses act with force, prominence, and directness — they are the most visible and impactful placements in the chart. The 1st house is the self; the 4th is the foundation; the 7th is partnership; the 10th is career. These four houses correspond to the four angles of the chart: Ascendant, IC, Descendant, and MC. Succedent houses (2nd, 5th, 8th, 11th) follow the angular houses and support them. They represent the resources, pleasures, transformations, and social networks that sustain the angular houses' activities. Cadent houses (3rd, 6th, 9th, 12th) are the most subtle and are traditionally considered the weakest placements. They represent communication, service, philosophy, and the unconscious — areas of life that operate behind the scenes. But 'weakest' does not mean unimportant. The 9th house (cadent) contains higher education, philosophy, and long-distance travel — hardly trivial domains.",
      },
      {
        type: "text",
        title: "Signs Versus Houses: How Versus Where",
        body: "One of the most common confusions in astrology is conflating signs and houses. Signs and houses are not the same thing, even though they share a superficial numerical correspondence (Aries = 1st sign, 1st house is associated with Aries-like themes). Signs describe quality — how a planet expresses itself. Aries energy is assertive, initiating, and direct. Houses describe domain — where in life the planet focuses. The 1st house is about self-presentation, identity, and physical appearance, regardless of which sign is on its cusp. Mars in Aries in the 7th house is assertive and direct (Aries) in the domain of partnerships (7th house). Mars in Pisces in the 10th house is compassionate and imaginative (Pisces) in the domain of career (10th house). The sign tells you the style; the house tells you the setting. Both are essential, and neither can substitute for the other.",
      },
      {
        type: "comparison-table",
        headers: ["House", "Domain", "Classification", "Traditional Association"],
        rows: [
          ["1st", "Self, body, identity, first impressions", "Angular", "Vita (Life)"],
          ["2nd", "Money, possessions, values, self-worth", "Succedent", "Lucrum (Wealth)"],
          ["3rd", "Communication, siblings, local travel, learning", "Cadent", "Fratres (Siblings)"],
          ["4th", "Home, family, roots, private life, endings", "Angular", "Genitor (Parent)"],
          ["5th", "Creativity, children, romance, pleasure, risk", "Succedent", "Nati (Children)"],
          ["6th", "Daily work, health, service, routine, craft", "Cadent", "Valetudo (Health)"],
          ["7th", "Marriage, partnership, open enemies, contracts", "Angular", "Uxor (Spouse)"],
          ["8th", "Shared resources, death, transformation, inheritance", "Succedent", "Mors (Death)"],
          ["9th", "Higher education, philosophy, travel, religion, law", "Cadent", "Peregrinationes (Journeys)"],
          ["10th", "Career, reputation, public role, authority", "Angular", "Regnum (Kingdom)"],
          ["11th", "Friends, communities, hopes, social networks", "Succedent", "Benefacta (Good Fortune)"],
          ["12th", "Unconscious, isolation, hidden enemies, spirituality", "Cadent", "Carcer (Prison)"],
        ],
      },
      { type: "callout", style: "insight", body: "Empty houses are not empty lives. If your 7th house has no planets, it does not mean you will never marry. It means the 7th house ruler — wherever it is in the chart — carries the story of your partnerships. Follow the ruler." },
      { type: "callout", style: "tip", body: "Further Reading: The Twelve Houses by Howard Sasportas — the definitive modern text on house interpretation. Temples of the Sky by Deborah Houlding — explores the history and traditional meanings of all 12 houses. Also: The Houses: Temples of the Sky by Deborah Houlding — comprehensive historical and practical treatment." },
    ],
    minutes: 18,
    takeaway: "Houses represent the 12 domains of life where planetary energies express. Angular houses are strongest; cadent houses are most subtle. Signs describe how; houses describe where. Empty houses are read through their rulers.",
  },

  "reading-your-birth-chart": {
    sections: [
      {
        type: "text",
        title: "Your First Chart Reading: A Practical Approach",
        body: "Looking at a birth chart for the first time can be overwhelming. The wheel is covered with symbols, lines, and numbers. Where do you begin? The key is systematic simplicity: follow a consistent sequence and resist the temptation to jump to the most exotic placement. Start with the Ascendant — the sign on the far left of the chart, marking the eastern horizon at the moment of your birth. The Ascendant (also called the Rising Sign) is the lens through which your entire chart expresses. It shapes your physical appearance, your demeanor, the first impression you make, and the overall approach you take to life. Many astrologers consider the Ascendant more descriptive of your outward personality than the Sun sign. If your Sun sign is who you are becoming, your Ascendant is how you show up in the room.",
      },
      {
        type: "text",
        title: "Locating the Sun, Moon, and Chart Ruler",
        body: "After identifying the Ascendant, find your Sun. Its sign tells you your core identity and conscious purpose. Its house tells you the life domain where you invest your creative will most intensely. A Sun in the 5th house focuses on creative expression and joy; a Sun in the 10th focuses on career achievement and public recognition. Next, find the Moon. Its sign reveals your emotional nature — how you process feelings, what makes you feel safe, and what you instinctively need. Its house shows where you seek emotional comfort and security. Then identify the chart ruler: the planet that rules your Ascendant sign. If you have Sagittarius rising, Jupiter is your chart ruler. Find Jupiter in your chart — its sign, house, and aspects tell the story of your life's direction and the path you naturally walk.",
      },
      {
        type: "text",
        title: "Noting Occupied Houses and Major Aspects",
        body: "Now scan the chart for concentration: which houses contain planets, and which are empty? Houses with planets are areas of life that receive direct energy and attention. If four planets cluster in your 3rd house, communication, learning, and writing are major life themes. If your 7th house is packed, relationships dominate your chart's narrative. Finally, look for the major aspects — the lines drawn between planets in the center of the chart wheel. Focus on conjunctions, squares, trines, and oppositions first. These are the primary conversations happening between your planets. A Venus-Saturn square tells a different love story than a Venus-Jupiter trine. The aspects are the story — the dynamic tensions and harmonies that make your chart unique.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Step 1: Ascendant", definition: "Find the rising sign — your lens on the world and the filter through which your chart expresses" },
          { term: "Step 2: Sun sign and house", definition: "Your core identity and the life domain where you invest your creative will" },
          { term: "Step 3: Moon sign and house", definition: "Your emotional nature, instinctive needs, and where you seek comfort" },
          { term: "Step 4: Chart ruler", definition: "The planet ruling the Ascendant sign — its placement tells the story of your life path" },
          { term: "Step 5: Occupied houses", definition: "Note which houses contain planets — these are your most active life domains" },
          { term: "Step 6: Major aspects", definition: "Read the dynamic relationships between planets — conjunctions, squares, trines, oppositions" },
        ],
      },
      { type: "callout", style: "insight", body: "Resist the urge to Google every placement individually. A chart is a system, not a list. Venus in Pisces means something different when it is conjunct Saturn than when it trines Jupiter. Context is everything — always read placements in relation to each other." },
      { type: "callout", style: "tip", body: "Further Reading: The Inner Sky by Steven Forrest — the best introductory guide to reading your own chart with clarity and depth. Parker's Astrology by Julia and Derek Parker — comprehensive visual reference for beginners. Also: Chart Interpretation Handbook by Stephen Arroyo — clear, practical approach to chart synthesis." },
    ],
    minutes: 18,
    takeaway: "Read your birth chart systematically: start with the Ascendant, then Sun, Moon, and chart ruler. Note which houses are occupied and identify major aspects. A chart is a system — always read placements in context, not in isolation.",
  },

  "your-big-three": {
    sections: [
      {
        type: "text",
        title: "The Three Pillars of Your Chart",
        body: "When someone asks 'What is your sign?', they are asking about your Sun sign — the sign the Sun occupied at your birth. But your Sun sign is only one third of the foundation. Your Big Three — Sun sign, Moon sign, and Rising sign (Ascendant) — form the core identity triangle that defines who you are far more accurately than any single placement. Think of it this way: your Sun sign is the director of the film of your life — it sets the overarching vision and purpose. Your Moon sign is the lead actor's inner emotional life — the motivations and feelings that drive behavior behind the scenes. Your Rising sign is the cinematography — how the whole production looks and feels to the audience. You need all three to understand the film. This is why two people who share a Sun sign can seem utterly different: their Moon signs and Rising signs create entirely different expressions of the same solar core.",
      },
      {
        type: "text",
        title: "Sun Sign: Your Conscious Identity and Purpose",
        body: "The Sun represents your core identity — the person you are becoming over the course of your life. It is not who you are at birth; it is who you are growing toward. The Sun's sign describes the qualities you are developing as your life purpose. Sun in Aries is learning courage, independence, and initiative. Sun in Cancer is learning emotional depth, nurturing, and the creation of a secure foundation. Sun in Capricorn is learning discipline, mastery, and the building of enduring structures. The Sun's house placement shows the life domain where this purpose plays out most vividly. Understanding your Sun sign as a developmental process — not a fixed personality type — transforms it from a horoscope column cliche into a genuine tool for self-understanding. You are not your Sun sign; you are becoming your Sun sign, and the journey is the point.",
      },
      {
        type: "text",
        title: "Moon Sign: Your Emotional Core",
        body: "The Moon represents your emotional nature — the part of you that reacts instinctively, before the conscious mind has time to process. It reveals what makes you feel safe, what triggers you, what you need in a home environment, and how you nurture others. The Moon sign is often more descriptive of your private self than the Sun sign. Someone with Sun in Aquarius (intellectual, detached, future-oriented) but Moon in Cancer (emotionally sensitive, home-oriented, nostalgic) will appear cool and cerebral in public but need deep emotional security in private. Moon sign compatibility often matters more in intimate relationships than Sun sign compatibility because it governs the emotional language each person speaks. If your Moon sign needs words of affirmation (Moon in Gemini) but your partner's Moon needs physical presence (Moon in Taurus), understanding this difference prevents chronic misunderstanding.",
      },
      {
        type: "text",
        title: "Rising Sign: Your Outward Persona and Life Lens",
        body: "The Rising sign (Ascendant) is the sign that was rising on the eastern horizon at the exact moment of your birth. It changes approximately every two hours, which is why birth time accuracy is so crucial. The Rising sign determines your physical mannerisms, your first impression, the 'mask' you wear in public, and the overall approach you take to new situations. But it is more than a mask — it is the lens through which your entire chart filters into the world. It also sets the house system of your chart: a Leo Rising person has Leo on the 1st house, Virgo on the 2nd, Libra on the 3rd, and so on in Whole Sign houses. The Rising sign determines the chart ruler, which is arguably the most important planet in the chart. Because the Rising sign changes every two hours, two people born on the same day but at different times can have entirely different Rising signs — and therefore entirely different chart structures, house placements, and life orientations.",
      },
      {
        type: "comparison-table",
        headers: ["Component", "What It Represents", "How to Find It", "Why It Matters"],
        rows: [
          ["Sun Sign", "Conscious identity, life purpose, creative will", "The zodiac sign the Sun occupied at birth — you only need your birth date", "Defines your core developmental journey and the qualities you are cultivating"],
          ["Moon Sign", "Emotional nature, instinctive reactions, inner needs", "Requires birth date and approximate time — the Moon changes signs every ~2.5 days", "Reveals your private self, emotional language, and what makes you feel secure"],
          ["Rising Sign", "Outward persona, first impressions, life lens", "Requires exact birth time — the Ascendant changes signs every ~2 hours", "Sets the chart ruler, determines house structure, and filters your entire chart's expression"],
        ],
      },
      { type: "callout", style: "warning", body: "Without an accurate birth time, your Rising sign cannot be determined reliably. If your birth time is approximate (e.g., 'around noon'), your Rising sign may be wrong. This matters because the Rising sign determines the chart ruler and all house placements. Get your birth certificate or hospital records if possible." },
      { type: "callout", style: "tip", body: "Further Reading: The Inner Sky by Steven Forrest — beautifully explains how Sun, Moon, and Rising interact as a system. Horoscope Symbols by Robert Hand — philosophically rigorous exploration of what each component represents. Also: Astrology for the Soul by Jan Spiller — excellent on the Moon's nodes, which extend the Big Three into life purpose territory." },
    ],
    minutes: 18,
    takeaway: "Your Big Three — Sun sign (conscious purpose), Moon sign (emotional core), and Rising sign (outward persona) — form the identity triangle that defines you far more accurately than any single sign. The Rising sign changes every two hours, making exact birth time essential.",
  },

  // ═══════════════════════════════════════
  // ASTROLOGY-TAROT INTEGRATION
  // ═══════════════════════════════════════

  "using-chart-for-tarot": {
    sections: [
      {
        type: "text",
        title: "Why the Birth Chart Belongs on Your Reading Table",
        body: "The birth chart is the single most powerful context tool a tarot reader can use. When you know a querent's natal placements, the cards stop being generic and start speaking directly to their lived experience. A querent with a Scorpio Moon who draws the Moon card is not receiving the same message as a Gemini Moon who draws it. The natal chart tells you how this person processes the card's archetype — through which emotional filter, with which instinctive reactions, and against which life themes.\n\nThis is not about replacing tarot intuition with astrological analysis. It is about giving your intuition better raw material. When you know the chart, you read the cards with specificity rather than generality. The Eight of Pentacles for a 6th house stellium person is about their core life work. The same card for someone with an empty 6th house might be about an unfamiliar discipline they need to develop.",
      },
      {
        type: "text",
        title: "Elemental Dominance and Suit Resonance",
        body: "Start by identifying the querent's dominant element. Count the planets by element: someone with Sun, Moon, and Venus in water signs has a strong water signature. This person will process life primarily through emotion and intuition — and the Cups suit will resonate with them at a core level.\n\nWhen cards of the querent's dominant element appear in a reading, they represent familiar territory — strengths, comfort zones, and deeply ingrained patterns. When cards of the missing element appear, they represent growth edges — unfamiliar energy that the person needs to develop. A fire-dominant person who draws multiple Cups is being asked to engage with emotional depth they typically avoid.\n\nThis elemental lens transforms suit interpretation from generic symbolism into personalized guidance. You are no longer saying 'Cups represent emotions.' You are saying 'This card speaks to the emotional depth that comes naturally to you — or the emotional territory you tend to bypass.'",
      },
      {
        type: "text",
        title: "Using Current Transits to Frame the Reading",
        body: "Before pulling cards, check the querent's active transits. If Saturn is transiting their 10th house, they are in a period of career restructuring — frame your spread positions around professional themes. If Neptune is conjuncting their natal Venus, love and idealism are active themes. Let the transits guide your choice of spread, your phrasing of positions, and your interpretation of the cards that appear.\n\nThe querent's natal Moon sign also suggests how they process the reading itself. A Capricorn Moon needs practical takeaways — give them action steps. A Pisces Moon absorbs the reading's atmosphere — let the imagery speak. An Aries Moon wants directness — cut to the point quickly. Tailoring your delivery to the Moon sign makes the reading land more effectively.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Dominant element", definition: "The element (fire/earth/air/water) with the most planetary placements — shows the querent's default processing mode" },
          { term: "Missing element", definition: "The element with no or few placements — represents unfamiliar energy and growth opportunities" },
          { term: "Active transits", definition: "Current planetary positions aspecting the natal chart — frame the reading's timing and themes" },
          { term: "Natal Moon sign", definition: "The querent's emotional processing style — guides how to deliver the reading" },
          { term: "House emphasis", definition: "Which life areas are most active in the chart — suggests which spread positions matter most" },
        ],
      },
      { type: "callout", style: "insight", body: "The birth chart does not replace the cards — it contextualizes them. A reading with chart knowledge is like a conversation where you already know the person's language. The same words land differently when you understand who is hearing them." },
      { type: "callout", style: "tip", body: "Further Reading: 'Tarot and Astrology' by Corrine Kenner — the most thorough exploration of how the two systems map onto each other. 'The Tarot: History, Symbolism, and Divination' by Robert Place — essential background on the astrological correspondences built into the tarot deck's structure." },
    ],
    minutes: 15,
    takeaway: "The birth chart transforms tarot readings from generic to personal. Use the querent's dominant element to interpret suit resonance, active transits to frame the reading's themes, and the natal Moon sign to tailor your delivery.",
  },

  "transit-triggered-tarot": {
    sections: [
      {
        type: "text",
        title: "Pulling Cards for What the Sky Is Doing Right Now",
        body: "Transit-triggered tarot is the practice of using current astrological transits as the prompt for a tarot reading. Instead of asking a vague question like 'What do I need to know?', you ask 'What does this Saturn square to my natal Moon mean for me?' or 'How should I work with Jupiter entering my 7th house?' The transit provides the timing and the theme. The cards provide the symbolic guidance.\n\nThis approach solves one of tarot's persistent problems: the question of focus. Many readings falter because the question is too broad. Transits give you precise, personally timed questions that the cards can answer with specificity. You are not asking about your life in general — you are asking about a specific planetary pattern that is active in your chart right now.",
      },
      {
        type: "text",
        title: "The Step-by-Step Process",
        body: "Step 1: Check your current transits using an ephemeris or astrology app. Identify the most significant active transit — typically an outer planet (Saturn, Uranus, Neptune, Pluto) aspecting a personal planet or angle in your natal chart.\n\nStep 2: Formulate a transit-specific question. Not 'What is happening in my career?' but 'Saturn is opposing my natal Sun in the 10th house — what is being restructured in my professional identity, and how should I work with this energy?'\n\nStep 3: Choose a spread that matches the transit's complexity. A single card may suffice for a brief Venus transit. A five-card cross or custom spread is better for a Saturn or Pluto transit that lasts months.\n\nStep 4: Pull and read the cards through the lens of the transit. The Tower during a Pluto transit means something different than the Tower during a Jupiter transit. The planetary context shapes the card's expression.\n\nStep 5: Record the reading with the transit noted. When the transit completes, review your cards. This builds your understanding of how transits manifest through tarot symbolism.",
      },
      {
        type: "text",
        title: "Transit-Card Affinities",
        body: "Certain transits have natural affinities with certain cards and suits. Saturn transits often produce Pentacles (material restructuring), the Emperor (authority), or the World (completion of a cycle). Neptune transits frequently draw Cups (emotional dissolution), the Moon (illusion), or the High Priestess (hidden knowledge). Uranus transits tend to produce Wands (sudden action), the Tower (disruption), or the Fool (radical new beginnings).\n\nWhen the cards that appear match the transit's expected energy, you have confirmation — the transit is expressing as anticipated. When unexpected cards appear, you have new insight — the transit is working through a channel you had not considered. Both outcomes are valuable. The match tells you where to look. The mismatch tells you where to look more carefully.",
      },
      {
        type: "comparison-table",
        headers: ["Transit Planet", "Typical Tarot Affinities", "Reading Focus"],
        rows: [
          ["Saturn", "Pentacles, The Emperor, The World, Ten of Wands", "Structure, discipline, long-term consequences, what must be faced"],
          ["Uranus", "Wands, The Tower, The Fool, Ace cards", "Disruption, liberation, sudden change, radical authenticity"],
          ["Neptune", "Cups, The Moon, High Priestess, Seven of Cups", "Illusion, intuition, spiritual opening, what is being idealized"],
          ["Pluto", "Swords, Death, Judgement, The Tower", "Transformation, power dynamics, what must die for rebirth"],
          ["Jupiter", "The Wheel of Fortune, The Sun, Six of Wands", "Expansion, opportunity, where to say yes, optimism check"],
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Planets in Transit' by Robert Hand — the definitive transit reference. Pair it with 'Seventy-Eight Degrees of Wisdom' by Rachel Pollack for the tarot side. Together, these two books give you everything you need for transit-triggered readings." },
    ],
    minutes: 15,
    takeaway: "Transit-triggered tarot uses current astrological transits as precise prompts for tarot readings. This approach combines astrology's timing precision with tarot's symbolic depth, producing readings that are both personally timed and richly specific.",
  },

  "house-based-spreads": {
    sections: [
      {
        type: "text",
        title: "The Houses as Spread Positions",
        body: "The twelve astrological houses provide a ready-made framework for tarot spread design. Each house governs a specific life area — from self-image (1st) to career (10th) to the unconscious (12th). By assigning tarot positions based on house meanings, you create spreads that map directly onto the structure of lived experience.\n\nThis is not the same as the full 12-card astrological spread (covered separately). House-based spread design means using house principles to create targeted layouts of any size. You might pull cards only for the houses that are most active in your chart, or design a 4-card spread using only the angular houses (1st, 4th, 7th, 10th) to assess the four pillars of life.",
      },
      {
        type: "text",
        title: "The Four-Pillar Spread: Angular Houses Only",
        body: "The angular houses — 1st, 4th, 7th, and 10th — are the four pillars that hold up the chart. They correspond to the four cardinal directions and the four fundamental life domains: identity, home, partnership, and career.\n\nCard 1 (1st House — Self): Who you are being right now. Your current identity expression, physical vitality, and personal initiative.\n\nCard 2 (4th House — Foundation): Your home, family, emotional roots. The private foundation that supports or undermines everything else.\n\nCard 3 (7th House — Partnership): Your significant relationships. How you are showing up in partnership and what your partnerships are reflecting back to you.\n\nCard 4 (10th House — Vocation): Your career, public role, and contribution to the world. The legacy you are building.\n\nThis four-card spread is powerful for quarterly check-ins. It strips away detail and asks: how are the four fundamental pillars of my life standing right now?",
      },
      {
        type: "text",
        title: "Chart-Guided Selective Spreads",
        body: "The most sophisticated use of house-based spreads is to let the natal chart tell you which houses to read. If you have a stellium in the 8th house and transiting Pluto is activating it, you do not need a 12-card spread — you need a focused 3-card reading on 8th house themes: shared resources, psychological transformation, and intimate vulnerability.\n\nCheck which houses contain natal planets — these are your most active life domains. Check which houses are being transited by outer planets — these are where current change is concentrated. Pull cards specifically for those houses. This targeted approach produces more actionable readings than a full-wheel spread because it directs all the reading's energy to where it matters most right now.\n\nYou can also design spreads that combine house positions with relational questions. For a career reading, pull cards for the 2nd house (income), 6th house (daily work), and 10th house (vocation) — three positions that cover the economic spectrum from earning to purpose.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Angular houses (1, 4, 7, 10)", definition: "The four pillars — self, home, partnership, career. The most visible and impactful life areas" },
          { term: "Succedent houses (2, 5, 8, 11)", definition: "Resources and values — money, creativity, shared assets, community. What sustains the angular pillars" },
          { term: "Cadent houses (3, 6, 9, 12)", definition: "Processing and transition — communication, service, philosophy, the unconscious. Where integration happens" },
          { term: "Stellium house", definition: "A house with three or more planets — always a major life focus worth pulling cards for" },
          { term: "Transited house", definition: "A house currently activated by outer planet transits — where change is happening now" },
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'The Twelve Houses' by Howard Sasportas — the definitive guide to house meanings. 'Tarot for Your Self' by Mary K. Greer — spread design principles that complement house-based frameworks beautifully." },
    ],
    minutes: 15,
    takeaway: "Use astrological house meanings to design targeted tarot spreads. The four-pillar angular spread covers the fundamentals; chart-guided selective spreads focus energy on the houses where your life is most active right now.",
  },

  "yearly-forecast-combined": {
    sections: [
      {
        type: "text",
        title: "The Triple-Layer Annual Forecast",
        body: "The most thorough annual forecast available combines three distinct techniques: the solar return chart, annual profections, and a 12-card tarot year-ahead spread. Each technique captures a different dimension of the year. The solar return shows the year's astrological themes. Profections identify the planetary ruler governing the year. The tarot spread provides symbolic month-by-month guidance. Together, they produce a forecast of remarkable depth and specificity.\n\nThis is the signature technique of the Olivia Arcana approach — the integration point where astrological precision and tarot symbolism merge into a single, coherent picture of the year ahead. It requires fluency in all three methods, which is why it sits near the end of the curriculum.",
      },
      {
        type: "text",
        title: "Layer 1: The Solar Return Chart",
        body: "The solar return is a chart cast for the exact moment the transiting Sun returns to its natal position — your true astrological birthday, which may fall a day before or after your calendar birthday. This chart reveals the year's dominant themes through its house placements and aspects.\n\nLook first at the solar return Ascendant — it sets the tone for the entire year. A solar return with Scorpio rising brings a year of intensity, transformation, and psychological depth. Capricorn rising brings a year of hard work, ambition, and structural building. Then examine where the solar return Sun falls by house — this is the life area that receives the most solar energy during the year. Finally, note any tight aspects between solar return planets and natal planets — these are the year's most significant activation points.",
      },
      {
        type: "text",
        title: "Layer 2: Annual Profections and the Lord of the Year",
        body: "Annual profections are an elegant Hellenistic technique. Starting from the 1st house at birth, each year of life advances one house. At age 0, you are in a 1st house profection year. At age 1, a 2nd house year. At age 12, back to the 1st house. The cycle repeats every 12 years.\n\nThe house activated by profection tells you the year's primary life theme. But the real power is in the Lord of the Year — the planet that rules the profected house's sign. If you are in a 7th house profection year and your 7th house is Libra, Venus is your Lord of the Year. Every transit to natal Venus becomes amplified. Every Venus-themed card in your tarot spread carries extra weight.\n\nThe Lord of the Year acts as a filter: it tells you which planetary energy governs the year and which transits will hit hardest. This single piece of information transforms both your astrological tracking and your tarot interpretations for the entire year.",
      },
      {
        type: "text",
        title: "Layer 3: The 12-Card Tarot Year-Ahead Spread",
        body: "With the solar return themes and the Lord of the Year established, pull 12 cards — one for each month. But now you are not reading them in isolation. You are reading them through the lens of the solar return and profection.\n\nIf the solar return emphasizes the 4th house, the cards that fall in months when transits activate the 4th house will be especially significant. If Venus is the Lord of the Year, every Empress, every Cups card, every Venus-associated image carries amplified meaning.\n\nPerform this triple-layer reading on or near your birthday each year. Write up the findings as a year guide. Return to it monthly, comparing what unfolds against all three layers. By year's end, you will have a detailed record of how astrology and tarot interweave in real time — and your forecasting skill will have deepened immeasurably.",
      },
      {
        type: "comparison-table",
        headers: ["Layer", "Technique", "What It Reveals", "Key to Look For"],
        rows: [
          ["1", "Solar Return Chart", "Year's dominant astrological themes", "SR Ascendant, Sun's house, tight aspects to natal planets"],
          ["2", "Annual Profections", "The year's primary life area and ruling planet", "Profected house, Lord of the Year, transits to that planet"],
          ["3", "12-Card Tarot Spread", "Month-by-month symbolic guidance", "Cards echoing the SR themes, Lord of the Year associations"],
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'On Solar Returns' by Abu Ma'shar (translated by Benjamin Dykes) — the foundational text on solar return technique. 'Traditional Astrology for Today' by Benjamin Dykes — excellent on profections. 'Seventy-Eight Degrees of Wisdom' by Rachel Pollack — for the tarot layer." },
    ],
    minutes: 20,
    takeaway: "The triple-layer annual forecast combines a solar return chart, annual profections (Lord of the Year), and a 12-card tarot spread to produce the most thorough yearly reading possible. Each layer enriches the others.",
  },

  "planetary-rituals": {
    sections: [
      {
        type: "text",
        title: "Working with Planetary Days and Hours",
        body: "Every day of the week is governed by a planet — a correspondence so ancient it is embedded in the names themselves. Sunday belongs to the Sun. Monday to the Moon. Tuesday to Mars (Mardi in French, Martes in Spanish). Wednesday to Mercury (Mercredi, Miercoles). Thursday to Jupiter (Jeudi, Jueves). Friday to Venus (Vendredi, Viernes). Saturday to Saturn.\n\nThis is not arbitrary symbolism — it is a practical scheduling framework used by astrologers and magical practitioners for millennia. When you align your intentions, rituals, and tarot work with the planetary day, you work with the current of that planet's energy rather than against it. A love spell on Venus's day. A career intention on Jupiter's day. A release ritual on Saturn's day. The planetary day provides the container; your intention provides the content.",
      },
      {
        type: "text",
        title: "The Planetary Hour System",
        body: "Beyond days, each day is subdivided into planetary hours — a system that cycles through all seven classical planets in a fixed sequence: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon. The first hour of each day is ruled by the day's planet (the first hour of Sunday is a Sun hour, the first hour of Monday is a Moon hour, and so on).\n\nPlanetary hours are not clock hours. They are calculated by dividing the daylight period into 12 equal segments and the nighttime period into 12 equal segments. In summer, daytime 'hours' are longer; in winter, shorter. Many astrology apps calculate planetary hours automatically.\n\nFor ritual and tarot work, the planetary hour adds precision. Pulling a tarot card about a relationship during a Venus hour on a Friday (Venus day) creates a triple alignment of intention, daily energy, and hourly energy. This is not superstition — it is intentional alignment of symbolic systems, which deepens focus and heightens the practitioner's attunement to the energy they are working with.",
      },
      {
        type: "text",
        title: "Practical Planetary Rituals",
        body: "A planetary ritual does not require elaborate ceremony. At its simplest, it involves choosing the right day and hour, setting an intention aligned with that planet's domain, and performing a symbolic action — lighting a candle, pulling a tarot card, writing a journal entry, or meditating on the planet's archetype.\n\nSun rituals (Sunday): Intentions around identity, confidence, vitality, leadership. Pull a card about your core purpose. Light a gold or yellow candle.\n\nMoon rituals (Monday): Intentions around emotional healing, intuition, home, nurturing. Pull a card about your emotional needs. Work with silver or white.\n\nMars rituals (Tuesday): Intentions around courage, assertion, physical energy, boundaries. Pull a card about what you need to fight for. Work with red.\n\nMercury rituals (Wednesday): Intentions around communication, learning, writing, commerce. Pull a card about what you need to express. Work with orange or multicolored objects.\n\nJupiter rituals (Thursday): Intentions around growth, abundance, wisdom, opportunity. Pull a card about where expansion is possible. Work with blue or purple.\n\nVenus rituals (Friday): Intentions around love, beauty, pleasure, values, art. Pull a card about your heart's desire. Work with green or pink.\n\nSaturn rituals (Saturday): Intentions around discipline, release, boundary-setting, endings. Pull a card about what you need to let go of. Work with black or dark blue.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Sunday — Sun", definition: "Identity, vitality, purpose, confidence, leadership, creative self-expression" },
          { term: "Monday — Moon", definition: "Emotions, intuition, home, nurturing, memory, the inner world" },
          { term: "Tuesday — Mars", definition: "Courage, action, assertion, physical energy, conflict, boundaries" },
          { term: "Wednesday — Mercury", definition: "Communication, intellect, learning, writing, commerce, adaptability" },
          { term: "Thursday — Jupiter", definition: "Growth, abundance, wisdom, faith, opportunity, philosophical vision" },
          { term: "Friday — Venus", definition: "Love, beauty, pleasure, art, harmony, values, relationships" },
          { term: "Saturday — Saturn", definition: "Discipline, structure, endings, release, responsibility, karmic lessons" },
        ],
      },
      { type: "callout", style: "insight", body: "You do not need to believe in planetary magic for this to work. Planetary rituals function as intentional focus practices. By choosing a specific day and hour for a specific type of work, you concentrate your attention and align your symbolic awareness — which improves the quality of any tarot reading or intention-setting exercise." },
      { type: "callout", style: "tip", body: "Further Reading: 'Practical Planetary Magick' by David Rankine and Sorita d'Este — thorough and accessible guide to the planetary day and hour system. 'The Picatrix' (translated by John Michael Greer and Christopher Warnock) — the medieval source text on planetary magic for advanced practitioners." },
    ],
    minutes: 15,
    takeaway: "Planetary days and hours provide a practical framework for timing rituals, intentions, and tarot work. Aligning your practice with planetary energy deepens focus and symbolic attunement, whether you approach it as magic or as intentional psychology.",
  },

  "card-of-the-year": {
    sections: [
      {
        type: "text",
        title: "Your Personal Year Card: The Archetype of the Year",
        body: "Your personal Year Card is a Major Arcana card calculated from your birth date and the current year. It reveals the dominant archetype — the overarching theme and energy — governing your experience for the entire year. This technique was popularized by Angeles Arrien and Mary K. Greer, and it has become one of the most widely used personal tarot practices.\n\nThe Year Card is not a prediction. It is a lens. When you know your Year Card, you begin to see its archetype everywhere — in the decisions you face, the people you meet, the lessons that keep repeating. The Tower year is not necessarily catastrophic, but it is a year where structures that are not sound will be tested. The Star year is not automatically blissful, but it carries an undercurrent of hope and healing that you can access whenever you remember to look for it.",
      },
      {
        type: "text",
        title: "How to Calculate Your Year Card",
        body: "The calculation is simple arithmetic. Add your birth month + birth day + current year, then reduce the sum to a number between 1 and 22.\n\nExample: Birth date March 15, current year 2026.\n3 + 15 + 2026 = 2044\nReduce: 2 + 0 + 4 + 4 = 10 → The Wheel of Fortune\n\nIf the sum reduces to a number between 1 and 21, that is your Year Card directly (1 = The Magician, 2 = The High Priestess, and so on). If it reduces to 22, your Year Card is The Fool (numbered 0 in most decks, but carrying the value of 22 in this system).\n\nIf the first reduction gives a number above 22, reduce again. For instance, if you get 25: 2 + 5 = 7 → The Chariot.\n\nSome practitioners also track a secondary Year Card by further reducing double-digit results. If your Year Card is 19 (The Sun), your secondary card is 1 + 9 = 10 (The Wheel of Fortune), and your tertiary is 1 + 0 = 1 (The Magician). Each layer adds nuance — the primary card is the dominant theme, the secondary is a supporting influence.",
      },
      {
        type: "text",
        title: "Working with Your Year Card Throughout the Year",
        body: "Once you know your Year Card, study it deeply. Read multiple interpretations. Sit with the image. Journal about what the archetype means in the context of your current life. Then watch for it.\n\nPull a card at the start of each month asking: 'How is my Year Card expressing itself this month?' Track the patterns. In a Hermit year (9), you may find yourself drawn to solitude, introspection, and inner guidance. In an Emperor year (4), themes of authority, structure, and fatherhood may dominate. In a Death year (13), expect major endings and transformations — not literal death, but the clearing away of what no longer serves.\n\nThe Year Card also interacts with your natal chart. If your Year Card is The Empress (3, ruled by Venus) and you have strong natal Venus placements, the year amplifies your Venusian nature. If The Empress is your Year Card but Venus is challenged in your natal chart, the year invites you to heal and develop your relationship with beauty, pleasure, and self-worth.",
      },
      {
        type: "comparison-table",
        headers: ["Year Card", "Number", "Core Theme of the Year"],
        rows: [
          ["The Magician", "1", "Initiative, skill, conscious creation — a year to begin something new"],
          ["The High Priestess", "2", "Intuition, patience, hidden knowledge — a year to listen deeply"],
          ["The Empress", "3", "Abundance, creativity, nurturing — a year to grow and receive"],
          ["The Emperor", "4", "Structure, authority, discipline — a year to build something lasting"],
          ["The Hierophant", "5", "Tradition, teaching, spiritual study — a year to learn or mentor"],
          ["The Lovers", "6", "Choice, relationship, values alignment — a year of significant decisions"],
          ["The Chariot", "7", "Willpower, direction, overcoming — a year to push through obstacles"],
          ["Strength", "8", "Patience, courage, inner power — a year of gentle persistence"],
          ["The Hermit", "9", "Solitude, introspection, inner wisdom — a year to go inward"],
          ["Wheel of Fortune", "10", "Cycles, change, destiny — a year of significant shifts"],
          ["Justice", "11", "Balance, accountability, truth — a year of consequences and fairness"],
          ["The Hanged Man", "12", "Surrender, new perspective, pause — a year to let go of control"],
          ["Death", "13", "Transformation, ending, rebirth — a year of profound change"],
          ["Temperance", "14", "Integration, moderation, healing — a year of finding balance"],
          ["The Devil", "15", "Shadow work, bondage, liberation — a year to face what binds you"],
          ["The Tower", "16", "Upheaval, breakthrough, revelation — a year where false structures fall"],
          ["The Star", "17", "Hope, healing, inspiration — a year of renewal after difficulty"],
          ["The Moon", "18", "Illusion, intuition, the unconscious — a year of navigating uncertainty"],
          ["The Sun", "19", "Joy, vitality, clarity — a year of confidence and radiance"],
          ["Judgement", "20", "Calling, evaluation, resurrection — a year of answering a higher summons"],
          ["The World", "21", "Completion, integration, wholeness — a year of culmination"],
          ["The Fool", "22", "New beginning, leap of faith, innocence — a year to start fresh"],
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Tarot for Your Self' by Mary K. Greer — the original and most thorough exploration of the Year Card system, including calculation methods, journaling practices, and interpretation guidance for every Major Arcana year." },
    ],
    minutes: 15,
    takeaway: "Your personal Year Card is calculated by adding birth month + birth day + current year and reducing to 1-22. It reveals the dominant Major Arcana archetype governing your year and provides a powerful lens for monthly tarot practice.",
  },

  "your-olivia-approach": {
    sections: [
      {
        type: "text",
        title: "You Have the Building Blocks — Now Build",
        body: "If you have reached this lesson, you have studied the birth chart from Ascendant to stellium, learned to read transits and progressions, developed fluency with the 78 tarot cards, mastered multiple spread formats, and practiced integrating the two systems through transit-triggered readings, house-based spreads, and the Year Card. You have the building blocks. What remains is the most important step: developing your unique voice as an Olivia Arcana practitioner.\n\nYour voice is not a technique — it is the particular combination of knowledge, intuition, compassion, and personality that you bring to every reading. No two practitioners synthesize these elements the same way. Your natal chart, your life experience, your natural affinities (perhaps you gravitate toward relationship astrology, or perhaps mundane astrology lights you up) — all of these shape the practitioner you are becoming.",
      },
      {
        type: "text",
        title: "Finding Your Signature Strengths",
        body: "Reflect on the curriculum so far. Which lessons felt like home? Which techniques produced readings that made you think 'yes, THIS is what I am meant to do'? Those resonances are not random — they point toward your signature strengths as a reader.\n\nSome practitioners are natural chart synthesizers — they see the birth chart as a whole and communicate its story with narrative clarity. Others are transit specialists who excel at timing and forecasting. Some are drawn to psychological depth, using tarot and astrology as tools for inner exploration. Others are practical advisors who translate cosmic patterns into actionable guidance.\n\nAll of these are valid. The Olivia Arcana approach does not prescribe a single style — it provides the foundational toolkit and trusts you to build with it according to your gifts. Your Moon sign often hints at your reading style: water Moons read with emotional depth, air Moons read with intellectual precision, fire Moons read with inspiring directness, earth Moons read with practical grounding.",
      },
      {
        type: "text",
        title: "Developing Your Personal Practice Framework",
        body: "Every accomplished reader has a personal framework — a set of practices they return to consistently. As you develop yours, consider these components:\n\nDaily practice: What do you do every day? A single card pull? A transit check? A brief meditation with your Year Card? Consistency matters more than duration.\n\nReading ritual: How do you prepare for a reading? Do you check the querent's transits first? Do you begin with a specific spread? Do you light a candle, shuffle a particular way, or invoke a particular intention? Ritual creates focus.\n\nIntegration method: How do you combine astrology and tarot in a reading? Do you lead with the chart and use tarot for specificity? Lead with the cards and use the chart for context? Alternate between them? There is no correct order — find the sequence that produces your best work.\n\nReflection practice: How do you learn from your readings? Do you journal? Record sessions? Follow up with querents? The practitioners who improve fastest are the ones who reflect consistently.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Signature strength", definition: "The area of practice where your natural talent and deepest interest converge — your gift as a reader" },
          { term: "Reading ritual", definition: "The consistent preparatory steps that create focus and set the container for a reading" },
          { term: "Integration method", definition: "Your personal approach to combining astrological analysis and tarot symbolism in a single session" },
          { term: "Reflection practice", definition: "The habit of reviewing readings to identify patterns, growth edges, and deepening insights" },
          { term: "Practitioner voice", definition: "The unique combination of technique, intuition, and personality that distinguishes your readings from anyone else's" },
        ],
      },
      { type: "callout", style: "insight", body: "Your chart is your first teacher. Look at your natal Mercury for how you communicate readings. Look at your 9th house for your philosophical framework. Look at your 12th house for your connection to the unseen. You are not separate from the systems you practice — they describe you, too." },
      { type: "callout", style: "tip", body: "Further Reading: 'Tarot for Your Self' by Mary K. Greer — particularly the chapters on developing personal style. 'The Inner Sky' by Steven Forrest — his integration of technique and soul-level reading exemplifies what a mature practitioner voice looks like." },
    ],
    minutes: 15,
    takeaway: "Your unique synthesis of astrology, tarot, intuition, and compassion is your voice as an Olivia Arcana practitioner. Identify your signature strengths, build a consistent personal practice framework, and trust that your particular combination of gifts is exactly what your querents need.",
  },

  "capstone-project": {
    sections: [
      {
        type: "text",
        title: "The Capstone: A Complete Integrated Reading",
        body: "The capstone project is the culmination of the entire Olivia Arcana Academy curriculum. You will perform a complete integrated reading for a real person — combining natal chart analysis, transit interpretation, custom tarot spread design, and a professional written report. This is not a test of memorization. It is a demonstration of synthesis: your ability to weave multiple systems into a single, coherent, helpful reading.\n\nChoose a willing participant — someone whose birth data you have (date, time, and place of birth) and who is open to receiving a detailed reading. This should be someone you care about giving genuine insight to, because the quality of the reading depends on your investment in the person, not just your technical skill.",
      },
      {
        type: "text",
        title: "Part 1: The Natal Chart Analysis",
        body: "Begin with a thorough chart analysis. Cover the Big Three (Sun, Moon, Rising) and their interrelationships. Identify the chart ruler and trace its sign, house, and aspects. Note the dominant element and modality. Identify the most significant aspects — especially any tight conjunctions, squares, or oppositions involving personal planets.\n\nThen assess the current transits. What outer planets are aspecting their natal placements? What houses are being activated? What is their current profection year, and who is the Lord of the Year? What does the solar return chart reveal about the year's themes?\n\nWrite this analysis in clear, compassionate language. Avoid jargon where possible. When you use technical terms, explain them. Remember that the purpose is not to demonstrate your knowledge but to help the person understand themselves more deeply.",
      },
      {
        type: "text",
        title: "Part 2: Custom Tarot Spread and Reading",
        body: "Based on your chart analysis, design a custom tarot spread that addresses the person's most active themes. If their chart shows major career transits, include positions about vocation and purpose. If relationship themes dominate, design positions that explore partnership dynamics. Let the chart guide the spread — this is the integration in action.\n\nPerform the reading. Record each card and your interpretation in the context of both the spread position and the natal chart. Note where the tarot echoes the chart's themes and where it adds new information. The most powerful moments in an integrated reading are when the cards and the chart point to the same truth from different angles.\n\nUse everything you have learned: elemental resonance with the querent's dominant element, transit-triggered interpretation, house-based position meanings, and your own intuitive responses to the images.",
      },
      {
        type: "text",
        title: "Part 3: The Professional Report",
        body: "Write up the complete reading as a professional report. Structure it clearly: chart overview, current transits and timing, tarot spread description, card-by-card interpretation, and a synthesis that weaves all elements together into coherent guidance.\n\nThe synthesis section is the most important. It is where you demonstrate the skill that defines an Olivia Arcana practitioner: the ability to hold astrological precision and tarot symbolism in a single frame and communicate their combined insight in language that empowers rather than overwhelms.\n\nEnd the report with practical guidance — specific, actionable suggestions based on the reading. Not vague platitudes ('trust the process') but concrete recommendations ('the Saturn transit to your 10th house suggests spending the next six months restructuring your professional goals; the Eight of Pentacles in position three supports developing a specific new skill'). This is where the reading becomes useful in the person's daily life.\n\nDeliver the report to your participant. Ask for feedback. Did the reading resonate? Did it reveal something they had not seen? Did the guidance feel actionable? Their response is the final teacher.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Chart analysis", definition: "Big Three, chart ruler, dominant element/modality, significant aspects, current transits, profection year, solar return" },
          { term: "Custom spread design", definition: "Tarot positions derived from the chart's active themes — the chart tells you what to ask the cards" },
          { term: "Integrated interpretation", definition: "Reading each card through the lens of the natal chart and current transits, noting where systems converge" },
          { term: "Professional report", definition: "A structured written document: chart overview, transits, spread, card interpretations, synthesis, practical guidance" },
          { term: "Synthesis", definition: "The practitioner's core skill — weaving astrological and tarot insight into a single, coherent narrative" },
        ],
      },
      { type: "callout", style: "insight", body: "The capstone is not about perfection. It is about integration. A reading that skillfully weaves chart and cards — even if it misses some details — demonstrates more mastery than a technically correct but disconnected analysis. Trust your synthesis instinct. It has been developing throughout this entire curriculum." },
      { type: "callout", style: "tip", body: "Further Reading: 'The Inner Sky' by Steven Forrest and 'Seventy-Eight Degrees of Wisdom' by Rachel Pollack — the two foundational texts of this curriculum. Return to them as you prepare your capstone. Revisiting them now, with the knowledge you have accumulated, will reveal layers you missed the first time." },
    ],
    minutes: 25,
    takeaway: "The capstone project integrates everything: natal chart analysis, transit interpretation, custom tarot spread design, and a professional written report. It is the demonstration of your ability to synthesize astrology and tarot into coherent, compassionate, actionable guidance for a real person.",
  },
};

// ─── Fallback content generator from title and description ───

function generateFallbackContent(
  lessonTitle: string,
  lessonDescription: string,
): ConceptualEntry {
  return {
    sections: [
      {
        type: "text",
        title: lessonTitle,
        body: `${lessonDescription}\n\nThis lesson explores the concept in depth, providing the foundational understanding you need to apply this knowledge in practice. Whether you are working with your own chart, reading for others, or building a professional practice, the principles covered here are essential.`,
      },
      {
        type: "text",
        title: "Core Concepts",
        body: `Understanding ${lessonTitle.toLowerCase()} requires both intellectual study and experiential practice. The intellectual component involves learning the traditional meanings, correspondences, and techniques. The experiential component involves applying this knowledge to real charts and real situations until the patterns become intuitive.\n\nAs you study this material, keep your own chart or deck nearby. The best way to internalize abstract concepts is to immediately test them against your own experience. When a description resonates — when you think "yes, that is exactly how it works in my life" — you have gone from learning about astrology or tarot to understanding it.`,
      },
      {
        type: "text",
        title: "Practical Application",
        body: `The goal of this lesson is not just knowledge but competence. By the end, you should be able to identify and interpret this concept in a chart or reading context. Practice with multiple examples — your own placements, the charts of people you know, or the daily card draws you are building as a habit.\n\nRemember that mastery is not about memorizing definitions. It is about developing pattern recognition — the ability to see this concept at work in the wild and understand what it means for the person you are reading for.`,
      },
      {
        type: "callout",
        style: "tip",
        body: "Take notes as you study. Write down one personal insight from this lesson — something you recognized in your own chart or life. Personal connections are what transform information into wisdom.",
      },
    ],
    minutes: 12,
    takeaway: `Understanding ${lessonTitle.toLowerCase()} deepens your ability to read charts and connect with the symbolic language of astrology and tarot at a practical level.`,
  };
}

/**
 * Generate conceptual content for any lesson.
 * This is the FALLBACK generator — it handles anything not caught by
 * quiz-generator, practice, aspect-transit, or synastry-spread.
 */
export function generateConceptualContent(
  courseSlug: string,
  lessonSlug: string,
  lessonTitle: string,
  lessonDescription: string,
): LessonContent {
  // Direct match in content map
  const directMatch = CONTENT_MAP[lessonSlug];
  if (directMatch) {
    return {
      sections: directMatch.sections,
      estimatedMinutes: directMatch.minutes,
      keyTakeaway: directMatch.takeaway,
    };
  }

  // Pattern-based matching for sign lesson groups
  // Individual planet lessons (the-sun, the-moon, mercury, venus, mars, jupiter, saturn)
  const planetSlugs: Record<string, string> = {
    "the-sun": "Sun",
    "the-moon": "Moon",
    "mercury": "Mercury",
    "venus": "Venus",
    "mars": "Mars",
    "jupiter": "Jupiter",
    "saturn": "Saturn",
  };
  if (planetSlugs[lessonSlug]) {
    return {
      sections: [
        { type: "planet-profile", planet: planetSlugs[lessonSlug] },
        {
          type: "text",
          title: `Understanding ${planetSlugs[lessonSlug]} in Your Chart`,
          body: `${lessonDescription}\n\nTo find ${planetSlugs[lessonSlug]} in your chart, look for its glyph on the wheel. Note the sign it occupies (how it expresses) and the house it occupies (where it focuses). Then check what aspects it makes to other planets — these connections add layers of nuance to its expression in your life.`,
        },
        {
          type: "callout",
          style: "tip",
          body: `Write down your ${planetSlugs[lessonSlug]} sign and house. Reflect: does the description match your experience? Where do you see this energy showing up in your daily life?`,
        },
      ],
      estimatedMinutes: 15,
      keyTakeaway: `${planetSlugs[lessonSlug]} represents a core function of your psyche. Understanding its sign, house, and aspects reveals how that function operates uniquely in your life.`,
    };
  }

  // Individual house lessons
  const houseMatch = lessonSlug.match(/^house-(\d+)/);
  if (houseMatch) {
    const houseNum = parseInt(houseMatch[1], 10);
    if (houseNum >= 1 && houseNum <= 12) {
      return {
        sections: [
          { type: "house-profile", house: houseNum },
          {
            type: "text",
            title: lessonTitle,
            body: `${lessonDescription}\n\nThe ${houseNum}${houseNum === 1 ? "st" : houseNum === 2 ? "nd" : houseNum === 3 ? "rd" : "th"} house in your chart is colored by the sign on its cusp and any planets that occupy it. Even if this house is empty (no planets), its ruler — the planet that rules the sign on the cusp — still operates in your chart and influences this life area.`,
          },
          {
            type: "callout",
            style: "tip",
            body: `Look at your own chart. What sign is on the cusp of your ${houseNum}${houseNum === 1 ? "st" : houseNum === 2 ? "nd" : houseNum === 3 ? "rd" : "th"} house? Are there any planets here? The sign describes the style; the planets describe the actors in this life arena.`,
          },
        ],
        estimatedMinutes: 10,
        keyTakeaway: `The ${houseNum}${houseNum === 1 ? "st" : houseNum === 2 ? "nd" : houseNum === 3 ? "rd" : "th"} house represents a specific life domain. Understanding it in your chart reveals where and how these themes play out personally.`,
      };
    }
  }

  // Tarot card-pair lessons (fool-magician, high-priestess-empress, etc.)
  const cardPairSlugs: Record<string, string[]> = {
    "fool-magician": ["The Fool", "The Magician"],
    "high-priestess-empress": ["The High Priestess", "The Empress"],
    "emperor-hierophant": ["The Emperor", "The Hierophant"],
    "lovers-chariot": ["The Lovers", "The Chariot"],
    "strength-hermit": ["Strength", "The Hermit"],
    "wheel-justice": ["Wheel of Fortune", "Justice"],
    "hanged-man-death": ["The Hanged Man", "Death"],
    "temperance-devil": ["Temperance", "The Devil"],
    "tower-star": ["The Tower", "The Star"],
    "moon-sun": ["The Moon", "The Sun"],
    "judgement-world": ["Judgement", "The World"],
  };
  if (cardPairSlugs[lessonSlug]) {
    const [card1, card2] = cardPairSlugs[lessonSlug];
    return {
      sections: [
        {
          type: "text",
          title: lessonTitle,
          body: lessonDescription,
        },
        { type: "card-display", cardName: card1, showReversed: true },
        { type: "card-display", cardName: card2, showReversed: true },
        {
          type: "text",
          title: "The Pair as a Journey",
          body: `${card1} and ${card2} form a pair in the Fool's Journey — each teaching a lesson the other needs. Study them together to see how one naturally leads to the next. The tension and resolution between these two cards reflects a universal human experience.`,
        },
        {
          type: "callout",
          style: "tip",
          body: `After reading about both cards, close your eyes and imagine meeting each one as a character. What would they say to you? What advice would each offer? This exercise builds intuitive connection beyond book meanings.`,
        },
      ],
      estimatedMinutes: 15,
      keyTakeaway: `${card1} and ${card2} represent a paired teaching in the Major Arcana. Understanding them together reveals a deeper pattern than either card alone.`,
    };
  }

  // Suit lessons (wands-ace-to-five, cups-six-to-ten, etc.)
  const suitRangeMatch = lessonSlug.match(/^(wands|cups|swords|pentacles)-(\w+)-to-(\w+)$/);
  if (suitRangeMatch) {
    const suit = suitRangeMatch[1];
    const element = { wands: "Fire", cups: "Water", swords: "Air", pentacles: "Earth" }[suit] || "";
    return {
      sections: [
        {
          type: "text",
          title: lessonTitle,
          body: `${lessonDescription}\n\nThe ${suit.charAt(0).toUpperCase() + suit.slice(1)} correspond to the element of ${element}. As you move through the numbered cards, you trace a progression of that element's energy — from the pure potential of the Ace to the completion (or excess) of the Ten.`,
        },
        {
          type: "text",
          title: "Reading the Progression",
          body: `Each number carries universal meaning across all suits. Aces are beginnings, Twos are choices, Threes are expansion, Fours are stability, Fives are conflict, Sixes are harmony, Sevens are reflection, Eights are movement, Nines are near-completion, and Tens are culmination. Within the ${suit.charAt(0).toUpperCase() + suit.slice(1)}, these universal stages are colored by ${element} energy.`,
        },
        { type: "callout", style: "tip", body: "Lay out the cards in this lesson's range side by side. See how the imagery progresses. The visual story is often more memorable than the written meanings." },
      ],
      estimatedMinutes: 15,
      keyTakeaway: `The ${suit.charAt(0).toUpperCase() + suit.slice(1)} cards trace the journey of ${element} energy from inception to completion. Understanding the number progression gives you a framework for interpreting any pip card.`,
    };
  }

  // Court card group lessons (pages, knights, queens, kings)
  const courtSlugs = ["pages", "knights", "queens", "kings"];
  if (courtSlugs.includes(lessonSlug)) {
    const rank = lessonSlug.charAt(0).toUpperCase() + lessonSlug.slice(1);
    return {
      sections: [
        {
          type: "text",
          title: lessonTitle,
          body: `${lessonDescription}\n\nThe ${rank} appear across all four suits, bringing their particular stage of mastery to each element. A ${rank.slice(0, -1)} of Wands expresses differently than a ${rank.slice(0, -1)} of Cups — the rank is the same, but the element colors everything.`,
        },
        {
          type: "text",
          title: `The ${rank} Across Elements`,
          body: `Each ${rank.slice(0, -1)} carries the energy of their suit at this particular level of development. In readings, court cards can represent actual people, personality traits you are embodying, or energies entering your situation. Context determines which interpretation applies.\n\nWhen multiple ${rank.toLowerCase()} appear in a single reading, the element they share (or contrast) adds another layer of meaning. Two ${rank.toLowerCase()} of the same element amplify that energy; contrasting elements create dynamic tension.`,
        },
        { type: "callout", style: "tip", body: `Think of someone in your life who embodies each ${rank.slice(0, -1)}. Matching real people to court cards is one of the fastest ways to internalize their energy.` },
      ],
      estimatedMinutes: 12,
      keyTakeaway: `The ${rank} represent a stage of elemental mastery. They can appear as people, personality traits, or incoming energies depending on the reading context.`,
    };
  }

  // Catch-all: generate from title and description
  const fallback = generateFallbackContent(lessonTitle, lessonDescription);
  return {
    sections: fallback.sections,
    estimatedMinutes: fallback.minutes,
    keyTakeaway: fallback.takeaway,
  };
}
