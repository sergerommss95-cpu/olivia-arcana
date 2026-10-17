"use client";

/**
 * The frontispiece plate: the day's leading event set in the deck's own art, so it changes daily. An aspect
 * or the Moon's contact is a facing pair joined by a hairline chord that carries the aspect glyph; a lunation
 * is the Moon's and the Sun's cards; anything else is the planet's single card. The overlap is one fixed,
 * neutral geometry for every aspect family (geometry never encodes a verdict), and each card is captioned as
 * a planet's correspondence ("Mars’s card"), so The Tower reads as a correspondence, never an omen.
 *
 * Setting down: when asked to land, card A's art is decoded first (never longer than 600ms), then the
 * keyframes run with that wait taken out of their delays, so the whole plate still settles within ~1.6s.
 * Fine pointers get card-material light on card A only, with no sweep here.
 */

import { useEffect, useId, useRef, useState, type AnimationEvent, type CSSProperties, type RefObject } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import AspectGlyph from "./AspectGlyph";
import CardFigure, { RoleLine } from "./CardFigure";
import type { LeadEvent } from "./lead-event";
import { useCardLight } from "./useCardLight";
import d from "./daily.module.css";

/** Mounted only for fine pointers, so touch screens never create a WebGL context for the plate. */
function PointerLight({ host }: { host: RefObject<HTMLSpanElement | null> }) {
  useCardLight(host, { pointer: true });
  return null;
}

export default function HeroPlate({ event, cards, roles, day, land, onSettled }: {
  event: LeadEvent;
  cards: MajorCard[];
  /** One role line per card, e.g. "Mars’s card · Fifth house". */
  roles: string[];
  /** Day of the month, for the ghost numeral. */
  day: number;
  /**
   * "hold" keeps the cards unseen until the reading is ready, then "arrival" sets the whole plate down.
   * "pair" (honoured only when the plate mounts, after a sign change brought new cards) re-lands just the
   * cards. false is still.
   */
  land: "hold" | "arrival" | "pair" | false;
  onSettled?: () => void;
}) {
  const pair = event.cards.length > 1;
  const [a, b] = event.cards.map((id) => cards[id]);
  const imgA = useRef<HTMLImageElement | null>(null);
  const faceA = useRef<HTMLSpanElement | null>(null);
  const [run, setRun] = useState<{ kind: "arrival" | "pair"; waited: number } | null>(null);
  const [first] = useState(land);
  const [fine] = useState(() => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  const settled = useRef(false);
  const capId = useId();
  // once set down, the plate drops its landing state, so its finished keyframes no longer hold the captions
  // (a later sign change then fades them with the text instead of cutting them)
  const [landed, setLanded] = useState(false);

  const kind = land === "arrival" ? "arrival" : land === "pair" && first === "pair" ? "pair" : null;
  useEffect(() => {
    if (!kind) return;
    let live = true;
    const t0 = performance.now();
    const go = () => { if (!live) return; live = false; setRun({ kind, waited: Math.round(performance.now() - t0) }); };
    const cap = setTimeout(go, 600);
    imgA.current?.decode().then(go, go);
    return () => { live = false; clearTimeout(cap); };
  }, [kind]);
  const state = landed ? undefined : run ? `${run.kind}-play` : kind ? `${kind}-wait` : land === "hold" ? "hold" : undefined;

  // the arrival is written as played on the final landing, never at its start, so a remount mid-flight replays cleanly
  const onEnd = (e: AnimationEvent<HTMLElement>) => {
    if (settled.current || !e.animationName.includes("cardLand")) return;
    const target = e.target as HTMLElement;
    const inB = !!target.closest(`.${d.plateB}`);
    const bShown = pair && !!target.closest(`.${d.plate}`)?.querySelector(`.${d.plateB}`)?.getClientRects().length;
    if (inB || !bShown) {
      settled.current = true;
      onSettled?.();
      // the chord is still drawing: drop the landing state only once every time-based keyframe has finished
      const running = e.currentTarget.getAnimations({ subtree: true }).filter((x) => x.timeline === document.timeline);
      Promise.allSettled(running.map((x) => x.finished)).then(() => setLanded(true));
    }
  };

  return (
    <figure className={d.plate} data-kind={pair ? "pair" : "single"} data-land={state} aria-labelledby={[a, b].filter(Boolean).map((_, i) => `${capId}-${i}`).join(" ")}
      style={{ "--waited": `${run?.waited ?? 0}ms` } as CSSProperties} onAnimationEnd={onEnd}>
      <span className={d.plateGhost} aria-hidden><span>{day}</span></span>
      <div className={d.plateCards}>
        <div className={d.plateExitA}>
          <CardFigure as="div" className={d.plateA} name={a.name} href={a.href} image={a.image} rotate={pair ? -5 : -2.5} elevation="lift"
            priority faceRef={faceA} imgRef={imgA} sizes={pair ? "(min-width: 900px) clamp(11rem, 13vw, 13rem), (max-width: 359px) min(56vw, 13rem), min(42vw, 10.5rem)" : "(min-width: 900px) clamp(15rem, 20vw, 19rem), min(60vw, 15rem)"} />
        </div>
        {pair && b && (
          <div className={d.plateExitB}>
            <CardFigure as="div" className={d.plateB} name={b.name} href={b.href} image={b.image} rotate={4} elevation="lift"
              sizes="(min-width: 900px) clamp(11rem, 13vw, 13rem), min(42vw, 10.5rem)" />
          </div>
        )}
      </div>
      {pair && event.aspect && <span className={d.chord} aria-hidden><span className={d.chordDisc}><AspectGlyph aspect={event.aspect} /></span></span>}
      <figcaption className={`${d.plateCaps} ${d.swap}`}>
        {[a, b].filter(Boolean).map((card, i) => (
          <span key={card.id} className={`${d.plateCap} ${i === 1 ? d.plateCapB : ""}`}>
            <span className={d.capTitle} id={`${capId}-${i}`}>{card.name}</span>
            <span className={d.capRole}><RoleLine text={roles[i]} /></span>
          </span>
        ))}
      </figcaption>
      {fine && <PointerLight host={faceA} />}
    </figure>
  );
}
