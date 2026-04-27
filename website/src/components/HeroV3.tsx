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

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroV3() {
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState("");
  
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
    setMounted(true);

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
      className="relative min-h-[110svh] md:min-h-screen flex flex-col md:flex-row items-center justify-center px-6 pt-24 pb-12 overflow-hidden z-10"
      aria-labelledby="hero-headline"
    >
      {/* Background shadow depth for contrast */}
      <div className="absolute inset-0 bg-radial-gradient from-void-black/40 via-void-black/10 to-transparent pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: Editorial Copy */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 md:space-y-8">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
            className="font-[family-name:var(--font-body)] text-[0.7rem] md:text-xs font-medium tracking-[0.3em] uppercase text-celestial-gold/80"
          >
            ✦ An editorial cosmic almanac
          </motion.span>

          <h1
            ref={headRef}
            id="hero-headline"
            className="font-[family-name:var(--font-heading)] text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal leading-[0.95] text-warm-ivory"
          >
            <span data-word className="inline-block opacity-0">Your</span>{" "}
            <span data-word className="inline-block opacity-0 italic">stars,</span><br />
            <span data-word className="inline-block opacity-0">read</span>{" "}
            <span data-word className="inline-block opacity-0">for</span>{" "}
            <span data-word className="inline-block opacity-0 italic underline decoration-celestial-gold/30 underline-offset-8">you.</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: EASE }}
            className="max-w-md md:max-w-lg font-[family-name:var(--font-body)] text-base md:text-lg leading-relaxed text-muted-lavender/90 font-light"
          >
            Ask the Witness what seeks clarity. Personalized astrology and tarot readings computed from real NASA planetary positions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: EASE }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <MagneticButton variant="gold" onClick={() => setIsAsking(true)} size="lg">
              Consult the Witness
            </MagneticButton>
            <a
              href="/sample"
              className="text-sm font-medium text-celestial-gold/60 hover:text-celestial-gold transition-colors duration-300 tracking-wide uppercase"
            >
              See a sample reading &rarr;
            </a>
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
            {/* The Witness Orb */}
            <div className="relative group">
              <div className={`absolute inset-0 blur-[80px] rounded-full transition-all duration-1000 ${
                isProcessing ? "bg-celestial-gold/40 scale-150" : "bg-celestial-gold/10 group-hover:bg-celestial-gold/20"
              }`} />
              
              <TheWitness isAsking={isAsking} isProcessing={isProcessing} />
              
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <AnimatePresence mode="wait">
                  {!revealed && !isAsking && !isProcessing && (
                    <motion.span 
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-mono)] text-[0.6rem] tracking-[0.4em] uppercase text-celestial-gold/40 animate-pulse"
                    >
                      Give Attention
                    </motion.span>
                  )}
                  {isAsking && (
                    <motion.span 
                      key="asking"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-mono)] text-[0.6rem] tracking-[0.4em] uppercase text-celestial-gold animate-pulse"
                    >
                      Listening...
                    </motion.span>
                  )}
                  {isProcessing && (
                    <motion.span 
                      key="proc"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-mono)] text-[0.6rem] tracking-[0.4em] uppercase text-white font-bold"
                    >
                      Connecting to Sky
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* The Oracle Gate — Input Field */}
            <div className="relative w-full max-w-[340px]">
              <AnimatePresence mode="wait">
                {isAsking && (
                  <motion.form
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
                    transition={{ duration: 0.5, ease: EASE }}
                    onSubmit={handleSubmit}
                    className="glass-card p-1 flex items-center gap-2 overflow-hidden border-celestial-gold/30 bg-black/40 backdrop-blur-xl shadow-2xl"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      placeholder="What seeking clarity?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-warm-ivory placeholder:text-muted-lavender/40 font-[family-name:var(--font-body)]"
                    />
                    <button 
                      type="submit"
                      className="p-3 text-celestial-gold hover:text-white transition-colors"
                      aria-label="Submit question"
                    >
                      &rarr;
                    </button>
                  </motion.form>
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
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 60s linear infinite; }
      `}</style>
    </section>
  );
}
