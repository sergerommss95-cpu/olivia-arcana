import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cosmic Journal — Notes Under This Sky | Olivia Arcana",
  description:
    "Moon-phase aware journal with auto-save and calendar view. Each entry tagged with the sky above when you wrote it.",
  alternates: { canonical: "https://oliviaarcana.com/journal" },
  openGraph: {
    title: "Cosmic Journal",
    description: "Moon-phase aware journal. Calendar view.",
    url: "https://oliviaarcana.com/journal",
  },
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
