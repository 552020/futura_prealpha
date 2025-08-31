import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { memoryPresence, storageEdges } from "./src/db/schema";

// Load environment variables
config({ path: ".env.local" });

async function testMemoryPresenceView() {
  console.log("🧪 Testing memory_presence view...");

  const sql = neon(process.env.DATABASE_URL_UNPOOLED!);
  const db = drizzle(sql);

  try {
    // First, let's insert some test data
    const testMemoryId = "770e8400-e29b-41d4-a716-446655440002";
    
    console.log("1️⃣ Inserting test data...");
    
    const testEdges = [
      {
        memoryId: testMemoryId,
        memoryType: "image" as const,
        artifact: "metadata" as const,
        backend: "neon-db" as const,
        present: true,
        location: "neon://test/metadata",
        contentHash: "sha256:test123",
        sizeBytes: 512,
        syncState: "idle" as const,
      },
      {
        memoryId: testMemoryId,
        memoryType: "image" as const,
        artifact: "asset" as const,
        backend: "vercel-blob" as const,
        present: true,
        location: "blob://test/asset.jpg",
        contentHash: "sha256:test456",
        sizeBytes: 1024,
        syncState: "idle" as const,
      },
      {
        memoryId: testMemoryId,
        memoryType: "image" as const,
        artifact: "metadata" as const,
        backend: "icp-canister" as const,
        present: false,
        location: null,
        contentHash: null,
        sizeBytes: null,
        syncState: "migrating" as const,
      }
    ];

    for (const edge of testEdges) {
      await db.insert(storageEdges).values(edge);
    }
    console.log("✅ Test data inserted");

    // Now test the view
    console.log("\n2️⃣ Testing memory_presence view...");
    const viewResult = await db.select().from(memoryPresence);
    console.log("✅ View query successful");
    console.log("📊 View results:", viewResult);

    // Test specific memory
    console.log("\n3️⃣ Testing view for specific memory...");
    const specificMemory = await db
      .select()
      .from(memoryPresence)
      .where(sql`memory_id = ${testMemoryId}`);
    
    console.log("✅ Specific memory query successful");
    console.log("📊 Specific memory result:", specificMemory);

    if (specificMemory.length > 0) {
      const memory = specificMemory[0];
      console.log("\n📋 Memory presence summary:");
      console.log(`   Memory ID: ${memory.memory_id}`);
      console.log(`   Memory Type: ${memory.memory_type}`);
      console.log(`   Metadata on Neon: ${memory.meta_neon ? "✅" : "❌"}`);
      console.log(`   Asset on Blob: ${memory.asset_blob ? "✅" : "❌"}`);
      console.log(`   Metadata on ICP: ${memory.meta_icp ? "✅" : "❌"}`);
      console.log(`   Asset on ICP: ${memory.asset_icp ? "✅" : "❌"}`);
    }

    // Clean up
    console.log("\n4️⃣ Cleaning up test data...");
    await db.delete(storageEdges).where(sql`memory_id = ${testMemoryId}`);
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 memory_presence view test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test
testMemoryPresenceView()
  .then(() => {
    console.log("\n✅ All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
