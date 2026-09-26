import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";

const title = "Olivia Arcana — Таро українською для вашого запитання";
const description = "Оберіть карту з колоди із 78 карт, дослідіть розклад і збережіть власні думки. Особиста практика Таро українською: для роздумів, ясності та уважного вибору.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "https://oliviaarcana.com/uk/",
    languages: { en: "https://oliviaarcana.com/", uk: "https://oliviaarcana.com/uk/", "x-default": "https://oliviaarcana.com/" },
  },
  openGraph: { title, description, url: "https://oliviaarcana.com/uk/", locale: "uk_UA", alternateLocale: ["en_US"], type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function UkrainianHomePage() {
  return <NativeExperienceHome locale="uk" />;
}
