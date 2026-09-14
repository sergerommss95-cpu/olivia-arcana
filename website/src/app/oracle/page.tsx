/**
 * OraclePage — the innermost night room.
 *
 * The night plate register: bone ink on the deepest darkness, hairlines,
 * one ember accent. The deck ritual (focus → drawing → interpreting) is
 * unchanged — only the room around it has been re-inked.
 */

"use client";

import { useState, Suspense } from "react";
import NightShell from "@/components/almanac/NightShell";
import OracleFrontispiece from "@/components/oracle/OracleFrontispiece";
import OracleMist from "@/components/arrival/OracleMist";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/useLocale";

function OracleLoading() {
  const { locale } = useLocale();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center h-full" role="status">
      <div className="night-caption animate-pulse">
        {locale === "uk" ? "Розкладаємо колоду…" : "Laying out the deck…"}
      </div>
    </div>
  );
}

const FramerTarotOracle = dynamic(() => import("@/components/oracle/FramerTarotOracle"), {
  ssr: false,
  loading: () => <OracleLoading />,
});

function OracleContainer() {
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const hasDraw = searchParams.get("draw") !== null;
  const [started, setStarted] = useState(hasDraw);
  const isUk = locale === "uk";

  return (
    <>
      {!started && <OracleFrontispiece uk={isUk} onBegin={() => setStarted(true)} />}

      {started && (
        <div className="absolute inset-0 z-10">
          <FramerTarotOracle />
        </div>
      )}
    </>
  );
}

export default function OraclePage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";


  return (
    <NightShell room={isUk ? "Стіл розкладів" : "The Dealing Table"}>
      <div className="oracle-stage fixed inset-0 overflow-hidden">
        {/* the table's mist — parts around the reader's hand, then heals */}
        <OracleMist className="absolute inset-0 z-0" />
        <Suspense fallback={<OracleLoading />}>
          <OracleContainer />
        </Suspense>
      </div>

      <style jsx global>{`
        body {
          background: #0a0d38;
          cursor: default;
          overflow: hidden;
        }
        .oracle-stage {
          background: var(--night-deep, #0a0d38);
        }

        /* ── The first screen breathes: each line inks in, in order ── */
        .oracle-arrive > * {
          opacity: 0;
          transform: translateY(6px);
          animation: oracle-ink 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .oracle-arrive > *:nth-child(1) { animation-delay: 60ms; }
        .oracle-arrive > *:nth-child(2) { animation-delay: 180ms; }
        .oracle-arrive > *:nth-child(3) { animation-delay: 320ms; }
        .oracle-arrive > *:nth-child(4) { animation-delay: 460ms; }
        .oracle-arrive > *:nth-child(5) { animation-delay: 640ms; }

        @keyframes oracle-ink {
          to {
            opacity: 1;
            transform: none;
          }
        }

        /* the CTA's gilt rule draws itself once the button has landed */
        .oracle-cta-rule {
          display: block;
          width: 7rem;
          height: 1px;
          margin-top: 1.15rem;
          background: linear-gradient(90deg, transparent, #e0b768, transparent);
          transform: scaleX(0);
          transform-origin: 50% 50%;
          animation: oracle-rule-draw 700ms cubic-bezier(0.16, 1, 0.3, 1) 760ms forwards;
          opacity: 0.75;
        }

        @keyframes oracle-rule-draw {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        @media (prefers-reduced-motion: reduce) {
          .oracle-arrive > * {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .oracle-cta-rule {
            animation: none;
            transform: scaleX(1);
          }
        }
      `}</style>
    </NightShell>
  );
}
