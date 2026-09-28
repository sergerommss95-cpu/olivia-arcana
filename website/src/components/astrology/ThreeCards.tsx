"use client";

/**
 * The three cards of a birth chart, dealt face down. The reader turns each
 * one: a single turn (never a double-back flip), then one soft pass of
 * light across the face, as in the reading experience. A chart reopened
 * from this device arrives already turned.
 */

import { useEffect, useRef, useState } from "react";
import type { MajorCard } from "@/lib/astrology/deck";
import styles from "./astrology.module.css";

export type Dealt = {
  key: "sun" | "moon" | "ascendant";
  label: string;
  title: string;
  degree: string;
  note: string;
  aside?: string;
  card: MajorCard;
};

const UI = {
  en: {
    dealt: "The sky of your birth has dealt you three cards. Turn each one when you are ready.",
    turn: (label: string) => `Turn your ${label} card`, turnAll: "Turn all three", back: "The back of an Olivia card",
  },
  uk: {
    dealt: "Небо вашого народження розклало для вас три карти. Переверніть кожну, коли будете готові.",
    turn: (label: string) => `Перевернути карту: ${label}`, turnAll: "Перевернути всі три", back: "Сорочка карти Olivia",
  },
};

export default function ThreeCards({ locale, dealt, faceUp, onTurn, missing }: {
  locale: "en" | "uk";
  dealt: Dealt[];
  /** Keys already turned (a chart reopened from this device arrives face up). */
  faceUp: string[];
  onTurn: (key: string) => void;
  /** Shown in place of the Rising card when the birth time is unknown. */
  missing?: { label: string; text: string };
}) {
  const t = UI[locale];
  const [turned, setTurned] = useState<Set<string>>(() => new Set(faceUp));
  const [arrivedOpen] = useState(() => new Set(faceUp));
  // After its one turn a card rests flat: no 3D context left behind.
  const [settled, setSettled] = useState<Set<string>>(() => new Set(faceUp));
  const settle = (key: string) => setSettled((now) => new Set(now).add(key));
  const headings = useRef<Record<string, HTMLHeadingElement | null>>({});
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    const key = pendingFocus.current;
    if (key) { pendingFocus.current = null; headings.current[key]?.focus(); }
  }, [turned]);

  function turn(key: string, focus: boolean) {
    setTurned((now) => new Set(now).add(key));
    onTurn(key);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) settle(key);
    if (focus) pendingFocus.current = key;
  }

  const hidden = dealt.filter((item) => !turned.has(item.key));
  return (
    <>
      {hidden.length > 0 && (
        <p className={styles.dealtLead}>
          {t.dealt}{" "}
          {hidden.length > 1 && <button type="button" className={styles.textButton} onClick={() => dealt.forEach((item) => turn(item.key, false))}>{t.turnAll}</button>}
        </p>
      )}
      <ol className={styles.three}>
        {dealt.map((item, i) => {
          const open = turned.has(item.key);
          return (
            <li key={item.key} className={`${styles.threeItem} ${open ? styles.turned : ""}`} style={{ ["--deal" as string]: `${i * 140}ms` }}>
              <div className={styles.flip}>
                {open ? (
                  <a href={item.card.href} aria-label={item.card.name}
                    className={`${styles.flipInner} ${settled.has(item.key) ? styles.flat : arrivedOpen.has(item.key) ? "" : styles.turning}`}
                    onAnimationEnd={(event) => { if (event.animationName.includes("turnOver")) settle(item.key); }}>
                    <span className={styles.flipBack} aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element -- static card back */}
                      <img src="/cards/back-448.webp" alt="" width={448} height={769} />
                    </span>
                    <span className={styles.flipFront}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- static card art */}
                      <img src={item.card.image} alt="" width={448} height={768} />
                      <span className={styles.sheen} aria-hidden />
                    </span>
                  </a>
                ) : (
                  <button type="button" className={styles.flipInner} onClick={() => turn(item.key, true)} aria-label={t.turn(item.label)}>
                    <span className={styles.flipBack}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- static card back */}
                      <img src="/cards/back-448.webp" alt={t.back} width={448} height={769} />
                    </span>
                    <span className={styles.flipFront} aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element -- preloaded face, shown on turning */}
                      <img src={item.card.image} alt="" width={448} height={768} loading="lazy" />
                    </span>
                  </button>
                )}
              </div>
              <p className={styles.kicker}>{item.label}</p>
              {open ? (
                <div className={styles.revealText}>
                  <h3 className={styles.h3} tabIndex={-1} ref={(node) => { headings.current[item.key] = node; }}>{item.title}</h3>
                  <p className={styles.cardName}><a href={item.card.href}>{item.card.name}</a> · {item.degree}</p>
                  <p className={styles.note}>{item.note}</p>
                  {item.aside && <p className={styles.hint}>{item.aside}</p>}
                  <p className={styles.question}>{item.card.question}</p>
                </div>
              ) : (
                <p className={styles.hint}>{t.turn(item.label)}</p>
              )}
            </li>
          );
        })}
        {missing && (
          <li className={`${styles.threeItem} ${styles.threeMissing}`}>
            <div className={styles.threeBack} aria-hidden />
            <p className={styles.kicker}>{missing.label}</p>
            <p className={styles.note}>{missing.text}</p>
          </li>
        )}
      </ol>
    </>
  );
}
