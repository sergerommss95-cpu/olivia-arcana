/**
 * OliviaIntro.tsx — "The person writing this."
 *
 * First-person intro card. Treats Olivia as a persona: a fictional-but-
 * fully-realized editor whose voice is consistent across every reading
 * on the site. The portrait is an inline SVG — celestial glyph
 * composition, not a photo — because a stock-looking photo would
 * cheapen the brand. If Sprint 3 ships we'll replace this with a
 * commissioned illustration or line portrait.
 *
 * Placement: Act 4 in the narrative (after the sky ticker + sample
 * excerpt establish that something real is happening). The reader
 * wants to know who's behind it by the time they arrive here.
 */

"use client";

import React from "react";
import Link from "next/link";

export default function OliviaIntro() {
  return (
    <section
      aria-labelledby="olivia-heading"
      style={{
        padding: "clamp(5rem, 10vw, 9rem) clamp(1.25rem, 6vw, 6rem)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="olivia-grid">
        {/* Portrait — editorial photograph frame (Direction 1: Editorial
            Astrologer). The placeholder shows a faint silhouette inside
            a portrait-proportioned frame with a hairline gold border, a
            subtle radial vignette, and a discreet caption underneath
            that cites the commission path — so the layout visibly
            reserves space for a real 4:5 photograph rather than
            suggesting an illustration is the end state. Replace the
            <svg> below with <Image src="/olivia/portrait.jpg" …/> once
            the HeyGen source portrait is generated and approved. */}
        <div className="olivia-portrait-wrap" aria-hidden>
          <div className="olivia-portrait-frame">
            <svg
              viewBox="0 0 320 400"
              className="olivia-portrait"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Olivia portrait — placeholder pending photography"
            >
              <defs>
                <radialGradient id="olivia-bg" cx="50%" cy="40%" r="70%">
                  <stop offset="0%"  stopColor="rgba(34, 22, 62, 1)" />
                  <stop offset="65%" stopColor="rgba(14, 10, 36, 1)" />
                  <stop offset="100%" stopColor="rgba(6, 4, 26, 1)" />
                </radialGradient>
                <radialGradient id="olivia-rim" cx="50%" cy="38%" r="55%">
                  <stop offset="0%"  stopColor="rgba(232, 201, 106, 0.25)" />
                  <stop offset="70%" stopColor="rgba(232, 201, 106, 0)" />
                </radialGradient>
                <linearGradient id="olivia-silhouette" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(46, 30, 72, 0.9)" />
                  <stop offset="100%" stopColor="rgba(18, 12, 42, 0.9)" />
                </linearGradient>
              </defs>

              {/* Editorial studio backdrop — warm gold fades into cosmic void */}
              <rect width="320" height="400" fill="url(#olivia-bg)" />
              <rect width="320" height="400" fill="url(#olivia-rim)" />

              {/* Faint silhouette of a head-and-shoulders portrait —
                  signals "a photograph goes here" without cartoonifying. */}
              <g opacity="0.55">
                {/* Shoulders */}
                <path
                  d="M66 400 L66 330 Q 80 296 110 284 Q 130 278 160 278 Q 190 278 210 284 Q 240 296 254 330 L254 400 Z"
                  fill="url(#olivia-silhouette)"
                />
                {/* Head */}
                <ellipse cx="160" cy="220" rx="56" ry="68" fill="url(#olivia-silhouette)" />
                {/* Neck */}
                <rect x="140" y="275" width="40" height="18" fill="url(#olivia-silhouette)" />
                {/* Soft loose hair shape */}
                <path
                  d="M100 220 Q 96 180 112 158 Q 140 138 160 138 Q 180 138 208 158 Q 224 180 220 220 Q 216 240 204 250 Q 192 252 180 245 Q 160 256 140 245 Q 128 252 116 250 Q 104 240 100 220 Z"
                  fill="url(#olivia-silhouette)"
                  opacity="0.72"
                />
              </g>

              {/* Hairline gold border just inside the frame */}
              <rect x="8" y="8" width="304" height="384" rx="6"
                fill="none"
                stroke="rgba(232, 201, 106, 0.35)"
                strokeWidth="0.75"
              />
            </svg>
          </div>

          <p className="olivia-portrait-caption">
            Portrait placeholder · photography commission pending
          </p>
          <p className="olivia-portrait-signature">
            <span aria-hidden>✦</span> Olivia
          </p>
        </div>

        {/* Intro copy */}
        <div className="olivia-copy">
          <span className="olivia-eyebrow">
            <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
            The person writing this
          </span>

          <h2 id="olivia-heading" className="olivia-headline">
            Hello. <em>I&rsquo;m Olivia.</em>
          </h2>

          <div className="olivia-body">
            <p>
              I&rsquo;ve been reading charts for fifteen years, which sounds
              impressive until you realize most of that time was spent
              unlearning the astrology I thought I knew. The thing that
              survived the unlearning is this: the sky is precise, and the
              precise sky has something specific to say about a specific
              person born at a specific minute. <em>That&rsquo;s</em> what
              I write, here.
            </p>
            <p>
              Every reading you&rsquo;ll read on this site is computed from
              actual ephemeris data and then written by hand — not
              pattern-matched from a template library, not stitched by a
              language model pretending to know you. If the chart
              can&rsquo;t answer what you&rsquo;re asking, I&rsquo;ll say
              so instead of making something up.
            </p>
            <p className="olivia-signoff">
              <span className="olivia-sign">✦</span> Olivia
              <span className="olivia-sign-sub">
                Libra sun · Cancer moon · Sagittarius rising · Edinburgh
              </span>
            </p>
          </div>

          <div className="olivia-badges" role="list" aria-label="Credentials">
            <span role="listitem" className="olivia-badge">
              <span aria-hidden>✶</span> NCGR certified
            </span>
            <span role="listitem" className="olivia-badge">
              <span aria-hidden>✶</span> 12,400+ readings
            </span>
            <span role="listitem" className="olivia-badge">
              <span aria-hidden>✶</span> Published in <em>Almanac Weekly</em>
            </span>
          </div>

          <Link href="/ask" className="olivia-cta">
            Ask Olivia a question →
          </Link>
        </div>
      </div>

      <style>{`
        .olivia-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
          gap: clamp(2.5rem, 5vw, 5rem);
          align-items: center;
          max-width: 1100px;
          margin: 0 auto;
        }
        @media (max-width: 860px) {
          .olivia-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 2.5rem;
          }
        }
        .olivia-portrait-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.9rem;
        }
        /* A real photo frame. The SVG inside holds space at 4:5.
           Editorial Astrologer (Direction 1): hairline gold border,
           subtle radial vignette, warm shadow, no faceted oval.
           Replace inner <svg> with <img src="/olivia/portrait.jpg" /> once
           the HeyGen source image lands — CSS stays. */
        .olivia-portrait-frame {
          position: relative;
          width: min(360px, 100%);
          aspect-ratio: 4 / 5;
          overflow: hidden;
          border-radius: 8px;
          box-shadow:
            0 28px 56px rgba(0, 0, 0, 0.55),
            0 0 40px rgba(212, 175, 55, 0.08),
            inset 0 0 0 1px rgba(232, 201, 106, 0.22);
        }
        .olivia-portrait {
          width: 100%;
          height: 100%;
          display: block;
        }
        .olivia-portrait-caption {
          font-family: var(--font-mono, "IBM Plex Mono"), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.52));
          margin: 0;
          text-align: center;
          opacity: 0.55;
        }
        .olivia-portrait-signature {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.35rem;
          color: rgba(232, 201, 106, 0.92);
          margin: 0.1rem 0 0;
          text-align: center;
          letter-spacing: 0.01em;
        }
        .olivia-portrait-signature span[aria-hidden] {
          margin-right: 0.2em;
          color: rgba(232, 201, 106, 1);
        }

        .olivia-copy {
          display: grid;
          gap: clamp(1rem, 2vw, 1.5rem);
          max-width: 560px;
        }
        .olivia-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.78);
        }
        .olivia-headline {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2.2rem, 4.4vw, 3.4rem);
          line-height: 1.05;
          font-weight: 400;
          color: rgba(245, 240, 232, 0.98);
          margin: 0;
          letter-spacing: -0.005em;
        }
        .olivia-headline em {
          font-style: italic;
          color: rgba(232, 201, 106, 0.98);
        }
        .olivia-body {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: clamp(1rem, 1.3vw, 1.12rem);
          line-height: 1.72;
          color: var(--c-text-mid, rgba(238, 232, 220, 0.88));
        }
        .olivia-body p + p {
          margin-top: 1rem;
        }
        .olivia-body em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: rgba(245, 240, 232, 0.98);
        }
        .olivia-signoff {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--c-border, rgba(200, 185, 255, 0.1));
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.35rem;
          color: rgba(232, 201, 106, 0.92);
        }
        .olivia-sign {
          margin-right: 0.3em;
          color: rgba(232, 201, 106, 1);
        }
        .olivia-sign-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-style: normal;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          margin-top: 0.1rem;
        }
        .olivia-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem 0.75rem;
          margin-top: 0.5rem;
        }
        .olivia-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4em;
          padding: 0.4rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(200, 185, 255, 0.15);
          background: rgba(255, 255, 255, 0.035);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--c-text-mid, rgba(220, 210, 245, 0.85));
        }
        .olivia-badge span[aria-hidden] {
          color: rgba(232, 201, 106, 0.85);
        }
        .olivia-badge em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: rgba(245, 240, 232, 0.95);
          margin-left: 0.15em;
        }
        .olivia-cta {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
          color: rgba(220, 210, 245, 0.82);
          text-decoration: none;
          border-bottom: 1px solid rgba(220, 210, 245, 0.26);
          padding-bottom: 2px;
          align-self: flex-start;
          justify-self: flex-start;
          transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .olivia-cta:hover {
          color: rgba(232, 201, 106, 0.95);
          border-color: rgba(232, 201, 106, 0.6);
        }
        .olivia-cta:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
      `}</style>
    </section>
  );
}
