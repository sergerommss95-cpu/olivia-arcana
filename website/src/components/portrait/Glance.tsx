"use client";

/**
 * The glance: the portrait at first sight. On a lit lapis table, the cards the
 * opening and the five facets return to most, each captioned like a museum
 * label; beside them the title, the epigraph, the three sentences to keep and
 * the way in. When stage A lands in front of the reader, the table's cards fly
 * from where they lay in the Laying (FLIP, transform only) and the rest of the
 * Laying fades. Reduced motion swaps at once.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { definingCards, readingMinutes } from "@/lib/portrait/digest.js";
import { ROLES } from "@/lib/portrait/lattice.js";
import type { PortraitPacket, PortraitStages } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { LatticeCard, cardsAt } from "./Lattice";
import { registerSection } from "./sections";
import styles from "./glance.module.css";

type Text = { en: string; uk: string };
type StageA = NonNullable<PortraitStages["a"]>;
type Defining = { card: number; positions: number[]; count: number };
const roles = ROLES as Record<number, Text>;
const FLIP_MS = 800;
/** How long the Laying's other cards take to fade, and when their layer leaves. */
const GHOST_MS = 900;
/** Each place's slight turn on the table, as if each card were set down by hand. */
const TILT: Record<number, number> = { 1: -1.1, 2: 0.7, 3: -0.5, 4: 1.0, 5: -0.8, 6: 0.4, 7: -0.6, 8: 1.1, 12: -0.9, 13: 0.6, 14: -1.2 };
export const GLANCE_ID = "portrait-glance";

/** A Laying card's place on screen at the hand-off, and whether it had turned. */
export type Landing = Record<number, { x: number; y: number; w: number; h: number; turned: boolean }>;

/** Measures the Laying's cards where they lie, just before the glance replaces them. */
export function measureLaying(): Landing {
  const out: Landing = {};
  document.querySelectorAll<HTMLElement>("[data-laying] [data-pos]").forEach((el) => {
    const r = el.getBoundingClientRect();
    out[Number(el.dataset.pos)] = { x: r.left, y: r.top, w: r.width, h: r.height, turned: el.dataset.turned === "true" };
  });
  return out;
}

/**
 * FLIP: each table card starts where its Laying card lay and moves to its own
 * place, transform only. The glance opens at the top, so both rects share one
 * frame of reference. A card hidden at this width (the phone's fan holds
 * three) has no box and stays where it is.
 */
function fly(box: HTMLElement, from: Landing) {
  const moving = [...box.querySelectorAll<HTMLElement>("[data-flip]")].flatMap((el) => {
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
  void box.offsetHeight;
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

/** The places a card holds, its roles and its name, as the hover plate and a screen reader say them. */
function describe(d: Defining, card: MajorCard | undefined, locale: PortraitLocale) {
  return { places: d.positions.join(", "), roles: d.positions.map((pos) => roles[pos][locale]).join(", "), name: card?.name ?? "" };
}

export default function Glance({ stages, failed, packet, cards, locale, kicker, landing, onBegin }: {
  stages: PortraitStages & { a: StageA };
  /** The reading stopped: sentences to keep that never came leave no placeholder. */
  failed: boolean;
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** Above the title: "Your birth portrait", the example's own label, or with the first name. */
  kicker: string;
  /** Where the Laying's cards lay at the hand-off; absent on a reading opened at the glance. */
  landing?: Landing;
  /** "Begin the reading": takes the reader to the opening. */
  onBegin: () => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const g = t.glance;
  const a = stages.a;
  const root = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);
  const defining = useMemo(() => definingCards(a as never, packet) as Defining[], [a, packet]);
  // The phone's fan holds the three the portrait returns to most.
  const fan = useMemo(() => new Set((definingCards(a as never, packet, 3) as Defining[]).map((d) => d.card)), [a, packet]);
  const keep = stages.c?.keep;
  const minutes = readingMinutes(stages);
  const lit = defining.flatMap((d) => d.positions);

  // Table cards that lay face down in the Laying are drawn face down for a frame, then turn in flight.
  const [down, setDown] = useState(() => new Set(defining.map((d) => d.positions[0]).filter((pos) => landing?.[pos] && !landing[pos].turned)));
  // The Laying's other cards stay where they lay, and fade.
  const [ghosts, setGhosts] = useState(() => {
    const flying = new Set(defining.map((d) => d.positions[0]));
    return Object.entries(landing ?? {}).map(([pos, r]) => ({ pos: Number(pos), ...r })).filter((r) => !flying.has(r.pos));
  });

  // A new phase opens at its top, with focus on its title; arriving from the Laying, the cards fly,
  // once (a second run would measure the cards where the first had just put them).
  const flown = useRef(false);
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
    if (!landing || !root.current || flown.current) return;
    flown.current = true;
    fly(root.current, landing);
    // Mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!down.size) return;
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setDown(new Set())); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [down]);

  useEffect(() => {
    if (!ghosts.length) return;
    const id = window.setTimeout(() => setGhosts([]), GHOST_MS);
    return () => window.clearTimeout(id);
  }, [ghosts]);

  const ink = (n: number) => ({ "--n": n }) as CSSProperties;
  const fanIndex = defining.filter((d) => fan.has(d.card)).map((d) => d.card);

  return (
    <section ref={root} id={GLANCE_ID} className={`${styles.glance} ${landing ? styles.arriving : ""}`} data-glance="" aria-labelledby={`${GLANCE_ID}-title`} {...registerSection("glance", a.title, lit)}>
      <div className={styles.text}>
        <p className={`${styles.kicker} ${styles.ink}`} style={ink(0)}>{kicker}</p>
        <h1 id={`${GLANCE_ID}-title`} ref={heading} tabIndex={-1} className={`${styles.title} ${styles.ink}`} style={ink(1)}>{a.title}</h1>
        <p className={`${styles.epigraph} ${styles.ink}`} style={ink(2)}>{a.epigraph}</p>

        {(keep || !failed) && (
          <div className={`${styles.essence} ${styles.ink}`} style={ink(3)} aria-busy={keep ? undefined : true}>
            <h2 className={styles.essenceHead}>{g.essence}</h2>
            {keep ? (
              <ul key="keep" className={styles.keepLines}>
                {keep.map((line, i) => <li key={i} className={styles.ink} style={ink(i)}>{line}</li>)}
              </ul>
            ) : (
              <div key="bars" className={styles.bars}>
                <p className={styles.sr}>{g.essencePending}</p>
                {[0, 1, 2].map((i) => <span key={i} className={styles.bar} aria-hidden="true" />)}
              </div>
            )}
          </div>
        )}

        <div className={`${styles.wayIn} ${styles.ink}`} style={ink(4)}>
          <a className={styles.begin} href="#portrait-opening" onClick={(e) => { e.preventDefault(); onBegin(); }}>
            {g.begin}
            <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5v10.5M2.5 7.6 7 12l4.5-4.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </a>
          <p className={styles.meta}><strong>{g.minutes.replace("{n}", String(minutes))}</strong> · {g.shape}</p>
        </div>
      </div>

      {defining.length > 0 && (
        <figure className={styles.table}>
          <ol className={styles.spread} aria-label={g.cards}>
            {defining.map((d, i) => {
              const card = cardAt[d.positions[0]];
              const said = describe(d, card, locale);
              const at = fanIndex.indexOf(d.card);
              const vars = { zIndex: i + 1, "--r": `${TILT[d.positions[0]] ?? 0}deg`, "--fan": at - 1, "--fan-lift": at === 1 ? 0 : 1 } as CSSProperties;
              return (
                <li key={d.card} className={styles.slot} style={vars} data-fan={at >= 0 || undefined} data-card-label={`${said.places} · ${said.roles} · ${said.name}`}>
                  <div className={styles.flip} data-flip={d.positions[0]}>
                    <div className={styles.tilt}>
                      <LatticeCard pos={d.positions[0]} card={card} turned={!down.has(d.positions[0])} label={`${t.laying.card} ${said.places}, ${said.roles}, ${said.name}`}
                        sizes="(max-width: 999px) 130px, 210px" style={{ "--turn-delay": `${160 + i * 60}ms` } as CSSProperties} />
                    </div>
                  </div>
                  <p className={styles.cap} aria-hidden="true">
                    <span className={styles.role}>{roles[d.positions[0]][locale]}</span>
                    <span className={styles.name}>{said.name}</span>
                  </p>
                </li>
              );
            })}
          </ol>
          {/* The phone's fan is captioned as one list beneath it. */}
          <ul className={styles.legend} aria-hidden="true">
            {defining.filter((d) => fan.has(d.card)).map((d) => (
              <li key={d.card}>
                <span className={styles.legendNum}>{d.positions[0]}</span>
                <span className={styles.role}>{roles[d.positions[0]][locale]}</span>
                <span className={styles.name}>{cardAt[d.positions[0]]?.name}</span>
              </li>
            ))}
          </ul>
          <figcaption className={styles.note}>{g.note[defining.length]}</figcaption>
        </figure>
      )}

      {ghosts.length > 0 && (
        <div className={styles.ghosts} aria-hidden="true" data-card-label="off">
          {ghosts.map((r) => (
            <div key={r.pos} className={styles.ghost} style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
              <LatticeCard pos={r.pos} card={cardAt[r.pos]} turned={r.turned} label="" sizes={`${Math.ceil(r.w)}px`} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
