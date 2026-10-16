"use client";

/**
 * Why this: what one passage was read from, in a drawer at the right (wide
 * screens) or a sheet from the bottom. The cited cards turn face up once, each
 * with its position's frame and how it was found; then the numbers, the sky,
 * the aspects and the teachings the passage cites, with their sources. A modal
 * dialog: the page behind is inert, Tab stays inside, and Esc or Close returns
 * focus to the "Why this" that opened it.
 */

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { MajorCard } from "@/lib/astrology/deck";
import { ROWS } from "@/lib/portrait/lattice.js";
import { explain } from "@/lib/portrait/why.js";
import type { PortraitPacket, PortraitStages, PortraitStatus } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { LatticeCard } from "./Lattice";
import type { Frames } from "./Laying";
import { passageOf } from "./Reader";
import styles from "./why.module.css";

/** The passage asked about, and the button that asked: focus goes back to it. */
export type WhyTarget = { key: string; trigger: HTMLElement };
type Teachings = PortraitStatus["teachings"];
type CardLine = { key: string; pos: number; card: number; role: string; name: string; from: number[]; found: string };
type Explained = {
  cards: CardLine[];
  numbers: { key: string; role: string; value: number; master: boolean; text: string }[];
  sky: { key: string; glyph: string; text: string; retrograde: boolean; uncertain: boolean }[];
  aspects: { key: string; glyph: string; text: string }[];
  teachings: string[];
};

const LEAVE_MS = 260;
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Text presentation, so a glyph is never drawn as an emoji. */
const TEXT = "︎";
/** Each position on the sigil's small grid, rows as the lattice lays them. */
const SIGIL: Record<number, [number, number]> = {};
ROWS.forEach((row, r) => {
  const xs = row.length === 2 ? [7.5, 16.5] : [3, 12, 21];
  row.forEach((pos, c) => { SIGIL[pos] = [xs[c], 3 + r * 8]; });
});

export default function WhyDrawer({ target, stages, teachings, packet, cards, locale, frames, onClose }: {
  target: WhyTarget;
  stages: PortraitStages;
  /** The cited teachings, by id (the status's, or a saved reading's). */
  teachings: Teachings;
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  frames: Frames;
  /** Called once the drawer has gone: the parent unmounts it. */
  onClose: () => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const w = t.why;
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const release = useRef<() => void>(() => {});
  const leaveTimer = useRef(0);
  const [leaving, setLeaving] = useState(false);
  // The drawer opens only on a press, so the window is always there to ask.
  const [still] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const passage = passageOf(stages, target.key);
  const lines = explain(passage ?? undefined, packet, locale, cards, teachings) as Explained;
  const name = passage?.heading ?? t.reader.sections.opening;

  // Open: the page behind goes inert and stops scrolling; focus moves to the title.
  // Release (on close, or if the reader goes away) undoes both and returns focus.
  useLayoutEffect(() => {
    const host = root.current;
    const html = document.documentElement;
    const gap = window.innerWidth - html.clientWidth;
    const was = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    const quieted = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== host && !el.inert);
    for (const el of quieted) el.inert = true;
    html.style.overflow = "hidden";
    if (gap > 0) html.style.paddingRight = `${gap}px`;
    title.current?.focus({ preventScroll: true });
    let done = false;
    release.current = () => {
      if (done) return;
      done = true;
      for (const el of quieted) el.inert = false;
      html.style.overflow = was.overflow;
      html.style.paddingRight = was.paddingRight;
      if (target.trigger.isConnected) target.trigger.focus({ preventScroll: true });
    };
    return () => { release.current(); window.clearTimeout(leaveTimer.current); };
  }, [target]);

  const close = useCallback(() => {
    if (leaving) return;
    release.current();
    if (still) { onClose(); return; }
    setLeaving(true);
    leaveTimer.current = window.setTimeout(onClose, LEAVE_MS);
  }, [leaving, still, onClose]);

  // Esc closes; Tab and Shift+Tab wrap within the drawer.
  useEffect(() => {
    if (leaving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      const box = panel.current;
      if (e.key !== "Tab" || !box) return;
      const items = [...box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
      const at = document.activeElement;
      if (!items.length || !at) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      const inside = box.contains(at);
      const follows = (a: Node, b: Node) => Boolean(b.compareDocumentPosition(a) & Node.DOCUMENT_POSITION_FOLLOWING);
      // From the title (where the drawer opens) the next stop is Close, which sits above it.
      if (e.shiftKey && (!inside || at === first || at === title.current || follows(first, at))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (!inside || at === last || at === title.current || follows(at, last))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [leaving, close]);

  const section = (key: string, heading: string, body: ReactNode) => (
    <section className={styles.section} aria-labelledby={`${id}-${key}`}>
      <h3 id={`${id}-${key}`} className={styles.sectionTitle}>{heading}</h3>
      {body}
    </section>
  );

  return createPortal(
    <div ref={root} className={styles.why} data-leaving={leaving || undefined}>
      <div className={styles.backdrop} onClick={close} aria-hidden="true" />
      <div ref={panel} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className={styles.head}>
          <p className={styles.kicker}>{w.kicker}</p>
          <button type="button" className={styles.close} onClick={close}>{w.close}</button>
        </div>
        <div className={styles.body}>
          <div className={styles.inner}>
            <h2 id={`${id}-title`} ref={title} tabIndex={-1} className={styles.title}>{name}</h2>

            {lines.cards.length > 0 && section("cards", w.cards, (
              <ul className={styles.list}>
                {lines.cards.map((c, i) => (
                  <li key={c.key} className={styles.cardRow}>
                    <WhyCard pos={c.pos} card={cards[c.card]} order={i} still={still} />
                    <div>
                      <p className={styles.cardKicker}>{c.pos} · {c.role}</p>
                      <p className={styles.cardName}>{c.name}</p>
                      {frames[String(c.pos)] && <p className={styles.frame}>{frames[String(c.pos)][locale]}</p>}
                      <p className={styles.found}><Sigil pos={c.pos} from={c.from} />{c.found}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ))}

            {lines.numbers.length > 0 && section("numbers", w.numbers, (
              <ul className={styles.list}>
                {lines.numbers.map((n) => (
                  <li key={n.key} className={styles.row}>
                    <span className={`${styles.mark} ${styles.markNumber}`} aria-hidden="true">{n.value}</span>
                    <p className={styles.line}>
                      {n.role}<span className={styles.sr}> {n.value}</span>
                      {n.master && <> <span className={styles.note}>· {w.master}</span></>}
                    </p>
                  </li>
                ))}
              </ul>
            ))}

            {lines.sky.length > 0 && section("sky", w.sky, (
              <ul className={styles.list}>
                {lines.sky.map((s) => (
                  <li key={s.key} className={styles.row}>
                    <span className={`${styles.mark} ${s.glyph.length > 1 ? styles.markLetters : ""}`} aria-hidden="true">{s.glyph.length === 1 ? `${s.glyph}${TEXT}` : s.glyph}</span>
                    <p className={styles.line}>
                      {s.text}
                      {s.uncertain && <> <span className={styles.note}>{w.timeUnknown}</span></>}
                      {s.retrograde && <span className={styles.flag}><span aria-hidden="true">℞{TEXT} </span>{w.retrograde}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            ))}

            {lines.aspects.length > 0 && section("aspects", w.aspects, (
              <ul className={styles.list}>
                {lines.aspects.map((a) => (
                  <li key={a.key} className={styles.row}>
                    <span className={styles.mark} aria-hidden="true">{a.glyph && `${a.glyph}${TEXT}`}</span>
                    <p className={styles.line}>{a.text}</p>
                  </li>
                ))}
              </ul>
            ))}

            {lines.teachings.length > 0 && section("teachings", w.teachings, (
              <ul className={styles.list}>
                {lines.teachings.map((tid) => {
                  const teaching = teachings[tid];
                  return (
                    <li key={tid} className={styles.teaching}>
                      <p className={styles.teachingLabel}>{teaching.label}</p>
                      <p className={styles.teachingText}>{teaching.text}</p>
                      {teaching.sources.length > 0 && (
                        <ul className={styles.sources} aria-label={w.sources}>
                          {teaching.sources.map((s, k) => (
                            <li key={`${s.url}-${k}`}>
                              <a className={styles.source} href={s.url} target="_blank" rel="noopener noreferrer">
                                {s.title}<span className={styles.ext} aria-hidden="true">↗{TEXT}</span><span className={styles.sr}> {w.newTab}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            ))}

            <p className={styles.honest}><span className={styles.fleuron} aria-hidden="true">❦</span>{w.honest}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A cited card: face down as the drawer opens, then one 700 ms turn once its art is ready. */
function WhyCard({ pos, card, order, still }: { pos: number; card: MajorCard | undefined; order: number; still: boolean }) {
  const [art, setArt] = useState(false);
  const [turned, setTurned] = useState(still);
  useEffect(() => {
    if (turned) return;
    // Art that is slow to arrive turns anyway, onto the card's ground.
    if (!art) { const grace = window.setTimeout(() => setArt(true), 1200); return () => window.clearTimeout(grace); }
    const frame = requestAnimationFrame(() => setTurned(true));
    return () => cancelAnimationFrame(frame);
  }, [art, turned]);
  return (
    // The row beside it names the card; the art is for the eye (and no hover name plate).
    <div className={styles.art} aria-hidden="true" data-card-label="off">
      <LatticeCard pos={pos} card={card} turned={turned} label="" sizes="64px" onArt={() => setArt(true)}
        style={{ "--turn-delay": `${240 + order * 140}ms` } as CSSProperties} />
    </div>
  );
}

/** Where the card sits in the lattice (filled) and the cards it was added from (ringed), joined by threads. */
function Sigil({ pos, from }: { pos: number; from: number[] }) {
  const [x, y] = SIGIL[pos];
  return (
    <svg className={styles.sigil} viewBox="0 0 24 30" width="29" height="36" aria-hidden="true">
      {from.map((f) => <line key={f} x1={SIGIL[f][0]} y1={SIGIL[f][1]} x2={x} y2={y} className={styles.thread} />)}
      {Object.entries(SIGIL).map(([p, [cx, cy]]) => {
        const n = Number(p);
        const kind = n === pos ? styles.self : from.includes(n) ? styles.from : styles.dot;
        return <circle key={p} cx={cx} cy={cy} r={n === pos ? 2.5 : from.includes(n) ? 1.9 : 1.1} className={kind} />;
      })}
    </svg>
  );
}
