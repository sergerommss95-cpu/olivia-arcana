/**
 * Sacred geometry SVG paths — mathematical patterns of creation.
 *
 * 100x100 viewBox, centered. Precise geometric constructions
 * with mathematical harmony. These look spectacular as holographic 3D.
 */

// Helper: generate points on a circle
function circlePoints(cx: number, cy: number, r: number, n: number, startAngle = -Math.PI / 2): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = startAngle + (2 * Math.PI * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

// Helper: SVG circle path
function circlePath(cx: number, cy: number, r: number): string {
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
}

// Flower of Life — 7 interlocking circles
function buildFlowerOfLife(): string[] {
  const cx = 50, cy = 50, r = 18;
  const paths = [circlePath(cx, cy, r)]; // center circle
  const petals = circlePoints(cx, cy, r, 6);
  for (const [px, py] of petals) {
    paths.push(circlePath(px, py, r));
  }
  // Outer bounding circle
  paths.push(circlePath(cx, cy, r * 2));
  return paths;
}

// Seed of Life — 7 circles in tighter formation
function buildSeedOfLife(): string[] {
  const cx = 50, cy = 50, r = 15;
  const paths = [circlePath(cx, cy, r)];
  const petals = circlePoints(cx, cy, r, 6);
  for (const [px, py] of petals) {
    paths.push(circlePath(px, py, r));
  }
  return paths;
}

// Metatron's Cube — 13 circles connected by lines
function buildMetatronsCube(): string[] {
  const cx = 50, cy = 50, r = 5;
  const paths: string[] = [];

  // Center
  const centers: [number, number][] = [[cx, cy]];

  // Inner ring (6 points)
  const inner = circlePoints(cx, cy, 18, 6);
  centers.push(...inner);

  // Outer ring (6 points, rotated 30deg)
  const outer = circlePoints(cx, cy, 34, 6, -Math.PI / 2 + Math.PI / 6);
  centers.push(...outer);

  // Draw all 13 circles
  for (const [px, py] of centers) {
    paths.push(circlePath(px, py, r));
  }

  // Connect all centers with lines
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      paths.push(`M ${centers[i][0]} ${centers[i][1]} L ${centers[j][0]} ${centers[j][1]}`);
    }
  }

  return paths;
}

// Vesica Piscis — two overlapping circles
function buildVesicaPiscis(): string[] {
  const r = 28;
  const offset = r * 0.5; // overlap distance
  return [
    circlePath(50 - offset, 50, r),
    circlePath(50 + offset, 50, r),
  ];
}

// Sri Yantra (simplified) — 9 interlocking triangles
function buildSriYantra(): string[] {
  const cx = 50, cy = 50;
  const paths: string[] = [];

  // Outer circle
  paths.push(circlePath(cx, cy, 42));

  // Upward triangles (Shiva)
  const upTriangles = [
    { y1: 18, y2: 72, half: 30 },
    { y1: 28, y2: 68, half: 22 },
    { y1: 35, y2: 65, half: 16 },
    { y1: 40, y2: 62, half: 12 },
  ];
  for (const t of upTriangles) {
    paths.push(`M ${cx} ${t.y1} L ${cx + t.half} ${t.y2} L ${cx - t.half} ${t.y2} Z`);
  }

  // Downward triangles (Shakti)
  const downTriangles = [
    { y1: 82, y2: 28, half: 30 },
    { y1: 75, y2: 32, half: 24 },
    { y1: 68, y2: 36, half: 18 },
    { y1: 62, y2: 40, half: 14 },
    { y1: 58, y2: 44, half: 10 },
  ];
  for (const t of downTriangles) {
    paths.push(`M ${cx} ${t.y1} L ${cx + t.half} ${t.y2} L ${cx - t.half} ${t.y2} Z`);
  }

  // Center dot (bindu)
  paths.push(circlePath(cx, cy, 2));

  return paths;
}

// Torus / Infinity — figure-eight lemniscate
function buildTorus(): string[] {
  return [
    // Lemniscate of Bernoulli (approximated with cubic beziers)
    "M 50 50 C 50 30, 85 25, 85 50 C 85 75, 50 70, 50 50 C 50 30, 15 25, 15 50 C 15 75, 50 70, 50 50 Z",
    // Inner contour for depth
    "M 50 50 C 50 38, 75 34, 75 50 C 75 66, 50 62, 50 50 C 50 38, 25 34, 25 50 C 25 66, 50 62, 50 50 Z",
  ];
}

export const SACRED_GEOMETRY_PATHS: Record<string, { paths: string[]; name: string }> = {
  flowerOfLife: {
    name: "Flower of Life",
    paths: buildFlowerOfLife(),
  },
  seedOfLife: {
    name: "Seed of Life",
    paths: buildSeedOfLife(),
  },
  metatronsCube: {
    name: "Metatron's Cube",
    paths: buildMetatronsCube(),
  },
  vesicaPiscis: {
    name: "Vesica Piscis",
    paths: buildVesicaPiscis(),
  },
  sriYantra: {
    name: "Sri Yantra",
    paths: buildSriYantra(),
  },
  torus: {
    name: "Torus / Infinity",
    paths: buildTorus(),
  },
};

export type SacredGeometryId = keyof typeof SACRED_GEOMETRY_PATHS;
