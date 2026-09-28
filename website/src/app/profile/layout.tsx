import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

// Account and checkout are paused until those services are verified.
// Their placeholder pages stay reachable but out of search results.
const url = "https://oliviaarcana.com/profile/";
const description = "Your Olivia Arcana profile.";
export const metadata: Metadata = {
  title: "Your profile | Olivia Arcana",
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: url },
  ...shareMeta({ title: "Your Olivia Arcana profile", description, url, locale: "en", translated: false, type: "website" }),
};

export default function PausedServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
