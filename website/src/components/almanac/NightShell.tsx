"use client";

/**
 * NightShell — the almanac's night plates.
 *
 * The same print system as the light pages, inverted: bone type on warm
 * near-black paper, hairlines in bone-alpha, one lifted-ember accent, the
 * same grain (screen-blended). No nebulas, no liquid shaders, no glass —
 * a night page of the same book, engraved white-line on black.
 *
 * Provides tokens + shared vocabulary (night-kicker/h1/lead/card/btn/
 * input/link) and mounts the NightRoomBand. Immersive rooms: no masthead,
 * no colophon — the band is the way back.
 */

import NightRoomBand from "@/components/almanac/NightRoomBand";
import MagnetRig from "@/components/almanac/MagnetRig";

interface NightShellProps {
  room: string;
  children: React.ReactNode;
}

export default function NightShell({ room, children }: NightShellProps) {
  return (
    <div className="night-plate">
      <NightRoomBand room={room} />
      <MagnetRig />
      <main id="main-content" className="night-main">
        {children}
      </main>

      <style jsx global>{`
        .night-plate {
          --night: #10134d;
          --night-deep: #0a0d38;
          --sheet: #181d7a;
          --bone: #e8e9ff;
          --bone-soft: rgba(232, 233, 255, 0.78);
          --bone-faint: rgba(183, 188, 233, 0.6);
          --hairline: rgba(183, 188, 233, 0.2);
          --ember: #e0b768;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          min-height: 100svh;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(232, 233, 255, 0.045), transparent 34rem),
            radial-gradient(ellipse at 50% 110%, rgba(224, 183, 104, 0.05), transparent 40rem),
            var(--night);
          color: var(--bone);
          font-family: var(--font-body, system-ui), sans-serif;
          font-variant-numeric: oldstyle-nums;
          overflow-x: clip;
        }

        .night-plate::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          opacity: 0.06;
          mix-blend-mode: screen;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .night-plate > * {
          position: relative;
          z-index: 1;
        }

        .night-plate ::selection {
          background: rgba(224, 183, 104, 0.3);
        }

        .night-main {
          padding: clamp(4.2rem, 8vw, 6rem) clamp(1.1rem, 4vw, 3rem) clamp(3rem, 7vw, 5rem);
        }

        /* ── Night vocabulary ─────────────────────────────────── */
        .night-kicker {
          margin: 0 0 1rem;
          color: var(--ember);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          font-weight: 500;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .night-h1 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2.4rem, 5.6vw, 4rem);
          font-weight: 400;
          line-height: 1.03;
          color: var(--bone);
          text-wrap: balance;
        }

        .night-h2 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.6rem, 3.4vw, 2.3rem);
          font-weight: 500;
          line-height: 1.1;
          color: var(--bone);
        }

        .night-lead {
          color: var(--bone-soft);
          font-size: clamp(0.98rem, 1.5vw, 1.1rem);
          line-height: 1.68;
        }

        .night-caption {
          color: var(--bone-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .night-card {
          border: 1px solid var(--hairline);
          background: var(--sheet);
          padding: clamp(1.1rem, 2.5vw, 1.6rem);
        }

        .night-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.75rem 1.9rem;
          background: var(--bone);
          color: var(--night);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          /* Ember flood; transform belongs to the magnet rig. */
          background-image: linear-gradient(var(--ember), var(--ember));
          background-repeat: no-repeat;
          background-position: 0 100%;
          background-size: 100% 0%;
          transition: background-size 460ms cubic-bezier(0.3, 1.25, 0.4, 1), color 250ms var(--ease), box-shadow 250ms var(--ease), filter 250ms var(--ease);
        }

        .night-btn:hover,
        .night-btn:focus-visible {
          background-size: 100% 100%;
          color: var(--bone);
          /* lift lives in shadow+light — MagnetRig owns transform */
          box-shadow: 0 0.45rem 1.2rem rgba(0, 0, 0, 0.5);
          filter: brightness(1.06);
        }

        .night-btn:active {
          box-shadow: 0 0.1rem 0.3rem rgba(0, 0, 0, 0.55);
          filter: brightness(0.92);
          transition-duration: 80ms;
        }

        .night-btn:disabled {
          opacity: 0.4;
          cursor: default;
          transform: none;
        }

        .night-btn.ghost {
          background: transparent;
          color: var(--bone-soft);
          border: 1px solid var(--hairline);
        }

        .night-btn.ghost:hover,
        .night-btn.ghost:focus-visible {
          color: var(--bone);
          border-color: var(--ember);
          background: transparent;
        }

        .night-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--ember);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.35);
          padding-bottom: 0.25rem;
          background: none;
          cursor: pointer;
          transition: border-color 250ms var(--ease);
        }

        .night-link:hover,
        .night-link:focus-visible {
          border-color: var(--ember);
        }

        .night-input {
          width: 100%;
          padding: 0.75rem 0.95rem;
          background: var(--night-deep);
          border: 1px solid var(--hairline);
          border-radius: 0.35rem;
          color: var(--bone);
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.95rem;
        }

        .night-input::placeholder {
          color: var(--bone-faint);
        }

        .night-input:focus-visible {
          outline: 2px solid var(--ember);
          outline-offset: 2px;
        }

        .night-hairline-row {
          border-bottom: 1px solid var(--hairline);
        }

        .night-plate a:focus-visible,
        .night-plate button:focus-visible,
        .night-plate summary:focus-visible {
          outline: 2px solid var(--ember);
          outline-offset: 4px;
        }

        /* ── page-load reveal: the night rooms open the same way the
           light pages do — the kicker's tracked letters settle, the
           title inks in with a small rise. Hidden states only under
           no-preference: reduced motion renders instantly. */
        @media (prefers-reduced-motion: no-preference) {
          .night-kicker {
            opacity: 0;
            animation: night-track-in 640ms var(--ease) 160ms forwards;
          }
          .night-h1 {
            opacity: 0;
            animation: night-ink-in 620ms var(--ease) 260ms forwards;
          }
        }
        @keyframes night-track-in {
          from {
            opacity: 0;
            letter-spacing: 0.38em;
          }
          to {
            opacity: 1;
            letter-spacing: 0.3em;
          }
        }
        @keyframes night-ink-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .night-btn,
          .night-link {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
