import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/timing/";
export const metadata: Metadata = {
  // Without a saved birth chart this page is only a gate, so keep it out of search.
  robots: { index: false, follow: true },
  title: "Cosmic Timing: Saturn Return and Life Cycles | Olivia Arcana",
  description:
    "Saturn return, Jupiter cycles and the Uranus opposition: the major timing events in your chart, each with a countdown.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Cosmic Timing",
    description: "Saturn return, Jupiter cycles, life timing.",
    url, locale: "en", cardId: 7, alt: "The Chariot from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function TimingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
