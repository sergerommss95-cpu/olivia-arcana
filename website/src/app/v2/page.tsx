/**
 * /v2 — Sprint 3 proposal (the B side of the A/B test).
 *
 * Built in parallel to /. Goal: let the owner experience the Sprint 3
 * direction — miniaturized veil on the home page, live sky ticker,
 * Olivia persona intro, one worked reading, narrative order — without
 * yet committing to restructuring the real home.
 *
 * See /docs/handoff/07-sprint-3-proposal.md for rationale.
 */

"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";
import AbToggle from "@/components/ab/AbToggle";

import HeroV2 from "@/components/ab/HeroV2";
import SkyTicker from "@/components/ab/SkyTicker";
import OliviaIntro from "@/components/ab/OliviaIntro";
import SampleExcerpt from "@/components/ab/SampleExcerpt";
import AcademyPreview from "@/components/ab/AcademyPreview";

export default function V2Page() {
  return (
    <>
      <Navbar />

      <main id="main-content" className="relative z-10">
        {/* Act 1 — Hero: live-feel veil + the day's card */}
        <HeroV2 />

        {/* Act 2 — Prove the ephemeris claim in 3 seconds */}
        <SkyTicker />

        {/* Act 3 — A worked reading, typeset beautifully */}
        <SampleExcerpt />

        {/* Act 4 — Who is writing this */}
        <OliviaIntro />

        {/* Act 5 — How deep it goes */}
        <AcademyPreview />

        {/* Act 6 — The offer (reused) */}
        <Pricing />

        {/* Act 7 — Lingering questions + final ask */}
        <Faq />
        <CTA />
      </main>

      <Footer />
      <AbToggle mode="b" />
    </>
  );
}
