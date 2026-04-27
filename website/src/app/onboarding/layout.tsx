import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Olivia Arcana — Set Up Your Cosmic Profile",
  description: "Three steps. Your birth date, your sign, your chart. Then the cosmos begins reading you.",
  alternates: { canonical: "https://oliviaarcana.com/onboarding" },
  robots: { index: false, follow: true },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
