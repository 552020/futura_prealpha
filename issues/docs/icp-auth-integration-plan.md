# ICP-Auth Integration Plan

## Overview

Comprehensive plan to integrate Internet Identity (ICP) authentication with existing Auth.js system, providing a unified authentication experience.

## Key Decisions

- **Provider**: Use `id.ai` (keep a one-line env flag to fall back to `identity.ic0.app` if needed)
- **User Linking**: One web user ↔ many ICP principals (linking table)
- **UX Approach**: Unified entry point - one "Continue" dialog with two choices (Auth.js or Internet Identity). Linking happens later in Profile

## Minimal Data Model (Additions Only)

### Auth.js Compatibility Considerations

**Auth.js (NextAuth) is strict and should not be broken:**

- **users**: `id`, `name`, `email`, `emailVerified`, `image`
- **accounts**: `id`, `userId`, `provider`, `providerAccountId`, `type`, `refresh_token`, etc.
- **sessions**: `id`, `userId`, `sessionToken`, `expires`
- **verificationTokens**: for email flow

**The right approach for Internet Identity:**

- Treat II as just another **provider**
- In `accounts`, store `provider = "ii"`, and `providerAccountId = principal`
- `users.email` can stay `null` for II users
- `users` table stays untouched; you don't need to add `icp_principal` there

This way you get one login/signup flow, compatible with Auth.js' assumptions, and you keep flexibility for later linking.

### Table: `linked_identities` (For Account Linking)

```sql
- id (uuid)
- user_id (fk → users.id)
- kind = 'icp'
- principal (text, canonical)
- label (optional, user-facing)
- created_at, last_seen_at
- unique index on (kind, principal)
```

**Note**: This table is for linking additional ICP principals to existing users, not for the initial II authentication.

## Authentication Flows

### Login with Internet Identity (New User)

1. User chooses "Internet Identity"
2. Open II at `id.ai`, user authenticates (passkey or Google-inside-II)
3. You receive a principal (via delegation)
4. Server verifies proof → create user row + linked_identities(icp, principal)
5. Issue your normal Auth.js session (JWT)

**Result**: User is "web2-signed-in" and has an ICP principal linked from minute 1.

### Login with Auth.js (Google/Email)

1. User signs in as usual
2. (Optional, later) "Connect Internet Identity" in Profile
3. Same II popup → verify → insert linked_identities(icp, principal) for this user

**Result**: Existing users gain an ICP principal without changing their sign-in habit.

## Linking Policy & Duplicates

- Allow many ICP principals per user
- Enforce unique (kind, principal) across all users to prevent collisions
- On link attempt where principal is already linked to another user → block and show a precise error

## Client vs Server Canister Calls

- **Client-side**: Use the current `AuthClient` session (delegation) when the user is the actor
- **Server-side**: Only when the server is the actor (e.g., maintenance, indexing). Never reuse a user's II session on the server

## CSP / Allowlists (Generic, Fill URLs Later)

- `frame-src` / `child-src`: add `https://id.ai`
- `connect-src`: your canisters + `https://id.ai` (and legacy domain as fallback)
- If you keep legacy support: add `https://identity.ic0.app`

## Environment Variables

```bash
II_PROVIDER_URL = https://id.ai/
II_PROVIDER_URL_FALLBACK = https://identity.ic0.app
```

Use the primary; if auth fails due to migration issues, offer "Try legacy flow".

## Answer to Google-inside-II Support

**Yes, support it**. It's transparent: you still get only an ICP principal/delegation. Treat it exactly like passkey login. No Google OAuth token enters your system.

## Risk Checklist (What to Test)

- [ ] Same principal is stable across sessions for the same origin
- [ ] Multiple principals linked to one user behave correctly in UI and authorization
- [ ] "Already linked elsewhere" path returns a clear error
- [ ] id.ai works on Chrome/Safari/Firefox desktop + iOS/Android (passkeys)
- [ ] Fallback to legacy domain (only if you decide to keep it)
- [ ] Migration later doesn't change how you store principals

## Rollout Plan (Alpha → Prod)

1. **Phase 1**: Implement the unified entry dialog (Auth.js button + II button)
2. **Phase 2**: Add the linking table and verification endpoint
3. **Phase 3**: Wire env to `id.ai`, keep the fallback var
4. **Phase 4**: Ship to staging, run the test matrix above
5. **Phase 5**: If stable, drop the legacy fallback

## Implementation Notes

- This plan maintains existing Auth.js functionality while adding ICP support
- The unified approach provides a seamless user experience
- Account linking as a secondary feature allows gradual adoption
- Server-side calls are limited to maintenance/background tasks only
- CSP configuration ensures secure integration with Internet Identity

## Next Steps

1. Review and approve this plan
2. Create implementation checklist for development team
3. Begin with Phase 1 (unified entry dialog)
4. Set up development environment with new environment variables
