/**
 * /checkout/cancel — Checkout abandoned, no charge made. Set in the
 * Personal Almanac print register with reassurance notes ledger-style.
 */

"use client";

import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";

export default function CheckoutCancelPage() {
  return (
    <AlmanacShell narrow>
      <div className="ck">
        <div className="ck-card alm-card">
          <div className="ck-mark" aria-hidden>&#9790;</div>

          <h1 className="alm-h1 ck-title">No charge — and no worries</h1>

          <p className="ck-body">
            Your card was not charged. The free tier is still here for you, and you can come back to
            upgrade any time.
          </p>

          <ul className="ck-list">
            <li>
              <span className="ck-star" aria-hidden>✦</span>
              <span>14-day refund on subscriptions, no questions</span>
            </li>
            <li>
              <span className="ck-star" aria-hidden>✦</span>
              <span>
                Cancel any time from <a href="/account/billing" className="ck-inline-link">/account/billing</a>
              </span>
            </li>
            <li>
              <span className="ck-star" aria-hidden>✦</span>
              <span>Pay via Paddle (web) or Telegram Stars</span>
            </li>
          </ul>

          <div className="ck-actions">
            <TransitionLink href="/#pricing" className="alm-btn">
              See plans again
            </TransitionLink>
            <TransitionLink href="/" className="alm-link">
              Back to home
            </TransitionLink>
          </div>

          <p className="ck-foot">
            Questions? <a href="/contact" className="ck-inline-link">Contact us</a> or{" "}
            <a
              href="https://t.me/OliviaArcanaBot"
              target="_blank"
              rel="noopener noreferrer"
              className="ck-inline-link"
            >
              message us on Telegram
            </a>
            .
          </p>
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
          font-size: 2.2rem;
          line-height: 1;
        }

        .ck-title {
          font-size: clamp(1.7rem, 3.6vw, 2.2rem);
          margin-bottom: 0.85rem;
        }

        .ck-body {
          margin: 0 0 1.6rem;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.65;
        }

        .ck-list {
          list-style: none;
          margin: 0 auto 1.8rem;
          padding: 0;
          max-width: 21rem;
          text-align: left;
          border-top: 1px solid var(--hairline);
        }

        .ck-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          padding: 0.6rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          color: var(--ink-soft);
          font-size: 0.82rem;
          line-height: 1.55;
        }

        .ck-star {
          flex: 0 0 auto;
          margin-top: 0.05rem;
          color: var(--ox);
        }

        .ck-inline-link {
          color: var(--ox);
          text-decoration: underline;
          text-decoration-color: rgba(224, 183, 104, 0.35);
          text-underline-offset: 2px;
          transition: text-decoration-color 200ms var(--ease);
        }

        .ck-inline-link:hover {
          text-decoration-color: var(--ox);
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

        .ck-foot {
          margin: 1.8rem 0 0;
          color: var(--ink-faint);
          font-size: 0.78rem;
          line-height: 1.6;
        }

        @media (prefers-reduced-motion: reduce) {
          .ck-inline-link {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
