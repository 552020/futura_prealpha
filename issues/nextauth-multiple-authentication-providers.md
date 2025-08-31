# NextAuth Multiple Authentication Providers Issue

## Short answer (TL;DR)

- NextAuth maintains a single session (one `session.user.id`).
- To "have both" Google and Internet Identity, link multiple providers to the same user via the `account` table (Adapter-driven).
- In our stack: keep `GoogleProvider` and `CredentialsProvider("ii")`. If a user is already logged in (e.g., Google), verify II and link it via a backend route (e.g., `POST /api/auth/link-ii`) that upserts `{ provider: 'internet-identity', providerAccountId: <principal>, userId: session.user.id }`. Only use `signIn('ii')` when no one is logged in.
- Result: one session; `session.user` can expose fields from both identities (e.g., `email` from Google, `icpPrincipal` from II).

## Actionable plan (Pattern A — recommended)

1. Add link route: `src/nextjs/src/app/api/auth/link-ii/route.ts`

- Server-verify the II proof → get `principal`.
- Read current session → `session.user.id`.
- Upsert into `account`:

```ts
// drizzle example
await db
  .insert(accounts)
  .values({
    userId: session.user.id,
    provider: "internet-identity",
    providerAccountId: principal,
    type: "oidc", // <- use "oidc" instead of "credentials"
  })
  .onConflictDoUpdate({
    target: [accounts.provider, accounts.providerAccountId],
    set: { userId: session.user.id },
  });
```

2. II-only page/modal (client)

- Do II proof on client.
- `await fetch('/api/auth/link-ii', { method: 'POST', body: JSON.stringify({ proof }) })`
- `await update()` to refresh NextAuth session.
- Continue “Store Forever” flow.
- Only call `signIn('ii')` if there is **no** active session.

3. Keep providers as-is

- Google via `GoogleProvider`.
- II via `CredentialsProvider({ id: 'ii' })`.

4. Session exposure (callbacks)

- In `jwt` callback, stash `icpPrincipal` when link confirmed (e.g., load from DB or pass back from route).
- In `session` callback, copy `token.icpPrincipal` → `session.user.icpPrincipal`.

Minimal example:

```ts
// callbacks.session
async session({ session, token }) {
  (session.user as any).icpPrincipal = token.icpPrincipal ?? null;
  return session;
}
```

### Don’ts

- Don’t redirect a logged-in Google user through `signIn('ii')`. That replaces the session.
- Don’t attempt two concurrent sessions. Use one user, many linked `accounts`.

### Optional (Pattern B)

If you insist on `signIn('ii')`, pass current user context and link inside `callbacks.signIn`, then prevent creating a new session. More complex; Pattern A is simpler and clearer.

---

## Problem Description (restated)

When a Google-authenticated user completes Internet Identity authentication using `signIn('ii')`, the current session is replaced instead of preserving the existing user and linking II to it. Because there is no account-linking step, the session resolves to a different user context (the II-only user), so Google appears "lost" after II.

## Current Behavior

1. **User signs in with Google** → Session contains Google user data
2. **User clicks "Store Forever"** → Redirected to II-only signin page
3. **User signs in with Internet Identity** → Session now contains only II data, Google data is lost
4. **User returns to gallery** → No longer has Google authentication

## Expected Behavior

1. **User signs in with Google** → Session contains Google user data
2. **User signs in with Internet Identity** → Session should contain BOTH Google AND II data
3. **User returns to gallery** → Has both authentications available

## Technical Details

### Current Auth Configuration (actual)

```typescript
// auth.ts (simplified)
providers: [
  GitHub({
    /* OAuth provider */
  }),
  Google({
    /* OAuth provider */
  }),
  CredentialsProvider({
    /* email/password */
  }),
  CredentialsProvider({ id: "ii" /* Internet Identity */ }),
];
```

- Adapter: `DrizzleAdapter(db)`
- Session strategy: `jwt`

### Database (actual)

We use Drizzle ORM with the standard Auth.js tables:

```typescript
// src/nextjs/src/db/schema.ts
export const users = pgTable("user", {
  /* ... */
});
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    // ... tokens
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
);
```

This already supports multiple providers linked to a single `userId`.

## Senior Developer Response Analysis

### ✅ **Key Insights from Senior Developer**

- NextAuth keeps a single session keyed by `session.user.id`
- Multiple auth methods should be linked to the same user via the `account` table
- Our issue is not provider choice for II (Credentials is fine) but lack of a linking step when the user is already logged in

### Root Cause (in our repo)

- We correctly use `GoogleProvider` (OAuth)
- We correctly use `CredentialsProvider` for II
- When a logged-in Google user performs II auth, we call `signIn('ii')`, which resolves to a different user context and overwrites the session instead of linking II to the current `user.id`
- There is no explicit linking flow that inserts/updates an `account` row `{ provider: 'internet-identity', providerAccountId: <principal>, userId: <current user.id> }`

### Recommended Design (keep providers as-is)

- Maintain a single session (one `user.id`)
- When adding II to an already logged-in user, do a "link account" flow instead of `signIn('ii')`

## Implementation Strategy for Our Stack

### Pattern A — Link II via API route (recommended)

1. User is logged in (Google) → has `session.user.id`
2. II-only page/modal obtains and verifies II proof (principal)
3. Client calls `POST /api/auth/link-ii` with the proof
4. Server route:
   - Uses NextAuth session to read `session.user.id`
   - Re-verifies the II proof server-side
   - Upserts into `account`:
     - where: `{ provider: 'internet-identity', providerAccountId: principal }`
     - update: `{ userId: session.user.id }`
     - create: `{ userId: session.user.id, provider: 'internet-identity', providerAccountId: principal, type: 'credentials' }`
5. Client calls `await update()` (NextAuth) to refresh session (so `session.user.icpPrincipal` is present)
6. Continue the "Store Forever" flow

Notes:

- No second `signIn()` is performed → avoids session replacement
- Works cleanly with DrizzleAdapter and our schema

### Pattern B — Link inside callbacks.signIn (alternative)

- Pass current user context via state/cookie
- On `provider === 'ii'`, link the II account to that `user.id` and prevent new session
- More complex; Pattern A is simpler for our app

## Session Exposure

Use `jwt`/`session` callbacks (we already have scaffolding) to expose II fields:

```typescript
// callbacks.jwt: backfill/store icpPrincipal
// callbacks.session: copy token.icpPrincipal -> session.user.icpPrincipal
```

## Concrete To-Dos (our repo)

1. Add API route: `src/nextjs/src/app/api/auth/link-ii/route.ts`
   - Verify II proof, upsert into `account` with current `user.id`
2. Update `/[lang]/sign-ii-only` page
   - If session exists → call link route + `update()`
   - If no session → fallback to `signIn('ii')` (standalone II login)
3. Keep providers unchanged in `auth.ts` (Google, GitHub, Credentials, II Credentials)
4. Ensure callbacks continue exposing `icpPrincipal` onto the session

## Impact

- Fixes session overwrite when adding II on top of Google
- Preserves a single userId while enabling multiple auth methods
- Uses our existing Drizzle schema and Adapter

## Status

- Awaiting confirmation to implement Pattern A (API route + client changes)
- No provider refactors required

## Troubleshooting

### Issue: Drizzle `accounts.type` rejects "credentials"

Problem:

- In the link route, inserting `type: "credentials"` fails with a Drizzle/Auth.js type error:
- `Type '"credentials"' is not assignable to type AdapterAccountType`.

Cause:

- Our `accounts.type` column uses Auth.js `AdapterAccount["type"]`. For Internet Identity, our codebase uses `"oidc"` (see `auth.ts`).

Concise fix (change one value):

```ts
// src/nextjs/src/app/api/auth/link-ii/route.ts
await db
  .insert(accounts)
  .values({
    userId: session.user.id,
    provider: "internet-identity",
    providerAccountId: principal,
    type: "oidc", // <- use "oidc" instead of "credentials"
  })
  .onConflictDoUpdate({
    target: [accounts.provider, accounts.providerAccountId],
    set: { userId: session.user.id },
  });
```

Optional cleanup:

- Remove the unused `eq` import from the same file.
