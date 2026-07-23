import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

/** `npm run analyze` → set ANALYZE=true; laporan chunk dibuka setelah build. */
const nextConfig: NextConfig = {
  // Slim image for VPS Docker (sales compose profile `portal`)
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
