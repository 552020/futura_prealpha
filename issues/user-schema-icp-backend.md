# User Schema Implementation in ICP Backend

## 📋 Issue Summary

Design and implement a user schema for the ICP backend that supports the core functionality of our family memory sharing application while leveraging Web3 principles and ICP's unique capabilities.

## 🎯 Background

Currently, our Next.js application uses a comprehensive PostgreSQL schema for user management and relationships. We need to translate the essential user data and relationship models to work in the ICP ecosystem, considering both centralized and decentralized approaches.

## 🔍 Current Web2 User Schema Analysis

### Essential User Fields from `schema.ts`:

```typescript
// Core Identity
id: text("id"); // Maps to Principal in ICP
name: text("name"); // Display name
username: text("username"); // Unique handle
email: text("email"); // Optional in Web3
image: text("image"); // Profile picture

// Access Control
role: text("role", { enum: ["user", "moderator", "admin", "developer", "superadmin"] });

// Premium Features
plan: text("plan", { enum: ["free", "premium"] });
premiumExpiresAt: timestamp("premium_expires_at");

// Family/Social Hierarchy
parentId: text("parent_id"); // Self-referencing for family trees
invitedByAllUserId: text("invited_by_all_user_id"); // Invitation tracking
registrationStatus: text("registration_status", {
  enum: ["pending", "visited", "initiated", "completed", "declined", "expired"],
});

// Metadata
metadata: json("metadata"); // Bio, location, website
createdAt: timestamp("created_at");
updatedAt: timestamp("updated_at");
```

### Current Relationship Architecture:

The app uses a sophisticated 3-table relationship system to handle both registered users and family tree data:

#### 1. `relationship` Table - General Connections Between Users

This is the foundation table that connects any two registered users in the system.

```typescript
export const relationship = pgTable("relationship", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => allUsers.id), // User A
  relatedUserId: text("related_user_id").references(() => allUsers.id), // User B
  type: text("type", {
    enum: ["friend", "colleague", "acquaintance", "family", "other"],
  }).notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "declined"],
  })
    .default("pending")
    .notNull(),
  note: text("note"), // Optional note about the relationship
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Purpose**: Establishes that two users know each other and defines the general category of their relationship.

**Examples**:

- `userId: "alice", relatedUserId: "bob", type: "friend", status: "accepted"`
- `userId: "alice", relatedUserId: "charlie", type: "family", status: "pending"`

#### 2. `familyRelationship` Table - Specific Family Roles

This table extends the `relationship` table with specific family role information when `type = "family"`.

```typescript
export const familyRelationship = pgTable("family_relationship", {
  id: text("id").primaryKey(),
  relationshipId: text("relationship_id").references(() => relationship.id), // Links to relationship table
  familyRole: text("family_role", {
    enum: [
      "parent",
      "child",
      "sibling",
      "cousin",
      "spouse",
      "grandparent",
      "grandchild",
      "aunt_uncle",
      "niece_nephew",
      "extended_family",
      "other",
    ],
  }).notNull(),
  relationshipClarity: text("relationship_clarity", {
    enum: ["resolved", "fuzzy"], // Is the exact relationship known?
  })
    .default("fuzzy")
    .notNull(),
  sharedAncestorId: text("shared_ancestor_id").references(() => allUsers.id), // Common ancestor if known
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Purpose**: Adds specific family role context to family relationships between registered users.

**Examples**:

- Relationship ID #123 (Alice ↔ Bob, type: "family") → `familyRole: "sibling", clarity: "resolved"`
- Relationship ID #124 (Alice ↔ Charlie, type: "family") → `familyRole: "cousin", clarity: "fuzzy"`

#### 3. `familyMember` Table - Non-Registered Family Tree

This table allows users to build comprehensive family trees including people who aren't registered users.

```typescript
export const familyMember = pgTable("family_member", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => allUsers.id), // Who created this record
  userId: text("user_id").references(() => allUsers.id), // If they later register (optional)
  fullName: text("full_name").notNull(), // "John Smith"
  primaryRelationship: text("primary_relationship", {
    enum: ["son", "daughter", "father", "mother", "sibling", "spouse"],
  }).notNull(), // Main relationship to owner
  fuzzyRelationships: text("fuzzy_relationships").array().default([]), // ["grandfather", "uncle"]
  birthDate: timestamp("birth_date"),
  deathDate: timestamp("death_date"),
  birthplace: text("birthplace"),
  metadata: json("metadata").$type<{ notes?: string }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Purpose**: Enables users to document their complete family tree, including deceased relatives, distant family, or people who haven't joined the platform yet.

**Examples**:

- `ownerId: "alice", fullName: "Grandpa Joe Smith", primaryRelationship: "father", fuzzyRelationships: []`
- `ownerId: "alice", fullName: "Great Uncle Mike", primaryRelationship: "sibling", fuzzyRelationships: ["grandfather"]`

### How The Tables Work Together:

#### Scenario 1: Two Registered Users Who Are Family

1. **`relationship`**: Alice and Bob are connected with `type: "family"`
2. **`familyRelationship`**: Specifies they are `siblings` with `resolved` clarity
3. **`familyMember`**: Not used (both are registered users)

#### Scenario 2: User Documents Non-Registered Family

1. **`relationship`**: Not used (person isn't registered)
2. **`familyRelationship`**: Not used (person isn't registered)
3. **`familyMember`**: Alice creates record for "Grandpa Joe" as her `father`

#### Scenario 3: Non-Registered Person Later Joins

1. **`familyMember`**: Alice has "John Smith" as her `sibling`
2. John registers → gets `userId: "john123"`
3. **`familyMember`**: Record updated with `userId: "john123"`
4. **`relationship`**: New record created: Alice ↔ John, `type: "family"`
5. **`familyRelationship`**: New record: `familyRole: "sibling", clarity: "resolved"`

### Key Benefits of This Architecture:

- **Flexibility**: Handles both registered and non-registered family members
- **Scalability**: Can represent complex, multi-generational family trees
- **Evolution**: Family tree records can "upgrade" when people join the platform
- **Privacy**: Users control their own family tree data
- **Accuracy**: Distinguishes between confirmed relationships and fuzzy/uncertain ones

## 🏗️ Proposed ICP Implementation Options

### Option 1: Centralized Backend Canister

```rust
pub struct User {
    pub principal: Principal,
    pub name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    pub image: Option<String>,
    pub role: UserRole,
    pub plan: PlanType,
    pub parent_principal: Option<Principal>,
    pub invited_by: Option<Principal>,
    pub registration_status: RegistrationStatus,
    pub metadata: UserMetadata,
    pub created_at: u64,
    pub updated_at: u64,
}

pub struct Relationship {
    pub id: String,
    pub user_principal: Principal,
    pub related_user_principal: Principal,
    pub relationship_type: RelationshipType,
    pub status: RelationshipStatus,
    pub family_role: Option<FamilyRole>,
    pub created_at: u64,
}
```

### Option 2: Decentralized User Canisters

This approach uses **multiple canisters** - one per user plus a shared registry:

#### A. Individual User Canisters (One per user)

```rust
// Each user deploys their own canister with this structure
pub struct UserCanister {
    pub owner: Principal,                                    // The user who owns this canister
    pub profile: UserProfile,                               // Name, bio, image, etc.
    pub relationships: HashMap<Principal, RelationshipInfo>, // Their connections to other users
    pub memories: Vec<Memory>,                               // Their photos, videos, notes
    pub family_tree: Vec<FamilyMember>,                     // Non-registered family members
    pub settings: UserSettings,                              // Privacy settings, preferences
}

impl UserCanister {
    // Users can call other users' canisters directly
    pub async fn send_friend_request(&mut self, target_canister: Principal) -> Result<(), String> {
        // Inter-canister call to another user's canister
        let _: () = call(target_canister, "receive_friend_request", (self.owner,)).await?;
        Ok(())
    }
}
```

#### B. Registry Canister (Single shared canister - like DNS)

```rust
// ONE centralized canister for discovery only - acts like a phone book
pub struct RegistryCanister {
    pub username_to_canister: HashMap<String, Principal>,   // "alice" -> canister_abc123
    pub canister_to_info: HashMap<Principal, PublicUserInfo>, // Basic public info only
}

pub struct PublicUserInfo {
    pub username: String,
    pub display_name: Option<String>,
    pub canister_id: Principal,
    pub is_discoverable: bool,                               // User can hide from search
    pub created_at: u64,
}

impl RegistryCanister {
    // Register a username -> canister mapping
    pub fn register_username(&mut self, username: String, canister_id: Principal) -> Result<(), String> {
        // Only the canister owner can register their own username
        if ic_cdk::caller() != canister_id {
            return Err("Only canister owner can register username".to_string());
        }

        if self.username_to_canister.contains_key(&username) {
            return Err("Username already taken".to_string());
        }

        self.username_to_canister.insert(username.clone(), canister_id);
        self.canister_to_info.insert(canister_id, PublicUserInfo {
            username,
            display_name: None,
            canister_id,
            is_discoverable: true,
            created_at: ic_cdk::api::time(),
        });

        Ok(())
    }

    // Find a user's canister by username
    pub fn lookup_user(&self, username: &str) -> Option<Principal> {
        self.username_to_canister.get(username).copied()
    }
}
```

#### How It Works:

1. **User Registration**: Alice deploys her own `UserCanister` at address `canister_abc123`
2. **Username Claim**: Alice calls the `RegistryCanister` to claim username "alice" → `canister_abc123`
3. **Discovery**: Bob wants to find Alice, so he queries `RegistryCanister.lookup_user("alice")` → gets `canister_abc123`
4. **Direct Communication**: Bob calls Alice's canister directly at `canister_abc123` to send friend request
5. **Data Ownership**: Alice's data stays in her own canister, she controls it completely

### Option 3: Hybrid Approach (Recommended)

- **Registry Canister**: Username resolution and discovery
- **User Canisters**: Full data ownership and control
- **Optional Services**: Backup, analytics, moderation

## 🔧 Technical Requirements

### Core Functionality Support:

1. **Memory Sharing**: Users must be able to share memories with family/friends
2. **Family Trees**: Support for complex family relationship mapping
3. **Invitation System**: Onboarding flow for new family members
4. **Access Control**: Role-based permissions for moderation
5. **Premium Features**: Tiered functionality based on plan type
6. **Discovery**: Users must be able to find and connect with each other

### ICP-Specific Considerations:

- **Principal-based Identity**: Leverage Internet Identity
- **Stable Storage**: Persist user data across canister upgrades
- **Inter-canister Calls**: For decentralized relationship management
- **Cycles Management**: Cost-effective storage and computation
- **Security**: Caller validation and access control
