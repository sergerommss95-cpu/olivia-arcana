import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Living Cosmos — Real-Time Sky | Olivia Arcana",
  description:
    "A calm view of the current sky: moon phase, planet positions, and upcoming astrological events.",
  alternates: { canonical: "https://oliviaarcana.com/cosmos" },
  openGraph: {
    title: "The Living Cosmos",
    description: "Moon phase, planet positions, and upcoming astrological events.",
    url: "https://oliviaarcana.com/cosmos",
  },
};

export default function CosmosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
