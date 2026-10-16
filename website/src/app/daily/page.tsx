import AlmanacShell from "@/components/almanac/AlmanacShell";
import DailyLeaf from "@/components/daily/DailyLeaf";
import { astroCopy } from "@/lib/astrology/copy";
import { majorCards } from "@/lib/astrology/deck";
import { dailyDeck } from "@/lib/daily/deck";

export default function DailyPage() {
  return <AlmanacShell><DailyLeaf locale="en" copy={astroCopy("en")} cards={majorCards("en")} deck={dailyDeck("en")} /></AlmanacShell>;
}
