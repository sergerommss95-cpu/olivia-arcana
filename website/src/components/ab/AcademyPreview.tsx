/**
 * AcademyPreview.tsx — "How deep it goes."
 *
 * The academy has 207 lessons and the current homepage never tells you
 * it exists, let alone what's inside. This section answers:
 *   - what is the academy? (three-track curriculum with a real spine)
 *   - what does lesson 1 look like? (a readable excerpt from it, inline)
 *   - where does it lead? (glimpse of the capstone)
 *
 * Not interactive like the full academy — it's a preview card, not an
 * embedded lesson. Keeps the JS weight down while still demonstrating
 * the depth.
 */

"use client";

import React from "react";
import Link from "next/link";

const TRACKS = [
  {
    title: "Astrology",
    lessons: 87,
    color: "rgba(160, 122, 224, 0.9)",
    items: ["The twelve signs, in houses", "Aspects as conversation", "Reading a natal chart end to end"],
  },
  {
    title: "Tarot",
    lessons: 72,
    color: "rgba(232, 201, 106, 0.95)",
    items: ["The Major Arcana as journey", "Minor Arcana — the day-to-day", "Three-card and Celtic Cross spreads"],
  },
  {
    title: "Integrated",
    lessons: 48,
    color: "rgba(78, 205, 196, 0.9)",
    items: ["Tarot for transits", "Astrology-informed pulls", "Building a yearly practice"],
  },
];

export default function AcademyPreview() {
  return (
    <section
      aria-labelledby="academy-preview-heading"
      style={{
        padding: "clamp(5rem, 10vw, 9rem) clamp(1.25rem, 6vw, 6rem)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div className="ap-wrap">
        {/* Head */}
        <div className="ap-head">
          <p className="ap-eyebrow">
            <span aria-hidden style={{ marginRight: "0.6em", opacity: 0.9 }}>✦</span>
            How deep it goes
          </p>
          <h2 id="academy-preview-heading" className="ap-headline">
            <em>207 lessons.</em> Three tracks. One spine.
          </h2>
          <p className="ap-sub">
            The academy is what the subscription actually buys. You get the
            full curriculum — astrology from first principles, the tarot
            deck as a language, and the places where the two meet.
          </p>
        </div>

        {/* Three track pillars */}
        <div className="ap-tracks" role="list">
          {TRACKS.map((track) => (
            <article
              key={track.title}
              role="listitem"
              className="ap-track"
              style={{ ["--track-color" as string]: track.color }}
            >
              <header>
                <span className="ap-track-lessons">{track.lessons} lessons</span>
                <h3 className="ap-track-title">{track.title}</h3>
              </header>
              <ul className="ap-track-list">
                {track.items.map((item) => (
                  <li key={item}>
                    <span aria-hidden className="ap-track-bullet">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Lesson 1 preview card */}
        <article className="ap-lesson" aria-label="Lesson 1 preview">
          <div className="ap-lesson-meta">
            <span className="ap-lesson-num">Lesson&nbsp;01</span>
            <span aria-hidden className="ap-lesson-dot">·</span>
            <span className="ap-lesson-track">Astrology, beginner</span>
            <span aria-hidden className="ap-lesson-dot">·</span>
            <span className="ap-lesson-dur">9&nbsp;min read</span>
          </div>

          <h3 className="ap-lesson-title">
            The difference between a <em>sign</em> and a <em>house.</em>
          </h3>

          <p className="ap-lesson-body">
            Here is the thing nobody tells you on the first page of an
            astrology book: the twelve signs describe <em>flavors</em> and
            the twelve houses describe <em>rooms</em>. A planet&rsquo;s
            <em> sign</em> is who it is when it shows up. A planet&rsquo;s
            <em> house</em> is where in your life it&rsquo;s doing its
            work. Mercury in Gemini is a mind that thrives on variety.
            Mercury in the 7th house is a mind that thrives on dialogue.
            Mercury in Gemini in the 7th house is both — varied dialogue,
            at a dinner table, and maybe with a therapist…
          </p>

          <footer className="ap-lesson-foot">
            <Link href="/academy" className="ap-lesson-cta">
              Keep reading in the academy →
            </Link>
            <span className="ap-lesson-note">
              First 8 lessons free · full library with VIP
            </span>
          </footer>
        </article>
      </div>

      <style>{`
        .ap-wrap {
          max-width: 1100px;
          margin: 0 auto;
          display: grid;
          gap: clamp(2.5rem, 5vw, 4rem);
        }
        .ap-head {
          text-align: center;
          display: grid;
          gap: 0.75rem;
        }
        .ap-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(232, 201, 106, 0.78);
          margin: 0;
        }
        .ap-headline {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2rem, 4.4vw, 2.9rem);
          font-weight: 500;
          color: rgba(245, 240, 232, 0.98);
          margin: 0;
          line-height: 1.1;
        }
        .ap-headline em {
          font-style: italic;
          color: rgba(232, 201, 106, 0.95);
        }
        .ap-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1rem;
          line-height: 1.6;
          color: var(--c-text-mid, rgba(196, 185, 228, 0.82));
          max-width: 580px;
          margin: 0 auto;
        }

        /* ── Track pillars ─────────────────────────────────────────── */
        .ap-tracks {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          list-style: none;
          padding: 0;
        }
        .ap-track {
          background: rgba(11, 8, 30, 0.55);
          -webkit-backdrop-filter: blur(14px);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(200, 185, 255, 0.1);
          border-left: 2px solid var(--track-color, rgba(200, 185, 255, 0.3));
          border-radius: 0.85rem;
          padding: 1.5rem 1.5rem;
          display: grid;
          gap: 0.9rem;
        }
        .ap-track-lessons {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--track-color, rgba(200, 185, 255, 0.7));
        }
        .ap-track-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.65rem;
          font-weight: 500;
          color: rgba(245, 240, 232, 0.98);
          margin: 0.25rem 0 0;
          line-height: 1.1;
        }
        .ap-track-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 0.5rem;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--c-text-mid, rgba(220, 210, 245, 0.82));
        }
        .ap-track-list li {
          display: flex;
          gap: 0.6em;
          align-items: baseline;
        }
        .ap-track-bullet {
          color: var(--track-color, rgba(200, 185, 255, 0.55));
          font-size: 1rem;
          line-height: 1;
          flex: 0 0 auto;
        }

        /* ── Lesson preview card ───────────────────────────────────── */
        .ap-lesson {
          background: rgba(11, 8, 30, 0.7);
          -webkit-backdrop-filter: blur(20px) saturate(1.2);
          backdrop-filter: blur(20px) saturate(1.2);
          border: 1px solid rgba(212, 175, 55, 0.28);
          border-radius: 1.25rem;
          padding: clamp(2rem, 3.5vw, 3rem);
          box-shadow:
            0 24px 60px rgba(0, 0, 0, 0.3),
            0 0 48px rgba(212, 175, 55, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          display: grid;
          gap: 1.25rem;
        }
        .ap-lesson-meta {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 0.4em;
          align-items: baseline;
          font-family: var(--font-mono, "IBM Plex Mono"), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
        }
        .ap-lesson-num {
          color: rgba(232, 201, 106, 0.9);
          font-weight: 600;
        }
        .ap-lesson-dot { opacity: 0.5; }
        .ap-lesson-title {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
          font-size: clamp(1.5rem, 3vw, 2.1rem);
          line-height: 1.15;
          color: rgba(245, 240, 232, 0.98);
          margin: 0;
        }
        .ap-lesson-title em {
          font-style: italic;
          color: rgba(232, 201, 106, 0.95);
        }
        .ap-lesson-body {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 1.02rem;
          line-height: 1.75;
          color: rgba(238, 232, 220, 0.88);
          max-width: 64ch;
          margin: 0;
        }
        .ap-lesson-body em {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          color: rgba(245, 240, 232, 0.98);
          font-size: 1.06em;
        }
        .ap-lesson-foot {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem 1.2rem;
          align-items: baseline;
          justify-content: space-between;
          margin-top: 0.5rem;
        }
        .ap-lesson-cta {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.05rem;
          color: rgba(232, 201, 106, 0.95);
          text-decoration: none;
          border-bottom: 1px solid rgba(232, 201, 106, 0.4);
          padding-bottom: 2px;
          transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1), border-color 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .ap-lesson-cta:hover {
          color: rgba(255, 230, 150, 1);
          border-color: rgba(255, 230, 150, 0.7);
        }
        .ap-lesson-cta:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 4px;
          border-radius: 3px;
        }
        .ap-lesson-note {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          color: var(--c-text-muted, rgba(190, 180, 225, 0.72));
          letter-spacing: 0.04em;
        }
      `}</style>
    </section>
  );
}
