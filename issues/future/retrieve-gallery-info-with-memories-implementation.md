# Gallery Implementation: Drizzle-Ready Code

## Overview

This file contains the **Drizzle-ready implementation** for fetching memories with gallery information using a single optimized query. This is the concrete implementation of the approach outlined in the main issue.

## Core Query Function

```ts
// src/app/api/memories/queries.ts
import { sql } from "drizzle-orm";
import { db } from "@/db/db";

export type MemoryWithGalleries = {
  id: string;
  type: "image" | "video" | "document" | "note"; // add "audio" when you add that table
  owner_id: string;
  title: string | null;
  description: string | null;
  url: string;
  created_at: string; // ISO string from PG
  updated_at: string | null;
  // aggregated
  galleries: { id: string; title: string }[];
};

export async function fetchMemoriesWithGalleries(ownerAllUserId: string): Promise<MemoryWithGalleries[]> {
  const { rows } = await db.execute(sql`
    WITH mem AS (
      SELECT 'image'::text AS type, i.id, i.owner_id, i.title, i.description, i.url, i.created_at, NULL::timestamp AS updated_at
      FROM "image" i
      WHERE i.owner_id = ${ownerAllUserId}

      UNION ALL

      SELECT 'video'::text AS type, v.id, v.owner_id, v.title, v.description, v.url, v.created_at, v.updated_at
      FROM "video" v
      WHERE v.owner_id = ${ownerAllUserId}

      UNION ALL

      SELECT 'document'::text AS type, d.id, d.owner_id, d.title, d.description, d.url, d.created_at, NULL::timestamp AS updated_at
      FROM "document" d
      WHERE d.owner_id = ${ownerAllUserId}

      UNION ALL

      -- Notes: we surface content as description for the unified shape
      SELECT 'note'::text AS type, n.id, n.owner_id, n.title, n.content AS description, ''::text AS url, n.created_at, n.updated_at
      FROM "note" n
      WHERE n.owner_id = ${ownerAllUserId}
    )

    SELECT
      m.type,
      m.id,
      m.owner_id,
      m.title,
      m.description,
      m.url,
      m.created_at,
      m.updated_at,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT('id', g.id, 'title', g.title)
        ) FILTER (WHERE g.id IS NOT NULL),
        '[]'::json
      ) AS galleries
    FROM mem m
    LEFT JOIN "gallery_item" gi
      ON gi.memory_id = m.id AND gi.memory_type = m.type
    LEFT JOIN "gallery" g
      ON g.id = gi.gallery_id
    GROUP BY
      m.type, m.id, m.owner_id, m.title, m.description, m.url, m.created_at, m.updated_at
    ORDER BY m.created_at DESC
  `);

  // drizzle returns galleries as `any`; normalize to typed structure
  return rows.map((r: any) => ({
    id: r.id,
    type: r.type,
    owner_id: r.owner_id,
    title: r.title ?? null,
    description: r.description ?? null,
    url: r.url ?? "",
    created_at: r.created_at?.toISOString ? r.created_at.toISOString() : String(r.created_at),
    updated_at: r.updated_at ? (r.updated_at.toISOString ? r.updated_at.toISOString() : String(r.updated_at)) : null,
    galleries: Array.isArray(r.galleries) ? r.galleries : JSON.parse(r.galleries ?? "[]"),
  })) as MemoryWithGalleries[];
}
```

## API Handler Implementation

```ts
// src/app/api/memories/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth"; // your active NextAuth export
import { fetchMemoriesWithGalleries } from "./queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // IMPORTANT: if your app uses business/allUsers id, use that here instead of Auth.js user id
  const ownerAllUserId = session.user.id; // swap to session.user.businessUserId if you add that

  const data = await fetchMemoriesWithGalleries(ownerAllUserId);
  return NextResponse.json({ data });
}
```

## Additional Performance Index

```ts
// in gallery_item definition extras:
index("gallery_items_by_memory_idx").on(galleryItems.memoryId, galleryItems.memoryType);
```

## Key Features

### Performance Benefits

- **Single database round-trip** - no N+1 queries
- **Optimized JOINs** using proper indexes
- **JSON aggregation** for clean response structure
- **Type-safe** with proper TypeScript interfaces

### Query Structure

- Uses `WITH` clause for clean UNION of all memory types
- Handles different field names across tables (e.g., `content` vs `description` for notes)
- Proper NULL handling for missing fields
- JSON aggregation for gallery relationships

### Type Safety

- Proper TypeScript interfaces
- Handles Drizzle's `any` return type for JSON fields
- Normalizes timestamps to ISO strings
- Validates gallery array structure

## Adding Audio Support

When you add the `audio` table:

1. **Extend the type union:**

   ```ts
   type: "image" | "video" | "document" | "note" | "audio";
   ```

2. **Add audio branch to the query:**

   ```sql
   UNION ALL

   SELECT 'audio'::text AS type, a.id, a.owner_id, a.title, a.description, a.url, a.created_at, a.updated_at
   FROM "audio" a
   WHERE a.owner_id = ${ownerAllUserId}
   ```

## Usage Example

```ts
// Frontend usage
const response = await fetch("/api/memories");
const { data: memories } = await response.json();

// Each memory now includes gallery information
memories.forEach((memory) => {
  console.log(`Memory: ${memory.title}`);
  console.log(`Galleries: ${memory.galleries.map((g) => g.title).join(", ")}`);
});
```

## Notes

- **Assumes existing tables**: `image`, `video`, `document`, `note`, `gallery`, `gallery_item`
- **Uses raw SQL** via `db.execute(sql\`...\`)` for complex UNION + JSON aggregation
- **Handles authentication** via NextAuth session
- **Business user ID**: Update to use `session.user.businessUserId` if your app uses that pattern
