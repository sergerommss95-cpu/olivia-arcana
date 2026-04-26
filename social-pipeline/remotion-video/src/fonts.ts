/**
 * Font loading — using @remotion/google-fonts for render-safe font loading.
 * Cormorant Garamond = luxury serif (labels, watermark)
 * Inter = clean sans-serif (captions)
 */
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

export const { fontFamily: cormorantFamily } = loadCormorant("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

export const { fontFamily: interFamily } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
