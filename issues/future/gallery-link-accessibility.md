# Gallery Link-Based Accessibility

## Overview

Implement link-based access for galleries, allowing users to share galleries via secure links without requiring login.

## Current State

- ✅ **Private galleries**: Owner only access
- ✅ **Public galleries**: Anyone can access (no login required)
- ❌ **Link-based galleries**: Not implemented

## Requirements

### User Stories

- **As a user**, I want to create a gallery that can be accessed via a secure link
- **As a user**, I want to share a gallery link with specific people
- **As a user**, I want the link to work without requiring login
- **As a user**, I want to revoke access by invalidating the link

### Functional Requirements

- **Link generation**: Create unique, secure access tokens for galleries
- **No login required**: Access via link should not require authentication
- **Secure access**: Links should be hard to guess/brute force
- **Access control**: Ability to revoke/invalidate links
- **Integration**: Work with existing gallery access control system

## Technical Implementation

### Database Schema Changes

```sql
-- Add to galleries table
ALTER TABLE gallery ADD COLUMN is_link_accessible BOOLEAN DEFAULT FALSE;
ALTER TABLE gallery ADD COLUMN access_token TEXT UNIQUE;
ALTER TABLE gallery ADD COLUMN link_expires_at TIMESTAMP;
```

### API Endpoints

```
POST /api/galleries/[id]/generate-link     # Generate access link
DELETE /api/galleries/[id]/revoke-link     # Revoke access link
GET /api/galleries/link/[token]            # Access gallery via link
```

### Access Control Logic

```typescript
// When accessing gallery
if (gallery.isLinkAccessible && gallery.accessToken === providedToken) {
  return allowAccess();
}
```

## Design Considerations

### Security

- **Token generation**: Use cryptographically secure random tokens
- **Token length**: Minimum 32 characters
- **Expiration**: Optional expiration dates for links
- **Rate limiting**: Prevent brute force attempts

### User Experience

- **Easy sharing**: Simple copy-paste link sharing
- **Visual feedback**: Clear indication of link status
- **Access tracking**: Optional analytics on link usage

### Integration

- **Gallery override**: Link access should work with existing gallery override system
- **Memory access**: Individual memory access should still be respected
- **Sharing compatibility**: Work alongside existing user/group sharing

## Implementation Priority

- **Phase 1**: Basic link generation and access
- **Phase 2**: Link expiration and revocation
- **Phase 3**: Access analytics and advanced features

## Related Issues

- Gallery access control system
- Memory sharing functionality
- User authentication system

## Notes

- Consider using existing `metadata` field for link info instead of separate columns
- Evaluate if link access should override individual memory access settings
- Plan for potential abuse and implement appropriate safeguards
