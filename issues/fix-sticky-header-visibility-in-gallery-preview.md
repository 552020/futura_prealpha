# Fix Sticky Header Visibility in Gallery Preview

## Problem

The sticky header in the gallery preview page is not visible initially because it's positioned after the hero section. When the hero is full-screen height (`h-screen`), the sticky header appears below the viewport.

## Current Layout Structure

```tsx
// Hero section (full-screen height)
<div className="relative w-full h-screen bg-black">
  {/* Back button */}
  {/* Cover image */}
</div>

// Sticky header (below hero, not visible initially)
<StickyHeader />

// Photo grid (below sticky header)
<GalleryGrid />
```

## Expected Behavior

1. **Initially**: Sticky header should be visible at the bottom of the hero section
2. **When scrolling**: Sticky header should stick to the top of the viewport
3. **Throughout scroll**: Header should remain accessible

## Possible Solutions

1. **Overlay approach**: Position sticky header as overlay on hero, then transition to sticky
2. **CSS-only solution**: Use `position: sticky` with proper container structure
3. **JavaScript approach**: Dynamically change positioning based on scroll position
4. **Layout restructuring**: Reorganize the component hierarchy

## Technical Details

- Hero section: `h-screen` (full viewport height)
- Sticky header: `sticky top-0`
- Issue: Sticky header is not in initial viewport

## Acceptance Criteria

- [ ] Sticky header visible when page loads
- [ ] Header sticks to top when scrolling past hero
- [ ] No layout jumps or visual glitches
- [ ] Maintains all existing functionality (Download, Share buttons)

## Senior Developer Request

Please provide a solution that ensures the sticky header is visible both initially and when scrolling, without breaking the current hero/grid layout.
