/**
 * Transits — the ephemeris page of the Personal Almanac.
 *
 * Planetary movements against the reader's natal chart, set as a printed
 * register: a ledger of counts, significance filters, and a dated table
 * whose rows open into full entries. All computation unchanged.
 */

"use client";

import React, { useState, useEffect } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import Paywall from "@/components/Paywall";
import { loadChart } from "@/lib/user-store";
import { computeTransits, type Transit, type Significance } from "@/lib/transit-calculator";
import { useLocale } from "@/lib/i18n/useLocale";
import type { NatalChart } from "@/lib/natal-chart";

const COPY = {
  en: {
    kicker: "The ephemeris",
    title: "Transit Timeline",
    lead: "Planetary movements activating your natal chart.",
    noChartBody:
      "To see your personal transits, we need your birth chart first. Enter your birth data to open your timeline of transits.",
    noChartCta: "Create Your Portrait",
    loading: "Computing your transits…",
    statTotal: "Total transits",
    statMonth: "This month",
    statNext: "Next major",
    now: "Now",
    daySuffix: "d",
    none: "—",
    sig: { high: "Major", medium: "Moderate", low: "Minor" } as Record<Significance, string>,
    listed: "listed",
    thWhen: "Exact",
    thTransit: "Transit",
    thWeight: "Weight",
    active: "Active",
    exact: "Exact",
    orb: "Orb",
    close: "Close",
    empty: "No transits match your filter.",
    natal: "natal",
  },
  uk: {
    kicker: "Ефемерида",
    title: "Стрічка транзитів",
    lead: "Рухи планет, що активують вашу натальну карту.",
    noChartBody:
      "Щоб побачити ваші особисті транзити, спершу потрібна натальна карта. Введіть дані народження, щоб відкрити свою небесну стрічку.",
    noChartCta: "Створити портрет",
    loading: "Обчислюємо ваші транзити…",
    statTotal: "Транзитів усього",
    statMonth: "Цього місяця",
    statNext: "Наступний головний",
    now: "Зараз",
    daySuffix: "д",
    none: "—",
    sig: { high: "Головні", medium: "Помірні", low: "Дрібні" } as Record<Significance, string>,
    listed: "у переліку",
    thWhen: "Точно",
    thTransit: "Транзит",
    thWeight: "Вага",
    active: "Активний",
    exact: "Точно",
    orb: "Орб",
    close: "Закрити",
    empty: "Жодного транзиту за цим фільтром.",
    natal: "натальн.",
  },
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/* ── The register table ────────────────────────────────────────── */

function TransitRegister({ transits, locale }: { transits: Transit[]; locale: string }) {
  const copy = locale === "uk" ? COPY.uk : COPY.en;
  const localeTag = locale === "uk" ? "uk-UA" : "en";

  const [selected, setSelected] = useState<Transit | null>(null);
  const [filters, setFilters] = useState<Record<Significance, boolean>>({
    high: true,
    medium: true,
    low: true,
  });

  const formatDate = (d: Date) => d.toLocaleDateString(localeTag, { month: "short", day: "numeric" });
  const formatRange = (s: Date, e: Date) => {
    const a = formatDate(s);
    const b = formatDate(e);
    return a === b ? a : `${a} — ${b}`;
  };

  const filtered = transits
    .filter((tr) => filters[tr.significance])
    .sort((a, b) => a.exactDate.getTime() - b.exactDate.getTime());

  const toggleFilter = (sig: Significance) =>
    setFilters((prev) => ({ ...prev, [sig]: !prev[sig] }));

  return (
    <div className="reg">
      {/* Filters */}
      <div className="reg-filters">
        {(["high", "medium", "low"] as Significance[]).map((sig) => (
          <button
            type="button"
            key={sig}
            onClick={() => toggleFilter(sig)}
            aria-pressed={filters[sig]}
            className={`reg-filter ${filters[sig] ? "on" : ""}`}
          >
            {copy.sig[sig]}
          </button>
        ))}
        <span className="reg-count alm-caption">
          {filtered.length} {copy.listed}
        </span>
      </div>

      {/* Table */}
      <div className="reg-table">
        <div className="reg-thead" aria-hidden>
          <span className="reg-th when">{copy.thWhen}</span>
          <span className="reg-th">{copy.thTransit}</span>
          <span className="reg-th weight">{copy.thWeight}</span>
        </div>

        {filtered.length === 0 && <p className="reg-empty alm-caption">{copy.empty}</p>}

        {filtered.map((tr) => {
          const isSel = selected === tr;
          const key = `${tr.transitPlanet}-${tr.natalPlanet}-${tr.aspectType}-${tr.exactDate.getTime()}`;
          return (
            <React.Fragment key={key}>
              <button
                type="button"
                className={`reg-row ${isSel ? "sel" : ""}`}
                onClick={() => setSelected(isSel ? null : tr)}
                aria-expanded={isSel}
              >
                <span className="reg-date">
                  {tr.exactBeyondWindow ? `${formatDate(tr.exactDate)} →` : formatDate(tr.exactDate)}
                </span>
                <span className="reg-name">
                  <span className="reg-glyph" aria-hidden>{tr.transitGlyph}</span>{" "}
                  {tr.transitPlanet} {tr.aspectType} {tr.natalPlanet}{" "}
                  <span className="reg-glyph" aria-hidden>{tr.natalGlyph}</span>
                </span>
                <span className="reg-leader" aria-hidden />
                <span className={`reg-sig ${tr.significance === "high" ? "hi" : ""}`}>
                  {copy.sig[tr.significance]}
                </span>
              </button>

              {isSel && (
                <div className="reg-detail">
                  <p className="reg-desc">{tr.description}</p>
                  <div className="reg-meta">
                    <div>
                      <span className="alm-caption">{copy.active}</span>
                      <span className="reg-meta-val">{formatRange(tr.startDate, tr.endDate)}</span>
                    </div>
                    <div>
                      <span className="alm-caption">{copy.exact}</span>
                      <span className="reg-meta-val">
                        {tr.exactBeyondWindow ? tr.exactLabel : formatDate(tr.exactDate)}
                      </span>
                    </div>
                    <div>
                      <span className="alm-caption">{copy.orb}</span>
                      <span className="reg-meta-val">{tr.minOrb}&deg;</span>
                    </div>
                  </div>
                  <button type="button" className="alm-link" onClick={() => setSelected(null)}>
                    {copy.close}
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style jsx>{`
        .reg-filters {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.5rem 1.4rem;
          margin-bottom: 1rem;
        }

        .reg-filter {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          padding: 0.35rem 0.1rem 0.45rem;
          cursor: pointer;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-faint);
          text-decoration: line-through;
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .reg-filter.on {
          color: var(--ink);
          text-decoration: none;
          border-bottom-color: var(--ox);
        }

        .reg-filter:hover {
          color: var(--ox);
        }

        .reg-count {
          margin-left: auto;
        }

        .reg-table {
          border-top: 3px solid var(--ink);
        }

        .reg-thead {
          display: flex;
          gap: 1rem;
          padding: 0.55rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .reg-th {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .reg-th.when {
          flex: 0 0 4.6rem;
        }

        .reg-th.weight {
          margin-left: auto;
        }

        .reg-empty {
          margin: 0;
          padding: 1.6rem 0.2rem;
          text-align: center;
        }

        .reg-row {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          width: 100%;
          padding: 0.85rem 0.2rem;
          background: none;
          border: none;
          border-bottom: 1px solid var(--hairline);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 200ms var(--ease);
        }

        .reg-row:hover {
          background: rgba(250, 246, 236, 0.6);
        }

        .reg-row.sel {
          background: rgba(250, 246, 236, 0.6);
          box-shadow: inset 2px 0 0 var(--ox);
        }

        .reg-date {
          flex: 0 0 4.6rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          font-variant-numeric: lining-nums tabular-nums;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .reg-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.12rem;
          font-weight: 500;
          color: var(--ink);
        }

        .reg-glyph {
          color: var(--ink-soft);
        }

        .reg-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .reg-sig {
          flex: 0 0 auto;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          white-space: nowrap;
        }

        .reg-sig.hi {
          color: var(--ox);
        }

        .reg-detail {
          padding: 1.1rem 0.9rem 1.3rem;
          border-bottom: 1px solid var(--hairline);
          background: rgba(250, 246, 236, 0.6);
          box-shadow: inset 2px 0 0 var(--ox);
        }

        .reg-desc {
          margin: 0 0 1rem;
          max-width: 58ch;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.68;
        }

        .reg-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1.1rem;
        }

        .reg-meta-val {
          display: block;
          margin-top: 0.25rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.02rem;
          color: var(--ink);
        }

        @media (max-width: 640px) {
          .reg-row {
            flex-wrap: wrap;
            row-gap: 0.15rem;
          }

          .reg-name {
            flex: 1 1 100%;
            order: 3;
          }

          .reg-leader {
            display: none;
          }

          .reg-sig {
            margin-left: auto;
          }

          .reg-meta {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reg-filter,
          .reg-row {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

/* ── The page ──────────────────────────────────────────────────── */

export default function TransitsPage() {
  const { locale } = useLocale();
  const copy = locale === "uk" ? COPY.uk : COPY.en;

  const [mounted, setMounted] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [transits, setTransits] = useState<Transit[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
      const storedChart = loadChart();
      if (storedChart) {
        setChart(storedChart);
        // Compute transits (can be CPU-intensive, so defer a tick)
        setTimeout(() => {
          const result = computeTransits(storedChart, 6);
          setTransits(result);
          setLoading(false);
        }, 50);
      } else {
        setLoading(false);
      }
    });
  }, []);

  // Stats
  const now = new Date();
  const thisMonth = (transits ?? []).filter((tr) => {
    const m = tr.exactDate.getMonth();
    const y = tr.exactDate.getFullYear();
    return m === now.getMonth() && y === now.getFullYear();
  });

  const nextMajor = (transits ?? []).find(
    (tr) => tr.significance === "high" && tr.exactDate.getTime() > now.getTime()
  );
  const daysToMajor = nextMajor ? daysBetween(now, nextMajor.exactDate) : null;

  return (
    <AlmanacShell>
      <div className="transits">
        {mounted && !loading && !chart && (
          /* ── No chart yet ── */
          <div className="tr-center">
            <p className="alm-kicker">{copy.kicker}</p>
            <h1 className="alm-h1">{copy.title}</h1>
            <p className="alm-lead tr-nochart-body">{copy.noChartBody}</p>
            <TransitionLink href="/portrait" className="alm-btn">
              {copy.noChartCta}
            </TransitionLink>
          </div>
        )}

        {mounted && chart && (loading || !transits) && (
          /* ── Loading ── */
          <div className="tr-center">
            <p className="alm-caption tr-loading">{copy.loading}</p>
          </div>
        )}

        {mounted && chart && !loading && transits && (
          <>
            <header className="tr-head">
              <p className="alm-kicker">{copy.kicker}</p>
              <h1 className="alm-h1">{copy.title}</h1>
              <p className="alm-lead tr-lead">{copy.lead}</p>
            </header>

            {/* Ledger */}
            <div className="tr-stats">
              <div className="tr-stat">
                <span className="tr-stat-label">{copy.statTotal}</span>
                <span className="tr-leader" aria-hidden />
                <span className="tr-stat-val">{transits.length}</span>
              </div>
              <div className="tr-stat">
                <span className="tr-stat-label">{copy.statMonth}</span>
                <span className="tr-leader" aria-hidden />
                <span className="tr-stat-val">{thisMonth.length}</span>
              </div>
              <div className="tr-stat">
                <span className="tr-stat-label">{copy.statNext}</span>
                <span className="tr-leader" aria-hidden />
                <span className="tr-stat-val ox">
                  {daysToMajor !== null
                    ? daysToMajor <= 0
                      ? copy.now
                      : `${daysToMajor}${copy.daySuffix}`
                    : copy.none}
                  {nextMajor && (
                    <span className="tr-stat-sub">
                      {" "}&mdash; {nextMajor.transitPlanet} {nextMajor.aspectType} {nextMajor.natalPlanet}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Register — gated for Insight+ */}
            <div className="alm-gate">
              <Paywall requires="insight" priceKey="insight_monthly" featureName="your transit timeline">
                <TransitRegister transits={transits} locale={locale} />
              </Paywall>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .transits {
          max-width: 56rem;
          margin: 0 auto;
        }

        .tr-center {
          min-height: 40vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .tr-nochart-body {
          margin: 1.1rem auto 1.8rem;
          max-width: 44ch;
        }

        .tr-loading {
          letter-spacing: 0.3em;
        }

        .tr-head {
          margin-bottom: 2rem;
        }

        .tr-lead {
          margin: 1rem 0 0;
          max-width: 48ch;
        }

        .tr-stats {
          border-top: 3px solid var(--ink);
          margin-bottom: 2.4rem;
        }

        .tr-stat {
          display: flex;
          align-items: baseline;
          gap: 1rem;
          padding: 0.75rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .tr-stat-label {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-soft);
          white-space: nowrap;
        }

        .tr-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .tr-stat-val {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--ink);
          text-align: right;
        }

        .tr-stat-val.ox {
          color: var(--ox);
        }

        .tr-stat-sub {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.78rem;
          font-weight: 400;
          color: var(--ink-soft);
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
      `}</style>
    </AlmanacShell>
  );
}
