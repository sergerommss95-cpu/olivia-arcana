/** Birth places: a bundled list searched in English, Ukrainian and older spellings, loaded on first use. */

export type Place = {
  en: string;
  uk: string;
  country: string;
  countryEn: string;
  countryUk: string;
  lat: number;
  lon: number;
  zone: string;
  aliases?: string[];
};

let loaded: Promise<Place[]> | null = null;

export function loadPlaces(): Promise<Place[]> {
  loaded ??= import("./places.json").then((module) => module.default as Place[]);
  return loaded;
}

const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[łŁ]/g, "l").replace(/[’'ʼ`]/g, "").toLowerCase().trim();

/** Names that start with the query first, then names that contain it. */
export function searchPlaces(places: Place[], query: string, limit = 8): Place[] {
  const q = fold(query);
  if (q.length < 2) return [];
  const starts: Place[] = [];
  const contains: Place[] = [];
  for (const place of places) {
    const names = [place.en, place.uk, ...(place.aliases ?? [])].map(fold);
    if (names.some((name) => name.startsWith(q))) starts.push(place);
    else if (names.some((name) => name.includes(q))) contains.push(place);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** A place entered by coordinates rather than chosen from the list. */
export function customPlace(lat: number, lon: number, zone: string): Place {
  const label = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "E" : "W"}`;
  const labelUk = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? "пн. ш." : "пд. ш."}, ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? "сх. д." : "зх. д."}`;
  return { en: label, uk: labelUk, country: "", countryEn: zone, countryUk: zone, lat, lon, zone };
}

/** Fixed-offset zone for details saved without one ("Etc/GMT-3" is UTC+3). */
export function fixedOffsetZone(offsetHours: number): string | null {
  if (!Number.isInteger(offsetHours) || Math.abs(offsetHours) > 14) return null;
  return offsetHours === 0 ? "Etc/UTC" : `Etc/GMT${offsetHours > 0 ? "-" : "+"}${Math.abs(offsetHours)}`;
}
