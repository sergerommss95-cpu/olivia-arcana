import type { Metadata } from "next";
import UkrainianLibraryShell from "../cards/library-shell";
import LearnHub from "@/components/learn/LearnHub";

const url = "https://oliviaarcana.com/uk/learn/";
export const metadata: Metadata = {
  title: "Навчитися читати Таро: розклади, поєднання карт і практика | Olivia Arcana",
  description: "Уроки мистецтва читання Таро: як ставити запитання, як читати розклад цілісно, поєднання карт, придворні карти й стихії, практика й чесна історія.",
  alternates: { canonical: url, languages: { en: "https://oliviaarcana.com/learn/", uk: url, "x-default": "https://oliviaarcana.com/learn/" } },
};

export default function UkrainianLearnPage() {
  return <UkrainianLibraryShell englishPath="/learn/"><LearnHub locale="uk" /></UkrainianLibraryShell>;
}
