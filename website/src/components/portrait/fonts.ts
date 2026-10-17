// website/src/components/portrait/fonts.ts
import { Cormorant_SC } from "next/font/google";

// The label voice's face (type.module.css): Cormorant's true small caps, whose
// Latin and Cyrillic lower case are drawn as small capitals. Fetched when a
// portrait first shows a label, never preloaded on other pages.
const cormorantSC = Cormorant_SC({
  variable: "--font-sc",
  subsets: ["latin", "cyrillic"],
  // 600 for the labels, 500 for a chapter's lead-in.
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

/**
 * Set `portraitFonts.className` on the portrait's root, and on anything the
 * portrait portals out of it, so `--font-sc` reaches every label. It declares
 * the variable only; it does not change the root's own face.
 */
export const portraitFonts = { className: cormorantSC.variable };
