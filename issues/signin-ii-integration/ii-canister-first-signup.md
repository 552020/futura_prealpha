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

## High-Level Flow (Revised - Canister-Backed Proof)

1. **Frontend**: Ensure II identity via Internet Identity (`AuthClient.login` → principal/delegation available)
2. **Frontend → Web2**: `POST /api/ii/challenge` to get `{ nonceId, nonce, ttlSeconds }` (Web2-minted, short-TTL, single-use)
3. **Frontend → Web3**: Call `register_with_nonce(nonce)` on canister (registers user + proves nonce in one call)
4. **Frontend → Web2**: `signIn('internet-identity', { principal, nonceId })` (no signature needed)
5. **Web2**: Call canister `verify_nonce(nonce)` to get principal who proved it, create/link user + account, issue session
6. **Frontend → Web3** (Optional): Call `mark_bound()` to signal successful Web2 binding

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

- **State**:
  - `principal → { registered_at: u64, last_activity_at: u64, bound: bool }` (capsule-based)
  - `nonce → (principal, timestamp)` (nonce proof storage)
- **Methods**:
  - `register_with_nonce(nonce)`: Register user + prove nonce in one call (optimized for II auth)
  - `register()`: Idempotent upsert by `caller` principal (for other use cases)
  - `prove_nonce(nonce)`: Store nonce proof with caller's principal and timestamp (backward compatibility)
  - `verify_nonce(nonce)`: Return principal who proved this nonce
  - `mark_bound()` (Optional): Sets `bound=true` for UX/metrics convenience
  - No complex verification logic, leverages II's authenticated canister calls

### Frontend (Sign-in Page)

- Ensure II identity with `AuthClient.login`
- Fetch challenge from Web2: `{ nonceId, nonce }`
- Call canister `register_with_nonce(nonce)` (registers user + proves nonce in one call)
- Call `signIn('internet-identity', { principal, nonceId })` (no signature needed)
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

### Canister Methods (Web3 - Rust)

```rust
// Register user and prove nonce in one call (optimized for II auth flow)
#[ic_cdk::update]
pub fn register_with_nonce(nonce: String) -> bool {
    let caller = ic_cdk::api::msg_caller();
    let timestamp = ic_cdk::api::time();

    // Register the user
    capsule::register();

    // Store nonce proof
    memory::store_nonce_proof(nonce, caller, timestamp);

    true
}

// Idempotent registration - no nonce needed (for other use cases)
#[ic_cdk::update]
pub fn register() -> bool {
    capsule::register()
}

// Nonce proof for II authentication (backward compatibility)
#[ic_cdk::update]
pub fn prove_nonce(nonce: String) -> bool {
    let caller = ic_cdk::api::msg_caller();
    let timestamp = ic_cdk::api::time();
    memory::store_nonce_proof(nonce, caller, timestamp)
}

// Verify nonce proof
#[ic_cdk::query]
pub fn verify_nonce(nonce: String) -> Option<Principal> {
    memory::get_nonce_proof(nonce)
}

// Optional binding signal from Web2
#[ic_cdk::update]
pub fn mark_bound() -> bool {
    capsule::mark_bound()
}
```

### NextAuth Authorize (Web2)

```typescript
// Pseudocode inside authorize(credentials)
const { principal, nonceId } = credentials;

// 1. Validate nonce exists, unexpired, unused
const nonceValidation = await validateNonce(nonceId);
if (!nonceValidation.valid) return null;

// 2. Call canister to verify nonce proof
const canisterActor = await backendActor();
const provedPrincipal = await canisterActor.verify_nonce(nonceValidation.nonce);
if (!provedPrincipal || provedPrincipal.toString() !== principal) return null;

// 3. Atomic DB transaction
await db.transaction(async (tx) => {
  await consumeNonce(nonceId);
  const user = await findOrCreateUser(principal);
  await linkAccount(user.id, "internet-identity", principal);
  return user;
});
```

## Implementation TODOs (Revised - Canister-Backed Proof)

### 1. **Web2: nonce storage** ✅ COMPLETED

- ✅ 1.1 Create `ii_nonces` table (id, nonceHash, createdAt, expiresAt, usedAt, context JSON)
- ✅ 1.2 Add helper to hash and compare nonce values

### 2. **Web2: challenge endpoint** ✅ COMPLETED

- ✅ 2.1 `POST /api/ii/challenge` → returns `{ nonceId, nonce, ttlSeconds }`
- ✅ 2.2 Persist nonce with context: `{ callbackUrl, ip/user-agent (optional) }`

### 3. **Canister: keep it independent** ✅ COMPLETED

- [x] ~~3.1 `register_with_nonce(nonce)`: Register user + prove nonce in one call~~ ✅ DONE
- [x] ~~3.2 `register()` (idempotent): upsert by `caller` principal (for other use cases)~~ ✅ DONE
- [x] ~~3.3 `prove_nonce(nonce)`: Store nonce proof with caller's principal (backward compatibility)~~ ✅ DONE
- [x] ~~3.4 `verify_nonce(nonce)`: Return principal who proved this nonce~~ ✅ DONE
- [x] ~~3.5 Optional: `mark_bound()` (caller = principal) → sets `bound=true`~~ ✅ DONE

### 4. **Frontend (signin page)** ✅ COMPLETED

- [x] ~~4.1 Ensure II identity with `AuthClient.login`~~ ✅ DONE
- [x] ~~4.2 Fetch challenge → get `{ nonceId, nonce }`~~ ✅ DONE
- [x] ~~4.3 Call `register_with_nonce(nonce)` on canister (registers user + proves nonce)~~ ✅ DONE
- [x] ~~4.4 Call `signIn('internet-identity', { principal, nonceId })` (no signature needed)~~ ✅ DONE

### 5. **NextAuth authorize (Web2)** ✅ COMPLETED

- [x] ~~5.1 Validate inputs: `principal`, `nonceId`~~ ✅ DONE
- [x] ~~5.2 Check nonce exists, unexpired, unused~~ ✅ DONE
- [x] ~~5.3 Call canister `verify_nonce(nonce)` to get principal who proved it~~ ✅ DONE
- [x] ~~5.4 Verify the principal matches the claimed principal~~ ✅ DONE
- [x] ~~5.5 In single transaction: mark nonce used, create/link user + account, issue session~~ ✅ DONE
- [x] ~~5.6 (Optional) After success, frontend calls `mark_bound()` on canister~~ ✅ DONE

### 6. **Error handling & logging**

- [x] ~~6.1 Clear error messages for stale/missing proof and re-auth prompts~~ ✅ DONE
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

- **Web2 Security**: Session only issued after valid canister-backed nonce proof
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

- **Strong Proof-of-Possession**: Web2 verifies user controls the key via canister-backed proof
- **Fresh Challenges**: Nonces prevent replay attacks
- **II Authentication**: Leverages II's authenticated canister calls
- **No Shared Secrets**: Each system maintains its own security boundaries

### Operational Benefits

- **Clear Responsibilities**: Web2 handles auth, Web3 handles business logic
- **Independent Deployment**: Systems can be updated separately
- **Better Monitoring**: Clear separation makes debugging easier
- **Future-Proof**: Architecture supports evolution of either system

## Migration Notes

- Keep current principal-only MVP behind dev flag during implementation
- Web2 nonce table is new addition, doesn't affect existing schema
- Canister methods use Rust (not Motoko) with capsule-based architecture
- Frontend uses canister-backed proof instead of signature generation
- Leverages II's authenticated canister calls for security

---

## Glossary

### Nonce

- **Definition**: One-time, random token generated by Web2, valid for short TTL, single-use
- **Purpose**: Proves user controls II delegation at this moment (freshness + anti-replay)
- **Lifecycle**: Issue → store → sign → verify → consume

### Canister-Backed Proof

- **Definition**: Proof of nonce possession stored in canister via authenticated II call
- **Process**: User calls `prove_nonce(nonce)` with II identity, canister stores proof
- **Verification**: Web2 calls `verify_nonce(nonce)` to get principal who proved it

### Decoupling

- **Definition**: Systems operate independently with minimal dependencies
- **Benefit**: Each system remains functional and testable in isolation
- **Implementation**: Web3 trusts only IC delegation, Web2 trusts canister as proof oracle
