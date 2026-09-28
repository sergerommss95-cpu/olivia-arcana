import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/checkout/cancel/";
const description = "Checkout was cancelled and no payment was taken.";
export const metadata: Metadata = {
  title: "Checkout cancelled | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Checkout cancelled", description, url, locale: "en", translated: false, type: "website" }),
};

export default function CheckoutCancelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
