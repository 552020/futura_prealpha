# Build Errors: ICP Actor Prerendering Issues

## Problem

The Next.js build is failing due to ICP actor creation during static generation/prerendering. The error occurs when pages that import ICP-related modules are being statically generated during build time.

## Error Details

```
Error occurred prerendering page "/en/signin". Read more: https://nextjs.org/docs/messages/prerender-error
Error: Invalid character: "."
    at <unknown> (.next/server/chunks/7477.js:1:9725)
    at b.decode (.next/server/chunks/7477.js:1:9835)
    at h.fromText (.next/server/chunks/7477.js:5:57049)
    at new q (.next/server/chunks/7477.js:5:15927)
    at m.createActor (.next/server/chunks/7477.js:5:19519)
```

## Root Cause

1. **Static Generation**: Next.js attempts to prerender pages during build time
2. **ICP Actor Creation**: Pages importing `backendActor` or other ICP modules trigger actor creation
3. **Server Environment**: ICP actors cannot be created in a server environment (no browser APIs)
4. **Principal Parsing**: The "Invalid character: '.'" error suggests issues with principal parsing in server context

## Affected Files

- `src/nextjs/src/app/[lang]/signin/page.tsx`
- `src/nextjs/src/app/[lang]/user/icp/page.tsx`
- Any other pages that import ICP modules

## Solution Implemented ✅

### Dynamic Imports Inside Functions

The key solution was to move **all ICP-related imports** from static imports at the top of files to **dynamic imports inside functions**:

```typescript
// ❌ BEFORE: Static imports at top level (causes build errors)
import { backendActor } from "@/ic/backend";
import { loginWithII } from "@/ic/ii";
import { fetchChallenge } from "@/lib/ii-client";

// ✅ AFTER: Dynamic imports inside functions (prevents build errors)
async function handleInternetIdentity() {
  const { loginWithII } = await import("@/ic/ii");
  const { fetchChallenge } = await import("@/lib/ii-client");
  const { registerWithNonce } = await import("@/lib/ii-client");

  // Use the imported functions...
}
```

### Additional Measures

1. **`"use client"` directive**: Ensures the component runs only on the client side
2. **`export const dynamic = "force-dynamic"`**: Prevents static generation (but not sufficient alone)
3. **Dynamic imports**: The actual solution that prevents ICP code from being evaluated during build

## Why This Works

- **Build Time**: No ICP code is evaluated during Next.js build/prerendering
- **Runtime**: ICP modules are only loaded when the functions are actually called
- **Client Only**: Ensures ICP actors are only created in browser environment
- **Lazy Loading**: Improves initial page load performance

## Files Modified

- ✅ `src/nextjs/src/app/[lang]/signin/page.tsx` - All ICP imports moved to dynamic imports
- ✅ `src/nextjs/src/app/[lang]/user/icp/page.tsx` - All ICP imports moved to dynamic imports

## Current Status

- ✅ Build errors resolved
- ✅ ICP functionality working in runtime
- ✅ No more "Invalid character: '.'" errors
- ✅ Pages load correctly in browser

## Key Takeaway

The solution was **not** just adding `export const dynamic = "force-dynamic"` (which we tried first), but rather **moving all ICP imports to dynamic imports inside functions**. This prevents any ICP code from being evaluated during the build process while still allowing full functionality at runtime.
