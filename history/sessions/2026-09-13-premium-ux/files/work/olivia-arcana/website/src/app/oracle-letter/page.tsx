/**
 * /oracle-letter — Displays the last tarot reading as a letter from Olivia,
 * set in the Personal Almanac print register: bone paper, ink, an oxblood
 * wax seal, drop cap, and the cosmic-moment stamp in mono small caps.
 * Reads from localStorage (key: "olivia-last-reading").
 * If no reading is saved, shows a CTA to draw a card.
 * Save-as-image (html2canvas) and print support carried over.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import { useLocale } from "@/lib/i18n/useLocale";

interface SavedReading {
  cardName: string;
  cardGlyph?: string;
  reading: string;
  userName?: string;
  cosmicMoment: {
    planetaryHour: string;
    moonPhase: string;
    season: string;
    romanDate: string;
    romanYear: string;
  };
}

export default function OracleLetterRoute() {
  const router = useRouter();
  const { locale } = useLocale();
  const isUk = locale === "uk";
  const [data, setData] = useState<SavedReading | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem("olivia-last-reading");
        if (raw) {
          const parsed = JSON.parse(raw) as SavedReading;
          // Basic validation
          if (parsed.cardName && parsed.reading && parsed.cosmicMoment) {
            setData(parsed);
          }
        }
      } catch {
        // Invalid data — fall through to empty state
      }
      setChecked(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save as image via html2canvas
  const handleSave = useCallback(async () => {
    if (!letterRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(letterRef.current, {
        backgroundColor: "#e8dcc8",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `olivia-arcana-${data?.cardName.toLowerCase().replace(/\s+/g, "-") ?? "reading"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Silently fail — user can use print instead
    } finally {
      setSaving(false);
    }
  }, [data, saving]);

  // Print
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <AlmanacShell narrow>
      {!checked ? (
        /* Loading — quiet paper while localStorage is read */
        <div style={{ minHeight: "40vh" }} aria-hidden />
      ) : data ? (
        /* Has reading — the letter */
        <article className="ol">
          <p className="alm-kicker ol-kicker">{isUk ? "ЛИСТИ ВІД ДРУКАРНІ" : "LETTERS FROM THE PRESS"}</p>
          <p className="alm-caption ol-opened">
            {isUk ? "Відкрито" : "Opened"}{" "}
            {new Date().toLocaleDateString(isUk ? "uk-UA" : "en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <button
            type="button"
            className="ol-close"
            onClick={() => router.back()}
            aria-label="Close oracle letter"
          >
            &times;
          </button>

          <div ref={letterRef} className="ol-letter">
            {/* Wax seal */}
            <div className="ol-seal" aria-hidden>
              {data.cardGlyph || "✦"}
            </div>

            {/* Roman date header */}
            <p className="ol-date alm-caption">
              {data.cosmicMoment.romanDate} &middot; {data.cosmicMoment.romanYear}
            </p>

            {/* Cosmic moment stamp */}
            <p className="ol-moment alm-caption">
              {data.cosmicMoment.moonPhase} &middot; Hour of {data.cosmicMoment.planetaryHour} &middot; {data.cosmicMoment.season}
            </p>

            <div className="ol-divider" aria-hidden />

            {/* Card name heading */}
            <h1 className="ol-card">{data.cardName}</h1>

            {/* Salutation */}
            {data.userName && <p className="ol-for">For {data.userName}</p>}

            {/* Reading body with drop cap */}
            <div className="ol-reading">{data.reading}</div>

            <div className="ol-divider" aria-hidden />

            {/* Watermark */}
            <p className="ol-watermark alm-caption">{"✦"} Olivia Arcana</p>
          </div>

          {/* Action buttons */}
          <div className="ol-actions">
            <button type="button" className="alm-btn" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save as Image"}
            </button>
            <button type="button" className="alm-link" onClick={handlePrint}>
              Print
            </button>
          </div>
        </article>
      ) : (
        /* No reading — CTA */
        <div className="ol-empty">
          <p className="alm-kicker ol-empty-kicker">{isUk ? "ЛИСТИ ВІД ДРУКАРНІ" : "LETTERS FROM THE PRESS"}</p>
          <div className="ol-empty-mark" aria-hidden>{"✦"}</div>
          <h1 className="alm-h1">No Reading Yet</h1>
          <p className="ol-empty-copy alm-lead">
            Draw a card from the Oracle to receive your sealed letter. The cosmos has something to
            say — but first, you must ask.
          </p>
          <TransitionLink href="/oracle" className="alm-btn">
            Draw a Card
          </TransitionLink>
        </div>
      )}

      <style jsx>{`
        .ol {
          position: relative;
          padding-bottom: 1rem;
        }

        .ol-kicker {
          margin: 0.4rem 0 0.4rem;
          text-align: center;
        }

        .ol-opened {
          margin: 0;
          text-align: center;
        }

        .ol-close {
          position: absolute;
          top: -0.6rem;
          right: 0;
          z-index: 2;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--hairline);
          border-radius: 50%;
          background: rgba(250, 246, 236, 0.8);
          color: var(--ink-soft);
          font-size: 1.25rem;
          cursor: pointer;
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .ol-close:hover {
          color: var(--ox);
          border-color: var(--ox);
        }

        .ol-letter {
          margin: 1.6rem auto 0;
          max-width: 40rem;
          padding: clamp(2rem, 5vw, 3.2rem) clamp(1.4rem, 4vw, 2.6rem) clamp(1.8rem, 4vw, 2.6rem);
          background: #0f1240;
          border: 1px solid var(--hairline);
          box-shadow: 0 1.4rem 2.8rem rgba(4, 6, 32, 0.12);
          text-align: center;
        }

        .ol-seal {
          display: grid;
          place-items: center;
          width: 4.2rem;
          height: 4.2rem;
          margin: 0 auto 2.2rem;
          border-radius: 50%;
          background: radial-gradient(circle at 36% 30%, #a34a30, #e0b768 66%, #5e1f10);
          color: rgba(250, 240, 226, 0.92);
          font-size: 1.5rem;
          box-shadow:
            0 0.45rem 1rem rgba(94, 31, 16, 0.35),
            inset 0 1px 2px rgba(255, 255, 255, 0.35),
            inset 0 -2px 4px rgba(46, 14, 6, 0.5);
        }

        .ol-date {
          margin: 0 0 0.5rem;
        }

        .ol-moment {
          margin: 0 0 2rem;
          letter-spacing: 0.16em;
        }

        .ol-divider {
          width: 2.6rem;
          height: 1px;
          margin: 0 auto 1.8rem;
          background: var(--ox);
          opacity: 0.45;
        }

        .ol-card {
          margin: 0 0 0.5rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.9rem, 4.4vw, 2.6rem);
          font-weight: 400;
          line-height: 1.15;
          color: var(--ink);
          text-wrap: balance;
        }

        .ol-for {
          margin: 0 0 1.8rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.1rem;
          font-style: italic;
          color: var(--ink-soft);
        }

        .ol-reading {
          margin: 0 0 2.2rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.12rem, 2vw, 1.28rem);
          line-height: 1.75;
          color: var(--ink);
          text-align: left;
        }

        .ol-reading::first-letter {
          float: left;
          padding: 6px 12px 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 4em;
          font-weight: 400;
          line-height: 0.8;
          color: var(--ox);
        }

        .ol-watermark {
          margin: 0;
          opacity: 0.7;
        }

        .ol-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem 1.6rem;
          margin-top: 2.2rem;
        }

        /* alm-link only styles the bottom border — buttons bring their own. */
        .ol-actions :global(button.alm-link) {
          border-top: none;
          border-left: none;
          border-right: none;
        }

        .ol-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.3rem;
          min-height: 50vh;
          justify-content: center;
          text-align: center;
        }

        .ol-empty-kicker {
          margin: 0;
        }

        .ol-empty-mark {
          color: var(--ox);
          font-size: 2rem;
          opacity: 0.65;
        }

        .ol-empty-copy {
          margin: 0;
          max-width: 40ch;
        }

        @media print {
          .ol-close,
          .ol-kicker,
          .ol-opened,
          .ol-actions {
            display: none !important;
          }

          .ol-letter {
            box-shadow: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ol-close {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
