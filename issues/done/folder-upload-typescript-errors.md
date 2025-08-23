# Folder Upload TypeScript Errors After Performance Optimization

## Problem

After implementing parallel processing and batch database inserts for folder uploads, TypeScript compilation is failing with multiple type errors.

## Root Cause

The performance optimization changes introduced type mismatches between the generated row objects and the database schema requirements.

### Changes Made

1. **Parallel Processing**: Replaced sequential `for` loop with `pLimit(5)` and `Promise.allSettled`
2. **Batch Database Inserts**: Replaced individual `storeFileInDatabaseWithErrorHandling` calls with batch `db.insert()` operations
3. **Row Object Building**: Created custom row objects with optional properties instead of using the existing database utility functions

### Type Mismatches

- **Row Objects**: Built with optional properties (`title?`, `mimeType?`, `size?`, etc.)
- **Database Schema**: Expects required `string` types for these fields
- **Batch Insert**: Failing because row objects don't match exact table schemas

## Error Details

### Primary Errors

**File**: `src/app/api/memories/upload/onboarding/folder/route.ts`
**Line**: 173
**Error**: `Type 'string | undefined' is not assignable to type 'string'`

**Context**:

```typescript
uploadResults.push({
  fileName: value.fileName, // ← This line is failing
  url: value.url,
  success: true,
  userId: value.userId,
  memoryId: "",
});
```

**Problem**: The `value.fileName` property is typed as `string | undefined` but the `uploadResults` array expects a `string` type.

**Root Cause**: When building the `value` object in parallel processing, `fileName` is set to `file.name`, but TypeScript thinks it could be `undefined` even though `file.name` should always be a string.

### Database Insert Errors

```
Line 193: No overload matches this call for images table
Line 198: No overload matches this call for videos table
Line 203: No overload matches this call for documents table
```

## Files Affected

- `src/app/api/memories/upload/onboarding/folder/route.ts` - Main route with TypeScript errors
- Database schema files - Type mismatches with table definitions

## Impact

- **Build Failure**: `npm run build` fails due to TypeScript compilation errors
- **Development Blocked**: Cannot deploy or test the performance improvements
- **Functionality**: The parallel processing logic may work at runtime but TypeScript catches potential issues

## Proposed Solutions

### Option 1: Revert to Original Approach

- Remove parallel processing and batch inserts
- Return to individual `storeFileInDatabaseWithErrorHandling` calls
- Keep the original working implementation

### Option 2: Fix Type Mismatches

- Ensure all required database fields are properly set
- Add proper type guards and null checks
- Match row objects exactly to database schema requirements

### Option 3: Hybrid Approach

- Keep parallel processing for validation and upload
- Use individual database inserts (original approach)
- Get performance benefits without schema complexity

## Priority

🔴 **HIGH** - Build is broken and development is blocked

## Status

✅ **RESOLVED** - TypeScript errors have been fixed

## Resolution

The TypeScript errors were resolved by implementing proper type-safe row building functions that match the exact Drizzle schema types:

### Key Changes Made

1. **Type Definitions**: Added proper `InferInsertModel` types for each table:

   ```typescript
   type ImageInsert = InferInsertModel<typeof images>;
   type VideoInsert = InferInsertModel<typeof videos>;
   type DocumentInsert = InferInsertModel<typeof documents>;
   ```

2. **Row Builder Functions**: Created dedicated functions that return exact schema types:

   ```typescript
   function buildImageRow(file: File, url: string, ownerId: string): ImageInsert;
   function buildVideoRow(file: File, url: string, ownerId: string): VideoInsert;
   function buildDocumentRow(file: File, url: string, ownerId: string): DocumentInsert;
   ```

3. **Discriminated Union Types**: Implemented proper type-safe upload result types:

   ```typescript
   type UploadOk =
     | { success: true; memoryType: "image"; fileName: string; url: string; row: ImageInsert }
     | { success: true; memoryType: "video"; fileName: string; url: string; row: VideoInsert }
     | { success: true; memoryType: "document"; fileName: string; url: string; row: DocumentInsert };
   ```

4. **String Type Guarantee**: Ensured `fileName` is always a string:

   ```typescript
   const name = String(file.name || "Untitled"); // Guarantee string type
   ```

5. **Type-Safe Processing**: Used proper type guards to split rows by type:
   ```typescript
   ok.forEach((value) => {
     if (value.memoryType === "image") {
       imageRows.push(value.row);
     } else if (value.memoryType === "video") {
       videoRows.push(value.row);
     } else {
       documentRows.push(value.row);
     }
   });
   ```

### Performance Benefits Maintained

- ✅ Parallel processing with `pLimit(5)`
- ✅ Batch database inserts (no transactions - Neon HTTP limitation)
- ✅ Performance metrics logging
- ✅ Type safety throughout the pipeline

### Build Status

- ✅ `npm run build` passes successfully
- ✅ No TypeScript compilation errors
- ✅ All type safety restored

## Related Issues

- Folder upload performance optimization
- Database connection timeout during folder uploads
- Batch database operations implementation
