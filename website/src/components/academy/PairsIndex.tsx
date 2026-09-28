/** Every card with the cards it has been paired with; each link opens the pair's page. */

import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardThumbPath } from "@/lib/academy/card-images";
import type { LeafLocale } from "@/lib/academy/leaf";
import { allPairs, pairHref, pairsForCard } from "@/lib/academy/pairs";
import { cardName } from "./PairPage";
import styles from "./pair-page.module.css";

const COPY = {
  en: { home: "Home", cards: "Cards", crumb: "Breadcrumb", kicker: "Cards in conversation", title: "Tarot card pairs", lead: (n: number) => `${n} pairs written for the Olivia deck. Choose a card to see who it has been read with, then open a pair to read the two images together.`, lesson: "How to read two cards together ↗" },
  uk: { home: "Головна", cards: "Карти Таро", crumb: "Навігаційний шлях", kicker: "Карти в розмові", title: "Пари карт Таро", lead: (n: number) => `Пар, написаних для колоди Olivia: ${n}. Оберіть карту, щоб побачити, з якими картами її читали, і відкрийте пару, щоб прочитати два зображення разом.`, lesson: "Як читати дві карти разом ↗" },
};

export default function PairsIndex({ locale }: { locale: LeafLocale }) {
  const c = COPY[locale];
  const library = locale === "uk" ? "/uk/cards/" : "/cards/";
  return (
    <article className={styles.page} lang={locale}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol><li><Link href={locale === "uk" ? "/uk/" : "/"}>{c.home}</Link></li><li aria-hidden>/</li><li><Link href={library}>{c.cards}</Link></li><li aria-hidden>/</li><li aria-current="page">{c.title}</li></ol>
      </nav>
      <header>
        <p className={styles.kicker}>{c.kicker}</p>
        <h1 className={styles.h1}>{c.title}</h1>
        <p className={styles.lead}>{c.lead(allPairs().length)}</p>
        <p className={styles.cardLinks}><Link href={`${locale === "uk" ? "/uk" : ""}/learn/combinations/two-cards-five-ways/`}>{c.lesson}</Link></p>
      </header>
      <ul className={styles.indexList}>
        {ALL_CARDS.map((card, id) => (
          <li key={id} className={styles.indexRow}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
            <img src={getCardThumbPath(card)} width={120} height={206} alt="" loading="lazy" decoding="async" className={styles.indexThumb} />
            <span className={styles.indexName}>{cardName(id, locale)}</span>
            <span className={styles.indexPartners}>
              {pairsForCard(id).map((pair) => (
                <Link key={pair.slug} href={pairHref(pair, locale)}>{cardName(pair.a === id ? pair.b : pair.a, locale)}</Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
