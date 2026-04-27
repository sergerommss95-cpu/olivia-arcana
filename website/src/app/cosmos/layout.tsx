import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Living Cosmos — Real-Time Sky | Olivia Arcana",
  description:
    "Watch the sky right now. Real-time planetary positions, current transits, upcoming eclipses and retrogrades — computed from NASA JPL ephemeris.",
  alternates: { canonical: "https://oliviaarcana.com/cosmos" },
  openGraph: {
    title: "The Living Cosmos",
    description: "The sky, right now. Real planetary data.",
    url: "https://oliviaarcana.com/cosmos",
  },
};

export default function CosmosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
