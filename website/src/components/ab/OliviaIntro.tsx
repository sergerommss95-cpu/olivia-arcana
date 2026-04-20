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
        {/* Portrait — SVG composition */}
        <div className="olivia-portrait-wrap" aria-hidden>
          <svg
            viewBox="0 0 320 400"
            className="olivia-portrait"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="olivia-glow" cx="50%" cy="40%" r="65%">
                <stop offset="0%" stopColor="rgba(232,201,106,0.32)" />
                <stop offset="45%" stopColor="rgba(160,122,224,0.18)" />
                <stop offset="100%" stopColor="rgba(6,4,26,0)" />
              </radialGradient>
              <linearGradient id="olivia-face" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a1030" />
                <stop offset="55%" stopColor="#0e0b24" />
                <stop offset="100%" stopColor="#06041a" />
              </linearGradient>
              <linearGradient id="olivia-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(232,201,106,0.8)" />
                <stop offset="100%" stopColor="rgba(160,122,224,0.6)" />
              </linearGradient>
            </defs>

            {/* Ambient glow */}
            <rect x="0" y="0" width="320" height="400" fill="url(#olivia-glow)" />

            {/* Portrait frame — faceted oval evoking a mirror */}
            <ellipse cx="160" cy="200" rx="118" ry="152" fill="url(#olivia-face)" />
            <ellipse
              cx="160" cy="200" rx="118" ry="152"
              fill="none"
              stroke="url(#olivia-stroke)"
              strokeWidth="0.75"
            />

            {/* Abstract face — no features, just the sense of a figure */}
            {/* Head */}
            <circle cx="160" cy="155" r="48"
              fill="none"
              stroke="rgba(232,201,106,0.58)"
              strokeWidth="0.9"
            />
            {/* Neck / shoulders arc */}
            <path
              d="M110 235 Q 160 270 210 235 Q 218 290 210 330 L 110 330 Q 102 290 110 235 Z"
              fill="none"
              stroke="rgba(200,185,255,0.38)"
              strokeWidth="0.7"
            />

            {/* Constellation overlay — cosmic alignment on the face */}
            <g stroke="rgba(232,201,106,0.72)" strokeWidth="0.6" fill="rgba(232,201,106,0.92)">
              <circle cx="148" cy="140" r="1.6" />
              <circle cx="172" cy="138" r="1.6" />
              <circle cx="160" cy="158" r="1.2" />
              <circle cx="142" cy="170" r="1.4" />
              <circle cx="178" cy="172" r="1.4" />
              <circle cx="160" cy="190" r="1.8" />
              <path d="M148 140 L160 158 L172 138 M142 170 L160 190 L178 172 M160 158 L160 190"
                fill="none" opacity="0.5" />
            </g>

            {/* Shoulder glyphs */}
            <g fill="rgba(232,201,106,0.85)" fontFamily="serif" fontStyle="italic" fontSize="15">
              <text x="118" y="305" textAnchor="middle" opacity="0.7">♎</text>
              <text x="202" y="305" textAnchor="middle" opacity="0.7">☾</text>
            </g>

            {/* Signature under the portrait */}
            <text
              x="160" y="378"
              textAnchor="middle"
              fontFamily="serif"
              fontStyle="italic"
              fontWeight="400"
              fontSize="22"
              fill="rgba(232,201,106,0.9)"
            >
              ✦ Olivia
            </text>
          </svg>

          {/* Quiet caption */}
          <p className="olivia-portrait-caption">
            Illustration placeholder · commission at Sprint 3 sign-off
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
          gap: 0.75rem;
        }
        .olivia-portrait {
          width: min(360px, 100%);
          aspect-ratio: 320 / 400;
          filter: drop-shadow(0 24px 50px rgba(0, 0, 0, 0.5));
        }
        .olivia-portrait-caption {
          font-family: var(--font-mono, "IBM Plex Mono"), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.5));
          margin: 0;
          text-align: center;
          opacity: 0.6;
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
