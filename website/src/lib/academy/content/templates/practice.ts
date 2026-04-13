/**
 * practice.ts — Generates structured exercise content for academy practice lessons
 *
 * Handles lessons with type "practice" or slugs containing:
 * "practice", "workshop", "mock", "capstone", "exercise", "journaling"
 */

import type { LessonContent, ExerciseStep } from "../types";

// ─── Exercise sequences by slug ───

interface PracticeLesson {
  intro: string;
  steps: ExerciseStep[];
  minutes: number;
  takeaway: string;
  callout?: string;
}

const PRACTICE_MAP: Record<string, PracticeLesson> = {
  // ── Cosmic Alphabet: Reading your birth chart ──
  "reading-your-birth-chart": {
    intro: "This is your first hands-on encounter with your natal chart. You will learn to identify the key symbols and begin building your personal astrological profile. Have your birth date, time, and location ready.",
    steps: [
      { instruction: "Open your natal chart using the Chart page on this site, or use a free tool like astro.com. Enter your birth date, exact time, and location.", type: "lookup" },
      { instruction: "Look at the outer ring of the wheel. Find the 12 zodiac sign glyphs. Notice how they divide the circle into segments.", type: "observe" },
      { instruction: "Identify your Sun sign — the glyph of the Sun (a circle with a dot) and the sign it occupies. This is your core identity.", type: "observe" },
      { instruction: "Find your Moon sign — the crescent Moon glyph and its sign. This governs your emotional nature and inner needs.", type: "observe" },
      { instruction: "Locate your Rising sign (Ascendant) — the sign on the left-hand cusp of the chart, marked 'AC' or 'ASC.' This is how others perceive you.", type: "observe" },
      { instruction: "Write down your Big Three (Sun, Moon, Rising) and what each means to you personally. How do these three energies show up in your daily life?", type: "journal" },
    ],
    minutes: 15,
    takeaway: "Your Big Three — Sun, Moon, and Rising — form the foundation of your astrological identity. Everything else in the chart adds nuance to this core.",
    callout: "Do not worry about understanding every symbol yet. Today is about orientation. You are learning to read a new language, and every language starts with the alphabet.",
  },

  // ── Cosmic Alphabet: Your Big Three ──
  "your-big-three": {
    intro: "Now that you can locate your Sun, Moon, and Rising, let us go deeper. This exercise guides you through understanding what your Big Three actually mean in practice.",
    steps: [
      { instruction: "Write your Sun sign at the top of a page. Beneath it, list three ways your Sun sign shows up in how you present yourself to the world.", type: "journal" },
      { instruction: "Now write your Moon sign. List three emotional patterns or comfort needs that match your Moon sign's description.", type: "journal" },
      { instruction: "Write your Rising sign. Think about first impressions — how do people describe you when they first meet you? Does it match your Rising sign?", type: "reflect" },
      { instruction: "Look up the element of each placement. Do you have a dominant element (two or three in the same one) or are they spread across different elements?", type: "lookup" },
      { instruction: "Reflect: where do your Sun and Moon signs agree? Where do they create tension? This inner dialogue is a core part of who you are.", type: "reflect" },
    ],
    minutes: 18,
    takeaway: "Your Big Three are not separate identities — they are three dimensions of one person. Understanding their conversation is the beginning of real self-knowledge.",
  },

  // ── Celestial Players: Your Planets Revealed ──
  "your-planets-revealed": {
    intro: "Every planet in your chart tells part of your story. This exercise walks you through each one, building a complete portrait of your planetary self.",
    steps: [
      { instruction: "Open your natal chart and list all 10 planets with their sign and house placement. Start with the Sun and Moon, then Mercury through Pluto.", type: "lookup" },
      { instruction: "For each personal planet (Sun, Moon, Mercury, Venus, Mars), write one sentence about how that energy shows up in your life.", type: "journal" },
      { instruction: "Look at Jupiter and Saturn — your social planets. Jupiter shows where life expands; Saturn shows where it tests you. Do you recognize these themes?", type: "reflect" },
      { instruction: "Note any planets in the same sign (stellium) or any patterns you see — like all personal planets in one element.", type: "observe" },
      { instruction: "Choose the planet whose description surprised you most. Write a short paragraph about how this placement has shaped your experience.", type: "journal" },
    ],
    minutes: 20,
    takeaway: "Knowing your planets is knowing the full cast of characters inside you. Each one has a role, a need, and a way of expressing through you.",
  },

  // ── Life Arenas: Interactive house exploration ──
  "what-are-houses": {
    intro: "Houses tell you WHERE in your life planetary energies play out. This exercise helps you connect the abstract concept of houses to your real, lived experience.",
    steps: [
      { instruction: "Open your natal chart and identify which sign sits on the cusp (beginning) of each house. Write them down: 1st house = ?, 2nd house = ?, etc.", type: "lookup" },
      { instruction: "Look at houses 1, 4, 7, and 10 — the angular houses. These are the most powerful life areas. Note which planets (if any) sit in them.", type: "observe" },
      { instruction: "Pick one house that contains planets. Read about that house's life domain, then reflect: how has that area of life been particularly active or important for you?", type: "reflect" },
      { instruction: "Find your 'empty' houses — houses with no planets. These are not inactive, just not areas of intense focus. The house ruler still operates.", type: "observe" },
      { instruction: "Write a brief summary: which houses feel most alive in your life right now? What houses do you want to understand better?", type: "journal" },
    ],
    minutes: 15,
    takeaway: "Houses ground astrology in real life. Signs describe how, planets describe what, and houses describe where it all happens.",
  },

  // ── Aspects: Feel the Aspect ──
  "aspect-scenarios": {
    intro: "Aspects are relationships between planets. Reading about them is one thing; feeling how they play out in real life is another. This exercise uses story-based scenarios.",
    steps: [
      { instruction: "Look at your chart and find one square aspect (90 degrees). Write down the two planets involved and their signs.", type: "lookup" },
      { instruction: "Read each planet's meaning, then imagine them as two people in a room who disagree. What are they arguing about? Write a short dialogue.", type: "journal" },
      { instruction: "Now find a trine (120 degrees) in your chart. Write down the planets and signs.", type: "lookup" },
      { instruction: "Imagine these two planets as collaborators who effortlessly support each other. What project would they build together? Write a brief scene.", type: "journal" },
      { instruction: "Reflect: does the square feel like a real tension in your life? Does the trine feel like a natural gift you take for granted?", type: "reflect" },
    ],
    minutes: 15,
    takeaway: "Aspects are not abstract geometry — they are felt tensions and harmonies that shape your personality. Learning to feel them in your body, not just your mind, is the bridge to real interpretation.",
  },

  // ── Unfolding Story: What Happened When? ──
  "what-happened-when": {
    intro: "One of the most powerful ways to learn transits is to work backward. Pick a major life event and discover which transits were active at the time.",
    steps: [
      { instruction: "Choose a significant life event — a move, a breakup, a career change, a loss, or a breakthrough. Write the approximate date.", type: "reflect" },
      { instruction: "Look up the transiting planets for that date. You can use the Transit page on this site or astro.com's transit chart.", type: "lookup" },
      { instruction: "Identify which transiting planets were aspecting your natal planets. Were any outer planets (Saturn, Uranus, Neptune, Pluto) making exact aspects?", type: "observe" },
      { instruction: "Write down the transit and the event. For example: 'Saturn conjunct my natal Moon — I moved out of my parents' house and felt deeply alone.'", type: "journal" },
      { instruction: "Repeat with one more life event if you have time. Patterns will start to emerge — certain transits consistently correlate with certain themes.", type: "reflect" },
    ],
    minutes: 15,
    takeaway: "Working backward from known events is the fastest way to internalize transit meanings. When you can see that Pluto transit coincided with a total life transformation, the theory becomes real.",
  },

  // ── Relationships: Famous Couples Analysis ──
  "famous-couples": {
    intro: "Analyzing famous couples helps you practice synastry without the emotional charge of your own relationships. Look for patterns objectively.",
    steps: [
      { instruction: "Choose a famous couple whose relationship you know well — their story, chemistry, and ultimate outcome.", type: "reflect" },
      { instruction: "Look up both birth charts (Wikipedia often has birth data; astro.com has a celebrity database). Note each person's Venus, Mars, and Moon signs.", type: "lookup" },
      { instruction: "Compare their Venus and Mars placements. Are they in compatible elements? Do they form aspects to each other? Write what you observe.", type: "observe" },
      { instruction: "Check Sun-Moon connections. Does one person's Sun conjunct or trine the other's Moon? This indicates deep emotional resonance.", type: "observe" },
      { instruction: "Write a short synastry summary: what does the chart say about their chemistry, and does it match what you know about the real relationship?", type: "journal" },
    ],
    minutes: 15,
    takeaway: "Celebrity charts are your practice lab. The more charts you read, the faster patterns become intuitive.",
  },

  // ── Advanced: Synthesis Workshop I ──
  "synthesis-workshop-1": {
    intro: "Full chart synthesis is the art of weaving individual pieces into a coherent narrative. This workshop guides you through prioritizing and interpreting a complete chart.",
    steps: [
      { instruction: "Open a chart (your own or generate a random one). First, identify the Ascendant and its ruling planet. This is the chart ruler — the protagonist of the story.", type: "lookup" },
      { instruction: "Find the most aspected planet in the chart. Count how many major aspects (conjunction, sextile, square, trine, opposition) it makes. This planet dominates the personality.", type: "observe" },
      { instruction: "Check angular houses (1, 4, 7, 10) for planets. Angular planets are the loudest voices in the chart. Note them.", type: "observe" },
      { instruction: "Write a three-sentence personality summary using only the chart ruler, most aspected planet, and angular placements. This is the narrative backbone.", type: "journal" },
      { instruction: "Now add nuance: look at the Moon (emotional style), Venus (relationship style), and any stelliums. Expand your summary to a full paragraph.", type: "journal" },
      { instruction: "Finally, identify the most challenging aspect in the chart (usually a square or opposition). How does this tension drive the person's growth?", type: "reflect" },
    ],
    minutes: 25,
    takeaway: "Chart synthesis is about hierarchy — not every placement matters equally. Learn to find the loudest voices first, then add detail. This is how professional astrologers read.",
  },

  // ── Advanced: Synthesis Workshop II ──
  "synthesis-workshop-2": {
    intro: "This advanced workshop tackles a complex chart with stelliums, multiple patterns, and competing themes. Complexity is where real skill develops.",
    steps: [
      { instruction: "Open a chart with at least one stellium (three or more planets in one sign or house). Identify the stellium and its house/sign.", type: "lookup" },
      { instruction: "Determine: does this stellium dominate the chart? What life area does it emphasize? Write your initial impression.", type: "reflect" },
      { instruction: "Look for a T-square, Grand Trine, or other major pattern. Sketch it out and note the planets involved.", type: "observe" },
      { instruction: "Write a narrative that integrates the stellium with the aspect pattern. How do they tell one coherent story?", type: "journal" },
      { instruction: "Identify potential blind spots: with so much energy concentrated in one area, what areas of life might be neglected? Which houses are empty?", type: "reflect" },
      { instruction: "Deliver a one-paragraph summary as if you were explaining this chart to the person sitting across from you. Practice your speaking voice.", type: "journal" },
    ],
    minutes: 25,
    takeaway: "Complex charts are not harder to read — they have clearer themes. When energy concentrates, the story gets louder. Trust what stands out.",
  },

  // ── Advanced: Horary Practice Lab ──
  "horary-practice": {
    intro: "Horary astrology answers specific questions using a chart cast for the moment the question is asked. This lab walks you through a real horary judgment.",
    steps: [
      { instruction: "Think of a genuine yes/no question you want answered. Write it clearly. The question must be sincere — horary does not work with hypotheticals.", type: "reflect" },
      { instruction: "Note the exact time and your location. Cast a chart for this moment using whole sign houses.", type: "lookup" },
      { instruction: "Identify the querent (you) — the Ascendant ruler. Identify the quesited (what you are asking about) — the house ruler corresponding to the topic.", type: "observe" },
      { instruction: "Check: is the querent's planet applying to an aspect with the quesited's planet? An applying aspect suggests the matter will come together.", type: "observe" },
      { instruction: "Look for prohibitions — is another planet about to perfect an aspect first, blocking the connection?", type: "observe" },
      { instruction: "Write your judgment with reasoning. What does the chart say? Be specific about the testimony you used to arrive at your answer.", type: "journal" },
    ],
    minutes: 20,
    takeaway: "Horary is astrology at its most precise and testable. The more you practice, the sharper your judgment becomes.",
  },

  // ── Advanced: Mock Consultation I ──
  "mock-consultation-1": {
    intro: "Delivering a reading is a skill separate from chart interpretation. This exercise practices structure, empathy, and clear communication.",
    steps: [
      { instruction: "Choose a chart to read — either a friend's (with permission) or a practice chart. Spend 10 minutes preparing key themes before you begin.", type: "lookup" },
      { instruction: "Start with the Big Three: Sun, Moon, Rising. Explain each in plain language as if speaking to someone who knows nothing about astrology.", type: "observe" },
      { instruction: "Move to the chart ruler and most prominent planets. What story do they tell? Practice saying it out loud — hearing yourself builds fluency.", type: "reflect" },
      { instruction: "Address one challenging aspect. Practice delivering difficult information with empathy: name the tension, normalize it, offer the growth perspective.", type: "reflect" },
      { instruction: "Close with an empowering takeaway. What is the chart's greatest gift? Every chart has one. End on this note.", type: "journal" },
    ],
    minutes: 20,
    takeaway: "A great reading is not about displaying everything you know — it is about saying what the person needs to hear, in a way they can receive.",
  },

  // ── Advanced: Mock Consultation II ──
  "mock-consultation-2": {
    intro: "This mock consultation uses a chart with challenging aspects — squares, oppositions, and potentially difficult placements. Practice delivering honest readings with care.",
    steps: [
      { instruction: "Select or generate a chart with prominent squares or oppositions, ideally involving Saturn, Pluto, or the Moon.", type: "lookup" },
      { instruction: "Prepare by identifying the three most challenging features. For each, write both the difficulty AND the growth potential.", type: "journal" },
      { instruction: "Practice your opening. Never lead with the hardest part. Build rapport by starting with strengths and core identity.", type: "reflect" },
      { instruction: "Deliver the challenging information using this framework: name the pattern, normalize it ('many people with this placement experience...'), offer the growth path.", type: "reflect" },
      { instruction: "Practice handling a hypothetical emotional reaction. What if the client tears up? What if they deny everything? Write your response for each.", type: "journal" },
    ],
    minutes: 20,
    takeaway: "Difficult charts are not bad charts. Every challenge carries equal potential. Your job as a reader is to honor both the struggle and the strength.",
  },

  // ── Tarot: Card of the Day ──
  "card-a-day-intro": {
    intro: "The daily draw is the single most important practice for developing tarot fluency. One card, every day, with intentional reflection. This is how intuition is built.",
    steps: [
      { instruction: "Shuffle your deck (or use the Card of the Day page on this site). Take a moment to center yourself — three deep breaths.", type: "draw-card" },
      { instruction: "Before looking up the meaning, study the image. What do you notice first? What colors, figures, or symbols catch your eye? Write your first impression.", type: "reflect" },
      { instruction: "Now read the upright meaning. How does it relate to your day ahead? Is there a specific situation it speaks to?", type: "observe" },
      { instruction: "Write a 2-sentence journal entry connecting this card to your life right now. Be specific — not 'I feel hopeful' but 'This reminds me of the decision I am facing about...'", type: "journal" },
      { instruction: "At the end of the day, return to this card. Did its theme show up? How? This closing reflection is what builds real intuitive connection over time.", type: "reflect" },
    ],
    minutes: 10,
    takeaway: "Daily draws are not about prediction — they are about developing a daily conversation with your intuition. Consistency matters more than depth. Show up every day.",
  },

  // ── Tarot: The Fool's Journey Story ──
  "fools-journey-story": {
    intro: "The 22 Major Arcana tell a continuous story — the Fool's Journey from innocence to wholeness. This exercise asks you to narrate that journey in your own words.",
    steps: [
      { instruction: "Lay out (physically or mentally) the Major Arcana in order from The Fool (0) to The World (21). See them as chapters.", type: "observe" },
      { instruction: "Start at The Fool. In your own words, describe who the Fool is and what compels them to begin the journey.", type: "journal" },
      { instruction: "Move through the first act (Magician through Chariot). How does the Fool learn about the external world — willpower, intuition, authority, choice, determination?", type: "reflect" },
      { instruction: "Continue through the middle act (Strength through Temperance). This is the inner journey — courage, solitude, surrender, transformation, balance.", type: "reflect" },
      { instruction: "Narrate the final act (Devil through World). Shadow, destruction, hope, illusion, joy, reckoning, completion. How does the Fool become whole?", type: "journal" },
      { instruction: "Write a single paragraph summarizing the entire journey. What is its core message about being human?", type: "journal" },
    ],
    minutes: 15,
    takeaway: "When you can tell the Fool's Journey as a story, you have internalized the Major Arcana at a level deeper than memorization. The story IS the meaning.",
  },

  // ── Tarot: Celtic Cross Simulator ──
  "celtic-cross-simulator": {
    intro: "The Celtic Cross is the most comprehensive standard spread. This guided practice walks you through each of the 10 positions with full interpretation.",
    steps: [
      { instruction: "Formulate a clear, open-ended question. Write it down. The quality of your question determines the quality of your reading.", type: "reflect" },
      { instruction: "Draw 10 cards and lay them in the Celtic Cross pattern. Position 1: the present situation. Position 2: the challenge crossing it.", type: "draw-card" },
      { instruction: "Read positions 3 (foundation), 4 (recent past), 5 (possible outcome), and 6 (near future). How do these build a timeline?", type: "observe" },
      { instruction: "Read positions 7 (your attitude), 8 (external influences), 9 (hopes/fears), and 10 (final outcome). How does the inner world affect the outer?", type: "observe" },
      { instruction: "Now weave it together: write a 3-4 sentence narrative that connects all 10 positions into one coherent answer to your question.", type: "journal" },
      { instruction: "Identify the single card that speaks to you most strongly. What does your gut say about it? This is your intuition at work — trust it.", type: "reflect" },
    ],
    minutes: 20,
    takeaway: "The Celtic Cross is not about memorizing positions — it is about seeing how 10 pieces create one story. Practice this spread regularly and it becomes second nature.",
  },

  // ── Tarot: Shadow Work Journal ──
  "shadow-work-journal": {
    intro: "Shadow work uses tarot as a mirror for the parts of yourself you avoid, deny, or fear. This is deep inner work — approach it with compassion and honesty.",
    steps: [
      { instruction: "Set your intention: 'Show me something about myself that I need to see right now.' Shuffle and draw one card.", type: "draw-card" },
      { instruction: "Before reading the meaning, notice your emotional reaction. Are you relieved? Anxious? Dismissive? Your reaction IS the data.", type: "reflect" },
      { instruction: "Read the card's shadow meaning (reversed interpretation or challenging aspects of the upright). Where does this shadow live in your life?", type: "observe" },
      { instruction: "Write without editing for 3 minutes. Start with: 'The part of me I do not want to look at is...' Let whatever comes flow.", type: "journal" },
      { instruction: "Now draw a second card: 'What would it look like to integrate this shadow?' Read this card as medicine, not diagnosis.", type: "draw-card" },
      { instruction: "Close by writing one actionable step you can take this week to begin working with this shadow compassionately.", type: "journal" },
    ],
    minutes: 15,
    takeaway: "Shadow work is not about fixing what is broken — it is about reclaiming what was hidden. The cards you resist most are the ones with the most to teach you.",
  },

  // ── Tarot: Client Session Simulator ──
  "client-session-simulator": {
    intro: "Reading for yourself and reading for others are different skills. This simulator practices the interpersonal dimension — holding space, communicating clearly, and handling real reactions.",
    steps: [
      { instruction: "Imagine a client sits across from you. They ask: 'I just went through a breakup. What do I need to know?' Formulate your opening response before drawing.", type: "reflect" },
      { instruction: "Draw three cards for the client's question. Before interpreting, notice: do any of these cards make you uncomfortable to deliver? Why?", type: "draw-card" },
      { instruction: "Interpret the reading out loud (or write it as spoken words). Use second person: 'You are...' rather than 'This card means...'", type: "journal" },
      { instruction: "The client starts crying. Write what you would say and do. Remember: silence and presence are often more powerful than words.", type: "reflect" },
      { instruction: "The client asks: 'Will we get back together?' Practice reframing this into a more empowering question, then answer based on the cards.", type: "journal" },
    ],
    minutes: 20,
    takeaway: "Professional reading is 50% interpretation and 50% holding space. Technical skill without emotional intelligence falls flat. Practice both.",
  },

  // ── Living Practice: Practice Reading Exchange ──
  "practice-reading-exchange": {
    intro: "The reading exchange pairs you with a study partner for mutual chart readings. This is where knowledge meets real-world application.",
    steps: [
      { instruction: "Exchange birth data with your practice partner. Calculate both charts. Spend 10 minutes privately preparing key themes for their chart.", type: "lookup" },
      { instruction: "Deliver your reading to your partner (15 minutes). Start with their Big Three, move to prominent planets, and address one challenging aspect with care.", type: "observe" },
      { instruction: "After delivering, ask your partner: 'What resonated most? What did not fit?' Their feedback is invaluable — write it down.", type: "journal" },
      { instruction: "Switch roles. Receive your reading. Notice how it feels to be the client. What makes a reading land? What falls flat?", type: "reflect" },
      { instruction: "Together, discuss what you each learned about the art of delivery. What would you do differently next time?", type: "reflect" },
    ],
    minutes: 30,
    takeaway: "Reading for a real person transforms theoretical knowledge into lived skill. The gap between knowing and communicating is where mastery lives.",
  },

  // ── Capstone: Final integrated reading ──
  "capstone-project": {
    intro: "The capstone project is a full integrated reading: natal chart analysis combined with a tarot spread for a real person. This is the culmination of everything you have learned.",
    steps: [
      { instruction: "Select a willing participant (friend, family member, or fellow student). Gather their birth data and a clear question they want explored.", type: "lookup" },
      { instruction: "Prepare the natal chart analysis first. Identify their chart ruler, Big Three, most prominent planets, and the life area most relevant to their question.", type: "observe" },
      { instruction: "Based on their chart, design a custom tarot spread. Each position should address a specific aspect of their question informed by their chart.", type: "reflect" },
      { instruction: "Conduct the full reading: chart overview first, then tarot spread. Weave the two systems together — let the chart inform how you interpret the cards.", type: "journal" },
      { instruction: "Close with an integrated summary. What does their chart say about WHY this question matters to them? What do the cards say about the path forward?", type: "journal" },
      { instruction: "After the reading, write a self-assessment: what went well, what was challenging, and what you want to develop further.", type: "reflect" },
    ],
    minutes: 30,
    takeaway: "Integration is the goal — not just knowing two systems, but letting them speak through you as one unified language. This reading is your graduation into practice.",
  },
};

// ─── Additional slug patterns to catch ──

const SLUG_ALIASES: Record<string, string> = {
  "symbol-spotter": "card-a-day-intro", // similar exercise structure
  "fools-journey-story": "fools-journey-story",
  "card-a-day-intro": "card-a-day-intro",
  "celtic-cross-simulator": "celtic-cross-simulator",
  "shadow-work-journal": "shadow-work-journal",
  "client-session-simulator": "client-session-simulator",
  "practice-reading-exchange": "practice-reading-exchange",
  "capstone-project": "capstone-project",
  "reading-your-birth-chart": "reading-your-birth-chart",
  "your-big-three": "your-big-three",
  "your-planets-revealed": "your-planets-revealed",
  "what-are-houses": "what-are-houses",
  "aspect-scenarios": "aspect-scenarios",
  "what-happened-when": "what-happened-when",
  "famous-couples": "famous-couples",
  "synthesis-workshop-1": "synthesis-workshop-1",
  "synthesis-workshop-2": "synthesis-workshop-2",
  "horary-practice": "horary-practice",
  "mock-consultation-1": "mock-consultation-1",
  "mock-consultation-2": "mock-consultation-2",
};

/**
 * Generate practice/exercise content for a lesson.
 * Returns null if the lesson slug does not match a practice pattern.
 */
export function generatePracticeContent(
  courseSlug: string,
  lessonSlug: string,
  locale: string = "en",
): LessonContent | null {
  // Check if this is a practice-type lesson by slug patterns
  const isPracticeLesson =
    lessonSlug.includes("practice") ||
    lessonSlug.includes("workshop") ||
    lessonSlug.includes("mock") ||
    lessonSlug.includes("capstone") ||
    lessonSlug.includes("exercise") ||
    lessonSlug.includes("journaling") ||
    lessonSlug.includes("simulator") ||
    lessonSlug.includes("shadow-work-journal");

  // Also check direct map
  const resolvedSlug = SLUG_ALIASES[lessonSlug] || lessonSlug;
  const data = PRACTICE_MAP[resolvedSlug];

  if (!data && !isPracticeLesson) return null;
  if (!data) return null;

  const sections: LessonContent["sections"] = [
    {
      type: "text",
      title: "Hands-On Practice",
      body: data.intro,
    },
  ];

  if (data.callout) {
    sections.push({
      type: "callout",
      style: "tip",
      body: data.callout,
    });
  }

  sections.push({
    type: "exercise",
    steps: data.steps,
  });

  sections.push({
    type: "callout",
    style: "insight",
    body: data.takeaway,
  });

  return {
    sections,
    estimatedMinutes: data.minutes,
    keyTakeaway: data.takeaway,
  };
}
