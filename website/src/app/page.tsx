import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";
import { socialImages, socialImageUrls } from "@/lib/social-images";
export const metadata: Metadata = {
  title: "Olivia Arcana — Tarot readings for the questions that stay with you",
  description: "Choose from all 78 tarot cards. Explore free one-, three-, five- and eight-card readings, reflect on your question, and keep a private almanac on your device.",
  alternates: {canonical: "/", languages: {en: "/", uk: "/uk/", "x-default": "/"}},
  openGraph: {title: "Olivia Arcana — A personal practice of tarot", description: "A question. A card. A different perspective. Explore all 78 cards and keep what you notice.", url: "/", locale: "en_US", alternateLocale: "uk_UA", type: "website", siteName: "Olivia Arcana", images: socialImages("en")},
  twitter: {card: "summary_large_image", title: "Olivia Arcana — A personal practice of tarot", description: "A question. A card. A different perspective. Explore all 78 cards and keep what you notice.", images: socialImageUrls("en")},
};
export default function HomePage() { return <NativeExperienceHome />; }
