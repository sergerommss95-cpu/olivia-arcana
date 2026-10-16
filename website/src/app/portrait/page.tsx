// website/src/app/portrait/page.tsx
import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import Portrait from "@/components/portrait/Portrait";
import { majorCards } from "@/lib/astrology/deck";
// The position frames are data, read where the server keeps them: one source for the prompt and the page.
import frames from "../../../netlify/portrait/knowledge/positions.json";

export const metadata: Metadata = {
  title: "Your Birth Portrait | Olivia Arcana",
  description: "Your birth date, name and the sky at your birth, read together as one portrait.",
  robots: { index: false, follow: false },
};

export default function PortraitPage() {
  return <AlmanacShell><Portrait locale="en" cards={majorCards("en")} frames={frames} /></AlmanacShell>;
}
