import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * InnerVision — simple glowing core inside the crystal ball.
 * No shader artifacts. Just a warm pulsing light that IS the vision.
 * The color shifts slowly based on element.
 */

const ELEMENT_COLORS = {
  fire:  { base: '#c87830', bright: '#e8a848' },
  water: { base: '#3868a0', bright: '#58a0c0' },
  earth: { base: '#687830', bright: '#a0a048' },
  air:   { base: '#6858a0', bright: '#9888c8' },
}

export function InnerVision({ element = 'fire' }) {
  const glowRef = useRef()
  const haloRef = useRef()
  const colors = ELEMENT_COLORS[element]
  const baseColor = useMemo(() => new THREE.Color(colors.base), [colors])
  const brightColor = useMemo(() => new THREE.Color(colors.bright), [colors])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (glowRef.current) {
      // Slow pulse — like a heartbeat
      const pulse = 0.12 + Math.sin(t * 0.4) * 0.05 + Math.sin(t * 0.7) * 0.02
      glowRef.current.material.opacity = pulse

      // Color shifts slowly between base and bright
      const mix = Math.sin(t * 0.2) * 0.5 + 0.5
      glowRef.current.material.color.copy(baseColor).lerp(brightColor, mix)
    }

    if (haloRef.current) {
      // Wider halo breathes slower
      const hPulse = 0.04 + Math.sin(t * 0.25) * 0.02
      haloRef.current.material.opacity = hPulse
      haloRef.current.material.color.copy(baseColor).lerp(brightColor, Math.sin(t * 0.15) * 0.5 + 0.5)
    }
  })

  return (
    <group>
      {/* Core — bright warm center */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshBasicMaterial
          color={colors.bright}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Halo — wider soft glow */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.14, 24, 24]} />
        <meshBasicMaterial
          color={colors.base}
          transparent
          opacity={0.08}
        />
      </mesh>
    </group>
  )
}

export { InnerVision as InnerSwirl }
