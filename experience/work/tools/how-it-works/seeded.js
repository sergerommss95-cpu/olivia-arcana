// For filming only: a repeatable shuffle, so the take draws a chosen card.
export const seededCrypto = seed => {
  let s = seed >>> 0;
  const next = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return (t ^ (t >>> 14)) >>> 0; };
  const original = crypto.getRandomValues.bind(crypto);
  crypto.getRandomValues = array => { if (array instanceof Uint32Array) { for (let i = 0; i < array.length; i++) array[i] = next(); return array; } return original(array); };
};
