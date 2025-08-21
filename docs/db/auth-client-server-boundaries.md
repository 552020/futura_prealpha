# Authentication Client-Server Boundaries

## Overview

This document shows how to fix Next.js authentication errors that happen when developers accidentally mix client-side and server-side code. The problem occurs when you try to use database operations in client components or authentication hooks in server components, which breaks the build and causes runtime errors.

## ⚠️ Important Note

This document serves as a reference guide based on the **working implementation** in the Futura codebase. The error described below is **not present in Futura**, but this document explains how Futura's implementation correctly handles client-server boundaries, which can help solve similar issues in other projects.

## How Futura Handles Client-Server Boundaries

### 1. Auth Configuration Structure

Futura places the auth configuration in the correct location:

```typescript
// src/app/api/auth/[...nextauth]/auth.ts
import { db } from "@/db/db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  // ... rest of config
});
```

### 2. API Route Handler

The auth API route handler is properly separated:

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { auth } from "@/auth";

export const { GET, POST } = auth;
```

### 3. Client Components

Client components use the NextAuth client hooks instead of direct database access:

```typescript
// src/components/LanguageSwitcher.tsx
"use client";
import { useSession } from "next-auth/react";

export default function LanguageSwitcher() {
  const { data: session } = useSession();
  // ... component logic
}
```

### 4. Database Access

Database operations are handled through:

1. The NextAuth adapter for auth-related operations
2. Server actions for custom database operations
3. API routes for client-server communication

## Key Implementation Details

1. **Proper File Structure**:

   - Auth configuration is in the API route directory
   - Database operations are server-side only
   - Client components use hooks for auth state

2. **Import Chain**:

   - Client components → NextAuth hooks
   - API routes → Auth configuration
   - Auth configuration → Database adapter

3. **Session Management**:
   - Uses JWT strategy for performance
   - Handles session state through NextAuth
   - Properly separates client and server concerns

## Best Practices from Futura's Implementation

1. **Server Components**:

   - Keep database operations in API routes
   - Use server actions for data mutations
   - Implement proper error boundaries

2. **Client Components**:

   - Mark with "use client" directive
   - Use client-side hooks (useSession, etc.)
   - Implement loading states

3. **Middleware**:

   - Keep middleware lightweight
   - Avoid database operations
   - Use edge runtime when possible

4. **Authentication Flow**:
   - Handle auth state in client components
   - Perform auth checks in server components
   - Use proper error handling

## Implementation Checklist

- [ ] Separate server and client auth configurations
- [ ] Implement proper database access patterns
- [ ] Update component imports
- [ ] Configure proper build settings
- [ ] Add error boundaries
- [ ] Implement loading states
- [ ] Update middleware implementation
- [ ] Test client-server boundaries
