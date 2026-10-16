"use client";

/**
 * The card of the day, dealt face down. One turn (never a double-back flip), then one soft pass of
 * light across the face — the same card motion as the birth chart's three cards (astrology.module.css).
 * Turned today on this device, it arrives already face up.
 */

import { useEffect, useRef, useState } from "react";
import type { DeckCard } from "@/lib/daily/deck";
import a from "@/components/astrology/astrology.module.css";
import d from "./daily.module.css";

const UI = {
  en: { lead: "Turn it when you are ready.", turn: "Turn the card of the day", back: "The back of an Olivia card", upright: "Upright", reversed: "Reversed", open: "Open the card’s page" },
  uk: { lead: "Переверніть її, коли будете готові.", turn: "Перевернути карту дня", back: "Сорочка карти Olivia", upright: "Пряме положення", reversed: "Перевернуте положення", open: "Відкрити сторінку карти" },
};

export default function DayCard({ locale, card, reversed, faceUp, onTurn }: {
  locale: "en" | "uk"; card: DeckCard; reversed: boolean; faceUp: boolean; onTurn: () => void;
}) {
  const t = UI[locale];
  const [open, setOpen] = useState(faceUp);
  const [settled, setSettled] = useState(faceUp);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const focusNext = useRef(false);

  useEffect(() => { if (open && focusNext.current) { focusNext.current = false; heading.current?.focus(); } }, [open]);

  function turn() {
    setOpen(true); onTurn(); focusNext.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setSettled(true);
  }

  return (
    <div className={`${d.dayCard} ${open ? a.turned : ""}`}>
      <div className={`${a.flip} ${d.dayFlip}`}>
        {open ? (
          <a href={card.href} aria-label={`${t.open}: ${card.name}`} className={`${a.flipInner} ${settled ? a.flat : faceUp ? "" : a.turning}`}
            onAnimationEnd={(event) => { if (event.animationName.includes("turnOver")) setSettled(true); }}>
            <span className={a.flipBack} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- static card back */}
              <img src="/cards/back-448.webp" alt="" width={448} height={769} />
            </span>
            <span className={a.flipFront}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static card art */}
              <img src={card.image} alt="" width={448} height={768} className={reversed ? d.reversedArt : undefined} />
              <span className={a.sheen} aria-hidden />
            </span>
          </a>
        ) : (
          <button type="button" className={a.flipInner} onClick={turn} aria-label={t.turn}>
            <span className={a.flipBack}>
              {/* eslint-disable-next-line @next/next/no-img-element -- static card back */}
              <img src="/cards/back-448.webp" alt={t.back} width={448} height={769} />
            </span>
            <span className={a.flipFront} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- preloaded face, shown on turning */}
              <img src={card.image} alt="" width={448} height={768} loading="lazy" />
            </span>
          </button>
        )}
      </div>
      <div className={d.dayCardText}>
        {open ? (
          <div className={a.revealText}>
            <h3 className={a.h3} tabIndex={-1} ref={heading}>{card.name}</h3>
            <p className={a.cardName}>{reversed ? t.reversed : t.upright}</p>
            <p className={a.note}>{(reversed ? card.reversed : card.upright) || card.essence}</p>
            {card.question && <p className={a.question}>{card.question}</p>}
          </div>
        ) : (
          <>
            <p className={a.dealtLead}>{t.lead}</p>
            <button type="button" className={a.primary} onClick={turn}>{t.turn}</button>
          </>
        )}
      </div>
    </div>
  );
}
