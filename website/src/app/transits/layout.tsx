import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transits — When the Sky Speaks | Olivia Arcana",
  description:
    "6-month timeline of transiting planets meeting your natal chart. Major aspects, peaks, decisions — see what's coming before it lands.",
  alternates: { canonical: "https://oliviaarcana.com/transits" },
  openGraph: {
    title: "Transits Timeline",
    description: "When the sky meets your natal chart.",
    url: "https://oliviaarcana.com/transits",
  },
};

export default function TransitsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
