import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/academy/aspect-guide/";
const description = "A reference to the astrological aspects: the angle each one makes, its orb, and how the planets it joins relate to each other.";
export const metadata: Metadata = {
  title: "Aspect Guide: How the Planets Relate | Olivia Arcana Academy",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Aspect guide: how the planets relate", description, url, locale: "en", cardId: 14, alt: "Temperance from the Olivia Arcana deck", translated: false }),
};

export default function AspectGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
