import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

// Account and checkout are paused until those services are verified.
// Their placeholder pages stay reachable but out of search results.
const url = "https://oliviaarcana.com/login/";
const description = "Sign in to your Olivia Arcana account.";
export const metadata: Metadata = {
  title: "Sign in | Olivia Arcana",
  description,
  robots: { index: false, follow: true },
  alternates: { canonical: url },
  ...shareMeta({ title: "Sign in to Olivia Arcana", description, url, locale: "en", translated: false, type: "website" }),
};

export default function PausedServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
