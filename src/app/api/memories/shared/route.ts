import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { allUsers, images, notes, documents, memoryShares, videos } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * GET /api/memories/shared
 *
 * Retrieves shared memories for the authenticated user or temporary user.
 *
 * Authentication:
 * - For authenticated users: Uses the session userId to find their allUserId
 * - For temporary users: Requires allUserId in the request body
 *
 * Request body (for temporary users):
 * {
 *   "allUserId": string // The allUserId of the temporary user
 * }
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  let allUserId: string;

  if (session?.user?.id) {
    // Handle authenticated user
    const allUserRecord = await db.query.allUsers.findFirst({
      where: eq(allUsers.userId, session.user.id),
    });

    if (!allUserRecord) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    allUserId = allUserRecord.id;
  } else {
    // Handle temporary user - get allUserId from request body
    const body = await request.json();
    if (!body?.allUserId) {
      return NextResponse.json(
        { error: "For temporary users, allUserId must be provided in the request body" },
        { status: 401 }
      );
    }

    // Verify the allUserId exists
    const tempUserRecord = await db.query.allUsers.findFirst({
      where: eq(allUsers.id, body.allUserId),
    });

    if (!tempUserRecord) {
      return NextResponse.json({ error: "Invalid temporary user ID" }, { status: 404 });
    }

    allUserId = body.allUserId;
  }

  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // Get all memory shares for this user
    const shares = await db.query.memoryShares.findMany({
      where: eq(memoryShares.sharedWithId, allUserId),
      orderBy: desc(memoryShares.createdAt),
    });

    // Group shares by memory type
    const imageShares = shares.filter((share) => share.memoryType === "image");
    const documentShares = shares.filter((share) => share.memoryType === "document");
    const noteShares = shares.filter((share) => share.memoryType === "note");
    const videoShares = shares.filter((share) => share.memoryType === "video");

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

    const sharedVideos = await Promise.all(
      videoShares.map(async (share) => {
        const video = await db.query.videos.findFirst({
          where: eq(videos.id, share.memoryId),
        });
        if (!video) return null;

        // Get total share count for this memory
        const shareCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(memoryShares)
          .where(eq(memoryShares.memoryId, share.memoryId));

        return {
          ...video,
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
    const filteredVideos = sharedVideos.filter(Boolean).slice(offset, offset + limit);

    return NextResponse.json({
      images: filteredImages,
      documents: filteredDocuments,
      notes: filteredNotes,
      videos: filteredVideos,
      total: sharedImages.length + sharedDocuments.length + sharedNotes.length + sharedVideos.length,
      hasMore: offset + limit < sharedImages.length + sharedDocuments.length + sharedNotes.length + sharedVideos.length,
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
