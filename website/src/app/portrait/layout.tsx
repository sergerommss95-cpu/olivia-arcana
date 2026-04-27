import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cosmic Portrait — Your Chart as a Poster | Olivia Arcana",
  description:
    "Your full natal chart rendered as a Greco-Roman gold poster on indigo. Shareable, printable, downloadable. Cinematic film-poster aesthetic.",
  alternates: { canonical: "https://oliviaarcana.com/portrait" },
  openGraph: {
    title: "Your Cosmic Portrait",
    description: "Your natal chart as a film-poster artifact.",
    url: "https://oliviaarcana.com/portrait",
  },
};

export default function PortraitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
