/**
 * /story — Immersive scroll-driven narrative page
 *
 * Full-screen sections telling the Olivia Arcana brand story.
 * Each section uses different visual techniques:
 *   1. Full-bleed hero with morphing tagline
 *   2. Philosophy text with per-word reveal
 *   3. Visual timeline of cosmic wisdom traditions
 *   4. Feature showcase in horizontal scroll
 *   5. Final CTA with parallax depth
 *
 * This page IS the Awwwards submission showpiece.
 */

"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TextReveal from "@/components/TextReveal";
import MorphingText from "@/components/MorphingText";
import SmoothReveal from "@/components/SmoothReveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import InfiniteMarquee from "@/components/InfiniteMarquee";
import MagneticButton from "@/components/MagneticButton";
import GlowCard from "@/components/GlowCard";

export default function StoryPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        {/* ── SECTION 1: Full-screen Hero ── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 1.5rem",
            position: "relative",
          }}
        >
          {/* Eyebrow */}
          <TextReveal
            as="p"
            split="chars"
            stagger={25}
            delay={400}
            direction="up"
            intensity={20}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 300,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,0.6)",
              marginBottom: "2rem",
            }}
          >
            The Story Behind the Stars
          </TextReveal>

          {/* Main headline */}
          <TextReveal
            as="h1"
            split="words"
            stagger={60}
            duration={900}
            delay={600}
            direction="up"
            intensity={50}
            blur
            clipReveal
            randomize
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(2.5rem, 7vw, 7rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              textAlign: "center",
              maxWidth: "900px",
              color: "transparent",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              backgroundImage: "linear-gradient(165deg, #f0ecff 0%, #c4b4f0 38%, #a08de0 65%, #c9bef5 100%)",
            }}
          >
            We read the cosmos so you can understand yourself
          </TextReveal>

          {/* Morphing subtitle */}
          <div
            style={{
              marginTop: "2.5rem",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: "clamp(1rem, 1.8vw, 1.3rem)",
              color: "rgba(196,185,228,0.7)",
              textAlign: "center",
            }}
          >
            <MorphingText
              texts={[
                "Personalised readings from real planetary data",
                "Ancient wisdom meets modern astronomy",
                "Your birth chart, decoded with precision",
                "Not templates — real cosmic insight",
              ]}
              interval={3500}
              morphDuration={1000}
            />
          </div>

          {/* Scroll indicator */}
          <div
            style={{
              position: "absolute",
              bottom: "3rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              opacity: 0.4,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            <span style={{
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(200,185,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Scroll
            </span>
            <svg width="20" height="30" viewBox="0 0 20 30" fill="none">
              <rect x="1" y="1" width="18" height="28" rx="9" stroke="rgba(200,185,255,0.3)" strokeWidth="1" />
              <circle cx="10" cy="10" r="2" fill="rgba(212,175,55,0.5)">
                <animate attributeName="cy" from="10" to="20" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
        </section>

        {/* ── SECTION 2: Philosophy ── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8rem 1.5rem",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <TextReveal
            as="h2"
            split="words"
            stagger={40}
            duration={800}
            direction="up"
            intensity={30}
            blur
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.5rem, 3.5vw, 2.8rem)",
              lineHeight: 1.5,
              textAlign: "center",
              color: "rgba(240,236,255,0.9)",
            }}
          >
            Every person carries a celestial blueprint — the exact positions of every planet at the moment of their first breath. We decode that blueprint with the precision of modern astronomy and the depth of ancient tradition.
          </TextReveal>

          {/* Divider */}
          <div
            style={{
              marginTop: "4rem",
              width: "60px",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)",
            }}
          />
        </section>

        {/* ── SECTION 3: Stats with counters ── */}
        <section style={{ padding: "6rem 1.5rem" }}>
          <SmoothReveal
            stagger={120}
            duration={800}
            direction="up"
            distance={40}
            className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <div className="text-center">
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                fontWeight: 300,
                color: "rgba(212,175,55,0.8)",
              }}>
                <AnimatedCounter value={12400} suffix="+" duration={2500} />
              </div>
              <p style={{
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(160,150,200,0.5)",
                marginTop: "0.5rem",
              }}>
                Readings Given
              </p>
            </div>
            <div className="text-center">
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                fontWeight: 300,
                color: "rgba(212,175,55,0.8)",
              }}>
                <AnimatedCounter value={78} duration={2000} delay={200} />
              </div>
              <p style={{
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(160,150,200,0.5)",
                marginTop: "0.5rem",
              }}>
                Tarot Cards
              </p>
            </div>
            <div className="text-center">
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                fontWeight: 300,
                color: "rgba(212,175,55,0.8)",
              }}>
                <AnimatedCounter value={9} duration={1500} delay={400} />
              </div>
              <p style={{
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(160,150,200,0.5)",
                marginTop: "0.5rem",
              }}>
                Languages
              </p>
            </div>
            <div className="text-center">
              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                fontWeight: 300,
                color: "rgba(212,175,55,0.8)",
              }}>
                <AnimatedCounter value={4.9} decimals={1} duration={2000} delay={600} />
              </div>
              <p style={{
                fontSize: "0.7rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(160,150,200,0.5)",
                marginTop: "0.5rem",
              }}>
                Average Rating
              </p>
            </div>
          </SmoothReveal>
        </section>

        {/* ── SECTION 4: Principles ── */}
        <section style={{ padding: "8rem 1.5rem" }}>
          <div className="max-w-6xl mx-auto">
            <TextReveal
              as="p"
              split="chars"
              stagger={20}
              direction="up"
              intensity={15}
              style={{
                textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.7rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.5)",
                marginBottom: "1.5rem",
              }}
            >
              Our Principles
            </TextReveal>

            <TextReveal
              as="h2"
              split="words"
              stagger={45}
              duration={800}
              direction="up"
              blur
              style={{
                textAlign: "center",
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                color: "rgba(240,236,255,0.9)",
                marginBottom: "4rem",
              }}
            >
              What Makes This Different
            </TextReveal>

            <SmoothReveal
              stagger={100}
              duration={700}
              direction="up"
              distance={35}
              blur
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                {
                  title: "Real Astronomy",
                  description: "Built on NASA JPL ephemeris data — the same calculations used to navigate spacecraft. No approximations, no sun-sign-only shortcuts.",
                  glyph: "◎",
                },
                {
                  title: "Living System",
                  description: "Your sky changes every moment. Transit alerts, lunar phases, planetary hours — the site breathes with the actual cosmos above you.",
                  glyph: "◑",
                },
                {
                  title: "Ritual Experience",
                  description: "Every interaction is designed as a micro-ritual. Custom sounds, haptic feedback, ceremonial card reveals — technology serving the sacred.",
                  glyph: "✦",
                },
              ].map((principle) => (
                <GlowCard key={principle.title} maxTilt={6} glowIntensity={0.12}>
                  <div className="glass-card p-8">
                    <div style={{
                      fontSize: "2rem",
                      color: "rgba(212,175,55,0.6)",
                      marginBottom: "1.5rem",
                      textShadow: "0 0 20px rgba(212,175,55,0.2)",
                    }}>
                      {principle.glyph}
                    </div>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "1.4rem",
                      fontWeight: 500,
                      color: "rgba(240,236,255,0.9)",
                      marginBottom: "0.75rem",
                    }}>
                      {principle.title}
                    </h3>
                    <p style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                      color: "rgba(196,185,228,0.7)",
                    }}>
                      {principle.description}
                    </p>
                  </div>
                </GlowCard>
              ))}
            </SmoothReveal>
          </div>
        </section>

        {/* ── SECTION 5: Marquee strip ── */}
        <section style={{ padding: "4rem 0" }}>
          <InfiniteMarquee speed={30} gap={64}>
            {["Natal Charts", "✦", "Tarot Readings", "✦", "Synastry", "✦", "Transits", "✦", "AI Oracle", "✦", "Moon Journal", "✦", "Life Timing", "✦"].map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: item === "✦" ? "inherit" : "'Cormorant Garamond', Georgia, serif",
                  fontSize: item === "✦" ? "0.8rem" : "clamp(1.2rem, 2.5vw, 1.8rem)",
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                  color: item === "✦" ? "rgba(212,175,55,0.4)" : "rgba(240,236,255,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                {item}
              </span>
            ))}
          </InfiniteMarquee>
        </section>

        {/* ── SECTION 6: Final CTA ── */}
        <section
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8rem 1.5rem",
            textAlign: "center",
          }}
        >
          <TextReveal
            as="h2"
            split="words"
            stagger={50}
            duration={900}
            direction="up"
            blur
            clipReveal
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 5vw, 4.5rem)",
              lineHeight: 1.1,
              color: "transparent",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              backgroundImage: "linear-gradient(165deg, #f0ecff 0%, #c4b4f0 38%, #a08de0 65%, #c9bef5 100%)",
              marginBottom: "2rem",
              maxWidth: "700px",
            }}
          >
            Your stars are waiting
          </TextReveal>

          <TextReveal
            as="p"
            split="words"
            stagger={30}
            delay={300}
            direction="up"
            intensity={20}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)",
              lineHeight: 1.7,
              color: "rgba(196,185,228,0.7)",
              maxWidth: "480px",
              marginBottom: "3rem",
            }}
          >
            Enter your birthday and discover what the cosmos has written for you — for free, forever.
          </TextReveal>

          <SmoothReveal delay={600} stagger={100} direction="up" distance={20} className="flex gap-4 flex-wrap justify-center">
            <MagneticButton href="/" variant="gold" size="lg">
              Begin Your Reading
            </MagneticButton>
            <MagneticButton href="/academy" variant="outline" size="lg">
              Explore the Academy
            </MagneticButton>
          </SmoothReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
