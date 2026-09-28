"use client";

/** Your spread in one sentence: a gentle helper (length, cards named, softer words) and the cover test. */

import { useMemo, useState } from "react";
import { sentenceHelp } from "@/lib/learn/phrase-check";
import BANK from "@/lib/learn/phrase-bank.json";
import styles from "./learn.module.css";

interface Card { name: string; thumb: string }
interface Labels { lead: string; yours: string; placeholder: string; words: string; names: string; noNames: string; consider: string; cover: string; uncover: string; coverNote: string; deal: string }

export default function Sentence({ locale, cards, labels }: { locale: "en" | "uk"; cards: Card[]; labels: Labels }) {
  const [dealt, setDealt] = useState<number[]>([17, 40, 65]);
  const [text, setText] = useState("");
  const [covered, setCovered] = useState(false);
  const help = useMemo(() => sentenceHelp(text, locale, BANK, dealt.map((i) => cards[i].name)), [text, locale, dealt, cards]);
  const deal = () => {
    const pick = new Set<number>();
    const random = new Uint32Array(12);
    crypto.getRandomValues(random);
    for (const r of random) { pick.add(r % cards.length); if (pick.size === 3) break; }
    setDealt([...pick]); setText(""); setCovered(false);
  };
  return (
    <div>
      <p className={styles.sectionLead}>{labels.lead}</p>
      <ol className={styles.sentenceCards} data-covered={covered ? "true" : undefined}>
        {dealt.map((i) => (
          <li key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
            <img src={cards[i].thumb} alt="" width={120} height={206} />
            <span>{cards[i].name}</span>
          </li>
        ))}
      </ol>
      <label className={styles.writeField}>
        <span>{labels.yours}</span>
        <textarea rows={2} maxLength={400} value={text} placeholder={labels.placeholder} onChange={(e) => setText(e.target.value)} />
      </label>
      {text.trim() && (
        <div className={styles.helper} aria-live="polite">
          <p data-over={help.words > help.limit ? "true" : undefined}>{labels.words.replace("{n}", String(help.words)).replace("{limit}", String(help.limit))}</p>
          <p>{help.named.length ? labels.names.replace("{list}", help.named.join(", ")) : labels.noNames}</p>
          {help.swaps.length > 0 && <p>{labels.consider} {help.swaps.map((s: { from: string; to: string }) => `${s.from} → ${s.to}`).join(" · ")}</p>}
        </div>
      )}
      <div className={styles.drillActions}>
        <button type="button" className={styles.primary} onClick={() => setCovered((c) => !c)} disabled={!text.trim()}>{covered ? labels.uncover : labels.cover}</button>
        <button type="button" className={styles.secondary} onClick={deal}>{labels.deal}</button>
      </div>
      {covered && <p className={styles.lensPrompt}>{labels.coverNote}</p>}
    </div>
  );
}
