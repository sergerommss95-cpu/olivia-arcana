/**
 * /sample — a full worked natal reading, typeset.
 *
 * The single best proof of product quality. No signup wall, no lorem
 * ipsum. A readable, specific, handwritten reading for a fictional
 * subject (Eleanor M. — March 14 1994, 03:47 GMT, Edinburgh) with five
 * roman-numeraled sections, pull quotes, sidenotes, and Olivia's
 * signature at the end. Links back to the home CTA at the bottom.
 *
 * Typography is the product. Every detail (drop cap, italic term
 * emphasis, monospace data header, editorial sidenotes) is deliberate.
 *
 * Linked from /v2 HeroV2 and /v2 SampleExcerpt. Safe to also link from
 * the real /#sample anchor to fulfill Sprint 1's promise.
 */

"use client";

import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/MagneticButton";
import AbToggle from "@/components/ab/AbToggle";

export default function SamplePage() {
  return (
    <>
      <Navbar />

      <main id="main-content" className="relative z-10">
        <article className="sample">
          {/* ── Header ───────────────────────────────────────────── */}
          <header className="sample-masthead">
            <p className="sample-kicker">
              <span aria-hidden>✦</span> A worked reading
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
              <span>Edinburgh, UK</span>
            </div>
          </header>

          {/* ── Section I ────────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">I.</span> Sun in Pisces, 12th house
            </h2>

            <p>
              <span className="sample-drop">E</span>leanor, you were born with
              the Sun in its most private room — the twelfth house, the
              chamber behind the chamber, the place astrologers
              traditionally call the house of what we do not see ourselves
              doing. In Pisces, too, the water sign most inclined to lose
              its own edges. This is a specific kind of beginning.
            </p>

            <p>
              What it does <em>not</em> mean: that you&rsquo;re destined
              for monastic withdrawal, or that your contribution to the
              world will go unseen. Those are the horoscope-column
              readings of a Pisces twelfth, and they&rsquo;re too easy.
              What it <em>does</em> mean is that your identity does
              genuinely belong to something larger than the body you
              occupy, and you&rsquo;ve known this since before you could
              say it.
            </p>

            <aside className="sample-sidenote">
              <span className="sample-sidenote-mark" aria-hidden>✦</span>
              <span>
                <strong>Sun in the 12th.</strong> Historically the house of
                hospitals, prisons, and monasteries — i.e. spaces where
                identity is suspended in service of a larger frame. In a
                modern chart it tracks to jobs with privacy of execution:
                writing, therapy, archival work, midwifery, night-shift ICU.
              </span>
            </aside>

            <p>
              There is a specific consequence: you will feel most yourself
              when you are making things for others and taking very little
              credit for it. Not because you&rsquo;re self-effacing —
              plenty of Pisces suns are self-effacing for the wrong
              reasons — but because the signature of this placement is a
              solved kind of anonymity. You ghost-write. You produce. You
              hand-tune. You edit. You caretake. You&rsquo;re the reason
              something works, and the <em>last thing</em> you want is
              for anyone to stop and point to you doing it.
            </p>

            <p>
              The trouble, and there is trouble, is that our culture
              gives you no ladder for this. Nearly every recognition
              structure asks you to be visible in order to be valued,
              and you&rsquo;ll need to work out a private answer to that
              conflict — probably more than once, across decades. The
              answer is not to become loud. It&rsquo;s to find the
              people and the work where your kind of contribution is
              legible without being named.
            </p>
          </section>

          {/* ── Section II ───────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">II.</span> Moon in Cancer on the IC
            </h2>

            <p>
              Your Moon is in Cancer, the sign it rules, at the very
              bottom of your chart — on the IC, the fourth-house cusp,
              the axis that describes where you come from and what you
              go home to. This is a Moon with nothing in its way. It is
              itself, doing its job, in its own room.
            </p>

            <p>
              Which means: you feel everything. Not in the performative
              sense that water signs get stuck with in pop astrology,
              but in the literal sense that your emotional weather is
              legible to you first and everyone else second. This is an
              advantage. It is not a superpower. It just means your
              nervous system is well-tuned and needs real care.
            </p>

            <blockquote className="sample-pullquote">
              A well-placed Cancer Moon is a house that knows its own
              roof — when to open it to rain, when to close it.
            </blockquote>

            <p>
              Pragmatically: you probably already know that your home
              environment is not decorative but functional. You will not
              thrive in rented rooms you cannot alter, or in households
              with people whose emotional logic you can&rsquo;t read.
              The 4th-house IC placement doubles this — whatever you
              build into your living situation is also what you build
              into your work, your relationships, your art. Rearrange
              the kitchen and the rest will follow.
            </p>
          </section>

          {/* ── Section III ──────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">III.</span> Sagittarius rising, Jupiter in the 1st
            </h2>

            <p>
              Your Ascendant is in Sagittarius and Jupiter — the ruler
              of Sagittarius — sits in the 1st house. This is a rare
              configuration and the single most energizing thing in your
              chart. It says: you arrive, and the arrival is the point.
            </p>

            <p>
              People meet you and immediately orient to you as someone
              who is <em>going somewhere</em>. Not in the ambitious-
              corporate-striver sense — that&rsquo;s not what Jupiter
              does — but in the geographical and philosophical sense.
              You have a wide angle of vision. You see contexts.
            </p>

            <p>
              This softens the Pisces Sun&rsquo;s tendency toward
              anonymity in a useful way: Sagittarius rising means that
              even when your work is invisible, <em>you</em>, as a
              presence, are not. Your body arrives in rooms, and the
              rooms reorient. Don&rsquo;t pretend this doesn&rsquo;t
              happen.
            </p>

            <aside className="sample-sidenote">
              <span className="sample-sidenote-mark" aria-hidden>✦</span>
              <span>
                <strong>Jupiter in the 1st.</strong> Enlarges the body&rsquo;s
                signal to the room. Often (not always) literal size; always
                presence. The classical exaltation of Jupiter is in Cancer —
                another strong link to your Moon, below your feet.
              </span>
            </aside>
          </section>

          {/* ── Section IV ───────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">IV.</span> The Saturn–Mercury square
            </h2>

            <p>
              Natal Saturn in Pisces at 2° squares your Mercury at 4°
              Gemini. This is the one <em>difficult</em> aspect
              I&rsquo;ll name in this reading, because difficulty named
              accurately is sometimes all the instruction a difficult
              aspect needs.
            </p>

            <p>
              Mercury is your writing, your thinking, your calendar —
              and in Gemini, it is <em>fast</em>. Saturn in Pisces is
              slow, careful, skeptical of finishes. These two planets
              don&rsquo;t like each other in your chart and you&rsquo;ve
              felt it: the inner voice that tells you the thing
              you&rsquo;ve just written is not good enough, not
              finished, not for the public. That&rsquo;s this square
              speaking.
            </p>

            <p>
              The correction is not to override Saturn. Your Saturn has
              reasonable standards and they&rsquo;ve saved you from
              publishing a dozen things you would have regretted. The
              correction is to give Saturn a specific job (final read,
              structural check, a <em>yes</em> before publish) and
              refuse to let it also do the first draft. Mercury in
              Gemini drafts. Saturn in Pisces closes. Separate the two.
            </p>
          </section>

          {/* ── Section V ────────────────────────────────────────── */}
          <section className="sample-section">
            <h2 className="sample-section-title">
              <span className="sample-numeral">V.</span> A year ahead
            </h2>

            <p>
              The single transit I&rsquo;d mark in your calendar for the
              coming year is <em>Jupiter returning to Cancer</em>,
              beginning in early summer. This is your Moon&rsquo;s sign;
              it&rsquo;s the sign where Jupiter itself is exalted; and
              it transits your 8th house.
            </p>

            <p>
              What this tends to do, in a chart shaped like yours: it
              makes invisible work visible, but on terms you set.
              Someone will see the thing you&rsquo;ve been quietly
              making. Possibly several someones. This is not the
              horoscope-column claim that you&rsquo;ll be Discovered or
              Become Famous — it&rsquo;s the narrower, more accurate
              claim that the boundary between your private practice and
              your public output will thin, and the practice will be
              better and stranger for it.
            </p>

            <p>
              Prepare by treating what you&rsquo;re already making as
              <em> finished enough</em> to show, and by not rewriting
              your bio or your introduction sentence between now and
              then. Let the work be found as it is.
            </p>
          </section>

          {/* ── Sign-off ─────────────────────────────────────────── */}
          <footer className="sample-signoff">
            <p className="sample-signoff-body">
              This is one third of the full natal reading. The other
              sections cover your Mars in Aquarius, your Venus–Neptune
              conjunction, your node axis, and a year-by-year outlook
              through 2033. The full version runs about 6,000 words and
              lives in your library once we make it for you.
            </p>
            <p className="sample-signature">
              <span className="sample-signature-mark">✦</span> Olivia
              <span className="sample-signature-sub">
                Written for Eleanor M. · Libra sun · Cancer moon · Sagittarius rising · Edinburgh
              </span>
            </p>

            <div className="sample-final-ctas">
              <MagneticButton variant="gold" href="/academy/card-of-the-day" size="md">
                ✦ Start with today&rsquo;s card
              </MagneticButton>
              <Link href="/" className="sample-back">
                ← Back to home
              </Link>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
      <AbToggle mode="b" />

      <style>{`
        .sample {
          max-width: 720px;
          margin: 0 auto;
          padding: clamp(5rem, 9vw, 8rem) clamp(1.25rem, 5vw, 3rem) clamp(4rem, 7vw, 6rem);
          font-family: var(--font-body, system-ui), sans-serif;
          color: rgba(238, 232, 220, 0.9);
          line-height: 1.8;
        }

        .sample-masthead {
          margin-bottom: clamp(3rem, 6vw, 5rem);
          padding-bottom: clamp(2rem, 4vw, 3rem);
          border-bottom: 1px solid var(--c-border, rgba(200, 185, 255, 0.12));
          display: grid;
          gap: 1rem;
        }
        .sample-kicker {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.82);
          margin: 0;
        }
        .sample-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
          font-size: clamp(2.4rem, 5vw, 3.6rem);
          line-height: 1.05;
          color: rgba(245, 240, 232, 0.98);
          margin: 0;
          letter-spacing: -0.005em;
        }
        .sample-title em {
          font-style: italic;
          color: rgba(232, 201, 106, 0.95);
        }
        .sample-data {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.4em;
          font-family: var(--font-mono, "IBM Plex Mono"), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--c-text-mid, rgba(196, 185, 228, 0.78));
          margin-top: 0.5rem;
        }
        .sample-dot { opacity: 0.5; }

        .sample-section {
          margin-bottom: clamp(3rem, 5vw, 4.5rem);
        }
        .sample-section-title {
          display: flex;
          align-items: baseline;
          gap: 0.55em;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
          font-style: italic;
          font-size: clamp(1.45rem, 2.8vw, 1.85rem);
          color: rgba(232, 201, 106, 0.95);
          margin: 0 0 1.5rem;
          line-height: 1.2;
        }
        .sample-numeral {
          font-style: normal;
          color: rgba(232, 201, 106, 0.7);
          font-size: 0.88em;
        }

        .sample-section p {
          font-size: 1.08rem;
          line-height: 1.8;
          margin: 0 0 1.25rem;
        }
        .sample-section p:last-child { margin-bottom: 0; }
        .sample-section em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: rgba(245, 240, 232, 0.98);
          font-size: 1.06em;
          padding: 0 0.04em;
        }

        .sample-drop {
          float: left;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 4rem;
          line-height: 0.82;
          color: rgba(232, 201, 106, 0.92);
          padding: 0.1rem 0.38rem 0 0;
          margin-top: 0.15rem;
        }

        .sample-sidenote {
          display: flex;
          gap: 0.7rem;
          padding: 0.75rem 0 0.75rem 1.1rem;
          margin: 1.5rem 0;
          border-left: 1px solid rgba(232, 201, 106, 0.35);
          font-size: 0.88rem;
          line-height: 1.65;
          color: var(--c-text-mid, rgba(196, 185, 228, 0.8));
        }
        .sample-sidenote strong {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-weight: 500;
          color: rgba(232, 201, 106, 0.92);
          margin-right: 0.3em;
        }
        .sample-sidenote-mark {
          color: rgba(232, 201, 106, 0.8);
          font-size: 0.9rem;
          flex: 0 0 auto;
          line-height: 1.5;
        }

        .sample-pullquote {
          margin: 2rem 0;
          padding: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.3rem, 2.4vw, 1.6rem);
          line-height: 1.4;
          color: rgba(245, 240, 232, 0.96);
          text-align: center;
          border: none;
          position: relative;
          padding: 0 1.5rem;
        }
        .sample-pullquote::before,
        .sample-pullquote::after {
          content: "";
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 1px;
          background: rgba(232, 201, 106, 0.45);
        }
        .sample-pullquote::before { top: -1rem; }
        .sample-pullquote::after  { bottom: -1rem; }

        .sample-signoff {
          margin-top: clamp(3rem, 5vw, 5rem);
          padding-top: clamp(2rem, 4vw, 3rem);
          border-top: 1px solid var(--c-border, rgba(200, 185, 255, 0.12));
          display: grid;
          gap: 2rem;
        }
        .sample-signoff-body {
          font-size: 1rem;
          line-height: 1.7;
          color: var(--c-text-mid, rgba(220, 210, 245, 0.82));
          margin: 0;
          font-style: italic;
          max-width: 60ch;
        }
        .sample-signature {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.6rem;
          color: rgba(232, 201, 106, 0.95);
          margin: 0;
        }
        .sample-signature-mark {
          margin-right: 0.3em;
        }
        .sample-signature-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-style: normal;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          margin-top: 0.1rem;
        }

        .sample-final-ctas {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          align-items: center;
          margin-top: 1rem;
        }
        .sample-back {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.9rem;
          color: rgba(220, 210, 245, 0.78);
          text-decoration: none;
          border-bottom: 1px solid rgba(220, 210, 245, 0.24);
          padding-bottom: 2px;
          transition: color 200ms cubic-bezier(0.16,1,0.3,1);
        }
        .sample-back:hover { color: rgba(232, 201, 106, 0.95); }
        .sample-back:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
