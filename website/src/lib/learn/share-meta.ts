/** Link-preview tags in the page's own language: a card from the deck, a page's own image, or the site preview. */

import type { Metadata } from "next";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";
import { SOCIAL_IMAGES } from "@/lib/social-images";

type ShareImage = { url: string; width: number; height: number; alt: string; type?: string };

export function shareMeta({ title, description, url, locale, cardId, alt, image, translated = true, type = "article" }: {
  title: string;
  description: string;
  url: string;
  locale: "en" | "uk";
  /** A card from the deck (index into ALL_CARDS), described by `alt`. */
  cardId?: number;
  alt?: string;
  /** Without a card: the page's own image, or else the site preview (public/og-image*.jpg). */
  image?: ShareImage;
  /** False for pages that exist in one language only. */
  translated?: boolean;
  type?: "article" | "website";
}): Pick<Metadata, "openGraph" | "twitter"> {
  const site = SOCIAL_IMAGES[locale];
  const preview: ShareImage = cardId !== undefined
    ? { url: `https://oliviaarcana.com${getCardImagePath(ALL_CARDS[cardId])}`, width: 896, height: 1536, alt: alt ?? "" }
    : image ?? { ...site, url: `https://oliviaarcana.com${site.url}` };
  return {
    openGraph: {
      title, description, url, type, siteName: "Olivia Arcana",
      locale: locale === "uk" ? "uk_UA" : "en_GB",
      ...(translated ? { alternateLocale: [locale === "uk" ? "en_GB" : "uk_UA"] } : {}),
      images: [preview],
    },
    twitter: { card: "summary_large_image", title, description, images: [preview.url] },
  };
}
