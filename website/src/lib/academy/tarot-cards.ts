/**
 * tarot-cards.ts — Complete 78-card tarot database
 *
 * All 22 Major Arcana + 56 Minor Arcana with:
 * - Upright and reversed meanings
 * - Keywords
 * - Astrological correspondence
 * - Element
 * - Yes/No tendency
 * - Advice
 */

export interface TarotCard {
  number: number;
  name: string;
  arcana: "major" | "minor";
  suit?: "wands" | "cups" | "swords" | "pentacles";
  keywords: string[];
  upright: string;
  reversed: string;
  advice: string;
  astrology: string;
  element: string;
  yesNo: "yes" | "no" | "maybe";
}

export const MAJOR_ARCANA: TarotCard[] = [
  {
    number: 0, name: "The Fool", arcana: "major",
    keywords: ["beginnings", "innocence", "spontaneity", "free spirit"],
    upright: "A leap of faith is calling. You stand at the edge of something entirely new — a journey, a relationship, a creative endeavor. The universe supports your willingness to begin without knowing where it leads. Trust the path that has no map.",
    reversed: "Recklessness disguised as courage. You may be avoiding necessary preparation or ignoring warning signs. Naivety isn't the same as innocence. Pause before you leap — not to abandon the journey, but to pack what you need.",
    advice: "Say yes to the unknown. Your beginner's mind is your greatest asset right now.",
    astrology: "Uranus", element: "Air", yesNo: "yes",
  },
  {
    number: 1, name: "The Magician", arcana: "major",
    keywords: ["manifestation", "willpower", "resourcefulness", "skill"],
    upright: "You have everything you need. The tools, the talent, the timing — all are aligned. This is the moment to channel your intention into action. What you focus on now will materialize. Concentrate your will and create.",
    reversed: "Scattered energy or manipulation. Your power is real but misdirected — either turned inward as self-doubt or outward as deception. Are you using your gifts to create genuine value, or performing tricks that impress but don't transform?",
    advice: "Focus. You are more capable than you believe. Channel one intention with everything you have.",
    astrology: "Mercury", element: "Air", yesNo: "yes",
  },
  {
    number: 2, name: "The High Priestess", arcana: "major",
    keywords: ["intuition", "mystery", "subconscious", "inner voice"],
    upright: "The answer lives in your body, not your mind. Something is being revealed to you through dreams, gut feelings, and quiet knowing. Stop analyzing and start listening. The rational mind cannot solve this — your intuition already has.",
    reversed: "You are ignoring your inner voice. Perhaps the truth is uncomfortable, or you don't trust what you feel. Disconnection from your intuitive wisdom leads to confusion. Reconnect through stillness, journaling, or simply asking yourself: what do I already know?",
    advice: "Be still. The truth is whispering. You only need to stop talking long enough to hear it.",
    astrology: "Moon", element: "Water", yesNo: "maybe",
  },
  {
    number: 3, name: "The Empress", arcana: "major",
    keywords: ["abundance", "fertility", "nurturing", "beauty", "nature"],
    upright: "Life is lush and growing. Creativity, sensuality, and material abundance are flowing toward you. Nurture what you love — relationships, projects, your body, your garden. The Empress says: receive. You deserve pleasure and plenty.",
    reversed: "Creative block or over-dependence. You may be smothering what you love, neglecting self-care, or waiting for someone else to provide what you can grow yourself. Reclaim your creative power. Stop over-giving and start receiving.",
    advice: "Create something beautiful today. Nourish your body. Let abundance in.",
    astrology: "Venus", element: "Earth", yesNo: "yes",
  },
  {
    number: 4, name: "The Emperor", arcana: "major",
    keywords: ["authority", "structure", "stability", "leadership"],
    upright: "Build the structure. Discipline, order, and strategic thinking are your tools now. This isn't the time for chaos or improvisation — it's the time for plans, boundaries, and leadership. Step into your authority with confidence.",
    reversed: "Rigidity or tyranny. Control has become oppression — either you're being controlled or you're controlling too tightly. Flexibility isn't weakness. Question whether your rules serve growth or just maintain power.",
    advice: "Create order from chaos. Lead with strength and fairness, not force.",
    astrology: "Aries", element: "Fire", yesNo: "yes",
  },
  {
    number: 5, name: "The Hierophant", arcana: "major",
    keywords: ["tradition", "spiritual wisdom", "institutions", "conformity"],
    upright: "Seek the teacher or the tradition. There is wisdom in established systems — education, mentorship, spiritual lineage. You don't need to reinvent everything from scratch. Some knowledge has been tested by centuries. Learn before you innovate.",
    reversed: "Blind conformity or rejection of all structure. Either you're following rules that no longer serve you, or you're rebelling against everything just to be different. True spiritual freedom comes from understanding tradition deeply enough to transcend it consciously.",
    advice: "Find a teacher or tradition that resonates. Learn the rules before you break them.",
    astrology: "Taurus", element: "Earth", yesNo: "maybe",
  },
  {
    number: 6, name: "The Lovers", arcana: "major",
    keywords: ["love", "union", "choice", "alignment", "values"],
    upright: "A choice that defines you. This isn't just about romance — it's about alignment between your actions and your deepest values. A relationship, a commitment, or a crossroads requires you to choose what truly matters. Choose with your whole heart.",
    reversed: "Misalignment or avoidance of choice. You may be in a relationship or situation that conflicts with your values, or you're refusing to make a necessary decision. Indecision is itself a choice — and it's choosing stagnation.",
    advice: "Choose what aligns with your values, even if it's harder. That's love.",
    astrology: "Gemini", element: "Air", yesNo: "yes",
  },
  {
    number: 7, name: "The Chariot", arcana: "major",
    keywords: ["determination", "willpower", "victory", "direction"],
    upright: "Move forward with fierce focus. Obstacles exist but they will not stop you if your will is aligned. This is triumph through determination, not luck. Harness opposing forces — emotion and logic, desire and discipline — and drive them toward your goal.",
    reversed: "Loss of direction or control. You're either spinning your wheels or being pulled in too many directions. Aggression without strategy leads nowhere. Pull over, recalibrate your compass, and decide on one direction before accelerating again.",
    advice: "Pick one direction and charge. Victory belongs to the focused.",
    astrology: "Cancer", element: "Water", yesNo: "yes",
  },
  {
    number: 8, name: "Strength", arcana: "major",
    keywords: ["courage", "patience", "inner power", "compassion"],
    upright: "Gentle power. True strength isn't force — it's the patience to tame what's wild without breaking it. You have the inner fortitude to face this challenge with grace. Lead with compassion, not aggression. Your softness IS your power.",
    reversed: "Self-doubt or raw aggression. You're either underestimating your own power or overcompensating through force. The lion inside you needs to be acknowledged, not caged or unleashed. Find the middle path between suppression and explosion.",
    advice: "Be gentle with yourself and others. Courage comes from the heart, not the fist.",
    astrology: "Leo", element: "Fire", yesNo: "yes",
  },
  {
    number: 9, name: "The Hermit", arcana: "major",
    keywords: ["introspection", "solitude", "inner guidance", "wisdom"],
    upright: "Withdraw to find the light. The answer isn't out there in the noise — it's inside you, accessible only through solitude and reflection. This isn't loneliness; it's chosen aloneness. Take time away from the crowd to hear your own wisdom.",
    reversed: "Isolation or avoidance. You may be withdrawing out of fear rather than wisdom, or refusing the solitude you desperately need. There's a difference between strategic retreat and running away. Which are you doing?",
    advice: "Spend time alone today. The wisdom you seek is already within you.",
    astrology: "Virgo", element: "Earth", yesNo: "maybe",
  },
  {
    number: 10, name: "Wheel of Fortune", arcana: "major",
    keywords: ["cycles", "fate", "turning point", "luck", "change"],
    upright: "The wheel turns. A significant shift is occurring — fate, luck, or karmic completion is at work. What goes up comes down; what was down rises. This is a turning point. Accept the change with grace, knowing that resistance is futile and unnecessary.",
    reversed: "Resistance to change or bad luck. You may feel like the universe is working against you, or you're clinging to a phase that has ended. The wheel turns regardless of your grip. Let go and trust the cycle.",
    advice: "Accept the turning point. What feels like loss is making room for what's next.",
    astrology: "Jupiter", element: "Fire", yesNo: "yes",
  },
  {
    number: 11, name: "Justice", arcana: "major",
    keywords: ["truth", "fairness", "law", "cause and effect"],
    upright: "Truth and consequences. What you've sown, you now reap — for better or worse. Fairness prevails. Legal matters, contracts, and decisions require honesty and objectivity. The universe is balancing the scales. Accept the verdict with maturity.",
    reversed: "Injustice or dishonesty. The scales are tipped — either by external unfairness or your own avoidance of accountability. Are you being honest with yourself? Justice delayed is not justice denied, but dishonesty always catches up.",
    advice: "Be scrupulously honest. Fairness starts with you.",
    astrology: "Libra", element: "Air", yesNo: "yes",
  },
  {
    number: 12, name: "The Hanged Man", arcana: "major",
    keywords: ["surrender", "new perspective", "letting go", "sacrifice"],
    upright: "Stop fighting and see differently. Suspension isn't punishment — it's a gift of perspective. What looks like stagnation is actually incubation. Let go of your need to control the outcome. The pause is the point.",
    reversed: "Stalling or martyrdom. You're either stuck because you refuse to surrender, or you're making unnecessary sacrifices out of habit. Not all suffering is noble. Sometimes the bravest act is simply to move on.",
    advice: "Let go. The thing you're holding onto is holding you back.",
    astrology: "Neptune", element: "Water", yesNo: "maybe",
  },
  {
    number: 13, name: "Death", arcana: "major",
    keywords: ["transformation", "endings", "rebirth", "release"],
    upright: "Something must end for something new to begin. This is not physical death — it is the death of an identity, a relationship, a chapter, a belief. Grieve what's leaving, but know that clinging to what's dead prevents what's alive from reaching you.",
    reversed: "Resistance to necessary change. You know something has ended but you're pretending it hasn't. The transformation is happening whether you cooperate or not — resistance only increases the pain. Let the old version of you rest in peace.",
    advice: "Release what has served its purpose. The next chapter can't begin until this one ends.",
    astrology: "Scorpio", element: "Water", yesNo: "no",
  },
  {
    number: 14, name: "Temperance", arcana: "major",
    keywords: ["balance", "moderation", "patience", "harmony"],
    upright: "The middle path is the right path. Mix, blend, balance — this is the art of temperance. Patience and moderation lead to a result greater than either extreme could produce alone. You're being asked to find equilibrium between opposing forces.",
    reversed: "Imbalance or excess. You've swung too far in one direction — too much work, too much indulgence, too much of anything. Recalibrate. The sweet spot exists between all extremes, and you've lost it. Return to center.",
    advice: "Moderate. The balanced approach yields the deepest transformation.",
    astrology: "Sagittarius", element: "Fire", yesNo: "yes",
  },
  {
    number: 15, name: "The Devil", arcana: "major",
    keywords: ["bondage", "shadow", "addiction", "materialism", "illusion"],
    upright: "You are chained — but the chains are loose. Addiction, toxic patterns, unhealthy attachments, or material obsession have you believing you're trapped. Look closer: the chains can be removed at any time. The prison is an illusion maintained by your own choices.",
    reversed: "Breaking free or denial deepening. Either you're finally seeing the chains for what they are and releasing yourself, or you're sinking deeper into denial. Liberation requires radical honesty about what controls you.",
    advice: "Name the thing that controls you. Naming it is the first step to freedom.",
    astrology: "Capricorn", element: "Earth", yesNo: "no",
  },
  {
    number: 16, name: "The Tower", arcana: "major",
    keywords: ["upheaval", "sudden change", "revelation", "breakthrough"],
    upright: "The structure collapses — and it needs to. What was built on false foundations cannot stand. This is sudden, disruptive, and often painful. But the Tower doesn't destroy truth — it destroys illusion. What remains after the fall is what was real all along.",
    reversed: "Avoiding the inevitable or the aftermath. Either the tower is about to fall and you're pretending the cracks aren't there, or you're picking through the rubble trying to rebuild what should stay demolished. Let it fall. Let it go.",
    advice: "Don't rebuild on the old foundation. Start fresh from the truth that remains.",
    astrology: "Mars", element: "Fire", yesNo: "no",
  },
  {
    number: 17, name: "The Star", arcana: "major",
    keywords: ["hope", "healing", "inspiration", "serenity", "renewal"],
    upright: "After the storm, the stars appear. Hope returns — not as naive optimism but as deep, earned faith. You've been through the fire and now healing begins. Pour yourself out generously, trust the universe, and let yourself be renewed by quiet, persistent light.",
    reversed: "Loss of faith or disconnection from hope. The stars are still there — you just can't see them through the clouds. Despair is temporary. Reconnect with what inspired you before the darkness. Even a tiny flicker of hope is enough to navigate by.",
    advice: "Have faith. The worst is behind you. Let yourself heal.",
    astrology: "Aquarius", element: "Air", yesNo: "yes",
  },
  {
    number: 18, name: "The Moon", arcana: "major",
    keywords: ["illusion", "fear", "subconscious", "anxiety", "intuition"],
    upright: "Nothing is as it seems. The Moon illuminates but also distorts — shadows stretch, fears magnify, and the subconscious speaks in symbols. Anxiety may be high, but not every fear is a premonition. Distinguish between intuition and paranoia by checking: is this voice protecting me or paralyzing me?",
    reversed: "Clarity returning or repressed fears surfacing. The fog lifts and you see what was hidden — either external deception revealed or internal fears you've been avoiding. Face what emerges with courage. The truth, even when uncomfortable, is always better than illusion.",
    advice: "Don't trust everything you see right now. Wait for clarity before acting.",
    astrology: "Pisces", element: "Water", yesNo: "no",
  },
  {
    number: 19, name: "The Sun", arcana: "major",
    keywords: ["joy", "success", "vitality", "confidence", "truth"],
    upright: "Pure light. Joy, success, vitality, and clarity flood in. This is the most positive card in the deck. Whatever you're doing is working. Confidence is warranted. Celebrate. Share your light generously — there's more than enough for everyone.",
    reversed: "Temporary clouds over joy. The sun is still shining but something — ego, doubt, or external circumstances — is blocking its full warmth. This isn't a bad card even reversed. It simply says: the happiness is real but you're not fully letting it in yet.",
    advice: "Let yourself be happy. You've earned this light.",
    astrology: "Sun", element: "Fire", yesNo: "yes",
  },
  {
    number: 20, name: "Judgement", arcana: "major",
    keywords: ["reflection", "reckoning", "calling", "resurrection"],
    upright: "The call to rise. A moment of profound self-evaluation and spiritual reckoning. You are being called to a higher version of yourself. Past actions — good and difficult — converge into a single moment of truth. Answer the call. Resurrect what deserves to live.",
    reversed: "Self-doubt or avoiding the reckoning. You hear the call but fear answering it. Perhaps you're judging yourself too harshly, or not honestly enough. The invitation to rise remains open — but you must choose to accept it.",
    advice: "Answer the call. You are ready for the next level, even if you don't feel ready.",
    astrology: "Pluto", element: "Fire", yesNo: "yes",
  },
  {
    number: 21, name: "The World", arcana: "major",
    keywords: ["completion", "integration", "fulfillment", "wholeness"],
    upright: "The journey is complete. You have arrived — not at a destination, but at wholeness. Everything you've learned, suffered, created, and released integrates into a complete picture. Celebrate this achievement. Then prepare, because the Fool's next journey begins from this higher ground.",
    reversed: "Almost there or unable to close the chapter. Completion is within reach but something prevents the final step. Loose ends, unfinished business, or fear of what comes after success. Tie up the remaining threads. You deserve the closure.",
    advice: "Celebrate how far you've come. Then take a breath and begin again.",
    astrology: "Saturn", element: "Earth", yesNo: "yes",
  },
];

// ── Minor Arcana: Wands (Fire) ──
const WANDS: TarotCard[] = Array.from({ length: 14 }, (_, i) => {
  const num = i + 1;
  const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
  const keywords_map: string[][] = [
    ["inspiration", "new beginnings", "potential", "creation"],
    ["planning", "decision", "discovery", "future"],
    ["expansion", "foresight", "enterprise", "growth"],
    ["celebration", "harmony", "homecoming", "foundation"],
    ["conflict", "competition", "tension", "struggle"],
    ["victory", "recognition", "success", "pride"],
    ["challenge", "perseverance", "defense", "courage"],
    ["speed", "movement", "swift action", "momentum"],
    ["resilience", "determination", "boundaries", "grit"],
    ["burden", "responsibility", "overwhelm", "near completion"],
    ["enthusiasm", "exploration", "curiosity", "free spirit"],
    ["adventure", "energy", "impulsiveness", "passion"],
    ["confidence", "independence", "determination", "warmth"],
    ["leadership", "vision", "entrepreneurship", "honor"],
  ];
  const uprights = [
    "A spark of pure creative fire. A new idea, project, or passion ignites. Act on this energy — it won't wait.",
    "Big plans are forming. You stand at a crossroads with the world in your hands. Look far before you choose.",
    "Your ships are coming in. Expansion, enterprise, and foresight pay off. The horizon is wide and welcoming.",
    "Celebrate what you've built. Stability in home, work, or relationships. A moment of earned joy and harmony.",
    "Conflict erupts but it's productive. Competition sharpens you. Fight for what matters — just fight fair.",
    "Public recognition for your efforts. Victory after struggle. Your name is spoken with respect. Own it.",
    "You're defending your ground against challengers. Stay firm. Your position is stronger than it appears.",
    "Everything accelerates. News, travel, decisions — all arrive at speed. Ride the momentum, don't resist it.",
    "You've been through the fire and you're still standing. One more push. Don't drop your guard yet.",
    "The burden is real but it's almost over. You took on too much. Put something down before it breaks you.",
    "A message of excitement arrives. New creative energy. A young person or new beginning brings fresh fire.",
    "Charge forward with passionate energy. The Knight acts fast — sometimes too fast. Channel, don't scatter.",
    "Radiant confidence. She knows her power and wields it with warmth. Creativity + determination = unstoppable.",
    "Visionary leadership. He sees the big picture and inspires others to build it. Integrity meets ambition.",
  ];
  return {
    number: num, name: `${names[i]} of Wands`, arcana: "minor" as const, suit: "wands" as const,
    keywords: keywords_map[i], upright: uprights[i],
    reversed: "The energy of this card is blocked, scattered, or turned inward. What should be creative fire has become burnout, hesitation, or recklessness.",
    advice: "Channel your fire with intention. Passion without direction is just heat.",
    astrology: ["Aries/Leo/Sagittarius", "Mars on Aries", "Sun + Aries", "Venus + Aries", "Saturn + Leo", "Jupiter + Leo", "Mars + Leo", "Mercury + Sagittarius", "Moon + Sagittarius", "Saturn + Sagittarius", "Fire signs", "Fire signs", "Fire signs", "Fire signs"][i],
    element: "Fire", yesNo: num <= 6 || num >= 11 ? "yes" : "maybe",
  };
});

// ── Minor Arcana: Cups (Water) ──
const CUPS: TarotCard[] = Array.from({ length: 14 }, (_, i) => {
  const num = i + 1;
  const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
  const courtNames = ["Page", "Knight", "Queen", "King"];
  const name = i < 10 ? `${names[i]} of Cups` : `${courtNames[i - 10]} of Cups`;
  const keywords_map: string[][] = [
    ["new love", "emotional beginning", "intuition", "compassion"],
    ["partnership", "unity", "attraction", "connection"],
    ["celebration", "friendship", "community", "joy"],
    ["apathy", "contemplation", "disconnection", "meditation"],
    ["grief", "loss", "regret", "mourning"],
    ["nostalgia", "innocence", "memory", "childhood"],
    ["illusion", "fantasy", "wishful thinking", "choices"],
    ["walking away", "disillusion", "leaving behind", "search"],
    ["contentment", "satisfaction", "gratitude", "wish fulfilled"],
    ["emotional fulfillment", "family", "harmony", "completion"],
    ["sensitivity", "creative offer", "intuitive message", "dreamer"],
    ["romance", "charm", "imagination", "following the heart"],
    ["emotional security", "compassion", "intuitive", "nurturing"],
    ["emotional balance", "diplomacy", "calm authority", "wise counsel"],
  ];
  const uprights = [
    "A new emotional beginning. Love, compassion, or creative inspiration wells up from the depths. Open your heart.",
    "Deep connection between two souls. Partnership, attraction, mutual respect. What flows between you is real.",
    "Celebration with people you love. Friendship, community, shared joy. Raise a cup to what you've created together.",
    "Emotional withdrawal. You're looking inward, perhaps bored or disconnected. The universe offers something new — but you must open your eyes to see it.",
    "Grief and loss are present. But notice: two cups remain standing. Not everything is lost. Let yourself mourn, then look at what remains.",
    "A sweet memory returns. Nostalgia, innocence, a gift from the past. Someone from before may reappear. Honor where you came from.",
    "Too many options, none of them real. Fantasy clouds your judgment. Come back to earth before you choose — not every glittering cup contains gold.",
    "You're walking away from something that no longer fills you. It hurts, but you know the well is dry. Trust the search for deeper water.",
    "The wish card. Deep contentment, emotional satisfaction, gratitude for what is. You have what you need — feel it fully.",
    "Emotional completion. Family harmony, lasting love, the rainbow after every storm. This is as good as it gets — and you earned it.",
    "A sensitive messenger. Creative inspiration or an emotional offer arrives. Stay open to what this young energy brings.",
    "The romantic rides in. Follow your heart, pursue what moves you. But check: are you chasing a feeling or a person?",
    "She feels everything and holds space for all of it. Emotional intelligence as a superpower. Nurture without drowning.",
    "Calm authority over the emotional realm. He counsels with wisdom, leads with empathy, and never loses his center.",
  ];
  return {
    number: num, name, arcana: "minor" as const, suit: "cups" as const,
    keywords: keywords_map[i], upright: uprights[i],
    reversed: "The emotional flow is blocked, excessive, or misdirected. What should nourish has become overwhelming, codependent, or repressed.",
    advice: "Honor your feelings without drowning in them. Emotional truth is your compass.",
    astrology: ["Cancer/Scorpio/Pisces"][0],
    element: "Water", yesNo: [1, 2, 3, 6, 9, 10].includes(num) ? "yes" : "maybe",
  };
});

// ── Minor Arcana: Swords (Air) ──
const SWORDS: TarotCard[] = Array.from({ length: 14 }, (_, i) => {
  const num = i + 1;
  const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
  return {
    number: num, name: `${names[i]} of Swords`, arcana: "minor" as const, suit: "swords" as const,
    keywords: [
      ["clarity", "truth", "breakthrough"], ["decision", "stalemate", "balance"],
      ["heartbreak", "grief", "sorrow"], ["rest", "recovery", "contemplation"],
      ["conflict", "defeat", "dishonor"], ["transition", "moving on", "healing"],
      ["deception", "strategy", "stealth"], ["restriction", "trapped", "victim mindset"],
      ["anxiety", "nightmare", "overwhelm"], ["endings", "rock bottom", "release"],
      ["curiosity", "mental energy", "new ideas"], ["ambition", "speed", "determination"],
      ["independence", "clear boundaries", "truth"], ["authority", "intellect", "fair judgment"],
    ][i],
    upright: [
      "Mental breakthrough. A new idea cuts through confusion like a blade. The truth is sharp and clear — use it.",
      "A difficult decision with no easy answer. You're weighing options, blindfolded to bias. Choose with your mind, not your fear.",
      "Heartbreak. Three swords through the heart is exactly what it looks like. Feel the pain — it's the only way through.",
      "Rest after battle. Put down your sword and recover. This isn't defeat — it's strategic withdrawal for healing.",
      "Conflict where someone loses. Dishonor, unfair tactics, or hollow victory. Win with integrity or the prize means nothing.",
      "Transition to calmer waters. You're leaving difficulty behind. The journey isn't easy but the destination is peace.",
      "Someone is being clever — maybe too clever. Strategy, stealth, or deception. Are you the fox or the one being foxed?",
      "You feel trapped, but look again — the bindings are loose. Mental prison. The restrictions are beliefs, not bars.",
      "Anxiety and worry keep you up at night. The fears feel overwhelming but most are projections, not predictions.",
      "Rock bottom. Total defeat — but also total release. When everything falls, the only direction is up. This IS the turning point.",
      "Curious, sharp-minded energy arrives. A message that makes you think. New intellectual pursuit or youthful questioning.",
      "Charge forward with mental clarity and determination. Fast, decisive, sometimes ruthless. Think before you slash.",
      "She sees the truth and speaks it without flinching. Clear boundaries, independence, emotional intelligence through intellect.",
      "Fair and authoritative judgment. He cuts through complexity with clarity. Justice, intellectual power, ethical leadership.",
    ][i],
    reversed: "The mental energy is distorted — confusion, dishonesty, cruelty, or paralyzing anxiety. The sword cuts the wielder.",
    advice: "Think clearly. Speak truthfully. The mind is a powerful tool — wield it with precision.",
    astrology: "Gemini/Libra/Aquarius", element: "Air",
    yesNo: [1, 6, 11, 14].includes(num) ? "yes" : "no",
  };
});

// ── Minor Arcana: Pentacles (Earth) ──
const PENTACLES: TarotCard[] = Array.from({ length: 14 }, (_, i) => {
  const num = i + 1;
  const names = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
  return {
    number: num, name: `${names[i]} of Pentacles`, arcana: "minor" as const, suit: "pentacles" as const,
    keywords: [
      ["opportunity", "prosperity", "new venture"], ["balance", "adaptability", "juggling"],
      ["teamwork", "mastery", "craftsmanship"], ["security", "control", "saving"],
      ["hardship", "poverty", "isolation"], ["generosity", "charity", "sharing"],
      ["patience", "investment", "long-term vision"], ["diligence", "skill", "dedication"],
      ["abundance", "luxury", "self-sufficiency"], ["legacy", "wealth", "family"],
      ["ambition", "student", "new skill"], ["reliability", "patience", "methodical"],
      ["nurturing", "practical", "financial security"], ["abundance", "discipline", "leadership"],
    ][i],
    upright: [
      "A golden opportunity in the material world. New income, new venture, new physical beginning. Plant this seed with care.",
      "Juggling multiple priorities with grace. Adaptability in finances or work. Stay flexible — change is the only constant here.",
      "Mastery through collaboration. Your skills are recognized. Teamwork produces something lasting. Quality craftsmanship rewarded.",
      "Financial security through careful management. Holding tight to what you have. But ask: is saving becoming hoarding?",
      "Material hardship or spiritual poverty. Feeling left out in the cold. Help exists — but you may need to ask for it.",
      "Generosity flows in both directions. Giving and receiving with open hands. Charity, fairness, and material balance.",
      "The seeds you planted are growing but not yet ready to harvest. Patience. The investment of time and effort will pay off — not today, but soon.",
      "Dedicated craftsmanship. You're building something with skill and repetition. The work is detailed but the mastery is real.",
      "Abundance surrounds you. Financial independence, luxury earned through effort. Enjoy what you've built — you deserve this comfort.",
      "Generational wealth and family legacy. The culmination of material success. What you build now lasts beyond your lifetime.",
      "A student of the material world. New skill, new financial opportunity, ambitious beginnings. Study, practice, grow.",
      "Slow, steady, reliable progress. The tortoise wins this race. Methodical approach to finances and work pays off.",
      "She creates abundance for everyone around her. Practical nurturing, financial security, connection to nature and body.",
      "The master of the material world. Disciplined wealth, generous authority, everything he touches prospers through competence.",
    ][i],
    reversed: "Material energy is blocked — financial anxiety, laziness, greed, or neglect of the physical world and health.",
    advice: "Build something real. Take care of your body, your money, and your environment.",
    astrology: "Taurus/Virgo/Capricorn", element: "Earth",
    yesNo: num <= 4 || num >= 9 ? "yes" : "maybe",
  };
});

export const ALL_CARDS: TarotCard[] = [...MAJOR_ARCANA, ...WANDS, ...CUPS, ...SWORDS, ...PENTACLES];

export function getCard(name: string): TarotCard | undefined {
  return ALL_CARDS.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getRandomCard(): TarotCard {
  return ALL_CARDS[Math.floor(Math.random() * ALL_CARDS.length)];
}

export function getMajorArcana(): TarotCard[] {
  return MAJOR_ARCANA;
}

export function getMinorBySuit(suit: string): TarotCard[] {
  return ALL_CARDS.filter(c => c.suit === suit);
}
