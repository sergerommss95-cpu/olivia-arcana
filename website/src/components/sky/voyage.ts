/**
 * CARTA COELI — the voyage contract.
 *
 * The site is one real sky. Every page keeps a berth at a true
 * constellation (J2000 coordinates, the site's own star catalog);
 * navigation is a camera flight between berths, and the Atlas draws
 * the whole edition as an engraved chart.
 *
 * Events (window):
 *   "oa-sky-fly"    detail: { path: string }   — begin flight toward PORTS[path]
 *   "oa-sky-arrive" detail: { path: string }   — flight settled
 *   "oa-sky-map"    detail: { open: boolean }  — Atlas overlay open/close
 */

export type SkyPort = {
  /** Right ascension of the berth, HOURS (catalog convention). */
  ra: number;
  /** Declination, degrees. */
  dec: number;
  /** Constellation name EXACTLY as in CONSTELLATIONS[].name (star-chart.ts). */
  constellation: string;
  /** Page label for the chart cartouche. */
  label: string;
  labelUk: string;
};

/** Berths of the edition. Coordinates = a bright anchor star of each figure. */
export const PORTS: Record<string, SkyPort> = {
  "/":         { ra: 0.14,  dec: 29.09,  constellation: "Pegasus",         label: "The Almanac",   labelUk: "Альманах" },
  "/oracle":   { ra: 0.675, dec: 56.54,  constellation: "Cassiopeia",      label: "The Oracle",    labelUk: "Оракул" },
  "/daily":    { ra: 2.53,  dec: 89.26,  constellation: "Ursa Minor",      label: "The Daily Card", labelUk: "Карта дня" },
  "/academy":  { ra: 18.616, dec: 38.784, constellation: "Lyra",           label: "The Academy",   labelUk: "Академія" },
  "/pricing":  { ra: 15.283, dec: -9.383, constellation: "Libra",          label: "The Tariff",    labelUk: "Тариф" },
  "/chart":    { ra: 2.065, dec: 42.33,  constellation: "Andromeda",       label: "The Chart",     labelUk: "Карта неба" },
  "/portrait": { ra: 1.162, dec: 35.62,  constellation: "Andromeda",       label: "The Portrait",  labelUk: "Портрет" },
  "/cosmos":   { ra: 3.405, dec: 49.861, constellation: "Perseus",         label: "The Cosmos",    labelUk: "Космос" },
  "/signs":    { ra: 10.139, dec: 11.967, constellation: "Leo",            label: "The Signs",     labelUk: "Знаки" },
  "/story":    { ra: 23.079, dec: 15.205, constellation: "Pegasus",        label: "The Story",     labelUk: "Історія" },
  "/ask":      { ra: 19.846, dec: 8.868, constellation: "Aquila",          label: "Ask",           labelUk: "Питання" },
  "/journal":  { ra: 20.69,  dec: 45.28,  constellation: "Cygnus",         label: "The Journal",   labelUk: "Журнал" },
  "/transits": { ra: 14.261, dec: 19.182, constellation: "Boötes",         label: "The Transits",  labelUk: "Транзити" },
  "/timing":   { ra: 14.261, dec: 19.182, constellation: "Boötes",         label: "The Timing",    labelUk: "Терміни" },
  "/synastry": { ra: 7.755, dec: 28.026, constellation: "Gemini",          label: "The Synastry",  labelUk: "Сумісність" },
};

/** Resolve a pathname to its berth ("/signs/leo" → "/signs"). */
export function portFor(pathname: string): SkyPort | null {
  if (PORTS[pathname]) return PORTS[pathname];
  const root = "/" + (pathname.split("/")[1] ?? "");
  return PORTS[root] ?? null;
}

export const FLIGHT_MS = 950;

/* ── Carta Incognita — the atlas charts itself ──────────────────
   A fresh visitor's chart shows the berth figures faint and
   nameless, the way an unexplored coast is drawn. Arriving at a
   page inks its constellation for good: the edition is charted by
   being travelled. Memory is the visitor's own (localStorage). */

const CHARTED_KEY = "oa-charted";
export const CHARTED_EVENT = "oa-sky-charted";

/** Berth paths this visitor has travelled (home is given free). */
export function chartedPorts(): Set<string> {
  const s = new Set<string>(["/"]);
  if (typeof window === "undefined") return s;
  try {
    const raw = JSON.parse(localStorage.getItem(CHARTED_KEY) ?? "[]");
    if (Array.isArray(raw)) for (const p of raw) if (typeof p === "string" && PORTS[p]) s.add(p);
  } catch {}
  return s;
}

/** Ink a berth. Returns true when it was newly charted. */
export function markCharted(pathname: string): boolean {
  if (typeof window === "undefined") return false;
  const port = portFor(pathname);
  if (!port) return false;
  const key = PORTS[pathname] ? pathname : "/" + (pathname.split("/")[1] ?? "");
  const have = chartedPorts();
  if (have.has(key)) return false;
  have.add(key);
  try {
    localStorage.setItem(CHARTED_KEY, JSON.stringify([...have].filter((p) => p !== "/")));
  } catch {}
  window.dispatchEvent(new CustomEvent(CHARTED_EVENT, { detail: { path: key } }));
  return true;
}

export function flyTo(path: string) {
  window.dispatchEvent(new CustomEvent("oa-sky-fly", { detail: { path } }));
}
export function openAtlas(open = true) {
  window.dispatchEvent(new CustomEvent("oa-sky-map", { detail: { open } }));
}
