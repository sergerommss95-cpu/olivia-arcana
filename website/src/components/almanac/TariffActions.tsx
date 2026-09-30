"use client";

import CheckoutButton from "@/components/CheckoutButton";
import { PRICING, type PriceKey } from "@/lib/payments";
import { PAYMENTS_ENABLED } from "@/lib/service-status";

/**
 * The tariff's purchase rail. Renders nothing while the press is stopped
 * (PAYMENTS_ENABLED unset) — the page's prose already explains that state.
 * When payments turn on, each paid plan gets its monthly and annual plate.
 */
const PLANS: Array<{ name: string; tier: "insight" | "premium" | "vip" }> = [
  { name: "Insight", tier: "insight" },
  { name: "Astronomer", tier: "premium" },
  { name: "Patron", tier: "vip" },
];

export default function TariffActions() {
  if (!PAYMENTS_ENABLED) return null;

  return (
    <div className="ta-rail" aria-label="Subscribe">
      {PLANS.map((p) => (
        <div className="ta-plan" key={p.tier}>
          <div className="ta-head">
            <span className="ta-name">{p.name}</span>
            <span className="ta-price">
              ${PRICING[p.tier].monthly.toFixed(2)}<em>/mo</em>
            </span>
          </div>
          <CheckoutButton priceKey={`${p.tier}_monthly` as PriceKey} size="sm">
            Subscribe monthly
          </CheckoutButton>
          <CheckoutButton priceKey={`${p.tier}_annual` as PriceKey} variant="glass" size="sm">
            Annual — ${PRICING[p.tier].annual}
          </CheckoutButton>
        </div>
      ))}
      <style jsx>{`
        .ta-rail {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 22px 0 8px;
        }
        .ta-plan {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px 14px;
          border: 1px solid rgba(232, 233, 255, 0.16);
          background: rgba(11, 25, 42, 0.35);
        }
        .ta-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .ta-name {
          font-family: var(--font-heading), serif;
          font-size: 1.05rem;
          color: #e8e9ff;
        }
        .ta-price {
          font-family: var(--font-mono), monospace;
          font-size: 0.78rem;
          color: #e0b768;
        }
        .ta-price em {
          font-style: normal;
          color: rgba(183, 188, 233, 0.7);
        }
        @media (max-width: 720px) {
          .ta-rail {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
