/** Link-preview tags for the learning and pair pages, in the page's own language, with a card image. */

import type { Metadata } from "next";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

export function shareMeta({ title, description, url, locale, cardId, alt, type = "article" }: {
  title: string;
  description: string;
  url: string;
  locale: "en" | "uk";
  cardId: number;
  alt: string;
  type?: "article" | "website";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const image = `https://oliviaarcana.com${getCardImagePath(ALL_CARDS[cardId])}`;
  return {
    openGraph: {
      title, description, url, type, siteName: "Olivia Arcana",
      locale: locale === "uk" ? "uk_UA" : "en_GB", alternateLocale: [locale === "uk" ? "en_GB" : "uk_UA"],
      images: [{ url: image, width: 896, height: 1536, alt }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
