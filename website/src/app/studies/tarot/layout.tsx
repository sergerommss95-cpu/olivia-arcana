import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/studies/tarot/";
const description = "Choose an intention, draw from the illustrated deck, turn a card and take its question with you.";
export const metadata: Metadata = {
  title: "The Living Tarot | The Night Collection | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "The Living Tarot", description, url, locale: "en", cardId: 0, alt: "The Fool from the Olivia Arcana deck", translated: false }),
};

export default function TarotStudyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
