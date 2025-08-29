# ICP API Proxy Configuration for Production

## Problem Statement

We need to configure Next.js to proxy ICP API requests (`/api/v2/*`) to the DFX server, but this creates production deployment challenges.

## Current Situation

### Development Setup

- **Vite config** (from standard DFX project) proxies `/api` requests to `http://127.0.0.1:4943`
- **Next.js** needs similar proxy configuration for ICP agent communication
- **ICP agent** makes hardcoded `/api/v2/*` requests that we cannot control

### Current Next.js Proxy Implementation

```javascript
// next.config.ts
async rewrites() {
  return [
    // ... other rewrites
    {
      source: "/api/v2/:path*",
      destination: "http://127.0.0.1:4943/api/v2/:path*", // ❌ Hardcoded localhost
    },
  ];
}
```

## Critical Issues

### 1. Hardcoded Route Problem

- **ICP agent** uses hardcoded `/api/v2/*` routes (we cannot change this)
- **Route control** is in `@dfinity/agent` library, not our application
- **No flexibility** to use different API paths

### 2. Production Deployment Problem

- **Hardcoded localhost:4943** will break in production
- **No DFX server** in production environment
- **ICP agent** needs to communicate with actual Internet Computer network

## Questions for ICP Expert

1. **How does ICP agent work in production?**

   - Does it automatically detect environment and route to IC network?
   - What happens when `DFX_NETWORK` is set to `"ic"` vs `"local"`?
   - Do we need different proxy configurations for different environments?

2. **Environment-based routing:**
   - Should proxy only run in development mode?
   - How does the agent handle local vs production canister communication?
   - What's the correct production setup for ICP integration?

## Questions for Senior Developer

1. **Next.js proxy strategy:**

   - How to implement environment-based proxy configuration?
   - Should we use conditional rewrites based on `NODE_ENV`?
   - Alternative approaches: middleware, API routes, or external proxy?

2. **Production architecture:**
   - How to handle the transition from local DFX to production IC?
   - Should we maintain separate configs for dev/staging/prod?
   - Security implications of proxying external requests?

## Proposed Solutions

### Option 1: Environment-based Proxy

```javascript
async rewrites() {
  const rewrites = [
    // ... existing rewrites
  ];

  // Only proxy in development
  if (process.env.NODE_ENV === 'development') {
    rewrites.push({
      source: "/api/v2/:path*",
      destination: "http://127.0.0.1:4943/api/v2/:path*",
    });
  }

  return rewrites;
}
```

### Option 2: Environment Variable Configuration

```javascript
async rewrites() {
  const rewrites = [
    // ... existing rewrites
  ];

  // Proxy based on DFX_NETWORK environment variable
  if (process.env.DFX_NETWORK === 'local') {
    rewrites.push({
      source: "/api/v2/:path*",
      destination: `${process.env.DFX_HOST || 'http://127.0.0.1:4943'}/api/v2/:path*`,
    });
  }

  return rewrites;
}
```

## Related Issues

- [ICP Page Environment Variables Issue](./icp-page-environment-variables.md) - Original 404 errors and environment setup
- [Import ICP Frontend Configuration](./import-icp-frontend-config.md) - Vite proxy configuration reference

## Expert Answers

### Senior Developer Answer

**Short answer:** Don't proxy `/api/v2` in production. Point the agent at an IC boundary host and you're done. Only proxy in dev (if you want same-origin to your local replica).

### ICP Expert Answer

**Environment Detection & Routing:**  
The ICP JavaScript agent determines which network to use (local or mainnet) based on the `host` parameter you provide when constructing the agent. In development, you typically set `host` to `http://127.0.0.1:4943` (the local DFX server). In production, you set it to the mainnet gateway, such as `https://ic0.app` or `https://icp-api.io`. The agent does **not** automatically detect the environment; you must configure it explicitly in your code or via environment variables.

**DFX_NETWORK Behavior:**

- If `DFX_NETWORK` is `"local"`, you should point the agent to your local DFX server.
- If `DFX_NETWORK` is `"ic"`, you should point the agent to the mainnet gateway.
- The agent itself does not read `DFX_NETWORK`; your application logic should use this variable to set the correct `host` for the agent.

**Proxy Configuration:**  
You only need a proxy (e.g., `/api/v2/*` to `localhost:4943`) in development, when your frontend and DFX server are running separately. In production, your frontend should communicate directly with the Internet Computer's public gateways (e.g., `ic0.app` or `icp0.io`), and no proxy is needed.

**Production Setup:**  
In production, do **not** proxy `/api/v2/*` to localhost. Instead, ensure your agent is configured to use the public IC gateway. The agent will then make requests directly to the Internet Computer network.

**Security Implications:**  
In production, do **not** proxy requests through your server; let the browser communicate directly with the IC gateway for best security and performance.

## How it actually works

- `@dfinity/agent` sends requests to `host + /api/v2/*`.
- It does not auto-switch networks. You control the `host`.
- Local dev needs `agent.fetchRootKey()`; mainnet (`ic`) must not.
- IC boundary hosts you can use in prod: `https://icp-api.io` (recommended) or `https://ic0.app`. CORS is open; no Next.js proxy needed.

## Recommended setup

### Environment Variables

```
# Dev
NEXT_PUBLIC_DFX_NETWORK=local
NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943

# Prod
NEXT_PUBLIC_DFX_NETWORK=ic
NEXT_PUBLIC_IC_HOST=https://icp-api.io
```

### Generated Declarations Tweak

Do this in your post-generate fix script once:

```typescript
// declarations/*/index.js (or .ts)
// 1) ensure process.env.* are not quoted (you already fix this)
// 2) inject host selection

export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND; // etc.

export const createActor = (canisterId, options = {}) => {
  const host =
    process.env.NEXT_PUBLIC_IC_HOST ??
    (process.env.NEXT_PUBLIC_DFX_NETWORK === "ic" ? "https://icp-api.io" : "http://127.0.0.1:4943");

  const agent = new HttpAgent({
    host,
    ...(options.agentOptions || {}),
  });

  if (process.env.NEXT_PUBLIC_DFX_NETWORK !== "ic") {
    // Local replica certs
    agent.fetchRootKey().catch((err) => {
      console.warn("Unable to fetch root key; is local replica running?");
      console.error(err);
    });
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...(options.actorOptions || {}),
  });
};
```

### Next.js Rewrites

- **Dev:** optional. If you prefer same-origin to the local replica, keep a conditional rewrite:

  ```typescript
  // next.config.ts
  async rewrites() {
    const r = [];
    if (process.env.NEXT_PUBLIC_DFX_NETWORK === "local") {
      r.push({
        source: "/api/v2/:path*",
        destination: `${process.env.NEXT_PUBLIC_IC_HOST || "http://127.0.0.1:4943"}/api/v2/:path*`,
      });
    }
    return r;
  }
  ```

- **Prod:** none. Let the browser call `https://icp-api.io/api/v2/*` directly via the agent.

## Answers to your questions

1. **Production behavior:** the agent uses whatever `host` you pass. `DFX_NETWORK` is just your own switch; it doesn't "auto-route."
2. **Proxy only in development** (if you want); in production call the IC boundary host directly.
3. **Separate configs:** yes—dev vs prod env vars as above.
4. **Security:** avoid a prod blind proxy for `/api/v2`; it widens your attack surface and adds latency for no gain.

This keeps Vercel/Next.js simple, avoids brittle rewrites in prod, and aligns with how the agent is meant to be used.

## TODO List

### 1. Update Environment Variables

- [ ] Add `NEXT_PUBLIC_IC_HOST` to environment configuration
- [ ] Set up dev environment: `NEXT_PUBLIC_DFX_NETWORK=local`, `NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943`
- [ ] Set up prod environment: `NEXT_PUBLIC_DFX_NETWORK=ic`, `NEXT_PUBLIC_IC_HOST=https://icp-api.io`

### 2. Update AST Fix Script

- [ ] Modify `scripts/fix-declarations.cjs` to inject host selection logic
- [ ] Update `createActor` function to use `NEXT_PUBLIC_IC_HOST` environment variable
- [ ] Add conditional `fetchRootKey()` based on `NEXT_PUBLIC_DFX_NETWORK`

### 3. Update Next.js Configuration

- [ ] Make proxy conditional based on `NEXT_PUBLIC_DFX_NETWORK === "local"`
- [ ] Remove hardcoded localhost:4943
- [ ] Use `NEXT_PUBLIC_IC_HOST` environment variable for destination

### 4. Testing

- [ ] Test development setup with local DFX replica
- [ ] Test production setup with IC boundary host
- [ ] Verify no proxy in production environment

### 5. Documentation

- [ ] Update deployment documentation with environment variable requirements
- [ ] Document the difference between dev and prod ICP communication
- [ ] Add troubleshooting guide for common issues
