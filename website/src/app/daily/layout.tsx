import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/daily/";
export const metadata: Metadata = {
  title: "Today's Reading: Your Daily Cosmic Almanac | Olivia Arcana",
  description:
    "Your zodiac sign, today, in plain words: a personalised daily horoscope from real planetary positions, with dos and don'ts for each area of life.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Today's Reading",
    description: "Your daily horoscope, computed from the real sky.",
    url, locale: "en", cardId: 19, alt: "The Sun from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
