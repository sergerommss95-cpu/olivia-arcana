"use client";

/**
 * PlanGate — the one gate in the almanac.
 *
 * Every paid leaf asks this component whether the reader may pass. It
 * answers from lib/plans, which means:
 *   · while the press is stopped (PAYWALL_ENABLED off) everything opens,
 *     and the leaf wears a quiet ribbon saying which plan it will belong
 *     to — honest, and it teaches the tariff before it charges for it;
 *   · when the press turns, the same gate closes with no page rewritten.
 */

import React from "react";
import TransitionLink from "@/components/transitions/TransitionLink";
import { useSubscription } from "@/hooks/useSubscription";
import { entitlementFor, type FeatureId } from "@/lib/plans";

interface Props {
  feature: FeatureId;
  children: React.ReactNode;
  /** Hide the "will belong to …" ribbon (for pages that say it themselves). */
  quiet?: boolean;
}

export default function PlanGate({ feature, children, quiet = false }: Props) {
  const { tier } = useSubscription();
  const ent = entitlementFor(feature, tier);

  if (ent.allowed) {
    return (
      <>
        {ent.openWhilePaused && !quiet && (
          <p className="pg-ribbon">
            <span className="pg-mark" aria-hidden>✦</span>
            Open to everyone while the press is stopped — this leaf will belong to{" "}
            <TransitionLink href="/pricing" className="pg-link">{ent.requiredPlan.name}</TransitionLink>.
            <style jsx>{`
              .pg-ribbon {
                margin: 0 0 1.4rem;
                padding: 0.6rem 0.9rem;
                border-radius: 12px;
                background: linear-gradient(160deg, rgba(183, 188, 233, 0.1) 0%, rgba(32, 39, 120, 0.2) 100%);
                -webkit-backdrop-filter: blur(14px) saturate(140%);
                backdrop-filter: blur(14px) saturate(140%);
                box-shadow: inset 0 1px 0 rgba(226, 230, 255, 0.16);
                font-family: var(--font-mono, ui-monospace), monospace;
                font-size: 0.6rem;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--ink-faint, rgba(183, 188, 233, 0.66));
                text-align: center;
              }
              .pg-mark {
                color: var(--ox, #e0b768);
                margin-right: 0.5em;
              }
              .pg-ribbon :global(.pg-link) {
                color: var(--ox, #e0b768);
                text-decoration: none;
                border-bottom: 1px solid rgba(224, 183, 104, 0.4);
              }
              .pg-ribbon :global(.pg-link:hover) {
                border-bottom-color: var(--ox, #e0b768);
              }
            `}</style>
          </p>
        )}
        {children}
      </>
    );
  }

  // The press is running and this reader does not hold the plan.
  return (
    <div className="pg-closed alm-card">
      <p className="pg-kicker">
        <span aria-hidden>✦</span> {ent.requiredPlan.name}
      </p>
      <h2 className="pg-title">{ent.feature.name}</h2>
      <p className="pg-note">{ent.feature.note}</p>
      <TransitionLink href="/pricing" className="alm-btn">
        See the Tariff
      </TransitionLink>

      <style jsx>{`
        .pg-closed {
          display: grid;
          justify-items: center;
          gap: 0.7rem;
          text-align: center;
          padding: clamp(2rem, 5vw, 3.2rem) 1.4rem;
          max-width: 34rem;
          margin: 0 auto;
        }
        .pg-kicker {
          margin: 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--ox, #e0b768);
        }
        .pg-title {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-weight: 500;
          font-size: clamp(1.7rem, 4vw, 2.4rem);
          color: var(--ink, #e8e9ff);
        }
        .pg-note {
          margin: 0 0 0.6rem;
          max-width: 30rem;
          color: var(--ink-soft, rgba(232, 233, 255, 0.78));
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
