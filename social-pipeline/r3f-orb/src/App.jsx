import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { MarchingCubes, MarchingCube } from '@react-three/drei'

/**
 * Le Jardin molecule recreation.
 * Using drei's MarchingCubes — organic metaball blobs that merge.
 * Top-down petri dish view. Light cream background.
 */

function MoleculeBlob() {
  const cubesRef = useRef()

  // Animated metaball positions
  const balls = [
    // Main cluster — organic group, slightly off-center
    { baseX: 0.05, baseZ: 0.02, baseY: 0, strength: 0.25, subtract: 10, phase: 0, speed: 0.15 },
    { baseX: 0.18, baseZ: 0.1, baseY: 0, strength: 0.18, subtract: 10, phase: 1.2, speed: 0.12 },
    { baseX: -0.05, baseZ: 0.14, baseY: 0, strength: 0.16, subtract: 10, phase: 2.5, speed: 0.18 },
    { baseX: 0.12, baseZ: -0.1, baseY: 0, strength: 0.15, subtract: 10, phase: 3.8, speed: 0.1 },
    { baseX: -0.12, baseZ: -0.02, baseY: 0, strength: 0.14, subtract: 10, phase: 5.0, speed: 0.14 },
    { baseX: 0.22, baseZ: -0.04, baseY: 0, strength: 0.12, subtract: 10, phase: 0.5, speed: 0.16 },
    // Scattered small ones
    { baseX: -0.32, baseZ: 0.25, baseY: 0, strength: 0.06, subtract: 10, phase: 0.7, speed: 0.08 },
    { baseX: 0.35, baseZ: 0.22, baseY: 0, strength: 0.05, subtract: 10, phase: 2.0, speed: 0.1 },
    { baseX: -0.28, baseZ: -0.28, baseY: 0, strength: 0.05, subtract: 10, phase: 4.2, speed: 0.09 },
    { baseX: 0.3, baseZ: -0.3, baseY: 0, strength: 0.04, subtract: 10, phase: 1.5, speed: 0.11 },
    { baseX: -0.38, baseZ: 0.05, baseY: 0, strength: 0.04, subtract: 10, phase: 3.3, speed: 0.07 },
    { baseX: 0.1, baseZ: 0.38, baseY: 0, strength: 0.04, subtract: 10, phase: 5.5, speed: 0.09 },
  ]

  return (
    <group position={[0, 0, 0]}>
      <MarchingCubes
        ref={cubesRef}
        resolution={64}
        maxPolyCount={40000}
        enableUvs={false}
        enableColors={false}
        scale={0.4}
      >
        <meshPhysicalMaterial
          color="#e8e4dc"
          metalness={0.05}
          roughness={0.15}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
          envMapIntensity={1.5}
        />
        {balls.map((b, i) => (
          <MetaBall key={i} {...b} />
        ))}
      </MarchingCubes>
    </group>
  )
}

function MetaBall({ baseX, baseZ, baseY, strength, subtract, phase, speed }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) {
      // Direct position mutation — MarchingCube needs this
      ref.current.position.set(
        baseX + Math.sin(t * speed * 3 + phase) * 0.08,
        baseY + Math.sin(t * speed * 4 + phase * 1.3) * 0.03,
        baseZ + Math.cos(t * speed * 2.5 + phase) * 0.07
      )
    }
  })

  return (
    <MarchingCube
      ref={ref}
      position={[baseX, baseY, baseZ]}
      strength={strength}
      subtract={subtract}
    />
  )
}

function DishRing() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1.05, 0.025, 24, 128]} />
      <meshStandardMaterial
        color="#d8d0c0"
        metalness={0.92}
        roughness={0.06}
        envMapIntensity={3.0}
      />
    </mesh>
  )
}

// Green liquid base underneath the metaballs
function LiquidBase() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
      <circleGeometry args={[1.03, 64]} />
      <meshPhysicalMaterial
        color="#1a4a28"
        metalness={0.0}
        roughness={0.15}
        transparent
        opacity={0.5}
        clearcoat={0.4}
        envMapIntensity={0.5}
      />
    </mesh>
  )
}

function Scene() {
  return (
    <>
      <Environment files="/studio.hdr" background={false} />

      <ambientLight intensity={0.6} color="#f8f4f0" />
      <directionalLight position={[2, 10, 3]} intensity={1.8} color="#fffff0" />
      <directionalLight position={[-3, 8, -1]} intensity={0.5} color="#f0eaf0" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#f0f0e8" />

      <MoleculeBlob />
      <LiquidBase />
      {/* Light dish bottom — visible through semi-transparent liquid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <circleGeometry args={[1.02, 64]} />
        <meshStandardMaterial color="#e8e4dc" metalness={0.05} roughness={0.6} />
      </mesh>
      <DishRing />

      <EffectComposer>
        <Bloom intensity={0.1} luminanceThreshold={0.92} radius={0.3} />
      </EffectComposer>
    </>
  )
}

export function App() {
  return (
    <Canvas
      camera={{
        position: [0.1, 3.0, 0.4],
        fov: 30,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.3,
      }}
      style={{ background: '#f0ebe4' }}
    >
      <Scene />
    </Canvas>
  )
}
