# Build Error: JSON Parse Failure in Share Link Routes

## Problem ✅ RESOLVED

Build was failing with JSON parsing error during page data collection:

```
SyntaxError: "undefined" is not valid JSON
    at JSON.parse (<anonymous>)
    at <unknown> (.next/server/chunks/2986.js:7:13214)
    at Array.map (<anonymous>)
    at g.on (.next/server/chunks/2986.js:7:13087)

> Build error occurred
[Error: Failed to collect page data for /api/memories/[id]/share-link/code]
```

**Status: ✅ FIXED - Build now passes successfully**

## Context

- Error started occurring after schema modifications for gallery implementation
- Specifically affects `/api/memories/[id]/share-link/code` route
- Build was working fine before recent changes
- Error happens during Next.js page data collection phase, not runtime

## Affected Routes

- `/api/memories/[id]/share-link/code/route.ts`
- `/api/memories/[id]/share-link/route.ts`

## Suspected Cause

JSON serialization issue in one of these areas:

1. **Metadata fields** - Recent schema changes added JSON fields with `.default({})` which may conflict with existing data
2. **Memory records** - Existing database records may have malformed JSON in metadata fields
3. **Session serialization** - Recent auth changes (businessUserId) may affect serialization
4. **Database query results** - `findMemory()` function returns data that Next.js can't serialize

## Investigation Steps

1. **Check database** - Look for records with NULL or malformed JSON in metadata fields
2. **Test API routes** - Call the failing routes directly to isolate the issue
3. **Review recent changes** - Schema modifications, auth changes, gallery additions
4. **Simplify serialization** - Remove complex JSON defaults and type assertions

## Root Cause Identified ✅

**The error is NOT from API routes but from schema compilation:**

During `npm run build`, Next.js does NOT call API routes. The error happens during **webpack bundling/compilation** when processing the schema definitions.

**The real culprit is the gallery metadata JSON field definition:**

```typescript
metadata: json("metadata").$type<Record<string, unknown>>().notNull().default({});
```

**Analysis:**

- Build process compiles TypeScript and bundles code
- Error `"undefined" is not valid JSON` occurs when webpack processes schema definitions
- The combination of `.notNull().default({})` or the `Record<string, unknown>` type is causing Drizzle/webpack to encounter `undefined` during schema serialization
- This is a **compile-time issue**, not a runtime data issue

## False Lead Identified ❌

**Previous analysis was incorrect:**

- Initially thought it was gallery type exports referencing commented tables
- Then thought it was existing database data with undefined values
- Both were wrong - the issue is in how Drizzle processes the JSON metadata field definitions during build

## Solution Strategy ✅

Need to fix the gallery metadata field definitions to avoid serialization issues during build:

1. **Change JSON type definition** to avoid `Record<string, unknown>`
2. **Simplify default handling** to avoid `.notNull().default({})` combination
3. **Test schema compilation** without complex type assertions

## Additional Issues Found ✅

**Gallery indexes are also causing errors:**

```typescript
// Gallery items indexes and constraints
// export const galleryItemsOrderIdx = index("gallery_items_gallery_position_idx").on(
//   galleryItems.galleryId,
//   galleryItems.position
// );

export const galleryItemsUnique = uniqueIndex("gallery_items_gallery_memory_uq").on(
  galleryItems.galleryId,
  galleryItems.memoryId
);
```

**Problems:**

1. **Missing `index` import** - `index` is commented out in imports but used in `galleryItemsOrderIdx`
2. **Both indexes reference `galleryItems`** - which may be causing circular dependency issues during build
3. **Index definitions** - The way these indexes are defined may be causing webpack serialization problems

## Immediate Fix Options

1. **Revert schema changes** temporarily to confirm cause
2. **Add error handling** in JSON serialization points
3. **Update metadata defaults** to avoid serialization conflicts
4. **Isolate gallery schema** from existing memory tables

## Error Location

The error trace points to:

- Memory share link code retrieval
- Database query results serialization
- Next.js internal JSON processing during build

## Code Snippets

### Affected Route

```typescript
// src/app/api/memories/[id]/share-link/code/route.ts
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    // This line triggers the error
    const memory = await findMemory(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    // Find the share record for this user
    const share = await db.query.memoryShares.findFirst({
      where: and(eq(memoryShares.memoryId, id), eq(memoryShares.sharedWithId, session.user.id)),
    });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Return the secure code
    return NextResponse.json({
      code: share.inviteeSecureCode,
    });
  } catch (error) {
    console.error("Error getting share code:", error);
    return NextResponse.json({ error: "Failed to get share code" }, { status: 500 });
  }
}
```

### Memory Lookup Function

```typescript
// src/app/api/memories/utils/memory.ts
export async function findMemory(id: string): Promise<MemoryWithType | null> {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (document) return { type: "document", data: document };

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });
  if (image) return { type: "image", data: image };

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, id),
  });
  if (note) return { type: "note", data: note };

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, id),
  });
  if (video) return { type: "video", data: video };

  return null;
}
```

### Recent Schema Changes (Suspected Cause)

```typescript
// src/db/schema.ts - Gallery tables added
export const galleries = pgTable("gallery", {
  // ... other fields
  metadata: json("metadata").$type<Record<string, unknown>>(), // This may conflict
  // ... other fields
});

export const galleryItems = pgTable("gallery_item", {
  // ... other fields
  metadata: json("metadata").$type<Record<string, unknown>>(), // This may conflict
  // ... other fields
});
```

## Priority

**HIGH** - Blocking all builds and deployments
