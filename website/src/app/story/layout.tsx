import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Story of Olivia Arcana | Olivia Arcana",
  description:
    "Why this exists. What it's for. Premium astrology and tarot — NASA-grade astronomy, AI oracle, proprietary deck, eight languages, one brand.",
  alternates: { canonical: "https://oliviaarcana.com/story" },
  openGraph: {
    title: "The Story of Olivia Arcana",
    description: "Premium astrology + tarot, under one roof.",
    url: "https://oliviaarcana.com/story",
  },
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
