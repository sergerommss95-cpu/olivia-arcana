/**
 * Hero.tsx — Olivia Arcana
 *
 * Free-first hero: editorial headline, one gold primary CTA
 * (Draw today's card), one text-link secondary (See a sample reading),
 * and a trust row.
 *
 * Birthday entry + cosmic profile revelation has been moved to /portrait
 * so the homepage can have a zero-friction free path into the product.
 *
 * Motion:
 *   - Headline: word-by-word stagger reveal via Web Animations API
 *   - Eyebrow / sub-copy / CTAs / trust row: staggered CSS fade-up
 *   - All motion respects prefers-reduced-motion
 */

"use client";

import React, { useEffect, useRef } from "react";
import MagneticButton from "@/components/MagneticButton";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const wordStyle: React.CSSProperties = {
  display: "inline-block",
  opacity: 0,
  marginRight: "0.34em",
  clipPath: "inset(0 0 100% 0)",
};

export default function Hero() {
  const headRef = useRef<HTMLHeadingElement>(null);

  // Word-by-word stagger entrance via Web Animations API
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const words = headRef.current?.querySelectorAll<HTMLSpanElement>("[data-word]");
    words?.forEach((w, i) => {
      w.animate(
        [
          { opacity: "0", transform: "translateY(22px)", clipPath: "inset(0 0 100% 0)" },
          { opacity: "1", transform: "translateY(0)", clipPath: "inset(0 0 0% 0)" },
        ],
        { duration: 900, delay: 320 + i * 120, easing: EASE, fill: "forwards" }
      );
    });
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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "clamp(1.5rem, 3vw, 2.25rem)",
          width: "100%",
          maxWidth: "1100px",
        }}
      >
        {/* Eyebrow — editorial tone */}
        <span
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
          <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
          An editorial cosmic almanac
        </span>

        {/* Headline — non-italic base, italic <em> emphasis on "read for you." */}
        <h1
          ref={headRef}
          id="home-hero-headline"
          style={{
            position: "relative",
            fontFamily: "var(--font-heading, 'Cormorant Garamond'), 'IM Fell English', Georgia, serif",
            fontWeight: 400,
            fontStyle: "normal",
            fontSize: "clamp(2.8rem, 6.4vw, 5.4rem)",
            lineHeight: 1.02,
            letterSpacing: 0,
            wordSpacing: "0.15em",
            color: "#F5F0E8",
            margin: 0,
            maxWidth: "920px",
            // Layered text-shadow + backdrop scrim for AA contrast on every nebula frame
            textShadow:
              "0 2px 28px rgba(4,2,13,0.78), 0 1px 4px rgba(4,2,13,0.55), 0 0 64px rgba(4,2,13,0.45)",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: "-0.4em -0.6em",
              zIndex: -1,
              background:
                "radial-gradient(ellipse at 30% 50%, rgba(6,4,26,0.70) 0%, rgba(6,4,26,0.42) 45%, transparent 78%)",
              filter: "blur(8px)",
              pointerEvents: "none",
            }}
          />
          <span data-word style={wordStyle}>Your</span>{" "}
          <span data-word style={wordStyle}>chart,</span>{" "}
          <em style={{ fontStyle: "italic" }}>
            <span data-word style={wordStyle}>read</span>{" "}
            <span data-word style={wordStyle}>for</span>{" "}
            <span data-word style={wordStyle}>you.</span>
          </em>
        </h1>

        {/* Sub-copy — scrim-wrapped for readability over the nebula */}
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
          you were born.{" "}
          <em style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", color: "rgba(245, 240, 232, 0.98)" }}>
            Not templates
          </em>{" "}
          — real cosmic guidance, written by hand.
        </p>

        {/* Primary CTA + secondary link */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            gap: "clamp(1rem, 2vw, 1.5rem)",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "clamp(0.75rem, 1.5vw, 1.25rem)",
            animation: "fadeUpIn 1s cubic-bezier(0.16,1,0.3,1) 1.45s both",
          }}
        >
          <MagneticButton variant="gold" href="/academy/card-of-the-day" size="md">
            ✦ Draw today&rsquo;s card
          </MagneticButton>

          <a
            href="/#sample"
            className="hero-secondary-link"
            style={{
              fontFamily: "var(--font-body, system-ui), sans-serif",
              fontSize: "0.95rem",
              fontWeight: 400,
              color: "rgba(220, 210, 245, 0.78)",
              textDecoration: "none",
              borderBottom: "1px solid rgba(220, 210, 245, 0.24)",
              paddingBottom: "2px",
              transition:
                "color 200ms var(--ease-ritual, cubic-bezier(0.16,1,0.3,1)), border-color 200ms var(--ease-ritual, cubic-bezier(0.16,1,0.3,1))",
            }}
          >
            See a sample reading
          </a>
        </div>

        {/* Trust row — social proof, data provenance, volume */}
        <p
          style={{
            position: "relative",
            zIndex: 2,
            marginTop: "clamp(1.5rem, 2.5vw, 2.25rem)",
            fontFamily: "var(--font-body, system-ui), sans-serif",
            fontSize: "0.82rem",
            fontWeight: 400,
            letterSpacing: "0.02em",
            color: "var(--c-text-muted, rgba(190, 180, 225, 0.72))",
            maxWidth: "620px",
            animation: "fadeUpIn 1s cubic-bezier(0.16,1,0.3,1) 1.7s both",
            margin: 0,
            lineHeight: 1.7,
          }}
        >
          <span aria-hidden style={{ color: "rgba(232, 201, 106, 0.92)", marginRight: "0.4em" }}>✦</span>
          Computed from{" "}
          <span style={{ color: "rgba(235, 225, 255, 0.88)" }}>NASA JPL DE440/DE441 ephemeris</span>
          <span aria-hidden style={{ margin: "0 0.5em", opacity: 0.5 }}>·</span>
          <span style={{ color: "rgba(235, 225, 255, 0.88)" }}>9 languages</span>
          <span aria-hidden style={{ margin: "0 0.5em", opacity: 0.5 }}>·</span>
          <span style={{ color: "rgba(235, 225, 255, 0.88)" }}>14-day refund</span>, cancel any time
        </p>
      </div>

      {/* Keyframes + interaction + a11y styles injected once */}
      <style>{`
        @keyframes fadeUpIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (hover: hover) {
          .hero-secondary-link:hover {
            color: rgba(232, 201, 106, 0.95) !important;
            border-color: rgba(232, 201, 106, 0.6) !important;
          }
        }
        .hero-secondary-link:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
        /* Ensure reduced-motion users never see invisible headline words */
        @media (prefers-reduced-motion: reduce) {
          #home-hero-headline [data-word] {
            opacity: 1 !important;
            clip-path: none !important;
          }
          .hero-secondary-link {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
}
