/**
 * /cards — the engraved ledger of all 78 tarot cards, grouped by suit.
 * Fully static; every row links to its card's meaning page.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import { socialImages, socialImageUrls } from "@/lib/social-images";
import {
  cardGroups,
  cardNumeral,
  cardSlug,
  getCardThumbPath,
} from "./card-pages";
import { leafBySlug } from "@/lib/academy/leaf";

const URL = "https://oliviaarcana.com/cards/";
const TITLE = "Tarot Card Meanings — All 78 Cards | Olivia Arcana";
const DESCRIPTION =
  "All 78 tarot cards, Major Arcana, Wands, Cups, Swords and Pentacles, read in depth: upright and reversed meanings, every symbol of the Olivia image, number and tradition, love, work and self, and each card in a spread.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "tarot card meanings",
    "all 78 tarot cards",
    "major arcana meanings",
    "minor arcana meanings",
    "tarot cards list",
    "upright and reversed tarot",
  ],
  alternates: { canonical: URL, languages: { en: URL, uk: "https://oliviaarcana.com/uk/cards/", "x-default": URL } },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    type: "article",
    locale: "en_US",
    alternateLocale: ["uk_UA"],
    siteName: "Olivia Arcana",
    images: socialImages("en"),
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: socialImageUrls("en") },
};

export default function CardsIndexPage() {
  const groups = cardGroups();

  return (
    <AlmanacShell narrow>
      <article className="cl-page">
        <nav aria-label="Breadcrumb" className="cl-crumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page">Cards</li>
          </ol>
        </nav>

        <header className="cl-hero">
          <p className="alm-kicker"><span>The Deck</span>· 78 Leaves</p>
          <h1 className="alm-h1">Tarot Card Meanings</h1>
          <p className="alm-lead cl-lead">
            Every card of the deck: twenty-two Major Arcana and the four suits
            of the Minor. Each leaf reads the card upright and reversed, walks
            through the symbols carved into its Olivia image, and follows it
            into love, work and self, into a spread, and beside other cards.
          </p>
        </header>

        {groups.map((group) => (
          <section key={group.title} className="cl-group">
            <div className="cl-group-head">
              <h2 className="alm-h2 cl-group-title">{group.title}</h2>
              <p className="alm-caption cl-group-note">{group.note}</p>
            </div>
            <ul className="cl-ledger">
              {group.cards.map((card) => (
                <li key={card.name}>
                  <Link href={`/cards/${cardSlug(card.name)}/`} className="cl-row">
                    {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static thumbnail */}
                    <img className="cl-thumb" src={getCardThumbPath(card)} width={120} height={206} alt="" loading="lazy" decoding="async" />
                    <span className="cl-no">{cardNumeral(card)}</span>
                    <span className="cl-name">{card.name}</span>
                    <span className="cl-keys">{leafBySlug(cardSlug(card.name))?.en.essence ?? card.keywords.slice(0, 3).join(" · ")}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="cl-cta">
          <a href="/?experience=question" className="alm-btn">Draw a card in a living reading</a>
          <a href="/academy/" className="alm-link">Study the deck in the Academy →</a>
        </div>
      </article>

      <style>{`
        .cl-crumb ol {
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
        .cl-crumb a {
          color: var(--ink-soft);
          text-decoration: none;
          transition: color 200ms var(--ease);
        }
        .cl-crumb a:hover { color: var(--ox); }
        .cl-crumb [aria-current] { color: var(--ox); }

        .cl-hero { margin-bottom: clamp(2.6rem, 6vw, 4rem); }
        .cl-lead { max-width: 38rem; margin: 1.2rem 0 0; }

        .cl-group { margin-top: clamp(2.6rem, 6vw, 3.8rem); }

        .cl-group-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
          padding-bottom: 0.7rem;
          border-bottom: 1px solid rgba(183, 188, 233, 0.34);
        }
        .cl-group-title { font-style: italic; }
        .cl-group-note { margin: 0; white-space: nowrap; }

        .cl-ledger {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .cl-row {
          display: grid;
          grid-template-columns: 2.6rem 3rem minmax(9rem, 0.8fr) 1.6fr;
          align-items: center;
          gap: 1rem;
          padding: 0.55rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          text-decoration: none;
          transition: background 200ms var(--ease);
        }
        .cl-row:hover { background: rgba(232, 233, 255, 0.04); }

        .cl-thumb {
          display: block;
          width: 2.6rem;
          height: auto;
          aspect-ratio: 120 / 206;
          border-radius: 3px;
          box-shadow: 0 6px 14px rgba(2, 8, 14, 0.45), 0 0 0 1px rgba(216, 196, 156, 0.18);
          background: #122a3f;
          transition: transform 260ms var(--ease);
        }
        .cl-row:hover .cl-thumb { transform: translateY(-2px) rotate(-1.5deg); }

        .cl-no {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          color: var(--ink-faint);
        }

        .cl-name {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-style: italic;
          font-size: 1.14rem;
          color: var(--ink);
          transition: color 200ms var(--ease);
        }
        .cl-row:hover .cl-name { color: var(--ox); }

        .cl-keys {
          font-size: 0.78rem;
          line-height: 1.5;
          color: var(--ink-faint);
          letter-spacing: 0.01em;
        }


        .cl-cta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem 1.6rem;
          margin-top: clamp(3rem, 7vw, 4.5rem);
        }

        @media (max-width: 640px) {
          .cl-keys { display: none; }
          .cl-row { grid-template-columns: 2.3rem 2.2rem 1fr; gap: 0.8rem; }
          .cl-thumb { width: 2.3rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-thumb { transition: none; }
          .cl-row:hover .cl-thumb { transform: none; }
        }
      `}</style>
    </AlmanacShell>
  );
}
