/**
 * Life Timing — the table of years in the Personal Almanac.
 *
 * Slow outer-planet transits approaching the reader's chart, set as a
 * printed table: a ledger of counts, one engraved plate for the nearest
 * transit (Premium+), and a numbered register of what follows.
 */

"use client";

import React, { useState, useEffect } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import Paywall from "@/components/Paywall";
import { loadChart } from "@/lib/user-store";
import { computeLifeTransits, type LifeTransit } from "@/lib/life-timing-engine";
import { useLocale } from "@/lib/i18n/useLocale";
import type { NatalChart } from "@/lib/natal-chart";

type Sig = LifeTransit["significance"];

const COPY = {
  en: {
    kicker: "The table of years",
    title: "Life Timing",
    lead: "Major cosmic transits approaching your chart over the next three years.",
    noChartBody:
      "To reveal your major life transits, we need your birth chart first. Enter your birth data to to set the table of your years, the press needs your chart first.",
    noChartCta: "Create Your Portrait",
    loading: "Scanning your cosmic timeline…",
    statFound: "Transits found",
    statLife: "Life-changing",
    statNext: "Next in",
    now: "Now",
    daySuffix: "d",
    none: "—",
    heroLabel: "Next major transit",
    upcoming: "Upcoming timeline",
    sig: {
      "life-changing": "Life-changing",
      major: "Major",
      significant: "Significant",
    } as Record<Sig, string>,
    cycleLabel: "of cycle",
    days: "days",
    hrs: "hrs",
    min: "min",
    guidance: "Guidance",
    share: "Share",
    copied: "Copied!",
    active: "Active",
    natal: "natal",
    empty:
      "No major life transits detected in the next 3 years. Your cosmic weather is calm — a rare window for intentional building.",
  },
  uk: {
    kicker: "Таблиця років",
    title: "Часи життя",
    lead: "Головні транзити, що наближаються до вашої карти впродовж наступних трьох років.",
    noChartBody:
      "Щоб побачити ваші головні життєві транзити, спершу потрібна натальна карта. Введіть дані народження — і подивіться, що готує небо.",
    noChartCta: "Створити портрет",
    loading: "Скануємо вашу небесну стрічку…",
    statFound: "Знайдено транзитів",
    statLife: "Доленосних",
    statNext: "Наступний через",
    now: "Зараз",
    daySuffix: "д",
    none: "—",
    heroLabel: "Наступний головний транзит",
    upcoming: "Подальша стрічка",
    sig: {
      "life-changing": "Доленосний",
      major: "Головний",
      significant: "Значний",
    } as Record<Sig, string>,
    cycleLabel: "циклу",
    days: "дн",
    hrs: "год",
    min: "хв",
    guidance: "Порада",
    share: "Поділитися",
    copied: "Скопійовано!",
    active: "Активний",
    natal: "натальний",
    empty:
      "У найближчі 3 роки головних життєвих транзитів не виявлено. Ваша небесна погода спокійна — рідкісне вікно для свідомої розбудови.",
  },
};

const PLANET_GLYPHS: Record<string, string> = {
  Saturn: "♄",
  Jupiter: "♃",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
};

function toRoman(n: number): string {
  const table: Array<[number, string]> = [
    [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
  ];
  let out = "";
  let v = n;
  for (const [val, sym] of table) {
    while (v >= val) { out += sym; v -= val; }
  }
  return out;
}

function getCyclePercent(transit: LifeTransit): number {
  // Rough cycle durations in days
  const cycleDays: Record<string, number> = {
    Saturn: 29.457 * 365.25,
    Jupiter: 11.862 * 365.25,
    Uranus: 84.01 * 365.25,
    Neptune: 164.8 * 365.25,
    Pluto: 247.94 * 365.25,
  };

  const total = cycleDays[transit.transitPlanet] || 10000;
  const multipliers: Record<string, number> = {
    conjunction: 1,
    opposition: 0.5,
    square: 0.25,
  };
  const fraction = multipliers[transit.aspectType] || 1;
  const segmentDays = total * fraction;
  const elapsed = segmentDays - transit.daysUntil;
  return Math.max(0, Math.min(100, (elapsed / segmentDays) * 100));
}

/* ── The plate: nearest transit as an engraved card ────────────── */

function AlmanacLifeCard({ transit, locale }: { transit: LifeTransit; locale: string }) {
  const copy = locale === "uk" ? COPY.uk : COPY.en;
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function update() {
      const now = Date.now();
      const target = new Date(transit.estimatedDate).getTime();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setCountdown({ days, hours, minutes });
    }

    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [transit.estimatedDate]);

  const percent = getCyclePercent(transit);
  const glyph = PLANET_GLYPHS[transit.transitPlanet] || "✶";

  // Cycle ring, drawn as a hairline with an oxblood arc
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (percent / 100) * circumference;

  function handleShare() {
    const text = `${transit.name} is approaching on ${transit.estimatedDate}.\n${transit.description}\n\nAdvice: ${transit.advice}\n\n-- Olivia Arcana`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="lc alm-card">
      <div className="lc-grid">
        {/* Cycle ring */}
        <figure className="lc-ring">
          <svg width={120} height={120} viewBox="0 0 120 120" aria-hidden="true">
            <circle cx={60} cy={60} r={radius} fill="none" stroke="var(--hairline)" strokeWidth={1.5} />
            <circle
              cx={60}
              cy={60}
              r={radius}
              fill="none"
              stroke="var(--ox)"
              strokeWidth={2.5}
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="lc-ring-center">
            <span className="lc-glyph" aria-hidden>{glyph}</span>
            <figcaption className="alm-caption">
              {Math.round(percent)}% {copy.cycleLabel}
            </figcaption>
          </div>
        </figure>

        {/* Content */}
        <div className="lc-body">
          <div className="lc-tags">
            <span className={`lc-sig ${transit.significance === "life-changing" ? "hi" : ""}`}>
              {copy.sig[transit.significance]}
            </span>
            <span className="alm-caption">{transit.lifeArea}</span>
          </div>

          <h3 className="alm-h2 lc-name">{transit.name}</h3>

          {/* Countdown */}
          <div className="lc-count">
            {[
              { value: countdown.days, label: copy.days },
              { value: countdown.hours, label: copy.hrs },
              { value: countdown.minutes, label: copy.min },
            ].map((unit) => (
              <div key={unit.label} className="lc-unit">
                <span className="lc-unit-val">{unit.value}</span>
                <span className="alm-caption">{unit.label}</span>
              </div>
            ))}
          </div>

          <p className="lc-desc">{transit.description}</p>

          {/* Advice */}
          <div className="lc-advice">
            <span className="lc-advice-label alm-caption">{copy.guidance}</span>
            <p className="lc-advice-text">{transit.advice}</p>
          </div>

          {/* Aspect + date + share */}
          <div className="lc-foot">
            <span className="alm-caption">
              {transit.transitPlanet} {transit.aspectType} {copy.natal} {transit.natalPlanet}
            </span>
            <span className="alm-caption">~{transit.estimatedDate}</span>
            <button type="button" className="alm-link lc-share" onClick={handleShare}>
              {copied ? copy.copied : copy.share}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .lc-grid {
          display: flex;
          gap: 1.8rem;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .lc-ring {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0;
          flex-shrink: 0;
          color: var(--ink);
        }

        .lc-ring-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.2rem;
          text-align: center;
        }

        .lc-glyph {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.6rem;
          line-height: 1;
        }

        .lc-body {
          flex: 1;
          min-width: 240px;
        }

        .lc-tags {
          display: flex;
          align-items: baseline;
          gap: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .lc-sig {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-soft);
          border: 1px solid var(--hairline);
          padding: 0.2rem 0.6rem;
        }

        .lc-sig.hi {
          color: var(--ox);
          border-color: rgba(224, 183, 104, 0.45);
        }

        .lc-name {
          margin: 0 0 0.9rem;
        }

        .lc-count {
          display: flex;
          gap: 1.4rem;
          margin-bottom: 1rem;
        }

        .lc-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.2rem;
        }

        .lc-unit-val {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1;
          color: var(--ink);
          font-variant-numeric: lining-nums tabular-nums;
        }

        .lc-desc {
          margin: 0 0 1rem;
          max-width: 58ch;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        .lc-advice {
          padding: 0.85rem 1rem;
          border-left: 2px solid var(--ox);
          background: rgba(250, 246, 236, 0.6);
          margin-bottom: 1rem;
        }

        .lc-advice-label {
          color: var(--ox);
        }

        .lc-advice-text {
          margin: 0.35rem 0 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.05rem;
          font-style: italic;
          line-height: 1.55;
          color: var(--ink);
        }

        .lc-foot {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .lc-share {
          margin-left: auto;
        }
      `}</style>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────── */

export default function TimingPage() {
  const { locale } = useLocale();
  const copy = locale === "uk" ? COPY.uk : COPY.en;

  const [mounted, setMounted] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [transits, setTransits] = useState<LifeTransit[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const storedChart = loadChart();
      if (storedChart) {
        setChart(storedChart);
        const result = computeLifeTransits(storedChart);
        setTransits(result);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const nearest = transits?.[0] || null;
  const rest = transits ? transits.slice(1) : [];

  return (
    <AlmanacShell>
      <div className="timing">
        {mounted && !loading && !chart && (
          /* ── No chart yet ── */
          <div className="tm-center">
            <p className="alm-kicker">{copy.kicker}</p>
            <h1 className="alm-h1">{copy.title}</h1>
            <p className="alm-lead tm-nochart-body">{copy.noChartBody}</p>
            <TransitionLink href="/portrait" className="alm-btn">
              {copy.noChartCta}
            </TransitionLink>
          </div>
        )}

        {mounted && chart && (loading || !transits) && (
          /* ── Loading ── */
          <div className="tm-center">
            <p className="alm-caption tm-loading">{copy.loading}</p>
          </div>
        )}

        {mounted && chart && !loading && transits && (
          <>
            <header className="tm-head">
              <p className="alm-kicker">{copy.kicker}</p>
              <h1 className="alm-h1">{copy.title}</h1>
              <p className="alm-lead tm-lead">{copy.lead}</p>
            </header>

            {/* Ledger */}
            <div className="tm-stats">
              <div className="tm-stat">
                <span className="tm-stat-label">{copy.statFound}</span>
                <span className="tm-leader" aria-hidden />
                <span className="tm-stat-val">{transits.length}</span>
              </div>
              <div className="tm-stat">
                <span className="tm-stat-label">{copy.statLife}</span>
                <span className="tm-leader" aria-hidden />
                <span className="tm-stat-val ox">
                  {transits.filter((t) => t.significance === "life-changing").length}
                </span>
              </div>
              <div className="tm-stat">
                <span className="tm-stat-label">{copy.statNext}</span>
                <span className="tm-leader" aria-hidden />
                <span className="tm-stat-val ox">
                  {nearest
                    ? nearest.daysUntil <= 0
                      ? copy.now
                      : `${nearest.daysUntil}${copy.daySuffix}`
                    : copy.none}
                </span>
              </div>
            </div>

            {/* Hero — nearest transit (Premium+) */}
            {nearest && (
              <section className="tm-hero" aria-label={copy.heroLabel}>
                <p className="alm-caption tm-section-label">{copy.heroLabel}</p>
                <div className="alm-gate">
                  <Paywall requires="premium" priceKey="premium_monthly" featureName="major life-transit forecasts">
                    <AlmanacLifeCard transit={nearest} locale={locale} />
                  </Paywall>
                </div>
              </section>
            )}

            {/* Numbered register of remaining transits */}
            {rest.length > 0 && (
              <section aria-label={copy.upcoming}>
                <p className="alm-caption tm-section-label">{copy.upcoming}</p>
                <div className="tm-rows">
                  {rest.map((transit, i) => (
                    <div key={`${transit.name}-${transit.estimatedDate}`} className="tm-row">
                      <span className="tm-no" aria-hidden>{toRoman(i + 1)}</span>
                      <span className="tm-glyph" aria-hidden>
                        {PLANET_GLYPHS[transit.transitPlanet] || "✶"}
                      </span>
                      <div className="tm-info">
                        <span className="tm-name">{transit.name}</span>
                        <span className={`tm-sig ${transit.significance === "life-changing" ? "hi" : ""}`}>
                          {copy.sig[transit.significance]}
                        </span>
                        <span className="tm-sub alm-caption">
                          {transit.lifeArea} &middot; {transit.transitPlanet} {transit.aspectType}{" "}
                          {copy.natal} {transit.natalPlanet}
                        </span>
                      </div>
                      <span className="tm-leader" aria-hidden />
                      <div className="tm-when">
                        <span className={`tm-days ${transit.daysUntil <= 0 ? "hi" : ""}`}>
                          {transit.daysUntil <= 0 ? copy.active : `${transit.daysUntil}${copy.daySuffix}`}
                        </span>
                        <span className="alm-caption">{transit.estimatedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {transits.length === 0 && (
              <div className="alm-card tm-empty">
                <span aria-hidden>&#10087;</span>
                <p>{copy.empty}</p>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .timing {
          max-width: 56rem;
          margin: 0 auto;
        }

        .tm-center {
          min-height: 40vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .tm-nochart-body {
          margin: 1.1rem auto 1.8rem;
          max-width: 44ch;
        }

        .tm-loading {
          letter-spacing: 0.3em;
        }

        .tm-head {
          margin-bottom: 2rem;
        }

        .tm-lead {
          margin: 1rem 0 0;
          max-width: 48ch;
        }

        .tm-stats {
          border-top: 3px solid var(--ink);
          margin-bottom: 2.4rem;
        }

        .tm-stat {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 0.75rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .tm-stat-label {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .tm-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .tm-stat-val {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
        }

        .tm-stat-val.ox {
          color: var(--ox);
        }

        .tm-section-label {
          margin: 0 0 0.8rem;
        }

        .tm-hero {
          margin-bottom: 2.4rem;
        }

        .tm-rows {
          border-top: 3px solid var(--ink);
        }

        .tm-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 0.95rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .tm-no {
          flex: 0 0 2rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.12em;
          color: var(--ink-faint);
        }

        .tm-glyph {
          flex: 0 0 1.4rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.1rem;
          color: var(--ink-soft);
          text-align: center;
        }

        .tm-info {
          display: flex;
          align-items: baseline;
          gap: 0.7rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .tm-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.12rem;
          font-weight: 500;
          color: var(--ink);
        }

        .tm-sig {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          border: 1px solid var(--hairline);
          padding: 0.12rem 0.45rem;
          white-space: nowrap;
        }

        .tm-sig.hi {
          color: var(--ox);
          border-color: rgba(224, 183, 104, 0.45);
        }

        .tm-sub {
          flex: 1 1 100%;
        }

        .tm-when {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.15rem;
        }

        .tm-days {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--ink);
          font-variant-numeric: lining-nums tabular-nums;
        }

        .tm-days.hi {
          color: var(--ox);
        }

        .tm-empty {
          text-align: center;
          padding: 2.6rem 1.6rem;
        }

        .tm-empty span {
          display: block;
          margin-bottom: 0.7rem;
          color: var(--ox);
          font-size: 1.1rem;
        }

        .tm-empty p {
          margin: 0 auto;
          max-width: 48ch;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        /* ── Paywall gate, re-inked ─────────────────────────── */
        .alm-gate :global(.glass-card) {
          background: #0f1240 !important;
          border: 1px solid var(--hairline) !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          color: var(--ink);
        }

        .alm-gate :global(.glass-card h3) {
          color: var(--ink) !important;
          font-family: var(--font-heading, "Cormorant Garamond"), serif !important;
          font-weight: 500;
        }

        .alm-gate :global([class*="text-muted-lavender"]) {
          color: var(--ink-soft) !important;
        }

        .alm-gate :global(.glass-card button) {
          background: var(--ink) !important;
          color: #f6f1e5 !important;
          border: none !important;
          box-shadow: none !important;
          text-shadow: none !important;
          border-radius: 999px;
        }

        .alm-gate :global(.glass-card button:hover) {
          background: var(--ox) !important;
        }

        .alm-gate :global(.glass-card [class*="mb-"]) {
          display: none !important;
        }

        .alm-gate :global(.animate-pulse div) {
          background: rgba(232, 233, 255, 0.07) !important;
        }

        .alm-gate :global(.text-red-400) {
          color: var(--ox) !important;
        }

        @media (max-width: 640px) {
          .tm-leader {
            display: none;
          }

          .tm-row {
            flex-wrap: wrap;
          }

          .tm-when {
            margin-left: auto;
            flex-direction: row;
            align-items: baseline;
            gap: 0.6rem;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
