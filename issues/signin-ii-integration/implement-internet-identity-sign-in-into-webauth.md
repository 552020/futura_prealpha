# Implement Internet Identity sign-in into web auth flow

## Summary

We need to add Internet Identity (II) as a first-class sign-in option alongside existing providers (GitHub, Google, Email/Password, WebAuthn). The global header "Sign In" should present all options, including II. Choosing II must result in a standard NextAuth session, and the user must be registered in our database following the same invariants as other providers.

- Reference ICP page (II implemented): `src/nextjs/src/app/[lang]/user/icp/page.tsx`
- Reference header sign-in button: `src/nextjs/src/components/user-button-client.tsx`
- NextAuth config and registration flow: `src/nextjs/auth.ts`
- DB schema (users/accounts/sessions/authenticators/allUsers): `src/nextjs/src/db/schema.ts`

## Current state

- Providers configured: GitHub, Google, Credentials (email/password). See `providers` in `src/nextjs/auth.ts`.
- Registration/creation: Handled by DrizzleAdapter and `events.createUser` (promotes temporary users to permanent and creates `allUsers` entry).
- WebAuthn support: Database table `authenticator` exists ("required for webauthn by auth.js") in `schema.ts`. The passkey flow is already wired via NextAuth/adapter and persists authenticators.
- II flow is implemented only on the ICP page via `@dfinity/auth-client` and is not wired into the global NextAuth sign-in or database registration.

## Problem statement

Add II as an equal sign-in option in the global UI without breaking existing NextAuth behavior. When a user signs in with II, we must create/link an application user in our DB (same way other providers do), maintain session semantics, and keep future provider linking viable.

## Goals

- The header "Sign In" shows options: GitHub, Google, Email/Password, WebAuthn/Passkey, and Internet Identity.
- Choosing II results in:
  - A valid NextAuth session (client and SSR aware)
  - A persisted user in `user` and `all_user` tables
  - A provider mapping in `account` (provider = `internet-identity`, providerAccountId = principal) to align with multi-provider linking
- No changes required to the schema; reuse existing `users`, `accounts`, `sessions`, `authenticator`, and `all_user`.
- Existing provider flows remain unaffected.

## Non-goals

- Replacing or prioritizing II over other providers; all options remain available.
- Storing II private keys or delegation chains on the server. Only the principal is stored/mapped.

## Proposed approach (recommended)

- Keep NextAuth as the single session authority.
- Add an II bridge using a Credentials provider (e.g., id: `ii`) to carry the principal into NextAuth:
  1. In the header (`user-button-client.tsx`), add a "Sign in with Internet Identity" option that calls `AuthClient.login()`.
  2. On success, retrieve `principal = identity.getPrincipal().toString()`.
  3. Call `signIn("ii", { principal, redirect: false })`.
  4. In `authorize(credentials)` for `ii`:
     - Validate principal format.
     - Look up an existing `account` with `provider = 'internet-identity'` and `providerAccountId = principal` to find the owning user.
     - If none, create a new `user` row (minimal fields), then create an `account` row linking `provider = 'internet-identity'`, `providerAccountId = principal`, and `userId`.
     - Ensure an `allUsers` entry exists for the created user, mirroring `events.createUser` behavior (promote temporary user if applicable). Prefer extracting the "promote temporary user" logic in `auth.ts` into a shared helper and reuse it here to avoid duplication.
  5. JWT/session callbacks: optionally surface `icpPrincipal` in the session from the `account` mapping.
- Logout: call both `authClient.logout()` and NextAuth `signOut()` so II and app session are in sync.

Rationale:

- Uses existing NextAuth/DrizzleAdapter patterns.
- Persists a provider mapping in `account`, consistent with OAuth providers and future linking.
- Avoids schema changes and keeps WebAuthn and other providers intact.

## Feasibility within NextAuth and DB safety

- Credentials provider is supported and does not conflict with OAuth providers.
- Creating `user` and `account` records programmatically in `authorize` is safe if we follow the same constraints as the adapter (unique `users.id`, unique `accounts` composite key `(provider, providerAccountId)`).
- `schema.ts` already defines `users`, `accounts`, `sessions`, and `authenticator` tables. `accounts` is suitable for mapping principal to user as a provider identity.
- The promotion logic to `allUsers` exists in `events.createUser`; duplicating that behavior should be done via a shared helper to avoid breaking invariants.

## Changes required

- UI: Update `src/nextjs/src/components/user-button-client.tsx` to display a menu/modal with all providers, adding an explicit II option that triggers the client flow described above.
- Auth config: Add a new Credentials provider `ii` in `src/nextjs/auth.ts` with `authorize` implementing the DB lookup/create and `account` mapping. Optionally expose `icpPrincipal` in JWT/session callbacks.
- ICP page: Optionally, when login occurs here, also bridge to NextAuth via `signIn("ii", ...)` so the header reflects the session immediately.
- Helper: Extract the temporary-user promotion/create `allUsers` behavior from `events.createUser` into a shared function and call it from the II `authorize` path when a new user is created.

## Acceptance criteria

- Header sign-in lists GitHub, Google, Email/Password, WebAuthn/Passkey, and Internet Identity.
- Selecting II completes II login, creates or links a DB user, writes an `account` row with `provider = 'internet-identity'` and `providerAccountId = principal`, and yields a valid NextAuth session.
- The session is visible in `useSession()` and SSR via `auth()`; optional `session.user.icpPrincipal` is available.
- Sign-out clears both II and NextAuth state.
- Existing provider and WebAuthn flows keep working without migrations.

## References

- II flow implementation: `src/nextjs/src/app/[lang]/user/icp/page.tsx`
- Header auth UI: `src/nextjs/src/components/user-button-client.tsx`
- NextAuth config and events: `src/nextjs/auth.ts`
- DB schema: `src/nextjs/src/db/schema.ts` (`users`, `accounts`, `sessions`, `authenticator`, `all_user`)

## Open questions for senior review

- Do we prefer exposing `icpPrincipal` on the session, or deriving it from the `accounts` mapping per request?
- Should we enable II user linking to existing users (e.g., if Google and II principals both belong to the same person)? What is the merge policy?
- Any UX changes desired for the sign-in modal (iconography/order/labels for II vs Passkey)?

## Clarifications and decisions

### 1) Session field vs deriving principal from accounts

- Expose on session: Add `icpPrincipal` to JWT/session during callbacks. Pros: easy client access (`useSession()`), fewer DB lookups on each render/API. Cons: duplicates data that also exists in `account` mapping.
- Derive on demand: Query `account` table (provider = `internet-identity`) to fetch the principal whenever needed. Pros: single source of truth. Cons: extra DB lookup per request/use.
- Decision: Expose `icpPrincipal` on the session for convenience/perf, keep `accounts` as canonical. On login, read the `account` row once and copy principal into the token/session. If the account changes, the session will refresh on next login.

### 2) Linking II to existing users (low priority, do if easy)

- Simple path (easy): When a user is already signed in via any provider, offer a "Link Internet Identity" action in profile/settings. Flow: call `AuthClient.login()`, get principal, insert `account` row with `provider = 'internet-identity'`, `providerAccountId = principal`, `userId = currentUser.id`. No merging required; standard provider linking.
- Unauthenticated linking (harder): II doesn’t provide email, so automatic matching is unsafe. Skip for now.

### 3) Sign-in modal ownership and adding II option

- Header button `src/nextjs/src/components/user-button-client.tsx` calls `signIn()` with no provider, which uses NextAuth’s default sign-in page (we don’t override `pages` in `auth.ts`).
- We own the onboarding UI (see `src/nextjs/src/components/onboarding/steps/sign-up-step.tsx`) which already lists GitHub/Google/Credentials.
- To reliably include II, prefer a custom sign-in UI/modal that we own (e.g., `SignInDialog`) rendered from `user-button-client.tsx`. This lists all providers and triggers either `signIn(provider)` or the II flow (`AuthClient.login()` → `signIn('ii', { principal })`). The default NextAuth page is limited for custom II flows.

### 4) Validation: II will not break WebAuthn tables

- WebAuthn uses the `authenticator` table (`schema.ts`), managed by Auth.js for passkeys. II does not write to `authenticator`.
- II will create/link records in `users` and `account` only (with `provider = 'internet-identity'`, `providerAccountId = principal`). This mirrors how OAuth providers add identities and does not touch passkey data.
- User creation follows existing invariants: DrizzleAdapter + our `events.createUser` logic ensures an `allUsers` entry is created or a temporary user is promoted. For II, if we create a user in `authorize`, we call the same promotion helper to maintain consistency.
- Open question (to monitor): Ensure our `authorize` path for II user creation runs the same promotion logic as `events.createUser`. Action: extract that logic into a shared helper and reuse it.
