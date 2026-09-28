"use client";

/**
 * Deal a random spread and look at the whole: the same survey the reading
 * experience shows, so the learner can feel what is ordinary in a random draw.
 */

import { useCallback, useEffect, useState } from "react";
import { surveySpread } from "@/lib/learn/spread-survey";
import { loupeBackground } from "@/lib/learn/loupe";
import CARD_SYMBOLS from "@/lib/learn/card-symbols.json";
import styles from "./learn.module.css";

type Symbols = Record<string, { k: string; x: number; y: number; en: string; uk: string }[]>;
const SYMBOLS = CARD_SYMBOLS as unknown as Symbols;

interface Labels { size: string; deal: string; again: string; worth: string; lead: string; reversals: string }

function draw(count: number, reversals: boolean) {
  const deck = Array.from({ length: 78 }, (_, i) => i);
  const random = new Uint32Array(count * 2);
  crypto.getRandomValues(random);
  for (let i = 0; i < count; i++) {
    const j = i + (random[i] % (78 - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count).map((id, i) => ({ id, reversed: reversals && random[count + i] % 2 === 1 }));
}

export default function SurveyDemo({ locale, names, thumbs, images, labels }: {
  locale: "en" | "uk";
  names: string[];
  thumbs: string[];
  images: string[];
  labels: Labels;
}) {
  const [size, setSize] = useState(8);
  const [reversals, setReversals] = useState(false);
  const [cards, setCards] = useState<{ id: number; reversed: boolean }[]>([]);
  const deal = useCallback(() => setCards(draw(size, reversals)), [size, reversals]);
  useEffect(() => { deal(); }, [deal]);
  const symbols = (id: number) => (SYMBOLS[id] || []).map((s) => ({ key: s.k, name: s[locale], x: s.x, y: s.y }));
  const { facts } = cards.length ? surveySpread(cards, { locale, reversals, symbols }) : { facts: [] };

  return (
    <div className={styles.demo}>
      <p className={styles.sectionLead}>{labels.lead}</p>
      <div className={styles.demoControls}>
        <div role="radiogroup" aria-label={labels.size} className={styles.segment}>
          {[3, 5, 8, 10].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={size === n} onClick={() => setSize(n)}>{n}</button>
          ))}
        </div>
        <label className={styles.check}><input type="checkbox" checked={reversals} onChange={(e) => setReversals(e.target.checked)} /> {labels.reversals}</label>
        <button type="button" className={styles.primary} onClick={deal}>{cards.length ? labels.again : labels.deal}</button>
      </div>
      <ol className={styles.dealt} aria-live="polite">
        {cards.map((card, i) => (
          <li key={`${card.id}-${i}`} style={{ animationDelay: `${i * 60}ms` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
            <img src={thumbs[card.id]} alt="" width={120} height={206} data-reversed={card.reversed ? "true" : undefined} />
            <span>{names[card.id]}</span>
          </li>
        ))}
      </ol>
      <ul className={styles.surveyList}>
        {facts.map((fact) => (
          <li key={fact.id} data-notable={fact.notable ? "true" : undefined}>
            <p className={styles.surveyFact}><strong>{fact.label}</strong>{fact.odds && <span>{fact.notable ? `${labels.worth} · ` : ""}{fact.odds}</span>}</p>
            {fact.id === "echo" && (fact as { cards?: number[]; key?: string }).cards && (
              <span className={styles.surveyLoupes}>
                {((fact as { cards?: number[] }).cards || []).map((id) => {
                  const s = symbols(id).find((v) => v.key === (fact as { key?: string }).key);
                  if (!s) return null;
                  const bg = loupeBackground(s);
                  return <span key={id} className={styles.surveyLoupe} style={{ backgroundImage: `url("${images[id]}")`, backgroundSize: bg.size, backgroundPosition: bg.position }} />;
                })}
              </span>
            )}
            <p className={styles.surveyAsk}>{fact.ask}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
