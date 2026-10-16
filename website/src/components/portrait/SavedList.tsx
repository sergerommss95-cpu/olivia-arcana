"use client";

/**
 * The portraits saved in this browser, newest first, as quiet title cards:
 * the title, the day it was saved and its language. Five show; "See all"
 * shows the rest. A portrait in the other language opens on that language's
 * page. Each card can be forgotten (the parent asks first).
 */

import { useEffect, useRef, useState } from "react";
import { PORTRAIT_COPY, type PortraitLocale } from "./copy";
import styles from "./keep.module.css";

export type SavedSummary = { id: string; savedAt: number; locale: PortraitLocale; title: string };
const SHOWN = 5;
export const SAVED_TITLE_ID = "portrait-saved-title";

export default function SavedList({ locale, items, onOpen, onForget }: {
  locale: PortraitLocale;
  items: SavedSummary[];
  onOpen: (id: string) => void;
  onForget: (item: SavedSummary) => void;
}) {
  const s = PORTRAIT_COPY[locale].saved;
  const [all, setAll] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const date = new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  // "See all" goes as the rest appear: focus moves to the first card it revealed.
  useEffect(() => {
    if (all) list.current?.querySelectorAll<HTMLElement>("[data-saved-open]")[SHOWN]?.focus();
  }, [all]);

  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <section className={styles.shelf} aria-labelledby={SAVED_TITLE_ID}>
      {/* Set in capitals, named in sentence case: the heading, each card's date and language, "See all". */}
      <h2 id={SAVED_TITLE_ID} tabIndex={-1} className={styles.shelfTitle} aria-label={s.title}>{s.title}</h2>
      <ul ref={list} className={styles.cards}>
        {shown.map((item) => {
          const elsewhere = item.locale !== locale;
          const name = `${item.title}, ${date.format(item.savedAt)}, ${s.language[item.locale]}`;
          const body = (
            <>
              <span className={styles.cardTitle} lang={elsewhere ? item.locale : undefined}>{item.title}</span>
              <span className={styles.meta}>{date.format(item.savedAt)} · {s.language[item.locale]}</span>
            </>
          );
          return (
            <li key={item.id} className={styles.card}>
              {elsewhere ? (
                <a className={styles.open} href={`${item.locale === "uk" ? "/uk" : ""}/portrait/#saved=${encodeURIComponent(item.id)}`} data-saved-open="" aria-label={name}>{body}</a>
              ) : (
                <button type="button" className={styles.open} data-saved-open="" aria-label={name} onClick={() => onOpen(item.id)}>{body}</button>
              )}
              <button type="button" className={styles.forget} aria-label={s.forgetLabel.replace("{title}", item.title)} onClick={() => onForget(item)}>{s.forget}</button>
            </li>
          );
        })}
      </ul>
      {!all && items.length > SHOWN && (
        <button type="button" className={`${styles.quiet} ${styles.more}`} aria-label={s.seeAll.replace("{n}", String(items.length))} onClick={() => setAll(true)}>{s.seeAll.replace("{n}", String(items.length))}</button>
      )}
    </section>
  );
}
