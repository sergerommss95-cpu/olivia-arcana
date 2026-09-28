import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/academy/card-of-the-day/";
const description = "One card from the 78-card deck for today, turned by your own hand, with its meaning.";
export const metadata: Metadata = {
  title: "Card of the Day: A Daily Tarot Draw | Olivia Arcana Academy",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Card of the day", description, url, locale: "en", cardId: 0, alt: "The Fool from the Olivia Arcana deck", translated: false }),
};

export default function CardOfTheDayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
