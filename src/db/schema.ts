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
  PgArray,
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
    //   invitedBy: text("invited_by").references(() => users.id, { onDelete: "set null" }), // Who invited this user
    // https://orm.drizzle.team/docs/indexes-constraints#foreign-key
    invitedBy: text("invited_by"), // No `.references()` here!
    invitedAt: timestamp("invited_at"), // When the invitation was sent
    registrationStatus: text("registration_status", {
      enum: ["pending", "visited", "initiated", "completed", "declined", "expired"],
    })
      .default("pending")
      .notNull(), // Tracks signup progress

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
      columns: [table.invitedBy],
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
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
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

// Application tables
export const images = pgTable("image", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  title: text("title"),
  description: text("description"),
  metadata: json("metadata")
    .$type<{
      size?: number;
      format?: string;
      dimensions?: { width: number; height: number };
      dateOfMemory?: string;
      peopleInImage?: string[];
    }>()
    .default({}),
});

export const notes = pgTable("note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title"),
  description: text("description"),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  metadata: json("metadata")
    .$type<{
      size?: number;
      format?: string;
      dateOfMemory?: string;
    }>()
    .default({}),
});

// export const fileShares = pgTable("file_share", {
//   id: text("id")
//     .primaryKey()
//     .$defaultFn(() => crypto.randomUUID()),
//   fileId: text("file_id").notNull(),
//   fileType: text("file_type").notNull(),
//   userId: text("user_id")
//     .notNull()
//     .references(() => users.id, { onDelete: "cascade" }),
//   sharedByUserId: text("shared_by_user_id")
//     .notNull()
//     .references(() => users.id, { onDelete: "cascade" }),
//   createdAt: timestamp("created_at").defaultNow().notNull(),
//   accessLevel: text("access_level").default("read").notNull(),
// });

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
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithType: text("shared_with_type").notNull(), // "user" or "group"
  sharedWithId: text("shared_with_id").notNull(), // ID of the user or group the memory is shared with
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
  (groupMember) => ({
    compositePk: primaryKey({
      columns: [groupMember.groupId, groupMember.userId],
    }),
  })
);

export const relationship = pgTable(
  "relationship",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    relatedUserId: text("related_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: RELATIONSHIP_TYPES }).notNull(),
    status: text("status", { enum: RELATIONSHIP_STATUS }).default("pending").notNull(),
    note: text("note"), // Optional custom label or note
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueRelation: uniqueIndex("unique_relation_idx").on(table.userId, table.relatedUserId),
  })
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
  sharedAncestorId: text("shared_ancestor_id").references(() => users.id, { onDelete: "set null" }),
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
      .references(() => users.id, { onDelete: "cascade" }),

    // If this family member is a registered user, link them here (optional)
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),

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
      foreignColumns: [users.id],
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
