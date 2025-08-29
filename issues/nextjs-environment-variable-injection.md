# Next.js Environment Variable Injection for ICP Integration

## Problem

We need to integrate an ICP (Internet Computer) frontend with our Next.js application. The ICP project uses Vite with `vite-plugin-environment` to inject environment variables with specific prefixes into the browser.

## Current Vite Setup

```js
plugins: [react(), environment("all", { prefix: "CANISTER_" }), environment("all", { prefix: "DFX_" })];
```

This automatically makes all environment variables starting with `CANISTER_` and `DFX_` available in the browser as `import.meta.env.CANISTER_ID_BACKEND`, etc.

## DFX-Generated Environment Variables

The ICP project generates a `.env` file with variables like:

```bash
CANISTER_ID_BACKEND='uxrrr-q7777-77774-qaaaq-cai'
DFX_NETWORK='local'
CANISTER_ID_INTERNET_IDENTITY='uzt4z-lp777-77774-qaabq-cai'
```

## Next.js Challenge

Next.js only exposes environment variables with `NEXT_PUBLIC_` prefix to the browser. We need to:

1. **Read the external `.env`** (already done with dotenv in `next.config.ts`)
2. **Transform variables** from `CANISTER_`/`DFX_` prefixes to `NEXT_PUBLIC_` prefix
3. **Make them available** to the browser for ICP canister communication

## Questions for Senior Developer

1. **Best approach** for transforming environment variables in Next.js?
2. **Build-time vs runtime** - when should this transformation happen?
3. **Security considerations** - any risks with exposing these variables?
4. **Alternative solutions** - is there a better way to handle this?

## Current Status

- External `.env` loading: ✅ Done
- Environment variable transformation: ❌ Need solution
- Browser availability: ❌ Need solution

## Priority

High - This is blocking ICP frontend integration.

## Solution (From Senior Developer)

### Recommended Approach: Option A - Build-time transform in `next.config.ts`

```ts
// next.config.ts
import type { NextConfig } from "next";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

const root = process.cwd();
const ICP_ENV_PATH = path.join(root, "..", "icp-app", ".env");

if (fs.existsSync(ICP_ENV_PATH)) {
  dotenv.config({ path: ICP_ENV_PATH });
}

const ICP_PREFIXES = ["CANISTER_", "DFX_"];

// Map CANISTER_/DFX_ → NEXT_PUBLIC_*
const publicEnvEntries = Object.entries(process.env)
  .filter(([key]) => ICP_PREFIXES.some((p) => key.startsWith(p)))
  .map(([key, val]) => [`NEXT_PUBLIC_${key}`, String(val ?? "")]);

const passthroughEntries = Object.entries(process.env)
  .filter(([key]) => key.startsWith("NEXT_PUBLIC_"))
  .map(([key, val]) => [key, String(val ?? "")]);

const env: Record<string, string> = Object.fromEntries([...passthroughEntries, ...publicEnvEntries]);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env,
};

export default nextConfig;
```

### Usage in Browser

```ts
const backendCanisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;
const dfxNetwork = process.env.NEXT_PUBLIC_DFX_NETWORK;
```

### Key Benefits

- ✅ Zero extra tooling in runtime
- ✅ Works with app router and pages router
- ✅ Clear audit surface
- ✅ Production-friendly

### Security Notes

- **Safe to expose**: canister IDs, network names (public identifiers)
- **Do NOT expose**: secrets, admin tokens, private keys, API keys

## Status

✅ **RESOLVED** - Solution provided by senior developer
