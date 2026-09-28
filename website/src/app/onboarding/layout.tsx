import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/onboarding/";
const description = "Three steps: your birth date, your sign, your chart.";
export const metadata: Metadata = {
  title: "Welcome to Olivia Arcana: Set Up Your Cosmic Profile",
  description,
  alternates: { canonical: url },
  robots: { index: false, follow: true },
  ...shareMeta({ title: "Set up your profile", description, url, locale: "en", translated: false, type: "website" }),
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
