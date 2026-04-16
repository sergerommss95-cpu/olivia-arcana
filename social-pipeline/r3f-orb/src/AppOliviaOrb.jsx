import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useShaderLab } from '@basementstudio/shader-lab'

import { FloatingParticles } from './Particles'
import { getZodiac, DEFAULT_ZODIAC } from './zodiacConfigs'

/**
 * Olivia Arcana — Soul Orb.
 *
 * A suspended soul in violet-plum void. Its surface is a field of duotone
 * halftone dots; its breath is a slow scale oscillation; its presence bleeds
 * into surrounding atmosphere via a sprite halo. Dust drifts in foreground,
 * stars sit far away. Entry is a reveal — the orb arrives from nothing,
 * dots materialising as scale rises.
 *
 * Every sign uses the same orb geometry; only palette + motion differ.
 */

// ────────────────────────────────────────────────────────────────────────────
// Background star field — far away, barely visible, drifts slowly.
// Gives the void dimensionality without drawing attention.
// ────────────────────────────────────────────────────────────────────────────
function BackgroundStars({ count = 240 }) {
  const ref = useRef(null)

  const { positions, sizes, opacities } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const opacities = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Spread across a wide, deep volume behind the orb.
      const r = 8 + Math.random() * 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 4 // push behind
      sizes[i] = 0.008 + Math.random() * 0.014
      opacities[i] = 0.2 + Math.random() * 0.45
    }
    return { positions, sizes, opacities }
  }, [count])

  useFrame(({ clock }) => {
    if (ref.current) {
      // Extremely slow rotation — parallax cue, not motion
      ref.current.rotation.y = clock.getElapsedTime() * 0.008
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#e8d4a0"
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Atmospheric halo — radial-gradient sprite sitting behind the orb.
// Gives the orb a soft bleed into the void. The color matches the zodiac.
// ────────────────────────────────────────────────────────────────────────────
function useRadialGradientTexture(colorHex) {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const c = new THREE.Color(colorHex)
    const r = Math.round(c.r * 255)
    const g = Math.round(c.g * 255)
    const b = Math.round(c.b * 255)

    const grad = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2,
    )
    grad.addColorStop(0.0, `rgba(${r},${g},${b},0.6)`)
    grad.addColorStop(0.35, `rgba(${r},${g},${b},0.18)`)
    grad.addColorStop(0.65, `rgba(${r},${g},${b},0.04)`)
    grad.addColorStop(1.0, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return texture
  }, [colorHex])
}

function AtmosphericHalo({ colorHex, scale = 2.6 }) {
  const texture = useRadialGradientTexture(colorHex)
  const ref = useRef(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    // Halo breathes ever so slightly slower than the orb
    const breath = 1 + Math.sin(t * 0.25) * 0.04
    ref.current.scale.set(scale * breath, scale * breath, 1)
  })

  return (
    <sprite ref={ref} position={[0, 0, -1.2]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.55}
      />
    </sprite>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Inner core — a small glowing sphere behind a partially-transparent outer.
// Visible as a gentle radial glow through the halftone dots.
// ────────────────────────────────────────────────────────────────────────────
function InnerCore({ colorHex }) {
  const ref = useRef(null)
  const colorA = useMemo(() => new THREE.Color(colorHex), [colorHex])
  const colorB = useMemo(() => new THREE.Color(colorHex).offsetHSL(0, 0, -0.15), [colorHex])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    // Two overlapping sine waves — organic, non-uniform pulse
    const pulse = 0.35 + Math.sin(t * 0.45) * 0.12 + Math.sin(t * 0.83) * 0.06
    ref.current.material.opacity = Math.max(0.05, pulse)
    const mix = (Math.sin(t * 0.23) + 1) * 0.5
    ref.current.material.color.copy(colorA).lerp(colorB, mix)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.6, 48, 48]} />
      <meshBasicMaterial
        color={colorHex}
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Soul Orb — the outer halftone-textured sphere.
// Breath pulse (scale), entry reveal (scale-in), slow Y rotation.
// ────────────────────────────────────────────────────────────────────────────
function SoulOrb({ config, entryStart = 0 }) {
  const { texture, ready } = useShaderLab(config.composition, {
    width: 2048,
    height: 2048,
  })

  const meshRef = useRef(null)
  const startTimeRef = useRef(null)

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.55,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.15,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (startTimeRef.current === null) startTimeRef.current = t + entryStart

    const entryT = Math.max(0, Math.min(1, (t - startTimeRef.current) / 2.2))
    const eased = 1 - Math.pow(1 - entryT, 3)
    const breath = 1 + Math.sin(t * config.pulseHz * Math.PI * 2) * 0.032

    if (meshRef.current) {
      const s = eased * breath
      meshRef.current.scale.set(s, s, s)
      meshRef.current.rotation.y = t * config.rotationSpeed
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
      <sphereGeometry args={[1, 128, 128]} />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Camera — slow push-in from 5.8 → 4.6 across the first 16 seconds.
// Subtle. The viewer doesn't notice they're moving until they are.
// ────────────────────────────────────────────────────────────────────────────
function CameraPushIn({ startZ = 5.8, endZ = 4.6, duration = 16 }) {
  const { camera } = useThree()
  const startRef = useRef(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (startRef.current === null) startRef.current = t
    const progress = Math.min(1, (t - startRef.current) / duration)
    const eased = 1 - Math.pow(1 - progress, 2) // easeOutQuad
    camera.position.z = startZ - (startZ - endZ) * eased
    camera.updateProjectionMatrix()
  })

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// Scene
// ────────────────────────────────────────────────────────────────────────────
function Scene({ zodiacKey }) {
  const config = getZodiac(zodiacKey)

  return (
    <>
      <color attach="background" args={['#060410']} />

      {/* Soft wraparound so texture reads on both sides; directional for subtle form. */}
      <ambientLight intensity={0.85} color="#fff3dc" />
      <directionalLight position={[2, 2, 3]} intensity={0.35} color="#fff5d6" />
      <hemisphereLight args={[config.haloColor, '#1a0a2e', 0.5]} />

      <BackgroundStars />
      <AtmosphericHalo colorHex={config.haloColor} />

      <SoulOrb config={config} />

      {/* Foreground dust — reuses existing FloatingParticles component */}
      <FloatingParticles count={42} />

      <CameraPushIn />

      <EffectComposer>
        <Bloom intensity={0.45} luminanceThreshold={0.6} radius={0.7} mipmapBlur />
        <Vignette offset={0.35} darkness={0.5} eskil={false} />
      </EffectComposer>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Public API — accepts ?zodiac= query param, falls back to default.
// ────────────────────────────────────────────────────────────────────────────
function resolveZodiacKey() {
  if (typeof window === 'undefined') return DEFAULT_ZODIAC
  const key = new URLSearchParams(window.location.search).get('zodiac')
  return key ?? DEFAULT_ZODIAC
}

export function App() {
  const zodiacKey = resolveZodiacKey()
  return (
    <Canvas
      camera={{ position: [0, 0, 5.8], fov: 32 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      dpr={[1, 2]}
    >
      <Scene zodiacKey={zodiacKey} />
    </Canvas>
  )
}
