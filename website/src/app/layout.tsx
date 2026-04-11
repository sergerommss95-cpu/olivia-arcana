import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import GlobalBackground from "@/components/GlobalBackground";
import SoundEngine from "@/components/SoundEngine";
import CosmicCursor from "@/components/CosmicCursor";
import CosmicIndicators from "@/components/CosmicIndicators";
import AmbientSound from "@/components/AmbientSound";
import CosmicToast from "@/components/CosmicToast";
import EclipseOverlay from "@/components/EclipseOverlay";
import InstallPrompt from "@/components/InstallPrompt";
import SmoothScroll from "@/components/SmoothScroll";
import PageTransition from "@/components/transitions/PageTransition";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Olivia Arcana — Your Personal Astrologer & Tarot Reader",
  description:
    "Get personalized astrology readings based on real NASA planetary data. Daily horoscopes, tarot, compatibility reports, and transit alerts — powered by your exact birth chart.",
  keywords: [
    "astrology", "tarot", "horoscope", "birth chart", "natal chart",
    "compatibility", "zodiac", "daily horoscope", "personalized astrology",
  ],
  metadataBase: new URL("https://oliviaarcana.com"),
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
  manifest: "/manifest.json",
  other: {
    "theme-color": "#060810",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
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
      className={`${cormorant.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        {/* Skip to main content — accessibility */}
        <a href="#main-content" style={{
          position: "absolute", top: "-100px", left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "0.75rem 1.5rem", borderRadius: "0 0 8px 8px",
          background: "var(--c-gold)", color: "var(--c-void)", fontSize: "0.85rem",
          textDecoration: "none", transition: "top 0.2s",
        }} className="focus:top-0">
          Skip to main content
        </a>

        {/* Layer 0 — The Void (persistent WebGL) */}
        <GlobalBackground />

        {/* Eclipse/astronomical event visual overlay */}
        <EclipseOverlay />

        {/* Layer 3 — Custom Cursor (desktop only) */}
        <CosmicCursor />

        {/* Layer 4 — Sound systems */}
        <SoundEngine />
        <AmbientSound />

        {/* Live indicators — Moon Phase + Planetary Hour */}
        <CosmicIndicators />

        {/* Daily cosmic toast notification */}
        <CosmicToast />

        {/* PWA install prompt */}
        <InstallPrompt />

        {/* Smooth scroll (Lenis) */}
        <SmoothScroll />

        {/* Page content — with transition choreography */}
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
