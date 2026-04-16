import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Floating particles — dust motes in the oracle's presence.
 * Not orbiting like satellites. Drifting like dust in still air.
 * Barely there. You notice them on second look.
 */
export function FloatingParticles({ count = 25 }) {
  const ref = useRef()

  const data = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 2.5,
      y: (Math.random() - 0.5) * 1.8,
      z: (Math.random() - 0.5) * 2.5,
      driftX: (Math.random() - 0.5) * 0.003,
      driftY: Math.random() * 0.002 + 0.001, // slowly rising
      driftZ: (Math.random() - 0.5) * 0.003,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.3 + Math.random() * 0.4,
    }))
  , [count])

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    data.forEach((d, i) => {
      arr[i * 3] = d.x; arr[i * 3 + 1] = d.y; arr[i * 3 + 2] = d.z
    })
    return arr
  }, [count, data])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const d = data[i]
      // Gentle drift — like dust in still air
      arr[i * 3] = d.x + Math.sin(t * 0.05 + d.phase) * 0.15
      arr[i * 3 + 1] = d.y + t * d.driftY % 2 - 1 // slow rise, wrap
      arr[i * 3 + 2] = d.z + Math.cos(t * 0.04 + d.phase * 1.3) * 0.12
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="#c8b098"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
