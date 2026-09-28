import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import PairsIndex from "@/components/academy/PairsIndex";

const url = "https://oliviaarcana.com/cards/pairs/";
export const metadata: Metadata = {
  title: "Tarot Card Pairs: Reading Two Cards Together | Olivia Arcana",
  description: "Pairs of tarot cards read together for the Olivia deck: what links them, the symbols they share, and five ways to read any two cards as a conversation.",
  alternates: { canonical: url, languages: { en: url, uk: "https://oliviaarcana.com/uk/cards/pairs/", "x-default": url } },
  ...shareMeta({ title: "Tarot card pairs", description: "Two cards read together: what links them, the symbols they share, and five ways to read any pair.", url, locale: "en", cardId: 16, alt: "The Tower from the Olivia Arcana deck", type: "website" }),
};

export default function PairsIndexPage() {
  return <AlmanacShell><PairsIndex locale="en" /></AlmanacShell>;
}
