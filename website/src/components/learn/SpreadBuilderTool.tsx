/**
 * Server wrapper for the spread builder: each card's name, thumbnail, one-line
 * essence and page slug, the starting templates from the lesson, and the
 * EN/UK labels.
 */
import { SUPPORT } from "./SupportLines";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardThumbPath } from "@/lib/academy/card-images";
import { leafById } from "@/lib/academy/leaf";
import { cardName } from "@/components/academy/PairPage";
import type { Locale } from "@/lib/learn/lessons";
import SpreadBuilder, { type BuilderLabels, type Template } from "./SpreadBuilder";

// The same-card test from the lesson: The Hermit first, then the Three of Cups.
const SAME_CARDS = [9, 38];

const TEMPLATES: Record<Locale, Template[]> = {
  en: [
    { id: "three", title: "Three questions", name: "A situation I want to see more clearly", positions: [
      { label: "The situation", question: "What aspect of the situation deserves attention?" },
      { label: "What complicates it", question: "What tension or assumption deserves a closer look?" },
      { label: "A helpful next step", question: "What small action could help me understand or respond?" },
    ] },
    { id: "returning", title: "Returning to something", name: "Returning to something I set down", positions: [
      { label: "What it gave me", question: "What did it give me?" },
      { label: "What was true", question: "What was true when I stepped away?" },
      { label: "What has changed", question: "What has changed in me since?" },
      { label: "The way back in", question: "What is the smallest way back in?" },
    ] },
    { id: "conversation", title: "Before a difficult conversation", name: "Before a difficult conversation", positions: [
      { label: "What I protect", question: "What value do I want to protect in this conversation?" },
      { label: "What I want to understand", question: "What do I want to understand from them?" },
      { label: "What steadies me", question: "What steadies me?" },
      { label: "A first sentence", question: "What first sentence could I say aloud?" },
    ] },
  ],
  uk: [
    { id: "three", title: "Три запитання", name: "Ситуація, яку я хочу побачити ясніше", positions: [
      { label: "Ситуація", question: "Який аспект ситуації потребує уваги?" },
      { label: "Що ускладнює", question: "Яка напруга чи припущення потребує уважнішого погляду?" },
      { label: "Корисний наступний крок", question: "Яка маленька дія допоможе мені краще зрозуміти ситуацію або відповісти на неї?" },
    ] },
    { id: "returning", title: "Повернення до відкладеного", name: "Повернення до відкладеної справи", positions: [
      { label: "Що це давало", question: "Що це мені давало?" },
      { label: "Що було правдою", question: "Що було правдою на момент перерви?" },
      { label: "Що змінилося", question: "Що змінилося в мені відтоді?" },
      { label: "Спосіб повернутися", question: "Який найменший спосіб повернутися?" },
    ] },
    { id: "conversation", title: "Перед складною розмовою", name: "Перед складною розмовою", positions: [
      { label: "Що я оберігаю", question: "Яку цінність я хочу вберегти в цій розмові?" },
      { label: "Що я хочу зрозуміти", question: "Що я хочу дізнатися від цієї людини?" },
      { label: "Що дає мені опору", question: "Що дає мені опору?" },
      { label: "Перше речення", question: "Яке перше речення я можу сказати вголос?" },
    ] },
  ],
};

const LABELS: Record<Locale, BuilderLabels> = {
  en: {
    lead: "Name the job, then write each position as one open question. Include at least one resource position, and let the last ask for a step within reach. The notes under a question only suggest; nothing here stops you.",
    startFrom: "Start from",
    blank: "A blank page",
    yours: "Saved on this device",
    untitled: "Untitled spread",
    deleteAria: "Delete the saved design “{name}”",
    undo: "Bring back the previous draft",
    restored: "The previous draft is back.",
    name: "The job, in one line",
    namePlaceholder: "e.g. before a difficult conversation",
    positions: "Positions, one open question each",
    position: "Position {n}",
    labelAria: "Position {n}: short label",
    questionAria: "Position {n}: question",
    labelPlaceholder: "A short label",
    questionPlaceholder: "An open question, beginning with What or How",
    lastPlaceholder: "What small step could I try this week?",
    lastHint: "The last position: a step within reach, something you could try this week and undo if it does not help.",
    waiting: "The word “{word}” turns a place for looking into a place for waiting. Ask about something you can look at today.",
    moveUp: "Move position {n} up",
    moveDown: "Move position {n} down",
    remove: "Remove position {n}",
    add: "Add a position",
    moved: "Moved. It is now position {n}.",
    removed: "Position removed.",
    added: "Position {n} added.",
    loaded: "Loaded: {name}.",
    countFew: "Fewer than three: enough for a quick look. Three to five suit most first spreads.",
    countGood: "Three to five: a good size for a first spread.",
    countMany: "Six is a lot for a first spread: five are plenty.",
    countMost: "Seven is the most here. Past about seven, positions start to read as a list.",
    save: "Save this design",
    saved: "Saved on this device.",
    saveFailed: "This browser is not keeping saved designs here. Copy the design as text instead.",
    deleted: "Deleted.",
    copy: "Copy as text",
    copied: "Copied.",
    copyFallback: "Copying is not available here. The text is below, selected and ready to copy.",
    copyField: "Your spread as text",
    tryTitle: "Try it with the deck",
    tryLead: "Deal a different card into each position and write a sentence for each. Then run the same-card test: one card in every position.",
    deal: "Deal a card to each position",
    again: "Deal again",
    notReady: "Write at least one position to try the spread.",
    sameTitle: "Same-card test:",
    sameLead: "The same card in every position",
    samePrompt: "Write a sentence for each position. If two come out the same, they are one position with two names: merge them or rewrite one. If a position gives only a complaint, widen its question until this card has something true to say.",
    dealtStatus: "Cards dealt: {names}.",
    sameStatus: "In every position: {name}.",
    sentence: "Your sentence",
    sentenceFor: "for position {n}",
    sentencePlaceholder: "One sentence, in this position’s words…",
    noCard: "Deal again to put a card here.",
    copyCard: "Card",
    copyNotes: "Sentence",
    support: SUPPORT.en,
  },
  uk: {
    lead: "Назвіть завдання, а тоді сформулюйте кожну позицію як одне відкрите запитання. Додайте щонайменше одну позицію про ресурс, а останньою поставте крок, який вам під силу. Нотатки під запитанням лише підказують: ніщо тут вас не зупиняє.",
    startFrom: "Почати з",
    blank: "Чистий аркуш",
    yours: "Збережено на цьому пристрої",
    untitled: "Розклад без назви",
    deleteAria: "Видалити збережений розклад: {name}",
    undo: "Повернути попередню чернетку",
    restored: "Попередню чернетку повернуто.",
    name: "Завдання одним рядком",
    namePlaceholder: "наприклад: перед складною розмовою",
    positions: "Позиції, у кожній одне відкрите запитання",
    position: "Позиція {n}",
    labelAria: "Позиція {n}: коротка назва",
    questionAria: "Позиція {n}: запитання",
    labelPlaceholder: "Коротка назва",
    questionPlaceholder: "Відкрите запитання, що починається з «Що» або «Як»",
    lastPlaceholder: "Який маленький крок я можу спробувати цього тижня?",
    lastHint: "Остання позиція — крок, який вам під силу: щось, що можна спробувати цього тижня, а якщо не допоможе, відмовитися від цього.",
    waiting: "Слово «{word}» перетворює позицію, де дивляться, на позицію, де чекають. Запитайте про те, що можна розглянути вже сьогодні.",
    moveUp: "Перемістити позицію {n} вище",
    moveDown: "Перемістити позицію {n} нижче",
    remove: "Вилучити позицію {n}",
    add: "Додати позицію",
    moved: "Переміщено. Тепер це позиція {n}.",
    removed: "Позицію вилучено.",
    added: "Додано позицію {n}.",
    loaded: "Відкрито: {name}.",
    countFew: "Менше трьох позицій — досить для швидкого погляду. Більшості перших розкладів пасує від трьох до п’яти.",
    countGood: "Від трьох до п’яти позицій — добрий розмір для першого розкладу.",
    countMany: "Шість позицій — чимало для першого розкладу: п’яти вистачить з головою.",
    countMost: "Сім — це найбільше тут. Десь після семи позиції починають читатися як список.",
    save: "Зберегти розклад",
    saved: "Збережено на цьому пристрої.",
    saveFailed: "Цей браузер тут не зберігає розклади. Скопіюйте розклад як текст.",
    deleted: "Видалено.",
    copy: "Копіювати як текст",
    copied: "Скопійовано.",
    copyFallback: "Копіювання тут недоступне. Текст нижче вже виділено: скопіюйте його.",
    copyField: "Ваш розклад як текст",
    tryTitle: "Випробуйте з колодою",
    tryLead: "Розкладіть по одній карті в кожну позицію й напишіть речення для кожної. Потім зробіть перевірку однією картою: та сама карта в кожній позиції.",
    deal: "Розкласти по карті в кожну позицію",
    again: "Розкласти ще раз",
    notReady: "Заповніть хоча б одну позицію, щоб випробувати розклад.",
    sameTitle: "Перевірка однією картою:",
    sameLead: "Та сама карта в кожній позиції",
    samePrompt: "Напишіть речення для кожної позиції. Якщо два речення однакові, це одна позиція під двома назвами: об’єднайте їх або перепишіть одну. Якщо позиція дає лише докір, розширюйте її запитання, доки й ця карта не зможе сказати там щось правдиве.",
    dealtStatus: "Розкладено карти: {names}.",
    sameStatus: "У кожній позиції: {name}.",
    sentence: "Ваше речення",
    sentenceFor: "для позиції {n}",
    sentencePlaceholder: "Одне речення словами цієї позиції…",
    noCard: "Розкладіть ще раз, щоб покласти сюди карту.",
    copyCard: "Карта",
    copyNotes: "Речення",
    support: SUPPORT.uk,
  },
};

export default function SpreadBuilderTool({ locale }: { locale: Locale }) {
  const cards = ALL_CARDS.map((card, id) => {
    const leaf = leafById(id)!;
    return { name: cardName(id, locale), thumb: getCardThumbPath(card), essence: leaf[locale].essence, slug: leaf.slug };
  });
  return (
    <SpreadBuilder
      locale={locale}
      cards={cards}
      templates={TEMPLATES[locale]}
      sameCards={SAME_CARDS}
      cardBase={locale === "uk" ? "/uk/cards/" : "/cards/"}
      labels={LABELS[locale]}
    />
  );
}
