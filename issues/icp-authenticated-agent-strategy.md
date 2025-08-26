# ICP Authenticated Agent Strategy

## Context

We're implementing Internet Identity authentication following the tutorial pattern. Currently at Step 7 where we need to create an authenticated agent after login.

## Our Current Agent Setup

### Why we created custom agent.ts

We created a custom `createAgent()` function to **avoid proxy issues**. The auto-generated declarations were making `/api/v2/*` calls to localhost:3000, but our custom agent uses proper host configuration:

```typescript
const host =
  process.env.NEXT_PUBLIC_IC_HOST ??
  (process.env.NEXT_PUBLIC_DFX_NETWORK === "ic" ? "https://icp-api.io" : "http://127.0.0.1:4943");
```

This bypasses the proxy and makes direct calls to the correct host.

### Current createAgent() function

```typescript
export function createAgent(): Promise<HttpAgent> {
  if (!cached) {
    cached = HttpAgent.create({
      host,
      shouldFetchRootKey: process.env.NEXT_PUBLIC_DFX_NETWORK !== "ic",
    });
  }
  return cached;
}
```

## Tutorial Step 7 Analysis

The tutorial shows two different approaches:

1. **Greet button**: Uses auto-generated actor (anonymous agent)
2. **Login button**: Creates authenticated agent manually:
   ```javascript
   const agent = new HttpAgent({ identity });
   actor = createActor(process.env.GREET_BACKEND_CANISTER_ID, { agent });
   ```

## Question for Senior Developer

**Which approach is better for authenticated agents?**

**Option A**: Use tutorial approach directly

```typescript
const agent = new HttpAgent({ identity });
```

**Option B**: Expand our createAgent() function

```typescript
export function createAgent(identity?: Identity): Promise<HttpAgent>;
```

**Considerations:**

- We need to avoid proxy issues (our main reason for custom agent)
- Authenticated agents need the user's identity
- Should we maintain consistency with our existing agent pattern?
- Does the host configuration matter for authenticated agents?

## Current Implementation

We're calling Internet Identity canister for authentication, then need to create an agent for backend canister calls with the authenticated identity.

**Which strategy should we use?**

## Senior Developer Answer

**Option B. Extend your `createAgent(identity?: Identity)` and keep one path for both anon + II.**

### Why

- You already fixed host/proxy in `createAgent()`; keep that single source of truth.
- Identity is orthogonal to host. Pass it in when present; otherwise anonymous.
- Caching now must be per-identity (your current single `cached` breaks when users switch).

### Implementation

1. **Make it identity-aware and env-safe**

```typescript
import { HttpAgent, type Identity } from "@dfinity/agent";

const host =
  process.env.NEXT_PUBLIC_IC_HOST ??
  (process.env.NEXT_PUBLIC_DFX_NETWORK === "ic" ? "https://icp-api.io" : "http://127.0.0.1:4943");

const agentCache = new Map<string, Promise<HttpAgent>>(); // key = principal or "anon"

export function createAgent(identity?: Identity): Promise<HttpAgent> {
  const key = identity ? identity.getPrincipal().toText() : "anon";
  if (!agentCache.has(key)) {
    agentCache.set(
      key,
      (async () => {
        const agent = await HttpAgent.create({ host, identity });
        if (process.env.NEXT_PUBLIC_DFX_NETWORK !== "ic") {
          // dev/local only
          await agent.fetchRootKey();
        }
        return agent;
      })()
    );
  }
  return agentCache.get(key)!;
}
```

2. **Thread identity through your actor factory**

```typescript
export async function backendActor(identity?: Identity) {
  const agent = await createAgent(identity);
  return makeActor(backendIDL, backendCanisterId, { agent });
}
```

3. **After II login, pass the DelegationIdentity you got**

```typescript
const authClient = await AuthClient.create();
await new Promise((res) => authClient.login({ identityProvider: process.env.NEXT_PUBLIC_II_URL!, onSuccess: res }));
const identity = authClient.getIdentity(); // DelegationIdentity
const actor = await backendActor(identity); // ← authenticated calls
```

4. **Logout hygiene**

- On logout, call `authClient.logout()` and optionally `agentCache.clear()` so future calls are anonymous until the next login.

### Notes

- Host config matters for both anonymous and authenticated; keep it centralized (your current reason for custom agent).
- Don't reuse a single cached agent for multiple identities.
- Server-side calls: keep using anonymous/server identity; never reuse a user's II identity on the server.

This matches the tutorial's "create `HttpAgent({ identity })` after login" but keeps your proxy/host fix and a clean API.
