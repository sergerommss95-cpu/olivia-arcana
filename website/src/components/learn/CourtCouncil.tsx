"use client";

/** A council of courts: choose up to three and read them as qualities you could use, never as people. */

import { useState } from "react";
import styles from "./learn.module.css";

export interface CourtCard { id: number; name: string; thumb: string; temperament: string; gifts: string; shadow: string }
interface Labels { choose: string; ask: string; yours: string; placeholder: string; reveal: string; hide: string; temperament: string; gifts: string; shadow: string; ranks: string[]; suits: string[] }

export default function CourtCouncil({ courts, labels }: { courts: CourtCard[]; labels: Labels }) {
  const [chosen, setChosen] = useState<number[]>([courts[2].id, courts[9].id]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const toggle = (id: number) => { setOpen(false); setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? [...c.slice(1), id] : [...c, id])); };
  const picked = chosen.map((id) => courts.find((c) => c.id === id)!);
  return (
    <div>
      <p className={styles.toolLabel}>{labels.choose}</p>
      <div className={styles.courtGrid}>
        <span />
        {labels.suits.map((s) => <span key={s} className={styles.courtHead}>{s}</span>)}
        {labels.ranks.map((rank, r) => (
          <div key={rank} className={styles.courtRow}>
            <span className={styles.courtHead}>{rank}</span>
            {labels.suits.map((_, s) => {
              const card = courts[s * 4 + r];
              return (
                <button key={card.id} type="button" aria-pressed={chosen.includes(card.id)} className={styles.courtPick} onClick={() => toggle(card.id)} title={card.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                  <img src={card.thumb} alt={card.name} width={120} height={206} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className={styles.lensPrompt}>{labels.ask}</p>
      <label className={styles.writeField}>
        <span>{labels.yours}</span>
        <textarea rows={3} maxLength={600} value={draft} placeholder={labels.placeholder} onChange={(e) => setDraft(e.target.value)} />
      </label>
      <div className={styles.drillActions}>
        <button type="button" className={styles.primary} aria-expanded={open} onClick={() => setOpen((o) => !o)} disabled={!picked.length}>{open ? labels.hide : labels.reveal}</button>
      </div>
      {open && (
        <div className={styles.councilCards}>
          {picked.map((card) => (
            <article key={card.id}>
              <h3>{card.name}</h3>
              <p><span>{labels.temperament}</span>{card.temperament}</p>
              <p><span>{labels.gifts}</span>{card.gifts}</p>
              <p><span>{labels.shadow}</span>{card.shadow}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
