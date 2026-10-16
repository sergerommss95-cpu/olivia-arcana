// website/src/lib/portrait/uncertain.js
/**
 * Without a birth time, a fast body can change sign during the birthday.
 * Sample the local civil day hourly (plus its last minute) and keep every
 * sign each personal body occupied, so the reading can stay conditional.
 */

import { birthMoment, skyAt } from "../astrology/chart.js";

export const PERSONAL_BODIES = ["sun", "moon", "mercury", "venus", "mars"];
const HOUR = 3_600_000;

/** @param {{ date: string, zone: string }} birth */
export function signsThroughDay({ date, zone }) {
  const start = birthMoment({ date, time: "00:00", zone }).utc.getTime();
  const end = birthMoment({ date, time: "23:59", zone }).utc.getTime() + 59_000;
  /** @type {Record<string, string[]>} */
  const found = Object.fromEntries(PERSONAL_BODIES.map((key) => [key, []]));
  for (let t = start; ; t = Math.min(t + HOUR, end)) {
    for (const body of skyAt(new Date(t))) {
      const seen = found[body.key];
      if (seen && !seen.includes(body.sign)) seen.push(body.sign);
    }
    if (t === end) break;
  }
  return found;
}
