import React from 'react'
import { ShaderLabComposition } from '@basementstudio/shader-lab'

/**
 * Olivia Arcana — shader-lab test.
 * Gradient (mystical purple/gold) + Pattern (dots) + Dithering + CRT (subtle).
 * Full-viewport background. Text overlay lives in index.html above this.
 *
 * Config shape taken from basementstudio/shader-lab default-project.json.
 */

const oliviaConfig = {
  assets: [],
  composition: { width: 1080, height: 1920 },
  exportedAt: new Date().toISOString(),
  format: 'shader-lab',
  version: 1,
  selectedLayerId: null,
  timeline: { duration: 10, loop: true, tracks: [] },
  layers: [
    // TOP: CRT — subtle old-TV feel
    {
      id: 'crt-olivia',
      name: 'CRT',
      type: 'crt',
      kind: 'effect',
      compositeMode: 'filter',
      blendMode: 'normal',
      opacity: 0.45,
      visible: false,
      expanded: true,
      locked: false,
      hue: 0,
      saturation: 1,
      assetId: null,
      maskConfig: { invert: false, mode: 'multiply', source: 'luminance' },
      runtimeError: null,
      params: {
        crtMode: 'slot-mask',
        cellSize: 8,
        scanlineIntensity: 0.08,
        maskIntensity: 0.5,
        barrelDistortion: 0.06,
        chromaticAberration: 0.9,
        beamFocus: 0.65,
        brightness: 1.05,
        highlightDrive: 1,
        highlightThreshold: 0.6,
        shoulder: 0.25,
        chromaRetention: 1.1,
        shadowLift: 0.1,
        persistence: 0.15,
        vignetteIntensity: 0.35,
        flickerIntensity: 0.06,
        glitchIntensity: 0.04,
        glitchSpeed: 3,
        signalArtifacts: 0.2,
        bloomEnabled: true,
        bloomIntensity: 1.5,
        bloomThreshold: 0.3,
        bloomRadius: 18,
        bloomSoftness: 0.3,
      },
    },
    // Halftone — duotone print, plum → antique gold
    {
      id: 'halftone-olivia',
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
        spacing: 9,
        dotSize: 0.78,
        dotMin: 0,
        angle: 15,
        shape: 'circle',
        contrast: 1.15,
        softness: 0.35,
        invertLuma: false,
        colorMode: 'duotone',
        ink: '#0a0514',
        duotoneLight: '#e8c97a',   // antique gold highlights
        duotoneDark: '#1a0a2e',    // deep plum shadows
        bloomEnabled: true,
        bloomIntensity: 0.9,
        bloomRadius: 8,
        bloomSoftness: 0.5,
        bloomThreshold: 0.55,
        dotGain: 0.05,
        dotMorph: 0,
      },
    },
    // Pattern — light dot texture layered on top
    {
      id: 'pattern-olivia',
      name: 'Pattern',
      type: 'pattern',
      kind: 'effect',
      compositeMode: 'filter',
      blendMode: 'normal',
      opacity: 0.25,
      visible: false,
      expanded: true,
      locked: false,
      hue: 0,
      saturation: 1,
      assetId: null,
      maskConfig: { invert: false, mode: 'multiply', source: 'luminance' },
      runtimeError: null,
      params: {
        cellSize: 16,
        preset: 'bars',
        colorMode: 'source',
        monoColor: '#e8d4a0',
        bgOpacity: 0.0,
        invert: false,
        customColorCount: 4,
        customLuminanceBias: 0,
        customBgColor: '#0a0514',
        customColor1: '#2a1540',
        customColor2: '#5a2d6b',
        customColor3: '#8b6b2a',
        customColor4: '#e8d4a0',
        bloomEnabled: true,
        bloomIntensity: 2.5,
        bloomThreshold: 0.2,
        bloomRadius: 10,
        bloomSoftness: 0.7,
      },
    },
    // BOTTOM: Gradient — mystical plum/gold source
    {
      id: 'gradient-olivia',
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
      saturation: 1.15,
      assetId: null,
      maskConfig: { invert: false, mode: 'multiply', source: 'luminance' },
      runtimeError: null,
      params: {
        preset: 'neon-glow',
        activePoints: 5,
        // Radial composition: gold center halo, purple mid, black corners
        point1Color: '#d4a860', // bright antique gold (center)
        point1Position: [0, 0.15],
        point1Weight: 1.4,
        point2Color: '#8b6b2a', // darker gold (inner ring)
        point2Position: [0, -0.3],
        point2Weight: 1.0,
        point3Color: '#3d1f5a', // deep purple (outer)
        point3Position: [0.7, 0.5],
        point3Weight: 1.1,
        point4Color: '#2a1540', // plum (opposite outer)
        point4Position: [-0.7, -0.5],
        point4Weight: 1.1,
        point5Color: '#0a0514', // void (corners)
        point5Position: [0.8, -0.8],
        point5Weight: 0.9,
        noiseType: 'voronoi',
        noiseSeed: 17.3,
        warpAmount: 0.2,         // smoother flow
        warpScale: 1.8,
        warpIterations: 2,       // less chaotic
        warpDecay: 1,
        warpBias: 0.35,
        vortexAmount: 0.1,       // gentle clockwise swirl
        animate: true,
        motionAmount: 0.45,
        motionSpeed: 0.5,        // slower, more meditative
        falloff: 2.5,
        tonemapMode: 'totos',
        glowStrength: 0.5,
        glowThreshold: 0.6,
        grainAmount: 0.03,
        vignetteStrength: 0.4,
        vignetteRadius: 1.1,
        vignetteSoftness: 1,
      },
    },
  ],
}

export function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        inset: 0,
        background: '#0a0514',
      }}
    >
      <ShaderLabComposition
        config={oliviaConfig}
        onRuntimeError={(err) => {
          if (err) console.error('[shader-lab]', JSON.stringify(err))
        }}
      />
    </div>
  )
}
