# Fix Header Margins and Alignment

## Problem

The header elements are not properly aligned with the sidebar and screen edges:

- **Logo (F)** is positioned too far from the left edge of the screen
- **Right-side buttons** (user profile, language, theme, settings) are positioned too far from the right edge of the screen
- **Header spacing** is disconnected from the sidebar's spacing/alignment

## Current Issues

1. **Logo positioning**: The "F" logo has excessive left margin/padding, making it appear disconnected from the left border
2. **Right-side alignment**: The user controls (profile, EN, sun icon, gear icon) have excessive right margin/padding
3. **Inconsistent spacing**: Header elements don't align with the sidebar's content boundaries

## Expected Behavior

- **Logo**: Should be "attached" to the left border with minimal margin
- **Right controls**: Should be "attached" to the right border with minimal margin
- **Alignment**: Header spacing should be consistent with sidebar content alignment

## Technical Details

- Header uses `container mx-auto px-6` which creates excessive margins
- Need to adjust padding/margins to align with sidebar content
- Should maintain responsive behavior while fixing alignment

## Files to Modify

- `src/components/header.tsx` - Main header component
- May need to adjust container classes and padding values

## Acceptance Criteria

- [ ] Logo positioned close to left screen edge
- [ ] Right-side controls positioned close to right screen edge
- [ ] Header alignment consistent with sidebar content
- [ ] Maintains responsive design
- [ ] No visual disconnect between header and sidebar spacing
