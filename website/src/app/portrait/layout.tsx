import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/portrait/";
export const metadata: Metadata = {
  title: "The Birth Chart: Your Natal Wheel | Olivia Arcana",
  description:
    "Date, hour and place, drawn as an engraved wheel of houses: your full natal chart, computed in the browser, with a plain-language decode.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "The Birth Chart",
    description: "Your natal chart, drawn as an engraved wheel of houses.",
    url, locale: "en", cardId: 10, alt: "Wheel of Fortune from the Olivia Arcana deck", translated: false, type: "website",
  }),
};

export default function PortraitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
