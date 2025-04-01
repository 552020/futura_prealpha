import { db } from "@/db/db";
import { memoryShares, images, notes, documents, allUsers, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSharedMemories(userId: string) {
  const sharedMemories = await db
    .select({
      id: memoryShares.memoryId,
      type: memoryShares.memoryType,
      title: images.title,
      thumbnailUrl: images.url,
      createdAt: images.createdAt,
      ownerId: memoryShares.ownerId,
      sharedBy: {
        id: users.id,
        name: users.name,
        avatarUrl: users.image,
      },
    })
    .from(memoryShares)
    .innerJoin(images, eq(memoryShares.memoryId, images.id))
    .innerJoin(allUsers, eq(memoryShares.ownerId, allUsers.id))
    .innerJoin(users, eq(allUsers.userId, users.id))
    .where(eq(memoryShares.sharedWithId, userId))
    .orderBy(images.createdAt);

  return sharedMemories;
}
