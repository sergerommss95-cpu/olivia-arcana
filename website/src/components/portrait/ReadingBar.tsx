"use client";

/**
 * The reading bar: a slim strip that follows the glance and holds to the top
 * of the window once the glance has gone. It names the section being read
 * (a running head, like a book's) and keeps two quiet ways round the
 * portrait: its contents, and the eleven cards, whose glyph lights the places
 * the section was read from.
 */

import type { Ref } from "react";
import { ROWS } from "@/lib/portrait/lattice.js";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import styles from "./readingbar.module.css";

export const CONTENTS_ID = "portrait-contents";
export const MINIMAP_ID = "portrait-minimap";

/** The lattice drawn small: four rows of 4 × 6 cards, as they lie (lattice.js). */
const GLYPH = ROWS.flatMap((row, r) => row.map((pos, c) => ({ pos, x: (row.length === 2 ? 4 : 0) + c * 8, y: r * 7 })));

export default function ReadingBar({ locale, sectionTitle, lit, showCards, contentsOpen, cardsOpen, barRef, contentsRef, cardsRef, onContents, onCards }: {
  locale: PortraitLocale;
  /** The running head: the section crossing the reading line. */
  sectionTitle: string;
  /** The places the section was read from, lit in the glyph. */
  lit: number[];
  /** A reading kept without its packet has no cards to show. */
  showCards: boolean;
  contentsOpen: boolean;
  cardsOpen: boolean;
  barRef: Ref<HTMLDivElement>;
  contentsRef: Ref<HTMLButtonElement>;
  cardsRef: Ref<HTMLButtonElement>;
  onContents: () => void;
  onCards: () => void;
}) {
  const t = PORTRAIT_COPY[locale];
  return (
    <div ref={barRef} className={styles.bar} data-reading-bar="">
      <div className={styles.inner}>
        {/* The headings say this already; the running head is for the eye. */}
        <p key={sectionTitle} className={styles.running} aria-hidden="true">{sectionTitle}</p>
        <div className={styles.tools}>
          <button ref={contentsRef} type="button" className={styles.tool} aria-haspopup="dialog" aria-expanded={contentsOpen} aria-controls={CONTENTS_ID} onClick={onContents}>
            <span className={styles.tocIcon} aria-hidden="true" />
            <span className={styles.toolText}>{t.reader.contents}</span>
          </button>
          {showCards && (
            <button ref={cardsRef} type="button" className={styles.tool} aria-expanded={cardsOpen} aria-controls={MINIMAP_ID} onClick={onCards}>
              <svg className={styles.glyph} viewBox="0 0 20 27" width="20" height="27" aria-hidden="true">
                {GLYPH.map((g) => <rect key={g.pos} x={g.x} y={g.y} width="4" height="6" rx="1" data-lit={lit.includes(g.pos) || undefined} />)}
              </svg>
              <span className={styles.toolText}>{t.bar.cards}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
