# Folder Upload: Memories Uploaded Singularly Instead of Grouped

## Issue Summary

When users upload a folder, the memories are being uploaded and stored individually rather than being grouped together as a folder. The folder structure is captured in metadata but not properly implemented in the UI, causing a poor user experience where users expect to see their folder as a single entity.

## Current Behavior

### What Happens Now

1. User selects a folder for upload
2. All files in the folder are uploaded individually to the server
3. Each file is stored as a separate memory record in the database
4. Folder information is captured in metadata (`originalPath`, `folderName`)
5. **Dashboard displays individual files instead of grouped folders**
6. User sees a list of individual files rather than organized folders

### Evidence from Code Analysis

#### Frontend Upload Logic (`src/hooks/user-file-upload.ts`)

```typescript
// ✅ Correctly sends all files to folder endpoint
const formData = new FormData();
Array.from(files).forEach((file) => {
  formData.append("file", file);
});

const endpoint = isOnboarding ? "/api/memories/upload/onboarding/folder" : "/api/memories/upload/folder";
```

#### Backend Folder Processing (`src/app/api/memories/upload/folder/route.ts`)

```typescript
// ✅ Correctly processes multiple files and captures folder info
function extractFolderInfo(fileName: string): { originalPath: string; folderName: string } {
  const pathParts = fileName.split("/");
  const folderName = pathParts.length > 1 ? pathParts[0] : "Ungrouped";
  return { originalPath: fileName, folderName: folderName };
}
```

#### Database Storage

```typescript
// ✅ Folder info is stored in metadata
metadata: {
  size: file.size,
  mimeType: file.type,
  originalName: name,
  uploadedAt: new Date().toISOString(),
  originalPath,  // ✅ Captured
  folderName,    // ✅ Captured
}
```

#### Dashboard Display (`src/app/[lang]/dashboard/page.tsx`)

```typescript
// ✅ Folder grouping logic exists but may not be working properly
const { dashboardItems } = useMemo(() => {
  const ungrouped = memories.filter((memory) => !memory.metadata?.folderName);
  const folderGroups = memories.reduce((groups, memory) => {
    const folderName = memory.metadata?.folderName;
    if (folderName) {
      if (!groups[folderName]) {
        groups[folderName] = [];
      }
      groups[folderName].push(memory);
    }
    return groups;
  }, {} as Record<string, NormalizedMemory[]>);
```

## Root Cause Analysis

### Primary Issue: TypeScript Type Definitions

The folder grouping logic exists and works correctly, but there's a **TypeScript type mismatch** in the API response types:

1. **API Response Types**: The `FetchMemoriesResponse` interface doesn't properly include the `metadata` field
2. **Type Safety Issues**: TypeScript is preventing access to `metadata` fields due to incomplete type definitions
3. **Data Flow Works**: The actual data flow and folder grouping logic is correct

### Evidence from Code Analysis

- ✅ **Backend**: Folder metadata is correctly captured and stored in database
- ✅ **API**: Database records are correctly returned with `metadata` field
- ✅ **Normalization**: `normalizeMemories` function correctly preserves metadata
- ✅ **Dashboard Logic**: Folder grouping logic exists and is well-implemented
- ✅ **UI Components**: `MemoryCard` already supports folder display
- ❌ **Type Definitions**: `FetchMemoriesResponse` interface missing `metadata` field

### Secondary Issues

#### Missing Database Schema

- No dedicated `folders` table exists
- Folder information is only stored in metadata
- No proper folder entity with relationships

#### Incomplete UI Implementation

- Folder items are created but may not be displayed correctly
- No folder-specific UI components
- Missing folder click behavior to show contents

## Expected Behavior

### What Should Happen

1. User selects a folder for upload
2. All files are uploaded and processed together
3. **Dashboard displays the folder as a single entity** with:
   - Folder name as title
   - File count in description
   - Thumbnail from first image
   - Click to expand and show contents
4. Individual files are grouped under the folder
5. Users can navigate into folders to see individual files

### Database Structure Needed

```sql
-- Dedicated folders table
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES all_users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Folder items junction table
CREATE TABLE folder_items (
  folder_id TEXT REFERENCES folders(id),
  memory_id TEXT NOT NULL,
  memory_type TEXT NOT NULL, -- 'image', 'video', 'document', etc.
  position INTEGER,
  PRIMARY KEY (folder_id, memory_id, memory_type)
);
```

## Impact

### User Experience

- **Confusing**: Users expect folders to appear as organized groups
- **Poor Organization**: No visual hierarchy or grouping
- **Difficult Navigation**: Hard to find related files
- **Lost Context**: Original folder structure is not preserved in UI

### Technical Debt

- **Incomplete Implementation**: Folder logic exists but doesn't work end-to-end
- **Data Inconsistency**: Folder info captured but not utilized
- **Performance**: Individual file queries instead of grouped queries
- **Scalability**: No proper folder management system

## Proposed Solutions

### Option 1: Fix Current Metadata-Based Approach (Quick Fix)

1. **Debug Dashboard Logic**: Fix the folder grouping in `dashboard/page.tsx`
2. **Verify Data Flow**: Ensure `metadata` is properly retrieved and passed
3. **Test Folder Display**: Verify folder items appear correctly
4. **Add Folder Click Behavior**: Implement navigation to folder contents

### Option 2: Implement Proper Folder Schema (Recommended)

1. **Create Folders Table**: Add proper database schema for folders
2. **Update Upload Logic**: Create folder records during upload
3. **Modify Dashboard**: Use folder-based queries and display
4. **Add Folder Management**: CRUD operations for folders

### Option 3: Hybrid Approach (Best for Demo)

1. **Use Current Metadata**: Keep existing folder info capture
2. **Add Folder Display**: Fix dashboard to show folders properly
3. **Plan Migration**: Design proper schema for future implementation
4. **Backfill Data**: Migrate metadata to proper folder structure later

## Implementation Plan

### Phase 1: Debug Current Implementation (1-2 hours)

1. **Verify Data Retrieval**: Check if `metadata` is being fetched correctly
2. **Fix Dashboard Logic**: Debug folder grouping in dashboard
3. **Test Folder Display**: Ensure folders appear as expected
4. **Add Basic Navigation**: Implement folder click to show contents

### Phase 2: Proper Folder Implementation (1-2 days)

1. **Database Schema**: Create folders and folder_items tables
2. **Upload Logic**: Modify to create folder records
3. **Dashboard Updates**: Use folder-based queries
4. **UI Components**: Create folder-specific components

### Phase 3: Advanced Features (Future)

1. **Nested Folders**: Support subfolder structure
2. **Folder Operations**: Move, rename, delete folders
3. **Bulk Operations**: Select multiple files for folder operations
4. **Folder Sharing**: Share entire folders

## Testing Strategy

### Manual Testing

1. **Upload Test**: Upload a folder with multiple files
2. **Display Test**: Verify folder appears in dashboard
3. **Navigation Test**: Click folder to see contents
4. **Edge Cases**: Empty folders, mixed file types, large folders

### Automated Testing

1. **Unit Tests**: Test folder grouping logic
2. **Integration Tests**: Test folder upload flow
3. **E2E Tests**: Test complete folder workflow

## Related Issues

- `issues/implement-folders.md` - General folder implementation discussion
- `issues/folder-upload-performance.md` - Performance considerations
- `issues/folder-upload-using-wrong-endpoint.md` - Previous endpoint issues

## Priority

**High** - This affects core user experience and makes folder uploads confusing and unorganized.

## Estimated Effort

- **Quick Fix**: 2-4 hours
- **Proper Implementation**: 1-2 days
- **Full Feature Set**: 3-5 days
