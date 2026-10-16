"use client";

/**
 * The lattice's shared parts: one card with its back and its art, and the
 * threads between cards. The Laying deals and turns them; the glance lays the
 * defining ones on its table; the mini-map lights them. Each context sets their state by props and custom properties
 * (--back-dim, --front-dim), so lattice.module.css stays the one place the
 * card and its threads are drawn.
 */

import { useId, type CSSProperties } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import type { PortraitPacket } from "./client";
import styles from "./lattice.module.css";

/** Each Arkan position's card in this packet. */
export function cardsAt(packet: PortraitPacket, cards: MajorCard[]) {
  const out: Record<number, MajorCard | undefined> = {};
  for (const f of packet.factors) if (f.kind === "arkan" && f.position !== undefined && f.card !== undefined) out[f.position] = cards[f.card];
  return out;
}

export function LatticeCard({ pos, card, turned, label, sizes, onArt, className, style }: {
  pos: number;
  card: MajorCard | undefined;
  turned: boolean;
  /** The card's accessible name, e.g. «Card 5, Conscious aim, The Emperor». */
  label: string;
  /** The rendered width of the art, for srcset. */
  sizes: string;
  /** Called once the art is decoded (or failed), so a turn can wait for it. */
  onArt?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`${styles.card} ${turned ? styles.turned : ""} ${className ?? ""}`} style={style} role="img" aria-label={label} data-pos={pos} data-turned={turned}>
      <span className={`${styles.face} ${styles.back}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- the deck's own back, one cached file */}
        <img src="/cards/back-448.webp" alt="" width={448} height={769} decoding="async" />
      </span>
      {/* The thumbnail (cached since the Laying) lies under the art, so a card shown larger never turns to a blank face. */}
      <span className={`${styles.face} ${styles.front}`} style={card ? { backgroundImage: `url(${card.thumb})` } : undefined}>
        {card && (
          // eslint-disable-next-line @next/next/no-img-element -- the card's own art, loaded before its turn
          <img src={card.image} srcSet={`${card.thumb} 120w, ${card.image} 896w`} sizes={sizes} alt="" width={896} height={1536} decoding="async"
            onLoad={onArt && ((e) => { e.currentTarget.decode().catch(() => {}).finally(onArt); })}
            onError={onArt} />
        )}
      </span>
    </div>
  );
}

export type Thread = { from: number; to: number; d: string };

/**
 * Latent threads (dotted) under lit ones (solid). "hidden" and "drawing" draw
 * the latent threads in through a mask; "shown" lays them at rest. A lit
 * thread either draws along its length ("draw") or fades up ("fade").
 */
export function Threads({ width, height, lines, on, draw, lit, className }: {
  width: number;
  height: number;
  lines: Thread[];
  on: (line: Thread) => boolean;
  draw: "hidden" | "drawing" | "shown";
  lit: "draw" | "fade";
  className?: string;
}) {
  const maskId = `threads-${useId().replace(/[^\w-]/g, "")}`;
  const masked = draw !== "shown";
  return (
    <svg className={`${styles.threads} ${className ?? ""}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {masked && (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
            {lines.map((line, k) => (
              <path key={k} d={line.d} pathLength={1} className={`${styles.draw} ${draw === "drawing" ? styles.drawing : ""}`} style={{ "--k": k } as CSSProperties} />
            ))}
          </mask>
        </defs>
      )}
      <g mask={masked ? `url(#${maskId})` : undefined}>
        {lines.map((line, k) => <path key={k} d={line.d} className={styles.latent} />)}
      </g>
      {lines.map((line, k) => (
        <path key={k} d={line.d} pathLength={1} className={`${lit === "draw" ? styles.drawn : styles.faded} ${on(line) ? styles.on : ""}`} />
      ))}
    </svg>
  );
}
