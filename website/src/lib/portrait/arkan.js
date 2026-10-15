// website/src/lib/portrait/arkan.js
/**
 * The individual Arkan portrait in Alla Alicja Chrzanowska's public method:
 * eleven positions worked out from the birth date alone.
 * Ported from the V18 portrait (engine/knowledge-engine.js, calculatePortrait).
 *
 * Plain JS with JSDoc so the node test runner can import it directly.
 */

export const POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 12, 13, 14];
/** The earlier positions each derived position adds together. */
export const LINKS = { 4: [1, 2], 5: [2, 3], 6: [4, 5], 7: [1, 5], 8: [2, 6], 12: [7, 8], 13: [1, 4, 6], 14: [3, 5, 6] };
export const ARKAN_SOURCE = "https://as2.com.pl/content/31-sposob-obliczania-i-interpretacji-indywidualnego-tarotowego-portretu-psychologicznego";

/** @param {number} value  Subtract 22 until the value is 1–22. */
export function reduce22(value) {
  if (!Number.isInteger(value) || value < 1) throw new RangeError("reduce22 needs a positive whole number");
  return ((value - 1) % 22) + 1;
}

/**
 * School numeral (1–22) → index into the 22 Majors of the deck.
 * The school counts XXII as the Fool, VIII as Justice and XI as Strength.
 * @param {number} numeral
 */
export function cardOf(numeral) {
  if (!Number.isInteger(numeral) || numeral < 1 || numeral > 22) throw new RangeError("school numeral must be 1–22");
  return numeral === 22 ? 0 : numeral === 8 ? 11 : numeral === 11 ? 8 : numeral;
}

/** @param {string} date  YYYY-MM-DD */
export function arkanPortrait(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError("date must be YYYY-MM-DD");
  const [year, month, day] = match.slice(1).map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) throw new RangeError("not a calendar date");

  const digits = [...String(year)].map(Number);
  const yearSum = digits.reduce((sum, digit) => sum + digit, 0);
  /** @type {Record<number, number>} */
  const numeral = { 1: reduce22(day), 2: month, 3: reduce22(yearSum) };
  const steps = [
    { position: 1, inputs: [day], sum: day, numeral: numeral[1] },
    { position: 2, inputs: [month], sum: month, numeral: numeral[2] },
    { position: 3, inputs: digits, sum: yearSum, numeral: numeral[3] },
  ];
  // Integer keys iterate in ascending order, so every input is ready before it is used.
  for (const [key, from] of Object.entries(LINKS)) {
    const position = Number(key);
    const sum = from.reduce((total, p) => total + numeral[p], 0);
    numeral[position] = reduce22(sum);
    steps.push({ position, inputs: from, sum, numeral: numeral[position] });
  }
  return {
    positions: POSITIONS.map((position) => ({ position, numeral: numeral[position], card: cardOf(numeral[position]) })),
    steps,
    check: reduce22(numeral[4] + numeral[5] + numeral[6]) === numeral[12],
  };
}
