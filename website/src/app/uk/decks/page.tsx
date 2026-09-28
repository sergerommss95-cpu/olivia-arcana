import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";
export const metadata: Metadata = {
 title: "Авторські колоди Таро — Olivia Arcana",
 description: "Оберіть свою колоду Таро: Olivia для щоденних запитань або «Amielle» для близькості та стосунків. По 78 карт у кожній.",
 alternates: {canonical: "/uk/decks/",languages:{en:"/decks/",uk:"/uk/decks/","x-default":"/decks/"}},
};
export default function DecksPage(){return <NativeExperienceHome locale="uk" entry="decks" />;}
