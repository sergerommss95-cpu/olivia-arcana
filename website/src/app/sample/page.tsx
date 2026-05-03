/**
 * /sample — Representative worked reading for Libra sun / Cancer moon.
 *
 * This page uses static data to showcase the Olivia Arcana editorial tone
 * and design quality to potential users before they create an account.
 *
 * Features:
 *   - High-end typography (Italic Cormorant Garamond)
 *   - Scrolled chapter markers
 *   - Generative-relic illustration
 *   - Detailed personality & timing analysis
 */

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";

export default function SamplePage() {
  return (
    <>
      <main id="main-content" className="relative z-10">
        <article className="sample">
          {/* ── Header ───────────────────────────────────────────── */}
          <header className="sample-masthead">
            <p className="sample-kicker">
              <Image
                src="/olive-mark.svg"
                alt=""
                aria-hidden
                width={14}
                height={14}
                className="sample-kicker-mark"
              />
              A worked reading
            </p>
            <h1 className="sample-title">
              For Eleanor, born <em>into water.</em>
            </h1>
            <div className="sample-data">
              <span>Eleanor&nbsp;M.</span>
              <span aria-hidden className="sample-dot">·</span>
              <span>14.03.1994</span>
              <span aria-hidden className="sample-dot">·</span>
              <span>03:47&nbsp;GMT</span>
              <span aria-hidden className="sample-dot">·</span>
              <span>London, UK</span>
            </div>
            <div className="sample-summary">
              <p>
                Eleanor’s chart is defined by a rare cluster in Pisces — a 
                profoundly intuitive alignment that requires an equally 
                profound container.
              </p>
            </div>
          </header>

          {/* ── Section I ────────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">I.</span> The Core Essence
            </h2>
            <p className="sample-chart-data">
              <span>Sun in Pisces</span>
              <span className="sample-chart-sep" aria-hidden>·</span>
              <span>Moon in Cancer</span>
              <span className="sample-chart-sep" aria-hidden>·</span>
              <span>Scorpio Rising</span>
            </p>
            <div className="sample-copy">
              <p>
                You are a being of pure resonance. With the luminaries in water 
                signs and a Scorpio ascendant, your boundary between self and 
                world is semi-permeable. You don’t just observe environments; 
                you absorb them.
              </p>
              <p>
                This sensitivity is your greatest power and your most 
                significant challenge. Pisces Sun gives you the vision of a 
                mystic, but your Cancer Moon demands the safety of a home. 
                You are a voyager who needs an anchor.
              </p>
            </div>
          </section>

          {/* ── Visual Relic ─────────────────────────────────────── */}
          <div className="sample-visual">
            <div className="sample-relic-wrap">
              <div className="sample-relic-glow" />
              {/* This would be the RelicScene in a real user chart, 
                  here we use a high-quality static proxy */}
              <Image
                src="/v4_fool.webp"
                alt="Representative Celestial Relic"
                width={480}
                height={480}
                className="sample-relic-img"
              />
            </div>
            <p className="sample-caption">
              The <em>Resonance Relic</em> generated for Eleanor. 
              Note the deep indigo nucleus and fluid violet periphery.
            </p>
          </div>

          {/* ── Section II ───────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">II.</span> Intellectual Temperament
            </h2>
            <p className="sample-chart-data">
              <span>Mercury in Aquarius</span>
              <span className="sample-chart-sep" aria-hidden>·</span>
              <span>3rd House</span>
            </p>
            <div className="sample-copy">
              <p>
                While your heart is fluid, your mind is architectural. 
                Mercury in Aquarius grants you a detached, almost scientific 
                clarity when analyzing systems. You have the ability to step 
                back from your own intense emotions and see the logical 
                scaffolding of any situation.
              </p>
              <p>
                This creates a fascinating internal tension: a mystical heart 
                paired with a modern, technological mind. You are the bridge 
                between ancient wisdom and future logic.
              </p>
            </div>
          </section>

          {/* ── Section III ──────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">III.</span> The Saturn Return
            </h2>
            <p className="sample-chart-data warning">
              <span>Current Cycle</span>
              <span className="sample-chart-sep" aria-hidden>·</span>
              <span>Critical Integration</span>
            </p>
            <div className="sample-copy">
              <p>
                Eleanor is currently navigating the heart of her Saturn 
                Return. This is the celestial &ldquo;coming of age&rdquo; where the 
                fantasies of youth are tested against the weight of 
                reality. 
              </p>
              <p>
                For a Pisces Sun, this period often feels like being asked 
                to build a cathedral on water. The task is to find a 
                structure that respects your fluidity without trying to 
                freeze it into stone.
              </p>
            </div>
          </section>

          {/* ── Midpoint break — the reader pauses here ───────────── */}
          <div className="sample-break" role="separator" aria-hidden>
            <span className="sample-break-rule" />
            <Image
              src="/olive-mark.svg"
              alt=""
              width={22}
              height={22}
              className="sample-break-mark"
            />
            <span className="sample-break-rule" />
          </div>

          {/* ── Section IV ───────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">IV.</span> The Saturn–Mercury square
            </h2>
            <p className="sample-chart-data zodiac">
              <span>Saturn</span>
              <span className="sample-chart-sep" aria-hidden>·</span>
              <span className="zodiac-glyph">♓</span>
              <span>2°</span>
            </p>
            <div className="sample-copy">
              <p>
                In your specific chart, Saturn is applying pressure to your 
                Mercury. This can manifest as a fear of being misunderstood 
                or a tendency toward self-censorship. You feel the weight 
                of your words.
              </p>
              <p>
                The remedy is precision. When you describe your internal 
                ocean, use the most accurate language possible. Poetry is 
                not an escape for you; it is a discipline.
              </p>
            </div>
          </section>

          {/* ── Call to Action ───────────────────────────────────── */}
          <section className="sample-cta">
            <div className="sample-cta-glass">
              <h2 className="sample-cta-title">Your own stars await.</h2>
              <p className="sample-cta-text">
                This is approximately 4% of a full Olivia analysis. Your 
                complete portrait includes a 40-page natal guide, daily 
                personalized transits, and unlimited access to the 
                AI Oracle.
              </p>
              <div className="sample-cta-group">
                <MagneticButton variant="gold" href="/portrait" size="lg">
                  Generate My Portrait
                </MagneticButton>
              </div>
            </div>
          </section>

          {/* ── Footer / Signature ────────────────────────────────── */}
          <footer className="sample-footer">
            <p className="sample-disclaimer">
              The full version of this reading for Eleanor M. includes 12 
              additional sections covering Mars in Aquarius, the 
              Venus-Neptune conjunction, and a year-ahead outlook.
            </p>
            <p className="sample-signature">
              <Image
                src="/olive-mark.svg"
                alt=""
                aria-hidden
                width={22}
                height={22}
                className="sample-signature-mark"
              />
              Olivia
              <span className="sample-signature-sub">
                Written for Eleanor M. · Libra sun · Cancer moon · Sagittarius rising · Edinburgh
              </span>
            </p>

            <div className="sample-final-ctas">
              <MagneticButton variant="gold" href="/academy/card-of-the-day" size="md">
                ✦ Start with today&rsquo;s card
              </MagneticButton>
              <Link href="/" className="sample-back">
                &larr; Back to home
              </Link>
            </div>
          </footer>
        </article>
      </main>

      <Footer />

      <style jsx>{`
        .sample {
          max-width: 800px;
          margin: 0 auto;
          padding: 8rem 1.5rem 4rem;
          color: var(--color-warm-ivory);
        }

        .sample-masthead {
          text-align: center;
          margin-bottom: 6rem;
        }

        .sample-kicker {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--color-celestial-gold);
          margin-bottom: 2rem;
          opacity: 0.8;
        }

        .sample-title {
          font-size: clamp(2.5rem, 8vw, 4.5rem);
          line-height: 1.1;
          margin-bottom: 1.5rem;
        }

        .sample-data {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          opacity: 0.4;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 3rem;
        }

        .sample-summary {
          font-size: 1.25rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          opacity: 0.9;
        }

        .sample-section {
          margin-bottom: 5rem;
        }

        .sample-section-title {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .sample-numeral {
          color: var(--color-celestial-gold);
          font-weight: 300;
          margin-right: 0.5rem;
        }

        .sample-chart-data {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-celestial-gold);
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .sample-chart-sep {
          opacity: 0.3;
        }

        .sample-copy p {
          font-size: 1.1rem;
          line-height: 1.7;
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }

        .sample-visual {
          margin: 6rem 0;
          text-align: center;
        }

        .sample-relic-wrap {
          position: relative;
          display: inline-block;
          margin-bottom: 2rem;
        }

        .sample-relic-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(160, 122, 224, 0.15) 0%, transparent 70%);
          filter: blur(40px);
          z-index: -1;
        }

        .sample-relic-img {
          border-radius: 2rem;
          box-shadow: 0 20px 80px rgba(0,0,0,0.4);
        }

        .sample-caption {
          font-family: var(--font-body);
          font-size: 0.85rem;
          opacity: 0.4;
          font-style: italic;
        }

        .sample-break {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          margin: 8rem 0;
        }

        .sample-break-rule {
          height: 1px;
          flex: 1;
          background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.2), transparent);
        }

        .sample-cta {
          margin: 8rem 0;
        }

        .sample-cta-glass {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(212, 175, 55, 0.1);
          border-radius: 2rem;
          padding: 4rem 2rem;
          text-align: center;
          backdrop-filter: blur(8px);
        }

        .sample-cta-title {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }

        .sample-cta-text {
          max-width: 500px;
          margin: 0 auto 3rem;
          opacity: 0.7;
          line-height: 1.6;
        }

        .sample-footer {
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 4rem;
          margin-top: 8rem;
        }

        .sample-disclaimer {
          font-size: 0.85rem;
          opacity: 0.4;
          margin-bottom: 3rem;
          max-width: 500px;
        }

        .sample-signature {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          font-family: var(--font-heading);
          font-size: 2rem;
          font-style: italic;
          margin-bottom: 4rem;
        }

        .sample-signature-sub {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.3;
          font-style: normal;
        }

        .sample-final-ctas {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2rem;
        }

        .sample-back {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-decoration: none;
          color: var(--color-warm-ivory);
          opacity: 0.4;
          transition: opacity 0.3s;
        }

        .sample-back:hover {
          opacity: 1;
        }
      `}</style>
    </>
  );
}
