/**
 * motion.ts — THE EPHEMERIS MOTION SYSTEM.
 * One clock, two curves, seven named moves.
 *
 * Everything the almanac does when it moves reads from here: the master
 * "engrave" curve for reveals, the "wipe" curve for hairlines and wipes,
 * and the five durations of the clock. Springs live only on pointer
 * physics (framer-motion); nothing else ever gets one.
 *
 * The CSS twins of these tokens live in globals.css (--ease-engrave,
 * --ease-wipe, --dur-*) — keep both in register.
 */

import type { Variants } from "framer-motion";

/* ── The two curves ─────────────────────────────────────────── */

/** Master ease for reveals — CSS string. */
export const EASE_ENGRAVE_CSS = "cubic-bezier(0.625, 0.05, 0, 1)";
/** Wipes / hairline draws — CSS string (power3.inOut). */
export const EASE_WIPE_CSS = "cubic-bezier(0.645, 0.045, 0.355, 1)";

/** Master ease for reveals — framer-motion tuple. */
export const EASE_ENGRAVE: [number, number, number, number] = [0.625, 0.05, 0, 1];
/** Wipes / hairline draws — framer-motion tuple. */
export const EASE_WIPE: [number, number, number, number] = [0.645, 0.045, 0.355, 1];

/* ── The one clock ──────────────────────────────────────────── */

export const DUR = {
  micro: 0.3,
  element: 0.6,
  reveal: 0.9,
  plate: 1.15,
  turn: 1,
} as const;

/** Line stagger for ink rises. */
export const STAGGER_LINE = 0.08;

/* ── Named moves as framer-motion variants ──────────────────── */

/**
 * INK RISE — line-masked type rising 110% → 0. Put the variants on the
 * masked inner element (the parent must clip: overflow hidden).
 */
export const inkRise: Variants = {
  hidden: { y: "110%" },
  visible: (i: number = 0) => ({
    y: "0%",
    transition: { duration: DUR.reveal, ease: EASE_ENGRAVE, delay: i * STAGGER_LINE },
  }),
};

/**
 * PLATE REVEAL — a figure uncovered from its lower edge, the print
 * settling out of a slight enlargement. Pair with `plateRevealInner`
 * on the immediate child for the counter-scale.
 */
export const plateReveal: Variants = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: {
    clipPath: "inset(0% 0 0 0)",
    transition: { duration: DUR.plate, ease: EASE_ENGRAVE },
  },
};

/** Counter-scale twin of `plateReveal` — goes on the clipped child. */
export const plateRevealInner: Variants = {
  hidden: { scale: 1.12 },
  visible: {
    scale: 1,
    transition: { duration: DUR.plate, ease: EASE_ENGRAVE },
  },
};

/**
 * HAIRLINE DRAW — a rule drawing itself left → right. The element must
 * carry `transform-origin: left` (framer sets originX here).
 */
export const hairlineDraw: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: (delay: number = 0.15) => ({
    scaleX: 1,
    originX: 0,
    transition: { duration: 0.8, ease: EASE_WIPE, delay },
  }),
};

/* ── splitLines — line-level masks, never characters ────────── */

/**
 * Wraps each VISUAL line of an element in an overflow-hidden span pair:
 * `<span class="oa-line"><span class="oa-line-in" style="--li:n">…`.
 * Word-level measurement only — char splits are banned. Idempotent.
 * Elements with element children are left alone (returns []).
 * Returns the inner line spans (rise targets).
 */
export function splitLines(el: HTMLElement): HTMLElement[] {
  if (el.dataset.oaSplit === "1") {
    return Array.from(el.querySelectorAll<HTMLElement>(":scope > .oa-line > .oa-line-in"));
  }
  // Only pure-text elements are splittable — anything richer keeps its DOM.
  if (el.children.length > 0) return [];
  const text = el.textContent ?? "";
  if (!text.trim()) return [];

  const words = text.split(/\s+/).filter(Boolean);
  // Measure: every word in its own inline-block span.
  el.textContent = "";
  const probes: HTMLSpanElement[] = words.map((w) => {
    const s = document.createElement("span");
    s.style.display = "inline-block";
    s.textContent = w;
    el.appendChild(s);
    el.appendChild(document.createTextNode(" "));
    return s;
  });

  // Group by rendered top — each group is one visual line.
  const lines: string[][] = [];
  let lastTop: number | null = null;
  probes.forEach((s) => {
    const top = s.offsetTop;
    if (lastTop === null || Math.abs(top - lastTop) > 1) {
      lines.push([]);
      lastTop = top;
    }
    lines[lines.length - 1].push(s.textContent ?? "");
  });

  // Rebuild: one mask pair per line.
  el.textContent = "";
  const inners: HTMLElement[] = [];
  lines.forEach((lineWords, i) => {
    const outer = document.createElement("span");
    outer.className = "oa-line";
    const inner = document.createElement("span");
    inner.className = "oa-line-in";
    inner.style.setProperty("--li", String(i));
    inner.textContent = lineWords.join(" ");
    outer.appendChild(inner);
    el.appendChild(outer);
    inners.push(inner);
  });
  el.dataset.oaSplit = "1";
  return inners;
}
