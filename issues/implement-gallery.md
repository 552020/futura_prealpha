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

## Implementation Plan

### Phase 1: Gallery Foundation

1. **Create gallery route structure**

   - `src/app/[lang]/gallery/page.tsx`
   - `src/app/[lang]/gallery/[id]/page.tsx`
   - Basic layout and navigation

2. **Gallery-specific components**

   - `GalleryGrid.tsx` - Artistic grid layout
   - `GalleryItem.tsx` - Curated memory display
   - `GalleryActions.tsx` - Curation tools
   - `GalleryLayout.tsx` - Gallery-specific layout

3. **Authentication & data fetching**
   - Use same pattern as vault
   - Fetch current user's memories
   - Gallery-specific filtering/curation

### Phase 2: Gallery Features

1. **Curation tools**

   - Arrange memories in gallery
   - Add captions/descriptions
   - Theme selection
   - Gallery title/description

2. **Artistic presentation**

   - Different layout options
   - Visual themes
   - Storytelling features
   - Portfolio-style display

3. **Sharing capabilities**
   - Gallery sharing links
   - Public/private settings
   - Gallery-specific sharing UI

### Phase 3: Vertical Integration

1. **Update vertical context**

   - Add "forever-gallery" vertical type
   - Configure gallery as destination for forever-gallery users

2. **Update onboarding flow**

   - Forever-gallery users → gallery (immediate)
   - Family users → vault (unchanged)

3. **Update upload success handling**
   - Route based on vertical type
   - Gallery users skip onboarding

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
