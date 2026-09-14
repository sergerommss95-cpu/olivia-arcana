"use client";

import Image from "next/image";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

/** A specimen from the actual deck, clearly separate from the reader's draw. */
export default function OracleFrontispiece({ uk, onBegin }: { uk: boolean; onBegin: () => void }) {
  const specimens = [ALL_CARDS[2], ALL_CARDS[17], ALL_CARDS[19]];
  return (
    <section className="oracle-front" aria-labelledby="oracle-title">
      <div className="oracle-front-copy">
        <p className="oracle-front-kicker">{uk ? "Аркуш I · Студія Таро" : "Plate I · The Tarot Studio"}</p>
        <h1 id="oracle-title">{uk ? <>Питання,<br /><em>яке ви несете.</em></> : <>The question<br /><em>you carry.</em></>}</h1>
        <p className="oracle-front-lead">{uk
          ? "Дайте йому форму. Оберіть розклад, витягніть карти й відкрийте читання — карту за картою."
          : "Give it a shape. Choose your spread, draw from the deck, and uncover a reading — one card at a time."}</p>
        <button type="button" onClick={onBegin} className="night-btn">{uk ? "Обрати мій розклад" : "Choose my spread"} <span aria-hidden>↗</span></button>
        <p className="oracle-front-note">{uk ? "Власний темп · Звук за бажанням" : "Your own pace · Sound optional"}</p>
      </div>
      <figure className="oracle-specimen">
        <div className="oracle-specimen-art">
          <span className="oracle-specimen-axis" aria-hidden />
          {specimens.map((card, i) => (
            <div key={card.name} className={`oracle-specimen-card is-${i}`}>
              <Image src={getCardImagePath(card)} alt={card.name} fill sizes="(max-width: 640px) 125px, (max-width: 1000px) 180px, 250px" loading={i === 1 ? "eager" : "lazy"} />
            </div>
          ))}
          <span className="oracle-specimen-number" aria-hidden>II — XVII — XIX</span>
        </div>
        <figcaption>{uk ? "Фрагменти колоди Olivia Arcana · 78 карт" : "Studies from the Olivia Arcana deck · 78 cards"}</figcaption>
      </figure>
      <ol className="oracle-front-method" aria-label={uk ? "Як проходить читання" : "How your reading unfolds"}>
        <li><span>01</span><p>{uk ? "Оберіть форму" : "Choose a shape"}<small>{uk ? "Чотири розклади для різних питань" : "Four spreads for different questions"}</small></p></li>
        <li><span>02</span><p>{uk ? "Витягніть карти" : "Draw by touch"}<small>{uk ? "Перемішана повна колода" : "A freshly shuffled, complete deck"}</small></p></li>
        <li><span>03</span><p>{uk ? "Відкрийте історію" : "Read the story"}<small>{uk ? "Позиція, карта, цілісне читання" : "The position, the card, the whole"}</small></p></li>
      </ol>
      <style jsx>{`
        .oracle-front { position: absolute; inset: 0; z-index: 40; display: grid; grid-template-columns: 1fr 1.05fr; grid-template-rows: 1fr auto; column-gap: clamp(30px,6vw,110px); width: min(1320px,100%); margin: auto; padding: clamp(116px,15vh,166px) clamp(24px,6.5vw,96px) 40px; overflow-y: auto; overscroll-behavior: contain; }
        .oracle-front-copy { align-self: center; padding-bottom: 36px; }
        .oracle-front-kicker { margin: 0 0 25px; color: #e0b768; font-size: 10px; letter-spacing: .23em; text-transform: uppercase; }
        h1 { font: 400 clamp(58px,6.5vw,100px)/.96 var(--font-heading),serif; letter-spacing: -.035em; color: #eeeaf1; margin: 0; }
        h1 em { font-weight: 400; color: #c9cee3; }
        .oracle-front-lead { max-width: 37ch; margin: 28px 0 28px; font-size: 15px; line-height: 1.85; color: #b9bfd6; }
        .oracle-front-note { color: #aab3cd; font-size: 11px; margin-top: 16px; }
        .oracle-specimen { margin: 0; align-self: center; min-width: 0; }
        .oracle-specimen-art { position: relative; height: clamp(280px,39vw,475px); perspective: 1000px; }
        .oracle-specimen-card { position: absolute; top: 8%; left: 50%; width: 51%; height: 79%; transform-origin: 50% 90%; overflow: hidden; border-radius: 5px; box-shadow: 0 20px 32px #05092399; transition: transform 550ms cubic-bezier(.16,1,.3,1); }
        .oracle-specimen-card :global(img) { object-fit: cover; }
        .oracle-specimen-card.is-0 { transform: translateX(-93%) rotate(-14deg); }
        .oracle-specimen-card.is-1 { transform: translateX(-50%) translateY(-10px); z-index: 2; }
        .oracle-specimen-card.is-2 { transform: translateX(-7%) rotate(14deg); }
        .oracle-specimen:hover .is-0 { transform: translateX(-102%) rotate(-18deg); }
        .oracle-specimen:hover .is-1 { transform: translateX(-50%) translateY(-20px); }
        .oracle-specimen:hover .is-2 { transform: translateX(2%) rotate(18deg); }
        .oracle-specimen-axis { position: absolute; top: 50%; left: -5%; right: -5%; height: 1px; background: #d5ba7833; }
        .oracle-specimen-number { position: absolute; bottom: 2%; left: 0; right: 0; text-align: center; color: #d1b879; font-size: 10px; letter-spacing: .34em; }
        figcaption { color: #aab3cd; font-size: 10px; text-align: center; margin-top: 10px; line-height: 1.7; }
        .oracle-front-method { grid-column: 1/-1; display: grid; grid-template-columns: repeat(3,1fr); gap: 30px; list-style: none; margin: 36px 0 0; padding: 22px 0 0; border-top: 1px solid #b9bfd633; }
        .oracle-front-method li { display: flex; gap: 16px; }
        .oracle-front-method li > span { color: #e0b768; font-size: 10px; margin-top: 4px; }
        .oracle-front-method p { margin: 0; font: 400 22px var(--font-heading),serif; color: #eeeaf1; }
        .oracle-front-method small { display: block; margin-top: 6px; color: #aab3cd; font: 11px/1.7 var(--font-body),sans-serif; }
        @media(max-width:640px) {
          .oracle-front { display: flex; flex-direction: column; padding: 116px 24px 28px; }
          .oracle-front-copy { align-self: stretch; padding-bottom: 0; }
          .oracle-front-kicker { margin-bottom: 18px; }
          h1 { font-size: clamp(48px,12.5vw,74px); }
          .oracle-front-lead { font-size: 13px; line-height: 1.7; margin: 20px 0; max-width: 36ch; }
          .oracle-specimen { width: min(300px,100%); margin: 28px auto 0; }
          .oracle-specimen-art { height: 255px; }
          .oracle-specimen-card { width: 46%; height: 80%; }
          .oracle-front-method { width: 100%; gap: 16px; margin-top: 28px; }
          .oracle-front-method li { display: block; }
          .oracle-front-method p { font-size: 18px; margin-top: 8px; }
          .oracle-front-method small { font-size: 10px; }
        }
        @media(prefers-reduced-motion:reduce) { .oracle-specimen-card { transition: none; } .oracle-specimen:hover .is-0 { transform: translateX(-93%) rotate(-14deg); } .oracle-specimen:hover .is-1 { transform: translateX(-50%) translateY(-10px); } .oracle-specimen:hover .is-2 { transform: translateX(-7%) rotate(14deg); } }
      `}</style>
    </section>
  );
}
