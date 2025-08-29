# Implement Create Gallery from Folder Feature

## Problem Description

Users need the ability to create a gallery from an existing folder. This allows users to organize their memories by creating curated galleries from folders they've already uploaded.

## User Story

**As a user**, I want to select a folder and create a gallery from it, so that I can organize and showcase my memories in a more curated way.

## Requirements

### Functional Requirements

1. **Folder Selection**

   - User can select from existing folders
   - Show folder name and item count
   - Display folder preview/thumbnail

2. **Gallery Creation**

   - Create a new gallery entity
   - Copy all memories from selected folder to gallery
   - Maintain original folder structure
   - Allow user to customize gallery name and description

3. **Gallery Management**
   - Gallery should be a separate entity from folders
   - Galleries can be shared independently
   - Galleries can be edited/deleted separately from source folder

### Technical Requirements

1. **Database Schema** ✅ **ALREADY IMPLEMENTED**

   - `galleries` table - ✅ Already exists
   - `galleryItems` table - ✅ Already exists (junction table)
   - `galleryShares` table - ✅ Already exists
   - Relationship between galleries and memories - ✅ Already implemented

2. **API Endpoints** ✅ **ALREADY IMPLEMENTED**

   - `POST /api/galleries` - Create gallery from folder or memories ✅
   - `GET /api/galleries` - List user's galleries ✅
   - `GET /api/galleries/[id]` - Get gallery details with items ✅
   - `PUT /api/galleries/[id]` - Update gallery metadata ✅
   - `DELETE /api/galleries/[id]` - Delete gallery ✅
   - `POST /api/galleries/[id]/share` - Share gallery ✅

3. **Frontend Components**
   - Gallery creation modal/form
   - Folder selection component
   - Gallery list view
   - Gallery detail view

## Implementation Plan

### Phase 1: Backend APIs ✅ **ALREADY IMPLEMENTED**

1. ✅ Database schema already exists (`galleries`, `galleryItems`, `galleryShares`)
2. ✅ Gallery API endpoints already implemented (`/api/galleries`)
3. ✅ Folder-to-gallery conversion logic already implemented in POST `/api/galleries`

### Phase 2: Frontend Components ✅ **MOSTLY COMPLETED**

1. ✅ Create gallery creation modal with folder selection
2. ✅ Implement folder selection UI component
3. ✅ Add gallery list component
4. ✅ Create gallery detail page
5. [ ] Wire up gallery preview page
6. [ ] Create gallery management page
7. [ ] Add navigation integration

## Current Progress Summary

### ✅ **COMPLETED TASKS (7/10)**

- ✅ **Task 1**: Update Gallery Service Functions
- ✅ **Task 2**: Gallery Types (already implemented)
- ✅ **Task 3**: Create Gallery Creation Modal
- ✅ **Task 4**: Create Folder Selection Component
- ✅ **Task 5**: Create Gallery List Component
- ✅ **Task 6**: Create Gallery Card Component
- ✅ **Task 7**: Wire up Gallery Detail Page

### 🔄 **IN PROGRESS (1/10)**

- 🔄 **Task 8**: Wire up Gallery Preview Page

### ⏳ **PENDING TASKS (2/10)**

- ⏳ **Task 9**: Create Gallery Management Page
- ⏳ **Task 10**: Add Navigation Integration

### Phase 3: Integration ✅ **BACKEND READY**

1. ✅ Backend APIs already available and tested
2. Add gallery navigation
3. ✅ Gallery sharing functionality already available
4. Add gallery management features

## Detailed Implementation Todo List

### 1. Update Gallery Service Functions ✅ **COMPLETED**

- ✅ **1.1** Updated `src/nextjs/src/services/gallery.ts`
  - ✅ **1.1.1** Replaced mock `createGallery` with real API call to `/api/galleries`
  - ✅ **1.1.2** Added `createGalleryFromFolder(folderName: string, title?: string, description?: string, isPublic?: boolean)`
  - ✅ **1.1.3** Added `createGalleryFromMemories(memories: Array<{id: string, type: string}>, title?: string, description?: string, isPublic?: boolean)`
  - ✅ **1.1.4** Updated `listGalleries` to use real API call with pagination
  - ✅ **1.1.5** Updated `getGallery` to use real API call
  - ✅ **1.1.6** Added `updateGallery(id: string, updates: {title?: string, description?: string, isPublic?: boolean})`
  - ✅ **1.1.7** Added `deleteGallery(id: string)`
  - ✅ **1.1.8** Added `shareGallery(id: string, shareData: {sharedWithType: string, sharedWithId: string})`
  - ✅ **1.1.9** Added proper error handling with `handleApiResponse` helper
  - ✅ **1.1.10** Created `/api/galleries/folders` endpoint for folder listing

### 2. Gallery Types ✅ **ALREADY IMPLEMENTED**

- ✅ **2.1** `src/nextjs/src/types/gallery.ts` already exists with:
  - ✅ **2.1.1** `GalleryWithItems` interface
  - ✅ **2.1.2** `CreateGalleryRequest` interface
  - ✅ **2.1.3** `GalleryListResponse` interface
  - ✅ **2.1.4** `GalleryDetailResponse` interface
  - ✅ **2.1.5** `FolderInfo` interface

### 3. Create Gallery Creation Modal (shadcn) ✅ **COMPLETED**

- ✅ **3.1** Created `src/nextjs/src/components/galleries/CreateGalleryModal.tsx`
  - ✅ **3.1.1** Used shadcn `Dialog` component for modal
  - ✅ **3.1.2** Used shadcn `Form` with `useForm` hook and zod validation
  - ✅ **3.1.3** Used shadcn `Input` for title and description
  - ✅ **3.1.4** Used shadcn `Select` for folder selection (via FolderSelector)
  - ✅ **3.1.5** Used shadcn `Switch` for public/private toggle
  - ✅ **3.1.6** Used shadcn `Button` with loading state
  - ✅ **3.1.7** Used shadcn `Label` for form labels
  - ✅ **3.1.8** Error handling with shadcn `Alert` component
  - ✅ **3.1.9** Real API integration with gallery service
  - ✅ **3.1.10** Auto-generation of gallery titles
  - ✅ **3.1.11** Form validation with proper error messages

### 4. Create Folder Selection Component (shadcn) ✅ **COMPLETED**

- ✅ **4.1** Created `src/nextjs/src/components/galleries/FolderSelector.tsx`
  - ✅ **4.1.1** Used shadcn `Select` component with `SelectTrigger`, `SelectContent`, `SelectItem`
  - ✅ **4.1.2** Fetch available folders from user's memories using existing service
  - ✅ **4.1.3** Display folder name and item count in select options
  - ✅ **4.1.4** Handle empty state with custom message and helpful UI
  - ✅ **4.1.5** Loading state with shadcn `Skeleton` component
  - ✅ **4.1.6** Refresh functionality with loading states
  - ✅ **4.1.7** Selected folder display with item count

### 5. Create Gallery List Component (shadcn) ✅ **COMPLETED**

- ✅ **5.1** Created `src/nextjs/src/components/galleries/GalleryList.tsx`
  - ✅ **5.1.1** Used shadcn `Card` component for gallery cards
  - ✅ **5.1.2** Used shadcn `Badge` for public/private indicators
  - ✅ **5.1.3** Used shadcn `Button` for action buttons
  - ✅ **5.1.4** Used shadcn `Skeleton` for loading states
  - ✅ **5.1.5** Used shadcn `Alert` for error handling
  - ✅ **5.1.6** Pagination with "Load More" functionality
  - ✅ **5.1.7** Empty state with call-to-action
  - ✅ **5.1.8** Real API integration with gallery service
  - ✅ **5.1.9** Responsive grid layout (1-4 columns)
  - ✅ **5.1.10** Error recovery with retry functionality

### 6. Create Gallery Card Component (shadcn) ✅ **COMPLETED**

- ✅ **6.1** Created `src/nextjs/src/components/galleries/GalleryCard.tsx`
  - ✅ **6.1.1** Used shadcn `Card`, `CardHeader`, `CardContent`, `CardFooter`
  - ✅ **6.1.2** Smart thumbnail handling from first gallery item
  - ✅ **6.1.3** Used shadcn `Badge` for status indicators (public/private, item count)
  - ✅ **6.1.4** Used shadcn `Button` for action buttons (view, edit, share)
  - ✅ **6.1.5** Used shadcn `Tooltip` for hover information
  - ✅ **6.1.6** Hover effects with overlay action buttons
  - ✅ **6.1.7** Date formatting using `date-fns`
  - ✅ **6.1.8** Owner-specific actions (edit button only for owners)
  - ✅ **6.1.9** Click event handling with proper event propagation

### 7. Update Gallery Detail Page ✅ **COMPLETED**

- ✅ **7.1** Updated `src/nextjs/src/app/[lang]/gallery/[id]/page.tsx`
  - ✅ **7.1.1** Page layout with gallery header using shadcn components
  - ✅ **7.1.2** Gallery metadata display (title, description, public/private)
  - ✅ **7.1.3** Gallery items grid view
  - ✅ **7.1.4** Memory card components for each item
  - ✅ **7.1.5** Wired up "Edit" button functionality (placeholder for future implementation)
  - ✅ **7.1.6** Wired up "Share" button functionality (placeholder for future implementation)
  - ✅ **7.1.7** Wired up "Publish/Hide" button functionality with real API integration
  - ✅ **7.1.8** Wired up "Delete" button with confirmation dialog and real API integration
  - ✅ **7.1.9** Wired up "Preview" button to navigate to preview page
  - ✅ **7.1.10** Added loading states for update and delete operations
  - ✅ **7.1.11** Enhanced image click handler to navigate to preview with specific image
  - ✅ **7.1.12** Real API integration with gallery service for all operations

### 8. Update Gallery Preview Page

- [ ] **8.1** Update `src/nextjs/src/app/[lang]/gallery/[id]/preview/page.tsx`
  - ✅ **8.1.1** Full-screen gallery preview with hero cover
  - ✅ **8.1.2** Sticky header with gallery info
  - ✅ **8.1.3** Image grid with lightbox functionality
  - [ ] **8.1.4** Wire up "Publish" button functionality with real API integration
  - [ ] **8.1.5** Wire up "Download" button functionality
  - [ ] **8.1.6** Wire up "Share" button functionality
  - [ ] **8.1.7** Add image lightbox/modal for full-screen viewing (already implemented)
  - [ ] **8.1.8** Update mock data flag to use environment variable
  - [ ] **8.1.9** Add loading states for button operations
  - [ ] **8.1.10** Add error handling for failed operations

### 9. Create Gallery Management Page

- [ ] **9.1** Create `src/nextjs/src/app/[lang]/dashboard/galleries/page.tsx`
  - [ ] **9.1.1** Page header with "Create Gallery" button using shadcn `Button`
  - [ ] **9.1.2** Gallery list component integration
  - [ ] **9.1.3** Search functionality using shadcn `Input`
  - [ ] **9.1.4** Filter functionality using shadcn `Select`
  - [ ] **9.1.5** Empty state using shadcn `EmptyState` component
  - [ ] **9.1.6** Loading states using shadcn `Skeleton`

### 10. Add Navigation Integration

- [ ] **10.1** Update navigation menu
  - [ ] **10.1.1** Add "Galleries" link to main navigation using shadcn `NavigationMenu`
  - [ ] **10.1.2** Add galleries to breadcrumb navigation using shadcn `Breadcrumb`
  - [ ] **10.1.3** Update active state handling

### 11. Add Gallery Creation to Dashboard

- [ ] **11.1** Update dashboard page
  - [ ] **11.1.1** Add "Create Gallery" button to dashboard using shadcn `Button`
  - [ ] **11.1.2** Add gallery creation modal trigger
  - [ ] **11.1.3** Add recent galleries section using `GalleryList` component

### 12. Add Gallery Creation to Folder Page

- [ ] **12.1** Update folder detail page
  - [ ] **12.1.1** Add "Create Gallery from Folder" button using shadcn `Button`
  - [ ] **12.1.2** Pre-fill folder name in gallery creation modal
  - [ ] **12.1.3** Show success message using shadcn `Toast` component

### 13. Add Gallery Creation to Memory Selection

- [ ] **13.1** Update memory grid components
  - [ ] **13.1.1** Add multi-select functionality using shadcn `Checkbox`
  - [ ] **13.1.2** Add "Create Gallery from Selection" option using shadcn `Button`
  - [ ] **13.1.3** Bulk selection UI improvements with shadcn components

### 14. Error Handling and Validation (shadcn)

- [ ] **14.1** Form validation using shadcn `useForm` and `zod`
  - [ ] **14.1.1** Required field validation with shadcn `FormField`
  - [ ] **14.1.2** Folder name validation
  - [ ] **14.1.3** Title length limits
  - [ ] **14.1.4** Error message display using shadcn `FormMessage`

### 15. Loading States and UX (shadcn)

- [ ] **15.1** Loading indicators using shadcn components
  - [ ] **15.1.1** Gallery creation loading state with shadcn `Button` loading prop
  - [ ] **15.1.2** Gallery list loading state with shadcn `Skeleton`
  - [ ] **15.1.3** Folder fetching loading state with shadcn `Skeleton`
  - [ ] **15.1.4** Skeleton loaders for gallery cards using shadcn `Skeleton`

### 16. Success/Error Feedback (shadcn)

- [ ] **16.1** Toast notifications using shadcn `useToast`
  - [ ] **16.1.1** Gallery created successfully
  - [ ] **16.1.2** Gallery updated successfully
  - [ ] **16.1.3** Gallery deleted successfully
  - [ ] **16.1.4** Error notifications

### 17. Confirmation Dialogs (shadcn)

- [ ] **17.1** Confirmation dialogs using shadcn `AlertDialog`
  - [ ] **17.1.1** Delete gallery confirmation
  - [ ] **17.1.2** Publish gallery confirmation
  - [ ] **17.1.3** Share gallery confirmation

### 18. Testing and Polish

- [ ] **18.1** Component testing
  - [ ] **18.1.1** Test gallery creation flow
  - [ ] **18.1.2** Test gallery list rendering
  - [ ] **18.1.3** Test error scenarios
  - [ ] **18.1.4** Test responsive design

### 19. Documentation

- [ ] **19.1** Update user documentation
  - [ ] **19.1.1** Add gallery creation instructions
  - [ ] **19.1.2** Document gallery management features
  - [ ] **19.1.3** Add screenshots and examples

## UI/UX Design

### Gallery Creation Flow

1. User clicks "Create Gallery" button
2. Modal opens with folder selection
3. User selects source folder
4. User enters gallery name and description
5. User confirms creation
6. Gallery is created and user is redirected to gallery view

### Folder Selection UI

- Grid/list of available folders
- Folder preview with item count
- Search/filter functionality
- Clear selection state

### Gallery Management

- Gallery list with thumbnails
- Edit/delete actions
- Share functionality
- Gallery settings

## Existing Database Structure ✅

The gallery database schema is already implemented in `src/nextjs/src/db/schema.ts`:

### Tables Already Available:

1. **`galleries`** - Main gallery table

   ```typescript
   {
     id: string;
     ownerId: string; // References allUsers.id
     title: string;
     description?: string;
     isPublic: boolean;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

2. **`galleryItems`** - Junction table for gallery memories

   ```typescript
   {
     id: string;
     galleryId: string; // References galleries.id
     memoryId: string;
     memoryType: 'image' | 'video' | 'document' | 'note' | 'audio';
     position: number;
     caption?: string;
     isFeatured: boolean;
     metadata: Record<string, unknown>;
     createdAt: Date;
     updatedAt: Date;
   }
   ```

3. **`galleryShares`** - Gallery sharing table
   ```typescript
   {
     id: string;
     galleryId: string;
     ownerId: string;
     sharedWithType: "user" | "group" | "relationship";
     // ... sharing fields
   }
   ```

### Key Features Already Available:

- ✅ Gallery CRUD operations
- ✅ Gallery item management with ordering
- ✅ Gallery sharing functionality
- ✅ Memory type support (image, video, document, note, audio)
- ✅ Featured items support
- ✅ Metadata support for gallery items

## Existing API Implementation ✅

The gallery API endpoints are already fully implemented in `src/nextjs/src/app/api/galleries/`:

### Main Endpoints:

1. **`POST /api/galleries`** - Create gallery from folder or memories

   ```typescript
   // Create from folder
   POST /api/galleries
   {
     "type": "from-folder",
     "folderName": "wedding_small",
     "title": "My Wedding Gallery",
     "description": "Photos from our wedding",
     "isPublic": false
   }

   // Create from selected memories
   POST /api/galleries
   {
     "type": "from-memories",
     "memories": [
       { "id": "memory1", "type": "image" },
       { "id": "memory2", "type": "video" }
     ],
     "title": "Custom Gallery",
     "description": "Selected memories"
   }
   ```

2. **`GET /api/galleries`** - List user's galleries (paginated)
3. **`GET /api/galleries/[id]`** - Get gallery with all items and access control
4. **`PUT /api/galleries/[id]`** - Update gallery metadata
5. **`DELETE /api/galleries/[id]`** - Delete gallery
6. **`POST /api/galleries/[id]/share`** - Share gallery with users/groups

### Key Features:

- ✅ **Folder-to-gallery conversion** - Automatically finds all memories in a folder
- ✅ **Access control** - Checks gallery and memory permissions
- ✅ **Pagination** - Supports paginated gallery listing
- ✅ **Sharing** - Full gallery sharing functionality
- ✅ **Memory types** - Supports all memory types (image, video, document, note, audio)

## Technical Considerations

### Data Structure

```typescript
interface Gallery {
  id: string;
  name: string;
  description?: string;
  userId: string;
  sourceFolderId?: string;
  createdAt: Date;
  updatedAt: Date;
  memoryCount: number;
  thumbnailUrl?: string;
}

interface GalleryMemory {
  id: string;
  galleryId: string;
  memoryId: string;
  order: number;
  addedAt: Date;
}
```

### API Design

```typescript
// Create gallery from folder
POST /api/galleries
{
  name: string;
  description?: string;
  sourceFolderId: string;
}

// Response
{
  id: string;
  name: string;
  description?: string;
  memoryCount: number;
  createdAt: Date;
}
```

## Files to Create/Modify

### Backend

- `src/backend/src/gallery.rs` - Gallery management logic
- `src/backend/src/lib.rs` - Add gallery endpoints
- ✅ Database schema already exists in `src/nextjs/src/db/schema.ts`

### Frontend

- `src/nextjs/src/app/[lang]/galleries/page.tsx` - Gallery list page
- `src/nextjs/src/app/[lang]/galleries/[id]/page.tsx` - Gallery detail page
- `src/nextjs/src/components/gallery/` - Gallery components
- `src/nextjs/src/services/galleries.ts` - Gallery API service
- `src/nextjs/src/types/gallery.ts` - Gallery type definitions

### API Routes ✅ **ALREADY IMPLEMENTED**

- `src/nextjs/src/app/api/galleries/route.ts` - Gallery CRUD endpoints ✅
- `src/nextjs/src/app/api/galleries/[id]/route.ts` - Individual gallery endpoints ✅
- `src/nextjs/src/app/api/galleries/[id]/share/` - Gallery sharing endpoints ✅

## Acceptance Criteria

- [ ] User can select a folder from existing folders
- [ ] User can create a gallery with custom name and description
- [ ] All memories from selected folder are copied to gallery
- [ ] Gallery is created successfully and user is redirected
- [ ] Gallery can be viewed, edited, and deleted
- [ ] Gallery maintains relationship with source folder
- [ ] Gallery sharing functionality works
- [ ] Gallery list shows all user's galleries
- [ ] Gallery detail page displays all gallery memories

## Current Status ✅

**Backend Complete** - All backend functionality is already implemented:

- ✅ Database schema ready
- ✅ API endpoints implemented
- ✅ Folder-to-gallery conversion logic working
- ✅ Gallery sharing functionality available

**Frontend Needed** - Only frontend components need to be built:

- Gallery creation modal
- Folder selection UI
- Gallery list and detail pages

## Priority

**High** - Since the backend is complete, this feature can be implemented quickly and provides significant user value.

## Dependencies

- Existing folder functionality must be working
- Memory management system must be stable
- User authentication system must be in place

## Future Enhancements

- Gallery templates/themes
- Gallery collaboration features
- Gallery analytics and insights
- Gallery export functionality
- Gallery versioning/history
