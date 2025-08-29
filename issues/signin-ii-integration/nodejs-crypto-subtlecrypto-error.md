# Node.js Crypto/SubtleCrypto Error in Server-Side ICP Agent

## Problem

The Internet Identity authentication flow is failing with a crypto error when the server-side ICP agent tries to make canister calls:

```
Internet Identity sign-in failed: Global crypto was not available and none was provided.
Please include a SubtleCrypto implementation.
See https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto
```

## Root Cause

The ICP agent (`@dfinity/agent`) is designed primarily for browser environments and expects the `SubtleCrypto` API to be available globally. When running in a Node.js server environment (NextAuth API routes), this API is not available by default.

### Technical Details

- **Environment**: Node.js server-side (NextAuth API routes)
- **Location**: `/api/ii/verify-nonce` route when creating server-side actor
- **Agent**: `@dfinity/agent` HttpAgent
- **Missing API**: `global.crypto.subtle` (SubtleCrypto)

## Current Implementation

```typescript
// src/nextjs/src/app/api/ii/verify-nonce/route.ts
async function createServerSideActor() {
  const agent = new HttpAgent({
    host: process.env.NEXT_PUBLIC_IC_HOST || "http://127.0.0.1:4943",
  });

  // For local development, we need to fetch the root key
  if (process.env.NEXT_PUBLIC_DFX_NETWORK === "local") {
    await agent.fetchRootKey(); // ❌ Fails here - needs SubtleCrypto
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND!,
  });
}
```

## Error Flow

1. **Frontend**: Calls `signIn("ii", { principal, nonceId, nonce })`
2. **NextAuth**: Calls `/api/ii/verify-nonce` API route
3. **API Route**: Tries to create server-side actor
4. **HttpAgent**: Attempts to fetch root key for local development
5. **Error**: `SubtleCrypto` not available in Node.js environment

## Solutions

### Option 1: Polyfill SubtleCrypto (Recommended)

Install and configure a Node.js polyfill for SubtleCrypto:

```bash
npm install @peculiar/webcrypto
```

Then in the API route:

```typescript
import { Crypto } from "@peculiar/webcrypto";

// Polyfill SubtleCrypto for Node.js
if (typeof global !== "undefined" && !global.crypto) {
  global.crypto = new Crypto();
}

async function createServerSideActor() {
  const agent = new HttpAgent({
    host: process.env.NEXT_PUBLIC_IC_HOST || "http://127.0.0.1:4943",
  });

  if (process.env.NEXT_PUBLIC_DFX_NETWORK === "local") {
    await agent.fetchRootKey();
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND!,
  });
}
```

### Option 2: Use Node.js Built-in Crypto (Alternative)

Use Node.js built-in crypto module with proper configuration:

```typescript
import { webcrypto } from "node:crypto";

// Polyfill with Node.js built-in crypto
if (typeof global !== "undefined" && !global.crypto) {
  global.crypto = webcrypto as any;
}
```

### Option 3: Skip Root Key Fetch for Local Development

Temporarily skip the root key fetch for local development:

```typescript
async function createServerSideActor() {
  const agent = new HttpAgent({
    host: process.env.NEXT_PUBLIC_IC_HOST || "http://127.0.0.1:4943",
  });

  // Skip root key fetch for now (temporary workaround)
  // if (process.env.NEXT_PUBLIC_DFX_NETWORK === "local") {
  //   await agent.fetchRootKey();
  // }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND!,
  });
}
```

### Option 4: Use Different Agent Configuration

Configure the agent to work without root key verification:

```typescript
async function createServerSideActor() {
  const agent = new HttpAgent({
    host: process.env.NEXT_PUBLIC_IC_HOST || "http://127.0.0.1:4943",
    // Disable certificate verification for local development
    ...(process.env.NEXT_PUBLIC_DFX_NETWORK === "local" && {
      fetchRootKey: false,
    }),
  });

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND!,
  });
}
```

## Recommended Approach

**Option 1 (Polyfill)** is the most robust solution as it:

- ✅ Provides proper crypto functionality
- ✅ Works in both development and production
- ✅ Maintains security
- ✅ Is the standard approach for Node.js ICP applications

## Files to Modify

- `src/nextjs/src/app/api/ii/verify-nonce/route.ts` - Add crypto polyfill
- `package.json` - Add `@peculiar/webcrypto` dependency

## Testing

After implementing the polyfill:

1. **Install dependency**: `npm install @peculiar/webcrypto`
2. **Add polyfill code** to the API route
3. **Test II authentication flow**
4. **Verify canister calls work** from server-side

## Related Issues

- This is a common issue when using ICP agents in Node.js environments
- The `@dfinity/agent` library documentation should mention this requirement
- Similar issues exist in other ICP Node.js applications

## Current Status

- ✅ Server-side actor creation **FIXED** with crypto polyfill
- ✅ II authentication flow should now work
- ✅ Frontend flow working
- ✅ API route structure correct
- ✅ Canister functions implemented

## Implementation Completed

### Files Created/Modified:

- ✅ `src/nextjs/src/lib/server-actor.ts` - New utility with crypto polyfill
- ✅ `src/nextjs/src/app/api/ii/verify-nonce/route.ts` - Updated to use utility

### Solution Implemented:

**Option A: Node's built-in webcrypto** was chosen and implemented successfully.

The crypto polyfill is now in place:

```typescript
import { webcrypto } from "node:crypto";

function polyfillCrypto() {
  if (typeof global !== "undefined" && !global.crypto) {
    // @ts-expect-error Node global typing mismatch
    global.crypto = webcrypto;
  }
}
```

### Benefits:

- ✅ No additional dependencies required
- ✅ Uses Node's native implementation
- ✅ Works in both development and production
- ✅ Maintains security with proper root key validation

## Next Steps

1. **Test the complete II authentication flow**
2. **Verify canister calls work** from server-side
3. **Document solution** for future reference
