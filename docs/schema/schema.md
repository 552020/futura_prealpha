# schema.ts WIP

```ts
import { pgTable, text, timestamp, json, boolean, primaryKey, integer, pgEnum } from "drizzle-orm/pg-core";
import type { DefaultSession } from "next-auth";
// import type { AdapterAccount } from "@auth/core/adapters";
import type { AdapterAccount } from "next-auth/adapters";
// Users table - Core user data
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").unique().notNull(),
  username: text("username").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  name: text("name"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  birthDate: timestamp("birth_date", { mode: "date" }),
  gender: text("gender"),
  pronouns: text("pronouns"),
  metadata: json("metadata")
    .$type<{
      coverPhoto?: string;
      theme?: string;
      profileVisibility?: "public" | "connections" | "private";
      birthdayVisibility?: "full" | "month-day" | "none";
      notificationPreferences?: {
        email?: boolean;
        push?: boolean;
      };
      accountType?: "standard" | "premium";
      verificationStatus?: "verified" | "pending" | "unverified";
    }>()
    .default({}),
});

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

// Application tables
export const photos = pgTable("photos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true),
  metadata: json("metadata")
    .$type<{
      size?: number;
      format?: string;
      dimensions?: {
        width: number;
        height: number;
      };
    }>()
    .default({}),
});

export const texts = pgTable("texts", {
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
  isPublic: boolean("is_public").default(true),
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

export const files = pgTable("files", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true),
  metadata: json("metadata")
    .$type<{
      originalName?: string;
      encoding?: string;
      description?: string;
    }>()
    .default({}),
});

// Add this to your schema
export const fileShares = pgTable("file_shares", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fileId: text("file_id").notNull(),
  fileType: text("file_type").notNull(), // "photo", "file", "text"
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedByUserId: text("shared_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  accessLevel: text("access_level").default("read").notNull(),
});

// Relationship type enum with comprehensive family and social connections
export const relationshipType = pgEnum("relationship_type", [
  // Immediate Family
  "parent",
  "father",
  "mother",
  "child",
  "son",
  "daughter",
  "sibling",
  "brother",
  "sister",

  // Extended Family
  "grandparent",
  "grandfather",
  "grandmother",
  "grandchild",
  "grandson",
  "granddaughter",
  "uncle",
  "aunt",
  "nephew",
  "niece",
  "cousin",
  "cousin_maternal",
  "cousin_paternal",

  // Marriage & Partnerships
  "spouse",
  "husband",
  "wife",
  "partner",

  // In-Laws
  "parent_in_law",
  "father_in_law",
  "mother_in_law",
  "child_in_law",
  "son_in_law",
  "daughter_in_law",
  "sibling_in_law",
  "brother_in_law",
  "sister_in_law",

  // Step-Family
  "step_parent",
  "step_father",
  "step_mother",
  "step_child",
  "step_son",
  "step_daughter",
  "step_sibling",
  "step_brother",
  "step_sister",

  // Other Significant Relationships
  "mentor",
  "guardian",
  "godparent",
  "godfather",
  "godmother",
  "godchild",
  "godson",
  "goddaughter",
  "friend",
  "acquaintance",
]);

// Relationship table to track connections between users
export const relationships = pgTable("relationship", {
  // MANDATORY FIELDS:
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Who is creating this relationship definition
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Who they're related to
  relatedUserId: text("related_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // Type of relationship
  relationshipType: relationshipType.notNull(),

  // Record timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),

  // OPTIONAL FIELDS:
  // For tracking transitive relationships (e.g., cousins through a common grandparent)
  throughParentId: text("through_parent_id").references(() => users.id, { onDelete: "set null" }),

  // Custom grouping for sharing purposes
  groupName: text("group_name"),

  // Certainty level of the relationship
  fuzziness: text("fuzziness").default("fuzzy"),

  // Whether the relationship has been confirmed by the related user
  accepted: boolean("accepted").default(false),

  // When relationship was last modified
  updatedAt: timestamp("updated_at").defaultNow(),

  // Additional relationship information
  metadata: json("metadata")
    .$type<{
      notes?: string;
      visibility?: "public" | "connections" | "private";
      customPermissions?: {
        canViewPhotos?: boolean;
        canViewFiles?: boolean;
        canViewTexts?: boolean;
      };
    }>()
    .default({}),
});

// Type definitions for Auth.js
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Type inference helpers
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type Text = typeof texts.$inferSelect;
export type NewText = typeof texts.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type Relationship = typeof relationships.$inferSelect;
export type NewRelationship = typeof relationships.$inferInsert;
```
