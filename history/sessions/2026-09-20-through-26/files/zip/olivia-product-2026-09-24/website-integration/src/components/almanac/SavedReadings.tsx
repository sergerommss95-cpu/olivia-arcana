"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useLocale } from "@/lib/i18n/useLocale";

const STORAGE_KEY = "olivia-arcana-readings-v1";
const STORAGE_UNAVAILABLE = "@storage-unavailable";
const JOURNAL_URL = "/experience/index.html?site=1#journal";

type SavedReading = {
  id: string;
  createdAt: string;
  updatedAt: string;
  question: string;
  intention: string;
  cardId: number;
  cardName: string;
  interpretation: { meaning: string; prompt: string; practice: string };
  note: string;
};

type ReadingSnapshot = {
  status: "loading" | "ready" | "unavailable" | "malformed";
  records: SavedReading[];
  skipped: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && Number.isFinite(Date.parse(value));
}

/** Read-only validation: a damaged record must never erase the stored journal. */
export function parseSavedReadings(raw: string | null): ReadingSnapshot {
  if (raw === null) return { status: "loading", records: [], skipped: false };
  if (raw === STORAGE_UNAVAILABLE) return { status: "unavailable", records: [], skipped: false };
  if (!raw) return { status: "ready", records: [], skipped: false };
  try {
    const value: unknown = JSON.parse(raw);
    if (!isObject(value) || value.schemaVersion !== 1 || !Array.isArray(value.records)) {
      return { status: "malformed", records: [], skipped: false };
    }
    const records: SavedReading[] = [];
    let skipped = false;
    for (const item of value.records) {
      if (
        !isObject(item) || typeof item.id !== "string" || !item.id.trim() ||
        !isDate(item.createdAt) || !isDate(item.updatedAt) ||
        typeof item.cardId !== "number" || !Number.isInteger(item.cardId) || item.cardId < 0 || item.cardId > 21 ||
        typeof item.cardName !== "string" || !item.cardName.trim() ||
        typeof item.question !== "string" || typeof item.intention !== "string" || typeof item.note !== "string" ||
        !isObject(item.interpretation) || typeof item.interpretation.meaning !== "string" ||
        typeof item.interpretation.prompt !== "string" || typeof item.interpretation.practice !== "string"
      ) {
        skipped = true;
        continue;
      }
      records.push({
        id: item.id,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        question: item.question,
        intention: item.intention,
        cardId: item.cardId,
        cardName: item.cardName,
        interpretation: {
          meaning: item.interpretation.meaning,
          prompt: item.interpretation.prompt,
          practice: item.interpretation.practice,
        },
        note: item.note,
      });
    }
    records.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const ids = new Set<string>();
    const unique = records.filter((record) => {
      if (ids.has(record.id)) { skipped = true; return false; }
      ids.add(record.id);
      return true;
    });
    return { status: "ready", records: unique, skipped };
  } catch {
    return { status: "malformed", records: [], skipped: false };
  }
}

function getSnapshot(): string {
  try { return window.localStorage.getItem(STORAGE_KEY) || ""; }
  catch { return STORAGE_UNAVAILABLE; }
}

function getServerSnapshot(): null { return null; }

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  };
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
    title: "Your saved readings",
    description: "The cards you kept, and what they brought to mind. Saved in this browser only.",
    loading: "Opening your saved readings…",
    empty: "Your first saved card will appear here. Keep a reading and add a note whenever something speaks to you.",
    unavailable: "This browser cannot access your saved readings right now.",
    malformed: "We could not read the saved readings in this browser. Your stored data has not been changed.",
    skipped: "Some saved readings could not be displayed. Your stored data has not been changed.",
    openQuestion: "An open question",
    note: "Your note",
    updated: "Updated",
    reflection: "Read the reflection",
    prompt: "A question to carry",
    practice: "A small practice",
    open: "Open your reading journal",
  },
  uk: {
    title: "Ваші збережені читання",
    description: "Карти, які ви зберегли, і думки, які вони викликали. Збережено лише в цьому браузері.",
    loading: "Відкриваємо збережені читання…",
    empty: "Тут з’явиться ваша перша збережена карта. Збережіть читання та додайте нотатку, коли щось відгукнеться.",
    unavailable: "Зараз цей браузер не може відкрити ваші збережені читання.",
    malformed: "Не вдалося прочитати збережені читання в цьому браузері. Збережені дані не змінено.",
    skipped: "Деякі збережені читання не вдалося показати. Збережені дані не змінено.",
    openQuestion: "Відкрите запитання",
    note: "Ваша нотатка",
    updated: "Оновлено",
    reflection: "Прочитати тлумачення",
    prompt: "Запитання для роздумів",
    practice: "Невелика практика",
    open: "Відкрити журнал читань",
  },
};

export default function SavedReadings() {
  const { locale } = useLocale();
  const copy = locale === "uk" ? COPY.uk : COPY.en;
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { records, status, skipped } = useMemo(() => parseSavedReadings(raw), [raw]);
  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <section className="saved-readings" aria-labelledby="saved-readings-title">
      <header>
        <h2 id="saved-readings-title" className="alm-h2">{copy.title}</h2>
        <p className="readings-description">{copy.description}</p>
      </header>
      {status !== "ready" ? (
        <p className="readings-status" role="status">{copy[status]}</p>
      ) : records.length === 0 ? (
        <p className="readings-status">{skipped ? copy.skipped : copy.empty}</p>
      ) : (
        <>
          {skipped && <p className="readings-status">{copy.skipped}</p>}
          <ol className="readings-list">
            {records.map((record) => (
              <li key={record.id}>
                <article>
                  <div className="reading-head">
                    <h3>{record.cardName}</h3>
                    <time dateTime={record.createdAt}>{formatDate(record.createdAt)}</time>
                  </div>
                  <p className="reading-question">{record.question.trim() || copy.openQuestion}</p>
                  {record.note.trim() && (
                    <div className="reading-note">
                      <p className="alm-caption">{copy.note}</p>
                      <p>{record.note}</p>
                      {record.updatedAt !== record.createdAt && (
                        <p className="reading-updated">{copy.updated} <time dateTime={record.updatedAt}>{formatDate(record.updatedAt)}</time></p>
                      )}
                    </div>
                  )}
                  <details>
                    <summary>{copy.reflection}</summary>
                    <div className="reading-reflection">
                      <p>{record.interpretation.meaning}</p>
                      <h4>{copy.prompt}</h4>
                      <p>{record.interpretation.prompt}</p>
                      <h4>{copy.practice}</h4>
                      <p>{record.interpretation.practice}</p>
                    </div>
                  </details>
                </article>
              </li>
            ))}
          </ol>
        </>
      )}
      <a className="alm-link" href={JOURNAL_URL}>{copy.open} <span aria-hidden>↗</span></a>
      <style jsx>{`
        .saved-readings { margin: 0 0 2.5rem; padding: 0 0 2.5rem; border-bottom: 1px solid var(--hairline); }
        .readings-description, .readings-status { margin: .85rem 0 1.4rem; color: var(--ink-soft); font-size: .9rem; line-height: 1.7; }
        .readings-list { list-style: none; padding: 0; margin: 1.6rem 0; }
        .readings-list li { padding: 1.35rem 0; border-top: 1px solid var(--hairline); }
        .reading-head { display: flex; align-items: baseline; justify-content: space-between; gap: .5rem 1.5rem; flex-wrap: wrap; }
        .reading-head h3 { margin: 0; color: var(--ink); font-family: var(--font-heading), serif; font-size: 1.6rem; font-weight: 500; line-height: 1.2; }
        .reading-head time, .reading-updated { color: var(--ink-faint); font-size: .74rem; }
        .reading-question { margin: .6rem 0 1rem; color: var(--ink-soft); line-height: 1.65; }
        .reading-note { padding-left: 1rem; border-left: 1px solid var(--hairline); margin: 1.2rem 0; }
        .reading-note p { margin: .45rem 0; }
        .reading-note p:not(.alm-caption):not(.reading-updated), .reading-reflection p { white-space: pre-wrap; line-height: 1.7; color: var(--ink-soft); font-size: .9rem; }
        article { overflow-wrap: anywhere; }
        summary { width: fit-content; cursor: pointer; padding: .35rem 0; color: var(--ox); font-size: .8rem; }
        .reading-reflection { padding: .35rem 0 .2rem; }
        .reading-reflection h4 { margin: 1rem 0 .3rem; font-size: .8rem; color: var(--ink); font-weight: 500; }
        .reading-reflection p { margin: .4rem 0; }
      `}</style>
    </section>
  );
}
