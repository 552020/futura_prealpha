## Detailed Implementation Todo List

### 1. Extend Backend Canister with Gallery Storage

- [x] **1.1** Add gallery data structures to `src/backend/src/types.rs`

  - [x] **1.1.1** Define `Gallery` struct for canister storage (with embedded memory entries)
  - [x] **1.1.2** Define `GalleryMemoryEntry` struct for minimal extra data (position, gallery caption, featured status)
  - [x] **1.1.3** Define `GalleryStorageStatus` enum (Web2Only, ICPOnly, Both, Migrating, Failed)
  - [x] **1.1.4** Add user principal management types
  - [x] **1.1.5** Add type mapping functions for Web2 ↔ ICP conversion

- [x] **1.2** Implement gallery storage in `src/backend/src/lib.rs`

  - [x] **1.2.1** Add gallery storage state management
  - [x] **1.2.2** Implement `store_gallery_forever` function
  - [x] **1.2.3** Implement `get_user_galleries` function
  - [x] **1.2.4** Implement `get_gallery_by_id` function
  - [x] **1.2.5** Add gallery update and delete functions

- [x] **1.3** Update Candid interface in `src/backend/backend.did` ✅ **SKIPPED - Using did-generate**
  - [x] **1.3.1** Add gallery storage service methods ✅ **SKIPPED - Using did-generate**
  - [x] **1.3.2** Define gallery data types (Gallery, GalleryMemoryEntry, GalleryStorageStatus) ✅ **SKIPPED - Using did-generate**
  - [x] **1.3.3** Add user principal management methods ✅ **SKIPPED - Using did-generate**

### 2. Implement Memory Management in Capsules

- [x] **2.1** Add memory management endpoints to `src/backend/src/lib.rs`

  - [x] **2.1.1** Add `add_memory_to_capsule` endpoint
  - [x] **2.1.2** Add `get_memory_from_capsule` endpoint
  - [x] **2.1.3** Add `update_memory_in_capsule` endpoint
  - [x] **2.1.4** Add `delete_memory_from_capsule` endpoint
  - [x] **2.1.5** Add `list_capsule_memories` endpoint

- [x] **2.2** Implement memory management functions in `src/backend/src/capsule.rs`

  - [x] **2.2.1** Add `add_memory_to_capsule` function
  - [x] **2.2.2** Add `get_memory_from_capsule` function
  - [x] **2.2.3** Add `update_memory_in_capsule` function
  - [x] **2.2.4** Add `delete_memory_from_capsule` function
  - [x] **2.2.5** Add `list_capsule_memories` function

- [ ] **2.2.6** Test memory management endpoints with bash scripts
  - [ ] **2.2.6.1** Run `test_add_memory.sh` to test memory creation
  - [ ] **2.2.6.2** Run `test_list_memories.sh` to test memory listing
  - [ ] **2.2.6.3** Run `test_get_memory.sh` to test memory retrieval
  - [ ] **2.2.6.4** Run `test_update_memory.sh` to test memory updates
  - [ ] **2.2.6.5** Run `test_delete_memory.sh` to test memory deletion
  - [ ] **2.2.6.6** Deploy backend canister using `scripts/deploy-local.sh`
  - [ ] **2.2.6.7** Verify all memory management functions work correctly

### 3. Enhance Gallery Functions with Memory Loading

- [ ] **3.1** Add memory loading to gallery functions

  - [ ] **3.1.1** Create `GalleryWithMemories` struct in `src/backend/src/types.rs`
  - [ ] **3.1.2** Enhance `get_gallery_by_id` to return full memory data
  - [ ] **3.1.3** Add `get_gallery_with_memories` function in `src/backend/src/capsule.rs`
  - [ ] **3.1.4** Add `get_gallery_with_memories` endpoint in `src/backend/src/lib.rs`
  - [ ] **3.1.5** Handle memory access control when loading gallery memories

- [ ] **3.2** Add memory validation for galleries
  - [ ] **3.2.1** Validate memory references exist in capsule when creating galleries
  - [ ] **3.2.2** Add memory reference validation in gallery update functions
  - [ ] **3.2.3** Handle missing memories gracefully in gallery loading
  - [ ] **3.2.4** Add memory count and validation to gallery responses

### 4. Implement Gallery Data Storage (Not Memory Blob Storage)

- [ ] **4.1** Extend gallery storage for ICP

  - [ ] **4.1.1** Add gallery storage to canister state management ✅ **COMPLETED**
  - [ ] **4.1.2** Implement gallery metadata storage (title, description, settings) ✅ **COMPLETED**
  - [ ] **4.1.3** Implement memory reference storage (GalleryMemoryEntry) ✅ **COMPLETED**
  - [ ] **4.1.4** Handle gallery data efficiently (no blob storage needed) ✅ **COMPLETED**

- [ ] **4.2** Implement data migration utilities
  - [ ] **4.2.1** Create gallery data export function from Web2
  - [ ] **4.2.2** Create gallery data import function to ICP
  - [ ] **4.2.3** Add data verification utilities
  - [ ] **4.2.4** Handle memory reference validation (ensure memories exist)

### 5. Frontend "Store Forever" Integration

- [x] **5.1** Add "Store Forever" button to gallery pages

  - [x] **5.1.1** Add button to `src/nextjs/src/app/[lang]/gallery/[id]/page.tsx`
  - [x] **5.1.2** Add button to `src/nextjs/src/app/[lang]/gallery/[id]/preview/page.tsx`
  - [x] **5.1.3** Style button with appropriate visual design
  - [x] **5.1.4** Add loading states and disabled states

- [x] **5.2** Implement storage flow UI

  - 📋 **Reference**: See `store-forever-ui-flow.md` for detailed UI flow design and implementation specifications

  - [x] **5.2.1** Create storage progress modal
  - [x] **5.2.2** Show II authentication prompt
  - [x] **5.2.3** Display storage progress steps
  - [x] **5.2.4** Show success/error messages

- [ ] **5.3** Handle II authentication flow
  - [ ] **5.3.1** Integrate with existing II authentication
  - [ ] **5.3.2** Handle new user registration
  - [ ] **5.3.3** Handle existing user linking
  - [ ] **5.3.4** Maintain session consistency

### 6. Gallery Storage Service

- [x] **6.1** Create gallery storage service

  - [x] **6.1.1** Create `src/nextjs/src/services/icp-gallery.ts`
  - [x] **6.1.2** Implement `storeGalleryForever` function ✅ **UPDATED WITH REAL BACKEND CALLS**
  - [x] **6.1.3** Implement `getICPUserGalleries` function ✅ **UPDATED WITH REAL BACKEND CALLS**
  - [x] **6.1.4** Add storage verification functions ✅ **UPDATED WITH REAL BACKEND CALLS**

- [x] **6.2** Integrate with existing gallery service
  - [x] **6.2.1** Extend `src/nextjs/src/services/gallery.ts`
  - [x] **6.2.2** Add storage status to gallery types ✅ **UPDATED TO MATCH BACKEND TYPES**
  - [x] **6.2.3** Update gallery list to show storage status
  - [x] **6.2.4** Handle mixed Web2/ICP gallery lists

### 7. User Principal Management

- [ ] **7.1** Extend user management for ICP

  - [ ] **7.1.1** Add principal field to user types
  - [ ] **7.1.2** Implement principal linking in auth flow
  - [ ] **7.1.3** Add principal management to user profile
  - [ ] **7.1.4** Handle principal verification

- [ ] **7.2** Update session management
  - [ ] **7.2.1** Include principal in NextAuth session
  - [ ] **7.2.2** Add principal to user context
  - [ ] **7.2.3** Handle principal-based permissions
  - [ ] **7.2.4** Add principal to API requests

### 8. Data Migration and Verification

- [ ] **8.1** Implement gallery data export

  - [ ] **8.1.1** Export gallery metadata from Web2 (title, description, settings)

- [ ] **8.1.2** Export gallery memory references (GalleryMemoryEntry data)
- [ ] **8.1.3** Handle memory reference validation (ensure memories exist)

  - [ ] **8.1.4** Create migration manifest

- [ ] **8.2** Implement gallery data import

  - [ ] **8.2.1** Import gallery metadata to ICP

- [ ] **8.2.2** Import gallery memory references to ICP
- [ ] **8.2.3** Validate memory references exist in storage system

  - [ ] **8.2.4** Verify data integrity

- [ ] **8.3** Add verification system
  - [ ] **8.3.1** Compare Web2 and ICP gallery data
- [ ] **8.3.2** Verify memory references are valid
  - [ ] **8.3.3** Mark galleries as verified
  - [ ] **8.3.4** Handle verification failures

### 9. Error Handling and Rollback

- [ ] **9.1** Implement comprehensive error handling

  - [ ] **9.1.1** Handle II authentication errors
  - [ ] **9.1.2** Handle canister call failures
  - [ ] **9.1.3** Handle data migration errors
  - [ ] **9.1.4** Handle blob storage errors

- [ ] **9.2** Add rollback mechanisms
  - [ ] **9.2.1** Rollback partial migrations
  - [ ] **9.2.2** Clean up failed storage attempts
  - [ ] **9.2.3** Restore original gallery state
  - [ ] **9.2.4** Notify user of rollback

### 10. UI/UX Enhancements

- [ ] **10.1** Add storage status indicators

  - [ ] **10.1.1** Show storage status on gallery cards
  - [ ] **10.1.2** Add storage badges to gallery headers
  - [ ] **10.1.3** Show storage progress indicators
  - [ ] **10.1.4** Add storage status to gallery lists

- [ ] **10.2** Implement storage management UI
  - [ ] **10.2.1** Add storage settings to gallery edit
  - [ ] **10.2.2** Show storage statistics
  - [ ] **10.2.3** Add storage history/logs
  - [ ] **10.2.4** Implement storage preferences

### 11. Testing and Validation

- [ ] **11.1** Unit testing

  - [ ] **11.1.1** Test gallery storage functions
  - [ ] **11.1.2** Test data migration utilities
  - [ ] **11.1.3** Test error handling
  - [ ] **11.1.4** Test rollback mechanisms

- [ ] **11.2** Integration testing
  - [ ] **11.2.1** Test end-to-end storage flow
  - [ ] **11.2.2** Test II authentication integration
  - [ ] **11.2.3** Test data verification
  - [ ] **11.2.4** Test error scenarios

### 12. Documentation and Deployment

- [ ] **12.1** Update documentation

  - [ ] **12.1.1** Document storage flow
  - [ ] **12.1.2** Document new API endpoints
  - [ ] **12.1.3** Document error handling
  - [ ] **12.1.4** Add user guides

- [ ] **12.2** Deployment preparation
  - [ ] **12.2.1** Update deployment scripts
  - [ ] **12.2.2** Add environment variables
  - [ ] **12.2.3** Update canister deployment
  - [ ] **12.2.4** Test production deployment
