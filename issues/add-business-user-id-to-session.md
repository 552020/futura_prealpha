# Add Business User ID to Session

## Problem

Currently, every API route needs to query the `allUsers` table to get the business user ID from the Auth.js user ID:

```typescript
// Current pattern (repeated everywhere)
const session = await auth();
const allUser = await db.query.allUsers.findFirst({
  where: eq(allUsers.userId, session.user.id),
});
const businessUserId = allUser?.id;
```

This creates:

- **Performance overhead**: N+1 query problem
- **Code duplication**: Same pattern in every API route
- **Complexity**: Extra database lookup for basic operations

## Solution

Add `businessUserId` to the session object so it's available directly:

```typescript
// After implementation
const session = await auth();
const businessUserId = session.user.businessUserId; // Direct access
```

## Implementation Plan

### Step 1: Update JWT Callback

**File**: `src/app/api/auth/[...nextauth]/auth.ts`

```typescript
async jwt({ token, user }) {
  // Existing role logic (keep unchanged)
  if (user?.role) {
    token.role = user.role;
  }

  // NEW: Add business user ID lookup
  if (user?.id && !token.businessUserId) {
    const allUser = await db.query.allUsers.findFirst({
      where: eq(allUsers.userId, user.id),
      columns: { id: true },
    });
    if (allUser?.id) {
      token.businessUserId = allUser.id;
    }
  }

  return token;
}
```

### Step 2: Update Session Callback

**File**: `src/app/api/auth/[...nextauth]/auth.ts`

```typescript
async session({ session, token }) {
  if (session.user) {
    // Existing logic (keep unchanged)
    session.user.role = token.role as string;
    session.user.id = token.sub as string;

    // NEW: Add business user ID
    if (token.businessUserId && typeof token.businessUserId === "string") {
      (session.user as any).businessUserId = token.businessUserId;
    }
  }
  return session;
}
```

### Step 3: Add Type Definitions (Optional)

**File**: `src/types/next-auth.d.ts` (create if doesn't exist)

```typescript
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      businessUserId?: string;
    } & DefaultSession["user"];
  }
}
```

## Safety Measures

### ✅ Zero Breaking Changes

- Keep existing `session.user.id` unchanged
- All existing code continues to work
- New field is optional

### ✅ Gradual Migration

- New code can use `session.user.businessUserId`
- Old code can be updated incrementally
- No forced migration required

### ✅ Error Handling

- Graceful fallback if `allUsers` row not found
- Won't break authentication flow
- Logs warning for debugging

### ✅ Performance Optimization

- Only queries database if `businessUserId` not already in token
- Prevents redundant lookups on JWT refresh
- Single query per login session

## Testing Plan

### Manual Testing

1. **Existing user sign-in**:

   - Sign in with existing account
   - Verify `session.user.businessUserId` is populated
   - Verify existing functionality unchanged

2. **New user sign-up**:

   - Create new account via Auth.js
   - Verify business user ID gets linked correctly
   - Verify session contains both IDs

3. **Guest flow**:
   - Test temporary user creation
   - Verify no session changes for guests
   - Test guest → permanent conversion

### API Testing

```typescript
// Test endpoint to verify session
// GET /api/auth/session
{
  "user": {
    "id": "auth_user_123",           // Auth.js user ID (unchanged)
    "businessUserId": "alluser_456", // Business user ID (new)
    "email": "user@example.com",
    "name": "User Name",
    "role": "user"
  }
}
```

## Implementation Order

1. **Step 1 Only**: Update JWT callback, test thoroughly
2. **Step 2 Only**: Update session callback, test thoroughly
3. **Step 3 Only**: Add type definitions
4. **Verification**: Test all flows end-to-end

## Rollback Plan

If issues arise, simply **remove the new code** from the callbacks:

- Remove business user ID lookup from JWT callback
- Remove business user ID assignment from session callback
- **Zero schema changes** to rollback

## Success Criteria

- ✅ `session.user.businessUserId` available in all authenticated sessions
- ✅ Existing authentication flows unchanged
- ✅ Performance improvement in API routes
- ✅ Type safety (if types added)
- ✅ Zero breaking changes

## Future Benefits

Once implemented, API routes can be simplified:

```typescript
// Before
const session = await auth();
const allUser = await db.query.allUsers.findFirst({
  where: eq(allUsers.userId, session.user.id),
});
const businessUserId = allUser?.id;

// After
const session = await auth();
const businessUserId = session.user.businessUserId;
```

This eliminates the most common database query pattern in the application.
