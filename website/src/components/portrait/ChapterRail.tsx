"use client";

/**
 * The chapter rail: the portrait's contents, with a gilt ribbon on the
 * section crossing the reading line. Chapters not yet written read as
 * pending. On narrower screens it becomes a reading-progress hairline at the
 * top of the window and a Contents button that opens the same list as a sheet.
 */

import { useEffect, useRef, type CSSProperties, type MouseEvent } from "react";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { SECTIONS, WIDE, sectionId, useMedia, type SectionKey } from "./Reader";
import styles from "./reader.module.css";

type State = "ready" | "pending" | "unwritten" | "absent";

/** Scrolls to a section (smoothly unless motion is reduced) and moves focus to its passage. */
function go(key: SectionKey) {
  const target = document.getElementById(sectionId(key));
  if (!target) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
  // Every section is focusable (tabIndex -1) when it holds no passage.
  (target.querySelector<HTMLElement>("[data-passage]") ?? target).focus({ preventScroll: true });
}

function Entries({ locale, states, current, onPick }: { locale: PortraitLocale; states: Record<SectionKey, State>; current: SectionKey; onPick?: () => void }) {
  const r = PORTRAIT_COPY[locale].reader;
  const pick = (key: SectionKey) => (e: MouseEvent) => { e.preventDefault(); onPick?.(); go(key); };
  return (
    <div className={styles.railTrack} style={{ "--at": SECTIONS.indexOf(current) } as CSSProperties}>
      <span className={styles.ribbon} aria-hidden="true" />
      <ol className={styles.railList}>
        {SECTIONS.filter((key) => states[key] !== "absent").map((key) => {
          const state = states[key];
          const note = state === "pending" ? r.pending : state === "unwritten" ? r.unwritten : null;
          return (
            <li key={key} data-state={state}>
              {state === "unwritten" ? (
                <span>{r.sections[key]}<span className={styles.sr}>, {note}</span></span>
              ) : (
                <a href={`#${sectionId(key)}`} aria-current={key === current ? "location" : undefined} onClick={pick(key)}>
                  {r.sections[key]}{note && <span className={styles.sr}>, {note}</span>}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function ChapterRail({ locale, states, current }: { locale: PortraitLocale; states: Record<SectionKey, State>; current: SectionKey }) {
  const r = PORTRAIT_COPY[locale].reader;
  const wide = useMedia(WIDE);
  const sheet = useRef<HTMLDialogElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  // How far through the text the reading line has come, drawn as a hairline (transform only).
  useEffect(() => {
    if (wide) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const text = document.querySelector<HTMLElement>("[data-reader-text]");
      if (!text || !bar.current) return;
      // From the text's top to the end of its last section (the maps, when there are maps).
      const sections = document.querySelectorAll<HTMLElement>("[data-reader] [data-section]");
      const top = text.getBoundingClientRect().top;
      const bottom = sections.length ? sections[sections.length - 1].getBoundingClientRect().bottom : text.getBoundingClientRect().bottom;
      const done = Math.min(1, Math.max(0, (window.innerHeight * 0.4 - top) / (bottom - top)));
      bar.current.style.transform = `scaleX(${done})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(draw); };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [wide]);

  if (wide) {
    return (
      <nav className={styles.rail} aria-label={r.contents}>
        <Entries locale={locale} states={states} current={current} />
      </nav>
    );
  }

  return (
    <div className={styles.railNarrow}>
      <div className={styles.progress} aria-hidden="true"><span ref={bar} /></div>
      <button type="button" className={styles.contents} aria-label={r.contents} aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}>
        <span className={styles.contentsIcon} aria-hidden="true" />
        {r.contents}
      </button>
      {/* A native modal dialog: focus stays inside, Esc closes it, and focus returns to the button. */}
      <dialog ref={sheet} className={styles.sheet} aria-labelledby="portrait-contents-title" onClick={(e) => { if (e.target === e.currentTarget) sheet.current?.close(); }}>
        <div className={styles.sheetHead}>
          <h2 id="portrait-contents-title" className={styles.sheetTitle} aria-label={r.contents}>{r.contents}</h2>
          <button type="button" className={styles.close} aria-label={r.close} onClick={() => sheet.current?.close()}>{r.close}</button>
        </div>
        <nav aria-labelledby="portrait-contents-title">
          <Entries locale={locale} states={states} current={current} onPick={() => sheet.current?.close()} />
        </nav>
      </dialog>
    </div>
  );
}
