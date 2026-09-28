/**
 * 404 — one page serves every missing URL, English and Ukrainian alike,
 * so it speaks both languages. Next marks the response noindex.
 */

import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import TransitionLink from "@/components/transitions/TransitionLink";
import { socialImages, socialImageUrls } from "@/lib/social-images";

// No canonical or og:url: this page answers for whichever address was missing.
const title = "Page not found · Сторінку не знайдено | Olivia Arcana";
const description = "This page is not in the deck. Такої сторінки немає в колоді.";
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Olivia Arcana", locale: "en_GB", images: socialImages("en") },
  twitter: { card: "summary_large_image", title, description, images: socialImageUrls("en") },
};

const block = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  textAlign: "center" as const,
};

const actions = {
  display: "flex",
  flexWrap: "wrap" as const,
  alignItems: "center",
  justifyContent: "center",
  gap: "1.2rem 1.8rem",
};

export default function NotFound() {
  return (
    <AlmanacShell narrow>
      <div style={{ ...block, minHeight: "50vh", justifyContent: "center", gap: "3rem" }}>
        <div style={block}>
          <p className="alm-kicker" style={{ marginBottom: "0.9rem" }}>
            404
          </p>
          <h1 className="alm-h1" style={{ marginBottom: "1rem" }}>
            This page is not in the deck
          </h1>
          <p className="alm-lead" style={{ maxWidth: "40ch", margin: "0 0 2rem" }}>
            The link may be old, or the page has moved. You can begin a reading or look through all 78 cards.
          </p>
          <div style={actions}>
            <TransitionLink href="/" className="alm-btn">
              Begin a reading
            </TransitionLink>
            <TransitionLink href="/cards/" className="alm-link">
              All 78 cards
            </TransitionLink>
          </div>
        </div>
        <div style={block} lang="uk">
          <p className="alm-lead" style={{ maxWidth: "40ch", margin: "0 0 1.2rem" }}>
            Такої сторінки немає в колоді. Можливо, посилання застаріло або сторінку перенесли.
          </p>
          <div style={actions}>
            <TransitionLink href="/uk/" className="alm-link">
              Почати читання
            </TransitionLink>
            <TransitionLink href="/uk/cards/" className="alm-link">
              Усі 78 карт
            </TransitionLink>
          </div>
        </div>
      </div>
    </AlmanacShell>
  );
}
