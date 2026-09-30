/** "Sun in Aries" / «Сонце в Овні»: placement phrases with Ukrainian case and euphony. */

const UK_SIGN_IN: Record<string, string> = {
  aries: "Овні", taurus: "Тельці", gemini: "Близнюках", cancer: "Раку", leo: "Леві", virgo: "Діві",
  libra: "Терезах", scorpio: "Скорпіоні", sagittarius: "Стрільці", capricorn: "Козорозі", aquarius: "Водолії", pisces: "Рибах",
};

const VOWEL = /[аеєиіїоуюяaeiou]/i;

/** «в» or «у» between two words, by the rules of милозвучність. */
export function ukIn(before: string, after: string): "в" | "у" {
  if (/^(в|ф|льв|св|тв|хв)/i.test(after)) return "у";
  const vowelBefore = VOWEL.test(before.slice(-1));
  const vowelAfter = VOWEL.test(after.charAt(0));
  return vowelBefore || vowelAfter ? "в" : "у";
}

/** "Venus in Taurus" / «Венера в Тельці». `subject` and `signName` come from copy.json. */
export function placedIn(locale: "en" | "uk", subject: string, sign: string, signName: string): string {
  if (locale === "en") return `${subject} in ${signName}`;
  const where = UK_SIGN_IN[sign] ?? signName;
  return `${subject} ${ukIn(subject, where)} ${where}`;
}
