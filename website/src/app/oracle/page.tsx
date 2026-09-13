/**
 * OraclePage — the innermost night room.
 *
 * The night plate register: bone ink on the deepest darkness, hairlines,
 * one ember accent. The deck ritual (focus → drawing → interpreting) is
 * unchanged — only the room around it has been re-inked.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import NightShell from "@/components/almanac/NightShell";
import OracleMist from "@/components/arrival/OracleMist";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/useLocale";

function OracleLoading() {
  const { locale } = useLocale();
  return (
    <div className="flex items-center justify-center h-full">
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
      {!started && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center">
          <p className="night-kicker">
            {isUk ? "Одне питання · Чотири розклади" : "One question · Four spreads"}
          </p>
          <h1 className="night-h1 max-w-[12ch]">
            {isUk ? (
              <>Запитай <em>Оракула</em></>
            ) : (
              <>Ask the <em>Oracle</em></>
            )}
          </h1>
          <p className="night-lead max-w-xs mt-5 mb-9">
            {isUk
              ? "Від трьох карт до Кельтського хреста — для питання, яке ви принесли."
              : "From three cards to the Celtic Cross — for the question you bring."}
          </p>
          <button onClick={() => setStarted(true)} className="night-btn">
            {isUk ? "Почати читання" : "Start the reading"}
          </button>
        </div>
      )}

      {started && (
        <div className="absolute inset-0 z-10">
          <FramerTarotOracle />
        </div>
      )}
    </>
  );
}

export default function OraclePage() {
  const [mounted, setMounted] = useState(false);
  const { locale } = useLocale();
  const isUk = locale === "uk";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#0a0d38]" />;

  return (
    <NightShell room={isUk ? "Стіл розкладів" : "The Dealing Table"}>
      <div className="oracle-stage fixed inset-0 overflow-hidden select-none">
        {/* the table's mist — parts around the reader's hand, then heals */}
        <OracleMist className="absolute inset-0 z-0" />
        <Suspense fallback={<div />}>
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
      `}</style>
    </NightShell>
  );
}
