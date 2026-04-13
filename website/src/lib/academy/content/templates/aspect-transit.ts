/**
 * aspect-transit.ts — Educational content for aspect and transit lessons
 *
 * Handles aspect lessons: conjunction, sextile, square, trine, opposition,
 * grand-trine, t-square, yod, grand-cross
 *
 * Handles transit lessons: jupiter-transits, saturn-return, eclipse-season, etc.
 */

import type { LessonContent, ContentSection } from "../types";

// ─── Aspect content ───

interface AspectData {
  title: string;
  degree: string;
  quality: string;
  sections: ContentSection[];
  minutes: number;
  takeaway: string;
}

const ASPECT_CONTENT: Record<string, AspectData> = {
  "conjunction": {
    title: "The Conjunction (0 degrees)",
    degree: "0",
    quality: "Fusion — the most powerful aspect",
    sections: [
      {
        type: "text",
        title: "What Is a Conjunction?",
        body: "A conjunction occurs when two planets occupy the same degree of the zodiac (or very close to it). This is the most powerful aspect in astrology because the energies of both planets merge into a single force. They no longer operate independently — they become one unified expression.\n\nThe nature of a conjunction depends entirely on which planets are involved. A Sun-Jupiter conjunction radiates optimism, generosity, and confidence. A Mars-Saturn conjunction creates a disciplined warrior — incredible persistence paired with strategic restraint. The planets do not just influence each other; they become inseparable.",
      },
      {
        type: "text",
        title: "How Conjunctions Manifest",
        body: "In a natal chart, conjunctions represent areas of concentrated energy. The house where the conjunction falls becomes a focal point of the life. People with conjunctions often feel that energy as so fundamental to who they are that they cannot separate the two functions.\n\nFor example, someone with Venus conjunct Mars in their chart may not be able to distinguish between love and desire — they are fused. Someone with Mercury conjunct Neptune may think in images and poetry rather than linear logic, because their mind and imagination are merged.\n\nConjunctions of outer planets with personal planets are particularly significant. Pluto conjunct the Sun transforms the ego at a fundamental level. Neptune conjunct Venus dissolves boundaries in love. Uranus conjunct Mercury produces a mind that thinks in lightning bolts.",
      },
      {
        type: "text",
        title: "Working With Conjunctions",
        body: "The gift of a conjunction is power through focus. The challenge is that it can create a blind spot — when two energies are fused, you may not see how they operate separately. Self-awareness comes from recognizing which planets are merged and how that fusion shapes your perception.\n\nIn transit, a conjunction marks a new beginning. When a transiting planet conjuncts a natal planet, it activates and renews that natal planet's function. Saturn conjunct natal Venus restructures how you love. Jupiter conjunct natal Mercury expands your thinking. The conjunction is always a reset point.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Degree", definition: "0 degrees (exact or within orb)" },
          { term: "Quality", definition: "Fusion and amplification" },
          { term: "Energy", definition: "Concentrated, powerful, unified" },
          { term: "Gift", definition: "Focused strength in one area" },
          { term: "Challenge", definition: "Blind spots from merged energies" },
          { term: "In transit", definition: "New cycle begins, reset point" },
        ],
      },
      { type: "callout", style: "tip", body: "When interpreting a conjunction, ask: how do these two planets become one voice? What does that unified voice say about the person? The answer is usually the most defining feature of the chart." },
    ],
    minutes: 12,
    takeaway: "Conjunctions fuse planetary energies into a single, powerful expression. They are the loudest voice in any chart and define the person's most concentrated strengths.",
  },

  "sextile": {
    title: "The Sextile (60 degrees)",
    degree: "60",
    quality: "Opportunity — gentle cooperation",
    sections: [
      {
        type: "text",
        title: "What Is a Sextile?",
        body: "The sextile connects planets that are 60 degrees apart — typically in signs of compatible elements (fire-air or earth-water). It is a harmonious aspect that represents opportunity, talent, and cooperative energy. Unlike the trine, which flows automatically, the sextile requires conscious effort to activate.\n\nThink of the sextile as an open door. The opportunity is there, the potential is real, but you must choose to walk through it. Sextiles reward initiative. They represent areas where life cooperates with your efforts — where a little push produces disproportionate results.",
      },
      {
        type: "text",
        title: "How Sextiles Manifest",
        body: "Sextiles are often underestimated because they are subtle. They do not create the dramatic tension of a square or the effortless flow of a trine. Instead, they quietly offer openings. A Mercury-Venus sextile gives social and communicative grace — but only when you engage in conversation. A Mars-Jupiter sextile provides confident, expansive energy for taking action — but you must actually act.\n\nIn a natal chart, multiple sextiles indicate someone with many latent talents that develop when pursued. The key word is 'potential.' Sextiles represent what you can become, not what you automatically are.",
      },
      {
        type: "text",
        title: "Working With Sextiles",
        body: "The best way to use sextiles is to notice them and consciously activate them. If you have a Moon-Jupiter sextile, your emotional generosity is a superpower — but only when you choose to express it. If you have a Sun-Uranus sextile, your originality is available whenever you dare to be different.\n\nIn transit, sextiles offer windows of opportunity. They are brief and easy to miss. When Jupiter sextiles your natal Venus, romance or creative opportunity knocks — but it will not break the door down. You have to open it.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Degree", definition: "60 degrees" },
          { term: "Quality", definition: "Harmonious but requires effort" },
          { term: "Energy", definition: "Cooperative, talented, promising" },
          { term: "Gift", definition: "Natural talent that develops with use" },
          { term: "Challenge", definition: "Easy to overlook or take for granted" },
          { term: "In transit", definition: "Brief windows of opportunity" },
        ],
      },
      { type: "callout", style: "tip", body: "Sextiles are your hidden advantages. They do not announce themselves — you have to look for them. Make a list of your sextiles and ask: which of these have I actively developed?" },
    ],
    minutes: 12,
    takeaway: "Sextiles represent potential that becomes real through conscious effort. They are opportunities waiting for you to say yes.",
  },

  "square": {
    title: "The Square (90 degrees)",
    degree: "90",
    quality: "Tension — the engine of growth",
    sections: [
      {
        type: "text",
        title: "What Is a Square?",
        body: "The square connects planets 90 degrees apart, placing them in signs that share the same modality but clash in element. Cardinal squares pit fire against water, earth against air. This creates friction — and friction creates heat, movement, and ultimately strength.\n\nSquares are the most dynamic aspect in astrology. They are uncomfortable, but that discomfort is productive. Every person who has achieved something remarkable has prominent squares in their chart. The tension demands resolution, and the effort to resolve it builds extraordinary capability.",
      },
      {
        type: "text",
        title: "How Squares Manifest",
        body: "A square creates an internal conflict between two parts of yourself that want different things. Mars square Saturn pits the drive to act against the need for caution — producing either paralysis or incredibly disciplined action. Venus square Pluto creates an intensity in love that oscillates between obsession and transformation.\n\nThe planets in a square are not enemies. They are more like two strong-willed colleagues forced to collaborate. At first, they clash. Over time, if you consciously work with the tension, they produce results neither could achieve alone. Squares are the aspect of mastery through struggle.",
      },
      {
        type: "text",
        title: "Working With Squares",
        body: "Do not try to eliminate the tension — learn to use it. People with Mars-Saturn squares who learn to channel the energy become unstoppable achievers. People with Moon-Uranus squares who accept their need for emotional freedom develop extraordinary emotional intelligence.\n\nIn transit, squares mark crises that force action. Saturn square natal Sun demands you prove your identity is real. Uranus square natal Venus disrupts relationships that have become stale. The crisis is not the enemy — stagnation is. Squares break you out of complacency and into growth.",
      },
      {
        type: "comparison-table",
        headers: ["Aspect", "Energy", "Action Required"],
        rows: [
          ["Square", "Tension, friction, drive", "Work through the conflict — do not avoid it"],
          ["Trine", "Ease, flow, comfort", "Avoid complacency — actively use the gift"],
          ["Opposition", "Awareness, polarity", "Integrate both sides instead of choosing one"],
        ],
      },
      { type: "callout", style: "insight", body: "Squares are the engine of your chart. They are not punishments — they are the muscles you build through resistance. Every great achievement in your life was probably driven by a square." },
    ],
    minutes: 15,
    takeaway: "Squares create the productive tension that drives growth, achievement, and mastery. They are challenging but ultimately the source of your greatest strength.",
  },

  "trine": {
    title: "The Trine (120 degrees)",
    degree: "120",
    quality: "Flow — natural ease and talent",
    sections: [
      {
        type: "text",
        title: "What Is a Trine?",
        body: "The trine connects planets 120 degrees apart — always in the same element. Fire trine fire, water trine water. Because the planets share the same elemental language, energy flows between them without friction. This is the aspect of natural talent, ease, and grace.\n\nTrines represent things that come so naturally to you that you may not even recognize them as special. A Sun-Moon trine gives an ease between identity and emotions — you feel at home in yourself. A Venus-Neptune trine gives an almost otherworldly romantic and creative sensitivity.",
      },
      {
        type: "text",
        title: "How Trines Manifest",
        body: "Trines are gifts, but gifts can go undeveloped. Because trine energy flows effortlessly, there is no friction to push you to develop it deliberately. Someone with a Mercury-Jupiter trine may be naturally brilliant but never discipline their thinking because learning comes too easily.\n\nThe paradox of the trine is that ease can become complacency. The most successful people often have a mix of trines and squares — the trine provides the talent, and the square provides the drive to develop it. A chart full of trines without squares can indicate someone with enormous potential who never fully activates it.",
      },
      {
        type: "text",
        title: "Working With Trines",
        body: "Consciously lean into your trines. Identify them, name the talent they represent, and deliberately practice it. A Moon-Venus trine means you have a natural gift for making people feel loved — invest in that gift. A Mars-Uranus trine means you have an instinctive ability to innovate under pressure — use it.\n\nIn transit, trines bring periods of flow and support. Jupiter trine natal Sun is one of the luckiest transits — confidence, opportunity, and expansion arrive naturally. Saturn trine natal Moon brings emotional stability and maturity. Trines are the universe saying yes.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Degree", definition: "120 degrees" },
          { term: "Quality", definition: "Harmonious, flowing, effortless" },
          { term: "Energy", definition: "Natural talent and grace" },
          { term: "Gift", definition: "Innate ability in the connected areas" },
          { term: "Challenge", definition: "Complacency from too much ease" },
          { term: "In transit", definition: "Support, luck, green lights" },
        ],
      },
      { type: "callout", style: "tip", body: "Your trines are so natural you might take them for granted. Ask people who know you well: what do I do effortlessly that impresses you? Their answer will point to your trines." },
    ],
    minutes: 12,
    takeaway: "Trines are your innate gifts — energy that flows without effort. The key is recognizing them and deliberately investing in their development.",
  },

  "opposition": {
    title: "The Opposition (180 degrees)",
    degree: "180",
    quality: "Awareness — the polarity dance",
    sections: [
      {
        type: "text",
        title: "What Is an Opposition?",
        body: "The opposition connects planets 180 degrees apart — placing them in opposite signs across the zodiac wheel. Aries-Libra, Taurus-Scorpio, Gemini-Sagittarius. Unlike squares, which create internal friction, oppositions create awareness through polarity. You are pulled between two equally valid but opposing needs.\n\nOppositions are the aspect of relationships and projection. Often, you identify strongly with one end of the opposition and project the other onto people around you. Someone with Sun opposite Moon may feel torn between their public identity and their private emotional needs.",
      },
      {
        type: "text",
        title: "How Oppositions Manifest",
        body: "Oppositions create a seesaw dynamic. You swing from one extreme to the other until you learn to hold both simultaneously. Venus opposite Saturn oscillates between longing for love and fearing commitment — until integration allows committed love that does not feel like a cage.\n\nOppositions are also the aspect most associated with relationship dynamics. The energies you project onto partners are often the unintegrated end of your own oppositions. If you have Mars opposite Neptune, you might attract partners who are either aggressively direct or dreamily passive — because those are both parts of you.",
      },
      {
        type: "text",
        title: "Working With Oppositions",
        body: "Integration is the goal. Not choosing one side over the other, but finding the point of balance where both needs are honored. This is a lifelong process. Moon opposite Pluto requires learning that emotional depth does not have to mean emotional control. Jupiter opposite Saturn requires balancing expansion with discipline.\n\nIn transit, oppositions bring confrontations with others that mirror internal conflicts. Saturn opposite natal Venus forces you to face relationship realities. When someone triggers your opposition, they are actually showing you a part of yourself that needs attention.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Degree", definition: "180 degrees" },
          { term: "Quality", definition: "Polarized, relational, see-saw" },
          { term: "Energy", definition: "Awareness, projection, balance-seeking" },
          { term: "Gift", definition: "Ability to see both sides of any issue" },
          { term: "Challenge", definition: "Swinging between extremes, projection" },
          { term: "In transit", definition: "Confrontations that reveal inner conflicts" },
        ],
      },
      { type: "callout", style: "insight", body: "The people who trigger you most are often activating the unintegrated end of your oppositions. Instead of blaming them, ask: what part of myself am I seeing in them?" },
    ],
    minutes: 12,
    takeaway: "Oppositions teach integration through awareness. The goal is not to pick a side, but to learn to hold both polarities as complementary truths.",
  },

  "grand-trine": {
    title: "The Grand Trine",
    degree: "120-120-120",
    quality: "Three planets in elemental harmony",
    sections: [
      {
        type: "text",
        title: "What Is a Grand Trine?",
        body: "A Grand Trine forms when three planets each trine the other two, creating an equilateral triangle in the chart. All three planets share the same element — fire, earth, air, or water — creating a closed circuit of harmonious energy.\n\nA Grand Trine in Fire (Aries-Leo-Sagittarius placements) indicates extraordinary creative confidence and initiative. A Grand Trine in Water (Cancer-Scorpio-Pisces) indicates profound emotional intelligence and intuitive depth. The energy circulates effortlessly between the three points.",
      },
      {
        type: "text",
        title: "The Gift and the Trap",
        body: "Grand Trines are often described as great luck — and they are. But they carry a subtle trap: the energy is so self-contained that it can create a comfort zone. Because everything flows easily in that element, there is no friction to push growth. Grand Trine natives may rest on their laurels, enjoying their talent without developing it.\n\nThe key is finding a way to direct the Grand Trine's energy outward. A planet outside the trine that aspects one of its points — especially by square or opposition — can serve as the motivational 'exit point' that channels all that talent into achievement.",
      },
      {
        type: "comparison-table",
        headers: ["Grand Trine Element", "Talent Area", "Complacency Risk"],
        rows: [
          ["Fire", "Creative confidence, leadership, vision", "Burnout from scattered enthusiasm"],
          ["Earth", "Material mastery, practical skill, building", "Over-comfort, resistance to change"],
          ["Air", "Intellectual brilliance, communication", "Detachment from emotional reality"],
          ["Water", "Emotional depth, intuition, healing", "Overwhelm, boundary dissolution"],
        ],
      },
      { type: "callout", style: "tip", body: "If you have a Grand Trine, look for squares or oppositions to its planets. These aspects provide the motivation to turn your natural talent into real-world achievement." },
    ],
    minutes: 12,
    takeaway: "Grand Trines represent exceptional natural talent in one element, but require conscious effort to avoid the complacency trap.",
  },

  "t-square": {
    title: "The T-Square",
    degree: "90-180-90",
    quality: "Dynamic tension aimed at an apex",
    sections: [
      {
        type: "text",
        title: "What Is a T-Square?",
        body: "A T-Square forms when two planets oppose each other (180 degrees) and a third planet squares both of them (90 degrees each). The apex planet — the one squaring both — receives the concentrated tension of the entire configuration and becomes the focal point of the chart.\n\nT-Squares are found in the charts of high achievers, driven leaders, and people who cannot sit still. The opposition creates a constant pull between two needs, and the apex planet is where all that tension channels into action. It is uncomfortable but extraordinarily productive.",
      },
      {
        type: "text",
        title: "Reading the Apex Planet",
        body: "The apex planet reveals where and how the person channels their drive. Mars at the apex creates relentless physical energy directed at a goal. Saturn at the apex produces a disciplined achiever who builds through persistent effort. Pluto at the apex channels tension into deep transformation and power.\n\nThe empty leg — the sign and house opposite the apex where no planet sits — represents the resolution point. If the T-Square's apex is in the 10th house, the empty point in the 4th house suggests that home, family, and emotional security hold the key to balancing the driven career energy.",
      },
      { type: "callout", style: "insight", body: "T-Squares are the aspect pattern of people who achieve under pressure. If you have one, embrace the drive rather than fighting it. The tension IS your fuel." },
    ],
    minutes: 12,
    takeaway: "T-Squares concentrate dynamic tension toward an apex planet, producing extraordinary drive and achievement when consciously directed.",
  },

  "yod-finger-of-god": {
    title: "The Yod (Finger of God)",
    degree: "150-150-60",
    quality: "Fated redirection toward purpose",
    sections: [
      {
        type: "text",
        title: "What Is a Yod?",
        body: "The Yod, sometimes called the Finger of God, forms when two planets sextile each other (60 degrees) and both form quincunxes (150 degrees) to a third planet — the apex. This creates a narrow, pointed triangle aimed at the apex planet.\n\nYods carry a quality of fate and redirection. The quincunx (150 degrees) is the most uncomfortable aspect — it connects signs with nothing in common, creating constant adjustment. When two quincunxes converge on a single point, the apex planet experiences ongoing pressure to redirect its energy.",
      },
      {
        type: "text",
        title: "How the Yod Manifests",
        body: "People with a Yod often describe feeling like they have a special purpose but cannot quite name it. Life repeatedly forces them into unexpected redirections — crises that seem to have no cause but ultimately push them toward something meaningful.\n\nThe apex planet of a Yod carries a sense of destiny. It represents a talent or calling that requires constant adjustment to fulfill. The two base planets (in sextile) represent resources and skills that support the apex — but the path is never straight. The Yod demands flexibility and faith.",
      },
      {
        type: "text",
        title: "Living With a Yod",
        body: "The Yod is activated strongly by transits. When a transiting planet opposes the apex (hitting the midpoint of the base sextile), the entire pattern fires up and a significant life redirection occurs. These are pivotal moments — the finger of fate points, and you must follow.\n\nAccepting the Yod means accepting that your path will not look like anyone else's. The constant adjustments are not failures; they are the path itself. The purpose reveals itself gradually, through a series of seemingly random turns that in retrospect form a perfectly coherent line.",
      },
      { type: "callout", style: "insight", body: "If you have a Yod, your life's path makes sense in reverse, not in advance. Trust the redirections. The finger is pointing you somewhere meaningful." },
    ],
    minutes: 12,
    takeaway: "The Yod carries a quality of fate, purpose, and constant redirection. Its challenge is trusting a path that only makes sense in hindsight.",
  },

  "grand-cross": {
    title: "The Grand Cross",
    degree: "90-90-90-90",
    quality: "Maximum tension, maximum potential",
    sections: [
      {
        type: "text",
        title: "What Is a Grand Cross?",
        body: "The Grand Cross (or Grand Square) forms when four planets create a cross pattern — each planet squares its two neighbors and opposes the planet directly across. This is the most tense major pattern in astrology, placing extreme pressure on all four points simultaneously.\n\nGrand Crosses typically occur in signs of the same modality. A Cardinal Grand Cross (Aries-Cancer-Libra-Capricorn) creates constant initiative and crisis. A Fixed Grand Cross (Taurus-Leo-Scorpio-Aquarius) creates immovable determination. A Mutable Grand Cross (Gemini-Virgo-Sagittarius-Pisces) creates restless adaptability.",
      },
      {
        type: "text",
        title: "Living With a Grand Cross",
        body: "People with Grand Crosses feel pulled in four directions simultaneously. There is no easy release point — every move triggers opposing tension. This sounds overwhelming, and it is. But it is also the configuration of people with extraordinary resilience, depth, and capability.\n\nThe Grand Cross demands that you develop all four areas simultaneously rather than retreating into one. A Cardinal Grand Cross person must learn to balance self (Aries), emotion (Cancer), partnership (Libra), and career (Capricorn) — neglecting any corner destabilizes the whole pattern.",
      },
      {
        type: "comparison-table",
        headers: ["Modality", "Quality", "Life Theme"],
        rows: [
          ["Cardinal", "Action pressure from all directions", "Constant initiative balanced with care for all life areas"],
          ["Fixed", "Immovable determination meeting immovable resistance", "Learning when to hold on and when to let go"],
          ["Mutable", "Scattered adaptability pulling in every direction", "Finding focus amidst constant change"],
        ],
      },
      { type: "callout", style: "insight", body: "The Grand Cross is astrology's heaviest lift — and people who carry it develop the most complete character. Your challenge is balance, not elimination." },
    ],
    minutes: 12,
    takeaway: "The Grand Cross creates maximum tension from four directions simultaneously, producing extraordinary resilience and the necessity of balanced development.",
  },
};

// ─── Transit content ───

interface TransitData {
  sections: ContentSection[];
  minutes: number;
  takeaway: string;
}

const TRANSIT_CONTENT: Record<string, TransitData> = {
  "jupiter-transits": {
    sections: [
      {
        type: "text",
        title: "Jupiter Transits: The Year of Expansion",
        body: "Jupiter spends approximately one year in each zodiac sign, making it the most personal of the social planets in terms of timing. When Jupiter transits a house in your chart, that life area expands — opportunities multiply, confidence grows, and doors open that were previously closed.\n\nJupiter transits are not automatic luck. They represent a period when the universe supports your effort more generously than usual. The person who takes action during a Jupiter transit gets far more than the person who simply waits for fortune to knock.",
      },
      {
        type: "text",
        title: "Jupiter Through the Houses",
        body: "Jupiter through the 1st house enhances your personal magnetism and confidence. Through the 2nd, your earning potential and self-worth expand. Through the 7th, partnerships flourish. Through the 10th, career recognition peaks.\n\nThe key is knowing which house Jupiter is transiting in your chart and consciously leaning into that domain. If Jupiter is transiting your 5th house, invest in creative projects, dating, and self-expression. If it is in your 9th, travel, study, and philosophical exploration are favored.",
      },
      {
        type: "text",
        title: "Jupiter Aspects to Natal Planets",
        body: "When transiting Jupiter makes major aspects to natal planets, those planetary functions expand. Jupiter conjunct natal Venus is one of the most fortunate transits for love and money. Jupiter trine natal Sun brings confidence and opportunity. Even Jupiter square natal Saturn — while it creates tension between expansion and restriction — ultimately pushes you to grow beyond self-imposed limits.\n\nJupiter returns to its natal position every 12 years (around ages 12, 24, 36, 48). Each Jupiter Return marks a new cycle of growth and vision. The themes of your natal Jupiter's sign and house become particularly relevant at these times.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Duration per sign", definition: "Approximately 1 year" },
          { term: "Full cycle", definition: "12 years (Jupiter Return)" },
          { term: "Quality", definition: "Expansion, luck, opportunity, growth" },
          { term: "Best use", definition: "Take action in the house Jupiter transits" },
          { term: "Risk", definition: "Overexpansion, overconfidence, excess" },
        ],
      },
    ],
    minutes: 12,
    takeaway: "Jupiter transits are your annual expansion cycle. Know which house it is in, lean into that life area, and the universe will meet your effort with disproportionate reward.",
  },

  "saturn-return": {
    sections: [
      {
        type: "text",
        title: "The Saturn Return: Your Cosmic Graduation",
        body: "The Saturn Return is the single most important transit in astrology. It occurs when transiting Saturn returns to the exact zodiac position it occupied at your birth — around ages 28-30, 57-59, and 86-88. The first Saturn Return is by far the most transformative because it marks the transition from youth to true adulthood.\n\nSaturn takes approximately 29.5 years to orbit the Sun. When it returns, it audits everything you have built during your twenties and demands that you get serious about your life. Relationships, careers, beliefs, and identities that are not authentically yours get dismantled. What remains is what is real.",
      },
      {
        type: "text",
        title: "What Happens During a Saturn Return",
        body: "The Saturn Return lasts approximately 2.5 years (including approach and departure). During this period, many people experience: career pivots or job loss that redirect their path, the end of relationships that were based on convenience rather than genuine compatibility, health wake-up calls that demand lifestyle changes, and a deep questioning of inherited beliefs and values.\n\nThe Saturn Return is not punishment — it is correction. Everything that falls away during this transit was not meant to be permanent. Everything that survives is your foundation for the next 29 years. The people who resist the Saturn Return suffer most; those who cooperate emerge stronger than they imagined possible.",
      },
      {
        type: "text",
        title: "Your Saturn Return by House and Sign",
        body: "Where Saturn sits in your natal chart determines the life area your Saturn Return focuses on. Saturn in the 7th house means your Saturn Return scrutinizes partnerships. Saturn in the 10th house means career becomes the crucible. The natal sign colors how you experience the restriction and restructuring.\n\nThe second Saturn Return (ages 57-59) is about legacy — what have you built, and what wisdom can you now pass on? The third Saturn Return (ages 86-88), for those who reach it, is about spiritual completion and acceptance.",
      },
      { type: "callout", style: "insight", body: "If you are between 27 and 31, you are in your Saturn Return. This is not the time to cling to what is falling apart — it is the time to build what is meant to last. Everything is happening on schedule." },
    ],
    minutes: 18,
    takeaway: "The Saturn Return is a rite of passage that dismantles what is inauthentic and rebuilds your life on solid foundations. It is the hardest and most important transit you will experience.",
  },

  "eclipse-cycles": {
    sections: [
      {
        type: "text",
        title: "Eclipses: Cosmic Catalysts",
        body: "Eclipses are the most dramatic events in the astrological calendar. Solar eclipses (New Moon conjunct a lunar node) mark powerful new beginnings. Lunar eclipses (Full Moon conjunct a lunar node) bring culminations, revelations, and endings.\n\nEclipses operate on a different timeline than regular lunations. Their effects can be felt up to six months before and after the event, and they often coincide with sudden, fated changes that feel like destiny rather than choice.",
      },
      {
        type: "text",
        title: "Eclipse Cycles and the Nodes",
        body: "Eclipses travel in pairs along the nodal axis, spending approximately 18 months in each pair of opposite signs. When eclipses activate a particular axis (say, Aries-Libra), the themes of those signs become collectively urgent — for the world and for anyone whose chart is touched.\n\nWhen an eclipse falls on or near a natal planet or angle in your chart, expect significant developments in that life area. These are not subtle influences — they are turning points. An eclipse on your Midheaven can bring career breakthroughs or crises. An eclipse on your natal Venus can transform your love life overnight.",
      },
      {
        type: "text",
        title: "Working With Eclipse Energy",
        body: "The traditional advice is to not force major decisions during eclipse season (two weeks around each eclipse). Instead, observe what unfolds. Eclipses have their own agenda — trying to control the outcome is like trying to direct a tidal wave. Let the eclipse reveal what needs to change, then act on the clarity that follows.\n\nKeep a journal during eclipse season. The themes that emerge will play out over the following six months, creating a story arc that connects one eclipse to the next.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Solar Eclipse", definition: "New beginnings, fresh starts, planting seeds" },
          { term: "Lunar Eclipse", definition: "Culminations, revelations, emotional release" },
          { term: "Nodal axis", definition: "18-month cycle through two opposite signs" },
          { term: "Orb of influence", definition: "Up to 6 months before and after" },
          { term: "Best approach", definition: "Observe during, act after clarity arrives" },
        ],
      },
    ],
    minutes: 15,
    takeaway: "Eclipses are cosmic catalysts that bring fated turning points. They operate on their own timeline — your job is to observe, allow, and then act on the clarity that follows.",
  },

  "saturn-transits": {
    sections: [
      {
        type: "text",
        title: "Saturn Transits: The Master Teacher",
        body: "Saturn spends roughly 2.5 years in each sign, and its transits are felt as periods of restructuring, testing, and maturation in the house it occupies. Saturn does not take away what is real — it removes what is not. The areas of life that Saturn touches become leaner, stronger, and more authentically yours.\n\nSaturn transits often begin with restriction or loss. A Saturn transit to the 2nd house may start with financial tightening. A Saturn transit to the 7th house may reveal the truth about a partnership. But by the end of the transit, the structure you have built is unshakeable.",
      },
      {
        type: "text",
        title: "Saturn Aspects to Natal Planets",
        body: "Saturn conjunct natal planets restructures that planetary function. Saturn conjunct your natal Sun is a test of your identity — are you living as yourself, or performing? Saturn conjunct your natal Moon is an emotional maturation — you learn what you genuinely need versus what you were conditioned to want.\n\nSaturn squares and oppositions are crisis points within the larger 29-year Saturn cycle. At the Saturn square (around age 7, 22, 36, 51), you face a decision point. At the Saturn opposition (around ages 14-15, 43-44), you face a reckoning with what you have built. These are not random — they are the architecture of growth.",
      },
      { type: "callout", style: "tip", body: "During Saturn transits, focus on what you can build, not what you are losing. Saturn rewards effort, patience, and honesty. Cut corners and Saturn will make you start over." },
    ],
    minutes: 15,
    takeaway: "Saturn transits restructure the life areas they touch, removing what is inauthentic and building what is meant to last. They reward patience, honesty, and hard work.",
  },

  "neptune-pluto-transits": {
    sections: [
      {
        type: "text",
        title: "Neptune Transits: Dissolution and Dreams",
        body: "Neptune spends roughly 14 years in each sign, making its transits slow and subtle. When Neptune transits a house in your chart, the boundaries of that life area soften. What was solid becomes fluid. What was certain becomes ambiguous. This can feel like confusion or loss of direction — but it is actually an invitation to see beyond the surface.\n\nNeptune conjunct a natal planet dissolves the ego structure around that planet's function. Neptune conjunct natal Sun can feel like an identity crisis — who are you when the persona dissolves? But it is also the transit that opens you to spiritual depth, artistic vision, and genuine compassion.",
      },
      {
        type: "text",
        title: "Pluto Transits: Death and Rebirth",
        body: "Pluto spends 12 to 30 years in each sign (depending on its elliptical orbit), making its personal transits rare and profound. When Pluto transits a natal planet or angle, expect total transformation of that life area. Nothing remains the same — and that is the point.\n\nPluto conjunct natal Venus transforms your relationships at the root level. Pluto conjunct natal Sun dismantles your identity so completely that you emerge as a fundamentally different person. These transits are often associated with loss, power struggles, and psychological crisis — but also with the most profound personal evolution.",
      },
      {
        type: "text",
        title: "Surviving and Thriving Through Outer Planet Transits",
        body: "The key to outer planet transits is surrender — not passive resignation, but active cooperation with forces larger than your ego. Neptune asks you to trust the fog. Pluto asks you to let the old self die. Both promise that what emerges will be more authentic and powerful than what was lost.\n\nTherapy, journaling, and spiritual practice are essential supports during intense outer planet transits. These are not periods for forced productivity — they are periods of deep inner work that reshapes you from the inside out.",
      },
      { type: "callout", style: "warning", body: "Outer planet transits are not subtle. If your life is undergoing seismic change, check whether Neptune or Pluto is aspecting a natal planet. Understanding the transit does not stop it, but it transforms blind suffering into conscious evolution." },
    ],
    minutes: 15,
    takeaway: "Neptune and Pluto transits are the deepest transformations astrology tracks. They dissolve and rebuild at the level of identity itself. Surrender is the only productive response.",
  },

  "transits-intro": {
    sections: [
      {
        type: "text",
        title: "What Are Transits?",
        body: "Transits are the real-time positions of the planets in the sky measured against your natal chart. Your natal chart is a fixed snapshot of the heavens at the moment you were born; transits are the living sky continuing to move through those same degrees. When a transiting planet forms an exact geometric angle — an aspect — to one of your natal planets, it activates that natal planet's themes and brings them into focus.\n\nRobert Hand, in his definitive reference 'Planets in Transit,' describes transits as the primary tool for understanding how planetary cycles unfold in an individual life. The natal chart shows potential; transits show timing. A natal Venus-Saturn square describes a lifelong tension between love and duty, but it is the transit of Saturn over natal Venus that triggers the specific year when that tension demands resolution.",
      },
      {
        type: "text",
        title: "Speed and Significance",
        body: "Not all transits carry equal weight. The speed of the transiting planet determines both the duration and the depth of its effect. The Moon moves through the entire zodiac in roughly 28 days, spending about two and a half days per sign — its transits color your mood for a few hours. Mercury, Venus, and Mars create effects lasting days to weeks. These fast-moving or 'inner' planets produce the day-to-day texture of life: a productive conversation, a romantic evening, a burst of motivation.\n\nThe outer planets — Jupiter, Saturn, Uranus, Neptune, and Pluto — move slowly enough to create effects lasting months or years. Saturn spends two and a half years per sign. Pluto can spend over two decades. When these slow-movers aspect your natal planets, they define entire chapters of your biography. A Pluto transit is not a bad week; it is a three-year metamorphosis.",
      },
      {
        type: "text",
        title: "Orbs and the Three-Hit Pattern",
        body: "An orb is the margin of inexactness allowed for a transit to be considered active. For outer planet transits, most practitioners use a tight orb of one degree — you begin to feel the transit as the transiting planet approaches within one degree of the exact aspect, and the effect fades as it separates beyond one degree. For inner planets, slightly wider orbs of two to three degrees are common because these bodies move fast enough that the window would otherwise be too narrow to observe.\n\nOuter planet transits frequently produce a three-hit pattern due to retrograde motion. The transiting planet crosses the sensitive natal degree moving direct, then stations retrograde and crosses it again in reverse, then turns direct a final time and crosses it once more. This creates three distinct waves: the first pass introduces the theme, the retrograde pass deepens and internalizes it, and the final direct pass integrates and resolves it. Some transits produce only one or two passes depending on the geometry, but the three-hit pattern is the signature rhythm of major outer planet transits.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Applying", definition: "A transiting planet moving toward an exact aspect to a natal planet — the influence is building" },
          { term: "Separating", definition: "A transiting planet moving away from an exact aspect — the influence is fading" },
          { term: "Station", definition: "When a planet appears to stop before changing direction (direct to retrograde or vice versa) — maximum intensity at that degree" },
          { term: "Direct", definition: "Normal forward motion through the zodiac" },
          { term: "Retrograde", definition: "Apparent backward motion — a planet revisiting degrees it already crossed" },
          { term: "Orb", definition: "The allowed margin of inexactness for an aspect (typically 1 degree for outer planets, 2-3 degrees for inner planets)" },
          { term: "Three-hit pattern", definition: "An outer planet crossing the same natal degree three times: direct, retrograde, direct again" },
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Planets in Transit' by Robert Hand remains the single most authoritative reference for transit interpretation. Hand provides delineations for every transiting planet aspecting every natal planet — it belongs on the shelf of every serious student." },
    ],
    minutes: 15,
    takeaway: "Transits are the real-time movements of planets measured against your birth chart. They activate natal themes according to precise timing, with outer planet transits defining life chapters through the signature three-hit pattern of direct, retrograde, and direct passes.",
  },

  "fast-transits": {
    sections: [
      {
        type: "text",
        title: "The Moon: Emotional Weather Every Two and a Half Days",
        body: "The transiting Moon is the fastest-moving body in astrology, changing signs approximately every two and a half days and completing a full circuit of your chart every 28 days. Its transits are fleeting but surprisingly potent because the Moon governs mood, instinct, and emotional receptivity. When the transiting Moon crosses your Ascendant, you feel emotionally visible. When it crosses your natal Saturn, a few hours of sobriety or melancholy wash through you.\n\nThe Moon's most important role in transit work is as a trigger. On its own, a lunar transit is minor — a passing mood, a craving, a nostalgic memory. But when the transiting Moon conjuncts a natal planet that is simultaneously being transited by a slow outer planet, it acts as the detonator. If Saturn has been transiting your natal Venus for months, the specific day that transit manifests most acutely — the argument, the realization, the decision — is often the day the transiting Moon conjuncts or opposes your natal Venus.",
      },
      {
        type: "text",
        title: "Mercury: The Mental Lens (3-4 Weeks Per Sign)",
        body: "Mercury spends three to four weeks in each sign under normal motion, though retrograde periods can extend its stay in a single sign to nearly ten weeks. Transiting Mercury colors how you think, communicate, and process information during its passage through each house of your chart. Mercury transiting your 3rd house sharpens everyday conversation and short-distance travel. Mercury transiting your 9th house turns your mind toward philosophy, publishing, or foreign cultures.\n\nMercury's aspects to natal planets produce specific mental effects. Mercury conjunct natal Mars makes your speech more direct and assertive — excellent for debates, dangerous for diplomacy. Mercury square natal Neptune creates a few days of foggy thinking or inspired creative writing, depending on how you channel it. Because Mercury moves quickly, these effects are brief but noticeable, especially in intellectual and communicative domains.",
      },
      {
        type: "text",
        title: "Venus and Mars: Desire and Drive",
        body: "Venus spends four to five weeks per sign, and its transits activate themes of love, beauty, pleasure, money, and social harmony. When Venus transits your 7th house, partnerships feel sweeter and social life flourishes. Venus conjunct natal Jupiter is one of the most pleasant brief transits — generosity, romantic warmth, and financial luck converge for a few days. Venus retrograde periods, occurring roughly every 18 months for about six weeks, bring ex-lovers, unresolved relationship questions, and reassessments of personal values.\n\nMars spends six to seven weeks per sign and brings energy, initiative, conflict, and physical drive. Mars transiting your 10th house puts fire behind your career ambitions. Mars conjunct natal Pluto is intense and potentially combative — power struggles surface, but so does extraordinary willpower. Mars retrograde, occurring approximately every two years for about ten weeks, is notorious for stalled projects, misdirected anger, and the need to rethink how you assert yourself.",
      },
      {
        type: "text",
        title: "Why Fast Transits Matter",
        body: "It is tempting to dismiss fast transits as trivial compared to the life-altering weight of Saturn or Pluto. But fast transits serve two critical functions. First, they are the timing mechanism within larger transits. A Saturn-Venus transit may last a year, but the specific weeks when it manifests most strongly are often when Mars or the Moon also aspect the same natal point, concentrating the energy. Robert Hand emphasizes this layering principle: major transits set the theme, and fast transits determine the day.\n\nSecond, fast transits activate natal aspect patterns. If you have a natal Moon-Pluto square, every time the transiting Sun, Mercury, Venus, or Mars crosses your natal Moon or Pluto, it temporarily activates that square's themes of emotional intensity, control, and transformation. Your natal chart is not static — it is a living instrument, and fast transits are the fingers playing it daily.",
      },
      {
        type: "comparison-table",
        headers: ["Planet", "Time Per Sign", "Full Cycle", "Core Themes"],
        rows: [
          ["Moon", "~2.5 days", "~28 days", "Mood, instinct, emotional needs, triggering outer transits"],
          ["Mercury", "3-4 weeks (up to 10 weeks with retrograde)", "~1 year", "Communication, thinking, learning, local travel"],
          ["Venus", "4-5 weeks (up to 4 months with retrograde)", "~1 year", "Love, beauty, money, social harmony, values"],
          ["Mars", "6-7 weeks (up to 6 months with retrograde)", "~2 years", "Energy, drive, conflict, ambition, physical vitality"],
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Planets in Transit' by Robert Hand covers all fast-planet transits in systematic detail. For the Moon as trigger, see Bernadette Brady's 'Predictive Astrology,' which demonstrates how lunar transits time the manifestation of slower planetary cycles." },
    ],
    minutes: 15,
    takeaway: "Fast-moving planets — the Moon, Mercury, Venus, and Mars — create the daily and weekly texture of life. Their most important role is triggering and timing the effects of slower, more significant outer planet transits.",
  },

  "uranus-transits": {
    sections: [
      {
        type: "text",
        title: "The Principle of Uranus: Awakening Through Disruption",
        body: "Uranus spends approximately seven years in each zodiac sign, meaning its transits to natal planets unfold over months and carry the force of genuine life disruption. Uranus is the planet of sudden awakening, liberation, and the destruction of outworn structures. Where Saturn builds walls, Uranus shatters them. Where Jupiter expands within existing frameworks, Uranus breaks the frame entirely and demands something new.\n\nLiz Greene, in 'The Outer Planets and Their Cycles,' describes Uranus as the force that liberates consciousness from patterns that have become prisons. Uranus transits do not ask whether you are ready. They arrive with the energy of lightning — sudden, illuminating, and impossible to ignore. The house Uranus transits in your chart becomes the area of life where you are forced to evolve beyond your comfort zone, often through events that feel shocking at first but liberating in retrospect.",
      },
      {
        type: "text",
        title: "Uranus to Natal Planets: Specific Signatures",
        body: "Uranus conjunct the natal Sun is an identity revolution. The self you have been performing — especially the version shaped by family expectation, social convention, or fear — gets dismantled so the authentic self can emerge. Career changes, radical lifestyle shifts, and sometimes dramatic alterations in appearance mark this transit. It is exhilarating and destabilizing in equal measure.\n\nUranus conjunct the natal Moon brings emotional liberation or upheaval, often both. Domestic situations change suddenly — moves, family restructuring, the end of living arrangements that have become emotionally stale. The emotional patterns inherited from childhood get disrupted so that genuinely personal emotional needs can be recognized. Uranus conjunct natal Venus is the transit of sudden romantic change: love at first sight, abrupt breakups, attraction to people who shatter your 'type.' It rewires what you want by showing you that what you thought you wanted was someone else's template.",
      },
      {
        type: "text",
        title: "The Uranus Opposition: The Midlife Awakening",
        body: "The most significant Uranus transit most people will experience is the Uranus opposition, occurring around age 40 to 42, when transiting Uranus opposes its own natal position. This is the astrological foundation of the 'midlife crisis' — though 'midlife awakening' is more accurate. At this age, the unlived life demands attention. Everything you set aside in your twenties and thirties — suppressed desires, abandoned creative dreams, unacknowledged truths about who you are — rises to the surface and insists on being heard.\n\nThe Uranus opposition separates people who will spend the second half of life in authentic self-expression from those who will double down on convention out of fear. People who cooperate with this transit — who make the brave changes, who follow the inner lightning — often describe the years following the Uranus opposition as the most alive period of their entire lives. The conventional markers of crisis (divorce, career upheaval, relocation) are often the birth pangs of a more genuine existence.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Uranus square natal Uranus (~age 21)", definition: "First major break from family identity — declaring independence, often through rebellious choices" },
          { term: "Uranus trine natal Uranus (~age 28)", definition: "Creative integration of individuality with the structures you are building (overlaps with Saturn Return)" },
          { term: "Uranus opposition natal Uranus (~age 42)", definition: "The midlife awakening — the unlived life demands expression, the most powerful Uranus transit" },
          { term: "Uranus trine natal Uranus (~age 56)", definition: "A second harmonious wave of liberation — reinvention without the crisis energy of the opposition" },
          { term: "Uranus square natal Uranus (~age 63)", definition: "A later-life push toward authenticity, often coinciding with retirement or major lifestyle redesign" },
          { term: "Uranus return (~age 84)", definition: "Full completion of the Uranus cycle — radical freedom in old age, if one has cooperated with the earlier transits" },
        ],
      },
      { type: "callout", style: "insight", body: "Uranus transits feel like disruption, but they are actually liberation. The question is never whether change will come — it always does — but whether you will ride the lightning or be struck by it. Cooperate with Uranus and it makes you more yourself. Resist it and it breaks down walls by force." },
      { type: "callout", style: "tip", body: "Further Reading: Liz Greene's 'The Outer Planets and Their Cycles' provides the most psychologically sophisticated treatment of Uranus transits. Robert Hand's 'Planets in Transit' offers specific delineations for Uranus aspecting each natal planet." },
    ],
    minutes: 18,
    takeaway: "Uranus transits bring sudden awakening, liberation, and the dismantling of outworn structures. The Uranus opposition around age 42 is the most significant — the midlife awakening that separates authentic living from mere convention.",
  },

  "retrograde-transits": {
    sections: [
      {
        type: "text",
        title: "What Retrograde Motion Actually Is",
        body: "Retrograde motion is an optical illusion created by the relative speeds and positions of planets in their orbits around the Sun. When a faster-moving planet overtakes a slower one (or Earth overtakes an outer planet), the slower planet appears to move backward against the backdrop of the zodiac. It is not actually reversing course — but from the perspective of astrological symbolism, the apparent reversal carries real meaning.\n\nIn transit work, retrograde motion matters because it causes a transiting planet to cross the same degrees of the zodiac three times: once moving direct (forward), once moving retrograde (apparently backward), and once more moving direct after stationing. This creates the three-hit pattern that defines how outer planet transits actually unfold in lived experience. Without retrograde motion, Saturn would cross your natal Venus once and move on. With it, Saturn crosses that degree, backs up over it, and crosses it a third time — giving you three distinct encounters with the same essential lesson.",
      },
      {
        type: "text",
        title: "The Three Passes: How Major Transits Unfold",
        body: "The first pass occurs while the transiting planet moves direct. This is the introduction — the initial encounter with the transit's theme. Events during the first pass often feel external: something happens to you. A relationship challenge arises. A career opportunity appears. A health issue surfaces. You become aware of the theme, but you may not yet understand its deeper significance.\n\nThe second pass occurs during retrograde motion. The transiting planet retraces its steps and crosses the natal degree again, this time moving backward. The energy turns inward. What was external during the first pass becomes internal during the second. You review, reassess, and reprocess the theme. Old memories surface. Patterns that were invisible become visible. The retrograde pass is where the real psychological work happens — it is less about events and more about understanding.\n\nThe third and final pass occurs after the planet stations direct again. This is integration. The theme that was introduced in the first pass and internalized in the second pass now resolves. Decisions made during the third pass tend to stick because they incorporate both the external reality and the internal understanding. Not every transit produces all three passes — the geometry of the retrograde loop and the natal degree must align — but when all three occur, the progression from awareness through review to integration is unmistakable.",
      },
      {
        type: "text",
        title: "Stations: The Moments of Maximum Intensity",
        body: "A planetary station — the point where a planet appears to stop before changing direction — is the most intense phase of any retrograde cycle. When a transiting planet stations directly on or within a degree of a natal planet, the effect is concentrated with extraordinary power. The planet hovers at that degree for days or even weeks, hammering the natal point with sustained intensity rather than the brief contact of a normal transit pass.\n\nBernadette Brady emphasizes in 'Predictive Astrology' that stations are the single most important factor in determining when a transit will manifest most powerfully. If Saturn stations retrograde at 15 degrees Scorpio and your natal Moon is at 15 degrees Scorpio, the week of that station will be the emotional epicenter of the entire Saturn-Moon transit — more impactful than any of the three exact passes. Always check whether a transiting planet stations near a natal planet. Those stations mark the pivotal moments.",
      },
      { type: "callout", style: "insight", body: "The retrograde pass is often the most psychologically intense of the three encounters. During the direct passes, events are happening and you are responding. During the retrograde pass, nothing new may be happening externally, but internally the transit is doing its deepest work. Dreams become vivid. Old wounds resurface. Understanding arrives not through new information but through seeing old information differently. If a transit feels heaviest during its retrograde phase, that is not a sign something is wrong — it is a sign the real transformation is underway." },
      { type: "callout", style: "tip", body: "Further Reading: Bernadette Brady's 'Predictive Astrology' provides the clearest technical explanation of retrograde transit mechanics and the three-hit pattern. Robert Hand's 'Planets in Transit' discusses the experiential quality of each pass for every major transit combination." },
    ],
    minutes: 15,
    takeaway: "Retrograde motion creates the three-hit pattern that defines major transits: introduction (direct), internalization (retrograde), and integration (direct again). Planetary stations — when a transiting planet appears to stop on a natal degree — mark the moments of maximum intensity.",
  },

  "secondary-progressions": {
    sections: [
      {
        type: "text",
        title: "The Day-for-a-Year Principle",
        body: "Secondary progressions are the most widely used progression technique in Western astrology, based on a principle as old as the Ptolemaic tradition: one day of planetary motion after birth equals one year of life. Your first day of life maps to your first year. Your thirtieth day of life maps to your thirtieth year. The planetary positions on the thirtieth day after you were born form your progressed chart for age thirty.\n\nThis is not metaphorical. The actual ephemeris positions of the planets on day thirty after your birth are calculated and superimposed on your natal chart to create the progressed chart. Because the planets move relatively short distances in a single day, progressions are subtle — they describe the slow internal evolution of the psyche rather than the dramatic external events associated with transits. Robert Hand draws the distinction cleanly: transits show what is happening to you; progressions show who you are becoming.",
      },
      {
        type: "text",
        title: "The Progressed Sun and Progressed Moon",
        body: "The progressed Sun is the anchor of the progressed chart. It moves approximately one degree per year — roughly one sign every thirty years. When your progressed Sun changes sign, your entire sense of identity shifts. Someone born with Sun in Aries whose progressed Sun enters Taurus around age thirty begins to feel a profound change from impulsive initiative to patient consolidation. This is not an event; it is a gradual metamorphosis in who you experience yourself to be.\n\nThe progressed Moon is the fastest-moving body in the progressed chart, changing signs approximately every two and a half years and completing a full cycle of the zodiac in roughly twenty-seven years. The progressed Moon's sign and house placement describes your current emotional climate — what you need, what feeds you, where your feelings are focused. When the progressed Moon enters your 4th house, home and family matters dominate your emotional world for the next two and a half years. When it enters your 10th house, career ambitions and public standing absorb your emotional energy.",
      },
      {
        type: "text",
        title: "The Progressed New Moon: A Personal Renaissance",
        body: "The most significant event in the progressed lunar cycle is the progressed New Moon — the moment when the progressed Sun and progressed Moon form an exact conjunction. This occurs approximately every thirty years (since the progressed Moon laps the progressed Sun once per cycle) and marks the most significant personal new beginning available in the progressed chart.\n\nBernadette Brady, in 'Predictive Astrology,' describes the progressed New Moon as a personal renaissance — a seed moment when the entire direction of life can shift. The house and sign of the progressed New Moon indicate where and how this new chapter begins. People often experience the progressed New Moon as a period of intense new vision: a creative project that defines the next decade, a relationship that restructures everything, a spiritual awakening that reorients life's purpose. The progressed Full Moon, occurring roughly fifteen years later, brings that seed to fruition — the harvest of whatever was planted at the New Moon.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Secondary progressions", definition: "A day-for-a-year symbolic timing technique — each day after birth maps to one year of life" },
          { term: "Progressed Sun", definition: "Moves ~1 degree per year, changes sign every ~30 years — tracks deep identity evolution" },
          { term: "Progressed Moon", definition: "Changes sign every ~2.5 years, full cycle in ~27 years — tracks emotional chapters" },
          { term: "Progressed New Moon", definition: "Sun-Moon conjunction in the progressed chart (~every 30 years) — the most powerful personal new beginning" },
          { term: "Progressed Full Moon", definition: "Sun-Moon opposition in the progressed chart — harvest and culmination of the New Moon cycle" },
          { term: "Progressed angles", definition: "The progressed Ascendant and Midheaven shift slowly, marking evolution in self-presentation and life direction" },
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: Bernadette Brady's 'Predictive Astrology' provides the most systematic treatment of secondary progressions and the progressed lunar cycle. Robert Hand's 'Planets in Composite' and his lectures on progressions offer additional depth. For the progressed Moon through the houses, see 'Predictive Astrology' chapters on the progressed lunar phase cycle." },
    ],
    minutes: 15,
    takeaway: "Secondary progressions use the day-for-a-year principle to map the slow internal evolution of the psyche. The progressed Sun tracks identity shifts across decades, the progressed Moon tracks emotional chapters every two and a half years, and the progressed New Moon marks the most powerful personal new beginning in the entire system.",
  },

  "solar-returns": {
    sections: [
      {
        type: "text",
        title: "What Is a Solar Return Chart?",
        body: "A solar return chart is cast for the exact moment the transiting Sun returns to the precise degree, minute, and second of its natal position — your true astrological birthday, which may fall a day before or after your calendar birthday. This chart maps the themes, challenges, and opportunities of the coming year, from one birthday to the next.\n\nSolar returns are one of the oldest predictive techniques in astrology, with roots traceable to the Persian and Arabic medieval traditions. The principle is elegant: the moment the Sun completes its annual cycle and returns to its birth position, the sky at that moment becomes the blueprint for the year ahead. The solar return chart is read as a standalone chart, but always in reference to the natal chart — it shows how this year's planetary configurations interact with your lifelong patterns.",
      },
      {
        type: "text",
        title: "Key Factors in Solar Return Interpretation",
        body: "The solar return Ascendant is the face of the year — it determines the overall tone and approach. A solar return with Aries rising brings a year of initiative and self-assertion. A solar return with Pisces rising brings a year of surrender, spiritual growth, and boundary dissolution. The solar return Moon is the emotional theme — its sign and house show where your feelings will be most engaged and what you will need emotionally that year.\n\nPlanets in angular houses (1st, 4th, 7th, 10th) of the solar return chart are the dominant forces of the year. Saturn angular in the solar return demands hard work, maturation, and restructuring in the angular house's domain. Jupiter angular brings expansion and opportunity. Mars angular brings conflict, energy, and initiative. The more planets occupying angular houses, the more eventful and externally active the year will be. Planets in cadent houses (3rd, 6th, 9th, 12th) suggest a year more focused on inner work, preparation, and behind-the-scenes development.",
      },
      {
        type: "text",
        title: "Location and the Solar Return",
        body: "One of the most debated topics in solar return practice is the question of location. The solar return chart can be calculated for the location where you physically are at the exact moment of the Sun's return, or for your birthplace. Some astrologers argue that your birthplace chart is the 'true' solar return because the natal chart is permanently tied to birth coordinates. Others, including Mary Shea in 'Planets in Solar Returns,' argue that where you are on your birthday shapes the year ahead — and that intentionally traveling for your solar return can shift the house placements to produce a more favorable chart.\n\nIn practice, many astrologers calculate both and compare. The birthplace chart shows the baseline themes; the relocation chart shows how the experience of the year is modified by where you are. Whether or not relocation changes the fundamental themes, it undeniably changes the house cusps and angles, which shifts emphasis. Some people travel every year to optimize their solar return — a practice that remains controversial but has a dedicated following.",
      },
      {
        type: "keyword-map",
        items: [
          { term: "Solar return", definition: "A chart cast for the exact moment the Sun returns to its natal position each year" },
          { term: "SR Ascendant", definition: "The rising sign of the solar return — sets the tone and approach for the year" },
          { term: "SR Moon", definition: "The emotional theme of the year — its sign, house, and aspects are critical" },
          { term: "Angular planets", definition: "Planets in SR 1st, 4th, 7th, or 10th house — the dominant forces of the year" },
          { term: "Locational SR", definition: "A solar return calculated for where you are on your birthday rather than your birthplace" },
          { term: "SR Saturn", definition: "Where restructuring and hard lessons focus during the year" },
          { term: "SR Jupiter", definition: "Where expansion and opportunity concentrate during the year" },
        ],
      },
      { type: "callout", style: "tip", body: "Further Reading: 'Planets in Solar Returns' by Mary Shea is the standard modern reference for solar return interpretation. For the traditional roots of the technique, see Abu Ma'shar's work on annual revolutions, discussed in Benjamin Dykes's translations of medieval astrological texts." },
    ],
    minutes: 15,
    takeaway: "The solar return chart is cast for the exact moment the Sun returns to its natal position each year and maps the themes of the coming twelve months. The SR Ascendant sets the year's tone, the SR Moon reveals the emotional theme, and angular planets indicate where the year's most significant events will concentrate.",
  },

  "profections": {
    sections: [
      {
        type: "text",
        title: "The Simplest Timing Technique in Astrology",
        body: "Annual profections are the most elegant timing technique in the Hellenistic tradition — and arguably the most underrated tool in all of astrology. The principle is disarmingly simple: at birth, the 1st house is activated. On your first birthday, the activated house advances to the 2nd. On your second birthday, to the 3rd. Each year, one house forward. At age twelve, you return to the 1st house, and the twelve-year cycle begins again.\n\nThis technique comes from Vettius Valens, a second-century astrologer whose 'Anthology' is one of the most important surviving texts of Hellenistic astrology. Chris Brennan, in 'Hellenistic Astrology: The Study of Fate and Fortune,' has done more than any modern author to revive and systematize profections for contemporary practice. The beauty of the technique is that it requires no calculation beyond counting — and yet it produces startlingly accurate results when combined with transits.",
      },
      {
        type: "text",
        title: "The Lord of the Year",
        body: "The real power of profections lies not just in knowing which house is activated, but in identifying the Lord of the Year — the planet that rules the sign on the cusp of the profected house. If you are in a 10th house profection year and your 10th house cusp is Capricorn, Saturn is your Lord of the Year. This means Saturn's condition in your natal chart and its transits during the year become disproportionately significant.\n\nWhen the Lord of the Year is well-placed natally — in a sign it rules or is exalted in, in an angular house, making favorable aspects — the year tends to be productive and supportive in the profected house's domain. When the Lord of the Year is challenged natally — in detriment or fall, in a cadent house, afflicted by malefics — the year brings more difficulty in that domain. And crucially, any transit to the Lord of the Year during the profection year is amplified. A Jupiter transit to your Lord of the Year is a major opportunity. A Saturn transit to your Lord of the Year is a major test.",
      },
      {
        type: "text",
        title: "Profections in Practice",
        body: "The practical genius of profections is how they narrow the field. Without profections, every transit matters equally — and predicting outcomes becomes impossibly broad. With profections, you know which planet matters most this year (the Lord of the Year), which life area is emphasized (the profected house), and which transits to prioritize (those aspecting the Lord of the Year). This focus transforms transit interpretation from a scattered overview into a precise forecast.\n\nConsider someone at age 27, in a 4th house profection year. The 4th house governs home, family, roots, and private life. If their 4th house cusp is Leo, the Sun is their Lord of the Year. Every transit to their natal Sun during that year is amplified in significance. A Saturn square to the natal Sun that year could bring a family crisis or a move. A Jupiter trine to the natal Sun could bring a joyful expansion of home life. Without the profection framework, those same transits might manifest more diffusely. With it, they concentrate in the 4th house domain with notable precision.",
      },
      {
        type: "comparison-table",
        headers: ["Age", "Profected House", "Life Domain Emphasized"],
        rows: [
          ["0, 12, 24, 36", "1st House", "Self, identity, body, personal initiative"],
          ["1, 13, 25, 37", "2nd House", "Money, possessions, self-worth, resources"],
          ["2, 14, 26, 38", "3rd House", "Communication, siblings, local environment, learning"],
          ["3, 15, 27, 39", "4th House", "Home, family, roots, private life, parents"],
          ["4, 16, 28, 40", "5th House", "Creativity, romance, children, pleasure, self-expression"],
          ["5, 17, 29, 41", "6th House", "Health, work, daily routines, service, improvement"],
          ["6, 18, 30, 42", "7th House", "Partnerships, marriage, contracts, open enemies"],
          ["7, 19, 31, 43", "8th House", "Shared resources, transformation, death, intimacy"],
          ["8, 20, 32, 44", "9th House", "Higher education, travel, philosophy, law, publishing"],
          ["9, 21, 33, 45", "10th House", "Career, public reputation, authority, achievement"],
          ["10, 22, 34, 46", "11th House", "Friends, groups, hopes, community, social networks"],
          ["11, 23, 35, 47", "12th House", "Solitude, hidden matters, spirituality, self-undoing"],
        ],
      },
      { type: "callout", style: "insight", body: "Profections explain why the same transit hits differently at different ages. Saturn conjunct your natal Sun at age 29 (a 6th house profection year, health and work focus) will manifest differently than Saturn conjunct your natal Sun at age 33 (a 10th house profection year, career focus). The transit is the same; the profection context changes everything." },
      { type: "callout", style: "tip", body: "Further Reading: Chris Brennan's 'Hellenistic Astrology: The Study of Fate and Fortune' provides the authoritative modern treatment of annual profections and the Lord of the Year. For the original source, see Vettius Valens's 'Anthology,' available in Mark Riley's translation." },
    ],
    minutes: 18,
    takeaway: "Annual profections activate one house per year of life in a twelve-year cycle, making the ruler of the profected house the Lord of the Year — the planet whose natal condition and transits matter most. This Hellenistic technique transforms transit interpretation from scattered to precise.",
  },
};

/**
 * Generate aspect or transit educational content.
 * Returns null if the lesson slug does not match.
 */
export function generateAspectTransitContent(
  lessonSlug: string,
  locale: string = "en",
): LessonContent | null {
  // Check aspects
  const aspectData = ASPECT_CONTENT[lessonSlug];
  if (aspectData) {
    return {
      sections: [
        { type: "aspect-visualizer" } as ContentSection,
        ...aspectData.sections,
      ],
      estimatedMinutes: aspectData.minutes,
      keyTakeaway: aspectData.takeaway,
    };
  }

  // Check transits
  const transitData = TRANSIT_CONTENT[lessonSlug];
  if (transitData) {
    return {
      sections: transitData.sections,
      estimatedMinutes: transitData.minutes,
      keyTakeaway: transitData.takeaway,
    };
  }

  return null;
}
