# ICP Backend Analysis for UUID Mapping Implementation (Revised)

## Current State Analysis

### Existing ICP Backend Structure

Your current ICP backend has a well-structured capsule-based architecture with the following key components:

#### 1. **Core Types** (`types.rs`)

- **PersonRef**: Supports both Principal and Opaque identifiers
- **Capsule**: Main container with memories, galleries, connections
- **Memory**: Unified memory system with type-specific metadata
- **Gallery**: Gallery structure with storage status tracking
- **MemoryBlobKind**: Supports ICP and external storage

#### 2. **Storage Architecture** (`memory.rs`)

- Centralized thread-local storage for capsules
- Admin management system
- Nonce proof storage for II authentication

#### 3. **Gallery Management** (`capsule.rs`)

- `store_gallery_forever()`: Current gallery storage implementation
- `GalleryStorageStatus`: Enum for tracking storage location
- Gallery CRUD operations with capsule integration

#### 4. **Candid Interface** (`backend.did`)

- Complete service definition with 50+ endpoints
- Support for memory, gallery, and capsule operations
- II authentication integration

## Alignment with UUID Mapping Plan

### ✅ **What's Already Aligned**

1. **Memory Type System**: Your `MemoryType` enum matches the plan's `memory_type_t`

   ```rust
   // Current: ✅
   pub enum MemoryType { Image, Video, Audio, Document, Note }

   // Plan: ✅
   memory_type_t = ["image", "video", "note", "document", "audio"]
   ```

2. **Artifact Separation**: Your `MemoryData` with `BlobRef` already separates metadata from assets

   ```rust
   // Current: ✅
   pub struct MemoryData {
       pub blob_ref: BlobRef,     // Asset storage
       pub data: Option<Vec<u8>>, // Inline data
   }
   ```

3. **Storage Status Tracking**: You already have `GalleryStorageStatus` enum

   ```rust
   // Current: ✅
   pub enum GalleryStorageStatus {
       Web2Only, ICPOnly, Both, Migrating, Failed
   }
   ```

4. **Capsule Architecture**: Your capsule-based approach provides good isolation

### ❌ **What Needs to Change**

#### 1. **UUID Strategy Mismatch**

**Current Problem**: Your backend generates its own IDs

```rust
// Current: ❌
let gallery_id = format!("gallery_{}", ic_cdk::api::time());
let capsule_id = format!("capsule_{}", now);
```

**Required Change**: Accept external UUIDs from Web2

```rust
// Required: ✅
pub struct Gallery {
    pub id: String, // UUID from Web2, not generated here
    // ...
}
```

#### 2. **Memory Storage Granularity**

**Current Problem**: Memories are stored as complete units

```rust
// Current: ❌
pub struct Memory {
    pub id: String,
    pub info: MemoryInfo,
    pub metadata: MemoryMetadata,
    pub access: MemoryAccess,
    pub data: MemoryData, // Single storage location
}
```

**Required Change**: Support artifact-level storage tracking (ICP-only)

```rust
// Required: ✅
pub struct IcpArtifactPresence {
    pub memory_id: String,           // UUID from Web2
    pub memory_type: MemoryType,     // Image | Video | ...
    pub artifact: ArtifactType,      // Metadata | Asset
    pub present: bool,               // on ICP only
    pub content_hash: Option<String>,
    pub size_bytes: Option<u64>,
    pub updated_at_ns: u64,          // nanoseconds since epoch
}
```

#### 3. **Missing ICP-Only Presence Tracking**

**Current Problem**: No way to track what's stored on ICP specifically

```rust
// Current: ❌
// Only tracks gallery-level storage status
pub storage_status: GalleryStorageStatus,
```

**Required Change**: Track ICP artifacts separately

```rust
// Required: ✅
// Track only what exists on ICP
pub struct IcpArtifactPresence {
    pub memory_id: String,
    pub memory_type: MemoryType,
    pub artifact: ArtifactType,
    pub present: bool,               // ICP only
    pub content_hash: Option<String>,
    pub size_bytes: Option<u64>,
    pub updated_at_ns: u64,
}
```

#### 4. **Gallery Storage Status Computation**

**Current Problem**: Manual storage status tracking

```rust
// Current: ❌
gallery.storage_status = GalleryStorageStatus::ICPOnly;
```

**Required Change**: Compute from ICP memory artifacts

```rust
// Required: ✅
// Compute ICP status from memory artifacts
pub fn get_gallery_memory_presence_icp(gallery_id: &str) -> Vec<IcpArtifactPresence> {
    // Query all ICP artifacts for memories in this gallery
    // Return ICP-only presence data
}
```

## Required ICP Backend Changes (Scoped to ICP Only)

### 1. **Type System Updates**

#### Add ICP-Only Enums

```rust
#[derive(CandidType, Deserialize, Serialize, Clone, Debug)]
pub enum ArtifactType {
    Metadata,
    Asset,
}

// Note: NO StorageBackend enum - ICP only tracks its own artifacts
// Web2 handles cross-backend aggregation via storage_edges table
```

#### Update Memory Structure

```rust
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Memory {
    pub id: String, // UUID from Web2 (not generated here)
    pub info: MemoryInfo,
    pub metadata: MemoryMetadata,
    pub access: MemoryAccess,
    // Remove data field - artifacts tracked separately
    // pub data: MemoryData, // ❌ Remove this
}
```

#### Add ICP Artifact Presence Structure

```rust
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct IcpArtifactPresence {
    pub memory_id: String,           // canonical UUID (string form)
    pub memory_type: MemoryType,     // Image | Video | ...
    pub artifact: ArtifactType,      // Metadata | Asset
    pub present: bool,               // on ICP only
    pub content_hash: Option<String>,
    pub size_bytes: Option<u64>,
    pub updated_at_ns: u64,          // nanoseconds since epoch
}

// Compact key for stable storage
#[derive(Clone, Debug, CandidType, Deserialize, Serialize, Hash, Eq, PartialEq)]
pub struct IcpArtifactKey {
    pub memory_id: String,
    pub memory_type: MemoryType,
    pub artifact: ArtifactType,
}
```

### 2. **Stable Storage Management**

#### Use Stable Memory (Not thread_local)

```rust
// In memory.rs - replace thread_local with stable storage
use ic_stable_structures::{BTreeMap, Storable};

thread_local! {
    // ICP artifact presence tracking (stable)
    static ICP_ARTIFACTS: std::cell::RefCell<BTreeMap<IcpArtifactKey, IcpArtifactPresence>> =
        std::cell::RefCell::new(BTreeMap::new());

    // Upload sessions for chunked uploads
    static UPLOAD_SESSIONS: std::cell::RefCell<BTreeMap<String, UploadSession>> =
        std::cell::RefCell::new(BTreeMap::new());
}

// Stable memory upgrade hooks
#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    // Serialize state to stable memory
    ICP_ARTIFACTS.with(|artifacts| {
        let artifacts = artifacts.borrow();
        // Serialize to stable memory
    });
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    // Deserialize state from stable memory
    // Restore artifacts and sessions
}
```

#### Add Stable Storage Access Functions

```rust
pub fn with_icp_artifacts_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut BTreeMap<IcpArtifactKey, IcpArtifactPresence>) -> R,
{
    ICP_ARTIFACTS.with(|artifacts| f(&mut artifacts.borrow_mut()))
}

pub fn with_icp_artifacts<F, R>(f: F) -> R
where
    F: FnOnce(&BTreeMap<IcpArtifactKey, IcpArtifactPresence>) -> R,
{
    ICP_ARTIFACTS.with(|artifacts| f(&artifacts.borrow()))
}
```

### 3. **Chunked Upload Protocol**

#### Upload Session Management

```rust
#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct UploadSession {
    pub upload_id: String,
    pub memory_id: String,
    pub memory_type: MemoryType,
    pub content_hash: String,
    pub size_bytes: u64,
    pub chunks: Vec<Vec<u8>>,
    pub created_at_ns: u64,
    pub expires_at_ns: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct BeginUploadResponse {
    pub upload_id: String,
    pub expires_at_ns: u64,
}
```

#### Chunked Upload Endpoints

```rust
#[ic_cdk::update]
pub fn begin_asset_upload(
    memory_id: String,
    memory_type: MemoryType,
    content_hash: String,
    size_bytes: u64,
) -> BeginUploadResponse {
    // Verify caller authorization for this memory
    verify_memory_authorization(&memory_id, &memory_type)?;

    // Create upload session
    let upload_id = format!("upload_{}", ic_cdk::api::time());
    let now = ic_cdk::api::time();
    let expires_at = now + 3600_000_000_000; // 1 hour in nanoseconds

    let session = UploadSession {
        upload_id: upload_id.clone(),
        memory_id,
        memory_type,
        content_hash,
        size_bytes,
        chunks: Vec::new(),
        created_at_ns: now,
        expires_at_ns: expires_at,
    };

    // Store session
    with_upload_sessions_mut(|sessions| {
        sessions.insert(upload_id.clone(), session);
    });

    BeginUploadResponse { upload_id, expires_at_ns: expires_at }
}

#[ic_cdk::update]
pub fn put_chunk(upload_id: String, chunk_index: u32, data: Vec<u8>) -> bool {
    // Verify caller authorization
    // Add chunk to session
    // Return success
}

#[ic_cdk::update]
pub fn commit_asset(upload_id: String) -> Result<String, String> {
    // Verify all chunks received
    // Verify content hash matches
    // Store asset data
    // Update ICP artifact presence
    // Return storage location
}
```

### 4. **ICP-Only API Endpoints**

#### Metadata Operations

```rust
#[ic_cdk::update]
pub fn upsert_metadata(
    memory_id: String,
    memory_type: MemoryType,
    serialized_metadata: Vec<u8>,
    content_hash: Option<String>,
) -> bool {
    // Verify caller authorization
    verify_memory_authorization(&memory_id, &memory_type)?;

    // Store metadata
    // Update ICP artifact presence
    // Return success
}
```

#### ICP Presence Queries

```rust
#[ic_cdk::query]
pub fn get_memory_presence_icp(
    memory_id: String,
    memory_type: MemoryType,
) -> MemoryPresenceIcp {
    // Query ICP artifacts for this memory
    // Return ICP-only presence
}

#[ic_cdk::query]
pub fn list_gallery_memory_presence_icp(
    gallery_id: String,
) -> Vec<IcpArtifactPresence> {
    // Get all memories in gallery
    // Return ICP presence for each memory
}
```

#### Asset Retrieval

```rust
#[ic_cdk::query]
pub fn get_memory_artifact_icp(
    memory_id: String,
    memory_type: MemoryType,
    artifact: ArtifactType,
) -> Option<Vec<u8>> {
    // Retrieve artifact data from ICP storage
    // Return data if present
}
```

### 5. **Authorization Layer**

#### Memory Authorization

```rust
fn verify_memory_authorization(memory_id: &str, memory_type: &MemoryType) -> Result<(), String> {
    let caller = ic_cdk::api::caller();

    // Check if caller is authorized for this memory
    // This could be:
    // 1. Memory owner (from capsule)
    // 2. Authorized controller
    // 3. Delegated principal (for server-side operations)

    // For now, simple check against capsule ownership
    with_capsules(|capsules| {
        for capsule in capsules.values() {
            if capsule.memories.contains_key(memory_id) {
                let person_ref = PersonRef::Principal(caller);
                if capsule.has_write_access(&person_ref) {
                    return Ok(());
                }
            }
        }
        Err("Unauthorized".to_string())
    })
}
```

### 6. **Gallery Logic Updates**

#### Replace Current Gallery Storage

```rust
// Current: ❌
pub fn store_gallery_forever(gallery_data: GalleryData) -> StoreGalleryResponse {
    // Stores entire gallery as one unit
}

// Required: ✅
pub fn store_gallery_artifacts_icp(gallery_id: String) -> StoreGalleryResponse {
    // 1. Get all memories in gallery
    // 2. For each memory, store metadata and asset artifacts on ICP
    // 3. Update ICP artifact presence for each artifact
    // 4. Return ICP storage status
}
```

#### Add Gallery ICP Presence Query

```rust
pub fn get_gallery_memory_presence_icp(gallery_id: &str) -> Vec<IcpArtifactPresence> {
    // Get gallery memories
    // Query ICP presence for each memory
    // Return aggregated ICP presence data
}
```

### 7. **Candid Interface Updates**

#### Add New Types

```candid
type ArtifactType = variant { Metadata; Asset };

type IcpArtifactKey = record {
  memory_id : text;
  memory_type : MemoryType;
  artifact : ArtifactType;
};

type IcpArtifactPresence = record {
  memory_id : text;
  memory_type : MemoryType;
  artifact : ArtifactType;
  present : bool;
  content_hash : opt text;
  size_bytes : opt nat64;
  updated_at_ns : nat64;
};

type MemoryPresenceIcp = record {
  meta_icp : bool;
  asset_icp : bool;
  meta_hash : opt text;
  asset_hash : opt text;
  size_bytes : opt nat64;
};

type UploadSession = record {
  upload_id : text;
  memory_id : text;
  memory_type : MemoryType;
  content_hash : text;
  size_bytes : nat64;
  chunks : vec blob;
  created_at_ns : nat64;
  expires_at_ns : nat64;
};

type BeginUploadResponse = record {
  upload_id : text;
  expires_at_ns : nat64;
};
```

#### Add New Service Methods

```candid
service : () -> {
  // Existing methods...

  // ICP-only artifact methods
  begin_asset_upload : (text, MemoryType, text, nat64) -> (BeginUploadResponse);
  put_chunk : (text, nat32, blob) -> (bool);
  commit_asset : (text) -> (variant { Ok : text; Err : text });
  upsert_metadata : (text, MemoryType, blob, opt text) -> (bool);

  // ICP-only presence queries
  get_memory_presence_icp : (text, MemoryType) -> (MemoryPresenceIcp) query;
  list_gallery_memory_presence_icp : (text) -> (vec IcpArtifactPresence) query;
  get_memory_artifact_icp : (text, MemoryType, ArtifactType) -> (opt blob) query;

  // Updated gallery methods
  store_gallery_artifacts_icp : (text) -> (StoreGalleryResponse);
}
```

## Migration Strategy for ICP Backend

### Phase 1: Type System Migration

1. Add `ArtifactType` enum (ICP-only)
2. Add `IcpArtifactPresence` structure
3. Update `Memory` structure to remove `data` field
4. Update Candid interface

### Phase 2: Stable Storage Implementation

1. Replace `thread_local` with stable storage using `ic-stable-structures`
2. Implement `pre_upgrade`/`post_upgrade` hooks
3. Add stable storage access functions
4. Test upgrade scenarios

### Phase 3: Chunked Upload Protocol

1. Implement `begin_asset_upload` endpoint
2. Implement `put_chunk` endpoint
3. Implement `commit_asset` endpoint
4. Add upload session management

### Phase 4: ICP-Only API Development

1. Implement `upsert_metadata` endpoint
2. Implement ICP presence query endpoints
3. Implement asset retrieval endpoints
4. Add authorization layer

### Phase 5: Gallery Logic Updates

1. Replace `store_gallery_forever` with `store_gallery_artifacts_icp`
2. Add gallery ICP presence queries
3. Update gallery queries to use ICP-only data
4. Test gallery storage workflows

### Phase 6: Testing & Validation

1. Test chunked upload protocol
2. Test ICP artifact tracking
3. Test authorization layer
4. Test upgrade scenarios
5. Test UUID consistency with Web2

## Benefits of These Changes

### 1. **Single Source of Truth**

- Web2 remains authoritative for cross-backend aggregation
- ICP only tracks its own artifacts
- No data drift between systems

### 2. **Proper Separation of Concerns**

- ICP manages ICP storage only
- Web2 handles cross-backend coordination
- Clear ownership boundaries

### 3. **Scalable Architecture**

- Chunked uploads for large files
- Stable memory for upgrade resilience
- Efficient storage with compact keys

### 4. **Security & Authorization**

- Proper caller verification
- Memory-level authorization
- Secure upload sessions

### 5. **Idempotent Operations**

- Same UUID + same hash → AlreadyExists
- Safe retry mechanisms
- Consistent state management

## Risks & Considerations

### 1. **Breaking Changes**

- Existing gallery storage methods will change
- Memory structure changes
- Candid interface updates

### 2. **Implementation Complexity**

- Stable memory management
- Chunked upload protocol
- Authorization layer

### 3. **Performance Considerations**

- Stable storage overhead
- Chunked upload complexity
- Memory usage for upload sessions

### 4. **Upgrade Scenarios**

- State serialization/deserialization
- Upload session recovery
- Data consistency during upgrades

## Implementation Priority

### High Priority

1. **Type system updates** - Foundation for everything else
2. **Stable storage implementation** - Critical for production
3. **Authorization layer** - Security requirement

### Medium Priority

1. **Chunked upload protocol** - Essential for large files
2. **ICP presence tracking** - Core functionality
3. **Gallery logic updates** - User-facing features

### Low Priority

1. **Performance optimizations** - Can be done later
2. **Advanced features** - Future enhancements
3. **Legacy cleanup** - After migration is complete

## Quick Implementation Checklist

- [ ] Canister: accept UUIDs from Web2; make all writes idempotent
- [ ] Canister: implement ICP-only presence for `{metadata, asset}` per memory
- [ ] Canister: chunked asset upload + commit + hash verification
- [ ] Canister: stable memory (pre/post upgrade) or `ic-stable-structures`
- [ ] Canister: enforce caller authorization (linked principal/ACL)
- [ ] Web2: keep `storage_edges` table + views; **do not** add per-table `storageStatus`
- [ ] Web2: when "Store Forever" runs, set edges→migrating, push to canister, then edges→present on success
- [ ] Web2: materialized `gallery_presence` if needed

## Conclusion

The revised approach properly scopes the ICP backend to only manage ICP artifacts, leaving cross-backend aggregation to Web2. This creates a clean separation of concerns and maintains a single source of truth for storage coordination.

Key changes:

1. **ICP-only scope** - No awareness of Neon/Vercel Blob
2. **Stable storage** - Proper upgrade resilience
3. **Chunked uploads** - Scalable file handling
4. **Authorization layer** - Security and access control
5. **Idempotent operations** - Safe retry mechanisms

This approach aligns with the UUID mapping plan while maintaining clean architecture boundaries and avoiding data drift between systems.
