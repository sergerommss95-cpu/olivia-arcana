import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compatibility Reading — Two Charts, One Story | Olivia Arcana",
  description:
    "Compare two birth charts for a clear compatibility reading with love, emotion, communication, growth, and challenge themes.",
  alternates: { canonical: "https://oliviaarcana.com/synastry" },
  openGraph: {
    title: "Compatibility Reading — Two Charts",
    description: "A clear compatibility reading from two birth charts.",
    url: "https://oliviaarcana.com/synastry",
  },
};

export default function SynastryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
