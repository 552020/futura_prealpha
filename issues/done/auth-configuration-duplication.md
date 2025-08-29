# Auth Configuration Duplication Issue

## Problem Description

We have **two separate NextAuth.js configuration files** with conflicting settings:

### Files:

1. **Root `auth.ts`** - `/auth.ts` (project root)
2. **API Route `auth.ts`** - `/src/app/api/auth/[...nextauth]/auth.ts`

### Git History Timeline:

- **Root auth.ts:** Created March 23, 2025 (older, basic version)
- **API route auth.ts:**
  - **March 25, 2025:** Created - "chore: fix all_users entry not created on user creation"
  - **April 2, 2025:** "chore: fix some bugs and do enhancements in the modal"
  - **August 23, 2025:** "feat: add businessUserId to session for improved performance"
  - **4+ month gap** between April and August suggests this was a **specific performance enhancement**
- **Latest commit:** "feat: add businessUserId to session for improved performance" - **recent active development**

### Current Usage (MIXED - WORSE THAN INITIALLY THOUGHT):

- **Root `auth.ts`** is used by **most API routes** and components
- **API Route `auth.ts`** is used by **folder upload route** and potentially others
- **This creates INCONSISTENT auth behavior** across the app
- API route handler imports from root: `import { handlers } from "@/auth"`
- BUT folder upload imports: `import { auth } from "@/app/api/auth/[...nextauth]/auth"`

## Key Differences Between Configurations

### Root `auth.ts` (Currently Active - Used by Most Routes):

**Operations:**

- ✅ **Authentication providers** (GitHub, Google, Credentials)
- ✅ **Basic JWT handling** (role, accessToken)
- ✅ **Simple redirect** to `/vault` after login
- ✅ **Session management** (basic user info)
- ✅ **Authorization middleware** (admin routes, test routes)
- ❌ **Missing business user ID logic**
- ❌ **Missing temporary user promotion logic**
- ❌ **Missing onboarding flow support**

**Used by:**

- Most API routes (`/api/memories/*`, `/api/users/*`, etc.)
- Components (`user-button.tsx`, etc.)
- Pages (`/tests/*`, `/shared/*`, etc.)

### API Route `auth.ts` (Partially Used - INTENTIONAL ENHANCEMENT):

**Operations:**

- ✅ **All basic auth operations** (same as root)
- ✅ **Business user ID lookup** and session injection
- ✅ **Temporary user promotion** (onboarding flow)
- ✅ **Wait for user function** with retry logic
- ✅ **Enhanced redirect handling** with callbackUrl support
- ✅ **Comprehensive user creation events**
- ✅ **Database consistency checks** (waitForUser)
- ✅ **Performance optimization** (businessUserId in session)

**Used by:**

- Folder upload route (`/api/memories/upload/folder`)
- Potentially other routes that need business logic

## Impact

### Current Issues:

1. **INCONSISTENT AUTH BEHAVIOR** - Some routes get business logic, others don't
2. **Missing Business Logic** - Most routes don't get `businessUserId` in session
3. **Broken Onboarding** - Temporary user promotion only works in some contexts
4. **Inconsistent Redirects** - Different redirect logic in each file
5. **Maintenance Nightmare** - Two configs to maintain
6. **Incomplete Migration** - Enhancement was started but not completed

### Files Affected:

- All API routes using `auth` from root config
- User authentication flow
- Onboarding process
- Session management

## Questions for Senior Review

1. **Which configuration should be the canonical one?**

   - Root `auth.ts` (simpler, currently active)
   - API route `auth.ts` (more complete, unused)

2. **Should we consolidate or keep separate?**

   - Merge best parts into single config
   - Keep separate for different purposes
   - Replace root with API route version

3. **Migration strategy:**

   - How to safely migrate without breaking existing auth
   - Testing approach for auth changes
   - Rollback plan if issues arise

4. **Business logic priority:**
   - Is the business user ID logic critical?
   - Is temporary user promotion needed?
   - Which features are actually being used?

## Recommended Action

**DO NOT MODIFY** until senior review and decision on:

- Which configuration to keep
- Migration strategy
- Testing approach

## Files to Review

- `/auth.ts` (root)
- `/src/app/api/auth/[...nextauth]/auth.ts` (partially used - enhancement)
- `/src/app/api/auth/[...nextauth]/route.ts` (imports from root)
- All API routes using `@/auth` import
