"use client";

/**
 * The lattice docked beside the reading. The passage being read (hovered,
 * focused, or crossing the reading line) lights the cards it cites: they rise
 * to 1.25× with a gilt glow, the threads between two lit cards brighten, and
 * the rest sit back. Wide screens get the lattice in its column; narrower ones
 * a sticky strip of the eleven cards, in reading order, lit cards raised.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { READING_ORDER, ROLES, ROWS, threads } from "@/lib/portrait/lattice.js";
import type { PortraitPacket } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { LatticeCard, Threads, cardsAt } from "./Lattice";
import { useMedia, WIDE } from "./Reader";
import styles from "./reader.module.css";

type Text = { en: string; uk: string };
const roles = ROLES as Record<number, Text>;
/** Room under the bottom row for its captions. */
const CAPTION_ROOM = 24;
const CARD_RATIO = 149 / 86;
/** Rows sit 1.5 card heights apart, so two lit cards (1.25×) in neighbouring rows never touch. */
const ROW_PITCH = 1.5;
const ROWS_TALL = 0.5 + ROW_PITCH * (ROWS.length - 1) + 0.5;
/** The dock's top (sticky) and the legend's room under the lattice. */
const DOCK_TOP = 120;
const LEGEND_ROOM = 150;
const FLIP_MS = 800;

/** A card's place on screen at the hand-off, and whether it had turned. */
export type Landing = Record<number, { x: number; y: number; w: number; h: number; turned: boolean }>;

/** Measures the Laying's cards where they lie, just before the dock replaces them. */
export function measureLaying(): Landing {
  const out: Landing = {};
  document.querySelectorAll<HTMLElement>("[data-laying] [data-pos]").forEach((el) => {
    const r = el.getBoundingClientRect();
    out[Number(el.dataset.pos)] = { x: r.left, y: r.top, w: r.width, h: r.height, turned: el.dataset.turned === "true" };
  });
  return out;
}

/**
 * FLIP: each dock card starts where its Laying card was and moves to its own
 * place (transform only). The reader opens at its top, so the page is
 * scrolled there first and both rects share one frame of reference.
 */
function flyInto(from: Landing) {
  window.scrollTo(0, 0);
  const cards = [...document.querySelectorAll<HTMLElement>("[data-dock] [data-flip]")];
  const moving = cards.flatMap((el) => {
    const was = from[Number(el.dataset.flip)];
    const now = el.getBoundingClientRect();
    if (!was || !now.width) return [];
    const dx = was.x + was.w / 2 - (now.left + now.width / 2);
    const dy = was.y + was.h / 2 - (now.top + now.height / 2);
    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px) scale(${was.w / now.width})`;
    return [el];
  });
  if (!moving.length) return;
  // One reflow fixes the start; the next frame releases every card to its place.
  void document.body.offsetHeight;
  requestAnimationFrame(() => {
    for (const el of moving) {
      el.style.transition = `transform ${FLIP_MS}ms var(--ease-ritual, cubic-bezier(0.16, 1, 0.3, 1))`;
      el.style.transform = "";
      const done = () => { el.style.transition = ""; };
      el.addEventListener("transitionend", done, { once: true });
      window.setTimeout(done, FLIP_MS + 100);
    }
  });
}

/**
 * The lattice's rows and columns (lattice.js), with taller row spacing than
 * the Laying's, and cards sized to fit the column and the window's height.
 */
function dockLayout(width: number, room: number) {
  const w = Math.max(40, Math.min(58, width * 0.17, (room - CAPTION_ROOM) / (ROWS_TALL * CARD_RATIO)));
  const h = w * CARD_RATIO;
  const cols = [0.17, 0.5, 0.83];
  const between = [(cols[0] + cols[1]) / 2, (cols[1] + cols[2]) / 2];
  const positions: Record<number, { x: number; y: number }> = {};
  ROWS.forEach((row, r) => {
    const xs = row.length === 2 ? between : cols;
    row.forEach((pos, c) => { positions[pos] = { x: xs[c] * width, y: h * (0.5 + ROW_PITCH * r) }; });
  });
  return { positions, card: { w, h }, height: h * ROWS_TALL };
}

export default function LatticeDock({ packet, cards, locale, lit, landing }: {
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** The positions the active passage cites; null when no passage is active. */
  lit: number[] | null;
  /** Where the Laying's cards lay at the hand-off: the dock's cards fly from there. Cards still face down turn in flight. */
  landing?: Landing;
}) {
  const t = PORTRAIT_COPY[locale];
  const wide = useMedia(WIDE);
  const [box, setBox] = useState({ width: 0, room: 0 });
  const width = box.width;
  const [down, setDown] = useState(() => new Set(Object.entries(landing ?? {}).filter(([, c]) => !c.turned).map(([pos]) => Number(pos))));
  const flown = useRef(false);
  const columnRef = useRef<HTMLElement>(null);
  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);
  const litSet = useMemo(() => new Set(lit ?? []), [lit]);

  // Face-down arrivals are drawn face down for one frame, then turn in flight.
  useEffect(() => {
    if (!down.size) return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setDown(new Set())); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [down]);

  // The flight starts once the dock's cards are laid out (the lattice waits for its width).
  useLayoutEffect(() => {
    if (!landing || flown.current || (wide && width === 0)) return;
    flown.current = true;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) flyInto(landing);
  }, [landing, wide, width]);

  useLayoutEffect(() => {
    const column = columnRef.current;
    if (!column || !wide) return;
    const measure = () => setBox({ width: Math.floor(column.clientWidth), room: window.innerHeight - DOCK_TOP - LEGEND_ROOM });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, [wide]);

  const state = lit === null ? "idle" : "active";
  const label = (pos: number) => `${t.laying.card} ${pos}, ${roles[pos][locale]}, ${cardAt[pos]?.name ?? ""}`;
  // Mid-flight, one after another in reading order.
  const turnDelay = (i: number) => ({ "--turn-delay": landing ? `${160 + i * 50}ms` : "0ms" }) as CSSProperties;

  if (!wide) {
    return (
      <aside className={`${styles.dock} ${styles.strip}`} data-dock="" data-state={state} aria-label={t.laying.cards}>
        <ol className={styles.stripCards}>
          {READING_ORDER.map((pos, i) => (
            <li key={pos} className={styles.stripSlot} data-lit={litSet.has(pos) || undefined} style={{ "--i": i } as CSSProperties}>
              <div className={styles.flip} data-flip={pos}>
                <div className={styles.lift}>
                  <div className={styles.glow} aria-hidden="true" />
                  <LatticeCard pos={pos} card={cardAt[pos]} turned={!down.has(pos)} label={label(pos)} sizes="88px" style={turnDelay(i)} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    );
  }

  const l = width > 0 ? dockLayout(width, box.room) : null;
  // The cell spans the text's row only, so the dock is held beside the text and leaves as the maps arrive.
  return (
    <div className={styles.dockCell}>
      <aside ref={columnRef} className={`${styles.dock} ${styles.lattice} ${landing ? styles.arriving : ""}`} data-dock="" data-state={state} aria-label={t.laying.cards}>
        {l && (
          <div className={styles.board} style={{ height: l.height + CAPTION_ROOM }}>
            <Threads width={width} height={l.height} lines={threads(l)} on={(line) => litSet.has(line.from) && litSet.has(line.to)} draw="shown" lit="fade" className={styles.dockThreads} />
            <ol className={styles.dockCards}>
              {READING_ORDER.map((pos, i) => {
                const p = l.positions[pos];
                const place = { left: p.x - l.card.w / 2, top: p.y - l.card.h / 2, width: l.card.w, height: l.card.h, "--h": `${l.card.h}px` } as CSSProperties;
                return (
                  <li key={pos} className={styles.dockSlot} data-lit={litSet.has(pos) || undefined} style={place}>
                    <div className={styles.flip} data-flip={pos}>
                      <div className={styles.lift}>
                        <div className={styles.glow} aria-hidden="true" />
                        <LatticeCard pos={pos} card={cardAt[pos]} turned={!down.has(pos)} label={label(pos)} sizes={`${Math.ceil(l.card.w * 1.25)}px`} style={turnDelay(i)} />
                      </div>
                    </div>
                    <p className={styles.dockCap} aria-hidden="true">{pos}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        <div className={styles.legend} aria-hidden="true">
          {lit === null && <p>{t.reader.litIdle}</p>}
          {lit !== null && lit.length === 0 && <p>{t.reader.litNone}</p>}
          {lit !== null && lit.length > 0 && (
            <>
              <p className={styles.legendKicker}>{t.reader.lit}</p>
              <ul>
                {lit.map((pos) => (
                  <li key={pos}><b>{pos} · {roles[pos][locale]}</b> {cardAt[pos]?.name}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
