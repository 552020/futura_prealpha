## Detailed Implementation Todo List

### 1. Extend Backend Canister with Gallery Storage

- [x] **1.1** Add gallery data structures to `src/backend/src/types.rs`

  - [x] **1.1.1** Define `Gallery` struct for canister storage (with embedded memory entries)
  - [x] **1.1.2** Define `GalleryMemoryEntry` struct for minimal extra data (position, gallery caption, featured status)
  - [x] **1.1.3** Define `GalleryStorageStatus` enum (Web2Only, ICPOnly, Both, Migrating, Failed)
  - [x] **1.1.4** Add user principal management types
  - [x] **1.1.5** Add type mapping functions for Web2 ↔ ICP conversion

- [ ] **1.2** Implement gallery storage in `src/backend/src/lib.rs`

  - [ ] **1.2.1** Add gallery storage state management
  - [ ] **1.2.2** Implement `store_gallery_forever` function
  - [ ] **1.2.3** Implement `get_user_galleries` function
  - [ ] **1.2.4** Implement `get_gallery_by_id` function
  - [ ] **1.2.5** Add gallery update and delete functions

- [ ] **1.3** Update Candid interface in `src/backend/backend.did`
  - [ ] **1.3.1** Add gallery storage service methods
  - [ ] **1.3.2** Define gallery data types (Gallery, GalleryMemoryEntry, GalleryStorageStatus)
  - [ ] **1.3.3** Add user principal management methods

### 2. Implement Gallery Data Storage (Not Memory Blob Storage)

- [ ] **2.1** Extend gallery storage for ICP

  - [ ] **2.1.1** Add gallery storage to canister state management
  - [ ] **2.1.2** Implement gallery metadata storage (title, description, settings)
  - [ ] **2.1.3** Implement memory reference storage (GalleryMemoryEntry)
  - [ ] **2.1.4** Handle gallery data efficiently (no blob storage needed)

- [ ] **2.2** Implement data migration utilities
  - [ ] **2.2.1** Create gallery data export function from Web2
  - [ ] **2.2.2** Create gallery data import function to ICP
  - [ ] **2.2.3** Add data verification utilities
  - [ ] **2.2.4** Handle memory reference validation (ensure memories exist)

### 3. Frontend "Store Forever" Integration

- [ ] **3.1** Add "Store Forever" button to gallery pages

  - [ ] **3.1.1** Add button to `src/nextjs/src/app/[lang]/gallery/[id]/page.tsx`
  - [ ] **3.1.2** Add button to `src/nextjs/src/app/[lang]/gallery/[id]/preview/page.tsx`
  - [ ] **3.1.3** Style button with appropriate visual design
  - [ ] **3.1.4** Add loading states and disabled states

- [ ] **3.2** Implement storage flow UI

  - [ ] **3.2.1** Create storage progress modal
  - [ ] **3.2.2** Show II authentication prompt
  - [ ] **3.2.3** Display storage progress steps
  - [ ] **3.2.4** Show success/error messages

- [ ] **3.3** Handle II authentication flow
  - [ ] **3.3.1** Integrate with existing II authentication
  - [ ] **3.3.2** Handle new user registration
  - [ ] **3.3.3** Handle existing user linking
  - [ ] **3.3.4** Maintain session consistency

### 4. Gallery Storage Service

- [ ] **4.1** Create gallery storage service

  - [ ] **4.1.1** Create `src/nextjs/src/services/gallery-storage.ts`
  - [ ] **4.1.2** Implement `storeGalleryForever` function
  - [ ] **4.1.3** Implement `getICPUserGalleries` function
  - [ ] **4.1.4** Add storage verification functions

- [ ] **4.2** Integrate with existing gallery service
  - [ ] **4.2.1** Extend `src/nextjs/src/services/gallery.ts`
  - [ ] **4.2.2** Add storage status to gallery types
  - [ ] **4.2.3** Update gallery list to show storage status
  - [ ] **4.2.4** Handle mixed Web2/ICP gallery lists

### 5. User Principal Management

- [ ] **5.1** Extend user management for ICP

  - [ ] **5.1.1** Add principal field to user types
  - [ ] **5.1.2** Implement principal linking in auth flow
  - [ ] **5.1.3** Add principal management to user profile
  - [ ] **5.1.4** Handle principal verification

- [ ] **5.2** Update session management
  - [ ] **5.2.1** Include principal in NextAuth session
  - [ ] **5.2.2** Add principal to user context
  - [ ] **5.2.3** Handle principal-based permissions
  - [ ] **5.2.4** Add principal to API requests

### 6. Data Migration and Verification

- [ ] **6.1** Implement gallery data export

  - [ ] **6.1.1** Export gallery metadata from Web2 (title, description, settings)

- [ ] **6.1.2** Export gallery memory references (GalleryMemoryEntry data)
- [ ] **6.1.3** Handle memory reference validation (ensure memories exist)

  - [ ] **6.1.4** Create migration manifest

- [ ] **6.2** Implement gallery data import

  - [ ] **6.2.1** Import gallery metadata to ICP

- [ ] **6.2.2** Import gallery memory references to ICP
- [ ] **6.2.3** Validate memory references exist in storage system

  - [ ] **6.2.4** Verify data integrity

- [ ] **6.3** Add verification system
  - [ ] **6.3.1** Compare Web2 and ICP gallery data
- [ ] **6.3.2** Verify memory references are valid
  - [ ] **6.3.3** Mark galleries as verified
  - [ ] **6.3.4** Handle verification failures

### 7. Error Handling and Rollback

- [ ] **7.1** Implement comprehensive error handling

  - [ ] **7.1.1** Handle II authentication errors
  - [ ] **7.1.2** Handle canister call failures
  - [ ] **7.1.3** Handle data migration errors
  - [ ] **7.1.4** Handle blob storage errors

- [ ] **7.2** Add rollback mechanisms
  - [ ] **7.2.1** Rollback partial migrations
  - [ ] **7.2.2** Clean up failed storage attempts
  - [ ] **7.2.3** Restore original gallery state
  - [ ] **7.2.4** Notify user of rollback

### 8. UI/UX Enhancements

- [ ] **8.1** Add storage status indicators

  - [ ] **8.1.1** Show storage status on gallery cards
  - [ ] **8.1.2** Add storage badges to gallery headers
  - [ ] **8.1.3** Show storage progress indicators
  - [ ] **8.1.4** Add storage status to gallery lists

- [ ] **8.2** Implement storage management UI
  - [ ] **8.2.1** Add storage settings to gallery edit
  - [ ] **8.2.2** Show storage statistics
  - [ ] **8.2.3** Add storage history/logs
  - [ ] **8.2.4** Implement storage preferences

### 9. Testing and Validation

- [ ] **9.1** Unit testing

  - [ ] **9.1.1** Test gallery storage functions
  - [ ] **9.1.2** Test data migration utilities
  - [ ] **9.1.3** Test error handling
  - [ ] **9.1.4** Test rollback mechanisms

- [ ] **9.2** Integration testing
  - [ ] **9.2.1** Test end-to-end storage flow
  - [ ] **9.2.2** Test II authentication integration
  - [ ] **9.2.3** Test data verification
  - [ ] **9.2.4** Test error scenarios

### 10. Documentation and Deployment

- [ ] **10.1** Update documentation

  - [ ] **10.1.1** Document storage flow
  - [ ] **10.1.2** Document new API endpoints
  - [ ] **10.1.3** Document error handling
  - [ ] **10.1.4** Add user guides

- [ ] **10.2** Deployment preparation
  - [ ] **10.2.1** Update deployment scripts
  - [ ] **10.2.2** Add environment variables
  - [ ] **10.2.3** Update canister deployment
  - [ ] **10.2.4** Test production deployment
