"use client";

/**
 * Read a pair: two cards, five lenses, the learner's own sentence first, then
 * one reader's version from the card pages.
 */

import { useState } from "react";
import styles from "./learn.module.css";

export interface DrillPair {
  a: { id: number; name: string; image: string; href: string };
  b: { id: number; name: string; image: string; href: string };
  chips: string[];
  lenses: { id: string; title: string; prompt: string }[];
  readings: { from: string; text: string }[];
  href: string;
}

interface Labels { lens: string; yours: string; placeholder: string; reveal: string; hide: string; version: string; from: string; another: string; open: string }

export default function PairDrill({ pairs, labels, start = 0 }: { pairs: DrillPair[]; labels: Labels; start?: number }) {
  const [index, setIndex] = useState(start % pairs.length);
  const [lens, setLens] = useState(0);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const pair = pairs[index];
  const next = () => { setIndex((i) => (i + 1 + Math.floor(Math.random() * (pairs.length - 1))) % pairs.length); setLens(0); setDraft(""); setOpen(false); };

  return (
    <div className={styles.drill}>
      <div className={styles.drillCards}>
        {[pair.a, pair.b].map((card) => (
          <a key={card.id} href={card.href} className={styles.drillCard}>
            {/* eslint-disable-next-line @next/next/no-img-element -- card art, pre-sized */}
            <img src={card.image} alt="" width={896} height={1536} />
            <span>{card.name}</span>
          </a>
        ))}
      </div>
      {pair.chips.length > 0 && <ul className={styles.chips}>{pair.chips.map((chip) => <li key={chip}>{chip}</li>)}</ul>}
      <p className={styles.toolLabel}>{labels.lens}</p>
      <div role="tablist" className={styles.lensTabs}>
        {pair.lenses.map((l, i) => (
          <button key={l.id} type="button" role="tab" aria-selected={lens === i} onClick={() => setLens(i)}>{i + 1}. {l.title}</button>
        ))}
      </div>
      <p className={styles.lensPrompt} role="tabpanel">{pair.lenses[lens].prompt}</p>
      <label className={styles.writeField}>
        <span>{labels.yours}</span>
        <textarea rows={3} maxLength={600} value={draft} placeholder={labels.placeholder} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <div className={styles.drillActions}>
        <button type="button" className={styles.primary} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? labels.hide : labels.reveal}</button>
        <button type="button" className={styles.secondary} onClick={next}>{labels.another}</button>
        <a href={pair.href} className={styles.textLink}>{labels.open}</a>
      </div>
      {open && (
        <div className={styles.versions}>
          <p className={styles.toolLabel}>{labels.version}</p>
          {pair.readings.map((r) => (
            <figure key={r.from}>
              <blockquote><p>{r.text}</p></blockquote>
              <figcaption>{labels.from.replace("{name}", r.from)}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
