import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Olivia Arcana — Your Personal Astrologer & Tarot Reader",
  description:
    "Get personalized astrology readings based on real NASA planetary data. Daily horoscopes, tarot, compatibility reports, and transit alerts — powered by your exact birth chart.",
  keywords: [
    "astrology", "tarot", "horoscope", "birth chart", "natal chart",
    "compatibility", "zodiac", "daily horoscope", "personalized astrology",
  ],
  metadataBase: new URL("https://olivia-arcana.netlify.app"),
  openGraph: {
    title: "Olivia Arcana — Written in Your Stars",
    description: "Personalized astrology readings calculated from your exact planetary positions. Not templates — real cosmic guidance.",
    type: "website",
    siteName: "Olivia Arcana",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Olivia Arcana — Written in Your Stars",
    description: "Personalized cosmic readings from your exact planetary positions.",
  },
  robots: { index: true, follow: true },
  other: {
    "theme-color": "#04020d",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${cormorant.variable} antialiased`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
