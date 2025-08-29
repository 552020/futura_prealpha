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
const { principal } = await loginWithII({ maxTimeToLive });
const res = await signIn("ii", { principal, redirect: false, callbackUrl });
if (res?.error) {
  /* show error */
} else {
  router.push(callbackUrl);
}
```

- Key property: only the `principal` string is sent to the backend.

### NextAuth provider that accepts the principal

- A custom Credentials provider handles `id: "ii"`. It searches for an existing `account` mapping by `provider='internet-identity'` and `providerAccountId=<principal>`. If none is found, it creates a new `user` and corresponding `account` row, then returns the user to NextAuth which issues a session.

```ts
// Pseudo of authorize(credentials)
if (!credentials?.principal) return null;
const principal = String(credentials.principal);

const account = await db.query.accounts.findFirst({
  where: (a, { and, eq }) => and(eq(a.provider, "internet-identity"), eq(a.providerAccountId, principal)),
});
if (account) {
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, account.userId) });
  if (user) return user;
}

// else create new user + account mapping
const [newUser] = await db
  .insert(users)
  .values({})
  .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

await db.insert(accounts).values({
  userId: newUser.id,
  type: "credentials",
  provider: "internet-identity",
  providerAccountId: principal,
});

await db.insert(allUsers).values({ type: "user", userId: newUser.id }).onConflictDoNothing?.();
return newUser;
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
  1. Server (or API route) issues a fresh nonce (store nonce+ttl server-side).
  2. Client, using II identity (`AuthClient`), calls a canister method (e.g., `prove_web_auth(nonce)`). This call is signed with the user’s delegated session key and arrives on-chain with the principal identity.
  3. Server verifies the proof by querying the canister (or by receiving a callback/event/log) to confirm that principal X proved nonce Y within TTL.
  4. Only then, in NextAuth `authorize()`, accept the login, create/link the `account`, and issue the session.
- Pros:
  - Leverages existing IC identity and delegation; impossible to spoof without the private key.
  - Clean separation of concerns; minimal cryptography on the server.
- Cons:
  - Requires a canister method and server-side verification flow.

### Option B: Server-side signature + delegation chain verification

- Overview: Submit the delegation chain and a signature over a server nonce; validate entirely server-side.
- Flow:
  1. Server issues a fresh nonce.
  2. Client, using II session key, signs the nonce and sends back: `principal`, `delegation_chain`, `signature`.
  3. Server verifies: (a) delegation is valid and not expired; (b) signature matches the delegated public key; (c) principal matches the root identity.
  4. If valid, authorize user as that principal.
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

1. Backend: add canister method `prove_web_auth(nonce: text) -> bool` that records successful proofs keyed by `(principal, nonce, ts)`.
2. API: add `/api/ii/challenge` to mint nonce; store in DB with TTL and intended callbackUrl.
3. Client (signin page):
   - Fetch nonce
   - Call canister with user’s identity: `prove_web_auth(nonce)`
   - Call `signIn('ii', { principal, nonceId, redirect: false, callbackUrl })`
4. NextAuth authorize():
   - Lookup nonce; verify TTL and not used
   - Query canister to confirm proof by the same principal
   - Mark nonce as used; proceed to link/create `account` and return user

---

## Implementation outline (Option B: signature verification)

1. API: `/api/ii/challenge` issues nonce.
2. Client: signs nonce with session key; posts `{ principal, delegationChain, signature }` to `signIn('ii', ...)`.
3. Server: verifies delegation validity and signature; if valid, proceed to link/create `account` and return user.

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

## **ICP AI Docs Answer**

Your analysis is on point: accepting a client-supplied principal without proof-of-possession is weaker than standard auth and should be hardened.

What the sources confirm

- II issues a delegation to a locally generated session key; authenticated calls must be signed by that session private key, and the IC verifies the signature and delegation chain on every request. This proves possession when the user calls a canister, but not when a web2 backend only receives a bare principal string (no signature/delegation) ([Security best practices: II mobile integration](https://internetcomputer.org/docs/building-apps/security/iam#integrating-internet-identity-on-mobile-devices)).
- The II client authentication protocol returns a delegation for a session key scoped to a frontend origin; the client uses that chain to sign subsequent requests ([Client authentication protocol](https://internetcomputer.org/docs/references/ii-spec#client-authentication-protocol); [Identity design and data model](https://internetcomputer.org/docs/references/ii-spec#identity-design-and-data-model)).
- The IC independently validates signatures and delegation chains; a canister sees the caller principal derived from the authenticated request. You cannot fake another user’s principal without their key, but this assurance only exists for IC calls, not for off-chain requests that lack signatures ([Verifying signatures](https://internetcomputer.org/docs/building-apps/authentication/independently-verifying-ic-signatures); [Forum: validation of II delegation](https://forum.dfinity.org/t/10680)).
- For hybrid setups, a recommended pattern is to bind web2 sessions to a principal proven via a canister interaction or standardized signing; current community guidance suggests using a canister step and JWT/session issuance server-side, since a universal “sign message” is not yet standardized (ICRC‑32 draft) ([Forum: authenticate principals off-chain](https://forum.dfinity.org/t/44169)).

Recommendations aligned with sources

- Require proof-of-possession before issuing a web2 session. Two viable designs:
  - Canister-backed nonce proof: server issues a nonce; the client, using II, makes an authenticated canister call that records “principal X proved nonce Y”; server verifies before creating the session. This leverages the IC’s built-in signature/delegation verification and avoids custom crypto off-chain ([Verifying signatures](https://internetcomputer.org/docs/building-apps/authentication/independently-verifying-ic-signatures); [Forum: authenticate principals off-chain](https://forum.dfinity.org/t/44169)).
  - Server-side verification: have the client send the II delegation chain and a signature over a server nonce; verify chain validity, expiry, and signature against the derived principal. This mirrors the IC’s request validation off-chain, but requires careful implementation following the IC request/delegation spec ([Verifying signatures](https://internetcomputer.org/docs/building-apps/authentication/independently-verifying-ic-signatures); [II spec: authentication protocol/backend](https://internetcomputer.org/docs/references/ii-spec#authentication-protocol), [client auth](https://internetcomputer.org/docs/references/ii-spec#client-authentication-protocol)).

Hardening notes

- Use single-use, short‑TTL nonces to prevent replay ([Verifying signatures](https://internetcomputer.org/docs/building-apps/authentication/independently-verifying-ic-signatures)).
- Never accept principal-only in production; always require a canister proof or a valid delegation+signature.
- If you implement a proxy or mobile flow, follow the secure delegation-chaining pattern (intermediate key, fragment delivery, chain verification) to prevent delegation leakage or misuse ([Security best practices: II mobile – recommendation](https://internetcomputer.org/docs/building-apps/security/iam#recommendation)).

Bottom line
Your Option A (canister-backed nonce proof) is the most straightforward and robust with today’s tooling; Option B is viable if you implement IC-compliant signature and delegation verification server-side. Principal-only should be considered insecure for session issuance without one of these proofs.

---

## Glossary: Nonce (what it is and why we use it)

- A nonce is a one-time random value generated by the server and intended to be used exactly once within a short time window (TTL).
- Purpose:
  - Prove freshness: the response is tied to “now”, preventing replay of an old proof.
  - Bind context: the server can associate the nonce with a specific login attempt or callbackUrl.
  - Prevent replay/race: once consumed, the nonce is invalid; reusing it fails.
- Properties:
  - High entropy (cryptographically random), unique, short TTL (e.g., 2–5 minutes).
  - Tracked server-side: issuedAt, expiresAt, usedAt.
  - Single-use: the server marks it used after successful verification.
- In our II flow:
  - Web2 issues the nonce → client proves it with the canister using the II identity → Web2 verifies and only then creates/links the Web2 user and issues the session.

### Why a canister-issued nonce is less useful than a Web2-issued nonce

- Binding: Web2 needs to bind the proof to its own session context (callbackUrl, CSRF/state). A Web2-issued nonce makes this trivial.
- Atomicity: Web2 can “verify proof + create account + mark nonce used” in one DB transaction. With canister-issued nonces, coordinating atomic consumption is harder.
- Replay/race controls: Web2 can rate-limit, audit, and invalidate nonces entirely within its DB. Offloading nonce minting to the canister adds complexity without adding security.
- Security parity: Both approaches rely on II signature verification at the canister. The Web2-issued nonce is simpler to manage with no loss of security.
