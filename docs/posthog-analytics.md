# PostHog Analytics Integration

## Overview

PostHog is used for analytics and user behavior tracking in the Futura application. It provides insights into user interactions, page views, and custom events while maintaining a privacy-focused approach.

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_INGEST=https://eu.i.posthog.com
```

### PostHog Setup

- **Instance**: PostHog Cloud EU (`https://eu.i.posthog.com`)
- **Privacy Mode**: `person_profiles: "identified_only"`
- **Auto-capture**: Disabled for pageviews (manual capture)
- **Page leave tracking**: Enabled

## Implementation

### 1. Provider Setup

PostHog is integrated at the root level in `src/app/[lang]/layout.tsx`:

```tsx
<PostHogProvider>
  <ThemeProvider>{/* Rest of app */}</ThemeProvider>
</PostHogProvider>
```

### 2. Client-Side Implementation

**File**: `src/components/posthog-provider.tsx`

- Initializes PostHog client
- Provides automatic pageview tracking
- Handles route changes
- Debug logging in development

### 3. Server-Side Implementation

**File**: `posthog.ts`

- Node.js PostHog client for server-side events
- Configured for immediate flushing
- Used for backend analytics

## What is Tracked

### Automatic Tracking

1. **Pageviews**

   - Captured on route changes
   - Includes full URL with search parameters
   - Manual capture via `posthog.capture("$pageview")`

2. **Page Leaves**
   - Automatically tracked when users leave pages
   - Helps measure engagement time

### Custom Events

The application can capture custom events for:

- Button clicks
- User actions
- Feature usage
- Error tracking
- Form submissions

## Usage Examples

### Basic Event Tracking

```tsx
import { usePostHog } from "posthog-js/react";

function MyComponent() {
  const posthog = usePostHog();

  const handleClick = () => {
    posthog.capture("button_click", {
      button_type: "primary",
      location: "header",
      timestamp: new Date().toISOString(),
    });
  };

  return <button onClick={handleClick}>Track Me</button>;
}
```

### Server-Side Event Tracking

```tsx
import PostHogClient from "@/posthog";

const posthog = PostHogClient();

posthog.capture({
  distinctId: userId,
  event: "user_action",
  properties: {
    action_type: "signup",
    source: "email",
  },
});
```

## Development & Testing

### Test Page

A dedicated test page is available at `/tests/posthog` for:

- Validating PostHog configuration
- Testing event capture
- Debugging analytics issues
- Viewing PostHog status

### Debug Features

- Console logging of PostHog initialization
- Event capture confirmation
- Configuration dump for troubleshooting

## Privacy Considerations

### Privacy-First Configuration

1. **Identified Users Only**

   - `person_profiles: "identified_only"`
   - Only tracks users who are logged in or explicitly identified

2. **Manual Pageview Capture**

   - `capture_pageview: false`
   - Full control over what pages are tracked

3. **No Automatic Event Capture**
   - All events must be explicitly captured
   - No automatic form or click tracking

### Data Collection

- **What is collected**: Page URLs, custom events, user interactions
- **What is NOT collected**: Personal data, passwords, sensitive form data
- **Retention**: Based on PostHog's data retention policies

## Architecture

### File Structure

```
src/
├── components/
│   └── posthog-provider.tsx     # Client-side provider
├── app/
│   ├── [lang]/layout.tsx        # Root integration
│   └── tests/posthog/page.tsx   # Test page
└── posthog.ts                   # Server-side client
```

### Integration Flow

1. **App Initialization**: PostHogProvider wraps the entire app
2. **Route Changes**: Automatic pageview capture on navigation
3. **Custom Events**: Manual capture throughout the application
4. **Server Events**: Backend analytics via Node.js client

## Best Practices

### Event Naming

Use consistent naming conventions:

- `user_action` for user-initiated events
- `page_view` for navigation events
- `error_occurred` for error tracking
- `feature_used` for feature adoption

### Event Properties

Include relevant context:

```tsx
posthog.capture("feature_used", {
  feature_name: "memory_upload",
  user_type: "premium",
  file_type: "image",
  timestamp: new Date().toISOString(),
});
```

### Performance

- Events are batched and sent asynchronously
- Server-side events flush immediately
- No impact on user experience

## Troubleshooting

### Common Issues

1. **Events not appearing**

   - Check environment variables
   - Verify PostHog key is correct
   - Check browser console for errors

2. **Pageviews not tracked**

   - Ensure PostHogProvider is properly wrapped
   - Check route change detection

3. **Server events failing**
   - Verify server-side PostHog client configuration
   - Check API key permissions

### Debug Steps

1. Visit `/tests/posthog` to check configuration
2. Open browser console to see debug logs
3. Verify events in PostHog dashboard
4. Check network tab for PostHog requests

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog React Integration](https://posthog.com/docs/libraries/react)
- [PostHog Node.js Client](https://posthog.com/docs/libraries/node)
