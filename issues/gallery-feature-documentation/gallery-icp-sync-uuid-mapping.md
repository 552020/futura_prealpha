# Gallery & Memory UUID Mapping Between Web2 and ICP

## Problem

Currently, there's no way to determine if a gallery or memory is already stored on ICP. The system needs a shared UUID mapping between the Web2 database (PostgreSQL) and the ICP canister to track storage status and prevent duplicate storage.

## Current State

- Galleries and memories have separate IDs in Web2 and ICP
- No way to check if content is already stored on ICP
- Risk of duplicate storage
- No synchronization between Web2 and ICP storage status

## Requirements

### Gallery UUID Mapping

- Each gallery should have a consistent UUID across Web2 and ICP
- Need to track storage status: `Web2Only`, `ICPOnly`, `Both`, `Migrating`, `Failed`
- Should be able to query storage status efficiently

### Memory UUID Mapping

- Each memory should have a consistent UUID across Web2 and ICP
- Memories within galleries need to maintain their relationships
- Need to track which memories are stored on ICP

## Final Solution: Multi-Table Memory Storage with Computed Gallery Status

**Core Principle**: Keep your existing multi-table memory structure (`images`, `videos`, `notes`, `documents`, `audio`). Track storage at the memory level with artifact granularity. Derive gallery status automatically.

### 1. Drizzle Enum Types

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const artifact_t = pgEnum("artifact_t", ["metadata", "asset"]);
export const backend_t = pgEnum("backend_t", ["neon-db", "vercel-blob", "icp-canister"]); // add more later
export const memory_type_t = pgEnum("memory_type_t", ["image", "video", "note", "document", "audio"]);
export const sync_t = pgEnum("sync_t", ["idle", "migrating", "failed"]);
```

### 2. Storage Edges Table (Drizzle Schema)

```typescript
import { pgTable, uuid, text, boolean, bigint, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const storageEdges = pgTable(
  "storage_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memoryId: uuid("memory_id").notNull(), // References images.id, videos.id, etc.
    memoryType: memory_type_t("memory_type").notNull(), // 'image' | 'video' | 'note' | 'document' | 'audio'
    artifact: artifact_t("artifact").notNull(), // 'metadata' | 'asset'
    backend: backend_t("backend").notNull(), // 'neon-db' | 'vercel-blob' | 'icp-canister'
    present: boolean("present").notNull().default(false),
    location: text("location"), // blob key / icp path / etc.
    contentHash: text("content_hash"), // SHA-256 for assets
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    syncState: sync_t("sync_state").notNull().default("idle"), // 'idle' | 'migrating' | 'failed'
    lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
    syncError: text("sync_error"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (t) => [uniqueIndex("uq_edge").on(t.memoryId, t.memoryType, t.artifact, t.backend)]
);
```

### 3. Required Indexes

```sql
CREATE INDEX ix_edges_memory ON storage_edges(memory_id, memory_type);
CREATE INDEX ix_edges_backend_present ON storage_edges(backend, artifact, present);
CREATE INDEX ix_edges_sync_state ON storage_edges(sync_state);
```

### Auto-Computed Views (No Manual Updates)

#### Memory Presence View

```sql
CREATE VIEW memory_presence AS
SELECT
  e.memory_id,
  e.memory_type,
  BOOL_OR(e.backend='neon-db'     AND e.artifact='metadata' AND e.present) AS meta_neon,
  BOOL_OR(e.backend='vercel-blob' AND e.artifact='asset'    AND e.present) AS asset_blob,
  BOOL_OR(e.backend='icp-canister'AND e.artifact='metadata' AND e.present) AS meta_icp,
  BOOL_OR(e.backend='icp-canister'AND e.artifact='asset'    AND e.present) AS asset_icp
FROM storage_edges e
GROUP BY e.memory_id, e.memory_type;
```

#### Gallery Presence View (Aggregated from Memories)

```sql
CREATE VIEW gallery_presence AS
WITH m AS (
  SELECT gi.gallery_id, mp.*
  FROM gallery_items gi
  JOIN memory_presence mp
    ON mp.memory_id = gi.memory_id
   AND mp.memory_type = gi.memory_type
)
SELECT
  gallery_id,
  COUNT(*)                                 AS total_memories,
  SUM((mp.meta_icp AND mp.asset_icp)::int) AS icp_complete_memories,
  BOOL_AND(mp.meta_icp AND mp.asset_icp)   AS icp_complete,
  BOOL_OR (mp.meta_icp OR  mp.asset_icp)   AS icp_any
FROM m
GROUP BY gallery_id;
```

### 5. Drizzle Usage Examples

#### Mark Neon metadata present when creating a memory:

```typescript
await db
  .insert(storageEdges)
  .values({
    memoryId,
    memoryType: "image",
    artifact: "metadata",
    backend: "neon-db",
    present: true,
  })
  .onConflictDoNothing();
```

#### Record Vercel Blob asset:

```typescript
await db
  .insert(storageEdges)
  .values({
    memoryId,
    memoryType: "image",
    artifact: "asset",
    backend: "vercel-blob",
    present: true,
    location: blobKey,
    contentHash: sha256,
    sizeBytes,
  })
  .onConflictDoUpdate({
    target: [storageEdges.memoryId, storageEdges.memoryType, storageEdges.artifact, storageEdges.backend],
    set: { present: true, location: blobKey, contentHash: sha256, sizeBytes },
  });
```

#### Start "Store Forever" to ICP:

```typescript
// Set migrating for both artifacts
for (const artifact of ["metadata", "asset"] as const) {
  await db
    .insert(storageEdges)
    .values({
      memoryId,
      memoryType,
      artifact,
      backend: "icp-canister",
      syncState: "migrating",
    })
    .onConflictDoUpdate({
      target: [storageEdges.memoryId, storageEdges.memoryType, storageEdges.artifact, storageEdges.backend],
      set: { syncState: "migrating", syncError: null },
    });
}

// After ICP call succeeds:
await db
  .update(storageEdges)
  .set({
    present: true,
    syncState: "idle",
    lastSyncedAt: new Date(),
    location: icpPath,
  })
  .where(
    and(
      eq(storageEdges.memoryId, memoryId),
      eq(storageEdges.memoryType, memoryType),
      eq(storageEdges.artifact, "asset"),
      eq(storageEdges.backend, "icp-canister")
    )
  );
```

### 6. API Surface

- `GET /api/galleries/:id/presence` → `SELECT * FROM gallery_presence WHERE gallery_id=$1`
- `GET /api/memories/:type/:id/presence` → `SELECT * FROM memory_presence WHERE memory_id=$1 AND memory_type=$2`
- `PUT /api/storage/edges` → Upsert a single edge (used by sync jobs)

### 7. Optional Enhancements

#### Auto-Update Timestamp Trigger

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER storage_edges_set_updated_at
BEFORE UPDATE ON storage_edges
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

#### Materialized View for Performance (High Traffic)

```sql
-- Materialized view for faster gallery queries
CREATE MATERIALIZED VIEW gallery_presence_mv AS
SELECT * FROM gallery_presence
WITH NO DATA;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_gallery_presence() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY gallery_presence_mv;
END;
$$ LANGUAGE plpgsql;

-- Index on materialized view
CREATE UNIQUE INDEX ix_gallery_presence_mv_id ON gallery_presence_mv(gallery_id);

-- Call refresh_gallery_presence() after storage edge mutations
-- Can be done via background job/cron or triggered from application
```

**Benefits**:

- ✅ **Single Source of Truth**: Only track at memory level, derive gallery status
- ✅ **No Data Drift**: Gallery status is computed, never manually updated
- ✅ **Artifact Granularity**: Separate tracking for metadata vs assets
- ✅ **Future-proof**: Easy to add new backends without schema changes
- ✅ **Performance**: Optimized views with materialized view option
- ✅ **Idempotent**: UNIQUE constraints prevent duplicate tracking

## Implementation Details

### UUID Strategy Decision

**Approach**: Use Postgres `uuid` type (native 16-byte storage) with string conversion at the edges.

- **PostgreSQL**: Store as `uuid` type for efficiency (16-byte binary storage)
- **ICP Canister**: Accept/send as `String` (canonical string form)
- **Frontend**: Treat as string throughout
- **Conversion**: Use `uuid::text` for Postgres → ICP conversion

This provides the efficiency of binary storage in DB + easy interoperability at the edges.

### Performance Optimization (Optional Materialized Views)

For high-traffic applications, use materialized views:

```sql
-- Materialized view for faster gallery queries
CREATE MATERIALIZED VIEW gallery_presence_mv AS
SELECT * FROM gallery_presence
WITH NO DATA;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_gallery_presence() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY gallery_presence_mv;
END;
$$ LANGUAGE plpgsql;

-- Index on materialized view
CREATE UNIQUE INDEX ix_gallery_presence_mv_id ON gallery_presence_mv(gallery_id);

-- Call refresh_gallery_presence() after storage edge mutations
-- Can be done via background job/cron or triggered from application
```

### Sync Status Tracking

```sql
-- View for active sync operations and errors
CREATE VIEW sync_status AS
SELECT
  entity_id AS memory_id,
  artifact_type,
  backend,
  sync_state,
  sync_error,
  last_synced_at,
  EXTRACT(EPOCH FROM (now() - last_synced_at)) / 60 AS minutes_since_sync
FROM storage_edges
WHERE sync_state != 'idle' OR sync_error IS NOT NULL;
```

### Backend Changes

```rust
// In capsule.rs - use the same UUID as string
#[derive(CandidType, Deserialize, Clone)]
pub struct Gallery {
    pub id: String, // UUID as string (same as Web2)
    pub title: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub storage_status: GalleryStorageStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct Memory {
    pub id: String, // UUID as string (same as Web2)
    pub title: String,
    pub content: String,
    pub url: Option<String>,
    pub storage_status: MemoryStorageStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

// UUID conversion utilities
pub fn uuid_to_string(uuid: &uuid::Uuid) -> String {
    uuid.to_string()
}

pub fn string_to_uuid(s: &str) -> Result<uuid::Uuid, uuid::Error> {
    uuid::Uuid::parse_str(s)
}
```

### Frontend Changes

```typescript
// Updated type definitions for memory-focused approach
export type StorageBackend = "neon-db" | "vercel-blob" | "icp-canister" | "walrus" | "arweave";
export type ArtifactType = "metadata" | "asset";
export type SyncState = "idle" | "migrating" | "failed";

export interface StorageEdge {
  id: string;
  entityId: string; // Memory UUID as string
  artifactType: ArtifactType;
  backend: StorageBackend;
  present: boolean;
  location?: string;
  contentHash?: string;
  sizeBytes?: number;
  syncState: SyncState;
  lastSyncedAt?: Date;
  syncError?: string;
}

export interface MemoryPresence {
  memoryId: string;
  metaNeon: boolean;
  assetBlob: boolean;
  metaIcp: boolean;
  assetIcp: boolean;
  assetWalrus: boolean;
  assetArweave: boolean;
}

export interface GalleryPresence {
  galleryId: string;
  totalMemories: number;
  icpCompleteMemories: number;
  icpComplete: boolean; // All memories fully on ICP
  icpAny: boolean; // At least one piece on ICP
  standardComplete: boolean; // All on Neon+Blob
  hasWalrus: boolean;
  hasArweave: boolean;
  storageStatus: "stored_forever" | "partially_on_icp" | "standard_storage" | "incomplete";
}

// Gallery service using computed presence
export async function getGalleryWithStorage(id: string): Promise<GalleryWithStorageInfo> {
  const [galleryResponse, presenceResponse] = await Promise.all([
    fetch(`/api/galleries/${id}`),
    fetch(`/api/galleries/${id}/presence`), // New endpoint using gallery_presence view
  ]);

  const gallery = await galleryResponse.json();
  const presence: GalleryPresence = await presenceResponse.json();

  return {
    ...gallery,
    presence,
    canStoreForever: !presence.icpComplete,
    storageStatusBadge: getStorageStatusBadge(presence),
  };
}

// Helper to get user-friendly storage status
function getStorageStatusBadge(presence: GalleryPresence): string {
  switch (presence.storageStatus) {
    case "stored_forever":
      return "✅ Stored Forever";
    case "partially_on_icp":
      return "🔄 Partially on ICP";
    case "standard_storage":
      return "💾 Standard Storage";
    case "incomplete":
      return "⚠️ Incomplete";
  }
}

// Store memory (not gallery) on ICP
export async function storeMemoryOnICP(memoryId: string, memoryType: string) {
  const artifacts: ArtifactType[] = ["metadata", "asset"];

  for (const artifactType of artifacts) {
    // Set sync state to migrating
    await updateStorageEdge(memoryId, artifactType, "icp-canister", {
      syncState: "migrating",
      syncError: null,
    });

    try {
      // Call ICP canister for this specific artifact
      const result = await actor.storeMemoryArtifact(memoryId, memoryType, artifactType);

      // Update edge on success
      await updateStorageEdge(memoryId, artifactType, "icp-canister", {
        present: true,
        syncState: "idle",
        location: result.location,
        contentHash: result.contentHash,
        sizeBytes: result.sizeBytes,
        lastSyncedAt: new Date(),
      });
    } catch (error) {
      // Update edge on failure
      await updateStorageEdge(memoryId, artifactType, "icp-canister", {
        present: false,
        syncState: "failed",
        syncError: error.message,
        lastSyncedAt: new Date(),
      });
    }
  }
}

// Helper function for edge updates
async function updateStorageEdge(
  memoryId: string,
  artifactType: ArtifactType,
  backend: StorageBackend,
  updates: Partial<StorageEdge>
) {
  await fetch("/api/storage/edges", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      memoryId,
      artifactType,
      backend,
      ...updates,
    }),
  });
}

// API endpoint examples
// GET /api/galleries/[id]/presence -> Uses gallery_presence view
// GET /api/memories/[id]/presence -> Uses memory_presence view
// PUT /api/storage/edges -> Updates individual storage edge
// GET /api/storage/sync-status -> Returns active syncs/errors
```

## Migration Strategy

### Phase 1: Schema & Views

1. Create `storage_edges` table (memory-focused only)
2. Create `memory_presence` and `gallery_presence` views
3. Create indexes for performance
4. Populate initial edges for existing memories (`backend='neon-db'` metadata, `backend='vercel-blob'` assets)

### Phase 2: API Development

1. Create `/api/storage/edges` for memory artifact tracking
2. Create `/api/galleries/[id]/presence` using `gallery_presence` view
3. Create `/api/memories/[id]/presence` using `memory_presence` view
4. Create `/api/storage/sync-status` for monitoring

### Phase 3: Backend Logic Updates

1. Update memory storage logic to use storage edges
2. Replace any gallery storage flags with computed status
3. Add artifact-level sync tracking (metadata vs assets)
4. Implement edge cleanup and error recovery

### Phase 4: ICP Integration

1. Update ICP canister to handle memory artifacts separately
2. Implement metadata + asset storage with UUIDs
3. Add content hash verification
4. Test idempotent artifact operations

### Phase 5: Frontend Migration

1. Update gallery components to use computed presence
2. Replace "Store Forever" flow with memory-level operations
3. Add per-memory storage status indicators
4. Update progress tracking for artifact-level sync

### Phase 6: Performance & Cleanup

1. Optionally implement materialized views for high traffic
2. Add background job for view refresh
3. Remove any legacy storage status columns
4. Performance testing with large galleries

## Benefits

- **Future-Proof**: Easily add new storage backends (Walrus, Arweave, S3, etc.) without schema changes
- **Precise**: "Neon" vs "ICP" instead of fuzzy "web2" terminology
- **Consistency**: Same UUID across all systems
- **Separation of Concerns**: Clear distinction between presence and sync state
- **Efficiency**:
  - No complex mapping lookups
  - Native Postgres UUID type (16-byte binary storage)
  - String conversion only at the edges
  - Idempotent operations via UNIQUE constraints
- **Reliability**:
  - Comprehensive storage status tracking per backend
  - Error handling and retry capabilities
  - Content hash verification for integrity
- **Scalability**:
  - Uniform queries across all backends
  - Easy to extend for future storage features
  - Optimized indexes for performance
- **Observability**: Clear sync states and error tracking per backend

## Risks & Considerations

- **Migration Complexity**: Existing data needs careful migration to storage edges
- **API Changes**: New endpoints needed, existing APIs need updates
- **Performance**: Multiple joins for storage summary queries (mitigated by views)
- **Backward Compatibility**: Existing storage status logic needs adaptation
- **Edge Case Handling**: Need robust handling of partial sync failures
- **Data Consistency**: Ensuring storage edges accurately reflect actual backend state

## Testing Requirements

- [ ] Test UUID consistency between Neon and ICP
- [ ] Verify storage edges creation and updates
- [ ] Test storage summary view performance
- [ ] Test sync state transitions (idle → migrating → idle/failed)
- [ ] Test idempotent operations via UNIQUE constraints
- [ ] Verify error handling and retry logic
- [ ] Test partial sync failure scenarios
- [ ] Performance testing with multiple backends
- [ ] Integration testing with "Store Forever" flow
- [ ] Test content hash verification
- [ ] Test migration of existing data to storage edges

## Priority

**High** - This is foundational for the "Store Forever" feature and prevents data duplication issues.

## Implementation Memo

### Key Integration Points

1. **Memory Tables Integration**: The current schema has separate tables for different memory types (`images`, `videos`, `notes`, `documents`, `audio`). The storage edges approach works perfectly with this multi-table structure using `memoryId` + `memoryType`.

2. **Memory Shares System**: The existing `memoryShares` table already uses `memoryId` + `memoryType` to reference different memory types. The storage edges approach follows the same pattern.

3. **Gallery Items**: The `galleryItems` table references memories by `memoryId` + `memoryType`. The storage views join on both fields to maintain this relationship.

4. **Computed Storage Status**: No storage status fields needed in memory tables. Gallery and memory status is computed from storage edges automatically.

---

## Appendix: Current Memory Schema Summary

### Memory Tables Structure

All memory tables follow this common pattern:

```typescript
// Common fields across all memory types
{
  id: string; // UUID - will be shared with ICP
  ownerId: string; // References allUsers.id
  title?: string;
  description?: string;
  isPublic: boolean;
  ownerSecureCode: string;
  parentFolderId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: JSON; // Type-specific metadata
}
```

### Individual Memory Tables

#### Images (`images`)

```typescript
{
  url: string; // Required
  caption?: string;
  metadata: {
    size: number;
    mimeType: string;
    originalName: string;
    uploadedAt: string;
    dimensions?: { width: number; height: number };
    format?: string;
    custom?: CustomMetadata;
    originalPath?: string;
    folderName?: string;
  }
}
```

#### Videos (`videos`)

```typescript
{
  url: string; // Required
  title: string; // Required
  duration?: number; // Duration in seconds
  mimeType: string; // Required
  size: string; // File size in bytes
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    thumbnail?: string;
    originalPath?: string;
    folderName?: string;
  }
}
```

#### Notes (`notes`)

```typescript
{
  title: string; // Required
  content: string; // Required (text content)
  metadata: {
    tags?: string[];
    mood?: string;
    location?: string;
    dateOfMemory?: string;
    recipients?: string[];
    unlockDate?: string;
    custom?: CustomMetadata;
    originalPath?: string;
    folderName?: string;
  }
}
```

#### Documents (`documents`)

```typescript
{
  url: string; // Required
  title?: string;
  mimeType: string; // Required
  size: string; // Required
  metadata: {
    size: number;
    mimeType: string;
    originalName: string;
    uploadedAt: string;
    custom?: CustomMetadata;
    originalPath?: string;
    folderName?: string;
  }
}
```

#### Audio (`audio`)

```typescript
{
  url: string; // Required
  title: string; // Required
  duration?: number; // Duration in seconds
  mimeType: string; // Required
  size: string; // Required
  metadata: {
    format?: string;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
    custom?: CustomMetadata;
    originalPath?: string;
    folderName?: string;
  }
}
```

### Memory Sharing System

#### Memory Shares (`memoryShares`)

```typescript
{
  id: string;
  memoryId: string; // References any memory type
  memoryType: "image" | "document" | "note" | "video" | "audio";
  ownerId: string; // References allUsers.id
  sharedWithType: "user" | "group" | "relationship";
  sharedWithId?: string; // For direct user sharing
  groupId?: string; // For group sharing
  sharedRelationshipType?: SharingRelationshipType; // For relationship-based sharing
  accessLevel: "read" | "write";
  inviteeSecureCode: string;
  inviteeSecureCodeCreatedAt: Date;
  createdAt: Date;
}
```

### Gallery System

#### Galleries (`galleries`)

```typescript
{
  id: string; // UUID - will be shared with ICP
  ownerId: string; // References allUsers.id
  title: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Gallery Items (`galleryItems`)

```typescript
{
  id: string;
  galleryId: string; // References galleries.id
  memoryId: string; // References any memory type
  memoryType: "image" | "document" | "note" | "video" | "audio";
  position: number;
  caption?: string;
  isFeatured: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Gallery Shares (`galleryShares`)

```typescript
{
  id: string;
  galleryId: string; // References galleries.id
  ownerId: string; // References allUsers.id
  sharedWithType: "user" | "group" | "relationship";
  sharedWithId?: string;
  groupId?: string;
  sharedRelationshipType?: SharingRelationshipType;
  accessLevel: "read" | "write";
  inviteeSecureCode: string;
  inviteeSecureCodeCreatedAt: Date;
  createdAt: Date;
}
```

### Constants and Types

```typescript
export const MEMORY_TYPES = ["image", "document", "note", "video", "audio"] as const;
export const ACCESS_LEVELS = ["read", "write"] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
```
