# Internet Identity – Decoupled Web2 + Web3 Authentication

## Goal

Implement secure Internet Identity (II) authentication that:

- **Web3 (Canister)**: Stays independent and autonomous - registers principals with no external dependencies
- **Web2 (NextAuth)**: Enforces proof-of-possession via nonce challenge to prevent spoofing
- **Clean separation**: Each system remains functional independently

## Why This Architecture

### Problems with Coupled Approach

- Web3 becomes dependent on Web2 nonce system
- Canister loses autonomy - can't function if Web2 is down
- Complex coordination between systems
- Violates single responsibility principle

### Benefits of Decoupled Approach

- **Web3 Independence**: Canister works standalone, no external dependencies
- **Web2 Security**: Strong proof-of-possession via nonce + signature verification
- **Future-Proof**: Can change Web2 implementation without affecting Web3
- **Clean Architecture**: Each system has a single, clear responsibility

## High-Level Flow (Revised)

1. **Frontend**: Ensure II identity via Internet Identity (`AuthClient.login` → principal/delegation available)
2. **Frontend → Web2**: `POST /api/ii/challenge` to get `{ nonceId, nonce, ttlSeconds }` (Web2-minted, short-TTL, single-use)
3. **Frontend → Web3** (Optional): Call `register()` on canister (idempotent, no nonce needed)
4. **Frontend**: Sign the nonce with the delegated key to create `signature`
5. **Frontend → Web2**: `signIn('internet-identity', { principal, nonceId, signature, chain, callbackUrl })`
6. **Web2**: Verify delegation chain + signature over nonce, create/link user + account, issue session
7. **Frontend → Web3** (Optional): Call `mark_bound()` to signal successful Web2 binding

## Components and Changes

### Web2 Backend (Next.js) - Handles All Nonce Logic

- **Challenge endpoint**: `POST /api/ii/challenge`

  - Body: `{ callbackUrl?: string }`
  - Returns: `{ nonceId: string, nonce: string, ttlSeconds: number }`
  - Persists: `{ nonceId, nonceHash, createdAt, expiresAt, usedAt: null, context }`

- **NextAuth `CredentialsProvider({ id: 'internet-identity' }).authorize`**:
  - Validate inputs: `principal`, `nonceId`, `signature`, `chain`
  - Check nonce exists, unexpired, unused
  - Verify delegation chain (origin/targets, notBefore/notAfter)
  - Verify signature over nonce using delegated public key
  - In single transaction: mark nonce used, create/link user + account, issue session

### Web3 Canister - Stays Simple and Independent

- **State**: `principal → { registered_at: nat64, last_activity_at: nat64, bound: bool }`
- **Methods**:
  - `register()`: Idempotent upsert by `caller` principal. No nonce parameters.
  - `mark_bound()` (Optional): Sets `bound=true` for UX/metrics convenience
  - No proof tables, no nonce verification, no Web2 dependencies

### Frontend (Sign-in Page)

- Ensure II identity with `AuthClient.login`
- Fetch challenge from Web2: `{ nonceId, nonce }`
- (Optional) Call canister `register()` - works independently
- Sign nonce with delegated key to create signature
- Call `signIn('internet-identity', { principal, nonceId, signature, chain, callbackUrl })`
- (Optional) After success, call `mark_bound()` on canister

## API Contracts

### `/api/ii/challenge` (Web2)

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

### Canister Methods (Web3)

```motoko
// Idempotent registration - no nonce needed
public shared({ caller }) func register() : async Bool {
  let principal = Principal.toText(caller);
  let now = Time.now();

  switch (users.get(principal)) {
    case (?existing) {
      users.put(principal, {
        registered_at = existing.registered_at;
        last_activity_at = now;
        bound = existing.bound;
      });
    };
    case null {
      users.put(principal, {
        registered_at = now;
        last_activity_at = now;
        bound = false;
      });
    };
  };
  true
}

// Optional binding signal from Web2
public shared({ caller }) func mark_bound() : async Bool {
  let principal = Principal.toText(caller);
  switch (users.get(principal)) {
    case (?existing) {
      users.put(principal, {
        registered_at = existing.registered_at;
        last_activity_at = existing.last_activity_at;
        bound = true;
      });
      true
    };
    case null { false }; // Must register first
  };
}
```

### NextAuth Authorize (Web2)

```typescript
// Pseudocode inside authorize(credentials)
const { principal, nonceId, signature, chain } = credentials;

// 1. Validate nonce
const nonceValidation = await validateNonce(nonceId, nonce);
if (!nonceValidation.valid) return null;

// 2. Verify delegation chain
const chainValid = verifyDelegationChain(chain, {
  origin: process.env.NEXTAUTH_URL,
  targets: [process.env.NEXT_PUBLIC_CANISTER_ID_BACKEND],
});
if (!chainValid) return null;

// 3. Verify signature over nonce
const publicKey = extractPublicKeyFromChain(chain);
const signatureValid = verifySignature(nonce, signature, publicKey);
if (!signatureValid) return null;

// 4. Atomic DB transaction
await db.transaction(async (tx) => {
  await consumeNonce(nonceId);
  const user = await findOrCreateUser(principal);
  await linkAccount(user.id, "internet-identity", principal);
  return user;
});
```

## Implementation TODOs (Revised)

### 1. **Web2: nonce storage** ✅ COMPLETED

- ✅ 1.1 Create `ii_nonces` table (id, nonceHash, createdAt, expiresAt, usedAt, context JSON)
- ✅ 1.2 Add helper to hash and compare nonce values

### 2. **Web2: challenge endpoint** ✅ COMPLETED

- ✅ 2.1 `POST /api/ii/challenge` → returns `{ nonceId, nonce, ttlSeconds }`
- ✅ 2.2 Persist nonce with context: `{ callbackUrl, ip/user-agent (optional) }`

### 3. **Canister: keep it independent** (simplified)

- [ ] 3.1 `register()` (idempotent): upsert by `caller` principal; fields `{ registered_at, last_activity_at, bound: bool }`
- [ ] 3.2 Optional: `mark_bound()` (caller = principal) → sets `bound=true`
- [ ] 3.3 No nonce parameters, no proof tables, no Web2 dependencies

### 4. **Frontend (signin page)**

- [ ] 4.1 Ensure II identity with `AuthClient.login`
- [ ] 4.2 Fetch challenge → get `{ nonceId, nonce }`
- [ ] 4.3 (Optional) Call `register()` on the canister - no nonce needed
- [ ] 4.4 Sign nonce with delegated key to create signature
- [ ] 4.5 Call `signIn('internet-identity', { principal, nonceId, signature, chain, callbackUrl })`

### 5. **NextAuth authorize (Web2)**

- [ ] 5.1 Validate inputs: `principal`, `nonceId`, `signature`, `chain`
- [ ] 5.2 Check nonce exists, unexpired, unused
- [ ] 5.3 Verify delegation chain (origin/targets, notBefore/notAfter)
- [ ] 5.4 Verify signature over nonce using delegated public key
- [ ] 5.5 In single transaction: mark nonce used, create/link user + account, issue session
- [ ] 5.6 (Optional) After success, frontend calls `mark_bound()` on canister

### 6. **Error handling & logging**

- [ ] 6.1 Clear error messages for stale/missing proof and re-auth prompts
- [ ] 6.2 Structured logs for challenge, signature verify, account link

### 7. **Feature flags & config**

- [ ] 7.1 Gate principal-only path behind dev flag; enforce proof-of-possession in prod
- [ ] 7.2 TTL, rate-limit, size limits via env

### 8. **QA**

- [ ] 8.1 First-time II login creates user + account
- [ ] 8.2 Returning II login reuses same user (no duplicates)
- [ ] 8.3 Replay attempts with used/expired nonce are rejected
- [ ] 8.4 CallbackUrl respected; sign-out clears sessions
- [ ] 8.5 (Optional) `bound` flag toggles only after Web2 success

## Acceptance Criteria

- **Web2 Security**: Session only issued after valid delegation chain + signature over fresh nonce
- **Web3 Independence**: Canister functions completely independently, no Web2 dependencies
- **Nonce Protection**: Single-use nonces prevent replay attacks
- **User Experience**: Seamless login flow, first-time creates account, returning users reuse existing
- **Clean Separation**: Either system can be modified/replaced without affecting the other

## Benefits of This Approach

### Decoupling Benefits

- **Web3 Autonomy**: Canister remains functional even if Web2 is down or replaced
- **Simpler Web3**: No complex nonce verification logic in canister
- **Flexible Web2**: Can change authentication system without touching canister
- **Independent Testing**: Each system can be tested in isolation

### Security Benefits

- **Strong Proof-of-Possession**: Web2 cryptographically verifies user controls the key
- **Fresh Challenges**: Nonces prevent replay attacks
- **Delegation Verification**: Full IC delegation chain validation
- **No Shared Secrets**: Each system maintains its own security boundaries

### Operational Benefits

- **Clear Responsibilities**: Web2 handles auth, Web3 handles business logic
- **Independent Deployment**: Systems can be updated separately
- **Better Monitoring**: Clear separation makes debugging easier
- **Future-Proof**: Architecture supports evolution of either system

## Migration Notes

- Keep current principal-only MVP behind dev flag during implementation
- Web2 nonce table is new addition, doesn't affect existing schema
- Canister methods are simplified (remove nonce complexity from original plan)
- Frontend needs to handle signature generation and delegation chain extraction

---

## Glossary

### Nonce

- **Definition**: One-time, random token generated by Web2, valid for short TTL, single-use
- **Purpose**: Proves user controls II delegation at this moment (freshness + anti-replay)
- **Lifecycle**: Issue → store → sign → verify → consume

### Delegation Chain

- **Definition**: Cryptographic proof from Internet Identity that authorizes a session key
- **Contents**: Principal, targets, expiry, signatures
- **Verification**: Check origin, targets, expiry, signature validity

### Decoupling

- **Definition**: Systems operate independently with minimal dependencies
- **Benefit**: Each system remains functional and testable in isolation
- **Implementation**: Web3 trusts only IC delegation, Web2 trusts only its own nonce proof
