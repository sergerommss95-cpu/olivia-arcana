"use client";

import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { ukCard } from "@/lib/academy/tarot-cards-uk";
import { getCardPortalImagePath } from "@/lib/academy/card-images";
import { createRitualTimer, orientationsForSitting, shuffleForSitting } from "@/components/oracle/ritual";
import { useLocale } from "@/lib/i18n/useLocale";
import styles from "./tarot.module.css";

import { INITIAL, reducer, type Intention } from "./sitting";

const INTENTIONS: Intention[] = ["clarity", "connection", "direction", "change"];
const COPY = {
  en: {
    back: "All studies", oracle: "Visit the Oracle", kicker: "The Living Tarot", title: ["A question.", "A quiet answer."], introduction: "Set down what is on your mind. Let your hand find the cards. Give the symbols a little room to speak.",
    shape: "Choose your reading", single: "One card", singleNote: "A moment of perspective", three: "Three cards", threeNote: "A thread to follow", intention: "What brings you here?", intentions: { clarity: "Clarity", connection: "Connection", direction: "Direction", change: "Change" },
    question: "Your question, if you have one", placeholder: "What would help me see this differently?", privacy: "Your question stays on this page.", begin: "Shuffle & begin", shuffling: "The deck is finding a new order…", choose: "Let one card catch your attention.", chooseThree: "Choose three. There is no wrong place to begin.", reveal: "Your cards are here. Turn them in your own time.", complete: "The cards are open. The story is yours.", deck: "The complete 78-card deck", previous: "Previous cards", next: "Next cards", card: "Card", of: "of", chooseCard: "Choose card", turnCard: "Reveal", chosen: "chosen", upright: "Upright", reversed: "Reversed", position: ["What is present", "Where to look", "What to carry forward"], singlePosition: "A different perspective", step: ["I. Intention", "II. The draw", "III. Reflection"], study: "An invitation to pause", faceNote: "Each card keeps its place and orientation in this reading.", read: "Read your cards", story: "Follow the thread.", storyIntro: "Notice what connects these cards to your question. Keep what opens a useful perspective; leave what does not.", reflect: "A question to take with you", action: "A small next step", restart: "Begin again", restartNote: "A new reading creates a new shuffle.", pause: "A reversed card invites you to notice what is blocked, inward or asking for another approach.", prompts: { clarity: "What do I know already, and what am I only assuming?", connection: "What could I say honestly, without trying to control the reply?", direction: "Which small decision would put my values into practice?", change: "What can I release, and what needs a little more care?" }, footer: "78 cards. Your question. Your interpretation.", disclosure: "A space for reflection, with room for your own judgement.", remaining: "Choose", oneMore: "more card", more: "more cards", browse: "Browse the deck", selectHint: "Move across the fan · choose with a click", keyboard: "Arrow keys explore the deck. Enter selects a card.", readingFor: "Your question", readyHint: "The whole deck is here. Every shuffle changes the order.", held: "Your reading", focus: "Focus", today: "For this moment", review: "Read the interpretation", chooseHint: "Tap a card or use the arrows to explore all 78.",
  },
  uk: {
    back: "Усі етюди", oracle: "До Оракула", kicker: "Живе Таро", title: ["Запитання.", "Тиха відповідь."], introduction: "Залиште тут те, що займає ваші думки. Нехай рука знайде карти. Дайте символам простір заговорити.",
    shape: "Оберіть читання", single: "Одна карта", singleNote: "Мить для нового погляду", three: "Три карти", threeNote: "Нитка, за якою піти", intention: "Що привело вас сюди?", intentions: { clarity: "Ясність", connection: "Зв’язок", direction: "Напрямок", change: "Зміни" },
    question: "Ваше запитання, якщо воно є", placeholder: "Що допоможе подивитися на це інакше?", privacy: "Ваше запитання лишається на цій сторінці.", begin: "Перетасувати й почати", shuffling: "Колода знаходить новий порядок…", choose: "Дозвольте одній карті привернути увагу.", chooseThree: "Оберіть три карти. Тут немає хибного початку.", reveal: "Ваші карти тут. Відкривайте їх у власному темпі.", complete: "Карти відкриті. Історія належить вам.", deck: "Повна колода з 78 карт", previous: "Попередні карти", next: "Наступні карти", card: "Карта", of: "із", chooseCard: "Обрати карту", turnCard: "Відкрити", chosen: "обрано", upright: "Пряме положення", reversed: "Перевернуте", position: ["Що є зараз", "Куди подивитися", "Що взяти із собою"], singlePosition: "Інший погляд", step: ["I. Намір", "II. Вибір", "III. Рефлексія"], study: "Запрошення зупинитися", faceNote: "Кожна карта зберігає своє місце й положення у цьому читанні.", read: "Прочитати карти", story: "Слідуйте за ниткою.", storyIntro: "Зауважте, що пов’язує ці карти з вашим запитанням. Залиште те, що відкриває корисний погляд, і відпустіть решту.", reflect: "Запитання, яке варто взяти із собою", action: "Маленький наступний крок", restart: "Почати знову", restartNote: "Нове читання — нове тасування.", pause: "Перевернута карта запрошує помітити те, що стримується, спрямоване всередину або потребує іншого підходу.", prompts: { clarity: "Що я вже знаю, а що лише припускаю?", connection: "Що я можу сказати чесно, не намагаючись керувати відповіддю?", direction: "Яке маленьке рішення втілить мої цінності?", change: "Що я можу відпустити, а чому потрібно більше турботи?" }, footer: "78 карт. Ваше запитання. Ваше тлумачення.", disclosure: "Простір для рефлексії, у якому є місце вашому судженню.", remaining: "Оберіть ще", oneMore: "карту", more: "карти", browse: "Переглянути колоду", selectHint: "Проведіть над віялом · натисніть, щоб обрати", keyboard: "Стрілки переглядають колоду. Enter обирає карту.", readingFor: "Ваше запитання", readyHint: "Тут уся колода. Кожне тасування змінює її порядок.", held: "Ваше читання", focus: "Фокус", today: "На цю мить", review: "Прочитати тлумачення", chooseHint: "Торкніться карти або перегляньте всі 78 стрілками.",
  },
};

/** Same engraved rosette as the working Oracle, shared as one CSS image by every card. */
const BACK = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 225"><rect width="136" height="225" fill="#151c40"/><rect x="5" y="5" width="126" height="215" rx="4" fill="none" stroke="#cfc6ad" stroke-opacity=".65"/><rect x="10" y="10" width="116" height="205" rx="2" fill="none" stroke="#cfc6ad" stroke-opacity=".25"/><g stroke="#e8e1ce" stroke-width=".65" fill="none"><path d="M25 21v8m-4-4h8M111 21v8m-4-4h8M25 196v8m-4-4h8M111 196v8m-4-4h8"/><circle cx="68" cy="112" r="30"/><circle cx="68" cy="112" r="22" stroke-dasharray="1 4"/><path d="M68 83v18m0 22v18M39 112h18m22 0h18M47 91l13 13m16 16 13 13M47 133l13-13m16-16 13-13"/></g><circle cx="68" cy="112" r="4" fill="#d8bb84"/><g fill="#d8bb84"><circle cx="32" cy="48" r=".9"/><circle cx="99" cy="67" r=".7"/><circle cx="41" cy="174" r=".7"/><circle cx="106" cy="181" r=".9"/></g></svg>')}")`;
const HAND_SIZE = 13;

export default function TarotStudy() {
  const { locale } = useLocale();
  const isUk = locale === "uk";
  const copy = isUk ? COPY.uk : COPY.en;
  const reduce = useReducedMotion();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [hand, setHand] = useState(0);
  const [active, setActive] = useState(6);
  const [hovered, setHovered] = useState<number | null>(null);
  const timer = useMemo(() => createRitualTimer(), []);
  const cardRefs = useRef(new Map<number, HTMLButtonElement>());
  const revealRefs = useRef(new Map<number, HTMLButtonElement>());
  const pendingFocus = useRef<number | null>(null);
  const beginRef = useRef<HTMLButtonElement>(null);
  const storyRef = useRef<HTMLHeadingElement>(null);
  const readRef = useRef<HTMLButtonElement>(null);
  const tableRef = useRef<HTMLElement>(null);
  const intentionRef = useRef<HTMLElement>(null);
  const pendingScroll = useRef(false);
  const deck = useMemo(() => shuffleForSitting(ALL_CARDS, state.seed, ALL_CARDS.length), [state.seed]);
  const orientations = useMemo(() => orientationsForSitting(state.seed, ALL_CARDS.length), [state.seed]);
  const positionName = (i: number) => state.count === 1 ? copy.singlePosition : copy.position[i];
  const translated = (index: number) => (isUk ? ukCard(deck[index].name) : null) ?? deck[index];
  const cardTitle = (index: number) => translated(index).name;
  const started = state.phase !== "intention";
  const cardsChosen = state.phase === "revealing" || state.phase === "reading";
  const step = !started ? 0 : state.phase === "reading" ? 2 : 1;
  const status = state.phase === "intention" ? copy.readyHint : state.phase === "shuffling" ? copy.shuffling : state.phase === "choosing" ? (state.count === 1 ? copy.choose : copy.chooseThree) : state.phase === "revealing" ? copy.reveal : copy.complete;

  useEffect(() => () => timer.cancel(), [timer]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (state.phase === "choosing") {
        if (pendingFocus.current !== null) {
          cardRefs.current.get(pendingFocus.current)?.focus({ preventScroll: true });
          pendingFocus.current = null;
        }
        if (pendingScroll.current) {
          pendingScroll.current = false;
          if (window.matchMedia("(max-width: 820px)").matches) tableRef.current?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
        }
      } else if (state.phase === "revealing") {
        const target = state.selected.find(index => !state.revealed.includes(index));
        if (target !== undefined) revealRefs.current.get(target)?.focus({ preventScroll: true });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [state.phase, state.selected, state.revealed, hand, active, reduce]);

  useEffect(() => {
    if (state.phase !== "reading") return;
    const previouslyFocused = document.activeElement;
    const settle = window.setTimeout(() => {
      if (document.activeElement === previouslyFocused) readRef.current?.focus({ preventScroll: true });
    }, reduce ? 0 : 620);
    return () => window.clearTimeout(settle);
  }, [state.phase, reduce]);

  const begin = () => {
    if (state.phase !== "intention") return;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    setHand(0); setActive(6); setHovered(null); pendingFocus.current = 6; pendingScroll.current = true;
    dispatch({ type: "begin", seed });
    timer.schedule(() => dispatch({ type: "ready", seed }), reduce ? 0 : 520);
  };
  const reset = () => {
    timer.cancel(); setHand(0); setActive(6); setHovered(null); pendingFocus.current = null; pendingScroll.current = false;
    dispatch({ type: "reset" });
    timer.schedule(() => {
      intentionRef.current?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
      beginRef.current?.focus({ preventScroll: true });
    }, 0);
  };
  const moveTo = (index: number) => {
    setHand(Math.floor(index / HAND_SIZE)); setActive(index); pendingFocus.current = index;
  };
  const browse = (direction: number) => {
    const next = Math.max(0, Math.min(5, hand + direction));
    const indices = Array.from({ length: HAND_SIZE }, (_, i) => next * HAND_SIZE + i);
    moveTo(indices.find(i => i >= next * HAND_SIZE + 6 && !state.selected.includes(i)) ?? indices.find(i => !state.selected.includes(i)) ?? next * HAND_SIZE);
  };
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      do { next = (next + direction + 78) % 78; } while (state.selected.includes(next));
    } else if (event.key === "Home") next = deck.findIndex((_, i) => !state.selected.includes(i));
    else if (event.key === "End") { next = 77; while (state.selected.includes(next)) next--; }
    else return;
    event.preventDefault(); moveTo(next);
  };
  const choose = (index: number) => {
    if (state.phase !== "choosing") return;
    const available = Array.from({ length: 78 }, (_, i) => (index + 1 + i) % 78).find(i => i !== index && !state.selected.includes(i));
    dispatch({ type: "select", index });
    if (state.selected.length + 1 < state.count && available !== undefined) moveTo(available);
  };
  const readStory = () => {
    storyRef.current?.scrollIntoView({ behavior: reduce ? "instant" : "smooth", block: "start" });
    storyRef.current?.focus({ preventScroll: true });
  };

  return (
    <main className={styles.page} id="main-content" style={{ "--card-back": BACK } as CSSProperties}>
      <nav className={styles.navigation} aria-label={isUk ? "Навігація" : "Navigation"}>
        <Link href="/studies/">← {copy.back}</Link><Link className={styles.wordmark} href="/">Olivia Arcana</Link><Link href="/oracle/">{copy.oracle} ↗</Link>
      </nav>
      <div className={styles.edition}><span>{copy.kicker}</span><span>STUDY 01 / MMXXVI</span></div>
      <LayoutGroup id="living-tarot-study">
        <div className={styles.ritual}>
          <aside ref={intentionRef} className={styles.intention} data-active={started}>
            <p className={styles.eyebrow}>{copy.study}</p>
            <h1>{copy.title[0]}<br /><em>{copy.title[1]}</em></h1>
            <p className={styles.introduction}>{copy.introduction}</p>
            {state.phase === "intention" ? <div className={styles.setup}>
              <fieldset className={styles.shape}><legend>{copy.shape}</legend>{([1, 3] as const).map(count => <label key={count} data-selected={state.count === count}><input type="radio" name="reading-size" value={count} checked={state.count === count} onChange={() => dispatch({ type: "count", count })} /><span>{count === 1 ? copy.single : copy.three}<small>{count === 1 ? copy.singleNote : copy.threeNote}</small></span><span className={styles.radioMark} aria-hidden /></label>)}</fieldset>
              <fieldset className={styles.intentChoices}><legend>{copy.intention}</legend><div>{INTENTIONS.map(intention => <label key={intention}><input type="radio" name="intention" value={intention} checked={state.intention === intention} onChange={() => dispatch({ type: "intention", intention })} /><span>{copy.intentions[intention]}</span></label>)}</div></fieldset>
              <details className={styles.questionDisclosure}>
                <summary>{isUk ? "Додати запитання (необов’язково)" : "Add a question (optional)"}</summary>
                <label className={styles.question}>{copy.question}<textarea rows={2} maxLength={180} value={state.question} onChange={e => dispatch({ type: "question", question: e.target.value })} placeholder={copy.placeholder} /></label>
                <p className={styles.privacy}>{copy.privacy}</p>
              </details>
              <button ref={beginRef} type="button" className={styles.primary} onClick={begin}>{copy.begin}<span aria-hidden>↗</span></button>
            </div> : <div className={styles.sitting}>
              <span className={styles.eyebrow}>{copy.held}</span><p>{state.count === 1 ? copy.single : copy.three} <span aria-hidden>·</span> {copy.intentions[state.intention]}</p>
              {state.question && <blockquote>“{state.question}”</blockquote>}
              <div className={styles.sittingRule} />
              <p className={styles.sittingPrompt}>{copy.prompts[state.intention]}</p>
              <button type="button" className={styles.textButton} onClick={reset}>{copy.restart} <span aria-hidden>↺</span></button>
            </div>}
          </aside>

          <section ref={tableRef} className={styles.table} aria-label={copy.kicker}>
            <ol className={styles.steps}>{copy.step.map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined}>{label}</li>)}</ol>
            <p className={styles.status} role="status" aria-live="polite">{status}</p>
            <div className={styles.tableSurface} data-phase={state.phase}>
              <div className={styles.tableMark} aria-hidden><span>O</span><i /><span>A</span></div>
              {!cardsChosen && <div className={styles.fan} data-shuffling={state.phase === "shuffling"} role="group" aria-label={copy.deck}>
                {Array.from({ length: HAND_SIZE }, (_, i) => {
                  const index = hand * HAND_SIZE + i;
                  const chosen = state.selected.includes(index);
                  const n = i - 6;
                  return <div key={`${state.seed}-${index}`} className={styles.fanPosition} style={{ "--n": n, "--arc-y": `${Math.abs(n) ** 1.65 * 2}px`, "--card-angle": `${n * 3.4}deg`, zIndex: index === (hovered ?? active) ? 20 : i + 1 } as CSSProperties}>
                    {!chosen && <motion.button layoutId={`card-${state.seed}-${index}`} ref={el => { if (el) cardRefs.current.set(index, el); else cardRefs.current.delete(index); }} className={styles.fanCard} type="button" disabled={state.phase !== "choosing"} tabIndex={state.phase === "choosing" && index === active ? 0 : -1} aria-label={`${copy.chooseCard} ${index + 1} ${copy.of} 78`} onFocus={() => { if (state.phase === "choosing") setActive(index); }} onPointerEnter={() => { if (state.phase === "choosing") setHovered(index); }} onPointerLeave={() => setHovered(null)} onKeyDown={e => keyboard(e, index)} onClick={() => choose(index)} transition={{ duration: reduce ? 0 : .46, ease: [.22, 1, .36, 1] }}><span className={styles.cardBack} /><span className={styles.fanNumber} aria-hidden>{String(index + 1).padStart(2, "0")}</span></motion.button>}
                  </div>;
                })}
              </div>}
              {cardsChosen && <p className={styles.spreadLabel}>{copy.today}<span aria-hidden>✦</span></p>}
              <div className={styles.spread} data-ready={cardsChosen} data-single={state.count === 1}>
                {Array.from({ length: state.count }, (_, slot) => {
                  const index = state.selected[slot];
                  const revealed = index !== undefined && state.revealed.includes(index);
                  return <div className={styles.spreadSlot} key={slot}>
                    <span className={styles.slotNumber}>{["I", "II", "III"][slot]}</span>
                    {index === undefined ? <div className={styles.emptyCard} aria-label={positionName(slot)}><span aria-hidden>✦</span></div> : <motion.div className={styles.selectedCard} layoutId={`card-${state.seed}-${index}`} transition={{ duration: reduce ? 0 : .46, ease: [.22, 1, .36, 1] }}>
                      <button ref={el => { if (el) revealRefs.current.set(index, el); else revealRefs.current.delete(index); }} type="button" className={styles.revealButton} disabled={state.phase === "choosing"} aria-disabled={revealed || undefined} tabIndex={revealed ? -1 : 0} onClick={() => dispatch({ type: "reveal", index })} aria-label={revealed ? `${cardTitle(index)}, ${orientations[index] ? copy.reversed : copy.upright}` : `${copy.turnCard}: ${positionName(slot)}`} data-revealed={revealed}>
                        <span className={styles.flip}><span className={styles.cardBack} /><span className={styles.cardFace}><Image src={getCardPortalImagePath(deck[index])} width={240} height={414} alt="" loading="eager" className={orientations[index] ? styles.reversed : undefined} /></span></span>
                      </button>
                    </motion.div>}
                    <span className={styles.slotName}>{positionName(slot)}</span>
                    {revealed && <span className={styles.cardName}>{cardTitle(index)}<small>{orientations[index] ? copy.reversed : copy.upright}</small></span>}
                  </div>;
                })}
              </div>
            </div>
            {!cardsChosen && <div className={styles.deckControls}>
              <button type="button" aria-label={copy.previous} disabled={state.phase !== "choosing" || hand === 0} onClick={() => browse(-1)}>←</button>
              <div><span>{hand * HAND_SIZE + 1}—{Math.min(78, (hand + 1) * HAND_SIZE)} <i>{copy.of} 78</i></span><small>{state.phase === "choosing" ? `${state.selected.length} / ${state.count} ${copy.chosen}` : copy.deck}</small></div>
              <button type="button" aria-label={copy.next} disabled={state.phase !== "choosing" || hand === 5} onClick={() => browse(1)}>→</button>
            </div>}
            <div className={styles.tableFoot}>{state.phase === "reading" ? <button ref={readRef} type="button" className={styles.primary} onClick={readStory}>{copy.read}<span aria-hidden>↓</span></button> : <p>{state.phase === "revealing" ? copy.faceNote : copy.chooseHint}</p>}</div>
            <p className={styles.srOnly}>{copy.keyboard}</p>
          </section>
        </div>
      </LayoutGroup>

      <AnimatePresence>
        {state.phase === "reading" && <motion.section className={styles.reading} initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .38 }} aria-labelledby="tarot-story-title">
          <div className={styles.readingHeading}><p className={styles.eyebrow}>{copy.step[2]}</p><h2 ref={storyRef} tabIndex={-1} id="tarot-story-title">{copy.story}</h2><p>{copy.storyIntro}</p></div>
          <div className={styles.interpretations}>{state.selected.map((index, slot) => {
            const card = translated(index);
            return <article key={index} className={styles.interpretation}><div className={styles.interpretationIndex}><span>{["I", "II", "III"][slot]}</span><p>{positionName(slot)}</p></div><div><p className={styles.eyebrow}>{orientations[index] ? copy.reversed : copy.upright}</p><h3>{card.name}</h3><p className={styles.meaning}>{orientations[index] ? card.reversed : card.upright}</p><div className={styles.advice}><span>{copy.action}</span><p>{orientations[index] ? copy.pause : card.advice}</p></div></div></article>;
          })}</div>
          <div className={styles.reflection}><span className={styles.eyebrow}>{copy.reflect}</span><p>{copy.prompts[state.intention]}</p><button type="button" className={styles.textButton} onClick={reset}>{copy.restart} ↺</button><small>{copy.restartNote}</small></div>
        </motion.section>}
      </AnimatePresence>
      <footer className={styles.footer}><span>{copy.footer}</span><p>{copy.disclosure}</p><Link href="/studies/">{copy.back} ↗</Link></footer>
    </main>
  );
}
