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

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function OliviaIntro() {
  // Portrait is shown by default. When the user clicks the play
  // overlay, we swap to a <video> element with sound and play it.
  // When it ends (or the user closes it) we fade back to the portrait.
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = useCallback(() => {
    setPlaying(true);
    // Give React a frame to mount the <video>, then play with sound
    requestAnimationFrame(() => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = 0;
      v.muted = false;
      v.volume = 1;
      void v.play();
    });
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
  }, []);

  const handleClose = useCallback(() => {
    const v = videoRef.current;
    if (v) v.pause();
    setPlaying(false);
  }, []);

  // Keyboard shortcut: ESC closes the playing video.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, handleClose]);

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
        {/* Portrait — Direction 1 (Editorial Astrologer), real photograph.
            Click the gold play pill to swap to her HeyGen intro video
            with sound. When the video ends or the user closes it, we
            fade back to the still portrait. */}
        <div className="olivia-portrait-wrap">
          <div className="olivia-portrait-frame">
            {/* The still portrait is always rendered. The video sits on
                top and is only visible while playing — gives a clean
                fade transition between the two. */}
            <img
              src="/olivia/portrait.jpg"
              alt="Olivia — Editorial Astrologer at Olivia Arcana"
              className="olivia-portrait-img"
              loading="lazy"
              decoding="async"
              width={1280}
              height={1600}
            />

            {/* Video — mounted only when playing so we don't pay the
                metadata download until the user asks for it. Hand-
                authored VTT captions (not auto-generated) so the
                track reads as real content, not an AI byproduct. */}
            {playing && (
              <video
                ref={videoRef}
                className="olivia-portrait-video"
                src="/videos/olivia-intro.mp4"
                poster="/olivia/portrait.jpg"
                playsInline
                preload="auto"
                onEnded={handleEnded}
                onClick={handleClose}
                aria-label="Olivia introducing herself"
              >
                <track
                  kind="captions"
                  srcLang="en"
                  label="English"
                  src="/videos/olivia-intro.vtt"
                  default
                />
              </video>
            )}

            {/* Play pill — fades out while video plays */}
            <button
              type="button"
              className={`olivia-play${playing ? " olivia-play-hidden" : ""}`}
              onClick={handlePlay}
              aria-label="Play Olivia's introduction"
              tabIndex={playing ? -1 : 0}
            >
              <svg
                width="14" height="14" viewBox="0 0 14 14"
                aria-hidden
                style={{ marginRight: "0.5em" }}
              >
                <path d="M3 1.5 L3 12.5 L12 7 Z" fill="currentColor" />
              </svg>
              <span>Hear Olivia&rsquo;s introduction</span>
              <span className="olivia-play-meta" aria-hidden>· 27s</span>
            </button>

            {/* Tiny close cross that appears while video plays */}
            {playing && (
              <button
                type="button"
                className="olivia-video-close"
                onClick={handleClose}
                aria-label="Stop video"
              >
                <span aria-hidden>×</span>
              </button>
            )}
          </div>

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
        .olivia-portrait-img,
        .olivia-portrait-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .olivia-portrait-video {
          position: absolute;
          inset: 0;
          z-index: 2;
          background: var(--c-void, #06041a);
          animation: oliviaVideoIn 420ms cubic-bezier(0.16,1,0.3,1) both;
          cursor: pointer;
        }
        @keyframes oliviaVideoIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Play pill — bottom-center, gold, semi-transparent */
        .olivia-play {
          position: absolute;
          left: 50%;
          bottom: 1rem;
          transform: translateX(-50%);
          z-index: 3;
          display: inline-flex;
          align-items: center;
          gap: 0.1em;
          padding: 0.55rem 1.05rem;
          border-radius: 9999px;
          border: 1px solid rgba(232, 201, 106, 0.55);
          background: rgba(6, 4, 26, 0.78);
          -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
          color: rgba(232, 201, 106, 0.98);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 0 24px rgba(212, 175, 55, 0.28);
          transition:
            opacity 360ms cubic-bezier(0.16,1,0.3,1),
            transform 360ms cubic-bezier(0.16,1,0.3,1),
            background 200ms ease,
            border-color 200ms ease;
        }
        .olivia-play:hover {
          background: rgba(6, 4, 26, 0.88);
          border-color: rgba(255, 220, 130, 0.85);
          color: rgba(255, 230, 150, 1);
          transform: translateX(-50%) translateY(-1px);
        }
        .olivia-play:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 3px;
        }
        .olivia-play-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translateX(-50%) translateY(6px);
        }
        .olivia-play-meta {
          margin-left: 0.4em;
          color: rgba(232, 201, 106, 0.55);
          font-weight: 400;
        }

        /* Close × button — top-right of the playing video */
        .olivia-video-close {
          position: absolute;
          top: 0.65rem;
          right: 0.65rem;
          z-index: 4;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(232, 201, 106, 0.45);
          background: rgba(6, 4, 26, 0.7);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
          color: rgba(245, 240, 232, 0.9);
          font-size: 1.2rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          transition: background 180ms ease, border-color 180ms ease;
        }
        .olivia-video-close:hover {
          background: rgba(6, 4, 26, 0.92);
          border-color: rgba(255, 220, 130, 0.85);
        }
        .olivia-video-close:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 3px;
        }
        .olivia-video-close span {
          transform: translateY(-1px);
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
