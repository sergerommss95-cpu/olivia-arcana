"use client";

/**
 * TariffTable — the almanac's price table with dot leaders, monthly and
 * annual columns. Prices come from the single source of truth in
 * lib/payments so the page can never drift from checkout.
 */

import { PLANS, featuresOf } from "@/lib/plans";

const ROWS = PLANS.map((plan) => ({
  name: plan.name,
  what: featuresOf(plan.tier).map((f) => f.name).join(" · "),
  monthly: plan.monthly,
  annual: plan.annual,
}));

export default function TariffTable() {
  return (
    <div className="alm-tariff">
      <div className="alm-tariff-head" aria-hidden>
        <span />
        <span className="alm-tariff-col">monthly</span>
        <span className="alm-tariff-col">annual</span>
      </div>
      {ROWS.map((row) => (
        <div key={row.name} className="alm-tariff-row">
          <span className="alm-tariff-name">{row.name}</span>
          <span className="alm-tariff-what">{row.what}</span>
          <span className="alm-tariff-leader" aria-hidden />
          <span className="alm-tariff-price">{row.monthly ? `$${row.monthly.toFixed(2)}` : "0"}</span>
          <span className="alm-tariff-price annual">{row.annual ? `$${row.annual.toFixed(2)} / yr` : "—"}</span>
        </div>
      ))}

      <style jsx global>{`
        .alm-tariff {
          margin: 2rem 0 2.4rem;
          border-top: 3px solid var(--ink, #e8dcc8);
        }

        .alm-tariff-head {
          display: flex;
          justify-content: flex-end;
          gap: 1.4rem;
          padding: 0.5rem 0.2rem 0.15rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.56rem;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--ink-faint, rgba(232, 233, 255, 0.45));
        }

        .alm-tariff-col {
          min-width: 5.2rem;
          text-align: right;
        }

        .alm-tariff-row {
          display: flex;
          align-items: baseline;
          gap: 1.1rem;
          padding: 0.95rem 0.2rem;
          border-bottom: 1px solid var(--hairline, rgba(232, 233, 255, 0.18));
        }

        .alm-tariff-name {
          flex: 0 0 6.5rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--ink, #e8dcc8);
        }

        .alm-tariff-what {
          flex: 0 1 auto;
          color: var(--ink-soft, rgba(232, 233, 255, 0.72));
          font-size: 0.9rem;
        }

        .alm-tariff-leader {
          flex: 1 1 auto;
          min-width: 1.6rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .alm-tariff-price {
          flex: 0 0 auto;
          min-width: 5.2rem;
          text-align: right;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.8rem;
          font-variant-numeric: lining-nums tabular-nums;
          color: var(--ink, #e8dcc8);
          white-space: nowrap;
        }

        .alm-tariff-price.annual {
          color: var(--ink-soft, rgba(232, 233, 255, 0.72));
        }

        @media (max-width: 640px) {
          .alm-tariff-row {
            flex-wrap: wrap;
            row-gap: 0.15rem;
          }
          .alm-tariff-what {
            flex: 1 1 100%;
            order: 4;
          }
          .alm-tariff-head {
            display: none;
          }
          .alm-tariff-price.annual {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
