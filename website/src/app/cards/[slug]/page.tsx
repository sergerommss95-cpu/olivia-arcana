/**
 * /cards/[slug] — one leaf per tarot card: upright, reversed, love,
 * career, yes-or-no and advice, set as an engraved almanac plate.
 * Fully static: all 78 slugs come from generateStaticParams.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import CardLeaf from "@/components/academy/CardLeaf";
import { leafBySlug } from "@/lib/academy/leaf";
import {
  CARD_SLUGS,
  cardNumeral,
  cardSlug,
  careerMeaning,
  courseFor,
  getCardBySlug,
  getCardImagePath,
  loveMeaning,
  relatedCards,
  yesNoProse,
  yesNoVerdict,
} from "../card-pages";

export function generateStaticParams() {
  return CARD_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) return {};
  const url = `https://oliviaarcana.com/cards/${slug}/`;
  const leaf = leafBySlug(slug);
  const title = leaf
    ? `${card.name} Tarot Card Meaning: Upright, Reversed & Symbols | Olivia Arcana`
    : `${card.name} Tarot Card Meaning: Upright & Reversed | Olivia Arcana`;
  const description = leaf ? clip(leaf.en.essence + " " + leaf.en.upright[0], 158) : card.upright.slice(0, 155) + "…";
  const image = `https://oliviaarcana.com${getCardImagePath(card)}`;
  return {
    title,
    description,
    keywords: [
      `${card.name} tarot`,
      `${card.name} meaning`,
      `${card.name} reversed`,
      `${card.name} love`,
      `${card.name} yes or no`,
      ...card.keywords,
    ],
    alternates: { canonical: url, languages: { en: url, uk: `https://oliviaarcana.com/uk/cards/${slug}/`, "x-default": url } },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "en_US",
      alternateLocale: ["uk_UA"],
      siteName: "Olivia Arcana",
      images: [
        {
          url: image,
          secureUrl: image,
          width: 896,
          height: 1536,
          alt: `${card.name} — tarot card from the Olivia Arcana deck`,
          type: "image/webp",
        },
      ],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

function Section({
  no,
  title,
  children,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cd-section">
      <h2 className="alm-h2 cd-h2">
        <span className="cd-h2-no" aria-hidden>§ {no}.</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) return notFound();

  const url = `https://oliviaarcana.com/cards/${slug}/`;
  const image = `https://oliviaarcana.com${getCardImagePath(card)}`;
  const leaf = leafBySlug(slug);
  if (leaf) {
    const leafLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Article",
          headline: `${card.name} Tarot Card Meaning: Upright, Reversed & Symbols`,
          description: leaf.en.essence,
          image,
          inLanguage: "en",
          author: { "@type": "Organization", name: "Olivia Arcana", url: "https://oliviaarcana.com/" },
          publisher: { "@type": "Organization", name: "Olivia Arcana" },
          mainEntityOfPage: url,
        },
        {
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: `What does ${card.name} mean?`, acceptedAnswer: { "@type": "Answer", text: leaf.en.upright.join(" ") } },
            { "@type": "Question", name: `What does ${card.name} reversed mean?`, acceptedAnswer: { "@type": "Answer", text: leaf.en.reversed.join(" ") } },
            { "@type": "Question", name: `What are the symbols on ${card.name}?`, acceptedAnswer: { "@type": "Answer", text: leaf.symbols.map((s) => `${s.en.name}: ${s.en.meaning}`).join(" ") } },
          ],
        },
      ],
    };
    return (
      <AlmanacShell>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(leafLd).replace(/</g, "\\u003c") }} />
        <CardLeaf leaf={leaf} locale="en" />
      </AlmanacShell>
    );
  }
  const love = loveMeaning(card);
  const career = careerMeaning(card);
  const yesNo = yesNoProse(card);
  const related = relatedCards(card);
  const course = courseFor(card);
  const arcanaLabel =
    card.arcana === "major"
      ? `Major Arcana · ${cardNumeral(card)}`
      : `Minor Arcana · ${card.suit![0].toUpperCase()}${card.suit!.slice(1)}`;

  const facts: { l: string; v: string }[] = [
    { l: "Arcana", v: arcanaLabel },
    { l: "Element", v: card.element },
    { l: "Astrology", v: card.astrology },
    { l: "Yes or No", v: yesNoVerdict(card) },
  ];

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${card.name} Tarot Card Meaning: Upright & Reversed`,
    description: card.upright.slice(0, 200),
    image,
    author: { "@type": "Organization", name: "Olivia Arcana", url: "https://oliviaarcana.com/" },
    publisher: { "@type": "Organization", name: "Olivia Arcana" },
    mainEntityOfPage: url,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Is ${card.name} a yes or no card?`,
        acceptedAnswer: { "@type": "Answer", text: yesNo },
      },
      {
        "@type": "Question",
        name: `What does ${card.name} reversed mean?`,
        acceptedAnswer: { "@type": "Answer", text: card.reversed },
      },
    ],
  };

  return (
    <AlmanacShell narrow>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <article className="cd-page">
        <nav aria-label="Breadcrumb" className="cd-crumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/cards/">Cards</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page">{card.name}</li>
          </ol>
        </nav>

        <header className="cd-hero">
          <figure className="cd-plate">
            <Image
              src={getCardImagePath(card)}
              alt={`${card.name} tarot card — Olivia Arcana deck`}
              width={896}
              height={1536}
              priority
              className="cd-art"
            />
            <figcaption className="alm-caption cd-plate-caption">
              {cardNumeral(card)} · {card.name}
            </figcaption>
          </figure>

          <div className="cd-hero-text">
            <p className="alm-kicker"><span>{arcanaLabel}</span></p>
            <h1 className="alm-h1 cd-title">{card.name} — Tarot Card Meaning</h1>

            <ul className="cd-keywords">
              {card.keywords.map((kw) => (
                <li key={kw} className="cd-keyword">{kw}</li>
              ))}
            </ul>

            <dl className="cd-facts">
              {facts.map(({ l, v }) => (
                <div key={l} className="cd-fact">
                  <dt>{l}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <Section no="1" title={`${card.name} Upright`}>
          <p className="cd-prose">{card.upright}</p>
        </Section>

        <Section no="2" title={`${card.name} Reversed`}>
          <p className="cd-prose">{card.reversed}</p>
        </Section>

        <Section no="3" title={`${card.name} in Love`}>
          <p className="cd-prose">{love}</p>
        </Section>

        <Section no="4" title={`${card.name} in Career & Money`}>
          <p className="cd-prose">{career}</p>
        </Section>

        <Section no="5" title={`${card.name}: Yes or No?`}>
          <p className="cd-prose">{yesNo}</p>
        </Section>

        <Section no="6" title="The Card's Advice">
          <blockquote className="cd-advice">
            <p>{card.advice}</p>
          </blockquote>
        </Section>

        <div className="cd-cta alm-card">
          <p className="alm-caption cd-cta-label">A Living Reading</p>
          <p className="cd-cta-line">
            The printed meaning is the map; the drawn card is the territory.
            Ask the Oracle and see where {card.name} falls for you.
          </p>
          <a href="/?experience=question" className="alm-btn">Begin a tarot reading</a>
        </div>

        <section className="cd-related">
          <h2 className="alm-h2 cd-h2">
            <span className="cd-h2-no" aria-hidden>§ 7.</span>
            Neighboring Leaves
          </h2>
          <ul className="cd-related-list">
            {related.map((rc) => (
              <li key={rc.name}>
                <Link href={`/cards/${cardSlug(rc.name)}/`} className="cd-related-link">
                  <span className="cd-related-no">{cardNumeral(rc)}</span>
                  <span className="cd-related-name">{rc.name}</span>
                  <span className="cd-related-kw">{rc.keywords.slice(0, 2).join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="cd-course-line">
            Study the {card.arcana === "major" ? "Major Arcana" : "Minor Arcana"} in
            full: <Link href={course.href} className="alm-link">{course.title} →</Link>
          </p>
        </section>
      </article>

      <style>{`
        .cd-crumb ol {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 2.2rem;
          padding: 0;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }
        .cd-crumb a {
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 200ms var(--ease);
        }
        .cd-crumb a:hover { color: var(--ox); }
        .cd-crumb [aria-current] { color: var(--ox); }

        .cd-hero {
          display: grid;
          grid-template-columns: minmax(0, 15rem) 1fr;
          gap: clamp(1.6rem, 4vw, 2.8rem);
          align-items: start;
          margin-bottom: clamp(2.6rem, 6vw, 4rem);
        }

        .cd-plate { margin: 0; }

        .cd-art {
          display: block;
          width: 100%;
          height: auto;
          border-radius: 10px;
          border: 1px solid var(--hairline);
          box-shadow: 0 1rem 2.4rem rgba(10, 13, 56, 0.5);
        }

        .cd-plate-caption {
          margin-top: 0.7rem;
          text-align: center;
        }

        .cd-title {
          font-size: clamp(2rem, 4.6vw, 3rem);
          font-style: italic;
        }

        .cd-keywords {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 1.3rem 0 0;
          padding: 0;
        }

        .cd-keyword {
          padding: 0.34rem 0.85rem;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          font-size: 0.76rem;
          color: var(--ink-soft);
          letter-spacing: 0.02em;
        }

        .cd-facts {
          margin: 1.8rem 0 0;
          border-top: 1px solid var(--hairline);
        }

        .cd-fact {
          display: grid;
          grid-template-columns: 7rem 1fr;
          column-gap: 1.2rem;
          border-bottom: 1px solid var(--hairline);
        }

        .cd-fact dt {
          align-self: baseline;
          padding: 0.62rem 0 0.5rem;
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .cd-fact dd {
          margin: 0;
          padding: 0.42rem 0 0.5rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.08rem;
          color: var(--ink);
        }

        .cd-section { margin-top: clamp(2.4rem, 5vw, 3.4rem); }

        .cd-h2 {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .cd-h2-no {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          font-style: normal;
          letter-spacing: 0.2em;
          color: var(--ox);
          white-space: nowrap;
        }

        .cd-prose {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .cd-advice {
          margin: 0;
          padding-left: 1.2rem;
          border-left: 2px solid var(--ox);
        }

        .cd-advice p {
          margin: 0;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.2rem, 2.2vw, 1.45rem);
          line-height: 1.45;
          color: var(--ink);
        }

        .cd-cta {
          margin-top: clamp(2.8rem, 6vw, 4rem);
          text-align: center;
        }

        .cd-cta-label { margin: 0 0 0.8rem; }

        .cd-cta-line {
          margin: 0 auto 1.4rem;
          max-width: 30rem;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.7;
        }

        .cd-related { margin-top: clamp(2.8rem, 6vw, 4rem); }

        .cd-related-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border-top: 1px solid var(--hairline);
        }

        .cd-related-link {
          display: grid;
          grid-template-columns: 3rem 1fr auto;
          align-items: baseline;
          gap: 1rem;
          padding: 0.62rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          text-decoration: none;
          transition: background 200ms var(--ease);
        }
        .cd-related-link:hover { background: rgba(232, 233, 255, 0.04); }

        .cd-related-no {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          color: var(--ink-faint);
        }

        .cd-related-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.1rem;
          color: var(--ink);
          transition: color 200ms var(--ease);
        }
        .cd-related-link:hover .cd-related-name { color: var(--ox); }

        .cd-related-kw {
          font-size: 0.74rem;
          color: var(--ink-faint);
          text-align: right;
        }

        .cd-course-line {
          margin: 1.6rem 0 0;
          color: var(--ink-soft);
          font-size: 0.95rem;
        }

        @media (max-width: 640px) {
          .cd-hero { grid-template-columns: 1fr; }
          .cd-plate { max-width: 14rem; margin: 0 auto; }
          .cd-related-kw { display: none; }
          .cd-related-link { grid-template-columns: 2.4rem 1fr; }
        }
      `}</style>
    </AlmanacShell>
  );
}
