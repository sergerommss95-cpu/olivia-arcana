// website/src/app/portrait/page.tsx
import type { Metadata } from "next";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import Portrait from "@/components/portrait/Portrait";
import { majorCards } from "@/lib/astrology/deck";
// What each position means, said to the reader ("you"). The model reads its own third-person frames in netlify/portrait/knowledge/positions.json.
import frames from "../../lib/portrait/frames.json";

export const metadata: Metadata = {
  title: "Your Birth Portrait | Olivia Arcana",
  description: "Your birth date, name and the sky at your birth, read together as one portrait.",
  robots: { index: false, follow: false },
};

export default function PortraitPage() {
  return <AlmanacShell><Portrait locale="en" cards={majorCards("en")} frames={frames} /></AlmanacShell>;
}
