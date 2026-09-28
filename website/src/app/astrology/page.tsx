import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import AstrologyHub from "@/components/astrology/AstrologyHub";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/astrology/";
const uk = "https://oliviaarcana.com/uk/astrology/";
export const metadata: Metadata = {
  title: "Astrology as a Practice: Tonight’s Sky and Your Birth Chart | Olivia Arcana",
  description: "Astrology read the way tarot is: for reflection, not forecasts. See the Moon and planets right now, each with its Major Arcana card, and read your birth chart.",
  alternates: { canonical: url, languages: { en: url, uk, "x-default": url } },
  ...shareMeta({ title: "The sky, as a practice", description: "Astrology read the way tarot is: the Moon and planets right now, each with its Major Arcana card, and your birth chart.", url, locale: "en", cardId: 17, alt: "The Star from the Olivia Arcana deck", type: "website" }),
};

export default function AstrologyPage() {
  return <AlmanacShell><AstrologyHub locale="en" /></AlmanacShell>;
}
