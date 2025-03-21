import { pgTable, text, timestamp, json, boolean, primaryKey, integer } from "drizzle-orm/pg-core";
import type { DefaultSession } from "next-auth";
// import type { AdapterAccount } from "@auth/core/adapters";
import type { AdapterAccount } from "next-auth/adapters";
// Users table - Core user data - required for auth.js
export const users = pgTable("user", {
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
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: text("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false),
  metadata: json("metadata")
    .$type<{
      originalName?: string;
      encoding?: string;
      description?: string;
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

export const memoryShares = pgTable("memory_share", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  memoryId: text("memory_id").notNull(), // The ID of the memory (e.g., image, note, document)
  memoryType: text("memory_type").notNull(), // Type of memory (e.g., "image", "note", "document")
  ownerId: text("owner_id") // The user who originally created (or owns) the memory
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithType: text("shared_with_type").notNull(), // "user" or "group"
  sharedWithId: text("shared_with_id").notNull(), // ID of the user or group the memory is shared with
  createdAt: timestamp("created_at").defaultNow().notNull(),
  accessLevel: text("access_level").default("read").notNull(),
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
      type?: "family" | "friends" | "work" | "custom";
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
  },
  (groupMember) => ({
    compositePk: primaryKey({
      columns: [groupMember.groupId, groupMember.userId],
    }),
  })
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
