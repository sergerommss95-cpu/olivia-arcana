"use client";

/**
 * Design your own spread: name its job, write each position as one open
 * question, then try it with cards from the deck or with one card in every
 * position (the same-card test). Notes under a question only suggest; nothing
 * here blocks. Saved designs stay in this browser.
 */

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { checkQuestion } from "@/lib/learn/phrase-check";
import BANK from "@/lib/learn/phrase-bank.json";
import learn from "./learn.module.css";
import styles from "./spread-builder.module.css";
import SupportLines, { type SupportLabels } from "./SupportLines";

export interface BuilderCard { name: string; thumb: string; essence: string; slug: string }
export interface Template { id: string; title: string; name: string; positions: { label: string; question: string }[] }
export interface BuilderLabels {
  lead: string; startFrom: string; blank: string; yours: string; untitled: string; deleteAria: string; undo: string; restored: string;
  name: string; namePlaceholder: string; positions: string; position: string; labelAria: string; questionAria: string;
  labelPlaceholder: string; questionPlaceholder: string; lastPlaceholder: string; lastHint: string; waiting: string;
  moveUp: string; moveDown: string; remove: string; add: string; moved: string; removed: string; added: string; loaded: string;
  countFew: string; countGood: string; countMany: string; countMost: string;
  save: string; saved: string; saveFailed: string; deleted: string; copy: string; copied: string; copyFallback: string; copyField: string;
  tryTitle: string; tryLead: string; deal: string; again: string; notReady: string;
  sameTitle: string; sameLead: string; samePrompt: string; dealtStatus: string; sameStatus: string;
  sentence: string; sentenceFor: string; sentencePlaceholder: string; noCard: string; copyCard: string; copyNotes: string;
  support: SupportLabels;
}

type Locale = "en" | "uk";
type Draft = { label: string; question: string };
type Position = Draft & { id: string };
type Saved = { id: string; name: string; positions: Draft[] };
type Deal = { mode: "deck"; key: string; cards: Record<string, number> } | { mode: "same"; key: string; card: number };
type Entry = { note: string; support?: boolean };
type Note = { support: true } | { text: string } | null;
type Snapshot = { name: string; positions: Position[]; currentId: string | null };

const STORE = "olivia-learn-spreads-v1";
const MAX = 7;
const LIMIT = { name: 80, label: 60, question: 200, sentence: 600 };
// The lesson’s “waiting words”: they turn a place for looking into a place for waiting.
// No lookbehind in the literal: older Safari refuses to parse the whole file.
const WAITING: Record<Locale, RegExp> = {
  en: /\b(outcomes?|futures?|results?|will)\b/i,
  uk: /(?:^|[^\p{L}’ʼ'])(результат\p{L}*|майбутн\p{L}*|буде|станеться)(?![\p{L}’ʼ'])/iu,
};

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
const clip = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

// Saved designs live only in this browser. Read through an external-store
// subscription so the server HTML (no designs) and hydration match, and other
// tabs stay in step.
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}
function rawSaved() {
  try {
    return window.localStorage.getItem(STORE) ?? "";
  } catch {
    return "";
  }
}

function parseSaved(raw: string): Saved[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item: Partial<Saved> | null) => {
      if (!item || typeof item.id !== "string" || !Array.isArray(item.positions)) return [];
      const positions = item.positions.slice(0, MAX).map((p: Partial<Draft> | null) => ({ label: clip(p?.label, LIMIT.label), question: clip(p?.question, LIMIT.question) }));
      return positions.length ? [{ id: item.id, name: clip(item.name, LIMIT.name), positions }] : [];
    });
  } catch {
    return [];
  }
}

function writeSaved(list: Saved[]) {
  try {
    window.localStorage.setItem(STORE, JSON.stringify(list));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

/** Distinct cards, one per position, from a partial shuffle driven by crypto. */
function draw(count: number, total: number) {
  const deck = Array.from({ length: total }, (_, i) => i);
  const random = new Uint32Array(count);
  crypto.getRandomValues(random);
  for (let i = 0; i < count; i++) {
    const j = i + (random[i] % (total - i));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}

const blank = (): Draft[] => [{ label: "", question: "" }, { label: "", question: "" }, { label: "", question: "" }];

export default function SpreadBuilder({ locale, cards, templates, sameCards, cardBase, labels }: {
  locale: Locale;
  cards: BuilderCard[];
  templates: Template[];
  sameCards: number[];
  cardBase: string;
  labels: BuilderLabels;
}) {
  const uid = useId();
  const serial = useRef(3);
  const deals = useRef(0);
  const focusNext = useRef<string | null>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  // Unsaved edits since the last load or save; a load over them offers a way back.
  const dirty = useRef(false);
  const [undo, setUndo] = useState<Snapshot | null>(null);
  const [name, setName] = useState("");
  const [positions, setPositions] = useState<Position[]>(() => blank().map((p, i) => ({ ...p, id: `p${i + 1}` })));
  const [currentId, setCurrentId] = useState<string | null>(null);
  const raw = useSyncExternalStore(subscribe, rawSaved, () => "");
  const saved = useMemo(() => parseSaved(raw), [raw]);
  const [notice, setNotice] = useState("");
  const [announce, setAnnounce] = useState("");
  // 0 = hidden; each failed copy bumps it so the text is selected again.
  const [fallback, setFallback] = useState(0);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealStatus, setDealStatus] = useState("");
  const [sentences, setSentences] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!focusNext.current) return;
    document.getElementById(focusNext.current)?.focus();
    focusNext.current = null;
  });
  useEffect(() => {
    if (!fallback) return;
    fallbackRef.current?.focus();
    fallbackRef.current?.select();
  }, [fallback]);

  // A repeated message (“Position removed.” twice) gets a trailing no-break
  // space, so the text still changes and the live region announces it again.
  const say = (set: Dispatch<SetStateAction<string>>, message: string) => set((prev) => (prev === message ? `${message}\u00a0` : message));
  const fieldId = (posId: string, part: string) => `${uid}-${posId}-${part}`;
  const nth = (i: number) => String(i + 1);
  const newId = () => `p${++serial.current}`;
  const labelOf = (p: Position, i: number) => p.label.trim() || fill(labels.position, { n: nth(i) });
  // Any change to the design makes an earlier “Saved.” or “Copied.” untrue.
  const changed = () => { setNotice(""); setUndo(null); dirty.current = true; };
  // A new deal or sentence changes the text a copy would carry, not the saved design.
  const recopy = () => setNotice((prev) => (prev.startsWith(labels.copied) ? "" : prev));
  const rename = (value: string) => { setName(value); changed(); };
  const edit = (id: string, patch: Partial<Draft>) => {
    setPositions((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    changed();
  };

  const move = (index: number, by: -1 | 1) => {
    const to = index + by;
    if (to < 0 || to >= positions.length) return;
    const list = [...positions];
    [list[index], list[to]] = [list[to], list[index]];
    setPositions(list);
    changed();
    const part = by < 0 ? (to === 0 ? "down" : "up") : (to === list.length - 1 ? "up" : "down");
    focusNext.current = fieldId(list[to].id, part);
    say(setAnnounce, fill(labels.moved, { n: nth(to) }));
  };

  const remove = (index: number) => {
    if (positions.length <= 1) return;
    const list = positions.filter((_, i) => i !== index);
    setPositions(list);
    changed();
    focusNext.current = fieldId(list[Math.min(index, list.length - 1)].id, "label");
    say(setAnnounce, labels.removed);
  };

  const add = () => {
    if (positions.length >= MAX) return;
    const id = newId();
    setPositions((list) => [...list, { id, label: "", question: "" }]);
    changed();
    focusNext.current = fieldId(id, "label");
    say(setAnnounce, fill(labels.added, { n: nth(positions.length) }));
  };

  const load = (design: { name: string; positions: Draft[] }, savedId: string | null) => {
    if (dirty.current && (name.trim() || positions.some((p) => p.label.trim() || p.question.trim()))) setUndo({ name, positions, currentId });
    dirty.current = false;
    setName(design.name);
    setPositions(design.positions.map((p) => ({ ...p, id: newId() })));
    setCurrentId(savedId);
    setDeal(null);
    setDealStatus("");
    setFallback(0);
    setNotice("");
    say(setAnnounce, fill(labels.loaded, { name: design.name || labels.untitled }));
  };

  const restore = () => {
    if (!undo) return;
    setName(undo.name);
    setPositions(undo.positions);
    setCurrentId(undo.currentId);
    setUndo(null);
    dirty.current = true;
    setDeal(null);
    setDealStatus("");
    setFallback(0);
    setNotice("");
    focusNext.current = `${uid}-name`;
    say(setAnnounce, labels.restored);
  };

  const save = () => {
    const design: Saved = {
      id: currentId ?? `s${Date.now().toString(36)}`,
      name: name.trim(),
      positions: positions.map(({ label, question }) => ({ label: label.trim(), question: question.trim() })),
    };
    const ok = writeSaved([design, ...parseSaved(rawSaved()).filter((d) => d.id !== design.id)]);
    if (ok) {
      setCurrentId(design.id);
      dirty.current = false;
      setUndo(null);
    }
    say(setNotice, ok ? labels.saved : labels.saveFailed);
  };

  const forget = (id: string, index: number) => {
    const list = parseSaved(rawSaved()).filter((d) => d.id !== id);
    const ok = writeSaved(list);
    if (id === currentId) {
      setCurrentId(null);
      dirty.current = true;
    }
    say(setNotice, ok ? labels.deleted : labels.saveFailed);
    const neighbour = list[Math.min(index, list.length - 1)];
    focusNext.current = neighbour ? `${uid}-saved-${neighbour.id}` : `${uid}-template-0`;
  };

  const cardFor = (posId: string) => (!deal ? undefined : deal.mode === "same" ? deal.card : deal.cards[posId]);

  const asText = () => {
    const lines = [name.trim() || labels.untitled, ""];
    positions.forEach((p, i) => {
      const question = p.question.trim();
      lines.push(`${i + 1}. ${labelOf(p, i)}${question ? `: ${question}` : ""}`);
      if (!deal) return;
      const card = cardFor(p.id);
      if (card !== undefined) lines.push(`   ${labels.copyCard}: ${cards[card].name}`);
      const sentence = sentences[`${deal.key}:${p.id}`]?.trim();
      if (sentence) lines.push(`   ${labels.copyNotes}: ${sentence}`);
    });
    return lines.join("\n");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asText());
      setFallback(0);
      say(setNotice, labels.copied);
    } catch {
      setFallback((n) => n + 1);
      say(setNotice, labels.copyFallback);
    }
  };

  const ready = positions.some((p) => p.question.trim() || p.label.trim());
  const dealDeck = () => {
    const ids = draw(positions.length, cards.length);
    deals.current += 1;
    setDeal({ mode: "deck", key: `deck${deals.current}`, cards: Object.fromEntries(positions.map((p, i) => [p.id, ids[i]])) });
    setDealStatus(fill(labels.dealtStatus, { names: ids.map((id) => cards[id].name).join(", ") }));
    recopy();
  };
  const dealSame = (card: number) => {
    setDeal({ mode: "same", key: `same${card}`, card });
    setDealStatus(fill(labels.sameStatus, { name: cards[card].name }));
    recopy();
  };

  const needsSupport = (text: string) => (checkQuestion(text, locale, BANK).sensitive as Entry[]).some((e) => e.support);
  const noteFor = (p: Position): Note => {
    // The bank’s own note for these promises support lines, so show the lines themselves.
    if (needsSupport(p.label) || needsSupport(p.question)) return { support: true };
    const question = p.question.trim();
    if (question) {
      const result = checkQuestion(question, locale, BANK);
      const first = [...(result.sensitive as Entry[]), ...(result.thirdParty as Entry[]), ...(result.closed as Entry[])][0];
      if (first) return { text: first.note };
    }
    const match = `${p.label} ${p.question}`.match(WAITING[locale]);
    return match ? { text: fill(labels.waiting, { word: match[1].toLocaleLowerCase(locale) }) } : null;
  };

  const count = positions.length;
  const countNote = count < 3 ? labels.countFew : count <= 5 ? labels.countGood : count === 6 ? labels.countMany : labels.countMost;
  const href = (card: number) => `${cardBase}${cards[card].slug}/`;
  // Rebuilt on every render, so the fallback text follows later edits.
  const fallbackText = fallback > 0 ? asText() : "";

  return (
    <div className={styles.builder}>
      <p className={learn.sectionLead}>{labels.lead}</p>

      <div className={styles.starts}>
        <div>
          <p className={learn.toolLabel}>{labels.startFrom}</p>
          <ul className={styles.chipRow}>
            {templates.map((t, i) => (
              <li key={t.id}><button id={`${uid}-template-${i}`} type="button" className={styles.chip} onClick={() => load(t, null)}>{t.title}</button></li>
            ))}
            <li><button type="button" className={`${styles.chip} ${styles.chipQuiet}`} onClick={() => load({ name: "", positions: blank() }, null)}>{labels.blank}</button></li>
          </ul>
        </div>
        {saved.length > 0 && (
          <div>
            <p className={learn.toolLabel}>{labels.yours}</p>
            <ul className={styles.chipRow}>
              {saved.map((d, i) => (
                <li key={d.id} className={styles.savedChip} data-current={d.id === currentId ? "true" : undefined}>
                  <button id={`${uid}-saved-${d.id}`} type="button" className={styles.chip} onClick={() => load(d, d.id)}>{d.name || labels.untitled}</button>
                  <button type="button" className={styles.chipDelete} aria-label={fill(labels.deleteAria, { name: d.name || labels.untitled })} onClick={() => forget(d.id, i)}>
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {undo && (
          <p className={styles.undoRow}>
            <button type="button" className={styles.undo} onClick={restore}>{labels.undo}</button>
          </p>
        )}
      </div>

      <div className={styles.editor}>
        <label className={styles.nameField}>
          <span>{labels.name}</span>
          <input id={`${uid}-name`} type="text" value={name} maxLength={LIMIT.name} placeholder={labels.namePlaceholder} onChange={(e) => rename(e.target.value)} />
        </label>
        <div className={styles.nameLive} aria-live="polite">{needsSupport(name) && <SupportLines labels={labels.support} />}</div>

        <p className={learn.toolLabel}>{labels.positions}</p>
        <ol className={styles.positions}>
          {positions.map((p, i) => {
            const note = noteFor(p);
            const last = i === count - 1;
            const n = nth(i);
            return (
              <li key={p.id} className={styles.position}>
                <span className={styles.num} aria-hidden="true">{n}</span>
                <div className={styles.fields}>
                  <label className={styles.srOnly} htmlFor={fieldId(p.id, "label")}>{fill(labels.labelAria, { n })}</label>
                  <input id={fieldId(p.id, "label")} className={styles.labelInput} type="text" value={p.label} maxLength={LIMIT.label} placeholder={labels.labelPlaceholder} onChange={(e) => edit(p.id, { label: e.target.value })} />
                  <label className={styles.srOnly} htmlFor={fieldId(p.id, "question")}>{fill(labels.questionAria, { n })}</label>
                  <textarea id={fieldId(p.id, "question")} className={styles.questionInput} rows={2} value={p.question} maxLength={LIMIT.question} placeholder={last ? labels.lastPlaceholder : labels.questionPlaceholder} onChange={(e) => edit(p.id, { question: e.target.value })} />
                  <div className={styles.live} aria-live="polite">
                    {note && ("support" in note ? <SupportLines labels={labels.support} /> : <p className={styles.note}>{note.text}</p>)}
                  </div>
                  {last && <p className={styles.hint}>{labels.lastHint}</p>}
                </div>
                <div className={styles.controls}>
                  <button id={fieldId(p.id, "up")} type="button" className={styles.iconButton} aria-label={fill(labels.moveUp, { n })} disabled={i === 0} onClick={() => move(i, -1)}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 13V3M3.5 7.5L8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button id={fieldId(p.id, "down")} type="button" className={styles.iconButton} aria-label={fill(labels.moveDown, { n })} disabled={last} onClick={() => move(i, 1)}>
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 3v10M3.5 8.5L8 13l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <button type="button" className={styles.iconButton} aria-label={fill(labels.remove, { n })} disabled={count <= 1} onClick={() => remove(i)}>
                    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <div className={styles.addRow}>
          <button type="button" className={learn.secondary} onClick={add} disabled={count >= MAX}>+ {labels.add}</button>
          <p className={styles.countNote}>{countNote}</p>
        </div>
      </div>
      <p className={styles.srOnly} aria-live="polite">{announce}</p>

      <div className={learn.drillActions}>
        <button type="button" className={learn.primary} onClick={save} disabled={!ready}>{labels.save}</button>
        <button type="button" className={learn.secondary} onClick={copy}>{labels.copy}</button>
        <p className={styles.notice} aria-live="polite">{notice}</p>
      </div>
      {fallbackText && (
        <label className={`${learn.writeField} ${styles.fallback}`}>
          <span>{labels.copyField}</span>
          <textarea ref={fallbackRef} readOnly rows={Math.min(14, fallbackText.split("\n").length + 1)} value={fallbackText} onFocus={(e) => e.currentTarget.select()} />
        </label>
      )}

      <section className={styles.trySection} aria-labelledby={`${uid}-try`}>
        <h3 id={`${uid}-try`} className={styles.tryTitle}>{labels.tryTitle}</h3>
        <p className={learn.sectionLead}>{labels.tryLead}</p>
        <div className={styles.dealRow}>
          <button type="button" className={learn.primary} onClick={dealDeck} disabled={!ready}>{deal?.mode === "deck" ? labels.again : labels.deal}</button>
          <div className={styles.same} role="group" aria-labelledby={`${uid}-same`}>
            <span id={`${uid}-same`} className={styles.sameLabel}>{labels.sameTitle}</span>
            {sameCards.map((id) => (
              <button key={id} type="button" className={styles.chip} aria-pressed={deal?.mode === "same" && deal.card === id} onClick={() => dealSame(id)} disabled={!ready}>{cards[id].name}</button>
            ))}
          </div>
        </div>
        {!ready && <p className={styles.hint}>{labels.notReady}</p>}
        <p className={styles.srOnly} aria-live="polite">{dealStatus}</p>

        {deal && (
          <div className={styles.results}>
            {deal.mode === "same" && (
              <div className={styles.held} key={deal.key}>
                <a href={href(deal.card)} className={styles.heldCard} tabIndex={-1} aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                  <img src={cards[deal.card].thumb} alt="" width={120} height={206} />
                </a>
                <div className={styles.heldText}>
                  <p className={styles.sameLead}>{labels.sameLead}</p>
                  <p className={styles.cardLine}><a href={href(deal.card)}>{cards[deal.card].name}</a></p>
                  <p className={styles.essence}>{cards[deal.card].essence}</p>
                </div>
                <p className={styles.prompt}>{labels.samePrompt}</p>
              </div>
            )}
            <ol className={styles.readList} data-same={deal.mode === "same" ? "true" : undefined}>
              {positions.map((p, i) => {
                const card = cardFor(p.id);
                const key = `${deal.key}:${p.id}`;
                return (
                  <li key={`${deal.key}-${p.id}`} className={styles.readItem} style={{ animationDelay: `${i * 70}ms` }}>
                    {deal.mode === "deck" && (card !== undefined ? (
                      <a href={href(card)} className={styles.readCard} tabIndex={-1} aria-hidden="true">
                        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                        <img src={cards[card].thumb} alt="" width={120} height={206} />
                      </a>
                    ) : <span className={styles.faceDown} aria-hidden="true" />)}
                    <div className={styles.readHead}>
                      <p className={styles.readPos}><span>{i + 1}</span>{labelOf(p, i)}</p>
                      {p.question.trim() && <p className={styles.readQuestion}>{p.question.trim()}</p>}
                      {deal.mode === "deck" && (card !== undefined
                        ? <p className={styles.cardLine}><a href={href(card)}>{cards[card].name}</a></p>
                        : <p className={styles.hint}>{labels.noCard}</p>)}
                    </div>
                    {deal.mode === "deck" && card !== undefined && <p className={styles.essence}>{cards[card].essence}</p>}
                    <label className={`${learn.writeField} ${styles.sentence}`}>
                      <span>{labels.sentence}<span className={styles.srOnly}> {fill(labels.sentenceFor, { n: nth(i) })}</span></span>
                      <textarea rows={2} maxLength={LIMIT.sentence} value={sentences[key] ?? ""} placeholder={labels.sentencePlaceholder} onChange={(e) => { const value = e.target.value; setSentences((s) => ({ ...s, [key]: value })); recopy(); }} />
                    </label>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
