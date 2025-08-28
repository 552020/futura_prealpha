# Internet Identity – Canister-first signup and Web2 session binding

## Goal

Make Internet Identity (II) signup “canister-first”: the IC canister becomes the source of truth and proof-of-possession before any Web2 account is created, then NextAuth issues a Web2 session bound to that proven principal.

## Why

- Principal-only to Web2 is spoofable (no proof-of-possession).
- IC canister already verifies II signatures/delegations on every call.
- Using the canister as the proof anchor prevents impersonation and aligns future IC features with the same identity.

## High-level flow (recommended)

1. Frontend ensures II identity via Internet Identity (AuthClient.login → principal/delegation available on the client).
2. Frontend → Web2 (Next.js API): POST `/api/ii/challenge` to get `{ nonceId, nonce, ttl }` (Web2-minted, short‑TTL, single-use).
3. Frontend → ICP canister: call `prove_signup(nonce)` using the II identity (canister verifies signature/delegation and records proof for `(principal, nonceId)`).
4. Frontend → NextAuth: `signIn('ii', { principal, nonceId, callbackUrl })`.
5. Web2 (authorize): verify the canister proof for `nonceId`, atomically create/link Web2 user + account, mark nonce used, and issue the session.

### Why step 2 (Web2‑issued nonce) is necessary and before web3

- Order matters: issuing the nonce first lets Web2 define the exact login attempt it will accept later. The client then proves that specific attempt to the canister.
- Session/context binding:
  - Web2 attaches login context (callbackUrl, CSRF/state, device hints) to the nonce at issuance time.
  - When the client proves this nonce at the canister, Web2 can correlate the proof back to the same login context deterministically.
- Anti‑replay and atomicity:
  - Web2 verifies the canister proof for that nonce and consumes it in the same DB transaction as user/account creation and session issuance (single‑use, no race/TOCTOU).
  - If canister proof existed before Web2 had a nonce on record, Web2 would have to accept based only on the principal, weakening replay protections and complicating multi‑tab races.
- Clear trust boundary:
  - Canister proves “principal X possesses the II session key” for the given nonce.
  - Web2 proves “this proof maps to this specific login attempt I issued,” preventing out‑of‑band or stale proofs.
- Operational control:
  - Web2 can rate‑limit, audit, revoke, and expire nonces in its datastore and logs.
  - With canister‑minted nonces, Web2 still must verify/bind proofs but loses simple transactional lifecycle control, adding coordination without more security.
- Security parity:
  - The canister still enforces II signature/delegation either way. Web2‑first nonce improves binding and operations without weakening security.

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
assert(credentials.principal && credentials.nonceId);
checkNonceFresh(credentials.nonceId);
const proof = await canister.verify_proof(credentials.nonceId);
assert(proof && proof.principal === credentials.principal && !proof.used);
markNonceUsed(credentials.nonceId);
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

1. Implement `/api/ii/challenge` + DB table for nonces.
2. Add canister methods and tests.
3. Update custom sign-in page to call challenge → canister → signIn('ii', { principal, nonceId }).
4. Extend `authorize()` to verify proof before create/link.
5. QA end-to-end; then enforce proof step in production (flag off principal-only path).

## Implementation TODOs (practical steps)

1. **Web2: design nonce storage**

   - [ ] 1.1 Create `ii_nonces` table (id, nonceHash, createdAt, expiresAt, usedAt, context JSON)
   - [ ] 1.2 Add helper to hash and compare nonce values

2. **Web2: implement challenge endpoint**

   - [ ] 2.1 `POST /api/ii/challenge` → returns `{ nonceId, nonce, ttlSeconds }`
   - [ ] 2.2 Persist nonce with context: `{ callbackUrl, ip/user-agent (optional) }`

3. **Canister: add proof methods**

   - [ ] 3.1 `prove_signup(nonce: text) -> bool` (record caller principal + nonceId)
   - [ ] 3.2 `verify_proof(nonceId: text) -> opt { principal; provedAt; used }`
   - [ ] 3.3 Optional: `consume_proof(nonceId: text)`

4. **Frontend (signin page)**

   - [ ] 4.1 Ensure II identity with `AuthClient.login`
   - [ ] 4.2 Fetch challenge → get `{ nonceId, nonce }`
   - [ ] 4.3 Call canister `prove_signup(nonce)` using II identity
   - [ ] 4.4 Call `signIn('ii', { principal, nonceId, redirect: false, callbackUrl })`

5. **NextAuth authorize (Web2)**

   - [ ] 5.1 Validate `principal` + `nonceId`
   - [ ] 5.2 Check nonce exists, unexpired, unused
   - [ ] 5.3 Query canister `verify_proof(nonceId)`; assert principal matches and not used
   - [ ] 5.4 In a single transaction: mark nonce used, create/link user + account, issue session

6. **Error handling & logging**

   - [ ] 6.1 Clear error messages for stale/missing proof and re‑auth prompts
   - [ ] 6.2 Structured logs for challenge, proof verify, account link

7. **Feature flags & config**

   - [ ] 7.1 Gate principal‑only path behind dev flag; enforce proof in prod
   - [ ] 7.2 TTL, rate‑limit, size limits via env

8. **QA**
   - [ ] 8.1 First‑time II login creates user + account
   - [ ] 8.2 Returning II login reuses same user (no duplicates)
   - [ ] 8.3 Replay attempts with used/expired nonce are rejected
   - [ ] 8.4 CallbackUrl respected; sign‑out clears sessions

## Notes

- This issue does not change database schema; it adds a nonce table/collection on Web2.
- Keep current principal-only MVP behind a dev flag until this is live.

---

## Glossary: Nonce

- Definition: a one-time, random token generated by the server, valid for a short time (TTL), and intended for single use.
- Why we need it:
  - Freshness: guarantees the proof corresponds to the current login attempt.
  - Anti-replay: prevents attackers from reusing an old proof.
  - Binding: lets the server associate the proof with session/context (e.g., callbackUrl).
- Lifecycle:
  - Issue → store (nonceId, hash, createdAt, expiresAt, usedAt=null)
  - Client proves (canister call) → server verifies → mark used.

### Why a canister-issued nonce is less useful than a Web2-issued nonce

- Session binding: Web2 must bind the proof to its login/session state (callbackUrl, CSRF). Owning the nonce simplifies that linkage.
- Transactional control: Web2 can verify and consume the nonce in the same DB transaction as user/account creation.
- Operational controls: Rate limiting, auditing, and revocation are straightforward in Web2’s datastore; canister-minted nonces complicate coordination without improving security.
- Security equivalence: The canister still verifies II signatures in both designs; choosing Web2-issued nonces is about operational simplicity, not weaker security.
