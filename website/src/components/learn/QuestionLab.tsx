"use client";

/**
 * Question lab: write a question, see gentle notes on closed, mind-reading or
 * sensitive wording, then deal three cards and ask whether each could answer
 * it usefully. Suggests only; never blocks.
 */

import { useMemo, useState } from "react";
import { checkQuestion } from "@/lib/learn/phrase-check";
import BANK from "@/lib/learn/phrase-bank.json";
import styles from "./learn.module.css";
import SupportLines, { type SupportLabels } from "./SupportLines";

interface Card { name: string; thumb: string; essence: string }
interface Labels { yours: string; placeholder: string; open: string; closed: string; mind: string; care: string; support: SupportLabels; tryInstead: string; deal: string; again: string; ask: string; examples: string; empty: string }
type Entry = { id: string; note: string; support?: boolean; example?: { from: string; to: string } };

export default function QuestionLab({ locale, cards, labels }: { locale: "en" | "uk"; cards: Card[]; labels: Labels }) {
  const [question, setQuestion] = useState("");
  const [dealt, setDealt] = useState<number[]>([]);
  const result = useMemo(() => checkQuestion(question, locale, BANK), [question, locale]);
  const bank = (BANK as unknown as Record<string, { closed: Entry[]; thirdParty: Entry[] }>)[locale];
  const unique = (entries: Entry[]) => entries.filter((e, i, all) => all.findIndex((x) => x.note === e.note) === i).slice(0, 1);
  const quote = (text: string) => (locale === "uk" ? `«${text}»` : `“${text}”`);
  const groups: [string, Entry[]][] = [[labels.closed, unique(result.closed as Entry[])], [labels.mind, unique(result.thirdParty as Entry[])], [labels.care, unique(result.sensitive as Entry[])]];
  const any = groups.some(([, e]) => e.length);
  const deal = () => {
    const pick = new Set<number>();
    const random = new Uint32Array(12);
    crypto.getRandomValues(random);
    for (const r of random) { pick.add(r % cards.length); if (pick.size === 3) break; }
    setDealt([...pick]);
  };
  const examples = [...bank.closed, ...bank.thirdParty].filter((e) => e.example).slice(0, 4);

  return (
    <div>
      <label className={styles.writeField}>
        <span>{labels.yours}</span>
        <textarea rows={2} maxLength={400} value={question} placeholder={labels.placeholder} onChange={(e) => setQuestion(e.target.value)} />
      </label>
      <div className={styles.labNotes} aria-live="polite">
        {question.trim() && !any && <p className={styles.labOpen}>{labels.open}</p>}
        {groups.map(([title, entries]) => entries.length > 0 && (
          <div key={title} className={styles.labNote}>
            <p className={styles.toolLabel}>{title}</p>
            {entries.map((entry) => (
              <div key={entry.id}>
                {entry.support ? <SupportLines labels={labels.support} /> : <p>{entry.note}</p>}
                {entry.example && <p className={styles.labExample}><span>{labels.tryInstead}</span>{quote(entry.example.to)}</p>}
              </div>
            ))}
          </div>
        ))}
      </div>
      {!question.trim() && (
        <div className={styles.labExamples}>
          <p className={styles.toolLabel}>{labels.examples}</p>
          <ul>{examples.map((e) => <li key={e.id}><button type="button" onClick={() => setQuestion(e.example!.from)}>{quote(e.example!.from)}</button></li>)}</ul>
        </div>
      )}
      <div className={styles.drillActions}>
        <button type="button" className={styles.primary} onClick={deal} disabled={!question.trim()}>{dealt.length ? labels.again : labels.deal}</button>
      </div>
      {dealt.length > 0 && (
        <ol className={styles.labCards}>
          {dealt.map((i) => (
            <li key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
              <img src={cards[i].thumb} alt="" width={120} height={206} />
              <div>
                <strong>{cards[i].name}</strong>
                <p>{cards[i].essence}</p>
                <p className={styles.labAsk}>{labels.ask}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
