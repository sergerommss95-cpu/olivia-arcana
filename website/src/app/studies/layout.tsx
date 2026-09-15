import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Night Collection — Olivia Arcana",
  description: "Two interactive studies in attention: an illustrated tarot ritual and an engraved map of the sky.",
  robots: { index: false, follow: false },
};

export default function StudiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
