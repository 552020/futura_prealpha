# Folder Uploads Using Wrong Endpoint

## Issue
Folder uploads are currently using the individual file upload endpoint (`/api/memories/upload/onboarding/file`) instead of the dedicated folder upload endpoint (`/api/memories/upload/onboarding/folder`).

## Evidence from Logs
```
🚀 Starting onboarding file upload process...
📦 Parsing form data...
📄 File details: { name: 'wedding/plants.jpg', type: 'image/jpeg', size: '3.26MB' }
```

**Multiple instances of this pattern show:**
- Each file in the folder triggers the file upload endpoint
- Each file creates its own temporary user
- This leads to database connection issues and performance problems

## Root Cause
The frontend `useFileUpload` hook is still calling the file upload endpoint even when `mode === "folder"`. The folder upload endpoint was created but is not being used.

## Current Problematic Flow
1. User selects folder
2. Frontend processes each file individually
3. Each file calls `/api/memories/upload/onboarding/file`
4. Each file creates a new temporary user
5. Multiple concurrent database connections cause timeouts

## Expected Flow
1. User selects folder
2. Frontend sends all files to `/api/memories/upload/onboarding/folder`
3. Backend creates single temporary user for all files
4. Backend processes files in parallel with fault tolerance
5. Single database connection for user creation

## Impact
- **Performance**: Slower uploads due to individual file processing
- **Database Issues**: Multiple concurrent connections causing timeouts
- **User Experience**: Inconsistent upload results
- **Resource Waste**: Unnecessary API calls and database operations

## Solution
Update the frontend to use the correct endpoint:

### 1. **Update Upload Service**
Modify `src/services/upload.ts` to detect folder uploads and use the appropriate endpoint:

```typescript
export const uploadFile = async (
  file: File,
  isOnboarding: boolean,
  existingUserId?: string,
  isFolderUpload?: boolean // NEW parameter
): Promise<UploadResponse> => {
  const endpoint = isOnboarding 
    ? (isFolderUpload ? "/api/memories/upload/onboarding/folder" : "/api/memories/upload/onboarding/file")
    : "/api/memories/upload";
  // ... rest of implementation
};
```

### 2. **Update useFileUpload Hook**
Modify `src/hooks/user-file-upload.ts` to pass the correct parameters:

```typescript
const data = await uploadFile(file, isOnboarding, existingUserId, mode === "folder");
```

### 3. **Update Folder Upload Logic**
For folder uploads, send all files in a single request instead of individual requests.

## Priority
🔴 **HIGH** - This is causing the database timeout issues and poor performance

## Status
🟡 **IN PROGRESS** - Need to update frontend to use correct endpoint
