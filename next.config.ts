import { withJuno } from "@junobuild/nextjs-plugin";
import type { NextConfig } from "next/dist/server/config";

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_JUNO_SATELLITE_ID: process.env.JUNO_SATELLITE_ID,
  },
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

const isDev = process.env.NODE_ENV === "development";

export default withJuno({
  nextConfig,
  juno: isDev ? { container: true } : undefined,
});
