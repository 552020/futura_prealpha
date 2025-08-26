# Folder Upload User Creation Strategy Issues

## Current Implementation

### Single File Upload (Original Pattern)

1. User selects a file
2. Client calls `/api/memories/upload/onboarding`
3. Server creates temporary user in the upload endpoint
4. File gets associated with that user
5. Later, user fills in name/email in onboarding flow

### Folder Upload (New Confusing Pattern)

1. User selects a folder
2. Client calls `/api/users/folder` to create a user first
3. Client gets user ID from response
4. Client calls `/api/memories/upload/onboarding` for each file, passing the user ID
5. Server uses existing user ID instead of creating a new one

## Problems with Current Approach

### 1. Inconsistent Patterns

- **Single file**: User creation happens in upload endpoint
- **Folder**: User creation happens in separate endpoint before uploads
- **Result**: Two completely different flows for the same functionality

### 2. Client-Side User Creation

- Client is now responsible for creating users
- Breaks separation of concerns
- Client shouldn't know about user creation logic

### 3. Confusing Architecture

- Why have `/api/users/folder` endpoint just for folder uploads?
- Creates unnecessary complexity
- Hard to understand and maintain

### 4. Different User Creation Logic

- Single file: `createTemporaryUserBase("inviter")` in upload endpoint
- Folder: `createTemporaryUserBase("inviter")` in separate endpoint
- Same function, different places

## How User Creation Works

### `createTemporaryUserBase()` Function

```typescript
// Creates both temporaryUsers and allUsers entries
const { temporaryUser, allUser } = await createTemporaryUserBase("inviter");
```

**What it does:**

1. Creates entry in `temporaryUsers` table
2. Creates entry in `allUsers` table
3. Returns both user objects
4. Used for users who haven't signed up yet

### Current User Creation Flow

1. **Single File**: Server creates user during file upload
2. **Folder**: Client creates user before file uploads, then passes ID

## Better Approach

### Option 1: Batch Upload Endpoint

- Create `/api/memories/upload/onboarding/batch` endpoint
- Accept multiple files in one request
- Create one user for all files
- Handle everything server-side

### Option 2: Modify Existing Endpoint

- Keep same `/api/memories/upload/onboarding` endpoint
- Add support for batch uploads
- Create user once per batch
- Maintain consistent pattern

### Option 3: Revert to Sequential

- Remove parallel uploads
- Keep original user creation pattern
- Simpler but slower

## Recommendation

**Option 2** - Modify existing endpoint to support batch uploads while maintaining the original user creation pattern. This keeps the architecture consistent and simple.

## Files to Update

- `src/app/api/memories/upload/onboarding/route.ts` - Add batch support
- `src/hooks/user-file-upload.ts` - Remove client-side user creation
- `src/app/api/users/folder/route.ts` - Remove this endpoint
- `src/services/upload.ts` - Update for batch uploads

## Priority

**Medium** - Current approach works but is confusing and inconsistent. Should be refactored for better maintainability.
