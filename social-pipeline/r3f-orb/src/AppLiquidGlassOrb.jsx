import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  MeshTransmissionMaterial,
  Stars,
  Environment,
  Lightformer,
  Text,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { FloatingParticles } from './Particles'
import { getZodiac, DEFAULT_ZODIAC } from './zodiacConfigs'

// ────────────────────────────────────────────────────────────────────────────
// Narrative timeline (seconds). Orb is the hero. Prediction is the content.
//
// 0.0 → 2.0   Entry      — orb materializes with elastic warp
// 2.0 → 5.0   Drift      — orb breathes, iridescent streaks dance
// 5.0 → 6.0   Anticipate — distortion gathers, something is coming
// 6.0 → 7.0   Impact     — orb shudders, ripple spreads
// 7.0 → 11.0  Reveal     — prediction text blooms line-by-line in the lower half
// 11.0 → 14.0 Hold       — text stable, orb breathes, shareable freeze
// 14.0 → 15.5 Fade       — text fades, orb re-seals, loop resets
// ────────────────────────────────────────────────────────────────────────────
const TL = {
  entryStart: 0.0,
  entryEnd: 2.0,
  driftEnd: 5.0,
  anticipStart: 5.0,
  anticipEnd: 6.0,
  impactStart: 6.0,
  impactEnd: 7.0,
  revealStart: 7.0,
  revealEnd: 11.0,
  holdEnd: 14.0,
  loop: 15.5,
}

const clamp01 = (x) => Math.max(0, Math.min(1, x))
const phase = (t, start, end) => clamp01((t - start) / (end - start))
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3)
const easeInOutCubic = (x) => x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2
// Elastic out — overshoots then settles
const easeOutElastic = (x) => {
  if (x === 0 || x === 1) return x
  const c = (2 * Math.PI) / 3
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c) + 1
}

// Shared narrative start time — set once by the first useFrame call that sees it.
// All components read from this so their timelines stay in sync.
let SCENE_START = null
function loopTime(clockElapsed) {
  if (SCENE_START === null) SCENE_START = clockElapsed
  return (clockElapsed - SCENE_START) % TL.loop
}

/**
 * Olivia Arcana — Liquid Glass Soul Orb v2.
 *
 * The orb is a WINDOW, not a wallpaper. It refracts whatever sits behind it —
 * stars, nebula, cosmic color. Inside floats an oil-on-water iridescent film
 * that swirls slowly. Narrative beats (impact / constellation / text) land
 * on top of a gentle drifting baseline.
 *
 * Phase 1 (this file's current state): glass + oil + stars. No beats yet.
 */

// ────────────────────────────────────────────────────────────────────────────
// Nebula backdrop — large sphere behind the glass with a shader that mixes
// dim cosmic color + swirling noise. The glass refracts this, so it needs
// to look intentional from a bent angle.
// ────────────────────────────────────────────────────────────────────────────
function NebulaBackdrop({ colorHex }) {
  const ref = useRef(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
    }),
    [colorHex],
  )

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh ref={ref} position={[0, 0, -8]} scale={[22, 22, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uColor;

          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            float a = hash(i);
            float b = hash(i + vec2(1.0, 0.0));
            float c = hash(i + vec2(0.0, 1.0));
            float d = hash(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
          }
          float fbm(vec2 p) {
            float v = 0.0; float a = 0.5;
            for (int i = 0; i < 6; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
            return v;
          }

          // Domain-warped fbm for plasma-like cosmic mist
          float warped(vec2 p) {
            vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
            vec2 r = vec2(fbm(p + q * 4.0 + vec2(1.7, 9.2)), fbm(p + q * 4.0 + vec2(8.3, 2.8)));
            return fbm(p + r * 4.0);
          }

          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv);

            // Deep drift — slow cosmic current
            vec2 p = uv * 1.8 + vec2(uTime * 0.01, uTime * 0.006);
            float n = warped(p);

            // Three tones: void, mid (purple/indigo), tint (zodiac)
            vec3 voidCol = vec3(0.005, 0.003, 0.015);
            vec3 midCol = vec3(0.07, 0.03, 0.12);
            vec3 tintCol = uColor * 0.5;
            vec3 col = mix(voidCol, midCol, smoothstep(0.25, 0.65, n));
            col = mix(col, tintCol, smoothstep(0.55, 0.95, n) * 0.75);

            // Dust "lanes" — brighter streaks where noise crosses a threshold
            float dustRaw = warped(p * 2.1 + vec2(uTime * 0.02, -uTime * 0.015));
            float dust = smoothstep(0.62, 0.76, dustRaw);
            col += uColor * dust * 0.25;

            // Subtle radial vignette focuses the nebula behind the orb
            float vig = smoothstep(0.8, 0.18, r);
            col *= 0.22 + 0.78 * vig;

            // Gentle grain for texture
            float grain = (hash(uv * 1000.0 + uTime * 0.01) - 0.5) * 0.018;
            col += grain;

            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Oil-on-water film — a slightly-smaller sphere inside the glass orb with
// iridescent thin-film interference, swirling normal perturbation.
// This is what the viewer sees refracted through the glass.
// ────────────────────────────────────────────────────────────────────────────
function OilFilm({ colorHex, radius = 0.72 }) {
  const ref = useRef(null)

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uTint: { value: new THREE.Color(colorHex) } }),
    [colorHex],
  )

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
    if (ref.current) {
      // Slow drift — the membrane rolls around like oil in a bowl
      ref.current.rotation.y = clock.getElapsedTime() * 0.08
      ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.04) * 0.15
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 128, 128]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          uniform float uTime;
          uniform vec3 uTint;

          // Fresnel term: stronger at glancing angles — classic thin-film shape
          float fresnel(vec3 n, vec3 v, float power) {
            return pow(1.0 - max(dot(n, v), 0.0), power);
          }

          // Cheap iridescence: angle-driven color shift
          vec3 iridescent(float t) {
            return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));
          }

          void main() {
            float f = fresnel(vNormal, vViewDir, 1.5);
            float t = f * 0.9 + uTime * 0.08;
            vec3 rainbow = iridescent(t);
            // tint toward zodiac color without killing the rainbow
            vec3 col = mix(rainbow, uTint * 1.4, 0.35);
            // additive: brightness = edge × 0.75, center dim
            float alpha = 0.35 + 0.55 * f;
            gl_FragColor = vec4(col * (0.4 + 0.8 * f), alpha);
          }
        `}
      />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// AtmosphericMood — modulates renderer exposure across the narrative.
// Anticipation pulls the scene darker; impact spikes exposure briefly;
// reveal settles to a slightly lifted exposure so text reads well.
// ────────────────────────────────────────────────────────────────────────────
function AtmosphericMood() {
  const { gl } = useThree()
  const base = 1.05
  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    const anticipT = phase(t, TL.anticipStart, TL.anticipEnd)
    const impactT = phase(t, TL.impactStart, TL.impactEnd)
    const revealT = phase(t, TL.revealStart, TL.revealStart + 1.0)
    const holdEase = phase(t, TL.revealStart + 1.0, TL.holdEnd)
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)

    // Darken as anticipation builds, but release the instant impact hits.
    const impactInverse = 1 - phase(t, TL.impactStart, TL.impactStart + 0.2)
    const darken = easeInOutCubic(anticipT) * impactInverse
    // Flash spike on impact — subtle, not blown out
    const flash = Math.sin(impactT * Math.PI) * 0.18
    // Slight lift during reveal so text reads
    const lift = easeOutCubic(revealT) * 0.1 * fadeOut
    // Steady during hold, pull down toward loop end
    const settle = holdEase * (1 - fadeOut) * -0.05

    gl.toneMappingExposure = base - darken * 0.42 + flash + lift + settle
  })
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// CameraPushIn — slow cinematic dolly during the reveal phase.
// Camera eases from 4.3 (wide) → 3.95 (intimate) over the reveal+hold beats,
// then snaps back to 4.3 before the next loop. The viewer feels drawn in.
// ────────────────────────────────────────────────────────────────────────────
function CameraPushIn() {
  const { camera } = useThree()
  const baseZ = 4.3
  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    const time = clock.getElapsedTime()

    // Reveal phase: push IN (intimate); Hold phase: pull back gently; Loop: reset.
    const revealPush = phase(t, TL.revealStart - 1, TL.revealEnd)
    const holdPull = phase(t, TL.revealEnd, TL.holdEnd)
    const loopReset = phase(t, TL.holdEnd, TL.loop)
    const pushEased = easeInOutCubic(revealPush)
    const pullEased = easeInOutCubic(holdPull)
    const resetEased = easeOutCubic(loopReset)
    // Camera ends up at 3.92 during reveal, drifts back to 4.1 during hold, snaps to 4.3 at loop
    const zOffset = 0.38 * pushEased - 0.18 * pullEased
    const resetFactor = 1 - resetEased
    camera.position.z = baseZ - zOffset * resetFactor

    // Subtle lateral parallax during reveal/hold — very slow elliptical drift
    const driftEnv = Math.min(revealPush + holdPull * 0.5, 1) * resetFactor
    camera.position.x = Math.sin(time * 0.25) * 0.025 * driftEnv
    camera.position.y = Math.cos(time * 0.19) * 0.02 * driftEnv

    // Camera shake overrides lateral drift during impact
    const impactT = phase(t, TL.impactStart, TL.impactEnd)
    const impactEnv = Math.sin(impactT * Math.PI)
    if (impactEnv > 0) {
      camera.position.x = Math.sin(time * 42) * 0.012 * impactEnv
      camera.position.y = Math.cos(time * 37) * 0.012 * impactEnv
    }

    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  })
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// ImpactParticles — tiny glimmers spray outward from orb surface at impact.
// Birth on impact start, expand with decaying velocity, fade over ~2s.
// ────────────────────────────────────────────────────────────────────────────
function ImpactParticles({ color }) {
  const count = 90
  const ref = useRef(null)

  const { basePositions, velocities } = useMemo(() => {
    const base = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Random direction on unit sphere
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const x = Math.sin(phi) * Math.cos(theta)
      const y = Math.sin(phi) * Math.sin(theta)
      const z = Math.cos(phi)
      base[i * 3] = x
      base[i * 3 + 1] = y
      base[i * 3 + 2] = z
      // Outward velocity with slight upward bias (drift up)
      const speed = 0.9 + Math.random() * 2.2
      vel[i * 3] = x * speed
      vel[i * 3 + 1] = y * speed + 0.15 * Math.random()
      vel[i * 3 + 2] = z * speed
    }
    return { basePositions: base, velocities: vel }
  }, [])

  // Mutable buffer that three.js reads each frame
  const livePositions = useMemo(() => new Float32Array(basePositions), [basePositions])

  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    const dt = t - TL.impactStart
    const life = clamp01(dt / 1.9)
    const alive = dt >= 0 && dt < 2.0

    if (!ref.current) return
    ref.current.visible = alive
    if (!alive) return

    // Expand particles outward with slight deceleration
    const exp = life * (1.2 - 0.25 * life) * 1.6
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3] = basePositions[i * 3] + velocities[i * 3] * exp
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + velocities[i * 3 + 1] * exp
      arr[i * 3 + 2] = basePositions[i * 3 + 2] + velocities[i * 3 + 2] * exp
    }
    ref.current.geometry.attributes.position.needsUpdate = true

    // Opacity: sharp ramp, slow decay
    const op = life < 0.08 ? life / 0.08 : Math.pow(1 - (life - 0.08) / 0.92, 1.6)
    if (ref.current.material) ref.current.material.opacity = op * 0.85
  })

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[livePositions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={color}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// ImpactFlash — a briefly-bright light that pulses at impact.
// Provides the "something lands" punctuation the previous version was missing.
// ────────────────────────────────────────────────────────────────────────────
function ImpactFlash({ color }) {
  const ref = useRef(null)
  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    const impactT = phase(t, TL.impactStart - 0.2, TL.impactEnd + 0.2)
    // Quick ramp, sustain brief, quick fall
    const env = impactT === 0 ? 0 : impactT === 1 ? 0
      : Math.sin(impactT * Math.PI) ** 1.4
    if (ref.current && ref.current.material) {
      ref.current.material.opacity = env * 0.45
      const s = 0.5 + env * 1.6
      ref.current.scale.setScalar(s)
    }
  })
  return (
    <mesh ref={ref} position={[0, 0, 0.5]} renderOrder={5}>
      <circleGeometry args={[1, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// DailyPrediction — specific, loaded, brief. The content that makes this
// feel like the universe is actually speaking to THIS viewer today.
//
// Reveal is staggered by line — each line blooms in with a small delay, so
// the viewer reads-as-it-arrives. No typewriter per-char (too slow) — per-line.
// ────────────────────────────────────────────────────────────────────────────
function DailyPrediction({ prediction, color }) {
  const lines = prediction.split('\n')
  const refs = useRef([])
  // Strip the "— " prefix for display; remember which lines are captions
  const displayLines = lines.map((l) => l.replace(/^— /, ''))
  const isCaption = lines.map((l) => l.startsWith('—'))

  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    const revealT = phase(t, TL.revealStart, TL.revealEnd)
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)
    const time = clock.getElapsedTime()

    lines.forEach((_, i) => {
      // Each line starts staggered 0, 0.22, 0.44 of the reveal window
      const lineStart = (i / lines.length) * 0.5
      const lineT = clamp01((revealT - lineStart) / 0.42)
      const ref = refs.current[i]
      if (!ref) return

      // Word-by-word reveal — each word lands with weight; wraps correctly.
      const fullText = displayLines[i]
      const words = fullText.split(' ')
      const wordsVisible = Math.ceil(words.length * easeOutCubic(lineT))
      const displayed = words.slice(0, wordsVisible).join(' ')
      if (ref.text !== displayed) {
        ref.text = displayed
        if (typeof ref.sync === 'function') ref.sync()
      }

      // Opacity: ramp up as line starts, hold at 1, fade with loop
      const op = (lineT > 0 ? 1 : 0) * fadeOut
      ref.visible = op > 0.005
      if (ref.material) ref.material.opacity = op

      // Post-reveal undulation — text wavers subtly like it's underwater
      const settled = phase(t, TL.revealStart + lineStart * (TL.revealEnd - TL.revealStart) + 1.0, TL.holdEnd)
      const wave = Math.sin(time * 0.9 + i * 0.9) * 0.009 * settled
      const waveX = Math.cos(time * 0.7 + i * 0.7) * 0.006 * settled
      ref.position.y = ref.userData.baseY + wave
      ref.position.x = waveX
      // Subtle opacity breath in sync with orb pulse so text feels alive
      const breath = 0.92 + Math.sin(time * 0.5 + i * 0.3) * 0.06 * settled
      if (ref.material) ref.material.opacity = op * breath
    })
  })

  // Layout: lines stack in lower ~30% of frame. Base Y for line i.
  const lineSpacing = 0.11
  const startY = -0.55
  const baseYs = lines.map((_, i) => startY - i * lineSpacing)

  return (
    <group position={[0, 0, 1.2]}>
      {lines.map((_, i) => (
        <Text
          key={i}
          ref={(el) => {
            refs.current[i] = el
            if (el) el.userData.baseY = baseYs[i]
          }}
          position={[0, baseYs[i], 0]}
          fontSize={isCaption[i] ? 0.032 : 0.048}
          color={isCaption[i] ? '#c8b89a' : color}
          anchorX="center"
          anchorY="middle"
          letterSpacing={isCaption[i] ? 0.35 : 0.012}
          maxWidth={0.68}
          textAlign="center"
          outlineWidth={0.0025}
          outlineColor="#000"
          outlineOpacity={0.8}
          material-transparent
          material-opacity={0}
          material-toneMapped={false}
          visible={false}
          renderOrder={20}
        >
          {/* text content is set imperatively in useFrame for typewriter */}
        </Text>
      ))}
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Liquid Glass Orb — the outer refracting shell.
// Uses drei's MeshTransmissionMaterial (real-time refraction, chromatic
// aberration, liquid distortion). Breathing scale drives subtle life.
// ────────────────────────────────────────────────────────────────────────────
function LiquidGlassOrb({ config }) {
  const meshRef = useRef(null)
  const matRef = useRef(null)

  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    if (!meshRef.current) return

    // ── Entry: elastic overshoot + squash-Y wobble ──
    const entryT = phase(t, TL.entryStart, TL.entryEnd)
    const entryScale = easeOutElastic(entryT)
    const sq = phase(t, 1.0, 2.5)
    const squashY = 1 + Math.sin(sq * Math.PI * 3) * 0.18 * (1 - sq)

    // ── Breath: slow oscillation throughout ──
    const breath = 1 + Math.sin(t * config.pulseHz * Math.PI * 2) * 0.028

    // ── Anticipation: gentle inward pull just before impact ──
    const anticipT = phase(t, TL.anticipStart, TL.anticipEnd)
    const anticipPull = 1 - 0.04 * easeOutCubic(anticipT)

    // ── Impact: anisotropic squish (Y-) + bulge (XZ+) + distortion spike ──
    const impactT = phase(t, TL.impactStart, TL.impactEnd)
    const impactEnv = Math.sin(impactT * Math.PI)
    const impactY = 1 - 0.14 * impactEnv
    const impactXZ = 1 + 0.07 * impactEnv

    // Orb stays hero. No recede. Reveal phase = orb drifts as usual.
    const s = entryScale * breath * anticipPull
    meshRef.current.scale.x = s * impactXZ
    meshRef.current.scale.y = s * squashY * impactY
    meshRef.current.scale.z = s * impactXZ
    meshRef.current.rotation.y = t * config.rotationSpeed * 0.35

    // ── Reveal/hold sustain — orb stays subtly agitated while message speaks
    const revealSustain = phase(t, TL.revealStart, TL.holdEnd)
    const revealBell = Math.sin(revealSustain * Math.PI) // 0→1→0 over reveal+hold
    // Fade-out at loop end — orb "inhales", distortion drops sharply
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)

    // Material — distortion spikes at impact, gentle sustain through message
    if (matRef.current) {
      const gather = easeOutCubic(anticipT) * 0.4
      const sustainDistort = revealBell * 0.35
      const baseDistort = 0.35 + gather + sustainDistort + 1.3 * impactEnv
      matRef.current.distortion = baseDistort * fadeOut + 0.12 * (1 - fadeOut)
      matRef.current.distortionScale = 0.4 + 0.7 * impactEnv + revealBell * 0.2
      matRef.current.chromaticAberration =
        0.08 + 0.05 * easeOutCubic(anticipT) + 0.12 * impactEnv + revealBell * 0.04
      matRef.current.temporalDistortion =
        0.2 + 0.15 * easeOutCubic(anticipT) + 0.5 * impactEnv + revealBell * 0.18
      // Glass breathes open at impact, seals at loop fade
      matRef.current.thickness = 0.6 - 0.12 * impactEnv + 0.15 * (1 - fadeOut)
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 160, 160]} />
      <MeshTransmissionMaterial
        ref={matRef}
        thickness={0.6}
        transmission={1}
        ior={1.4}
        chromaticAberration={0.08}
        anisotropicBlur={0.15}
        distortion={0.35}
        distortionScale={0.4}
        temporalDistortion={0.2}
        clearcoat={1}
        clearcoatRoughness={0.02}
        roughness={0.04}
        color={0xffffff}
        samples={10}
        resolution={1024}
      />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Scene
// ────────────────────────────────────────────────────────────────────────────
function Scene({ zodiacKey }) {
  const config = getZodiac(zodiacKey)

  return (
    <>
      <color attach="background" args={['#030108']} />

      {/* Custom cosmic environment — what the glass refracts.
          Tinted deep purple + a few zodiac-colored "stars" as Lightformers
          so the orb's refraction shows cosmic color streaks instead of studio lights. */}
      <Environment background={false} resolution={256} frames={Infinity}>
        {/* dome — deep void base */}
        <mesh scale={100}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#050210" side={THREE.BackSide} />
        </mesh>
        {/* soft diffuse top highlight — no ring shape, just a glow */}
        <Lightformer form="circle" intensity={0.8} color={config.haloColor} position={[0, 4, 2]} scale={[8, 8, 1]} />
        {/* deep cosmic left */}
        <Lightformer form="rect" intensity={1.1} color={'#3d1f5a'} position={[-4, 1, 2]} scale={[4, 8, 1]} rotation={[0, 0.4, 0]} />
        {/* zodiac accent right */}
        <Lightformer form="rect" intensity={0.9} color={config.haloColor} position={[4, 0, 2]} scale={[4, 8, 1]} rotation={[0, -0.4, 0]} />
        {/* indigo cosmic behind */}
        <Lightformer form="rect" intensity={0.7} color={'#1a0a44'} position={[0, 0, -4]} scale={[10, 8, 1]} />
        {/* tiny bright star for cat-eye flare */}
        <Lightformer form="circle" intensity={2.2} color={'#fff8dc'} position={[2, 2, 3]} scale={[0.6, 0.6, 1]} />
      </Environment>

      <ambientLight intensity={0.2} />
      <directionalLight position={[2, 3, 4]} intensity={0.6} color="#fff5d6" />
      <directionalLight position={[-3, -1, -2]} intensity={0.35} color={config.haloColor} />

      {/* Deep background stars — far enough to get visibly refracted through the orb */}
      <Stars
        radius={14}
        depth={40}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />

      <NebulaBackdrop colorHex={config.haloColor} />

      {/* Subtle inner glow seed so the orb has a center when empty. */}
      <OilFilm colorHex={config.coreColor} radius={0.45} />

      <LiquidGlassOrb config={config} />

      {/* Punctuation — bright flash + particle spray at impact */}
      <ImpactFlash color={config.haloColor} />
      <ImpactParticles color={config.coreColor} />

      {/* THE CONTENT — today's prediction, typewriter + undulation */}
      <React.Suspense fallback={null}>
        <DailyPrediction prediction={config.prediction} color="#f4e8d0" />
      </React.Suspense>

      {/* Cinema — slow dolly inward during reveal, shake at impact */}
      <CameraPushIn />

      {/* Mood — renderer exposure modulates the scene (dark→flash→reveal) */}
      <AtmosphericMood />

      <FloatingParticles count={60} />

      <EffectComposer>
        <Bloom intensity={0.85} luminanceThreshold={0.5} luminanceSmoothing={0.6} radius={0.9} mipmapBlur />
        <ChromaticAberration offset={[0.0015, 0.0015]} radialModulation modulationOffset={0.25} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.12} />
        <Vignette offset={0.28} darkness={0.65} eskil={false} />
      </EffectComposer>
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────
function resolveZodiacKey() {
  if (typeof window === 'undefined') return DEFAULT_ZODIAC
  const key = new URLSearchParams(window.location.search).get('zodiac')
  return (key ?? DEFAULT_ZODIAC).toLowerCase()
}

export function App() {
  const zodiacKey = resolveZodiacKey()
  return (
    <Canvas
      camera={{ position: [0, 0, 4.3], fov: 32 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      dpr={[1, 2]}
    >
      <Scene zodiacKey={zodiacKey} />
    </Canvas>
  )
}
