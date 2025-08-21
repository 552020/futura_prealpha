# Authentication Implementation

## Core Components

### 1. NextAuth Configuration (`auth.ts`)

The main authentication configuration is handled in `auth.ts`:

```typescript
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
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
    // ... other providers
  ],
  callbacks: {
    // ... callbacks
  },
  events: {
    // ... events
  },
});
```

### 2. NextAuth API Routes

#### `src/app/api/auth/[...nextauth]/auth.ts`

This file contains the core NextAuth configuration and is responsible for:

- Setting up authentication providers
- Configuring the database adapter
- Defining session strategy
- Handling authentication events
- Managing callbacks

Key features:

```typescript
// Database adapter setup
adapter: DrizzleAdapter(db)

// JWT session strategy
session: { strategy: "jwt" }

// Authentication providers
providers: [
  Google({...}),
  GitHub({...}),
  CredentialsProvider({...})
]

// Callbacks for customizing authentication flow
callbacks: {
  async jwt({ token, account, user }) {
    // Custom JWT token handling
  },
  async session({ session, token }) {
    // Custom session handling
  },
  authorized({ request, auth }) {
    // Route protection logic
  }
}

// Events for handling authentication lifecycle
events: {
  async createUser({ user }) {
    // Handle new user creation
  },
  async signIn({ user, account, profile }) {
    // Handle successful sign in
  },
  async signOut(message) {
    // Handle sign out
  }
}
```

#### `src/app/api/auth/[...nextauth]/route.ts`

This file is the API route handler for NextAuth. It:

- Exports the NextAuth handlers
- Sets up the API endpoints for authentication
- Handles all authentication-related HTTP requests

Implementation:

```typescript
import { auth } from "@/auth";

export const { GET, POST } = auth;
```

The route handles these endpoints:

- `/api/auth/signin` - Sign in endpoint
- `/api/auth/signout` - Sign out endpoint
- `/api/auth/callback` - OAuth callback endpoint
- `/api/auth/session` - Session management endpoint
- `/api/auth/csrf` - CSRF protection endpoint

### 3. Authentication Components

#### UserButtonClient (`user-button-client.tsx`)

```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function UserButtonClient({ lang = "en" }: UserButtonClientProps) {
  const { data: session, status } = useSession();

  // Loading state
  if (status === "loading") {
    return (
      <Button variant="ghost" size="icon" className="animate-pulse">
        ...
      </Button>
    );
  }

  // Authenticated state
  if (session?.user) {
    return (
      <DropdownMenu>
        {/* User menu with sign out option */}
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenu>
    );
  }

  // Unauthenticated state
  return (
    <Button variant="ghost" size="icon" onClick={() => signIn("google")}>
      <LogIn className="h-5 w-5" />
    </Button>
  );
}
```

## Authentication Flow

### 1. Sign In Flow

1. **User Initiation**:

   - User clicks the sign-in button in `UserButtonClient`
   - `signIn("google")` is called from `next-auth/react`

2. **OAuth Flow**:

   - User is redirected to Google's OAuth consent screen
   - After consent, Google redirects back to your application
   - NextAuth handles the OAuth callback

3. **User Creation/Update**:

   - The `createUser` event is triggered
   - User data is stored in the database via DrizzleAdapter
   - Session is created and stored

4. **Session Management**:
   - JWT token is created and stored in cookies
   - User is redirected to the application

### 2. Sign Out Flow

1. **User Initiation**:

   - User clicks sign out in the dropdown menu
   - `signOut()` is called from `next-auth/react`

2. **Session Cleanup**:
   - Session is invalidated
   - JWT token is removed from cookies
   - User is redirected to the home page

### 3. Session Management

The application uses JWT-based sessions:

```typescript
session: {
  strategy: "jwt";
}
```

This means:

- Session data is stored in an encrypted JWT token
- No database queries needed for session validation
- Faster performance as no database lookups are required

## Database Integration

### 1. User Storage

Users are stored in the database using the DrizzleAdapter:

```typescript
adapter: DrizzleAdapter(db);
```

The adapter handles:

- User creation
- Account linking
- Session management
- Token storage

### 2. Database Schema

Key tables for authentication:

```typescript
// Users table
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").unique(),
  name: text("name"),
  image: text("image"),
  role: text("role"),
  // ... other fields
});

// Accounts table for OAuth
export const accounts = pgTable("account", {
  userId: text("userId").references(() => users.id),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  // ... OAuth fields
});
```

## Security Features

1. **Environment Variables**:

   - OAuth credentials stored in `.env.local`
   - Database connection string secured
   - JWT secret key for session encryption

2. **Session Protection**:

   - JWT-based sessions with encryption
   - Automatic session validation
   - CSRF protection

3. **OAuth Security**:
   - Secure token exchange
   - Proper callback URL validation
   - State parameter for OAuth flow

## Error Handling

The authentication system includes error handling for:

- Failed OAuth attempts
- Invalid sessions
- Database connection issues
- Missing environment variables

## Development Considerations

1. **Environment Setup**:

   - Required environment variables
   - OAuth provider configuration
   - Database connection

2. **Testing**:

   - Authentication flow testing
   - Session management testing
   - Error handling testing

3. **Deployment**:
   - Environment variable configuration
   - OAuth callback URL setup
   - Database connection configuration
