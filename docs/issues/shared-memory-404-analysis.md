# Shared Memory 404 Analysis

## Current Behavior

When clicking a shared memory from the `/[lang]/shared` page, we get a 404 error.

## Request Flow Analysis

1. **Click Handler in Shared Page**:

```typescript
const handleMemoryClick = (memory: Memory) => {
  router.push(`/${lang}/shared/${memory.id}`);
};
```

2. **Expected Route Structure**:

```
/[lang]/shared/[id]/page.tsx
  ↓
Expects: /api/memories/shared/[id]?code=xxx
```

## Potential Issues

1. **Missing Query Parameter**:

   - The shared memory route requires a `code` parameter
   - We're not passing this in the navigation
   - Original URL structure was: `/memories/shared/[id]?code=xxx`

2. **API Route Mismatch**:

   - Frontend route: `/[lang]/shared/[id]`
   - API route: `/api/memories/shared/[id]`
   - Need to verify API endpoint still matches

3. **Security Code Handling**:

```typescript
// In [id]/page.tsx
if (!code) {
  notFound();
}
```

## API Routes Analysis

### `/api/memories/[id]`

- **Purpose**: Core memory operations (GET, DELETE) for authenticated users
- **Access**: Requires authentication
- **Use Case**: Regular users accessing their own memories or shared memories
- **Note**: This is the main endpoint for memory operations by authenticated users

### `/api/memories/[id]/download`

- **Purpose**: Generate download URLs for memory files
- **Access**: Requires authentication or valid share code
- **Use Case**: Both authenticated users and temporary users downloading memory files
- **Flow**:
  1. Checks user authentication first
  2. Falls back to share code if not authenticated
  3. Generates temporary download URL

### `/api/memories/[id]/share`

- **Purpose**: Share a memory with another user
- **Access**: Requires authentication (owner only)
- **Use Case**: When a user wants to share their memory with another user
- **Operation**:
  1. Creates a share record in the database
  2. Generates secure codes if needed
  3. Sends email notifications if configured
- **Note**: This is for permanent sharing between registered users

### `/api/memories/[id]/share-link`

- **Purpose**: Generate temporary access links
- **Access**: Public with valid share code
- **Use Case**: For temporary/unauthenticated access to shared memories
- **Flow**:
  1. Validates the share code
  2. Returns memory data with appropriate access level
  3. Handles both owner and invitee secure codes
- **Note**: Used for magic links and temporary sharing only

### `/api/memories/shared`

- **Purpose**: List all memories shared with the authenticated user
- **Access**: Requires authentication
- **Use Case**: Main endpoint for the shared memories page
- **Operation**:
  1. Fetches all share records for the user
  2. Groups by memory type (images, videos, etc.)
  3. Includes share metadata (owner, access level)

## Required Checks

1. **Database Query**:

```typescript
// Check if this is an owner's secure code
if (memory.data.ownerSecureCode === code) {
  isOwner = true;
  accessLevel = "write";
} else {
  // If not owner's code, check if it's a valid share code
  const share = await db.query.memoryShares.findFirst({
    where: and(eq(memoryShares.memoryId, id), eq(memoryShares.inviteeSecureCode, code)),
  });
}
```

## Issue Resolution

The current implementation is mixing two different sharing flows:

1. **Temporary Share Links**: Requires secure codes for unauthenticated access
2. **Direct User Shares**: For authenticated users who have been shared memories

We need to modify the shared memory access flow to:

1. Remove the code requirement for authenticated users
2. Use direct memory access for authenticated users who have share permissions
3. Keep the code-based access only for temporary/unauthenticated sharing

## Updated Solution Steps

1. **Update Click Handler**:

```typescript
const handleMemoryClick = (memory: Memory) => {
  // For authenticated users, we can directly access the memory
  router.push(`/${lang}/shared/${memory.id}`);
};
```

2. **Update Shared Memory Page**:

```typescript
// In [id]/page.tsx
// Instead of requiring a code, check if the user has share access
const share = await db.query.memoryShares.findFirst({
  where: and(eq(memoryShares.memoryId, id), eq(memoryShares.sharedWithId, session.user.id)),
});

if (!share) {
  notFound();
}
```

## Implementation Checklist

1. [ ] Remove code parameter requirement for authenticated users
2. [ ] Update shared memory page to check share permissions
3. [ ] Keep share-link route for temporary sharing only
4. [ ] Add proper error messages for unauthorized access
5. [ ] Update tests to cover both sharing flows
6. [ ] Update `checkUserHasAccess` function in memory route
7. [ ] Remove code parameter requirement from shared memory page
8. [ ] Update shared memory page to use main memory endpoint

Would you like me to:

1. Implement these changes?
2. Add more detail about any specific route?
3. Update the route handlers to reflect this separation?

## Memory Fetching Route Analysis

The main route for fetching memories is `/api/memories/[id]`. This route:

1. Handles both owned and shared memories
2. Already includes permission checking logic
3. Returns consistent memory data format

### Current Implementation Issue

The `checkUserHasAccess` function in `/api/memories/[id]/route.ts` is incomplete:

```typescript
async function checkUserHasAccess(memoryId: string, allUserId: string): Promise<boolean> {
  // This will be implemented when you add sharing functionality
  console.log("checkUserHasAccess", { memoryId, allUserId });
  return false;
}
```

### Required Fix

Update `checkUserHasAccess` to check the share records:

```typescript
async function checkUserHasAccess(memoryId: string, allUserId: string): Promise<boolean> {
  const share = await db.query.memoryShares.findFirst({
    where: and(eq(memoryShares.memoryId, memoryId), eq(memoryShares.sharedWithId, allUserId)),
  });
  return !!share;
}
```

## Updated Flow

1. User clicks shared memory:

```typescript
const handleMemoryClick = (memory: Memory) => {
  router.push(`/${lang}/shared/${memory.id}`);
};
```

2. Shared memory page fetches memory:

```typescript
// In [lang]/shared/[id]/page.tsx
const response = await fetch(`/api/memories/${id}`);
```

3. API checks permissions:

- Is user the owner?
- Is memory public?
- Does user have share access?

4. Returns memory data or 403/404 as appropriate

## Implementation Checklist

Previous items remain, plus: 6. [ ] Update `checkUserHasAccess` function in memory route 7. [ ] Remove code parameter requirement from shared memory page 8. [ ] Update shared memory page to use main memory endpoint

Would you like me to:

1. Implement the `checkUserHasAccess` fix?
2. Update the shared memory page to use the main endpoint?
3. Add more details about the permission checking flow?
