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
import { useProfile } from "../lib/user/profile-store";
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function Hero() {
  const headRef  = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  const { saveFromBirthday } = useProfile();

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
      // Persist the user's sun sign — drives the navbar chip, greetings, etc.
      saveFromBirthday(month, day);
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
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "clamp(6rem, 12vw, 9rem) clamp(1.25rem, 6vw, 6rem) clamp(4rem, 10vw, 6rem)",
        overflow: "hidden",
        zIndex: 1,
      }}
      aria-labelledby="home-hero-headline"
    >
      {/* ── IDLE STATE: Hero content (hidden during revelation) ── */}
      <div
        ref={heroContentRef}
        style={{
          display: phase === "revealed" ? "none" : "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "clamp(1.5rem, 3vw, 2.25rem)",
          width: "100%",
          maxWidth: "1100px",
        }}
      >
        {/* Eyebrow — small caps, establishes editorial tone */}
        <span
          className="hero-eyebrow"
          style={{
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.72rem",
            fontWeight: 500,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(232, 201, 106, 0.78)",
            margin: 0,
            animation: "fadeUpIn 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s both",
          }}
        >
          {/* Micro-glyph */}
          <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
          An editorial cosmic almanac
        </span>

        {/* Headline — solid ivory serif, asymmetric left-aligned, massive scale */}
        <div
          ref={headRef}
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "920px",
            marginBottom: "0.25rem",
          }}
        >
          <h1
            id="home-hero-headline"
            style={{
              fontFamily: "var(--font-heading, 'Cormorant Garamond'), 'IM Fell English', Georgia, serif",
              fontWeight: 400,
              fontStyle: "italic",
              fontSize: "clamp(2.9rem, 7.2vw, 6.8rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              color: "#F5F0E8",
              margin: 0,
              textShadow: "0 2px 24px rgba(4,2,13,0.55)",
            }}
          >
            {["Written", "in", "Your", "Stars"].map((w) => (
              <span
                key={w}
                data-word
                style={{
                  display: "inline-block",
                  opacity: 0,
                  marginRight: "0.26em",
                  clipPath: "inset(0 0 100% 0)",
                }}
              >
                {w}
              </span>
            ))}
          </h1>
        </div>

        {/* Sub-copy — wrapped in a soft scrim so it's always readable */}
        <p
          className="scrim-text"
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontWeight: 400,
            fontSize: "clamp(1rem, 1.5vw, 1.18rem)",
            lineHeight: 1.65,
            color: "rgba(238, 232, 220, 0.92)",
            maxWidth: "520px",
            margin: 0,
            animation: "fadeUpIn 1s cubic-bezier(0.16,1,0.3,1) 1.2s both",
          }}
        >
          Readings calculated from the exact positions of the planets the moment
          you were born. <em style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", color: "rgba(245, 240, 232, 0.98)" }}>Not templates</em> — real cosmic guidance, written by hand.
        </p>

        {/* Compact action row — solid input + primary CTA + secondary link */}
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "clamp(0.75rem, 1.5vw, 1.25rem)",
            animation: "fadeUpIn 1s cubic-bezier(0.16,1,0.3,1) 1.45s both",
          }}
        >
          <label style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <span
              style={{
                position: "absolute",
                left: "1.1rem",
                fontFamily: "var(--font-body, system-ui), sans-serif",
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(190, 178, 225, 0.55)",
                pointerEvents: "none",
                top: "0.55rem",
              }}
            >
              {t("hero_enter_birthday")}
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM / DD"
              value={birthday}
              onChange={(e) => handleBirthday(e.target.value)}
              aria-label={t("hero_enter_birthday")}
              style={{
                width: "clamp(180px, 30vw, 240px)",
                padding: "1.5rem 1.1rem 0.7rem",
                textAlign: "left",
                fontFamily: "var(--font-heading, 'Cormorant Garamond'), Georgia, serif",
                fontSize: "1.35rem",
                fontStyle: "italic",
                letterSpacing: "0.08em",
                color: "#F5F0E8",
                background: "#0e0b24",
                border: "1px solid rgba(232, 201, 106, 0.25)",
                borderRadius: "0.75rem",
                outline: "none",
                transition: "border-color 0.25s, box-shadow 0.25s",
                minHeight: "58px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(232, 201, 106, 0.7)";
                e.currentTarget.style.boxShadow = "0 0 0 4px rgba(232, 201, 106, 0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(232, 201, 106, 0.25)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </label>
          <MagneticButton href="/portrait" variant="gold" size="md">
            {t("hero_portrait_cta")} →
          </MagneticButton>
          <MagneticButton href="/ask" variant="outline" size="md">
            {t("hero_ask_cta")}
          </MagneticButton>
        </form>

        {/* Micro-trust line — text list instead of metric boxes */}
        <p
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: "clamp(1.5rem, 2.5vw, 2.25rem)",
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.78rem",
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "rgba(196, 185, 228, 0.55)",
            maxWidth: "520px",
            animation: "fadeUpIn 1s cubic-bezier(0.16,1,0.3,1) 1.7s both",
            margin: 0,
          }}
        >
          <AnimatedCounter
            value={12400}
            suffix="+"
            style={{ color: "rgba(232, 201, 106, 0.85)", fontFamily: "var(--font-heading, Cormorant Garamond), serif", fontSize: "1rem", fontStyle: "italic", fontWeight: 500 }}
          />{" "}
          <span>{t("hero_readings_given").toLowerCase()}</span>
          {" · "}
          <AnimatedCounter
            value={4.9}
            decimals={1}
            suffix=" ★"
            style={{ color: "rgba(232, 201, 106, 0.85)", fontFamily: "var(--font-heading, Cormorant Garamond), serif", fontSize: "1rem", fontStyle: "italic", fontWeight: 500 }}
          />{" "}
          {t("hero_average_rating").toLowerCase()}
          {" · "}
          <span style={{ color: "rgba(232, 201, 106, 0.85)", fontFamily: "var(--font-heading, Cormorant Garamond), serif", fontSize: "1rem", fontStyle: "italic", fontWeight: 500 }}>9 languages</span>
        </p>
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
