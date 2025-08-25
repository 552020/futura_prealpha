# Folder Upload Performance Issue

## Current Performance

- **11 files**: ~80.5 seconds total time
- **Average**: ~7.3 seconds per file
- **Total size**: ~21.85 MB
- **Upload speed**: ~0.25 MB/s

## Performance Context & Expectations

### What's "Normal" for Folder Uploads?

#### Upload Bandwidth Limitations

- **10 Mbps uplink** ≈ **1.25 MB/s** → 100 MB takes ~**80 s** (best case)
- **20 Mbps** → ~**40 s** for 100 MB
- **Mobile (2–5 Mbps)** can be **3–5× slower**

#### UX Expectations (with clear progress bar)

- **<10 s**: feels instant
- **10–30 s**: acceptable if progress is obvious
- **30–90 s**: tolerable only with strong feedback (percent, items done, ETA)
- **>90 s**: users start to doubt it's working unless there's steady movement and no stalls

For a demo with ~10–20 photos (often 20–200 MB): users will accept **20–60 s** if progress is clear; aim for **<30 s** when possible.

## Root Cause Analysis

Even after implementing parallel processing + batch inserts, the **80 s for 11 images** suggests the bottleneck isn't database operations—it's **upload throughput + platform overhead**:

### Primary Bottlenecks

1. **Network-bound**: Each file takes several seconds to PUT to Vercel Blob; total time matches "a few waves" of uploads at limited concurrency
2. **Runtime constraints**: Running the route on **Edge** can throttle/serialize heavy I/O; Node runtime generally streams/parallelizes better for this workload
3. **Per-file overhead**: Validation (read buffers), multiple fetches, and verbose logging add seconds when repeated 10–20×
4. **Platform I/O limits**: Vercel Edge runtime may have stricter concurrency limits than Node.js runtime

## Involved Files & Functions

### Backend

- `src/app/api/memories/upload/onboarding/folder/route.ts` - Main endpoint
- `src/app/api/memories/upload/utils.ts` - Utility functions
- `src/utils/memories.ts` - Memory processing logic

### Frontend

- `src/hooks/user-file-upload.ts` - Upload hook
- `src/services/upload.ts` - Upload service
- `src/components/memory/ItemUploadButton.tsx` - Upload UI

## Current Optimizations Implemented

- ✅ Parallel processing with `p-limit(5)` concurrency cap
- ✅ Batch database inserts (grouped by file type)
- ✅ Removed transaction wrapper (Neon HTTP driver limitation)
- ✅ Performance logging and metrics

## Practical Targets & Solutions

### Performance Targets

- **Target for demo** (11 photos): **<20–30 s** if possible; **≤60 s** acceptable with progress
- **Progress feedback**: Overall % + "X of 11" counter

### Most Impactful Changes (Priority Order)

#### 1. Runtime Optimization

```typescript
// Add to folder/route.ts
export const runtime = "nodejs"; // Instead of default 'edge'
```

- **Impact**: Node.js runtime handles heavy I/O better than Edge
- **Expected improvement**: 20-40% faster uploads

#### 2. Client-Direct Upload (Architectural Change)

- Upload directly from client to Vercel Blob using presigned URLs
- Server only handles metadata and database writes
- **Impact**: Bypasses server bandwidth limitations
- **Expected improvement**: 50-70% faster uploads

#### 3. Concurrency Tuning

- Increase concurrency from 5 to 8-10 (test optimal value)
- **Impact**: Better utilization of available bandwidth
- **Expected improvement**: 10-20% faster uploads

#### 4. Production Optimizations

- Trim heavy per-file logs in production
- Skip detailed validation for trusted uploads
- **Impact**: Reduces per-file overhead
- **Expected improvement**: 5-15% faster uploads

## Implementation Plan

### Phase 1: Runtime Change (Quick Win)

1. Add `export const runtime = 'nodejs'` to folder route
2. Test performance improvement
3. Monitor for any runtime-specific issues

### Phase 2: Concurrency Tuning

1. Test concurrency values: 5, 8, 10, 12
2. Find optimal balance between speed and stability
3. Update `p-limit()` configuration

### Phase 3: Client-Direct Upload (Major Refactor)

1. Implement presigned URL generation
2. Modify frontend to upload directly to Blob
3. Update server to handle metadata-only requests
4. Add progress tracking for individual files

### Phase 4: Production Optimization

1. Add environment-based logging levels
2. Optimize validation for production
3. Add retry logic for failed uploads

## Monitoring & Success Metrics

- **Target upload speed**: >1 MB/s for typical connections
- **Progress feedback**: Real-time file counter and percentage
- **Error handling**: Graceful degradation for failed uploads
- **User feedback**: Monitor for upload abandonment rates

## Related Issues

- Database connection timeout during folder uploads
- Missing progress indicators for bulk operations
- Edge runtime limitations for heavy I/O operations
