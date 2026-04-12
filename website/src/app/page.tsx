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
          {/* Each section floats in with scroll-scrubbed micro-animations */}
          <ScrollFloat index={0}>
            <DailyHoroscope />
          </ScrollFloat>
          <ScrollFloat index={1}>
            <CompatibilityChecker />
          </ScrollFloat>
          {/* Infinite marquee strip — trust & capability signal */}
          <div style={{ padding: "3rem 0" }}>
            <InfiniteMarquee speed={30} gap={56}>
              {["Birth Charts", "✦", "Daily Readings", "✦", "Tarot Oracle", "✦", "Synastry", "✦", "Transit Alerts", "✦", "Moon Journal", "✦", "AI Astrologer", "✦"].map((item, i) => (
                <span
                  key={i}
                  style={{
                    fontFamily: item === "✦" ? "inherit" : "'Cormorant Garamond', Georgia, serif",
                    fontSize: item === "✦" ? "0.75rem" : "clamp(1rem, 2vw, 1.5rem)",
                    fontWeight: 300,
                    letterSpacing: "0.05em",
                    color: item === "✦" ? "rgba(212,175,55,0.35)" : "rgba(240,236,255,0.2)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item}
                </span>
              ))}
            </InfiniteMarquee>
          </div>

          <ScrollFloat index={2}>
            <Features />
          </ScrollFloat>
          <ScrollFloat index={3}>
            <HowItWorks />
          </ScrollFloat>
          <ScrollFloat index={4}>
            <Testimonials />
          </ScrollFloat>
          <ScrollFloat index={5}>
            <Pricing />
          </ScrollFloat>
          <ScrollFloat index={6}>
            <CTA />
          </ScrollFloat>
        </div>
      </main>

      <Footer />
    </>
  );
}
