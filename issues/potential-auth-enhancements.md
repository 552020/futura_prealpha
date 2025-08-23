# Potential Auth Enhancements from API Route auth.ts

## Overview

The API route `auth.ts` file (`src/app/api/auth/[...nextauth]/auth.ts`) has been commented out and is no longer used. However, it contains some valuable features that could enhance the root `auth.ts` for better robustness.

## Current Status

- ✅ Root `auth.ts` works perfectly without these enhancements
- ✅ All functionality is consolidated in the root auth configuration
- ✅ No immediate issues or bugs

## Potential Enhancements

### 1. `waitForUser()` Helper Function

**Location**: Lines 12-35 in commented API route `auth.ts`

**Purpose**: Provides retry logic with exponential backoff to ensure user exists in database before operations.

**Code**:

```typescript
async function waitForUser(userId: string, maxRetries = 12, initialDelayMs = 500): Promise<true> {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[Auth] 🔄 Attempt ${i + 1}/${maxRetries} to verify user existence (userId: ${userId})`);
    const user = await db.query.users.findFirst({
      where: (usersTable, { eq }) => eq(usersTable.id, userId as string),
    });

    if (user) {
      console.log(`[Auth] ✅ User found in database on attempt ${i + 1}:`, {
        id: user.id,
        email: user.email,
      });
      return true;
    }

    const delayMs = initialDelayMs * Math.pow(2, i); // Exponential backoff
    console.log(`[Auth] ⏳ User not found on attempt ${i + 1}, waiting ${delayMs}ms before retry`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const totalWaitTime = Array.from({ length: maxRetries }).reduce(
    (sum: number, _, i) => sum + initialDelayMs * Math.pow(2, i),
    0
  );

  const error = `User ${userId} not found in database after ${maxRetries} retries over ${totalWaitTime}ms total wait time`;
  console.error(`[Auth] ❌ ${error}`);
  throw new Error(error);
}
```

**Benefits**:

- Prevents race conditions during user creation
- Ensures user exists before proceeding with `allUsers` operations
- Provides detailed logging for debugging

### 2. Enhanced `createUser` Event

**Location**: Lines 150-220 in commented API route `auth.ts`

**Purpose**: More robust error handling using `waitForUser()` function.

**Key Differences from Current Root Version**:

- Uses `waitForUser(user.id!)` before database operations
- More detailed logging and error handling
- Ensures user is available before creating `allUsers` entries

**Benefits**:

- Prevents database errors from timing issues
- Better error reporting and debugging
- More defensive programming approach

### 3. Simpler Redirect Callback

**Location**: Lines 90-100 in commented API route `auth.ts`

**Purpose**: Alternative approach to handling callback URLs.

**Code**:

```typescript
redirect({ url, baseUrl }) {
  // If there's a callbackUrl in the URL, use that
  const callbackUrl = new URL(url).searchParams.get("callbackUrl");
  if (callbackUrl) {
    return callbackUrl;
  }

  // Default to vault page
  return `${baseUrl}/vault`;
}
```

**Current Root Version**: Has more complex logic with `isLoginFlow` detection.

## Implementation Priority

### High Priority (Recommended)

1. **`waitForUser()` function** - Most valuable for preventing race conditions
2. **Enhanced `createUser` event** - Uses the `waitForUser()` function

### Low Priority (Optional)

3. **Simpler redirect callback** - Current version works fine, this is just an alternative approach

## Implementation Plan

If we decide to implement these enhancements:

1. **Add `waitForUser()` function** to root `auth.ts`
2. **Enhance the `createUser` event** to use `waitForUser()`
3. **Test thoroughly** to ensure no regressions
4. **Consider the redirect callback** only if we encounter issues with current logic

## Decision Criteria

**Implement if**:

- We encounter race condition issues during user creation
- We see database errors related to timing
- We want more defensive programming practices

**Don't implement if**:

- Current system works perfectly without issues
- We want to keep the codebase simple
- No timing-related problems are observed

## Notes

- These enhancements are purely defensive programming
- The current system works fine without them
- They add complexity but improve robustness
- Can be implemented incrementally if needed

```ts
/**
 * NOTE: This file is commented out and no longer used.
 *
 * Features that could be brought over to root auth.ts if needed:
 *
 * 1. waitForUser() helper function - Provides retry logic with exponential backoff
 *    to ensure user exists in database before operations. Useful for preventing
 *    race conditions during user creation.
 *
 * 2. Enhanced createUser event - Uses waitForUser() to ensure user is available
 *    before creating allUsers entries. More robust error handling.
 *
 * 3. Simpler redirect callback - Handles callbackUrl parameter more directly.
 *
 * Current root auth.ts works fine without these, but they could add robustness
 * if we encounter timing issues with user creation.
 */

import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db/db";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { allUsers, temporaryUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

Helper function to wait for user to be available in the database
async function waitForUser(userId: string, maxRetries = 12, initialDelayMs = 500): Promise<true> {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[Auth] 🔄 Attempt ${i + 1}/${maxRetries} to verify user existence (userId: ${userId})`);
    const user = await db.query.users.findFirst({
      where: (usersTable, { eq }) => eq(usersTable.id, userId as string),
    });

    if (user) {
      console.log(`[Auth] ✅ User found in database on attempt ${i + 1}:`, {
        id: user.id,
        email: user.email,
      });
      return true;
    }

    const delayMs = initialDelayMs * Math.pow(2, i); // Exponential backoff
    console.log(`[Auth] ⏳ User not found on attempt ${i + 1}, waiting ${delayMs}ms before retry`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const totalWaitTime = Array.from({ length: maxRetries }).reduce(
    (sum: number, _, i) => sum + initialDelayMs * Math.pow(2, i),
    0
  );

  const error = `User ${userId} not found in database after ${maxRetries} retries over ${totalWaitTime}ms total wait time`;
  console.error(`[Auth] ❌ ${error}`);
  throw new Error(error);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          email: profile.email,
          name: profile.name,
          image: profile.avatar_url,
          role: "user" as string,
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role: "user",
        };
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const user = await db.query.users.findFirst({
          where: (usersTable, { eq }) => eq(usersTable.email, email),
        });
        if (!user || !user.password) return null;
        const passwordMatch = await compare(credentials.password as string, user.password);
        if (!passwordMatch) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    redirect({ url, baseUrl }) {
      // If there's a callbackUrl in the URL, use that
      const callbackUrl = new URL(url).searchParams.get("callbackUrl");
      if (callbackUrl) {
        return callbackUrl;
      }

      // Default to vault page
      return `${baseUrl}/vault`;
    },
    async jwt({ token, user }) {
      if (user?.role) {
        token.role = user.role;
      }

      // Add business user ID lookup
      if (user?.id && !token.businessUserId) {
        try {
          const allUser = await db.query.allUsers.findFirst({
            where: (allUsers, { eq }) => eq(allUsers.userId, user.id!),
            columns: { id: true },
          });
          if (allUser?.id) {
            token.businessUserId = allUser.id;
            console.log("[Auth] ✅ Business user ID added to token:", {
              authUserId: user.id,
              businessUserId: allUser.id,
            });
          } else {
            console.warn("[Auth] ⚠️ No allUsers entry found for Auth.js user:", user.id);
          }
        } catch (error) {
          console.error("[Auth] ❌ Error looking up business user ID:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;

        // Add business user ID
        if (token.businessUserId && typeof token.businessUserId === "string") {
          (session.user as { businessUserId?: string }).businessUserId = token.businessUserId;
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("[Auth] ⭐️ Starting createUser event with user:", {
        id: user.id,
        email: user.email,
        name: user.name,
      });

      try {
        // Check if there's a temporary user with the same email
        const temporaryUser = await db.query.temporaryUsers.findFirst({
          where: (temporaryUsers, { eq }) => eq(temporaryUsers.email, user.email!),
        });
        console.log("[Auth] 🔍 Temporary user check:", temporaryUser ? "Found" : "Not Found");

        // Find the corresponding allUsers entry if temporary user exists
        const allUserEntry = temporaryUser
          ? await db.query.allUsers.findFirst({
              where: (allUsers, { eq }) => eq(allUsers.temporaryUserId, temporaryUser.id),
            })
          : null;
        console.log("[Auth] 🔍 Existing allUsers entry:", allUserEntry ? "Found" : "Not Found");

        if (temporaryUser && allUserEntry) {
          console.log("[Auth] 🚀 Promoting temporary user to permanent user:", {
            temporaryUserId: temporaryUser.id,
            newUserId: user.id,
            allUserId: allUserEntry.id,
            email: user.email,
          });

          // Wait for user to be available before updating
          await waitForUser(user.id!);

          // Update the allUsers entry to point to the new permanent user
          await db
            .update(allUsers)
            .set({
              type: "user",
              userId: user.id!,
              temporaryUserId: null,
            })
            .where(eq(allUsers.id, allUserEntry.id));
          console.log("[Auth] ✅ Successfully updated allUsers entry");

          // Delete the temporary user since we've migrated their data
          await db.delete(temporaryUsers).where(eq(temporaryUsers.id, temporaryUser.id));
          console.log("[Auth] ✅ Successfully deleted temporary user");
        } else {
          console.log("[Auth] 🆕 Attempting to create new allUsers entry for:", {
            userId: user.id,
            email: user.email,
          });

          // Wait for user to be available before creating allUsers entry
          await waitForUser(user.id!);

          const [newAllUser] = await db
            .insert(allUsers)
            .values({
              type: "user",
              userId: user.id!,
            })
            .returning();

          console.log("[Auth] ✅ Successfully created allUsers entry:", newAllUser);
        }
      } catch (error) {
        console.error("[Auth] ❌ Error in createUser event:", error);
        throw error;
      }
    },
    async linkAccount(account) {
      console.log("[Auth] 🔗 Account linked:", account);
    },
    async signIn({ user, account, profile }) {
      console.log("[Auth] 👋 User signed in:", { user, account, profile });
    },
  },
});
```
