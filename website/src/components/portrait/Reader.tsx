"use client";

/**
 * The reading, orchestrated: the glance first, then the reading bar, the
 * opening, the five-facet spread, the chapters, the numbers and maps, and the
 * closing band. The reader keeps one current section (the one crossing its
 * reading line); the bar's running head and the mini-map follow it. Each section says what it is
 * with `registerSection` on its own element, and may change it in place (a
 * facet opening). The chapters stand as plates in two parts (ChapterPlate):
 * quiet plates while a part is written, filling as it lands.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import type { PortraitPacket, PortraitStages, PortraitStatus } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import type { Frames } from "./Laying";
import Glance, { type Landing } from "./Glance";
import ReadingBar from "./ReadingBar";
import MiniMap from "./MiniMap";
import Contents, { type ContentsEntry } from "./Contents";
import Opening from "./Opening";
import FacetSpread, { FACETS } from "./FacetSpread";
import { NUMERALS, Part } from "./ChapterPlate";
import Maps, { MAPS_ID } from "./Maps";
import { goTo, readSection, registerSection, sameSection, sectionId, type Section } from "./sections";
import styles from "./reader.module.css";

const CHAPTERS = { b: ["mind", "heart", "work"], c: ["shadow", "love", "becoming"] } as const;
type ChapterKey = (typeof CHAPTERS)["b" | "c"][number];
/** The reading line: a band at 40–45% of the window's height. */
const READING_LINE = "-40% 0px -55% 0px";

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

export default function Reader({ stages, status, packet, cards, locale, frames, firstName, kicker, keep, newLabel, announce, landing, onWhy, onNew }: {
  stages: PortraitStages;
  status: PortraitStatus | null;
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** What each card's place means, said to the reader: under the cards on each chapter's plate. */
  frames: Frames;
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

  // A failure leaves one notice, in the first part not written; a later part not written is left out.
  const unwrittenPart = failed ? (!stages.b ? 1 : !stages.c ? 2 : 0) : 0;
  const chapterOf = (key: ChapterKey) => stages.b?.chapters[key] ?? stages.c?.chapters[key];
  const shared = { packet, cards, locale, frames, onWhy };

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
  // A part left out after a failure is gone to by the notice above it.
  const partId = (n: 1 | 2, key: string) => (unwrittenPart && n > unwrittenPart ? sectionId("unfinished") : sectionId(key));
  const entries: ContentsEntry[] = [
    { id: sectionId("opening"), label: toc.opening, sections: ["glance", "overview"] },
    { id: sectionId("facets"), label: toc.facets, sections: ["facets", ...FACETS] },
    { id: partId(1, "part-one"), kicker: toc.partOne, label: t.stages.b, pending: partPending(stages.b), sections: ["part-one"], children: CHAPTERS.b.map((key, i) => chapterEntry(key, i)) },
    { id: partId(2, "part-two"), kicker: toc.partTwo, label: t.stages.c, pending: partPending(stages.c), sections: ["part-two"], children: CHAPTERS.c.map((key, i) => chapterEntry(key, i + CHAPTERS.b.length)) },
    ...(maps ? [{ id: MAPS_ID, label: toc.maps, sections: ["numbers", "maps"] }] : []),
    ...(keep ? [{ id: sectionId("keep"), label: toc.keep, sections: ["keep"] }] : !over ? [{ id: sectionId("keep"), label: toc.keep, pending: toc.pending }] : []),
  ];

  // Beside the tools for keeping, the way out steps back; without them (the example, a failure) it leads.
  const wayOut = <button type="button" className={styles.again} onClick={onNew}>{newLabel ?? r.newPortrait}</button>;

  // The glance, the bar, then the text and what follows it (the numbers and maps, the end): siblings in the reading's column.
  return (
    <div ref={root} className={styles.leaf}>
      <Glance stages={{ ...stages, a }} failed={failed} packet={packet} cards={cards} locale={locale} landing={landing}
        kicker={kicker ?? (firstName ? `${r.kicker} · ${firstName}` : r.kicker)} onBegin={() => goTo(sectionId("opening"))} />

      <ReadingBar locale={locale} sectionTitle={current.title} lit={current.lit} showCards={maps}
        contentsOpen={contentsOpen} cardsOpen={cardsOpen} barRef={bar} contentsRef={contentsButton} cardsRef={cardsButton}
        onContents={() => { setCardsOpen(false); setContentsOpen(true); }} onCards={() => setCardsOpen((o) => !o)} />

      <Opening stages={{ ...stages, a }} packet={packet} cards={cards} locale={locale} onWhy={onWhy} />
      <FacetSpread stages={{ ...stages, a }} packet={packet} cards={cards} locale={locale} onWhy={onWhy} />

      <Part n={1} title={t.stages.b} chapters={CHAPTERS.b} from={0} stage={stages.b} unfinished={unwrittenPart === 1 ? unfinished : undefined} {...shared} />
      {unwrittenPart !== 1 && (
        <Part n={2} title={t.stages.c} chapters={CHAPTERS.c} from={CHAPTERS.b.length} stage={stages.c} unfinished={unwrittenPart === 2 ? unfinished : undefined} {...shared} />
      )}

      <p className={styles.sr} role="status" aria-live="polite">{said}</p>

      {maps && <Maps packet={packet} cards={cards} locale={locale} className={`${styles.mapsArea} ${styles.anchor}`} />}

      {/* The closing band: the tools for keeping (or, for the example, its label and title), then the honest line and the way out. */}
      {over && (
        <footer id={sectionId("keep")} tabIndex={-1} className={`${styles.closing} ${styles.anchor}`} data-keep={keep ? "" : undefined} {...registerSection("keep", keep ? toc.keep : newLabel ?? r.newPortrait, [])}>
          {keep ?? (
            <div className={styles.closingRow}>
              {kicker && (
                <div className={styles.closingHead}>
                  <p className={styles.closingKicker}>{kicker}</p>
                  <p className={styles.closingTitle}>{a.title}</p>
                </div>
              )}
              <div className={styles.closingTools}>{wayOut}</div>
            </div>
          )}
          <div className={styles.closingFoot}>
            <p className={styles.note}>{t.note}</p>
            {keep && wayOut}
          </div>
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
