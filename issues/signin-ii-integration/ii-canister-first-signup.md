# Internet Identity – Canister-first signup and Web2 session binding

## Goal
Make Internet Identity (II) signup “canister-first”: the IC canister becomes the source of truth and proof-of-possession before any Web2 account is created, then NextAuth issues a Web2 session bound to that proven principal.

## Why
- Principal-only to Web2 is spoofable (no proof-of-possession).
- IC canister already verifies II signatures/delegations on every call.
- Using the canister as the proof anchor prevents impersonation and aligns future IC features with the same identity.

## High-level flow (recommended)
1) Web2 backend (Next.js API) mints a single-use, short‑TTL nonce and returns nonceId + nonce.
2) Client (with II identity) calls canister `prove_signup(nonce)` (authenticated canister call; IC verifies signature/delegation → proves possession).
3) Web2 verifies proof by querying the canister for `(principal, nonce)` freshness and consumption.
4) If valid, Web2 creates/links the user in Web2 DB (NextAuth + Drizzle), issues NextAuth session.

## Components and changes

### Web2 backend (Next.js)
- New route: `POST /api/ii/challenge`
  - Body: `{ callbackUrl?: string }`
  - Returns: `{ nonceId: string, nonce: string, ttlSeconds: number }`
  - Persists: `{ nonceId, nonceHash, createdAt, expiresAt, usedAt: null }`
- Modify II sign-in bridge (custom sign-in page):
  - Fetch nonce from `/api/ii/challenge`
  - Call canister `prove_signup(nonce)` with II identity (via `@dfinity/agent`)
  - Call `signIn('ii', { principal, nonceId, redirect: false, callbackUrl })`
- NextAuth `CredentialsProvider({ id: 'ii' }).authorize`:
  - Validate `nonceId` exists, unexpired, unused
  - Query canister for `(principal, nonceId)` proof
  - Mark nonce used, then find-or-create Web2 user and `account` mapping

### Canister (backend)
- Add stable structures for proofs, e.g.: `(principal, nonceId, provedAt, used: bool)`
- Methods:
  - `prove_signup(nonce: text) -> bool` (update state: record { callerPrincipal, nonceId, provedAt, used=false })
  - `verify_proof(nonceId: text) -> opt record { principal: text; provedAt: nat64; used: bool }`
  - `consume_proof(nonceId: text) -> bool` (optional; or mark used in Web2 after verifying)
- TTL semantics: the canister should reject stale nonces; Web2 should validate TTL too.

## Alternative: canister-issued nonce
- Client first asks canister for a nonce, then proves, then Web2 verifies with canister only (no Web2-minted nonce).
- Still requires Web2 to verify and bind proof to the session; less coordination of nonce storage on Web2, but API contract shifts to canister.

## API contracts (proposed)

- `/api/ii/challenge` (Web2)
```http
POST /api/ii/challenge
{
  "callbackUrl": "/en/dashboard"
}
=>
{
  "nonceId": "<uuid>",
  "nonce": "<random-128b-base64>",
  "ttlSeconds": 180
}
```

- `prove_signup(nonce)` (Canister)
```motoko
public shared({ caller }) func prove_signup(nonce : Text) : async Bool {
  // validate nonce freshness; record { principal = Principal.toText(caller), nonceId, provedAt }
}
```

- NextAuth authorize (Web2)
```ts
// Pseudocode inside authorize(credentials)
assert(credentials.principal && credentials.nonceId)
checkNonceFresh(credentials.nonceId)
const proof = await canister.verify_proof(credentials.nonceId)
assert(proof && proof.principal === credentials.principal && !proof.used)
markNonceUsed(credentials.nonceId)
// create/link user + account, then return user
```

## Acceptance criteria
- Web2 session is only issued if the canister records a valid proof `(principal, nonceId)` within TTL and unused.
- Nonces are single-use; replay is rejected.
- First-time II login: creates Web2 user + `account(provider='internet-identity', providerAccountId=<principal>)`.
- Returning II login: reuses same user; no duplicates.
- Clear errors on stale/missing proof; preserve `callbackUrl` on success.

## Risks / mitigations
- Latency: two extra round-trips (challenge + canister). Mitigate with short payloads, caching, and reasonable TTLs (e.g., 2–5 minutes).
- Availability: canister or Web2 downtime blocks signup; ensure idempotent nonces and retries.
- Complexity: more moving parts; keep interfaces small and auditable.

## Migration plan
1) Implement `/api/ii/challenge` + DB table for nonces.
2) Add canister methods and tests.
3) Update custom sign-in page to call challenge → canister → signIn('ii', { principal, nonceId }).
4) Extend `authorize()` to verify proof before create/link.
5) QA end-to-end; then enforce proof step in production (flag off principal-only path).

## Notes
- This issue does not change database schema; it adds a nonce table/collection on Web2.
- Keep current principal-only MVP behind a dev flag until this is live.
