import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import UkrainianLibraryShell from "../library-shell";
import PairsIndex from "@/components/academy/PairsIndex";

const url = "https://oliviaarcana.com/uk/cards/pairs/";
export const metadata: Metadata = {
  title: "Пари карт Таро: як читати дві карти разом | Olivia Arcana",
  description: "Пари карт Таро, прочитані разом для колоди Olivia: що їх поєднує, спільні символи й п’ять способів прочитати будь-які дві карти як розмову.",
  alternates: { canonical: url, languages: { en: "https://oliviaarcana.com/cards/pairs/", uk: url, "x-default": "https://oliviaarcana.com/cards/pairs/" } },
  ...shareMeta({ title: "Пари карт Таро", description: "Дві карти, прочитані разом: що їх поєднує, спільні символи й п’ять способів прочитати будь-яку пару.", url, locale: "uk", cardId: 16, alt: "Вежа з колоди Olivia Arcana", type: "website" }),
};

export default function UkrainianPairsIndexPage() {
  return <UkrainianLibraryShell englishPath="/cards/pairs/"><PairsIndex locale="uk" /></UkrainianLibraryShell>;
}
