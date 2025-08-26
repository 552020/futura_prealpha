# Folder vs Gallery Architecture Decision

## Problem

Currently, the system only has **galleries** for organizing memories. However, for better UX, we need to distinguish between:

- **Folders** = Storage/organization (dashboard)
- **Galleries** = Curation/presentation (separate section)

## Current State

**Dashboard shows:**

- Individual files only
- No organizational structure
- No folders or galleries

**Current situation:**

- User uploads folder → files appear individually
- Original folder structure is lost
- Need to decide: folders vs galleries approach

## Proposed Solution

### Dashboard Structure

```
Dashboard
├── Folders
│   ├── Wedding Photos (50 images) ← Click to see files
│   ├── Family Vacation (30 images)
│   └── Work Documents (15 files)
└── Individual Files (not in folders)
```

### Galleries Structure

```
Galleries (separate section)
├── Best Wedding Photos (curated from folder)
├── Family Highlights (curated from folder)
└── Shared Collections
```

## Database Changes Required

### New Tables Needed

```sql
-- New entity for folder storage
folders (
  id, name, owner_id, created_at, updated_at
)

-- Junction table for folder contents
folder_items (
  folder_id, memory_id, memory_type, position
)
```

### Updated Schema

- `folders` table
- `folder_items` junction table
- Folder upload API endpoints
- Folder management in dashboard

## User Workflow

1. **Upload folder** → Shows as folder in dashboard
2. **Click folder** → See all files inside
3. **Select files** → "Create Gallery" button
4. **Gallery created** → Curated collection from folder
5. **Share gallery** → Galleries section

## Benefits

- ✅ **Natural organization** - folders for uploads, galleries for curation
- ✅ **Flexible** - can exclude files from galleries
- ✅ **Clear separation** - folders = storage, galleries = presentation
- ✅ **Intuitive** - users understand folders vs galleries
- ✅ **Better UX** - dashboard focused on file management

## Questions for Senior Dev

1. **Should we implement folders now** or stick with just galleries?
2. **Is this the right architectural approach** for the use case?
3. **Are there simpler alternatives** we're missing?
4. **Should folders and galleries be separate entities** or can we model this differently?
5. **What's the priority** - folders first, or complete gallery functionality first?

## Alternative Approaches

### Option 1: Implement folders

- Add folders table and API
- Separate dashboard and galleries sections
- Full organizational structure

### Option 2: Keep current approach

- Only galleries, no folders
- Dashboard shows all files mixed
- Simpler but less organized

### Option 3: Google Drive approach

- Add `parent_id` field to existing memory tables
- Create simple `folders` table (no junction table)
- Files have one parent folder (like Google Drive)
- Hierarchical folder structure
- Simpler schema, familiar UX

### Option 4: Hybrid approach

- Use existing memory structure
- Add "folder" metadata to memories
- Simpler implementation but less flexible

## Impact

- **Database schema changes** required
- **New API endpoints** needed
- **Frontend dashboard** redesign
- **Upload workflow** changes
- **Significant development effort**

## Related Issues

- Gallery sharing system implementation
- Dashboard redesign
- Upload folder functionality

## Two-Phase Implementation Plan (Senior Dev Recommendation)

### Phase 1: Demo-Ready Metadata Approach (≤1 day)

**For the demo, don't overbuild folders now. Use metadata-only grouping, but lay one tiny seam so you can upgrade cleanly later.**

#### Implementation:

1. **Capture folder hints on upload**

   - Save to each memory's `metadata`:

   ```ts
   {
     originalPath: "Wedding/Preparation/img001.jpg",
     folderName: "Wedding/Preparation"
   }
   ```

2. **Folders UI**

   - Query user's memories once, group by `metadata.folderName ?? "Ungrouped"`
   - Show "folders" as groups; clicking shows the group's items

3. **Gallery integration**

   - Keep gallery tables as-is
   - Enable "Add to Gallery" from any memory or group selection

4. **Tiny seam for future**
   - Add nullable `parentFolderId` column to memory tables now
   - Don't use it yet, but makes future migration smooth

#### Benefits:

- ✅ **Fast implementation** - just metadata grouping
- ✅ **Zero risk** - no complex folder logic
- ✅ **Demo works** - users see folder-like experience
- ✅ **Future-proof** - can upgrade to real folders

### Phase 2: Real Folders After Demo

#### Implementation:

1. **Create real tables**

   - `folders(id, ownerId, name, parentFolderId, createdAt, updatedAt)`
   - Optional: `memories(id, type, ownerId, parentFolderId, createdAt)` registry table

2. **Backfill**

   - For each distinct `metadata.folderName`, create a folder
   - Set each memory's `parentFolderId` where `metadata.folderName` matches

3. **Switch reads**
   - Replace "group by metadata" with `WHERE parent_folder_id = ?`

#### Benefits:

- ✅ **Clean migration** - backfill from existing data
- ✅ **Real folder functionality** - full CRUD operations
- ✅ **No data loss** - all folder info preserved

## Recommendation

**Do metadata grouping now** (fast + safe), keep the gallery feature as-is, and add the real folder model right after the demo using the same captured metadata to backfill.

**Bottom line:** Focus on user experience for demo, make it easy to upgrade later.

## TODO List

### Phase 1: Demo-Ready Metadata Approach (≤1 day)

#### Database Schema

- [x] Add nullable `parentFolderId` column to `images` table
- [x] Add nullable `parentFolderId` column to `videos` table
- [x] Add nullable `parentFolderId` column to `documents` table
- [x] Add nullable `parentFolderId` column to `notes` table
- [x] Add nullable `parentFolderId` column to `audio` table
- [x] Generate and apply migration for `parentFolderId` columns

#### Upload Logic

- [x] Modify folder upload to capture `originalPath` and `folderName`
- [x] Update `buildImageRow` to include folder metadata
- [x] Update `buildVideoRow` to include folder metadata
- [x] Update `buildDocumentRow` to include folder metadata
- [ ] Test folder upload with metadata capture

#### Dashboard UI

- [ ] Update memory query to group by `metadata.folderName`
- [ ] Create folder grouping component for dashboard
- [ ] Implement folder click to show contents
- [ ] Add "Ungrouped" section for files without folder metadata

**Note:** Folders are NOT a memory type - they are dashboard items that group memories. The dashboard will show both individual memories and folder items in the same grid.

**Implementation Details:**

1. **Group memories by `metadata.folderName`** - Extract folder information from memory metadata
2. **Create folder items** - Represent grouped memories as folder cards
3. **New dashboard list structure** - Replace `NormalizedMemory[]` with `(NormalizedMemory | FolderItem)[]`
4. **Filter memories** - Individual memories NOT in folders show as `NormalizedMemory` cards
5. **Folder items** - Memories in folders are grouped into `FolderItem` cards
6. **No nested folders** - Flat folder structure only
7. **Click behavior** - Clicking folder item navigates to new page showing `NormalizedMemory[]` inside that folder

**FolderItem Interface:**

```typescript
interface FolderItem {
  id: string;
  type: "folder";
  title: string; // folder name
  description: string; // "X items" or custom description
  itemCount: number;
  memories: NormalizedMemory[]; // the memories inside
  createdAt: string; // from oldest memory
  // same structure as NormalizedMemory for consistency
}
```

#### Integration

- [ ] Test folder grouping with existing memories
- [ ] Verify gallery integration still works
- [ ] Test with mock data

### Phase 2: Real Folders After Demo

#### Database Schema

- [ ] Create `folders` table
- [ ] Create `folder_items` junction table (if needed)
- [ ] Generate and apply migration for folder tables

#### Backfill Logic

- [ ] Create script to extract distinct `metadata.folderName` values
- [ ] Create script to create folder records
- [ ] Create script to set `parentFolderId` on memories
- [ ] Test backfill with sample data

#### API Updates

- [ ] Update memory queries to use `parentFolderId` instead of metadata grouping
- [ ] Create folder CRUD endpoints
- [ ] Update dashboard to use real folder queries

#### Frontend Updates

- [ ] Update dashboard to use real folder data
- [ ] Add folder management UI
- [ ] Test folder functionality end-to-end
