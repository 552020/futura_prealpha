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
- [x] Fix foreign key constraints in `all_users` table:
  - [x] Comment out foreign key constraints to handle race conditions
  - [x] Implement retry logic in `createUser` event
  - [x] Add exponential backoff for user verification

#### 🕓 Memory Cleanup

- [ ] Add Vercel Cron Job to:
  - [ ] Delete all memories and users marked `isTemporary` older than X days
  - [ ] Clean up `all_users` and `temporary_users` appropriately

#### 🧩 Onboarding Flow Implementation

- [x] Items Upload Page (`/items-upload`):

  - [x] File upload interface
  - [x] Store memory in DB as `isTemporary`
  - [x] Create a `temporary_user` with role `inviter` and a `secureCode`
  - [x] Link memory to `all_users` via a new `all_user` record
  - [x] Trigger modal flow after successful upload

- [x] Component Refactoring:

  - [x] Split monolithic onboard-modal into smaller components:
    - [x] Create `steps/` directory for step components
    - [x] Extract `UserInfoStep` component
    - [x] Extract `ShareStep` component
    - [x] Extract `SignUpStep` component
  - [x] Improve component organization:
    - [x] Move step-specific logic into respective components
    - [x] Implement proper prop typing for each component
    - [x] Add proper state management within steps
    - [x] Maintain focus handling in form inputs

- [ ] Modal Flow:
  - [x] First Screen: Collect name + email
    - [x] Update the `temporary_user` record with name and email
    - [x] Allow optional signup/auth
  - [x] Second Screen: Share memory
    - [x] Create a new `temporary_user` with role `invitee`
    - [x] Create corresponding `all_user` entry
    - [x] Link to inviter via `invitedById`
    - [x] Send share email without using templates
  - [x] Third Screen: Auth (optional)
    - [x] If user signs up with Google, detect matching `temporary_user` by email
    - [x] In `createUser` event (in `auth.ts`):
      - [x] Migrate ownership of memories from `temporary_user` → new user
      - [x] Remove `temporary_user` record
      - [x] Update `all_users` references
      - [x] Send share email

#### 📨 Email Sending Implementation

- [x] Implement basic email sending with Mailgun
  - [x] Set up Mailgun configuration
  - [x] Add proper error handling and logging
  - [x] Use simple text/HTML format instead of templates
  - [x] Verify email delivery to different providers (posteo.de, gmail.com)
- [ ] Future improvements:
  - [ ] Set up proper DNS records for better Gmail deliverability
  - [ ] Create and test Mailgun templates
  - [ ] Add email tracking and bounce handling

#### 📨 Fallback Email Logic

- [ ] If user skips signup/auth:
  - [ ] After X minutes, trigger fallback email to:
    - [ ] Invitee (with access link)
    - [ ] Inviter (for retrieving memory)

#### 🔄 File Upload Flow

- [x] Implement unified file upload hook:
  - [x] Use session status to determine endpoint
  - [x] Keep onboarding context for preview
  - [x] Handle both signed-in and non-signed-in users
- [ ] Add proper error handling for upload failures
- [ ] Implement file type validation
- [ ] Add upload progress indicator

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

#### File Upload Flow

The `useFileUpload` hook now handles both signed-in and non-signed-in users:

1. Uses session status to determine the endpoint:
   - Signed in → `/api/memories/upload`
   - Not signed in → `/api/memories/upload/onboarding`
2. Maintains onboarding context for preview when needed
3. Handles file validation and error states

---

### Next Steps

1. Implement the modal's first screen (name + email collection)
2. Add the share memory screen to the modal
3. Set up the email fallback system
4. Add the cleanup cron job
5. Add proper error handling and validation to the file upload flow
6. Consider adding upload progress indicators
7. Add proper file type validation
