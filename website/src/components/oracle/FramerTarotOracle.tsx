"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import { 
  LazyMotion, 
  domAnimation, 
  m, 
  useMotionValue, 
  useSpring, 
  useTransform, 
  AnimatePresence, 
  useReducedMotion,
  useTime,
  type MotionValue
} from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { CardBack } from "@/components/shaders/FlipRevealCard";
import MagneticButton from "@/components/MagneticButton";
import AstralBackground from "./AstralBackground";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardPortalImagePath } from "@/lib/academy/card-images";

// ── AUDIO ENGINE (Web Audio API) — Pure Harmony Edition ──
class AstralAudio {
  ctx: AudioContext | null = null;
  isMuted = true; // Muted by default to respect user's "awful" feedback

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  playHover() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Low-volume harmonic sine
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, this.ctx.currentTime); 
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
  }

  playSelect() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Dual harmonic sine (Gong/Bowl style, very soft)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, this.ctx.currentTime); // Perfect fifth
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 2.5);
    osc2.stop(this.ctx.currentTime + 2.5);
  }

  playReveal() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 1.0);
    
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4.0);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 4.0);
  }
}
const audio = new AstralAudio();

// ── DATA ──
// Use a deterministic subset of cards to prevent hydration mismatches.
const ORACLE_DATA = ALL_CARDS.slice(0, 15);

function useDeviceTier() {
  const [tier, setTier] = useState<"mobile" | "tablet" | "desktop">("desktop");
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) setTier("mobile");
      else if (w < 1100) setTier("tablet");
      else setTier("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return tier;
}

type MachineState = "focusing" | "drawing" | "preparing" | "spread" | "result";

// ── LAYER 1: DEEP ECHO (Subconscious depth) ──
const DeepEchoCard = React.memo(function DeepEchoCard({ 
  index, total, device, breathing, machineState 
}: { 
  index: number, total: number, device: "mobile" | "tablet" | "desktop", breathing: MotionValue<number>, machineState: MachineState 
}) {
  const isMobile = device === "mobile";
  const { x, y, rotateZ } = useMemo(() => {
    const arcRadius = isMobile ? 900 : 1600; 
    const span = Math.PI * (isMobile ? 0.6 : 0.85); 
    const angle = -span / 2 + (span / (total - 1)) * index;
    return {
      x: Math.sin(angle) * arcRadius,
      y: (1 - Math.cos(angle)) * arcRadius * 0.7 + (isMobile ? 160 : 140),
      rotateZ: angle * (180 / Math.PI)
    };
  }, [index, total, isMobile]);

  const finalY = useTransform(breathing, (b) => y + Number(b) * 0.5);
  const opacity = (machineState === "drawing" || machineState === "focusing") ? (isMobile ? 0.04 : 0.08) : 0;

  return (
    <m.div
      style={{
        position: "absolute", top: "50%", left: "50%",
        width: isMobile ? 80 : 120, height: isMobile ? 140 : 210,
        marginLeft: isMobile ? -40 : -60, marginTop: isMobile ? -70 : -105,
        x, y: finalY, z: -250, rotateZ, opacity,
        zIndex: 1, pointerEvents: "none",
        border: "0.5px solid rgba(212, 175, 55, 0.1)",
        background: "rgba(5, 3, 20, 0.3)", borderRadius: "12px",
        transformStyle: "preserve-3d", WebkitTransformStyle: "preserve-3d"
      }}
      animate={{ opacity }}
      transition={{ duration: 2 }}
    />
  );
});

// ── LAYER 2: GHOST DECK (Magical abundance) ──
const GhostCard = React.memo(function GhostCard({ 
  index, 
  total, 
  device, 
  breathing, 
  machineState 
}: { 
  index: number, 
  total: number, 
  device: "mobile" | "tablet" | "desktop",
  breathing: MotionValue<number>,
  machineState: MachineState
}) {
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  
  const cardWidth = isMobile ? 95 : isTablet ? 120 : 130; 
  const cardHeight = isMobile ? 165 : isTablet ? 210 : 225;

  const { x, y, rotateZ } = useMemo(() => {
    const arcRadius = isMobile ? 800 : isTablet ? 1100 : 1400; 
    const span = Math.PI * (isMobile ? 0.5 : isTablet ? 0.65 : 0.75); 
    const angle = -span / 2 + (span / (total - 1)) * index;
    return {
      x: Math.sin(angle) * arcRadius,
      y: (1 - Math.cos(angle)) * arcRadius * 0.75 + (isMobile ? 140 : 120),
      rotateZ: angle * (180 / Math.PI)
    };
  }, [index, total, isMobile, isTablet]);

  const driftPhase = (index * 0.77) % (Math.PI * 2);
  const finalY = useTransform(breathing, (b) => y + Number(b) + Math.sin(driftPhase) * 6);
  const finalScale = useTransform(breathing, (b) => 1 + (Number(b) / 1000) + Math.cos(driftPhase) * 0.01);
  
  const baseOpacity = isMobile ? 0.12 : isTablet ? 0.28 : 0.38;
  const opacity = (machineState === "drawing" || machineState === "focusing") ? baseOpacity : 0;

  return (
    <m.div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        marginTop: -cardHeight / 2,
        x,
        y: finalY,
        z: -120, 
        rotateZ,
        scale: finalScale,
        opacity,
        zIndex: 5, 
        pointerEvents: "none",
        border: "1px solid rgba(212, 175, 55, 0.6)", 
        background: "rgba(10, 8, 30, 0.75)", 
        borderRadius: "14px",
        boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
        transformStyle: "preserve-3d",
        WebkitTransformStyle: "preserve-3d"
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    />
  );
});

const DecorativeRitualField = React.memo(function DecorativeRitualField({ machineState, isMobile }: { machineState: MachineState, isMobile: boolean }) {
  const isVisible = machineState === "focusing" || machineState === "drawing" || machineState === "preparing";
  return (
    <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-[2000ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
       {/* ── THE SACRED CENTER (Focal Field) ── */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[60vh] bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.06)_0%,_rgba(120,80,220,0.03)_45%,_transparent_75%)] opacity-60" />
       
       {/* ── THE CELESTIAL ORBIT (SVG Thread) ── */}
       {!isMobile && (
         <svg className="absolute inset-0 w-full h-full opacity-12" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
           <path 
             d="M 100 650 Q 500 450 900 650" 
             fill="none" 
             stroke="url(#thread-grad)" 
             strokeWidth="0.5" 
             strokeDasharray="2 12"
           >
             <animate attributeName="stroke-dashoffset" from="100" to="0" dur="80s" repeatCount="indefinite" />
           </path>
           <defs>
             <linearGradient id="thread-grad" x1="0%" y1="0%" x2="100%" y2="0%">
               <stop offset="0%" stopColor="transparent" />
               <stop offset="50%" stopColor="#d4af37" />
               <stop offset="100%" stopColor="transparent" />
             </linearGradient>
           </defs>
         </svg>
       )}
    </div>
  );
});

export default function FramerTarotOracle() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const time = useTime();
  
  // Shared breathing motion (subtle global pulse)
  const breathing = useTransform(time, (t) => Math.sin(t / 2000) * 5);
  
  const [state, setState] = useState<MachineState>("focusing");
  const device = useDeviceTier();
  const isMobile = device === "mobile";
  
  // Use a deterministic subset of cards to prevent hydration mismatches.
  // Luxury Dealer Spread: 7 (mobile), 9 (tablet), 11 (desktop)
  const poolSize = device === "mobile" ? 7 : device === "tablet" ? 9 : 11;
  const oracleData = useMemo(() => ALL_CARDS.slice(0, poolSize), [poolSize]);

  // Ghost Deck Pool
  const ghostSize = device === "mobile" ? 6 : device === "tablet" ? 10 : 12;
  const ghostIndices = useMemo(() => Array.from({ length: ghostSize }, (_, i) => i), [ghostSize]);
  
  // Deep Echo Pool
  const echoSize = device === "mobile" ? 4 : 8;
  const echoIndices = useMemo(() => Array.from({ length: echoSize }, (_, i) => i), [echoSize]);

  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = useCallback(() => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  }, []);

  // Motion value for hover tracking (bypasses React re-renders)
  const hoveredIndexMV = useMotionValue<number>(-1);
  const isTransitioning = useRef(false);

  // Auto-init audio when engine mounts since the user already clicked "Awaken the Deck" in the shell
  useEffect(() => {
    audio.init();
  }, []);

  // Sync with URL safely
  useEffect(() => {
    const drawParam = searchParams.get("draw");
    if (drawParam) {
      const indices = drawParam.split(",").map(Number).filter(n => !isNaN(n) && n < 24);
      if (indices.length === 3) {
        requestAnimationFrame(() => {
          setSelectedCards(indices);
          setState("result"); 
        });
      }
    }
  }, [searchParams]);

  const updateUrl = useCallback((cards: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cards.length > 0) {
      params.set("draw", cards.join(","));
    } else {
      params.delete("draw");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleCardClick = useCallback((id: number) => {
    if (state !== "drawing" || isTransitioning.current) return;
    
    setSelectedCards(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length < 3) {
        const newSelected = [...prev, id];
        if (newSelected.length === 3) {
          isTransitioning.current = true;
          setState("preparing");
          updateUrl(newSelected);
          setTimeout(() => {
            setState("spread");
            isTransitioning.current = false;
          }, 2400); // 2.4s of "listening for the pattern"
        }
        return newSelected;
      }
      return prev;
    });
  }, [state, updateUrl]);

  const reset = useCallback(() => {
    isTransitioning.current = false;
    setState("focusing");
    setSelectedCards([]);
    updateUrl([]);
    hoveredIndexMV.set(-1);
  }, [updateUrl, hoveredIndexMV]);

  const reveal = useCallback(() => {
    audio.playReveal();
    setState("result");
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center bg-[#020104] perspective-[2000px]">

        {/* ── CINEMATIC AMBIENCE (Hybrid God Mode) ── */}
        <AstralBackground isMobile={isMobile} />
        
        {/* Selection Scrim (Focus focus) */}
        <div className={`absolute inset-0 z-0 bg-black/40 transition-opacity duration-1000 pointer-events-none ${state === "drawing" ? "opacity-100" : "opacity-0"}`} />
        
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(30,15,60,0.2)_0%,_transparent_70%)] pointer-events-none" />
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.75) 0 1px, transparent 1px)",
            backgroundSize: "4px 4px",
          }}
        />

        {/* SVG Refraction Filter (Lite God Mode) */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="glass-refraction">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>

        {/* ── DECORATIVE FIELD (Orbit & Center) ── */}
        <DecorativeRitualField machineState={state} isMobile={isMobile} />

        {/* ── TOP NAV ── */}
        <div className="absolute top-0 inset-x-0 z-50 pt-[7.5rem] pb-8 px-8 flex justify-between items-start pointer-events-none">
           <div className="pointer-events-auto flex flex-col gap-4">
              {state !== "focusing" && (
                 <button 
                   onClick={reset}
                   className="min-h-11 text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-[#d4af37] transition-all duration-500 hover:tracking-[0.4em]"
                 >
                   &larr; Collapse Time
                 </button>
              )}
              <button 
                onClick={toggleMute}
                aria-pressed={!isMuted}
                className="min-h-11 min-w-11 text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-white/60 transition-all text-left"
              >
                {isMuted ? "Audio: Off" : "Audio: On"}
              </button>
           </div>
           <div className="text-right pointer-events-none">
              <h2 className="font-serif text-2xl text-[#f5f0e8] opacity-60">The Oracle</h2>
              <div className="h-px w-8 bg-[#d4af37]/30 ml-auto mt-2 mb-1" />
              <p className="text-[9px] tracking-[0.4em] uppercase text-[#d4af37]/50">Synastry Engine</p>
           </div>
        </div>

        {/* ── PROMPT TYPOGRAPHY ── */}
        <AnimatePresence mode="wait">
          {state === "focusing" && (
            <m.div 
              key="focusing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute z-40 flex flex-col items-center text-center px-6"
            >
              <h2 className="font-serif text-3xl md:text-5xl text-warm-ivory/80 mb-6 italic">Hold one question in mind.</h2>
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#d4af37]/60 mb-10">Choose the thread you want to follow.</p>
              <button 
                onClick={() => setState("drawing")}
                className="pointer-events-auto group relative px-12 py-4 rounded-full overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-700 hover:border-[#d4af37]/40"
              >
                <span className="relative z-10 text-[10px] tracking-[0.5em] uppercase text-white/40 group-hover:text-[#d4af37] transition-colors duration-500">
                  Begin the Draw
                </span>
              </button>
            </m.div>
          )}

          {state === "drawing" && (
            <m.div 
              key="drawing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute top-[18%] z-40 text-center pointer-events-none"
            >
              <p className="text-[10px] tracking-[0.5em] uppercase text-white/40">
                Select {3 - selectedCards.length} more resonance{3 - selectedCards.length !== 1 ? 's' : ''}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${i < selectedCards.length ? 'bg-[#d4af37] shadow-[0_0_10px_#d4af37] scale-150' : 'bg-white/20'}`} />
                ))}
              </div>
            </m.div>
          )}

          {state === "preparing" && (
            <m.div 
              key="preparing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute z-40 flex flex-col items-center text-center pointer-events-none"
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-[#d4af37]/20 blur-xl rounded-full animate-pulse" />
                <div className="relative text-3xl text-[#d4af37] animate-spin-slow">✦</div>
              </div>
              <p className="text-[10px] tracking-[0.6em] uppercase text-[#d4af37]/40">
                Listening for the pattern…
              </p>
              <div className="mt-8 flex gap-1">
                {[0, 1, 2].map(i => (
                  <m.div 
                    key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-[#d4af37]/40" 
                  />
                ))}
              </div>
            </m.div>
          )}

          {state === "spread" && (
            <m.div 
              key="spread"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-[20%] z-40 text-center"
            >
              <p className="text-[9px] tracking-[0.4em] uppercase text-white/20 mb-8">The pattern is forming.</p>
              <button 
                onClick={() => { audio.playReveal(); reveal(); }}
                className="px-12 py-5 bg-gradient-to-b from-[#f5f0e8] to-[#d4af37] text-black text-[10px] font-bold tracking-[0.4em] uppercase rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_10px_30px_rgba(212,175,55,0.3)]"
              >
                Reveal Truth
              </button>
            </m.div>
          )}
        </AnimatePresence>

        {/* ── THE ORACLE DECK ENGINE ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-0 h-0 pointer-events-auto [transform-style:preserve-3d]">
            {/* 1. GHOST DECK (Wave illusion) */}
            {ghostIndices.map((i) => (
              <GhostCard 
                key={`ghost-${i}`}
                index={i}
                total={ghostSize}
                device={device}
                breathing={breathing}
                machineState={state}
              />
            ))}

            {/* 2. HERO CARDS (Selectable) */}
            {oracleData.map((card, i) => (
              <GodModeCard 
                key={card.name}
                card={card}
                index={i}
                total={oracleData.length}
                machineState={state}
                isSelected={selectedCards.includes(i)}
                selectionIndex={selectedCards.indexOf(i)}
                hoveredIndexMV={hoveredIndexMV}
                device={device}
                time={time}
                breathing={breathing}
                canSelect={selectedCards.length < 3}
                onClick={() => handleCardClick(i)}
              />
            ))}
          </div>
        </div>

        {/* ── RESULT TYPOGRAPHY ── */}
        <AnimatePresence>
          {state === "result" && (
            <m.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 1.0 }}
              className="absolute bottom-0 inset-x-0 h-[40vh] bg-gradient-to-t from-black via-[#030208]/90 to-transparent z-40 flex items-end justify-center pb-16 pointer-events-none"
            >
                 <div className="flex flex-col items-center gap-12 w-full max-w-6xl">
                   <m.div
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 2.5, duration: 1.0 }}
                     className="flex flex-col items-center gap-2"
                   >
                     <span className="text-[10px] font-mono tracking-[0.4em] uppercase text-[#d4af37]/60">Surface Pattern</span>
                     <h2 className="font-serif text-3xl md:text-5xl text-warm-ivory italic">The reading is clear.</h2>
                   </m.div>

                   <div className="flex gap-4 md:gap-24 pointer-events-auto text-center px-4 justify-center">
                    {selectedCards.map((id, idx) => {
                      const card = oracleData[id];
                      const label = idx === 0 ? "The Past" : idx === 1 ? "The Present" : "The Path";
                      return (
                        <div key={id} className="flex flex-col items-center w-[110px] md:w-[180px]">
                          <span className="text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-[#d4af37] mb-3 opacity-80">{label}</span>
                          <div className="h-px w-8 md:w-12 bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent mb-3" />
                          <h3 className="font-serif text-base md:text-2xl text-white mb-1 leading-tight">{card?.name}</h3>
                          <p className="text-[8px] md:text-[10px] tracking-widest text-white/40 uppercase">{card?.arcana} Arcana</p>
                        </div>
                      );
                    })}
                 </div>

                 <m.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 3.5, duration: 1.0 }}
                   className="pointer-events-auto flex flex-col items-center gap-6"
                 >
                    <div className="flex flex-col items-center gap-4">
                      <MagneticButton variant="gold" href="/pricing?from=oracle" size="md" className="shadow-[0_0_50px_rgba(212,175,55,0.15)]">
                        Reveal the deeper resonance &rarr;
                      </MagneticButton>
                      <p className="text-[0.65rem] font-mono uppercase tracking-[0.25em] text-[#d4af37]/40">
                        Go deeper into this pattern
                      </p>
                    </div>
                    <p className="text-[0.7rem] text-warm-ivory/30 max-w-sm text-center leading-relaxed">
                      Expanded readings add celestial context, precise timing, and the symbolic connections between your cards and your birth chart.
                    </p>
                 </m.div>
               </div>
            </m.div>
          )}
        </AnimatePresence>

        {/* Global CSS for CardBack injection and specific performance properties */}
        <style>{`
          .astral-back { position: absolute; inset: 0; overflow: hidden; border-radius: inherit; --px: 0; --py: 0; --hover: 0; }
          .astral-back.is-hovered { --hover: 1; }
          .astral-canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; mix-blend-mode: screen; opacity: 0.88; }
          
          /* Glass Card Material Base */
          .glass-card {
            background: linear-gradient(135deg, rgba(15, 10, 50, 0.45) 0%, rgba(5, 3, 20, 0.7) 100%);
            border: 1px solid rgba(212, 175, 55, 0.35);
          }

          /* Glass Edge Lighting */
          .glass-card::before {
            content: '';
            position: absolute;
            inset: -1px;
            border-radius: inherit;
            background: conic-gradient(from var(--angle, 0deg) at 50% 50%, transparent, rgba(212, 175, 55, 0.4), transparent);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            pointer-events: none;
            z-index: 10;
            opacity: 0;
            transition: opacity 0.5s ease;
          }
          .glass-card:hover::before { opacity: 1; }

          /* Premium Foil Sheen & Corner Glint */
          .glass-card::after {
            content: '';
            position: absolute;
            inset: 0;
            background: 
              radial-gradient(circle at 0% 0%, rgba(255, 230, 150, 0.08) 0%, transparent 50%),
              linear-gradient(135deg, transparent 40%, rgba(255, 215, 130, 0.25) 50%, transparent 60%);
            background-size: 100% 100%, 250% 250%;
            background-position: 0 0, calc(var(--hover, 0) * 100%) center;
            opacity: var(--sheen-opacity, 0);
            pointer-events: none;
            z-index: 11;
            transition: opacity 0.4s ease, background-position 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .astral-burst { position: absolute; inset: 0; z-index: 1; pointer-events: none; border-radius: inherit; background: radial-gradient(circle at 50% 50%, rgba(255, 230, 150, 0.7) 0%, rgba(232, 201, 106, 0.35) 22%, rgba(140, 90, 210, 0.18) 48%, rgba(40, 20, 80, 0) 78%); opacity: 0; mix-blend-mode: screen; animation: al-burst 2.8s cubic-bezier(0.16, 1, 0.3, 1) 0.22s forwards; }
          @keyframes al-burst { 0% { opacity: 0; transform: scale(0.22); filter: blur(6px); } 18% { opacity: 0.95; transform: scale(0.7); filter: blur(0); } 55% { opacity: 0.35; transform: scale(1.15); } 100% { opacity: 0; transform: scale(1.6); filter: blur(3px); } }
          .astral-svg { display: block; width: 100%; height: 100%; position: relative; z-index: 2; }
          .astral-svg .al-bg, .astral-svg .al-mid, .astral-svg .al-fore { transform-origin: 180px 270px; transform-box: fill-box; transition: transform 420ms cubic-bezier(0.16,1,0.3,1); will-change: transform; }
          .astral-svg .al-bg { transform: translate(calc(var(--px) * -3px), calc(var(--py) * -3px)); }
          .astral-svg .al-mid { transform: translate(calc(var(--px) * 4px), calc(var(--py) * 4px)); }
          .astral-svg .al-fore { transform: translate(calc(var(--px) * 8px), calc(var(--py) * 8px)); }
          .astral-svg .al-wheel { transform-origin: 180px 270px; transform-box: view-box; animation: al-rot 180s linear infinite; }
          .astral-back.is-hovered .astral-svg .al-wheel { animation-duration: 110s; }
          .astral-svg .al-seed { transform-origin: 180px 270px; transform-box: view-box; animation: al-rot 90s linear infinite reverse; }
          .astral-back.is-hovered .astral-svg .al-seed { animation-duration: 55s; }
          .astral-svg .al-seed > circle:nth-child(1) { animation: al-seed-pulse 6.7s ease-in-out infinite -0.8s; }
          .astral-svg .al-seed > circle:nth-child(2) { animation: al-seed-pulse 5.9s ease-in-out infinite -2.1s; }
          .astral-svg .al-seed > circle:nth-child(3) { animation: al-seed-pulse 8.3s ease-in-out infinite -3.6s; }
          .astral-svg .al-seed > circle:nth-child(4) { animation: al-seed-pulse 7.1s ease-in-out infinite -5.2s; }
          .astral-svg .al-seed > circle:nth-child(5) { animation: al-seed-pulse 9.7s ease-in-out infinite -6.8s; }
          .astral-svg .al-seed > circle:nth-child(6) { animation: al-seed-pulse 11.3s ease-in-out infinite -4.1s; }
          .astral-svg .al-seed > circle:nth-child(7) { animation: al-seed-pulse 13.1s ease-in-out infinite -1.7s; }
          @keyframes al-seed-pulse { 0%, 100% { stroke-opacity: 0.55; } 50% { stroke-opacity: 0.95; } }
          .astral-svg .al-olive { transform-origin: center; transform-box: fill-box; animation: al-olive-breath 7s cubic-bezier(0.42, 0, 0.58, 1) infinite; filter: drop-shadow(0 0 3px rgba(255, 230, 150, 0.55)); }
          @keyframes al-olive-breath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.045); } }
          .astral-back.is-hovered .astral-svg .al-olive { animation-duration: 4.5s; }
          
          /* Selected Card Aura */
          .is-flipping::after {
            content: '';
            position: absolute;
            inset: -20px;
            background: radial-gradient(circle at center, rgba(212, 175, 55, 0.12) 0%, transparent 70%);
            z-index: -1;
            border-radius: 50%;
            animation: aura-pulse 3s ease-in-out infinite;
          }
          @keyframes aura-pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.9); }
            50% { opacity: 0.8; transform: scale(1.1); }
          }
          
          @keyframes al-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
          .astral-foil { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: conic-gradient(from var(--angle, 0deg) at 52% 48%, transparent 0deg, rgba(232,201,106,0.08) 42deg, transparent 92deg, rgba(180,145,230,0.09) 144deg, transparent 196deg, rgba(120,220,220,0.07) 248deg, transparent 298deg, rgba(232,201,106,0.08) 344deg, transparent 360deg); mix-blend-mode: screen; opacity: 0.18; animation: al-foil 32s linear infinite; z-index: 4; }
          .astral-back.is-hovered .astral-foil { animation-duration: 22s; opacity: 0.35; }
          @keyframes al-foil { from { --angle: 0deg; } to { --angle: 360deg; } }
          .astral-vignette { position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: radial-gradient(ellipse at 52% 42%, transparent 55%, rgba(5, 3, 20, 0.26) 100%); mix-blend-mode: multiply; z-index: 5; }
          .front-nebula { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 38%, #221348 0%, #170d38 32%, #0c0720 58%, #04030c 100%); z-index: 0; }
          .pause-animations * { animation-play-state: paused !important; transition: none !important; }

          @keyframes al-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .animate-spin-slow { animation: al-spin 40s linear infinite; }

          /* Glass Refraction (God Mode Lite) — Disabled on mobile for perf */
          .is-flipping { filter: ${isMobile ? 'none' : 'url(#glass-refraction)'}; }
        `}</style>
      </div>
    </LazyMotion>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚡ HIGH-PERFORMANCE CARD: Memoized, Transform-Only, GPU Accelerated
// ─────────────────────────────────────────────────────────────────────────────

const GodModeCard = React.memo(function GodModeCard({ 
  card, 
  index, 
  total, 
  machineState, 
  isSelected,
  selectionIndex,
  hoveredIndexMV,
  device,
  time,
  breathing,
  canSelect,
  onClick
}: {
  card: typeof ORACLE_DATA[0],
  index: number,
  total: number,
  machineState: MachineState,
  isSelected: boolean,
  selectionIndex: number,
  hoveredIndexMV: MotionValue<number>,
  device: "mobile" | "tablet" | "desktop",
  time: MotionValue<number>,
  breathing: MotionValue<number>,
  canSelect: boolean,
  onClick: () => void
}) {
  const isReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isMobile = device === "mobile";
  const isTablet = device === "tablet";
  
  // Stable deterministic drift phase (based on index)
  const driftPhase = (index * 1.37) % (Math.PI * 2);
  const driftY = useTransform(time, (t) => {
    if (machineState !== "drawing" || isSelected || isReducedMotion || isMobile) return 0;
    return Math.sin(t / 2500 + driftPhase) * 3;
  });

  const cardWidth = isMobile ? 95 : isTablet ? 120 : 130; 
  const cardHeight = isMobile ? 165 : isTablet ? 210 : 225;

  // ── ARC MATHEMATICS (Optimized for Separation) ──
  const { baseArcX, baseArcY, baseArcRotateZ } = useMemo(() => {
    // Desktop: Flatter arc, wider horizontal span
    // Mobile: Tighter arc, narrow horizontal span
    const arcRadius = isMobile ? 800 : isTablet ? 1000 : 1300; 
    const span = Math.PI * (isMobile ? 0.35 : isTablet ? 0.38 : 0.42); 
    
    const angle = -span / 2 + (span / (total - 1)) * index;
    return {
      baseArcX: Math.sin(angle) * arcRadius,
      // baseArcY multiplier 0.75 = shallower arc for better separation
      baseArcY: (1 - Math.cos(angle)) * arcRadius * 0.75 + (isMobile ? 120 : 100),
      baseArcRotateZ: angle * (180 / Math.PI)
    };
  }, [index, total, isMobile, isTablet]);

  // ── REACTIVE DOCK PHYSICS (Pure MotionValues, NO re-renders) ──
  const dockOffsetX = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return 0;
    const pushFactor = 1 / (Math.abs(dist) + 0.4);
    return Math.sign(dist) * pushFactor * 50;
  });

  const dockOffsetY = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return -90; // Hovered card pulls up significantly
    return Math.abs(dist) * 14; // Others push down slightly
  });

  const dockOffsetZ = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return 220; // Pop hovered card out
    const pushFactor = 1 / (Math.abs(dist) + 0.5);
    return pushFactor * 100; 
  });

  const dockRotateZ = useTransform(hoveredIndexMV, (h) => {
    if (h === -1 || isSelected || machineState !== "drawing") return 0;
    const dist = index - h;
    if (dist === 0) return -baseArcRotateZ * 0.8; // Straighten slightly but not fully
    return Math.sign(dist) * (1 / (Math.abs(dist) + 0.5)) * 8;
  });

  const dockScale = useTransform(hoveredIndexMV, (h) => {
    if (isSelected || machineState !== "drawing") return 1; 
    if (h === index) return 1.12;
    return 1;
  });

  const dockZIndex = useTransform(hoveredIndexMV, (h) => {
    if (isSelected) return 100 + selectionIndex;
    if (h === index) return 80;
    
    // Depth-stacking: Center cards sit on top of neighbors
    const centerIndex = (total - 1) / 2;
    return Math.round(total - Math.abs(index - centerIndex));
  });

  // ── CALCULATE TARGET LAYOUT STATE ──
  let targetX = 0;
  let targetY = 0;
  let targetZ = 0;
  let targetRotateZ = 0;
  let targetRotateY = 0; 
  let targetScale = 1;
  let targetOpacity = 1;

  if (machineState === "focusing") {
    targetX = 0;
    targetY = 0;
    targetZ = index * -2; 
    targetRotateZ = 0;
    targetScale = 0.8;
    targetOpacity = 0.4; 
  } 
  else if (machineState === "drawing" || machineState === "preparing") {
    targetX = baseArcX;
    targetY = baseArcY;
    targetRotateZ = baseArcRotateZ;
    targetScale = 1;
    targetOpacity = 1;

    if (isSelected) {
      const spacing = isMobile ? 80 : 150; 
      const meltOffset = (selectionIndex - 1) * spacing;
      targetX = meltOffset; 
      targetY -= isMobile ? 220 : 280;
      targetZ = 300 + selectionIndex * 10;
      targetRotateZ = (selectionIndex - 1) * 5;
      targetScale = 1.1;
    }
    
    // Recede unselected cards during "preparing"
    if (machineState === "preparing" && !isSelected) {
       targetOpacity = 0;
       targetY += 200;
       targetScale = 0.8;
    }
  } 
  else if (machineState === "spread" || machineState === "result") {
    if (isSelected) {
      // The Triad Formation
      const spacing = isMobile ? 110 : 220;
      const offset = (selectionIndex - 1) * spacing;
      targetX = offset;
      targetY = isMobile ? -40 : -80;
      targetZ = 200;
      targetRotateZ = (selectionIndex - 1) * 2; 
      targetScale = isMobile ? 1.0 : 1.35;

      if (machineState === "result") {
        targetRotateY = 180; 
        targetY = isMobile ? -60 : -120;
      }
    } else {
      targetX = baseArcX * 1.5;
      targetY = 1200; 
      targetOpacity = 0;
    }
  }

  // ── MERGE DOCK PHYSICS WITH LAYOUT TARGETS ──
  const uiConfig = { stiffness: 120, damping: 20, mass: 1.0 };
  const springX = useSpring(targetX, uiConfig);
  const springY = useSpring(targetY, uiConfig);
  const springZ = useSpring(targetZ, uiConfig);
  const springRotZ = useSpring(targetRotateZ, uiConfig);

  const staticX = useMotionValue(targetX);
  const staticY = useMotionValue(targetY);
  const staticZ = useMotionValue(targetZ);
  const staticRotZ = useMotionValue(targetRotateZ);

  useEffect(() => {
    if (isSelected || machineState === "result" || machineState === "preparing") {
      springX.set(targetX);
      springY.set(targetY);
      springZ.set(targetZ);
      springRotZ.set(targetRotateZ);
    } else {
      staticX.set(targetX);
      staticY.set(targetY);
      staticZ.set(targetZ);
      staticRotZ.set(targetRotateZ);
    }
  }, [targetX, targetY, targetZ, targetRotateZ, isSelected, machineState, springX, springY, springZ, springRotZ, staticX, staticY, staticZ, staticRotZ]);

  const finalX = useTransform([isSelected ? springX : staticX, dockOffsetX], ([l, d]) => Number(l) + Number(d));
  const finalY = useTransform([isSelected ? springY : staticY, dockOffsetY, breathing, driftY], ([l, d, b, dr]) => Number(l) + Number(d) + Number(b) + Number(dr));
  const finalZ = useTransform([isSelected ? springZ : staticZ, dockOffsetZ], ([l, d]) => Number(l) + Number(d));
  const finalRotateZ = useTransform([isSelected ? springRotZ : staticRotZ, dockRotateZ], ([l, d]) => Number(l) + Number(d));

  // ── MAGNETIC PHYSICS (Non-rendering) ──
  const localX = useMotionValue(cardWidth / 2);
  const localY = useMotionValue(cardHeight / 2);
  const isHoveredMV = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothX = useSpring(localX, springConfig);
  const smoothY = useSpring(localY, springConfig);

  const rotateX = useTransform(smoothY, [0, cardHeight], [12, -12]);
  const rotateY_tilt = useTransform(smoothX, [0, cardWidth], [-12, 12]);
  
  // Combine magnetic tilt with machine-state rotation
  const motionRotateY = useSpring(targetRotateY, uiConfig);
  useEffect(() => { motionRotateY.set(targetRotateY); }, [targetRotateY, motionRotateY]);

  const finalRotateY = useTransform([isHoveredMV, rotateY_tilt, motionRotateY], ([h, rt, my]) => {
     if (Number(my) > 90) return my; // Reveal flip takes precedence
     return Number(h) > 0.5 ? Number(rt) : Number(my);
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (isReducedMotion || isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    localX.set(e.clientX - rect.left);
    localY.set(e.clientY - rect.top);
  }, [isReducedMotion, localX, localY, isMobile]);

  const handlePointerEnter = useCallback(() => {
    if (machineState === "drawing" && !isSelected) {
      hoveredIndexMV.set(index);
      audio.playHover();
    }
    isHoveredMV.set(1);
  }, [machineState, isSelected, hoveredIndexMV, index, isHoveredMV]);

  const handlePointerLeave = useCallback(() => {
    if (hoveredIndexMV.get() === index) {
      hoveredIndexMV.set(-1);
    }
    isHoveredMV.set(0);
    localX.set(cardWidth / 2);
    localY.set(cardHeight / 2);
  }, [hoveredIndexMV, index, localX, localY, cardWidth, cardHeight, isHoveredMV]);

  const handleInteraction = () => {
    audio.init();
    if (machineState === "drawing" && !isSelected && canSelect) {
      audio.playSelect();
    }
    onClick();
  };

  // ── THE REVEAL EDGE GLARE ──
  const edgeGlareOpacity = useTransform(motionRotateY, [0, 80, 90, 100, 180], [0, 0, 1, 0, 0]);

  // Disable canvas for off-screen/unhovered cards to save 1000x battery/CPU
  const disableCanvas = useTransform(hoveredIndexMV, (h) => {
     if (machineState !== 'drawing') return true;
     if (isMobile && !isSelected) return true; 
     return h !== index && !isSelected;
  });
  
  const sheenOpacity = useTransform(isHoveredMV, [0, 1], [0, isMobile ? 0 : 0.08]);
  const staggerDelay = machineState === "drawing" && !isSelected ? 0.2 + index * 0.03 : 0;
  const edgeAngle = useTransform(time, (t) => `${(t / 20) % 360}deg`);

  const finalRotateX = useTransform([isHoveredMV, rotateX], ([h, rx]) => {
    if (isSelected && machineState !== 'drawing') return rx;
    return Number(h) > 0.5 ? rx : 0;
  });

  return (
    <m.div
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={handleInteraction}
      className={`absolute top-1/2 left-1/2 cursor-pointer flr-scene glass-card ${isSelected ? "is-flipping" : ""}`}
      style={{
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        marginTop: -cardHeight / 2,
        zIndex: dockZIndex,
        x: isSelected || machineState === "preparing" ? finalX : targetX,
        y: isSelected || machineState === "preparing" ? finalY : targetY,
        z: isMobile ? 0 : (isSelected ? finalZ : targetZ),
        rotateZ: isSelected || machineState === "preparing" ? finalRotateZ : targetRotateZ,
        rotateX: finalRotateX,
        rotateY: finalRotateY,
        scale: isSelected || machineState !== "drawing" ? targetScale : dockScale,
        transformStyle: isMobile ? "flat" : "preserve-3d",
        WebkitTransformStyle: isMobile ? "flat" : "preserve-3d",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        willChange: isSelected || machineState === "drawing" ? "transform" : "auto",
        // @ts-expect-error - Custom CSS properties for motion values are not yet fully typed in React
        "--angle": edgeAngle,
        "--sheen-opacity": sheenOpacity
        }}      
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: targetOpacity,
        x: isSelected || machineState === "preparing" ? undefined : targetX,
        y: isSelected || machineState === "preparing" ? undefined : targetY,
        z: isSelected || machineState === "preparing" ? undefined : targetZ,
        rotateZ: isSelected || machineState === "preparing" ? undefined : targetRotateZ,
      }}
      transition={
        isReducedMotion 
          ? { duration: 0.1 } 
          : { duration: 0.5, delay: staggerDelay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <div className="relative w-full h-full rounded-[14px] shadow-[0_20px_40px_rgba(0,0,0,0.6)]" style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
        
        {/* EDGE GLARE */}
        <m.div 
          className="absolute inset-y-0 left-1/2 w-[2px] bg-white/20 -ml-[1px] shadow-[0_0_20px_rgba(255,255,255,0.4)] z-50 pointer-events-none"
          style={{ opacity: edgeGlareOpacity }}
        />

        {/* BACK: EXACT 100% MATCH TO FLIP_REVEAL_CARD */}
        <div 
          className="absolute inset-0 rounded-[14px] overflow-hidden [backface-visibility:hidden] border border-[#d4af37]/40 will-change-transform" 
          style={{ 
            transform: 'translateZ(0.1px)', 
            transformStyle: 'preserve-3d', 
            WebkitTransformStyle: 'preserve-3d', 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #0b0822 0%, #050314 100%)'
          }}
        >
          {/* Inner Highlight */}
          <div className="absolute inset-0 border-[0.5px] border-white/5 rounded-[14px] pointer-events-none" />
          <CardBack disableCanvas={disableCanvas} />
        </div>

        {/* FRONT: LAZY LOADED ACTUAL IMAGES */}
        <div 
          className="absolute inset-0 rounded-[14px] overflow-hidden [backface-visibility:hidden] border border-[#d4af37]/60 will-change-transform"
          style={{ 
            transform: 'rotateY(180deg) translateZ(0.1px)', 
            transformStyle: 'preserve-3d', 
            WebkitTransformStyle: 'preserve-3d', 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #04030c 0%, #08061a 100%)'
          }}
        >
           <div className="absolute inset-0 border-[0.5px] border-white/10 rounded-[14px] pointer-events-none" />
           <div className="front-nebula" />
           <div className="astral-foil" />
           
           {/* Only load the image when it's selected (about to flip) or flipped to save massive network requests */}
           {(isSelected || machineState === "result") && (
             <div className="relative w-full h-full">
               <Image
                 src={getCardPortalImagePath(card)}
                 alt={card.name}
                 fill
                 quality={100}
                 sizes={isMobile ? "180px" : "240px"}
                 loading={isSelected || machineState === "result" ? "eager" : "lazy"}
                 className={`absolute inset-0 w-full h-full object-cover z-[2] transition-opacity duration-700 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                 onLoadingComplete={() => setImageLoaded(true)}
                 style={{
                   imageRendering: "auto",
                   transform: "translateZ(0)",
                   backfaceVisibility: "hidden",
                   WebkitBackfaceVisibility: "hidden",
                   transformStyle: "preserve-3d",
                   WebkitTransformStyle: "preserve-3d"
                 }}
               />
             </div>
           )}
           
           <div className="astral-vignette" />
           
           {/* Fallback typography while image loads or if it fails */}
           <div className="absolute inset-3 border-[0.5px] border-[#d4af37]/40 rounded-lg flex flex-col items-center justify-between py-4 px-2 z-[1] opacity-50">
              <div className="text-[#d4af37] text-[6px] tracking-[0.4em] uppercase text-center">{card.arcana} Arcana</div>
              <div className="text-center">
                <div className="text-[#f5f0e8] font-serif text-sm leading-tight tracking-wide">{card.name}</div>
              </div>
           </div>
        </div>
      </div>
    </m.div>
  );
});
