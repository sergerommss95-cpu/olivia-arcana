// website/src/app/uk/portrait/page.tsx
import type { Metadata } from "next";
import UkrainianLibraryShell from "../cards/library-shell";
import Portrait from "@/components/portrait/Portrait";
import { majorCards } from "@/lib/astrology/deck";
// What each position means, said to the reader ("you"). The model reads its own third-person frames in netlify/portrait/knowledge/positions.json.
import frames from "../../../lib/portrait/frames.json";

export const metadata: Metadata = {
  title: "Ваш портрет народження | Olivia Arcana",
  description: "Дата народження, ім’я та небо в мить вашого народження, прочитані разом як один портрет.",
  robots: { index: false, follow: false },
};

export default function UkrainianPortraitPage() {
  return <UkrainianLibraryShell englishPath="/portrait/"><Portrait locale="uk" cards={majorCards("uk")} frames={frames} /></UkrainianLibraryShell>;
}
