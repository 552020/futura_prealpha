# ✅ Onboarding Flow Refactor — PR TODO List

#### 🧠 Temporary Memory & Unified User Handling

- [ ] Add `isTemporary` field to:
  - [ ] `images` table
  - [ ] `documents` table
  - [ ] `notes` table
- [ ] Replace `userId` in memory tables with:
  - [ ] `ownerId` referencing `all_users.id` (new unified user table)
- [ ] Create `temporary_users` table with:
  - [ ] `id`, `email`, `name`
  - [ ] `secureCode` (for login-less retrieval)
  - [ ] `role`: `"inviter"` | `"invitee"`
  - [ ] Optional `invitedById` referencing `all_users.id`
  - [ ] `createdAt` timestamp
- [ ] Create `all_users` table:
  - [ ] `id`, `type`: `"user"` | `"temporary_user"`
  - [ ] `userId` (nullable)
  - [ ] `temporaryUserId` (nullable)
  - [ ] Unique constraint: exactly one of the two IDs must be non-null

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
- [ ] Fourth screen: Auth (optional)
  - [ ] If user signs up with Google, detect matching `temporary_user` by email
  - [ ] In `createUser` event (in `auth.ts`):
    - [ ] Migrate ownership of memories from `temporary_user` → new user
    - [ ] Remove `temporary_user` record
    - [ ] Update `all_users` references
    - [ ] Send share email

#### 📨 Fallback Email Logic

- [ ] If user skips signup/auth:
  - [ ] After X minutes, trigger fallback email to:
    - [ ] Invitee (with access link)
    - [ ] Inviter (for retrieving memory)

Great question — and you’re thinking in the right direction. You **don’t need to store an array of invited users**. Here's a breakdown:

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

### ❌ Don’t store arrays

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

It’s relational DB best practice and keeps your data clean and scalable.
