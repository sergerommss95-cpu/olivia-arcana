"use client";

/**
 * The position changes the card: the reader writes what this card says in each
 * position of the three-card spread before seeing Olivia's reading, then tries
 * the swap test. Olivia's texts stay in the page for readers who skip ahead.
 */

import { useState } from "react";
import styles from "./card-leaf.module.css";

export interface PrismPosition {
  key: string;
  label: string;
  question: string;
  text: string;
}

interface Labels {
  lead: string;
  yours: string;
  placeholder: string;
  show: string;
  hide: string;
  olivia: string;
  showAll: string;
  swapTitle: string;
  swapBody: string;
  tryIt: string;
}

export default function PositionPrism({ positions, labels, tryHref }: { positions: PrismPosition[]; labels: Labels; tryHref: string }) {
  const [drafts, setDrafts] = useState<string[]>(positions.map(() => ""));
  const [open, setOpen] = useState<boolean[]>(positions.map(() => false));
  const written = drafts.filter((d) => d.trim()).length;

  return (
    <div className={styles.prism}>
      <p className={styles.sectionLead}>{labels.lead}</p>
      <ol className={styles.positions}>
        {positions.map((position, i) => (
          <li key={position.key} className={styles.prismCard} data-open={open[i] ? "true" : undefined}>
            <span className={styles.positionNo} aria-hidden>{["I", "II", "III"][i]}</span>
            <h3>{position.label}</h3>
            <p className={styles.prismQuestion}>{position.question}</p>
            <label className={styles.prismLabel}>
              <span>{labels.yours}</span>
              <textarea
                rows={3}
                maxLength={400}
                value={drafts[i]}
                placeholder={labels.placeholder}
                onChange={(event) => setDrafts((all) => all.map((d, j) => (j === i ? event.target.value : d)))}
              />
            </label>
            <button
              type="button"
              className={styles.prismToggle}
              aria-expanded={open[i]}
              aria-controls={`prism-${position.key}`}
              onClick={() => setOpen((all) => all.map((o, j) => (j === i ? !o : o)))}
            >
              {open[i] ? labels.hide : labels.show}
            </button>
            <div id={`prism-${position.key}`} className={styles.prismAnswer} hidden={!open[i]}>
              <span className={styles.prismAnswerLabel}>{labels.olivia}</span>
              <p>{position.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className={styles.prismFooter}>
        {open.some((o) => !o) && (
          <button type="button" className={styles.prismShowAll} onClick={() => setOpen(positions.map(() => true))}>{labels.showAll}</button>
        )}
        <a className={styles.prismTry} href={tryHref}>{labels.tryIt}</a>
      </div>
      {written >= 2 && (
        <aside className={styles.swapTest} aria-live="polite">
          <h3>{labels.swapTitle}</h3>
          <p>{labels.swapBody}</p>
          <ol>
            {drafts.map((d, i) => d.trim() && <li key={i}><span>{positions[i].label}</span>{d}</li>)}
          </ol>
        </aside>
      )}
    </div>
  );
}
