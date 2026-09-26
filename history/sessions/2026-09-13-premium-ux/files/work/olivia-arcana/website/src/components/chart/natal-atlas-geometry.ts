export const normalize = (n: number) => ((n % 360) + 360) % 360;
export function point(radius: number, angle: number) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: Number((260 + radius * Math.cos(rad)).toFixed(3)), y: Number((260 + radius * Math.sin(rad)).toFixed(3)) };
}

/** Separate only the glyph labels. Exact longitude anchors and aspect endpoints never move. */
export function separateLabels(longitudes: number[], minimumGap = 15): number[] {
  if (longitudes.length < 2) return longitudes.map(normalize);
  const sorted = longitudes.map((longitude, index) => ({ longitude: normalize(longitude), index })).sort((a, b) => a.longitude - b.longitude);
  // Cut the circle at its largest empty arc, so a conjunction across 0° stays together.
  let cut = 0;
  let largestGap = -1;
  sorted.forEach((item, i) => {
    const gap = normalize(sorted[(i + 1) % sorted.length].longitude - item.longitude);
    if (gap > largestGap) { largestGap = gap; cut = (i + 1) % sorted.length; }
  });
  const ordered = [...sorted.slice(cut), ...sorted.slice(0, cut)];
  const exact = ordered.map((item, i) => item.longitude + (i > 0 && item.longitude < ordered[0].longitude ? 360 : 0));
  const labels = [...exact];
  const gap = Math.min(minimumGap, 360 / sorted.length);
  for (let i = 1; i < labels.length; i++) labels[i] = Math.max(labels[i], labels[i - 1] + gap);
  // Keep the last-to-first gap too; labels are still a circle after unwrapping.
  labels[labels.length - 1] = Math.min(labels[labels.length - 1], labels[0] + 360 - gap);
  for (let i = labels.length - 2; i >= 0; i--) labels[i] = Math.min(labels[i], labels[i + 1] - gap);
  const shift = labels.reduce((sum, label, i) => sum + label - exact[i], 0) / labels.length;
  const result = new Array<number>(longitudes.length);
  ordered.forEach((item, i) => { result[item.index] = normalize(labels[i] - shift); });
  return result;
}

/** Ascendant left; untimed charts put zero Aries left. Every chart layer uses this. */
export function wheelAngle(longitude: number, ascendantLongitude = 0) {
  return 270 - normalize(longitude - ascendantLongitude);
}
