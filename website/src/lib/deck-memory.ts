/**
 * deck-memory.ts — Living Deck Aging System
 *
 * Tracks how many times each card has been drawn, creating a "living deck"
 * that ages with use. localStorage-backed. Card IDs are card names
 * (e.g. "The Fool", "Ace of Wands").
 */

export interface CardMemory {
  drawCount: number;
  lastDrawn: string;     // ISO date
  firstDrawn: string;    // ISO date
  isFavorite: boolean;
}

const STORAGE_KEY = "olivia-deck-memory";

function load(): Record<string, CardMemory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(data: Record<string, CardMemory>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently fail
  }
}

/** Record a card draw */
export function recordDraw(cardId: string): void {
  const data = load();
  const now = new Date().toISOString();
  const existing = data[cardId];

  if (existing) {
    data[cardId] = {
      ...existing,
      drawCount: existing.drawCount + 1,
      lastDrawn: now,
    };
  } else {
    data[cardId] = {
      drawCount: 1,
      lastDrawn: now,
      firstDrawn: now,
      isFavorite: false,
    };
  }

  save(data);
}

/** Get memory for a specific card */
export function getCardMemory(cardId: string): CardMemory | null {
  const data = load();
  return data[cardId] ?? null;
}

/** Get all card memories */
export function getAllMemories(): Record<string, CardMemory> {
  return load();
}

/** Get the "age" uniform value (0-1) for shader use.
 *  Maps drawCount 0-30 to 0-1, clamped. */
export function getCardAge(cardId: string): number {
  const mem = getCardMemory(cardId);
  if (!mem) return 0;
  return Math.min(mem.drawCount / 30, 1);
}

/** Get top N most drawn cards */
export function getMostDrawn(
  n: number = 5,
): { cardId: string; memory: CardMemory }[] {
  const data = load();
  return Object.entries(data)
    .map(([cardId, memory]) => ({ cardId, memory }))
    .sort((a, b) => b.memory.drawCount - a.memory.drawCount)
    .slice(0, n);
}

/** Get total draws across all cards */
export function getTotalDraws(): number {
  const data = load();
  return Object.values(data).reduce((sum, m) => sum + m.drawCount, 0);
}

/** Toggle favorite — returns new favorite state */
export function toggleFavorite(cardId: string): boolean {
  const data = load();
  const existing = data[cardId];

  if (existing) {
    existing.isFavorite = !existing.isFavorite;
    save(data);
    return existing.isFavorite;
  }

  // Card has never been drawn — create a memory entry
  const now = new Date().toISOString();
  data[cardId] = {
    drawCount: 0,
    lastDrawn: now,
    firstDrawn: now,
    isFavorite: true,
  };
  save(data);
  return true;
}
