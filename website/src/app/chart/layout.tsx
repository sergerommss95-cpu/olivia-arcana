import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/chart/";
export const metadata: Metadata = {
  title: "Birth Chart: Your Natal Chart | Olivia Arcana",
  description:
    "Create an interactive natal chart with Sun, Moon, Rising, planets, houses, and plain-language context.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Your birth chart, decoded",
    description: "An interactive natal chart with clear context for your key placements.",
    url, locale: "en", cardId: 10, alt: "Wheel of Fortune from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function ChartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
