import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/studies/sky/";
const description = "Set a place and a time, trace the constellations and see which planets are above your horizon.";
export const metadata: Metadata = {
  title: "A Moment, Written in Stars | The Night Collection | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "A moment, written in stars", description, url, locale: "en", cardId: 17, alt: "The Star from the Olivia Arcana deck", translated: false }),
};

export default function SkyStudyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
