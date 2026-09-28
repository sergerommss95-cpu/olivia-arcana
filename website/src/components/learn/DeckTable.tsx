"use client";

/** The forty number cards on one table: read a number across the suits, or find the missing step. */

import { useState } from "react";
import styles from "./learn.module.css";

export interface TableCard { id: number; suit: number; number: number; name: string; thumb: string; numberText: string; essence: string }
interface Labels { numbers: string; missing: string; pick: string; yours: string; placeholder: string; reveal: string; hide: string; question: string; ranks: string[]; ace: string; missingAsk: string; another: string; suits: string[] }

export default function DeckTable({ cards, labels, mode: initial = "numbers" }: { cards: TableCard[]; labels: Labels; mode?: "numbers" | "missing" }) {
  const [mode, setMode] = useState<"numbers" | "missing">(initial);
  const [number, setNumber] = useState(5);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [gap, setGap] = useState({ suit: 1, at: 7 });
  const at = (suit: number, n: number) => cards.find((c) => c.suit === suit && c.number === n)!;
  const column = cards.filter((c) => c.number === number).sort((a, b) => a.suit - b.suit);
  const newGap = () => { setGap({ suit: Math.floor(Math.random() * 4), at: 2 + Math.floor(Math.random() * 8) }); setOpen(false); setDraft(""); };

  return (
    <div className={styles.deckTable}>
      <div role="tablist" className={styles.lensTabs}>
        <button type="button" role="tab" aria-selected={mode === "numbers"} onClick={() => { setMode("numbers"); setOpen(false); }}>{labels.numbers}</button>
        <button type="button" role="tab" aria-selected={mode === "missing"} onClick={() => { setMode("missing"); setOpen(false); }}>{labels.missing}</button>
      </div>
      {mode === "numbers" ? (
        <>
          <p className={styles.toolLabel}>{labels.pick}</p>
          <div className={styles.numberRow} role="radiogroup" aria-label={labels.pick}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={number === n} onClick={() => { setNumber(n); setOpen(false); setDraft(""); }}>{n === 1 ? labels.ace : n}</button>
            ))}
          </div>
          <ol className={styles.tableRow}>
            {column.map((card) => (
              <li key={card.id}>
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                <img src={card.thumb} alt="" width={120} height={206} />
                <span>{card.name}</span>
                {open && <p className={styles.tableText}>{card.numberText}</p>}
              </li>
            ))}
          </ol>
          <p className={styles.lensPrompt}>{labels.question.replace("{rank}", labels.ranks[number])}</p>
        </>
      ) : (
        <>
          <p className={styles.toolLabel}>{labels.suits[gap.suit]}</p>
          <ol className={styles.tableRow}>
            {[gap.at - 1, gap.at, gap.at + 1].map((n, i) => {
              const card = at(gap.suit, n);
              const hidden = i === 1 && !open;
              return (
                <li key={n} data-hidden={hidden ? "true" : undefined}>
                  {hidden ? <span className={styles.faceDown} aria-label="?" /> : (
                    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail
                    <img src={card.thumb} alt="" width={120} height={206} />
                  )}
                  <span>{hidden ? "?" : card.name}</span>
                  {open && i === 1 && <p className={styles.tableText}>{card.essence}</p>}
                </li>
              );
            })}
          </ol>
          <p className={styles.lensPrompt}>{labels.missingAsk}</p>
        </>
      )}
      <label className={styles.writeField}>
        <span>{labels.yours}</span>
        <textarea rows={3} maxLength={600} value={draft} placeholder={labels.placeholder} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <div className={styles.drillActions}>
        <button type="button" className={styles.primary} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? labels.hide : labels.reveal}</button>
        {mode === "missing" && <button type="button" className={styles.secondary} onClick={newGap}>{labels.another}</button>}
      </div>
    </div>
  );
}
