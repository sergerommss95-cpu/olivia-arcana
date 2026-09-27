/**
 * /compatibility/[pair] — sun-sign pair compatibility page.
 * All 144 ordered pairs render statically; the alphabetical order is
 * canonical and the reversed order points at it via metadata canonical.
 * Content is generated deterministically in lib/compatibility-pairs.ts
 * from element, modality, ruling planet, and sun-sign aspect.
 */

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { SIGNS, getAllPairSlugs, getPair, pairSlug, pairScore } from "@/lib/compatibility-pairs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPairSlugs().map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const data = getPair(pair);
  if (!data) return {};
  const title = `${data.a.name} and ${data.b.name} Compatibility — ${data.score}% | Olivia Arcana`;
  const canonicalUrl = `https://oliviaarcana.com/compatibility/${data.canonicalSlug}/`;
  return {
    title,
    description: data.metaDescription,
    keywords: [
      `${data.a.name} ${data.b.name} compatibility`,
      `${data.a.name} and ${data.b.name}`,
      `${data.a.name} ${data.b.name} love`,
      `${data.a.name} ${data.b.name} relationship`,
      "zodiac compatibility",
      "sun sign compatibility",
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: data.metaDescription,
      url: canonicalUrl,
      type: "article",
      siteName: "Olivia Arcana",
    },
    twitter: {
      card: "summary",
      title,
      description: data.metaDescription,
    },
  };
}

const SECTIONS: { no: string; title: string; key: "overall" | "love" | "friction" | "work" }[] = [
  { no: "1", title: "Overall Dynamic", key: "overall" },
  { no: "2", title: "Love", key: "love" },
  { no: "3", title: "Friction Points", key: "friction" },
  { no: "4", title: "How to Make It Work", key: "work" },
];

export default async function CompatibilityPairPage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const data = getPair(pair);
  if (!data) return notFound();
  const { a, b, score, aspect, sections, faq } = data;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const facts: { l: string; v: string }[] = [
    { l: "Elements", v: `${a.element} × ${b.element}` },
    { l: "Modalities", v: `${a.modality} × ${b.modality}` },
    { l: "Rulers", v: `${a.rulerGlyph} ${a.ruler} × ${b.rulerGlyph} ${b.ruler}` },
    { l: "Sun aspect", v: `${aspect.name} · ${aspect.angle}°` },
  ];

  return (
    <AlmanacShell narrow>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <article className="cpair">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="cpair-crumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href="/compatibility/">Compatibility</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page">{a.name} &amp; {b.name}</li>
          </ol>
        </nav>

        {/* Engraved plate hero — both glyphs, the score between them */}
        <header className="cpair-hero">
          <p className="alm-kicker">
            <span>Concordance</span>· {aspect.name} · {aspect.angle}°
          </p>
          <div className="cpair-plate">
            <span className="cpair-glyph" aria-hidden>{a.glyph + "︎"}</span>
            <span className="cpair-score">
              <span className="cpair-score-n">{score}</span>
              <span className="cpair-score-pct">%</span>
            </span>
            <span className="cpair-glyph" aria-hidden>{b.glyph + "︎"}</span>
          </div>
          <h1 className="alm-h1 cpair-title">
            {a.name} <span className="cpair-amp">&amp;</span> {b.name}
          </h1>

          <dl className="cpair-facts">
            {facts.map(({ l, v }) => (
              <React.Fragment key={l}>
                <dt>{l}</dt>
                <dd>{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </header>

        {/* The reading */}
        {SECTIONS.map(({ no, title, key }) => (
          <section key={key} className="cpair-section">
            <h2 className="alm-h2 cpair-h2">
              <span className="cpair-h2-no" aria-hidden>§ {no}.</span>
              {title}
            </h2>
            <p className="cpair-prose">{sections[key]}</p>
          </section>
        ))}

        {/* Differentiator CTA — the live synastry engine */}
        <aside className="cpair-cta alm-card">
          <p className="alm-kicker"><span>Go deeper</span>· Two full charts</p>
          <p className="cpair-cta-line">
            This is the sky&apos;s general word on {a.name} and {b.name}. Your two charts say more —
            compare them properly.
          </p>
          <Link href="/synastry/" className="alm-btn">
            Run the Synastry Reading
          </Link>
        </aside>

        {/* Common questions — the FAQPage JSON-LD mirrors this section */}
        <section className="cpair-section">
          <h2 className="alm-h2 cpair-h2">
            <span className="cpair-h2-no" aria-hidden>§ 5.</span>
            Common Questions
          </h2>
          {faq.map((f) => (
            <div key={f.q} className="cpair-faq">
              <h3 className="cpair-faq-q">{f.q}</h3>
              <p className="cpair-prose">{f.a}</p>
            </div>
          ))}
        </section>

        {/* Cross-links: the rest of A's matches */}
        <section className="cpair-section">
          <p className="alm-caption cpair-more-label">Other {a.name} pairings</p>
          <ul className="cpair-more">
            {SIGNS.filter((s) => s.slug !== b.slug).map((s) => (
              <li key={s.slug}>
                <Link href={`/compatibility/${pairSlug(a.slug, s.slug)}/`} className="cpair-more-link">
                  <span aria-hidden>{s.glyph + "︎"}</span> {a.name} &amp; {s.name} · {pairScore(a, s)}%
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <style>{`
        .cpair-crumb ol {
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

        .cpair-crumb a {
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .cpair-crumb a:hover {
          color: var(--ox);
        }

        .cpair-crumb [aria-current] {
          color: var(--ox);
        }

        .cpair-hero {
          text-align: center;
          margin-bottom: clamp(2.6rem, 6vw, 4rem);
        }

        .cpair-plate {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(1.4rem, 5vw, 2.6rem);
          margin: 1.8rem auto 0;
          padding: clamp(1.4rem, 4vw, 2.2rem) clamp(1rem, 5vw, 3rem);
          max-width: 30rem;
          border: 1px solid var(--hairline);
          outline: 1px solid var(--hairline);
          outline-offset: 4px;
        }

        .cpair-glyph {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(2.6rem, 8vw, 4rem);
          line-height: 1;
          color: var(--ink-soft);
        }

        .cpair-score {
          display: flex;
          align-items: baseline;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          color: var(--ox);
        }

        .cpair-score-n {
          font-size: clamp(3rem, 9vw, 4.6rem);
          line-height: 1;
          font-variant-numeric: lining-nums;
        }

        .cpair-score-pct {
          font-size: clamp(1.1rem, 3vw, 1.5rem);
          margin-left: 0.15em;
        }

        .cpair-title {
          margin-top: 1.6rem;
          font-size: clamp(2.2rem, 6vw, 3.6rem);
          font-style: italic;
          line-height: 1.05;
          letter-spacing: -0.02em;
        }

        .cpair-amp {
          color: var(--ink-faint);
          font-weight: 400;
        }

        .cpair-facts {
          display: grid;
          grid-template-columns: max-content 1fr;
          column-gap: 1.4rem;
          margin: 2rem auto 0;
          max-width: 26rem;
          text-align: left;
          border-top: 1px solid var(--hairline);
        }

        .cpair-facts dt {
          align-self: baseline;
          padding: 0.7rem 0 0.55rem;
          border-bottom: 1px solid var(--hairline);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .cpair-facts dd {
          margin: 0;
          padding: 0.45rem 0 0.55rem;
          border-bottom: 1px solid var(--hairline);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.08rem;
          color: var(--ink);
        }

        .cpair-section {
          margin-top: clamp(2.4rem, 5vw, 3.4rem);
        }

        .cpair-h2 {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .cpair-h2-no {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          font-style: normal;
          letter-spacing: 0.2em;
          color: var(--ox);
          white-space: nowrap;
        }

        .cpair-prose {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .cpair-cta {
          margin-top: clamp(2.6rem, 6vw, 3.8rem);
          text-align: center;
        }

        .cpair-cta .alm-kicker {
          justify-content: center;
        }

        .cpair-cta-line {
          margin: 1rem auto 1.4rem;
          max-width: 34rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.15rem, 2.2vw, 1.4rem);
          line-height: 1.45;
          color: var(--ink);
        }

        .cpair-faq {
          margin-top: 1.4rem;
        }

        .cpair-faq-q {
          margin: 0 0 0.4rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--ink);
        }

        .cpair-more-label {
          margin: 0 0 0.8rem;
        }

        .cpair-more {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0;
          padding: 0;
        }

        .cpair-more-link {
          display: inline-block;
          padding: 0.38rem 0.9rem;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          background: #0f1240;
          font-size: 0.78rem;
          color: var(--ink-soft);
          text-decoration: none;
          letter-spacing: 0.02em;
          font-variant-numeric: lining-nums tabular-nums;
          transition: color 200ms var(--ease), border-color 200ms var(--ease);
        }

        .cpair-more-link:hover,
        .cpair-more-link:focus-visible {
          color: var(--ox);
          border-color: var(--ox);
        }

        @media (prefers-reduced-motion: reduce) {
          .cpair-crumb a,
          .cpair-more-link {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
