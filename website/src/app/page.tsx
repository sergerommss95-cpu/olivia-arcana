"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import SignLabel from "@/components/SignLabel";
import ConstellationOverlay from "@/components/ConstellationOverlay";
import MagneticGlow from "@/components/MagneticGlow";
import CosmicStatus from "@/components/CosmicStatus";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import DailyHoroscope from "@/components/DailyHoroscope";
import CompatibilityChecker from "@/components/CompatibilityChecker";
import ScrollFloat from "@/components/ScrollFloat";
import InfiniteMarquee from "@/components/InfiniteMarquee";
import CosmicSelfie from "@/components/CosmicSelfie";
import Faq from "@/components/Faq";

// Lazy-load non-critical components
const CinematicLoader = dynamic(() => import("@/components/CinematicLoader"), { ssr: false });

export default function Home() {
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFade = (e: Event) => {
      const fade = (e as CustomEvent).detail?.fade;
      if (!sectionsRef.current) return;
      sectionsRef.current.style.transition = "opacity 0.6s var(--ease-ritual)";
      sectionsRef.current.style.opacity = fade ? "0" : "1";
      sectionsRef.current.style.pointerEvents = fade ? "none" : "auto";
    };
    window.addEventListener("cosmos:sections-fade", handleFade as EventListener);
    return () => window.removeEventListener("cosmos:sections-fade", handleFade as EventListener);
  }, []);

  return (
    <>
      <CinematicLoader />
      <SignLabel />
      <ConstellationOverlay />
      <MagneticGlow />
      <Navbar />
      <CosmicStatus />

      <main id="main-content" className="relative z-10">
        <Hero />
        <div ref={sectionsRef}>
          {/* Quiet sections: no scroll-scrubbed entrance — they breathe on their own */}
          <DailyHoroscope />
          <CompatibilityChecker />

          {/* Infinite proof marquee — real quotes, a star rating, a press mention.
              TODO: swap verbatim copy from prototype .proof-track when ready. */}
          <div style={{ padding: "3rem 0" }} aria-label="Social proof">
            <InfiniteMarquee speed={22} gap={72}>
              {[
                { kind: "quote", text: "The first astrology app that actually feels like astrology.", who: "— Mira, Cancer ☾" },
                { kind: "sep" },
                { kind: "rating", text: "★★★★★", sub: "4.9 from 2,306 subscribers" },
                { kind: "sep" },
                { kind: "quote", text: "I cancelled my Co–Star subscription after a week.", who: "— Alex, Gemini ☉" },
                { kind: "sep" },
                { kind: "press", outlet: "Featured in", name: "Almanac Weekly" },
                { kind: "sep" },
                { kind: "quote", text: "Reading the transits here is the only time I feel seen by an app.", who: "— Dr. Liao, Scorpio ↑" },
                { kind: "sep" },
                { kind: "rating", text: "99%", sub: "renewal rate on annual plans" },
                { kind: "sep" },
                { kind: "quote", text: "My Saturn return suddenly made sense.", who: "— Priya, Capricorn ☉" },
                { kind: "sep" },
                { kind: "press", outlet: "As seen in", name: "Moon & Matter" },
                { kind: "sep" },
              ].map((item, i) => {
                if (item.kind === "sep") {
                  return (
                    <span key={i} aria-hidden style={{ color: "rgba(212,175,55,0.45)", fontSize: "0.8rem" }}>
                      ✦
                    </span>
                  );
                }
                if (item.kind === "rating") {
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: "0.65em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
                          fontSize: "clamp(1.1rem, 2vw, 1.55rem)",
                          color: "rgba(232, 201, 106, 0.92)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {item.text}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body, system-ui), sans-serif",
                          fontSize: "0.78rem",
                          fontWeight: 400,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "rgba(196,185,228,0.6)",
                        }}
                      >
                        {item.sub}
                      </span>
                    </span>
                  );
                }
                if (item.kind === "press") {
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "baseline",
                        gap: "0.6em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body, system-ui), sans-serif",
                          fontSize: "0.66rem",
                          fontWeight: 500,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "rgba(196,185,228,0.55)",
                        }}
                      >
                        {item.outlet}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
                          fontStyle: "italic",
                          fontSize: "clamp(1rem, 1.8vw, 1.4rem)",
                          color: "rgba(240,236,255,0.82)",
                        }}
                      >
                        {item.name}
                      </span>
                    </span>
                  );
                }
                // quote
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "baseline",
                      gap: "0.9em",
                      whiteSpace: "nowrap",
                      maxWidth: "min(75vw, 580px)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-heading, 'Cormorant Garamond'), serif",
                        fontStyle: "italic",
                        fontSize: "clamp(1rem, 1.9vw, 1.45rem)",
                        color: "rgba(240,236,255,0.88)",
                        fontWeight: 400,
                      }}
                    >
                      &ldquo;{item.text}&rdquo;
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-body, system-ui), sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(196,185,228,0.55)",
                      }}
                    >
                      {item.who}
                    </span>
                  </span>
                );
              })}
            </InfiniteMarquee>
          </div>

          {/* Scroll-scrubbed sections — subtle on the journey, dramatic on Pricing */}
          <ScrollFloat index={0} intensity="subtle">
            <Features />
          </ScrollFloat>
          <ScrollFloat index={1} intensity="subtle">
            <HowItWorks />
          </ScrollFloat>
          <ScrollFloat index={2} intensity="subtle">
            <Testimonials />
          </ScrollFloat>
          <CosmicSelfie />
          <ScrollFloat index={3} intensity="dramatic">
            <Pricing />
          </ScrollFloat>
          <Faq />
          <CTA />
        </div>
      </main>

      <Footer />
    </>
  );
}
