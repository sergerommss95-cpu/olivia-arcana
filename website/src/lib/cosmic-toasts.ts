/**
 * cosmic-toasts.ts — Bold, snarky daily one-liners by zodiac sign
 *
 * 15 messages per sign = 180 total. Selected deterministically by date.
 * Categories: general, retrograde, growth, warning, cosmic humor
 */

const MESSAGES: Record<string, string[]> = {
  Aries: [
    "Your impatience isn't a flaw. It's your superpower being wasted on the wrong things.",
    "Stop asking for permission. Your chart literally says you're here to lead.",
    "That anger you're feeling? It's just passion without a direction. Aim it.",
    "Mars is pushing you today. Either move forward or get moved. Your choice.",
    "You don't need another plan. You need to execute the one you already have.",
    "The universe didn't give you fire energy so you could play it safe.",
    "Someone is going to challenge you today. Let them. You were built for this.",
    "Your biggest risk isn't failure — it's staying comfortable.",
    "That gut feeling? Trust it. Your instincts are sharper than most people's logic.",
    "Stop dimming yourself so others feel comfortable. That's not your job.",
    "Today rewards action over analysis. Stop thinking. Start doing.",
    "Your energy is magnetic right now. Be intentional about who you attract.",
    "The obstacle isn't in front of you. It IS the path. Charge through it.",
    "You're not being aggressive. You're being direct. There's a difference.",
    "The cosmos doesn't reward hesitation. And neither does your chart.",
  ],
  Taurus: [
    "Your stubbornness isn't the problem. Your unwillingness to admit it is.",
    "Comfort is your love language. But growth lives outside that cozy bubble.",
    "Venus says: you deserve luxury. Saturn says: earn it first.",
    "That thing you're holding onto? It's already gone. Your hands just don't know it yet.",
    "Your patience is legendary. Just make sure patience isn't code for avoidance.",
    "Today's mantra: I can enjoy stability AND embrace change. Both exist.",
    "Someone wants your opinion today. Give it honestly. You're not here to people-please.",
    "Your relationship with money needs a conversation you've been avoiding.",
    "The body keeps the score, Taurus. Listen to what yours is telling you today.",
    "You don't need more stuff. You need more meaning in the stuff you have.",
    "Stop building walls and calling them boundaries.",
    "Your sensuality is a gift. Stop treating pleasure like a guilty secret.",
    "The garden grows whether you watch it or not. Let go of the need to control.",
    "Consistency is your superpower. Make sure you're consistently doing the right things.",
    "Today asks: are you loyal, or just afraid of change?",
  ],
  Gemini: [
    "Your mind is moving faster than everyone else today. Be patient with the slow ones.",
    "Two versions of you showed up today. Make sure the right one stays.",
    "That conversation you're avoiding? It's not going away. Mercury demands it.",
    "Your curiosity is infinite. Your attention span... less so. Focus.",
    "You already know the answer. You're just asking everyone else to avoid deciding.",
    "Words are your weapon. Today, choose them like your life depends on it.",
    "The duality isn't a curse. It's the ability to see what others can't.",
    "Stop starting new things and finish one of the seventeen you already began.",
    "Your social energy is peak today. Use it for connection, not performance.",
    "Boredom is not the enemy. Sitting with it will teach you something.",
    "You're not indecisive. You just see all sides. Pick one and commit.",
    "That person you're overthinking about? They're probably not thinking about you at all.",
    "Your adaptability is a superpower. Stop apologizing for changing your mind.",
    "Mercury retrograde can't touch you if you're already chaos. Embrace it.",
    "Today's cosmic message: depth > breadth. Go deep on one thing.",
  ],
  Cancer: [
    "Your feelings are valid. But not every feeling is a fact. Learn the difference.",
    "The shell protects you. But it also keeps the good stuff out. Open up today.",
    "Your intuition is screaming. The question is: are you listening or arguing?",
    "Home is where you feel safe. But safety and growth rarely share an address.",
    "Stop mothering everyone else and mother yourself for once.",
    "The Moon is working with you today. Let emotions flow, then let them go.",
    "Your memory is a gift and a curse. Today, choose to remember the lessons, not the pain.",
    "That grudge you're nursing? It's taking up space where peace could live.",
    "Vulnerability isn't weakness. It's the bravest thing you can do today.",
    "You nurture everyone. Who's nurturing you? If the answer is 'no one,' we need to talk.",
    "The past called. Don't answer. You've already gotten what you needed from it.",
    "Your empathy makes you absorb others' pain. Today, practice emotional hygiene.",
    "Not every rejection is abandonment. Sometimes it's redirection.",
    "The tides change. Your emotions will too. Ride the wave instead of fighting it.",
    "Your softness is not weakness. It takes strength to stay open in a hard world.",
  ],
  Leo: [
    "The spotlight isn't chasing you. You ARE the spotlight. Act accordingly.",
    "Your ego got a bruise? Good. That's where the growth happens.",
    "Stop performing and start being. The real you is more impressive than the act.",
    "The Sun says you're the main character today. Don't waste it on a supporting role.",
    "Validation from others is nice. But self-validation is the real crown.",
    "Your generosity is legendary. Just make sure you're giving, not performing.",
    "Someone dim is trying to outshine you today. Let them. Your light is permanent.",
    "Drama finds you because you're interesting. Today, choose which drama is worth your energy.",
    "Your heart is enormous. Protect it without closing it.",
    "Leadership isn't about being in charge. It's about being the one who cares the most.",
    "The applause is intoxicating. But can you sit in silence and still feel worthy?",
    "Your creativity needs an outlet today. If you don't choose one, it'll choose chaos.",
    "Stop waiting to be discovered. Discover yourself first.",
    "Pride is your armor. Today, try taking it off with someone you trust.",
    "The cosmos gave you main character energy. Use it for the collective, not just the selfie.",
  ],
  Virgo: [
    "Perfection is an illusion. Done is better than perfect. Ship it.",
    "Your critical eye sees everything wrong. Today, point it at what's right.",
    "Mercury says: organize your thoughts before your sock drawer.",
    "You've analyzed it enough. The data supports moving forward. Go.",
    "Your helpfulness is beautiful. But helping everyone else while neglecting yourself isn't.",
    "That worry loop in your head? It's not protection. It's procrastination in disguise.",
    "The small details matter. But not more than the big picture you keep ignoring.",
    "Your body is sending signals. Stop intellectualizing them and feel them.",
    "Not every problem is yours to solve. Some people need to figure it out themselves.",
    "Your standards are high. Make sure they apply to what you tolerate, not just what you produce.",
    "Today's cosmic rx: imperfection is not failure. It's being human.",
    "You know exactly what needs to change. The question is: will you change it?",
    "Your service to others is admirable. Your service to yourself is overdue.",
    "Stop editing yourself before you speak. Your unfiltered thoughts have value.",
    "The plan is perfect. Now throw it away and trust the process.",
  ],
  Libra: [
    "Balance isn't about keeping everyone happy. It's about not losing yourself in the process.",
    "Venus says: beauty matters. But so does substance. Bring both today.",
    "That decision you've been avoiding for weeks? The cosmos is done waiting.",
    "Harmony is your gift. People-pleasing is its shadow. Know the difference.",
    "You see both sides. Great. Now pick one and stand there.",
    "Your charm can open any door. Make sure you're walking through the right ones.",
    "Stop weighing options and start making choices. Even the wrong choice teaches.",
    "The relationship mirror is showing you something today. Look at it honestly.",
    "Justice isn't always pretty. Today might require uncomfortable truth-telling.",
    "Your aesthetic sense is impeccable. Apply it to your inner world too.",
    "Conflict avoidance isn't peace. Sometimes peace requires a fight.",
    "You don't need a partner to be complete. But you knew that. Act like it.",
    "The scales tip today. Let them. Perfect balance is a myth anyway.",
    "Your indecision is a decision. It's choosing to stay stuck. Do you want that?",
    "Today: be diplomatic AND honest. They're not mutually exclusive.",
  ],
  Scorpio: [
    "You already know who's lying. The question is what you're going to do about it.",
    "Intensity isn't a warning label. It's your operating system. Own it.",
    "Pluto demands transformation. You can do it voluntarily, or the universe will assist.",
    "That grudge is a full-time job. Today, consider retiring it.",
    "Your depth terrifies shallow people. That's their problem, not yours.",
    "Control is an illusion you cling to. Release it and watch what flows in.",
    "Trust is earned, not given. But someone today might be worth the risk.",
    "Your power isn't in manipulation. It's in transformation. Choose wisely.",
    "The thing you're obsessing about? It's a distraction from what actually needs healing.",
    "Death and rebirth is your theme. Something in your life needs to die today. Let it.",
    "Your emotional intelligence is off the charts. Use it for good, not games.",
    "Vulnerability won't destroy you. It might actually save you.",
    "The mystery you project is attractive. Just don't hide behind it forever.",
    "You forgive, but you never forget. Today, try actually letting go of one thing.",
    "Your intuition is psychic-level today. Trust the feeling even when logic disagrees.",
  ],
  Sagittarius: [
    "Freedom isn't running away. It's choosing what to run toward.",
    "Jupiter is expanding something in your life. Make sure it's worth expanding.",
    "Your optimism is contagious. But toxic positivity isn't optimism. Know the line.",
    "That adventure calling you? Answer it. But maybe pack a plan this time.",
    "Your honesty is refreshing to some and terrifying to others. Don't water it down.",
    "The next horizon is always more interesting than where you are. But are you present HERE?",
    "Commitment isn't a cage. It's a launchpad. Try seeing it differently today.",
    "Your philosophical mind needs stimulation. If you're bored, you're not asking big enough questions.",
    "Travel isn't always about miles. Today, travel inward.",
    "You believe in abundance. The universe is testing that belief right now.",
    "Your bluntness isn't rude. But timing matters. Read the room today.",
    "The meaning of life isn't found. It's created. What are you creating?",
    "Stop planning the next trip and be fully alive in this moment.",
    "Your fire is inspiring. Just make sure it warms people instead of burning them.",
    "Jupiter says: grow. The question is: in which direction?",
  ],
  Capricorn: [
    "The mountain doesn't care how tired you are. But you should. Rest is strategy.",
    "Saturn rewards discipline. But discipline without joy is just punishment.",
    "Your ambition is admirable. Your work-life balance? We need to talk.",
    "That wall you've built around your feelings? It's keeping out the good stuff too.",
    "You don't need to earn love. It's not a KPI.",
    "The plan is solid. Now ask yourself: is this MY plan or the one I inherited?",
    "Authority suits you. Just remember: the best leaders serve, not rule.",
    "Your patience with long-term goals is unmatched. Apply some of it to relationships.",
    "Success without fulfillment is the ultimate Capricorn trap. Are you fulfilled?",
    "Today's lesson: it's okay to not know the answer. Sit with uncertainty.",
    "Your reputation matters to you. But whose version of success are you building?",
    "Vulnerability isn't unprofessional. It's human. Try it today.",
    "The top of the mountain is lonely by design. Make sure you want what's up there.",
    "Saturn says: you've paid your dues. Today, collect what you're owed.",
    "Your skeleton is showing — that's your structure, your strength. Wear it proudly.",
  ],
  Aquarius: [
    "Your weirdness is your brand. Stop trying to normalize it.",
    "Uranus says: break something today. Preferably a pattern, not a person.",
    "Detachment isn't enlightenment. Sometimes it's avoidance with a philosophy degree.",
    "Your vision for the future is brilliant. Just don't forget to live in the present.",
    "Rebellion for its own sake is adolescence. Rebellion with purpose is revolution.",
    "You see the big picture. Today, zoom into one small, human detail.",
    "Your independence is sacred. But interdependence isn't weakness — it's evolution.",
    "The collective needs your ideas. But ideas without action are just entertainment.",
    "You think you're ahead of your time. You might be. Or you might be avoiding your time.",
    "Emotional intimacy is the frontier you haven't explored. Today's a good day to start.",
    "Your humanitarian impulse is beautiful. Start with the humans in your immediate circle.",
    "The system is broken. You know it. Today: fix one small piece of it.",
    "Your mind works differently than everyone else's. That's the point.",
    "Freedom and commitment aren't opposites. They're dance partners. Learn the steps.",
    "Uranus whispers: the revolution starts inside you.",
  ],
  Pisces: [
    "Your boundaries aren't suggestions. They're requirements. Enforce them today.",
    "Neptune is whispering dreams. Make sure they're YOUR dreams, not someone else's escape.",
    "Your empathy is a superpower. But absorbing everyone's pain isn't empathy — it's martyrdom.",
    "The fantasy is beautiful. Reality is where you actually live. Come back.",
    "Your intuition is crystal clear today. The fog lifts when you stop overthinking.",
    "Escapism comes in many forms. Identify yours. Then ask: what am I running from?",
    "Your creativity needs structure to thrive. Freedom without form is chaos.",
    "That person who keeps draining you? The cosmos is asking you to choose yourself.",
    "Compassion without boundaries is self-destruction. Today, be compassionate to yourself first.",
    "The spiritual world is real. But so are your bills. Balance both.",
    "Your sensitivity is not weakness. In a numb world, feeling everything is radical.",
    "Stop giving away pieces of yourself and wondering why you feel empty.",
    "The dream is the destination. But the work is the journey. Start both.",
    "Water finds its way. Stop forcing and start flowing with what is.",
    "Neptune says: dissolve what's false. What remains is your truth.",
  ],
};

/**
 * Get today's cosmic toast for a given sign.
 * Deterministic — same message for all users with same sign on same day.
 */
export function getDailyToast(signName: string): string {
  const messages = MESSAGES[signName];
  if (!messages) return "The stars have something for you today. Stay open.";

  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const idx = Math.abs((dayOfYear * 2654435761) | 0) % messages.length;
  return messages[idx];
}

/**
 * Check if user has already seen today's toast.
 */
export function hasSeenToday(): boolean {
  try {
    const key = "olivia-toast-date";
    const stored = localStorage.getItem(key);
    const today = new Date().toISOString().slice(0, 10);
    return stored === today;
  } catch {
    return false;
  }
}

/**
 * Mark today's toast as seen.
 */
export function markToastSeen(): void {
  try {
    localStorage.setItem("olivia-toast-date", new Date().toISOString().slice(0, 10));
  } catch {}
}
