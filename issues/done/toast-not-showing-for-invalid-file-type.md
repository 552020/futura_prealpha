# Toast Not Showing for Invalid File Type Errors

## Problem

When users upload files with invalid types, the console shows the error correctly:

- `Server returned error: {error: 'Invalid file type'}`
- `Upload error: Error: Invalid file type`

But **no toast notification appears** to inform the user about the invalid file type.

## Expected Behavior

Users should see a toast notification with:

- **Title**: "Invalid file type"
- **Description**: "Please upload an image (JPEG, PNG, GIF, WebP), video (MP4, MOV, AVI, WebM), or document (PDF, DOC, TXT, MD)."

## Current State

### Error Handling Code

The error handling is implemented in `src/hooks/user-file-upload.ts`:

```typescript
if (error instanceof Error && error.message === "Invalid file type") {
  title = "Invalid file type";
  description =
    "Please upload an image (JPEG, PNG, GIF, WebP), video (MP4, MOV, AVI, WebM), or document (PDF, DOC, TXT, MD).";
}

toast({
  variant: "destructive",
  title,
  description,
});
```

### Debug Logs Added

Added console logs to track error flow:

- `🔍 Caught error in processSingleFile:`
- `🔍 Error message:`
- `🔍 Showing toast with:`

## Investigation Needed

1. **Toast System**: Verify if toast system works at all

   - Added test toast on button click
   - Check if `useToast` hook is properly imported
   - Verify toast provider is set up in layout

2. **Error Flow**: Check if error is reaching the catch block

   - Console logs should show if error is caught
   - Verify error message matches exactly "Invalid file type"

3. **Service Error**: Check if service is throwing correct error
   - `src/services/upload.ts` throws `new Error(data.error)`
   - Server returns `{error: "Invalid file type"}`

## Files to Check

- `src/hooks/user-file-upload.ts` - Error handling logic
- `src/services/upload.ts` - Error throwing
- `src/components/memory/ItemUploadButton.tsx` - Toast import and usage
- `src/app/[lang]/layout.tsx` - Toast provider setup

## Priority

**High** - Users need visual feedback when uploads fail due to invalid file types.

## Steps to Reproduce

1. Try to upload a file with unsupported type (e.g., .exe, .zip)
2. Check console for error logs
3. Verify no toast appears
4. Check if test toast works on button click
