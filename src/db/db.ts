import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "./schema"; // Import your schema

config({ path: ".env.local" }); // or .env.local

if (typeof window !== "undefined") {
  throw new Error("❌ db.ts should NEVER be imported in a client component!");
}

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing! Make sure it's set in .env.local");
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema }); // Pass schema as second parameter
