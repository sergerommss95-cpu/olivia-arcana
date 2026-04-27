/**
 * LivingRelic.tsx — Reimagined Celestial Portrait (v4)
 * 
 * A 3D physical artifact that represents the user's natal DNA.
 * Replaces the flat 2D canvas with a high-fidelity WebGL object.
 */

"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { 
  MeshTransmissionMaterial, 
  Float, 
  Text,
  Cylinder
} from "@react-three/drei";
import * as THREE from "three";
import { type Portrait3DConfig } from "../../lib/portrait-v4";

export default function LivingRelic({ config }: { config: Portrait3DConfig }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * config.rotationSpeed;
  });

  return (
    <group ref={groupRef}>
      {/* ── THE BASE (Obsidian Disk) ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.1, 64]} />
        <MeshTransmissionMaterial 
          thickness={0.5} 
          roughness={0.05} 
          transmission={1} 
          ior={1.5} 
          color="#050310" 
        />
      </mesh>

      {/* ── THE CORE (The Self) ── */}
      <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <MeshTransmissionMaterial 
            thickness={2.0} 
            roughness={0.02} 
            transmission={1} 
            ior={1.4} 
            chromaticAberration={0.1}
            color={config.colors.primary}
          />
        </mesh>
      </Float>

      {/* ── PLANETS (Floating Gemstones) ── */}
      {config.planetPositions.map((p, i) => {
        const x = Math.cos(p.angle) * 2.2;
        const z = Math.sin(p.angle) * 2.2;
        return (
          <group key={p.name} position={[x, 0.2, z]}>
            <mesh>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial 
                color={config.colors.accent} 
                emissive={config.colors.accent} 
                emissiveIntensity={2} 
              />
            </mesh>
            <Text
              position={[0, 0.2, 0]}
              fontSize={0.1}
              font="var(--font-heading)"
              color={config.colors.accent}
              anchorY="bottom"
            >
              {p.glyph}
            </Text>
          </group>
        );
      })}

      {/* ── ASPECTS (Laser-Etched Wires) ── */}
      {config.aspectLinks.map((a, i) => {
        const fromP = config.planetPositions[a.from];
        const toP = config.planetPositions[a.to];
        if (!fromP || !toP) return null;

        const start = new THREE.Vector3(Math.cos(fromP.angle) * 2.2, 0.2, Math.sin(fromP.angle) * 2.2);
        const end = new THREE.Vector3(Math.cos(toP.angle) * 2.2, 0.2, Math.sin(toP.angle) * 2.2);
        
        // Midpoint curve for beauty
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.y = 0.5; // Lift the wire

        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        
        return (
          <mesh key={i}>
            <tubeGeometry args={[curve, 32, 0.005, 8, false]} />
            <meshStandardMaterial 
              color={a.color} 
              emissive={a.color} 
              emissiveIntensity={1} 
              transparent 
              opacity={0.4} 
            />
          </mesh>
        );
      })}

      {/* ── THE OUTER RIM (The Houses) ── */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, 0.015, 16, 100]} />
        <meshStandardMaterial color={config.colors.secondary} emissive={config.colors.secondary} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
