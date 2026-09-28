import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/cosmos/";
export const metadata: Metadata = {
  title: "The Living Cosmos: Real-Time Sky | Olivia Arcana",
  description:
    "A calm view of the current sky: moon phase, planet positions, and upcoming astrological events.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "The Living Cosmos",
    description: "Moon phase, planet positions, and upcoming astrological events.",
    url, locale: "en", cardId: 17, alt: "The Star from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function CosmosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
