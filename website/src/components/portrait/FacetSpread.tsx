"use client";

/**
 * The five facets as a spread (direction A): five columns under hairlines,
 * each with the card that stands for it, its name, its heading and its first
 * sentence, so the whole can be read at a glance. Opening one unfolds its
 * full text in a row beneath the spread (a list on a phone, the text under
 * its own row): its cards laid over one another with captions, the text at
 * the body measure, what it was read from and the way into why. One facet is
 * open at a time; while one is, the reading bar and the mini-map follow it.
 * The columns ink in, 90 ms apart, when the spread first comes into view.
 */

import { Fragment, useMemo, useRef, useState, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import { facetCards, firstSentence } from "@/lib/portrait/digest.js";
import { ROLES, litPositions } from "@/lib/portrait/lattice.js";
import type { PortraitPacket, PortraitStages } from "./client";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import { cardsAt } from "./Lattice";
import { CardArt, ReadFrom, inkAt, tieDashes } from "./Opening";
import { registerSection, useSeen } from "./sections";
import styles from "./facets.module.css";

export const FACETS = ["temperament", "inner", "gifts", "bonds", "direction"] as const;
type FacetKey = (typeof FACETS)[number];
type StageA = NonNullable<PortraitStages["a"]>;
type Text = { en: string; uk: string };
const roles = ROLES as Record<number, Text>;
const ID = "portrait-facets";

export default function FacetSpread({ stages, packet, cards, locale, onWhy }: {
  stages: PortraitStages & { a: StageA };
  packet: PortraitPacket;
  cards: MajorCard[];
  locale: PortraitLocale;
  /** "Why these cards?" under a facet, with the button pressed, so focus can return to it. */
  onWhy: (key: string, trigger: HTMLElement) => void;
}) {
  const t = PORTRAIT_COPY[locale];
  const f = t.facets;
  const a = stages.a;
  const root = useRef<HTMLElement>(null);
  const seen = useSeen(root);
  const [open, setOpen] = useState<FacetKey | null>(null);
  const cardAt = useMemo(() => cardsAt(packet, cards), [packet, cards]);
  const chosen = useMemo(() => facetCards(a as never, packet) as Record<FacetKey, number | null>, [a, packet]);

  const keys = FACETS.filter((key) => a.facets[key]);
  // A reading kept without its cards has none to show: the columns start at their names.
  const anyCard = keys.some((key) => { const pos = chosen[key]; return pos !== null && Boolean(cardAt[pos]); });
  const lit = (refs: string[]) => litPositions(refs ?? [], packet) as number[];
  const toggle = (key: FacetKey) => setOpen((was) => (was === key ? null : key));
  // The spread is one section; while a facet is open it is that facet.
  const reading = open ? a.facets[open] : undefined;
  const section = reading && open ? registerSection(open, reading.heading, lit(reading.refs)) : registerSection("facets", t.toc.facets, []);

  return (
    <section ref={root} id={ID} tabIndex={-1} className={`${styles.facets} ${seen ? styles.seen : ""}`} aria-labelledby={`${ID}-title`} {...section}>
      <header className={`${styles.facetsHead} ${styles.ink}`} style={inkAt(0)}>
        <h2 id={`${ID}-title`} className={styles.hSection}>{t.toc.facets}</h2>
        <p className={styles.hint}>{f.hint}</p>
      </header>

      <div className={styles.grid}>
        {keys.map((key, i) => {
          const facet = a.facets[key];
          const on = open === key;
          const pos = chosen[key];
          const card = pos !== null ? cardAt[pos] : undefined;
          const cited = lit(facet.refs).filter((p) => cardAt[p]);
          const head = `${ID}-${key}`;
          const panel = `${ID}-${key}-text`;
          return (
            <Fragment key={key}>
              {/* The whole column opens the facet to a pointer; its "+" is the way for the keyboard and a screen reader. */}
              <div className={`${styles.facet} ${styles.ink}`} style={inkAt(i + 1)} data-open={on || undefined}
                onClick={(e) => { if (!(e.target as Element).closest("button")) toggle(key); }}>
                {anyCard && (
                  <span className={styles.thumb} data-card-label={card && pos !== null ? `${pos} · ${roles[pos][locale]} · ${card.name}` : "off"}>
                    {card && <CardArt card={card} sizes="72px" />}
                  </span>
                )}
                <p className={styles.facetLabel}>{f.names[key]}</p>
                <h3 id={head} className={styles.facetHead}>{facet.heading}</h3>
                <p className={styles.facetFirst}>{tieDashes(firstSentence(facet.text))}</p>
                <button type="button" className={styles.cue} aria-expanded={on} aria-controls={panel}
                  aria-label={(on ? f.close : f.read).replace("{heading}", facet.heading)} onClick={() => toggle(key)}>
                  <span className={styles.cueText}>{t.reader.close}</span>
                  <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M6 1.5v9M1.5 6h9" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                </button>
              </div>

              {/* Closed, it leaves the tab order and the landmarks at once, while it folds away. */}
              <div id={panel} role={on ? "region" : undefined} aria-labelledby={on ? head : undefined} className={styles.panel} data-open={on || undefined}>
                <div className={styles.panelInner} inert={!on}>
                  <div className={styles.panelContent}>
                    {cited.length > 0 && (
                      <div className={styles.panelCards}>
                        {/* The cards as objects; their names are in the captions beneath. */}
                        <div className={styles.cascade} style={{ "--n": cited.length } as CSSProperties} aria-hidden="true">
                          {cited.map((p, j) => (
                            <span key={p} className={styles.cas} style={{ "--i": j } as CSSProperties} data-card-label={`${p} · ${roles[p][locale]} · ${cardAt[p]?.name}`}>
                              <CardArt card={cardAt[p] as MajorCard} sizes="(max-width: 999px) 72px, 94px" />
                            </span>
                          ))}
                        </div>
                        <ul className={styles.caps}>
                          {cited.map((p) => (
                            <li key={p}><span className={styles.capRole}>{roles[p][locale]}</span> <span className={styles.capName}>{cardAt[p]?.name}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className={styles.panelText}>
                      <p className={styles.prose}>{tieDashes(facet.text)}</p>
                      <ReadFrom refs={facet.refs ?? []} packet={packet} cards={cards} locale={locale} name={facet.heading} onWhy={(trigger) => onWhy(key, trigger)} />
                    </div>
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
