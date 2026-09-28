"use client";

/** A worked reading, step by step: try each step first, then compare with Olivia's notes. */

import { useState } from "react";
import styles from "./learn.module.css";

export interface WorkedStep { title: string; focus: number[]; tryFirst: string; notes: string }
export interface WorkedData { id: string; title: string; question: string; intro: string; cards: { name: string; image: string; position: string; reversed: boolean }[]; steps: WorkedStep[]; sentence: string; notSaid: string; carry: string }
interface Labels { quotes: [string, string]; step: string; yours: string; placeholder: string; reveal: string; hide: string; notes: string; next: string; previous: string; sentence: string; notSaid: string; carry: string; reversed: string; question: string }

export default function WorkedReading({ readings, labels }: { readings: WorkedData[]; labels: Labels }) {
  const [which, setWhich] = useState(0);
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState<boolean[]>([]);
  const [drafts, setDrafts] = useState<string[]>([]);
  const r = readings[which];
  const total = r.steps.length;
  const finished = step >= total;
  const s = r.steps[Math.min(step, total - 1)];
  const pick = (i: number) => { setWhich(i); setStep(0); setOpen([]); setDrafts([]); };
  return (
    <div>
      <div role="tablist" className={styles.lensTabs}>
        {readings.map((reading, i) => <button key={reading.id} type="button" role="tab" aria-selected={which === i} onClick={() => pick(i)}>{reading.title}</button>)}
      </div>
      <p className={styles.lensPrompt}><span className={styles.toolLabel}>{labels.question}</span>{labels.quotes[0]}{r.question}{labels.quotes[1]}</p>
      <p className={styles.sectionLead}>{r.intro}</p>
      <ol className={styles.workedCards}>
        {r.cards.map((card, i) => (
          <li key={i} data-focus={!finished && s.focus.includes(i) ? "true" : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element -- card art */}
            <img src={card.image} width={896} height={1536} alt="" data-reversed={card.reversed ? "true" : undefined} />
            <span className={styles.workedPos}>{i + 1}. {card.position}</span>
            <span>{card.name}{card.reversed ? ` · ${labels.reversed}` : ""}</span>
          </li>
        ))}
      </ol>
      {!finished ? (
        <section className={styles.workedStep} aria-live="polite">
          <p className={styles.toolLabel}>{labels.step.replace("{n}", String(step + 1)).replace("{t}", String(total))}</p>
          <h3>{s.title}</h3>
          <p className={styles.lensPrompt}>{s.tryFirst}</p>
          <label className={styles.writeField}>
            <span>{labels.yours}</span>
            <textarea rows={3} maxLength={800} value={drafts[step] || ""} placeholder={labels.placeholder} onChange={(e) => setDrafts((d) => { const n = [...d]; n[step] = e.target.value; return n; })} />
          </label>
          <div className={styles.drillActions}>
            <button type="button" className={styles.primary} aria-expanded={!!open[step]} onClick={() => setOpen((o) => { const n = [...o]; n[step] = !n[step]; return n; })}>{open[step] ? labels.hide : labels.reveal}</button>
            {step > 0 && <button type="button" className={styles.secondary} onClick={() => setStep((n) => n - 1)}>{labels.previous}</button>}
            <button type="button" className={styles.secondary} onClick={() => setStep((n) => n + 1)}>{labels.next}</button>
          </div>
          {open[step] && <div className={styles.versions}><p className={styles.toolLabel}>{labels.notes}</p><p className={styles.notesText}>{s.notes}</p></div>}
        </section>
      ) : (
        <section className={styles.workedStep}>
          <p className={styles.toolLabel}>{labels.sentence}</p>
          <p className={styles.bigQuote}>{labels.quotes[0]}{r.sentence}{labels.quotes[1]}</p>
          <p className={styles.toolLabel}>{labels.notSaid}</p>
          <p className={styles.notesText}>{r.notSaid}</p>
          <p className={styles.toolLabel}>{labels.carry}</p>
          <p className={styles.bigQuote}>{r.carry}</p>
          <div className={styles.drillActions}><button type="button" className={styles.secondary} onClick={() => setStep(0)}>{labels.previous}</button></div>
        </section>
      )}
    </div>
  );
}
