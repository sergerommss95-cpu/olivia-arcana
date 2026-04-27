import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free 3-Card Reading — Try Olivia | Olivia Arcana",
  description:
    "See how Olivia reads. Three cards, your day, no signup. The veil reveal, the cosmic voice, the printable letter — full experience, free.",
  alternates: { canonical: "https://oliviaarcana.com/sample" },
  openGraph: {
    title: "Try a Free Reading",
    description: "Three cards. Your day. No signup.",
    url: "https://oliviaarcana.com/sample",
  },
};

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
