# Authentication Setup

This project uses Auth.js (formerly NextAuth.js) for authentication with both OAuth providers and database storage.

## Configuration Overview

We use a hybrid approach:

- JWT strategy for session management (faster, no DB queries for sessions)
- Database adapter for user storage (persistent user data)

### Key Files

#### 1. Core Authentication Files

1. `auth.ts` (root)
2. `src/db/schema.ts`
3. `app/api/auth/[...nextauth]/route.ts`
4. `middleware.ts`

##### 1. auth.ts

The root configuration file sets up the authentication system:

```typescript
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [GitHub, Google],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl;
      // Protected route patterns
      const protectedPatterns = [
        "/admin", // Admin routes
        "/user/", // User routes
      ];
      return protectedPatterns.some((pattern) => pathname.startsWith(pattern)) ? !!auth : true;
    },
  },
});
```

This file:

- Configures authentication providers (GitHub, Google)
- Sets up session strategy (JWT)
- Defines protected routes
- Exports authentication utilities
- Manages callback functions

**Key Features**:

- JWT-based sessions for performance
- Multiple OAuth providers
- Route protection patterns
- Debug mode in development
- Custom callback handlers

##### 2. schema.ts

The database schema file defines the structure for authentication-related tables:

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable("accounts", {
  userId: text("userId").notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: timestamp("expires_at", { mode: "date" }),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});
```

This file:

- Defines user profile storage
- Manages OAuth account connections
- Handles session data (when using database sessions)
- Supports email verification

##### 3. Route Handler

The route handler file (`app/api/auth/[...nextauth]/route.ts`) is required to handle authentication requests:

```typescript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

This file:

- Creates the authentication API endpoints
- Handles OAuth callbacks
- Manages sign-in/sign-out requests
- Processes session tokens

**Important Notes**:

- Must be placed in `app/api/auth/[...nextauth]/route.ts`
- Exports both GET and POST handlers
- Required for OAuth providers to work
- Handles all auth-related API requests automatically

The route handler works with Next.js App Router to provide:

- OAuth authentication flow
- Session management
- Token handling
- API endpoints for authentication

##### 4. middleware.ts

The middleware file controls routing behavior and authentication:

```typescript
export { auth as middleware } from "@/auth";

// Configure which routes use the middleware
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

This file:

- Checks authentication status
- Protects routes
- Manages session tokens
- Supports custom logic through callbacks

### Environment Variables

Required variables for authentication:

```env
AUTH_SECRET=your-secret-key
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### Type Safety

TypeScript types are automatically handled through:

- Drizzle's type inference for database models
- Auth.js's built-in types for authentication
- Session type augmentation for user ID

## Development vs Production

### Development

- Uses localhost:3000
- Separate OAuth app credentials
- Local database

### Production

- Uses production domain
- Production OAuth credentials
- Production database

## Adding New OAuth Providers

1. Install provider package
2. Add provider config to `auth.ts`
3. Add OAuth credentials to environment variables
4. Update types if needed

## Session Management

- JWT-based for performance
- No database queries for session validation
- Session data includes user ID
- 30-day default expiry

## Security Notes

- JWT strategy cannot be revoked server-side
- User data persists in database
- OAuth tokens stored securely in database
- Environment variables must be kept secret

```

```
