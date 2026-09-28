// Link-preview images for current pages (source: scripts/og/og.html).
// Next replaces a parent's openGraph object instead of merging it, so every
// page that sets openGraph must list its image again.
export const SOCIAL_IMAGES = {
  en: {
    url: "/og-image.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "Olivia Arcana: the olive-lattice card back and The Star, with the words “A personal practice of tarot”",
  },
  uk: {
    url: "/og-image-uk.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "Olivia Arcana: сорочка карти з оливковим візерунком і карта «Зірка» з написом «Особиста практика Таро»",
  },
} as const;

export const socialImages = (locale: "en" | "uk") => [SOCIAL_IMAGES[locale]];
export const socialImageUrls = (locale: "en" | "uk") => [SOCIAL_IMAGES[locale].url];
