/**
 * /academy — Course catalog with tracks and levels
 *
 * Three tracks: Astrology, Tarot, Integrated
 * Visual card grid with progress indicators
 */

import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";
import { AcademyPageContent } from "./AcademyPageContent";

const url = "https://oliviaarcana.com/academy/";
const description = "14 courses, 212 lessons. Master natal charts, planets, aspects, transits, tarot spreads, and the esoteric connections between stars and cards.";
export const metadata: Metadata = {
  title: "Olivia Arcana Academy: Learn Astrology & Tarot",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Olivia Arcana Academy", description, url, locale: "en", cardId: 5, alt: "The Hierophant from the Olivia Arcana deck", translated: false, type: "website" }),
};

export default function AcademyPage() {
  return <AcademyPageContent />;
}
