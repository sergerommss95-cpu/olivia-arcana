/**
 * The interactive part of a lesson. Each tool gets a small, prepared slice of
 * the card pages from the server, so no page ships the whole deck's text.
 */

import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { getCardImagePath, getCardThumbPath } from "@/lib/academy/card-images";
import { allLeaves, leafById } from "@/lib/academy/leaf";
import { allPairs, describePair, pairHref } from "@/lib/academy/pairs";
import { cardFacts } from "@/lib/learn/card-facts";
import { pairLenses } from "@/lib/learn/pair-lenses";
import { SPREAD_POSITIONS, type SpreadId } from "@/lib/learn/spread-positions";
import { WORKED_READING_FILES } from "@/lib/learn/worked-readings/index";
import type { Locale, ToolId } from "@/lib/learn/lessons";
import PrismPractice from "./PrismPractice";
import SurveyDemo from "./SurveyDemo";
import PairDrill, { type DrillPair } from "./PairDrill";
import DeckTable from "./DeckTable";
import CourtCouncil from "./CourtCouncil";
import PinWalk from "./PinWalk";
import WorkedReading, { type WorkedData } from "./WorkedReading";
import QuestionLabTool from "./QuestionLabTool";
import SentenceTool from "./SentenceTool";
import styles from "./learn.module.css";

const TITLES: Record<ToolId, { en: string; uk: string }> = {
  "question-lab": { en: "Question lab", uk: "Лабораторія запитань" },
  "pin-walk": { en: "Look first", uk: "Спершу подивіться" },
  "position-prism": { en: "Practice: one card, three positions", uk: "Практика: одна карта, три позиції" },
  "survey-demo": { en: "Practice: look at the whole", uk: "Практика: подивіться на ціле" },
  sentence: { en: "Practice: your spread in one sentence", uk: "Практика: ваш розклад одним реченням" },
  "worked-readings": { en: "Two readings, step by step", uk: "Два читання, крок за кроком" },
  "pair-drill": { en: "Practice: read a pair", uk: "Практика: прочитайте пару" },
  "deck-table": { en: "Practice: the deck laid out", uk: "Практика: уся колода на столі" },
  "court-council": { en: "Practice: a council of courts", uk: "Практика: рада придворних карт" },
  return: { en: "Return to a reading", uk: "Поверніться до читання" },
};

export function cardName(id: number, locale: Locale) {
  const name = ALL_CARDS[id].name;
  return locale === "uk" ? TAROT_UK[name]?.name ?? name : name;
}
const cardHref = (id: number, locale: Locale) => `${locale === "uk" ? "/uk" : ""}/cards/${leafById(id)!.slug}/`;
const home = (locale: Locale) => (locale === "uk" ? "/uk/" : "/");

const POSITION = {
  en: { heart: ["The situation", "What aspect of the situation deserves attention?"], challenge: ["What complicates it", "What tension or assumption deserves a closer look?"], advice: ["A helpful next step", "What small action could help you understand or respond?"] },
  uk: { heart: ["Ситуація", "Який аспект ситуації потребує уваги?"], challenge: ["Що ускладнює", "Яка напруга чи припущення потребує уважнішого погляду?"], advice: ["Корисний наступний крок", "Яка маленька дія допоможе краще зрозуміти ситуацію або відповісти на неї?"] },
} as const;

const L = {
  en: {
    prism: { lead: "Choose a card, then read it through each position before you look at Olivia’s version.", yours: "Your reading", placeholder: "One or two sentences…", show: "Show Olivia’s reading", hide: "Hide Olivia’s reading", olivia: "Olivia’s reading", showAll: "Just show all three", swapTitle: "The swap test", swapBody: "Could any two of your sentences trade places? If so, one of them has not yet read its position. Rewrite the one that could live anywhere.", tryIt: "Try a three-card reading ↗" },
    choose: "Choose a card",
    survey: { size: "Number of cards", deal: "Deal the cards", again: "Deal again", worth: "Worth noticing", lead: "Deal a spread from the full deck and look at it as one picture. Deal a few times: notice how often a pattern that feels striking is ordinary.", reversals: "Include reversed cards" },
    drill: { lens: "Choose a lens", yours: "Your reading of the pair", placeholder: "A sentence or two, through this lens…", reveal: "Show one reader’s version", hide: "Hide", version: "One reader’s version", from: "Written for the page of {name}", another: "Another pair", open: "Open the pair’s page ↗" },
    table: { ace: "A", numbers: "One number, four suits", missing: "The missing step", pick: "Choose a number", yours: "What you notice", placeholder: "What do these cards share? What does each suit do with it?", reveal: "Show what each card’s number means", hide: "Hide", question: "{rank}: one idea met in Fire, Water, Air and Earth. What do they share, and what does each suit do with it?", ranks: ["", "The Aces", "The Twos", "The Threes", "The Fours", "The Fives", "The Sixes", "The Sevens", "The Eights", "The Nines", "The Tens"], missingAsk: "One step of the suit is face down. What belongs between these two cards, and what would it add?", another: "Another gap", suits: ["Wands · Fire", "Cups · Water", "Swords · Air", "Pentacles · Earth"] },
    council: { choose: "Choose up to three court cards", ask: "Read them as qualities you could use, not as people. Which quality leads? Which is missing? Which do you over-use?", yours: "Your reading", placeholder: "A few sentences…", reveal: "Show their temperaments", hide: "Hide", temperament: "Temperament", gifts: "Gifts", shadow: "Shadow", ranks: ["Page", "Knight", "Queen", "King"], suits: ["Wands", "Cups", "Swords", "Pentacles"] },
    walk: { choose: "Choose a card", yours: "What you see", placeholder: "Up to three plain lines: what is carved, where, what the figure does…", start: "Show the first pin", next: "Show the next pin", meanings: "Now read what they carry", seen: "What is carved", meaning: "What it carries", again: "Try another card", open: "The full card page ↗" },
    worked: { quotes: ["“", "”"] as [string, string], step: "Step {n} of {t}", yours: "Your notes", placeholder: "Try this step before you look…", reveal: "Show Olivia’s notes", hide: "Hide the notes", notes: "Olivia’s notes", next: "Next step →", previous: "← Back", sentence: "The spread in one sentence", notSaid: "What this reading does not say", carry: "A question to carry", reversed: "reversed", question: "The question" },
    returnBody: "Re-reading lives in your almanac. Open a reading you kept at least a day ago: above your notes, Olivia asks you to look at the cards again and write what you see now. Each re-reading is kept with the date, in that question’s history.",
    returnLink: "Open my almanac ↗",
  },
  uk: {
    prism: { lead: "Оберіть карту й прочитайте її через кожну позицію, перш ніж дивитися на версію Olivia.", yours: "Ваше читання", placeholder: "Одне-два речення…", show: "Показати читання Olivia", hide: "Сховати читання Olivia", olivia: "Читання Olivia", showAll: "Просто показати всі три", swapTitle: "Перевірка обміном", swapBody: "Чи могли б якісь два ваші речення помінятися місцями? Якщо так, одне з них ще не прочитало своєї позиції. Перепишіть те, що підійшло б будь-куди.", tryIt: "Спробувати розклад на три карти ↗" },
    choose: "Оберіть карту",
    survey: { size: "Кількість карт", deal: "Розкласти карти", again: "Розкласти ще раз", worth: "Варто помітити", lead: "Розкладіть карти з усієї колоди й подивіться на них як на одну картину. Спробуйте кілька разів: помітьте, як часто те, що здається вражаючим, насправді звичайне.", reversals: "Із перевернутими картами" },
    drill: { lens: "Оберіть оптику", yours: "Ваше читання пари", placeholder: "Одне-два речення крізь цю оптику…", reveal: "Показати одну з версій", hide: "Сховати", version: "Одна з версій читання", from: "Написано для сторінки карти «{name}»", another: "Інша пара", open: "Відкрити сторінку пари ↗" },
    table: { ace: "Т", numbers: "Одне число, чотири масті", missing: "Пропущений крок", pick: "Оберіть число", yours: "Що ви помічаєте", placeholder: "Що спільного в цих карт? Що кожна масть робить із цим числом?", reveal: "Показати, що означає число кожної карти", hide: "Сховати", question: "{rank}: одна ідея у Вогні, Воді, Повітрі й Землі. Що в них спільного і що кожна масть робить із нею?", ranks: ["", "Тузи", "Двійки", "Трійки", "Четвірки", "П’ятірки", "Шістки", "Сімки", "Вісімки", "Дев’ятки", "Десятки"], missingAsk: "Один крок масті лежить сорочкою догори. Що має бути між цими двома картами і що воно додало б?", another: "Інший пропуск", suits: ["Жезли · Вогонь", "Кубки · Вода", "Мечі · Повітря", "Пентаклі · Земля"] },
    council: { choose: "Оберіть до трьох придворних карт", ask: "Читайте їх як якості, якими можна скористатися, а не як людей. Яка якість веде? Якої бракує? Якою ви користуєтеся надто часто?", yours: "Ваше читання", placeholder: "Кілька речень…", reveal: "Показати їхні темпераменти", hide: "Сховати", temperament: "Темперамент", gifts: "Сильні сторони", shadow: "Тінь", ranks: ["Паж", "Лицар", "Королева", "Король"], suits: ["Жезли", "Кубки", "Мечі", "Пентаклі"] },
    walk: { choose: "Оберіть карту", yours: "Що ви бачите", placeholder: "До трьох простих рядків: що вирізьблено, де, що робить постать…", start: "Показати першу мітку", next: "Показати наступну мітку", meanings: "Тепер прочитайте, що вони несуть", seen: "Що вирізьблено", meaning: "Що це несе", again: "Спробувати іншу карту", open: "Уся сторінка карти ↗" },
    worked: { quotes: ["«", "»"] as [string, string], step: "Крок {n} з {t}", yours: "Ваші нотатки", placeholder: "Спробуйте цей крок, перш ніж дивитися…", reveal: "Показати нотатки Olivia", hide: "Сховати нотатки", notes: "Нотатки Olivia", next: "Наступний крок →", previous: "← Назад", sentence: "Розклад одним реченням", notSaid: "Чого це читання не каже", carry: "Запитання, яке варто взяти з собою", reversed: "перевернута", question: "Запитання" },
    returnBody: "Перечитування живе у вашому альманасі. Відкрийте читання, яке ви зберегли щонайменше день тому: над вашими нотатками Olivia запропонує ще раз поглянути на карти й записати, що ви бачите тепер. Кожне перечитування зберігається з датою в історії цього запитання.",
    returnLink: "Відкрити мій альманах ↗",
  },
};

const PRISM_CARDS = [16, 17, 38, 57, 34, 9, 64, 13];
const WALK_CARDS = [2, 9, 17, 0, 52, 44];

export default function LessonTool({ tool, locale }: { tool: ToolId; locale: Locale }) {
  const l = L[locale];
  let body: React.ReactNode = null;

  if (tool === "position-prism") {
    const cards = PRISM_CARDS.map((id) => ({
      id, name: cardName(id, locale), thumb: getCardThumbPath(ALL_CARDS[id]),
      positions: (["heart", "challenge", "advice"] as const).map((key) => ({ key, label: POSITION[locale][key][0], question: POSITION[locale][key][1], text: leafById(id)![locale].positions[key] })),
    }));
    body = <PrismPractice cards={cards} labels={l.prism} choose={l.choose} tryHref={`${home(locale)}#spreads/clarity3`} />;
  }

  if (tool === "survey-demo") {
    body = <SurveyDemo locale={locale} names={ALL_CARDS.map((_, id) => cardName(id, locale))} thumbs={ALL_CARDS.map((c) => getCardThumbPath(c))} images={ALL_CARDS.map((c) => getCardImagePath(c))} labels={l.survey} />;
  }

  if (tool === "pair-drill") {
    // A curated handful keeps the page light: pairs that share a carved symbol first, then a spread of the rest.
    const all = allPairs();
    const withBridge = all.filter((p) => describePair(p).shared.length > 0);
    const others = all.filter((p) => !withBridge.includes(p)).filter((_, i) => i % 9 === 0);
    const chosen = [...withBridge.slice(0, 16), ...others].slice(0, 24);
    const pairs: DrillPair[] = chosen.map((pair) => {
      const { facts, shared } = describePair(pair);
      const fa = cardFacts(pair.a), fb = cardFacts(pair.b);
      const nameA = cardName(pair.a, locale), nameB = cardName(pair.b, locale);
      return {
        a: { id: pair.a, name: nameA, image: getCardImagePath(ALL_CARDS[pair.a]), href: cardHref(pair.a, locale) },
        b: { id: pair.b, name: nameB, image: getCardImagePath(ALL_CARDS[pair.b]), href: cardHref(pair.b, locale) },
        chips: [],
        lenses: pairLenses(facts, { nameA, nameB, suitA: fa.suit, elementA: fa.element, elementB: fb.element, number: fa.number,
          sharedNames: shared.map((s) => (locale === "uk" ? `«${s.a.uk.name}» і «${s.b.uk.name}»` : `“${s.a.en.name}” and “${s.b.en.name}”`)) }, locale),
        readings: pair.readings.map((r) => ({ from: cardName(r.from, locale), text: r[locale] })),
        href: pairHref(pair, locale),
      };
    });
    body = <PairDrill pairs={pairs} labels={l.drill} />;
  }

  if (tool === "deck-table") {
    const cards = allLeaves().filter((leaf) => leaf.id >= 22 && cardFacts(leaf.id).number !== null).map((leaf) => {
      const f = cardFacts(leaf.id);
      return { id: leaf.id, suit: Math.floor((leaf.id - 22) / 14), number: f.number!, name: cardName(leaf.id, locale), thumb: getCardThumbPath(ALL_CARDS[leaf.id]), numberText: leaf[locale].number, essence: leaf[locale].essence };
    });
    body = <DeckTable cards={cards} labels={l.table} />;
  }

  if (tool === "court-council") {
    const courts = allLeaves().filter((leaf) => cardFacts(leaf.id).court).map((leaf) => ({
      id: leaf.id, name: cardName(leaf.id, locale), thumb: getCardThumbPath(ALL_CARDS[leaf.id]),
      temperament: leaf[locale].court!.temperament, gifts: leaf[locale].court!.gifts, shadow: leaf[locale].court!.shadow,
    }));
    body = <CourtCouncil courts={courts} labels={l.council} />;
  }

  if (tool === "pin-walk") {
    const cards = WALK_CARDS.map((id) => ({
      id, name: cardName(id, locale), image: getCardImagePath(ALL_CARDS[id]), href: cardHref(id, locale),
      symbols: leafById(id)!.symbols.map((s) => ({ x: s.x, y: s.y, name: s[locale].name, seen: s[locale].seen, meaning: s[locale].meaning })),
    }));
    body = <PinWalk cards={cards} labels={l.walk} />;
  }

  if (tool === "worked-readings") {
    type File = { id: string; spread: SpreadId; cards: { id: number; reversed: boolean }[]; en: Omit<WorkedData, "id" | "cards">; uk?: Omit<WorkedData, "id" | "cards"> };
    const readings: WorkedData[] = (WORKED_READING_FILES as unknown as File[]).filter((w) => w[locale]).map((w) => ({
      ...(w[locale] as Omit<WorkedData, "id" | "cards">),
      id: w.id,
      cards: w.cards.map((c, i) => ({ name: cardName(c.id, locale), image: getCardImagePath(ALL_CARDS[c.id]), position: SPREAD_POSITIONS[w.spread][i][locale], reversed: c.reversed })),
    }));
    if (readings.length) body = <WorkedReading readings={readings} labels={l.worked} />;
  }

  if (tool === "question-lab") body = <QuestionLabTool locale={locale} />;
  if (tool === "sentence") body = <SentenceTool locale={locale} />;

  if (tool === "return") {
    body = (
      <div className={styles.returnTool}>
        <p className={styles.sectionLead}>{l.returnBody}</p>
        <a className={styles.primaryLink} href={`${home(locale)}#journal`}>{l.returnLink}</a>
      </div>
    );
  }

  if (!body) return null;
  return (
    <section className={styles.tool} aria-label={TITLES[tool][locale]}>
      <p className={styles.toolKicker}>{locale === "uk" ? "Інтерактивно" : "Interactive"}</p>
      <h2 className={styles.toolTitle}>{TITLES[tool][locale]}</h2>
      {body}
    </section>
  );
}
