"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { useLocale } from "@/lib/i18n/useLocale";
import { useSubscription } from "@/hooks/useSubscription";
import { tierLabel, statusLabel } from "@/lib/payments";
import { getSession } from "@/lib/supabase";
import CheckoutButton from "@/components/CheckoutButton";
import ServicePaused from "@/components/ServicePaused";
import { ACCOUNTS_ENABLED, PAYMENTS_ENABLED } from "@/lib/service-status";

export default function BillingPage() {
  const { locale } = useLocale();
  const isUk = locale === "uk";
  const { data, isLoading, isVip, tier, manageSubscription, refresh } = useSubscription();
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const billingLive = ACCOUNTS_ENABLED && PAYMENTS_ENABLED;

  useEffect(() => {
    if (!billingLive) return;
    (async () => {
      const session = await getSession();
      setSignedIn(!!session);
      setAuthChecked(true);
    })();
    refresh();
  }, [refresh, billingLive]);

  if (!billingLive) {
    return (
      <ServicePaused
        title={isUk ? "Оплату призупинено" : "Billing is paused"}
        body={isUk ? "Плани й рахунки недоступні, поки ми перебудовуємо платіжну систему. Ніщо не тарифікується." : "Plans and invoices are unavailable while we rebuild the payment backend. Nothing is being charged."}
      />
    );
  }

  return (
    <AlmanacShell narrow>
      <div className="billing">
        {isLoading || !authChecked ? (
          <div className="billing-wait" aria-hidden>
            <span className="wait-ring" />
          </div>
        ) : !signedIn ? (
          <div className="gate">
            <p className="gate-orn" aria-hidden>
              ✦
            </p>
            <h1 className="gate-title">Manage your billing</h1>
            <p className="gate-body">
              Sign in to see your plan, change tier, or download invoices. Your subscription lives with your Google
              account.
            </p>
            <div className="gate-actions">
              <Link href="/login" className="alm-btn">
                Sign in
              </Link>
              <Link href="/#pricing" className="gate-alt">
                See pricing
              </Link>
            </div>
            <div>
              <Link href="/" className="gate-back">
                ← Back home
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="alm-kicker billing-kicker">
              {isUk ? "ВАШІ ВІДНОСИНИ З ДРУКАРНЕЮ" : "YOUR STANDING WITH THE PRESS"}
            </p>
            <h1 className="billing-title">Billing &amp; Subscription</h1>

            {/* Current Plan */}
            <section className={`alm-card plan-card ${isVip ? "is-vip" : ""}`}>
              <div className="plan-head">
                <h2 className="plan-h2">Current Plan</h2>
                <span className={`tier-chip ${tier === "vip" ? "is-ox" : ""}`}>
                  {tier === "vip" ? (
                    <>
                      ✧ VIP
                      {data?.status === "trialing" && " (trial)"}
                    </>
                  ) : (
                    "Free"
                  )}
                </span>
              </div>

              <div className="plan-rows">
                <div className="plan-row">
                  <span className="row-label">Tier</span>
                  <span className="row-leader" aria-hidden />
                  <span className="row-value">{tierLabel(tier)}</span>
                </div>
                {data && data.status !== "none" && (
                  <>
                    <div className="plan-row">
                      <span className="row-label">Status</span>
                      <span className="row-leader" aria-hidden />
                      <span
                        className={`row-value ${
                          data.status === "active" || data.status === "trialing" ? "" : "is-alert"
                        }`}
                      >
                        {statusLabel(data.status)}
                      </span>
                    </div>
                    {data.period_end && (
                      <div className="plan-row">
                        <span className="row-label">
                          {data.cancel_at_period_end ? "Access until" : "Next billing"}
                        </span>
                        <span className="row-leader" aria-hidden />
                        <span className="row-value">
                          {new Date(data.period_end).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {data.cancel_at_period_end && (
                      <p className="plan-note">Your subscription will end at the end of the current period.</p>
                    )}
                  </>
                )}
              </div>

              <div className="plan-action">
                {isVip ? (
                  <button type="button" className="alm-btn plan-btn" onClick={() => manageSubscription()}>
                    Manage Subscription
                  </button>
                ) : (
                  <CheckoutButton priceKey="premium_monthly" variant="gold" size="md" className="w-full justify-center">
                    Upgrade to Premium &mdash; $14.99/mo
                  </CheckoutButton>
                )}
              </div>
            </section>

            {/* Purchase History */}
            {data && data.purchases.length > 0 && (
              <section className="alm-card purchases-card">
                <h2 className="plan-h2">Reading Purchases</h2>
                <div className="purchase-list">
                  {data.purchases.map((purchase) => (
                    <div key={purchase.id} className="purchase-row">
                      <div>
                        <p className="purchase-name">{purchase.reading_type.replace(/_/g, " ")}</p>
                        {purchase.created_at && (
                          <p className="purchase-date">{new Date(purchase.created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      {purchase.has_content ? (
                        <span className="purchase-ready">&#10003; Ready</span>
                      ) : (
                        <span className="purchase-pending">Processing...</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Back link */}
            <div className="billing-back">
              <Link href="/profile" className="alm-link">
                Back to Profile
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .billing-wait {
          display: flex;
          justify-content: center;
          padding: 6rem 0;
        }

        .wait-ring {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          border: 2px solid var(--hairline);
          border-top-color: var(--ox);
          animation: billing-spin 0.9s linear infinite;
        }

        @keyframes billing-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* ── Signed-out gate ─────────────────────────────────── */
        .gate {
          padding: clamp(2rem, 6vw, 4rem) 0;
          text-align: center;
        }

        .gate-orn {
          margin: 0 0 0.8rem;
          color: var(--ox);
          font-size: 1.4rem;
        }

        .gate-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.8rem, 5vw, 2.6rem);
          font-weight: 400;
          line-height: 1.15;
          color: var(--ink);
          text-wrap: balance;
        }

        .gate-body {
          margin: 1rem auto 0;
          max-width: 42ch;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.65;
        }

        .gate-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.8rem;
          margin-top: 1.75rem;
        }

        .billing :global(.gate-alt) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 3rem;
          padding: 0.75rem 1.9rem;
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

        .billing :global(.gate-alt:hover),
        .billing :global(.gate-alt:focus-visible) {
          color: var(--ox);
          border-color: var(--ox);
        }

        .billing :global(.gate-back) {
          display: inline-block;
          margin-top: 1.6rem;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.64rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .billing :global(.gate-back:hover) {
          color: var(--ox);
        }

        /* ── The ledger ──────────────────────────────────────── */
        .billing-kicker {
          margin-bottom: 0.5rem;
        }

        .billing-title {
          margin: 0 0 1.6rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(1.9rem, 4.6vw, 2.6rem);
          font-weight: 400;
          line-height: 1.1;
          color: var(--ink);
        }

        .plan-card {
          background: #0f1240;
        }

        .plan-card.is-vip {
          border-color: rgba(224, 183, 104, 0.45);
        }

        .plan-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.9rem;
          margin-bottom: 0.4rem;
          border-bottom: 1px solid var(--hairline);
        }

        .plan-h2 {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.45rem;
          font-weight: 500;
          color: var(--ink);
        }

        .tier-chip {
          padding: 0.28rem 0.75rem;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          color: var(--ink-soft);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .tier-chip.is-ox {
          color: var(--ox);
          border-color: rgba(224, 183, 104, 0.45);
        }

        .plan-row {
          display: flex;
          align-items: baseline;
          gap: 0.9rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--hairline);
        }

        .row-label {
          flex: 0 0 auto;
          color: var(--ink-soft);
          font-size: 0.88rem;
        }

        /* Dot leaders — the ledger's connective tissue. */
        .row-leader {
          flex: 1 1 auto;
          min-width: 2rem;
          border-bottom: 1.5px dotted rgba(232, 233, 255, 0.35);
          transform: translateY(-0.28em);
        }

        .row-value {
          flex: 0 0 auto;
          color: var(--ink);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.8rem;
          letter-spacing: 0.04em;
          font-variant-numeric: lining-nums tabular-nums;
          white-space: nowrap;
        }

        .row-value.is-alert {
          color: var(--ox);
        }

        .plan-note {
          margin: 0.8rem 0 0;
          color: var(--ox);
          font-size: 0.78rem;
          line-height: 1.5;
        }

        .plan-action {
          margin-top: 1.6rem;
        }

        .billing :global(.plan-btn) {
          width: 100%;
        }

        .purchases-card {
          background: #0f1240;
          margin-top: 1.5rem;
        }

        .purchase-list {
          margin-top: 0.9rem;
          border-top: 1px solid var(--hairline);
        }

        .purchase-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 0.7rem 0;
          border-bottom: 1px solid var(--hairline);
        }

        .purchase-row:last-child {
          border-bottom: none;
        }

        .purchase-name {
          margin: 0;
          color: var(--ink);
          font-size: 0.9rem;
          text-transform: capitalize;
        }

        .purchase-date {
          margin: 0.15rem 0 0;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.12em;
        }

        .purchase-ready {
          color: var(--ink);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .purchase-pending {
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .billing-back {
          margin-top: 2rem;
          text-align: center;
        }

        @media (prefers-reduced-motion: reduce) {
          .wait-ring {
            animation: none;
          }
          .billing :global(.gate-alt),
          .billing :global(.gate-back) {
            transition: none !important;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
