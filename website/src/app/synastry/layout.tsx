import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/synastry/";
export const metadata: Metadata = {
  title: "Compatibility Reading: Two Charts, One Story | Olivia Arcana",
  description:
    "Compare two birth charts for a clear compatibility reading with love, emotion, communication, growth, and challenge themes.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Compatibility reading: two charts",
    description: "A clear compatibility reading from two birth charts.",
    url, locale: "en", cardId: 37, alt: "Two of Cups from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function SynastryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
