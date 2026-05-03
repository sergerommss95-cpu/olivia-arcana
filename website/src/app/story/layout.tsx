import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Story of Olivia Arcana | Olivia Arcana",
  description:
    "Why Olivia Arcana exists: personal astrology and tarot readings designed for reflection, clarity, and better questions.",
  alternates: { canonical: "https://oliviaarcana.com/story" },
  openGraph: {
    title: "The Story of Olivia Arcana",
    description: "Personal astrology and tarot readings, designed for clarity.",
    url: "https://oliviaarcana.com/story",
  },
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
