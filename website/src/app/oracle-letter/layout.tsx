import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/oracle-letter/";
export const metadata: Metadata = {
  // Without a saved birth chart this page is only a gate, so keep it out of search.
  robots: { index: false, follow: true },
  title: "Oracle Letter: Your Reading, Sealed in Wax | Olivia Arcana",
  description:
    "A printable, ceremonial reading document. Wax-seal opening, drop-cap typography, full reading rendered as a keepsake letter.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Oracle Letter",
    description: "Your reading, as a sealed letter.",
    url, locale: "en", cardId: 46, alt: "Page of Cups from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function OracleLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
