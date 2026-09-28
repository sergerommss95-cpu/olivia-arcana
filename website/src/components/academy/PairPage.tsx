/**
 * Two cards in conversation: both images, what links them, one reader's
 * version from each card's page, and five ways to read them together.
 */

import Image from "next/image";
import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { getCardImagePath } from "@/lib/academy/card-images";
import { leafById, type LeafLocale } from "@/lib/academy/leaf";
import { describePair, pairHref, pairsForCard, type CardPair } from "@/lib/academy/pairs";
import { cardFacts } from "@/lib/learn/card-facts";
import { loupeBackground } from "@/lib/learn/loupe";
import { pairLenses } from "@/lib/learn/pair-lenses";
import styles from "./pair-page.module.css";

const COPY = {
  en: {
    home: "Home", cards: "Cards", pairs: "Pairs", crumb: "Breadcrumb", kicker: "Two cards in conversation",
    lead: "People often bring two cards with a question about what will happen. Olivia reads a pair as a conversation instead: what each card brings, and what appears between them.",
    links: "What links them", shared: "Carved on both cards", readings: "One reader’s version", from: (name: string) => `Written for the page of ${name}`,
    ways: "Five ways to read this pair", waysLead: "Try one lens at a time. Write a sentence for each before you read anyone else’s version.",
    lesson: "Learn the method: two cards, five ways ↗", open: (name: string) => `${name}: the full card ↗`,
    more: (name: string) => `More pairs with ${name}`, all: "All pairs ↗",
    bothMajor: "Both Major Arcana", majorMinor: "A Major and a Minor", sameSuit: "The same suit", sameNumber: "The same number", sameCourt: "The same court rank",
    contrary: "Contrary elements", sameElement: "The same element", neutral: "Neutral elements",
  },
  uk: {
    home: "Головна", cards: "Карти Таро", pairs: "Пари", crumb: "Навігаційний шлях", kicker: "Дві карти в розмові",
    lead: "Часто до двох карт приходять із запитанням про те, що станеться. Olivia читає пару інакше — як розмову: що приносить кожна карта і що з’являється між ними.",
    links: "Що їх поєднує", shared: "Вирізьблено на обох картах", readings: "Одна з версій читання", from: (name: string) => `Написано для сторінки карти «${name}»`,
    ways: "П’ять способів прочитати цю пару", waysLead: "Беріть по одній оптиці. Напишіть власне речення для кожної, перш ніж читати чужу версію.",
    lesson: "Метод докладно: дві карти, п’ять способів ↗", open: (name: string) => `${name}: уся карта ↗`,
    more: (name: string) => `Інші пари з картою «${name}»`, all: "Усі пари ↗",
    bothMajor: "Обидві — Старші Аркани", majorMinor: "Старший і Молодший Аркан", sameSuit: "Та сама масть", sameNumber: "Однакове число", sameCourt: "Однаковий придворний ранг",
    contrary: "Протилежні стихії", sameElement: "Та сама стихія", neutral: "Нейтральні стихії",
  },
};

export function cardName(id: number, locale: LeafLocale): string {
  const name = ALL_CARDS[id].name;
  return locale === "uk" ? TAROT_UK[name]?.name ?? name : name;
}

function cardHref(id: number, locale: LeafLocale) {
  return `${locale === "uk" ? "/uk" : ""}/cards/${leafById(id)!.slug}/`;
}

export default function PairPage({ pair, locale }: { pair: CardPair; locale: LeafLocale }) {
  const c = COPY[locale];
  const nameA = cardName(pair.a, locale), nameB = cardName(pair.b, locale);
  const { facts, shared } = describePair(pair);
  const fa = cardFacts(pair.a), fb = cardFacts(pair.b);
  const chips = [
    facts.bothMajor && c.bothMajor,
    facts.majorWithMinor && c.majorMinor,
    facts.sameSuit && c.sameSuit,
    facts.sameNumber && c.sameNumber,
    facts.sameCourt && c.sameCourt,
    facts.elements === "contrary" && c.contrary,
    facts.elements === "same" && !facts.sameSuit && c.sameElement,
    facts.elements === "neutral" && c.neutral,
  ].filter(Boolean) as string[];
  const lenses = pairLenses(facts, {
    nameA, nameB, suitA: fa.suit, elementA: fa.element, elementB: fb.element, number: fa.number,
    sharedNames: shared.map((s) => locale === "uk" ? `«${s.a.uk.name}» і «${s.b.uk.name}»` : `“${s.a.en.name}” and “${s.b.en.name}”`),
  }, locale);
  const library = locale === "uk" ? "/uk/cards/" : "/cards/";
  const index = `${library}pairs/`;
  const lesson = `${locale === "uk" ? "/uk" : ""}/learn/combinations/two-cards-five-ways/`;

  return (
    <article className={styles.page} lang={locale}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol>
          <li><Link href={locale === "uk" ? "/uk/" : "/"}>{c.home}</Link></li><li aria-hidden>/</li>
          <li><Link href={library}>{c.cards}</Link></li><li aria-hidden>/</li>
          <li><Link href={index}>{c.pairs}</Link></li><li aria-hidden>/</li>
          <li aria-current="page">{nameA} + {nameB}</li>
        </ol>
      </nav>

      <header className={styles.hero}>
        <div className={styles.fan} aria-hidden>
          <Image src={getCardImagePath(ALL_CARDS[pair.a])} alt="" width={896} height={1536} priority className={styles.cardA} sizes="220px" />
          <Image src={getCardImagePath(ALL_CARDS[pair.b])} alt="" width={896} height={1536} priority className={styles.cardB} sizes="220px" />
        </div>
        <div>
          <p className={styles.kicker}>{c.kicker}</p>
          <h1 className={styles.h1}>{nameA} <em>+</em> {nameB}</h1>
          <p className={styles.lead}>{c.lead}</p>
          <p className={styles.cardLinks}>
            <Link href={cardHref(pair.a, locale)}>{c.open(nameA)}</Link>
            <Link href={cardHref(pair.b, locale)}>{c.open(nameB)}</Link>
          </p>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="links-title">
        <h2 id="links-title" className={styles.h2}>{c.links}</h2>
        <ul className={styles.chips}>{chips.map((chip) => <li key={chip}>{chip}</li>)}</ul>
        {shared.length > 0 && (
          <div className={styles.sharedBlock}>
            <p className={styles.label}>{c.shared}</p>
            <ul className={styles.sharedList}>
              {shared.map((s) => (
                <li key={s.key} className={styles.sharedItem}>
                  {[{ id: pair.a, sym: s.a }, { id: pair.b, sym: s.b }].map(({ id, sym }) => {
                    const bg = loupeBackground(sym);
                    return (
                      <span key={id} className={styles.loupe} aria-hidden
                        style={{ backgroundImage: `url("${getCardImagePath(ALL_CARDS[id])}")`, backgroundSize: bg.size, backgroundPosition: bg.position }} />
                    );
                  })}
                  <span className={styles.sharedText}>
                    <strong>{s.a[locale].name}</strong> · <strong>{s.b[locale].name}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="ways-title">
        <h2 id="ways-title" className={styles.h2}>{c.ways}</h2>
        <p className={styles.sectionLead}>{c.waysLead}</p>
        <ol className={styles.lenses}>
          {lenses.map((lens, i) => (
            <li key={lens.id}>
              <span className={styles.lensNo} aria-hidden>{i + 1}</span>
              <h3>{lens.title}</h3>
              <p>{lens.prompt}</p>
            </li>
          ))}
        </ol>
        <p className={styles.lessonLink}><Link href={lesson}>{c.lesson}</Link></p>
      </section>

      <section className={styles.section} aria-labelledby="readings-title">
        <h2 id="readings-title" className={styles.h2}>{c.readings}</h2>
        {pair.readings.map((reading) => (
          <figure key={reading.from} className={styles.reading}>
            <blockquote><p>{reading[locale]}</p></blockquote>
            <figcaption>{c.from(cardName(reading.from, locale))}</figcaption>
          </figure>
        ))}
      </section>

      <nav className={styles.more} aria-label={c.pairs}>
        {[pair.a, pair.b].map((id) => (
          <div key={id}>
            <h2 className={styles.label}>{c.more(cardName(id, locale))}</h2>
            <ul>
              {pairsForCard(id).filter((p) => p.slug !== pair.slug).slice(0, 6).map((p) => (
                <li key={p.slug}><Link href={pairHref(p, locale)}>{cardName(p.a === id ? p.b : p.a, locale)}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <p><Link href={index}>{c.all}</Link></p>
      </nav>
    </article>
  );
}
