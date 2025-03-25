import {
  pgTable,
  text,
  timestamp,
  json,
  boolean,
  primaryKey,
  integer,
  uniqueIndex,
  foreignKey,
  IndexBuilder,
} from "drizzle-orm/pg-core";
import type { DefaultSession } from "next-auth";
// import type { AdapterAccount } from "@auth/core/adapters";
import type { AdapterAccount } from "next-auth/adapters";
// Users table - Core user data - required for auth.js
export const users = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()), // required for auth.js
    name: text("name"), // required for auth.js
    email: text("email").unique(), // required for auth.js
    emailVerified: timestamp("emailVerified", { mode: "date" }), // required for auth.js
    image: text("image"), // required for auth.js
    // Our additional fields
    password: text("password"),
    username: text("username").unique(),
    parentId: text("parent_id"), // This links a child to their parent (can be NULL for root nodes)

    // New invitation-related fields:
    invitedByAllUserId: text("invited_by_all_user_id"), // No `.references()` here!
    invitedAt: timestamp("invited_at"), // When the invitation was sent
    registrationStatus: text("registration_status", {
      enum: ["pending", "visited", "initiated", "completed", "declined", "expired"],
    })
      .default("pending")
      .notNull(), // Tracks signup progress

    // Access control
    role: text("role", {
      enum: ["user", "moderator", "admin", "developer", "superadmin"],
    })
      .default("user")
      .notNull(),

    // Payment-related
    plan: text("plan", {
      enum: ["free", "premium"],
    })
      .default("free")
      .notNull(),

    premiumExpiresAt: timestamp("premium_expires_at", { mode: "date" }),

    // Timestamp fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: json("metadata")
      .$type<{
        bio?: string;
        location?: string;
        website?: string;
      }>()
      .default({}),
  },
  (table) => [
    // Define the self-referencing foreign key separately
    foreignKey({
      columns: [table.invitedByAllUserId],
      foreignColumns: [table.id],
      name: "user_invited_by_fk",
    }),
    // Self-referencing Foreign Key
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "user_parent_fk",
    }),
  ]
);

export const allUsers = pgTable(
  "all_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    type: text("type", { enum: ["user", "temporary"] }).notNull(),

    userId: text("user_id"), // FK defined below
    temporaryUserId: text("temporary_user_id"), // FK defined below

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  //   (table) => [
  //     // ✅ Optional FK to permanent users
  //     foreignKey({
  //       columns: [table.userId],
  //       foreignColumns: [users.id],
  //       name: "all_users_user_fk",
  //     }),
  //     // ✅ Optional FK to temporary users
  //     foreignKey({
  //       columns: [table.temporaryUserId],
  //       foreignColumns: [temporaryUsers.id],
  //       name: "all_users_temporary_user_fk",
  //     }),
  //     // ✅ Ensure a user can't be both permanent and temporary
  //     uniqueIndex("one_user_type_check").on(table.userId, table.temporaryUserId),
  //   ]
  (table): (ReturnType<typeof foreignKey> | IndexBuilder)[] => [
    // ✅ Optional FK to permanent users
    foreignKey({
      columns: [table.userId],
      foreignColumns: [allUsers.id],
      name: "all_users_user_fk",
    }),
    // ✅ Optional FK to temporary users
    foreignKey({
      columns: [table.temporaryUserId],
      foreignColumns: [temporaryUsers.id],
      name: "all_users_temporary_user_fk",
    }),
    // ✅ Ensure a user can't be both permanent and temporary
    uniqueIndex("one_user_type_check").on(table.userId, table.temporaryUserId),
  ]
);

export const temporaryUsers = pgTable(
  "temporary_user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    name: text("name"),
    email: text("email"),
    secureCode: text("secure_code").notNull(),
    secureCodeExpiresAt: timestamp("secure_code_expires_at", { mode: "date" }).notNull(),

    role: text("role", { enum: ["inviter", "invitee"] }).notNull(),

    invitedByAllUserId: text("invited_by_all_user_id"), // FK declared later

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
  },
  (table): [ReturnType<typeof foreignKey>] => [
    foreignKey({
      columns: [table.invitedByAllUserId],
      foreignColumns: [allUsers.id],
      name: "temporary_user_invited_by_fk",
    }),
  ]
);

// Auth.js required tables
export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

// Auth.js required tables
export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  })
);

// required for webauthn by auth.js
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
);

// Shared types for file metadata
export type CommonFileMetadata = {
  size: number;
  mimeType: string;
  originalName: string;
  uploadedAt: string;
  dateOfMemory?: string;
  peopleInMemory?: string[];
  format?: string; // File format (e.g., "JPEG", "PNG", "PDF")
};

export type ImageMetadata = CommonFileMetadata & {
  dimensions?: { width: number; height: number };
};

// Application tables
export const images = pgTable("image", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id")
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  title: text("title"),
  description: text("description"),
  metadata: json("metadata").$type<ImageMetadata>().default({
    size: 0,
    mimeType: "",
    originalName: "",
    uploadedAt: new Date().toISOString(),
  }),
});

export const notes = pgTable("note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id")
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  metadata: json("metadata")
    .$type<{
      tags?: string[];
      mood?: string;
      location?: string;
      dateOfMemory?: string;
      recipients?: string[];
      unlockDate?: string;
    }>()
    .default({}),
});

export const documents = pgTable("document", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  ownerId: text("owner_id")
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  metadata: json("metadata").$type<CommonFileMetadata>().default({
    size: 0,
    mimeType: "",
    originalName: "",
    uploadedAt: new Date().toISOString(),
  }),
});

export const MEMORY_TYPES = ["image", "document", "note"] as const;
export const ACCESS_LEVELS = ["read", "write"] as const;
export const GROUP_TYPES = ["family", "friends", "work", "custom"] as const;
export const MEMBER_ROLES = ["admin", "member"] as const;

export const RELATIONSHIP_TYPES = ["friend", "colleague", "acquaintance", "family", "other"] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_STATUS = ["pending", "accepted", "declined"] as const;
export type RelationshipStatus = (typeof RELATIONSHIP_STATUS)[number];

export const FAMILY_RELATIONSHIP_ROLES = [
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
] as const;
export type FamilyRelationshipRole = (typeof FAMILY_RELATIONSHIP_ROLES)[number];

export const memoryShares = pgTable("memory_share", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  memoryId: text("memory_id").notNull(), // The ID of the memory (e.g., image, note, document)
  memoryType: text("memory_type", { enum: MEMORY_TYPES }).notNull(), // Type of memory (e.g., "image", "note", "document")
  ownerId: text("owner_id") // The user who originally created (or owns) the memory
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  sharedWithType: text("shared_with_type").notNull(), // "user" or "group"
  sharedWithId: text("shared_with_id") // ID of the user or group the memory is shared with
    .notNull()
    .references(() => allUsers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  accessLevel: text("access_level", { enum: ACCESS_LEVELS }).default("read").notNull(),
});

export const group = pgTable("group", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(), // Added this
  metadata: json("metadata")
    .$type<{
      description?: string;
      type?: (typeof GROUP_TYPES)[number];
    }>()
    .default({}),
});

export const groupMember = pgTable(
  "group_member",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: MEMBER_ROLES }).default("member").notNull(),
  },
  (groupMember) => [
    primaryKey({
      columns: [groupMember.groupId, groupMember.userId],
    }),
  ]
);

export const relationship = pgTable(
  "relationship",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => allUsers.id, { onDelete: "cascade" }),
    relatedUserId: text("related_user_id")
      .notNull()
      .references(() => allUsers.id, { onDelete: "cascade" }),
    type: text("type", { enum: RELATIONSHIP_TYPES }).notNull(),
    status: text("status", { enum: RELATIONSHIP_STATUS }).default("pending").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("unique_relation_idx").on(t.userId, t.relatedUserId)]
);

export const familyRelationship = pgTable("family_relationship", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  relationshipId: text("relationship_id")
    .notNull()
    .references(() => relationship.id, { onDelete: "cascade" }),
  familyRole: text("family_role", { enum: FAMILY_RELATIONSHIP_ROLES }).notNull(),
  // New: Fuzziness Indicator
  relationshipClarity: text("relationship_clarity", {
    enum: ["resolved", "fuzzy"],
  })
    .default("fuzzy")
    .notNull(),
  // New: Store the common ancestor if known
  sharedAncestorId: text("shared_ancestor_id").references(() => allUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Enum for primary relationships
export const PRIMARY_RELATIONSHIP_ROLES = ["son", "daughter", "father", "mother", "sibling", "spouse"] as const;
export type PrimaryRelationshipRole = (typeof PRIMARY_RELATIONSHIP_ROLES)[number];

export const familyMember = pgTable(
  "family_member",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // The owner of the family tree (the user who created the record)
    ownerId: text("owner_id")
      .notNull()
      .references(() => allUsers.id, { onDelete: "cascade" }),

    // If this family member is a registered user, link them here (optional)
    userId: text("user_id").references(() => allUsers.id, { onDelete: "set null" }),

    // Basic information
    fullName: text("full_name").notNull(),

    // Primary (resolved) relationship: e.g. "son", "father", etc.
    primaryRelationship: text("primary_relationship", { enum: PRIMARY_RELATIONSHIP_ROLES }).notNull(),

    // Fuzzy relationships: an array of strings (e.g. ["grandfather"])
    // Requires Postgres array support via pgArray.
    fuzzyRelationships: text("fuzzy_relationships", { enum: FAMILY_RELATIONSHIP_ROLES }).array().notNull().default([]),

    // Additional details for the family member
    birthDate: timestamp("birth_date", { mode: "date" }),
    deathDate: timestamp("death_date", { mode: "date" }),
    birthplace: text("birthplace"),

    // Optional metadata field for extra details
    metadata: json("metadata").$type<{ notes?: string }>().default({}),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // Optional foreign key constraints (if needed) for userId can be defined here.
    foreignKey({
      columns: [table.userId],
      foreignColumns: [allUsers.id],
      name: "family_member_user_fk",
    }),
  ]
);

// Type definitions for Auth.js
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Type inference helpers
export type DBUser = typeof users.$inferSelect;
export type NewDBUser = typeof users.$inferInsert;

export type DBAllUser = typeof allUsers.$inferSelect;
export type NewDBAllUser = typeof allUsers.$inferInsert;

export type DBTemporaryUser = typeof temporaryUsers.$inferSelect;
export type NewDBTemporaryUser = typeof temporaryUsers.$inferInsert;

export type DBAccount = typeof accounts.$inferSelect;
export type NewDBAccount = typeof accounts.$inferInsert;

export type DBSession = typeof sessions.$inferSelect;
export type NewDBSession = typeof sessions.$inferInsert;

export type DBImage = typeof images.$inferSelect;
export type NewDBImage = typeof images.$inferInsert;

export type DBDocument = typeof documents.$inferSelect;
export type NewDBDocument = typeof documents.$inferInsert;

export type DBNote = typeof notes.$inferSelect;
export type NewDBNote = typeof notes.$inferInsert;

export type DBMemoryShare = typeof memoryShares.$inferSelect;
export type NewDBMemoryShare = typeof memoryShares.$inferInsert;

export type DBGroup = typeof group.$inferSelect;
export type NewDBGroup = typeof group.$inferInsert;

export type DBGroupMember = typeof groupMember.$inferSelect;
export type NewDBGroupMember = typeof groupMember.$inferInsert;

// Type helpers for the enums
export type MemoryType = (typeof MEMORY_TYPES)[number];
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
export type GroupType = (typeof GROUP_TYPES)[number];
export type MemberRole = (typeof MEMBER_ROLES)[number];

export type DBRelationship = typeof relationship.$inferSelect;
export type DBFamilyRelationship = typeof familyRelationship.$inferSelect;
