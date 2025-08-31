# Database Views Architecture Decision - Need Senior Input

## **Context**

We're implementing the storage tracking system for galleries and memories (Tasks #1-4 completed). We've reached **Task #5** which involves creating database views (`memory_presence`, `gallery_presence`) that compute derived storage status from the `storage_edges` table.

## **The Problem**

We need to decide how to handle **database views** in our Drizzle-based architecture. Currently, we use `schema.ts` as the single source of truth for all database objects, but views present a challenge because Drizzle doesn't have built-in view support.

## **Two Approaches Under Consideration**

### **Option A: Views in schema.ts (Currently Implemented)**

```typescript
// In schema.ts
export const memoryPresence = sql<DBMemoryPresence>`
  SELECT
    memory_id,
    memory_type,
    BOOL_OR(backend='neon-db' AND artifact='metadata' AND present) AS meta_neon,
    BOOL_OR(backend='vercel-blob' AND artifact='asset' AND present) AS asset_blob,
    BOOL_OR(backend='icp-canister' AND artifact='metadata' AND present) AS meta_icp,
    BOOL_OR(backend='icp-canister' AND artifact='asset' AND present) AS asset_icp
  FROM storage_edges
  GROUP BY memory_id, memory_type
`.as("memory_presence");

export type DBMemoryPresence = {
  memory_id: string;
  memory_type: string;
  meta_neon: boolean;
  asset_blob: boolean;
  meta_icp: boolean;
  asset_icp: boolean;
};
```

**Pros:**

- ✅ Single source of truth - everything in `schema.ts`
- ✅ Type safety with TypeScript
- ✅ Discoverability - developers see views when browsing schema
- ✅ Consistency with table definitions

**Cons:**

- ❌ Drizzle doesn't auto-generate migrations for views
- ❌ Manual migration management required
- ❌ Views look like tables but behave differently

### **Option B: Views in Migration Files Only**

```sql
-- In migration files only
CREATE OR REPLACE VIEW memory_presence AS
SELECT
  memory_id,
  memory_type,
  BOOL_OR(backend='neon-db' AND artifact='metadata' AND present) AS meta_neon,
  BOOL_OR(backend='vercel-blob' AND artifact='asset' AND present) AS asset_blob,
  BOOL_OR(backend='icp-canister' AND artifact='metadata' AND present) AS meta_icp,
  BOOL_OR(backend='icp-canister' AND artifact='asset' AND present) AS asset_icp
FROM storage_edges
GROUP BY memory_id, memory_type;
```

**Pros:**

- ✅ Standard approach used by most teams
- ✅ Full SQL control and flexibility
- ✅ Clear separation between tables and views

**Cons:**

- ❌ No single source of truth
- ❌ Manual TypeScript type definitions required
- ❌ Views less discoverable

## **Current Implementation Status**

- ✅ **Task #1**: Enum types added to `schema.ts`
- ✅ **Task #2**: `storageEdges` table added to `schema.ts`
- ✅ **Task #3**: Migrations generated and applied
- ✅ **Task #4**: Indexes added to `storageEdges`
- 🔄 **Task #5**: `memory_presence` view partially implemented using Option A

## **Specific Questions for Senior Developer**

### **1. Architecture Preference**

**Q: Which approach do you prefer for handling database views in this project?**

- Option A: Views defined in `schema.ts` with manual migration management
- Option B: Views defined only in migration files
- Option C: A different approach entirely

### **2. Team Standards**

**Q: Are there existing patterns or standards in the codebase for handling views that we should follow?**

### **3. Type Safety vs. Flexibility**

**Q: How important is type safety for views vs. SQL flexibility in this project?**

### **4. Maintenance Considerations**

**Q: What's the team's preference for maintaining discoverability vs. migration simplicity?**

### **5. Future Scalability**

**Q: As the project grows, which approach will be more maintainable for the team?**

### **6. Immediate Decision**

**Q: Should we:**

- Continue with Option A (views in schema.ts) for consistency?
- Switch to Option B (views in migrations) for simplicity?
- Revert current changes and wait for a different approach?

## **Impact of Decision**

This decision affects:

- **Current implementation**: Need to either continue or revert view changes
- **Future views**: All subsequent views will follow the chosen pattern
- **Team workflow**: How developers discover and maintain database objects
- **Type safety**: Whether views have TypeScript types or not

## **Recommended Next Steps**

1. **Get senior decision** on preferred approach
2. **Implement consistently** across all views (`memory_presence`, `gallery_presence`)
3. **Document the pattern** for future team members
4. **Continue with remaining tasks** using the chosen approach

## **Files Affected**

- `src/db/schema.ts` - Currently contains view definition
- `src/db/migrations/0021_ambiguous_gwen_stacy.sql` - Contains view creation SQL
- Future view implementations will follow the chosen pattern

---

**Priority**: High - Blocking progress on Task #5 and subsequent view implementations
**Assignee**: Senior Developer
**Labels**: `architecture`, `database`, `drizzle`, `views`, `decision-needed`
