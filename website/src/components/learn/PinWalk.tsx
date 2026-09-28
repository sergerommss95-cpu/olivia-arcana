"use client";

/** Look first: describe the bare card, then reveal what is carved, one pin at a time, and only then what it carries. */

import { useState } from "react";
import styles from "./learn.module.css";

export interface WalkCard { id: number; name: string; image: string; href: string; symbols: { x: number; y: number; name: string; seen: string; meaning: string }[] }
interface Labels { choose: string; yours: string; placeholder: string; start: string; next: string; meanings: string; seen: string; meaning: string; again: string; open: string }

export default function PinWalk({ cards, labels }: { cards: WalkCard[]; labels: Labels }) {
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [shown, setShown] = useState(0);
  const [meanings, setMeanings] = useState(false);
  const card = cards[index];
  const choose = (i: number) => { setIndex(i); setDraft(""); setShown(0); setMeanings(false); };
  return (
    <div>
      <p className={styles.toolLabel}>{labels.choose}</p>
      <div className={styles.cardPicker} role="radiogroup" aria-label={labels.choose}>
        {cards.map((c, i) => (
          <button key={c.id} type="button" role="radio" aria-checked={i === index} className={styles.cardPick} onClick={() => choose(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- card art */}
            <img src={c.image} width={896} height={1536} alt="" />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      <div className={styles.walk}>
        <figure className={styles.walkPlate}>
          {/* eslint-disable-next-line @next/next/no-img-element -- card art */}
          <img src={card.image} width={896} height={1536} alt={card.name} />
          {card.symbols.slice(0, shown).map((s, i) => (
            <span key={i} className={styles.walkPin} style={{ left: `${s.x}%`, top: `${s.y}%` }} data-latest={i === shown - 1 ? "true" : undefined}>{i + 1}</span>
          ))}
        </figure>
        <div>
          <label className={styles.writeField}>
            <span>{labels.yours}</span>
            <textarea rows={4} maxLength={500} value={draft} placeholder={labels.placeholder} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <div className={styles.drillActions}>
            {shown < card.symbols.length ? (
              <button type="button" className={styles.primary} onClick={() => setShown((n) => n + 1)}>{shown === 0 ? labels.start : labels.next}</button>
            ) : !meanings ? (
              <button type="button" className={styles.primary} onClick={() => setMeanings(true)}>{labels.meanings}</button>
            ) : (
              <button type="button" className={styles.secondary} onClick={() => choose((index + 1) % cards.length)}>{labels.again}</button>
            )}
            <a href={card.href} className={styles.textLink}>{labels.open}</a>
          </div>
          <ol className={styles.walkList} aria-live="polite">
            {card.symbols.slice(0, shown).map((s, i) => (
              <li key={i}>
                <strong>{i + 1}. {s.name}</strong>
                <p><span>{labels.seen}</span>{s.seen}</p>
                {meanings && <p><span>{labels.meaning}</span>{s.meaning}</p>}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
