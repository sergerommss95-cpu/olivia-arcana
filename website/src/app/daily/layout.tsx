import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/daily/";
const uk = "https://oliviaarcana.com/uk/daily/";
export const metadata: Metadata = {
  title: "Your Day: Today’s Sky Read for Your Sign | Olivia Arcana",
  description: "Today’s real sky, worked out on your device and read for your sign the way the cards are read: for reflection, never a forecast. With the card of the day.",
  alternates: { canonical: url, languages: { en: url, uk, "x-default": url } },
  ...shareMeta({ title: "Your day", description: "Today’s real sky, read for your sign, with the card of the day.", url, locale: "en", cardId: 19, alt: "The Sun from the Olivia Arcana deck", type: "website" }),
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
