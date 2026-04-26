import React, { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  MeshTransmissionMaterial,
  Stars,
  Environment,
  Lightformer,
  Text,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise, HueSaturation, BrightnessContrast } from '@react-three/postprocessing'
import { preloadFont } from 'troika-three-text'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { FloatingParticles } from './Particles'
import { getZodiac, DEFAULT_ZODIAC } from './zodiacConfigs'

// ────────────────────────────────────────────────────────────────────────────
// Narrative timeline (seconds). A 6-beat ritual, not a 3-beat info dump.
//
//   0.0 → 1.0   Darkness   — black, faint cosmic rumble (exposure pulls to 0)
//   1.0 → 3.0   Awakening  — orb materializes FROM the void with elastic warp
//   3.0 → 5.5   Drift      — orb breathes, element starts gathering inside
//   5.5 → 6.5   Gathering  — anticipation tightens, element condenses
//   6.5 → 8.0   Vision     — the sigil forms from the gathered element
//   8.0 → 12.0  Message    — prediction text reveals line-by-line, sigil holds
//  12.0 → 14.5  Carry      — everything settles, orb subtly draws inward
//  14.5 → 15.5  Fade       — back to darkness
//
// The names `entry/anticip/impact/reveal/hold` are kept for code stability;
// mentally remap them: entry=awakening, anticip=gathering, impact=vision,
// reveal=message, hold=carry.
// ────────────────────────────────────────────────────────────────────────────
const TL = {
  darknessEnd: 1.0,
  entryStart: 1.0,
  entryEnd: 3.0,
  driftEnd: 5.5,
  anticipStart: 5.5,
  anticipEnd: 6.5,
  impactStart: 6.5,
  impactEnd: 8.0,
  revealStart: 8.0,
  revealEnd: 12.0,
  holdEnd: 14.5,
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
const easeOutQuart = (x) => 1 - Math.pow(1 - x, 4)

// Local serif — premium tarot-editorial voice. Cormorant Garamond in three
// weights, served from /public/fonts. We explicitly preload each weight
// via troika's cache so drei's <Text> finds them ready at mount time
// (skips the Suspense-hang that bites URL-loaded fonts).
const FONT_LIGHT = '/fonts/CormorantGaramond-Light.ttf'
const FONT_REGULAR = '/fonts/CormorantGaramond-Regular.ttf'
const FONT_MEDIUM = '/fonts/CormorantGaramond-Medium.ttf'

preloadFont({ font: FONT_LIGHT }, () => {})
preloadFont({ font: FONT_REGULAR }, () => {})
preloadFont({ font: FONT_MEDIUM }, () => {})

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
// NebulaLayer — one plane of cosmic plasma. Compose several at different z
// depths, scales, and motion speeds for a layered parallax backdrop that
// the camera push-in can actually reveal.
// ────────────────────────────────────────────────────────────────────────────
function NebulaLayer({
  colorHex,
  z = -8,
  scale = 22,
  noiseScale = 1.8,
  motionSpeed = 0.01,
  tintStrength = 0.75,
  dustIntensity = 0.25,
  opacity = 1.0,
  blend = THREE.NormalBlending,
}) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uNoiseScale: { value: noiseScale },
      uMotionSpeed: { value: motionSpeed },
      uTintStrength: { value: tintStrength },
      uDustIntensity: { value: dustIntensity },
      uOpacity: { value: opacity },
    }),
    [colorHex, noiseScale, motionSpeed, tintStrength, dustIntensity, opacity],
  )

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh position={[0, 0, z]} scale={[scale, scale, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={blend}
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
          uniform float uNoiseScale;
          uniform float uMotionSpeed;
          uniform float uTintStrength;
          uniform float uDustIntensity;
          uniform float uOpacity;

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
          float warped(vec2 p) {
            vec2 q = vec2(fbm(p + vec2(0.0, 0.0)), fbm(p + vec2(5.2, 1.3)));
            vec2 r = vec2(fbm(p + q * 4.0 + vec2(1.7, 9.2)), fbm(p + q * 4.0 + vec2(8.3, 2.8)));
            return fbm(p + r * 4.0);
          }

          void main() {
            vec2 uv = vUv - 0.5;
            float r = length(uv);
            vec2 p = uv * uNoiseScale + vec2(uTime * uMotionSpeed, uTime * uMotionSpeed * 0.6);
            float n = warped(p);

            vec3 voidCol = vec3(0.005, 0.003, 0.015);
            vec3 midCol = vec3(0.07, 0.03, 0.12);
            vec3 tintCol = uColor * 0.5;
            vec3 col = mix(voidCol, midCol, smoothstep(0.25, 0.65, n));
            col = mix(col, tintCol, smoothstep(0.55, 0.95, n) * uTintStrength);

            float dustRaw = warped(p * 2.1 + vec2(uTime * uMotionSpeed * 2.0, -uTime * uMotionSpeed * 1.5));
            float dust = smoothstep(0.62, 0.76, dustRaw);
            col += uColor * dust * uDustIntensity;

            float vig = smoothstep(0.85, 0.15, r);
            col *= 0.22 + 0.78 * vig;

            float grain = (hash(uv * 1000.0 + uTime * 0.01) - 0.5) * 0.018;
            col += grain;

            gl_FragColor = vec4(col, uOpacity);
          }
        `}
      />
    </mesh>
  )
}

// Two-layer parallax: deep void + single tinted plasma layer. Restrained.
function CosmicDepth({ colorHex }) {
  return (
    <>
      {/* Deep void — barely moving, large scale, minimal tint */}
      <NebulaLayer
        colorHex={'#18082e'}
        z={-16}
        scale={46}
        noiseScale={0.85}
        motionSpeed={0.003}
        tintStrength={0.15}
        dustIntensity={0.35}
        opacity={1.0}
      />
      {/* Mid — a quiet cosmic plane with a soft zodiac breath */}
      <NebulaLayer
        colorHex={colorHex}
        z={-8}
        scale={22}
        noiseScale={1.6}
        motionSpeed={0.008}
        tintStrength={0.4}
        dustIntensity={0.14}
        opacity={0.75}
      />
    </>
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
// ElementalParticles — generic particle field, parameterized per element.
// The orb's MeshTransmissionMaterial captures this system into its FBO,
// so every element's inner world shows refracted through the glass.
//
// Shape of the field is controlled by spawn region + velocity bias:
//   fire  — embers rising from below; warm amber; additive
//   water — bubbles rising slow through volume; cool cyan; additive
//   earth — motes drifting slow through volume w/ downward bias; sepia
//   air   — wisps spiraling with gentle upward drift; pale silver
//
// Per-particle life loop: spawn at bottom of element's zone, drift at
// velocity, accumulate life 0→1, respawn at zero. Opacity envelopes
// fade the particle in at birth and out at death so nothing pops.
// ────────────────────────────────────────────────────────────────────────────
const ELEMENT_PARTICLES = {
  fire: {
    count: 54,
    color: '#ff9c52',
    size: 0.038,
    opacity: 0.75,
    spawnRadius: 0.22,
    spawnY: -0.55,
    spawnSpread: 0.08,
    velY: [0.09, 0.22],
    velLateral: 0.05,
    life: 0.32,
    swirl: 0.0,
  },
  water: {
    count: 48,
    color: '#9ed8f0',
    size: 0.032,
    opacity: 0.58,
    spawnRadius: 0.3,
    spawnY: -0.55,
    spawnSpread: 0.1,
    velY: [0.04, 0.1],
    velLateral: 0.02,
    life: 0.22,
    swirl: 0.0,
  },
  earth: {
    count: 56,
    color: '#d4c09a',
    size: 0.028,
    opacity: 0.42,
    spawnRadius: 0.45,
    spawnY: 0.5,
    spawnSpread: 0.3,
    velY: [-0.05, -0.02],
    velLateral: 0.018,
    life: 0.18,
    swirl: 0.0,
  },
  air: {
    count: 46,
    color: '#eae4f4',
    size: 0.03,
    opacity: 0.55,
    spawnRadius: 0.35,
    spawnY: -0.35,
    spawnSpread: 0.2,
    velY: [0.04, 0.1],
    velLateral: 0.015,
    life: 0.22,
    swirl: 0.6, // spiral motion
  },
}

function ElementalParticles({ element }) {
  const params = ELEMENT_PARTICLES[element] ?? ELEMENT_PARTICLES.fire
  const ref = useRef(null)
  const matRef = useRef(null)

  const buffers = useMemo(() => {
    const count = params.count
    const positions = new Float32Array(count * 3)
    const lifeAttr = new Float32Array(count) // per-vertex life 0..1
    const state = new Float32Array(count * 4)
    const velocities = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = Math.random() * params.spawnRadius
      const a = Math.random() * Math.PI * 2
      state[i * 4] = Math.cos(a) * r
      state[i * 4 + 1] = params.spawnY + (Math.random() - 0.5) * params.spawnSpread + Math.random() * 0.6
      state[i * 4 + 2] = Math.sin(a) * r
      state[i * 4 + 3] = Math.random()
      velocities[i * 3] = (Math.random() - 0.5) * params.velLateral * 2
      velocities[i * 3 + 1] =
        params.velY[0] + Math.random() * (params.velY[1] - params.velY[0])
      velocities[i * 3 + 2] = (Math.random() - 0.5) * params.velLateral * 2
    }
    return { positions, lifeAttr, state, velocities, count }
  }, [element, params])

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(params.color) },
      uSize: { value: params.size },
      uOpacity: { value: params.opacity },
      uPixelRatio: { value: Math.min(window.devicePixelRatio ?? 1, 2) },
      uContainR0: { value: 0.72 }, // fade start radius
      uContainR1: { value: 0.92 }, // fully faded radius
    }),
    [params],
  )

  useFrame(({ clock }, delta) => {
    if (!ref.current) return
    const dt = Math.min(delta, 0.05)
    const t = loopTime(clock.getElapsedTime())
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)
    const time = clock.getElapsedTime()
    const { state, velocities, positions, lifeAttr, count } = buffers

    for (let i = 0; i < count; i++) {
      state[i * 4 + 3] += dt * params.life
      if (state[i * 4 + 3] > 1) {
        state[i * 4 + 3] = 0
        const r = Math.random() * params.spawnRadius
        const a = Math.random() * Math.PI * 2
        state[i * 4] = Math.cos(a) * r
        state[i * 4 + 1] = params.spawnY + (Math.random() - 0.5) * params.spawnSpread
        state[i * 4 + 2] = Math.sin(a) * r
      }
      let vx = velocities[i * 3]
      let vy = velocities[i * 3 + 1]
      let vz = velocities[i * 3 + 2]
      if (params.swirl > 0) {
        const cx = state[i * 4]
        const cz = state[i * 4 + 2]
        const theta = time * 0.4 + i * 0.12
        vx += -cz * params.swirl * 0.2 + Math.sin(theta) * 0.01
        vz += cx * params.swirl * 0.2 + Math.cos(theta) * 0.01
      }
      state[i * 4] += vx * dt
      state[i * 4 + 1] += vy * dt
      state[i * 4 + 2] += vz * dt
      positions[i * 3] = state[i * 4]
      positions[i * 3 + 1] = state[i * 4 + 1]
      positions[i * 3 + 2] = state[i * 4 + 2]
      lifeAttr[i] = state[i * 4 + 3]
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.geometry.attributes.aLife.needsUpdate = true

    if (matRef.current) {
      matRef.current.uniforms.uOpacity.value = params.opacity * fadeOut
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[buffers.positions, 3]} />
        <bufferAttribute attach="attributes-aLife" args={[buffers.lifeAttr, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          attribute float aLife;
          varying float vLifeEnv;
          varying float vContain;
          uniform float uSize;
          uniform float uPixelRatio;
          uniform float uContainR0;
          uniform float uContainR1;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPos;

            // Point size with perspective attenuation
            gl_PointSize = uSize * 400.0 * uPixelRatio / -mvPos.z;

            // Life envelope: fade in during first 15%, fade out last 25%
            float fi = smoothstep(0.0, 0.15, aLife);
            float fo = 1.0 - smoothstep(0.75, 1.0, aLife);
            vLifeEnv = fi * fo;

            // Radial containment from orb center
            float r = length(position);
            vContain = 1.0 - smoothstep(uContainR0, uContainR1, r);
          }
        `}
        fragmentShader={/* glsl */ `
          varying float vLifeEnv;
          varying float vContain;
          uniform vec3 uColor;
          uniform float uOpacity;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            // Soft circular point
            float alpha = pow(1.0 - d * 2.0, 1.4);
            gl_FragColor = vec4(uColor, alpha * vLifeEnv * vContain * uOpacity);
          }
        `}
      />
    </points>
  )
}

// Dispatcher — each sign's element gets its own inner world.
function ElementalInner({ element }) {
  return <ElementalParticles element={element} />
}

// ────────────────────────────────────────────────────────────────────────────
// NarrativeAudio — procedural drone + arrival chime. Tuned per element:
// fire sits warm (A2 110Hz), water deep (E2 82Hz), earth rooted (C2 65Hz),
// air open (G2 98Hz). LFO-modulated gain gives the drone a slow breath.
// A chime sine-bell triggers once per loop on the emergence beat.
//
// Browsers block autoplay → audio starts on the first click anywhere.
// ────────────────────────────────────────────────────────────────────────────
const ELEMENT_DRONE_HZ = { fire: 110, water: 82.4, earth: 65.4, air: 98 }
const ELEMENT_CHIME_HZ = { fire: 392, water: 329.6, earth: 261.6, air: 349.2 }
const ELEMENT_PAD_HZ = { fire: 220, water: 164.8, earth: 130.8, air: 196 }

function NarrativeAudio({ element }) {
  const nodesRef = useRef(null)
  const lastCycleRef = useRef(-1)

  useEffect(() => {
    const start = () => {
      if (nodesRef.current) return
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const droneHz = ELEMENT_DRONE_HZ[element] ?? 110
      const padHz = ELEMENT_PAD_HZ[element] ?? 220

      // ── Master bus with a gentle low-pass for warmth ──
      const master = ctx.createGain()
      master.gain.value = 0 // narrative envelope writes to this
      const masterFilter = ctx.createBiquadFilter()
      masterFilter.type = 'lowpass'
      masterFilter.frequency.value = 1400
      masterFilter.Q.value = 0.5
      master.connect(masterFilter).connect(ctx.destination)

      // ── Drone: root sine + 5th overtone, slow LFO breath ──
      const drone = ctx.createOscillator()
      drone.type = 'sine'
      drone.frequency.value = droneHz
      const droneGain = ctx.createGain()
      droneGain.gain.value = 0.12

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.19
      const lfoAmt = ctx.createGain()
      lfoAmt.gain.value = 0.04
      lfo.connect(lfoAmt).connect(droneGain.gain)

      const fifth = ctx.createOscillator()
      fifth.type = 'sine'
      fifth.frequency.value = droneHz * 1.5
      const fifthGain = ctx.createGain()
      fifthGain.gain.value = 0.04

      drone.connect(droneGain).connect(master)
      fifth.connect(fifthGain).connect(master)

      // ── Pad: higher octave triangle that crossfades in during vision beat ──
      const pad = ctx.createOscillator()
      pad.type = 'triangle'
      pad.frequency.value = padHz
      const padGain = ctx.createGain()
      padGain.gain.value = 0 // modulated per beat
      pad.connect(padGain).connect(master)

      // ── Noise bed: filtered pink noise (subtle, element-tuned) ──
      const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const noiseData = noiseBuf.getChannelData(0)
      // Simple pink-ish noise via 1/f approximation
      let b0 = 0, b1 = 0, b2 = 0
      for (let i = 0; i < noiseData.length; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.997 * b0 + white * 0.0555
        b1 = 0.985 * b1 + white * 0.075
        b2 = 0.95 * b2 + white * 0.15
        noiseData[i] = (b0 + b1 + b2) * 0.17
      }
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuf
      noise.loop = true
      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.value = element === 'water' ? 800 : element === 'fire' ? 600 : element === 'air' ? 1200 : 400
      noiseFilter.Q.value = 0.6
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.015
      noise.connect(noiseFilter).connect(noiseGain).connect(master)

      drone.start()
      fifth.start()
      pad.start()
      lfo.start()
      noise.start()
      ctx.resume()

      nodesRef.current = { ctx, master, padGain, droneGain }
    }

    window.addEventListener('click', start, { once: true })
    window.addEventListener('keydown', start, { once: true })
    window.addEventListener('touchstart', start, { once: true })
    return () => {
      window.removeEventListener('click', start)
      window.removeEventListener('keydown', start)
      window.removeEventListener('touchstart', start)
      if (nodesRef.current?.ctx) nodesRef.current.ctx.close()
      nodesRef.current = null
    }
  }, [element])

  useFrame(({ clock }) => {
    const nodes = nodesRef.current
    if (!nodes) return
    const { master, padGain } = nodes
    const t = loopTime(clock.getElapsedTime())

    // Narrative envelope on master: quiet during darkness/fade,
    // full during message, settles during carry.
    const awakeRamp = easeOutCubic(clamp01((t - 0.5) / (TL.entryEnd - 0.5)))
    const fadeRamp = 1 - easeInOutCubic(phase(t, TL.holdEnd, TL.loop))
    const envelope = Math.min(awakeRamp, fadeRamp)
    master.gain.value = envelope * 0.7

    // Pad crossfades in during vision → message beats, out during carry
    const padIn = easeOutCubic(phase(t, TL.impactStart, TL.revealStart))
    const padOut = easeInOutCubic(phase(t, TL.revealEnd, TL.holdEnd))
    padGain.gain.value = (padIn - padOut * 0.7) * 0.04

    // Chime on vision beat, once per loop cycle
    const cycle = Math.floor(clock.getElapsedTime() / TL.loop)
    if (cycle > lastCycleRef.current && t >= TL.impactStart + 0.2 && t < TL.impactStart + 0.5) {
      lastCycleRef.current = cycle
      playChime(nodes.ctx, master, ELEMENT_CHIME_HZ[element] ?? 392)
    }
  })

  return null
}

// Bell-like chime with partials — warmer than a pure sine.
function playChime(ctx, destination, freq) {
  const now = ctx.currentTime
  const partials = [
    { ratio: 1.0, gain: 0.07, decay: 2.8 },
    { ratio: 2.01, gain: 0.028, decay: 1.8 },
    { ratio: 3.02, gain: 0.014, decay: 1.2 },
    { ratio: 4.03, gain: 0.008, decay: 0.9 },
  ]
  for (const p of partials) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq * p.ratio
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0, now)
    g.gain.linearRampToValueAtTime(p.gain, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay)
    osc.connect(g).connect(destination)
    osc.start(now)
    osc.stop(now + p.decay + 0.1)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// InnerDepth — a drifting volumetric-feeling layer inside the orb. Gives
// the glass interior a sense of *filled* liquid-light rather than empty
// space. Slow 3D fbm drift over the sphere's local position makes the
// patterns feel deep when refracted through the outer glass.
// ────────────────────────────────────────────────────────────────────────────
function InnerDepth({ config }) {
  const matRef = useRef(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHalo: { value: new THREE.Color(config.haloColor) },
      uCore: { value: new THREE.Color(config.coreColor) },
    }),
    [config.haloColor, config.coreColor],
  )

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh>
      <sphereGeometry args={[0.78, 128, 128]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
        blending={THREE.AdditiveBlending}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vLocalPos;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPos.xyz);
            vLocalPos = position;
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vLocalPos;
          uniform float uTime;
          uniform vec3 uHalo;
          uniform vec3 uCore;

          float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          float noise(vec3 p) {
            vec3 i = floor(p); vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
                  mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
              mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                  mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
              f.z);
          }
          float fbm(vec3 p) {
            float v = 0.0; float a = 0.5;
            for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
            return v;
          }

          void main() {
            float fres = pow(max(dot(vNormal, vViewDir), 0.0), 1.2);

            // Very slow drift — restrained, volumetric-feeling motion
            vec3 p = vLocalPos * 2.2 + vec3(uTime * 0.03, uTime * 0.022, uTime * 0.015);
            float n = fbm(p);
            float flow = fbm(p * 1.7 - vec3(uTime * 0.018));
            float swirl = smoothstep(0.35, 0.82, n * 0.6 + flow * 0.4);

            // Tonal body — deep core glow → warm halo breath
            vec3 deep = uCore * 0.35;
            vec3 bright = uHalo * 0.75;
            vec3 col = mix(deep, bright, swirl);

            // Fresnel-weighted (brightest where the viewer looks in)
            col *= fres * 1.1;

            gl_FragColor = vec4(col, fres * (0.25 + swirl * 0.35));
          }
        `}
      />
    </mesh>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// IridescentShell — a thin fresnel-driven sheen just outside the orb's
// glass surface. Reads as oil-slick thin-film interference catching light
// at grazing angles. The difference between "CG glass ball" and "glass
// ball with a real material on its surface."
// ────────────────────────────────────────────────────────────────────────────
function IridescentShell({ config }) {
  const matRef = useRef(null)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(config.haloColor) },
    }),
    [config.haloColor],
  )

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime()
  })

  return (
    <mesh renderOrder={3}>
      <sphereGeometry args={[1.003, 128, 128]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.FrontSide}
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vWorldPos;
          void main() {
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPos.xyz);
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vViewDir;
          varying vec3 vWorldPos;
          uniform float uTime;
          uniform vec3 uTint;

          vec3 iridescent(float t) {
            return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.28, 0.6)));
          }

          void main() {
            // Fresnel — near zero at face-on, rises to 1 at grazing
            float fres = 1.0 - max(dot(vNormal, vViewDir), 0.0);
            float rim = pow(fres, 2.2);

            // Thin-film color cycles with angle + slow time
            vec3 rainbow = iridescent(fres * 1.2 + uTime * 0.025 + vWorldPos.y * 0.1);
            vec3 col = mix(rainbow, uTint * 1.3, 0.3);

            // Rim dominance: quiet face-on, bright edges
            vec3 finalCol = col * rim * 1.4;

            gl_FragColor = vec4(finalCol, rim * 0.55 + 0.02);
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

    // Darkness → awakening: exposure ramps from ~0 during the opening
    // beat, reaches `base` by the time the orb has materialized.
    const awakeRamp = easeOutCubic(phase(t, 0, TL.entryEnd))
    // Fade ramp: pulls exposure back toward darkness at loop end
    const fadeRamp = 1 - easeInOutCubic(phase(t, TL.holdEnd, TL.loop))
    const envelope = Math.min(awakeRamp, fadeRamp)
    const darknessFloor = 0.04
    const baseExposure = darknessFloor + envelope * (base - darknessFloor)

    // Beat-level modulations layered on top of the envelope
    const anticipT = phase(t, TL.anticipStart, TL.anticipEnd)
    const impactT = phase(t, TL.impactStart, TL.impactEnd)
    const revealT = phase(t, TL.revealStart, TL.revealStart + 1.5)
    const holdEase = phase(t, TL.revealStart + 1.5, TL.holdEnd)

    const impactInverse = 1 - phase(t, TL.impactStart, TL.impactStart + 0.5)
    const gatheringDip = easeInOutCubic(anticipT) * impactInverse * -0.15
    const visionSwell = Math.sin(impactT * Math.PI) * 0.08
    const messageRead = easeOutCubic(revealT) * 0.08
    const carrySettle = holdEase * -0.04

    gl.toneMappingExposure =
      baseExposure + (gatheringDip + visionSwell + messageRead + carrySettle) * envelope
  })
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// CameraPushIn — slow cinematic dolly during the reveal phase.
// Camera eases from 4.3 (wide) → 3.95 (intimate) over the reveal+hold beats,
// then snaps back to 4.3 before the next loop. The viewer feels drawn in.
// ────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────
// CameraPushIn — cinematic descent from wide cosmic view → intimate reading
// → gentle pullback for the "carry" beat → return to wide for next loop.
//
//   darkness (0-1):      z=4.85 (cosmic far)
//   awakening → drift:   z=4.85 → 4.40 (orb materializes at middle distance)
//   drift → message:     z=4.40 → 3.88 (viewer drawn in as sigil forms)
//   message hold:        z=3.88 (intimate, locked on reading)
//   carry:               z=3.88 → 4.05 (slight pullback as reading is handed over)
//   fade → loop reset:   z=4.05 → 4.85 (back to cosmic for next cycle)
//
// A subtle lateral arc only during the vision beat gives a "discovery"
// feel as the sigil coalesces.
// ────────────────────────────────────────────────────────────────────────────
function CameraPushIn() {
  const { camera } = useThree()

  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())

    // Keyframe z-interpolation across beats
    const zWide = 4.85
    const zMid = 4.45
    const zIntimate = 4.02   // just close enough to feel drawn in — text still reads
    const zCarry = 4.2

    let z = zWide
    if (t < TL.entryStart) {
      z = zWide
    } else if (t < TL.driftEnd) {
      z = zWide + (zMid - zWide) * easeInOutCubic(phase(t, TL.entryStart, TL.driftEnd))
    } else if (t < TL.revealStart + 1.0) {
      z = zMid + (zIntimate - zMid) * easeInOutCubic(phase(t, TL.driftEnd, TL.revealStart + 1.0))
    } else if (t < TL.revealEnd) {
      z = zIntimate
    } else if (t < TL.holdEnd) {
      z = zIntimate + (zCarry - zIntimate) * easeInOutCubic(phase(t, TL.revealEnd, TL.holdEnd))
    } else {
      z = zCarry + (zWide - zCarry) * easeOutCubic(phase(t, TL.holdEnd, TL.loop))
    }
    camera.position.z = z

    // Subtle discovery arc only during vision beat (elliptical sway)
    const visionArcEnv = Math.sin(phase(t, TL.impactStart, TL.impactEnd) * Math.PI)
    const time = clock.getElapsedTime()
    camera.position.x = Math.sin(time * 1.2) * 0.03 * visionArcEnv
    camera.position.y = Math.cos(time * 0.9) * 0.02 * visionArcEnv

    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  })
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// LiquidGlyph — the zodiac sign, born FROM the orb's core.
//
// Placed at z=0 (orb center). Because MeshTransmissionMaterial pre-renders
// the scene (minus itself) into a buffer and refracts that buffer through
// the glass, anything inside the sphere is only ever visible *as a refracted
// image through the liquid glass*. This is the actual mechanism — not a
// simulation of it. During the impact beat the orb's distortion spikes to
// ~1.95, so the glyph literally coalesces out of chaos and settles into
// focus as distortion eases into reveal/hold.
//
// Timeline:
//   5.0–6.0   hidden (glyph waits in the void)
//   6.0–7.0   elastic emergence — scale 0 → overshoot → 1
//   7.0–14.0  stable presence, gentle breath, slight drift
//   14.0–15.5 dissolves back into the orb
// ────────────────────────────────────────────────────────────────────────────
function LiquidGlyph({ config }) {
  const groupRef = useRef(null)
  const matRef = useRef(null)

  // Rasterize the unicode glyph to an offscreen canvas — becomes the
  // alpha mask for the shader. Fonts that actually contain zodiac glyphs
  // (Apple Symbols, Segoe UI Symbol) are preferred before serif fallback.
  const glyphTexture = useMemo(() => {
    const size = 1024
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)
    ctx.font = 'bold 760px "Apple Symbols", "Segoe UI Symbol", "Arial Unicode MS", serif'
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Slight optical-center nudge — most unicode glyphs sit visually low
    ctx.fillText(config.glyph, size / 2, size / 2 + 30)
    const tex = new THREE.CanvasTexture(canvas)
    tex.anisotropy = 16
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.needsUpdate = true
    return tex
  }, [config.glyph])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMask: { value: glyphTexture },
      uTint: { value: new THREE.Color(config.haloColor) },
      uOpacity: { value: 0 },
      uEmerge: { value: 0 },
    }),
    [glyphTexture, config.haloColor],
  )

  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    if (!groupRef.current) return

    const emergeT = phase(t, TL.anticipStart - 0.5, TL.revealStart + 0.5)
    const emergeScale = easeInOutCubic(emergeT)
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)

    groupRef.current.scale.setScalar(0.42 * emergeScale * fadeOut)

    // Mutate uniforms directly on the material — the JSX `uniforms` prop
    // is applied once at construction and subsequent mutations to the
    // memoized plain object don't always propagate to the GPU.
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime()
      matRef.current.uniforms.uOpacity.value = emergeScale * fadeOut
      matRef.current.uniforms.uEmerge.value = emergeScale
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh renderOrder={10} position={[0, 0, 1.05]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          side={THREE.DoubleSide}
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
            uniform sampler2D uMask;
            uniform vec3 uTint;
            uniform float uOpacity;
            uniform float uEmerge;

            // Thin-film iridescence — phase shifts across RGB make rainbow.
            vec3 iridescent(float t) {
              return 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.28, 0.6)));
            }

            void main() {
              vec2 uv = vUv;
              float mask = texture2D(uMask, uv).a;
              if (mask < 0.02) discard;

              // Pearl body — a soft warm white with a faint sign-tint breath.
              // No cycling rainbow; the orb and scene carry color, not the glyph.
              vec3 pearl = vec3(0.94, 0.92, 0.96);
              vec3 body = mix(pearl, uTint, 0.12);

              // Rim — a very soft lift at the silhouette for definition only.
              float rim = 1.0 - smoothstep(0.18, 0.72, mask);
              vec3 col = mix(body, vec3(1.0, 0.99, 1.02), rim * 0.35);

              // During emergence, lift toward pure white so it feels like it's
              // resolving from pure light into its settled pearl form.
              float formWash = pow(1.0 - uEmerge, 1.6);
              col = mix(col, vec3(1.0), formWash * 0.5);

              gl_FragColor = vec4(col, mask * uOpacity);
            }
          `}
        />
      </mesh>
    </group>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// DailyPrediction — premium editorial typography.
//
// Three-line hierarchy: setup (light) → hero prediction (medium, largest) →
// caption (regular, tracked out). Cormorant Garamond loaded locally to
// avoid the gstatic Suspense-hang gotcha.
//
// Per-line animation: synchronous fade + subtle Y-lift (starts 0.03 below,
// eases up) + blur-to-sharp transition on the text itself (outlineBlur
// settles from soft halo → crisp edge as the line lands). No per-word
// typewriter — too busy.
// ────────────────────────────────────────────────────────────────────────────
function DailyPrediction({ prediction, color }) {
  const lines = prediction.split('\n')
  const refs = useRef([])
  const displayLines = lines.map((l) => l.replace(/^— /, ''))
  const isCaption = lines.map((l) => l.startsWith('—'))

  // Pick hero: middle non-caption line if there are 2+ non-caption lines,
  // else the first non-caption line. The hero reads largest.
  const nonCaptionCount = isCaption.filter((c) => !c).length
  const heroIndex = lines.findIndex(
    (_, i) => !isCaption[i] && (nonCaptionCount < 2 || i > 0),
  )

  // Per-line typographic treatment.
  const lineStyle = (i) => {
    if (isCaption[i]) {
      return {
        font: FONT_REGULAR,
        fontSize: 0.022,
        color: '#b89878',
        letterSpacing: 0.5,
        topGap: 0.065, // extra space for the flourish above
        leading: 1.7,
      }
    }
    if (i === heroIndex) {
      return {
        font: FONT_MEDIUM,
        fontSize: 0.058,
        color,
        letterSpacing: 0.002,
        topGap: 0.02,
        leading: 1.15,
      }
    }
    return {
      font: FONT_LIGHT,
      fontSize: 0.042,
      color,
      letterSpacing: 0.015,
      topGap: 0.016,
      leading: 1.3,
    }
  }

  // Layout: stack from a shared startY; each line's Y is derived from
  // previous line's size + topGap so sizes compose cleanly.
  const baseYs = useMemo(() => {
    const ys = []
    let y = -0.5
    for (let i = 0; i < lines.length; i++) {
      const s = lineStyle(i)
      ys.push(y)
      y -= s.fontSize * s.leading + s.topGap
    }
    return ys
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prediction])

  useFrame(({ clock }) => {
    const t = loopTime(clock.getElapsedTime())
    const revealT = phase(t, TL.revealStart, TL.revealEnd)
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)

    lines.forEach((_, i) => {
      const ref = refs.current[i]
      if (!ref) return

      // Each line starts slightly staggered. Hero lands slightly after
      // the setup so the viewer reads setup → hero as a two-beat.
      const lineStart = (i / Math.max(lines.length, 1)) * 0.42
      const lineT = clamp01((revealT - lineStart) / 0.55)
      const eased = easeOutQuart(lineT)

      const op = eased * fadeOut
      ref.visible = op > 0.005
      if (ref.material) ref.material.opacity = op

      // Subtle Y-float up — starts 0.024 below final, settles
      ref.position.y = ref.userData.baseY - (1 - eased) * 0.024
      ref.position.x = 0
    })

    // Animate the decorative flourish alongside the caption (if any)
    const flourishRef = refs.current[lines.length]
    if (flourishRef) {
      const lineStart = ((lines.length - 1) / Math.max(lines.length, 1)) * 0.42
      const lineT = clamp01((revealT - lineStart - 0.08) / 0.55)
      const eased = easeOutQuart(lineT)
      const op = eased * fadeOut
      flourishRef.visible = op > 0.005
      if (flourishRef.material) flourishRef.material.opacity = op * 0.7
      flourishRef.position.y = flourishRef.userData.baseY - (1 - eased) * 0.015
    }
  })

  // Position for the decorative flourish — nests between hero and caption
  const captionIdx = lines.findIndex((_, i) => isCaption[i])
  const flourishY =
    captionIdx > 0 && captionIdx < baseYs.length
      ? (baseYs[captionIdx - 1] + baseYs[captionIdx]) / 2
      : null

  return (
    <group position={[0, 0, 1.2]}>
      {lines.map((_, i) => {
        const s = lineStyle(i)
        return (
          <Text
            key={i}
            ref={(el) => {
              refs.current[i] = el
              if (el) el.userData.baseY = baseYs[i]
            }}
            position={[0, baseYs[i], 0]}
            font={s.font}
            fontSize={s.fontSize}
            color={s.color}
            anchorX="center"
            anchorY="middle"
            letterSpacing={s.letterSpacing}
            lineHeight={s.leading}
            maxWidth={0.7}
            textAlign="center"
            outlineWidth={0.0018}
            outlineColor="#000"
            outlineOpacity={0.45}
            outlineBlur={0.006}
            material-transparent
            material-opacity={0}
            material-toneMapped={false}
            visible={false}
            renderOrder={20}
          >
            {displayLines[i]}
          </Text>
        )
      })}
      {/* Editorial flourish between hero and caption — a centered diamond.
          Drifts in with the caption so it reads as part of the tag block. */}
      {flourishY !== null && (
        <Text
          ref={(el) => {
            refs.current[lines.length] = el
            if (el) el.userData.baseY = flourishY
          }}
          position={[0, flourishY, 0]}
          font={FONT_REGULAR}
          fontSize={0.014}
          color={'#8e6e52'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={1.2}
          material-transparent
          material-opacity={0}
          material-toneMapped={false}
          visible={false}
          renderOrder={20}
        >
          {'· · ·'}
        </Text>
      )}
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

    // ── Impact beat — gentle pressure wave (was a punch, now a swell) ──
    const impactT = phase(t, TL.impactStart, TL.impactEnd)
    const impactEnv = Math.sin(impactT * Math.PI)
    const impactY = 1 - 0.05 * impactEnv
    const impactXZ = 1 + 0.025 * impactEnv

    // "Carry" beat — orb draws gently inward during hold, as if the
    // reading is being handed to the viewer.
    const carryT = phase(t, TL.revealEnd, TL.holdEnd)
    const carryShrink = 1 - easeInOutCubic(carryT) * 0.035

    // Orb stays hero. No recede. Reveal phase = orb drifts as usual.
    const s = entryScale * breath * anticipPull * carryShrink
    meshRef.current.scale.x = s * impactXZ
    meshRef.current.scale.y = s * squashY * impactY
    meshRef.current.scale.z = s * impactXZ
    meshRef.current.rotation.y = t * config.rotationSpeed * 0.35

    // ── Reveal/hold sustain — orb stays subtly agitated while message speaks
    const revealSustain = phase(t, TL.revealStart, TL.holdEnd)
    const revealBell = Math.sin(revealSustain * Math.PI) // 0→1→0 over reveal+hold
    // Fade-out at loop end — orb "inhales", distortion drops sharply
    const fadeOut = 1 - phase(t, TL.holdEnd, TL.loop)

    // Material — the glass settles to a still, crisp state once the sigil
    // has emerged, so the glyph inside reads without wavering. Distortion
    // and temporal sampling are only active during anticipation + impact.
    if (matRef.current) {
      const gather = easeOutCubic(anticipT) * 0.15
      const settle = 1 - phase(t, TL.impactEnd, TL.revealStart + 1.0)
      const activeEnv = Math.max(gather, impactEnv * 0.22) * (settle)
      matRef.current.distortion = 0.22 + activeEnv
      matRef.current.distortionScale = 0.4
      matRef.current.chromaticAberration = 0.05 + 0.02 * activeEnv
      matRef.current.temporalDistortion = 0.05 + 0.08 * activeEnv
      matRef.current.thickness = 0.6 + 0.15 * (1 - fadeOut)
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

      <CosmicDepth colorHex={config.haloColor} />

      {/* Layered interior: bright iridescent core at 0.45 + a wider
          volumetric drift at 0.78 so the orb reads as filled liquid light. */}
      <OilFilm colorHex={config.coreColor} radius={0.45} />
      <InnerDepth config={config} />
      {/* Element-specific inner world — embers for fire, etc. */}
      <ElementalInner element={config.element} />

      {/* The zodiac sigil — forms inside the orb, visible as a refracted
          image through the glass (MeshTransmissionMaterial captures it
          into the FBO). Placed BEFORE the orb in render order. */}
      <React.Suspense fallback={null}>
        <LiquidGlyph config={config} />
      </React.Suspense>

      <LiquidGlassOrb config={config} />

      {/* THE CONTENT — today's prediction, typewriter + undulation */}
      <React.Suspense fallback={null}>
        <DailyPrediction prediction={config.prediction} color="#f4e8d0" />
      </React.Suspense>

      {/* Cinema — slow dolly inward during reveal, shake at impact */}
      <CameraPushIn />

      {/* Mood — renderer exposure modulates the scene (dark→flash→reveal) */}
      <AtmosphericMood />

      <FloatingParticles count={60} />

      {/* Procedural drone + arrival chime — element-tuned. Starts on click. */}
      <NarrativeAudio element={config.element} />

      <EffectComposer>
        <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.7} radius={0.85} mipmapBlur />
        <ChromaticAberration offset={[0.001, 0.001]} radialModulation modulationOffset={0.3} />
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.08} />
        <Vignette offset={0.3} darkness={0.6} eskil={false} />
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
