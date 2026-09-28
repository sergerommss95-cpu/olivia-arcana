import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/transits/";
export const metadata: Metadata = {
  // Without a saved birth chart this page is only a gate, so keep it out of search.
  robots: { index: false, follow: true },
  title: "Transits: Personal Timing | Olivia Arcana",
  description:
    "See how current and upcoming transits relate to your natal chart, with reflective timing prompts instead of fixed predictions.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Transits Timeline",
    description: "Current and upcoming transits for reflective timing.",
    url, locale: "en", cardId: 29, alt: "Eight of Wands from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function TransitsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
