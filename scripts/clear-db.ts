import { db } from "@/db/db";
import { photos, files, texts } from "@/db/schema"; // import your table schemas

async function clearDatabase() {
  try {
    // Delete all records from each table
    await db.delete(photos);
    await db.delete(files);
    await db.delete(texts);

    console.log("Database cleared successfully");
  } catch (error) {
    console.error("Error clearing database:", error);
  }
}

clearDatabase();
