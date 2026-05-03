import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Birth Chart — Your Natal Chart | Olivia Arcana",
  description:
    "Create an interactive natal chart with Sun, Moon, Rising, planets, houses, and plain-language context.",
  alternates: { canonical: "https://oliviaarcana.com/chart" },
  openGraph: {
    title: "Your Birth Chart — Decoded",
    description: "An interactive natal chart with clear context for your key placements.",
    url: "https://oliviaarcana.com/chart",
  },
};

export default function ChartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
