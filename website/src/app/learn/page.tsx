import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import LearnHub from "@/components/learn/LearnHub";

const url = "https://oliviaarcana.com/learn/";
export const metadata: Metadata = {
  title: "Learn to Read Tarot: Spreads, Card Combinations and Practice | Olivia Arcana",
  description: "Lessons in the craft of reading tarot: asking questions the cards can meet, reading a spread as a whole, card combinations, courts and elements, practice and an honest history.",
  alternates: { canonical: url, languages: { en: url, uk: "https://oliviaarcana.com/uk/learn/", "x-default": url } },
  ...shareMeta({ title: "Learn to read tarot", description: "Lessons in the craft of reading: asking questions the cards can meet, reading a spread as a whole, card combinations and an honest history.", url, locale: "en", cardId: 9, alt: "The Hermit from the Olivia Arcana deck", type: "website" }),
};

export default function LearnPage() {
  return <AlmanacShell><LearnHub locale="en" /></AlmanacShell>;
}
