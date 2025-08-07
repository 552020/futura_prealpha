# Dynamic File-Based Routes in Futura Project

## Overview

This document catalogs all dynamic file-based routes in the Futura Next.js project, categorizing them by their compatibility with static export and Juno deployment.

## 🗂️ **Complete Route Structure**

### **Dynamic Route Directories Found:**

```
src/app/[lang]/                    # Language internationalization
src/app/[lang]/[segment]/          # User segment targeting
src/app/[lang]/shared/[id]/        # Shared memory viewing
src/app/[lang]/user/[id]/          # User profiles
src/app/[lang]/vault/[id]/         # Memory details
src/app/api/auth/[...nextauth]/    # NextAuth.js authentication
src/app/api/memories/[id]/         # Memory API endpoints
src/app/api/users/[id]/            # User API endpoints
src/app/tests/files/[id]/          # File testing interface
```

## 📋 **Route Analysis by Category**

### **🟢 Static Export Compatible (Finite Sets)**

#### **1. `[lang]` - Language Routes**

- **Path**: `/[lang]/`
- **Purpose**: Internationalization support
- **Values**: `["en", "fr", "es", "pt", "it", "de", "pl", "zh"]` (8 languages)
- **Implementation**: `generateStaticParams()` in `src/app/[lang]/layout.tsx`
- **Juno Status**: ✅ **Works perfectly** - finite, known at build time

```typescript
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}
```

#### **2. `[lang]/[segment]` - User Segments**

- **Path**: `/[lang]/[segment]/`
- **Purpose**: Targeted content for different user types
- **Values**: `["family", "wedding", "creative", "black-mirror"]` (4 segments)
- **Implementation**: Validation in `src/app/[lang]/[segment]/page.tsx`
- **Juno Status**: ✅ **Works perfectly** - finite, predefined segments

```typescript
const validSegments = ["family", "wedding", "creative", "black-mirror"];
```

### **🔴 Static Export Incompatible (Infinite/Dynamic Sets)**

#### **3. `[lang]/shared/[id]` - Shared Memory Links**

- **Path**: `/[lang]/shared/[id]/`
- **Purpose**: View shared memories via unique links
- **Values**: User-generated memory IDs (infinite)
- **Implementation**: `src/app/[lang]/shared/[id]/page.tsx`
- **Juno Status**: ❌ **Requires client-side routing** - infinite possibilities

#### **4. `[lang]/user/[id]` - User Profiles**

- **Path**: `/[lang]/user/[id]/`
- **Purpose**: Individual user profile pages
- **Values**: User IDs (infinite, grows over time)
- **Implementation**: `src/app/[lang]/user/[id]/profile/page.tsx`
- **Juno Status**: ❌ **Requires client-side routing** - users register dynamically

#### **5. `[lang]/vault/[id]` - Memory Details**

- **Path**: `/[lang]/vault/[id]/`
- **Purpose**: Individual memory (photo/video/document) detail pages
- **Values**: Memory IDs (infinite, user-generated)
- **Implementation**: `src/app/[lang]/vault/[id]/page.tsx`
- **Juno Status**: ❌ **Requires client-side routing** - content created at runtime

#### **6. `api/memories/[id]` - Memory API**

- **Path**: `/api/memories/[id]/`
- **Purpose**: REST API for memory operations (GET, PUT, DELETE)
- **Values**: Memory IDs (infinite)
- **Implementation**: `src/app/api/memories/[id]/route.ts`
- **Juno Status**: ❌ **API routes not supported** - needs external backend

#### **7. `api/users/[id]` - User API**

- **Path**: `/api/users/[id]/`
- **Purpose**: REST API for user operations
- **Values**: User IDs (infinite)
- **Implementation**: `src/app/api/users/[id]/route.ts`
- **Juno Status**: ❌ **API routes not supported** - needs external backend

#### **8. `tests/files/[id]` - File Testing**

- **Path**: `/tests/files/[id]/`
- **Purpose**: Development/testing interface for file details
- **Values**: File IDs (infinite)
- **Implementation**: `src/app/tests/files/[id]/page.tsx`
- **Juno Status**: ❌ **Development only** - not needed in production

### **🔵 Special Cases**

#### **9. `api/auth/[...nextauth]` - Authentication**

- **Path**: `/api/auth/[...nextauth]/`
- **Purpose**: NextAuth.js authentication endpoints
- **Values**: Catch-all authentication routes
- **Implementation**: NextAuth.js built-in
- **Juno Status**: ❌ **API routes not supported** - needs Internet Identity

## 🎯 **Summary by Deployment Target**

### **✅ Vercel Build (Full Next.js)**

All routes work perfectly:

- Static routes: Pre-rendered with `generateStaticParams`
- Dynamic routes: Server-side rendering on demand
- API routes: Full Node.js backend support
- Authentication: NextAuth.js with database

### **⚠️ Juno Build (Static Export)**

#### **Routes That Work:**

- ✅ `/[lang]/` (8 pre-rendered language pages)
- ✅ `/[lang]/[segment]/` (32 pre-rendered combinations: 8 langs × 4 segments)

#### **Routes That Need Alternative Solutions:**

- ❌ `/[lang]/shared/[id]/` → Client-side routing + Web2 API
- ❌ `/[lang]/user/[id]/` → Client-side routing + Web2 API
- ❌ `/[lang]/vault/[id]/` → Client-side routing + Web2 API
- ❌ `/api/memories/[id]/` → External Express.js backend
- ❌ `/api/users/[id]/` → External Express.js backend
- ❌ `/api/auth/[...nextauth]/` → Internet Identity integration

## 🔄 **Migration Strategy Implications**

### **Phase 1: Basic Static Routes (Easy)**

- Keep `[lang]` and `[segment]` routes as-is
- Use `output: "export"` with `generateStaticParams`
- No routing changes needed

### **Phase 2: Dynamic Content Routes (Complex)**

- Replace dynamic routes with client-side routing (React Router)
- Implement SPA fallback for `/[lang]/vault/[id]` etc.
- Connect to external Web2 backend API

### **Phase 3: Authentication & APIs (Complex)**

- Replace NextAuth.js with Internet Identity
- Migrate API routes to separate backend service
- Implement shared database strategy

## 📊 **Route Statistics**

| Category            | Count | Juno Compatible | Migration Complexity |
| ------------------- | ----- | --------------- | -------------------- |
| **Static Routes**   | 2     | ✅ Yes          | 🟢 None              |
| **Dynamic Content** | 3     | ❌ No           | 🔴 High              |
| **API Routes**      | 3     | ❌ No           | 🔴 High              |
| **Development**     | 1     | ❌ N/A          | 🟡 Remove            |

## 🏆 **Key Insights**

1. **22% of routes work natively on Juno** (2/9 route patterns)
2. **Static export handles internationalization perfectly** (40 total pre-rendered pages)
3. **User-generated content requires dual architecture** (client-side + external backend)
4. **API migration is the biggest challenge** (3 API route patterns to migrate)

This analysis confirms that our dual-build strategy is necessary for user-generated content and APIs, while basic internationalization can leverage Next.js static export capabilities on Juno.
