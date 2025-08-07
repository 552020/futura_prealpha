import { pgTable, text, timestamp, json } from "drizzle-orm/pg-core";

// Basic application tables - no auth or memory functionality
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
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

// Type inference helpers
export type DBUser = typeof users.$inferSelect;
export type NewDBUser = typeof users.$inferInsert;
