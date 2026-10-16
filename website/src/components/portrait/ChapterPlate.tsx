"use client";

/**
 * The chapters as plates in a book (direction A), in two parts: Part one
 * (mind, heart, work) is stage B, Part two (shadow, love, becoming) stage C.
 * Each chapter opens on a frontispiece: its one or two cards large, each
 * captioned with its name, its place and what that place means to you, beside
 * a small gilt numeral, the title and the lede. Then the body at the reading
 * measure with a book's indents, one sentence set apart as a pull quote, the
 * week's practice written on the back of a card, and what the chapter was read
 * from. A part still being written stands as quiet plates (the card back, the
 * numeral, bars where the title will be) that fill as it lands; a part that
 * could not be written says so once, and everything above it stays.
 */

import { Fragment, useMemo, useRef, type ReactNode } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { pullQuote, readingMinutes } from "@/lib/portrait/digest.js";
import { ROLES, litPositions } from "@/lib/portrait/lattice.js";
import type { Chapter, PortraitPacket } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import type { Frames } from "./Laying";
import { cardsAt } from "./Lattice";
import { CardArt, NameList, ReadFrom, inkAt, namesOf, tieDashes } from "./Opening";
import { registerSection, sectionId, useSeen } from "./sections";
import styles from "./chapters.module.css";

type Text = { en: string; uk: string };
type ChapterKey = "mind" | "heart" | "work" | "shadow" | "love" | "becoming";
type Shared = {
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  frames: Frames;
  /** "Why these cards?", with the button pressed, so focus can return to it. */
  onWhy: (key: string, trigger: HTMLElement) => void;
};

export const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const roles = ROLES as Record<number, Text>;
/** A frontispiece holds at most two cards: the first large, the second over it, smaller. */
const PLATE_CARDS = 2;

/** "Conscious aim" → "conscious aim": a role mid-phrase, after "In the place of". */
const lower = (s: string) => s.charAt(0).toLocaleLowerCase() + s.slice(1);

/**
 * A part: its gilt name and its heading, then its chapters as plates, or as
 * quiet plates while its stage is written, or one notice if it could not be.
 */
export function Part({ n, title, chapters, from, stage, unfinished, ...shared }: Shared & {
  n: 1 | 2;
  title: string;
  chapters: readonly ChapterKey[];
  /** The place of the part's first chapter among all six (0 or 3), for its numeral. */
  from: number;
  /** The stage's chapters, once it has landed. */
  stage?: { chapters: Record<string, Chapter> };
  /** The stage could not be written: this, said once, in place of the plates. */
  unfinished?: string;
}) {
  const t = PORTRAIT_COPY[shared.locale];
  const key = n === 1 ? "part-one" : "part-two";
  const id = sectionId(key);
  const kicker = n === 1 ? t.toc.partOne : t.toc.partTwo;
  return (
    <section id={id} tabIndex={-1} className={styles.part} aria-labelledby={`${id}-title`}>
      <header className={styles.partHead} {...registerSection(key, `${kicker} · ${title}`, [])}>
        <p className={styles.partKicker}>{kicker}</p>
        <h2 id={`${id}-title`} className={styles.partTitle}>{title}</h2>
      </header>
      {unfinished !== undefined ? <Unfinished text={unfinished} locale={shared.locale} /> : chapters.map((chapterKey, i) => {
        const chapter = stage?.chapters[chapterKey];
        if (stage && !chapter) return null;
        return <ChapterPlate key={chapterKey} chapterKey={chapterKey} index={from + i} chapter={chapter} {...shared} />;
      })}
    </section>
  );
}

/**
 * One chapter: its frontispiece and its body once written, a quiet plate until
 * then. The chapter stays one section of the reading throughout, so the bar and
 * the mini-map follow it, and what fills it inks in as it arrives.
 */
export default function ChapterPlate({ chapterKey, index, chapter, ...shared }: Shared & {
  chapterKey: ChapterKey;
  /** Its place among all six chapters, from 0. */
  index: number;
  /** Absent while its stage is being written. */
  chapter?: Chapter;
}) {
  const t = PORTRAIT_COPY[shared.locale];
  const id = sectionId(chapterKey);
  const numeral = NUMERALS[index];
  const name = t.reader.sections[chapterKey];
  const kicker = `${t.chapters.ordinal[index]} · ${name}`;
  const lit = chapter ? (litPositions(chapter.refs ?? [], shared.packet) as number[]) : [];
  return (
    <article id={id} tabIndex={-1} className={styles.chapter} aria-busy={chapter ? undefined : true} aria-labelledby={`${id}-title`}
      {...registerSection(chapterKey, `${numeral} · ${chapter?.title ?? name}`, lit)}>
      {chapter ? (
        <>
          <Frontispiece id={id} numeral={numeral} kicker={kicker} chapterKey={chapterKey} chapter={chapter} {...shared} />
          <Body chapterKey={chapterKey} chapter={chapter} {...shared} />
        </>
      ) : (
        <Pending id={id} numeral={numeral} kicker={kicker} note={t.toc.pending} />
      )}
    </article>
  );
}

/** The kicker over a chapter's title: the small gilt numeral, then "Chapter one · Mind". */
function Kicker({ numeral, kicker, children }: { numeral: string; kicker: string; children?: ReactNode }) {
  return (
    <>
      <span className={styles.numeral} aria-hidden="true">{numeral}</span>{" "}
      <span className={styles.kickerText}>{kicker}{children}</span>
    </>
  );
}

/** The deck's back, face down: it names nothing. */
function Back({ className }: { className?: string }) {
  return (
    <span className={`${styles.back} ${className ?? ""}`} data-card-label="off">
      {/* eslint-disable-next-line @next/next/no-img-element -- the deck's own back, one cached file */}
      <img src="/cards/back-448.webp" alt="" width={448} height={769} loading="lazy" decoding="async" />
    </span>
  );
}

/**
 * The chapter's cards, to show large: the first two different cards it cites,
 * in the order it cites them (two places can hold one card).
 */
function plateCards(refs: string[], cardAt: Record<number, MajorCard | undefined>) {
  const out: number[] = [];
  for (const ref of refs) {
    const m = /^arkan-(\d+)$/.exec(ref);
    const pos = m ? Number(m[1]) : NaN;
    const card = cardAt[pos];
    if (card && !out.some((p) => cardAt[p] === card)) out.push(pos);
    if (out.length === PLATE_CARDS) break;
  }
  return out;
}

function Frontispiece({ id, numeral, kicker, chapterKey, chapter, packet, cards, locale, frames }: Shared & {
  id: string;
  numeral: string;
  kicker: string;
  chapterKey: ChapterKey;
  chapter: Chapter;
}) {
  const t = PORTRAIT_COPY[locale];
  const c = t.chapters;
  const root = useRef<HTMLDivElement>(null);
  const seen = useSeen(root);
  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);
  const shown = plateCards(chapter.refs ?? [], cardAt);
  const minutes = readingMinutes({ b: { chapters: { [chapterKey]: chapter } } } as never);

  return (
    <div ref={root} className={`${styles.band} ${seen ? styles.seen : ""}`}>
      <div className={styles.frontis}>
        {/* First for a screen reader, beside the plate for the eye. */}
        <header className={`${styles.titles} ${styles.ink}`} style={inkAt(1)}>
          <p className={styles.kicker}><Kicker numeral={numeral} kicker={kicker} /></p>
          <h3 id={`${id}-title`} className={styles.title}>{chapter.title}</h3>
          <p className={styles.lede}>{tieDashes(chapter.lede)}</p>
          <p className={styles.minutes}>{t.glance.minutes.replace("{n}", String(minutes))}</p>
        </header>

        <figure className={`${styles.plate} ${styles.ink}`} style={inkAt(0)} data-cards={shown.length}>
          {shown.length > 0 ? (
            <>
              {/* The cards as objects; their names are in the captions beneath. */}
              <span className={styles.cards} aria-hidden="true">
                {shown.map((pos, i) => (
                  <span key={pos} className={styles.card} data-card-label={`${pos} · ${roles[pos][locale]} · ${cardAt[pos]?.name}`}>
                    <CardArt card={cardAt[pos] as MajorCard} sizes={i === 0 ? "(max-width: 859px) 140px, 280px" : "(max-width: 859px) 112px, 224px"} />
                  </span>
                ))}
              </span>
              <figcaption className={styles.captions}>
                {shown.map((pos) => (
                  <span key={pos} className={styles.caption}>
                    <span className={styles.capName}>{cardAt[pos]?.name}</span>
                    <span className={styles.capRole}>{c.place.replace("{role}", lower(roles[pos][locale]))}</span>
                    {frames[String(pos)] && <span className={styles.capFrame}>{frames[String(pos)][locale]}</span>}
                  </span>
                ))}
              </figcaption>
            </>
          ) : (
            <>
              <span className={styles.cards}><Back /></span>
              <figcaption className={styles.captions}>
                <NameList lead={c.noCard} seals={namesOf(chapter.refs ?? [], packet, locale, cards)} locale={locale} className={styles.capNames} />
              </figcaption>
            </>
          )}
        </figure>
      </div>
    </div>
  );
}

/** The first few words of a chapter, set in small capitals as a book does; the rest follows in the body face. */
function leadIn(text: string): [string, string] {
  const words = text.split(" ");
  if (words.length < 8) return ["", text];
  let n = 0;
  let length = 0;
  while (n < 4 && length < 18) length += words[n++].length + 1;
  return [words.slice(0, n).join(" "), ` ${words.slice(n).join(" ")}`];
}

function Body({ chapterKey, chapter, packet, cards, locale, onWhy }: Shared & { chapterKey: ChapterKey; chapter: Chapter }) {
  const c = PORTRAIT_COPY[locale].chapters;
  const root = useRef<HTMLDivElement>(null);
  const seen = useSeen(root);
  const quote = useMemo(() => pullQuote(chapter) as { sentence: string; after: number } | null, [chapter]);
  const paragraphs = chapter.paragraphs ?? [];
  const [lead, rest] = leadIn(tieDashes(paragraphs[0] ?? ""));

  return (
    <div ref={root} className={`${styles.body} ${seen ? styles.seen : ""}`}>
      <div className={styles.main}>
        {paragraphs.map((p, j) => (
          <Fragment key={j}>
            <p className={`${styles.prose} ${styles.ink}`} style={inkAt(j)}>
              {j === 0 ? <>{lead && <span className={styles.leadIn}>{lead}</span>}{rest}</> : tieDashes(p)}
            </p>
            {/* The sentence again, set apart: already read in the text, so not read twice. */}
            {quote?.after === j && (
              <blockquote className={`${styles.pull} ${styles.ink}`} style={inkAt(j + 1)} aria-hidden="true">
                <p>{c.quote[0]}{tieDashes(quote.sentence)}{c.quote[1]}</p>
              </blockquote>
            )}
          </Fragment>
        ))}
        <div className={`${styles.ritual} ${styles.ink}`} style={inkAt(paragraphs.length + 1)}>
          <Back className={styles.ritualBack} />
          <div className={styles.ritualWords}>
            <p className={styles.ritualLabel}>{c.practice}</p>
            <p className={styles.ritualText}>{tieDashes(chapter.practice)}</p>
          </div>
        </div>
      </div>
      <ReadFrom refs={chapter.refs ?? []} packet={packet} cards={cards} locale={locale} name={chapter.title}
        onWhy={(trigger) => onWhy(chapterKey, trigger)} className={`${styles.note} ${styles.ink}`} style={inkAt(1)} />
    </div>
  );
}

/** A chapter still being written: the card back faint, its numeral and name, bars where its title and lede will stand. */
function Pending({ id, numeral, kicker, note }: { id: string; numeral: string; kicker: string; note: string }) {
  const root = useRef<HTMLDivElement>(null);
  const seen = useSeen(root);
  return (
    <div ref={root} className={`${styles.band} ${styles.quiet} ${seen ? styles.seen : ""}`}>
      <div className={styles.frontis}>
        <header className={`${styles.titles} ${styles.ink}`} style={inkAt(1)}>
          <h3 id={`${id}-title`} className={styles.kicker}>
            <Kicker numeral={numeral} kicker={kicker}><span className={styles.pendingNote}> · {note}</span></Kicker>
          </h3>
          <span className={styles.bars} aria-hidden="true">
            <span className={styles.bar} /><span className={styles.bar} /><span className={styles.bar} /><span className={styles.bar} />
          </span>
        </header>
        <div className={`${styles.plate} ${styles.ink}`} style={inkAt(0)} aria-hidden="true">
          <span className={styles.cards}><Back className={styles.ghost} /></span>
        </div>
      </div>
    </div>
  );
}

/** Where a part could not be written: one calm notice, the card left face down. */
function Unfinished({ text, locale }: { text: string; locale: PortraitLocale }) {
  const r = PORTRAIT_COPY[locale].reader;
  const id = sectionId("unfinished");
  return (
    <section id={id} tabIndex={-1} className={styles.notice} aria-labelledby={`${id}-title`} {...registerSection("unfinished", r.unfinishedTitle, [])}>
      <Back className={styles.noticeBack} />
      <div>
        <h3 id={`${id}-title`} className={styles.noticeTitle}>{r.unfinishedTitle}</h3>
        <p className={styles.noticeText}>{text}</p>
      </div>
    </section>
  );
}
