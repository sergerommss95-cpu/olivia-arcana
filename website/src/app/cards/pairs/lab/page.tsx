import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import PairLabPage from "@/components/academy/PairLabPage";

const url = "https://oliviaarcana.com/cards/pairs/lab/";
export const metadata: Metadata = {
  title: "Pair Lab: Read Any Two Tarot Cards Together | Olivia Arcana",
  description: "Choose any two of the 78 cards, or deal two at random, and read them together: what links them, the symbols carved on both, and five ways to read the pair.",
  alternates: { canonical: url, languages: { en: url, uk: "https://oliviaarcana.com/uk/cards/pairs/lab/", "x-default": url } },
  ...shareMeta({ title: "Pair lab: read any two tarot cards together", description: "Choose any two of the 78 cards and read them together: what links them, the symbols carved on both, five ways in.", url, locale: "en", cardId: 17, alt: "The Star from the Olivia Arcana deck", type: "website" }),
};

export default function PairLabRoute() {
  return <AlmanacShell><PairLabPage locale="en" /></AlmanacShell>;
}
