# Missing NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY Environment Variable

## Problem

Build fails with error:

```
Missing NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY
```

## Root Cause

The `NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY` environment variable is not set, which is required for the Internet Identity URL configuration in `next.config.ts`.

## Current Configuration

In `next.config.ts`, we have:

```typescript
const computedLocalIiUrl = process.env.NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY
  ? `http://${process.env.NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/`
  : undefined;
```

## Solution

1. **Local Development**: Set `NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY` in `.env.local`
2. **Production**: Set `NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY` in Vercel environment variables

## Steps to Fix

1. Copy `.env.local.example` to `.env.local` (if not already done)
2. Add the Internet Identity canister ID to `.env.local`
3. For production, add the variable to Vercel environment settings

## Related Files

- `src/nextjs/next.config.ts`
- `src/nextjs/.env.local.example`
- `src/nextjs/.env.local`
