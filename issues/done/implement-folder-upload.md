# Implement Folder Upload in Onboarding

## Current Flow

### File Upload Process

1. User clicks `ItemUploadButton`
   - `src/components/memory/ItemUploadButton.tsx`
2. `handleUploadClick` (`src/hooks/user-file-upload.ts`) triggers hidden file input (`src/components/memory/ItemUploadButton.tsx`)
3. Browser opens file picker
   - `src/components/memory/ItemUploadButton.tsx`
4. User selects single file
5. `onChange` fires, calling `handleFileChange`
   - `src/hooks/user-file-upload.ts`
6. File uploads to `/api/memories/upload/onboarding`
   - `src/app/api/memories/upload/onboarding/route.ts`
7. File saved to Vercel Blob + database record created
   - `src/app/api/memories/upload/onboarding/route.ts`
8. File added to onboarding context
   - `src/hooks/user-file-upload.ts`
9. `onSuccess` callback triggers `OnboardModal`
   - `src/app/[lang]/onboarding/items-upload/items-upload-client.tsx`

### Current Limitations

- **Single file only**: `multiple={false}`
  - `src/components/memory/ItemUploadButton.tsx`
- **No folder support**: Only individual file selection
- **File types**: `accept="image/*,video/*,audio/*"`
  - `src/components/memory/ItemUploadButton.tsx`

### Current Upload Approach

- **Immediate API upload**: Files uploaded to server immediately after selection
- **No local storage**: Files not saved locally first
- **Network dependency**: Upload fails without internet connection
- **No offline support**: Cannot save files locally and sync later

### Upload Approach Limitations

- **Browser storage limits**: LocalStorage (~5-10MB), IndexedDB better but still limited
- **File object storage**: Cannot store File objects directly in localStorage
- **User experience**: No preview until API call completes
- **Security**: Server-side validation and virus scanning required
- **Progressive upload**: No background upload capability

## Requirements

### Folder Upload Implementation

- Support `webkitdirectory` and `directory` attributes
- Handle multiple files from folder structure
- Preserve folder hierarchy in upload
- Update onboarding flow for multiple files
- Maintain current single-file functionality

### Technical Changes Needed

- Update `ItemUploadButton` to support folder variant
  - `src/components/memory/ItemUploadButton.tsx`
  - Add second hidden input for folder upload (`webkitdirectory` attribute)
  - Keep existing hidden input for single file upload
  - Add variant prop to switch between file/folder modes
- Modify `useFileUpload` hook for multiple files
  - `src/hooks/user-file-upload.ts`
- Update server endpoint for batch uploads
  - `src/app/api/memories/upload/onboarding/route.ts`
- Extend onboarding context for multiple files
  - `src/contexts/onboarding-context.tsx`
- Update `OnboardModal` for folder sharing
  - `src/components/onboarding/onboard-modal.tsx`
