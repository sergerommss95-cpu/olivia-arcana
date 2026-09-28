import type { Metadata } from "next";
import UkrainianLibraryShell from "../../cards/library-shell";
import BirthChart from "@/components/astrology/BirthChart";
import { astroCopy } from "@/lib/astrology/copy";
import { majorCards } from "@/lib/astrology/deck";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/uk/astrology/birth-chart/";
const en = "https://oliviaarcana.com/astrology/birth-chart/";
export const metadata: Metadata = {
  title: "Натальна карта безкоштовно: Сонце, Місяць і Асцендент у картах Таро | Olivia Arcana",
  description: "Ваша натальна карта, розрахована на вашому пристрої: карта Старших Арканів для Сонця, Місяця й Асцендента, коло неба в мить народження й запитання для роздумів.",
  alternates: { canonical: url, languages: { en, uk: url, "x-default": en } },
  ...shareMeta({ title: "Ваша натальна карта у трьох картах", description: "Карта Старших Арканів для вашого Сонця, Місяця й Асцендента та коло неба в мить народження.", url, locale: "uk", cardId: 10, alt: "Колесо Фортуни з колоди Olivia Arcana", type: "website" }),
};

export default function UkrainianBirthChartPage() {
  return <UkrainianLibraryShell englishPath="/astrology/birth-chart/"><BirthChart locale="uk" copy={astroCopy("uk")} cards={majorCards("uk")} /></UkrainianLibraryShell>;
}
