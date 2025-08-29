# Internet Identity Flow Explanation

## Overview

This document explains the complete Internet Identity (II) authentication flow implemented in the application. The flow starts from the user interface and involves both Web2 (NextAuth) and Web3 (ICP canister) components.

## Flow Entry Point

### User Button Component

The Internet Identity flow begins in the user interface with the **`user-button-client-with-ii.tsx`** component.

**File Location**: `src/nextjs/src/components/user-button-client-with-ii.tsx`

This component replaces the previous **`user-button-client.tsx`** which was leveraging only NextAuth for authentication. The new component integrates both NextAuth and Internet Identity authentication methods.

### Key Differences

- **Previous**: `user-button-client.tsx` - NextAuth only
- **Current**: `user-button-client-with-ii.tsx` - NextAuth + Internet Identity

## Custom Sign-in Page

### Why a Custom Page?

The previous button was opening NextAuth's default sign-in page with different authentication options (Google, GitHub, credentials). However, **Internet Identity was not available as a standard NextAuth provider option**.

### Solution: Custom Sign-in Page

We replaced the NextAuth default page with a **custom sign-in page** that includes Internet Identity as an authentication option.

**File Location**: `src/nextjs/src/app/[lang]/signin/page.tsx`

### Flow Navigation

1. **User clicks the button** in `user-button-client-with-ii.tsx`
2. **Routes to custom sign-in page** at `/[lang]/signin`
3. **Custom page displays** all authentication options including Internet Identity
4. **User selects "Sign in with Internet Identity"** to begin the II flow

### Authentication Options Available

The custom sign-in page provides:

- **Google OAuth** (NextAuth provider)
- **Email/Password** (NextAuth credentials)
- **Internet Identity** (Custom implementation)

**Note**: GitHub OAuth has been disabled and is not available in the current implementation.

## Authentication Flow Types

### Google OAuth Flow (NextAuth Standard)

When a user clicks "Sign in with Google":

1. **Frontend (Client)**: Calls `signIn("google")` from NextAuth
2. **Frontend (Client)**: NextAuth redirects user to Google for authentication
3. **Google**: User authenticates and grants permissions
4. **Google**: Redirects back to our application
5. **Frontend (Client)**: NextAuth automatically calls our backend endpoint
6. **Backend (Vercel)**: `/api/auth/[...nextauth]/route.ts` handles the request
7. **Backend (Vercel)**: The route delegates to handlers defined in `auth.ts`
8. **Backend (Vercel)**: NextAuth processes the Google response and creates session
9. **Frontend (Client)**: User is redirected to dashboard with active session

**Key Files**:

- **Route**: `src/nextjs/src/app/api/auth/[...nextauth]/route.ts` (minimal - just exports handlers)
- **Handlers**: `src/nextjs/auth.ts` (contains all the actual logic)

### Internet Identity Flow (Custom Implementation)

## General Overview

### What is Internet Identity?

**Internet Identity (II)** is a third-party authentication service, but unlike Google OAuth, it's a **canister on the Internet Computer (IC) Network**.

### Key Differences from Google OAuth

1. **Purpose**: II is designed as an authentication system for apps running on ICP (with ICP backends), not as a way to authenticate users on traditional Web2 apps
2. **Infrastructure**: Runs on the Internet Computer blockchain
3. **Integration**: Requires custom implementation since it's not a standard NextAuth provider

### Our Authentication Architecture

Our main sources of truth are:

- **Neon Database (PostgreSQL)**: Contains special tables that NextAuth needs to manage authentication sessions
- **NextAuth**: Handles session management and authentication flow

**Authentication Management**:

- **Known providers** (like Google): NextAuth handles user creation and session management automatically
- **Custom providers** (like Internet Identity): Requires manual implementation of user creation and session management

## How Google OAuth Works (for comparison)

When a user chooses to sign in with Google through NextAuth:

1. **Redirection to Google**:
   The user is redirected from your app to Google's OAuth 2.0 endpoint. Along with the redirect, your app passes a _client ID_, a _redirect URI_, and the requested _scopes_ (like profile, email).

2. **User Authentication and Consent**:
   The user logs in with their Google account and consents to share profile data with your app.

3. **Authorization Code Returned**:
   After successful login, Google redirects the user back to your app's redirect URI with an **authorization code**.

   - This code is a short-lived, single-use credential.
   - It proves that the user authenticated with Google.
   - Importantly, this code cannot be used to access user data directly; it must be exchanged server-side.

4. **Token Exchange (Server-side)**:
   NextAuth's backend exchanges the authorization code with Google's token endpoint by presenting:

   - The **authorization code**
   - Your app's **client ID** and **client secret** (stored securely, never exposed to the frontend)
   - The **redirect URI**

   If valid, Google responds with:

   - An **ID token** (JWT containing user identity information, like email, subject, etc.)
   - An **access token** (allows API calls to Google on behalf of the user)
   - Optionally, a **refresh token** (to get new access tokens without user login)

5. **User Profile Retrieval**:
   NextAuth uses the ID token and/or the access token to fetch the user's profile information (name, email, avatar) from Google.

6. **Database + Session**:
   NextAuth checks if this Google account already exists in your database. If not, it creates a new user entry. It then issues its own **session** (stored in your DB + cookie) that represents the logged-in user in your application.

**Key Security Points**:

- The authorization code is temporary and single-use
- The code cannot access user data directly - it must be exchanged server-side
- Actual identity information comes via the **ID token** (JWT) or Google's APIs with the **access token**

## Internet Identity Challenge

Unlike Google, Internet Identity doesn't provide a simple authorization code flow. Instead, it requires:

- **Challenge-response authentication** (nonce-based)
- **Canister verification** of user identity
- **Custom session management** integration with NextAuth

### How Internet Identity Works

1. **App-Specific Principals**:
   When a user signs up/signs in with Internet Identity, they receive a **principal** - a special identifier unique to the app they're requesting access for. If the same user tries to login to different apps with the same II, different principals will be produced, along with a delegation chain.

2. **Canister Authentication**:
   Normally, when using Internet Identity to sign in to an ICP canister, the canister can derive the principal of the call from the request itself and verify that the principal you're providing corresponds to the one making the call.

3. **Web2 Backend Challenge**:
   When making calls to a Web2 backend (where we want to save the new user who signed up with II in our Web2 database), the backend cannot read this authentication information from the API call itself.

### Our Initial Approach (Nonce Signing)

**Our Original Assumption**:
We initially assumed that Internet Identity would work like MetaMask - allowing users to sign arbitrary messages with their private key. Our plan was:

1. Generate a nonce on the Web2 backend
2. Have the user sign this nonce with their II private key
3. Verify the signature to prove possession of the key

**The Problem**:
Internet Identity **does not expose the private key** to applications. Unlike MetaMask, where you have access to the private key and can sign documents with it, II keeps the private key private for security reasons.

**What We Discovered**:

- II only exposes the **delegation chain** (public key + delegation proof)
- The **session private key** is kept private by II
- The `Identity` interface is designed for **canister calls**, not general signing

### The Solution: Canister-Backed Proof

Since direct signing isn't possible, we implemented a **canister-backed proof** approach:

1. **User authenticates with Internet Identity**
2. **Web2 issues a nonce** (challenge)
3. **User makes an authenticated canister call** with the nonce
4. **Canister records** "principal X proved nonce Y"
5. **Web2 verifies** by calling the canister to check the proof

This leverages the only thing II guarantees: **authenticated canister calls**.

#### 1. User authenticates with Internet Identity

Called From: `src/nextjs/src/app/[lang]/signin/page.tsx` in the `handleInternetIdentity` function

Purpose: Establishes the user's identity with the Internet Identity service and obtains their principal.

Implementation Details:

Client Function: `src/nextjs/src/ic/ii.ts`

- Function: `loginWithII()` - Initiates II authentication flow
- Function: `getAuthClient()` - Gets or creates AuthClient instance
- Function: `getSessionTtlNs()` - Configures session TTL from environment

Process:

1. Creates AuthClient instance
2. Opens II authentication popup/redirect
3. User authenticates with II provider
4. Returns `{ identity, principal }` for authenticated user

#### 2. Web2 issues a nonce (challenge)

Endpoint: `POST /api/ii/challenge`

Called From: `src/nextjs/src/app/[lang]/signin/page.tsx` in the `handleInternetIdentity` function via `fetchChallenge()`

Purpose: Creates a cryptographically secure challenge that the user must prove they can solve using their Internet Identity.

**Note**: A nonce is a temporary, one-time password/token. See APPENDIX II for detailed explanation.

Implementation Details:

Client Function: `src/nextjs/src/lib/ii-client.ts`

- Function: `fetchChallenge(callbackUrl?: string)` - Makes POST request to challenge endpoint

Route Handler: `src/nextjs/src/app/api/ii/challenge/route.ts`

- Function: `POST(request: NextRequest)`
- Security Checks: Origin validation, rate limiting, callback URL validation, TTL clamping
- Response: Returns `{ nonceId, nonce, ttlSeconds }`

Nonce Generation: `src/nextjs/src/lib/ii-nonce.ts`

- Function: `createNonce(context: NonceContext)` - Creates and stores nonce in database
- Function: `generateNonce()` - Generates 32-byte cryptographically secure random nonce
- Function: `hashNonce(nonce: string)` - Creates HMAC-SHA-256 hash for secure storage
- Security: Uses timing-safe comparison and rate limiting per IP address

Database Storage:

- Table: `iiNonces` in Neon PostgreSQL database
- Fields: `id`, `nonceHash`, `createdAt`, `expiresAt`, `usedAt`, `context` (JSON)
- TTL: Configurable between 60-600 seconds (default: 180 seconds)

Security Features:

- Rate Limiting: Maximum 10 nonces per IP per minute
- TTL Clamping: Prevents excessively long-lived nonces
- CSRF Protection: Origin/referer validation
- Open Redirect Prevention: Callback URL validation
- Atomic Operations: Prevents race conditions during nonce consumption

#### 3. User makes an authenticated canister call with the nonce

Called From: `src/nextjs/src/app/[lang]/signin/page.tsx` in the `handleInternetIdentity` function

Purpose: User proves they control the II principal by making an authenticated call to the canister with the nonce.

Implementation Details:

Client Function: `src/nextjs/src/lib/ii-client.ts`

- Function: `registerWithNonce(nonce: string, identity: Identity)` - Makes authenticated canister call
- Function: `backendActor(identity)` - Creates actor with authenticated identity

Canister Function: `src/backend/src/lib.rs`

- Function: `register_with_nonce(nonce: String)` - Registers user and stores nonce proof

#### 4. Canister records "principal X proved nonce Y"

Implementation Details:

Canister Storage: `src/backend/src/memory.rs`

- Function: `store_nonce_proof(nonce: String, principal: Principal)` - Stores nonce proof
- Storage: `static NONCE_PROOFS` - Thread-local storage for nonce proofs

#### 5. Web2 verifies by calling the canister to check the proof

Called From: `src/nextjs/auth.ts` in the NextAuth "ii" provider's `authorize` function

Purpose: Web2 backend verifies the nonce proof by querying the canister.

Implementation Details:

Server Function: `src/nextjs/src/lib/server-actor.ts`

- Function: `createServerSideActor()` - Creates server-side canister actor

API Route: `src/nextjs/src/app/api/ii/verify-nonce/route.ts`

- Function: `POST(request: NextRequest)` - Verifies nonce with canister

Canister Function: `src/backend/src/lib.rs`

- Function: `verify_nonce(nonce: String)` - Verifies and consumes nonce proof

## Detailed Flow Steps

[To be detailed in next section...]

---

## APPENDIX I: Detailed Provider Comparison

### Detailed Explanation

The key difference lies in how NextAuth processes authentication data:

**For Google OAuth**:

- NextAuth receives a complete user profile from Google (email, name, picture, etc.)
- NextAuth automatically creates/updates the user in the database
- Session management is handled transparently

**For Internet Identity**:

- We receive only a principal ID and proof of authentication
- We must manually implement user creation/retrieval logic
- We must handle the integration between ICP identity and NextAuth sessions
- We need custom database queries and user management

This is why the Internet Identity provider in `auth.ts` has much more complex logic compared to the Google provider.

### Google Provider (Automatic)

```typescript
Google({
  clientId: process.env.AUTH_GOOGLE_ID!,
  clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  profile(profile) {
    return {
      id: profile.sub, // Google provides user ID
      email: profile.email, // Google provides email
      name: profile.name, // Google provides name
      image: profile.picture, // Google provides picture
      role: "user", // We assign default role
    };
  },
});
```

**What happens automatically**:

- NextAuth calls Google's API with the authorization code
- Google returns complete user profile
- NextAuth automatically creates/updates user in database
- Session is created automatically

### Internet Identity Provider (Manual)

```typescript
CredentialsProvider({
  id: "ii",
  name: "Internet Identity",
  credentials: {
    principal: { label: "Principal", type: "text" },
    nonceId: { label: "Nonce ID", type: "text" },
    nonce: { label: "Nonce", type: "text" },
  },
  async authorize(credentials) {
    const { principal, nonceId, nonce } = credentials;

    // 1. Manual validation
    if (!principal || typeof principal !== "string" || principal.length < 5) {
      throw new Error("Invalid principal provided.");
    }

    // 2. Manual database lookup for nonce
    const nonceRecord = await db.query.iiNonces.findFirst({
      where: eq(iiNonces.id, nonceId),
    });

    // 3. Manual verification with canister
    const response = await fetch(`${baseUrl}/api/ii/verify-nonce`, {
      method: "POST",
      body: JSON.stringify({ nonce: nonceStr }),
    });

    // 4. Manual user creation/retrieval
    const existingAccount = await db.query.accounts.findFirst({
      where: (a, { and, eq }) => and(eq(a.provider, "internet-identity"), eq(a.providerAccountId, principal)),
    });

    if (existingAccount) {
      // Return existing user
      return { id: existingUser.id, email: existingUser.email /* ... */ };
    } else {
      // Create new user manually
      const insertedUsers = await db.insert(users).values({}).returning({ id: users.id /* ... */ });
      const newUser = insertedUsers[0];

      // Create account mapping manually
      await db.insert(accounts).values({
        userId: newUser.id,
        type: "oidc",
        provider: "internet-identity",
        providerAccountId: principal,
      });

      return { id: newUser.id, email: newUser.email /* ... */ };
    }
  },
});
```

**What we must handle manually**:

- Input validation
- Nonce verification with canister
- Database queries for user lookup
- User creation and account mapping
- Error handling and security checks
- Integration between ICP principal and NextAuth user

## APPENDIX II: Understanding Nonces

A **nonce** is a temporary, one-time password/token generated by your backend that serves as a cryptographic challenge.

### Key Properties

**Random & unpredictable** → Generated with crypto-secure randomness (32-byte random data)

**Short-lived** → Expires after TTL (default: 3 minutes, configurable 60-600 seconds)

**Single-use** → Once proven, it's marked as `usedAt` and cannot be reused

**Bound to context** → Stored with metadata (IP, User-Agent, callback URL) to prevent replay attacks

**Proof of possession** → Instead of typing it in, the II identity proves it by making an authenticated canister call that includes the nonce

### Comparison: Google OAuth vs Internet Identity

| Aspect                   | Google OAuth               | Internet Identity        |
| ------------------------ | -------------------------- | ------------------------ |
| **Temporary Credential** | Authorization code         | Nonce                    |
| **Lifetime**             | ~10 minutes                | 3 minutes (configurable) |
| **Usage**                | Exchanged for tokens       | Proved via canister call |
| **Security**             | HTTPS + client secret      | Canister-backed proof    |
| **Storage**              | In-memory or database      | Database with HMAC hash  |
| **Verification**         | Token exchange with Google | Canister query           |

### Practical Role

Both play the same role: a short-lived, single-use proof that connects the external identity provider (Google or II canister) to your backend session system (NextAuth).

- **Google OAuth** → gives you an **authorization code** (temporary credential)
- **Internet Identity** → gives you a **nonce** (temporary credential)

## APPENDIX III: Why "fetchChallenge" and Not "fetchNonce"?

### What `fetchChallenge` Actually Does

The function calls the Next.js API route `/api/ii/challenge` which:

- Generates a **nonce** and **nonceId** in the Postgres database (`iiNonces` table)
- Returns them to the frontend so the user can later _prove_ that nonce to the canister

### Why We Need a Challenge

With Internet Identity:

- You can't ask users to "sign a message" like with MetaMask — II doesn't expose private keys
- The only thing II allows is **authenticated canister calls**
- Web2 backend needs a way to verify: _did this principal really prove possession of their II identity?_

The challenge serves this purpose:

1. Web2 generates nonce + nonceId → hands raw nonce to client
2. Client passes nonce into `registerWithNonce(nonce, identity)` → makes authenticated canister call
3. Canister stores proof: _principal X has used nonce Y_
4. Web2 (NextAuth `authorize`) later checks canister with same nonceId/nonce → confirms proof → binds session

### Security Role of the Challenge

- **Replay protection** → each nonce is one-time, expires after TTL, marked `usedAt` once consumed
- **CSRF/open redirect protection** → callback URL validated
- **Rate limiting** → prevents abuse of nonce endpoint
- **Binding** → links Web2 flow (NextAuth session) with Web3 flow (II canister call)

### Why "Challenge" is Better Naming

**Industry Alignment**: The naming follows standard conventions in OAuth, WebAuthn, challenge–response auth, and cryptography:

- The server issues a **challenge**
- That challenge is usually just a **nonce** (random string)
- The client must **prove** or **respond to the challenge**

**Standard Practice Examples**:

- OAuth: "authorization code" is the challenge
- WebAuthn: server sends "challenge" (random bytes) to authenticator
- SRP / TLS: server sends "challenge" nonce

**Benefits of "Challenge" Naming**:

- ✅ **Industry standard** → familiar to developers in auth flows
- ✅ **Protocol clarity** → indicates this is part of challenge–response protocol
- ✅ **Implementation agnostic** → doesn't hide the security purpose behind implementation details

**Why Not "fetchNonce"**:

- ❌ Too implementation-specific → hides the fact this is part of a challenge–response protocol
- ❌ Less clear for people used to industry-standard "challenge" terminology

### In One Sentence

`fetchChallenge` is the step that **bridges Web2 and Web3**: it gives the client a fresh nonce that must be proven via the canister before Web2 accepts Internet Identity login.
