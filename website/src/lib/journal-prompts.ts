/**
 * journal-prompts.ts — 100 cosmic journal prompts
 *
 * Categorized by moon phase + general.
 * getDailyPrompt() returns a deterministic prompt for each date.
 */

const NEW_MOON: string[] = [
  "What intention do you want to plant in the dark soil of this new moon?",
  "If you could begin one thing without fear, what would it be?",
  "What part of your life is asking to be reborn right now?",
  "Write a letter to the version of yourself you're becoming.",
  "What seeds are you planting today that your future self will harvest?",
  "In the silence of the new moon, what whispers do you hear from your intuition?",
  "What are you ready to release so new growth can emerge?",
  "Describe the life you want to magnetize during this lunar cycle.",
  "What belief no longer serves you? Write its replacement.",
  "If this new moon were a doorway, what would be on the other side?",
  "What does your soul need that your ego has been ignoring?",
  "Write three non-negotiable intentions for the month ahead.",
  "What would you do differently if you truly believed in your own magic?",
  "How can you honor both your ambition and your need for rest this cycle?",
  "What conversation with yourself have you been avoiding?",
];

const FULL_MOON: string[] = [
  "What has come to fruition since the last new moon? Celebrate it.",
  "What are you most grateful for under this full moon's light?",
  "What emotion is asking to be released tonight?",
  "Write down everything you're ready to let go of. Then breathe.",
  "What truth has become impossible to ignore?",
  "Under this full moon, what part of you is finally being illuminated?",
  "What harvest are you reaping from seeds planted months ago?",
  "Write a thank-you letter to a challenge that shaped you.",
  "What relationship or situation has reached its climax?",
  "If the full moon could burn away one fear, which would you choose?",
  "What have you been holding onto that no longer belongs to you?",
  "Describe a moment this month when you felt completely alive.",
  "What does forgiveness look like for you right now?",
  "Write about the contrast between who you were and who you are becoming.",
  "What would you do if you stopped waiting for permission?",
];

const WAXING: string[] = [
  "What action can you take today to move closer to your intention?",
  "Where in your life do you need to show up more boldly?",
  "What is growing in your life right now? How can you nurture it?",
  "Write about a risk that's calling to you.",
  "What skill or quality are you actively developing?",
  "How has your confidence grown recently?",
  "What momentum are you building? How does it feel?",
  "Describe one small step you can take today toward a bigger dream.",
  "What is the universe conspiring to help you create?",
  "Where do you need to push through resistance?",
  "What would your most courageous self do today?",
  "Write about something you're building that excites you.",
  "What boundary do you need to set to protect your growth?",
  "How are you showing up for your commitments this week?",
  "What affirmation does your growing self need to hear?",
];

const WANING: string[] = [
  "What lesson from this cycle do you want to carry forward?",
  "What are you ready to release as the moon wanes?",
  "Where do you need to slow down and integrate?",
  "Write about a pattern you've noticed in yourself recently.",
  "What would it feel like to truly rest without guilt?",
  "What have you learned about yourself this lunar cycle?",
  "Where in your life are you clinging to something past its season?",
  "Write about the beauty of endings and transitions.",
  "What wisdom has emerged from recent challenges?",
  "How can you practice deeper surrender this week?",
  "What would letting go look like in your current situation?",
  "Describe the space that opens when you release what's heavy.",
  "What does your inner voice say when the world gets quiet?",
  "How have you changed since the beginning of this month?",
  "What gentle truth are you finally ready to accept?",
];

const GENERAL: string[] = [
  "What does your ideal morning feel like in every sensory detail?",
  "Write about a synchronicity that happened recently.",
  "If your intuition could speak in full sentences, what would it say today?",
  "What does 'home' mean to you beyond a physical place?",
  "Describe a moment when you felt deeply connected to something larger than yourself.",
  "What are you afraid to want? Write about it anyway.",
  "If your body could talk, what would it tell you right now?",
  "What does self-love look like in practice, not theory?",
  "Write about a relationship that has taught you the most about yourself.",
  "What would you do with your day if no one was watching or judging?",
  "Describe the feeling of being exactly where you're supposed to be.",
  "What creative impulse have you been suppressing?",
  "Write about a childhood dream that still lives inside you.",
  "What does abundance actually look like in your life?",
  "If you could send a message to yourself one year ago, what would it say?",
  "What invisible labor do you perform that deserves acknowledgment?",
  "Write about a time your instincts were right and you didn't listen.",
  "What would radical honesty with yourself look like today?",
  "Describe the version of you that exists in your wildest dreams.",
  "What daily ritual connects you most to your inner self?",
  "If your zodiac sign were a landscape, what would it look like?",
  "Write about a piece of music that moves something deep within you.",
  "What does your shadow self need from you today?",
  "Describe a moment of unexpected beauty you witnessed recently.",
  "What three words describe the energy you want to carry this week?",
  "Write a love letter to your life as it is right now.",
  "What does 'enough' feel like in your body?",
  "If the stars were writing your next chapter, what would the title be?",
  "What recurring dream or thought pattern is trying to tell you something?",
  "Write about the difference between loneliness and solitude.",
  "What part of yourself do you hide from the world? Why?",
  "Describe your relationship with time. Is it friend or foe?",
  "What does courage mean to you in this season of your life?",
  "Write about a place that holds deep meaning for you.",
  "What is the most compassionate thing you can do for yourself today?",
  "If you could bottle one feeling and keep it forever, which would it be?",
  "Write about something you've outgrown but haven't fully released.",
  "What does your inner child need to hear from you?",
  "Describe the sensation of being in flow — when do you feel it most?",
  "What legacy do you want to leave behind?",
];

// ── Phase detection helpers ──

function classifyPhase(phase: string): "new" | "full" | "waxing" | "waning" | "general" {
  const lower = phase.toLowerCase();
  if (lower.includes("new")) return "new";
  if (lower.includes("full")) return "full";
  if (lower.includes("waxing")) return "waxing";
  if (lower.includes("waning")) return "waning";
  if (lower.includes("first quarter")) return "waxing";
  if (lower.includes("last quarter") || lower.includes("third quarter")) return "waning";
  return "general";
}

function getPool(phase: string): string[] {
  switch (classifyPhase(phase)) {
    case "new": return NEW_MOON;
    case "full": return FULL_MOON;
    case "waxing": return WAXING;
    case "waning": return WANING;
    default: return GENERAL;
  }
}

// ── Public API ──

/** Get a deterministic prompt for a given date and moon phase */
export function getDailyPrompt(moonPhase: string, dateStr?: string): string {
  const pool = getPool(moonPhase);
  // Deterministic by date
  const date = dateStr || new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);
  return pool[hash % pool.length];
}

/** Get all prompts for a given phase category */
export function getPromptsForPhase(moonPhase: string): string[] {
  return getPool(moonPhase);
}
