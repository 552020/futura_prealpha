# Internet Identity (II) principal-only sign-in: security analysis and proposals

## Audience
Senior reviewer (no code access). This document summarizes the current implementation, the security implications of accepting a client-provided principal without proof-of-possession, and proposes robust designs.

## TL;DR
- Current flow accepts a client-supplied Internet Computer principal and creates/links a user account without cryptographic proof. This is weaker than email+password and OAuth flows.
- Recommend adding a proof step: either a canister-backed nonce verification or server-side verification of the delegation+signature before issuing a NextAuth session.

---

## Current implementation (summary)

### Where the flow is initiated (custom sign-in page)
- The UI performs the II login in the browser (via `@dfinity/auth-client`), extracts the principal, then bridges to NextAuth using a Credentials provider with id `"ii"`:

```tsx
// Pseudo from src/.../[lang]/signin/page.tsx
const { principal } = await loginWithII({ maxTimeToLive })
const res = await signIn("ii", { principal, redirect: false, callbackUrl })
if (res?.error) { /* show error */ } else { router.push(callbackUrl) }
```

- Key property: only the `principal` string is sent to the backend.

### NextAuth provider that accepts the principal
- A custom Credentials provider handles `id: "ii"`. It searches for an existing `account` mapping by `provider='internet-identity'` and `providerAccountId=<principal>`. If none is found, it creates a new `user` and corresponding `account` row, then returns the user to NextAuth which issues a session.

```ts
// Pseudo of authorize(credentials)
if (!credentials?.principal) return null
const principal = String(credentials.principal)

const account = await db.query.accounts.findFirst({
  where: (a, { and, eq }) => and(eq(a.provider, "internet-identity"), eq(a.providerAccountId, principal)),
})
if (account) {
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, account.userId) })
  if (user) return user
}

// else create new user + account mapping
const [newUser] = await db
  .insert(users)
  .values({})
  .returning({ id: users.id, email: users.email, name: users.name, role: users.role })

await db.insert(accounts).values({
  userId: newUser.id,
  type: "credentials",
  provider: "internet-identity",
  providerAccountId: principal,
})

await db.insert(allUsers).values({ type: "user", userId: newUser.id }).onConflictDoNothing?.()
return newUser
```

### Database
- Uses standard NextAuth tables (`user`, `account`, `session`) via Drizzle, plus a business `all_user` table for promotion/aggregation.
- No schema changes required for II.

---

## Security comparison: why principal-only is weaker

### Email + Password (Credentials provider)
- Client sends `email` and `password`.
- Server verifies password hash against stored hash.
- Outcome: server verifies possession of a shared secret.

### Google OAuth (OAuth provider)
- Browser is redirected to Google.
- Server receives OAuth callback with code/tokens from Google.
- Outcome: server trusts Google’s identity assertion; the client cannot forge it.

### Internet Identity (current principal-only)
- Client sends `principal` string only.
- Server creates/links account for that principal with no proof.
- Outcome: a malicious client could claim someone else’s principal and obtain a session mapped to that identity.

Conclusion: Principal-only lacks proof-of-possession of the II session key/delegation.

---

## Strengthening the II flow: proposed designs

### Option A: Canister-backed nonce proof (recommended)
- Overview: Prove possession of the delegated session key by making an authenticated call to your backend canister as the principal.
- Flow:
  1) Server (or API route) issues a fresh nonce (store nonce+ttl server-side).
  2) Client, using II identity (`AuthClient`), calls a canister method (e.g., `prove_web_auth(nonce)`). This call is signed with the user’s delegated session key and arrives on-chain with the principal identity.
  3) Server verifies the proof by querying the canister (or by receiving a callback/event/log) to confirm that principal X proved nonce Y within TTL.
  4) Only then, in NextAuth `authorize()`, accept the login, create/link the `account`, and issue the session.
- Pros:
  - Leverages existing IC identity and delegation; impossible to spoof without the private key.
  - Clean separation of concerns; minimal cryptography on the server.
- Cons:
  - Requires a canister method and server-side verification flow.

### Option B: Server-side signature + delegation chain verification
- Overview: Submit the delegation chain and a signature over a server nonce; validate entirely server-side.
- Flow:
  1) Server issues a fresh nonce.
  2) Client, using II session key, signs the nonce and sends back: `principal`, `delegation_chain`, `signature`.
  3) Server verifies: (a) delegation is valid and not expired; (b) signature matches the delegated public key; (c) principal matches the root identity.
  4) If valid, authorize user as that principal.
- Pros:
  - No canister roundtrip; fully off-chain verification.
- Cons:
  - More cryptographic plumbing server-side (parsing delegation, signature verification). Requires robust implementation and maintenance.

### Option C: Minimal hardening (not sufficient alone)
- Validate principal format; rate-limit attempts; require recent activity timestamp; log anomalies.
- These mitigations do not provide proof-of-possession and should not be used alone.

---

## Acceptance criteria for a secure II login
- A NextAuth session can only be issued if the requester proves possession of the II session key corresponding to the provided principal.
- Nonce is single-use and expires quickly (e.g., 2–5 minutes); prevent replay.
- On success, database persists or reuses `account` mapping: `{ provider: 'internet-identity', type: 'credentials', providerAccountId: <principal> }`.
- Existing `createUser` event continues to promote to `all_user`.
- Maintain consistent redirect behavior and error states on the custom sign-in page.

---

## Implementation outline (Option A: canister-backed)
1) Backend: add canister method `prove_web_auth(nonce: text) -> bool` that records successful proofs keyed by `(principal, nonce, ts)`.
2) API: add `/api/ii/challenge` to mint nonce; store in DB with TTL and intended callbackUrl.
3) Client (signin page):
   - Fetch nonce
   - Call canister with user’s identity: `prove_web_auth(nonce)`
   - Call `signIn('ii', { principal, nonceId, redirect: false, callbackUrl })`
4) NextAuth authorize():
   - Lookup nonce; verify TTL and not used
   - Query canister to confirm proof by the same principal
   - Mark nonce as used; proceed to link/create `account` and return user

---

## Implementation outline (Option B: signature verification)
1) API: `/api/ii/challenge` issues nonce.
2) Client: signs nonce with session key; posts `{ principal, delegationChain, signature }` to `signIn('ii', ...)`.
3) Server: verifies delegation validity and signature; if valid, proceed to link/create `account` and return user.

---

## Risks and mitigations
- Replay: enforce nonce single-use and short TTL; bind nonce to client context if possible.
- Downgrade: ensure the II path always requires proof; never accept principal-only in production.
- UX: add clear inline errors; preserve callbackUrl; keep signout clearing both NextAuth and II sessions.

---

## References
- `@dfinity/auth-client` and II delegation model
- NextAuth Credentials provider and adapter docs
- Existing implementations for OAuth (Google) and Credentials (email+password) for comparison
