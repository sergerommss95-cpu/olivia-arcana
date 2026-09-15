/** UTC is deliberate: no hidden browser timezone or guessed daylight saving. */
export function parseUtcMoment(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("Enter a complete date and time in UTC.");
  const [, year, month, day, hour, minute] = match.map(Number);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
    throw new Error("Choose a valid date from 1900 to 2100 and a time from 00:00 to 23:59 UTC.");
  }
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day) {
    throw new Error("That day does not exist in the selected month. Please check the date.");
  }
  return { year, month, day, hour, minute, utc };
}

export function observationInput(moment: string, latitude: string, longitude: string) {
  const date = parseUtcMoment(moment);
  if (!latitude.trim() || !longitude.trim()) throw new Error("Enter both latitude and longitude.");
  const lat = Number(latitude), lon = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error("Latitude must be between −90° and 90°.");
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error("Longitude must be between −180° and 180°.");
  return { year: date.year, month: date.month, day: date.day, hour: date.hour, minute: date.minute, timezone: 0, latitude: lat, longitude: lon };
}

export function shiftUtcMoment(moment: string, minutes: number) {
  const utc = parseUtcMoment(moment).utc;
  if (!Number.isInteger(minutes)) throw new Error("Use a whole number of minutes.");
  const shifted = new Date(utc.getTime() + minutes * 60000).toISOString().slice(0, 16);
  parseUtcMoment(shifted);
  return shifted;
}

const DIRECTIONS = ["north", "north-northeast", "northeast", "east-northeast", "east", "east-southeast", "southeast", "south-southeast", "south", "south-southwest", "southwest", "west-southwest", "west", "west-northwest", "northwest", "north-northwest"];
export function compassDirection(azimuth: number) {
  return DIRECTIONS[Math.round(((azimuth % 360 + 360) % 360) / 22.5) % 16];
}

type LabelPoint = { name: string; x: number; y: number };
/** Only captions move; the input celestial coordinates are never displaced. */
export function skyLabels(points: LabelPoint[]) {
  const placed: Array<{ x: number; y: number; w: number; h: number }> = [];
  return points.map(point => {
    const w = point.name.length * 7.4 + 10, h = 19;
    const options = [[16, -16], [16, 24], [-w - 16, -16], [-w - 16, 24], [16, -42], [-w - 16, -42], [16, 48], [-w - 16, 48]];
    let best = { x: Math.min(640 - w, Math.max(90, point.x + 16)), y: point.y - 16, w, h };
    let bestCost = Infinity;
    for (const [dx, dy] of options) {
      const candidate = { x: Math.min(680 - w, Math.max(70, point.x + dx)), y: Math.min(650, Math.max(95, point.y + dy)), w, h };
      const overlap = placed.filter(r => candidate.x < r.x + r.w + 8 && candidate.x + w + 8 > r.x && candidate.y - h < r.y + 8 && candidate.y + 8 > r.y - r.h).length;
      const coversDot = points.filter(p => p.name !== point.name && p.x > candidate.x - 10 && p.x < candidate.x + w + 10 && p.y > candidate.y - h - 8 && p.y < candidate.y + 8).length;
      const crossesRim = [[candidate.x, candidate.y - h], [candidate.x + w, candidate.y - h], [candidate.x, candidate.y], [candidate.x + w, candidate.y]]
        .filter(([x, y]) => Math.hypot(x - 380, y - 380) > 274).length;
      const cost = overlap * 1000 + crossesRim * 300 + coversDot * 100 + Math.hypot(candidate.x - point.x, candidate.y - point.y);
      if (cost < bestCost) { best = candidate; bestCost = cost; }
    }
    placed.push(best);
    return { ...point, labelX: best.x, labelY: best.y, lineX: best.x > point.x ? best.x - 5 : best.x + best.w + 3, lineY: best.y - 5 };
  });
}
