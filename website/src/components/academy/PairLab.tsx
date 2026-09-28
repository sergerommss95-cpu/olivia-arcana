"use client";

/**
 * Pair lab: the learner picks any two cards (or deals two), sees what links
 * them and the symbols carved on both, reads them through five lenses and
 * writes their own reading. The pair lives in the URL (?a=17&b=32).
 */

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cardFacts, pairFacts } from "@/lib/learn/card-facts";
import { loupeBackground } from "@/lib/learn/loupe";
import { pairLenses } from "@/lib/learn/pair-lenses";
import ls from "@/components/learn/learn.module.css";
import pp from "./pair-page.module.css";
import s from "./pair-lab.module.css";

export type LabGroup = "major" | "wands" | "cups" | "swords" | "pentacles";
export interface LabCard {
  name: string;
  thumb: string;
  image: string;
  essence: string;
  slug: string;
  group: LabGroup;
  symbols: { k: string; x: number; y: number; name: string }[];
}
export interface LabLabels {
  first: string; second: string; group: string; groups: string[]; card: string; other: string; deal: string; swap: string; open: string;
  links: string; shared: string; noShared: string; ways: string; waysLead: string; lens: string; yours: string; placeholder: string; privacy: string;
  written: string; hasWritten: string; readWritten: string; noWritten: string;
  bothMajor: string; majorMinor: string; sameSuit: string; sameNumber: string; sameCourt: string; contrary: string; sameElement: string; neutral: string;
}

type Pair = [number, number];
const GROUPS: LabGroup[] = ["major", "wands", "cups", "swords", "pentacles"];

function random(count: number) {
  const values = new Uint32Array(count);
  crypto.getRandomValues(values);
  return [...values];
}

/** Two different cards, uniformly enough for a lab (78 is tiny next to 2^32). */
function dealPair(n: number): Pair {
  const [r1, r2] = random(2);
  const a = r1 % n;
  const b = r2 % (n - 1);
  return [a, b >= a ? b + 1 : b];
}

/** ?a=17&b=32 from the address bar; a missing or clashing card is dealt. */
function pairFromQuery(n: number): Pair {
  const query = new URLSearchParams(window.location.search);
  const read = (key: string) => {
    const raw = query.get(key);
    const id = raw && /^\d{1,2}$/.test(raw) ? Number(raw) : NaN;
    return id >= 0 && id < n ? id : null;
  };
  const a = read("a"), b = read("b");
  if (a !== null && b !== null && a !== b) return [a, b];
  const [x, y] = dealPair(n);
  if (a !== null) return [a, x === a ? y : x];
  if (b !== null) return [x === b ? y : x, b];
  return [x, y];
}

export default function PairLab({ locale, cards, written, labels }: { locale: "en" | "uk"; cards: LabCard[]; written: string[]; labels: LabLabels }) {
  const [pair, setPair] = useState<Pair | null>(null);
  const [groups, setGroups] = useState<[LabGroup, LabGroup]>(["major", "major"]);
  const [lens, setLens] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const strips = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const placed = useRef(["", ""]);
  const prefix = locale === "uk" ? "/uk" : "";

  const choose = (next: Pair) => {
    setPair(next);
    setGroups([cards[next[0]].group, cards[next[1]].group]);
  };
  const pick = (slot: 0 | 1, id: number) => {
    if (!pair) return;
    setPair(slot === 0 ? [id, pair[1]] : [pair[0], id]);
  };
  const filter = (slot: 0 | 1, group: LabGroup) => setGroups((g) => (slot === 0 ? [group, g[1]] : [g[0], group]));

  // Read the address bar (or deal) once mounted, so the server HTML and the first render match.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { choose(pairFromQuery(cards.length)); }, []);

  useEffect(() => {
    if (!pair) return;
    window.history.replaceState(null, "", `${window.location.pathname}?a=${pair[0]}&b=${pair[1]}${window.location.hash}`);
  }, [pair]);

  // Keep each chosen card in view inside its strip, without moving the page;
  // a strip filtered away from its chosen card starts again at its first card.
  // Only a strip whose card or filter changed moves, so browsing the other one is left alone.
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strips.forEach((ref, i) => {
      const strip = ref.current;
      const key = `${pair ? pair[i] : ""}:${groups[i]}`;
      if (!strip || placed.current[i] === key) return;
      placed.current[i] = key;
      const item = strip.querySelector("input:checked")?.parentElement;
      const left = item ? item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2 : 0;
      strip.scrollTo({ left, behavior: still ? "auto" : "smooth" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, groups]);

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, count: number) => {
    const moves: Record<string, number> = { ArrowRight: lens + 1, ArrowLeft: lens - 1, Home: 0, End: count - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + count) % count;
    setLens(next);
    tabs.current[next]?.focus();
  };

  const slot = (i: 0 | 1) => {
    const id = pair ? pair[i] : null;
    const card = id === null ? null : cards[id];
    return (
      <figure className={s.slot} data-slot={i}>
        <div className={s.frame}>
          {/* eslint-disable-next-line @next/next/no-img-element -- card art, pre-sized */}
          {card ? <img key={id} src={card.image} alt="" width={896} height={1536} className={s.art} /> : <span className={s.back} />}
        </div>
        <figcaption>
          <span className={s.slotLabel}>{i === 0 ? labels.first : labels.second}</span>
          {card
            ? <a href={`${prefix}/cards/${card.slug}/`} className={s.slotName} title={labels.open.replace("{name}", card.name)}>{card.name}<span aria-hidden> ↗</span></a>
            : <span className={s.slotName}>{" "}</span>}
        </figcaption>
      </figure>
    );
  };

  const picker = (i: 0 | 1) => {
    const id = pair ? pair[i] : null;
    const other = pair ? pair[i === 0 ? 1 : 0] : null;
    return (
      <fieldset className={s.picker}>
        <legend className={ls.toolLabel}>{i === 0 ? labels.first : labels.second}{id !== null && <span className={s.legendName}> · {cards[id].name}</span>}</legend>
        <div role="radiogroup" aria-label={labels.group} className={s.groups}>
          {GROUPS.map((group, g) => (
            <label key={group} className={s.groupOpt}>
              <input type="radio" name={`lab-group-${i}`} value={group} checked={groups[i] === group} onChange={() => filter(i, group)} />
              <span>{labels.groups[g]}</span>
            </label>
          ))}
        </div>
        <div role="radiogroup" aria-label={labels.card} className={s.strip} ref={strips[i]}>
          {cards.map((card, cardId) => card.group === groups[i] && (
            <label key={cardId} className={s.thumbOpt} data-other={cardId === other ? "true" : undefined} title={cardId === other ? labels.other : undefined}>
              <input type="radio" name={`lab-card-${i}`} value={cardId} checked={id === cardId} disabled={cardId === other} onChange={() => pick(i, cardId)} />
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
              <img src={card.thumb} width={120} height={206} alt="" />
              <span>{card.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  };

  let result: React.ReactNode = null;
  let status = "";
  if (pair) {
    const [a, b] = pair;
    const A = cards[a], B = cards[b];
    const facts = pairFacts(a, b, A.symbols.map((x) => x.k), B.symbols.map((x) => x.k));
    const shared = (facts.sharedSymbols as string[]).map((key) => ({ key, a: A.symbols.find((x) => x.k === key)!, b: B.symbols.find((x) => x.k === key)! }));
    const fa = cardFacts(a), fb = cardFacts(b);
    const chips = [
      facts.bothMajor && labels.bothMajor,
      facts.majorWithMinor && labels.majorMinor,
      facts.sameSuit && labels.sameSuit,
      facts.sameNumber && labels.sameNumber,
      facts.sameCourt && labels.sameCourt,
      facts.elements === "contrary" && labels.contrary,
      facts.elements === "same" && !facts.sameSuit && labels.sameElement,
      facts.elements === "neutral" && labels.neutral,
    ].filter(Boolean) as string[];
    const lenses = pairLenses(facts, {
      nameA: A.name, nameB: B.name, suitA: fa.suit, elementA: fa.element, elementB: fb.element, number: fa.number,
      sharedNames: shared.map((x) => (locale === "uk" ? `«${x.a.name}» і «${x.b.name}»` : `“${x.a.name}” and “${x.b.name}”`)),
    }, locale);
    const current = lenses[Math.min(lens, lenses.length - 1)];
    const slug = a < b ? `${A.slug}-and-${B.slug}` : `${B.slug}-and-${A.slug}`;
    const draftKey = a < b ? `${a}-${b}` : `${b}-${a}`;
    status = `${A.name} + ${B.name}. ${chips.join(". ")}.`;

    result = (
      <>
        <section className={pp.section} aria-labelledby="lab-links">
          <h2 id="lab-links" className={pp.h2}>{labels.links}</h2>
          <ul className={pp.chips}>{chips.map((chip) => <li key={chip}>{chip}</li>)}</ul>
          <div className={pp.sharedBlock}>
            <p className={pp.label}>{labels.shared}</p>
            {shared.length > 0 ? (
              <ul className={pp.sharedList}>
                {shared.map((x) => (
                  <li key={x.key} className={pp.sharedItem}>
                    {[{ card: A, sym: x.a }, { card: B, sym: x.b }].map(({ card, sym }, n) => {
                      const bg = loupeBackground(sym);
                      return <span key={n} className={`${pp.loupe} ${s.loupe}`} aria-hidden style={{ backgroundImage: `url("${card.image}")`, backgroundSize: bg.size, backgroundPosition: bg.position }} />;
                    })}
                    <span className={pp.sharedText}><strong>{x.a.name}</strong> · <strong>{x.b.name}</strong></span>
                  </li>
                ))}
              </ul>
            ) : <p className={s.quiet}>{labels.noShared}</p>}
          </div>
        </section>

        <section className={pp.section} aria-labelledby="lab-ways">
          <h2 id="lab-ways" className={pp.h2}>{labels.ways}</h2>
          <p className={pp.sectionLead}>{labels.waysLead}</p>
          <div role="tablist" aria-label={labels.lens} className={`${ls.lensTabs} ${s.tabs}`}>
            {lenses.map((l, i) => (
              <button key={l.id} ref={(el) => { tabs.current[i] = el; }} id={`lab-tab-${l.id}`} type="button" role="tab" aria-selected={current.id === l.id} aria-controls="lab-lens" tabIndex={current.id === l.id ? 0 : -1}
                onClick={() => setLens(i)} onKeyDown={(e) => onTabKey(e, lenses.length)}>{i + 1}. {l.title}</button>
            ))}
          </div>
          {/* Every prompt sits in one grid cell, the others hidden, so the panel keeps the tallest height and nothing below it jumps. */}
          <div className={s.prompts}>
            {lenses.map((l) => l.id !== current.id && <p key={l.id} aria-hidden className={`${ls.lensPrompt} ${s.prompt} ${s.ghost}`}>{l.prompt}</p>)}
            <p id="lab-lens" role="tabpanel" tabIndex={0} aria-labelledby={`lab-tab-${current.id}`} className={`${ls.lensPrompt} ${s.prompt}`}>{current.prompt}</p>
          </div>
          <label className={ls.writeField}>
            <span>{labels.yours}</span>
            <textarea rows={4} maxLength={1200} value={drafts[draftKey] ?? ""} placeholder={labels.placeholder}
              onChange={(e) => { const text = e.target.value; setDrafts((d) => ({ ...d, [draftKey]: text })); }} />
          </label>
          <p className={s.hint}>{labels.privacy}</p>
        </section>

        <section className={pp.section} aria-labelledby="lab-written">
          <h2 id="lab-written" className={pp.h2}>{labels.written}</h2>
          {written.includes(slug) ? (
            <div className={s.written}>
              <p>{labels.hasWritten}</p>
              <a href={`${prefix}/cards/pairs/${slug}/`} className={ls.primaryLink}>{labels.readWritten}</a>
            </div>
          ) : (
            <>
              <p className={pp.sectionLead}>{labels.noWritten}</p>
              <div className={s.essences}>
                {[A, B].map((card) => (
                  <figure key={card.slug} className={s.essence}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                    <img src={card.thumb} width={120} height={206} alt="" />
                    <figcaption>{card.name}</figcaption>
                    <blockquote><p>{card.essence}</p></blockquote>
                  </figure>
                ))}
              </div>
            </>
          )}
        </section>
      </>
    );
  }

  return (
    <div className={s.lab}>
      <div className={`${ls.tool} ${s.bench}`}>
        <div className={s.stage}>
          {slot(0)}
          <span className={s.plus} aria-hidden>+</span>
          {slot(1)}
        </div>
        <p className={s.srOnly} aria-live="polite">{status}</p>
        <div className={`${ls.drillActions} ${s.dealRow}`}>
          <button type="button" className={ls.primary} onClick={() => choose(dealPair(cards.length))}>{labels.deal}</button>
          <button type="button" className={ls.secondary} disabled={!pair} onClick={() => pair && choose([pair[1], pair[0]])}>{labels.swap}</button>
        </div>
        <div className={s.pickers}>
          {picker(0)}
          {picker(1)}
        </div>
      </div>
      {result}
    </div>
  );
}
