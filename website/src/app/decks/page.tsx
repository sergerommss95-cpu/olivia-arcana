import type { Metadata } from "next";
import NativeExperienceHome from "@/components/almanac/NativeExperienceHome";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/decks/";
const description = "Explore two original 78-card tarot decks. Olivia for everyday questions; Amielle for connection and relationships. Choose your deck and begin a reading.";
export const metadata: Metadata = {
 title: "Tarot decks: find your deck | Olivia Arcana",
 description,
 alternates: {canonical: url,languages:{en:url,uk:"https://oliviaarcana.com/uk/decks/","x-default":url}},
 ...shareMeta({ title: "Two original tarot decks", description, url, locale: "en", type: "website" }),
};
export default function DecksPage(){return <NativeExperienceHome locale="en" entry="decks" />;}
