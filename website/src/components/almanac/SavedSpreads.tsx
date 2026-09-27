"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/useLocale";
import { parseSavedSpreads, SPREAD_STORAGE_KEY, SPREAD_STORAGE_UNAVAILABLE } from "@/lib/saved-spreads";

const CARD_NAMES = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"];
function getSnapshot(): string {
  try { return window.localStorage.getItem(SPREAD_STORAGE_KEY) || ""; }
  catch { return SPREAD_STORAGE_UNAVAILABLE; }
}
function getServerSnapshot(): null { return null; }
function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === null || event.key === SPREAD_STORAGE_KEY) onChange(); };
  const onVisible = () => { if (!document.hidden) onChange(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", onChange);
  window.addEventListener("olivia:journal-change", onChange);
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", onChange);
    window.removeEventListener("olivia:journal-change", onChange);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

const COPY = {
  en: {
    title: "Your saved spreads", description: "The whole reading, kept together with your reflections. Saved in this browser only.",
    loading: "Opening your saved spreads…", empty: "Your completed spreads will appear here when you save them.",
    unavailable: "This browser cannot access your saved spreads right now.",
    malformed: "We could not read the saved spreads in this browser. Your stored data has not been changed.",
    skipped: "Some saved spreads could not be displayed. Your stored data has not been changed.",
    openQuestion: "An open question", note: "Your note", reflection: "Read the spread", prompt: "A question to carry", practice: "A small practice", open: "Open your reading journal",
  },
  uk: {
    title: "Ваші збережені розклади", description: "Повне читання разом із вашими роздумами. Збережено лише в цьому браузері.",
    loading: "Відкриваємо збережені розклади…", empty: "Тут з’являться завершені розклади, коли ви їх збережете.",
    unavailable: "Зараз цей браузер не може відкрити ваші збережені розклади.",
    malformed: "Не вдалося прочитати збережені розклади в цьому браузері. Збережені дані не змінено.",
    skipped: "Деякі збережені розклади не вдалося показати. Збережені дані не змінено.",
    openQuestion: "Відкрите запитання", note: "Ваша нотатка", reflection: "Прочитати розклад", prompt: "Запитання для роздумів", practice: "Невелика практика", open: "Відкрити журнал читань",
  },
};

export default function SavedSpreads() {
  const { locale } = useLocale();
  const copy = locale === "uk" ? COPY.uk : COPY.en;
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { status, records, skipped } = useMemo(() => parseSavedSpreads(raw), [raw]);
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", { day: "numeric", month: "long", year: "numeric" });
  return (
    <section className="saved-spreads" aria-labelledby="saved-spreads-title">
      <h2 className="alm-h2" id="saved-spreads-title">{copy.title}</h2>
      <p className="description">{copy.description}</p>
      {status !== "ready" ? <p role="status">{copy[status]}</p> : records.length === 0 ? <p>{skipped ? copy.skipped : copy.empty}</p> : (
        <>
          {skipped && <p role="status">{copy.skipped}</p>}
          <ol className="spread-list">
            {records.map(record => (
              <li key={record.id}>
                <article>
                  <header><h3>{record.spreadName}</h3><time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time></header>
                  <p className="question">{record.question.trim() || copy.openQuestion}</p>
                  <ol className="card-list">
                    {record.cards.map(card => <li key={card.positionId}><span>{card.label}</span> · {CARD_NAMES[card.cardId]}</li>)}
                  </ol>
                  {record.note.trim() && <div className="note"><h4>{copy.note}</h4><p>{record.note}</p></div>}
                  <details>
                    <summary>{copy.reflection}</summary>
                    <div className="reflection">
                      {record.synthesis.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                      <h4>{copy.prompt}</h4><p>{record.synthesis.prompt}</p>
                      {record.cards.map(card => (
                        <section key={card.positionId}>
                          <h4>{card.label} · {CARD_NAMES[card.cardId]}</h4><p>{card.meaning}</p>
                          <h5>{copy.prompt}</h5><p>{card.prompt}</p>
                          <h5>{copy.practice}</h5><p>{card.practice}</p>
                        </section>
                      ))}
                    </div>
                  </details>
                </article>
              </li>
            ))}
          </ol>
        </>
      )}
      <Link className="alm-link" href="/?experience=journal">{copy.open} <span aria-hidden>↗</span></Link>
      <style jsx>{`
        .saved-spreads { margin: 0 0 2.5rem; padding: 0 0 2.5rem; border-bottom: 1px solid var(--hairline); overflow-wrap: anywhere; }
        p { color: var(--ink-soft); font-size: .9rem; line-height: 1.7; white-space: pre-wrap; }
        .description { margin: .85rem 0 1.4rem; }
        .spread-list { list-style: none; margin: 1.6rem 0; padding: 0; }
        .spread-list > li { padding: 1.35rem 0; border-top: 1px solid var(--hairline); }
        header { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem 1.5rem; flex-wrap: wrap; }
        h3 { margin: 0; color: var(--ink); font-family: var(--font-heading), serif; font-size: 1.6rem; font-weight: 500; line-height: 1.2; }
        time { color: var(--ink-faint); font-size: .74rem; }
        .question { margin: .6rem 0 1rem; }
        .card-list { padding-left: 1.25rem; color: var(--ink-soft); font-size: .8rem; line-height: 1.9; }
        .card-list span { color: var(--ink); }
        .note { padding-left: 1rem; border-left: 1px solid var(--hairline); margin: 1.2rem 0; }
        .note p { margin: .45rem 0; }
        h4, h5 { margin: 1rem 0 .3rem; font-size: .8rem; color: var(--ink); font-weight: 500; }
        summary { width: fit-content; cursor: pointer; padding: .35rem 0; color: var(--ox); font-size: .8rem; }
        .reflection { padding: .35rem 0 .2rem; }
        .reflection section { margin-top: 1.4rem; padding-top: .4rem; border-top: 1px solid var(--hairline); }
        .reflection p { margin: .4rem 0; }
      `}</style>
    </section>
  );
}
