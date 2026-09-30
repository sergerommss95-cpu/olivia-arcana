import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import BirthChart from "@/components/astrology/BirthChart";
import { astroCopy } from "@/lib/astrology/copy";
import { majorCards } from "@/lib/astrology/deck";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/astrology/birth-chart/";
const uk = "https://oliviaarcana.com/uk/astrology/birth-chart/";
export const metadata: Metadata = {
  title: "Free Birth Chart: Sun, Moon and Rising as Tarot Cards | Olivia Arcana",
  description: "Your birth chart, worked out on your device: a Major Arcana card for your Sun, Moon and Rising sign, the wheel of the sky when you were born, and questions to reflect on.",
  alternates: { canonical: url, languages: { en: url, uk, "x-default": url } },
  ...shareMeta({ title: "Your birth chart, in three cards", description: "A Major Arcana card for your Sun, Moon and Rising sign, and the wheel of the sky when you were born.", url, locale: "en", cardId: 10, alt: "Wheel of Fortune from the Olivia Arcana deck", type: "website" }),
};

export default function BirthChartPage() {
  return <AlmanacShell><BirthChart locale="en" copy={astroCopy("en")} cards={majorCards("en")} /></AlmanacShell>;
}
