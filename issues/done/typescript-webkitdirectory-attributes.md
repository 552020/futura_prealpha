# TypeScript Issue: webkitdirectory/directory Attributes

## Problem

TypeScript doesn't recognize `webkitdirectory` and `directory` as valid HTML input attributes, causing compilation errors:

```tsx
<input type="file" className="hidden" webkitdirectory directory />
// Error: Property 'webkitdirectory' does not exist on type 'DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>'
```

## Root Cause

- `webkitdirectory` is a non-standard WebKit-specific attribute
- `directory` is a proposed standard attribute not widely supported yet
- TypeScript's built-in HTML input types don't include these experimental attributes

## Current Workaround

Using type assertion to bypass TypeScript checking:

```tsx
<input type="file" className="hidden" webkitdirectory directory {...({} as any)} />
```

This works but is not ideal - it bypasses type safety entirely.

## Proposed Solutions

### 1. Imperative Approach (Recommended for Demo)

Set attributes programmatically before opening the picker:

```ts
fileInputRef.current?.setAttribute("webkitdirectory", "");
fileInputRef.current?.setAttribute("directory", "");
fileInputRef.current!.multiple = true;
fileInputRef.current?.click();
```

**Pros:**

- No TypeScript hacks
- Clean JSX
- Works with existing ref system

**Cons:**

- Requires ref management
- Slightly more verbose

### 2. Type Augmentation

Create `types/dom-extensions.d.ts`:

```ts
import "react";
declare module "react" {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}
```

**Pros:**

- Clean JSX syntax
- Type-safe
- Reusable across project

**Cons:**

- Adds global type modifications
- May conflict with future React updates

### 3. Chromium-Only Alternative

Skip attributes entirely and use modern API:

```ts
const dirHandle = await showDirectoryPicker();
```

**Pros:**

- Modern, standard API
- No TypeScript issues
- Better user experience

**Cons:**

- Chromium-only (no Firefox/Safari support)
- Requires async/await handling

## Recommendation

For the current demo implementation, use **Solution 1 (Imperative Approach)** as it:

- Requires minimal changes to existing code
- Works with current ref-based architecture
- Avoids TypeScript hacks
- Maintains browser compatibility

## Files to Update

- `src/components/memory/ItemUploadButton.tsx` - Remove JSX attributes, add imperative setting
- `src/hooks/user-file-upload.ts` - Add folder input ref and click handler
