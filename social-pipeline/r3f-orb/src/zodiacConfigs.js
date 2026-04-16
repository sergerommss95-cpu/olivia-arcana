/**
 * Olivia Arcana — zodiac configurations.
 * Each sign has its own palette, glyph, element, motion tuning,
 * and a shader-lab composition generated from the same template.
 *
 * The orb is a SOUL — the viewer's inner self for the day.
 * Color = emotional temperature.
 * Motion = rhythm of being.
 * Glyph = the sign watching over them.
 */

// Shader-lab composition factory.
// Keeps the orb geometry consistent across signs; only palette + motion differ.
function makeComposition({
  duotoneLight,
  duotoneDark,
  gradientCenter,    // inner glow color
  gradientMid,       // mid-ring
  gradientOuter,     // outer ring
  gradientVoid,      // corner shadows
  gradientAccent,    // secondary highlight
  halftoneSpacing = 8,
  halftoneDotSize = 0.8,
  halftoneBloom = 1.1,
  motionSpeed = 0.6,
  vortexAmount = 0.2,
  warpAmount = 0.25,
  saturation = 1.15,
  seed = 7.77,
}) {
  return {
    assets: [],
    composition: { width: 2048, height: 2048 },
    exportedAt: '2026-04-16T00:00:00.000Z',
    format: 'shader-lab',
    version: 1,
    selectedLayerId: null,
    timeline: { duration: 12, loop: true, tracks: [] },
    layers: [
      {
        id: 'halftone',
        name: 'Halftone',
        type: 'halftone',
        kind: 'effect',
        compositeMode: 'filter',
        blendMode: 'normal',
        opacity: 0.95,
        visible: true,
        expanded: true,
        locked: false,
        hue: 0,
        saturation: 1,
        assetId: null,
        maskConfig: { invert: false, mode: 'multiply', source: 'luminance' },
        runtimeError: null,
        params: {
          spacing: halftoneSpacing,
          dotSize: halftoneDotSize,
          dotMin: 0,
          angle: 0,
          shape: 'circle',
          contrast: 1.2,
          softness: 0.38,
          invertLuma: false,
          colorMode: 'duotone',
          ink: '#0a0514',
          duotoneLight,
          duotoneDark,
          bloomEnabled: true,
          bloomIntensity: halftoneBloom,
          bloomRadius: 10,
          bloomSoftness: 0.55,
          bloomThreshold: 0.5,
          dotGain: 0.05,
          dotMorph: 0,
        },
      },
      {
        id: 'gradient',
        name: 'Gradient',
        type: 'gradient',
        kind: 'source',
        compositeMode: 'filter',
        blendMode: 'normal',
        opacity: 1,
        visible: true,
        expanded: true,
        locked: false,
        hue: 0,
        saturation,
        assetId: null,
        maskConfig: { invert: false, mode: 'multiply', source: 'luminance' },
        runtimeError: null,
        params: {
          preset: 'neon-glow',
          activePoints: 5,
          point1Color: gradientCenter,
          point1Position: [0, 0],
          point1Weight: 1.5,
          point2Color: gradientAccent,
          point2Position: [0.4, 0.3],
          point2Weight: 1.0,
          point3Color: gradientMid,
          point3Position: [-0.5, 0.5],
          point3Weight: 1.1,
          point4Color: gradientOuter,
          point4Position: [0.5, -0.5],
          point4Weight: 1.1,
          point5Color: gradientVoid,
          point5Position: [-0.8, -0.8],
          point5Weight: 0.9,
          noiseType: 'voronoi',
          noiseSeed: seed,
          warpAmount,
          warpScale: 2.0,
          warpIterations: 2,
          warpDecay: 1,
          warpBias: 0.3,
          vortexAmount,
          animate: true,
          motionAmount: 0.5,
          motionSpeed,
          falloff: 2.2,
          tonemapMode: 'totos',
          glowStrength: 0.6,
          glowThreshold: 0.55,
          grainAmount: 0.04,
          vignetteStrength: 0.35,
          vignetteRadius: 1.2,
          vignetteSoftness: 1,
        },
      },
    ],
  }
}

// Per-sign configs. `pulseHz` drives the breath rhythm (lower = slower breath).
// `haloColor` drives the atmospheric bleed around the orb.
// `coreColor` drives the inner soul-glow.
// `card` + `cardName` drive the revelation moment (the real content).

export const zodiacConfigs = {
  aries: {
    name: 'Aries',
    glyph: '♈',
    element: 'fire',
    dateRange: 'Mar 21 – Apr 19',
    card: '/cards/04_the_emperor.png',
    cardName: 'THE EMPEROR',
    prediction: "a decision you've been stalling on\nresolves itself before friday\n— don't force it",
    pulseHz: 0.22,       // fire: brisk
    rotationSpeed: 0.15,
    haloColor: '#d89048',
    coreColor: '#e8a848',
    palette: ['#1a0a2e', '#5a1a28', '#d89048', '#e8c97a'],
    composition: makeComposition({
      duotoneLight: '#e8c97a',  // antique gold
      duotoneDark: '#1a0a2e',   // deep plum
      gradientCenter: '#e8a848', // warm amber heart
      gradientMid: '#7a2030',    // ember crimson
      gradientOuter: '#3d1f5a',  // dusk purple
      gradientVoid: '#0a0514',   // void
      gradientAccent: '#c47830', // copper
      motionSpeed: 0.75,
      vortexAmount: 0.25,
      seed: 7.77,
    }),
  },
  taurus: {
    name: 'Taurus',
    glyph: '♉',
    element: 'earth',
    dateRange: 'Apr 20 – May 20',
    card: '/cards/05_the_hierophant.png',
    cardName: 'THE HIEROPHANT',
    prediction: "someone offers you something small\nthe value is hidden\n— take it",
    pulseHz: 0.15,       // earth: deep & slow
    rotationSpeed: 0.08,
    haloColor: '#a88848',
    coreColor: '#c4a860',
    palette: ['#1a1a0e', '#3d3820', '#a88848', '#d8c878'],
    composition: makeComposition({
      duotoneLight: '#d8c878',
      duotoneDark: '#1a1a0e',
      gradientCenter: '#c4a860',
      gradientMid: '#4a5a28',
      gradientOuter: '#3a3220',
      gradientVoid: '#0a0a05',
      gradientAccent: '#887038',
      motionSpeed: 0.35,
      vortexAmount: 0.08,
      warpAmount: 0.18,
      seed: 13.21,
    }),
  },
  gemini: {
    name: 'Gemini',
    glyph: '♊',
    element: 'air',
    dateRange: 'May 21 – Jun 20',
    card: '/cards/06_the_lovers.png',
    cardName: 'THE LOVERS',
    prediction: "two conversations will try\nto happen at once today\n— honor the quieter one",
    pulseHz: 0.28,       // air: quick & light
    rotationSpeed: 0.22,
    haloColor: '#c8c8d8',
    coreColor: '#e8e0f0',
    palette: ['#0e1018', '#3a3850', '#a8a8c8', '#e0e0f0'],
    composition: makeComposition({
      duotoneLight: '#e8e4f0',  // silvery pearl
      duotoneDark: '#0e1018',
      gradientCenter: '#d0c8e8',
      gradientMid: '#6060a0',
      gradientOuter: '#2a2848',
      gradientVoid: '#050510',
      gradientAccent: '#b8b0d0',
      motionSpeed: 0.9,
      vortexAmount: 0.3,
      warpAmount: 0.3,
      seed: 23.9,
    }),
  },
  cancer: {
    name: 'Cancer',
    glyph: '♋',
    element: 'water',
    dateRange: 'Jun 21 – Jul 22',
    card: '/cards/07_the_chariot.png',
    cardName: 'THE CHARIOT',
    prediction: "a memory returns without warning\nit's a message, not a wound\n— let it pass through",
    pulseHz: 0.18,       // water: slow tidal
    rotationSpeed: 0.1,
    haloColor: '#88b0c8',
    coreColor: '#c0e0e8',
    palette: ['#0a1520', '#2a4858', '#88b0c8', '#d8e8ec'],
    composition: makeComposition({
      duotoneLight: '#d8e8ec',  // pearl
      duotoneDark: '#0a1520',
      gradientCenter: '#b8d0d8',
      gradientMid: '#3a6878',
      gradientOuter: '#1a3850',
      gradientVoid: '#050a10',
      gradientAccent: '#88a8b8',
      motionSpeed: 0.45,
      vortexAmount: 0.35,  // water swirls
      warpAmount: 0.32,
      saturation: 1.0,
      seed: 3.14,
    }),
  },
  leo: {
    name: 'Leo',
    glyph: '♌',
    element: 'fire',
    dateRange: 'Jul 23 – Aug 22',
    card: '/cards/08_strength.png',
    cardName: 'STRENGTH',
    prediction: "you'll be tempted to perform today\n— rest instead",
    pulseHz: 0.24,
    rotationSpeed: 0.13,
    haloColor: '#e8a048',
    coreColor: '#f8c868',
    palette: ['#1a0a08', '#5a2818', '#e8a048', '#f8d888'],
    composition: makeComposition({
      duotoneLight: '#f8d888',  // radiant gold
      duotoneDark: '#1a0a08',
      gradientCenter: '#f8c868',
      gradientMid: '#a84818',
      gradientOuter: '#3a1808',
      gradientVoid: '#0a0503',
      gradientAccent: '#d08838',
      motionSpeed: 0.65,
      vortexAmount: 0.2,
      halftoneBloom: 1.4,  // leo glows brighter
      seed: 19.7,
    }),
  },
  virgo: {
    name: 'Virgo',
    glyph: '♍',
    element: 'earth',
    dateRange: 'Aug 23 – Sep 22',
    card: '/cards/09_the_hermit.png',
    cardName: 'THE HERMIT',
    prediction: "the detail you've been ignoring\nis the one that matters\n— look again",
    pulseHz: 0.17,
    rotationSpeed: 0.09,
    haloColor: '#a0c088',
    coreColor: '#d0e0b8',
    palette: ['#0e1408', '#283828', '#a0c088', '#d8e8c8'],
    composition: makeComposition({
      duotoneLight: '#d8e8c8',  // sage cream
      duotoneDark: '#0e1408',
      gradientCenter: '#c8d8a8',
      gradientMid: '#587848',
      gradientOuter: '#283828',
      gradientVoid: '#050805',
      gradientAccent: '#8ca068',
      motionSpeed: 0.4,
      vortexAmount: 0.05,     // virgo: precise, little swirl
      warpAmount: 0.14,        // minimal warp
      halftoneDotSize: 0.85,   // crisper dots
      seed: 11.3,
    }),
  },
  libra: {
    name: 'Libra',
    glyph: '♎',
    element: 'air',
    dateRange: 'Sep 23 – Oct 22',
    card: '/cards/11_justice.png',
    cardName: 'JUSTICE',
    prediction: "a balance tips today\ndon't correct it\n— watch where it lands",
    pulseHz: 0.2,
    rotationSpeed: 0.14,
    haloColor: '#d8b0a8',
    coreColor: '#f0d0c8',
    palette: ['#180e10', '#402830', '#d8b0a8', '#f0d8d0'],
    composition: makeComposition({
      duotoneLight: '#f0d8d0',  // champagne rose
      duotoneDark: '#180e10',
      gradientCenter: '#e8c0b8',
      gradientMid: '#804048',
      gradientOuter: '#3a2028',
      gradientVoid: '#0a0508',
      gradientAccent: '#c08888',
      motionSpeed: 0.55,
      vortexAmount: 0.18,
      seed: 8.88,
    }),
  },
  scorpio: {
    name: 'Scorpio',
    glyph: '♏',
    element: 'water',
    dateRange: 'Oct 23 – Nov 21',
    card: '/cards/13_death.png',
    cardName: 'DEATH',
    prediction: "someone tests you today\n— the answer is 'not yet'",
    pulseHz: 0.16,       // deep, intense
    rotationSpeed: 0.08,
    haloColor: '#9a2038',
    coreColor: '#e04858',
    palette: ['#100508', '#4a0818', '#9a2038', '#d8887a'],
    composition: makeComposition({
      duotoneLight: '#d08898',  // wounded rose
      duotoneDark: '#100508',
      gradientCenter: '#b83848',
      gradientMid: '#5a0818',
      gradientOuter: '#1a0508',
      gradientVoid: '#050003',
      gradientAccent: '#782838',
      motionSpeed: 0.5,
      vortexAmount: 0.4,        // intense vortex
      warpAmount: 0.32,
      saturation: 1.25,
      seed: 2.71,
    }),
  },
  sagittarius: {
    name: 'Sagittarius',
    glyph: '♐',
    element: 'fire',
    dateRange: 'Nov 22 – Dec 21',
    card: '/cards/14_temperance.png',
    cardName: 'TEMPERANCE',
    prediction: "the horizon you're aiming for\nshifts today\n— adjust, don't abandon",
    pulseHz: 0.26,
    rotationSpeed: 0.18,
    haloColor: '#c880c8',
    coreColor: '#e8a8d8',
    palette: ['#1a0820', '#4a1858', '#c880c8', '#e8c8e8'],
    composition: makeComposition({
      duotoneLight: '#e8c8e8',  // twilight lilac
      duotoneDark: '#1a0820',
      gradientCenter: '#d8a0d8',
      gradientMid: '#783898',
      gradientOuter: '#2a1038',
      gradientVoid: '#080308',
      gradientAccent: '#a868b8',
      motionSpeed: 0.8,         // dynamic
      vortexAmount: 0.28,
      warpAmount: 0.28,
      seed: 31.4,
    }),
  },
  capricorn: {
    name: 'Capricorn',
    glyph: '♑',
    element: 'earth',
    dateRange: 'Dec 22 – Jan 19',
    card: '/cards/15_the_devil.png',
    cardName: 'THE DEVIL',
    prediction: "you've earned the next step\n— take it without announcing",
    pulseHz: 0.13,       // slow, steady
    rotationSpeed: 0.07,
    haloColor: '#888890',
    coreColor: '#d0d0d8',
    palette: ['#0a0a0e', '#2a2830', '#888890', '#d0d0d8'],
    composition: makeComposition({
      duotoneLight: '#d8d0c0',  // ivory on charcoal
      duotoneDark: '#0a0a0e',
      gradientCenter: '#b0a890',
      gradientMid: '#484848',
      gradientOuter: '#282828',
      gradientVoid: '#050508',
      gradientAccent: '#807050',
      motionSpeed: 0.3,
      vortexAmount: 0.06,
      warpAmount: 0.12,
      saturation: 0.9,
      seed: 15.5,
    }),
  },
  aquarius: {
    name: 'Aquarius',
    glyph: '♒',
    element: 'air',
    dateRange: 'Jan 20 – Feb 18',
    card: '/cards/17_the_star.png',
    cardName: 'THE STAR',
    prediction: "the strange idea is right\nthe timing is not\n— hold it",
    pulseHz: 0.23,
    rotationSpeed: 0.16,
    haloColor: '#78b8d8',
    coreColor: '#c0e0f0',
    palette: ['#081018', '#284058', '#78b8d8', '#d0e8f0'],
    composition: makeComposition({
      duotoneLight: '#d0e8f0',  // glacial
      duotoneDark: '#081018',
      gradientCenter: '#b8d8e8',
      gradientMid: '#4888b0',
      gradientOuter: '#1a3858',
      gradientVoid: '#040810',
      gradientAccent: '#7898b0',
      motionSpeed: 0.7,
      vortexAmount: 0.22,
      seed: 6.02,
    }),
  },
  pisces: {
    name: 'Pisces',
    glyph: '♓',
    element: 'water',
    dateRange: 'Feb 19 – Mar 20',
    card: '/cards/18_the_moon.png',
    cardName: 'THE MOON',
    prediction: "a dream from this week\ncarries a key\n— don't analyze. notice.",
    pulseHz: 0.19,
    rotationSpeed: 0.11,
    haloColor: '#7888c0',
    coreColor: '#b8c0e0',
    palette: ['#0a0820', '#282858', '#7888c0', '#c8d0e8'],
    composition: makeComposition({
      duotoneLight: '#c8d0e8',  // dream silver
      duotoneDark: '#0a0820',
      gradientCenter: '#a8b0d8',
      gradientMid: '#3848a0',
      gradientOuter: '#181850',
      gradientVoid: '#050308',
      gradientAccent: '#6870a8',
      motionSpeed: 0.38,        // dreamy slow
      vortexAmount: 0.38,       // flowing
      warpAmount: 0.35,
      seed: 42.0,
    }),
  },
}

export const DEFAULT_ZODIAC = 'aries'

export function getZodiac(key) {
  return zodiacConfigs[key] ?? zodiacConfigs[DEFAULT_ZODIAC]
}

export const ZODIAC_KEYS = Object.keys(zodiacConfigs)

// Element → core color family (for InnerVision fallback).
export function elementForZodiac(key) {
  return zodiacConfigs[key]?.element ?? 'fire'
}
