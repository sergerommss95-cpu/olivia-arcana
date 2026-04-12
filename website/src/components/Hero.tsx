/**
 * Hero.tsx — Olivia Arcana v2
 * Premium liquid-glass hero with cinematic entrance choreography.
 *
 * Motion layers:
 *   1. Orbital ring — slow SVG rotation, always visible
 *   2. Oracle lens  — liquid-glass disc, refracts bg stars
 *   3. Glyph halo   — Virgo ♍ (or brand glyph) fades in from centre
 *   4. Headline     — word-by-word stagger reveal with clip-path slide
 *   5. Sub-copy     — fades up after headline settles
 *   6. CTA buttons  — slide-up, glass surface treatment
 *   7. Trust badge row — ambient glimmer
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getSunSign, getCosmicProfile, type CosmicProfile as CosmicProfileData } from "../lib/zodiac-utils";
import CosmicProfile from "./CosmicProfile";
import MagneticButton from "@/components/MagneticButton";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useLocale } from "../lib/i18n/useLocale";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function Hero() {
  const headRef  = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  const [birthday, setBirthday] = useState("");
  const [cosmicProfile, setCosmicProfile] = useState<CosmicProfileData | null>(null);
  const [phase, setPhase] = useState<"idle" | "activating" | "revealed">("idle");
  // no burst state needed

  // Reset to idle state — with exit animation
  const resetCosmic = useCallback(() => {
    // Exit animation: profile dissolves out symmetrically
    if (profileRef.current) {
      profileRef.current.animate(
        [
          { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
          { opacity: "0", transform: "scale(0.98)", filter: "blur(6px)" },
        ],
        { duration: 500, easing: EASE, fill: "forwards" }
      );
    }

    // After profile exits, bring hero back
    setTimeout(() => {
      setPhase("idle");
      setCosmicProfile(null);
      window.dispatchEvent(new CustomEvent("zodiac:activate", { detail: { index: -1 } }));
      window.dispatchEvent(new CustomEvent("cosmos:reset"));
      window.dispatchEvent(new CustomEvent("cosmos:sections-fade", { detail: { fade: false } }));

      // Hero content returns with matching blur dissolve (ease-OUT, not ease-in)
      requestAnimationFrame(() => {
        heroContentRef.current?.animate(
          [
            { opacity: "0", transform: "scale(0.98)", filter: "blur(4px)" },
            { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
          ],
          { duration: 600, easing: EASE, fill: "forwards" }
        );
      });
    }, 500);
  }, []);

  // THE COSMIC ACTIVATION SEQUENCE — tightened choreography
  const triggerCosmic = useCallback((sign: { name: string; glyph: string; index: number }) => {
    if (phase === "activating") return;
    setPhase("activating");

    // ── Luxury transition: dissolve → constellation → profile ──

    // Everything starts simultaneously
    window.dispatchEvent(new CustomEvent("cosmos:sections-fade", { detail: { fade: true } }));
    window.dispatchEvent(new CustomEvent("cosmos:shockwave"));

    // Hero content dissolves (600ms — tighter than before)
    if (heroContentRef.current) {
      heroContentRef.current.animate(
        [
          { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
          { opacity: "0", transform: "scale(0.98) translateY(-6px)", filter: "blur(6px)" },
        ],
        { duration: 600, easing: EASE, fill: "forwards" }
      );
    }

    // Constellation pulls in early (200ms) — fast pull
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("zodiac:activate", { detail: { index: sign.index } }));
    }, 200);

    // Profile appears at 1200ms (was 1800ms — removed 600ms dead air)
    setTimeout(() => {
      const profile = getCosmicProfile(sign.name, sign.glyph, sign.index);
      if (profile) {
        setCosmicProfile(profile);
        setPhase("revealed");

        // Single entrance animation (CosmicProfile container is opacity:1, this wrapper is the only fade)
        requestAnimationFrame(() => {
          profileRef.current?.animate(
            [
              { opacity: "0", transform: "scale(0.97)", filter: "blur(6px)" },
              { opacity: "1", transform: "scale(1)", filter: "blur(0px)" },
            ],
            { duration: 700, easing: EASE, fill: "forwards" }
          );
        });
      }
    }, 1200);
  }, [phase]);

  // Handle birthday input
  const handleBirthday = (value: string) => {
    let v = value.replace(/[^\d\/\-\.]/g, "");
    if (v.length === 2 && !v.includes("/") && !v.includes("-") && birthday.length < v.length) {
      v = v + "/";
    }
    if (v.length > 5) v = v.slice(0, 5);
    setBirthday(v);

    // Parse MM/DD, MM-DD, MM.DD, or MMDD
    const match = v.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/) || v.match(/^(\d{2})(\d{2})$/);
    if (!match) {
      if (phase !== "idle") resetCosmic();
      return;
    }
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    const sign = getSunSign(month, day);
    if (sign && phase === "idle") {
      triggerCosmic(sign);
    } else if (!sign && phase !== "idle") {
      resetCosmic();
    }
  };

  // Entrance choreography via Web Animations API (no GSAP dep required)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    // Stagger headline words
    const words = headRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    words?.forEach((w, i) => {
      w.animate(
        [
          { opacity: "0", transform: "translateY(22px)", clipPath: "inset(0 0 100% 0)" },
          { opacity: "1", transform: "translateY(0)",    clipPath: "inset(0 0 0% 0)" },
        ],
        { duration: 900, delay: 320 + i * 120, easing: EASE, fill: "forwards" }
      );
    });

    // (lens removed)
  }, []);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(4rem, 10vw, 6rem) clamp(1rem, 3vw, 1.5rem) clamp(4rem, 12vw, 8rem)",
        overflow: "hidden",
        zIndex: 1,
      }}
    >
      {/* ── IDLE STATE: Hero content (hidden during revelation) ── */}
      <div
        ref={heroContentRef}
        style={{
          display: phase === "revealed" ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Central glyph */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            color: "rgba(220,200,255,0.65)",
            textShadow: "0 0 40px rgba(160,120,255,0.35)",
            marginBottom: "1.5rem",
            animation: "glyphFloat 8s ease-in-out infinite",
            userSelect: "none",
          }}
        >
          ✦
        </div>

        {/* Headline */}
        <div
          ref={headRef}
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            maxWidth: "820px",
            marginBottom: "1.75rem",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'IM Fell English', Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(2.6rem, 6.5vw, 6.2rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.015em",
              color: "transparent",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              backgroundImage:
                "linear-gradient(165deg, #f0ecff 0%, #c4b4f0 38%, #a08de0 65%, #c9bef5 100%)",
              margin: 0,
            }}
          >
            {["Written", "in", "Your", "Stars"].map(w => (
              <span
                key={w}
                data-word
                style={{
                  display: "inline-block",
                  opacity: 0,
                  marginRight: "0.28em",
                  clipPath: "inset(0 0 100% 0)",
                }}
              >
                {w}
              </span>
            ))}
          </h1>
        </div>

        {/* Sub-copy */}
        <p
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 300,
            fontSize: "clamp(0.95rem, 1.6vw, 1.2rem)",
            lineHeight: 1.7,
            color: "rgba(196,185,228,0.82)",
            maxWidth: "520px",
            textAlign: "center",
            marginBottom: "2.75rem",
            animation: "fadeUpIn 1.1s cubic-bezier(0.16,1,0.3,1) 1.4s both",
          }}
        >
          Personalised cosmic readings calculated from your exact planetary
          positions. Not a template — real cosmic insight.
        </p>

        {/* Birthday Input */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2rem",
            animation: "fadeUpIn 1s cubic-bezier(0.16,1,0.3,1) 1.6s both",
          }}
        >
          <label
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "0.7rem",
              fontWeight: 300,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(180,170,210,0.5)",
            }}
          >
            {t("hero_enter_birthday")}
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM / DD"
            value={birthday}
            onChange={(e) => handleBirthday(e.target.value)}
            style={{
              width: "min(160px, 60vw)",
              padding: "0.75rem 1.2rem",
              textAlign: "center",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1rem, 3vw, 1.1rem)",
              letterSpacing: "0.1em",
              color: "rgba(240,236,255,0.9)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(200,185,255,0.12)",
              borderRadius: "9999px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              outline: "none",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(200,185,255,0.3)";
              e.currentTarget.style.boxShadow = "0 0 30px rgba(130,100,220,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(200,185,255,0.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: "0.875rem",
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fadeUpIn 1.0s cubic-bezier(0.16,1,0.3,1) 1.65s both",
          }}
        >
          <MagneticButton href="/portrait" variant="glass" size="md">
            {t("hero_portrait_cta")} →
          </MagneticButton>
          <MagneticButton href="/ask" variant="outline" size="md">
            {t("hero_ask_cta")}
          </MagneticButton>
        </div>

        {/* Trust signal row */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: "3rem",
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
            flexWrap: "wrap",
            animation: "fadeUpIn 1.0s cubic-bezier(0.16,1,0.3,1) 1.9s both",
          }}
        >
          {[
            { value: 12400, suffix: "+", decimals: 0, label: t("hero_readings_given"), delay: 0 },
            { value: 4.9,   suffix: " ★", decimals: 1, label: t("hero_average_rating"), delay: 200 },
            { value: 97,    suffix: "%",  decimals: 0, label: t("hero_accuracy"), delay: 400 },
          ].map(({ value, suffix, decimals, label, delay: d }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "1.35rem",
                  fontWeight: 500,
                  color: "rgba(220,205,255,0.9)",
                  textShadow: "0 0 20px rgba(160,130,255,0.22)",
                }}
              >
                <AnimatedCounter value={value} suffix={suffix} decimals={decimals} duration={2200} delay={d} />
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 400,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(160,150,200,0.52)",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── REVEALED STATE: Cosmic Profile ── */}
      {cosmicProfile && (
        <div
          ref={profileRef}
          style={{
            position: "relative",
            zIndex: 2,
            opacity: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            width: "100%",
            maxWidth: "480px",
          }}
        >
          <CosmicProfile profile={cosmicProfile} />

          {/* Back / Try Again button */}
          <button
            onClick={() => {
              setBirthday("");
              resetCosmic();
            }}
            className="try-another-btn"
            style={{
              background: "none",
              border: "none",
              color: "rgba(180,170,210,0.5)",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "0.72rem",
              fontWeight: 300,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: "0.75rem 1.5rem",
              transition: "color 0.2s, opacity 0.15s",
              minHeight: "44px",
            }}
          >
            ← {t("profile_try_another")}
          </button>
        </div>
      )}

      {/* Global keyframes injected once */}
      <style>{`
        @keyframes glyphFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (hover: hover) {
          .try-another-btn:hover { color: rgba(220,210,245,0.8) !important; }
        }
        .try-another-btn:active { opacity: 0.7; }
      `}</style>
    </section>
  );
}
