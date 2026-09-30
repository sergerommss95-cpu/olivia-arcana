/** Shapes returned by chart.js, for the components. */

export type Placement = {
  key: string;
  longitude: number;
  index: number;
  sign: string;
  degree: number;
  element: string;
  modality: string;
  speed?: number;
  retrograde?: boolean;
  house?: number;
};

export type AspectFound = { a: string; b: string; aspect: string; orb: number };

export type Chart = {
  moment: { utc: Date; offsetMinutes: number; status: "ok" | "skipped" | "repeated"; timeKnown: boolean };
  bodies: Placement[];
  ascendant: Placement | null;
  midheaven: Placement | null;
  aspects: AspectFound[];
  moonSigns: [string, string] | null;
};

/** 24°08′ */
export function formatDegree(degree: number): string {
  let whole = Math.floor(degree);
  let minutes = Math.round((degree - whole) * 60);
  if (minutes === 60) { whole += 1; minutes = 0; }
  return `${whole}°${String(minutes).padStart(2, "0")}′`;
}
