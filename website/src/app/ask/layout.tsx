import type { Metadata } from "next";
import { socialImages, socialImageUrls } from "@/lib/social-images";

const title = "Begin with your question — Olivia Arcana";
const description = "Put a situation into words and find a clearer question for your tarot reading. An optional AI-assisted conversation; you choose the cards afterwards.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://oliviaarcana.com/ask/", languages: { en: "https://oliviaarcana.com/ask/", uk: "https://oliviaarcana.com/uk/ask/", "x-default": "https://oliviaarcana.com/ask/" } },
  openGraph: { title, description, url: "https://oliviaarcana.com/ask/", locale: "en_US", alternateLocale: ["uk_UA"], type: "website", siteName: "Olivia Arcana", images: socialImages("en") },
  twitter: { card: "summary_large_image", title, description, images: socialImageUrls("en") },
};

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
