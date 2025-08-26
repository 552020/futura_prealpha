# Fix Container Width Mismatch Between Header and Main Content

## Problem

The header container is narrower than the main content container, causing misalignment:

- **Header container**: Uses `container mx-auto px-6` but appears narrower
- **Main content container**: Uses `container mx-auto px-6 py-8` and expands more
- **Result**: Header elements don't align with main content boundaries

## Current Issues

1. **Width mismatch**: Header container has different max-width constraints than main content
2. **Visual disconnect**: Header appears to "overflow" or extend beyond main content bounds
3. **Inconsistent alignment**: Logo and controls don't align with main content edges

## Root Cause

The `container` class from Tailwind CSS applies different max-width constraints at different breakpoints. The header and main content containers are not using the same width constraints.

## Expected Behavior

- **Same container width**: Header and main content should use identical container constraints
- **Proper alignment**: Header elements should align with main content boundaries
- **Consistent spacing**: Both containers should have the same horizontal boundaries

## Technical Details

- Header: `<div class="container mx-auto flex h-16 items-center justify-between px-6">`
- Main content: `<div class="container mx-auto px-6 py-8">`
- Both use `container mx-auto px-6` but have different effective widths

## Possible Solutions

1. **Remove container from header**: Use simple `px-6` without `container mx-auto`
2. **Match container constraints**: Ensure both use identical container classes
3. **Custom container width**: Define consistent max-width for both containers

## Files to Modify

- `src/components/header.tsx` - Header container classes
- May need to check Tailwind container configuration

## Acceptance Criteria

- [ ] Header container width matches main content container width
- [ ] Logo aligns with main content left edge
- [ ] Right-side controls align with main content right edge
- [ ] No visual overflow or misalignment between header and content
- [ ] Maintains responsive behavior across all screen sizes

## Debug Information

**Current Header Container:**

- Element: `div.container.mx-auto.flex.h-16.items-center.justify-between.px-6`
- Dimensions: `412 × 64` pixels (width x height)
- Padding: `0px 24px` (0px top/bottom, 24px left/right)
- Content: "F" logo (left), controls (right: globe, EN, sun, gear, hamburger)

**Visual Issue:**

- Header elements appear closer to window edges than main content
- "F" logo closer to left edge than "Wild & Free" text
- Right-side controls closer to right edge than main content boundary
- Container width mismatch causing alignment problems

**Device Context:**

- Phone dimensions: 412 x 915 pixels
- Header container width: 412px (full phone width)
- Header container height: 64px
- Header container expands to full phone width while main content is constrained

**Main Content Container:**

- Element: `div.container.mx-auto.px-6.py-4`
- Dimensions: 535.51 x 136 pixels
- Padding: 16px 24px (16px top/bottom, 24px left/right)
- **Width mismatch**: Main content (535.51px) is wider than header (412px)

**Root Cause Analysis:**

- Main content container stops shrinking at ~515px width
- Tailwind's `container` class likely has implicit min-width constraints
- Container refuses to shrink below ~515px even on 412px phone width
- This creates the width mismatch: header (412px) vs main content (535.51px)

**For Senior Frontend Developer:**

- Check Tailwind container configuration for min-width constraints
- Investigate if `container` class has breakpoint-based min-width behavior
- Consider removing `container` class and using custom width constraints
- Test with `max-w-full` or explicit width classes instead of `container`

**Senior Developer Request - Additional Information:**

**Current Header Markup:**

```html
<header class="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
  <div class="container mx-auto flex h-16 items-center justify-between px-6">
    <!-- logo / nav / controls -->
  </div>
</header>
```

**Current Main Content Markup (Gallery View):**

```html
<div class="min-h-screen bg-background">
  <!-- Header -->
  <div class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
    <div class="container mx-auto px-6 py-4">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <!-- title, badge, buttons -->
      </div>
    </div>
  </div>

  <!-- Photo Grid -->
  <div class="container mx-auto px-6 py-8">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <!-- gallery items -->
    </div>
  </div>
</div>
```

**Key Observations:**

- Header container: 412px width (correct)
- Main content container: 535.51px width (problematic)
- Container stops shrinking at ~515px
- Both use `container mx-auto px-6` but have different effective widths

**Request:** Please identify which child element is causing the ~515px width lock in the main content area.

**Senior Developer Analysis & Solution:**

The header keeps shrinking but the image area sets a floor, so they fall out of alignment. That means one (or more) gallery children has a fixed/min width or an intrinsic "min-content" width that's ~≥ 515px.

**Fix Strategy:**

1. **Let the gallery shrink**

   - On every horizontal parent in the body chain (page → main → gallery wrapper), add `min-w-0`
   - If any parent is `flex`, also add `overflow-hidden` to avoid min-content clamping

2. **Make each card and image responsive**

   - Remove any raw pixel widths like `w-[540px]`, `min-w-[520px]`, `basis-[520px]`
   - Ensure cards can shrink and don't set a larger min-content width

3. **If using auto-fit/minmax, cap the minimum sensibly**

   - Common trap: `grid-cols-[repeat(auto-fill,minmax(520px,1fr))]` which hard-stops <520px
   - Use smaller min and let it wrap: `[grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]`

4. **Typical shadcn/UI gotcha**

   - Many examples ship `w-[350px]` / `w-[400px]` on cards/forms
   - Replace with `w-full sm:max-w-md` (and keep `min-w-0` on the parent)

5. **Long text/URLs/code forcing width?**

   - Add `break-words` to captions and `overflow-x-auto break-words` to code blocks

6. **Align header and body edges**
   - Keep the same container wrapper in both, no extra `px-*` that differs between them

**To-Do List:**

- [ ] Add `min-w-0` to all horizontal parent containers in gallery
- [ ] Search codebase for `w-[5`, `min-w-[5`, `basis-[5` patterns
- [ ] Remove any fixed pixel widths from gallery cards/images
- [ ] Check for `grid-cols-[repeat(auto-fill,minmax(520px,1fr))]` patterns
- [ ] Add `overflow-hidden` to flex parents in gallery
- [ ] Ensure images use `w-full max-w-full h-auto object-cover`
- [ ] Add `break-words` to text content that might force width
- [ ] Standardize container wrapper between header and main content
- [ ] Test with DevTools: toggle `min-w-0` on children to identify culprit
- [ ] Verify header and body edges align perfectly after fixes

**Additional Senior Developer Suggestions:**

**Classic "min-content clamp" issue:** One child in the photo area has a fixed/min width ≈520px, so the main container refuses to get narrower, while the header keeps shrinking.

**Concrete Fixes:**

1. **Allow the body chain to shrink**

   - Add `min-w-0` to wrappers down to the grid
   - Example: `<div class="container px-6 py-8 min-w-0">`

2. **Make each card truly responsive**

   - Remove raw pixel widths (`w-[540px]`, `min-w-[520px]`, `basis-[520px]`, `min-w-fit`, `whitespace-nowrap`)
   - Add `min-w-0 + overflow-hidden` on items
   - Ensure images can shrink: `<img class="block w-full max-w-full h-auto object-cover">`

3. **If using auto-fill/minmax in grid, lower the min**

   - Use: `[grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]`
   - Avoid: `minmax(520px,1fr)` which hard-stops at ~520px

4. **Guard against long strings/captions**

   - Add: `<p class="text-sm break-words">`

5. **Align header/body edges identically**
   - Use same container structure in both header and main

**Quick DevTools Debug:**

- Select main `.container`, add `overflow-x:hidden` temporarily
- Child that sticks out will show red overflow indicator
- Toggle `min-w-0` on suspected flex/grid children
- Search for: `w-[5`, `min-w-[5`, `basis-[5`, `min-w-fit`, `whitespace-nowrap`

**Request:** Please paste the immediate children of the grid (one `<li>`/card HTML) to identify the precise class causing the ~515px lock.

**Senior Developer Solution Applied:**

**Changes Made to Gallery View (`src/app/[lang]/gallery/[id]/page.tsx`):**

1. **Main Container**: Added `min-w-0` to photo grid container

   ```jsx
   <div className="container mx-auto px-6 py-8 min-w-0">
   ```

2. **Grid Container**: Added `min-w-0` to grid wrapper

   ```jsx
   <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
   ```

3. **Gallery Items**: Added `min-w-0` to each gallery card

   ```jsx
   <div className="min-w-0 aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
   ```

4. **Image Containers**: Added `min-w-0` to both image and fallback containers

   ```jsx
   <div className="w-full h-full relative min-w-0">
   <div className="w-full h-full bg-muted flex items-center justify-center min-w-0">
   ```

5. **Images**: Added `block max-w-full` to images

   ```jsx
   <img className="block w-full h-full max-w-full object-cover">
   ```

6. **Text Elements**: Added `break-words` to text content

   ```jsx
   <span className="text-sm break-words">Photo {index + 1}</span>
   <span className="text-xs text-muted-foreground/70 mt-1 break-words">Failed to load</span>
   ```

7. **Header Flex Containers**: Added `min-w-0` to all flex containers in header
   ```jsx
   <div className="container mx-auto px-6 py-4 min-w-0">
   <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
   <div className="flex-1 min-w-0">
   <div className="flex items-center justify-between min-w-0">
   <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
   ```

**Status**: Applied all recommended fixes, but issue persists. Container still stops shrinking at ~515px.

**Gallery Card HTML (from our code):**

```html
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {gallery.items.map((item, index) => (
    <div
      key={item.id}
      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
      onClick={() => handleImageClick(index)}
    >
      {item.memory.url && !failedImages.has(item.memory.url) ? (
        <div className="w-full h-full relative">
          <img
            src={item.memory.url}
            alt={item.memory.title || `Photo ${index + 1}`}
            className="w-full h-full object-cover"
            onError={() => handleImageError(item.memory.url!)}
          />
        </div>
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <div className="flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-2" />
            <span className="text-sm">Photo {index + 1}</span>
            {failedImages.has(item.memory.url!) && (
              <span className="text-xs text-muted-foreground/70 mt-1">Failed to load</span>
            )}
          </div>
        </div>
      )}
    </div>
  ))}
</div>
```
