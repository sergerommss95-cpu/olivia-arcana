import { shareMeta } from "@/lib/learn/share-meta";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import UkrainianLibraryShell from "../../library-shell";
import PairPage, { cardName } from "@/components/academy/PairPage";
import { allPairs, pairBySlug } from "@/lib/academy/pairs";

export function generateStaticParams() {
  return allPairs().map((pair) => ({ pair: pair.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const pair = pairBySlug((await params).pair);
  if (!pair) return {};
  const title = `${cardName(pair.a, "uk")} і ${cardName(pair.b, "uk")}: як читати дві карти разом | Olivia Arcana`;
  const text = pair.readings[0].uk;
  const description = text.length > 155 ? text.slice(0, 154).replace(/\s+\S*$/, "") + "…" : text;
  const url = `https://oliviaarcana.com/uk/cards/pairs/${pair.slug}/`;
  return { title, description, alternates: { canonical: url, languages: { en: `https://oliviaarcana.com/cards/pairs/${pair.slug}/`, uk: url, "x-default": `https://oliviaarcana.com/cards/pairs/${pair.slug}/` } },
    ...shareMeta({ title, description, url, locale: "uk", cardId: pair.a, alt: `${cardName(pair.a, "uk")} — колода Olivia Arcana` }) };
}

export default async function UkrainianPairRoute({ params }: { params: Promise<{ pair: string }> }) {
  const pair = pairBySlug((await params).pair);
  if (!pair) notFound();
  return <UkrainianLibraryShell englishPath={`/cards/pairs/${pair.slug}/`}><PairPage pair={pair} locale="uk" /></UkrainianLibraryShell>;
}
