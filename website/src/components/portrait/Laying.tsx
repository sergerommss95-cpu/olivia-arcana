"use client";

/**
 * The Laying: while the portrait is written, the eleven Arkan cards are dealt
 * from a stack into their lattice and turned in reading order. The turning
 * card leads, and the side column names its role. Motion is transform and
 * opacity (plus the threads' stroke), on the site's ritual curve; reduced
 * motion shows the finished lattice at rest.
 */

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { SIGN_GLYPHS, SIGNS } from "@/lib/astrology/constants.js";
import { READING_ORDER, ROLES, layout, threads } from "@/lib/portrait/lattice.js";
import { SIGN_NAMES } from "@/lib/portrait/seals.js";
import type { PortraitPacket, PortraitStatus } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { LatticeCard, Threads, cardsAt } from "./Lattice";
import styles from "./laying.module.css";

type Text = { en: string; uk: string };
/** Position frames for the page, in the second person: src/lib/portrait/frames.json. */
export type Frames = Record<string, Text>;
type StageKey = "a" | "b" | "c";

/** Timings in ms; laying.module.css holds the matching durations. */
const PILE_MS = 300;
const DEAL_GAP = 70;
const DEAL_MS = 600;
const DEALT = PILE_MS + DEAL_GAP * (READING_ORDER.length - 1) + DEAL_MS;
const FIRST_TURN_AFTER = 600;
const TURN_EVERY = 2600;
const HOLD_EVERY = 6000;
/** How long a turn waits for its card's art before turning anyway. */
const ART_WAIT = 2000;
/** The lattice's desktop design width (lattice.js) and the room its bottom captions need. */
const DESIGN_WIDTH = 820;
const COMPACT_BELOW = 720;
const CAPTION_ROOM = 28;
/** Side by side from here; below it the side column stacks under the lattice. */
const TWO_COLUMNS = "(min-width: 1180px)";
/** Each card's tilt as it leaves the stack, in reading order. */
const TILT = [-3, 2, -1.5, 3, -2, 1, -2.5, 2.5, -1, 1.5, -3];
const STAGES: StageKey[] = ["a", "b", "c"];
const NUMBERS = ["lifePath", "expression", "soulUrge"] as const;
const roles = ROLES as Record<number, Text>;
const signNames = SIGN_NAMES as Record<string, Text>;
const glyph = (sign: string) => `${SIGN_GLYPHS[SIGNS.indexOf(sign)] ?? ""}︎`;

export default function Laying({ packet, cards, locale, status, frames, firstName }: {
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  status: PortraitStatus | null;
  frames: Frames;
  /** The first word of the typed name, held in memory only; absent on a resumed reading. */
  firstName?: string;
}) {
  const t = PORTRAIT_COPY[locale].laying;
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [width, setWidth] = useState(0);
  const [dealt, setDealt] = useState(reduced);
  const [step, setStep] = useState(reduced ? READING_ORDER.length : 0);
  const [hold, setHold] = useState<number | null>(reduced ? 0 : null);
  const [paused, setPaused] = useState(false);
  const [said, setSaid] = useState("");
  const column = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(new Set<number>());
  const titleId = `laying-${useId().replace(/[^\w-]/g, "")}-title`;

  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);

  // A new phase: start at the top, with focus on its heading.
  useEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  // The lattice is laid out from its column's width. Side by side, it also
  // fits the window's height, so the bottom row's captions stay in view.
  useLayoutEffect(() => {
    const box = column.current;
    if (!box) return;
    const measure = () => {
      let w = Math.min(box.clientWidth, DESIGN_WIDTH);
      if (window.matchMedia(TWO_COLUMNS).matches) {
        const top = box.getBoundingClientRect().top + window.scrollY;
        const ratio = (layout(DESIGN_WIDTH).height + CAPTION_ROOM) / DESIGN_WIDTH;
        w = Math.max(COMPACT_BELOW, Math.min(w, (window.innerHeight - top - 24) / ratio));
      }
      setWidth(Math.floor(w));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  // The ritual's clock: deal, then one turn every 2.6 s (each waiting briefly
  // for its art), then a slow hold through the positions until stage A lands.
  useEffect(() => {
    if (reduced || paused || width === 0) return;
    let live = true;
    const timers: number[] = [];
    const after = (ms: number, fn: () => void) => { timers.push(window.setTimeout(() => { if (live) fn(); }, ms)); };
    if (!dealt) {
      after(DEALT, () => setDealt(true));
    } else if (step < READING_ORDER.length) {
      const pos = READING_ORDER[step];
      const gap = step === 0 ? FIRST_TURN_AFTER : TURN_EVERY;
      const deadline = performance.now() + gap + ART_WAIT;
      const turn = () => { if (loaded.current.has(pos) || performance.now() > deadline) setStep(step + 1); else after(120, turn); };
      after(gap, turn);
    } else {
      after(hold === null ? TURN_EVERY : HOLD_EVERY, () => setHold((h) => (h === null ? 0 : (h + 1) % READING_ORDER.length)));
    }
    return () => { live = false; timers.forEach((id) => window.clearTimeout(id)); };
  }, [reduced, paused, width, dealt, step, hold]);

  const stages = status?.stages ?? {};
  const current = STAGES.find((k) => !stages[k]) ?? null;
  const progress = current ? t.writing[current] : t.written;
  // The live region is mounted empty; it speaks when the stage changes, never on the hold's cycle.
  useEffect(() => {
    const id = window.setTimeout(() => setSaid(progress), 400);
    return () => window.clearTimeout(id);
  }, [progress]);


  const l = width > 0 ? layout(width) : null;
  const compact = width > 0 && width < COMPACT_BELOW;
  const lines = l ? threads(l) : [];
  const isTurned = (pos: number) => READING_ORDER.indexOf(pos) < step;
  const focus = hold !== null ? READING_ORDER[hold] : READING_ORDER[Math.max(step - 1, 0)];
  const focusTurned = isTurned(focus);
  const focusCard = cardAt[focus];
  const caption = (pos: number) => `${t.card} ${pos} · ${roles[pos][locale]}`;

  const numbers: { key: string; label: string; shown: string; spoken?: string }[] = NUMBERS.flatMap((role) => {
    const f = packet.factors.find((x) => x.id === `num-${role}`);
    return f?.value !== undefined ? [{ key: role, label: t.numbers[role], shown: String(f.value) }] : [];
  });
  const sun = packet.factors.find((x) => x.id === "natal-sun");
  if (sun?.sign) {
    // Without a birth time the Sun may sit on a cusp: both signs are shown.
    const signs = sun.alternatives ?? [sun.sign];
    numbers.push({ key: "sun", label: t.numbers.sun, shown: signs.map(glyph).join(" / "), spoken: signs.map((s) => signNames[s]?.[locale] ?? s).join(" / ") });
  }

  return (
    <section className={`${styles.laying} ${reduced ? styles.still : styles.moving} ${dealt ? styles.dealt : ""} ${paused ? styles.paused : ""}`} aria-labelledby={titleId} data-laying="">
      <div className={styles.side}>
        <p className={styles.kicker}>{firstName ? `${t.kicker} · ${firstName}` : t.kicker}</p>
        <h1 id={titleId} ref={heading} tabIndex={-1} className={styles.title}>{t.title}</h1>
        <p className={styles.lead}>{t.threads}</p>

        <div className={styles.focus}>
          {/* Every frame laid in the same cell, unseen, so the panel keeps the height of the longest. */}
          {READING_ORDER.map((pos) => (
            <div key={pos} className={styles.ghost} aria-hidden="true">
              <p className={styles.focusKicker}>{caption(pos)}</p>
              <p className={styles.focusName}>{cardAt[pos]?.name}</p>
              <p className={styles.frame}>{frames[pos]?.[locale]}</p>
            </div>
          ))}
          <div key={focus} className={styles.inkIn}>
            <p className={styles.focusKicker}>{caption(focus)}</p>
            <h2 key={String(focusTurned)} className={`${styles.focusName} ${styles.inkIn} ${focusTurned ? "" : styles.faceDown}`}>
              {focusTurned && focusCard ? focusCard.name : t.faceDown}
            </h2>
            <p className={styles.frame}>{frames[focus]?.[locale]}</p>
          </div>
        </div>
        <p key={`line-${focus}-${focusTurned}`} className={`${styles.line} ${styles.inkIn}`}>
          <span className={styles.lineRole}><span className={styles.capNum}>{focus}</span> · {roles[focus][locale]}</span>
          {focusTurned && focusCard && <span className={styles.lineName}>{focusCard.name}</span>}
        </p>

        {numbers.length > 0 && (
          <dl className={styles.numbers} aria-label={t.numbersLabel}>
            {numbers.map((n) => (
              <div key={n.key} className={styles.cell}>
                <dt className={styles.term}>{n.label}</dt>
                <dd className={styles.value}>{n.spoken ? <><span aria-hidden="true">{n.shown}</span><span className={styles.sr}>{n.spoken}</span></> : n.shown}</dd>
              </div>
            ))}
          </dl>
        )}

        <ol className={styles.stages} aria-label={t.progress}>
          {STAGES.map((k) => {
            const state = stages[k] ? "done" : k === current ? "now" : "next";
            return <li key={k} data-state={state} aria-current={state === "now" ? "step" : undefined}>{state === "now" ? t.writing[k] : t.stages[k]}</li>;
          })}
        </ol>
        {!reduced && (
          // Named in sentence case: the visible label is set in capitals.
          <button type="button" className={styles.pause} aria-label={paused ? t.resume : t.pause} onClick={() => setPaused((p) => !p)}>{paused ? t.resume : t.pause}</button>
        )}
        <p className={styles.sr} role="status" aria-live="polite">{said}</p>
      </div>

      <div ref={column} className={styles.column}>
        {l && (
          <div className={styles.lattice} style={{ width, height: l.height + (compact ? 22 : CAPTION_ROOM) }}>
            {/* A thread is drawn solid once the card it makes has turned. */}
            <Threads width={width} height={l.height} lines={lines} on={(line) => isTurned(line.to)} draw={reduced ? "shown" : dealt ? "drawing" : "hidden"} lit="draw" />
            <ol className={styles.cards} aria-label={t.cards}>
              {READING_ORDER.map((pos, i) => {
                const p = l.positions[pos];
                const card = cardAt[pos];
                const turned = isTurned(pos);
                const now = turned && pos === focus;
                const vars = {
                  left: p.x - l.card.w / 2, top: p.y - l.card.h / 2, width: l.card.w, height: l.card.h,
                  "--i": i, "--h": `${l.card.h}px`, "--tilt": `${TILT[i]}deg`,
                  "--dx": `${width / 2 - p.x}px`, "--dy": `${l.height / 2 - p.y - i * 0.8}px`,
                } as CSSProperties;
                return (
                  <li key={pos} className={`${styles.slot} ${turned ? styles.turned : ""} ${now ? styles.now : ""}`} style={vars}>
                    <div className={styles.deal}>
                      <div className={styles.lift}>
                        <div className={styles.shade} aria-hidden="true" />
                        <LatticeCard pos={pos} card={card} turned={turned} sizes={`${Math.ceil(l.card.w * 1.3)}px`}
                          label={`${t.card} ${pos}, ${roles[pos][locale]}, ${turned && card ? card.name : t.faceDown}`}
                          onArt={() => loaded.current.add(pos)} />
                      </div>
                    </div>
                    <p className={styles.cap} aria-hidden="true">
                      <b className={styles.capNum}>{pos}</b>
                      {turned && !compact && <span className={`${styles.role} ${styles.inkIn}`}>· {roles[pos][locale]}</span>}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
