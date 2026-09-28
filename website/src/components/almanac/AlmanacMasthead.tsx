"use client";

/**
 * The one masthead for every inner page (AlmanacShell and LegalShell):
 * wordmark, four destinations and the same ivory "Begin a reading" as the
 * reading experience. On phones it folds to about 120 px: wordmark and
 * button on one row, the links on one scrollable row beneath.
 */

import TransitionLink from "@/components/transitions/TransitionLink";
import { useLocale } from "@/lib/i18n/useLocale";
import { ACCOUNTS_ENABLED, PAYMENTS_ENABLED } from "@/lib/service-status";

// Nothing to buy until accounts and payments are both live.
const MEMBERSHIP_READY = ACCOUNTS_ENABLED && PAYMENTS_ENABLED;

const MAST = {
  en: {
    label: "Primary",
    nav: [
      { label: "My almanac", href: "/?experience=journal" },
      { label: "Spreads", href: "/?experience=spreads" },
      { label: "The cards", href: "/cards" },
      { label: "Learn", href: "/learn" },
      { label: "Astrology", href: "/astrology" },
      ...(MEMBERSHIP_READY ? [{ label: "Membership", href: "/pricing" }] : []),
      // Appears only once the account backend is back (build-time flag).
      ...(ACCOUNTS_ENABLED ? [{ label: "Account", href: "/profile/" }] : []),
    ],
    cta: "Begin a reading",
    ctaHref: "/?experience=question",
    home: "/",
    title: "A personal practice of tarot",
  },
  uk: {
    label: "Головна навігація",
    nav: [
      { label: "Мій альманах", href: "/uk/?experience=journal" },
      { label: "Розклади", href: "/uk/?experience=spreads" },
      { label: "Карти", href: "/uk/cards" },
      { label: "Навчання", href: "/uk/learn" },
      { label: "Астрологія", href: "/uk/astrology" },
      ...(MEMBERSHIP_READY ? [{ label: "Підписка", href: "/pricing" }] : []),
      ...(ACCOUNTS_ENABLED ? [{ label: "Кабінет", href: "/profile/" }] : []),
    ],
    cta: "Почати читання",
    ctaHref: "/uk/?experience=question",
    home: "/uk/",
    title: "Особиста практика таро",
  },
};

export default function AlmanacMasthead() {
  const { locale } = useLocale();
  const mast = locale === "uk" ? MAST.uk : MAST.en;
  return (
    <header className="alm-masthead">
      <div className="alm-rule" aria-hidden />
      <div className="alm-mast-row">
        <TransitionLink href={mast.home} className="alm-wordmark">
          Olivia <span>Arcana</span>
        </TransitionLink>
        <nav className="alm-mast-nav" aria-label={mast.label}>
          {mast.nav.map((item) => (
            <TransitionLink key={item.href} href={item.href} className="alm-mast-link">
              {item.label}
            </TransitionLink>
          ))}
        </nav>
        <TransitionLink href={mast.ctaHref} className="alm-mast-cta">
          {mast.cta}
        </TransitionLink>
      </div>
      {/* INK RISE — the mast title rises once through its line mask. */}
      <p className="alm-mast-title">
        <span className="oa-line">
          <span className="oa-line-in">{mast.title}</span>
        </span>
      </p>
      <div className="alm-rule oxford" aria-hidden />

      <style jsx global>{`
        .alm-masthead {
          padding: 1.1rem clamp(1.1rem, 4vw, 3rem) 0;
        }

        .alm-mast-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 0.85rem 0;
        }

        .alm-wordmark {
          font-family: var(--font-heading, "Cormorant Garamond"), serif;
          font-size: 2rem;
          font-weight: 400;
          color: var(--ink);
          text-decoration: none;
          white-space: nowrap;
        }

        .alm-wordmark span {
          margin-left: 0.55rem;
          font-family: var(--font-body, system-ui), sans-serif;
          font-size: 0.56rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
        }

        .alm-mast-nav {
          display: flex;
          align-items: center;
          gap: clamp(0.9rem, 2.5vw, 1.8rem);
          margin-left: auto;
        }

        .alm-mast-link {
          color: var(--ink-soft);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 200ms var(--ease);
        }

        .alm-mast-link:hover {
          color: var(--ox);
        }

        /* The same ivory primary as the reading experience's header. */
        .alm-mast-cta {
          align-self: center;
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          color: #183043;
          background: linear-gradient(155deg, #f2e5c8, #dccaab);
          border: 1px solid #ead9b8;
          border-radius: 14px;
          box-shadow: inset 0 1px 0 #fff4dc, 0 4px 13px rgba(2, 9, 20, 0.25);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-decoration: none;
          padding: 0.55rem 1.1rem;
          transition: translate 220ms var(--ease), box-shadow 220ms var(--ease), filter 220ms var(--ease);
          white-space: nowrap;
        }

        .alm-mast-cta:hover {
          translate: 0 -2px;
          filter: brightness(1.04);
          box-shadow: inset 0 1px 0 #fff4dc, 0 9px 25px rgba(2, 10, 23, 0.33);
        }

        .alm-mast-title {
          margin: 0 0 0.6rem;
          text-align: center;
          color: var(--ink-faint);
          font-family: var(--font-mono, ui-monospace), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.5em;
          text-transform: uppercase;
        }

        /* Page-open reveal. Hidden states only under no-preference, so
           reduced motion renders everything at once. */
        @media (prefers-reduced-motion: no-preference) {
          .alm-masthead .alm-rule {
            transform: scaleX(0);
            transform-origin: left center;
            animation: alm-mast-rule 800ms var(--ease-wipe, cubic-bezier(0.645, 0.045, 0.355, 1)) 60ms forwards;
          }
          .alm-masthead .alm-rule.oxford {
            animation-delay: 200ms;
          }
          .alm-mast-row {
            opacity: 0;
            animation: alm-mast-in 520ms var(--ease) 140ms forwards;
          }
          .alm-mast-title .oa-line-in {
            animation: alm-mast-rise var(--dur-reveal, 0.9s) var(--ease-engrave, cubic-bezier(0.625, 0.05, 0, 1)) 240ms both;
          }
        }
        @keyframes alm-mast-rule {
          to {
            transform: scaleX(1);
          }
        }
        @keyframes alm-mast-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes alm-mast-rise {
          from {
            transform: translateY(110%);
          }
          to {
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          /* Phones: wordmark and the reading button on one row, the four
             links on one scrollable row beneath — about 120 px in all. */
          .alm-masthead {
            padding-top: 0.4rem;
          }
          .alm-masthead > .alm-rule:first-child,
          .alm-mast-title {
            display: none;
          }
          .alm-mast-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            align-items: center;
            gap: 0.35rem 0.8rem;
            padding: 0.55rem 0 0.2rem;
          }
          .alm-wordmark {
            font-size: 1.7rem;
          }
          .alm-mast-cta {
            grid-column: 2;
            grid-row: 1;
            font-size: 0.8rem;
            padding: 0.5rem 0.9rem;
          }
          .alm-mast-nav {
            grid-column: 1 / -1;
            grid-row: 2;
            margin: 0 calc(-1 * clamp(1.1rem, 4vw, 3rem));
            padding: 0 clamp(1.1rem, 4vw, 3rem);
            gap: 1.3rem;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            /* A soft edge shows the row continues. */
            mask-image: linear-gradient(to right, #000 calc(100% - 2.2rem), transparent);
          }
          .alm-mast-nav::-webkit-scrollbar {
            display: none;
          }
          .alm-mast-nav .alm-mast-link {
            display: inline-flex;
            align-items: center;
            min-height: 44px;
            font-size: 0.7rem;
            white-space: nowrap;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .alm-mast-link,
          .alm-mast-cta {
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
