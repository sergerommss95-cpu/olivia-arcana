/**
 * /cards — the engraved ledger of all 78 tarot cards, grouped by suit.
 * Fully static; every row links to its card's meaning page.
 */

import type { Metadata } from "next";
import Link from "next/link";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import {
  cardGroups,
  cardNumeral,
  cardSlug,
  yesNoVerdict,
} from "./card-pages";

const URL = "https://oliviaarcana.com/cards/";
const TITLE = "Tarot Card Meanings — All 78 Cards | Olivia Arcana";
const DESCRIPTION =
  "The complete ledger of all 78 tarot cards: Major Arcana, Wands, Cups, Swords and Pentacles. Upright and reversed meanings, love and career readings, yes-or-no verdicts, and Golden Dawn correspondences for every card.";

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
  },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
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
            Every card of the deck, entered in the ledger: twenty-two Major
            Arcana and the four suits of the Minor. Each leaf carries the
            card&rsquo;s upright and reversed reading, its counsel for love and
            work, its yes-or-no verdict, and the correspondence assigned to it
            by the Golden Dawn.
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
                    <span className="cl-no">{cardNumeral(card)}</span>
                    <span className="cl-name">{card.name}</span>
                    <span className="cl-keys">{card.keywords.slice(0, 3).join(" · ")}</span>
                    <span className={`cl-verdict is-${card.yesNo}`}>{yesNoVerdict(card)}</span>
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
          grid-template-columns: 3rem 1fr auto max-content;
          align-items: baseline;
          gap: 1rem;
          padding: 0.62rem 0.2rem;
          border-bottom: 1px solid var(--hairline);
          text-decoration: none;
          transition: background 200ms var(--ease);
        }
        .cl-row:hover { background: rgba(232, 233, 255, 0.04); }

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
          font-size: 0.74rem;
          color: var(--ink-faint);
          letter-spacing: 0.02em;
          text-align: right;
        }

        .cl-verdict {
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.58rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--ink-faint);
          border: 1px solid var(--hairline);
          border-radius: 999px;
          padding: 0.16rem 0.55rem;
        }
        .cl-verdict.is-yes { color: var(--ox); border-color: rgba(224, 183, 104, 0.35); }

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
          .cl-row { grid-template-columns: 2.4rem 1fr max-content; }
        }
      `}</style>
    </AlmanacShell>
  );
}
