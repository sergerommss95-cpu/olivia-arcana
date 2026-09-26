import type { MetadataRoute } from "next";
import legacyUrls from "@/lib/sitemap-legacy.json";
import { CARD_SLUGS } from "./cards/card-pages";

export const dynamic = "force-static";

const ORIGIN = "https://oliviaarcana.com";
const translatedPaths = ["/", "/cards/", ...CARD_SLUGS.map((slug) => `/cards/${slug}/`)];

export default function sitemap(): MetadataRoute.Sitemap {
  const paired = new Map<string, { en: string; uk: string; "x-default": string }>();
  for (const path of translatedPaths) {
    const en = `${ORIGIN}${path}`;
    const uk = `${ORIGIN}/uk${path}`;
    const languages = { en, uk, "x-default": en };
    paired.set(en, languages);
    paired.set(uk, languages);
  }
  return [...new Set([...legacyUrls, ...paired.keys()])].map((url) => ({
    url,
    changeFrequency: url === `${ORIGIN}/` || url === `${ORIGIN}/uk/` ? "weekly" : "monthly",
    ...(paired.has(url) ? { alternates: { languages: paired.get(url)! } } : {}),
  }));
}
