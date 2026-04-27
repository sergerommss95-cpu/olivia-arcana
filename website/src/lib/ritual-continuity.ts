/**
 * ritual-continuity.ts — Intelligent Journey Completion
 * 
 * Maps tarot cards and planetary hours to specific next actions
 * in the Academy or Journal. Closes the 'What Now?' logic gap.
 */

export interface SuggestedAction {
  label: string;
  href: string;
  reason: string;
}

const ACADEMY_PATH = "/academy";
const JOURNAL_PATH = "/journal";

export function getSuggestedAction(cardName: string, element: string): SuggestedAction {
  // Elemental logic for journal prompts
  if (cardName.includes("Swords") || element === "Air") {
    return {
      label: "Log mental patterns",
      href: JOURNAL_PATH,
      reason: "Air energy is high today. Use the Journal to clear mental clutter."
    };
  }

  if (cardName.includes("Cups") || element === "Water") {
    return {
      label: "Emotional reflection",
      href: JOURNAL_PATH,
      reason: "Your intuition is peaking. Record your feelings before they shift."
    };
  }

  // Specific Major Arcana mappings to Academy
  switch (cardName) {
    case "The Fool":
    case "The Magician":
      return {
        label: "Master Manifestation",
        href: `${ACADEMY_PATH}/cosmic-alphabet`,
        reason: "New energy detected. Learn to channel it in the Academy."
      };
    case "The High Priestess":
    case "The Moon":
      return {
        label: "Explore Shadow Work",
        href: `${ACADEMY_PATH}/celestial-players`,
        reason: "The hidden is being revealed. Deepen your occult knowledge."
      };
    case "The Emperor":
    case "The Hierophant":
      return {
        label: "Study Structure",
        href: `${ACADEMY_PATH}/life-arenas`,
        reason: "Time to build. Learn how the Houses govern your reality."
      };
    default:
      return {
        label: "Continue Lesson",
        href: ACADEMY_PATH,
        reason: "Your cosmic path continues. Feed your mind in the Academy."
      };
  }
}
