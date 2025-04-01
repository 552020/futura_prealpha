import { seedTenenbaum } from "./fixtures/tenenbaum";

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Seed Tenenbaum family data
    await seedTenenbaum();

    console.log("✅ Database seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
main();
