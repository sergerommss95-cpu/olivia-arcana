import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/sample/";
export const metadata: Metadata = {
  title: "Free 3-Card Reading: Try Olivia | Olivia Arcana",
  description:
    "See how Olivia reads: three cards for your day, with no sign-up. The veil reveal, the cosmic voice and the printable letter are all free.",
  alternates: { canonical: url },
  ...shareMeta({
    title: "Try a free reading",
    description: "Three cards. Your day. No sign-up.",
    url, locale: "en", translated: false, type: "website",
  }),
};

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
