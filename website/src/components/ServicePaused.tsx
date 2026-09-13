"use client";

import Link from "next/link";
import { TELEGRAM_BOT_URL } from "@/lib/service-status";
import { useLocale } from "@/lib/i18n/useLocale";
import MagnetRig from "@/components/almanac/MagnetRig";

interface ServicePausedProps {
  /** Serif headline — name the paused thing, not the outage. */
  title: string;
  /** One plain sentence. No apology, no ETA we cannot keep. */
  body: string;
}

/**
 * Shown where a flow depends on a backend that is currently down.
 *
 * Deliberately plain: a printed notice in the Personal-Almanac register —
 * bone paper, warm-black ink, one oxblood mark. States the situation and
 * points at the two paths that do work today. Renders on routes without
 * AlmanacShell, so it carries its own paper ground and tokens.
 */
export default function ServicePaused({ title, body }: ServicePausedProps) {
  const { locale } = useLocale();
  const isUk = locale === "uk";
  return (
    <div className="svcp">
      <MagnetRig />
      <div className="svcp-sheet">
        <div className="svcp-oxford" aria-hidden />
        <p className="svcp-orn" aria-hidden>
          ✦
        </p>
        <h1 className="svcp-title">{title}</h1>
        <p className="svcp-body">{body}</p>
        <p className="svcp-body svcp-vigil">
          {isUk
            ? "Інструменти охолоджені й накриті. Цієї ночі ніщо не набирається в шрифт — і ніщо не тарифікується."
            : "The instruments are cooled and hooded. Nothing is set in type tonight — and nothing is charged."}
        </p>
        <div className="svcp-actions">
          <Link href="/oracle-letter" className="svcp-btn">
            {isUk ? "Залишіть питання — лист вас знайде" : "Leave your question — the letter will find you"}
          </Link>
          <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer" className="svcp-alt">
            {isUk ? "Продовжити в Telegram" : "Continue in Telegram"}
          </a>
        </div>
        <p className="svcp-fine">
          {isUk ? "Щоденна карта, " : "The daily card, the "}
          <Link href="/daily" className="svcp-fine-link">
            {isUk ? "сьогоднішній лист" : "today's leaf"}
          </Link>
          {isUk ? " та " : ", and the "}
          <Link href="/academy" className="svcp-fine-link">
            {isUk ? "академія" : "academy"}
          </Link>{" "}
          {isUk ? "працюють без облікового запису. " : "work without an account. "}
          <Link href="/pricing" className="svcp-fine-link">
            {isUk ? "Постійна передплата на власне небо" : "A standing subscription to your own sky"}
          </Link>
          {isUk ? " — коли прес знову обертатиметься." : " — for when the press turns again."}
        </p>
      </div>

      <style jsx>{`
        .svcp {
          --paper: #10134d;
          --paper-bone: #181d7a;
          --ink: #e8e9ff;
          --ink-soft: rgba(232, 233, 255, 0.72);
          --ink-faint: rgba(183, 188, 233, 0.66);
          --hairline: rgba(232, 233, 255, 0.18);
          --ox: #e0b768;
          --ox-fill: #8d97ff;
          --ease: cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          z-index: 1;
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-body, system-ui), sans-serif;
          font-variant-numeric: oldstyle-nums;
        }

        /* Paper grain — one inline turbulence tile, multiply, whisper. */
        .svcp::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.05;
          mix-blend-mode: multiply;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='2'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        .svcp-sheet {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 26rem;
          padding: 0 2rem 2.2rem;
          text-align: center;
          background: #0f1240;
          border: 1px solid var(--hairline);
          box-shadow: 0 1.4rem 2.8rem rgba(4, 6, 32, 0.1);
        }

        /* Oxford rule: thick over thin — the notice's letterhead. */
        .svcp-oxford {
          height: 6px;
          margin: 0 -2rem;
          background: linear-gradient(180deg, var(--ink) 0 3px, transparent 3px 4.5px, var(--ink) 4.5px 5.5px, transparent 5.5px);
        }

        .svcp-orn {
          margin: 1.9rem 0 0.7rem;
          color: var(--ox);
          font-size: 1.1rem;
        }

        .svcp-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.7rem;
          font-weight: 400;
          line-height: 1.2;
          color: var(--ink);
          text-wrap: balance;
        }

        .svcp-vigil {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 0.98rem;
        }

        .svcp-body {
          margin: 0.85rem auto 0;
          max-width: 36ch;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .svcp-actions {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          margin-top: 1.7rem;
        }

        .svcp :global(.svcp-btn) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.8rem 1.6rem;
          background: var(--ink);
          color: #0d0e13;
          background-image: linear-gradient(to top, var(--ox-fill) 0%, var(--ox-fill) calc(100% - 3px), rgba(120, 45, 22, 0.9) 100%);
          background-repeat: no-repeat;
          background-position: 0 100%;
          background-size: 100% 0%;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          border-radius: 999px;
          transition: background-size 460ms cubic-bezier(0.3, 1.25, 0.4, 1), color 200ms var(--ease);
        }

        .svcp :global(.svcp-btn:hover),
        .svcp :global(.svcp-btn:focus-visible) {
          background-size: 100% 100%;
        }

        .svcp-alt {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.8rem 1.6rem;
          background: transparent;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          color: var(--ink-soft);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 250ms var(--ease), border-color 250ms var(--ease);
        }

        .svcp-alt:hover,
        .svcp-alt:focus-visible {
          color: var(--ox);
          border-color: var(--ox);
        }

        .svcp-fine {
          margin: 1.6rem auto 0;
          max-width: 34ch;
          color: var(--ink-faint);
          font-size: 0.72rem;
          line-height: 1.7;
        }

        .svcp :global(.svcp-fine-link) {
          color: var(--ox);
          text-decoration: none;
          border-bottom: 1px solid rgba(224, 183, 104, 0.3);
          transition: border-color 250ms var(--ease);
        }

        .svcp :global(.svcp-fine-link:hover),
        .svcp :global(.svcp-fine-link:focus-visible) {
          border-color: var(--ox);
        }

        .svcp :global(a:focus-visible) {
          outline: 2px solid var(--ox);
          outline-offset: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .svcp-alt,
          .svcp :global(.svcp-btn),
          .svcp :global(.svcp-fine-link) {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
