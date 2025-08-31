# Hydration Mismatch with useSearchParams

## Problem
The application is experiencing hydration mismatches due to the use of `useSearchParams` in client components. This causes server-side rendered HTML to not match the client-side rendered HTML, leading to React warnings and potential UI inconsistencies.

## Error Details
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

The error specifically shows Radix UI components generating different IDs on server vs client:
- Server: `id="radix-_R_umj9etb_"`
- Client: `id="radix-_R_7ll9etb_"`

## Root Cause
The issue is caused by:

1. **useSearchParams in Client Components**: Components using `useSearchParams` are rendering different content on server vs client
2. **URL Parameter Checking**: The logic that checks for `storeForever=1` parameter is causing different render paths
3. **Suspense Boundary Issues**: The current Suspense wrapper approach is not fully resolving the hydration mismatch

## Affected Files
- `src/nextjs/src/app/[lang]/gallery/[id]/page.tsx`
- `src/nextjs/src/app/[lang]/gallery/[id]/preview/page.tsx`
- `src/nextjs/src/app/[lang]/sign-ii-only/page.tsx`

## Current Implementation Issues

### Gallery Pages
```typescript
// Auto-open modal if returning from II linking flow
useEffect(() => {
  if (typeof window === "undefined") return;
  const shouldOpen = searchParams?.get("storeForever") === "1";
  if (shouldOpen) {
    setShowForeverStorageModal(true);
    // Clean the query param to avoid reopening on refresh
    const url = new URL(window.location.href);
    url.searchParams.delete("storeForever");
    window.history.replaceState({}, "", url.toString());
  }
}, [searchParams]);
```

### Problems with Current Approach
1. **Server/Client Mismatch**: The `typeof window === "undefined"` check creates different render paths
2. **URL Manipulation**: Direct URL manipulation in useEffect can cause hydration issues
3. **Suspense Not Enough**: Simply wrapping in Suspense doesn't solve the underlying issue

## Proposed Solutions

### Option 1: Use Router Events (Recommended)
Instead of `useSearchParams`, use Next.js router events to detect URL changes:

```typescript
useEffect(() => {
  const handleRouteChange = (url: string) => {
    const urlObj = new URL(url, window.location.origin);
    if (urlObj.searchParams.get("storeForever") === "1") {
      setShowForeverStorageModal(true);
      // Clean URL without causing re-render
      urlObj.searchParams.delete("storeForever");
      window.history.replaceState({}, "", urlObj.toString());
    }
  };

  // Check initial URL
  handleRouteChange(window.location.href);

  // Listen for route changes
  router.events.on('routeChangeComplete', handleRouteChange);
  return () => router.events.off('routeChangeComplete', handleRouteChange);
}, [router]);
```

### Option 2: Use URL State Management
Create a custom hook that manages URL state without causing hydration issues:

```typescript
function useURLState() {
  const [urlState, setUrlState] = useState<URLSearchParams | null>(null);
  
  useEffect(() => {
    setUrlState(new URLSearchParams(window.location.search));
  }, []);
  
  return urlState;
}
```

### Option 3: Server-Side Parameter Handling
Move the parameter checking to server-side and pass it as props:

```typescript
// In layout or page component
export default function Page({ searchParams }: { searchParams: { storeForever?: string } }) {
  const shouldOpenModal = searchParams.storeForever === "1";
  // Pass this as prop to child components
}
```

## Implementation Plan

1. **Phase 1**: Replace `useSearchParams` with router events in gallery pages
2. **Phase 2**: Update the II-only sign-in page to use the same pattern
3. **Phase 3**: Test and verify hydration issues are resolved
4. **Phase 4**: Remove Suspense wrappers if no longer needed

## Testing
- [ ] Test gallery page navigation with `storeForever=1` parameter
- [ ] Verify modal opens correctly after II authentication
- [ ] Check that hydration warnings are eliminated
- [ ] Ensure URL cleaning works without causing re-renders

## Priority
**High** - This affects user experience and causes console warnings that could mask other issues.
