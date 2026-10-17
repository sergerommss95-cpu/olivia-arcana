import type { Metadata } from "next";
import UkrainianLibraryShell from "../cards/library-shell";
import DailyLeaf from "@/components/daily/DailyLeaf";
import { astroCopy } from "@/lib/astrology/copy";
import { majorCards } from "@/lib/astrology/deck";
import { dailyDeck } from "@/lib/daily/deck";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/uk/daily/";
const en = "https://oliviaarcana.com/daily/";
export const metadata: Metadata = {
  title: "Ваш день: сьогоднішнє небо для вашого знака | Olivia Arcana",
  description: "Справжнє сьогоднішнє небо, розраховане на вашому пристрої й прочитане для вашого знака так само, як читають карти: для роздумів, а не прогнозу. І карта дня.",
  alternates: { canonical: url, languages: { en, uk: url, "x-default": en } },
  ...shareMeta({ title: "Ваш день", description: "Сьогоднішнє небо для вашого знака й карта дня.", url, locale: "uk", cardId: 19, alt: "Сонце з колоди Olivia Arcana", type: "website" }),
};

export default function UkrainianDailyPage() {
  return <UkrainianLibraryShell englishPath="/daily/"><DailyLeaf locale="uk" copy={astroCopy("uk")} cards={majorCards("uk")} deck={dailyDeck("uk")} /></UkrainianLibraryShell>;
}
