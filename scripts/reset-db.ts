import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Use the unpooled connection for schema operations
const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL_UNPOOLED is not defined in environment variables");
}

async function resetDatabase() {
  try {
    const sql = neon(DATABASE_URL!);
    // const db = drizzle(sql);

    console.log("Dropping schema...");
    await sql`DROP SCHEMA public CASCADE;`;

    console.log("Creating new schema...");
    await sql`CREATE SCHEMA public;`;

    console.log("Schema successfully reset");

    // Close the connection
    process.exit(0);
  } catch (error) {
    console.error("Error resetting schema:", error);
    process.exit(1);
  }
}

resetDatabase();
