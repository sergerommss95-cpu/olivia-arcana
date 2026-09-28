import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/uk/decks/";
const description = "Оберіть свою колоду Таро: Olivia для щоденних запитань або «Amielle» для близькості та стосунків. По 78 карт у кожній.";
export const metadata: Metadata = {
 title: "Авторські колоди Таро — Olivia Arcana",
 description,
 alternates: {canonical: url,languages:{en:"https://oliviaarcana.com/decks/",uk:url,"x-default":"https://oliviaarcana.com/decks/"}},
 ...shareMeta({ title: "Дві авторські колоди Таро", description, url, locale: "uk", type: "website" }),
};
export default function DecksPage(){return <NativeExperienceHome locale="uk" entry="decks" />;}
