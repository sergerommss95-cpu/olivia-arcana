/**
 * /checkout/success — Post-Stripe return page, set in the Personal Almanac
 * print register. Confirms the subscription (webhook refresh preserved)
 * and lists what the new tier unlocks, ledger-style.
 */

"use client";

import { useEffect, useState } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import { useSubscription } from "@/hooks/useSubscription";
import VipBadge from "@/components/VipBadge";

const UNLOCKED = [
  "Unlimited conversations with Olivia",
  "Daily personalized readings",
  "Real-time transit alerts",
  "Full compatibility reports",
  "Monthly Celtic Cross reading",
];

export default function CheckoutSuccessPage() {
  const { refresh } = useSubscription();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Refresh subscription status after returning from Stripe
    const timer = setTimeout(async () => {
      await refresh();
      setLoaded(true);
    }, 1500); // Small delay for webhook to process
    return () => clearTimeout(timer);
  }, [refresh]);

  return (
    <AlmanacShell narrow>
      <div className="ck">
        <div className="ck-card alm-card">
          <div className="ck-mark" aria-hidden>✦</div>

          <h1 className="alm-h1 ck-title">Welcome to VIP</h1>

          <p className="ck-body">
            Your cosmic journey just leveled up. All premium features are now unlocked.
          </p>

          {loaded ? (
            <div className="ck-badge">
              <VipBadge showFree />
            </div>
          ) : (
            <div className="ck-spinner-wrap" role="status">
              <svg className="ck-spinner" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="ck-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="ck-spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}

          {/* What's unlocked */}
          <ul className="ck-list">
            {UNLOCKED.map((item) => (
              <li key={item}>
                <span className="ck-check" aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="ck-actions">
            <TransitionLink href="/portrait" className="alm-btn">
              Get Your Personal Reading
            </TransitionLink>
            <TransitionLink href="/" className="alm-link">
              Back to Home
            </TransitionLink>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ck {
          display: flex;
          justify-content: center;
          padding: clamp(1rem, 4vw, 3rem) 0;
        }

        .ck-card {
          width: 100%;
          max-width: 28rem;
          padding: clamp(2rem, 5vw, 2.8rem) clamp(1.5rem, 4vw, 2.2rem);
          background: #0f1240;
          text-align: center;
        }

        .ck-mark {
          margin-bottom: 1.4rem;
          color: var(--ox);
          font-size: 2.4rem;
          line-height: 1;
        }

        .ck-title {
          font-size: clamp(1.9rem, 4vw, 2.5rem);
          margin-bottom: 0.85rem;
        }

        .ck-body {
          margin: 0 0 1.6rem;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.65;
        }

        .ck-badge {
          margin-bottom: 2rem;
        }

        .ck-spinner-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
          color: var(--ox);
        }

        .ck-spinner {
          width: 1.25rem;
          height: 1.25rem;
          animation: ck-spin 1s linear infinite;
        }

        .ck-spinner-track {
          opacity: 0.25;
        }

        .ck-spinner-head {
          opacity: 0.75;
        }

        @keyframes ck-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .ck-list {
          list-style: none;
          margin: 0 0 2rem;
          padding: 0;
          text-align: left;
          border-top: 1px solid var(--hairline);
        }

        .ck-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.7rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          color: var(--ink-soft);
          font-size: 0.88rem;
          line-height: 1.55;
        }

        .ck-check {
          flex: 0 0 auto;
          margin-top: 0.05rem;
          color: var(--ox);
          font-weight: 700;
        }

        .ck-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.1rem;
        }

        .ck-actions :global(.alm-btn) {
          width: 100%;
        }

        @media (prefers-reduced-motion: reduce) {
          .ck-spinner {
            animation: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
