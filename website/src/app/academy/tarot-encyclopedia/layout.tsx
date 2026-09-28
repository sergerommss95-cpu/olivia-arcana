import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/academy/tarot-encyclopedia/";
const description = "All 78 tarot cards in one index: search by name, filter by arcana or suit, and read what each card means.";
export const metadata: Metadata = {
  title: "Tarot Encyclopedia: All 78 Cards Explained | Olivia Arcana Academy",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Tarot encyclopedia: all 78 cards", description, url, locale: "en", cardId: 1, alt: "The Magician from the Olivia Arcana deck", translated: false }),
};

export default function TarotEncyclopediaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
