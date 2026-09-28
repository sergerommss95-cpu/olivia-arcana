import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARD_SLUGS, getCardBySlug, getCardImagePath, cardNumeral, cardSlug, relatedCards } from "@/app/cards/card-pages";
import { TAROT_UK } from "@/lib/academy/tarot-cards-uk";
import { TAROT_NOTES } from "@/lib/academy/tarot-notes";

// Native Ukrainian notes (formal «ви»), shared with the reading experience.
const NOTES = TAROT_NOTES.uk;
import UkrainianLibraryShell from "../library-shell";
import CardLeaf from "@/components/academy/CardLeaf";
import { leafBySlug } from "@/lib/academy/leaf";
import styles from "../card-library.module.css";

export function generateStaticParams() { return CARD_SLUGS.map(slug => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) return {};
  const text = TAROT_UK[card.name];
  const note = NOTES[card.name];
  const leaf = leafBySlug(slug);
  const title = leaf ? `${text.name}: значення карти Таро, пряме й перевернуте положення, символи | Olivia Arcana` : `${text.name}: пряме та перевернуте значення карти Таро | Olivia Arcana`;
  const source = leaf ? `${leaf.uk.essence} ${leaf.uk.upright[0]}` : note.upright.meaning;
  const description = source.length > 155 ? source.slice(0, 154).replace(/\s+\S*$/, "") + "…" : source;
  const url = `https://oliviaarcana.com/uk/cards/${slug}/`;
  const english = `https://oliviaarcana.com/cards/${slug}/`;
  const image = `https://oliviaarcana.com${getCardImagePath(card)}`;
  return { title, description, keywords: [text.name, "Таро українською", ...text.keywords],
    alternates: { canonical: url, languages: { en: english, uk: url, "x-default": english } },
    openGraph: { title, description, url, type: "article", locale: "uk_UA", alternateLocale: ["en_US"], images: [{ url: image, width: 896, height: 1536, alt: `${text.name} — колода Olivia Arcana` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
const suits = { wands: "Жезли", cups: "Кубки", swords: "Мечі", pentacles: "Пентаклі" };

export default async function UkrainianCardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) notFound();
  const text = TAROT_UK[card.name];
  const note = NOTES[card.name];
  const leaf = leafBySlug(slug);
  if (leaf) {
    const leafLd = {
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "Article", headline: `${text.name} — значення карти Таро`, inLanguage: "uk", description: leaf.uk.essence, image: `https://oliviaarcana.com${getCardImagePath(card)}`, mainEntityOfPage: `https://oliviaarcana.com/uk/cards/${slug}/`, author: { "@type": "Organization", name: "Olivia Arcana", url: "https://oliviaarcana.com/uk/" } },
        { "@type": "FAQPage", inLanguage: "uk", mainEntity: [
          { "@type": "Question", name: `Що означає карта ${text.name}?`, acceptedAnswer: { "@type": "Answer", text: leaf.uk.upright.join(" ") } },
          { "@type": "Question", name: `Що означає ${text.name} у перевернутому положенні?`, acceptedAnswer: { "@type": "Answer", text: leaf.uk.reversed.join(" ") } },
          { "@type": "Question", name: `Які символи на карті ${text.name}?`, acceptedAnswer: { "@type": "Answer", text: leaf.symbols.map((s) => `${s.uk.name}: ${s.uk.meaning}`).join(" ") } },
        ] },
      ],
    };
    return <UkrainianLibraryShell englishPath={`/cards/${slug}/`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(leafLd).replace(/</g, "\\u003c") }} />
      <CardLeaf leaf={leaf} locale="uk" ground="#091a29" />
    </UkrainianLibraryShell>;
  }
  const arcana = card.arcana === "major" ? "Старші Аркани" : `Молодші Аркани · ${suits[card.suit!]}`;
  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: `${text.name} — значення карти Таро`, inLanguage: "uk", description: note.upright.meaning, image: `https://oliviaarcana.com${getCardImagePath(card)}`, mainEntityOfPage: `https://oliviaarcana.com/uk/cards/${slug}/`, author: { "@type": "Organization", name: "Olivia Arcana", url: "https://oliviaarcana.com/uk/" } };
  return <UkrainianLibraryShell englishPath={`/cards/${slug}/`}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <article>
      <nav className={styles.crumb} aria-label="Навігаційний шлях"><Link href="/uk/">Головна</Link><span aria-hidden>/</span><Link href="/uk/cards/">Карти Таро</Link><span aria-hidden>/</span><span aria-current="page">{text.name}</span></nav>
      <header className={styles.hero}>
        <figure className={styles.figure}><Image className={styles.art} src={getCardImagePath(card)} width={896} height={1536} priority alt={`${text.name} — карта з колоди Olivia Arcana`} /><figcaption className={styles.caption}>{cardNumeral(card)} · {text.name}</figcaption></figure>
        <div><p className={styles.kicker}>{arcana}</p><h1 className={styles.title}>{text.name}</h1><p className={styles.lead}>Значення карти Таро</p><ul className={styles.tags}>{text.keywords.map(word => <li key={word}>{word}</li>)}</ul><p className={styles.note}>Прочитайте значення як запрошення до роздумів. Карта не визначає майбутнє й не ухвалює рішень за вас.</p></div>
      </header>
      <div className={styles.content}>
        <section className={styles.section}><h2>У прямому положенні</h2><p>{note.upright.meaning}</p></section>
        <section className={styles.section}><h2>Запитання для роздумів</h2><blockquote><p>{note.upright.prompt}</p></blockquote><p>{note.upright.practice}</p></section>
        <section className={styles.section}><h2>У перевернутому положенні</h2><p>{note.reversed.meaning}</p><blockquote><p>{note.reversed.prompt}</p></blockquote></section>
        <section className={styles.section}><h2>У символах цієї карти</h2><p>{note.learn}</p></section>
        <div className={styles.actions}><a className={styles.button} href="/uk/?experience=question">Принести своє запитання ↗</a><Link href="/uk/cards/">Усі 78 карт</Link></div>
        <section className={styles.group}><h2>Дослідіть інші карти</h2><ul className={styles.list}>{relatedCards(card).map(other => <li key={other.name}><Link className={styles.row} href={`/uk/cards/${cardSlug(other.name)}/`}><span className={styles.number}>{cardNumeral(other)}</span><span className={styles.cardName}>{TAROT_UK[other.name].name}</span><span className={styles.keywords}>{TAROT_UK[other.name].keywords.slice(0, 2).join(" · ")}</span><span aria-hidden>↗</span></Link></li>)}</ul></section>
      </div>
    </article>
  </UkrainianLibraryShell>;
}
