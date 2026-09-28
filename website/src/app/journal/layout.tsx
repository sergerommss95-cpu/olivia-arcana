import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/journal/";
export const metadata: Metadata = {
  title: "Cosmic Journal: Notes Under This Sky | Olivia Arcana",
  description:
    "Moon-phase aware journal with auto-save and calendar view. Each entry tagged with the sky above when you wrote it.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Cosmic Journal",
    description: "Moon-phase aware journal. Calendar view.",
    url, locale: "en", cardId: 18, alt: "The Moon from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
