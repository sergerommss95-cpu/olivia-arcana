import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import ClientShell from "@/components/ClientShell";
import GlobalGuide from "@/components/GlobalGuide";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  preload: true,
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
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Olivia Arcana — a tarot card showing the Wheel of Seven sigil, with the wordmark 'Olivia Arcana' in editorial italic typography",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olivia Arcana — Written in Your Stars",
    description: "Personalized cosmic readings from your exact planetary positions.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    // Standard favicon(s)
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/olive-mark.svg", type: "image/svg+xml" },
    ],
    // iOS home-screen + Mac launchpad
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    // Modern browsers — vector favicon takes precedence when supported
    shortcut: [{ url: "/favicon.ico" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Olivia Arcana",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#d4af37",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Olivia Arcana",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Web, iOS, Android",
    "description": "Hyper-personalized AI astrology and tarot platform based on real-time NASA planetary data.",
    "offers": {
      "@type": "Offer",
      "price": "4.99",
      "priceCurrency": "USD"
    },
    "featureList": [
      "NASA-grade natal chart calculation",
      "AI-driven tarot oracle readings",
      "Word-by-word cosmic typewriter interface",
      "Personalized daily almanacs",
      "Living deck tarot history"
    ],
    "author": {
      "@type": "Organization",
      "name": "Olivia Arcana LLC",
      "url": "https://oliviaarcana.com"
    }
  };

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <head>
        {/* Performance: preconnect to third-party domains used at hot paths */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.paddle.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://checkout.paddle.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.elevenlabs.io" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        {/* Skip to main content — accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Single client boundary for all global overlays + page transitions */}
        <ClientShell>
          {children}
          <GlobalGuide />
        </ClientShell>
      </body>
    </html>
  );
}
