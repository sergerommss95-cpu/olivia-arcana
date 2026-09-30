"use client";

/**
 * The one masthead for every inner page (AlmanacShell and LegalShell). It is
 * the homepage's own header carried inward, so moving between the reading
 * and the rest of the site changes nothing but the page: the same wordmark,
 * the same quiet sentence-case links in the same order, the language pill
 * and the ivory "Begin a reading". On phones it folds to about 120 px:
 * wordmark and button on one row, the links on one scrollable row beneath.
 */

import { usePathname } from "next/navigation";
import TransitionLink from "@/components/transitions/TransitionLink";
import { useLocale } from "@/lib/i18n/useLocale";
import { ACCOUNTS_ENABLED, PAYMENTS_ENABLED } from "@/lib/service-status";

// Nothing to buy until accounts and payments are both live.
const MEMBERSHIP_READY = ACCOUNTS_ENABLED && PAYMENTS_ENABLED;

// Inner pages that exist in Ukrainian too, so the language pill can keep the reader on the same page
const UK_ROUTES = ["/cards", "/learn", "/astrology", "/decks", "/ask"];

const MAST = {
  en: {
    label: "Main navigation",
    nav: [
      { label: "Today", href: "/?experience=today" },
      { label: "My almanac", href: "/?experience=journal" },
      { label: "Decks", href: "/decks/" },
      { label: "Spreads", href: "/?experience=spreads" },
      { label: "The cards", href: "/cards/" },
      { label: "Astrology", href: "/astrology/" },
      { label: "Learn", href: "/learn/" },
      ...(MEMBERSHIP_READY ? [{ label: "Membership", href: "/pricing/" }] : []),
      // Appears only once the account backend is back (build-time flag).
      ...(ACCOUNTS_ENABLED ? [{ label: "Account", href: "/profile/" }] : []),
    ],
    cta: "Begin a reading",
    ctaHref: "/?experience=question",
    home: "/",
    language: { label: "Українська", lang: "uk" },
  },
  uk: {
    label: "Головна навігація",
    nav: [
      { label: "Сьогодні", href: "/uk/?experience=today" },
      { label: "Мій альманах", href: "/uk/?experience=journal" },
      { label: "Колоди", href: "/uk/decks/" },
      { label: "Розклади", href: "/uk/?experience=spreads" },
      { label: "Карти", href: "/uk/cards/" },
      { label: "Астрологія", href: "/uk/astrology/" },
      { label: "Навчання", href: "/uk/learn/" },
      ...(MEMBERSHIP_READY ? [{ label: "Підписка", href: "/pricing/" }] : []),
      ...(ACCOUNTS_ENABLED ? [{ label: "Кабінет", href: "/profile/" }] : []),
    ],
    cta: "Почати читання",
    ctaHref: "/uk/?experience=question",
    home: "/uk/",
    language: { label: "English", lang: "en" },
  },
};

/** The same page in the other language where it exists; otherwise that language's home. */
function otherLanguage(path: string, uk: boolean): string {
  if (uk) return path.replace(/^\/uk(?=\/|$)/, "") || "/";
  return UK_ROUTES.some((route) => path === route || path.startsWith(route + "/")) ? `/uk${path}` : "/uk/";
}

type Props = {
  /** Fixes the language (pages that are Ukrainian by route); otherwise the reader's locale. */
  locale?: "en" | "uk";
  /** Where the language pill leads, when the other language's page has a different address. */
  languageHref?: string;
};

export default function AlmanacMasthead({ locale: fixed, languageHref }: Props = {}) {
  const { locale: preferred } = useLocale();
  const path = usePathname() ?? "/";
  const uk = (fixed ?? preferred) === "uk";
  const mast = uk ? MAST.uk : MAST.en;
  const here = (href: string) => !href.includes("?") && path.replace(/\/$/, "").startsWith(href.replace(/\/$/, "")) && href.replace(/\/$/, "") !== (uk ? "/uk" : "");
  return (
    <header className="alm-masthead">
      <div className="alm-mast-row">
        <TransitionLink href={mast.home} className="alm-wordmark">
          Olivia<span>Arcana</span>
        </TransitionLink>
        <nav className="alm-mast-nav" aria-label={mast.label}>
          <a className="alm-mast-language" href={languageHref ?? otherLanguage(path, uk)} lang={mast.language.lang} hrefLang={mast.language.lang}>{mast.language.label}</a>
          {mast.nav.map((item) => (
            <TransitionLink key={item.href} href={item.href} className="alm-mast-link" current={here(item.href)}>
              {item.label}
            </TransitionLink>
          ))}
        </nav>
        <TransitionLink href={mast.ctaHref} className="alm-mast-cta">
          {mast.cta} <span aria-hidden>↗</span>
        </TransitionLink>
      </div>

      <style jsx global>{`
        /* Values follow the homepage header (experience style.css and action-surfaces.css). */
        .alm-masthead {
          padding: 0 max(1.1rem, 5.3vw);
        }

        .alm-mast-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          min-height: 7.2rem;
        }

        .alm-wordmark {
          display: flex;
          align-items: baseline;
          gap: 0.65rem;
          font: 400 1.5rem/1 var(--font-heading, "Cormorant Garamond"), serif;
          letter-spacing: -0.04em;
          color: var(--ink, #eee6d4);
          text-decoration: none;
          white-space: nowrap;
        }

        .alm-wordmark span {
          font: 400 0.5rem/1 var(--font-body, "DM Sans"), sans-serif;
          letter-spacing: 0.25em;
          text-transform: uppercase;
        }

        .alm-mast-nav {
          display: flex;
          align-items: center;
          gap: clamp(2px, 0.6vw, 10px);
          margin-left: auto;
          font-size: 0.75rem;
        }

        html .alm-masthead :is(.alm-mast-link, .alm-mast-language),
        html .alm-masthead .alm-mast-link[data-olivia-edge] {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          padding: 10px 13px;
          border-radius: 24px;
          color: var(--ink, #eee6d4);
          font: 400 0.7rem/1.2 var(--font-body, "DM Sans"), sans-serif;
          letter-spacing: normal;
          text-transform: none;
          text-decoration-line: underline;
          text-decoration-color: #cfbc942e;
          text-decoration-thickness: 1px;
          text-underline-offset: 0.4em;
          white-space: nowrap;
          transition: color 0.25s, text-decoration-color 0.25s, background-color 0.2s;
        }

        html .alm-masthead .alm-mast-link[data-olivia-edge] > olivia-edge {
          border-radius: 24px;
        }

        .alm-masthead .alm-mast-language {
          margin-right: 4px;
          padding: 0.5rem 0.9rem;
          border: 1px solid var(--hairline, rgba(216, 196, 156, 0.29));
          font-size: 0.65rem;
          text-decoration: none;
        }

        .alm-masthead :is(.alm-mast-link, .alm-mast-language):hover {
          background: #c9d0c514;
          color: #fff2d6;
        }

        .alm-masthead .alm-mast-link[aria-current="page"] {
          color: #f1e3c8;
          text-decoration-color: #cfb785;
        }

        /* The same ivory primary as the reading experience's header (scoped, so page link colours never reach it). */
        .alm-masthead .alm-mast-cta {
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          min-height: 46px;
          color: #183043;
          background: linear-gradient(155deg, #f2e5c8, #dccaab);
          border: 1px solid #ead9b8;
          border-radius: 14px;
          box-shadow: inset 0 1px 0 #fff4dc, 0 4px 13px rgba(2, 9, 20, 0.25);
          font: 500 13px/1 var(--font-body, "DM Sans"), sans-serif;
          text-decoration: none;
          padding: 0.65rem 1.15rem;
          transition: translate 220ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 220ms cubic-bezier(0.2, 0.7, 0.2, 1), filter 220ms cubic-bezier(0.2, 0.7, 0.2, 1);
          white-space: nowrap;
        }

        .alm-mast-cta span {
          font-size: 1.05rem;
          transition: transform 0.35s;
        }

        .alm-mast-cta:hover {
          translate: 0 -2px;
          filter: brightness(1.04);
          box-shadow: inset 0 1px 0 #fff4dc, 0 9px 25px rgba(2, 10, 23, 0.33);
        }

        .alm-mast-cta:hover span {
          transform: translate(3px, -3px);
        }

        /* Pages inside the product fade in (BRAND.md, Motion). */
        @media (prefers-reduced-motion: no-preference) {
          .alm-mast-row {
            animation: alm-mast-in 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        }
        @keyframes alm-mast-in {
          from {
            opacity: 0;
          }
        }

        @media (max-width: 1180px) {
          .alm-mast-row {
            gap: 1.2rem;
            min-height: 6rem;
          }
          html .alm-masthead :is(.alm-mast-link, .alm-mast-language) {
            padding-inline: 9px;
          }
        }

        @media (max-width: 980px) {
          /* Tablets: wordmark and the reading button on one row, the links beneath. */
          .alm-mast-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 0.2rem 0.8rem;
            min-height: 0;
            padding: 0.9rem 0 0.3rem;
          }
          .alm-mast-cta {
            grid-column: 2;
            grid-row: 1;
          }
          .alm-mast-nav {
            grid-column: 1 / -1;
            grid-row: 2;
            margin: 0 calc(-1 * max(1.1rem, 5.3vw));
            padding: 0 max(1.1rem, 5.3vw);
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            /* A soft edge shows the row continues. */
            mask-image: linear-gradient(to right, #000 calc(100% - 2.2rem), transparent);
          }
          .alm-mast-nav::-webkit-scrollbar {
            display: none;
          }
          .alm-masthead .alm-mast-language {
            margin-left: -0.3rem;
          }
        }

        @media (max-width: 640px) {
          .alm-wordmark {
            font-size: 1.45rem;
          }
          .alm-wordmark span {
            display: none;
          }
          .alm-mast-cta {
            gap: 0.5rem;
            min-height: 44px;
            padding: 0.5rem 0.8rem;
            font-size: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .alm-mast-link,
          .alm-mast-language,
          .alm-mast-cta,
          .alm-mast-cta span {
            transition: none !important;
          }
        }

        @media print {
          .alm-masthead nav,
          .alm-mast-cta {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
