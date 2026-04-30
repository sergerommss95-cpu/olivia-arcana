"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSpring, a, config } from "@react-spring/three";
import { MeshTransmissionMaterial, RoundedBox, Environment, useTexture, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Noise, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useRouter, useSearchParams } from "next/navigation";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardPortalImagePath } from "@/lib/academy/card-images";

// Fix for React 19 / Three 183 deep type instantiation
const AnimatedMeshBasicMaterial = a.meshBasicMaterial as any;
const AnimatedGroup = a.group as any;

// ── AUDIO ENGINE (Web Audio API) ──
class AstralAudio {
  ctx: AudioContext | null = null;
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  playHover() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, this.ctx.currentTime); // Deep hum
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
  playSlam() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
  }
}
const audio = new AstralAudio();

// ── DATA ──
const ORACLE_DATA = ALL_CARDS.slice(0, 24);
type MachineState = "idle" | "drawing" | "spread" | "result";

// ── FLUID BACKGROUND SHADER ──
const FluidBackground = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) }
  }), [viewport]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime * 0.2;
      materialRef.current.uniforms.uMouse.value.lerp(
        new THREE.Vector2(state.pointer.x * 2, state.pointer.y * 2),
        0.05
      );
    }
  });

  return (
    <mesh position={[0, 0, -10]} scale={[viewport.width * 2, viewport.height * 2, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec2 uMouse;
          varying vec2 vUv;

          // Classic 2D noise
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
            vec2 p = vUv * 3.0 - vec2(1.5);
            
            // Mouse displacement
            float mouseDist = length(p - uMouse);
            vec2 mouseForce = normalize(p - uMouse) * smoothstep(1.0, 0.0, mouseDist) * 0.5;
            p += mouseForce;

            float q = snoise(p - uTime * 0.3);
            vec2 r = vec2(snoise(p + q + uTime * 0.2), snoise(p + q - uTime * 0.2));
            float f = snoise(p + r);
            
            vec3 color = mix(
              vec3(0.01, 0.005, 0.02), // Deep void
              vec3(0.2, 0.1, 0.4),     // Astral violet
              f
            );
            color = mix(color, vec3(0.8, 0.6, 0.2), smoothstep(0.7, 1.0, f) * 0.3); // Gold dust
            
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
};

// ── LAZY CARD FRONT TEXTURE ──
const CardFrontTexture = ({ url, opacity }: { url: string, opacity: any }) => {
  const texture = useTexture(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    <AnimatedMeshBasicMaterial 
      map={texture} 
      transparent 
      opacity={opacity}
      toneMapped={false}
    />
  );
};

// ── THE GOD TIER CARD ──
const GodModeCard3D = ({ 
  card, index, total, machineState, selectedCards, hoveredIndex, setHoveredIndex, onClick
}: any) => {
  const isSelected = selectedCards.includes(index);
  const selectionIndex = selectedCards.indexOf(index);
  const isHovered = hoveredIndex === index;

  // Math
  const arcRadius = 14;
  const span = Math.PI * 0.45; 
  const angle = -span / 2 + (span / (total - 1)) * index;
  const baseArcX = Math.sin(angle) * arcRadius;
  const baseArcY = (1 - Math.cos(angle)) * arcRadius * 1.1 + 1;
  const baseArcRotateZ = -angle;

  // Dock Push
  let dockX = 0, dockY = 0, dockZ = 0, dockRotZ = 0;
  if (machineState === "drawing" && hoveredIndex !== null && !isSelected) {
    const dist = index - hoveredIndex;
    if (dist !== 0) {
      const push = Math.exp(-(dist * dist) / 4);
      dockX = Math.sign(dist) * push * 0.8;
      dockY = -push * 0.5;
      dockRotZ = -Math.sign(dist) * push * 0.1;
    }
  }

  // Targets
  let tX = 0, tY = 0, tZ = 0, tRotX = 0, tRotY = 0, tRotZ = 0, tScale = 1;

  if (machineState === "idle") {
    tZ = index * -0.02;
    tScale = 0;
  } else if (machineState === "drawing") {
    tX = baseArcX + dockX;
    tY = baseArcY + dockY - 4;
    tZ = dockZ;
    tRotZ = baseArcRotateZ + dockRotZ;
    tRotY = Math.PI; // Back facing
    tScale = 1;

    if (isSelected) {
      tY += 4;
      tZ = 2;
      tRotZ = 0;
      tScale = 1.2;
    } else if (isHovered) {
      tY += 1;
      tZ = 1.5;
      tRotZ = 0;
      tScale = 1.4;
    }
  } else if (machineState === "spread" || machineState === "result") {
    if (isSelected) {
      tX = (selectionIndex - 1) * 3.5;
      tY = -1;
      tZ = 3;
      tRotZ = (selectionIndex - 1) * 0.05;
      tRotY = Math.PI;
      tScale = 1.5;

      if (machineState === "result") {
        tRotY = 0; // Flip!
        tScale = 1.8;
      }
    } else {
      tX = baseArcX * 1.5;
      tY = -10;
      tZ = -5;
      tScale = 0;
    }
  }

  // Springs - Time Dilation effect (slow tension, high friction)
  const springConfig = machineState === "result" 
    ? { mass: 2, tension: 40, friction: 30 } // Ultra slow-mo reveal
    : { mass: 1, tension: 170, friction: 26 }; // Snappy UI

  const { position, rotation, scale } = useSpring({
    position: [tX, tY, tZ],
    rotation: [tRotX, tRotY, tRotZ],
    scale: [tScale, tScale, tScale],
    config: springConfig,
    delay: machineState === "drawing" && !isSelected ? index * 30 : 0
  });

  const { frontOpacity } = useSpring({
    frontOpacity: machineState === "result" && isSelected ? 1 : 0,
    config: { duration: 1000 } // Fade in image to prevent pop
  });

  return (
    <AnimatedGroup 
      position={position} 
      rotation={rotation} 
      scale={scale}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        if (machineState === "drawing" && !isSelected) {
          setHoveredIndex(index);
          audio.playHover();
        }
      }}
      onPointerOut={() => {
        if (hoveredIndex === index) setHoveredIndex(null);
      }}
      onClick={(e: any) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* ── VOLUMETRIC GLASS CARD ── */}
      <RoundedBox args={[2.4, 4.2, 0.08]} radius={0.05} smoothness={4}>
        
        {/* FRONT FACE (Image) */}
        {isSelected ? (
          <Suspense fallback={<meshStandardMaterial color="#000" />}>
            <CardFrontTexture url={getCardPortalImagePath(card)} opacity={frontOpacity} />
          </Suspense>
        ) : (
          <meshStandardMaterial color="#020104" roughness={0.8} />
        )}

        {/* BACK FACE (Ray-Marched Obsidian Glass) */}
        <MeshTransmissionMaterial 
          attach="material-1"
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.05}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.5}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1.5}
          iridescenceThicknessRange={[100, 400]}
          clearcoat={1}
          clearcoatRoughness={0.1}
          color="#1a1130" // Deep violet obsidian
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
        />

        {/* EDGES & OTHER FACES */}
        <meshStandardMaterial attach="material-2" color="#d4af37" metalness={1} roughness={0.2} />
        <meshStandardMaterial attach="material-3" color="#d4af37" metalness={1} roughness={0.2} />
        <meshStandardMaterial attach="material-4" color="#d4af37" metalness={1} roughness={0.2} />
        <meshStandardMaterial attach="material-5" color="#d4af37" metalness={1} roughness={0.2} />

      </RoundedBox>

      {/* Internal Sigil embedded in the glass */}
      <group position={[0, 0, 0.041]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <ringGeometry args={[0.4, 0.42, 32]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={0.5} />
        </mesh>
      </group>
    </AnimatedGroup>
  );
};

// ── MAIN EXPORT ──
export default function WebGLGodOracle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [state, setState] = useState<MachineState>("idle");
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const drawParam = searchParams.get("draw");
    if (drawParam) {
      const indices = drawParam.split(",").map(Number).filter(n => !isNaN(n) && n < 24);
      if (indices.length === 3) {
        setSelectedCards(indices);
        setState("result"); 
      }
    }
  }, [searchParams]);

  const updateUrl = useCallback((cards: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cards.length > 0) params.set("draw", cards.join(","));
    else params.delete("draw");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleCardClick = useCallback((id: number) => {
    if (state !== "drawing") return;
    audio.init();
    setSelectedCards(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length < 3) {
        const newSelected = [...prev, id];
        audio.playSlam();
        if (newSelected.length === 3) {
          setTimeout(() => {
            setState("spread");
            updateUrl(newSelected);
          }, 800);
        }
        return newSelected;
      }
      return prev;
    });
  }, [state, updateUrl]);

  const reset = () => {
    setState("idle");
    setSelectedCards([]);
    updateUrl([]);
    setHoveredIndex(null);
  };

  const reveal = () => {
    audio.playSlam(); // The bass drop
    setState("result");
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      
      {/* ── 3D CANVAS ── */}
      <Canvas camera={{ position: [0, 0, 15], fov: 40 }} dpr={[1, 2]} gl={{ antialias: false }}>
        <color attach="background" args={['#000']} />
        
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} intensity={2} color="#ffffff" angle={0.5} penumbra={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#a01525" />
        <Environment preset="city" />

        {/* Fluid Environment */}
        <FluidBackground />

        {/* The Cards */}
        {ORACLE_DATA.map((card, i) => (
          <GodModeCard3D 
            key={i}
            card={card}
            index={i}
            total={ORACLE_DATA.length}
            machineState={state}
            selectedCards={selectedCards}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            onClick={() => handleCardClick(i)}
          />
        ))}

        {/* Cinematic Post-Processing */}
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.5} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.002, 0.002)} />
          <Noise opacity={0.03} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>

      {/* ── DOM UI OVERLAY ── */}
      <div className="absolute top-0 inset-x-0 z-50 p-8 flex justify-between items-start pointer-events-none">
         <div className="pointer-events-auto">
            {state !== "idle" && (
               <button onClick={reset} className="text-[10px] tracking-[0.3em] uppercase text-white/50 hover:text-[#d4af37]">
                 &larr; Collapse Void
               </button>
            )}
         </div>
         <div className="text-right pointer-events-none">
            <h2 className="font-serif text-2xl text-[#f5f0e8] opacity-80">The Oracle</h2>
            <p className="text-[9px] tracking-[0.4em] uppercase text-[#d4af37]/60">Volumetric Engine</p>
         </div>
      </div>

      {state === "idle" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40 pointer-events-none">
          <h1 className="font-serif text-6xl md:text-8xl text-white mb-8 drop-shadow-2xl font-light">
            Draw the <span className="italic text-[#d4af37]">Threads</span>
          </h1>
          <button 
            onClick={() => { audio.init(); setState("drawing"); }}
            className="pointer-events-auto px-10 py-5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-xs tracking-[0.3em] uppercase text-white hover:bg-white/10 transition-colors"
          >
            Initiate WebGL
          </button>
        </div>
      )}

      {state === "spread" && (
        <div className="absolute bottom-[20%] inset-x-0 flex justify-center z-40">
          <button 
            onClick={reveal}
            className="px-12 py-5 bg-[#f5f0e8] text-black text-[10px] font-bold tracking-[0.4em] uppercase rounded-full hover:scale-105 transition-transform"
          >
            Time Dilation Reveal
          </button>
        </div>
      )}

      {state === "result" && (
        <div className="absolute bottom-0 inset-x-0 h-[40vh] bg-gradient-to-t from-black to-transparent z-40 flex items-end justify-center pb-16 pointer-events-none">
           <div className="flex gap-4 md:gap-24 pointer-events-auto text-center px-4">
              {selectedCards.map((id, idx) => {
                const card = ORACLE_DATA[id];
                const label = idx === 0 ? "The Past" : idx === 1 ? "The Present" : "The Path";
                return (
                  <div key={id} className="flex flex-col items-center w-[110px] md:w-[180px] opacity-0 animate-[fadeIn_2s_ease-out_1s_forwards]">
                    <span className="text-[9px] tracking-[0.3em] uppercase text-[#d4af37] mb-3">{label}</span>
                    <h3 className="font-serif text-xl md:text-3xl text-white mb-1">{card?.name}</h3>
                  </div>
                );
              })}
           </div>
        </div>
      )}
    </div>
  );
}