/**
 * Pair lab: any two of the 78 cards, read together. The page chrome, the
 * labels in both languages and a small prepared slice of every card (name,
 * images, one-sentence essence, rarer carved symbols) for the client tool.
 */

import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardImagePath, getCardThumbPath } from "@/lib/academy/card-images";
import { leafById, type LeafLocale } from "@/lib/academy/leaf";
import { allPairs } from "@/lib/academy/pairs";
import { COMMON_SYMBOL_KEYS, cardFacts } from "@/lib/learn/card-facts";
import { cardName } from "./PairPage";
import PairLab, { type LabCard, type LabGroup, type LabLabels } from "./PairLab";
import styles from "./pair-page.module.css";

const COPY = {
  en: {
    home: "Home", cards: "Cards", pairs: "Pairs", crumb: "Breadcrumb", kicker: "Any two cards", title: "Pair lab",
    lead: "Choose any two of the 78 cards, or deal two at random. Olivia sets out what links them and five ways to read them together; the reading itself is yours to write.",
    lesson: "How to read two cards together ↗", all: "All written pairs ↗",
  },
  uk: {
    home: "Головна", cards: "Карти Таро", pairs: "Пари", crumb: "Навігаційний шлях", kicker: "Будь-які дві карти", title: "Лабораторія пар",
    lead: "Оберіть будь-які дві з 78 карт або витягніть дві навмання. Olivia покаже, що їх поєднує, і запропонує п’ять способів прочитати їх разом; саме читання пишете ви.",
    lesson: "Як читати дві карти разом ↗", all: "Усі написані пари ↗",
  },
};

const LABELS: Record<LeafLocale, LabLabels> = {
  en: {
    first: "First card", second: "Second card", group: "Arcana or suit", groups: ["Major Arcana", "Wands", "Cups", "Swords", "Pentacles"], card: "Card",
    other: "Already chosen as the other card", deal: "Deal two at random", swap: "Swap the order", open: "{name}: the full card",
    links: "What links them", shared: "Carved on both cards", noShared: "No carved symbol appears on both cards.",
    ways: "Five ways to read this pair", waysLead: "Try one lens at a time. Write a sentence or two before you look for anyone else’s version.",
    lens: "Choose a lens", yours: "Your reading of the pair", placeholder: "A sentence or two, through this lens…", privacy: "Optional. Nothing you write here is saved or sent.",
    written: "The written version", hasWritten: "This pair has its own page with a written reading. Write yours first, then compare.", readWritten: "Read the written version ↗",
    noWritten: "No written version of this pair exists yet. Here is each card’s essence in one sentence, as material for your own reading.",
    bothMajor: "Both Major Arcana", majorMinor: "A Major and a Minor", sameSuit: "The same suit", sameNumber: "The same number", sameCourt: "The same court rank",
    contrary: "Contrary elements", sameElement: "The same element", neutral: "Neutral elements",
  },
  uk: {
    first: "Перша карта", second: "Друга карта", group: "Аркани чи масть", groups: ["Старші Аркани", "Жезли", "Кубки", "Мечі", "Пентаклі"], card: "Карта",
    other: "Уже обрана як інша карта", deal: "Витягнути дві навмання", swap: "Поміняти місцями", open: "{name}: уся карта",
    links: "Що їх поєднує", shared: "Вирізьблено на обох картах", noShared: "Спільного вирізьбленого символу в цих карт немає.",
    ways: "П’ять способів прочитати цю пару", waysLead: "Беріть по одній призмі. Напишіть речення чи два, перш ніж шукати чужу версію.",
    lens: "Оберіть призму", yours: "Ваше читання пари", placeholder: "Одне-два речення крізь цю призму…", privacy: "Необов’язково. Ніщо з написаного тут не зберігається й не надсилається.",
    written: "Написана версія", hasWritten: "Ця пара має власну сторінку з написаним читанням. Спершу напишіть своє, потім порівняйте.", readWritten: "Прочитати написану версію ↗",
    noWritten: "Написаної версії цієї пари ще немає. Ось суть кожної карти одним реченням як матеріал для вашого читання.",
    bothMajor: "Обидві — Старші Аркани", majorMinor: "Старший і Молодший Аркани", sameSuit: "Та сама масть", sameNumber: "Те саме число", sameCourt: "Той самий придворний ранг",
    contrary: "Протилежні стихії", sameElement: "Та сама стихія", neutral: "Нейтральні стихії",
  },
};

/** Every card, with only its rarer carved symbols (the first of each key): sharing a common one says little. */
function labCards(locale: LeafLocale): LabCard[] {
  return ALL_CARDS.map((card, id) => {
    const leaf = leafById(id)!;
    const seen = new Set<string>();
    const symbols = leaf.symbols.filter((s) => !COMMON_SYMBOL_KEYS.has(s.key) && !seen.has(s.key) && seen.add(s.key))
      .map((s) => ({ k: s.key, x: s.x, y: s.y, name: s[locale].name }));
    return {
      name: cardName(id, locale), thumb: getCardThumbPath(card), image: getCardImagePath(card), essence: leaf[locale].essence,
      slug: leaf.slug, group: (cardFacts(id).suit ?? "major") as LabGroup, symbols,
    };
  });
}

export default function PairLabPage({ locale }: { locale: LeafLocale }) {
  const c = COPY[locale];
  const prefix = locale === "uk" ? "/uk" : "";
  const library = `${prefix}/cards/`;
  return (
    <article className={styles.page} lang={locale}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol>
          <li><Link href={locale === "uk" ? "/uk/" : "/"}>{c.home}</Link></li><li aria-hidden>/</li>
          <li><Link href={library}>{c.cards}</Link></li><li aria-hidden>/</li>
          <li><Link href={`${library}pairs/`}>{c.pairs}</Link></li><li aria-hidden>/</li>
          <li aria-current="page">{c.title}</li>
        </ol>
      </nav>
      <header>
        <p className={styles.kicker}>{c.kicker}</p>
        <h1 className={styles.h1}>{c.title}</h1>
        <p className={styles.lead}>{c.lead}</p>
        <p className={styles.cardLinks}>
          <Link href={`${prefix}/learn/combinations/two-cards-five-ways/`}>{c.lesson}</Link>
          <Link href={`${library}pairs/`}>{c.all}</Link>
        </p>
      </header>
      <PairLab locale={locale} cards={labCards(locale)} written={allPairs().map((pair) => pair.slug)} labels={LABELS[locale]} />
    </article>
  );
}
