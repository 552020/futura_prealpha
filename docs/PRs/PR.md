# ✅ Onboarding Flow Refactor — PR TODO List

#### 🧠 Unified User Handling

- [x] Create `temporary_users` table with:
  - [x] `id`, `email`, `name`
  - [x] `secureCode` (for login-less retrieval)
  - [x] `role`: `"inviter"` | `"invitee"`
  - [x] Optional `invitedById` referencing `all_users.id`
  - [x] `createdAt` timestamp
- [x] Create `all_users` table:
  - [x] `id`, `type`: `"user"` | `"temporary_user"`
  - [x] `userId` (nullable)
  - [x] `temporaryUserId` (nullable)
  - [x] Unique constraint: exactly one of the two IDs must be non-null
- [x] Replace `userId` in memory tables with:
  - [x] `ownerId` referencing `all_users.id` (new unified user table)

#### 🕓 Memory Cleanup

- [ ] Add Vercel Cron Job to:
  - [ ] Delete all memories and users marked `isTemporary` older than X days
  - [ ] Clean up `all_users` and `temporary_users` appropriately

#### 🧩 Onboarding Flow Implementation

- [ ] First screen: Upload memory
  - [ ] Store memory in DB as `isTemporary`
  - [ ] Create a `temporary_user` with role `inviter` and a `secureCode`
  - [ ] Link memory to `all_users` via a new `all_user` record
- [ ] Second screen: Collect name + email
  - [ ] Update the `temporary_user` record with name and email
  - [ ] Allow optional signup/auth
- [ ] Third screen: Share memory
  - [ ] Create a new `temporary_user` with role `invitee`
  - [ ] Create corresponding `all_user` entry
  - [ ] Link to inviter via `invitedById`
- [x] Fourth screen: Auth (optional)
  - [x] If user signs up with Google, detect matching `temporary_user` by email
  - [x] In `createUser` event (in `auth.ts`):
    - [x] Migrate ownership of memories from `temporary_user` → new user
    - [x] Remove `temporary_user` record
    - [x] Update `all_users` references
    - [ ] Send share email

#### 📨 Fallback Email Logic

- [ ] If user skips signup/auth:
  - [ ] After X minutes, trigger fallback email to:
    - [ ] Invitee (with access link)
    - [ ] Inviter (for retrieving memory)

---

### ✅ Implementation Notes

#### User Status Management

Instead of adding `isTemporary` fields to individual memory tables, we're using the `all_users` table's `type` field to determine if a user is temporary or permanent. This approach:

- Centralizes user status in one place
- Maintains referential integrity through the `all_users` table
- Simplifies queries (no need to check multiple tables for temporary status)

#### Database Relationships

- All memory tables (images, documents, notes) now reference `all_users.id` via `ownerId`
- The `all_users` table maintains the relationship between permanent and temporary users
- The unique constraint ensures a user can't be both permanent and temporary simultaneously

#### User Promotion Flow

The `createUser` event in `auth.ts` handles the promotion of temporary users to permanent users by:

1. Finding a matching temporary user by email
2. Locating the corresponding `all_users` entry
3. Updating the `all_users` entry to point to the new permanent user
4. Removing the temporary user record

Great question — and you're thinking in the right direction. You **don't need to store an array of invited users**. Here's a breakdown:

---

### ✅ Recommended Approach

- You **already have**:

  ```ts
  invitedById: text("invited_by_id").references(() => allUsers.id);
  ```

- If you ever need to find **all users invited by a specific inviter**, you can just query:
  ```sql
  SELECT * FROM temporary_users WHERE invited_by_id = 'some_user_id';
  ```
  Or in Drizzle:
  ```ts
  db.query.temporaryUsers.findMany({
    where: (tempUser, { eq }) => eq(tempUser.invitedById, inviterId),
  });
  ```

---

### 🧠 Optional Optimization

- If you're going to query this frequently (e.g. for analytics or user dashboards), you can:

  - Add a **DB index** on `invited_by_id` for performance.

    For example in Drizzle:

    ```ts
    invitedById: text("invited_by_id").references(() => allUsers.id),
    ...
    indexes: [index("invited_by_idx").on("invited_by_id")]
    ```

---

### ❌ Don't store arrays

- Storing an array like `invitedUserIds: text("invited_user_ids").array()` leads to:
  - Redundant data
  - Harder updates
  - Limited relational integrity (you can't use foreign keys in arrays)
  - No efficient querying or filtering

---

### ✅ TL;DR

- **Keep only `invitedById`**
- **Add an index** if you expect frequent lookups
- **Derive invitees via a query**

It's relational DB best practice and keeps your data clean and scalable.
