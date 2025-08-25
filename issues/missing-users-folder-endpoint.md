# Missing /api/users/folder Endpoint

## Issue
The frontend is calling `/api/users/folder` endpoint which returns a 405 Method Not Allowed error:

```
POST /api/users/folder 405 in 2164ms
```

## Root Cause
The `useFileUpload` hook in `src/hooks/user-file-upload.ts` contains code that tries to create a folder user via this endpoint:

```typescript
// Create one temporary user for the entire folder
let folderUserId: string | undefined;
if (isOnboarding) {
  try {
    const response = await fetch("/api/users/folder", { method: "POST" });
    const userData = await response.json();
    folderUserId = userData.id;
    console.log("👤 Created folder user:", folderUserId);
  } catch (error) {
    console.error("❌ Failed to create folder user:", error);
  }
}
```

However, this endpoint doesn't exist in the codebase.

## Current State
- **File**: `src/app/api/users/folder/route.ts` - **DELETED** (was removed during refactoring)
- **Frontend**: Still trying to call this endpoint
- **Result**: 405 Method Not Allowed error

## Impact
- **Error Logs**: Unnecessary 405 errors in server logs
- **Performance**: Failed API calls wasting time
- **User Experience**: Potential delays in folder upload process
- **Code Clarity**: Confusing error messages

## Solution Options

### Option 1: Remove the Call (Recommended)
Since we now have a dedicated folder upload endpoint that handles user creation internally, we should remove this call entirely.

**Update `src/hooks/user-file-upload.ts`:**
```typescript
// Remove this entire block:
// const response = await fetch("/api/users/folder", { method: "POST" });
// const userData = await response.json();
// folderUserId = userData.id;
```

### Option 2: Create the Endpoint
If we need this functionality, create the missing endpoint:

```typescript
// src/app/api/users/folder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createTemporaryUserBase } from "../../utils";

export async function POST(request: NextRequest) {
  try {
    const { allUser } = await createTemporaryUserBase("inviter");
    return NextResponse.json({ id: allUser.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
```

## Recommendation
**Option 1** is recommended because:
- The folder upload endpoint already handles user creation
- Reduces API complexity
- Eliminates unnecessary network calls
- Simplifies the upload flow

## Priority
🟡 **MEDIUM** - Not blocking functionality but causing errors

## Status
🟡 **IN PROGRESS** - Need to decide on solution and implement
