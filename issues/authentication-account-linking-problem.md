# Authentication Account Linking Problem

## Problem Description

When users sign in with multiple authentication providers (Google and Internet Identity), we need to link these accounts together so they represent the same user. Currently, each authentication provider creates a separate user account, which causes data fragmentation and poor user experience.

## Current Behavior Analysis

### Code Analysis

Based on the current `auth.ts` implementation:

#### Google Authentication

```typescript
Google({
  profile(profile) {
    return {
      id: profile.sub, // Uses Google's sub as user ID
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      role: "user",
    };
  },
});
```

#### Internet Identity Authentication

```typescript
CredentialsProvider({
  id: "ii",
  async authorize(credentials) {
    // ... verification logic ...

    // Creates NEW user account for II
    const insertedUsers = await db
      .insert(users)
      .values({}) // Creates user with no email/name
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    // Links II principal to this new user
    await db.insert(accounts).values({
      userId: newUser.id,
      type: "oidc",
      provider: "internet-identity",
      providerAccountId: principal,
    });
  },
});
```

### Current Problems

1. **Separate User Accounts**: Google and II create different user records in the `users` table
2. **Data Fragmentation**: User data (memories, galleries, settings) is split across multiple accounts
3. **Session Conflicts**: NextAuth switches between accounts instead of merging them
4. **Poor UX**: Users lose access to their data when switching authentication methods

## Required Solution

### Account Linking Strategy

We need to implement a system that:

1. **Links Existing Accounts**: When a user signs in with II while already authenticated with Google, link the II principal to the existing Google account
2. **Prevents Duplicate Accounts**: Don't create new user accounts for linked authentications
3. **Maintains Data Integrity**: Ensure all user data remains accessible regardless of authentication method

### Implementation Approach

#### Option 1: Email-Based Linking (Recommended)

```typescript
// When user signs in with II
async function linkIIToExistingUser(principal: string, email?: string) {
  if (email) {
    // Try to find existing user by email
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      // Link II principal to existing user
      await db.insert(accounts).values({
        userId: existingUser.id,
        type: "oidc",
        provider: "internet-identity",
        providerAccountId: principal,
      });
      return existingUser;
    }
  }

  // Create new user if no email match
  return createNewUser(principal);
}
```

#### Option 2: Manual Account Linking

```typescript
// Allow users to manually link accounts in settings
async function linkAccounts(googleUserId: string, iiPrincipal: string) {
  // Verify both accounts exist
  const googleUser = await getUserById(googleUserId);
  const iiAccount = await getAccountByPrincipal(iiPrincipal);

  if (googleUser && iiAccount) {
    // Update II account to point to Google user
    await db.update(accounts).set({ userId: googleUserId }).where(eq(accounts.providerAccountId, iiPrincipal));

    // Delete the separate II user account
    await db.delete(users).where(eq(users.id, iiAccount.userId));
  }
}
```

#### Option 3: Session-Based Linking

```typescript
// During II signin, check if user is already authenticated with Google
async function handleIILinking(principal: string, session: Session) {
  if (session?.user?.email) {
    // User is already signed in with Google, link II to that account
    const existingUser = await getUserByEmail(session.user.email);
    return linkIIToExistingUser(principal, existingUser);
  }

  // No existing session, create new user
  return createNewUser(principal);
}
```

### Database Schema Changes

#### Option A: Add Linking Fields to Users Table

```sql
ALTER TABLE "user" ADD COLUMN linked_accounts JSONB DEFAULT '{}';
-- Store linked account IDs: { "google": "sub123", "ii": "principal456" }
```

#### Option B: Use Existing Accounts Table (Recommended)

```sql
-- The accounts table already supports multiple providers per user
-- Just need to ensure proper linking logic
```

### User Experience Flow

#### Scenario 1: Google User Adds II

1. User is signed in with Google
2. User clicks "Store Forever" → needs II authentication
3. User signs in with II
4. System detects existing Google session
5. System links II principal to existing Google account
6. User now has both authentications linked

#### Scenario 2: II User Adds Google

1. User is signed in with II
2. User wants to use Google features
3. User signs in with Google
4. System prompts: "Link to existing II account?"
5. User confirms linking
6. Accounts are merged

#### Scenario 3: New User

1. User signs in with either provider
2. Creates new account
3. Later signs in with other provider
4. System prompts for linking

### Implementation Steps

1. **Modify II Authentication Logic**

   - Check for existing user by email
   - Link II principal to existing account if found
   - Only create new user if no existing account

2. **Add Account Linking UI**

   - Settings page to manage linked accounts
   - Link/unlink functionality
   - Account merging interface

3. **Update Session Management**

   - Ensure session contains data from all linked accounts
   - Handle authentication method switching

4. **Data Migration**
   - Identify duplicate accounts
   - Provide migration tools for existing users
   - Merge user data safely

### Questions for Senior Developer

1. **Linking Strategy**: Which linking approach is most appropriate for our use case?
2. **Data Migration**: How should we handle existing users with multiple accounts?
3. **Security**: What security considerations apply to account linking?
4. **UX Design**: How should we present account linking to users?
5. **Session Management**: How should NextAuth handle multiple linked authentications?

### Related Files

- `src/nextjs/auth.ts` - Authentication configuration
- `src/nextjs/src/db/schema.ts` - Database schema
- `src/nextjs/src/app/[lang]/sign-ii-only/page.tsx` - II signin page
- `src/nextjs/src/components/galleries/ForeverStorageProgressModal.tsx` - Storage modal

### Priority

**High** - This affects core user experience and data integrity. Users need to maintain access to their data regardless of authentication method.

### Dependencies

- NextAuth multiple provider support
- Database schema modifications
- User interface for account management
- Data migration strategy
