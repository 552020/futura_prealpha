# User Schema Architecture Analysis

## Overview

Technical analysis of the current user schema design, identifying architectural issues and proposing solutions for a cleaner, more maintainable user system.

## Current Architecture

### Three-Table User System

```sql
-- Auth.js required table
users (
  id, name, email, emailVerified, image,
  password, username, plan, premiumExpiresAt,
  -- ... permanent user fields
)

-- Temporary user storage
temporaryUsers (
  id, name, email, secureCode, role,
  invitedByAllUserId, registrationStatus,
  -- ... temporary user fields
)

-- Unified user reference
allUsers (
  id, type: "user" | "temporary",
  userId: TEXT,           -- References users.id (if permanent)
  temporaryUserId: TEXT,  -- References temporaryUsers.id (if temporary)
  createdAt
)
```

### Current Relationships

```
allUsers (unified reference)
├── type: "user" → users.id
└── type: "temporary" → temporaryUsers.id

Memories, Galleries, etc. → allUsers.id
```

## Problem Analysis

### 1. **Data Integrity Complexity**

```sql
-- Fragile constraint requirements
allUsers (
  type: "user" | "temporary",
  userId: TEXT,           -- NULL if temporary
  temporaryUserId: TEXT,  -- NULL if permanent
)

-- Need to ensure exactly one reference is set
-- Easy to create orphaned references
-- Complex validation logic required
```

### 2. **Query Performance Issues**

```typescript
// Every user lookup requires multiple queries
const user = await db.query.allUsers.findFirst({
  where: eq(allUsers.id, userId),
});

// Then another query based on type
if (user.type === "user") {
  const permanentUser = await db.query.users.findFirst({
    where: eq(users.id, user.userId),
  });
} else {
  const tempUser = await db.query.temporaryUsers.findFirst({
    where: eq(temporaryUsers.id, user.temporaryUserId),
  });
}
```

**Impact**: N+1 query problem, slower performance, complex caching

### 3. **Migration Complexity**

```typescript
// Converting temporary to permanent user requires:
// 1. Create entry in users table
// 2. Update allUsers.type and userId
// 3. Clean up temporaryUsers entry
// 4. Update all references (memories, galleries, etc.)
```

**Impact**: Error-prone, complex rollback scenarios

### 4. **Code Complexity**

```typescript
// Every user operation needs type checking
const getUserData = async (allUserId: string) => {
  const allUser = await getAllUser(allUserId);

  if (allUser.type === "user") {
    return await getPermanentUser(allUser.userId);
  } else {
    return await getTemporaryUser(allUser.temporaryUserId);
  }
};
```

**Impact**: Boilerplate code everywhere, maintenance burden

### 5. **Schema Evolution Issues**

```typescript
// Adding new user fields requires updates to multiple tables
// Need to maintain consistency across users, temporaryUsers, allUsers
// Schema migrations become complex
```

## Proposed Solutions

### Solution 1: Single Table with Type Flag

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,

  -- Type and status
  user_type TEXT NOT NULL CHECK (user_type IN ('permanent', 'temporary')),
  is_verified BOOLEAN DEFAULT false,

  -- Auth fields (for permanent users)
  password_hash TEXT,
  email_verified TIMESTAMP,

  -- Temporary user fields
  temporary_code TEXT,
  temporary_code_expires TIMESTAMP,

  -- Common fields
  plan TEXT DEFAULT 'free',
  premium_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_user_type CHECK (
    (user_type = 'permanent' AND password_hash IS NOT NULL) OR
    (user_type = 'temporary' AND temporary_code IS NOT NULL)
  )
);
```

**Benefits**:

- ✅ Single query for user data
- ✅ Simple constraints
- ✅ Easy migrations
- ✅ Clear data relationships

**Challenges**:

- ❌ Requires custom Auth.js adapter
- ❌ More complex user creation logic

### Solution 2: Proper Polymorphic Pattern

```sql
-- Base user table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('permanent', 'temporary')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Permanent user details
CREATE TABLE permanent_users (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  email_verified TIMESTAMP,
  plan TEXT DEFAULT 'free',
  premium_expires_at TIMESTAMP
);

-- Temporary user details
CREATE TABLE temporary_users (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  temporary_code TEXT NOT NULL,
  temporary_code_expires TIMESTAMP NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('inviter', 'invitee'))
);
```

**Benefits**:

- ✅ Clean separation of concerns
- ✅ Proper normalization
- ✅ Type safety through constraints
- ✅ Easy to extend

**Challenges**:

- ❌ Still requires joins for full user data
- ❌ More complex queries

### Solution 3: Hybrid Approach

```sql
-- Unified user table with optional auth
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,

  -- Core fields
  user_type TEXT NOT NULL CHECK (user_type IN ('permanent', 'temporary')),
  is_verified BOOLEAN DEFAULT false,

  -- Auth fields (nullable for temporary users)
  password_hash TEXT,
  email_verified TIMESTAMP,

  -- Temporary fields (nullable for permanent users)
  temporary_code TEXT,
  temporary_code_expires TIMESTAMP,

  -- Business fields
  plan TEXT DEFAULT 'free',
  premium_expires_at TIMESTAMP,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_temporary_code ON users(temporary_code) WHERE temporary_code IS NOT NULL;
```

**Benefits**:

- ✅ Single table, single query
- ✅ Flexible metadata
- ✅ Easy to understand
- ✅ Good performance

## Performance Analysis

### Current System

```typescript
// Average queries per user operation: 2-3
const user = await getAllUser(id); // Query 1
const userData = await getUserData(user); // Query 2-3
```

### Proposed System

```typescript
// Average queries per user operation: 1
const user = await getUsers.findFirst({
  where: eq(users.id, id),
}); // Single query
```

**Performance improvement**: 50-66% reduction in database queries

## Migration Strategy

### Phase 1: Create New Schema

1. Create new user table structure
2. Add migration scripts
3. Test with subset of users

### Phase 2: Data Migration

1. Migrate existing users to new structure
2. Update all foreign key references
3. Verify data integrity

### Phase 3: Code Migration

1. Update all user queries
2. Remove old table references
3. Update API endpoints

### Phase 4: Cleanup

1. Drop old tables
2. Remove old code
3. Update documentation

## Risk Assessment

### High Risk

- **Data migration complexity** - Large user base
- **Downtime requirements** - Schema changes
- **Rollback complexity** - Multiple table dependencies

### Medium Risk

- **Auth.js integration** - Custom adapter required
- **Performance regression** - New query patterns
- **Bug introduction** - Complex migration

### Low Risk

- **Business logic changes** - User operations remain same
- **API compatibility** - Can maintain same interfaces

## Recommendation

**Solution 1 (Single Table with Type Flag)** offers the best balance of simplicity and performance, but requires Auth.js adapter modifications.

**Solution 3 (Hybrid Approach)** provides similar benefits with less Auth.js integration complexity.

**Solution 2 (Proper Polymorphic Pattern)** maintains clean separation but requires more complex queries.

**Timeline**: 2-3 weeks for complete migration
**Risk**: Medium (manageable with proper testing)
**Benefit**: Significant long-term maintainability improvement

## Alternative: Dual Table Approach

### Option B: Keep Auth.js Separate

```typescript
// Auth.js uses its own table (unchanged)
export const authUsers = pgTable("auth_user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  // ... Auth.js required fields only
});

// Our business user table (unified)
export const users = pgTable("user", {
  id: text("id").primaryKey(),
  authUserId: text("auth_user_id").references(() => authUsers.id),
  userType: text("user_type").notNull().default("permanent"),
  isVerified: boolean("is_verified").default(false),
  temporaryCode: text("temporary_code"),
  temporaryCodeExpires: timestamp("temporary_code_expires"),
  plan: text("plan").default("free"),
  premiumExpiresAt: timestamp("premium_expires_at"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Benefits**:

- ✅ **Auth.js compatibility** - No adapter modifications needed
- ✅ **Clean separation** - Auth concerns separate from business logic
- ✅ **Easier migration** - Can migrate gradually
- ✅ **Lower risk** - Don't touch Auth.js internals
- ✅ **Single query for business data** - users table contains all business logic

**Trade-offs**:

- ❌ **Two user tables** - Some data duplication
- ❌ **Foreign key relationship** - Need to maintain authUsers reference
- ❌ **Slightly more complex** - Two tables instead of one

## Success Metrics

- ✅ 50% reduction in user-related database queries
- ✅ 80% reduction in user-related code complexity
- ✅ Zero data loss during migration
- ✅ No performance regression
- ✅ Simplified user operations

## Dependencies

### For Solution 1 (Single Table)

- Auth.js adapter customization
- Comprehensive testing strategy
- Rollback plan
- Gradual migration approach

### For Option B (Dual Table)

- Migration strategy for existing users
- Foreign key relationship management
- Data consistency validation
- Comprehensive testing strategy

## Guest-to-Permanent User Conversion Analysis

### Current Implementation Assessment

**Short answer: YES - the implementation is correct**.

From the actual code analysis:

- ✅ **Temporary user creation**: `createTemporaryUserBase()` creates both `temporaryUsers` and `allUsers` entries
- ✅ **Stable business ID**: `allUsers.id` remains the same during conversion (no FK rewrites)
- ✅ **Auth.js integration**: `createUser` event properly links Auth.js user to existing business user
- ✅ **Memory references**: All memories reference `allUsers.id` (stable business ID)

### Implementation Verification

**✅ Canonical business ID stays the same after signup**:

```typescript
// From auth.ts createUser event
await db
  .update(allUsers)
  .set({
    type: "user",
    userId: user.id!, // Link to Auth.js user
    temporaryUserId: null, // Remove temporary reference
  })
  .where(eq(allUsers.id, allUserEntry.id)); // Same allUsers.id
```

**✅ Auth.js user gets linked to business user**:

```typescript
// Auth.js createUser event handles the linking
if (temporaryUser && allUserEntry) {
  // Update allUsers to point to new Auth.js user
  await db
    .update(allUsers)
    .set({
      type: "user",
      userId: user.id!,
      temporaryUserId: null,
    })
    .where(eq(allUsers.id, allUserEntry.id));
}
```

**❌ Session exposes business user ID**:

```typescript
// Current session callback only exposes Auth.js user ID
async session({ session, token }) {
  if (session.user) {
    session.user.role = token.role as string;
    session.user.id = token.sub as string; // This is Auth.js user ID
  }
  return session;
}
```

**❌ Guest expiry/cleanup**: No cleanup mechanism found in codebase

### Current Schema Analysis

```typescript
// From src/db/schema.ts

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  username: text("username").unique(),
  parentId: text("parent_id"),
  invitedByAllUserId: text("invited_by_all_user_id"),
  invitedAt: timestamp("invited_at"),
  registrationStatus: text("registration_status", {
    enum: ["pending", "visited", "initiated", "completed", "declined", "expired"],
  })
    .default("pending")
    .notNull(),
  role: text("role", {
    enum: ["user", "moderator", "admin", "developer", "superadmin"],
  })
    .default("user")
    .notNull(),
  plan: text("plan", {
    enum: ["free", "premium"],
  })
    .default("free")
    .notNull(),
  premiumExpiresAt: timestamp("premium_expires_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: json("metadata")
    .$type<{
      bio?: string;
      location?: string;
      website?: string;
    }>()
    .default({}),
});

export const allUsers = pgTable("all_user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: text("type", { enum: ["user", "temporary"] }).notNull(),
  userId: text("user_id"), // FK defined below
  temporaryUserId: text("temporary_user_id"), // FK defined below
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const temporaryUsers = pgTable("temporary_user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email"),
  secureCode: text("secure_code").notNull(),
  secureCodeExpiresAt: timestamp("secure_code_expires_at", { mode: "date" }).notNull(),
  role: text("role", { enum: ["inviter", "invitee"] }).notNull(),
  invitedByAllUserId: text("invited_by_all_user_id"),
  registrationStatus: text("registration_status", {
    enum: ["pending", "visited", "initiated", "completed", "declined", "expired"],
  })
    .default("pending")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: json("metadata")
    .$type<{
      notes?: string;
      location?: string;
      campaign?: string;
    }>()
    .default({}),
});
```

### Conversion Flow Analysis

#### Current Flow (Based on Code Analysis)

```typescript
// 1. Temporary user creation during onboarding
const { allUser } = await createTemporaryUserBase("inviter");

// 2. Memories reference allUsers.id (stable business ID)
const memory = await storeInDatabase({
  ownerId: allUser.id, // This stays the same
  // ... memory data
});

// 3. User signs up - Auth.js createUser event handles conversion
// ✅ allUsers.id remains the same
// ✅ allUsers.type changes from "temporary" to "user"
// ✅ allUsers.userId gets populated with Auth.js user ID
```

#### Required Flow for Proper Conversion

```typescript
// 1. Temporary user created
allUsers: { id: "business-123", type: "temporary", temporaryUserId: "temp-456" }

// 2. User signs up - should become:
allUsers: { id: "business-123", type: "user", userId: "auth-789" }
// Note: business-123 stays the same, no FK rewrites needed

// 3. Session should expose business-123, not auth-789
session.user.businessUserId = "business-123"
```

### Missing Implementation Details

#### 1. Auth.js Callback Integration

```typescript
// Need to verify this exists in auth configuration
callbacks: {
  signIn: async ({ user, account, profile }) => {
    // Should link Auth.js user to existing business user
    // Should preserve the allUsers.id
  },
  session: async ({ session, token }) => {
    // Should expose business user ID in session
    session.user.businessUserId = token.businessUserId;
    return session;
  }
}
```

#### 2. Guest Expiry/Cleanup

```typescript
// Need to verify this exists
const cleanupExpiredTemporaryUsers = async () => {
  const expiredUsers = await db.query.temporaryUsers.findMany({
    where: lt(temporaryUsers.secureCodeExpiresAt, new Date()),
  });
  // Cleanup logic
};
```

### Recommendation

**The current implementation is architecturally sound** - the `allUsers.id` remains stable during conversion, and no foreign key rewrites are needed.

**However, there are two missing pieces that should be addressed:**

#### 1. Session Management Issue

```typescript
// Current: Session exposes Auth.js user ID
session.user.id = token.sub as string; // Auth.js user ID

// Should be: Session exposes business user ID
session.user.id = allUsers.id; // Business user ID
```

**Impact**: App code needs to query `allUsers` table to get business user ID for every operation.

#### 2. Missing Cleanup Mechanism

```typescript
// Need to implement cleanup for expired temporary users
const cleanupExpiredTemporaryUsers = async () => {
  const expiredUsers = await db.query.temporaryUsers.findMany({
    where: lt(temporaryUsers.secureCodeExpiresAt, new Date()),
  });
  // Cleanup logic
};
```

**Impact**: Temporary users accumulate in database without cleanup.

### Conclusion

The user schema architecture is **correctly implemented** for guest-to-permanent conversion. The three-table system works as intended:

1. ✅ **Stable business ID** - `allUsers.id` never changes
2. ✅ **Proper linking** - Auth.js user gets linked to existing business user
3. ✅ **No FK rewrites** - All memory references remain valid
4. ✅ **Clean conversion** - Temporary user data is properly migrated

**The architectural complexity is justified** by the requirement to support both temporary and permanent users while maintaining stable references.
