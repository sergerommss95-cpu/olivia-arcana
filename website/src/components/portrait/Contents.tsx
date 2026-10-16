"use client";

/**
 * The portrait's contents, as a sheet from the reading bar: the opening, the
 * five facets, the two parts with their chapters, the numbers and maps, and
 * keeping. Chapters not yet written stand dimmed with a note. A native modal
 * dialog: focus stays inside, Esc closes it and focus returns to Contents; a
 * chosen entry takes focus with it.
 */

import { useLayoutEffect, useRef, type MouseEvent, type RefObject } from "react";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { CONTENTS_ID } from "./ReadingBar";
import { goTo } from "./sections";
import styles from "./readingbar.module.css";

export type ContentsEntry = {
  /** The element the entry goes to. */
  id: string;
  label: string;
  /** A chapter's numeral, set before its label. */
  numeral?: string;
  /** A part's name, set small above its label ("Part one"). */
  kicker?: string;
  /** Said beside an entry not there yet ("being written", "not written"); it dims the entry. */
  pending?: string;
  /** The sections (as registered) the entry stands for, so the one being read is marked. */
  sections?: string[];
  children?: ContentsEntry[];
};

export default function Contents({ open, onClose, sections, current, locale, anchor }: {
  open: boolean;
  /** Closed: `back` is true when focus should return to the Contents button. */
  onClose: (back: boolean) => void;
  sections: ContentsEntry[];
  /** The section being read. */
  current: string;
  locale: PortraitLocale;
  /** The reading bar: the sheet opens just beneath it. */
  anchor: RefObject<HTMLElement | null>;
}) {
  const t = PORTRAIT_COPY[locale];
  const dialog = useRef<HTMLDialogElement>(null);
  const back = useRef(true);
  const title = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      const bottom = anchor.current?.getBoundingClientRect().bottom ?? 0;
      d.style.setProperty("--top", `${Math.max(8, Math.round(bottom) + 8)}px`);
      back.current = true;
      d.showModal();
      // Focus starts on the sheet's heading, as the mini-map's does, not on its Close button.
      title.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open, anchor]);

  const shut = (toButton: boolean) => { back.current = toButton; dialog.current?.close(); };
  const pick = (id: string) => (e: MouseEvent) => { e.preventDefault(); shut(false); goTo(id); };

  const entry = (s: ContentsEntry) => {
    const here = s.sections?.includes(current) ? "location" : undefined;
    return (
      <li key={s.sections?.[0] ?? s.id} data-pending={s.pending ? "" : undefined}>
        <a href={`#${s.id}`} aria-current={here} onClick={pick(s.id)} className={styles.entry}>
          {/* The spaces keep the words apart in the entry's name; a flex row does not draw them. */}
          {s.numeral && <><span className={styles.entryNum}>{s.numeral}</span>{" "}</>}
          <span className={styles.entryLabel}>
            {s.kicker && <><span className={styles.entryKicker}>{s.kicker}</span>{" "}</>}
            {s.label}
          </span>
          {s.pending && <>{" "}<span className={styles.entryNote}>{s.pending}</span></>}
        </a>
        {s.children && <ol className={styles.entries}>{s.children.map(entry)}</ol>}
      </li>
    );
  };

  return (
    // The backdrop is the dialog's own box outside its content: a press there closes it.
    <dialog id={CONTENTS_ID} ref={dialog} className={styles.sheet} aria-labelledby={`${CONTENTS_ID}-title`}
      onClose={() => onClose(back.current)} onClick={(e) => { if (e.target === e.currentTarget) shut(true); }}>
      <div className={styles.sheetHead}>
        <h2 id={`${CONTENTS_ID}-title`} ref={title} tabIndex={-1} className={styles.sheetTitle}>{t.reader.contents}</h2>
        <button type="button" className={styles.close} onClick={() => shut(true)}>{t.reader.close}</button>
      </div>
      <nav aria-labelledby={`${CONTENTS_ID}-title`}>
        <ol className={`${styles.entries} ${styles.top}`}>{sections.map(entry)}</ol>
      </nav>
    </dialog>
  );
}
