import type { Metadata, Viewport } from "next";
import { Cormorant, Cormorant_Garamond, IBM_Plex_Mono, Onest } from "next/font/google";
import localFont from "next/font/local";
import ClientShell from "@/components/ClientShell";
import { socialImages, socialImageUrls } from "@/lib/social-images";
import InteractivePerimeters from "@/components/InteractivePerimeters";
import "./globals.css";
import "./interactive-perimeter.css";

// Variable cut (wght 300–700, Latin + Cyrillic) — the display face whose
// weight responds to the reader's hand on the hero.
// Root-layout fonts preload on every route, including the homepage, which sets
// its own type. Only the small body face is preloaded; inner pages fetch the rest
// on first use (display: swap with metric-matched fallbacks).
const cormorantVar = Cormorant({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  style: ["normal"],
  display: "swap",
  preload: false,
});

const cormorant = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

// Keep the working variable font local so a Google-font fetch cannot block a build.
// DM Sans has no Cyrillic, so it carries no metric fallback of its own: an
// Arial-based fallback in the same stack would set Ukrainian text before Onest.
const dmSans = localFont({
  src: "./fonts/dm-sans-latin-variable.woff2",
  variable: "--font-body-latin",
  weight: "100 1000",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
});

// Ukrainian text: Onest, the reading experience's Cyrillic companion. Its
// unicode-range means English pages never download it.
const onest = Onest({
  variable: "--font-body-cyrillic",
  subsets: ["cyrillic"],
  display: "swap",
  preload: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Olivia Arcana — A personal practice of tarot",
  description:
    "Explore tarot with all 78 cards, a question of your own, and a private almanac for your reflections.",  keywords: [
    "tarot", "tarot readings", "tarot card meanings", "78 tarot cards",
    "tarot journal", "таро", "значення карт таро",
  ],
  metadataBase: new URL("https://oliviaarcana.com"),
  openGraph: {
    title: "Olivia Arcana — A different perspective",
    description: "Tarot readings, card meanings, and space to reflect on what matters to you.",
    type: "website",
    siteName: "Olivia Arcana",
    locale: "en_US",
    images: socialImages("en"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Olivia Arcana — A different perspective",
    description: "Choose a card, explore its meaning, and keep what you notice.",
    images: socialImageUrls("en"),
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
  themeColor: "#0b192a",
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
    "operatingSystem": "Web",
    "description": "Tarot readings and a private, device-local journal for reflection.",
    "inLanguage": ["en", "uk"],
    "featureList": ["78-card tarot deck", "Free one-, three-, five- and eight-card readings", "Card meanings", "Device-local reading journal"],
    "author": {
      "@type": "Organization",
      "name": "Olivia Arcana LLC",
      "url": "https://oliviaarcana.com"
    }
  };

  return (
    <html
      lang="en"
      // /uk/ pages are exported with lang="uk" (scripts/postbuild.mjs).
      suppressHydrationWarning
      className={`${cormorant.variable} ${cormorantVar.variable} ${dmSans.variable} ${onest.variable} ${ibmPlexMono.variable} antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {/* The homepage's first-frame script marks phones on <body> before hydration. */}
      <body className="min-h-screen" suppressHydrationWarning>
        {/* Skip to main content — accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Single client boundary for all global overlays + page transitions */}
        <ClientShell>
          {children}
        </ClientShell>
        <InteractivePerimeters />
      </body>
    </html>
  );
}
