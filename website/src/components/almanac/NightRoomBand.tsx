"use client";

/**
 * NightRoomBand — the almanac's grammar carried into the dark rooms.
 *
 * The oracle, the chart, synastry, and the cosmos are the book's night
 * chapters: the reader closes the paper, the ritual happens in the dark.
 * This thin band at the top keeps the almanac's voice present — wordmark,
 * a paper-colored rule, and the way back — so the passage reads as
 * deliberate, not as leaving the site.
 */

import TransitionLink from "@/components/transitions/TransitionLink";
import { useLocale } from "@/lib/i18n/useLocale";

export default function NightRoomBand({ room }: { room: string }) {
  const { locale } = useLocale();
  const isUk = locale === "uk";

  return (
    <div className="night-band" role="navigation" aria-label={isUk ? "Повернутися до альманаху" : "Back to the almanac"}>
      <TransitionLink href="/" className="night-band-back">
        <span aria-hidden>↩</span> {isUk ? "До альманаху" : "Back to the almanac"}
      </TransitionLink>
      <p className="night-band-title">
        {isUk ? "Нічна кімната" : "Night room"} · {room}
      </p>
      <span className="night-band-mark" aria-hidden>
        ✦
      </span>

      <style jsx>{`
        .night-band {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.5rem clamp(1rem, 3vw, 2rem);
          background: rgba(232, 233, 255, 0.06);
          border-bottom: 1px solid rgba(232, 233, 255, 0.14);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .night-band :global(.night-band-back) {
          color: rgba(232, 233, 255, 0.78);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          transition: color 200ms ease;
        }

        .night-band :global(.night-band-back:hover) {
          color: #e8dcc8;
        }

        .night-band-title {
          margin: 0;
          color: rgba(232, 233, 255, 0.45);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .night-band-mark {
          color: rgba(224, 183, 104, 0.75);
          font-size: 0.7rem;
        }

        @media (max-width: 560px) {
          .night-band-title {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
