/**
 * The real stars around the ecliptic for the astrology scenes: the site's
 * bright-star catalogue with its constellation lines, the field stars and
 * the Milky Way, converted to ecliptic longitude and latitude (J2000;
 * precession since is invisible at this scale). Computed once.
 */

import { CONSTELLATIONS, STARS, fieldStars, milkyWay } from "@/lib/star-chart";

const DEG = Math.PI / 180;
const EPS = 23.4393 * DEG;

type Point = { lon: number; lat: number };
export type SkyField = {
  stars: (Point & { r: number })[];
  lines: Point[][];
  milky: (Point & { w: number })[];
  field: (Point & { w: number })[];
  /** Where to write each constellation's name: the circular mean of its stars. */
  names: (Point & { en: string; uk: string })[];
};

/** J2000 RA (hours) / Dec (degrees) → ecliptic longitude and latitude, degrees. */
function toEcliptic(raHours: number, decDeg: number): Point {
  const a = raHours * 15 * DEG, d = decDeg * DEG;
  const beta = Math.asin(Math.sin(d) * Math.cos(EPS) - Math.cos(d) * Math.sin(EPS) * Math.sin(a));
  const lambda = Math.atan2(Math.sin(a) * Math.cos(EPS) + Math.tan(d) * Math.sin(EPS), Math.cos(a));
  return { lon: ((lambda / DEG) % 360 + 360) % 360, lat: beta / DEG };
}

let cache: SkyField | null = null;
export function skyField(): SkyField {
  if (cache) return cache;
  const stars = STARS.map((s) => ({ ...toEcliptic(s.ra, s.dec), r: Math.max(0.8, 3 - 0.6 * s.mag) }));
  const lines = CONSTELLATIONS.flatMap((c) => c.lines.filter((run) => run.length > 1).map((run) => run.map((i) => ({ lon: stars[i].lon, lat: stars[i].lat }))));
  const milky = milkyWay(2400).map((m) => ({ ...toEcliptic(m.ra, m.dec), w: m.w }));
  const field = fieldStars(420).map((m) => ({ ...toEcliptic(m.ra, m.dec), w: m.w }));
  const names = CONSTELLATIONS.map((c) => {
    const members = [...new Set(c.lines.flat())].map((i) => stars[i]);
    const x = members.reduce((sum, m) => sum + Math.cos(m.lon * DEG), 0), y = members.reduce((sum, m) => sum + Math.sin(m.lon * DEG), 0);
    const lon = ((Math.atan2(y, x) / DEG) % 360 + 360) % 360;
    return { lon, lat: members.reduce((sum, m) => sum + m.lat, 0) / members.length, en: c.name, uk: c.nameUk };
  });
  cache = { stars, lines, milky, field, names };
  return cache;
}

/** A filled circle as path data, so thousands of dots paint as one shape. */
export function dot(p: { x: number; y: number }, r: number): string {
  return `M${(p.x - r).toFixed(1)},${p.y.toFixed(1)}a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1,0 ${(-2 * r).toFixed(2)},0`;
}

/** Nudges crowded points apart so none sit closer than `gap` degrees; keeps order. */
export function spreadLongitudes(longitudes: number[], gap: number): number[] {
  const order = longitudes.map((lon, i) => ({ lon, i })).sort((a, b) => a.lon - b.lon);
  const shown = order.map((entry) => entry.lon);
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let k = 0; k < shown.length; k++) {
      const next = (k + 1) % shown.length;
      let distance = shown[next] - shown[k];
      if (next === 0) distance += 360;
      if (distance < gap) {
        const push = (gap - distance) / 2;
        shown[k] -= push;
        shown[next] += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const result = new Array<number>(longitudes.length);
  order.forEach((entry, k) => { result[entry.i] = shown[k]; });
  return result;
}
