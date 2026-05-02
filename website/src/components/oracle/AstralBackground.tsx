"use client";

import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FluidShader = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) }
  }), [viewport]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * 0.15;
      materialRef.current.uniforms.uMouse.value.lerp(
        new THREE.Vector2(state.pointer.x * 2, state.pointer.y * 2),
        0.05
      );
    }
  });

  return (
    <mesh position={[0, 0, -1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec2 uMouse;
          varying vec2 vUv;

          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m ; m = m*m ;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }

          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float q = snoise(p - uTime * 0.2);
            vec2 r = vec2(snoise(p + q + uTime * 0.1), snoise(p + q - uTime * 0.1));
            float f = snoise(p + r);
            
            vec3 color = mix(
              vec3(0.01, 0.005, 0.02), // Deep void
              vec3(0.15, 0.08, 0.3),   // Astral violet
              f
            );
            color = mix(color, vec3(0.6, 0.45, 0.15), smoothstep(0.8, 1.0, f) * 0.2); // Soft gold
            
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
};

export default function AstralBackground({ isMobile }: { isMobile?: boolean }) {
  if (isMobile) {
    return (
      <div 
        className="absolute inset-0 z-0 bg-[#020104]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(34, 19, 72, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 10% 80%, rgba(20, 10, 45, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 90% 90%, rgba(15, 8, 35, 0.3) 0%, transparent 50%)
          `
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 1] }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: false }}>
        <Suspense fallback={null}>
          <FluidShader />
        </Suspense>
      </Canvas>
    </div>
  );
}