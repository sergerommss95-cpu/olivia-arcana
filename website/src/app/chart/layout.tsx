import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Birth Chart — Your Cosmic Blueprint | Olivia Arcana",
  description:
    "Interactive natal chart computed from NASA JPL DE440 ephemeris. Sun, Moon, Rising, all planets and houses — click any to see what it means in YOUR chart.",
  alternates: { canonical: "https://oliviaarcana.com/chart" },
  openGraph: {
    title: "Your Birth Chart — Decoded",
    description: "Real NASA planetary data, computed live for your exact birth moment.",
    url: "https://oliviaarcana.com/chart",
  },
};

export default function ChartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
