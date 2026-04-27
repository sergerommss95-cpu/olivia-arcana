import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oracle Letter — Your Reading, Sealed in Wax | Olivia Arcana",
  description:
    "A printable, ceremonial reading document. Wax-seal opening, drop-cap typography, full reading rendered as a keepsake letter.",
  alternates: { canonical: "https://oliviaarcana.com/oracle-letter" },
  openGraph: {
    title: "Oracle Letter",
    description: "Your reading, as a sealed letter.",
    url: "https://oliviaarcana.com/oracle-letter",
  },
};

export default function OracleLetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
