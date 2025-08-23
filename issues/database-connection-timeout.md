# Database Connection Timeout During File Uploads

## Issue
During folder uploads, database connection timeouts are causing file upload failures:

```
❌ User creation error: Error [NeonDbError]: Error connecting to database: fetch failed
  at async createTemporaryUserBase (src/app/api/utils.ts:22:21)
  at async createTemporaryUserWithErrorHandling (src/app/api/memories/upload/utils.ts:440:25)
  at async POST (src/app/api/memories/upload/onboarding/file/route.ts:42:43)
```

**Error Details:**
- **Error Type**: `ConnectTimeoutError`
- **Timeout**: 10000ms (10 seconds)
- **Attempted Addresses**: 3.124.121.135:443, 3.126.212.11:443, 52.57.171.9:443
- **Code**: `UND_ERR_CONNECT_TIMEOUT`

## Root Cause
The database connection is timing out when multiple files are being uploaded simultaneously during folder uploads. Each file upload creates a new temporary user, leading to multiple concurrent database connections that may exceed connection limits or timeout.

## Impact
- **File Upload Failures**: Some files fail to upload due to database connection issues
- **User Experience**: Inconsistent upload results - some files succeed, others fail
- **Data Integrity**: Files may be uploaded to storage but not properly linked to users in database

## Current Behavior
From the logs, we can see:
- Files are successfully uploaded to Vercel Blob storage
- Database connection fails during user creation
- Some uploads succeed (creating new users), others fail
- No retry mechanism for failed database operations

## Proposed Solutions

### 1. **Immediate Fix: Use Folder Upload Endpoint**
- **Problem**: Currently using individual file upload endpoint for folder uploads
- **Solution**: Switch to using `/api/memories/upload/onboarding/folder` endpoint
- **Benefit**: Creates single user for all files, reducing database connections

### 2. **Database Connection Pooling**
- **Problem**: Multiple concurrent connections to database
- **Solution**: Implement connection pooling or connection reuse
- **Benefit**: Better resource management and reduced connection overhead

### 3. **Retry Mechanism**
- **Problem**: No retry for failed database operations
- **Solution**: Implement exponential backoff retry for database operations
- **Benefit**: Improved reliability for transient connection issues

### 4. **Connection Timeout Configuration**
- **Problem**: 10-second timeout may be too short for concurrent operations
- **Solution**: Increase connection timeout or implement connection queuing
- **Benefit**: More time for database operations to complete

## Priority
🔴 **HIGH** - This is causing actual file upload failures in production

## Status
🟡 **IN PROGRESS** - Need to investigate and implement solutions
