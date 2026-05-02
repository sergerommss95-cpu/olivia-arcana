"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import SignLabel from "@/components/SignLabel";
import ConstellationOverlay from "@/components/ConstellationOverlay";
import MagneticGlow from "@/components/MagneticGlow";
import CosmicStatus from "@/components/CosmicStatus";
import HeroV3 from "@/components/HeroV3";
import CelestialAltar from "@/components/CelestialAltar";
import StoryMarkers from "@/components/StoryMarkers";
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
      <CosmicStatus />
      <StoryMarkers />

      <main id="main-content" className="relative z-10">
        <div id="hero">
          <HeroV3 />
        </div>

        <CelestialAltar />

        <div ref={sectionsRef}>
          {/* Quiet sections: no scroll-scrubbed entrance — they breathe on their own */}
          <div id="daily">
            <DailyHoroscope />
          </div>
          <CompatibilityChecker />

          {/* Infinite proof marquee — what the product actually offers.
              Pre-launch: no fake testimonials, no invented star ratings, no
              fictional press mentions. Each item is a verifiable claim about
              the product. Replace with real quotes once we have them. */}
          <div style={{ padding: "3rem 0" }} aria-label="What's inside">
            <InfiniteMarquee speed={22} gap={72}>
              {[
                { kind: "rating", text: "8", sub: "languages — EN · UK · RU · DE · FR · AR · ES · PT" },
                { kind: "sep" },
                { kind: "press", outlet: "Powered by", name: "NASA JPL DE440/DE441 ephemeris" },
                { kind: "sep" },
                { kind: "rating", text: "207", sub: "academy lessons across 14 courses" },
                { kind: "sep" },
                { kind: "press", outlet: "Voice readings via", name: "ElevenLabs (VIP tier)" },
                { kind: "sep" },
                { kind: "rating", text: "78", sub: "tarot cards · full Rider-Waite + Marseille" },
                { kind: "sep" },
                { kind: "press", outlet: "Web payments by", name: "Paddle (5% MoR — not Stripe)" },
                { kind: "sep" },
                { kind: "rating", text: "14-day", sub: "refund · cancel any time" },
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
                // No quote items pre-launch (avoid fake testimonials).
                return null;
              })}
            </InfiniteMarquee>
          </div>

          {/* Scroll-scrubbed sections — subtle on the journey, dramatic on Pricing */}
          <div id="features">
            <ScrollFloat index={0} intensity="subtle">
              <Features />
            </ScrollFloat>
          </div>
          <div id="how-it-works">
            <ScrollFloat index={1} intensity="subtle">
              <HowItWorks />
            </ScrollFloat>
          </div>
          <ScrollFloat index={2} intensity="subtle">
            <Testimonials />
          </ScrollFloat>
          <CosmicSelfie />
          <div id="pricing">
            <ScrollFloat index={3} intensity="subtle">
              <Pricing />
            </ScrollFloat>
          </div>
          <div id="faq">
            <Faq />
          </div>
          <CTA />
        </div>
      </main>

      <Footer />
    </>
  );
}
