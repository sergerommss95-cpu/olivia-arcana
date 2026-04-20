/**
 * AbToggle.tsx — floating pill that switches between the current homepage
 * ("A") and the Sprint 3 preview ("B") at /v2.
 *
 * Shown fixed bottom-right. On /  → "Preview v2 →" linking to /v2.
 * On /v2 → "← Back to current" linking to /. Keyboard accessible, honors
 * reduced-motion.
 *
 * Used only during the A/B review phase. Remove (or hide) when Sprint 3
 * lands for real.
 */

"use client";

import React from "react";

export default function AbToggle({
  mode,
}: {
  mode: "a" | "b";
}) {
  const href = mode === "a" ? "/v2" : "/";
  const label = mode === "a" ? "Preview v2 →" : "← Back to current";
  const sublabel = mode === "a" ? "Sprint 3 proposal" : "Current site";

  return (
    <a
      href={href}
      className="ab-toggle"
      aria-label={mode === "a" ? "Preview Sprint 3 version" : "Return to current version"}
    >
      <span className="ab-toggle-sublabel">{sublabel}</span>
      <span className="ab-toggle-label">{label}</span>
      <style>{`
        .ab-toggle {
          position: fixed;
          bottom: clamp(1rem, 2.5vw, 1.75rem);
          right: clamp(1rem, 2.5vw, 1.75rem);
          z-index: 9998;
          display: inline-flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.1rem;
          padding: 0.65rem 1.1rem;
          border-radius: 9999px;
          background: rgba(6, 4, 26, 0.78);
          -webkit-backdrop-filter: blur(14px) saturate(1.3);
          backdrop-filter: blur(14px) saturate(1.3);
          border: 1px solid rgba(212, 175, 55, 0.38);
          color: rgba(240, 236, 255, 0.92);
          text-decoration: none;
          box-shadow:
            0 8px 30px rgba(0, 0, 0, 0.45),
            0 0 22px rgba(212, 175, 55, 0.14);
          transition:
            transform 250ms cubic-bezier(0.16, 1, 0.3, 1),
            border-color 200ms ease,
            box-shadow 200ms ease;
        }
        .ab-toggle:hover {
          transform: translateY(-2px);
          border-color: rgba(232, 201, 106, 0.7);
          box-shadow:
            0 14px 40px rgba(0, 0, 0, 0.5),
            0 0 36px rgba(212, 175, 55, 0.24);
        }
        .ab-toggle:focus-visible {
          outline: 2px solid #E8C96A;
          outline-offset: 3px;
        }
        .ab-toggle-sublabel {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.6rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(196, 185, 228, 0.7);
          line-height: 1;
        }
        .ab-toggle-label {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.05rem;
          color: rgba(232, 201, 106, 0.95);
          line-height: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .ab-toggle {
            transition: none;
          }
          .ab-toggle:hover {
            transform: none;
          }
        }
        @media (max-width: 480px) {
          .ab-toggle {
            padding: 0.5rem 0.85rem;
          }
          .ab-toggle-sublabel {
            font-size: 0.54rem;
          }
          .ab-toggle-label {
            font-size: 0.95rem;
          }
        }
      `}</style>
    </a>
  );
}
