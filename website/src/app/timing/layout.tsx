import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cosmic Timing — When to Move | Olivia Arcana",
  description:
    "Saturn return, Jupiter cycles, Uranus opposition — major life-timing events with countdown. Know what's coming, prepare before it lands.",
  alternates: { canonical: "https://oliviaarcana.com/timing" },
  openGraph: {
    title: "Cosmic Timing",
    description: "Saturn return, Jupiter cycles, life timing.",
    url: "https://oliviaarcana.com/timing",
  },
};

export default function TimingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
