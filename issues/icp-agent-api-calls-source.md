# ICP Agent API Calls Source Investigation

## Problem

The Next.js application is making `/api/v2/*` calls to localhost:3000 even though we created a custom agent to avoid proxy issues.

## Observed Calls

When loading the ICP page, the following console output is observed:

```
InterfaceProvider Debug: {pathname: '/en/user/icp', isAppRoute: true, newMode: 'app', userRole: undefined, isDeveloper: false, ...} interface-context.tsx:53
Initializing PostHog with:
Key: undefined
Host: undefined
⚠️ ❌ No PostHog key found. Skipping init. hook.js:608
Capturing pageview: http://localhost:3000/en/user/icp posthog-provider.tsx:50
[Vercel Web Analytics] Debug mode is enabled by default in development. No requests will be sent to the server. script.debug.js:1
[Vercel Web Analytics] [pageview] http://localhost:3000/en/user/icp script.debug.js:1
{o: 'http://localhost:3000/en/user/icp', sv: '0.1.3', sdkn: '@vercel/analytics/react', sdkv: '1.5.0', ts: 1756234736119, ...}
► Fetch finished loading: GET "http://localhost:3000/api/v2/status". index.ts:1296
[Fast Refresh] rebuilding turbopack-hot-reloader-common.ts:43
[Fast Refresh] done in 321ms report-hmr-latency.ts:26
► Fetch finished loading: GET "http://localhost:3000/api/auth/session". layout.tsx:87
InterfaceProvider Debug: {pathname: '/en/user/icp', isAppRoute: true, newMode: 'app', userRole: 'admin', isDeveloper: true, ...} interface-context.tsx:53
[Fast Refresh] rebuilding turbopack-hot-reloader-common.ts:43
► Fetch finished loading: GET "http://localhost:3000/api/auth/session". client.js:32
[Fast Refresh] done in 220ms report-hmr-latency.ts:26
[Fast Refresh] rebuilding turbopack-hot-reloader-common.ts:43
[Fast Refresh] done in 192ms report-hmr-latency.ts:26
```

**Key observation:** The call `GET "http://localhost:3000/api/v2/status".` originating from `index.ts:1296` is the ICP-related call we're investigating.

## Current Setup

- ✅ Custom agent implementation in `src/ic/agent.ts`
- ✅ Custom backend actor in `src/ic/backend.ts`
- ✅ ICP page uses `backendActor()` instead of auto-generated declarations
- ❌ Still getting `/api/v2/*` calls

## Investigation Results

1. **No direct imports** of auto-generated declarations found
2. **No other components** using ICP libraries
3. **Node modules search** - no `/api/v2` references found in `@dfinity/agent`
4. **Custom agent** should be using `NEXT_PUBLIC_IC_HOST` environment variable

## Questions for Senior Developer & ICP Expert

1. **Where are these calls coming from?**

   - Are they from `@dfinity/agent` library initialization?
   - Are they from browser network layer?
   - Are they from some other library?

2. **Why is the custom agent still making these calls?**

   - Should `HttpAgent.create()` not make these calls?
   - Is there a configuration we're missing?

3. **How to properly configure the agent to avoid these calls?**
   - Should we use a different host configuration?
   - Do we need to disable certain agent features?

## Environment

- Next.js running on localhost:3001
- DFX local replica on port 4943
- Custom agent with `NEXT_PUBLIC_IC_HOST=http://127.0.0.1:4943`

## Expected Behavior

The custom agent should make calls directly to `http://127.0.0.1:4943/api/v2/*` instead of `localhost:3000/api/v2/*`.
