# Navigation and Segment Structure Refactoring

## Overview

This document explains how to fix navigation components (sidebar, bottom nav, footer) that disappear when users navigate to the shared memories page. The problem occurs because the app incorrectly identifies deep routes like `/memories/shared` as marketing pages instead of app pages.

## Context

The application has two distinct types of routes:

1. Marketing pages: Using segments (`[segment]`) to show different landing pages for different target audiences (e.g., wedding, family, crypto)
2. App functionality: Core features like vault and shared memories that should be accessible regardless of segment

## Current Issue

### Problem Description

The shared memories page (`/[lang]/memories/shared`) is missing all navigation components:

- No sidebar
- No bottom navigation
- No footer

While these components are correctly visible in the vault page (`/[lang]/vault`).

### Affected Components and Files

1. **Layout Components**:

   - `src/app/[lang]/layout.tsx` - Root layout that includes navigation components
   - `src/app/[lang]/[segment]/layout.tsx` - Segment layout
   - `src/app/[lang]/memories/layout.tsx` (might be missing) - Should handle memories section layout

2. **Navigation Components**:

   - `src/components/sidebar.tsx`
   - `src/components/bottom-nav.tsx`
   - `src/components/footer.tsx`

3. **Context and Configuration**:
   - `src/contexts/interface-context.tsx` - Handles mode state
   - `src/utils/navigation.ts` - Navigation configuration

### Component Rendering Logic

#### Sidebar Component (`src/components/sidebar.tsx`):

```typescript
export default function Sidebar({ dict }: SidebarProps) {
  const pathname = usePathname();
  const { mode } = useInterface();

  // Extract lang from pathname
  const [, lang] = pathname.split("/");

  // Don't render sidebar in marketing mode
  if (mode === "marketing") {
    return null;
  }

  return <aside className="...">{/* Navigation content */}</aside>;
}
```

#### Interface Context (`src/contexts/interface-context.tsx`):

```typescript
export const InterfaceProvider = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [mode, setMode] = useState<"marketing" | "app">("marketing");

  useEffect(() => {
    // This logic needs to be updated to correctly identify app routes
    const isMarketingPage = pathname.includes("/[segment]/");
    setMode(isMarketingPage ? "marketing" : "app");
  }, [pathname]);

  return <InterfaceContext.Provider value={{ mode, setMode }}>{children}</InterfaceContext.Provider>;
};
```

### Root of the Problem

The issue stems from three main factors:

1. **Layout Hierarchy**:

   - The shared memories page might be using the wrong layout
   - Layout components might not be properly nested

2. **Mode Detection**:

   - The interface context's mode detection is likely too simplistic
   - Deep routes like `/memories/shared` are being incorrectly classified as marketing pages

3. **Missing Layout**:
   - There might be no specific layout for the memories section
   - The app layout might not be properly applied to the memories routes

### Mode Transitions and Persistence

The mode state in the interface context can change in several ways:

1. **Automatic Mode Changes**:

```typescript
// In interface-context.tsx
useEffect(() => {
  // This runs on every pathname change
  const isMarketingPage = pathname.includes("/[segment]/");
  setMode(isMarketingPage ? "marketing" : "app");
}, [pathname]);
```

This means:

- Every time the pathname changes, the mode is recalculated
- Navigation between pages triggers this effect
- The mode is not persisted between route changes
- Clicking on "Shared" or any navigation item will trigger this pathname change

2. **Mode Reset Points**:

- The mode starts as "marketing" by default: `useState<"marketing" | "app">("marketing")`
- Each navigation action triggers a mode recalculation
- There's no explicit mode persistence between route changes
- The mode might flicker between states during navigation

3. **Problematic Behavior**:

- When navigating to `/memories/shared`, the pathname change triggers the effect
- The current logic might incorrectly identify deep routes as marketing pages
- There's no check for app-specific routes before setting the mode
- The mode might reset to "marketing" unintentionally during navigation

This explains why:

- The navigation disappears when accessing shared memories
- The mode might not stay consistent during app navigation
- Some app routes might incorrectly show as marketing pages

## Proposed Solutions

### 1. Fix Layout Hierarchy

Create a proper layout for memories:

```typescript
// src/app/[lang]/memories/layout.tsx
export default function MemoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="memories-layout">
      <Sidebar />
      <main>{children}</main>
      <BottomNav />
      <Footer />
    </div>
  );
}
```

### 2. Update Mode Detection

Modify the interface context to properly identify app routes:

```typescript
const isAppRoute = (pathname: string): boolean => {
  const appRoutes = ["/vault", "/memories", "/profile", "/contacts"];
  return appRoutes.some((route) => pathname.includes(route));
};

// In interface context
const mode = isAppRoute(pathname) ? "app" : "marketing";
```

### 3. Explicit Route Configuration

Create a configuration file that explicitly defines which routes are marketing vs. app:

```typescript
export const routeConfig = {
  marketing: ["/[lang]/[segment]"],
  app: ["/[lang]/vault", "/[lang]/memories/shared", "/[lang]/profile", "/[lang]/contacts"],
};
```

### 4. Route-Based Mode Override

Add a mode override capability in the layout components:

```typescript
export default function MemoriesLayout({ children }) {
  return <InterfaceProvider defaultMode="app">{children}</InterfaceProvider>;
}
```

### 5. Layout Configuration

Create a layout configuration file:

```typescript
// src/config/layouts.ts
export const layoutConfig = {
  app: {
    routes: ["/vault", "/memories", "/profile", "/contacts"],
    components: ["Sidebar", "BottomNav", "Footer"],
  },
  marketing: {
    routes: ["/[segment]"],
    components: ["MarketingHeader", "MarketingFooter"],
  },
};
```

## Recommended Solution

The second approach (Explicit Route Configuration) is recommended because:

1. It provides clear separation between marketing and app routes
2. It's easier to maintain and extend
3. It reduces the risk of incorrect mode detection
4. It allows for future expansion of both marketing segments and app features

## Implementation Steps

1. Verify layout hierarchy

   - Check if `memories` layout exists
   - Ensure proper layout nesting

2. Fix mode detection

   - Update interface context logic
   - Add route configuration

3. Add missing layouts

   - Create memories layout if missing
   - Ensure components are properly exported

4. Test navigation visibility
   - Test all app routes
   - Verify component visibility

## Migration Plan

1. Create new route configuration
2. Implement changes in a development environment
3. Test all existing routes
4. Deploy changes gradually
5. Monitor for any navigation visibility issues

## Future Considerations

1. Consider adding route type metadata
2. Implement route-based layout selection
3. Add analytics to track navigation usage
4. Create automated tests for route configuration

### Navigation Flow Analysis

#### Route Comparison

1. **Vault Route**: `/[lang]/vault`

   ```
   src/app/
   └── [lang]/
       └── vault/
           ├── page.tsx
           └── [id]/
               └── page.tsx
   ```

2. **Shared Route**: `/[lang]/memories/shared`
   ```
   src/app/
   └── [lang]/
       └── memories/
           └── shared/
               └── page.tsx
   ```

#### Navigation Code Paths

Let's analyze what happens when navigating between these routes:

1. **Vault → Shared Navigation**:

```typescript
// In vault/page.tsx
router.push(`/${lang}/memories/shared`);

// What happens:
1. pathname changes to "/{lang}/memories/shared"
2. useEffect in interface-context.tsx triggers
3. mode is recalculated: pathname.includes("/[segment]/")
4. layouts are reapplied
```

2. **Shared → Vault Navigation**:

```typescript
// In memories/shared/page.tsx
router.push(`/${lang}/vault`);

// What happens:
1. pathname changes to "/{lang}/vault"
2. useEffect in interface-context.tsx triggers
3. mode is recalculated: pathname.includes("/[segment]/")
4. layouts are reapplied
```

#### Component Rendering Differences

1. **When on Vault (`/en/vault`)**:

```typescript
// interface-context.tsx effect
useEffect(() => {
  const isMarketingPage = pathname.includes("/[segment]/"); // false
  setMode("app"); // Correctly set
}, [pathname]);

// sidebar.tsx
if (mode === "marketing") {
  // false, sidebar renders
  return null;
}
```

2. **When on Shared (`/en/memories/shared`)**:

```typescript
// interface-context.tsx effect
useEffect(() => {
  const isMarketingPage = pathname.includes("/[segment]/"); // might be true due to "/memories/"
  setMode("marketing"); // Incorrectly set
}, [pathname]);

// sidebar.tsx
if (mode === "marketing") {
  // true, sidebar doesn't render
  return null;
}
```

#### Layout Application Order

1. **Vault Page Layout Chain**:

```typescript
// 1. Root Layout (app/layout.tsx)
// 2. Lang Layout (app/[lang]/layout.tsx)
// 3. Vault Layout (app/[lang]/vault/layout.tsx)
// 4. Page (app/[lang]/vault/page.tsx)
```

2. **Shared Page Layout Chain**:

```typescript
// 1. Root Layout (app/layout.tsx)
// 2. Lang Layout (app/[lang]/layout.tsx)
// 3. Memories Layout (app/[lang]/memories/layout.tsx) - Might be missing
// 4. Page (app/[lang]/memories/shared/page.tsx)
```

#### Key Differences Found

1. **Path Structure**:

   - Vault: Single level deep (`/vault`)
   - Shared: Two levels deep (`/memories/shared`)

2. **Layout Chain**:

   - Vault: Direct under [lang]
   - Shared: Nested under memories folder

3. **Mode Detection**:

   - Vault: Correctly identified as app route
   - Shared: Might be misidentified due to deeper path structure

4. **Navigation State**:
   - Vault: Maintains app mode
   - Shared: Potentially resets to marketing mode

This comparison reveals that while the navigation code is similar, the path structure and layout hierarchy differences are causing the mode detection to behave differently for each route.

### Testing Plan

#### 🧪 Goal

The shared page at `/[lang]/memories/shared` is no longer rendering the sidebar, bottom navigation, or footer — even though it was working previously. We need to identify what changed and fix it.

#### ✅ Test Cases

1. **Navigation Component Rendering**

   - Route: `/[lang]/memories/shared`
   - Expected Components:
     ```typescript
     ✓ <Sidebar />
     ✓ <BottomNav />
     ✓ <Footer /> // if applicable
     ```

2. **Interface Provider State**

   ```typescript
   // Expected
   <InterfaceProvider>mode === "app"; // When on /memories/shared</InterfaceProvider>
   ```

3. **Layout Chain Verification**

   ```typescript
   // Required Files
   ✓ src/app/[lang]/layout.tsx
   ? src/app/[lang]/memories/layout.tsx // Check if exists
   ```

4. **Mode Detection Logic**

   ```typescript
   // In interface-context.tsx
   useEffect(() => {
     // Check value when pathname === "/[lang]/memories/shared"
     console.log("Mode:", mode);
     console.log("Is Marketing:", isMarketingPage);
   }, [pathname]);
   ```

5. **Navigation Component Logic**
   ```typescript
   // In Sidebar.tsx and BottomNav.tsx
   // Check for recent changes in path checking logic
   const isActive = pathname.includes(item.href);
   ```

#### 📂 Required Code Analysis

1. **Layout Implementation**

   - Check `src/app/[lang]/layout.tsx`
   - Verify existence of `src/app/[lang]/memories/layout.tsx`
   - Review layout component exports

2. **Sidebar Component**

   - Review mode-dependent rendering logic
   - Check path matching implementation

3. **Interface Context**

   - Analyze mode calculation logic
   - Review recent changes to context provider

4. **Route Structure**
   - Confirm `/memories/shared/page.tsx` location
   - Verify layout nesting

#### 🔍 Expected Results

1. **Working State**

   ```typescript
   // When visiting /en/memories/shared
   ✓ Sidebar visible
   ✓ BottomNav visible
   ✓ Footer visible (if applicable)

   // Console output
   ✓ "Sidebar rendered"
   ✓ "Mode: app"
   ```

2. **Error State Indicators**
   - Missing layout files
   - Incorrect mode value
   - Recent changes affecting layout

#### 🔄 Recent Changes Analysis

1. Check git history for changes in the last 15 minutes:

   ```bash
   git log --since="15 minutes ago" --pretty=format:"%h - %s" --
   src/app/[lang]/**
   src/components/**
   src/contexts/**
   ```

2. Review any modifications to:
   - Layout structure
   - Route configuration
   - Navigation components

## Resolution

### The Problem

The root cause was in the `interface-context.tsx` configuration. The navigation components weren't showing up in the shared memories page because:

1. The `APP_ROUTES` array didn't include `/memories`:

```typescript
// Old configuration
const APP_ROUTES = ["/vault", "/feed", "/shared", "/profile", "/contacts"];
```

2. This meant that when users navigated to `/[lang]/memories/shared`:
   - The `isAppRoute` function would return `false`
   - The mode would be set to "marketing"
   - All navigation components would hide themselves

### The Solution

The fix was simple - we just needed to add `/memories` to the app routes:

```typescript
// Updated configuration
const APP_ROUTES = ["/vault", "/feed", "/memories", "/profile", "/contacts"];
```

This works because:

1. The `isAppRoute` function strips the language prefix
2. It then checks if the path starts with any app route
3. With `/memories` in the array, paths like `/memories/shared` are correctly identified as app routes

### Key Learnings

1. **Layout Simplicity**:

   - We initially thought we needed a separate memories layout
   - The existing app layout was sufficient since the mode detection was fixed

2. **Path Detection**:

   - Deep routes (like `/memories/shared`) need their parent path in `APP_ROUTES`
   - The `startsWith` check in `isAppRoute` handles nested routes correctly

3. **Mode Management**:
   - The mode state is recalculated on every pathname change
   - Having the correct app routes defined is crucial for proper mode detection
   - No need for complex layout hierarchies when the mode detection works correctly

### Verification

You can verify the fix by:

1. Navigating to `/[lang]/memories/shared`
2. Checking the console for:

```typescript
InterfaceProvider Debug: {
  pathname: "/en/memories/shared",
  isAppRoute: true,    // Now true because /memories is in APP_ROUTES
  newMode: "app"       // Correctly set to "app"
}
```

3. Confirming that:
   - Sidebar is visible
   - Bottom navigation is visible
   - Navigation works between vault and shared memories

This solution maintains the clean separation between marketing pages (using segments) and app functionality, while ensuring consistent navigation across all app routes.

## Route Structure Inconsistency

During the investigation, we identified an inconsistency in the route structure:

### Current Structure

```
src/app/[lang]/
├── vault/
│   ├── page.tsx         # Vault list
│   └── [id]/
│       └── page.tsx     # Individual vault memory
└── memories/
    └── [id]/
        └── shared/
            └── page.tsx # Individual shared memory
```

### Issues with Current Structure

1. **Inconsistent Patterns**:

   - Vault uses: `/vault/[id]`
   - Shared uses: `/memories/[id]/shared`
   - This makes the routing logic less predictable

2. **Logical Grouping**:

   - The current structure suggests shared is a property of a specific memory
   - But actually, "shared" is a collection/view type, like "vault"

3. **URL Semantics**:
   - Current: `/en/memories/123/shared` suggests viewing the shared status of memory 123
   - More logical: `/en/memories/shared/123` suggests viewing memory 123 from shared collection

### Recommended Structure

```
src/app/[lang]/
├── vault/
│   ├── page.tsx         # Vault list
│   └── [id]/
│       └── page.tsx     # Individual vault memory
└── memories/
    └── shared/
        ├── page.tsx     # Shared memories list
        └── [id]/
            └── page.tsx # Individual shared memory
```

### Benefits of Restructuring

1. **Consistency**:

   - Both vault and shared memories follow the same pattern
   - Collection first, then item ID

2. **Better Semantics**:

   - `/memories/shared` represents the shared memories collection
   - `/memories/shared/[id]` represents a specific shared memory

3. **Easier Maintenance**:
   - Consistent patterns are easier to maintain
   - Route handling logic can be more generic

### Migration Steps

1. Create new route structure:

   ```bash
   mkdir -p src/app/[lang]/memories/shared/[id]
   ```

2. Move and update files:

   - Move shared memory page to new location
   - Update any navigation code
   - Update any API calls

3. Update references:
   - Check all router.push() calls
   - Update any hardcoded URLs
   - Update tests if they exist

This restructuring should be planned as a separate task, as it requires careful migration to avoid breaking existing functionality.
