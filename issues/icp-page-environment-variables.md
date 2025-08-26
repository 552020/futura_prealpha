# ICP Page Environment Variables Issue

## Actual Runtime Errors

When accessing the ICP page, the **Next.js server console** shows these 404 errors:

```
GET /api/v2/status 404 in 433ms
GET /api/v2/status 404 in 61ms
GET /api/v2/status 404 in 45ms
GET /api/v2/status 404 in 82ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 88ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 90ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 62ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 44ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 63ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 74ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 81ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 81ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 47ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 44ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 66ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 69ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 51ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 46ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state 404 in 65ms
POST /api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query 404 in 266ms
GET /api/v2/status 404 in 297ms
GET /api/v2/status 404 in 50ms
GET /api/v2/status 404 in 74ms
GET /api/v2/status 404 in 84ms
```

### Error Source Analysis

These errors are coming from:

1. **`/api/v2/status`** - ICP agent trying to check network status
2. **`/api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/read_state`** - ICP agent trying to read canister state
3. **`/api/v2/canister/uxrrr-q7777-77774-qaaaq-cai/query`** - ICP agent trying to query canister methods

The ICP agent is making these requests to Next.js, but Next.js doesn't have routes to handle these ICP API endpoints. These requests should be proxied to the DFX replica running on port 4943.

## Problem Description

The ICP page at `http://localhost:3001/en/user/icp` is failing because Next.js doesn't have a proxy configured to forward ICP API calls to the local DFX replica.

## Console Output Analysis

### Next.js Development Server Console

When running `npm run dev` in the Next.js submodule, we observed:

```
> futura_pre-alpha@0.1.0 dev
> next dev --turbopack
 ⚠ The config property `experimental.turbo` is deprecated. Move this setting to `config.turbopack` or run `npx @next/codemod@latest next-experimental-turbo-to-turbopack .`
 ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /Users/stefano/Documents/Code/Futura/futura_alpha_icp/package-lock.json as the root directory.
 To silence this warning, set `turbopack.root` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
   See https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory for more information.
 Detected additional lockfiles:
   * /Users/stefano/Documents/Code/Futura/futura_alpha_icp/src/nextjs/pnpm-lock.yaml
 ⚠ Port 3000 is in use by process 35869, using available port 3001 instead.
   ▲ Next.js 15.5.0 (Turbopack)
   - Local:        http://localhost:3001
   - Network:      http://172.16.40.93:3001
   - Environments: .env.local
   - Experiments (use with caution):
     · turbo
 ✓ Starting...
 ✓ Compiled middleware in 150ms
 ✓ Ready in 1288ms
```

### Key Observations

1. **Environment Detection**: Next.js detected `.env.local` but the file doesn't exist
2. **Port Conflict**: Port 3000 was in use, so it switched to 3001
3. **Workspace Warning**: Multiple lockfiles detected (root `package-lock.json` vs submodule `pnpm-lock.yaml`)
4. **Turbopack Deprecation**: `experimental.turbo` config is deprecated

### Missing Error Information

**Note**: We didn't see the actual runtime errors because:

- The Next.js server started successfully
- We didn't navigate to the ICP page to trigger the environment variable errors
- The errors would appear in the browser console, not the server console

## Root Cause Analysis

### Missing Environment Variables

The AST-based fix script successfully transformed the declarations, but the environment variables are undefined:

1. **`NEXT_PUBLIC_CANISTER_ID_BACKEND`** - Required for backend canister connection
2. **`NEXT_PUBLIC_CANISTER_ID_FRONTEND`** - Required for frontend canister connection
3. **`NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY`** - Required for internet_identity canister connection
4. **`NEXT_PUBLIC_DFX_NETWORK`** - Required for network configuration

### Current State

- ✅ AST script successfully fixed declarations
- ✅ Canisters deployed and running
- ✅ Canister IDs available:
  - `backend`: `uxrrr-q7777-77774-qaaaq-cai`
  - `frontend`: `u6s2n-gx777-77774-qaaba-cai`
  - `internet_identity`: `uzt4z-lp777-77774-qaabq-cai`
- ❌ **Environment variables not set in Next.js**

### Error Pattern

When the ICP page loads, it tries to import:

```javascript
import { backend } from "@/ic/declarations/backend";
```

The backend declaration contains:

```javascript
export const canisterId = process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND;
```

Since `process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND` is `undefined`, the `backend` actor creation fails.

## Impact

- ICP page cannot connect to backend canister
- User interactions (like the "Click Me!" button) will fail
- No error handling for missing environment variables

## Required Solution

1. **Create `.env.local` file** in `src/nextjs/` with:

   ```
   NEXT_PUBLIC_CANISTER_ID_BACKEND=uxrrr-q7777-77774-qaaaq-cai
   NEXT_PUBLIC_CANISTER_ID_FRONTEND=u6s2n-gx777-77774-qaaba-cai
   NEXT_PUBLIC_CANISTER_ID_INTERNET_IDENTITY=uzt4z-lp777-77774-qaabq-cai
   NEXT_PUBLIC_DFX_NETWORK=local
   ```

2. **Add error handling** in the ICP page for missing environment variables

3. **Consider automation** - the deploy script could potentially generate the `.env.local` file automatically

## Environment

- Next.js running on port 3001
- DFX local network running
- Canisters successfully deployed
- AST fixes applied correctly
