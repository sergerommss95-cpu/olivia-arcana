"use client";

/**
 * Choosing the sign. A reader who already has one sees a single filled lapis row (BRAND.md secondary
 * action) that opens the twelve chips; a first visit sees the chips open under "Choose your sign". The
 * mode is fixed for the visit, so the chips never move under the pointer once a sign is chosen, and focus
 * stays on the pressed chip. Before the visit is known (the prerender) only the row's height is reserved.
 */

import { useId, useState } from "react";
import { SIGNS, SIGN_GLYPHS } from "@/lib/astrology/chart.js";
import d from "./daily.module.css";

type Sign = (typeof SIGNS)[number];
const TEXT = "︎"; // text presentation, so the glyphs never turn into emoji

export default function SignControl({ mode, sign, names, onChoose, labels }: {
  /** "pending" before mount (reserved height only), "compact" for a known sign, "open" for a first visit. */
  mode: "pending" | "compact" | "open";
  sign: Sign | null;
  names: Record<string, string>;
  onChoose: (sign: Sign) => void;
  labels: { choose: string; yours: string; change: string; list: string };
}) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  if (mode === "pending") return <div className={d.signControl} data-mode="pending" aria-hidden />;

  const open = mode === "open" || expanded;
  const index = sign ? SIGNS.indexOf(sign) : -1;
  const chips = (
    <ul className={d.chips} aria-label={labels.list}>
      {SIGNS.map((key, i) => (
        <li key={key}>
          <button type="button" className={d.chip} aria-pressed={sign === key} onClick={() => onChoose(key)}>
            <span className={d.chipGlyph} aria-hidden>{SIGN_GLYPHS[i] + TEXT}</span>
            <span className={d.chipName}>{names[key]}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={d.signControl} data-mode={mode}>
      {mode === "open" ? (
        <p className={d.eyebrow} id={id}>{sign ? labels.yours : labels.choose}</p>
      ) : (
        <button type="button" className={d.signRow} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((v) => !v)}>
          <span className={d.signRowGlyph} aria-hidden>{index >= 0 ? SIGN_GLYPHS[index] + TEXT : ""}</span>
          <span className={d.signRowName}>{sign ? names[sign] : ""}</span>
          <span className={d.signRowAction}>{labels.change}</span>
          <span className={d.chipToggle} aria-hidden>{expanded ? "−" : "+"}</span>
        </button>
      )}
      <div className={d.chipsWrap} id={mode === "open" ? undefined : id} data-open={open || undefined} inert={!open || undefined}>
        <div className={d.chipsInner}>{chips}</div>
      </div>
    </div>
  );
}
