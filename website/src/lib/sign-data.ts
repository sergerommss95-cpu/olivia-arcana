/**
 * sign-data.ts — Rich content for each of the 12 zodiac signs
 *
 * Used by /signs/[sign] pages for SEO-rich sign detail pages.
 * Each sign has: description, element analysis, famous people,
 * compatibility overview, ruling planet deep-dive, season, body parts,
 * tarot card, crystal/stone, best careers, shadow traits.
 */

export interface SignPage {
  name: string;
  glyph: string;
  dateRange: string;
  element: string;
  modality: string;
  ruler: string;
  rulerGlyph: string;
  season: string;
  tarotCard: string;
  bodyParts: string;
  crystal: string;
  metal: string;
  motto: string;
  description: string;
  elementAnalysis: string;
  rulerDeepDive: string;
  lightTraits: string[];
  shadowTraits: string[];
  bestCareers: string[];
  compatBest: string[];
  compatChallenge: string[];
  famousPeople: string[];
}

export const SIGN_PAGES: Record<string, SignPage> = {
  aries: {
    name: "Aries", glyph: "♈", dateRange: "March 21 — April 19",
    element: "Fire", modality: "Cardinal", ruler: "Mars", rulerGlyph: "♂",
    season: "Spring (Beginning)", tarotCard: "The Emperor",
    bodyParts: "Head, face, brain", crystal: "Diamond", metal: "Iron",
    motto: "I Am",
    description: "Aries is the first sign of the zodiac — the cosmic pioneer, the initiator, the spark that lights every fire. Ruled by Mars, the planet of action and desire, Aries energy is direct, courageous, and unapologetically bold. This is the sign that charges forward when others hesitate, that sees a mountain and starts climbing before asking if there's a path.",
    elementAnalysis: "As the Cardinal Fire sign, Aries doesn't just carry fire — it starts fires. This is initiatory energy at its purest: the spark of inspiration, the first burst of motivation, the ignition that creates something from nothing. While Leo sustains fire and Sagittarius spreads it, Aries strikes the match.",
    rulerDeepDive: "Mars gives Aries its warrior spirit, competitive drive, and physical vitality. In mythology, Mars was not just the god of war but also of agriculture — destruction AND creation. This duality lives in every Aries: the capacity to tear down what doesn't work and immediately build something better.",
    lightTraits: ["Courageous pioneer who leads by example", "Infectious enthusiasm that motivates others", "Honest and direct — you always know where you stand", "Quick decision-maker who acts on instinct", "Fiercely loyal protector of those they love"],
    shadowTraits: ["Impatience that sabotages long-term goals", "Competitive streak that turns allies into rivals", "Difficulty finishing what they start", "Anger that flares hot and fast"],
    bestCareers: ["Entrepreneur / Startup founder", "Military / Law enforcement", "Emergency medicine / Surgery", "Athletic coaching", "Sales leadership"],
    compatBest: ["Leo", "Sagittarius", "Aquarius", "Gemini"],
    compatChallenge: ["Cancer", "Capricorn"],
    famousPeople: ["Lady Gaga", "Leonardo da Vinci", "Maya Angelou", "Robert Downey Jr.", "Aretha Franklin"],
  },
  taurus: {
    name: "Taurus", glyph: "♉", dateRange: "April 20 — May 20",
    element: "Earth", modality: "Fixed", ruler: "Venus", rulerGlyph: "♀",
    season: "Spring (Middle)", tarotCard: "The Hierophant",
    bodyParts: "Throat, neck, vocal cords", crystal: "Emerald", metal: "Copper",
    motto: "I Have",
    description: "Taurus is the zodiac's master builder — patient, sensual, and unshakeable once committed. Ruled by Venus, the planet of beauty and value, Taurus understands that the most precious things in life require time, care, and devotion. This is the sign that plants seeds and actually waits for them to grow.",
    elementAnalysis: "As the Fixed Earth sign, Taurus is the most grounded, stable energy in the zodiac. Where Capricorn climbs and Virgo refines, Taurus simply endures. This is bedrock energy — reliable, fertile, and incredibly strong when rooted.",
    rulerDeepDive: "Venus blesses Taurus with an innate appreciation for beauty, comfort, and sensory pleasure. But Venus in Taurus is not frivolous — it's Venus at her most substantial. This is the love of real things: good food, beautiful spaces, meaningful investments, enduring relationships.",
    lightTraits: ["Unshakeable reliability — the person everyone counts on", "Refined taste and aesthetic sensibility", "Patient builder who creates lasting value", "Deep loyalty and devotion in relationships", "Physical groundedness and connection to nature"],
    shadowTraits: ["Stubbornness that resists necessary change", "Possessiveness in love and material things", "Resistance to risk that limits growth", "Overindulgence in comfort and pleasure"],
    bestCareers: ["Finance / Investment banking", "Architecture / Interior design", "Culinary arts / Winemaking", "Music / Vocal performance", "Real estate"],
    compatBest: ["Virgo", "Capricorn", "Cancer", "Pisces"],
    compatChallenge: ["Leo", "Aquarius"],
    famousPeople: ["Adele", "Shakespeare", "Audrey Hepburn", "Dwayne Johnson", "Queen Elizabeth II"],
  },
  gemini: {
    name: "Gemini", glyph: "♊", dateRange: "May 21 — June 20",
    element: "Air", modality: "Mutable", ruler: "Mercury", rulerGlyph: "☿",
    season: "Spring (End)", tarotCard: "The Lovers",
    bodyParts: "Arms, hands, lungs", crystal: "Agate", metal: "Mercury",
    motto: "I Think",
    description: "Gemini is the zodiac's eternal student and communicator — curious, versatile, and endlessly fascinating. Ruled by Mercury, the planet of intellect and exchange, Gemini processes life through ideas, words, and connections. This is the sign that sees every side of every story simultaneously.",
    elementAnalysis: "As the Mutable Air sign, Gemini is the most adaptable intellectual energy in the zodiac. Air carries information, and Gemini distributes it. Where Libra weighs ideas and Aquarius revolutionizes them, Gemini collects, connects, and communicates them all.",
    rulerDeepDive: "Mercury gives Gemini its lightning-fast mind, verbal dexterity, and hunger for stimulation. In mythology, Mercury was the messenger of the gods — the bridge between realms. Gemini serves this function too: connecting people, ideas, and possibilities that wouldn't otherwise meet.",
    lightTraits: ["Brilliant mind that makes connections others miss", "Effortless communicator and storyteller", "Adaptable to any social situation", "Perpetual curiosity that keeps them forever young", "Wit and humor that lightens every room"],
    shadowTraits: ["Difficulty with commitment and follow-through", "Nervous energy that scatters focus", "Can be perceived as superficial or unreliable", "Tendency to intellectualize emotions rather than feel them"],
    bestCareers: ["Journalism / Media", "Teaching / Education", "Marketing / PR", "Writing / Publishing", "Translation / Linguistics"],
    compatBest: ["Libra", "Aquarius", "Aries", "Leo"],
    compatChallenge: ["Virgo", "Pisces"],
    famousPeople: ["Marilyn Monroe", "Kanye West", "Angelina Jolie", "Prince", "John F. Kennedy"],
  },
  cancer: {
    name: "Cancer", glyph: "♋", dateRange: "June 21 — July 22",
    element: "Water", modality: "Cardinal", ruler: "Moon", rulerGlyph: "☽",
    season: "Summer (Beginning)", tarotCard: "The Chariot",
    bodyParts: "Chest, stomach, breasts", crystal: "Pearl", metal: "Silver",
    motto: "I Feel",
    description: "Cancer is the zodiac's emotional architect — nurturing, intuitive, and fiercely protective of those they love. Ruled by the Moon, Cancer's emotional landscape is as vast and cyclical as the tides. This is the sign that creates home, belonging, and emotional safety wherever it goes.",
    elementAnalysis: "As the Cardinal Water sign, Cancer initiates emotional connections. Where Scorpio transforms feelings and Pisces transcends them, Cancer creates the container — the safe space where vulnerability becomes strength.",
    rulerDeepDive: "The Moon gives Cancer its extraordinary emotional intelligence, psychic sensitivity, and deep connection to memory and ancestry. The Moon changes signs every 2.5 days, which is why Cancer's moods shift — not from instability, but from attunement to cosmic rhythms most people can't feel.",
    lightTraits: ["Emotional intelligence that reads any room instantly", "Fierce protector of family and loved ones", "Intuitive healer with nurturing depth", "Strong connection to home and heritage", "Tenacious determination hidden beneath soft exterior"],
    shadowTraits: ["Moodiness driven by lunar sensitivity", "Clinging to the past and difficulty letting go", "Passive-aggressive when hurt instead of direct", "Overprotective to the point of smothering"],
    bestCareers: ["Nursing / Healthcare", "Psychology / Counseling", "Cooking / Hospitality", "Social work", "Real estate / Property management"],
    compatBest: ["Scorpio", "Pisces", "Taurus", "Virgo"],
    compatChallenge: ["Aries", "Libra"],
    famousPeople: ["Princess Diana", "Frida Kahlo", "Tom Hanks", "Meryl Streep", "Nikola Tesla"],
  },
  leo: {
    name: "Leo", glyph: "♌", dateRange: "July 23 — August 22",
    element: "Fire", modality: "Fixed", ruler: "Sun", rulerGlyph: "☉",
    season: "Summer (Middle)", tarotCard: "Strength",
    bodyParts: "Heart, spine, upper back", crystal: "Ruby", metal: "Gold",
    motto: "I Will",
    description: "Leo is the zodiac's radiant sovereign — creative, generous, and magnetically compelling. Ruled by the Sun itself, Leo doesn't just seek the spotlight — Leo IS the spotlight. This is the sign that reminds us all of our own magnificence by shining so fearlessly.",
    elementAnalysis: "As the Fixed Fire sign, Leo sustains creative energy over time. Where Aries sparks and Sagittarius explores, Leo maintains the eternal flame. This is sustained passion, enduring creativity, and unwavering warmth.",
    rulerDeepDive: "The Sun gives Leo its vitality, confidence, and central importance. Just as all planets orbit the Sun, Leo naturally becomes the center of any group. This isn't ego — it's gravitational pull. The Sun also gives Leo its generous warmth: it shines on everyone equally.",
    lightTraits: ["Magnetic charisma that draws people in naturally", "Generous heart that gives without keeping score", "Creative vision and artistic expression", "Natural leadership through inspiration, not force", "Loyalty that would walk through fire for loved ones"],
    shadowTraits: ["Need for admiration that becomes dependency", "Dramatic reactions to perceived slights", "Difficulty sharing the spotlight or admitting wrong", "Pride that prevents asking for help"],
    bestCareers: ["Entertainment / Performing arts", "Creative direction / Design", "Executive leadership / CEO", "Teaching / Mentoring", "Luxury brand management"],
    compatBest: ["Aries", "Sagittarius", "Gemini", "Libra"],
    compatChallenge: ["Taurus", "Scorpio"],
    famousPeople: ["Barack Obama", "Madonna", "Jennifer Lopez", "Napoleon Bonaparte", "Coco Chanel"],
  },
  virgo: {
    name: "Virgo", glyph: "♍", dateRange: "August 23 — September 22",
    element: "Earth", modality: "Mutable", ruler: "Mercury", rulerGlyph: "☿",
    season: "Summer (End)", tarotCard: "The Hermit",
    bodyParts: "Digestive system, intestines", crystal: "Sapphire", metal: "Platinum",
    motto: "I Analyze",
    description: "Virgo is the zodiac's sacred craftsperson — precise, devoted, and quietly powerful. Ruled by Mercury's analytical side, Virgo sees the pattern in chaos, the solution in the problem, and the potential in the imperfect. This is the sign that heals through knowledge and serves through devotion to craft.",
    elementAnalysis: "As the Mutable Earth sign, Virgo is adaptable practicality. Where Taurus grounds and Capricorn structures, Virgo refines and optimizes. This is earth energy at its most intelligent — knowing exactly what to change and what to preserve.",
    rulerDeepDive: "Mercury in Virgo operates differently than in Gemini. Where Gemini-Mercury gathers information broadly, Virgo-Mercury analyzes it deeply. This is Mercury as the editor, the quality controller, the healer who diagnoses before prescribing.",
    lightTraits: ["Extraordinary attention to detail and quality", "Service-oriented devotion that quietly changes lives", "Practical problem-solving genius", "Health-conscious wisdom about body and mind", "Humble mastery that doesn't need recognition"],
    shadowTraits: ["Perfectionism that becomes self-criticism", "Worry and anxiety from overthinking", "Difficulty accepting 'good enough'", "Critical eye that notices flaws before beauty"],
    bestCareers: ["Medicine / Research", "Data analysis / Quality assurance", "Editing / Technical writing", "Nutrition / Holistic health", "Accounting / Auditing"],
    compatBest: ["Taurus", "Capricorn", "Cancer", "Scorpio"],
    compatChallenge: ["Gemini", "Sagittarius"],
    famousPeople: ["Beyonce", "Mother Teresa", "Freddie Mercury", "Michael Jackson", "Keanu Reeves"],
  },
  libra: {
    name: "Libra", glyph: "♎", dateRange: "September 23 — October 22",
    element: "Air", modality: "Cardinal", ruler: "Venus", rulerGlyph: "♀",
    season: "Autumn (Beginning)", tarotCard: "Justice",
    bodyParts: "Kidneys, lower back, skin", crystal: "Opal", metal: "Copper",
    motto: "I Balance",
    description: "Libra is the zodiac's natural diplomat — elegant, fair-minded, and driven by an innate understanding that beauty and justice are the same force. Ruled by Venus in her social dimension, Libra creates harmony not through avoidance but through the courage to seek equilibrium.",
    elementAnalysis: "As the Cardinal Air sign, Libra initiates social connections and intellectual discourse. Where Gemini explores ideas and Aquarius revolutionizes them, Libra weighs, balances, and elevates them into something beautiful and fair.",
    rulerDeepDive: "Venus in Libra is Venus as the artist and the judge — not the sensual Venus of Taurus, but the aesthetic and relational Venus. This gives Libra its refined taste, social grace, and deep need for partnership as a mirror for self-understanding.",
    lightTraits: ["Natural diplomat who sees and validates all perspectives", "Impeccable aesthetic taste and artistic sensibility", "Fair-minded commitment to justice and equality", "Social grace that makes everyone feel valued", "Ability to create beauty in any environment"],
    shadowTraits: ["Indecisiveness from seeing too many sides", "People-pleasing that sacrifices authenticity", "Avoidance of conflict even when confrontation is needed", "Dependency on partnership for identity"],
    bestCareers: ["Law / Mediation", "Fashion / Beauty industry", "Diplomacy / International relations", "Art curation / Interior design", "Counseling / Couples therapy"],
    compatBest: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
    compatChallenge: ["Cancer", "Capricorn"],
    famousPeople: ["Mahatma Gandhi", "Kim Kardashian", "John Lennon", "Serena Williams", "Oscar Wilde"],
  },
  scorpio: {
    name: "Scorpio", glyph: "♏", dateRange: "October 23 — November 21",
    element: "Water", modality: "Fixed", ruler: "Pluto", rulerGlyph: "♇",
    season: "Autumn (Middle)", tarotCard: "Death",
    bodyParts: "Reproductive organs, pelvis", crystal: "Topaz", metal: "Plutonium",
    motto: "I Transform",
    description: "Scorpio is the zodiac's alchemist — intense, penetrating, and possessing an unbreakable will that turns lead into gold. Ruled by Pluto, the planet of death and rebirth, Scorpio understands what most fear: that destruction is the prerequisite for creation, and that power comes from facing what others look away from.",
    elementAnalysis: "As the Fixed Water sign, Scorpio is emotional intensity sustained over time. Where Cancer nurtures feelings and Pisces dissolves into them, Scorpio controls, channels, and transforms emotional energy into power.",
    rulerDeepDive: "Pluto gives Scorpio its X-ray vision into human psychology, its comfort with taboo subjects, and its capacity for total metamorphosis. In mythology, Pluto ruled the underworld — not as punishment, but as the keeper of all hidden treasures. Scorpio knows that the richest veins are found deepest underground.",
    lightTraits: ["Penetrating insight that sees beneath all surfaces", "Unshakeable loyalty and devotion once trust is given", "Transformative power that turns pain into wisdom", "Strategic brilliance and psychological acuity", "Magnetic intensity that draws deep connections"],
    shadowTraits: ["Jealousy and possessiveness in close relationships", "Tendency toward manipulation when feeling powerless", "Difficulty forgiving perceived betrayals", "All-or-nothing intensity that burns bridges"],
    bestCareers: ["Psychology / Psychiatry", "Investigation / Criminal justice", "Surgery / Oncology", "Finance / Venture capital", "Research / Archaeology"],
    compatBest: ["Cancer", "Pisces", "Virgo", "Capricorn"],
    compatChallenge: ["Leo", "Aquarius"],
    famousPeople: ["Marie Curie", "Pablo Picasso", "Leonardo DiCaprio", "Drake", "Fyodor Dostoevsky"],
  },
  sagittarius: {
    name: "Sagittarius", glyph: "♐", dateRange: "November 22 — December 21",
    element: "Fire", modality: "Mutable", ruler: "Jupiter", rulerGlyph: "♃",
    season: "Autumn (End)", tarotCard: "Temperance",
    bodyParts: "Hips, thighs, liver", crystal: "Turquoise", metal: "Tin",
    motto: "I Seek",
    description: "Sagittarius is the zodiac's eternal explorer — philosophical, optimistic, and driven by an insatiable hunger for truth and experience. Ruled by Jupiter, the planet of expansion and wisdom, Sagittarius sees life as the grandest adventure and every stranger as a potential teacher.",
    elementAnalysis: "As the Mutable Fire sign, Sagittarius is fire in its most adaptable form — the wildfire that spreads in whatever direction the wind blows. Where Aries initiates and Leo sustains, Sagittarius diversifies fire energy across cultures, philosophies, and horizons.",
    rulerDeepDive: "Jupiter gives Sagittarius its boundless optimism, philosophical depth, and luck that seems almost supernatural. Jupiter is the largest planet — and Sagittarius lives large. But Jupiter is also the planet of higher learning, law, and faith. Sagittarius doesn't just travel — they seek meaning.",
    lightTraits: ["Boundless optimism that opens every door", "Philosophical depth combined with playful humor", "Adventurous spirit that embraces the unknown", "Honest and direct — refreshingly transparent", "Natural teacher who inspires through enthusiasm"],
    shadowTraits: ["Restlessness that prevents deep commitment", "Blunt honesty that wounds without intention", "Overcommitment and difficulty saying no", "Avoidance of emotional depth through constant movement"],
    bestCareers: ["Travel / Tourism", "Philosophy / Theology", "Publishing / Journalism", "Higher education / Professor", "International law / Diplomacy"],
    compatBest: ["Aries", "Leo", "Libra", "Aquarius"],
    compatChallenge: ["Virgo", "Pisces"],
    famousPeople: ["Taylor Swift", "Winston Churchill", "Bruce Lee", "Walt Disney", "Jay-Z"],
  },
  capricorn: {
    name: "Capricorn", glyph: "♑", dateRange: "December 22 — January 19",
    element: "Earth", modality: "Cardinal", ruler: "Saturn", rulerGlyph: "♄",
    season: "Winter (Beginning)", tarotCard: "The Devil",
    bodyParts: "Knees, bones, skeletal system", crystal: "Garnet", metal: "Lead",
    motto: "I Use",
    description: "Capricorn is the zodiac's master architect — ambitious, disciplined, and possessing a patience that can outlast anything. Ruled by Saturn, the planet of time and mastery, Capricorn understands that lasting achievement requires structure, sacrifice, and the willingness to play the long game.",
    elementAnalysis: "As the Cardinal Earth sign, Capricorn initiates practical structures. Where Taurus preserves and Virgo refines, Capricorn builds empires. This is earth energy with a blueprint — ambitious, strategic, and always building toward a summit.",
    rulerDeepDive: "Saturn gives Capricorn its discipline, authority, and relationship with time itself. Saturn is often feared in astrology, but for Capricorn, Saturn is an ally — the strict teacher whose lessons create unshakeable competence. Capricorns age like fine wine because Saturn rewards longevity.",
    lightTraits: ["Relentless ambition paired with strategic patience", "Natural authority that commands respect", "Discipline and self-control that achieve the impossible", "Dry wit and understated humor", "Timeless wisdom and maturity beyond their years"],
    shadowTraits: ["Workaholism that sacrifices relationships", "Pessimism disguised as realism", "Difficulty expressing vulnerability or asking for help", "Status-consciousness that prioritizes image over substance"],
    bestCareers: ["Corporate leadership / CEO", "Engineering / Architecture", "Government / Politics", "Banking / Financial management", "Academic administration"],
    compatBest: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    compatChallenge: ["Aries", "Libra"],
    famousPeople: ["Martin Luther King Jr.", "Michelle Obama", "David Bowie", "Muhammad Ali", "Isaac Newton"],
  },
  aquarius: {
    name: "Aquarius", glyph: "♒", dateRange: "January 20 — February 18",
    element: "Air", modality: "Fixed", ruler: "Uranus", rulerGlyph: "♅",
    season: "Winter (Middle)", tarotCard: "The Star",
    bodyParts: "Ankles, calves, circulatory system", crystal: "Amethyst", metal: "Uranium",
    motto: "I Know",
    description: "Aquarius is the zodiac's visionary rebel — innovative, humanitarian, and stubbornly committed to the future it can see but others can't yet imagine. Ruled by Uranus, the planet of revolution and genius, Aquarius exists slightly ahead of its time — and is completely comfortable there.",
    elementAnalysis: "As the Fixed Air sign, Aquarius holds intellectual convictions with extraordinary tenacity. Where Gemini explores and Libra balances, Aquarius commits to ideas and fights for them. This is the ideologue, the reformer, the one who won't change their mind because they genuinely see further.",
    rulerDeepDive: "Uranus gives Aquarius its electric intellect, sudden insights, and discomfort with conformity. Uranus orbits on its side — literally unlike every other planet. Aquarius shares this quality: it operates on a different axis than the rest of humanity, and that's precisely its gift.",
    lightTraits: ["Visionary intellect that sees the future first", "Genuine humanitarian concern for collective wellbeing", "Fearless authenticity in a world of conformity", "Innovative problem-solving that rewrites rules", "Ability to befriend anyone across any divide"],
    shadowTraits: ["Emotional detachment that frustrates intimacy", "Contrarian streak that rebels even against good ideas", "Intellectual superiority that alienates others", "Difficulty with one-on-one emotional vulnerability"],
    bestCareers: ["Technology / Software engineering", "Social activism / NGO leadership", "Scientific research / Innovation", "Aerospace / Space industry", "Community organizing"],
    compatBest: ["Gemini", "Libra", "Aries", "Sagittarius"],
    compatChallenge: ["Taurus", "Scorpio"],
    famousPeople: ["Oprah Winfrey", "Abraham Lincoln", "Bob Marley", "Thomas Edison", "Shakira"],
  },
  pisces: {
    name: "Pisces", glyph: "♓", dateRange: "February 19 — March 20",
    element: "Water", modality: "Mutable", ruler: "Neptune", rulerGlyph: "♆",
    season: "Winter (End)", tarotCard: "The Moon",
    bodyParts: "Feet, lymphatic system", crystal: "Aquamarine", metal: "Tin",
    motto: "I Believe",
    description: "Pisces is the zodiac's mystic and dreamer — compassionate, imaginative, and connected to dimensions of experience that most people can only sense in their deepest sleep. Ruled by Neptune, the planet of transcendence and illusion, Pisces dissolves the boundaries between self and universe, between real and imagined, between what is and what could be.",
    elementAnalysis: "As the Mutable Water sign, Pisces is water at its most fluid and boundaryless. Where Cancer contains emotions and Scorpio intensifies them, Pisces merges with them completely. This is the ocean itself — vast, deep, and containing everything.",
    rulerDeepDive: "Neptune gives Pisces its visionary imagination, spiritual sensitivity, and connection to the collective unconscious. Neptune dissolves hard edges and rigid categories — which is why Pisces can feel everyone's pain and see beauty where others see nothing. The risk is losing yourself in the dissolution.",
    lightTraits: ["Boundless empathy that understands without judgment", "Creative imagination that sees what doesn't yet exist", "Spiritual depth and intuitive wisdom", "Selfless compassion that heals through presence", "Artistic vision that translates the ineffable into form"],
    shadowTraits: ["Escapism through substances, fantasy, or avoidance", "Difficulty with boundaries and self-definition", "Martyrdom and victimhood as unconscious patterns", "Overwhelm from absorbing others' emotions"],
    bestCareers: ["Visual arts / Music / Film", "Healing arts / Therapy", "Spirituality / Ministry", "Marine biology / Oceanography", "Nonprofit / Humanitarian work"],
    compatBest: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
    compatChallenge: ["Gemini", "Sagittarius"],
    famousPeople: ["Albert Einstein", "Rihanna", "Michelangelo", "Steve Jobs", "Kurt Cobain"],
  },
};

export function getSignPage(slug: string): SignPage | null {
  return SIGN_PAGES[slug.toLowerCase()] || null;
}
