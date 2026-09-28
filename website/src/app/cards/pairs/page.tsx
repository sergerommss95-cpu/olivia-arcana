import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import PairsIndex from "@/components/academy/PairsIndex";

const url = "https://oliviaarcana.com/cards/pairs/";
export const metadata: Metadata = {
  title: "Tarot Card Pairs: Reading Two Cards Together | Olivia Arcana",
  description: "Pairs of tarot cards read together for the Olivia deck: what links them, the symbols they share, and five ways to read any two cards as a conversation.",
  alternates: { canonical: url, languages: { en: url, uk: "https://oliviaarcana.com/uk/cards/pairs/", "x-default": url } },
};

export default function PairsIndexPage() {
  return <AlmanacShell><PairsIndex locale="en" /></AlmanacShell>;
}
