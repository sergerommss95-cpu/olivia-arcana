import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compatibility Reading — Two Charts, One Story | Olivia Arcana",
  description:
    "Full synastry analysis. 100 cross-aspect pairs computed from both birth charts. Love, communication, trust, passion — read deep, not surface.",
  alternates: { canonical: "https://oliviaarcana.com/synastry" },
  openGraph: {
    title: "Synastry — Two Charts, One Reading",
    description: "Full astrological compatibility from real birth data.",
    url: "https://oliviaarcana.com/synastry",
  },
};

export default function SynastryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
