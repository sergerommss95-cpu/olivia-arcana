"use client";

/**
 * The opening (direction A): a left-aligned heading in the margin, the
 * overview set at the body measure with a drop cap, and beside it what the
 * passage was read from, held in view while the text runs on (below the text
 * on a phone). It inks in when it first comes into view. Also here, for the
 * facets and the chapters: the "Read from" note with its way into why, and a
 * card shown small as a physical thing.
 */

import { Fragment, useRef, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { litPositions } from "@/lib/portrait/lattice.js";
import { sealsFor } from "@/lib/portrait/seals.js";
import type { PortraitPacket, PortraitStages } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { cardSrcSet } from "./Lattice";
import { registerSection, useSeen } from "./sections";
import styles from "./facets.module.css";

type StageA = NonNullable<PortraitStages["a"]>;
const ID = "portrait-opening";

/** Ink-in order within a section, 90 ms apart. */
export const inkAt = (n: number) => ({ "--n": n }) as CSSProperties;

export default function Opening({ stages, packet, cards, locale, onWhy }: {
  stages: PortraitStages & { a: StageA };
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** "Why these cards?", with the button pressed, so focus can return to it. */
  onWhy: (key: string, trigger: HTMLElement) => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const overview = stages.a.overview;
  const root = useRef<HTMLElement>(null);
  const seen = useSeen(root);
  const refs = overview.refs ?? [];

  return (
    <section ref={root} id={ID} tabIndex={-1} className={`${styles.opening} ${seen ? styles.seen : ""}`} aria-labelledby={`${ID}-title`}
      {...registerSection("overview", t.toc.opening, litPositions(refs, packet) as number[])}>
      <h2 id={`${ID}-title`} className={`${styles.hSection} ${styles.openingHead} ${styles.ink}`} style={inkAt(0)}>{t.toc.opening}</h2>
      <p className={`${styles.prose} ${styles.dropCap} ${styles.openingText} ${styles.ink}`} style={inkAt(1)}>{overview.text}</p>
      <ReadFrom refs={refs} packet={packet} cards={cards} locale={locale} name={t.toc.opening} onWhy={(trigger) => onWhy("overview", trigger)}
        className={`${styles.openingNote} ${styles.ink}`} style={inkAt(2)} />
    </section>
  );
}

/**
 * What a passage was read from, as one quiet line with the names in italic
 * («Read from The Hermit, The Chariot and Sun · Aquarius.»), then the way into
 * why: a soft text button, named with its passage so each is told apart.
 */
export function ReadFrom({ refs, packet, cards, locale, name, onWhy, className, style }: {
  refs: string[];
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** The passage's name, said after "Why these cards?" to a screen reader. */
  name: string;
  onWhy: (trigger: HTMLElement) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const r = PORTRAIT_COPY[locale].reader;
  const seals = namesOf(refs, packet, locale, cards);
  return (
    <div className={`${styles.provenance} ${className ?? ""}`} style={style}>
      {seals.length > 0 && <NameList lead={r.readFrom} seals={seals} locale={locale} className={styles.readFrom} />}
      <button type="button" className={styles.why} aria-haspopup="dialog" onClick={(e) => onWhy(e.currentTarget)}>
        {r.why}<span className={styles.sr}> — {name}</span>
      </button>
    </div>
  );
}

type Seal = { key: string; label: string };

/** What a passage was read from, by name. Two places can hold the same card: it is named once. */
export function namesOf(refs: string[], packet: PortraitPacket, locale: PortraitLocale, cards: MajorCard[]): Seal[] {
  const all = sealsFor(refs, packet, locale, cards) as Seal[];
  return all.filter((s, i) => all.findIndex((o) => o.label === s.label) === i);
}

/** A lead, then the names in italic as one sentence: «Read from The Hermit, The Chariot and Sun · Aquarius.» */
export function NameList({ lead, seals, locale, className }: { lead: string; seals: Seal[]; locale: PortraitLocale; className?: string }) {
  const r = PORTRAIT_COPY[locale].reader;
  return (
    <p className={className}>
      {lead}{" "}
      {seals.map((s, i) => (
        <Fragment key={s.key}>
          {i > 0 && (i === seals.length - 1 ? ` ${r.and} ` : ", ")}
          <em>{s.label}</em>
        </Fragment>
      ))}
      .
    </p>
  );
}

/** A card's real art as a small object: rounded like the art, a soft shadow under it, the light from above. */
export function CardArt({ card, sizes, className }: { card: MajorCard; sizes: string; className?: string }) {
  return (
    <span className={`${styles.art} ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the card's own art, thumbnail first */}
      <img src={card.image} srcSet={cardSrcSet(card)} sizes={sizes} alt="" width={896} height={1536} loading="lazy" decoding="async" />
    </span>
  );
}
