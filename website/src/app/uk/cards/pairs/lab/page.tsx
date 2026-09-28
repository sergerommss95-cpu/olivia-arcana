import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import UkrainianLibraryShell from "../../library-shell";
import PairLabPage from "@/components/academy/PairLabPage";

const url = "https://oliviaarcana.com/uk/cards/pairs/lab/";
export const metadata: Metadata = {
  title: "Лабораторія пар: читайте будь-які дві карти разом | Olivia Arcana",
  description: "Оберіть будь-які дві з 78 карт або витягніть дві навмання й прочитайте їх разом: що їх поєднує, які символи вирізьблено на обох і п’ять способів прочитати пару.",
  alternates: { canonical: url, languages: { en: "https://oliviaarcana.com/cards/pairs/lab/", uk: url, "x-default": "https://oliviaarcana.com/cards/pairs/lab/" } },
  ...shareMeta({ title: "Лабораторія пар: будь-які дві карти разом", description: "Оберіть будь-які дві з 78 карт і прочитайте їх разом: що їх поєднує, спільні вирізьблені символи, п’ять способів прочитання.", url, locale: "uk", cardId: 17, alt: "Зірка з колоди Olivia Arcana", type: "website" }),
};

export default function UkrainianPairLabRoute() {
  return <UkrainianLibraryShell englishPath="/cards/pairs/lab/"><PairLabPage locale="uk" /></UkrainianLibraryShell>;
}
