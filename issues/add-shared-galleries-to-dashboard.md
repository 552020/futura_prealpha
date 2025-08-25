# Add Shared Galleries to Dashboard

## Problem

Currently, `GET /api/gallery` only returns galleries owned by the user. Users have no easy way to see galleries that have been shared with them.

## Solution

### Option 1: Modify existing endpoint (Recommended)

Update `GET /api/gallery` to return both:

- Owned galleries
- Shared galleries (where user has access through `galleryShares`)

### Option 2: Separate endpoint

Create `GET /api/gallery/shared` for shared galleries only.

### Option 3: Frontend fetches both

Keep endpoints separate, frontend calls both and combines results.

## Implementation

### Backend Changes

- Modify `GET /api/gallery` to include shared galleries
- Add query to check `galleryShares` table for user access
- Return galleries with ownership indicator

### Frontend Changes

- Update dashboard to show "My Galleries" and "Shared with Me" sections
- Or show combined list with ownership badges
- Add quick access to all accessible galleries

## Benefits

- Users don't need to remember/share links
- Better UX - all galleries in one place
- Consistent with how other apps handle shared content

## Questions

- Should we show shared galleries separately or mixed with owned ones?
- Do we need different permissions for shared vs owned galleries?
- Should shared galleries have different UI treatment?

## Share Links vs Explicit Sharing

### Current System (Explicit Sharing)

- Owner must **explicitly share** gallery with specific users/groups
- Owner says: "Share this gallery with John, Sarah, and the Family group"
- Only those specific people can access it
- Requires owner to know who to share with
- **Use case:** Family members, close friends

### Share Links (Link-based Access) - Missing Feature

- Owner creates a **shareable link** (like Google Drive)
- Anyone with the link can access the gallery
- No need to specify who gets access
- More like "public but with a secret URL"
- **Use case:** Wedding guests, extended family, anyone with the link

### Both Can Coexist

- You can explicitly share with family AND create a link for wedding guests
- Different access methods for different use cases

## Missing Endpoints for Share Links

**Current sharing endpoints:**

- `POST /api/gallery/[id]/share` - Share gallery with users/groups
- `GET /api/gallery/[id]/share` - List all shares for a gallery

**Missing share link endpoints:**

- `POST /api/gallery/[id]/share-link` - Create shareable link
- `GET /api/gallery/[id]/share-link/[code]` - Access via link
- Link management - Generate, revoke, list share links

## Related

- Gallery sharing system implementation
- Dashboard gallery management
- Share link functionality (to be implemented)
