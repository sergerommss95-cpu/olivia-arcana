import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask the Stars — Olivia AI Oracle | Olivia Arcana",
  description:
    "Ask anything. Olivia answers from your chart, in your voice. Streaming AI oracle powered by Claude, grounded in real planetary positions.",
  alternates: { canonical: "https://oliviaarcana.com/ask" },
  openGraph: {
    title: "Ask the Stars",
    description: "AI oracle that knows your chart.",
    url: "https://oliviaarcana.com/ask",
  },
};

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
