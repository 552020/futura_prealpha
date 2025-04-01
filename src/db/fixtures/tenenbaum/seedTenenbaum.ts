import { db } from "@/db/db";
import { allUsers, users, images, notes, documents, memoryShares, videos } from "@/db/schema";
import { faker } from "@faker-js/faker";
import { eq, inArray } from "drizzle-orm";
import { uploadFileToStorage, validateFile, storeInDatabase } from "@/app/api/memories/upload/utils";
import { join } from "path";
import { readFileSync } from "fs";
import margotData from "./margot.json" assert { type: "json" };
import richieData from "./richie.json" assert { type: "json" };
import chasData from "./chas.json" assert { type: "json" };
import wesData from "./wes.json" assert { type: "json" };
import eliData from "./eli.json" assert { type: "json" };

type MemoryType = "image" | "document" | "note" | "video";

interface Memory {
  type: MemoryType;
  title: string;
  description?: string;
  url?: string;
  content?: string;
  file?: string;
  isPublic?: boolean;
}

interface UserData {
  user: {
    name: string;
    email: string;
    username: string;
    password: string;
    image?: string;
  };
  memories: Memory[];
}

async function uploadAsset(filename: string): Promise<string> {
  const assetPath = join(__dirname, "..", "assets", "tenenbaum", filename);
  try {
    const buffer = readFileSync(assetPath);
    const file = new File([buffer], filename, { type: "image/jpeg" }); // We'll need to determine proper mime type
    const validationResult = await validateFile(file);
    if (!validationResult.isValid) {
      throw new Error(`Invalid file: ${validationResult.error}`);
    }
    return await uploadFileToStorage(file, validationResult.buffer);
  } catch (error) {
    console.error(`Failed to upload asset ${filename}:`, error);
    throw error;
  }
}

async function createUser(userData: UserData) {
  // Upload profile image if exists
  let imageUrl = userData.user.image;
  if (imageUrl) {
    imageUrl = await uploadAsset(imageUrl);
  }

  // Create user record
  const [user] = await db
    .insert(users)
    .values({
      id: faker.string.uuid(),
      email: userData.user.email,
      name: userData.user.name,
      username: userData.user.username,
      password: userData.user.password,
      image: imageUrl,
    })
    .returning();

  // Create allUsers record
  const [allUser] = await db
    .insert(allUsers)
    .values({
      id: faker.string.uuid(),
      type: "user",
      userId: user.id,
    })
    .returning();

  return { user, allUser };
}

async function createMemory(memory: Memory, ownerId: string) {
  switch (memory.type) {
    case "image":
      if (!memory.url) throw new Error("Image URL is required");
      const imageUrl = await uploadAsset(memory.url);
      const [image] = await db
        .insert(images)
        .values({
          id: faker.string.uuid(),
          ownerId,
          url: imageUrl,
          title: memory.title,
          description: memory.description,
          ownerSecureCode: faker.string.alphanumeric(12),
        })
        .returning();
      return { id: image.id, type: "image" as const };

    case "note":
      const [note] = await db
        .insert(notes)
        .values({
          id: faker.string.uuid(),
          ownerId,
          title: memory.title,
          content: memory.content || "",
          ownerSecureCode: faker.string.alphanumeric(12),
        })
        .returning();
      return { id: note.id, type: "note" as const };

    case "document":
      if (!memory.file) throw new Error("Document file is required");
      const documentUrl = await uploadAsset(memory.file);
      const [document] = await db
        .insert(documents)
        .values({
          id: faker.string.uuid(),
          ownerId,
          url: documentUrl,
          title: memory.title,
          description: memory.description,
          mimeType: "application/pdf", // We should determine this from the file
          size: "1024", // We should get the actual file size
          ownerSecureCode: faker.string.alphanumeric(12),
        })
        .returning();
      return { id: document.id, type: "document" as const };

    case "video":
      if (!memory.url) throw new Error("Video URL is required");
      const videoUrl = await uploadAsset(memory.url);
      const [video] = await db
        .insert(videos)
        .values({
          id: faker.string.uuid(),
          ownerId,
          url: videoUrl,
          title: memory.title,
          description: memory.description,
          mimeType: "video/mp4", // We should determine this from the file
          size: "1024", // We should get the actual file size
          ownerSecureCode: faker.string.alphanumeric(12),
        })
        .returning();
      return { id: video.id, type: "video" as const };

    default:
      throw new Error(`Unsupported memory type: ${memory.type}`);
  }
}

async function shareMemory(memoryId: string, memoryType: MemoryType, ownerId: string, sharedWithId: string) {
  await db.insert(memoryShares).values({
    id: faker.string.uuid(),
    memoryId,
    memoryType,
    ownerId,
    sharedWithType: "user",
    sharedWithId,
    accessLevel: "read",
    inviteeSecureCode: faker.string.alphanumeric(12),
  });
}

export async function seedTenenbaum() {
  console.log("🌱 Seeding Tenenbaum family data...");

  try {
    // Safety check - only proceed if these are test emails
    const tenenBaumEmails = [
      "margot@tenenbaum.com",
      "richie@tenenbaum.com",
      "chas@tenenbaum.com",
      "wes@tenenbaum.com",
      "eli@cash.com",
    ];

    // Clean up only Tenenbaum-related test data
    console.log("🧹 Cleaning up existing Tenenbaum test data...");

    // First get the user IDs
    const existingUsers = await db.select().from(users).where(inArray(users.email, tenenBaumEmails));

    const userIds = existingUsers.map((user) => user.id);

    // Get allUsers records for these users
    const existingAllUsers = await db.select().from(allUsers).where(inArray(allUsers.userId, userIds));

    const allUserIds = existingAllUsers.map((user) => user.id);

    // Delete related data in correct order
    if (allUserIds.length > 0) {
      await db.delete(memoryShares).where(inArray(memoryShares.ownerId, allUserIds));
      await db.delete(images).where(inArray(images.ownerId, allUserIds));
      await db.delete(documents).where(inArray(documents.ownerId, allUserIds));
      await db.delete(notes).where(inArray(notes.ownerId, allUserIds));
    }

    if (userIds.length > 0) {
      await db.delete(allUsers).where(inArray(allUsers.userId, userIds));
      await db.delete(users).where(inArray(users.id, userIds));
    }

    console.log("✅ Tenenbaum test data cleaned");

    // Create users
    console.log("👥 Creating Tenenbaum users...");
    const margot = await createUser(margotData as UserData);
    const richie = await createUser(richieData as UserData);
    const chas = await createUser(chasData as UserData);
    const wes = await createUser(wesData as UserData);
    const eli = await createUser(eliData as UserData);
    console.log("✅ Tenenbaum users created");

    // Create memories for each user
    const margotMemories = await Promise.all(
      margotData.memories.map((memory) => createMemory(memory as Memory, margot.allUser.id))
    );

    const richieMemories = await Promise.all(
      richieData.memories.map((memory) => createMemory(memory as Memory, richie.allUser.id))
    );

    const chasMemories = await Promise.all(
      chasData.memories.map((memory) => createMemory(memory as Memory, chas.allUser.id))
    );

    const wesMemories = await Promise.all(
      wesData.memories.map((memory) => createMemory(memory as Memory, wes.allUser.id))
    );

    const eliMemories = await Promise.all(
      eliData.memories.map((memory) => createMemory(memory as Memory, eli.allUser.id))
    );

    // Share memories according to the new relationships

    // Richard's tent photo shared with Margot
    await shareMemory(richieMemories[0].id, richieMemories[0].type, richie.allUser.id, margot.allUser.id);

    // Wes's mp4 shared with Richard and Margot
    await shareMemory(wesMemories[0].id, wesMemories[0].type, wes.allUser.id, richie.allUser.id);
    await shareMemory(wesMemories[0].id, wesMemories[0].type, wes.allUser.id, margot.allUser.id);

    // Richard's meltdown photo shared with Margot
    await shareMemory(richieMemories[1].id, richieMemories[1].type, richie.allUser.id, margot.allUser.id);

    // Margot's secret umbrellas shared with Eli and Richard
    await shareMemory(margotMemories[0].id, margotMemories[0].type, margot.allUser.id, eli.allUser.id);
    await shareMemory(margotMemories[0].id, margotMemories[0].type, margot.allUser.id, richie.allUser.id);

    // Eli's Custer reviews shared with Margot
    await shareMemory(eliMemories[0].id, eliMemories[0].type, eli.allUser.id, margot.allUser.id);
    await shareMemory(eliMemories[1].id, eliMemories[1].type, eli.allUser.id, margot.allUser.id);

    console.log("✅ Tenenbaum family data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding Tenenbaum family data:", error);
    throw error;
  }
}
