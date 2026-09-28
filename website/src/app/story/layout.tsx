import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/story/";
export const metadata: Metadata = {
  title: "The Story of Olivia Arcana | Olivia Arcana",
  description:
    "Why Olivia Arcana exists: personal astrology and tarot readings designed for reflection, clarity, and better questions.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "The Story of Olivia Arcana",
    description: "Personal astrology and tarot readings, designed for clarity.",
    url, locale: "en", translated: false,
  }),
};

export default function StoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
