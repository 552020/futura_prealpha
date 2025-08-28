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

## Attempted Solutions

### 1. Dynamic Export (Partially Working)

```typescript
export const dynamic = "force-dynamic";
```

- **Status**: Applied to both pages
- **Result**: Still failing - Next.js still attempts prerendering

### 2. Dynamic Imports (Working)

```typescript
// Instead of: import { backendActor } from "@/ic/backend";
const { backendActor } = await import("@/ic/backend");
```

- **Status**: Applied to `/user/icp/page.tsx`
- **Result**: Fixed the ICP page, but signin page still has issues

## Remaining Issues

### Signin Page

The signin page still fails even with:

- `export const dynamic = 'force-dynamic'`
- Dynamic imports for ICP modules

### Possible Causes

1. **NextAuth Integration**: The signin page uses NextAuth which might be triggering static generation
2. **Import Chain**: Some imported module might be causing the issue
3. **Build Configuration**: Next.js build settings might be forcing static generation

## Next Steps

### Immediate Actions

1. **Apply Dynamic Imports**: Move all ICP imports to dynamic imports in signin page
2. **Check Import Chain**: Audit all imports in signin page for ICP-related modules
3. **NextAuth Configuration**: Check if NextAuth is configured to allow dynamic pages

### Investigation Needed

1. **Build Configuration**: Review `next.config.js` for static generation settings
2. **Module Analysis**: Identify which specific import is causing the actor creation
3. **NextAuth Integration**: Check if NextAuth provider configuration affects page generation

### Alternative Solutions

1. **Client-Only Pages**: Move ICP functionality to client-only components
2. **Build Exclusions**: Configure Next.js to exclude ICP pages from static generation
3. **Runtime Checks**: Add runtime checks to prevent ICP code execution in server environment

## Related Files

- `src/nextjs/src/ic/backend.ts` - ICP actor creation
- `src/nextjs/src/lib/ii-client.ts` - II integration functions
- `src/nextjs/src/app/[lang]/signin/page.tsx` - Failing signin page
- `src/nextjs/next.config.js` - Next.js configuration

## Priority

**High** - This blocks successful builds and deployment
