/**
 * /academy — Course catalog with tracks and levels
 *
 * Three tracks: Astrology, Tarot, Integrated
 * Visual card grid with progress indicators
 */

import { AcademyPageContent } from "./AcademyPageContent";

export const metadata = {
  title: "Olivia Arcana Academy — Learn Astrology & Tarot",
  description: "14 courses, 212 lessons. Master natal charts, planets, aspects, transits, tarot spreads, and the esoteric connections between stars and cards.",
};

export default function AcademyPage() {
  return <AcademyPageContent />;
}
