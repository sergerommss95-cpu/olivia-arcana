import type { Metadata } from "next";

// Account and checkout are paused until those services are verified.
// Their placeholder pages stay reachable but out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function PausedServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
