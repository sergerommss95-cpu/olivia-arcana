import type { Metadata } from "next";
import UkrainianLibraryShell from "../cards/library-shell";
import AstrologyHub from "@/components/astrology/AstrologyHub";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/uk/astrology/";
const en = "https://oliviaarcana.com/astrology/";
export const metadata: Metadata = {
  title: "Астрологія як практика: небо сьогодні й ваша натальна карта | Olivia Arcana",
  description: "Астрологія, яку читають так само, як Таро: для роздумів, а не прогнозів. Місяць і планети просто зараз, кожна зі своєю картою Старших Арканів, і ваша натальна карта.",
  alternates: { canonical: url, languages: { en, uk: url, "x-default": en } },
  ...shareMeta({ title: "Небо як практика", description: "Місяць і планети просто зараз, кожна зі своєю картою Старших Арканів, і ваша натальна карта.", url, locale: "uk", cardId: 17, alt: "Зірка з колоди Olivia Arcana", type: "website" }),
};

export default function UkrainianAstrologyPage() {
  return <UkrainianLibraryShell englishPath="/astrology/"><AstrologyHub locale="uk" /></UkrainianLibraryShell>;
}
