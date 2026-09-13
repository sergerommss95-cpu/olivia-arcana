import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Birth Chart — Your Natal Wheel | Olivia Arcana",
  description:
    "Date, hour, and place, drawn as an engraved wheel of houses — your full natal chart computed in the browser, with a plain-language decode.",
  alternates: { canonical: "https://oliviaarcana.com/portrait" },
  openGraph: {
    title: "The Birth Chart",
    description: "Your natal chart, drawn as an engraved wheel of houses.",
    url: "https://oliviaarcana.com/portrait",
  },
};

export default function PortraitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
