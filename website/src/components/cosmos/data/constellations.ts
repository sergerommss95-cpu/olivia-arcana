/**
 * constellations.ts — Olivia Arcana
 *
 * REAL astronomical constellation data from Hipparcos star catalog (ESA).
 * Star positions normalized to 0-1 bounding box per constellation.
 * Connection patterns from IAU standard stick figures.
 *
 * Source: d3-celestial project + dcf21/constellation-stick-figures
 */

export interface ZodiacSign {
  name:         string;
  glyph:        string;
  cx:           number;
  cy:           number;
  scale:        number;
  stars:        [number, number][];
  connections:  [number, number][];
  primaryHue:   [number, number, number];
  accentHue:    [number, number, number];
  motionStyle:  string;
  revealOrder:  string;
  idleSpeed:    number;
}

export const ZODIAC: ZodiacSign[] = [
  // ── ARIES ── 4 stars, gentle curved line (Mesarthim → Sheratan → Hamal → 41 Ari)
  {
    name: "Aries", glyph: "♈",
    cx: 0.06, cy: 0.42, scale: 65,
    stars: [
      [0.00, 0.00],  // Mesarthim (γ Ari)
      [0.02, 0.19],  // Sheratan (β Ari)
      [0.24, 0.52],  // Hamal (α Ari)
      [1.00, 1.00],  // 41 Arietis
    ],
    connections: [[0,1],[1,2],[2,3]],
    primaryHue: [1.0, 0.32, 0.24], accentHue: [1.0, 0.65, 0.12],
    motionStyle: "charge", revealOrder: "sequential", idleSpeed: 1.4,
  },

  // ── TAURUS ── 12 stars, V-shape head (Hyades) + horns to Elnath & Tianguan
  {
    name: "Taurus", glyph: "♉",
    cx: 0.14, cy: 0.36, scale: 62,
    stars: [
      [0.53, 0.57],  // τ Tau
      [0.47, 0.55],  // θ² Tau
      [0.41, 0.54],  // Prima Hyadum (γ Tau)
      [0.44, 0.61],  // δ¹ Tau
      [0.48, 0.67],  // κ¹ Tau
      [0.91, 1.00],  // Elnath (β Tau)
      [1.00, 0.74],  // Tianguan (ζ Tau)
      [0.27, 0.43],  // Ain (ε Tau)
      [0.02, 0.33],  // Aldebaran (α Tau)
      [0.29, 0.20],  // λ Tau
      [0.00, 0.31],  // ν Tau
      [0.09, 0.00],  // 10 Tau
    ],
    connections: [[6,0],[0,1],[1,2],[2,3],[3,4],[4,5],[2,7],[7,8],[8,9],[8,10],[10,11]],
    primaryHue: [0.35, 0.82, 0.62], accentHue: [0.65, 0.42, 0.20],
    motionStyle: "emergence", revealOrder: "center-out", idleSpeed: 0.7,
  },

  // ── GEMINI ── 12 stars, twin parallel lines (Castor + Pollux at top)
  {
    name: "Gemini", glyph: "♊",
    cx: 0.22, cy: 0.32, scale: 60,
    stars: [
      [0.00, 0.51],  // Propus (η Gem)
      [0.09, 0.51],  // Tejat (μ Gem)
      [0.32, 0.64],  // Mebsuta (ε Gem)
      [0.62, 0.91],  // Tejat Post. (ν Gem)
      [0.88, 1.00],  // Castor (α Gem)
      [1.00, 0.80],  // Pollux (β Gem)
      [0.90, 0.74],  // κ Gem
      [0.72, 0.48],  // Wasat (δ Gem)
      [0.54, 0.40],  // Alzirr (ξ Gem)
      [0.25, 0.18],  // λ Gem
      [0.34, 0.00],  // Alhena (γ Gem)
      [0.70, 0.19],  // ι Gem
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[7,11]],
    primaryHue: [0.95, 0.82, 0.25], accentHue: [0.30, 0.85, 0.95],
    motionStyle: "mirror", revealOrder: "simultaneous", idleSpeed: 1.2,
  },

  // ── CANCER ── 5 stars, inverted-Y shape (small, faint constellation)
  {
    name: "Cancer", glyph: "♋",
    cx: 0.31, cy: 0.30, scale: 55,
    stars: [
      [1.00, 0.14],  // Acubens (α Cnc)
      [0.67, 0.46],  // Asellus Australis (δ Cnc)
      [0.64, 0.63],  // Asellus Borealis (γ Cnc)
      [0.72, 1.00],  // ι Cnc
      [0.00, 0.00],  // Altarf (β Cnc)
    ],
    connections: [[0,1],[1,2],[2,3],[1,4]],
    primaryHue: [0.78, 0.68, 1.0], accentHue: [0.28, 0.80, 0.90],
    motionStyle: "shell", revealOrder: "center-out", idleSpeed: 0.85,
  },

  // ── LEO ── 9 stars, sickle (head) + triangle (body)
  {
    name: "Leo", glyph: "♌",
    cx: 0.40, cy: 0.30, scale: 62,
    stars: [
      [0.18, 0.00],  // Regulus (α Leo)
      [0.17, 0.34],  // η Leo
      [0.28, 0.56],  // Algieba (γ Leo)
      [0.72, 0.61],  // Zosma (δ Leo)
      [1.00, 0.19],  // Denebola (β Leo)
      [0.72, 0.25],  // Chertan (θ Leo)
      [0.25, 0.82],  // Adhafera (ζ Leo)
      [0.06, 1.00],  // Rasalas (μ Leo)
      [0.00, 0.84],  // ε Leo
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[0,5],[2,6],[6,7],[7,8]],
    primaryHue: [1.0, 0.72, 0.08], accentHue: [1.0, 0.90, 0.40],
    motionStyle: "throne", revealOrder: "center-out", idleSpeed: 0.9,
  },

  // ── VIRGO ── 13 stars, Y-shape with Spica at base
  {
    name: "Virgo", glyph: "♍",
    cx: 0.50, cy: 0.32, scale: 60,
    stars: [
      [0.00, 0.80],  // ζ Vir
      [0.03, 0.58],  // τ Vir
      [0.19, 0.47],  // Porrima (γ Vir)
      [0.31, 0.44],  // δ Vir
      [0.47, 0.25],  // Vindemiatrix (ε Vir)
      [0.55, 0.00],  // Spica (α Vir)
      [0.83, 0.23],  // η Vir
      [0.98, 0.25],  // β Vir
      [0.42, 1.00],  // Heze (ζ Vir)
      [0.39, 0.66],  // 109 Vir
      [0.60, 0.48],  // μ Vir
      [0.75, 0.57],  // θ Vir
      [1.00, 0.59],  // ι Vir
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[8,9],[3,9],[4,10],[10,11],[11,12]],
    primaryHue: [0.50, 0.90, 0.65], accentHue: [0.72, 0.85, 0.45],
    motionStyle: "weave", revealOrder: "wave", idleSpeed: 1.1,
  },

  // ── LIBRA ── 6 stars, diamond/kite shape
  {
    name: "Libra", glyph: "♎",
    cx: 0.59, cy: 0.34, scale: 55,
    stars: [
      [0.28, 0.22],  // σ Lib
      [0.00, 0.67],  // Zubeneschamali (β Lib)
      [0.55, 1.00],  // Zubenelgenubi (α Lib)
      [0.93, 0.73],  // γ Lib
      [0.97, 0.08],  // υ Lib
      [1.00, 0.00],  // τ Lib
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[1,3]],
    primaryHue: [0.90, 0.75, 0.55], accentHue: [1.0, 0.62, 0.38],
    motionStyle: "balance", revealOrder: "simultaneous", idleSpeed: 0.95,
  },

  // ── SCORPIUS ── 14 stars, J-shaped scorpion with Antares at heart
  {
    name: "Scorpio", glyph: "♏",
    cx: 0.68, cy: 0.36, scale: 62,
    stars: [
      [0.00, 0.73],  // Shaula (λ Sco) — tail tip
      [0.01, 0.88],  // Lesath (υ Sco)
      [0.06, 1.00],  // κ Sco
      [0.21, 0.75],  // Sargas (θ Sco)
      [0.28, 0.72],  // η Sco
      [0.34, 0.64],  // ζ² Sco
      [0.47, 0.38],  // μ¹ Sco
      [0.49, 0.22],  // ε Sco
      [0.51, 0.04],  // τ Sco
      [0.67, 0.00],  // Antares (α Sco) — heart
      [0.91, 0.01],  // σ Sco
      [1.00, 0.13],  // Dschubba (δ Sco) — head
      [0.95, 0.18],  // π Sco
      [0.87, 0.26],  // ρ Sco
    ],
    connections: [[0,1],[1,2],[1,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13]],
    primaryHue: [0.72, 0.10, 0.25], accentHue: [0.90, 0.20, 0.55],
    motionStyle: "depth", revealOrder: "sequential", idleSpeed: 1.25,
  },

  // ── SAGITTARIUS ── 15 stars (simplified teapot asterism)
  {
    name: "Sagittarius", glyph: "♐",
    cx: 0.77, cy: 0.38, scale: 60,
    stars: [
      [0.10, 0.27],  // φ Sgr
      [0.16, 0.35],  // Nunki (σ Sgr)
      [0.13, 0.51],  // τ Sgr
      [0.19, 0.67],  // Ascella (ζ Sgr)
      [0.07, 0.82],  // Kaus Borealis (λ Sgr)
      [0.67, 0.00],  // η Sgr
      [0.69, 0.13],  // θ² Sgr
      [0.50, 0.51],  // Kaus Media (δ Sgr)
      [0.35, 0.61],  // Kaus Australis (ε Sgr)
      [0.96, 0.09],  // d Sgr
      [1.00, 0.32],  // ω Sgr
      [0.97, 0.64],  // Nash (γ Sgr)
      [0.80, 0.69],  // ρ¹ Sgr
      [0.70, 0.70],  // μ Sgr
      [0.61, 0.67],  // π Sgr
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[5,6],[6,7],[7,8],[3,8],[9,10],[10,11],[11,12],[12,13],[13,14],[14,8],[1,7]],
    primaryHue: [0.88, 0.55, 0.10], accentHue: [1.0, 0.82, 0.30],
    motionStyle: "arc", revealOrder: "bottom-up", idleSpeed: 1.05,
  },

  // ── CAPRICORNUS ── 10 stars, closed triangular loop
  {
    name: "Capricorn", glyph: "♑",
    cx: 0.85, cy: 0.40, scale: 58,
    stars: [
      [0.00, 1.00],  // Algedi (α Cap)
      [0.04, 0.84],  // Dabih (β Cap)
      [0.13, 0.63],  // ψ Cap
      [0.32, 0.11],  // ω Cap
      [0.38, 0.00],  // 24 Cap
      [0.77, 0.31],  // Deneb Algedi (δ Cap)
      [1.00, 0.75],  // Nashira (γ Cap)
      [0.92, 0.71],  // ι Cap
      [0.72, 0.70],  // θ Cap
      [0.54, 0.67],  // 36 Cap
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,0]],
    primaryHue: [0.40, 0.62, 0.52], accentHue: [0.28, 0.45, 0.38],
    motionStyle: "ascent", revealOrder: "sequential", idleSpeed: 0.7,
  },

  // ── AQUARIUS ── 15 stars, water bearer pouring streams
  {
    name: "Aquarius", glyph: "♒",
    cx: 0.92, cy: 0.42, scale: 60,
    stars: [
      [0.00, 0.52],  // Albali (ε Aqr)
      [0.03, 0.54],  // μ Aqr
      [0.25, 0.69],  // Sadalsuud (β Aqr)
      [0.45, 0.92],  // Sadalmelik (α Aqr)
      [0.54, 0.88],  // θ Aqr
      [0.58, 0.94],  // Sadachbia (γ Aqr)
      [0.62, 0.93],  // ζ¹ Aqr
      [0.72, 0.60],  // η Aqr
      [0.86, 0.53],  // Skat (δ Aqr)
      [0.81, 0.00],  // λ Aqr
      [0.45, 0.32],  // ι Aqr
      [0.51, 0.59],  // τ² Aqr
      [0.56, 1.00],  // φ Aqr
      [0.89, 0.05],  // 88 Aqr
      [1.00, 0.15],  // c² Aqr
    ],
    connections: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[2,10],[3,11],[5,12],[8,13],[8,14]],
    primaryHue: [0.28, 0.70, 1.0], accentHue: [0.55, 0.90, 1.0],
    motionStyle: "wave", revealOrder: "wave", idleSpeed: 1.35,
  },

  // ── PISCES ── 22 stars, two fish connected by a cord through Alrescha
  {
    name: "Pisces", glyph: "♓",
    cx: 0.98, cy: 0.44, scale: 58,
    stars: [
      [0.73, 0.81],  // σ Psc — circlet fish
      [0.72, 1.00],  // ρ Psc
      [0.76, 0.90],  // 94 Psc
      [0.72, 0.69],  // ω Psc
      [0.83, 0.49],  // ι Psc
      [0.91, 0.27],  // θ Psc
      [1.00, 0.05],  // γ Psc
      [0.95, 0.07],  // κ Psc
      [0.88, 0.15],  // λ Psc
      [0.82, 0.17],  // 7 Psc
      [0.73, 0.22],  // TX Psc
      [0.67, 0.23],  // ν Psc
      [0.59, 0.22],  // μ Psc — cord
      [0.31, 0.19],  // ε Psc
      [0.20, 0.15],  // δ Psc
      [0.14, 0.18],  // ζ Psc
      [0.09, 0.14],  // Alrescha (α Psc) — the knot
      [0.07, 0.07],  // ο Psc
      [0.13, 0.00],  // φ Psc — western fish
      [0.21, 0.02],  // υ Psc
      [0.24, 0.08],  // τ Psc
      [0.00, 0.09],  // χ Psc
    ],
    connections: [[0,1],[1,2],[0,2],[0,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[14,20],[17,21]],
    primaryHue: [0.45, 0.72, 1.0], accentHue: [0.80, 0.58, 1.0],
    motionStyle: "dissolution", revealOrder: "wave", idleSpeed: 0.85,
  },
];
