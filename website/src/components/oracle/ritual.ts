/** Shareable readings use these two independent, stable seeded streams. */
export function shuffleForSitting<T>(cards: readonly T[], seed: number, count: number): T[] {
  let a = seed | 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}

export function orientationsForSitting(seed: number, count: number): boolean[] {
  let a = (seed ^ 0x9e3779b9) | 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => rng() < 1 / 3);
}

export function parseSharedDraw(value: string, count: number, pool: number): number[] | null {
  const values = value.split(",");
  if (values.length !== count || values.some((part) => !/^\d+$/.test(part))) return null;
  const indices = values.map(Number);
  return new Set(indices).size === count && indices.every((id) => Number.isInteger(id) && id >= 0 && id < pool)
    ? indices : null;
}

/** A sitting owns one pending transition. Reset and unmount cancel it. */
export function createRitualTimer() {
  let pending: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (pending !== null) clearTimeout(pending);
    pending = null;
  };
  return {
    cancel,
    schedule(callback: () => void, delay: number) {
      cancel();
      pending = setTimeout(() => { pending = null; callback(); }, delay);
    },
  };
}
