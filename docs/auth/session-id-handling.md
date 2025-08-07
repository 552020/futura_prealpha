# Session ID Handling in Futura

## Overview

Futura implements a robust session management system using NextAuth.js (Auth.js) with JWT strategy. This document explains how user IDs are handled throughout the authentication flow.

## Core Components

### 1. Session Strategy

Futura uses JWT-based sessions for optimal performance:

```typescript
session: {
  strategy: "jwt";
}
```

This strategy:

- Stores session data in an encrypted JWT token
- Reduces database queries
- Maintains consistent session state

### 2. Session Callback

The session callback in `auth.ts` handles the mapping of user data:

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.role = token.role as string;
    session.user.id = token.sub as string;  // ✅ Critical: Maps JWT sub to session ID
  }
  return session;
}
```

### 3. JWT Callback

The JWT callback manages token data:

```typescript
async jwt({ token, account, user }) {
  if (user?.role) {
    token.role = user.role;
  }
  return token;
}
```

### 4. Type Definitions

Proper type definitions ensure type safety:

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

## Provider Configuration

### OAuth Providers

Both Google and GitHub providers are configured to return proper user IDs:

```typescript
// Google Provider
Google({
  profile(profile) {
    return {
      id: profile.sub, // ✅ Google's unique identifier
      email: profile.email,
      name: profile.name,
      image: profile.picture,
      role: "user",
    };
  },
}),
  // GitHub Provider
  GitHub({
    profile(profile) {
      return {
        id: profile.id.toString(), // ✅ GitHub's unique identifier
        email: profile.email,
        name: profile.name,
        image: profile.avatar_url,
        role: "user",
      };
    },
  });
```

## Authentication Flow

1. **User Authentication**:

   - User signs in via OAuth provider
   - Provider returns user profile with unique ID
   - Profile is mapped to NextAuth format

2. **Session Creation**:

   - JWT token is created with user data
   - `token.sub` is set to user's unique ID
   - Token is encrypted and stored in cookie

3. **Session Access**:
   - Client requests session data
   - JWT is decrypted
   - `token.sub` is mapped to `session.user.id`
   - Session object is returned to client

## Security Considerations

1. **JWT Encryption**:

   - Tokens are encrypted using `AUTH_SECRET`
   - Secret is generated using `openssl rand -base64 32`

2. **Session Validation**:

   - Automatic token validation on each request
   - Expiration handling
   - CSRF protection

3. **Database Integration**:
   - User data stored in PostgreSQL via Drizzle
   - OAuth accounts linked to user records
   - Proper foreign key constraints

## Best Practices

1. **ID Consistency**:

   - Always use provider's unique identifier
   - Map IDs consistently in callbacks
   - Maintain type safety

2. **Session Management**:

   - Use JWT strategy for performance
   - Implement proper error handling
   - Handle session expiration

3. **Type Safety**:
   - Define proper TypeScript interfaces
   - Use strict type checking
   - Document type extensions

## Troubleshooting

Common issues and solutions:

1. **Missing User ID**:

   - Check provider configuration
   - Verify JWT callback
   - Ensure proper session mapping

2. **Session Inconsistency**:

   - Verify JWT secret
   - Check token expiration
   - Validate callback URLs

3. **Type Errors**:
   - Update type definitions
   - Check interface extensions
   - Verify type imports

## Implementation Checklist

- [ ] Configure JWT strategy
- [ ] Set up proper callbacks
- [ ] Define type interfaces
- [ ] Configure OAuth providers
- [ ] Implement security measures
- [ ] Test authentication flow
- [ ] Handle edge cases
- [ ] Document implementation
