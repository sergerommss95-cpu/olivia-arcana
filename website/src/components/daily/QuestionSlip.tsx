"use client";

/**
 * The reading's closing question on the homepage's paper slip: the one ivory surface on the page, small,
 * tilted and framed, kept apart from the card of the day so it never reads as that card's answer. It is
 * set down once when first seen (opacity and half a degree of rotation); otherwise it never moves.
 */

import { useRef } from "react";
import { useEntry } from "./useEntry";
import d from "./daily.module.css";

export default function QuestionSlip({ label, question }: { label: string; question: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useEntry(ref);
  return (
    <div className={d.slip} ref={ref} data-entry={entry}>
      <p className={d.slipLabel}>{label}</p>
      <p className={d.slipQ}>{question}</p>
      <span className={d.slipLine} aria-hidden />
      <span className={d.slipMark} aria-hidden>?</span>
    </div>
  );
}
