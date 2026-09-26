import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";
export const metadata: Metadata = {
  title: "Olivia Arcana — Tarot readings for the questions that stay with you",
  description: "Choose from all 78 tarot cards. Explore a free one-card or three-card reading, reflect on your question, and keep a private almanac on your device.",
  alternates: {canonical: "/", languages: {en: "/", uk: "/uk/", "x-default": "/"}},
  openGraph: {title: "Olivia Arcana — A personal practice of tarot", description: "A question. A card. A different perspective. Explore all 78 cards and keep what you notice.", url: "/", locale: "en_US", alternateLocale: "uk_UA"},
};
export default function HomePage() { return <NativeExperienceHome />; }
