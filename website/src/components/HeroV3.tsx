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
import { useLocale } from "@/lib/i18n/useLocale";
import dynamic from "next/dynamic";

const CelestialObservatory = dynamic(() => import("./CelestialObservatory"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroV3() {
  const { t } = useLocale();
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
    const frame = requestAnimationFrame(() => setMounted(true));
    
    const handleWitness = () => {
      if (!isAsking && !revealed) {
        setIsAsking(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };
    window.addEventListener("witness:activated", handleWitness);

    return () => {
      cancelAnimationFrame(frame);
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
      className={`private-artifact-hero relative min-h-[92svh] md:min-h-screen flex items-center justify-center overflow-hidden z-10 ${!mounted ? 'is-loading' : ''}`}
      aria-labelledby="hero-headline"
      aria-describedby="hero-subtitle"
    >
      {/* Dynamic Cosmic Background */}
      <CelestialObservatory />

      <div className="private-artifact-scrim absolute inset-0 pointer-events-none -z-10" />
      <div className="private-artifact-vignette absolute inset-0 pointer-events-none -z-10" />
      
      <div className="private-artifact-stage w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.86fr)_minmax(20rem,1fr)] gap-8 lg:gap-16 items-center">
        <div className="private-artifact-copy mx-auto flex w-full max-w-[23rem] flex-col items-center text-center lg:mx-0 lg:max-w-[34rem] lg:items-start lg:text-left relative">
          <div className="private-artifact-copy-glow absolute inset-x-[-2rem] inset-y-[-2rem] lg:hidden -z-10" />
          
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
            className="mx-auto max-w-[11ch] font-[family-name:var(--font-heading)] text-[2.45rem] sm:text-[3.35rem] md:text-6xl lg:mx-0 lg:text-[4.85rem] xl:text-[5.9rem] font-normal leading-[1.03] text-warm-ivory tracking-tight"
          >
            {(t("hero_title") as string).split(" ").map((word, i) => (
              <React.Fragment key={i}>
                <span data-word className={`inline-block ${i === 1 ? "italic" : ""}`}>
                  {word}
                </span>{" "}
                {i === 1 && <br className="hidden md:block" />}
              </React.Fragment>
            ))}
          </h1>

          <div className="private-artifact-message flex flex-col gap-3 relative z-10">
            <p id="hero-subtitle" className="max-w-md md:max-w-lg font-[family-name:var(--font-body)] text-base md:text-lg leading-relaxed text-warm-ivory/90 font-medium drop-shadow-md">
              {t("hero_subtitle")}
            </p>
            <p className="max-w-md font-[family-name:var(--font-body)] text-sm md:text-[0.95rem] leading-relaxed text-celestial-gold/82 font-medium">
              {t("hero_trust_line")}
            </p>
          </div>

          <div className="private-artifact-actions flex flex-col sm:flex-row items-center gap-4 sm:gap-8 relative z-10">
            <div className="relative group">
              <div className="absolute inset-0 bg-celestial-gold/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              <MagneticButton variant="gold" onClick={() => setIsAsking(true)} size="lg" className="relative z-10 shadow-2xl font-bold">
                {t("hero_consult_cta")}
              </MagneticButton>
            </div>
            
            <TransitionLink
              href="/daily"
              className="hidden md:flex group min-h-[44px] text-sm font-bold text-warm-ivory/70 hover:text-celestial-gold transition-colors duration-500 tracking-[0.2em] uppercase items-center gap-3"
            >
              <span className="w-6 h-px bg-warm-ivory/30 group-hover:bg-celestial-gold/50 transition-colors" />
              {t("hero_sample_cta")}
            </TransitionLink>
          </div>
        </div>

        {/* Right: Private Oracle Artifact */}
        <div className="private-artifact-object-col relative flex items-center justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
            className="private-artifact-object relative z-20 flex flex-col items-center"
          >
            <div className="private-artifact-light" aria-hidden />
            <div className="private-artifact-plinth" aria-hidden />

            <div className="private-artifact-orb-wrap relative group flex items-center justify-center">
              <button
                type="button"
                className="private-artifact-orb-button"
                onClick={() => { if (!isAsking && !isProcessing && !revealed) setIsAsking(true); }}
                aria-label={t("hero_consult_cta")}
              >
                <span className="private-artifact-ring" aria-hidden />
                <span className={`private-artifact-aura absolute inset-0 blur-[80px] rounded-full transition-all duration-1000 ${
                isProcessing ? "bg-celestial-gold/40 scale-150" : "bg-celestial-gold/10 group-hover:bg-celestial-gold/20"
                }`} aria-hidden />
                <TheWitness 
                  isAsking={isAsking} 
                  isProcessing={isProcessing} 
                  userInputLength={question.length} 
                  scrollProgress={0}
                />
              </button>
              
              <div className="private-artifact-status absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                <AnimatePresence mode="wait">
                  {!revealed && !isAsking && !isProcessing && (
                    <motion.span 
                      key="idle"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-body)] text-xs md:text-sm text-celestial-gold/70 font-medium"
                    >
                      {t("hero_consult_cta")}
                    </motion.span>
                  )}
                  {isAsking && (
                    <motion.span 
                      key="asking"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-body)] text-xs md:text-sm text-celestial-gold font-bold"
                    >
                      {t("witness_status_listening")}
                    </motion.span>
                  )}
                  {isProcessing && (
                    <motion.span 
                      key="proc"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-[family-name:var(--font-body)] text-xs md:text-sm text-white font-bold"
                    >
                      {t("witness_status_computing")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="private-artifact-gate relative w-full max-w-[420px]">
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
                    className="relative p-1 flex items-center gap-3 shadow-2xl overflow-hidden ring-1 ring-celestial-gold/15"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      placeholder={t("witness_input_placeholder")}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full bg-transparent px-5 py-4 text-warm-ivory placeholder:text-warm-ivory/40 outline-none font-[family-name:var(--font-mono)] text-sm tracking-tight"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(224, 183, 104, 0.2)" }}
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
                    className="private-artifact-card-preview relative"
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
        </div>
      </div>

      <style jsx>{`
        .private-artifact-hero {
          padding: clamp(5.25rem, 8vw, 7rem) clamp(1.25rem, 5vw, 4rem) clamp(2.5rem, 5vw, 5rem);
          background: #030207;
        }

        .private-artifact-hero::before {
          content: "";
          position: absolute;
          top: 53%;
          left: 62%;
          width: min(24rem, 62vw);
          height: min(24rem, 62vw);
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background:
            radial-gradient(circle at 38% 28%, rgba(255, 247, 221, 0.56), transparent 16%),
            radial-gradient(circle at 50% 50%, rgba(238, 203, 123, 0.34), rgba(94, 70, 118, 0.18) 42%, rgba(6, 4, 14, 0.04) 67%, transparent 74%);
          box-shadow:
            inset 0 0 4rem rgba(255, 240, 196, 0.18),
            0 0 7rem rgba(214, 175, 55, 0.32),
            0 0 1px rgba(255, 240, 196, 0.28);
          opacity: 0.95;
          pointer-events: none;
          z-index: 1;
        }

        .private-artifact-hero::after {
          content: "";
          position: absolute;
          top: 69%;
          left: 62%;
          width: min(22rem, 58vw);
          height: min(5.5rem, 12vw);
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border-top: 1px solid rgba(242, 214, 150, 0.24);
          background:
            radial-gradient(ellipse at 50% 18%, rgba(255, 244, 209, 0.18), transparent 38%),
            radial-gradient(ellipse at 50% 80%, rgba(0, 0, 0, 0.72), transparent 72%);
          box-shadow: 0 2.5rem 5rem rgba(0, 0, 0, 0.56);
          pointer-events: none;
          z-index: 1;
        }

        .private-artifact-scrim {
          background:
            radial-gradient(circle at 68% 48%, rgba(214, 174, 86, 0.18), transparent 25rem),
            radial-gradient(circle at 50% 35%, rgba(255, 246, 214, 0.08), transparent 22rem),
            linear-gradient(90deg, rgba(3, 2, 7, 0.92) 0%, rgba(3, 2, 7, 0.78) 42%, rgba(3, 2, 7, 0.52) 100%);
        }

        .private-artifact-vignette {
          box-shadow: inset 0 0 12rem rgba(0, 0, 0, 0.82), inset 0 -12rem 10rem rgba(0, 0, 0, 0.72);
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 28%, rgba(0, 0, 0, 0.5));
        }

        .private-artifact-stage {
          position: relative;
          z-index: 2;
        }

        .private-artifact-copy {
          gap: clamp(1rem, 2vw, 1.65rem);
        }

        .private-artifact-copy-glow {
          background: rgba(0, 0, 0, 0.56);
          filter: blur(44px);
        }

        .private-artifact-message {
          margin-top: 0.15rem;
          margin-bottom: 0.6rem;
        }

        .private-artifact-message p {
          max-width: min(100%, 34rem);
          overflow-wrap: break-word;
        }

        .private-artifact-object-col {
          min-height: min(48rem, 66svh);
        }

        .private-artifact-object {
          width: min(34rem, 88vw);
          min-height: min(36rem, 64svh);
          justify-content: center;
          isolation: isolate;
        }

        .private-artifact-object::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: min(24rem, 76vw);
          height: min(24rem, 76vw);
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background:
            radial-gradient(circle at 42% 30%, rgba(255, 246, 216, 0.24), transparent 23%),
            radial-gradient(circle at 50% 52%, rgba(220, 180, 92, 0.22), rgba(83, 62, 122, 0.08) 45%, transparent 68%);
          box-shadow:
            inset 0 0 4rem rgba(255, 239, 196, 0.08),
            0 0 5rem rgba(214, 175, 55, 0.16);
          pointer-events: none;
          z-index: -1;
        }

        .private-artifact-light {
          position: absolute;
          top: 0;
          left: 50%;
          width: min(28rem, 72vw);
          height: min(36rem, 68svh);
          transform: translateX(-50%);
          background:
            radial-gradient(ellipse at 50% 44%, rgba(255, 246, 210, 0.18), transparent 34%),
            linear-gradient(180deg, rgba(255, 239, 190, 0.2), rgba(214, 174, 86, 0.06) 48%, transparent 82%);
          clip-path: polygon(42% 0, 58% 0, 88% 100%, 12% 100%);
          filter: blur(10px);
          opacity: 0.72;
          pointer-events: none;
          z-index: -2;
        }

        .private-artifact-plinth {
          position: absolute;
          bottom: clamp(3.5rem, 8vw, 5.75rem);
          left: 50%;
          width: min(28rem, 72vw);
          height: clamp(4.5rem, 11vw, 7rem);
          transform: translateX(-50%);
          border-radius: 50%;
          background:
            radial-gradient(ellipse at 50% 20%, rgba(255, 239, 196, 0.18), transparent 45%),
            radial-gradient(ellipse at 50% 70%, rgba(0, 0, 0, 0.9), transparent 70%);
          border-top: 1px solid rgba(241, 212, 145, 0.18);
          box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.05), 0 2rem 5rem rgba(0, 0, 0, 0.65);
          pointer-events: none;
          z-index: -1;
        }

        .private-artifact-orb-wrap {
          width: min(26rem, 76vw);
          height: min(26rem, 76vw);
        }

        .private-artifact-orb-button {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          appearance: none;
          border: 0;
          background: transparent;
          padding: 0;
          color: inherit;
          cursor: pointer;
          border-radius: 999px;
          touch-action: manipulation;
        }

        .private-artifact-orb-button:focus-visible {
          outline: 1px solid rgba(241, 212, 145, 0.9);
          outline-offset: 0.7rem;
        }

        .private-artifact-orb-button :global(.witness-orb-container) {
          position: relative;
          z-index: 2;
        }

        .private-artifact-ring {
          position: absolute;
          inset: 9%;
          border-radius: 50%;
          border: 1px solid rgba(241, 212, 145, 0.22);
          box-shadow:
            inset 0 0 3rem rgba(241, 212, 145, 0.08),
            0 0 3.5rem rgba(222, 179, 95, 0.12);
          pointer-events: none;
        }

        .private-artifact-aura {
          pointer-events: none;
          z-index: -1;
        }

        .private-artifact-status {
          bottom: 0.35rem;
          text-shadow: 0 0 1.5rem rgba(0, 0, 0, 0.92);
        }

        .private-artifact-gate {
          margin-top: clamp(1rem, 2.5vw, 1.75rem);
        }

        /* Ensure text is visible if JS fails/is slow */
        .is-loading [data-word] {
          opacity: 1 !important;
          transform: none !important;
        }

        @media (max-width: 1023px) {
          .private-artifact-stage {
            gap: 1.5rem;
          }

          .private-artifact-object-col {
            min-height: 23rem;
          }

          .private-artifact-object {
            min-height: 23rem;
          }

          .private-artifact-orb-wrap {
            width: min(20.5rem, 78vw);
            height: min(20.5rem, 78vw);
          }
        }

        @media (max-width: 640px) {
          .private-artifact-hero {
            min-height: 92svh;
            padding-top: 5.25rem;
            padding-bottom: 2.1rem;
          }

          .private-artifact-stage {
            position: relative;
            min-height: calc(92svh - 7.35rem);
            align-content: start;
          }

          .private-artifact-scrim {
            background:
              radial-gradient(circle at 50% 64%, rgba(214, 174, 86, 0.16), transparent 16rem),
              linear-gradient(180deg, rgba(3, 2, 7, 0.96) 0%, rgba(3, 2, 7, 0.78) 48%, rgba(3, 2, 7, 0.92) 100%);
          }

          .private-artifact-hero::before {
            top: 54%;
            left: 50%;
            width: min(20rem, 76vw);
            height: min(20rem, 76vw);
            opacity: 0.86;
          }

          .private-artifact-hero::after {
            top: 69%;
            left: 50%;
            width: min(17rem, 68vw);
            height: 3.8rem;
          }

          .private-artifact-copy {
            z-index: 3;
            width: min(100%, calc(100vw - 2.5rem)) !important;
            max-width: min(20.75rem, calc(100vw - 2.5rem)) !important;
          }

          .private-artifact-message {
            margin-bottom: 0.15rem;
            width: 100%;
          }

          .private-artifact-message p {
            width: 100%;
            max-width: min(20.25rem, calc(100vw - 3rem)) !important;
            margin-left: auto;
            margin-right: auto;
            white-space: normal !important;
            text-wrap: pretty;
          }

          .private-artifact-message p:last-child {
            max-width: min(17.5rem, calc(100vw - 4rem)) !important;
          }

          .private-artifact-actions :global(a),
          .private-artifact-actions :global(button) {
            min-width: min(100%, 17rem);
          }

          .private-artifact-object-col {
            position: absolute;
            inset: 9.25rem 0 auto;
            z-index: 1;
            min-height: 22rem;
            opacity: 0.86;
            pointer-events: none;
          }

          .private-artifact-object {
            width: min(21rem, 90vw);
            min-height: 22rem;
          }

          .private-artifact-object::before {
            width: min(19rem, 78vw);
            height: min(19rem, 78vw);
            opacity: 0.9;
          }

          .private-artifact-orb-wrap {
            width: min(18.75rem, 76vw);
            height: min(18.75rem, 76vw);
          }

          .private-artifact-plinth {
            bottom: 2.2rem;
            width: min(18rem, 74vw);
            height: 4rem;
          }

          .private-artifact-light {
            width: min(18rem, 78vw);
            height: 20rem;
            opacity: 0.58;
          }

          .private-artifact-status {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
