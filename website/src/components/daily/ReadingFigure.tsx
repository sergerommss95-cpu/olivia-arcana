"use client";

/**
 * The reader's own sign card beside the reading (Leo → Strength, Libra → Justice), captioned as the sign's
 * card with its Major numeral and the sign's essence. On tall desktop windows it is pinned with native
 * sticky; elsewhere the same figure sits inline after the first paragraph (two copies, only one ever
 * displayed). It settles once when first seen; the reading text never moves.
 */

import { useRef } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import CardFigure from "./CardFigure";
import { useEntry } from "./useEntry";
import d from "./daily.module.css";

const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

export default function ReadingFigure({ card, role, essence, variant }: {
  card: MajorCard;
  /** "The card of Leo" / «Карта Лева»; the numeral is added here. */
  role: string;
  essence: string;
  variant: "aside" | "inline";
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const entry = useEntry(ref);
  return (
    <div className={variant === "aside" ? d.readingAside : d.readingInline} ref={ref} data-entry={entry}>
      <CardFigure name={card.name} href={card.href} image={card.image} rotate={-2} elevation="lift" className={d.readingCard}
        sizes={variant === "aside" ? "clamp(16rem, 20vw, 19rem)" : "min(60vw, 15rem)"}
        caption={{ title: card.name, role: `${role} · ${ROMAN[card.id] ?? card.id}`, note: essence }} />
    </div>
  );
}
