/**
 * AlchemicalRelic.tsx — Flagship 3D Celestial Portrait (v4)
 * 
 * A high-fidelity physical relic representing the user's natal DNA.
 * Features:
 *   - Central 'Self' sphere with refraction and element pulse
 *   - Physical golden filaments (constellation)
 *   - Floating planetary nodes with glyphs
 *   - Interaction: Tilt-responsive and orbital rotation
 */

"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { 
  MeshTransmissionMaterial, 
  Float, 
  Text,
  Torus
} from "@react-three/drei";
import * as THREE from "three";
import { type Portrait3DConfig } from "../../lib/portrait-v4";

export default function AlchemicalRelic({ config }: { config: Portrait3DConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current || !coreRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Slow, sacred rotation
    groupRef.current.rotation.y = time * 0.15;
    
    // Core pulsing with elemental energy
    const pulse = 1.0 + Math.sin(time * 1.5) * 0.05;
    coreRef.current.scale.set(pulse, pulse, pulse);
  });

  return (
    <group ref={groupRef}>
      {/* ── THE ASTROLABE BASE (Deep Obsidian Disk) ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <cylinderGeometry args={[2.8, 2.8, 0.12, 64]} />
        <MeshTransmissionMaterial 
          thickness={0.6} 
          roughness={0.04} 
          transmission={1} 
          ior={1.48} 
          chromaticAberration={0.08}
          color="#06041a"
          anisotropy={0.2}
        />
      </mesh>

      {/* ── THE INNER RINGS (Modality) ── */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <Torus args={[2.75, 0.015, 16, 100]}>
          <meshStandardMaterial color={config.colors.secondary} emissive={config.colors.secondary} emissiveIntensity={0.5} />
        </Torus>
        <Torus args={[0.6, 0.008, 16, 100]}>
          <meshStandardMaterial color={config.colors.secondary} emissive={config.colors.secondary} emissiveIntensity={0.2} />
        </Torus>
      </group>

      {/* ── THE CORE (The Self — Refractive Soul) ── */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.4}>
        <mesh ref={coreRef} position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.5, 64, 64]} />
          <MeshTransmissionMaterial 
            thickness={2.5} 
            roughness={0.01} 
            transmission={1} 
            ior={1.4} 
            chromaticAberration={0.12}
            dispersion={0.5}
            color={config.colors.primary}
          />
        </mesh>
      </Float>

      {/* ── THE CONSTELLATION FILAMENTS (Sun Sign DNA) ── */}
      {/* (Procedural strands connecting core to the rim) */}
      {useMemo(() => {
        const strands = [];
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const start = new THREE.Vector3(0, 0.5, 0);
          const end = new THREE.Vector3(Math.cos(angle) * 2.7, 0, Math.sin(angle) * 2.7);
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
          mid.y += 0.4;
          const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
          strands.push(curve);
        }
        return strands;
      }, []).map((curve, i) => (
        <mesh key={`strand-${i}`}>
          <tubeGeometry args={[curve, 32, 0.003, 8, false]} />
          <meshStandardMaterial color={config.colors.primary} emissive={config.colors.primary} emissiveIntensity={2} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* ── PLANETARY GEMS (The Celestial Players) ── */}
      {config.planetPositions.map((p) => {
        const x = Math.cos(p.angle) * 2.4;
        const z = Math.sin(p.angle) * 2.4;
        const isSun = p.name === "Sun";
        
        return (
          <group key={`planet-${p.name}`} position={[x, 0.1, z]}>
            {/* The Gem */}
            <mesh>
              <sphereGeometry args={[isSun ? 0.12 : 0.08, 24, 24]} />
              <meshStandardMaterial 
                color={isSun ? "#FFD700" : config.colors.accent} 
                emissive={isSun ? "#FFD700" : config.colors.accent} 
                emissiveIntensity={isSun ? 12 : 4} 
              />
            </mesh>
            
            {/* The Label */}
            <Text
              position={[0, 0.25, 0]}
              fontSize={0.12}
              font="var(--font-body)"
              color="white"
              anchorY="bottom"
              maxWidth={1}
              textAlign="center"
            >
              {p.glyph}
            </Text>

            {/* Vertical Anchor Line */}
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[0.005, 0.2, 0.005]} />
              <meshStandardMaterial color="white" transparent opacity={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* ── ASPECT WEBS (Geometric Resonance) ── */}
      {config.aspectLinks.map((a, i) => {
        const p1 = config.planetPositions[a.from];
        const p2 = config.planetPositions[a.to];
        if (!p1 || !p2) return null;

        const start = new THREE.Vector3(Math.cos(p1.angle) * 2.4, 0.1, Math.sin(p1.angle) * 2.4);
        const end = new THREE.Vector3(Math.cos(p2.angle) * 2.4, 0.1, Math.sin(p2.angle) * 2.4);
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.y = -0.05; // Slightly sub-surface

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        
        return (
          <mesh key={`aspect-${i}`}>
            <tubeGeometry args={[curve, 48, 0.005 * a.strength, 8, false]} />
            <meshStandardMaterial 
              color={a.color} 
              emissive={a.color} 
              emissiveIntensity={2} 
              transparent 
              opacity={0.4} 
            />
          </mesh>
        );
      })}
    </group>
  );
}
