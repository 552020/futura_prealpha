# Implement Gallery Feature

## Overview

Implement a gallery feature for the "forever-gallery", i.e. wedding, vertical.

## Analysis Summary

### Current State

- **Vault**: Storage-focused, functional layout for family vertical
- **Gallery**: Missing - needed for forever-gallery vertical
- **Onboarding**: All verticals lead to vault (wrong for gallery users)

### Key Insights

1. **Gallery should follow vault pattern**: `/gallery` = MY gallery (current user)
2. **Internal naming**: Use "forever-gallery" for flexibility (not "wedding")
3. **Immediate value**: Gallery users should see their memories immediately, not go through onboarding
4. **User-specific**: Gallery is always someone's gallery (mine or others)

## Architecture Decision

### File Structure

```
src/app/[lang]/gallery/
├── page.tsx         # MY gallery (current user's curated collection)
├── [id]/
│   └── page.tsx     # Individual gallery item detail
└── components/      # Gallery-specific components
    ├── GalleryGrid.tsx
    ├── GalleryItem.tsx
    ├── GalleryActions.tsx
    └── GalleryLayout.tsx
```

### URL Structure

- `/gallery` - **MY gallery** (current user's curated collection)
- `/gallery/[id]` - **Gallery item detail** (individual curated memory)
- `/vault` - **MY vault** (unchanged - family vertical)
- `/shared` - **Shared memories** (unchanged)

## MVP Implementation Plan (Ship in Days)

### Phase 1: Database & API Foundation

1. **Future-Proof Database Schema**

   ```typescript
   // galleries table
   galleries: {
     id, ownerId, title, isPublic, isDefault, theme, metadata, createdAt, updatedAt;
   }

   // gallery_items table
   gallery_items: {
     id, galleryId, memoryId, position, caption, isFeatured, metadata, createdAt, updatedAt;
   }
   ```

   **Key Design:**

   - **Multi-gallery DB** with `isDefault` constraint for MVP UX
   - **JSONB metadata** fields for future features
   - **Proper indexes** for performance

2. **Core API Endpoints**
   - `GET /api/gallery` → returns (create-if-missing) user's gallery + items
   - `POST /api/gallery/items` → add memoryId(s) (bulk) with position
   - `PUT /api/gallery/items/reorder` → array of {itemId, position}
   - `PUT /api/gallery` → title, isPublic

### Phase 2: Gallery Pages

1. **Gallery Main Page**

   - `/gallery` → grid + lightweight **GalleryActions** (Rename, Toggle Public, Publish, Share)
   - Auto-add new memories to end of gallery after upload
   - Show toast "Added to your gallery"

2. **Gallery Detail Page**
   - `/gallery/[id]` → simple detail (full bleed, caption)

### Phase 3: Upload Flow Integration

1. **Forever-gallery Vertical**

   - After upload: **redirect to `/gallery`** (skip onboarding)
   - Auto-add new memory to gallery
   - Show success toast

2. **Family Vertical** (unchanged)
   - Continue to vault as before

## MVP Features

### ✅ What's Included

- **One default gallery per user** (enforced at DB level with `isDefault` constraint)
- **Default tasteful layout** (no themes yet)
- **Basic curation**: reorder, caption, feature items
- **Publish/Share**: toggle public, shareable URL
- **Auto-add on upload** for gallery users
- **Future-proof DB** (supports multi-gallery without migration)

### ❌ What's Deferred

- **Multi-gallery UI** (DB supports it, UI shows only default)
- **Themes and custom layouts** (theme field exists, defaults to NULL)
- **Advanced curation tools** (metadata fields ready for future features)
- **Per-item update endpoints** (can add later)
- **Virtualization** (unless >200 items)

## Critical UX Features

### **Publish & Share**

- **Publish button**: toggles `isPublic`, creates shareable URL (`/u/:slug/gallery` or `/g/:id`)
- **Share**: copies link; if private, show "Make public to share"
- **Empty state**: "Upload photos to start your gallery" with CTA

### **Upload Flow**

- **Forever-gallery users**: Upload → Gallery (immediate value)
- **Family users**: Upload → Vault (unchanged)
- **Auto-add**: New memories automatically added to gallery

## Technical Architecture

### **Data Model (Future-Proof MVP)**

```typescript
interface Gallery {
  id: string;
  ownerId: string; // business user id (stable)
  title: string;
  isPublic: boolean;
  isDefault: boolean; // MVP: one default gallery per user
  theme?: string; // NULL for MVP, future themes
  metadata: Record<string, any>; // JSONB for future features
  createdAt: string;
  updatedAt: string;
}

interface GalleryItem {
  id: string;
  galleryId: string;
  memoryId: string;
  position: number;
  caption?: string;
  isFeatured: boolean;
  metadata: Record<string, any>; // JSONB for future features
  createdAt: string;
  updatedAt: string;
}
```

**Database Constraints:**

- `UNIQUE(ownerId) WHERE isDefault = true` - One default gallery per user
- `idx_galleries_owner (ownerId)` - Fast user gallery lookup
- `idx_gallery_items_gallery (galleryId, position)` - Fast gallery item ordering

### **Security & Performance**

- **Owner ID**: Use stable business user ID from session
- **Public galleries**: Only expose published items
- **Private galleries**: Show 404 for public routes
- **Performance**: Use existing image thumbs + Next/Image with lazy loading
- **Soft delete**: Consider for gallery_items (easy undo)

## Success Metrics (MVP)

- **% uploads that redirect to `/gallery`**
- **Time-to-first-share after upload**
- **Publish rate** (toggled to public)

## Build Order

1. **DB tables** + `GET /api/gallery` (create-if-missing)
2. **`/gallery` page** with grid (reads API)
3. **Auto-add on upload** (POST /items)
4. **Publish toggle** + share link
5. **Detail page** `/gallery/[id]`

## Technical Specifications

### Gallery vs Vault Comparison

| Feature       | Vault                       | Gallery                      |
| ------------- | --------------------------- | ---------------------------- |
| **Purpose**   | Storage & organization      | Curation & presentation      |
| **Layout**    | Functional grid/list        | Artistic layouts             |
| **Focus**     | Functionality               | Aesthetics                   |
| **Sharing**   | Private by default          | Designed for sharing         |
| **Tools**     | Upload, organize, search    | Curate, arrange, theme       |
| **User Flow** | Upload → Onboarding → Vault | Upload → Gallery (immediate) |

### Data Structure

```typescript
interface GalleryItem {
  id: string;
  memoryId: string;
  position: number;
  caption?: string;
  theme?: string;
  isFeatured: boolean;
}

interface Gallery {
  id: string;
  userId: string;
  title: string;
  description?: string;
  theme: string;
  isPublic: boolean;
  items: GalleryItem[];
  createdAt: string;
  updatedAt: string;
}
```

### API Endpoints

- `GET /api/gallery` - Get current user's gallery
- `POST /api/gallery` - Create new gallery
- `PUT /api/gallery/[id]` - Update gallery
- `GET /api/gallery/[id]` - Get specific gallery
- `POST /api/gallery/[id]/items` - Add item to gallery
- `PUT /api/gallery/[id]/items/[itemId]` - Update gallery item

## Design Considerations

### Visual Design

- **Artistic focus** - More visual than functional
- **Storytelling** - Arranged to tell a story
- **Themes** - Different visual themes available
- **Responsive** - Works on all devices
- **Loading states** - Smooth loading experience

### User Experience

- **Immediate value** - Users see their memories right away
- **Easy curation** - Simple tools to arrange and customize
- **Sharing ready** - Designed to be shared with others
- **Inspiration** - Show examples of great galleries

### Performance

- **Lazy loading** - Load gallery items as needed
- **Image optimization** - Optimize images for gallery display
- **Caching** - Cache gallery data for fast loading
- **Pagination** - Handle large galleries efficiently

## Success Metrics

- **User engagement** - Time spent in gallery
- **Gallery creation** - Number of galleries created
- **Sharing** - Number of galleries shared
- **User retention** - Users returning to gallery
- **Conversion** - Gallery users converting to paid plans

## Questions to Resolve

1. **Gallery themes** - What themes should we offer?
2. **Curation tools** - How sophisticated should the tools be?
3. **Sharing model** - How should gallery sharing work?
4. **Integration** - How does gallery integrate with existing features?
5. **Migration** - How do existing users get a gallery?

## Files to Create/Modify

### New Files

- `src/app/[lang]/gallery/page.tsx`
- `src/app/[lang]/gallery/[id]/page.tsx`
- `src/app/[lang]/gallery/layout.tsx`
- `src/components/gallery/GalleryGrid.tsx`
- `src/components/gallery/GalleryItem.tsx`
- `src/components/gallery/GalleryActions.tsx`
- `src/components/gallery/GalleryLayout.tsx`
- `src/app/api/gallery/route.ts`
- `src/app/api/gallery/[id]/route.ts`
- `src/app/api/gallery/[id]/items/route.ts`

### Modified Files

- `src/contexts/vertical-context.tsx` (new)
- `src/contexts/onboarding-context.tsx`
- `src/app/[lang]/onboarding/items-upload/items-upload-client.tsx`
- `src/components/onboarding/onboard-modal.tsx`
- `src/db/schema.ts` (add gallery tables)

## Priority

**High** - This is core to the forever-gallery vertical and provides immediate value to users.

## Dependencies

- Vertical context implementation
- Database schema updates
- API endpoint development
- Component library updates
