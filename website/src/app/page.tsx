"use client";

import { useEffect, useRef } from "react";
import Starfield from "@/components/Starfield";
import SignLabel from "@/components/SignLabel";
import ConstellationOverlay from "@/components/ConstellationOverlay";
import MagneticGlow from "@/components/MagneticGlow";
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
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFade = (e: Event) => {
      const fade = (e as CustomEvent).detail?.fade;
      if (!sectionsRef.current) return;
      sectionsRef.current.style.transition = "opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)";
      sectionsRef.current.style.opacity = fade ? "0" : "1";
      sectionsRef.current.style.pointerEvents = fade ? "none" : "auto";
    };
    window.addEventListener("cosmos:sections-fade", handleFade as EventListener);
    return () => window.removeEventListener("cosmos:sections-fade", handleFade as EventListener);
  }, []);

  return (
    <>
      <Starfield />
      <SignLabel />
      <ConstellationOverlay />
      <MagneticGlow />
      <Navbar />

      <main className="relative z-10">
        <Hero />
        <div ref={sectionsRef}>
          <ScrollReveal>
            <DailyHoroscope />
          </ScrollReveal>
          <ScrollReveal delay={100} parallax>
            <CompatibilityChecker />
          </ScrollReveal>
          <ScrollReveal delay={50}>
            <Features />
          </ScrollReveal>
          <ScrollReveal delay={100} parallax>
            <HowItWorks />
          </ScrollReveal>
          <ScrollReveal delay={50}>
            <Testimonials />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <Pricing />
          </ScrollReveal>
          <ScrollReveal>
            <CTA />
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </>
  );
}
