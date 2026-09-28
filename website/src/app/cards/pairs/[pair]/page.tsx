import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlmanacShell from "@/components/almanac/AlmanacShell";
import PairPage, { cardName } from "@/components/academy/PairPage";
import { allPairs, pairBySlug } from "@/lib/academy/pairs";
import { ALL_CARDS } from "@/lib/academy/tarot-cards";
import { getCardImagePath } from "@/lib/academy/card-images";

export function generateStaticParams() {
  return allPairs().map((pair) => ({ pair: pair.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const pair = pairBySlug((await params).pair);
  if (!pair) return {};
  const title = `${cardName(pair.a, "en")} and ${cardName(pair.b, "en")}: Reading the Two Cards Together | Olivia Arcana`;
  const text = pair.readings[0].en;
  const description = text.length > 155 ? text.slice(0, 154).replace(/\s+\S*$/, "") + "…" : text;
  const url = `https://oliviaarcana.com/cards/pairs/${pair.slug}/`;
  return {
    title, description,
    alternates: { canonical: url, languages: { en: url, uk: `https://oliviaarcana.com/uk/cards/pairs/${pair.slug}/`, "x-default": url } },
    openGraph: { title, description, url, type: "article", images: [{ url: `https://oliviaarcana.com${getCardImagePath(ALL_CARDS[pair.a])}`, width: 896, height: 1536 }] },
  };
}

export default async function PairRoute({ params }: { params: Promise<{ pair: string }> }) {
  const pair = pairBySlug((await params).pair);
  if (!pair) notFound();
  return <AlmanacShell><PairPage pair={pair} locale="en" /></AlmanacShell>;
}
