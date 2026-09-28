import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";
export const metadata: Metadata = {
 title: "Tarot decks — Find your deck · Olivia Arcana",
 description: "Explore two original 78-card tarot decks. Olivia for everyday questions; The Space Between for connection and relationships. Choose your deck and begin a reading.",
 alternates: {canonical: "/decks/",languages:{en:"/decks/",uk:"/uk/decks/","x-default":"/decks/"}},
};
export default function DecksPage(){return <NativeExperienceHome locale="en" entry="decks" />;}
