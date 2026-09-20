/**
 * /checkout/success — the return page after payment, set in the Personal
 * Almanac print register.
 *
 * Reads the purchased price key from ?price= or from the pending-checkout
 * contract key, then polls the subscription ledger until the webhook has
 * landed. Confirms the actual purchase by name; if confirmation has not
 * arrived within ~20s (or the API is unreachable) it says so honestly and
 * points to the billing page — it never claims a tier it cannot verify.
 */

"use client";

import { useEffect, useState } from "react";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import { useSubscription } from "@/hooks/useSubscription";
import { PENDING_CHECKOUT_KEY } from "@/components/CheckoutButton";
import {
  ADDONS,
  getSubscriptionStatus,
  tierLabel,
  type PriceKey,
  type SubscriptionStatus,
  type Tier,
} from "@/lib/payments";

const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 4000; // 6 attempts ≈ 20s total
const PENDING_TTL_MS = 60 * 60 * 1000; // contract: intent expires after 60 min

function isPriceKey(value: string): value is PriceKey {
  return /^(insight|premium|vip)_(monthly|annual)$/.test(value) || value in ADDONS;
}

function isAddonKey(key: PriceKey): key is keyof typeof ADDONS {
  return key in ADDONS;
}

/** Resolve the purchased key: URL param first, then the parked intent. */
function resolvePriceKey(): PriceKey | null {
  const fromUrl = new URLSearchParams(window.location.search).get("price");
  if (fromUrl && isPriceKey(fromUrl)) return fromUrl;
  try {
    const raw = localStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" && parsed !== null &&
      typeof (parsed as { price?: unknown }).price === "string" &&
      typeof (parsed as { ts?: unknown }).ts === "number" &&
      Date.now() - (parsed as { ts: number }).ts < PENDING_TTL_MS &&
      isPriceKey((parsed as { price: string }).price)
    ) {
      return (parsed as { price: PriceKey }).price;
    }
  } catch {
    // Unreadable storage or malformed intent — fall through.
  }
  return null;
}

/**
 * The line the ledger prints once the purchase is verified — or null if
 * this status does not yet confirm it. Names come from the status itself,
 * never from what the buyer hoped for.
 */
function confirmedLabel(status: SubscriptionStatus, key: PriceKey | null): string | null {
  if (key && isAddonKey(key)) {
    const readingType = key.replace(/^addon_/, "");
    const owned = status.purchases.some(
      (p) => p.reading_type === readingType || p.reading_type === key
    );
    return owned ? ADDONS[key].name : null;
  }
  if (key) {
    // Subscription key — confirmed only when the ledger shows that tier.
    const boughtTier = key.split("_")[0] as Tier;
    const cycle = key.endsWith("_annual") ? "annual" : "monthly";
    return status.tier === boughtTier ? `${tierLabel(status.tier)} — ${cycle}` : null;
  }
  // No key survived — confirm whatever paid tier the ledger reports.
  return status.is_paid ? tierLabel(status.tier) : null;
}

type Phase = "checking" | "confirmed" | "processing";

export default function CheckoutSuccessPage() {
  const { refresh } = useSubscription();
  const [phase, setPhase] = useState<Phase>("checking");
  const [purchased, setPurchased] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const key = resolvePriceKey();

    (async () => {
      for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
        try {
          const status = await getSubscriptionStatus();
          if (cancelled) return;
          const label = confirmedLabel(status, key);
          if (label) {
            try {
              localStorage.removeItem(PENDING_CHECKOUT_KEY); // contract: clear after use
            } catch {}
            setPurchased(label);
            setPhase("confirmed");
            refresh(); // sync the global subscription context (badges etc.)
            return;
          }
        } catch {
          // API unreachable or not signed in — keep polling, then be honest.
        }
        if (attempt < POLL_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          if (cancelled) return;
        }
      }
      if (!cancelled) setPhase("processing");
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AlmanacShell narrow>
      <div className="ck">
        <div className="ck-card alm-card">
          <div className="ck-mark" aria-hidden>✦</div>

          {phase === "confirmed" ? (
            <>
              <h1 className="alm-h1 ck-title">Order Confirmed</h1>
              <p className="ck-body">
                The ledger records your purchase. It is yours from this moment.
              </p>
              <ul className="ck-list">
                <li>
                  <span className="ck-check" aria-hidden>✓</span>
                  {purchased}
                </li>
              </ul>
              <div className="ck-actions">
                <TransitionLink href="/portrait" className="alm-btn">
                  Get Your Personal Reading
                </TransitionLink>
                <TransitionLink href="/" className="alm-link">
                  Back to Home
                </TransitionLink>
              </div>
            </>
          ) : phase === "processing" ? (
            <>
              <h1 className="alm-h1 ck-title">Payment Received</h1>
              <p className="ck-body">
                Confirmation can take a minute to reach us. Your purchase will
                appear on your billing page as soon as it is recorded — nothing
                further is needed from you.
              </p>
              <div className="ck-actions">
                <TransitionLink href="/account/billing" className="alm-btn">
                  Check Billing
                </TransitionLink>
                <TransitionLink href="/" className="alm-link">
                  Back to Home
                </TransitionLink>
              </div>
            </>
          ) : (
            <>
              <h1 className="alm-h1 ck-title">Confirming Your Order</h1>
              <p className="ck-body">
                One moment — the ledger is being written.
              </p>
              <div className="ck-spinner-wrap" role="status" aria-label="Confirming your order">
                <svg className="ck-spinner" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="ck-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="ck-spinner-head" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              </div>
            </>
          )}
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

        .ck-spinner-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 0.6rem;
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
