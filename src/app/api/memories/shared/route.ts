import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, desc, sql } from "drizzle-orm";
import { memoryShares, allUsers, images, documents, notes } from "@/db/schema";
import type { DBImage, DBDocument, DBNote } from "@/db/schema";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First get the allUserId for the authenticated user
    const allUserRecord = await db.query.allUsers.findFirst({
      where: eq(allUsers.userId, session.user.id),
    });

    if (!allUserRecord) {
      console.error("No allUsers record found for user:", session.user.id);
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // Get all memory shares for this user
    const shares = await db.query.memoryShares.findMany({
      where: eq(memoryShares.sharedWithId, allUserRecord.id),
      orderBy: desc(memoryShares.createdAt),
    });

    // Group shares by memory type
    const imageShares = shares.filter((share) => share.memoryType === "image");
    const documentShares = shares.filter((share) => share.memoryType === "document");
    const noteShares = shares.filter((share) => share.memoryType === "note");

    // Fetch the actual memories
    const sharedImages = await Promise.all(
      imageShares.map(async (share) => {
        const image = await db.query.images.findFirst({
          where: eq(images.id, share.memoryId),
        });
        if (!image) return null;

        // Get total share count for this memory
        const shareCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(memoryShares)
          .where(eq(memoryShares.memoryId, share.memoryId));

        return {
          ...image,
          sharedBy: {
            id: share.ownerId,
            name: await getOwnerName(share.ownerId),
          },
          accessLevel: share.accessLevel,
          status: "shared" as const,
          sharedWithCount: shareCount[0].count,
        };
      })
    );

    const sharedDocuments = await Promise.all(
      documentShares.map(async (share) => {
        const document = await db.query.documents.findFirst({
          where: eq(documents.id, share.memoryId),
        });
        if (!document) return null;

        // Get total share count for this memory
        const shareCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(memoryShares)
          .where(eq(memoryShares.memoryId, share.memoryId));

        return {
          ...document,
          sharedBy: {
            id: share.ownerId,
            name: await getOwnerName(share.ownerId),
          },
          accessLevel: share.accessLevel,
          status: "shared" as const,
          sharedWithCount: shareCount[0].count,
        };
      })
    );

    const sharedNotes = await Promise.all(
      noteShares.map(async (share) => {
        const note = await db.query.notes.findFirst({
          where: eq(notes.id, share.memoryId),
        });
        if (!note) return null;

        // Get total share count for this memory
        const shareCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(memoryShares)
          .where(eq(memoryShares.memoryId, share.memoryId));

        return {
          ...note,
          sharedBy: {
            id: share.ownerId,
            name: await getOwnerName(share.ownerId),
          },
          accessLevel: share.accessLevel,
          status: "shared" as const,
          sharedWithCount: shareCount[0].count,
        };
      })
    );

    // Filter out null values and apply pagination
    const filteredImages = sharedImages.filter(Boolean).slice(offset, offset + limit);
    const filteredDocuments = sharedDocuments.filter(Boolean).slice(offset, offset + limit);
    const filteredNotes = sharedNotes.filter(Boolean).slice(offset, offset + limit);

    return NextResponse.json({
      images: filteredImages,
      documents: filteredDocuments,
      notes: filteredNotes,
      total: sharedImages.length + sharedDocuments.length + sharedNotes.length,
      hasMore: offset + limit < sharedImages.length + sharedDocuments.length + sharedNotes.length,
    });
  } catch (error) {
    console.error("Error listing shared memories:", error);
    return NextResponse.json({ error: "Failed to list shared memories" }, { status: 500 });
  }
}

async function getOwnerName(ownerId: string): Promise<string> {
  const owner = await db.query.allUsers.findFirst({
    where: eq(allUsers.id, ownerId),
  });

  if (!owner) return "Unknown";

  if (owner.type === "user" && owner.userId) {
    const user = await db.query.users.findFirst({
      where: eq(allUsers.id, owner.userId),
    });
    return user?.name || "Unknown";
  } else if (owner.type === "temporary" && owner.temporaryUserId) {
    const tempUser = await db.query.temporaryUsers.findFirst({
      where: eq(allUsers.id, owner.temporaryUserId),
    });
    return tempUser?.name || "Unknown";
  }

  return "Unknown";
}
