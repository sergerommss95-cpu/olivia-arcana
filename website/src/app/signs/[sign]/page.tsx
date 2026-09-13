/**
 * /signs/[sign] — Individual zodiac sign detail page
 * Rich SEO content per sign, set as an almanac plate: numbered sections,
 * a facts table with hairlines, the glyph as a paper watermark.
 */

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SIGN_PAGES } from "../../../lib/sign-data";
import ShareSignButton from "../../../components/ShareSignButton";
import AlmanacShell from "@/components/almanac/AlmanacShell";

// Element decoration for the share card. Kept here (not in sign-data) so the
// data file stays purely textual.
const ELEMENT_EMOJI: Record<string, string> = {
  Fire: "🔥",
  Earth: "🌿",
  Air: "💨",
  Water: "💧",
};
const ELEMENT_COLOR: Record<string, string> = {
  Fire: "#E8524A",
  Earth: "#9CB37A",
  Air: "#C9C0E0",
  Water: "#4FC3F7",
};

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// Generate static params for all 12 signs
export function generateStaticParams() {
  return Object.keys(SIGN_PAGES).map(sign => ({ sign }));
}

export async function generateMetadata({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const data = SIGN_PAGES[sign?.toLowerCase()];
  if (!data) return {};
  const url = `https://oliviaarcana.com/signs/${sign.toLowerCase()}/`;
  const title = `${data.name} ${data.glyph} — Zodiac Sign Guide | Olivia Arcana`;
  const description = data.description.slice(0, 155) + "…";
  return {
    title,
    description,
    keywords: [
      `${data.name} zodiac`,
      `${data.name} sign`,
      `${data.name} astrology`,
      `${data.name} ${data.element}`,
      `${data.name} ${data.modality}`,
      `${data.name} traits`,
      `${data.name} compatibility`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Olivia Arcana",
      images: [
        {
          // Per-sign social card, rendered as an engraved almanac plate at
          // public/og/signs/<sign>.png (1200x630).
          url: `https://oliviaarcana.com/og/signs/${sign.toLowerCase()}.png`,
          secureUrl: `https://oliviaarcana.com/og/signs/${sign.toLowerCase()}.png`,
          width: 1200,
          height: 630,
          alt: `${data.name} ${data.glyph} — ${data.motto}. ${data.element} ${data.modality} sign ruled by ${data.ruler}.`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`https://oliviaarcana.com/og/signs/${sign.toLowerCase()}.png`],
    },
  };
}

function Section({ no, title, children }: { no: string; title: string; children: React.ReactNode }) {
  return (
    <section className="sign-section">
      <h2 className="alm-h2 sign-h2">
        <span className="sign-h2-no" aria-hidden>
          § {no}.
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <ul className="sign-tags">
      {items.map(item => (
        <li key={item} className="sign-tag">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function SignDetailPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const key = sign?.toLowerCase();
  const data = SIGN_PAGES[key];
  if (!data) return notFound();
  const numeral = ROMAN[Object.keys(SIGN_PAGES).indexOf(key)] ?? "";

  // ── Facts rendered as a ruled almanac table ──
  const facts: { l: string; v: string }[] = [
    { l: "Element", v: data.element },
    { l: "Modality", v: data.modality },
    { l: "Ruler", v: `${data.rulerGlyph} ${data.ruler}` },
    { l: "Season", v: data.season },
    { l: "Tarot", v: data.tarotCard },
    { l: "Crystal", v: data.crystal },
  ];

  return (
    <AlmanacShell narrow>
      <article className="sign-page">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="sign-crumb">
          <ol>
            <li>
              <Link href="/">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/signs">Signs</Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{data.name}</li>
          </ol>
        </nav>

        {/* Plate hero — glyph as paper watermark */}
        <header className="sign-hero">
          <span aria-hidden className="sign-watermark">
            {`${data.glyph}\uFE0E`}
          </span>

          <p className="alm-kicker">
            <span>Plate {numeral}</span>· {data.dateRange}
          </p>

          <h1 className="alm-h1 sign-title">{data.name}</h1>

          <p className="sign-motto">{data.motto}</p>

          <dl className="sign-facts">
            {facts.map(({ l, v }) => (
              <React.Fragment key={l}>
                <dt>{l}</dt>
                <dd>{v}</dd>
              </React.Fragment>
            ))}
          </dl>

          {/* Share — surfaces ShareCardModal (square / story / twitter card) */}
          <div className="sign-share">
            <ShareSignButton
              signName={data.name}
              signGlyph={data.glyph}
              element={data.element}
              elementEmoji={ELEMENT_EMOJI[data.element] || "✦"}
              dateRange={data.dateRange}
              traits={data.lightTraits.slice(0, 4)}
              horoscope={data.description}
              luckyColor={data.crystal}
              luckyColorHex={ELEMENT_COLOR[data.element] || "#e0b768"}
            />
          </div>
        </header>

        {/* Description */}
        <Section no="1" title="Overview">
          <p className="sign-prose">{data.description}</p>
        </Section>

        <Section no="2" title={`${data.element} Element`}>
          <p className="sign-prose">{data.elementAnalysis}</p>
        </Section>

        <Section no="3" title={`Ruling Planet: ${data.ruler} ${data.rulerGlyph}`}>
          <p className="sign-prose">{data.rulerDeepDive}</p>
        </Section>

        {/* Light & Shadow */}
        <div className="sign-traits">
          <div className="alm-card">
            <p className="alm-caption sign-trait-label">Light Traits</p>
            {data.lightTraits.map((t, i) => (
              <p key={i} className="sign-trait">
                {t}
              </p>
            ))}
          </div>
          <div className="alm-card">
            <p className="alm-caption sign-trait-label is-shadow">Shadow Traits</p>
            {data.shadowTraits.map((t, i) => (
              <p key={i} className="sign-trait">
                {t}
              </p>
            ))}
          </div>
        </div>

        <Section no="4" title="Best Careers">
          <TagList items={data.bestCareers} />
        </Section>

        <Section no="5" title="Compatibility">
          <p className="alm-caption sign-compat-label">Best Matches</p>
          <TagList items={data.compatBest} />
          <p className="alm-caption sign-compat-label">Growth Pairings</p>
          <TagList items={data.compatChallenge} />
        </Section>

        <Section no="6" title={`Famous ${data.name} People`}>
          <TagList items={data.famousPeople} />
        </Section>

        {/* CTAs */}
        <div className="sign-ctas">
          <a href="/portrait" className="alm-btn">
            Get Your {data.name} Portrait
          </a>
          <a href="/daily" className="alm-link">
            Daily {data.name} Reading →
          </a>
        </div>
      </article>

      <style>{`
        .sign-crumb ol {
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

        .sign-crumb a {
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .sign-crumb a:hover {
          color: var(--ox);
        }

        .sign-crumb [aria-current] {
          color: var(--ox);
        }

        .sign-hero {
          position: relative;
          isolation: isolate;
          margin-bottom: clamp(2.6rem, 6vw, 4rem);
        }

        .sign-watermark {
          position: absolute;
          top: -2.5rem;
          right: -1rem;
          z-index: -1;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: clamp(11rem, 30vw, 19rem);
          line-height: 1;
          color: rgba(232, 233, 255, 0.06);
          user-select: none;
          pointer-events: none;
        }

        .sign-title {
          font-size: clamp(3rem, 8vw, 5.2rem);
          font-style: italic;
          line-height: 0.95;
          letter-spacing: -0.02em;
        }

        .sign-motto {
          margin: 1.4rem 0 0;
          max-width: 34rem;
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: clamp(1.25rem, 2.2vw, 1.55rem);
          line-height: 1.4;
          color: var(--ink-soft);
          padding-left: 1.2rem;
          border-left: 2px solid var(--ox);
        }

        .sign-facts {
          display: grid;
          grid-template-columns: max-content 1fr;
          column-gap: 1.4rem;
          margin: 2rem 0 0;
          max-width: 32rem;
          border-top: 1px solid var(--hairline);
        }

        .sign-facts dt {
          align-self: baseline;
          padding: 0.7rem 0 0.55rem;
          border-bottom: 1px solid var(--hairline);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.6rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-faint);
        }

        .sign-facts dd {
          margin: 0;
          padding: 0.45rem 0 0.55rem;
          border-bottom: 1px solid var(--hairline);
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.12rem;
          color: var(--ink);
        }

        .sign-share {
          margin-top: 2rem;
        }

        /* ShareSignButton carries the share-card logic; only its coat
           changes — inline gold-on-dark repainted to almanac ink. */
        .sign-share button {
          background: var(--ink) !important;
          border-color: var(--ink) !important;
          color: #f6f1e5 !important;
        }

        .sign-section {
          margin-top: clamp(2.4rem, 5vw, 3.4rem);
        }

        .sign-h2 {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
          font-style: italic;
          margin-bottom: 1rem;
        }

        .sign-h2-no {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.66rem;
          font-style: normal;
          letter-spacing: 0.2em;
          color: var(--ox);
          white-space: nowrap;
        }

        .sign-prose {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.98rem;
          line-height: 1.75;
        }

        .sign-traits {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.1rem;
          margin-top: clamp(2.4rem, 5vw, 3.4rem);
        }

        .sign-trait-label {
          margin: 0 0 0.9rem;
        }

        .sign-trait-label.is-shadow {
          color: var(--ox);
        }

        .sign-trait {
          position: relative;
          margin: 0;
          padding: 0.28rem 0 0.28rem 1.1rem;
          font-size: 0.9rem;
          line-height: 1.65;
          color: var(--ink-soft);
        }

        .sign-trait::before {
          content: "✦";
          position: absolute;
          left: 0;
          top: 0.55em;
          font-size: 0.5rem;
          color: var(--ink-faint);
        }

        .sign-tags {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 0;
          padding: 0;
        }

        .sign-tag {
          padding: 0.38rem 0.9rem;
          border: 1px solid var(--hairline);
          border-radius: 999px;
          background: #0f1240;
          font-size: 0.78rem;
          color: var(--ink-soft);
          letter-spacing: 0.02em;
        }

        .sign-compat-label {
          margin: 1.2rem 0 0.55rem;
        }

        .sign-compat-label:first-of-type {
          margin-top: 0;
        }

        .sign-ctas {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem 1.6rem;
          margin-top: clamp(2.8rem, 6vw, 4rem);
        }

        @media (max-width: 640px) {
          .sign-traits {
            grid-template-columns: 1fr;
          }

          .sign-watermark {
            top: -1.5rem;
            right: -0.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sign-crumb a {
            transition: none;
          }
        }
      `}</style>
    </AlmanacShell>
  );
}
