# Google Login and User Storage

## Question

Which are the relevant files and lines in this codebase that make possible when a user login with google provider that they are saved into the database?

## Answer

Based on the codebase analysis, here's how Google login and user storage works:

### 1. Google Provider Configuration (in `auth.ts`)

```typescript
Google({
  clientId: process.env.AUTH_GITHUB_ID!,
  clientSecret: process.env.AUTH_GITHUB_SECRET!,
  profile(profile) {
    return {
      id: profile.sub, // Google's unique user ID
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      role: "user",
    };
  },
});
```

### 2. Database Adapter (in `auth.ts`)

```typescript
adapter: DrizzleAdapter(db);
```

This uses the Drizzle ORM adapter to connect NextAuth to your PostgreSQL database.

### 3. Database Schema (in `src/db/schema.ts`)

The schema defines two main tables that handle user storage:

#### Users Table

```typescript
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // ... other fields
});
```

#### Accounts Table

```typescript
export const accounts = pgTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  // ... other OAuth fields
});
```

## How It Works

### Unauthenticated Flow (New User)

1. When a user logs in with Google for the first time:

   - The Google provider configuration receives the user's profile data
   - The `profile()` function maps Google's data to the format NextAuth expects
   - The Drizzle adapter automatically:
     - Creates a new user in the `users` table
     - Creates an entry in the `accounts` table linking the Google account to the user
     - Stores OAuth tokens and other provider-specific data

2. The `createUser` event handler is triggered:

```typescript
events: {
  async createUser({ user }) {
    // Check for temporary users
    const temporaryUser = await db.query.temporaryUsers.findFirst({
      where: (temporaryUsers, { eq }) => eq(temporaryUsers.email, user.email!),
    });

    if (temporaryUser) {
      // Handle promotion of temporary user to permanent user
      await db.update(allUsers)
        .set({
          type: "user",
          userId: user.id,
          temporaryUserId: null,
        })
        .where(eq(allUsers.id, allUserEntry.id));

      // Delete temporary user
      await db.delete(temporaryUsers)
        .where(eq(temporaryUsers.id, temporaryUser.id));
    } else {
      // Create new allUsers entry
      await db.insert(allUsers).values({
        type: "user",
        userId: user.id,
      });
    }
  }
}
```

### Authenticated Flow (Returning User)

1. When a user logs in with Google and already has an account:

   - The Google provider configuration receives the user's profile data
   - The `profile()` function maps Google's data
   - The Drizzle adapter:
     - Finds the existing user in the `users` table
     - Updates the linked account in the `accounts` table if needed
     - Updates OAuth tokens and other provider-specific data

2. The `signIn` event handler is triggered:

```typescript
events: {
  async signIn({ user, account, profile }) {
    console.log("[Auth] 👋 User signed in:", { user, account, profile });
  }
}
```

## Key Features

This system ensures that:

- Users are properly stored in the database
- OAuth accounts are linked to users
- User data is normalized and consistent
- The system can handle both new and returning users
- Temporary users can be promoted to permanent users
- Session management is handled automatically

The process is mostly automated by NextAuth and the Drizzle adapter, with the main configuration happening in the provider setup and database schema definition.
