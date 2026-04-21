/**
 * /v3 — "Come in, it's already happening."
 *
 * Sprint 3 direction: mesh-gradient atmosphere as the page's weather,
 * LivingPaperCard where the hero card used to be — always visible,
 * cursor focus clears the paper locally, no hold-to-reveal ceremony.
 *
 * Rationale in docs/handoff/08-shader-veil-rethink.md.
 */

"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";
import AbToggle from "@/components/ab/AbToggle";

import HeroV3 from "@/components/ab/HeroV3";
import SkyTicker from "@/components/ab/SkyTicker";
import OliviaIntro from "@/components/ab/OliviaIntro";
import SampleExcerpt from "@/components/ab/SampleExcerpt";
import AcademyPreview from "@/components/ab/AcademyPreview";

export default function V3Page() {
  return (
    <>
      <Navbar />

      <main id="main-content" className="relative z-10">
        <HeroV3 />
        <SkyTicker />
        <SampleExcerpt />
        <OliviaIntro />
        <AcademyPreview />
        <Pricing />
        <Faq />
        <CTA />
      </main>

      <Footer />
      <AbToggle mode="c" />
    </>
  );
}
