# Juno Deployment Guide

This guide explains how to properly configure and deploy your Next.js application to Juno's smart contract hosting on the Internet Computer.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Static Export Requirements](#static-export-requirements)
- [Development vs Production](#development-vs-production)
- [Migration Strategy](#migration-strategy)
- [PostHog Integration](#posthog-integration)
- [TL;DR Reference](#tldr-reference)

## Configuration Files

### 1. `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Required for Juno's smart contract hosting
  images: {
    unoptimized: true, // Required for static export
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
```

### 2. `juno.config.mjs`

```javascript
import { defineConfig } from "@junobuild/config";

export default defineConfig({
  satellite: {
    ids: {
      development: "<DEV_SATELLITE_ID>",
      production: "<PROD_SATELLITE_ID>",
    },
    source: "out", // output directory of static export
    predeploy: ["pnpm run build"],
  },
});
```

## Static Export Requirements

Juno's smart contract hosting requires static exports because the Internet Computer doesn't support Server Side Rendering. This means:

- ✅ Static HTML/CSS/JS files
- ✅ Client-side rendering
- ❌ Server-side rendering (SSR)
- ❌ API routes
- ❌ Server components
- ❌ Rewrites
- ❌ Middleware

## Development vs Production

### Development Environment

- You can use `withJuno()` plugin for convenience
- Rewrites and API routes work locally
- Server components function normally
- Full Next.js features available

### Production Environment (Juno Hosting)

- Must use static export
- No server-side features
- Client-side only rendering
- No API routes or rewrites

## Migration Strategy

If you're moving from a server-side rendered app to static export, follow these steps:

1. **API Routes**

   - Move to a separate service
   - Consider using Juno's Datastore for data storage
   - Use client-side data fetching

2. **Server Components**

   - Convert to client components where possible
   - Use client-side data fetching
   - Implement proper loading states

3. **Authentication**

   - Use Juno's authentication system
   - Implement client-side auth flow
   - Handle session management in the browser

4. **Data Fetching**
   - Replace server-side data fetching with client-side
   - Implement proper loading states
   - Consider using SWR or React Query

## PostHog Integration

Since rewrites don't work with static export, you have several options for PostHog integration:

1. **Client-Side Initialization**

   ```typescript
   import posthog from "posthog-js";

   posthog.init("<YOUR_API_KEY>", {
     api_host: "https://eu.i.posthog.com",
   });
   ```

2. **Separate API Service**

   - Set up a separate service for PostHog
   - Use environment variables for configuration
   - Handle analytics through the separate service

3. **PostHog Proxy**
   - If available, use PostHog's proxy feature
   - Configure through environment variables
   - Handle analytics through the proxy

## TL;DR Reference

| Feature/Requirement | Status           | Notes                             |
| ------------------- | ---------------- | --------------------------------- |
| App Router          | ✅ Supported     | Use client components             |
| Static Export       | ✅ Required      | Must use `output: "export"`       |
| API Routes          | ❌ Not Supported | Move to separate service          |
| Server Components   | ❌ Not Supported | Convert to client components      |
| Rewrites            | ❌ Not Supported | Use client-side alternatives      |
| `withJuno()`        | ✅ Optional      | Useful in dev, not needed in prod |
| `juno.config.mjs`   | ✅ Required      | For deployment configuration      |
| Images              | ✅ Supported     | Must use `unoptimized: true`      |
| Authentication      | ✅ Supported     | Use Juno's auth system            |
| Analytics           | ✅ Supported     | Use client-side integration       |

## Additional Resources

- [Juno Documentation](https://docs.juno.build)
- [Next.js Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [Internet Computer Documentation](https://internetcomputer.org/docs/current/developer-docs/)
