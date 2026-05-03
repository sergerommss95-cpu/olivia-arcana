/**
 * CosmicField.tsx — the house-standard form input primitive.
 *
 * Consumes:
 *   - label:  rendered above the input (always visible, not floating)
 *   - hint:   optional muted helper line below
 *   - error:  optional error message; if present, sets aria-invalid and
 *             wires aria-describedby to the message id so screen readers
 *             announce it on focus.
 *   - any other <input> HTML attribute flows through.
 *
 * Visual:
 *   - Ivory text, ivory placeholder (not lavender-muted — placeholders
 *     need to stay readable on the cosmic void background)
 *   - 1px var(--c-border) base → gold on :focus-visible with soft halo
 *   - Pill-rounded radius for short text, rounded-md for longer (set via
 *     the `size` prop)
 *
 * No internal state — fully controlled by the parent via value/onChange.
 */

"use client";

import React, { forwardRef, useId } from "react";

type Size = "sm" | "md";

export interface CosmicFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string | null;
  /** "sm" for compact pill (e.g. MM/DD), "md" for full-width form field. Default md. */
  size?: Size;
  /** Visually hide the label but keep it for screen readers. Default false. */
  labelHidden?: boolean;
  /** Extra className to attach to the outer wrapper. */
  wrapperClassName?: string;
}

const CosmicField = forwardRef<HTMLInputElement, CosmicFieldProps>(function CosmicField(
  {
    label,
    hint,
    error,
    size = "md",
    labelHidden = false,
    wrapperClassName = "",
    id,
    ...inputProps
  },
  ref
) {
  const reactId = useId();
  const inputId = id ?? `cosmic-field-${reactId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const invalid = Boolean(error);

  return (
    <div className={`cosmic-field cosmic-field-${size} ${wrapperClassName}`}>
      <label
        htmlFor={inputId}
        className={`cosmic-field-label ${labelHidden ? "cosmic-field-label-sr" : ""}`}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`cosmic-field-input ${invalid ? "cosmic-field-input-invalid" : ""}`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && !error && (
        <p id={hintId} className="cosmic-field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="cosmic-field-error" role="alert">
          {error}
        </p>
      )}

      <style>{`
        .cosmic-field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          width: 100%;
        }
        .cosmic-field-label {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--c-gold);
          opacity: 0.85;
        }
        .cosmic-field-label-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        .cosmic-field-input {
          width: 100%;
          font-family: var(--font-heading, "Cormorant Garamond"), Georgia, serif;
          font-size: 1.1rem;
          letter-spacing: 0.04em;
          color: rgba(245, 240, 232, 0.95);
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          padding: 0.75rem 1.15rem;
          min-height: 48px;
          outline: none;
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
          transition:
            border-color 240ms var(--ease-ritual, cubic-bezier(0.16, 1, 0.3, 1)),
            box-shadow 240ms var(--ease-ritual, cubic-bezier(0.16, 1, 0.3, 1)),
            background 240ms var(--ease-ritual, cubic-bezier(0.16, 1, 0.3, 1));
        }
        .cosmic-field-sm .cosmic-field-input {
          font-size: 1rem;
          padding: 0.6rem 1rem;
          min-height: 44px;
          letter-spacing: 0.08em;
        }
        .cosmic-field-md .cosmic-field-input {
          border-radius: 0.9rem;
        }
        .cosmic-field-input::placeholder {
          color: rgba(245, 240, 232, 0.5);
          font-style: italic;
        }
        .cosmic-field-input:focus-visible {
          border-color: rgba(232, 201, 106, 0.7);
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.14);
          background: rgba(255, 255, 255, 0.06);
        }
        .cosmic-field-input-invalid,
        .cosmic-field-input-invalid:focus-visible {
          border-color: rgba(232, 82, 74, 0.75);
          box-shadow: 0 0 0 4px rgba(232, 82, 74, 0.14);
        }
        .cosmic-field-hint {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.82rem;
          line-height: 1.4;
          color: var(--c-text-secondary);
          margin: 0;
        }
        .cosmic-field-error {
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.8rem;
          line-height: 1.4;
          color: rgba(232, 82, 74, 0.95);
          margin: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .cosmic-field-input {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
});

export default CosmicField;
