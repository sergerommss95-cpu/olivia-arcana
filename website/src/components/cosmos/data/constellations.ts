// constellations.ts — Olivia Arcana v2
// Full 12-sign data: each sign has its own primaryHue, accentHue, motionStyle, revealOrder, idleSpeed
// Positions are proportional (0-1) to viewport, scaled by `scale` (px)

export interface ZodiacSign {
  name:         string;
  glyph:        string;
  cx:           number;     // centre x as fraction of viewport width
  cy:           number;     // centre y as fraction of viewport height
  scale:        number;     // pixel radius of constellation bounding box
  stars:        [number,number][];   // [x,y] local fractions -0.5..0.5 → scaled
  connections:  [number,number][];   // pairs of star indices
  primaryHue:   [number,number,number]; // rgb 0-1
  accentHue:    [number,number,number];
  motionStyle:  string;
  revealOrder:  string;
  idleSpeed:    number;
}

export const ZODIAC: ZodiacSign[] = [
  {
    name: "Aries", glyph: "♈",
    cx: 0.06, cy: 0.42, scale: 65,
    stars: [[0.5,0.12],[0.38,0.38],[0.62,0.38],[0.45,0.62],[0.55,0.62],[0.50,0.88]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5]],
    primaryHue: [1.0,0.32,0.24], accentHue: [1.0,0.65,0.12],
    motionStyle: "charge", revealOrder: "burst", idleSpeed: 1.4,
  },
  {
    name: "Taurus", glyph: "♉",
    cx: 0.14, cy: 0.36, scale: 60,
    stars: [[0.50,0.10],[0.30,0.30],[0.70,0.30],[0.40,0.55],[0.60,0.55],[0.50,0.85],[0.25,0.78],[0.75,0.78]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[3,6],[4,7],[5,6],[5,7]],
    primaryHue: [0.35,0.82,0.62], accentHue: [0.65,0.42,0.20],
    motionStyle: "emergence", revealOrder: "bottom-up", idleSpeed: 0.7,
  },
  {
    name: "Gemini", glyph: "♊",
    cx: 0.22, cy: 0.32, scale: 58,
    stars: [[0.22,0.10],[0.22,0.35],[0.22,0.62],[0.78,0.10],[0.78,0.35],[0.78,0.62],[0.50,0.48],[0.50,0.88]],
    connections: [[0,1],[1,2],[3,4],[4,5],[1,4],[2,6],[5,6],[6,7]],
    primaryHue: [0.95,0.82,0.25], accentHue: [0.30,0.85,0.95],
    motionStyle: "mirror", revealOrder: "simultaneous", idleSpeed: 1.2,
  },
  {
    name: "Cancer", glyph: "♋",
    cx: 0.31, cy: 0.30, scale: 55,
    stars: [[0.50,0.08],[0.20,0.30],[0.80,0.30],[0.35,0.60],[0.65,0.60],[0.50,0.88]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[1,2]],
    primaryHue: [0.78,0.68,1.0], accentHue: [0.28,0.80,0.90],
    motionStyle: "shell", revealOrder: "center-out", idleSpeed: 0.85,
  },
  {
    name: "Leo", glyph: "♌",
    cx: 0.40, cy: 0.30, scale: 62,
    stars: [[0.50,0.08],[0.25,0.22],[0.75,0.22],[0.50,0.42],[0.20,0.58],[0.80,0.58],[0.35,0.78],[0.65,0.78]],
    connections: [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,7],[6,7]],
    primaryHue: [1.0,0.72,0.08], accentHue: [1.0,0.90,0.40],
    motionStyle: "throne", revealOrder: "center-out", idleSpeed: 0.9,
  },
  {
    name: "Virgo", glyph: "♍",
    cx: 0.50, cy: 0.32, scale: 58,
    stars: [[0.50,0.10],[0.32,0.28],[0.68,0.28],[0.28,0.50],[0.72,0.50],[0.38,0.70],[0.62,0.70],[0.50,0.92]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[1,2]],
    primaryHue: [0.50,0.90,0.65], accentHue: [0.72,0.85,0.45],
    motionStyle: "weave", revealOrder: "wave", idleSpeed: 1.1,
  },
  {
    name: "Libra", glyph: "♎",
    cx: 0.59, cy: 0.34, scale: 55,
    stars: [[0.50,0.10],[0.20,0.40],[0.80,0.40],[0.35,0.68],[0.65,0.68],[0.20,0.90],[0.80,0.90]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[1,2],[5,6]],
    primaryHue: [0.90,0.75,0.55], accentHue: [1.0,0.62,0.38],
    motionStyle: "balance", revealOrder: "simultaneous", idleSpeed: 0.95,
  },
  {
    name: "Scorpio", glyph: "♏",
    cx: 0.68, cy: 0.36, scale: 60,
    stars: [[0.50,0.08],[0.32,0.24],[0.68,0.24],[0.30,0.46],[0.70,0.46],[0.38,0.68],[0.62,0.68],[0.50,0.88],[0.38,1.00]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[7,8]],
    primaryHue: [0.72,0.10,0.25], accentHue: [0.90,0.20,0.55],
    motionStyle: "depth", revealOrder: "sequential", idleSpeed: 1.25,
  },
  {
    name: "Sagittarius", glyph: "♐",
    cx: 0.77, cy: 0.38, scale: 58,
    stars: [[0.50,0.10],[0.25,0.28],[0.75,0.28],[0.38,0.50],[0.62,0.50],[0.28,0.72],[0.72,0.72],[0.50,0.90]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[3,4]],
    primaryHue: [0.88,0.55,0.10], accentHue: [1.0,0.82,0.30],
    motionStyle: "arc", revealOrder: "bottom-up", idleSpeed: 1.05,
  },
  {
    name: "Capricorn", glyph: "♑",
    cx: 0.85, cy: 0.40, scale: 55,
    stars: [[0.50,0.08],[0.28,0.25],[0.72,0.25],[0.22,0.50],[0.78,0.50],[0.35,0.72],[0.65,0.72],[0.50,0.90]],
    connections: [[0,1],[0,2],[1,3],[2,4],[3,5],[4,6],[5,7],[6,7],[1,2]],
    primaryHue: [0.40,0.62,0.52], accentHue: [0.28,0.45,0.38],
    motionStyle: "ascent", revealOrder: "bottom-up", idleSpeed: 0.7,
  },
  {
    name: "Aquarius", glyph: "♒",
    cx: 0.92, cy: 0.42, scale: 58,
    stars: [[0.18,0.28],[0.36,0.16],[0.50,0.28],[0.64,0.16],[0.82,0.28],[0.18,0.72],[0.36,0.84],[0.50,0.72],[0.64,0.84],[0.82,0.72]],
    connections: [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[8,9],[0,5],[4,9],[2,7]],
    primaryHue: [0.28,0.70,1.0], accentHue: [0.55,0.90,1.0],
    motionStyle: "wave", revealOrder: "wave", idleSpeed: 1.35,
  },
  {
    name: "Pisces", glyph: "♓",
    cx: 0.98, cy: 0.44, scale: 55,
    stars: [[0.28,0.15],[0.50,0.10],[0.72,0.15],[0.20,0.40],[0.80,0.40],[0.50,0.50],[0.20,0.60],[0.80,0.60],[0.28,0.85],[0.50,0.90],[0.72,0.85]],
    connections: [[0,1],[1,2],[0,3],[2,4],[3,5],[4,5],[5,6],[5,7],[6,8],[7,9],[8,9],[9,10],[7,10]],
    primaryHue: [0.45,0.72,1.0], accentHue: [0.80,0.58,1.0],
    motionStyle: "dissolution", revealOrder: "simultaneous", idleSpeed: 0.85,
  },
];
