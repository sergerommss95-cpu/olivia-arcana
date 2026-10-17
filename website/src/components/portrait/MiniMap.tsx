"use client";

/**
 * The mini-map: the eleven cards of the birth date, on demand from the
 * reading bar. All face up, in their lattice with its threads, each captioned
 * with its place and role. The cards the current section was read from stand
 * at full strength; the rest sit back. A non-modal panel (a bottom sheet on a
 * phone): reading goes on beside it; Esc or Close returns focus to the bar.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type RefObject } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { READING_ORDER, ROLES, ROWS, threads } from "@/lib/portrait/lattice.js";
import type { PortraitPacket } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { LatticeCard, Threads, cardsAt } from "./Lattice";
import { MINIMAP_ID } from "./ReadingBar";
import styles from "./minimap.module.css";

type Text = { en: string; uk: string };
const roles = ROLES as Record<number, Text>;

/** The lattice in a 360 × 620 box: cards 62 × 106, rows 154 apart, room under each for a two-line caption. */
const BOX = { w: 360, h: 620 };
const CARD = { w: 62, h: 106 };
const COLS = [62, 180, 298];
const PAIR = [121, 239];
const ROW_Y = [61, 215, 369, 523];
const PLACES: Record<number, { x: number; y: number }> = {};
ROWS.forEach((row, r) => row.forEach((pos, c) => { PLACES[pos] = { x: (row.length === 2 ? PAIR : COLS)[c], y: ROW_Y[r] }; }));
const LINES = threads({ positions: PLACES, card: CARD, height: BOX.h });
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

export default function MiniMap({ open, onClose, packet, cards, locale, lit, section, anchor }: {
  open: boolean;
  /** Closed: `back` is true when focus should return to the bar's button. */
  onClose: (back: boolean) => void;
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** The places the current section was read from. */
  lit: number[];
  /** The current section's title, said in the line under the heading. */
  section: string;
  /** The reading bar: the panel opens beneath it, and a press on it is not a press outside. */
  anchor: RefObject<HTMLElement | null>;
}) {
  const t = PORTRAIT_COPY[locale];
  const m = t.minimap;
  const panel = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);
  const litSet = new Set(lit);

  // Open: beneath the bar, focus on its heading. Esc closes it and returns focus; a press outside closes it.
  useLayoutEffect(() => {
    const box = panel.current;
    if (!open || !box) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const bottom = anchor.current?.getBoundingClientRect().bottom ?? 0;
      box.style.setProperty("--top", `${Math.max(8, Math.round(bottom) + 8)}px`);
    };
    const later = () => { if (!frame) frame = requestAnimationFrame(place); };
    place();
    title.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector('dialog[open], [aria-modal="true"]')) close.current(true); };
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!box.contains(target) && !anchor.current?.contains(target)) close.current(false);
    };
    window.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, anchor]);

  const [before, after] = m.lit.split("{section}");
  return (
    <div id={MINIMAP_ID} ref={panel} className={styles.panel} role="dialog" aria-modal="false" aria-labelledby={`${MINIMAP_ID}-title`} hidden={!open}>
      <div className={styles.head}>
        <h2 id={`${MINIMAP_ID}-title`} ref={title} tabIndex={-1} className={styles.title}>{m.title}</h2>
        <button type="button" className={styles.close} onClick={() => close.current(true)}>{t.reader.close}</button>
      </div>
      <p className={styles.now}>{lit.length ? <>{before}<em>{section}</em>{after}</> : m.idle}</p>
      <div className={styles.lattice} data-state={lit.length ? "lit" : "idle"}>
        <Threads width={BOX.w} height={BOX.h} lines={LINES} on={(line) => litSet.has(line.from) && litSet.has(line.to)} draw="shown" lit="fade" className={styles.threads} />
        <ol className={styles.cards} aria-label={t.laying.cards}>
          {READING_ORDER.map((pos) => {
            const p = PLACES[pos];
            const card = cardAt[pos];
            const on = litSet.has(pos);
            const place = { left: pct(p.x - CARD.w / 2, BOX.w), top: pct(p.y - CARD.h / 2, BOX.h), width: pct(CARD.w, BOX.w), height: pct(CARD.h, BOX.h) } as CSSProperties;
            return (
              <li key={pos} className={styles.slot} style={place} data-lit={on || undefined} data-card-label={`${pos} · ${roles[pos][locale]} · ${card?.name ?? ""}`}>
                <LatticeCard pos={pos} card={card} turned label={`${t.laying.card} ${pos}, ${roles[pos][locale]}, ${card?.name ?? ""}${on ? `, ${m.litCard}` : ""}`} sizes="64px" />
                {/* The place and the dot hold to the role's first word, so a long role wraps after it, never after the numeral. */}
                <p className={styles.cap} aria-hidden="true"><span className={styles.capNum}>{pos}</span>{"\u00a0·\u00a0"}{roles[pos][locale]}</p>
              </li>
            );
          })}
        </ol>
      </div>
      <p className={styles.note}>{t.laying.threads}</p>
    </div>
  );
}
