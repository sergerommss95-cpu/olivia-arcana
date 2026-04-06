import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    root: "/Users/macbookpro/olivia-arcana/website",
  },
};

export default nextConfig;
