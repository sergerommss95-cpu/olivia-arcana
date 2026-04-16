import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useShaderLab } from '@basementstudio/shader-lab'

/**
 * Olivia Arcana — shader-lab composition AS a texture on a 3D sphere.
 * The composition renders internally via WebGPU to a CanvasTexture,
 * which we then map onto a slowly rotating sphere lit by HDRI.
 */

// Same Olivia composition as AppShaderLab.jsx, square aspect for orb mapping.
const oliviaOrbConfig = {
  assets: [],
  composition: { width: 1024, height: 1024 },
  exportedAt: new Date().toISOString(),
  format: 'shader-lab',
  version: 1,
  selectedLayerId: null,
  timeline: { duration: 12, loop: true, tracks: [] },
  layers: [
    {
      id: 'halftone-orb',
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
        spacing: 8,
        dotSize: 0.8,
        dotMin: 0,
        angle: 0,
        shape: 'circle',
        contrast: 1.2,
        softness: 0.35,
        invertLuma: false,
        colorMode: 'duotone',
        ink: '#0a0514',
        duotoneLight: '#e8c97a',
        duotoneDark: '#1a0a2e',
        bloomEnabled: true,
        bloomIntensity: 1.1,
        bloomRadius: 10,
        bloomSoftness: 0.5,
        bloomThreshold: 0.5,
        dotGain: 0.05,
        dotMorph: 0,
      },
    },
    {
      id: 'gradient-orb',
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
        // Centered radial to map cleanly onto sphere UVs
        point1Color: '#e8c97a',
        point1Position: [0, 0],
        point1Weight: 1.5,
        point2Color: '#8b6b2a',
        point2Position: [0.4, 0.3],
        point2Weight: 1.0,
        point3Color: '#3d1f5a',
        point3Position: [-0.5, 0.5],
        point3Weight: 1.1,
        point4Color: '#2a1540',
        point4Position: [0.5, -0.5],
        point4Weight: 1.1,
        point5Color: '#0a0514',
        point5Position: [-0.8, -0.8],
        point5Weight: 0.9,
        noiseType: 'voronoi',
        noiseSeed: 7.77,
        warpAmount: 0.25,
        warpScale: 2.0,
        warpIterations: 2,
        warpDecay: 1,
        warpBias: 0.3,
        vortexAmount: 0.2,       // stronger swirl so orb looks alive
        animate: true,
        motionAmount: 0.5,
        motionSpeed: 0.6,
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

function Orb() {
  const { texture, ready } = useShaderLab(oliviaOrbConfig, {
    width: 2048,
    height: 2048,
  })

  const meshRef = useRef(null)
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.55,
        clearcoat: 0.25,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.25,
      }),
    [],
  )

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15
    }
    if (texture && ready) {
      texture.needsUpdate = true
      if (material.map !== texture) {
        material.map = texture
        material.needsUpdate = true
      }
    }
  })

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[1, 96, 96]} />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <Environment files="/studio.hdr" background={false} />

      <ambientLight intensity={0.65} />
      {/* Gentle rim light — separates orb from background without blowing out */}
      <directionalLight position={[2, 3, 2]} intensity={0.35} color="#fff5d6" />
      <directionalLight position={[-2, -1, -1]} intensity={0.2} color="#8060ff" />

      <Orb />

      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.7} radius={0.5} />
      </EffectComposer>
    </>
  )
}

export function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.6], fov: 36 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      style={{ background: '#060410' }}
    >
      <Scene />
      <OrbitControls enablePan={false} minDistance={1.8} maxDistance={5} />
    </Canvas>
  )
}
