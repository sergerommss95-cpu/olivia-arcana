/**
 * One card's academy page, in English or Ukrainian: the reading of the card,
 * its image read symbol by symbol, its number and tradition, how it speaks
 * in love, work and self, in a spread and beside other cards.
 */

import Image from "next/image";
import Link from "next/link";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { getCardImagePath, getCardThumbPath } from "@/lib/academy/card-images";
import { cardsSharingSymbols, type Leaf, type LeafLocale } from "@/lib/academy/leaf";
import { symbolTrailFor } from "@/lib/academy/symbol-trails";
import SymbolPlate from "./SymbolPlate";
import styles from "./card-leaf.module.css";

const NUMERALS = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const SUITS = { en: { wands: "Wands", cups: "Cups", swords: "Swords", pentacles: "Pentacles" }, uk: { wands: "Жезли", cups: "Кубки", swords: "Мечі", pentacles: "Пентаклі" } };

const COPY = {
  en: {
    home: "Home", cards: "Cards", crumb: "Breadcrumb", major: "Major Arcana", minor: "Minor Arcana",
    lead: "Tarot card meaning: upright, reversed and the symbols of the Olivia image",
    upright: "Upright", reversed: "Reversed", readImage: "Read the image",
    readImageLead: "Every element below is carved into this card. Scroll, hover or press a number to follow it on the image.",
    seen: "What you see", meaning: "What it carries", pins: "Elements of the image",
    pin: (n: number, name: string) => `${n}. ${name}`,
    number: "The number", tradition: "The tradition", court: "As a temperament",
    temperament: "Temperament", gifts: "Gifts", shadow: "Shadow",
    areas: "Love, work and self", love: "Love", work: "Work", self: "Self",
    spread: "In a spread", heart: "At the heart of a question", challenge: "As what complicates it", advice: "As a next step",
    pairs: "In conversation with", questions: "Questions to keep", practice: "A small practice",
    shared: "Cards that share its symbols", sharedVia: "Shares", ask: "Bring your own question ↗",
    askLine: "A meaning on a page is a map. The card you draw for your own question is the territory.",
    all: "All 78 cards", trail: "Follow this symbol through the deck ↗",
    image: (name: string) => `${name}, from the Olivia Arcana deck: carved ivory on lapis lazuli`,
  },
  uk: {
    home: "Головна", cards: "Карти Таро", crumb: "Навігаційний шлях", major: "Старші Аркани", minor: "Молодші Аркани",
    lead: "Значення карти Таро: пряме й перевернуте положення та символи зображення Olivia",
    upright: "Пряме положення", reversed: "Перевернуте положення", readImage: "Прочитайте зображення",
    readImageLead: "Кожен елемент нижче вирізьблено на цій карті. Гортайте, наводьте курсор або натисніть номер, щоб знайти його на зображенні.",
    seen: "Що видно", meaning: "Що це несе", pins: "Елементи зображення",
    pin: (n: number, name: string) => `${n}. ${name}`,
    number: "Число", tradition: "Традиція", court: "Як темперамент",
    temperament: "Темперамент", gifts: "Сильні сторони", shadow: "Тінь",
    areas: "Стосунки, робота й ви самі", love: "Стосунки", work: "Робота", self: "Ви самі",
    spread: "У розкладі", heart: "У центрі запитання", challenge: "Як те, що ускладнює", advice: "Як наступний крок",
    pairs: "У розмові з іншими картами", questions: "Запитання, які варто зберегти", practice: "Невелика практика",
    shared: "Карти зі спільними символами", sharedVia: "Спільне", ask: "Принести своє запитання ↗",
    askLine: "Значення на сторінці — це мапа. Карта, яку ви витягнете для власного запитання, — це вже сама місцевість.",
    all: "Усі 78 карт", trail: "Простежити цей символ у колоді ↗",
    image: (name: string) => `${name} — карта з колоди Olivia Arcana: різьблення зі слонової кістки на лазуриті`,
  },
};

function cardName(id: number, locale: LeafLocale): string {
  const name = ALL_CARDS[id].name;
  return locale === "uk" ? TAROT_UK[name]?.name ?? name : name;
}

function cardHref(id: number, locale: LeafLocale): string {
  const slug = ALL_CARDS[id].name.toLowerCase().replace(/\s+/g, "-");
  return locale === "uk" ? `/uk/cards/${slug}/` : `/cards/${slug}/`;
}

function Section({ no, title, id, children, wide }: { no: number; title: string; id?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <section className={wide ? `${styles.section} ${styles.sectionWide}` : styles.section} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      <h2 className={styles.h2} id={id ? `${id}-title` : undefined}>
        <span className={styles.sectionNo} aria-hidden>§ {no}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** `ground` is the page colour behind the article; the sticky phone plate fades into it. */
export default function CardLeaf({ leaf, locale, ground }: { leaf: Leaf; locale: LeafLocale; ground?: string }) {
  const c = COPY[locale];
  const text = leaf[locale];
  const card = ALL_CARDS[leaf.id];
  const name = cardName(leaf.id, locale);
  const home = locale === "uk" ? "/uk/" : "/";
  const library = locale === "uk" ? "/uk/cards/" : "/cards/";
  const kicker = card.arcana === "major" ? `${c.major} · ${NUMERALS[leaf.id]}` : `${c.minor} · ${SUITS[locale][card.suit!]}`;
  const image = getCardImagePath(card);
  const shared = cardsSharingSymbols(leaf, 4);
  let n = 0;
  const next = () => ++n;

  const symbols = leaf.symbols.map((symbol, index) => {
    const trail = symbolTrailFor(symbol.key, locale, leaf.id);
    return { key: symbol.key, x: symbol.x, y: symbol.y, ...symbol[locale], pinLabel: c.pin(index + 1, symbol[locale].name), trail: trail ? { href: trail.href, label: c.trail } : undefined };
  });

  return (
    <article className={styles.leaf} lang={locale} style={ground ? ({ "--page-bg": ground } as React.CSSProperties) : undefined}>
      <nav aria-label={c.crumb} className={styles.crumb}>
        <ol>
          <li><Link href={home}>{c.home}</Link></li>
          <li aria-hidden>/</li>
          <li><Link href={library}>{c.cards}</Link></li>
          <li aria-hidden>/</li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>

      <header className={styles.hero}>
        <figure className={styles.heroFigure}>
          <Image src={image} alt={c.image(name)} width={896} height={1536} priority className={styles.heroArt} sizes="(max-width: 800px) 60vw, 320px" />
        </figure>
        <div className={styles.heroText}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.h1}>{name}</h1>
          <p className={styles.lead}>{c.lead}</p>
          <p className={styles.essence}>{text.essence}</p>
          <dl className={styles.keywords}>
            <div><dt>{c.upright}</dt><dd>{text.keywords.upright.map((w) => <span key={w}>{w}</span>)}</dd></div>
            <div><dt>{c.reversed}</dt><dd>{text.keywords.reversed.map((w) => <span key={w}>{w}</span>)}</dd></div>
          </dl>
          <a className={styles.jump} href="#read-the-image">{c.readImage} ↓</a>
        </div>
      </header>

      <Section no={next()} title={c.upright} id="upright">
        {text.upright.map((p, i) => <p key={i} className={styles.prose}>{p}</p>)}
      </Section>

      <Section no={next()} title={c.reversed} id="reversed">
        {text.reversed.map((p, i) => <p key={i} className={styles.prose}>{p}</p>)}
      </Section>

      <Section no={next()} title={c.readImage} id="read-the-image" wide>
        <p className={styles.sectionLead}>{c.readImageLead}</p>
        <SymbolPlate
          image={image}
          alt={c.image(name)}
          symbols={symbols}
          labels={{ seen: c.seen, meaning: c.meaning, list: c.pins }}
        />
      </Section>

      <div className={styles.pairGrid}>
        <Section no={next()} title={c.number} id="number">
          <p className={styles.prose}>{text.number}</p>
        </Section>
        <Section no={next()} title={c.tradition} id="tradition">
          <p className={styles.prose}>{text.tradition}</p>
        </Section>
      </div>

      {text.court && (
        <Section no={next()} title={c.court} id="temperament" wide>
          <dl className={styles.triad}>
            <div><dt>{c.temperament}</dt><dd>{text.court.temperament}</dd></div>
            <div><dt>{c.gifts}</dt><dd>{text.court.gifts}</dd></div>
            <div><dt>{c.shadow}</dt><dd>{text.court.shadow}</dd></div>
          </dl>
        </Section>
      )}

      <Section no={next()} title={c.areas} id="areas" wide>
        <dl className={styles.triad}>
          <div><dt>{c.love}</dt><dd>{text.areas.love}</dd></div>
          <div><dt>{c.work}</dt><dd>{text.areas.work}</dd></div>
          <div><dt>{c.self}</dt><dd>{text.areas.self}</dd></div>
        </dl>
      </Section>

      <Section no={next()} title={c.spread} id="in-a-spread" wide>
        <ol className={styles.positions}>
          {(["heart", "challenge", "advice"] as const).map((key, i) => (
            <li key={key}>
              <span className={styles.positionNo} aria-hidden>{["I", "II", "III"][i]}</span>
              <h3>{c[key]}</h3>
              <p>{text.positions[key]}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section no={next()} title={c.pairs} id="pairs" wide>
        <ul className={styles.pairs}>
          {text.pairs.map((pair) => (
            <li key={pair.with}>
              <Link href={cardHref(pair.with, locale)} className={styles.pairCard}>
                <span className={styles.pairThumbs} aria-hidden>
                  <Image src={getCardThumbPath(card)} alt="" width={120} height={206} />
                  <Image src={getCardThumbPath(ALL_CARDS[pair.with])} alt="" width={120} height={206} />
                </span>
                <span className={styles.pairName}>{name} <em>+</em> {cardName(pair.with, locale)}</span>
              </Link>
              <p>{pair.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section no={next()} title={c.questions} id="questions">
        <ol className={styles.questions}>
          {text.questions.map((q) => <li key={q}>{q}</li>)}
        </ol>
        <div className={styles.practice}>
          <h3>{c.practice}</h3>
          <p>{text.practice}</p>
        </div>
      </Section>

      <aside className={styles.ask}>
        <p>{c.askLine}</p>
        <a className={styles.askButton} href={locale === "uk" ? "/uk/?experience=question" : "/?experience=question"}>{c.ask}</a>
      </aside>

      {shared.length > 0 && (
        <section className={`${styles.section} ${styles.sectionWide}`} aria-labelledby="shared-title">
          <h2 className={styles.h2} id="shared-title">{c.shared}</h2>
          <ul className={styles.shared}>
            {shared.map((entry) => (
              <li key={entry.id}>
                <Link href={cardHref(entry.id, locale)} className={styles.sharedCard}>
                  <Image src={getCardThumbPath(ALL_CARDS[entry.id])} alt="" width={120} height={206} />
                  <span className={styles.sharedName}>{cardName(entry.id, locale)}</span>
                  <span className={styles.sharedVia}>{c.sharedVia}: {entry.shared.map((key) => leaf.symbols.find((s) => s.key === key)?.[locale].name ?? key).join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className={styles.allLink}><Link href={library}>{c.all} ↗</Link></p>
        </section>
      )}
    </article>
  );
}
