import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transits — Personal Timing | Olivia Arcana",
  description:
    "See how current and upcoming transits relate to your natal chart, with reflective timing prompts instead of fixed predictions.",
  alternates: { canonical: "https://oliviaarcana.com/transits" },
  openGraph: {
    title: "Transits Timeline",
    description: "Current and upcoming transits for reflective timing.",
    url: "https://oliviaarcana.com/transits",
  },
};

export default function TransitsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
