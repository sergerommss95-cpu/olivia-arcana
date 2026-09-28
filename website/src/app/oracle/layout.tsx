import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/oracle/";
const description = "Bring a question to the dealing table and lay out anything from three cards to the Celtic Cross.";
export const metadata: Metadata = {
  title: "Ask the Oracle: From Three Cards to the Celtic Cross | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Ask the Oracle", description, url, locale: "en", cardId: 2, alt: "The High Priestess from the Olivia Arcana deck", translated: false, type: "website" }),
};

export default function OracleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
