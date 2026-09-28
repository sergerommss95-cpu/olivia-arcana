"use client";

/**
 * The Celtic Cross without an outcome card: ten cards dealt at random into
 * Waite's layout and read through Olivia's ten questions. Look at the whole
 * first, then position by position, then one sentence for the spread.
 * Notes live in component state only.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { surveySpread } from "@/lib/learn/spread-survey";
import { loupeBackground } from "@/lib/learn/loupe";
import learn from "./learn.module.css";
import styles from "./celtic-cross.module.css";

export interface CrossCard {
  name: string;
  thumb: string;
  slug: string;
  essence: string;
  /** Rarer carved symbols: [key, x %, y %, name]. */
  symbols: [string, number, number, string][];
}

export interface CrossPosition {
  name: string;
  question: string;
  waite: string;
  pair: string;
  with: number | null;
}

interface Labels {
  lead: string; positions: string; slot: string; written: string; whole: string; wholeLead: string; worth: string; begin: string; back: string;
  position: string; fromPage: string; newTab: string; yours: string; placeholder: string; goTo: string; waite: string;
  sentence: string; sentenceLead: string; sentenceField: string; sentencePlaceholder: string; step: string; stepPlaceholder: string;
  check: string; toCross: string; again: string; againNote: string; cardPage: string;
}

type Fact = { id: string; label: string; odds: string; notable: boolean; ask: string; key?: string; cards?: number[] };

const COUNT = 10;

function draw(size: number) {
  const deck = Array.from({ length: size }, (_, i) => i);
  const random = new Uint32Array(COUNT);
  crypto.getRandomValues(random);
  for (let i = 0; i < COUNT; i++) {
    const j = i + (random[i] % (size - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, COUNT);
}

const fullImage = (thumb: string) => thumb.replace("/cards/thumbs/", "/cards/");
const carved = (card: CrossCard) => card.symbols.map(([key, x, y, name]) => ({ key, x, y, name }));
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));

export default function CelticCross({ locale, cards, positions, labels }: {
  locale: "en" | "uk";
  cards: CrossCard[];
  positions: CrossPosition[];
  labels: Labels;
}) {
  const [dealt, setDealt] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState<string[]>(() => Array(COUNT).fill(""));
  const [sentence, setSentence] = useState("");
  const [step, setStep] = useState("");
  const deskId = useId();
  const deskRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  // What to do once the desk has re-rendered: bring it into view, or move focus to its heading.
  const after = useRef<"reveal" | "focus" | null>(null);
  const [moves, setMoves] = useState(0);
  // The region turns live in the same update as the first deal, so that deal is not read out
  // on load, but it is already live before the learner's first choice.
  const live = dealt.length ? "polite" : "off";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deal after mount so the server HTML and first render match
    setDealt(draw(cards.length));
  }, [cards.length]);

  useEffect(() => {
    const action = after.current;
    after.current = null;
    if (action === "focus") headingRef.current?.focus();
    if (action === "reveal" && deskRef.current) {
      // Stacked layouts put the desk below the cards: follow the choice down.
      const top = deskRef.current.getBoundingClientRect().top;
      if (top > window.innerHeight - 160) {
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        deskRef.current.scrollIntoView({ block: "start", behavior: still ? "auto" : "smooth" });
      }
    }
  }, [moves]);

  const choose = (position: number | null, then: "reveal" | "focus") => { after.current = then; setSelected(position); setMoves((m) => m + 1); };
  const deal = () => {
    setDealt(draw(cards.length));
    setMoves((m) => m + 1);
    setSelected(null);
    setNotes(Array(COUNT).fill(""));
    setSentence("");
    setStep("");
  };

  const facts = useMemo<Fact[]>(() => {
    if (dealt.length !== COUNT) return [];
    return surveySpread(dealt.map((id) => ({ id, reversed: false })), { locale, reversals: false, symbols: (id: number) => carved(cards[id]) }).facts as Fact[];
  }, [dealt, locale, cards]);
  const hasNotes = notes.some((n) => n.trim()) || sentence.trim() || step.trim();
  const index = selected === null ? null : selected - 1;
  const position = index === null ? null : positions[index];
  const card = index === null || dealt[index] === undefined ? null : cards[dealt[index]];

  return (
    <div className={styles.root}>
      <p className={learn.sectionLead}>{labels.lead}</p>

      <div className={styles.board}>
        <ol className={styles.spread} aria-label={labels.positions}>
          {positions.map((pos, i) => {
            const n = i + 1;
            const id = dealt[i];
            const here = id === undefined ? null : cards[id];
            const written = Boolean(notes[i].trim());
            const name = fill(labels.slot, { n, name: pos.name, card: here?.name ?? "" }).replace(/: $/, "");
            return (
              <li key={n} className={styles.slot} data-pos={n}>
                <button
                  type="button"
                  className={styles.slotButton}
                  aria-pressed={selected === n}
                  aria-controls={deskId}
                  aria-label={written ? `${name} (${labels.written})` : name}
                  onClick={() => choose(n, "reveal")}
                >
                  <span className={styles.card}>
                    {here && (
                      /* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */
                      <img key={`${id}-${n}`} src={here.thumb} alt="" width={120} height={206} style={{ animationDelay: `${i * 70}ms` }} />
                    )}
                  </span>
                  <span className={styles.label}>
                    <span className={styles.num}>{n}</span>
                    <span className={styles.name}>{pos.name}</span>
                    {written && <span className={styles.dot} aria-hidden="true" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div id={deskId} ref={deskRef} className={styles.desk}>
          {position && selected !== null ? (
            <>
              <div aria-live={live}>
                <h3 ref={headingRef} tabIndex={-1} className={styles.deskTitle}>
                  <span className={styles.deskNo} aria-hidden="true">{selected}</span>
                  <span><span className={styles.srOnly}>{fill(labels.position, { n: selected })}: </span>{position.name}</span>
                </h3>
                <p className={`${learn.lensPrompt} ${styles.question}`}>{position.question}</p>
                {card && (
                  <div className={styles.deskCard}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- card art, pre-sized */}
                    <img key={card.slug} src={fullImage(card.thumb)} alt="" width={896} height={1536} />
                    <div>
                      <a className={styles.cardLink} href={fill(labels.cardPage, { slug: card.slug })} target="_blank" rel="noopener">
                        {card.name}<span aria-hidden="true">{"\u00a0↗"}</span><span className={styles.srOnly}> ({labels.newTab})</span>
                      </a>
                      <p className={styles.fromPage}>{labels.fromPage}</p>
                      <p className={styles.essence}>{card.essence}</p>
                    </div>
                  </div>
                )}
              </div>
              <label className={learn.writeField}>
                <span>{fill(labels.yours, { n: selected })}</span>
                <textarea
                  rows={3}
                  maxLength={800}
                  value={notes[selected - 1]}
                  placeholder={labels.placeholder}
                  onChange={(e) => { const value = e.target.value; setNotes((all) => all.map((v, j) => (j === selected - 1 ? value : v))); }}
                />
              </label>
              <p className={styles.pairNote}>
                {position.pair}
                {position.with !== null && (
                  <>
                    {" "}
                    <button type="button" className={styles.pairLink} onClick={() => choose(position.with, "focus")}>{fill(labels.goTo, { n: position.with })}</button>
                  </>
                )}
              </p>
              <p className={styles.waite}><span>{labels.waite}</span>{position.waite}</p>
              <div className={learn.drillActions}>
                <button type="button" className={learn.secondary} onClick={() => choose(null, "focus")}>{labels.back}</button>
              </div>
            </>
          ) : (
            <>
              <div aria-live={live}>
                <h3 ref={headingRef} tabIndex={-1} className={styles.deskTitle}>{labels.whole}</h3>
                <p className={styles.wholeLead}>{labels.wholeLead}</p>
                <ul className={learn.surveyList}>
                  {facts.map((fact) => (
                    <li key={fact.id} data-notable={fact.notable ? "true" : undefined}>
                      <p className={learn.surveyFact}><strong>{fact.label}</strong>{fact.odds && <span>{fact.notable ? `${labels.worth} · ` : ""}{fact.odds}</span>}</p>
                      {fact.id === "echo" && fact.cards && (
                        <span className={learn.surveyLoupes}>
                          {fact.cards.map((id) => {
                            const s = carved(cards[id]).find((v) => v.key === fact.key);
                            if (!s) return null;
                            const bg = loupeBackground(s);
                            return <span key={id} className={learn.surveyLoupe} title={cards[id].name} style={{ backgroundImage: `url("${fullImage(cards[id].thumb)}")`, backgroundSize: bg.size, backgroundPosition: bg.position }} />;
                          })}
                        </span>
                      )}
                      <p className={learn.surveyAsk}>{fact.ask}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={learn.drillActions}>
                <button type="button" className={learn.primary} onClick={() => choose(1, "focus")} disabled={!facts.length}>{labels.begin}</button>
              </div>
            </>
          )}
        </div>
      </div>

      <section className={styles.close} aria-labelledby={`${deskId}-sentence`}>
        <h3 id={`${deskId}-sentence`} className={styles.closeTitle}>{labels.sentence}</h3>
        <p className={learn.sectionLead}>{labels.sentenceLead}</p>
        <div className={styles.closeFields}>
          <label className={learn.writeField}>
            <span>{labels.sentenceField}</span>
            <textarea rows={2} maxLength={400} value={sentence} placeholder={labels.sentencePlaceholder} onChange={(e) => setSentence(e.target.value)} />
          </label>
          <label className={learn.writeField}>
            <span>{labels.step}</span>
            <textarea rows={2} maxLength={300} value={step} placeholder={labels.stepPlaceholder} onChange={(e) => setStep(e.target.value)} />
          </label>
        </div>
        {sentence.trim() && (
          <div className={styles.check}>
            <p>{labels.check}</p>
            <button type="button" className={styles.pairLink} onClick={() => choose(1, "focus")}>{labels.toCross}</button>
          </div>
        )}
        <div className={learn.drillActions}>
          <button type="button" className={learn.secondary} onClick={deal}>{labels.again}</button>
          {hasNotes && <span className={styles.againNote}>{labels.againNote}</span>}
        </div>
      </section>
    </div>
  );
}
