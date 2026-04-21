/**
 * AbToggle.tsx — floating 3-way pill for switching between A, B, C.
 *
 * A = /     — current (Sprint 1+2)
 * B = /v2   — inline veil (real Three.js cloth, constrained)
 * C = /v3   — shader atmosphere + living paper card (no veil at all)
 *
 * Shown fixed bottom-right. Current mode is highlighted in gold;
 * others are ghost cells that act as links. Keyboard accessible,
 * honors reduced-motion.
 */

"use client";

import React from "react";

type Mode = "a" | "b" | "c";

const VARIANTS: { id: Mode; label: string; href: string; title: string }[] = [
  { id: "a", label: "v1", href: "/",   title: "Current site" },
  { id: "b", label: "v2", href: "/v2", title: "Inline veil" },
  { id: "c", label: "v3", href: "/v3", title: "Living paper" },
];

export default function AbToggle({ mode }: { mode: Mode }) {
  return (
    <div
      className="abt"
      role="tablist"
      aria-label="A/B/C design comparison"
    >
      <span className="abt-eyebrow" aria-hidden>Design</span>
      <div className="abt-cells">
        {VARIANTS.map((v) => {
          const active = v.id === mode;
          return (
            <a
              key={v.id}
              href={active ? undefined : v.href}
              className={`abt-cell${active ? " abt-cell-active" : ""}`}
              title={v.title}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              tabIndex={active ? -1 : 0}
            >
              {v.label}
            </a>
          );
        })}
      </div>
      <style>{`
        .abt {
          position: fixed;
          bottom: clamp(1rem, 2.5vw, 1.75rem);
          right: clamp(1rem, 2.5vw, 1.75rem);
          z-index: 9998;
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.55rem 0.7rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.78);
          -webkit-backdrop-filter: blur(14px) saturate(1.3);
          backdrop-filter: blur(14px) saturate(1.3);
          border: 1px solid rgba(212, 175, 55, 0.38);
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.45),
            0 0 22px rgba(212, 175, 55, 0.12);
        }
        .abt-eyebrow {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.56rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(196, 185, 228, 0.65);
          padding-left: 0.25rem;
        }
        .abt-cells {
          display: inline-flex;
          gap: 0.2rem;
          padding: 0.15rem;
          border-radius: 9999px;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(200, 185, 255, 0.08);
        }
        .abt-cell {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 2.1rem;
          padding: 0.35rem 0.7rem;
          border-radius: 9999px;
          font-family: var(--font-mono, "IBM Plex Mono"), monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: rgba(220, 210, 245, 0.55);
          text-decoration: none;
          transition:
            background 220ms cubic-bezier(0.16, 1, 0.3, 1),
            color     220ms cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .abt-cell:hover {
          color: rgba(245, 240, 232, 0.92);
          background: rgba(255, 255, 255, 0.04);
        }
        .abt-cell-active {
          color: var(--c-void, #06041a);
          background: linear-gradient(135deg, #E8C96A, #D4AF37);
          cursor: default;
          pointer-events: none;
          box-shadow: 0 0 14px rgba(212, 175, 55, 0.35);
        }
        .abt-cell:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .abt-cell { transition: none; }
        }
        @media (max-width: 480px) {
          .abt { gap: 0.4rem; padding: 0.45rem 0.55rem; }
          .abt-eyebrow { display: none; }
          .abt-cell { min-width: 1.9rem; padding: 0.3rem 0.55rem; font-size: 0.66rem; }
        }
      `}</style>
    </div>
  );
}
