import { withJuno } from "@junobuild/nextjs-plugin";
import type { NextConfig } from "next/dist/server/config";

const POSTHOG_INGEST_DOMAIN = process.env.NEXT_PUBLIC_POSTHOG_INGEST || "https://eu.i.posthog.com";
const POSTHOG_ASSETS_DOMAIN = process.env.NEXT_PUBLIC_POSTHOG_ASSETS || "https://eu-assets.i.posthog.com";

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
        destination: `${POSTHOG_INGEST_DOMAIN}/ingest/:path*`,
      },
      {
        source: "/decide/:path*",
        destination: `${POSTHOG_INGEST_DOMAIN}/decide/:path*`,
      },
      {
        source: "/static/:path*",
        destination: `${POSTHOG_ASSETS_DOMAIN}/static/:path*`,
      },
    ];
  },
};

const isDev = process.env.NODE_ENV === "development";

export default withJuno({
  nextConfig,
  juno: isDev ? { container: true } : undefined,
});
