import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../.env.local";

// Use the unpooled connection for schema operations
const DATABASE_URL =
  process.env.DATABASE_URL_UNPOOLED ||
  "postgresql://neondb_owner:npg_WDbjeXO39LKF@ep-withered-sunset-a23i96jq.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function resetDatabase() {
  try {
    const sql = neon(DATABASE_URL);
    const db = drizzle(sql);

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
