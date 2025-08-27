# TODO – Implement Internet Identity sign-in into web auth flow

Reference: `src/nextjs/issues/implement-internet-identity-sign-in-into-webauth.md`

## MVP tasks

1. [x] Duplicate `user-button-client.tsx` → `user-button-client-with-ii.tsx`
2. [x] Render `UserButtonClientWithII` to the left of the existing button in `src/nextjs/src/components/header.tsx`
3. [x] Create custom sign-in page (no II yet) to replace NextAuth default; list Google, Email/Password (+ II placeholder)
       3.1) [x] Route: create `src/nextjs/src/app/[lang]/signin/page.tsx`
       3.2) [x] Render as route-backed modal: full-screen container with dialog-style UI
       3.3) [x] Provider buttons: `signIn('google')`, `signIn('credentials', { email, password })`
       3.4) [ ] Optional: Passkey button if already wired (reuse existing flow)
       3.5) [x] Respect `callbackUrl`/redirects via NextAuth config; default to `/${lang}/dashboard`
       3.6) [ ] Accessibility: focus trap, keyboard navigation, close button
       3.7) [x] Close behavior: navigate back or to home when dismissed
       3.8) [x] Error states: show provider/credentials errors inline
       3.9) [x] Styling: match existing UI (use shadcn/ui components)
4. [ ] Update header "Sign In" to navigate to the custom sign-in page
       4.1) [x] Update `src/nextjs/src/components/user-button-client-with-ii.tsx` unauthenticated state to navigate to `/${lang}/signin` (do not use the default NextAuth page; keep it only as reference)
       4.2) [x] Preserve `lang` param and optional `callbackUrl`
       4.3) [x] Keep fallback link to default NextAuth page for safety during rollout
5. [x] Wire II login flow in the new button (`AuthClient.login` → `signIn('ii')`)
       5.1) [x] Enhance II login implementation
       5.1.1) [x] Add session TTL using `NEXT_PUBLIC_II_SESSION_TTL_HOURS` (pass `maxTimeToLive`)
       5.1.2) [x] Create cached `getAuthClient()` helper to avoid repeated IndexedDB reads
       5.1.3) [x] Create `loginWithII({ maxTimeToLiveNs })` utility returning `{ identity, principal }`
       5.1.4) [x] Create `clearIiSession()` utility to logout and clear caches (`clearAgentCache`, cached actor)
       5.1.5) [x] Provide inline feedback (button label/message) instead of toasts inside modal
       5.1.6) [x] Handle expired/invalid delegation with inline "Session expired" message and redirect to `/{lang}/signin`
       5.1.7) [ ] Refactor `ICPPage` to use shared helpers (`getAuthClient`, `loginWithII`, `clearIiSession`)
       5.1.8) [x] Update `SignOut` to call `clearIiSession()` so NextAuth sign-out also clears II
6. [ ] Unify header sign-in to a single button that routes to `/{lang}/signin`
       6.1) [ ] For now, keep both buttons for testing; the long-term goal is ONE button
       6.2) [ ] Update `src/nextjs/src/components/user-button-client.tsx` unauthenticated state to navigate to `/{lang}/signin?callbackUrl=...`
       6.4) [ ] Ensure mobile menu also shows a single button and routes to the custom page
       6.5) [ ] (moved) – see task 13
7. [x] Add NextAuth Credentials provider `ii` with principal-based `authorize`
       7.1) [ ] Implement II authorize() to find-or-create user and link account in Drizzle
8. [ ] Expose `icpPrincipal` in JWT/session during callbacks
9. [ ] Extract and reuse `allUsers` promotion logic for II user creation
10. [ ] QA: verify all providers + II end-to-end and DB writes
11. [ ] Cleanup: consolidate to single user button or custom sign-in page
12. [ ] After testing, remove `UserButtonClientWithII` and keep only `UserButtonClient` (was 6.3)
13. [ ] Finalize: Keep II as a placeholder only on the custom sign-in page (no direct II from header) (was 6.5)

## Notes

- Keep schema unchanged; use `accounts` for `provider='internet-identity'` mapping.
- Logout should clear both II (`AuthClient.logout`) and NextAuth session.

## Enhance ICP login

Moved under 5.1 as subtasks.
