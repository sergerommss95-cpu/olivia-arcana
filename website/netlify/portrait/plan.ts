// website/netlify/portrait/plan.ts
/** Which calculated factors each section of the reading is built around. */

type Packet = { factors: { id: string }[] };
export const SECTIONS = {
  a: ["overview", "temperament", "inner", "gifts", "bonds", "direction"],
  b: ["mind", "heart", "work"],
  c: ["shadow", "love", "becoming"],
} as const;
export type Stage = keyof typeof SECTIONS;

const FOCUS: Record<string, string[]> = {
  overview: [],
  temperament: ["natal-sun", "natal-asc", "natal-mercury", "num-personality", "arkan-14", "arkan-13"],
  inner: ["natal-moon", "num-soulUrge", "arkan-12", "arkan-13", "arkan-4"],
  gifts: ["arkan-8", "arkan-7", "arkan-6", "num-expression", "natal-mars", "natal-mc"],
  bonds: ["natal-venus", "natal-moon", "arkan-14", "num-soulUrge", "num-personality"],
  direction: ["arkan-1", "arkan-2", "arkan-3", "num-lifePath", "arkan-5", "arkan-6"],
  mind: ["natal-mercury", "num-expression", "arkan-5", "natal-uranus", "natal-jupiter"],
  heart: ["natal-moon", "natal-venus", "num-soulUrge", "arkan-12", "arkan-13"],
  work: ["arkan-7", "arkan-8", "natal-mars", "natal-saturn", "natal-mc", "num-expression"],
  shadow: ["arkan-4", "natal-saturn", "natal-pluto", "num-lifePath", "natal-neptune"],
  love: ["natal-venus", "natal-mars", "natal-moon", "arkan-14", "num-soulUrge"],
  becoming: ["arkan-1", "arkan-2", "arkan-3", "arkan-6", "num-lifePath", "natal-jupiter"],
};

export function focusFor(section: string, packet: Packet) {
  const present = new Set(packet.factors.map((f) => f.id));
  return (FOCUS[section] ?? []).filter((id) => present.has(id));
}
