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
};

export default nextConfig;
