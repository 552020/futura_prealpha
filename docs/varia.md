# Implementation Notes & Historical Context

## OnboardModal Component History

The original `OnboardModal` component (located at `src/components/onboard-modal.tsx`) has been replaced with a new version at `src/components/onboarding/onboard-modal.tsx`. The old version is no longer in use and can be safely removed.

## Layout Implementation Notes

### Fluid Layout vs Container

In the items upload page, we're using a fluid layout approach instead of Tailwind's container:

```tsx
<div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8 flex flex-col gap-16">
```

While Tailwind's container would be easier to maintain with its fixed breakpoints, we opted for a fluid design to create a more immersive, modern experience. This better suits our visual-heavy, emotional content.

Alternative using container would be:

```tsx
<div className="container mx-auto px-4 py-8 flex flex-col gap-16">
```

## MemoryUpload Component Notes

### Button Implementation

We initially tried using shadcn's Button component, but it was overriding Lucide React's Plus icon size. Instead, we're using a custom div with button role to maintain full control over the icon size while keeping the interactive and accessible aspects of a button.

### File Handling Implementation

#### File Object Structure

When handling file uploads, we receive a File object with the following structure:

```typescript
const file = event.target.files?.[0];
```

1. `event.target.files` is a FileList object:

   - Similar to an array but not exactly an array
   - Contains selected files from input
   - We use [0] because multiple={false} on input

2. The `?.` (optional chaining):

   - Safely handles if files is null/undefined
   - Returns undefined instead of throwing error

3. The resulting 'file' is a File object containing:

   - `file.name`: Original filename
   - `file.size`: Size in bytes
   - `file.type`: MIME type (e.g., "image/jpeg")
   - `file.lastModified`: Timestamp
   - The actual file data/content in memory

4. This is not just a path/reference:
   - It's the complete file in memory
   - Ready for preview or upload
   - Can be used with URL.createObjectURL()

#### URL.createObjectURL Usage

```typescript
const url = URL.createObjectURL(file);
```

1. Creates a temporary URL pointing to the file in memory:

   - Format: "blob:http://localhost:3000/1234-5678-9abc"
   - URL is valid only in current browser session

2. Used for:

   - Creating image previews
   - Video playback
   - File downloads

3. Memory Management:
   - Each URL created takes up memory
   - Must be released with URL.revokeObjectURL()
   - We do this cleanup:
     - When a new file is selected
     - When component unmounts
