"use client";

/**
 * The card of the day, dealt face down on the lifted band. When first seen it straightens towards the reader
 * once (the approach); it then waits under a still halo, never a pulsing invitation. One turn (the birth
 * chart's turnOver keyframes, never a double-back flip), then one pass of light: the homepage's card-material
 * sweep on the face, or the CSS sheen once where WebGL is not available. The name and lines follow after a
 * short hold. A card already turned today arrives face up and flat, with no approach and no light replayed.
 *
 * The art and its wrapper persist across the turn (only the overlaying control changes from a button to a
 * link), so the light keeps the same host.
 */

import { useEffect, useLayoutEffect, useRef, useState, type AnimationEvent, type RefObject } from "react";
import type { DeckCard } from "@/lib/daily/deck";
import { cardSrc, cardSrcSet } from "@/lib/daily/card-src";
import { useCardLight } from "./useCardLight";
import { typeset } from "./typeset";
import { useEntry, prefersReducedMotion } from "./useEntry";
import a from "@/components/astrology/astrology.module.css";
import d from "./daily.module.css";

const UI = {
  en: { lead: "Turn it when you are ready.", turn: "Turn the card of the day", upright: "Upright", reversed: "Reversed" },
  uk: { lead: "Переверніть її, коли будете готові.", turn: "Перевернути карту дня", upright: "Пряме положення", reversed: "Перевернуте положення" },
};

/** Mounted only for a card still to be turned: its one light pass is the only reason for a WebGL context. */
function TurnLight({ host, awakenRef }: { host: RefObject<HTMLSpanElement | null>; awakenRef: RefObject<(() => void) | null> }) {
  const light = useCardLight(host, { pointer: false });
  useEffect(() => { awakenRef.current = light.awaken; return () => { awakenRef.current = null; }; }, [light, awakenRef]);
  return null;
}

export default function DayCard({ locale, card, reversed, faceUp, onTurn }: {
  locale: "en" | "uk"; card: DeckCard; reversed: boolean; faceUp: boolean; onTurn: () => void;
}) {
  const t = UI[locale];
  const [open, setOpen] = useState(faceUp);
  const [settled, setSettled] = useState(faceUp);
  const [sheen, setSheen] = useState(false);
  const [turnedHere] = useState(!faceUp);
  const wrap = useRef<HTMLDivElement | null>(null);
  const flip = useRef<HTMLDivElement | null>(null);
  // where the card stood face down, read at the turn
  const before = useRef<number | null>(null);
  const face = useRef<HTMLSpanElement | null>(null);
  const heading = useRef<HTMLHeadingElement | null>(null);
  const awaken = useRef<(() => void) | null>(null);
  const focusNext = useRef(false);
  const entry = useEntry(wrap, 0.4);

  useEffect(() => { if (open && focusNext.current) { focusNext.current = false; heading.current?.focus(); } }, [open]);

  // A face-down card centred with its short prompt (a first visit's pause) moves aside for the longer reading:
  // it glides there as it turns (one translate, the turn's own length) instead of jumping at the click.
  useLayoutEffect(() => {
    const el = flip.current, x = before.current;
    before.current = null;
    if (!open || !el || x === null || prefersReducedMotion()) return;
    const dx = x - el.getBoundingClientRect().left;
    if (Math.abs(dx) > 0.5) el.animate([{ translate: `${dx}px 0` }, { translate: "0 0" }], { duration: 1100, easing: "cubic-bezier(.16, 1, .3, 1)" });
  }, [open]);

  function turn() {
    before.current = flip.current?.getBoundingClientRect().left ?? null;
    setOpen(true); onTurn(); focusNext.current = true;
    if (prefersReducedMotion()) setSettled(true);
  }

  function turned(event: AnimationEvent) {
    if (!/turnOver|dayTurn/.test(event.animationName) || settled) return;
    setSettled(true);
    awaken.current?.();
    // card-material unhides its canvas on the face within a few frames of the pass. A canvas that never shows
    // (a failed context) counts as no light, like no canvas at all (no WebGL, both slots taken): the CSS sheen
    // then passes once instead.
    const until = performance.now() + 500;
    const check = () => {
      if (face.current?.querySelector("canvas.card-material-light:not([hidden])")) return;
      if (performance.now() > until) setSheen(true); else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }

  const srcSet = cardSrcSet(card.image, { max: 640 });
  return (
    <div className={`${d.dayCard} ${open ? a.turned : ""}`} ref={wrap} data-entry={turnedHere ? entry : undefined} data-face={open ? "up" : "down"}>
      <div className={`${a.flip} ${d.dayFlip}`} ref={flip}>
        <div className={d.approach}>
          <div className={`${a.flipInner} ${d.dayInner} ${settled ? a.flat : open ? `${a.turning} ${d.turning}` : ""}`} onAnimationEnd={turned}>
            <span className={`${a.flipBack} ${d.daySide}`} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- static card back */}
              <img src="/cards/back-448.webp" alt="" width={448} height={769} loading="lazy" decoding="async" />
            </span>
            <span className={`${a.flipFront} ${d.daySide}`} ref={face} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: responsive srcset from public/cards */}
              <img src={cardSrc(card.image, 640)} srcSet={srcSet || undefined} sizes={srcSet ? "(min-width: 1024px) clamp(14rem, 18vw, 16rem), min(64vw, 15rem)" : undefined}
                alt="" width={448} height={768} loading="lazy" decoding="async" className={reversed ? d.reversedArt : undefined} />
              {sheen && <span className={a.sheen} />}
            </span>
          </div>
          {/* face down, the card itself is a pointer target only: the primary button beside it is the keyboard and screen-reader path */}
          {open
            ? <a href={card.href} className={d.cardHit} aria-label={card.name} />
            : <button type="button" className={d.cardHit} onClick={turn} aria-label={t.turn} tabIndex={-1} aria-hidden />}
        </div>
      </div>
      <div className={d.dayCardText}>
        {open ? (
          <div className={d.dayReveal} data-reveal={turnedHere ? "turn" : undefined}>
            <h3 className={d.dayName} tabIndex={-1} ref={heading}>{card.name}</h3>
            <p className={d.dayOrientation}>{reversed ? t.reversed : t.upright}</p>
            <p className={d.dayText}>{typeset((reversed ? card.reversed : card.upright) || card.essence, locale)}</p>
            {card.question && <p className={d.dayQuestion}>{typeset(card.question, locale)}</p>}
          </div>
        ) : (
          <>
            <p className={d.dayLead}>{t.lead}</p>
            <button type="button" className={d.primary} onClick={turn}>{t.turn}</button>
          </>
        )}
      </div>
      {turnedHere && <TurnLight host={face} awakenRef={awaken} />}
    </div>
  );
}
