import type { Metadata } from "next";
import { shareMeta } from "@/lib/learn/share-meta";

const url = "https://oliviaarcana.com/account/billing/";
const description = "Manage your Olivia Arcana subscription and billing.";
export const metadata: Metadata = {
  title: "Billing and subscription | Olivia Arcana",
  description,
  alternates: { canonical: url },
  ...shareMeta({ title: "Billing and subscription", description, url, locale: "en", translated: false, type: "website" }),
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
