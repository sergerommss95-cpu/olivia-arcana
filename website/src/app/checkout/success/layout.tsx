import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/checkout/success/";
const description = "Confirmation of your Olivia Arcana order.";
export const metadata: Metadata = {
  title: "Order confirmation | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Order confirmation", description, url, locale: "en", translated: false, type: "website" }),
};

export default function CheckoutSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
