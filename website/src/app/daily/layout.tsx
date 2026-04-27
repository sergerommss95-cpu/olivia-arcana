import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Reading — Your Daily Cosmic Almanac | Olivia Arcana",
  description:
    "Your zodiac sign · today · in your voice. Personalized daily horoscope from real planetary positions, with do/don't and life-area breakdown.",
  alternates: { canonical: "https://oliviaarcana.com/daily" },
  openGraph: {
    title: "Today's Reading",
    description: "Your daily horoscope, computed from the real sky.",
    url: "https://oliviaarcana.com/daily",
  },
};

export default function DailyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
