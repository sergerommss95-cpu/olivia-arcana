"use client";

/**
 * The reading, orchestrated: the glance first, then the reading bar, the
 * opening, the five-facet spread, the chapters, the maps and the end. The
 * reader keeps one current section (the one crossing its reading line); the
 * bar's running head and the mini-map follow it. Each section says what it is
 * with `registerSection` on its own element, and may change it in place (a
 * facet opening). Chapters still being written stand as engraved placeholders
 * and ink in as they land.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { litPositions } from "@/lib/portrait/lattice.js";
import type { Chapter, PortraitPacket, PortraitStages, PortraitStatus } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import Glance, { type Landing } from "./Glance";
import ReadingBar from "./ReadingBar";
import MiniMap from "./MiniMap";
import Contents, { type ContentsEntry } from "./Contents";
import Opening, { ReadFrom } from "./Opening";
import FacetSpread, { FACETS } from "./FacetSpread";
import Maps from "./Maps";
import { goTo, readSection, registerSection, sameSection, type Section } from "./sections";
import styles from "./reader.module.css";

export const CHAPTERS = { b: ["mind", "heart", "work"], c: ["shadow", "love", "becoming"] } as const;
type ChapterKey = (typeof CHAPTERS)["b" | "c"][number];
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const CHAPTER_ORDER: ChapterKey[] = [...CHAPTERS.b, ...CHAPTERS.c];
/** The reading line: a band at 40–45% of the window's height. */
const READING_LINE = "-40% 0px -55% 0px";

export const sectionId = (key: string) => `portrait-${key}`;

/** A passage by key ("overview", a facet or a chapter): its heading (none for the overview), refs and teachings. */
export function passageOf(stages: PortraitStages, key: string): { heading?: string; refs: string[]; teachings: string[] } | null {
  if (key === "overview") return stages.a ? { refs: stages.a.overview.refs ?? [], teachings: stages.a.overview.teachings ?? [] } : null;
  const facet = stages.a?.facets[key];
  if (facet) return { heading: facet.heading, refs: facet.refs ?? [], teachings: facet.teachings ?? [] };
  const chapter = stages.b?.chapters[key] ?? stages.c?.chapters[key];
  return chapter ? { heading: chapter.title, refs: chapter.refs ?? [], teachings: chapter.teachings ?? [] } : null;
}

/** The maps are drawn from the packet alone; a reading kept without one has none. */
export const hasMaps = (packet: PortraitPacket) => packet.factors.some((f) => f.kind === "arkan");

export default function Reader({ stages, status, packet, cards, locale, firstName, kicker, keep, newLabel, announce, landing, onWhy, onNew }: {
  stages: PortraitStages;
  status: PortraitStatus | null;
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** The first word of the typed name, in memory only; absent on a reopened reading. */
  firstName?: string;
  /** In place of "Your birth portrait" above the title: the example says it is one. */
  kicker?: string;
  /** The tools for keeping a finished portrait, at its end. */
  keep?: ReactNode;
  /** The way out at the end, when it is not "Start a new portrait". */
  newLabel?: string;
  /** Something to say through the live region (a save, a download); `n` tells a repeat apart. */
  announce?: { text: string; n: number } | null;
  /** Where the Laying's cards lay as stage A landed: the glance's cards fly from there. */
  landing?: Landing;
  /** "Why this" under a passage, with the button pressed, so focus can return to it. */
  onWhy: (key: string, trigger: HTMLElement) => void;
  onNew: () => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const r = t.reader;
  const toc = t.toc;
  const a = stages.a;
  const failed = status?.status === "failed";
  const over = status?.status === "done" || failed;
  const maps = hasMaps(packet);
  const [current, setCurrent] = useState<Section>(() => ({ id: "glance", title: a?.title ?? "", lit: [] }));
  const [contentsOpen, setContentsOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);
  const [said, setSaid] = useState("");
  /** What was already written when the reader opened: it inks in as one sequence; later stages start their own. */
  const [atOpen] = useState(() => ({ b: Boolean(stages.b), c: Boolean(stages.c) }));
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const contentsButton = useRef<HTMLButtonElement>(null);
  const cardsButton = useRef<HTMLButtonElement>(null);

  // The reading line: the first section crossing it is the one being read. Between sections the last one holds.
  const landed = `${Boolean(stages.b)}${Boolean(stages.c)}${failed}${over}`;
  useEffect(() => {
    const box = root.current;
    if (!box) return;
    const crossing = new Set<Element>();
    const pick = () => {
      const first = [...box.querySelectorAll<HTMLElement>("[data-section]")].find((el) => crossing.has(el));
      if (!first) return;
      const next = readSection(first);
      setCurrent((was) => (sameSection(was, next) ? was : next));
    };
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) crossing.add(e.target); else crossing.delete(e.target);
      pick();
    }, { rootMargin: READING_LINE });
    box.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
    // A section that changes what it says in place (a facet opening or closing) is read again.
    const changes = new MutationObserver(pick);
    changes.observe(box, { subtree: true, attributes: true, attributeFilter: ["data-section", "data-section-title", "data-section-lit"] });
    return () => { observer.disconnect(); changes.disconnect(); };
  }, [landed]);

  // Progress is spoken as chapters land; the region is mounted empty first.
  const unfinished = status?.error === "timeout" ? `${t.errors.timeout} ${t.next.timeout}` : r.unfinished;
  const progress = failed ? (stages.c ? t.laying.written : unfinished) : !stages.b ? t.laying.writing.b : !stages.c ? t.laying.writing.c : t.laying.written;
  useEffect(() => {
    const id = window.setTimeout(() => setSaid(progress), 400);
    return () => window.clearTimeout(id);
  }, [progress]);
  // A result is spoken through the same region: cleared first, so saying it again is heard again.
  useEffect(() => {
    if (!announce) return;
    const clear = window.setTimeout(() => setSaid(""), 0);
    const id = window.setTimeout(() => setSaid(announce.text), 120);
    return () => { window.clearTimeout(clear); window.clearTimeout(id); };
  }, [announce]);

  if (!a) return null;

  const lit = (refs: string[]) => litPositions(refs, packet) as number[];

  // Ink-in, 90 ms apart: chapters already written after the glance, then each later stage from its own start as it lands.
  // (The opening and the facets ink in as they come into view.)
  const ink = (n: number) => ({ "--n": n }) as CSSProperties;
  const startB = atOpen.b ? 5 : 0;
  const startC = atOpen.c ? startB + CHAPTERS.b.length : 0;
  // A failure leaves one notice where the first unwritten chapter would be.
  const unwritten = failed ? CHAPTER_ORDER.find((key) => !(stages.b?.chapters[key] || stages.c?.chapters[key])) : undefined;
  const chapterOf = (key: ChapterKey) => stages.b?.chapters[key] ?? stages.c?.chapters[key];
  const chapterTitle = (key: ChapterKey, i: number) => `${NUMERALS[i]} · ${chapterOf(key)?.title ?? r.sections[key]}`;

  const chapter = (key: ChapterKey, i: number) => {
    const order = i < CHAPTERS.b.length ? startB + i : startC + i - CHAPTERS.b.length;
    const written = chapterOf(key);
    const kickerText = `${NUMERALS[i]} · ${r.sections[key]}`;
    if (written) {
      return (
        <section key={key} id={sectionId(key)} tabIndex={-1} className={`${styles.chapter} ${styles.ink}`} style={ink(order)} aria-labelledby={`${sectionId(key)}-title`}
          {...registerSection(key, chapterTitle(key, i), lit(written.refs))}>
          <ChapterPassage chapterKey={key} chapter={written} kicker={kickerText} practice={r.practice}>
            <ReadFrom refs={written.refs ?? []} packet={packet} cards={cards} locale={locale} name={written.title} onWhy={(trigger) => onWhy(key, trigger)} />
          </ChapterPassage>
        </section>
      );
    }
    if (unwritten === key) {
      return (
        <section key={key} id={sectionId("unfinished")} tabIndex={-1} className={`${styles.notice} ${styles.ink}`} style={ink(0)} aria-labelledby={`${sectionId("unfinished")}-title`}
          {...registerSection("unfinished", r.unfinishedTitle, [])}>
          <p id={`${sectionId("unfinished")}-title`} className={styles.noticeKicker}>{r.unfinishedTitle}</p>
          <p>{unfinished}</p>
        </section>
      );
    }
    if (failed) return null;
    return <Placeholder key={key} id={sectionId(key)} section={key} title={chapterTitle(key, i)} kicker={kickerText} pending={r.pending} />;
  };

  const chapterEntry = (key: ChapterKey, i: number): ContentsEntry => {
    const written = chapterOf(key);
    const gone = !written && failed;
    return {
      id: gone ? sectionId("unfinished") : sectionId(key),
      numeral: NUMERALS[i],
      label: written?.title ?? r.sections[key],
      pending: written ? undefined : gone ? toc.unwritten : toc.pending,
      sections: [key],
    };
  };
  const partPending = (stage: unknown) => (stage ? undefined : failed ? toc.unwritten : toc.pending);
  const entries: ContentsEntry[] = [
    { id: sectionId("opening"), label: toc.opening, sections: ["glance", "overview"] },
    { id: sectionId("facets"), label: toc.facets, sections: ["facets", ...FACETS] },
    { id: sectionId("part-one"), kicker: toc.partOne, label: t.stages.b, pending: partPending(stages.b), children: CHAPTERS.b.map((key, i) => chapterEntry(key, i)) },
    { id: sectionId("part-two"), kicker: toc.partTwo, label: t.stages.c, pending: partPending(stages.c), children: CHAPTERS.c.map((key, i) => chapterEntry(key, i + CHAPTERS.b.length)) },
    ...(maps ? [{ id: sectionId("maps"), label: toc.maps, sections: ["maps"] }] : []),
    ...(keep ? [{ id: sectionId("keep"), label: toc.keep, sections: ["keep"] }] : !over ? [{ id: sectionId("keep"), label: toc.keep, pending: toc.pending }] : []),
  ];

  // The glance, the bar, then the text and what follows it (the maps, the end): siblings in the reading's column.
  return (
    <div ref={root} className={styles.leaf}>
      <Glance stages={{ ...stages, a }} failed={failed} packet={packet} cards={cards} locale={locale} landing={landing}
        kicker={kicker ?? (firstName ? `${r.kicker} · ${firstName}` : r.kicker)} onBegin={() => goTo(sectionId("opening"))} />

      <ReadingBar locale={locale} sectionTitle={current.title} lit={current.lit} showCards={maps}
        contentsOpen={contentsOpen} cardsOpen={cardsOpen} barRef={bar} contentsRef={contentsButton} cardsRef={cardsButton}
        onContents={() => { setCardsOpen(false); setContentsOpen(true); }} onCards={() => setCardsOpen((o) => !o)} />

      <Opening stages={{ ...stages, a }} packet={packet} cards={cards} locale={locale} onWhy={onWhy} />
      <FacetSpread stages={{ ...stages, a }} packet={packet} cards={cards} locale={locale} onWhy={onWhy} />

      <div className={styles.text}>
        <div id={sectionId("part-one")} tabIndex={-1} className={styles.anchor}>{CHAPTERS.b.map((key, i) => chapter(key, i))}</div>
        <div id={sectionId("part-two")} tabIndex={-1} className={styles.anchor}>{CHAPTERS.c.map((key, i) => chapter(key, i + CHAPTERS.b.length))}</div>

        <p className={styles.sr} role="status" aria-live="polite">{said}</p>
      </div>

      {maps && <Maps packet={packet} cards={cards} locale={locale} className={`${styles.mapsArea} ${styles.anchor}`} />}

      {over && (
        <footer id={sectionId("keep")} tabIndex={-1} className={`${styles.footer} ${styles.anchor}`} data-keep={keep ? "" : undefined} {...registerSection("keep", keep ? toc.keep : newLabel ?? r.newPortrait, [])}>
          {keep}
          <p className={styles.note}>{t.note}</p>
          <button type="button" className={styles.again} onClick={onNew}>{newLabel ?? r.newPortrait}</button>
        </footer>
      )}

      {maps && (
        <MiniMap open={cardsOpen} packet={packet} cards={cards} locale={locale} lit={current.lit} section={current.title} anchor={bar}
          onClose={(back) => { setCardsOpen(false); if (back) cardsButton.current?.focus(); }} />
      )}
      <Contents open={contentsOpen} sections={entries} current={current.id} locale={locale} anchor={bar}
        onClose={(back) => { setContentsOpen(false); if (back) contentsButton.current?.focus(); }} />
    </div>
  );
}

function ChapterPassage({ chapterKey, chapter, kicker, practice, children }: {
  chapterKey: string;
  chapter: Chapter;
  kicker: string;
  practice: string;
  children: ReactNode;
}) {
  return (
    <article className={styles.passage}>
      <p className={styles.chapterKicker}>{kicker}</p>
      <h2 id={`${sectionId(chapterKey)}-title`} className={styles.heading}>{chapter.title}</h2>
      <p className={styles.lede}>{chapter.lede}</p>
      {chapter.paragraphs.map((p, j) => <p key={j} className={styles.prose}>{p}</p>)}
      <div className={styles.practice}>
        <p className={styles.practiceKicker}>{practice}</p>
        <p className={styles.prose}>{chapter.practice}</p>
      </div>
      {children}
    </article>
  );
}

/** A chapter not yet written: its name, and engraved bars where its words will stand. */
function Placeholder({ id, section, title, kicker, pending }: { id: string; section: string; title: string; kicker: string; pending: string }) {
  return (
    <section id={id} tabIndex={-1} className={`${styles.chapter} ${styles.pending}`} aria-busy="true" aria-label={`${kicker}, ${pending}`} {...registerSection(section, title, [])}>
      <p className={styles.chapterKicker} aria-hidden="true">{kicker} · <span className={styles.pendingNote}>{pending}</span></p>
      <div className={styles.bars} aria-hidden="true">
        <span className={`${styles.bar} ${styles.barTitle}`} />
        <span className={`${styles.bar} ${styles.barLede}`} />
        <span className={`${styles.bar} ${styles.barLede} ${styles.barShort}`} />
        {[0, 1, 2, 3, 4].map((j) => <span key={j} className={`${styles.bar} ${styles.barLine}`} />)}
        <span className={`${styles.bar} ${styles.barLine} ${styles.barEnd}`} />
      </div>
    </section>
  );
}
