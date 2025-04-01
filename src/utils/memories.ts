import { allUsers, users, images, memoryShares, videos, documents, notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";

export async function getSharedMemories(userId: string) {
  // Get all memory shares for this user
  const shares = await db.query.memoryShares.findMany({
    where: eq(memoryShares.sharedWithId, userId),
  });

  // Group shares by memory type
  const imageShares = shares.filter((share) => share.memoryType === "image");
  const videoShares = shares.filter((share) => share.memoryType === "video");
  const documentShares = shares.filter((share) => share.memoryType === "document");
  const noteShares = shares.filter((share) => share.memoryType === "note");

  // Fetch the actual memories
  const sharedImages = await Promise.all(
    imageShares.map(async (share) => {
      const image = await db.query.images.findFirst({
        where: eq(images.id, share.memoryId),
      });
      if (!image) return null;

      return {
        id: share.memoryId,
        type: share.memoryType,
        title: image.title,
        thumbnailUrl: image.url,
        createdAt: image.createdAt,
        ownerId: share.ownerId,
        sharedBy: {
          id: share.ownerId,
          name: await getOwnerName(share.ownerId),
        },
      };
    })
  );

  const sharedVideos = await Promise.all(
    videoShares.map(async (share) => {
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, share.memoryId),
      });
      if (!video) return null;

      return {
        id: share.memoryId,
        type: share.memoryType,
        title: video.title,
        thumbnailUrl: video.url,
        createdAt: video.createdAt,
        ownerId: share.ownerId,
        sharedBy: {
          id: share.ownerId,
          name: await getOwnerName(share.ownerId),
        },
      };
    })
  );

  const sharedDocuments = await Promise.all(
    documentShares.map(async (share) => {
      const document = await db.query.documents.findFirst({
        where: eq(documents.id, share.memoryId),
      });
      if (!document) return null;

      return {
        id: share.memoryId,
        type: share.memoryType,
        title: document.title,
        thumbnailUrl: document.url,
        createdAt: document.createdAt,
        ownerId: share.ownerId,
        sharedBy: {
          id: share.ownerId,
          name: await getOwnerName(share.ownerId),
        },
      };
    })
  );

  const sharedNotes = await Promise.all(
    noteShares.map(async (share) => {
      const note = await db.query.notes.findFirst({
        where: eq(notes.id, share.memoryId),
      });
      if (!note) return null;

      return {
        id: share.memoryId,
        type: share.memoryType,
        title: note.title,
        createdAt: note.createdAt,
        ownerId: share.ownerId,
        sharedBy: {
          id: share.ownerId,
          name: await getOwnerName(share.ownerId),
        },
      };
    })
  );

  // Filter out null values and combine all memories
  return {
    images: sharedImages.filter(Boolean),
    videos: sharedVideos.filter(Boolean),
    documents: sharedDocuments.filter(Boolean),
    notes: sharedNotes.filter(Boolean),
  };
}

async function getOwnerName(ownerId: string): Promise<string> {
  const owner = await db.query.allUsers.findFirst({
    where: eq(allUsers.id, ownerId),
  });

  if (!owner) return "Unknown";

  if (owner.type === "user" && owner.userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, owner.userId),
    });
    return user?.name || "Unknown";
  }

  return "Unknown";
}
