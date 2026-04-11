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

// Lazy-load non-critical components
const CosmicLoader = dynamic(() => import("@/components/CosmicLoader"), { ssr: false });

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
      <CosmicLoader />
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
