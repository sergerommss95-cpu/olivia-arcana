"use client";

/** Position practice on a card of the reader's choosing (lesson: the position changes the card). */

import { useState } from "react";
import PositionPrism, { type PrismPosition } from "@/components/academy/PositionPrism";
import styles from "./learn.module.css";

export interface PrismCard {
  id: number;
  name: string;
  thumb: string;
  positions: PrismPosition[];
}

export default function PrismPractice({ cards, labels, choose, tryHref }: {
  cards: PrismCard[];
  labels: React.ComponentProps<typeof PositionPrism>["labels"];
  choose: string;
  tryHref: string;
}) {
  const [index, setIndex] = useState(0);
  const card = cards[index];
  return (
    <div>
      <p className={styles.toolLabel}>{choose}</p>
      <div className={styles.cardPicker} role="radiogroup" aria-label={choose}>
        {cards.map((c, i) => (
          <button key={c.id} type="button" role="radio" aria-checked={i === index} className={styles.cardPick} onClick={() => setIndex(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
            <img src={c.thumb} width={120} height={206} alt="" />
            <span>{c.name}</span>
          </button>
        ))}
      </div>
      <PositionPrism key={card.id} positions={card.positions} labels={labels} tryHref={tryHref} />
    </div>
  );
}
