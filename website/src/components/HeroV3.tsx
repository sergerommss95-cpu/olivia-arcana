/**
 * HeroV3.tsx — The "Wheel of Seven" iteration with The Witness Intelligence.
 *
 * Implements the v3 design language:
 *   - Editorial, hand-written typography
 *   - The "Witness" Intelligent Orb as the Oracle Gate
 *   - Attention-based interaction (Voice/Text Input)
 */

"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FlipRevealCard from "@/components/shaders/FlipRevealCard";
import TheWitness from "@/components/cosmos/TheWitness";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import MagneticButton from "@/components/MagneticButton";
import Surface, { Eyebrow } from "@/components/design/Surface";
import TransitionLink from "@/components/transitions/TransitionLink";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useLocale } from "@/lib/i18n/useLocale";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroV3() {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState("");
  const [heroScroll, setHeroScroll] = useState(0);
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Daily-seeded card for the hero
  const dailyCard = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    const seed = dayOfYear * 2654435761;
    return ALL_CARDS[Math.abs(seed) % ALL_CARDS.length];
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));

    // Infinite Descent Timeline
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setHeroScroll(p);
          
          // God Mode: Drive the Nebula Singularity
          const engine = (window as unknown as { celestialEngine?: { getSystem: (name: string) => { setSingularity: (x: number, y: number, z: number) => void } | null } }).celestialEngine;
          if (engine) {
            const nebula = engine.getSystem("nebula");
            if (nebula) {
              // Pull stars toward the Witness (centered-right)
              nebula.setSingularity(0.75, 0.5, p * 1.5);
            }
          }
        }
      });

      // Fade content as we descend into the orb
      gsap.to(contentRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "60% top",
          scrub: true,
        },
        opacity: 0,
        y: -150,
        pointerEvents: "none",
        ease: "power2.inOut"
      });

      // Aggressive Cull: Move the entire Hero out of the layout flow
      gsap.to(sectionRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "75% top",
          end: "100% top",
          scrub: true,
        },
        y: -500, // Physically push it up
        autoAlpha: 0, 
        pointerEvents: "none"
      });
    }, sectionRef);

    const handleWitness = () => {
      if (!isAsking && !revealed) {
        setIsAsking(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener("witness:activated", handleWitness);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const words = headRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    words?.forEach((w, i) => {
      w.animate(
        [
          { opacity: "0", transform: "translateY(18px)" },
          { opacity: "1", transform: "translateY(0)" },
        ],
        { duration: 800, delay: 300 + i * 100, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
      );
    });

    return () => {
      cancelAnimationFrame(frame);
      ctx.revert();
      window.removeEventListener("witness:activated", handleWitness);
    };
  }, [isAsking, revealed]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setIsAsking(false);

    // Simulate "Celestial Processing"
    setTimeout(() => {
      setIsProcessing(false);
      setRevealed(true);
      // Haptic feedback
      if ("vibrate" in navigator) window.navigator.vibrate([30, 50, 30]);
    }, 1800);
  }, [question, isProcessing]);

  return (
    <section
      ref={sectionRef}
      className={`relative min-h-[110svh] md:min-h-screen flex flex-col md:flex-row items-center justify-center px-6 pt-24 pb-12 overflow-hidden z-10 ${!mounted ? 'is-loading' : ''}`}
      aria-labelledby="hero-headline"
    >
      {/* Editorial Scrim — Apple-grade readability engine */}
      <div className="absolute inset-0 bg-gradient-to-r from-void-black/80 via-void-black/20 to-transparent pointer-events-none -z-10" />
      
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Editorial Copy */}
        <div ref={contentRef} className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8 relative">
          {/* Internal scrim for mobile centered text */}
          <div className="absolute inset-x-[-2rem] inset-y-[-2rem] bg-void-black/40 blur-3xl lg:hidden -z-10" />
          
          <Eyebrow
            as={motion.span}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="mb-2"
          >
            {t("hero_almanac_badge")}
          </Eyebrow>

          <h1
            ref={headRef}
            id="hero-headline"
            className="font-[family-name:var(--font-heading)] text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[1.02] text-warm-ivory tracking-tight mb-4"
          >
            {(t("hero_title") as string).split(" ").map((word, i) => (
              <React.Fragment key={i}>
                <span data-word className={`inline-block opacity-0 ${word.endsWith(",") || word.endsWith(".") || word.length > 8 ? "italic" : ""}`}>
                  {word}
                </span>{" "}
                {i === 1 && <br className="hidden md:block" />}
              </React.Fragment>
            ))}
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: EASE }}
            className="flex flex-col gap-2 mb-8"
          >
            <p className="max-w-md md:max-w-lg font-[family-name:var(--font-body)] text-base md:text-lg leading-relaxed text-warm-ivory/60 font-light">
              {t("hero_subtitle")}
            </p>
            <p className="text-[0.65rem] font-[family-name:var(--font-mono)] uppercase tracking-[0.25em] text-celestial-gold/40">
              Personal, reflective readings. Built for clarity, not noise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: EASE }}
            className="flex flex-col sm:flex-row items-center gap-8"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-celestial-gold/10 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <MagneticButton variant="gold" onClick={() => setIsAsking(true)} size="lg" className="relative z-10">
                {t("hero_consult_cta")}
              </MagneticButton>
            </div>
            
            <TransitionLink
              href="/sample"
              className="group text-sm font-medium text-warm-ivory/30 hover:text-celestial-gold transition-colors duration-500 tracking-[0.2em] uppercase flex items-center gap-3"
            >
              <span className="w-6 h-px bg-warm-ivory/10 group-hover:bg-celestial-gold/30 transition-colors" />
              {t("hero_sample_cta")}
            </TransitionLink>
          </motion.div>
        </div>

        {/* Right: The Witness + Oracle Gate (Masterpiece UI) */}
        <div className="relative flex items-center justify-center lg:justify-end py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
            className="relative z-20 flex flex-col items-center gap-8"
          >
            {/* The Witness Orb with Quick Intent Nodes */}
            <div className="relative group flex items-center justify-center">
              {/* Central Click Target (The Orb itself) */}
              <div 
                className="absolute inset-0 z-30 cursor-pointer rounded-full" 
                onClick={() => { if (!isAsking && !isProcessing && !revealed) setIsAsking(true); }}
                aria-label={t("hero_consult_cta")}
              />

              <div className={`absolute inset-0 blur-[80px] rounded-full transition-all duration-1000 ${
                isProcessing ? "bg-celestial-gold/40 scale-150" : "bg-celestial-gold/10 group-hover:bg-celestial-gold/20"
              }`} />
              
              <TheWitness 
                isAsking={isAsking} 
                isProcessing={isProcessing} 
                userInputLength={question.length} 
                scrollProgress={heroScroll}
              />

              {/* Quick Intent Orbitals (Immediate Value) — positioned clearly to avoid overlap */}
              <AnimatePresence>
                {!isAsking && !isProcessing && !revealed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8, ease: EASE }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    {/* Node 1: Oracle (Top Left) */}
                    <div className="absolute top-[0%] left-[2%] sm:left-[-35%] pointer-events-auto cursor-pointer z-40" onClick={(e) => { e.stopPropagation(); setIsAsking(true); setQuestion(t("witness_universe_prompt")); }}>
                      <Surface
                        as={motion.div}
                        whileHover={{ scale: 1.1, x: -5, y: -5 }}
                        variant="veil"
                        radius="pill"
                        pad="none"
                        className="px-4 py-2 flex items-center gap-2 shadow-2xl"
                      >
                        <span className="text-celestial-gold text-xs">✦</span>
                        <span className="text-[10px] font-bold text-warm-ivory font-[family-name:var(--font-mono)] uppercase tracking-[0.25em]">{t("witness_node_consult")}</span>
                      </Surface>
                    </div>

                    {/* Node 2: Daily (Top Right) */}
                    <div className="absolute top-[-10%] right-[2%] sm:right-[-15%] pointer-events-auto cursor-pointer z-40" onClick={(e) => { e.stopPropagation(); document.getElementById("daily")?.scrollIntoView({ behavior: "smooth" }); }}>
                      <Surface
                        as={motion.div}
                        whileHover={{ scale: 1.1, x: 5, y: -5 }}
                        variant="veil"
                        radius="pill"
                        pad="none"
                        className="px-4 py-2 flex items-center gap-2 shadow-2xl"
                      >
                        <span className="text-celestial-gold text-xs">☉</span>
                        <span className="text-[10px] font-bold text-warm-ivory font-[family-name:var(--font-mono)] uppercase tracking-[0.25em]">{t("witness_node_daily")}</span>
                      </Surface>
                    </div>

                    {/* Node 3: Portrait (Bottom Right) */}
                    <div className="absolute bottom-[0%] right-[2%] sm:right-[-35%] pointer-events-auto cursor-pointer z-40" onClick={(e) => { e.stopPropagation(); window.location.href = "/portrait"; }}>
                      <Surface
                        as={motion.div}
                        whileHover={{ scale: 1.1, x: 5, y: 5 }}
                        variant="veil"
                        radius="pill"
                        pad="none"
                        className="px-4 py-2 flex items-center gap-2 shadow-2xl"
                      >
                        <span className="text-celestial-gold text-xs">✧</span>
                        <span className="text-[10px] font-bold text-warm-ivory font-[family-name:var(--font-mono)] uppercase tracking-[0.25em]">{t("witness_node_relic")}</span>
                      </Surface>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <AnimatePresence mode="wait">
                  {!revealed && !isAsking && !isProcessing && (
                    <motion.span 
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.5em] uppercase text-celestial-gold/60 font-medium"
                    >
                      {t("witness_status_idle")}
                    </motion.span>
                  )}
                  {isAsking && (
                    <motion.span 
                      key="asking"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.5em] uppercase text-celestial-gold font-bold animate-pulse"
                    >
                      {t("witness_status_listening")}
                    </motion.span>
                  )}
                  {isProcessing && (
                    <motion.span 
                      key="proc"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-mono)] text-[0.65rem] tracking-[0.5em] uppercase text-white font-black"
                    >
                      {t("witness_status_computing")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* The Oracle Gate — Input Field Redesign */}
            <div className="relative w-full max-w-[400px]">
              <AnimatePresence mode="wait">
                {isAsking && (
                  <Surface
                    as={motion.form}
                    variant="solid"
                    raised
                    radius="lg"
                    pad="none"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1, filter: "blur(15px)" }}
                    transition={{ duration: 0.6, ease: EASE }}
                    onSubmit={handleSubmit}
                    className="relative p-1 flex items-center gap-3 shadow-2xl overflow-hidden ring-1 ring-white/5"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      placeholder={t("witness_input_placeholder")}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full bg-transparent px-5 py-4 text-warm-ivory placeholder:text-warm-ivory/10 outline-none font-[family-name:var(--font-mono)] text-sm tracking-tight"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(212, 175, 55, 0.2)" }}
                      whileTap={{ scale: 0.9 }}
                      type="submit"
                      aria-label="Submit question"
                      className="mr-2 p-3 rounded-xl bg-celestial-gold/10 text-celestial-gold transition-colors"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </motion.button>
                  </Surface>
                )}

                {revealed && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <FlipRevealCard
                      card={dailyCard}
                      width={280}
                      revealedOverride={revealed}
                    />
                    {question && (
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-full text-center">
                        <p className="text-[0.65rem] italic text-muted-lavender/60 font-light max-w-[200px] mx-auto line-clamp-1">
                          &ldquo;{question}&quot;
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Decorative floating sigils */}
          <div className="hidden xl:block absolute -top-10 -right-10 w-24 h-24 opacity-20 animate-spin-slow">
            <span className="text-4xl text-celestial-gold">✦</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glint-text {
          color: #f5f2e1;
          text-shadow: 0 0 20px rgba(245, 242, 225, 0.1);
          transition: text-shadow 0.6s var(--ease-ritual);
        }
        .glint-text:hover {
          text-shadow: 0 0 35px rgba(212, 175, 55, 0.3);
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 60s linear infinite; }

        /* Ensure text is visible if JS fails/is slow */
        .is-loading [data-word] {
          opacity: 1 !important;
          transform: none !important;
        }
      `}</style>
    </section>
  );
}
