"use client";

/**
 * From the chart into the practice: each turned card offers its own question
 * to begin a reading with (carried by the same short-lived hand-off the Ask
 * page uses, never in a URL) and its card's own spread; and the three cards
 * can be shared as an image made on the device, with no birth details on it.
 */

import { useState } from "react";
import { writeQuestionHandoff } from "@/lib/question-handoff";
import { renderShareImage, shareOrSave } from "@/lib/astrology/share-image";
import type { MajorCard } from "@/lib/astrology/deck";
import { splitQuestion } from "@/lib/astrology/copy";
import styles from "./astrology.module.css";

export type CarryItem = { key: string; role: string; sign: string; card: MajorCard; text: string };

const UI = {
  en: {
    title: "Carry your sky into a reading",
    lead: "Each of your cards carries a question. Begin a reading with one and choose your own cards from the full deck, or lay out that card’s own spread.",
    ask: "Begin a reading with this question", spread: (name: string) => `A spread built on ${name}`,
    continuity: "Your question joins the same reflection journal as your tarot readings. Save your own words there and return to see what changed. Birth details stay on this device.",
    locked: "Turn this card to see its question.",
    share: "Share your three cards", making: "Making your image…", saved: "Saved to your device.", failed: "The image could not be made on this device.",
    transferFailed: "This browser could not carry your question. Copy it and open a reading to enter it yourself.",
    shareNote: "The image shows your signs and cards only, never your birth details.",
    shareTitle: "My sky, dealt in cards", site: "oliviaarcana.com/astrology", turnFirst: "Turn all your cards to share them.",
  },
  uk: {
    title: "Перенесіть своє небо в розклад",
    lead: "Кожна з ваших карт несе своє запитання. Почніть розклад з одним із них і оберіть власні карти з повної колоди або розкладіть власний розклад цієї карти.",
    ask: "Почати розклад із цим запитанням", spread: (name: string) => `Розклад на основі карти «${name}»`,
    continuity: "Ваше запитання продовжиться в тому самому щоденнику, що й розклади Таро. Збережіть там власні слова й поверніться, щоб побачити зміни. Дані про народження залишаються на цьому пристрої.",
    locked: "Переверніть цю карту, щоб побачити її запитання.",
    share: "Поділитися трьома картами", making: "Створюємо зображення…", saved: "Зображення збережено на пристрої.", failed: "На цьому пристрої не вдалося створити зображення.",
    transferFailed: "Цей браузер не зміг перенести запитання. Скопіюйте його й відкрийте розклад, щоб ввести самостійно.",
    shareNote: "На зображенні лише ваші знаки й карти, без даних про народження.",
    shareTitle: "Моє небо, розкладене картами", site: "oliviaarcana.com/uk/astrology", turnFirst: "Переверніть усі карти, щоб поділитися ними.",
  },
};


export default function CarryIntoReading({ locale, items, revealed }: { locale: "en" | "uk"; items: CarryItem[]; revealed: string[] }) {
  const t = UI[locale];
  const base = locale === "uk" ? "/uk/" : "/";
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const allTurned = items.every((item) => revealed.includes(item.key));

  async function share() {
    setBusy(true); setStatus(t.making);
    try {
      const blob = await renderShareImage(items.map((item) => ({ role: item.role, sign: item.sign, card: item.card.name, image: item.card.image })), { title: t.shareTitle, site: t.site });
      const outcome = await shareOrSave(blob, "olivia-my-sky.jpg", t.shareTitle);
      setStatus(outcome === "saved" ? t.saved : "");
    } catch {
      setStatus(t.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.block} aria-labelledby="carry-title">
      <h2 id="carry-title" className={styles.h2}>{t.title}</h2>
      <p className={styles.blockLead}>{t.lead}</p>
      <p className={styles.hint}>{t.continuity}</p>
      <ul className={styles.carryList}>
        {items.map((item) => {
          const open = revealed.includes(item.key);
          const question = splitQuestion(item.text)[1] || item.text;
          return (
            <li key={item.key} className={`${styles.carryRow} ${open ? "" : styles.carryLocked}`}>
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized thumbnail */}
              <img src={open ? item.card.thumb : "/cards/back-448.webp"} alt="" width={120} height={206} />
              <div className={styles.carryText}>
                <p className={styles.carryRole}>{item.role}{open ? ` · ${item.sign} · ${item.card.name}` : ""}</p>
                <p className={styles.carryQuestion}>{open ? question : t.locked}</p>
                {open && (
                  <div className={styles.carryActions}>
                    <a className={styles.primary} href={`${base}?experience=question`}
                      onClick={(event) => { try { writeQuestionHandoff(sessionStorage, question, Date.now(), { practice: "astrology", cardId: item.card.id, role: item.role }); } catch { event.preventDefault(); setStatus(t.transferFailed); } }}>{t.ask}</a>
                    <a className={styles.carrySpread} href={`${base}#spreads/card-${item.card.id}`}
                      onClick={(event) => { try { writeQuestionHandoff(sessionStorage, question, Date.now(), { practice: "astrology", cardId: item.card.id, role: item.role }); } catch { event.preventDefault(); setStatus(t.transferFailed); } }}>{t.spread(item.card.name)}</a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className={styles.shareBar}>
        <button type="button" className={styles.secondary} onClick={share} disabled={!allTurned || busy} aria-describedby="share-note">{t.share}</button>
        <p id="share-note" className={styles.hint}>{allTurned ? t.shareNote : t.turnFirst}</p>
        <p className={styles.hint} role="status">{status}</p>
      </div>
    </section>
  );
}
