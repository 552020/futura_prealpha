# Update Schema: Add Gallery Tables

## Overview

Add database tables and schema changes to support gallery functionality for the forever-gallery vertical. This extends the existing memory storage system with curation and presentation capabilities.

## Current Schema Analysis

### ✅ What We Have

- **User System**: `users`, `temporaryUsers`, `allUsers` - Complete user management
- **Memory Storage**: `images`, `videos`, `documents`, `notes` - All memory types supported
- **Sharing System**: `memoryShares`, `group`, `relationship` - Comprehensive sharing
- **Family Features**: `familyMember`, `familyRelationship` - Family-specific features

### ❌ What We're Missing

- **Gallery containers** - No way to group memories into curated collections
- **Gallery items** - No way to arrange memories within galleries
- **Gallery metadata** - No gallery-specific data (themes, layouts, etc.)
- **Gallery permissions** - No gallery-level access control

## Required Schema Changes

### 1. New Tables

#### `galleries` Table

```sql
CREATE TABLE galleries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES all_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'default',
  layout TEXT DEFAULT 'grid',
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Container for curated memory collections

- `user_id`: Gallery owner (references `allUsers`)
- `title`: Gallery name
- `description`: Gallery description
- `theme`: Visual theme (e.g., 'wedding', 'minimal', 'vintage')
- `layout`: Display layout (e.g., 'grid', 'masonry', 'timeline')
- `is_public`: Public visibility setting
- `metadata`: Flexible metadata for future features

#### `gallery_items` Table

```sql
CREATE TABLE gallery_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id TEXT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  memory_id TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('image', 'video', 'document', 'note')),
  position INTEGER NOT NULL,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Individual memories within galleries

- `gallery_id`: Parent gallery
- `memory_id`: Reference to existing memory (no FK - references multiple tables)
- `memory_type`: Type of memory (for proper table lookup)
- `position`: Order within gallery
- `caption`: Gallery-specific caption
- `is_featured`: Highlight this item in gallery
- `metadata`: Item-specific metadata

### 2. Drizzle Schema Definition

```typescript
// Add to src/db/schema.ts

export const galleries = pgTable("gallery", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  theme: text("theme").default("default").notNull(),
  layout: text("layout").default("grid").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  metadata: json("metadata")
    .$type<{
      coverImageId?: string;
      colorScheme?: string;
      customTheme?: string;
      sharingSettings?: {
        allowComments?: boolean;
        allowDownloads?: boolean;
        passwordProtected?: boolean;
      };
    }>()
    .default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const galleryItems = pgTable("gallery_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  galleryId: text("gallery_id")
    .notNull()
    .references(() => galleries.id, { onDelete: "cascade" }),
  memoryId: text("memory_id").notNull(),
  memoryType: text("memory_type", { enum: MEMORY_TYPES }).notNull(),
  position: integer("position").notNull(),
  caption: text("caption"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  metadata: json("metadata")
    .$type<{
      customCaption?: string;
      displaySize?: "small" | "medium" | "large";
      overlayText?: string;
      customStyling?: Record<string, unknown>;
    }>()
    .default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### 3. Type Definitions

```typescript
// Add to src/db/schema.ts

export type DBGallery = typeof galleries.$inferSelect;
export type NewDBGallery = typeof galleries.$inferInsert;

export type DBGalleryItem = typeof galleryItems.$inferSelect;
export type NewDBGalleryItem = typeof galleryItems.$inferInsert;

// Gallery theme types
export const GALLERY_THEMES = [
  "default",
  "wedding",
  "minimal",
  "vintage",
  "modern",
  "artistic",
  "timeline",
  "portfolio",
] as const;
export type GalleryTheme = (typeof GALLERY_THEMES)[number];

// Gallery layout types
export const GALLERY_LAYOUTS = ["grid", "masonry", "timeline", "carousel", "story"] as const;
export type GalleryLayout = (typeof GALLERY_LAYOUTS)[number];
```

### 4. Indexes for Performance

```sql
-- Gallery queries by user
CREATE INDEX idx_galleries_user_id ON galleries(user_id);

-- Gallery items by gallery and position
CREATE INDEX idx_gallery_items_gallery_position ON gallery_items(gallery_id, position);

-- Gallery items by memory (for finding which galleries contain a memory)
CREATE INDEX idx_gallery_items_memory ON gallery_items(memory_id, memory_type);

-- Public galleries
CREATE INDEX idx_galleries_public ON galleries(is_public) WHERE is_public = true;
```

## Migration Strategy

### Phase 1: Core Tables

1. **Create migration file**: `src/db/migrations/0013_add_galleries.sql`
2. **Add tables**: `galleries` and `gallery_items`
3. **Add indexes**: Performance optimization
4. **Update schema.ts**: Add Drizzle definitions
5. **Test**: Verify table creation and relationships

### Phase 2: Data Integrity

1. **Add constraints**: Ensure data consistency
2. **Add triggers**: Auto-update `updated_at` timestamps
3. **Add validation**: Check memory existence in gallery items

### Phase 3: Integration

1. **Update existing queries**: Add gallery support to memory queries
2. **Add gallery APIs**: Create gallery CRUD endpoints
3. **Update sharing**: Extend sharing system for galleries

## API Impact

### New Endpoints Needed

- `GET /api/galleries` - Get user's galleries
- `POST /api/galleries` - Create gallery
- `GET /api/galleries/[id]` - Get specific gallery
- `PUT /api/galleries/[id]` - Update gallery
- `DELETE /api/galleries/[id]` - Delete gallery
- `GET /api/galleries/[id]/items` - Get gallery items
- `POST /api/galleries/[id]/items` - Add item to gallery
- `PUT /api/galleries/[id]/items/[itemId]` - Update gallery item
- `DELETE /api/galleries/[id]/items/[itemId]` - Remove item from gallery

### Existing Endpoints to Update

- `GET /api/memories` - Add gallery context
- Memory detail endpoints - Add gallery information
- Sharing endpoints - Extend for gallery sharing

## Data Relationships

### Memory to Gallery Relationship

```
Memory (images/videos/documents/notes)
    ↓ (referenced by)
GalleryItem
    ↓ (belongs to)
Gallery
    ↓ (owned by)
User (allUsers)
```

### Key Design Decisions

1. **No direct FK from gallery_items to memories** - References multiple tables
2. **Position-based ordering** - Integer position for manual arrangement
3. **Flexible metadata** - JSONB for future extensibility
4. **Cascade deletes** - Gallery items deleted when gallery deleted
5. **User ownership** - Galleries belong to allUsers (supports temporary users)

## Testing Requirements

### Unit Tests

- Gallery creation/update/deletion
- Gallery item management
- Position ordering
- Memory type validation
- Cascade delete behavior

### Integration Tests

- Gallery with different memory types
- Gallery sharing scenarios
- Performance with large galleries
- Concurrent gallery modifications

## Rollback Plan

### If Issues Arise

1. **Disable gallery features** - Feature flags
2. **Rollback migration** - Drop tables if needed
3. **Data preservation** - Backup before migration
4. **Gradual rollout** - Test with subset of users

## Success Criteria

- ✅ Gallery tables created successfully
- ✅ Existing functionality unaffected
- ✅ Gallery CRUD operations work
- ✅ Performance acceptable with test data
- ✅ Migration can be rolled back if needed

## Dependencies

- Drizzle ORM setup
- Database migration system
- Existing memory tables stable
- User authentication system working

## Priority

**High** - Required for gallery feature implementation. Blocking gallery development.
