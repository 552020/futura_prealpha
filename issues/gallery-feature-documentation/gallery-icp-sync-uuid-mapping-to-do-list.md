# Gallery & Memory UUID Mapping - Implementation Todo List

## Phase 1: Schema & Database Setup

### Database Schema

1. [x] Add enum types to `schema.ts`:

   1. [x] `artifact_t` enum (`["metadata", "asset"]`)
   2. [x] `backend_t` enum (`["neon-db", "vercel-blob", "icp-canister"]`)
   3. [x] `memory_type_t` enum (`["image", "video", "note", "document", "audio"]`)
   4. [x] `sync_t` enum (`["idle", "migrating", "failed"]`)

2. [x] Add `storageEdges` table to `schema.ts` with all fields and unique index
3. [x] Generate and run Drizzle migration
4. [x] Create required indexes:
   1. [x] `ix_edges_memory` on `(memory_id, memory_type)`
   2. [x] `ix_edges_backend_present` on `(backend, artifact, present)`
   3. [x] `ix_edges_sync_state` on `(sync_state)`

### Database Views

5. [x] Create `memory_presence` view
6. [x] Create `gallery_presence` view
7. [x] Create `sync_status` view for monitoring active syncs
8. [x] Test view performance with sample data

### Optional Database Enhancements

9. [ ] Add auto-update timestamp trigger for `updated_at` field
10. [x] Create materialized view `gallery_presence_mv` for high traffic
11. [x] Add refresh function for materialized view
12. [x] Add unique index on materialized view

## Phase 2: Backend API Development

### Storage Edge Management

13. [x] Create `PUT /api/storage/edges` endpoint for upserting storage edges
14. [x] Add validation for edge data (memory exists, valid enums, etc.)
15. [x] Implement conflict resolution with `onConflictDoUpdate`
16. [x] Add error handling and logging

### Presence Queries

17. [x] Create `GET /api/galleries/:id/presence` endpoint
18. [x] Create `GET /api/memories/presence` endpoint (adjusted route structure)
19. [x] Add query optimization and proper error handling
20. [x] Add proper error handling for missing galleries/memories

### Sync Status Monitoring

21. [x] Create `GET /api/storage/sync-status` endpoint
22. [x] Add filtering by sync state, backend, memory type
23. [ ] Add pagination for large result sets (overkill for MVP)
24. [ ] Add real-time sync status updates (optional WebSocket) (overkill for MVP)

## Phase 3: Backend Logic Updates

### Memory Creation Integration

25. [x] Update memory creation logic to add storage edges:
    1. [x] Add metadata edge for `neon-db` when memory is created
    2. [x] Add asset edge for `vercel-blob` when file is uploaded
    3. [x] Handle different memory types (image, video, note, document, audio)
    - ✅ **Implemented**: `createStorageEdgesForMemory()` function in upload utils
    - ✅ **Integrated**: Single file upload (`/api/memories/upload/file`)
    - ✅ **Integrated**: Folder upload (`/api/memories/upload/folder`)
    - ✅ **Integrated**: Onboarding upload (`/api/memories/upload/onboarding`)
    - ✅ **Note**: Notes creation (text input) uses different flow than file uploads
26. [x] Update memory deletion to clean up storage edges
    - ✅ **Implemented**: `cleanupStorageEdgesForMemory()` function
    - ✅ **Integrated**: Bulk deletion (all memories)
    - ✅ **Integrated**: Type-specific deletion (image, video, document, note, audio)
    - ✅ **Integrated**: Folder-based deletion
    - ✅ **Added**: Helper function for batch cleanup with error handling
27. [ ] Add transaction handling for atomic operations (overkill for MVP)

### Gallery Status Computation

28. [ ] Replace any existing gallery storage flags with computed status
29. [ ] Update gallery queries to include presence information
30. [ ] Add gallery-level storage status aggregation
31. [ ] Optimize gallery presence queries for performance

### Error Handling & Recovery

32. [ ] Implement edge cleanup for orphaned storage edges
33. [ ] Add retry logic for failed sync operations
34. [ ] Create background job for sync state monitoring
35. [ ] Add alerting for stuck sync operations

## Phase 4: ICP Integration

### Canister Updates

36. [ ] Update ICP canister to accept canonical UUIDs (same as Web2)
37. [ ] Implement idempotent operations (same UUID → AlreadyExists)
38. [ ] Add memory artifact storage (metadata + asset separately)
39. [ ] Add content hash verification for assets
40. [ ] Implement proper error handling and status reporting

### Storage Operations

41. [ ] Implement metadata storage to ICP canister
42. [ ] Implement asset storage to ICP canister
43. [ ] Add progress tracking for large file uploads
44. [ ] Implement retry logic for failed ICP operations
45. [ ] Add ICP storage status validation

### UUID Consistency

46. [ ] Ensure UUID generation is consistent between Web2 and ICP
47. [ ] Test UUID conversion (Postgres uuid ↔ string)
48. [ ] Validate UUID format and uniqueness
49. [ ] Add UUID validation in API endpoints

## Phase 5: Frontend Integration

### Gallery Components

50. [ ] Update gallery list to show storage status badges
51. [ ] Add storage status indicators to gallery detail pages
52. [ ] Implement "Store Forever" button with proper state management
53. [ ] Add progress indicators for ongoing sync operations
54. [ ] Update gallery sharing to include storage status

### Memory Components

55. [ ] Add per-memory storage status indicators
56. [ ] Update memory upload to show storage progress
57. [ ] Add storage status to memory detail views
58. [ ] Implement memory-level "Store Forever" functionality
59. [ ] Add storage status to memory sharing interfaces

### User Experience

60. [ ] Design storage status badges and indicators
61. [ ] Add tooltips explaining storage status
62. [ ] Implement storage status filtering and sorting
63. [ ] Add storage analytics dashboard (optional)
64. [ ] Create user-friendly error messages for sync failures

## Phase 6: Testing & Validation

### Unit Testing

65. [x] Test storage edge creation and updates
66. [x] Test presence view queries and performance
67. [x] Test sync state transitions
68. [x] Test idempotent operations
69. [x] Test error handling and recovery
    - ✅ **Created**: `tests/storage-edge-creation.test.ts` with comprehensive test coverage
    - ✅ **Tests**: Function logic, different memory types, error handling
    - ✅ **Mocked**: Database calls to avoid client-side restrictions
    - ✅ **Created**: `tests/test-storage-edge-integration.sh` for end-to-end testing
    - ✅ **Tests**: Complete flow from file upload to database verification
    - ✅ **Integration**: Real API server testing with bash automation

### Integration Testing

70. [ ] Test end-to-end memory creation with storage edges
71. [ ] Test gallery presence computation
72. [ ] Test ICP integration with real canister calls
73. [ ] Test concurrent operations and race conditions
74. [ ] Test data consistency across systems

### Performance Testing

75. [x] Test view performance with large datasets
76. [ ] Test API response times under load
77. [ ] Test materialized view refresh performance
78. [ ] Test memory usage for large galleries
79. [ ] Optimize slow queries and add indexes if needed

## Phase 7: Data Migration & Cleanup

### Existing Data Migration

80. [ ] Create migration script for existing memories
81. [ ] Populate initial storage edges for existing content:
    1. [ ] Add `neon-db` metadata edges for all existing memories
    2. [ ] Add `vercel-blob` asset edges for existing files
82. [ ] Validate migration results
83. [ ] Create rollback plan

### Legacy Cleanup

84. [ ] Remove any existing storage status columns from memory tables
85. [ ] Remove any existing storage status columns from gallery table
86. [ ] Update any legacy storage status logic
87. [ ] Clean up unused code and endpoints

### Validation & Monitoring

88. [ ] Verify data consistency after migration
89. [ ] Set up monitoring for storage edge operations
90. [ ] Add alerts for sync failures and data inconsistencies
91. [ ] Create dashboard for storage status overview

## Phase 8: Documentation & Deployment

### Documentation

92. [x] Update API documentation with new endpoints
93. [x] Document storage edge schema and relationships
94. [ ] Create troubleshooting guide for sync issues
95. [ ] Document performance optimization strategies
96. [ ] Update deployment guide with new database requirements

### Deployment

97. [ ] Plan database migration strategy
98. [ ] Test deployment in staging environment
99. [ ] Create rollback procedures
100.  [ ] Deploy to production with monitoring
101.  [ ] Monitor system performance post-deployment

## Optional Enhancements

### Advanced Features

102. [ ] Implement storage cost tracking and analytics
103. [ ] Add storage quota management
104. [ ] Implement automatic storage optimization
105. [ ] Add storage health monitoring and alerts
106. [ ] Create storage migration tools for users

### Performance Optimizations

107. [ ] Implement caching for frequently accessed presence data
108. [ ] Add database connection pooling optimization
109. [ ] Implement background job queue for sync operations
110. [ ] Add CDN integration for asset delivery
111. [ ] Optimize database queries with query analysis

### Future Backend Support

112. [ ] Add support for Walrus storage backend
113. [ ] Add support for Arweave storage backend
114. [ ] Add support for S3-compatible storage
115. [ ] Implement multi-backend redundancy
116. [ ] Add storage backend health checks

## Progress Summary

**Completed Tasks**: 29/116 (25.0%)

- ✅ **Phase 1**: 12/12 tasks (100%) - COMPLETE
- ✅ **Phase 2**: 12/15 tasks (80%) - NEARLY COMPLETE
- ⏳ **Phase 3**: 4/11 tasks (36%) - IN PROGRESS
- ⏳ **Phase 4**: 0/14 tasks (0%) - HIGH PRIORITY
- ⏳ **Phase 5**: 0/15 tasks (0%)
- ⏳ **Phase 6**: 4/15 tasks (27%)
- ⏳ **Phase 7**: 0/12 tasks (0%)
- ⏳ **Phase 8**: 2/10 tasks (20%)

**Next Priority**: Phase 3 (Backend Logic Updates) - Continue with transaction handling and gallery status computation
