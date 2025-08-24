# Retrieve Gallery Information with Memories

## Problem Statement

We have memories in the database. When we retrieve all memories of a user to display them, **how can we know if a memory is part of a gallery or not?**

This is a fundamental database design question: given a memory (image, video, document, note, audio), how do we determine its relationship to galleries in the database?

## Context for Senior Developer

The application has a memory system where users can upload various types of content (images, videos, documents, notes, audio). We need to implement a gallery feature that allows users to group memories into collections. The challenge is determining which memories belong to which galleries when fetching the user's memories.

## Current Database Schema

### Existing Tables

- `images` - stores image files
- `videos` - stores video files
- `documents` - stores document files
- `notes` - stores text content
- `audio` - stores audio files (newly added)
- `allUsers` - user accounts
- `galleries` - gallery metadata (currently commented out)
- `galleryItems` - gallery-item relationships (currently commented out)

### Current Memory Structure

Each memory has:

- `ownerId` - who owns the memory
- `type` - "image", "video", "document", "note", "audio"
- `url` - file location
- `title`, `description` - metadata
- `isPublic` - visibility setting
- `createdAt`, `updatedAt` - timestamps

## Gallery Implementation Options

### Option 1: Gallery as a Container (Recommended)

Use the existing `galleries` and `galleryItems` tables to create a proper hierarchy.

**Structure:**

```sql
-- Gallery metadata
galleries (
  id, ownerId, title, description,
  isPublic, createdAt, updatedAt
)

-- Gallery-item relationships
galleryItems (
  id, galleryId, memoryId, position,
  createdAt
)
```

**Pros:**

- Proper hierarchical structure
- Galleries can contain any type of memory
- Flexible positioning and ordering
- Clear separation of concerns

**Cons:**

- More complex queries
- Need to join tables to get gallery contents

### Option 2: Memory with Gallery Reference

Add a `galleryId` field to existing memory tables.

**Pros:**

- Simple queries
- Direct relationship

**Cons:**

- Memories can only belong to one gallery
- No support for memories in multiple galleries
- Pollutes memory tables with gallery-specific data

## Final Recommendation

**Database Schema**: Option 1 (Gallery as Container)  
**Implementation Strategy**: Option C (Optimized Backend Query)

### Enhanced Database Schema

```typescript
// Gallery container
export const galleries = pgTable("gallery", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id")
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Gallery-item relationships with enhanced features
export const galleryItems = pgTable(
  "gallery_item",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    galleryId: text("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),
    memoryId: text("memory_id").notNull(),
    memoryType: text("memory_type", { enum: MEMORY_TYPES }).notNull(), // 'image' | 'video' | 'document' | 'note' | 'audio'
    position: integer("position").notNull(),
    caption: text("caption"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    // Fast ordering inside a gallery
    index("gallery_items_gallery_position_idx").on(t.galleryId, t.position),
    // Prevent duplicates of same memory in the same gallery
    uniqueIndex("gallery_items_gallery_memory_uq").on(t.galleryId, t.memoryId, t.memoryType),
    // Quickly find all galleries for a memory
    index("gallery_items_by_memory_idx").on(t.memoryId, t.memoryType),
  ]
);
```

**Key Improvements:**

- **Polymorphic-safe**: Uses `(memory_id, memory_type)` instead of trying to FK to multiple tables
- **Performance indexes**: Optimized for common query patterns
- **Enhanced features**: `caption`, `isFeatured`, `metadata` for gallery-specific customization
- **Data integrity**: Prevents duplicate memories in same gallery

### Current API Endpoint Structure

The current `/api/memories` endpoint returns memories like this:

```typescript
interface Memory {
  id: string;
  title: string;
  description?: string;
  type: "image" | "video" | "document" | "note" | "audio";
  url: string;
  thumbnail?: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### How to Determine if a Memory is in a Gallery

1. **Query gallery_items table:**

   ```sql
   SELECT g.* FROM galleries g
   JOIN gallery_items gi ON g.id = gi.gallery_id
   WHERE gi.memory_id = ? AND gi.memory_type = ?
   ```

2. **Get all memories in a gallery:**

   ```sql
   SELECT m.* FROM images m -- or videos, documents, etc.
   JOIN gallery_items gi ON m.id = gi.memory_id
   WHERE gi.gallery_id = ? AND gi.memory_type = 'image'
   ORDER BY gi.position
   ```

3. **Check if memory belongs to any gallery:**
   ```sql
   SELECT COUNT(*) FROM gallery_items
   WHERE memory_id = ? AND memory_type = ?
   ```

## Implementation Strategies

### Option A: Backend Check

When hitting `/api/memories` endpoint, the backend performs the gallery check and returns gallery information with each memory.

**Implementation:**

```typescript
// In the memories API endpoint
const memories = await fetchMemories(userId);
const memoriesWithGalleryInfo = await Promise.all(
  memories.map(async (memory) => {
    const galleryMemberships = await getGalleryMemberships(memory.id, memory.type);
    return {
      ...memory,
      galleries: galleryMemberships, // Array of gallery IDs/names
    };
  })
);
```

**Pros:**

- Single API call for frontend
- Consistent data structure
- Backend handles all logic

**Cons:**

- Additional database queries (N+1 problem)
- Slower response time

### Option B: Separate API Call

Frontend makes two calls: one for memories, one for gallery relationships.

**Implementation:**

```typescript
// Frontend
const memories = await fetch("/api/memories");
const galleryRelationships = await fetch("/api/memories/gallery-relationships");
// Merge data on frontend
```

**Pros:**

- Faster initial memory load
- Flexible data fetching

**Cons:**

- Multiple API calls
- Frontend complexity
- Potential race conditions

### Option C: Optimized Backend Query (Recommended)

Use a single optimized SQL query with JOINs to get all data at once.

**Implementation:**

```sql
SELECT
  m.*,
  ARRAY_AGG(g.id) as gallery_ids,
  ARRAY_AGG(g.title) as gallery_names
FROM memories m
LEFT JOIN gallery_items gi ON m.id = gi.memory_id AND m.type = gi.memory_type
LEFT JOIN galleries g ON gi.gallery_id = g.id
WHERE m.owner_id = ?
GROUP BY m.id
```

**Pros:**

- Single database query
- Fastest performance
- Clean data structure

**Cons:**

- More complex SQL
- Database-specific syntax

## Implementation: Enhanced API Response

### Updated API Response Structure

```typescript
interface MemoryWithGalleries extends Memory {
  galleries: {
    id: string;
    title: string;
  }[];
}
```

### Implementation: Optimized Database Query

Replace the current simple memory fetch with a JOIN query using `WITH` clause for better readability:

```sql
-- Current query (simplified)
SELECT * FROM images WHERE owner_id = ?
UNION ALL
SELECT * FROM videos WHERE owner_id = ?
-- etc. for other memory types

-- Proposed optimized query with WITH clause
WITH mem AS (
  SELECT 'image' AS type, id, owner_id, title, description, url, thumbnail, is_public, created_at, updated_at
  FROM images WHERE owner_id = $1
  UNION ALL
  SELECT 'video', id, owner_id, title, description, url, thumbnail, is_public, created_at, updated_at
  FROM videos WHERE owner_id = $1
  UNION ALL
  SELECT 'document', id, owner_id, title, description, url, NULL as thumbnail, is_public, created_at, updated_at
  FROM documents WHERE owner_id = $1
  UNION ALL
  SELECT 'note', id, owner_id, title, content AS description, url, NULL as thumbnail, is_public, created_at, updated_at
  FROM notes WHERE owner_id = $1
  UNION ALL
  SELECT 'audio', id, owner_id, title, description, url, NULL as thumbnail, is_public, created_at, updated_at
  FROM audio WHERE owner_id = $1
)
SELECT
  m.*,
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT('id', g.id, 'title', g.title)
    ) FILTER (WHERE g.id IS NOT NULL),
    '[]'::json
  ) AS galleries
FROM mem m
LEFT JOIN gallery_item gi
  ON gi.memory_id = m.id AND gi.memory_type = m.type
LEFT JOIN gallery g
  ON g.id = gi.gallery_id
GROUP BY m.id, m.type, m.owner_id, m.title, m.description, m.url, m.thumbnail, m.is_public, m.created_at, m.updated_at
ORDER BY m.created_at DESC;
```

**Performance Benefits:**

- **Single round-trip** to database
- **No N+1 queries** - all gallery memberships fetched in one go
- **Efficient JOINs** using the optimized indexes
- **JSON aggregation** for clean response structure

### Frontend Usage Example

```typescript
// Current frontend code
const memories = await fetch("/api/memories");
const memoryCards = memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />);

// Updated frontend code
const memories = await fetch("/api/memories");
const memoryCards = memories.map((memory) => (
  <MemoryCard
    key={memory.id}
    memory={memory}
    // Now we can show gallery info
    galleryInfo={memory.galleries}
  />
));
```

### Memory Card Component Update

```typescript
// Add gallery indicators to memory cards
interface MemoryCardProps {
  memory: MemoryWithGalleries;
  // ... other props
}

function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <Card>
      {/* Existing memory content */}
      <CardContent>{/* Memory preview, title, description */}</CardContent>

      <CardFooter>
        {/* Existing action buttons */}

        {/* New: Gallery indicators */}
        {memory.galleries.length > 0 && (
          <div className="flex gap-1">
            {memory.galleries.map((gallery) => (
              <Badge key={gallery.id} variant="secondary" className="text-xs">
                {gallery.title}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
```

### Implementation Steps

1. **Enable gallery tables** in database schema
2. **Update `/api/memories` endpoint** to use the optimized query
3. **Update frontend interfaces** to handle `MemoryWithGalleries` type
4. **Add gallery indicators** to memory cards (optional)
5. **Test with sample gallery data**

### API Endpoints Needed

**Core Memory Endpoints:**

- `GET /api/memories` - List memories with gallery info (enhanced response)

**Gallery Management:**

- `GET /api/galleries` - List user's galleries
- `GET /api/galleries/:id` - Get gallery details with items ordered by position
- `POST /api/galleries` - Create gallery
- `PUT /api/galleries/:id` - Update gallery
- `DELETE /api/galleries/:id` - Delete gallery

**Gallery Item Operations:**

- `POST /api/galleries/:id/items` - Add memory to gallery
  ```typescript
  // Request body
  { memoryId: string, memoryType: MemoryType }
  ```
- `DELETE /api/galleries/:id/items` - Remove memory from gallery
  ```typescript
  // Request body
  { memoryId: string, memoryType: MemoryType }
  ```
- `PUT /api/galleries/:id/items/reorder` - Reorder gallery items
  ```typescript
  // Request body
  [{ id: string, position: number }];
  ```

**Quick Checks:**

- `GET /api/memories/:id/galleries` - Get all galleries for a specific memory

### UI Components Needed

- Gallery list view
- Gallery detail view (grid/list of memories)
- Gallery creation/editing modal
- Drag-and-drop reordering
- Add/remove memory from gallery

### Migration Strategy

1. Enable the existing `galleries` and `galleryItems` tables
2. Add any missing fields or constraints
3. Create API endpoints for gallery management
4. Build gallery UI components
5. Add gallery functionality to memory cards (add to gallery button)

## Performance Considerations & Gotchas

### Quick Gallery Membership Checks

For single memory checks, use the optimized index:

```sql
-- Check if memory is in any gallery
SELECT EXISTS (
  SELECT 1 FROM gallery_item
  WHERE memory_id = $1 AND memory_type = $2
) AS in_any_gallery;

-- Get all galleries for a memory
SELECT g.id, g.title
FROM gallery_item gi
JOIN gallery g ON g.id = gi.gallery_id
WHERE gi.memory_id = $1 AND gi.memory_type = $2
ORDER BY gi.position;
```

### Write Operations

**Add to Gallery:**

```sql
-- Insert with auto-position
INSERT INTO gallery_item (gallery_id, memory_id, memory_type, position)
SELECT $1, $2, $3, COALESCE(MAX(position) + 1, 1)
FROM gallery_item WHERE gallery_id = $1;
```

**Reorder Items:**

```sql
-- Bulk update positions
UPDATE gallery_item
SET position = CASE
  WHEN id = 'item1' THEN 1
  WHEN id = 'item2' THEN 2
  -- etc.
END
WHERE gallery_id = $1;
```

### Important Gotchas

1. **Don't try to FK `memory_id` to multiple tables** - stick with `(memory_id, memory_type)` composite
2. **Keep JSON columns nullable-with-default** only when you're sure (avoid JSON parse issues)
3. **Use stable business user ID** (`allUsers.id`) in `galleries.ownerId`
4. **Handle position conflicts** - use transactions for reordering operations
5. **Consider gallery size limits** - large galleries may need pagination

## Questions to Resolve

1. **Should memories be able to belong to multiple galleries?**

   - Current schema supports this
   - Consider use cases (wedding photos in "Wedding 2024" and "Best Photos" galleries)

2. **How to handle gallery sharing?**

   - Similar to memory sharing with `sharedWith` table
   - Or simpler public/private toggle

3. **Gallery vs Collection naming?**

   - "Gallery" implies visual content
   - "Collection" is more generic
   - Consider user expectations

4. **Integration with existing memory management:**
   - Should memory cards show which galleries they belong to?
   - Add "Add to Gallery" button to memory actions?

## Next Steps

1. **Enable gallery tables** in schema
2. **Create gallery API endpoints**
3. **Build basic gallery UI**
4. **Test with sample data**
5. **Integrate with existing memory system**

## Related Issues

- Gallery redesign (Pixieset-style simple gallery)
- Search and filter functionality for galleries
- Gallery sharing and collaboration features

## TODO List

### Phase 1: Database Schema ✅ COMPLETED

- [x] Enable `galleries` table in database schema
- [x] Enable `galleryItems` table with proper indexes
- [x] Add migration for gallery tables (used `drizzle-kit push` instead)
- [x] Test schema with sample data

### Phase 2: Backend Implementation

- [ ] Update `/api/memories` endpoint to use optimized query
- [ ] Implement gallery CRUD endpoints (`/api/galleries`)
- [ ] Implement gallery item operations (`/api/galleries/:id/items`)
- [ ] Add gallery membership checks
- [ ] Test all endpoints with sample data

### Phase 3: Frontend Integration

- [ ] Update `Memory` interface to include `galleries` array
- [ ] Update memory cards to show gallery badges
- [ ] Add "Add to Gallery" functionality to memory actions
- [ ] Create gallery management UI components
- [ ] Test gallery functionality end-to-end

### Phase 4: Polish & Testing

- [ ] Add gallery sharing features
- [ ] Implement gallery reordering functionality
- [ ] Add gallery search and filtering
- [ ] Performance testing with large datasets
- [ ] User acceptance testing
