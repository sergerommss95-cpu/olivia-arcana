/**
 * HeroV3.tsx — The "Wheel of Seven" iteration.
 *
 * Implements the v3 design language:
 *   - Editorial, hand-written typography
 *   - The "Wheel of Seven" FlipRevealCard as the visual centerpiece
 *   - Direct path to "Draw today's card" without friction
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FlipRevealCard from "@/components/shaders/FlipRevealCard";
import TheWitness from "@/components/cosmos/TheWitness";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import MagneticButton from "@/components/MagneticButton";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroV3() {
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const headRef = useRef<HTMLHeadingElement>(null);

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

    const handleWitness = () => setRevealed(true);
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
  }, []);

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
            Personalized astrology and tarot readings computed from real NASA planetary positions. Not templates — real guidance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.1, ease: EASE }}
            className="flex flex-col sm:flex-row items-center gap-6"
          >
            <MagneticButton variant="gold" href="/academy/card-of-the-day" size="lg">
              Draw Your Daily Card
            </MagneticButton>
            <a
              href="/portrait"
              className="text-sm font-medium text-celestial-gold/60 hover:text-celestial-gold transition-colors duration-300 tracking-wide uppercase"
            >
              Get Your Portrait &rarr;
            </a>
          </motion.div>
        </div>

        {/* Right: The Witness + Hidden Card (Visual Centerpiece) */}
        <div className="relative flex items-center justify-center lg:justify-end py-12 md:py-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
            className="relative z-20 flex flex-col items-center gap-12"
          >
            {/* The Witness — Intelligent Navigation */}
            <div className="relative group">
              <div className="absolute inset-0 bg-celestial-gold/10 blur-[60px] rounded-full group-hover:bg-celestial-gold/20 transition-colors" />
              <TheWitness />
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="font-[family-name:var(--font-mono)] text-[0.6rem] tracking-[0.4em] uppercase text-celestial-gold/40 animate-pulse">
                  {revealed ? "Path Revealed" : "Give Attention"}
                </span>
              </div>
            </div>

            {/* The Hidden Card — Connected to the Witness */}
            <motion.div 
              animate={revealed ? { y: 0, opacity: 1 } : { y: 20, opacity: 0.4 }}
              className="relative"
            >
              <FlipRevealCard
                card={dailyCard}
                width={280}
              />
            </motion.div>
          </motion.div>

          {/* Decorative floating sigils for desktop only */}
          <div className="hidden xl:block absolute -top-10 -right-10 w-24 h-24 opacity-20 animate-spin-slow">
            <span className="text-4xl text-celestial-gold">✦</span>
          </div>
          <div className="hidden xl:block absolute -bottom-20 -left-10 w-32 h-32 opacity-10 animate-reverse-spin">
            <span className="text-2xl text-celestial-gold">⊹</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes reverse-spin {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow { animation: spin-slow 60s linear infinite; }
        .animate-reverse-spin { animation: reverse-spin 85s linear infinite; }
      `}</style>
    </section>
  );
}

function useMemo(fn: () => any, deps: any[]) {
  return React.useMemo(fn, deps);
}
