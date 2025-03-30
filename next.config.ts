import type { NextConfig } from "next/dist/server/config";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/images/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/ingest/:path*",
      },
      {
        source: "/:lang/ingest/:path*",
        destination: "https://eu.i.posthog.com/ingest/:path*",
      },
      {
        source: "/decide/:path*",
        destination: "https://eu.i.posthog.com/decide/:path*",
      },
      {
        source: "/:lang/decide/:path*",
        destination: "https://eu.i.posthog.com/decide/:path*",
      },
      {
        source: "/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/:lang/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
    ];
  },
};

export default nextConfig;
