import type { NextConfig } from "next/dist/server/config";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load external .env file from parent directory (hacky multi-repo setup for local development)
// This reads canister addresses and DFX configuration from the ICP project's root .env
const root = process.cwd();
const ICP_ENV_PATH = path.join(root, "..", "..", ".env");

console.log("🔍 Next.js config - Checking for external .env file:");
console.log("  Root directory:", root);
console.log("  Looking for .env at:", ICP_ENV_PATH);
console.log("  File exists:", fs.existsSync(ICP_ENV_PATH));

if (fs.existsSync(ICP_ENV_PATH)) {
  console.log("  ✅ Loading external .env file");
  dotenv.config({ path: ICP_ENV_PATH });
} else {
  console.log("  ❌ External .env file not found");
}

// Transform CANISTER_ and DFX_ variables to NEXT_PUBLIC_ for browser access
const ICP_PREFIXES = ["CANISTER_", "DFX_"];

// Map CANISTER_/DFX_ → NEXT_PUBLIC_*
const publicEnvEntries = Object.entries(process.env)
  .filter(([key]) => ICP_PREFIXES.some((p) => key.startsWith(p)))
  .map(([key, val]) => [`NEXT_PUBLIC_${key}`, String(val ?? "")]);

// Keep existing NEXT_PUBLIC_ variables
const passthroughEntries = Object.entries(process.env)
  .filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
  .map(([key, val]) => [key, String(val ?? "")]);

console.log("🔍 Next.js config - Environment variable processing:");
console.log("  ICP prefixes:", ICP_PREFIXES);
console.log(
  "  Found ICP variables:",
  Object.keys(process.env).filter((key) => ICP_PREFIXES.some((p) => key.startsWith(p)))
);
console.log("  Public env entries:", publicEnvEntries);
console.log("  Passthrough entries:", passthroughEntries);

const env: Record<string, string> = Object.fromEntries([...passthroughEntries, ...publicEnvEntries]);

const POSTHOG_INGEST_DOMAIN = process.env.NEXT_PUBLIC_POSTHOG_INGEST || "https://eu.i.posthog.com";
const POSTHOG_ASSETS_DOMAIN = process.env.NEXT_PUBLIC_POSTHOG_ASSETS || "https://eu-assets.i.posthog.com";

const nextConfig: NextConfig = {
  env,
  experimental: {
    turbo: {
      resolveAlias: {
        declarations: path.join(__dirname, "src/ic/declarations"),
        "@dfinity/agent": "./node_modules/@dfinity/agent",
        "@dfinity/principal": "./node_modules/@dfinity/principal",
        "@dfinity/candid": "./node_modules/@dfinity/candid",
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // keep generated imports working
      declarations: path.join(__dirname, "src/ic/declarations"),
      // ensure a single instance of these packages
      "@dfinity/agent": require.resolve("@dfinity/agent"),
      "@dfinity/principal": require.resolve("@dfinity/principal"),
      "@dfinity/candid": require.resolve("@dfinity/candid"),
    };
    return config;
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

export default nextConfig;

/*
 * ICP Integration Note:
 *
 * This configuration loads environment variables from ../../.env to support a hacky multi-repo setup
 * for local development. The external .env file contains:
 * - CANISTER_ID values (canister addresses on the Internet Computer)
 * - DFX_NETWORK configuration (local/mainnet)
 * - Other DFX-specific variables needed for ICP development
 *
 * In a proper production setup, these values would be managed through proper environment
 * variable injection rather than reading from a sibling project's .env file.
 */

/*
 * Environment Variable Transformation for ICP Integration:
 *
 * DFX (Internet Computer development framework) auto-generates a .env file with variables like:
 * - CANISTER_ID_BACKEND='uxrrr-q7777-77774-qaaaq-cai'
 * - DFX_NETWORK='local'
 * - CANISTER_ID_INTERNET_IDENTITY='uzt4z-lp777-77774-qaabq-cai'
 *
 * Vite has a nice solution with vite-plugin-environment that automatically makes CANISTER_ and DFX_
 * prefixed variables available in the browser. However, Next.js requires the NEXT_PUBLIC_ prefix
 * to expose environment variables to the client-side code.
 *
 * This configuration transforms CANISTER_ and DFX_ variables to NEXT_PUBLIC_ equivalents,
 * making them available in the browser for ICP canister communication while maintaining
 * Next.js security practices.
 *
 * Alternative: DFX can be configured to generate variables with NEXT_PUBLIC_ prefix directly
 * using the env_override option in dfx.json declarations configuration.
 *
 * Webpack Configuration for ICP Declarations:
 *
 * The webpack configuration maps "declarations" imports to the src/ic/declarations directory
 * where ICP declaration files are copied. This allows imports like:
 * import { backend } from "declarations/backend";
 *
 * IMPORTANT: These imports are AUTO-GENERATED by DFX from the Rust backend canister code.
 * The declaration files contain TypeScript interfaces that are automatically created from
 * the Candid interface definitions. You cannot manually create these files - they must
 * be generated by running `dfx generate` in the ICP project.
 *
 * The dedupe configuration prevents multiple versions of @dfinity/agent library,
 * which can cause conflicts in the browser.
 */
