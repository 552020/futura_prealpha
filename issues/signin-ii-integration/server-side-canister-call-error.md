# Server-Side Canister Call Error in II Authentication

## Problem

The Internet Identity authentication flow is failing because we're trying to call `backendActor()` from the server-side NextAuth `authorize` function, but `backendActor()` is a client-side function.

### Error Details

```
Error: Attempted to call backendActor() from the server but backendActor is on the client.
It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
```

**Location**: `auth.ts:160` in the II CredentialsProvider `authorize` function

**Context**: The error occurs during the nonce verification step when trying to call the canister to verify the nonce proof.

## Root Cause

The issue is architectural - we're trying to call a client-side ICP actor from server-side NextAuth code. This violates Next.js's client/server boundary.

### Current Flow (Broken)

1. **Frontend**: Calls `signIn("ii", { principal, nonceId, nonce })`
2. **NextAuth Server**: Receives the request and calls `authorize(credentials)`
3. **Server Code**: Tries to call `backendActor().verify_nonce(nonce)` ❌
4. **Error**: `backendActor()` is client-side only

## Solutions

### Option 1: Server-Side Canister Actor (Recommended)

Create a server-side version of the backend actor that can be used in NextAuth:

```typescript
// Create a server-side actor factory
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "@/ic/declarations/backend/backend.did";

async function createServerSideActor() {
  const agent = new HttpAgent({
    host: process.env.NEXT_PUBLIC_IC_HOST || "http://127.0.0.1:4943",
  });

  // For server-side calls, we don't need authentication
  // The canister will verify the nonce proof without requiring caller authentication

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND!,
  });
}
```

### Option 2: HTTP API Endpoint

Create a dedicated API endpoint for nonce verification:

```typescript
// /api/ii/verify-nonce
export async function POST(request: Request) {
  const { nonce } = await request.json();

  // Call canister from server-side
  const actor = await createServerSideActor();
  const result = await actor.verify_nonce(nonce);

  return Response.json({ success: true, principal: result });
}
```

Then in `auth.ts`:

```typescript
// Instead of calling canister directly
const response = await fetch(`${process.env.NEXTAUTH_URL}/api/ii/verify-nonce`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nonce: nonceStr }),
});

const { principal: provedPrincipal } = await response.json();
```

### Option 3: Skip Canister Verification (Temporary)

For MVP, we could temporarily skip the canister verification and rely only on the nonce database validation:

```typescript
// In auth.ts authorize function
console.log("[II] authorize:skipping-canister-verification-for-mvp", { nonceId, principal });
// TODO: Implement proper canister verification
```

## Recommended Implementation

**Option 1** is the most robust solution as it maintains the security model while working within Next.js constraints.

### Implementation Steps

1. **Create server-side actor factory**
2. **Update auth.ts to use server-side actor**
3. **Test the complete flow**
4. **Add proper error handling**

## Security Considerations

- The server-side actor doesn't need authentication since we're verifying a nonce proof
- The canister's `verify_nonce` function should be designed to work without caller authentication
- We still maintain security through the nonce challenge-response mechanism

## Files to Modify

- `src/nextjs/auth.ts` - Update the authorize function
- `src/nextjs/src/lib/server-actor.ts` - New file for server-side actor
- `src/backend/src/lib.rs` - Ensure `verify_nonce` works without authentication

## Current Status

- ✅ II authentication server-side actor error **FIXED**
- ✅ Nonce verification implemented via API route
- ✅ Nonce generation and storage working
- ✅ Frontend flow working up to signIn call
- ✅ Backend API route `/api/ii/verify-nonce` created
- ✅ NextAuth updated to use API route instead of direct canister call

## Implementation Completed

### Files Created/Modified:

- ✅ `src/nextjs/src/app/api/ii/verify-nonce/route.ts` - New API route for nonce verification
- ✅ `src/nextjs/auth.ts` - Updated to use API route instead of direct canister call

### Solution Implemented:

**Option 2: HTTP API Endpoint** was chosen and implemented successfully.

The authentication flow now works as follows:

1. **Frontend**: Calls `/api/ii/challenge` → gets nonce
2. **Frontend**: Calls `register_with_nonce(nonce)` on canister
3. **Frontend**: Calls `signIn("ii", { principal, nonceId, nonce })`
4. **NextAuth**: Calls `/api/ii/verify-nonce` → verifies nonce with canister
5. **NextAuth**: Creates user session

This approach maintains security while working within Next.js constraints.
