"use client";

/**
 * The reading, set as an almanac leaf: title and epigraph, the overview with
 * its drop cap, five facets and six chapters under fleurons, the keep plate,
 * and the maps it was read from. Each passage reports when it is being read (hovered, focused, or
 * crossing the reading line) so the dock can light its cards; its seals sit
 * beneath it with a "Why this" link. Chapters still being written stand as
 * engraved placeholders and ink in as they land.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { sealsFor } from "@/lib/portrait/seals.js";
import type { Chapter, PortraitPacket, PortraitStages, PortraitStatus } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import Maps from "./Maps";
import styles from "./reader.module.css";

/** From here the dock and the rail stand beside the text; below it they join a sticky bar. */
export const WIDE = "(min-width: 1100px)";
export const FACETS = ["temperament", "inner", "gifts", "bonds", "direction"] as const;
export const CHAPTERS = { b: ["mind", "heart", "work"], c: ["shadow", "love", "becoming"] } as const;
export const SECTIONS = ["opening", "mind", "heart", "work", "shadow", "love", "becoming", "keep", "maps"] as const;
export type SectionKey = (typeof SECTIONS)[number];
type ChapterKey = (typeof CHAPTERS)["b" | "c"][number];
type PassageEvents = {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
  onBlur: (e: FocusEvent<HTMLElement>) => void;
};
const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];
const CHAPTER_ORDER: ChapterKey[] = [...CHAPTERS.b, ...CHAPTERS.c];
/** The reading line: a band at 40–50% of the window's height. */
const READING_LINE = "-40% 0px -50% 0px";

export const sectionId = (key: string) => `portrait-${key}`;

/** True while the media query matches; false on the server. */
export function useMedia(query: string) {
  const subscribe = useCallback((change: () => void) => {
    const list = window.matchMedia(query);
    list.addEventListener("change", change);
    return () => list.removeEventListener("change", change);
  }, [query]);
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

/** A passage by key ("overview", a facet or a chapter): its heading (none for the overview), refs and teachings. */
export function passageOf(stages: PortraitStages, key: string): { heading?: string; refs: string[]; teachings: string[] } | null {
  if (key === "overview") return stages.a ? { refs: stages.a.overview.refs ?? [], teachings: stages.a.overview.teachings ?? [] } : null;
  const facet = stages.a?.facets[key];
  if (facet) return { heading: facet.heading, refs: facet.refs ?? [], teachings: facet.teachings ?? [] };
  const chapter = stages.b?.chapters[key] ?? stages.c?.chapters[key];
  return chapter ? { heading: chapter.title, refs: chapter.refs ?? [], teachings: chapter.teachings ?? [] } : null;
}

/** The refs of a passage: "overview", a facet key or a chapter key. */
export function passageRefs(stages: PortraitStages, key: string): string[] {
  return passageOf(stages, key)?.refs ?? [];
}

/** The maps are drawn from the packet alone; a reading kept without one has none. */
export const hasMaps = (packet: PortraitPacket) => packet.factors.some((f) => f.kind === "arkan");

/**
 * Which stage each section is written in, and whether it has landed, is still
 * being written, or never will be. The maps are ready from the start, or absent.
 */
export function sectionStates(stages: PortraitStages, failed: boolean, maps: boolean) {
  const out = {} as Record<SectionKey, "ready" | "pending" | "unwritten" | "absent">;
  for (const key of SECTIONS) {
    if (key === "maps") { out[key] = maps ? "ready" : "absent"; continue; }
    const stage = key === "opening" ? stages.a : (CHAPTERS.b as readonly string[]).includes(key) ? stages.b : stages.c;
    out[key] = stage ? "ready" : failed ? "unwritten" : "pending";
  }
  return out;
}

export default function Reader({ stages, status, packet, cards, locale, firstName, kicker, keep, newLabel, announce, onActive, onSection, onWhy, onNew }: {
  stages: PortraitStages;
  status: PortraitStatus | null;
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** The first word of the typed name, in memory only; absent on a reopened reading. */
  firstName?: string;
  /** In place of "Your portrait" above the title: the example says it is one. */
  kicker?: string;
  /** The tools for keeping a finished portrait, at its end. */
  keep?: ReactNode;
  /** The way out at the end, when it is not "Start a new portrait". */
  newLabel?: string;
  /** Something to say through the live region (a save, a download); `n` tells a repeat apart. */
  announce?: { text: string; n: number } | null;
  /** The passage lighting the dock, or null. */
  onActive: (key: string | null) => void;
  /** The section crossing the reading line. */
  onSection: (key: SectionKey) => void;
  /** "Why this" under a passage, with the button pressed, so focus can return to it. */
  onWhy: (key: string, trigger: HTMLElement) => void;
  onNew: () => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const r = t.reader;
  const a = stages.a;
  const failed = status?.status === "failed";
  const over = status?.status === "done" || failed;
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  /** What was already written when the reader opened: it inks in as one sequence; later stages start their own. */
  const [atOpen] = useState(() => ({ b: Boolean(stages.b), c: Boolean(stages.c) }));
  const root = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const report = useRef({ onActive, onSection });
  useEffect(() => { report.current = { onActive, onSection }; });

  // A new phase opens at its top, with focus on its heading.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    heading.current?.focus({ preventScroll: true });
  }, []);

  const active = hovered ?? focused ?? reading;
  useEffect(() => { report.current.onActive(active); }, [active]);

  // The reading line: the first passage and section crossing it are the ones being read.
  const landed = `${Boolean(stages.b)}${Boolean(stages.c)}${failed}`;
  useEffect(() => {
    const box = root.current;
    if (!box) return;
    const crossing = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) crossing.add(e.target); else crossing.delete(e.target);
      const inOrder = [...box.querySelectorAll<HTMLElement>("[data-section], [data-passage]")].filter((el) => crossing.has(el));
      const section = inOrder.find((el) => el.dataset.section)?.dataset.section as SectionKey | undefined;
      const passage = inOrder.find((el) => el.dataset.passage)?.dataset.passage;
      if (section) report.current.onSection(section);
      // Between passages the last one stays lit; the keep plate and the maps cite nothing.
      if (passage) setReading(passage);
      else if (section === "keep" || section === "maps") setReading(null);
    }, { rootMargin: READING_LINE });
    box.querySelectorAll("[data-section], [data-passage]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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

  const passageEvents = (key: string): PassageEvents => ({
    onMouseEnter: () => setHovered(key),
    onMouseLeave: () => setHovered((h) => (h === key ? null : h)),
    // Keyboard focus lights the passage; a mouse click leaves the reading line in charge.
    onFocus: (e: FocusEvent<HTMLElement>) => { if (e.target !== e.currentTarget || e.currentTarget.matches(":focus-visible")) setFocused(key); },
    onBlur: (e: FocusEvent<HTMLElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused((f) => (f === key ? null : f)); },
  });
  const seals = (key: string, refs: string[], name: string) => (
    <Seals key={`seals-${key}`} refs={refs} packet={packet} cards={cards} locale={locale} name={name} onWhy={(trigger) => onWhy(key, trigger)} />
  );

  // Ink-in, 90 ms apart: stage A passage by passage (kicker, title, epigraph,
  // overview, five facets), then each later stage from its own start as it lands.
  const ink = (n: number) => ({ "--n": n }) as CSSProperties;
  const startB = atOpen.b ? 4 + FACETS.length : 0;
  const startC = atOpen.c ? startB + CHAPTERS.b.length : 0;
  // A failure leaves one notice where the first unwritten chapter would be.
  const unwritten = failed ? CHAPTER_ORDER.find((key) => !(stages.b?.chapters[key] || stages.c?.chapters[key])) : undefined;

  // The text, then the maps and the end: siblings in the reading's grid, so the maps can stand wider.
  return (
    <div ref={root} className={styles.leaf}>
      <div className={styles.text} data-reader-text="">
        <section id={sectionId("opening")} data-section="opening" className={styles.opening} aria-labelledby={`${sectionId("opening")}-title`}>
          <p className={`${styles.kicker} ${styles.ink}`} style={ink(0)}>{kicker ?? (firstName ? `${r.kicker} · ${firstName}` : r.kicker)}</p>
          <h1 id={`${sectionId("opening")}-title`} ref={heading} tabIndex={-1} className={`${styles.title} ${styles.ink}`} style={ink(1)}>{a.title}</h1>
          <p className={`${styles.epigraph} ${styles.ink}`} style={ink(2)}>{a.epigraph}</p>
          <article className={`${styles.passage} ${styles.ink}`} style={ink(3)} data-passage="overview" data-active={active === "overview" || undefined} tabIndex={0} aria-label={r.sections.opening} {...passageEvents("overview")}>
            <p className={`${styles.prose} ${styles.overview}`}>{a.overview.text}</p>
            {seals("overview", a.overview.refs, r.sections.opening)}
          </article>
          {FACETS.map((key, i) => {
            const facet = a.facets[key];
            if (!facet) return null;
            return (
              <article key={key} className={`${styles.passage} ${styles.facet} ${styles.ink}`} style={ink(4 + i)} data-passage={key} data-active={active === key || undefined} tabIndex={0} aria-labelledby={`${sectionId(key)}-title`} {...passageEvents(key)}>
                <p className={styles.fleuron} aria-hidden="true">❦</p>
                <h2 id={`${sectionId(key)}-title`} className={styles.heading}>{facet.heading}</h2>
                <p className={styles.prose}>{facet.text}</p>
                {seals(key, facet.refs, facet.heading)}
              </article>
            );
          })}
        </section>

        {CHAPTER_ORDER.map((key, i) => {
          const order = i < CHAPTERS.b.length ? startB + i : startC + i - CHAPTERS.b.length;
          const chapter = stages.b?.chapters[key] ?? stages.c?.chapters[key];
          const kicker = `${NUMERALS[i]} · ${r.sections[key]}`;
          if (chapter) {
            return (
              <section key={key} id={sectionId(key)} data-section={key} className={`${styles.chapter} ${styles.ink}`} style={ink(order)} aria-labelledby={`${sectionId(key)}-title`}>
                <ChapterPassage chapterKey={key} chapter={chapter} kicker={kicker} active={active === key} events={passageEvents(key)} practice={r.practice}>
                  {seals(key, chapter.refs, chapter.title)}
                </ChapterPassage>
              </section>
            );
          }
          if (unwritten === key) {
            return (
              <section key={key} id={sectionId("unfinished")} className={`${styles.notice} ${styles.ink}`} style={ink(0)} aria-labelledby={`${sectionId("unfinished")}-title`}>
                <p id={`${sectionId("unfinished")}-title`} className={styles.noticeKicker}>{r.unfinishedTitle}</p>
                <p>{unfinished}</p>
              </section>
            );
          }
          if (failed) return null;
          return <Placeholder key={key} id={sectionId(key)} section={key} kicker={kicker} pending={r.pending} />;
        })}

        {stages.c ? (
          <section id={sectionId("keep")} data-section="keep" className={`${styles.keep} ${styles.ink}`} style={ink(startC + CHAPTERS.c.length)} tabIndex={-1} aria-labelledby={`${sectionId("keep")}-title`}>
            <p className={styles.fleuron} aria-hidden="true">❦</p>
            <h2 id={`${sectionId("keep")}-title`} className={styles.keepTitle} aria-label={t.keep}>{t.keep}</h2>
            <ul className={styles.keepLines}>{stages.c.keep.map((line, j) => <li key={j}>{line}</li>)}</ul>
          </section>
        ) : !failed && (
          <section id={sectionId("keep")} data-section="keep" className={`${styles.keep} ${styles.pending}`} aria-busy="true" tabIndex={-1} aria-label={`${r.sections.keep}, ${r.pending}`}>
            <p className={styles.fleuron} aria-hidden="true">❦</p>
            <p className={styles.chapterKicker} aria-hidden="true">{r.sections.keep} · <span className={styles.pendingNote}>{r.pending}</span></p>
            <div className={styles.bars} aria-hidden="true">
              {[0, 1, 2].map((j) => <span key={j} className={`${styles.bar} ${styles.barKeep}`} />)}
            </div>
          </section>
        )}

        <p className={styles.sr} role="status" aria-live="polite">{said}</p>
      </div>

      {hasMaps(packet) && <Maps packet={packet} cards={cards} locale={locale} className={styles.mapsArea} />}

      {over && (
        <footer className={styles.footer} data-keep={keep ? "" : undefined}>
          {keep}
          <p className={styles.note}>{t.note}</p>
          <button type="button" className={styles.again} onClick={onNew}>{newLabel ?? r.newPortrait}</button>
        </footer>
      )}
    </div>
  );
}

function ChapterPassage({ chapterKey, chapter, kicker, active, events, practice, children }: {
  chapterKey: string;
  chapter: Chapter;
  kicker: string;
  active: boolean;
  events: PassageEvents;
  practice: string;
  children: ReactNode;
}) {
  return (
    <article className={styles.passage} data-passage={chapterKey} data-active={active || undefined} tabIndex={0} aria-labelledby={`${sectionId(chapterKey)}-title`} {...events}>
      <p className={styles.fleuron} aria-hidden="true">❦</p>
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
function Placeholder({ id, section, kicker, pending }: { id: string; section: string; kicker: string; pending: string }) {
  return (
    <section id={id} data-section={section} className={`${styles.chapter} ${styles.pending}`} aria-busy="true" tabIndex={-1} aria-label={`${kicker}, ${pending}`}>
      <p className={styles.fleuron} aria-hidden="true">❦</p>
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

/** What a passage was read from, as small pills, and the way into why. */
function Seals({ refs, packet, cards, locale, name, onWhy }: {
  refs: string[];
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** The passage's name, so each "Why this" is told apart by a screen reader. */
  name: string;
  onWhy: (trigger: HTMLElement) => void;
}) {
  const r = PORTRAIT_COPY[locale].reader;
  const seals = sealsFor(refs, packet, locale, cards) as { kind: string; key: string; label: string; image?: string; glyph?: string }[];
  return (
    <div className={styles.sealRow}>
      {seals.length > 0 && (
        // role="list" keeps the list in the accessibility tree while its box is display: contents.
        <ul role="list" className={styles.seals} aria-label={r.readFrom}>
          {seals.map((s) => (
            <li key={s.key} className={styles.seal} data-kind={s.kind}>
              {/* eslint-disable-next-line @next/next/no-img-element -- the card's own thumbnail, lazily loaded */}
              {s.image && <img className={styles.sealCard} src={s.image} alt="" width={120} height={206} loading="lazy" decoding="async" />}
              {!s.image && s.glyph && <span className={styles.sealGlyph} aria-hidden="true">{s.glyph.length === 1 ? `${s.glyph}︎` : s.glyph}</span>}
              {/* A card seal carries its position, as the dock's captions do: two positions can hold the same card. */}
              {s.kind === "card" && <span className={styles.sealPos}>{s.key.replace("arkan-", "")}</span>}
              <span>{s.label}</span>
            </li>
          ))}
        </ul>
      )}
      {/* Named with its passage, so each is told apart. */}
      <button type="button" className={styles.why} aria-label={`${r.why}: ${name}`} aria-haspopup="dialog" onClick={(e) => onWhy(e.currentTarget)}>{r.why}</button>
    </div>
  );
}
