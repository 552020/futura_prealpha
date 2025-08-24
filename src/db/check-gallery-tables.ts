import { db } from "./db";
import { sql } from "drizzle-orm";

async function checkGalleryTables() {
  try {
    console.log("🔍 Checking if gallery tables exist...");
    
    // Check if gallery table exists
    const galleryExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gallery'
      );
    `);
    
    console.log("Gallery table exists:", galleryExists[0]?.exists);
    
    // Check if gallery_item table exists
    const galleryItemExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gallery_item'
      );
    `);
    
    console.log("Gallery_item table exists:", galleryItemExists[0]?.exists);
    
    if (galleryExists[0]?.exists && galleryItemExists[0]?.exists) {
      console.log("✅ Both gallery tables exist!");
    } else {
      console.log("❌ Gallery tables are missing!");
    }
    
  } catch (error) {
    console.error("Error checking gallery tables:", error);
  }
}

checkGalleryTables();
