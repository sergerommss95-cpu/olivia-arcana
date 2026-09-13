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
    upright: "A leap of faith is calling. You stand at the cliff's edge with a white rose in your hand — innocence carried lightly, not ignorance. The little dog at your heels barks a warning or an encouragement; either way, the universe supports your willingness to begin without knowing where it leads. Trust the path that has no map.",
    reversed: "Recklessness disguised as courage. You may be avoiding necessary preparation or ignoring warning signs. Naivety isn't the same as innocence. Pause before you leap — not to abandon the journey, but to pack what you need.",
    advice: "Say yes to the unknown. Your beginner's mind is your greatest asset right now.",
    astrology: "Uranus", element: "Air", yesNo: "yes",
  },
  {
    number: 1, name: "The Magician", arcana: "major",
    keywords: ["manifestation", "willpower", "resourcefulness", "skill"],
    upright: "You have everything you need. Look at the table before you — wand, cup, sword, and pentacle, every tool of every element, already laid out. One hand raised to heaven, one pointed to earth: this is the moment to channel intention into action, to draw power down and ground it into form. The infinity sign above your head says your capacity doesn't run out. Concentrate your will and create.",
    reversed: "Scattered energy or manipulation. Your power is real but misdirected — either turned inward as self-doubt or outward as deception. Are you using your gifts to create genuine value, or performing tricks that impress but don't transform?",
    advice: "Focus. You are more capable than you believe. Channel one intention with everything you have.",
    astrology: "Mercury", element: "Air", yesNo: "yes",
  },
  {
    number: 2, name: "The High Priestess", arcana: "major",
    keywords: ["intuition", "mystery", "subconscious", "inner voice"],
    upright: "The answer lives in your body, not your mind. You sit between the pillars — B and J, dark and light — holding a scroll only half-revealed, because some knowledge refuses to be read aloud. Something is being unveiled to you through dreams, gut feelings, and quiet knowing. Stop analyzing and start listening. The rational mind cannot pass between those pillars — your intuition already has.",
    reversed: "You are ignoring your inner voice. Perhaps the truth is uncomfortable, or you don't trust what you feel. Disconnection from your intuitive wisdom leads to confusion. Reconnect through stillness, journaling, or simply asking yourself: what do I already know?",
    advice: "Be still. The truth is whispering. You only need to stop talking long enough to hear it.",
    astrology: "Moon", element: "Water", yesNo: "maybe",
  },
  {
    number: 3, name: "The Empress", arcana: "major",
    keywords: ["abundance", "fertility", "nurturing", "beauty", "nature"],
    upright: "Life is lush and growing. The wheat ripens golden at your feet and the river runs full behind your throne — creativity, sensuality, and material abundance are flowing toward you. Nurture what you love: relationships, projects, your body, your garden. The Empress, crowned with twelve stars, says: receive. You deserve pleasure and plenty.",
    reversed: "Creative block or over-dependence. You may be smothering what you love, neglecting self-care, or waiting for someone else to provide what you can grow yourself. Reclaim your creative power. Stop over-giving and start receiving.",
    advice: "Create something beautiful today. Nourish your body. Let abundance in.",
    astrology: "Venus", element: "Earth", yesNo: "yes",
  },
  {
    number: 4, name: "The Emperor", arcana: "major",
    keywords: ["authority", "structure", "stability", "leadership"],
    upright: "Build the structure. The Emperor sits on a throne of solid stone, carved with ram's heads — will made permanent, power that doesn't apologize for itself. Discipline, order, and strategic thinking are your tools now; this isn't the time for chaos or improvisation. Even the mountains behind him are bare, because structure comes before decoration. Step into your authority with confidence.",
    reversed: "Rigidity or tyranny. Control has become oppression — either you're being controlled or you're controlling too tightly. Flexibility isn't weakness. Question whether your rules serve growth or just maintain power.",
    advice: "Create order from chaos. Lead with strength and fairness, not force.",
    astrology: "Aries", element: "Fire", yesNo: "yes",
  },
  {
    number: 5, name: "The Hierophant", arcana: "major",
    keywords: ["tradition", "spiritual wisdom", "institutions", "conformity"],
    upright: "Seek the teacher or the tradition. At the Hierophant's feet lie two crossed keys — proof that the doors you're trying to force have already been unlocked by those who walked before you. There is wisdom in established systems: education, mentorship, spiritual lineage. Some knowledge has been tested by centuries. Learn before you innovate.",
    reversed: "Blind conformity or rejection of all structure. Either you're following rules that no longer serve you, or you're rebelling against everything just to be different. True spiritual freedom comes from understanding tradition deeply enough to transcend it consciously.",
    advice: "Find a teacher or tradition that resonates. Learn the rules before you break them.",
    astrology: "Taurus", element: "Earth", yesNo: "maybe",
  },
  {
    number: 6, name: "The Lovers", arcana: "major",
    keywords: ["love", "union", "choice", "alignment", "values"],
    upright: "A choice that defines you. Above the two figures, the angel spreads wings of blessing — but notice that neither one is looking at the other; each faces what they must answer for alone. This isn't just about romance — it's about alignment between your actions and your deepest values. Behind you stands the tree with the serpent; ahead, the mountain. Choose with your whole heart.",
    reversed: "Misalignment or avoidance of choice. You may be in a relationship or situation that conflicts with your values, or you're refusing to make a necessary decision. Indecision is itself a choice — and it's choosing stagnation.",
    advice: "Choose what aligns with your values, even if it's harder. That's love.",
    astrology: "Gemini", element: "Air", yesNo: "yes",
  },
  {
    number: 7, name: "The Chariot", arcana: "major",
    keywords: ["determination", "willpower", "victory", "direction"],
    upright: "Move forward with fierce focus. Look at the two sphinxes drawing your chariot — one black, one white, pulling in opposite directions, and no reins in your hands: you steer this by will alone. Obstacles exist but they will not stop you if your will is aligned. Harness opposing forces — emotion and logic, desire and discipline — and drive them toward your goal. This is triumph through determination, not luck.",
    reversed: "Loss of direction or control. You're either spinning your wheels or being pulled in too many directions. Aggression without strategy leads nowhere. Pull over, recalibrate your compass, and decide on one direction before accelerating again.",
    advice: "Pick one direction and charge. Victory belongs to the focused.",
    astrology: "Cancer", element: "Water", yesNo: "yes",
  },
  {
    number: 8, name: "Strength", arcana: "major",
    keywords: ["courage", "patience", "inner power", "compassion"],
    upright: "Gentle power. The woman on this card closes the lion's jaws with bare hands — no whip, no chains, only patience and a garland of flowers. True strength isn't force; it's the calm to tame what's wild without breaking it. The infinity sign floats above her head because this kind of courage doesn't run out. Lead with compassion, not aggression — your softness IS your power.",
    reversed: "Self-doubt or raw aggression. You're either underestimating your own power or overcompensating through force. The lion inside you needs to be acknowledged, not caged or unleashed. Find the middle path between suppression and explosion.",
    advice: "Be gentle with yourself and others. Courage comes from the heart, not the fist.",
    astrology: "Leo", element: "Fire", yesNo: "yes",
  },
  {
    number: 9, name: "The Hermit", arcana: "major",
    keywords: ["introspection", "solitude", "inner guidance", "wisdom"],
    upright: "Withdraw to find the light. The Hermit stands on the snow-capped peak holding his lantern, and inside it burns a six-pointed star — wisdom he carries with him, not wisdom he's searching for. The answer isn't out there in the noise; it's inside you, accessible only through solitude and reflection. This isn't loneliness; it's chosen aloneness. Take time away from the crowd to hear your own wisdom.",
    reversed: "Isolation or avoidance. You may be withdrawing out of fear rather than wisdom, or refusing the solitude you desperately need. There's a difference between strategic retreat and running away. Which are you doing?",
    advice: "Spend time alone today. The wisdom you seek is already within you.",
    astrology: "Virgo", element: "Earth", yesNo: "maybe",
  },
  {
    number: 10, name: "Wheel of Fortune", arcana: "major",
    keywords: ["cycles", "fate", "turning point", "luck", "change"],
    upright: "The wheel turns. On its rim rides the sphinx with a sword, steady at the top while the serpent slides down one side and Anubis climbs the other — riddle, fall, and rise, all moving at once. A significant shift is occurring: fate, luck, or karmic completion is at work. What goes up comes down; what was down rises. Accept the turning point with grace, knowing that resistance is futile and unnecessary.",
    reversed: "Resistance to change or bad luck. You may feel like the universe is working against you, or you're clinging to a phase that has ended. The wheel turns regardless of your grip. Let go and trust the cycle.",
    advice: "Accept the turning point. What feels like loss is making room for what's next.",
    astrology: "Jupiter", element: "Fire", yesNo: "yes",
  },
  {
    number: 11, name: "Justice", arcana: "major",
    keywords: ["truth", "fairness", "law", "cause and effect"],
    upright: "Truth and consequences. Justice holds the sword upright in one hand and the scales level in the other — the blade cuts both ways, and it doesn't care who's holding the case. What you've sown, you now reap, for better or worse. Legal matters, contracts, and decisions require honesty and objectivity. The universe is balancing the scales; accept the verdict with maturity.",
    reversed: "Injustice or dishonesty. The scales are tipped — either by external unfairness or your own avoidance of accountability. Are you being honest with yourself? Accountability postponed is still accountability owed — and dishonesty always catches up.",
    advice: "Be scrupulously honest. Fairness starts with you.",
    astrology: "Libra", element: "Air", yesNo: "yes",
  },
  {
    number: 12, name: "The Hanged Man", arcana: "major",
    keywords: ["surrender", "new perspective", "letting go", "sacrifice"],
    upright: "Stop fighting and see differently. The Hanged Man dangles from a living tree by one foot — and around his upside-down head glows a halo, because this suspension is illumination, not punishment. What looks like stagnation is actually incubation. Let go of your need to control the outcome. The pause is the point.",
    reversed: "Stalling or martyrdom. You're either stuck because you refuse to surrender, or you're making unnecessary sacrifices out of habit. Not all suffering is noble. Sometimes the bravest act is simply to move on.",
    advice: "Let go. The thing you're holding onto is holding you back.",
    astrology: "Neptune", element: "Water", yesNo: "maybe",
  },
  {
    number: 13, name: "Death", arcana: "major",
    keywords: ["transformation", "endings", "rebirth", "release"],
    upright: "Something must end for something new to begin. Death rides in carrying a banner with a white rose — because even this card promises that beauty survives the ending. This is not physical death; it is the death of an identity, a relationship, a chapter, a belief. And look past the rider: between the two towers, the sun is rising. Grieve what's leaving, but know that clinging to what's dead prevents what's alive from reaching you.",
    reversed: "Resistance to necessary change. You know something has ended but you're pretending it hasn't. The transformation is happening whether you cooperate or not — resistance only increases the pain. Let the old version of you rest in peace.",
    advice: "Release what has served its purpose. The next chapter can't begin until this one ends.",
    astrology: "Scorpio", element: "Water", yesNo: "no",
  },
  {
    number: 14, name: "Temperance", arcana: "major",
    keywords: ["balance", "moderation", "patience", "harmony"],
    upright: "The middle path is the right path. The angel stands with one foot on land, one in the water, pouring light between two cups in a stream that should be impossible — this is the art of temperance: mixing, blending, balancing. Patience and moderation lead to a result greater than either extreme could produce alone. You're being asked to find equilibrium between opposing forces. Stand where the angel stands — grounded and flowing at once.",
    reversed: "Imbalance or excess. You've swung too far in one direction — too much work, too much indulgence, too much of anything. Recalibrate. The sweet spot exists between all extremes, and you've lost it. Return to center.",
    advice: "Moderate. The balanced approach yields the deepest transformation.",
    astrology: "Sagittarius", element: "Fire", yesNo: "yes",
  },
  {
    number: 15, name: "The Devil", arcana: "major",
    keywords: ["bondage", "shadow", "addiction", "materialism", "illusion"],
    upright: "You are chained — but the chains are loose. Look at the two figures at the Devil's feet: the loops around their necks are wide enough to lift off at any moment, and neither one does. Addiction, toxic patterns, unhealthy attachments, or material obsession have you believing you're trapped. The prison is an illusion maintained by your own choices. Lift the chain. Walk out.",
    reversed: "Breaking free or denial deepening. Either you're finally seeing the chains for what they are and releasing yourself, or you're sinking deeper into denial. Liberation requires radical honesty about what controls you.",
    advice: "Name the thing that controls you. Naming it is the first step to freedom.",
    astrology: "Capricorn", element: "Earth", yesNo: "no",
  },
  {
    number: 16, name: "The Tower", arcana: "major",
    keywords: ["upheaval", "sudden change", "revelation", "breakthrough"],
    upright: "The structure collapses — and it needs to. Lightning strikes the Tower and the first thing to fall is the crown, knocked clean off the top — because what gets destroyed first is false authority, the ego's throne. What was built on lies cannot stand. This is sudden, disruptive, and often painful, but the Tower doesn't destroy truth — it destroys illusion. What remains after the fall is what was real all along.",
    reversed: "Avoiding the inevitable or the aftermath. Either the tower is about to fall and you're pretending the cracks aren't there, or you're picking through the rubble trying to rebuild what should stay demolished. Let it fall. Let it go.",
    advice: "Don't rebuild on the old foundation. Start fresh from the truth that remains.",
    astrology: "Mars", element: "Fire", yesNo: "no",
  },
  {
    number: 17, name: "The Star", arcana: "major",
    keywords: ["hope", "healing", "inspiration", "serenity", "renewal"],
    upright: "After the storm, the stars appear. The Star kneels with one foot on the water, one on the earth, pouring from two pitchers — replenishing the land and the pool at once, holding nothing back. Hope returns, not as naive optimism but as deep, earned faith. You've been through the fire and now healing begins. Pour yourself out generously and let yourself be renewed by quiet, persistent light.",
    reversed: "Loss of faith or disconnection from hope. The stars are still there — you just can't see them through the clouds. Despair is temporary. Reconnect with what inspired you before the darkness. Even a tiny flicker of hope is enough to navigate by.",
    advice: "Have faith. The worst is behind you. Let yourself heal.",
    astrology: "Aquarius", element: "Air", yesNo: "yes",
  },
  {
    number: 18, name: "The Moon", arcana: "major",
    keywords: ["illusion", "fear", "subconscious", "anxiety", "intuition"],
    upright: "Nothing is as it seems. On this card a dog and a wolf howl at the same moon — the tame fear and the wild one, both making noise, neither telling the truth. The Moon illuminates but also distorts: shadows stretch, fears magnify, the subconscious speaks in symbols. Anxiety may be high, but not every fear is a premonition. The path between the two towers is still there — distinguish intuition from paranoia by asking: is this voice protecting me or paralyzing me?",
    reversed: "Clarity returning or repressed fears surfacing. The fog lifts and you see what was hidden — either external deception revealed or internal fears you've been avoiding. Face what emerges with courage. The truth, even when uncomfortable, is always better than illusion.",
    advice: "Don't trust everything you see right now. Wait for clarity before acting.",
    astrology: "Pisces", element: "Water", yesNo: "no",
  },
  {
    number: 19, name: "The Sun", arcana: "major",
    keywords: ["joy", "success", "vitality", "confidence", "truth"],
    upright: "Pure light. A child rides bareback on a white horse beneath a wall of sunflowers — joy this open needs no armor, no saddle, no defense. Success, vitality, and clarity flood in; this is the most positive card in the deck. Whatever you're doing is working, and confidence is warranted. Celebrate, and share your light generously — there's more than enough for everyone.",
    reversed: "Temporary clouds over joy. The sun is still shining but something — ego, doubt, or external circumstances — is blocking its full warmth. This isn't a bad card even reversed. It simply says: the happiness is real but you're not fully letting it in yet.",
    advice: "Let yourself be happy. You've earned this light.",
    astrology: "Sun", element: "Fire", yesNo: "yes",
  },
  {
    number: 20, name: "Judgement", arcana: "major",
    keywords: ["reflection", "reckoning", "calling", "resurrection"],
    upright: "The call to rise. The angel's trumpet sounds and the figures below stand up out of their coffins with open arms — not judged, but awakened. This is a moment of profound self-evaluation and spiritual reckoning: you are being called to a higher version of yourself. Past actions — good and difficult — converge into a single moment of truth. Answer the call. Resurrect what deserves to live.",
    reversed: "Self-doubt or avoiding the reckoning. You hear the call but fear answering it. Perhaps you're judging yourself too harshly, or not honestly enough. The invitation to rise remains open — but you must choose to accept it.",
    advice: "Answer the call. You are ready for the next level, even if you don't feel ready.",
    astrology: "Pluto", element: "Fire", yesNo: "yes",
  },
  {
    number: 21, name: "The World", arcana: "major",
    keywords: ["completion", "integration", "fulfillment", "wholeness"],
    upright: "The journey is complete. The dancer moves inside the laurel wreath — a circle with no beginning and no end — while the four fixed creatures watch from every corner: everything you've learned, suffered, created, and released integrates into a complete picture. You have arrived, not at a destination, but at wholeness. Celebrate this achievement. Then prepare, because the Fool's next journey begins from this higher ground.",
    reversed: "Almost there or unable to close the chapter. Completion is within reach but something prevents the final step. Loose ends, unfinished business, or fear of what comes after success. Tie up the remaining threads. You deserve the closure.",
    advice: "Celebrate how far you've come. Then take a breath and begin again.",
    astrology: "Saturn", element: "Earth", yesNo: "yes",
  },
];

// ── Minor Arcana: Wands (Fire) ──
const WANDS_REVERSED = [
  "The spark arrives but you smother it \u2014 hesitation, false starts, or an idea announced before it was ever acted on. The fire hasn't died; it's waiting under your fear of beginning badly.",
  "The map is drawn but you won't leave the castle. Playing it safe has become its own risk, and the world you're surveying from a distance is moving on without you.",
  "Your ships are delayed or you stopped watching the horizon. Expansion stalls through poor foresight or shrunken ambition \u2014 you planned for a harbor when you were built for open water.",
  "The celebration feels hollow or the foundation shakes. Home, team, or milestone doesn't hold the meaning it promised, and belonging can't be forced by decoration alone.",
  "The sparring has turned bitter \u2014 conflict avoided until it festers, or competition that's no longer making anyone sharper. Either name the real disagreement or step out of a fight that has no prize.",
  "The victory parade rings false. You're either running on applause instead of purpose, or achieving quietly and letting someone else wear the laurels \u2014 neither is sustainable.",
  "You're still swinging from the hilltop long after the challengers went home. Exhaustion, defensiveness, or a position held out of stubbornness rather than conviction \u2014 check whether this ground is still worth the fight.",
  "The arrows scatter mid-flight. Delays, crossed signals, and rushed moves that land nowhere \u2014 momentum has become frenzy, and frenzy always misses the target.",
  "Vigilance has curdled into paranoia. You're guarding wounds so closely that allies look like attackers, and the wall you built for protection has become the thing keeping you tired.",
  "You're pinned under the load and still refusing to delegate. The finish line is real, but martyrdom isn't a strategy \u2014 carried this way, even success will feel like collapse.",
  "Enthusiasm without follow-through \u2014 the message stalls, the project dies in the exciting-idea phase. The fire is genuine but scattered, all sparks and no kindling.",
  "The charge becomes a stampede. Impulsiveness, burned bridges, passion that commits hard and vanishes faster \u2014 the horse is running the rider.",
  "Her radiance turns inward as self-doubt or outward as demand. Confidence slips into jealousy, warmth into control \u2014 the fire still burns, but it's consuming instead of illuminating.",
  "Vision curdles into tyranny or drifts into empty grandiosity. He promises empires and micromanages ashes \u2014 leadership that no longer lifts anyone but its own reflection.",
] as const;
const WANDS_ADVICE = [
  "Act within twenty-four hours. Inspiration this pure has a short shelf life.",
  "Decide from the largest map you can draw, then commit to one route.",
  "Trust the work you've already set in motion \u2014 position yourself where you can see it arrive.",
  "Pause and celebrate this milestone properly; unmarked victories stop feeling like victories.",
  "Compete to sharpen, not to wound \u2014 and make sure everyone's fighting about the real issue.",
  "Accept the recognition fully. Standing tall in victory is generosity, not arrogance.",
  "Hold your ground \u2014 you have the high ground, and they know it even if you don't.",
  "Move now and sort the details in flight; this window won't stay open.",
  "Rest without retreating. You can lower your shoulders and still keep the boundary.",
  "Put down what was never yours to carry, and finish the rest.",
  "Follow the curiosity before you feel qualified \u2014 exploring is the qualification.",
  "Harness the passion to one commitment and see it through past the exciting part.",
  "Take up your full space. Warmth and authority are not opposites \u2014 wield both.",
  "Cast the vision, then hand people the torch \u2014 leaders multiply fire, they don't hoard it.",
] as const;
const WANDS_ASTRO = [
  "Root of Fire",
  "Mars in Aries",
  "Sun in Aries",
  "Venus in Aries",
  "Saturn in Leo",
  "Jupiter in Leo",
  "Mars in Leo",
  "Mercury in Sagittarius",
  "Moon in Sagittarius",
  "Saturn in Sagittarius",
  "Earth of Fire",
  "Fire of Fire \u00b7 20\u00b0Scorpio\u201320\u00b0Sagittarius",
  "Water of Fire \u00b7 20\u00b0Pisces\u201320\u00b0Aries",
  "Air of Fire \u00b7 20\u00b0Cancer\u201320\u00b0Leo",
] as const;
const WANDS_YESNO = ["yes", "yes", "yes", "yes", "no", "yes", "maybe", "yes", "maybe", "no", "yes", "yes", "yes", "yes"] as const;

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
    reversed: WANDS_REVERSED[i],
    advice: WANDS_ADVICE[i],
    astrology: WANDS_ASTRO[i],
    element: "Fire", yesNo: WANDS_YESNO[i],
  };
});

// ── Minor Arcana: Cups (Water) ──
const CUPS_REVERSED = [
  "The cup is offered but you've turned it face-down. Repressed emotion, blocked creativity, or a heart so guarded that love can't find the opening \u2014 the water is still there, waiting for you to stop damming it.",
  "The mirror between two people has cracked. A connection has fallen out of balance \u2014 one gives while the other takes, or the harmony you show the world hides a quiet disconnection that needs honest words to repair.",
  "The party has gone on too long, or you were never really invited. Overindulgence, gossip, a third presence disturbing a bond, or the ache of standing outside a circle you once belonged to \u2014 check whether this community still feeds you.",
  "The hand from the cloud finally gets your attention. You are stirring from apathy and ready to re-engage with the world \u2014 or, if you keep your arms crossed, the offer you've stopped noticing quietly moves on to someone who will take it.",
  "You are either finding your way back or refusing to leave the riverbank. Reversed, this card can mean acceptance and forgiveness at last \u2014 or grief turned inward so long that mourning has become an identity rather than a passage.",
  "Nostalgia has become a place you live instead of a place you visit. You may be idealizing a past that never quite existed, or refusing a lesson your childhood keeps re-teaching \u2014 honor the memory, then return to the present where your life is actually happening.",
  "The fog lifts and the cups reveal their contents. Reversed, illusion gives way to clarity \u2014 you finally see which option is real \u2014 but it can also mean fantasy has hardened into avoidance, choosing dreams precisely because they never demand action.",
  "You know it's time to go and still your feet won't move. Fear of the unknown keeps you circling something already finished \u2014 or you left too abruptly and part of you is drifting, unsure whether the search was escape or evolution.",
  "The nine cups are full but they don't reach the ache. Satisfaction has curdled into smugness or emptiness \u2014 you got exactly what you wished for and discovered it wasn't what you needed, because the wish was borrowed from someone else's dream.",
  "The picture of the happy family and the reality behind it have come apart. Disharmony at home, values out of alignment, or a rainbow performed for others while the connection underneath goes untended \u2014 real fulfillment can't be staged.",
  "The sensitive dreamer has stopped delivering messages. Emotional immaturity, creative blocks, or intuition dismissed as childishness \u2014 the fish still whispers from the cup, but you've been calling it silly and drowning it in escapism.",
  "The romantic has become the moody one. Charm turns to manipulation, romance to fantasy that can't survive daylight \u2014 either someone's grand gestures lack follow-through, or you're in love with the feeling rather than anything real.",
  "She has given so much away there is nothing left in her own cup. Emotional overwhelm, codependency, or absorbing everyone's feelings until you can't locate your own \u2014 compassion without boundaries becomes a slow drowning.",
  "The calm surface hides a storm he refuses to name. Emotional control has become emotional suppression \u2014 manipulation through withheld feeling, coldness masquerading as wisdom, or a repressed tide that leaks out as passive aggression.",
] as const;
const CUPS_ADVICE = [
  "Accept what is being offered before you've figured out where it leads. An open heart is the only cup that fills.",
  "Show up as a full partner, not a half waiting to be completed. What you give this connection is what it becomes.",
  "Gather your people and celebrate out loud. Joy shared is joy doubled \u2014 don't postpone it until everything is perfect.",
  "Look up. The thing you've stopped noticing is the very offer you've been waiting for.",
  "Mourn what spilled, fully and without apology \u2014 then turn around and pick up the two cups still standing.",
  "Take the gift from your past without moving back into it. Let what was sweet then make you generous now.",
  "Pick one cup and pour it out to see what's actually inside. Deciding ends the fog that dreaming sustains.",
  "Leave the cups you carefully stacked. What you're searching for cannot be found by staying where you already looked.",
  "Enjoy what you have while you have it. Gratitude is the difference between a full cup and a hollow one.",
  "Protect the harmony you've built by tending it daily. Lasting love is not a destination \u2014 it's a practice.",
  "Take your sensitivity seriously \u2014 it's a skill, not a weakness. Say yes to the small creative invitation in front of you.",
  "Follow your heart, but make it keep its promises. Romance becomes love only when the gesture survives the follow-through.",
  "Feel everything, hold space generously \u2014 and keep one cup that is only yours. You cannot pour from an empty heart.",
  "Lead with the calm you've earned, but let people see the water beneath it. Feeling deeply and staying steady are not opposites.",
] as const;
const CUPS_ASTRO = [
  "Root of Water",
  "Venus in Cancer",
  "Mercury in Cancer",
  "Moon in Cancer",
  "Mars in Scorpio",
  "Sun in Scorpio",
  "Venus in Scorpio",
  "Saturn in Pisces",
  "Jupiter in Pisces",
  "Mars in Pisces",
  "Earth of Water",
  "Fire of Water \u00b7 20\u00b0Aquarius\u201320\u00b0Pisces",
  "Water of Water \u00b7 20\u00b0Gemini\u201320\u00b0Cancer",
  "Air of Water \u00b7 20\u00b0Libra\u201320\u00b0Scorpio",
] as const;
const CUPS_YESNO = ["yes", "yes", "yes", "maybe", "no", "yes", "maybe", "no", "yes", "yes", "yes", "yes", "yes", "yes"] as const;

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
    reversed: CUPS_REVERSED[i],
    advice: CUPS_ADVICE[i],
    astrology: CUPS_ASTRO[i],
    element: "Water", yesNo: CUPS_YESNO[i],
  };
});

// ── Minor Arcana: Swords (Air) ──
const SWORDS_REVERSED = [
  "The blade is drawn but the fog hasn't lifted \u2014 half-truths, mental static, or clarity used as a weapon rather than a light. Wait for the air to clear before you name what you think you see.",
  "The blindfold is coming off, and the stalemate you protected is breaking whether you're ready or not. Information floods in \u2014 the danger now isn't ignorance but drowning in detail to avoid deciding at all.",
  "The swords are being drawn out of the heart \u2014 slowly, and only if you let them. If you keep pressing on the wound to prove it still hurts, you're not grieving anymore; you're rehearsing.",
  "Rest refused becomes collapse demanded. You're either running on fumes and calling it commitment, or you've let recovery calcify into hiding \u2014 the retreat was meant to end.",
  "The battlefield clears and someone offers a hand \u2014 reconciliation is possible if you can release the need to be the one who was right. Held too long, this grudge fights the war forever in a field everyone else has left.",
  "The boat turns back toward the shore you swore you'd left. Unfinished business, old baggage in the hull, or a crossing rougher than promised \u2014 you can't reach calm water while still gripping the old bank.",
  "The stolen swords grow heavy and conscience starts talking. A scheme unravels, a secret surfaces, or you finally catch the person you've been deceiving longest \u2014 yourself.",
  "The bindings are looser than yesterday and you're starting to test them \u2014 freedom begins the moment you stop narrating your own captivity. But watch the other face of this reversal: pulling the blindfold down tighter because the prison has become familiar.",
  "The nightmare breaks at dawn \u2014 the worst-case scenarios are losing their grip as you finally speak them aloud. But anxiety kept secret turns inward and festers; shame is just fear that was never allowed a witness.",
  "The swords are being pulled from your back and the sky behind them is lightening \u2014 the worst is genuinely over. The only way to lose now is to keep lying down on a battlefield that has already closed.",
  "Words fired without aim: gossip, spying, cross-examining people who owe you no testimony. All those questions and no follow-through \u2014 curiosity has curdled into suspicion.",
  "The charge has lost its target. You're either slashing at everything in reach \u2014 burning allies with words launched mid-gallop \u2014 or you've stalled entirely, all that mental velocity spinning in place.",
  "The clear eye has gone cold. Boundaries have hardened into walls, honesty into cruelty, and the bitterness of old wounds is being served as wisdom \u2014 sharpness was never meant to draw blood from the innocent.",
  "The judge has become the tyrant. Intellect wielded to control rather than clarify \u2014 manipulation, harsh verdicts, rules bent for the ruler. Or the crown sits empty: a mind so tangled in argument it can no longer rule at all.",
] as const;
const SWORDS_ADVICE = [
  "Name the truth in one sentence \u2014 then act on it before the fog rolls back in.",
  "Take off the blindfold: gather the one missing fact, then choose and stand by it.",
  "Let the pain move through you instead of around you \u2014 feel it fully once so you don't feel it forever.",
  "Schedule the rest like it's the battle plan, because right now it is.",
  "Ask yourself what winning will cost \u2014 and walk away from any victory you'd be ashamed to hold.",
  "Keep rowing; don't look back at the shore until the water under you is calm.",
  "Do the honest version of the clever thing \u2014 strategy survives daylight, schemes don't.",
  "Test one binding today: take the smallest step your fear insists is impossible.",
  "Say the worst fear out loud to someone \u2014 spoken at noon, it shrinks to its actual size.",
  "Declare the ending over, bury it with honors, and put your energy where the sun is rising.",
  "Ask your sharpest question \u2014 then have the patience to actually verify the answer.",
  "Move fast on what matters, but aim before you accelerate \u2014 speed without direction is just noise.",
  "Tell the truth kindly and completely, and let your boundary do its work without apology.",
  "Decide on principle, not preference \u2014 then deliver the verdict with as much fairness as force.",
] as const;
const SWORDS_ASTRO = [
  "Root of Air",
  "Moon in Libra",
  "Saturn in Libra",
  "Jupiter in Libra",
  "Venus in Aquarius",
  "Mercury in Aquarius",
  "Moon in Aquarius",
  "Jupiter in Gemini",
  "Mars in Gemini",
  "Sun in Gemini",
  "Earth of Air",
  "Fire of Air \u00b7 20\u00b0 Taurus\u201320\u00b0 Gemini",
  "Water of Air \u00b7 20\u00b0 Virgo\u201320\u00b0 Libra",
  "Air of Air \u00b7 20\u00b0 Capricorn\u201320\u00b0 Aquarius",
] as const;
const SWORDS_YESNO = ["yes", "maybe", "no", "maybe", "no", "yes", "maybe", "no", "no", "no", "yes", "yes", "maybe", "yes"] as const;

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
    reversed: SWORDS_REVERSED[i],
    advice: SWORDS_ADVICE[i],
    astrology: SWORDS_ASTRO[i], element: "Air",
    yesNo: SWORDS_YESNO[i],
  };
});

// ── Minor Arcana: Pentacles (Earth) ──
const PENTACLES_REVERSED = [
  "The seed of opportunity is real, but it's slipping through your fingers \u2014 poor planning, hesitation, or a venture built on shaky ground. Check the foundation before you invest another ounce of yourself; a delayed start is better than a false one.",
  "The juggling act has become a losing game \u2014 too many commitments, and something is about to hit the floor. Stop performing balance you don't feel and drop the least important ball on purpose, before chance drops it for you.",
  "The collaboration is breaking down \u2014 cut corners, unheard voices, or working alone when the job demands a team. Your skill is not the problem; the structure around it is, so renegotiate roles before mediocrity becomes the standard.",
  "Grip has become the whole strategy \u2014 hoarding money, control, or emotional walls so tight that nothing new can reach you. Security that isolates you isn't security; loosen one finger and notice that nothing collapses.",
  "The cold spell is passing, or you're refusing the door that's already open. Help has been offered and pride is the only thing still standing between you and warmth \u2014 take the hand, and stop rehearsing the story that you're beyond rescue.",
  "Generosity has grown strings \u2014 a gift that keeps score, a debt dressed up as kindness, or giving so much you're quietly going bankrupt. Audit the exchange: whoever holds the scales holds the power, and right now they're tipped.",
  "You've been watering a plant that isn't growing \u2014 sunk costs, misplaced patience, effort loyal to a result that isn't coming. Frustration here is information, not failure: reassess where your energy goes before you give this field another season.",
  "Repetition has replaced growth \u2014 you're going through the motions, perfecting details nobody needs, or grinding at a craft your heart has left. Mastery without meaning is just labor; reconnect with why you started, or point the discipline somewhere it can matter.",
  "The luxury is showing cracks \u2014 living beyond your means, self-worth pegged to your net worth, or a garden so curated you're alone in it. What you've built is real; stop performing abundance and let yourself actually inhabit it.",
  "The legacy has become a leash \u2014 family money with conditions, tradition enforced over truth, or stability that costs you your own path. What lasts generations can also trap them; honor the inheritance without letting it write your will for you.",
  "The student has stalled \u2014 a dream researched forever and never begun, or a shortcut hunted instead of a skill earned. All that potential is still yours, but potential expires unused: pick the smallest real step and take it today.",
  "Method has hardened into rut \u2014 so cautious, so thorough, so slow that the opportunity is leaving without you. Or you've abandoned routine entirely and wonder why nothing compounds; either way, the fix is the same: keep the discipline, restore the motion.",
  "She's giving from an empty account \u2014 nurturing everyone's stability while her own body, finances, or home go untended. Or comfort has curdled into smothering; either way the medicine is identical: put your own ground back under your own feet first.",
  "Competence has curdled into control \u2014 wealth measured against everyone else's, generosity used as leverage, or an empire so demanding its builder never lives in it. The gold is real but the grip is the problem; success that can't be shared or set down owns you.",
] as const;
const PENTACLES_ADVICE = [
  "Take the opportunity in front of you and give it real soil \u2014 commitment, not just excitement.",
  "Prioritize ruthlessly. You can do everything, just not all at once.",
  "Ask for collaboration and credit your collaborators \u2014 excellence is a team sport.",
  "Save wisely, but leave your hands open enough to receive.",
  "Ask for help today. Needing support is not the same as failing.",
  "Give what you can, receive what you need, and keep the exchange clean.",
  "Step back and assess honestly \u2014 then keep tending what's actually growing.",
  "Do the work in front of you with full attention. Mastery is built one repetition at a time.",
  "Enjoy what you've earned without apology \u2014 and without needing an audience.",
  "Build something that outlasts you, and let the people you love inside it.",
  "Start studying now. The skill you begin today is the security you'll stand on later.",
  "Keep going at your own pace. Slow and thorough beats fast and careless.",
  "Tend your own ground as generously as you tend everyone else's.",
  "Lead with the wealth of your experience \u2014 and stay generous with both money and wisdom.",
] as const;
const PENTACLES_ASTRO = [
  "Root of Earth",
  "Jupiter in Capricorn",
  "Mars in Capricorn",
  "Sun in Capricorn",
  "Mercury in Taurus",
  "Moon in Taurus",
  "Saturn in Taurus",
  "Sun in Virgo",
  "Venus in Virgo",
  "Mercury in Virgo",
  "Earth of Earth",
  "Fire of Earth \u00b7 20\u00b0Leo\u201320\u00b0Virgo",
  "Water of Earth \u00b7 20\u00b0Sagittarius\u201320\u00b0Capricorn",
  "Air of Earth \u00b7 20\u00b0Aries\u201320\u00b0Taurus",
] as const;
const PENTACLES_YESNO = ["yes", "maybe", "yes", "maybe", "no", "yes", "maybe", "yes", "yes", "yes", "yes", "yes", "yes", "yes"] as const;

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
    reversed: PENTACLES_REVERSED[i],
    advice: PENTACLES_ADVICE[i],
    astrology: PENTACLES_ASTRO[i], element: "Earth",
    yesNo: PENTACLES_YESNO[i],
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
