"use client";

/**
 * One life area as a printed spread: its ruling planet's card at figure size beside the area's text (or,
 * when the hero already shows that card, the card of the sign the planet stands in, captioned as that
 * correspondence), the house number as a ghost numeral on the outer side, and a museum caption that carries
 * the area's own placement line by line. The second spread is mirrored. Each spread settles once when first
 * seen; nothing is pinned or swapped on scroll.
 */

import { useRef, type ReactNode } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import CardFigure from "./CardFigure";
import { useEntry } from "./useEntry";
import d from "./daily.module.css";

const ROTATIONS = [-2.5, 2, -1.5];

export default function AreaSpread({ index, card, house, ghost = true, title, roles, text }: {
  index: number;
  card: MajorCard;
  house: number;
  /** The house numeral; left out when the spread before shows the same house. */
  ghost?: boolean;
  title: ReactNode;
  /** Caption lines under the card's name, each its own line ("Moon · Sixth house", "until 19 October, 04:39"). */
  roles: string[];
  text: string;
}) {
  // the figure is what is watched: on phones the whole spread is taller than the screen, and its heading is never hidden
  const fig = useRef<HTMLDivElement | null>(null);
  const entry = useEntry(fig, 0.2);
  return (
    <article className={d.spread} data-entry={entry} data-side={index % 2 ? "right" : "left"}>
      <h3 className={d.areaName}>{title}</h3>
      <div className={d.spreadFigure} ref={fig}>
        {ghost && <span className={d.houseGhost} aria-hidden>{house}</span>}
        <CardFigure name={card.name} href={card.href} image={card.image} rotate={ROTATIONS[index % 3]} elevation="lift"
          sizes="(min-width: 1024px) clamp(16rem, 20vw, 19rem), min(64vw, 15rem)" caption={{ title: card.name, role: roles }} />
      </div>
      <p className={d.areaText}>{text}</p>
    </article>
  );
}
