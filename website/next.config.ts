import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    qualities: [75, 100], unoptimized: true },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
