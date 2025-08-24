import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, desc, sql } from "drizzle-orm";
// import { files, photos, texts, Photo, File, Text } from "@/db/schema";
import { images, documents, notes, allUsers, memoryShares } from "@/db/schema";
import { DBImage, DBDocument, DBNote } from "@/db/schema";
import { fetchMemoriesWithGalleries } from "./queries";

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
    const fileType = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;
    const useOptimizedQuery = searchParams.get("optimized") === "true";

    console.log("Fetching memories for:", {
      sessionUserId: session.user.id,
      allUserId: allUserRecord.id,
      page,
      limit,
      offset,
      useOptimizedQuery,
    });

    // Use optimized query if requested
    if (useOptimizedQuery) {
      try {
        const memoriesWithGalleries = await fetchMemoriesWithGalleries(allUserRecord.id);

        // Apply pagination
        const paginatedMemories = memoriesWithGalleries.slice(offset, offset + limit);

        console.log("Optimized query results:", {
          total: memoriesWithGalleries.length,
          paginated: paginatedMemories.length,
          hasMore: memoriesWithGalleries.length > offset + limit,
        });

        return NextResponse.json({
          data: paginatedMemories,
          hasMore: memoriesWithGalleries.length > offset + limit,
          total: memoriesWithGalleries.length,
        });
      } catch (error) {
        console.error("Error with optimized query:", error);
        // Fall back to original implementation
      }
    }

    let userImages: (DBImage & { status: "private" | "shared" | "public"; sharedWithCount: number })[] = [];
    let userDocuments: (DBDocument & { status: "private" | "shared" | "public"; sharedWithCount: number })[] = [];
    let userNotes: (DBNote & { status: "private" | "shared" | "public"; sharedWithCount: number })[] = [];

    // If no specific type is requested or photos are requested
    if (!fileType || fileType === "photo") {
      const fetchedImages = await db.query.images.findMany({
        where: eq(images.ownerId, allUserRecord.id),
        orderBy: desc(images.createdAt),
        limit: limit,
        offset: offset,
      });

      // Get share counts for each image
      const shareCounts = await Promise.all(
        fetchedImages.map(async (image: DBImage) => {
          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(memoryShares)
            .where(eq(memoryShares.memoryId, image.id));
          return {
            id: image.id,
            count: count[0].count,
            isPublic: image.isPublic,
          };
        })
      );

      userImages = fetchedImages.map((image: DBImage) => {
        const shareInfo = shareCounts.find((s) => s.id === image.id);
        return {
          ...image,
          status: image.isPublic ? "public" : shareInfo?.count ? "shared" : "private",
          sharedWithCount: shareInfo?.count || 0,
        };
      });
    }

    // If no specific type is requested or files are requested
    if (!fileType || fileType === "file") {
      const fetchedDocuments = await db.query.documents.findMany({
        where: eq(documents.ownerId, allUserRecord.id),
        orderBy: desc(documents.createdAt),
        limit: limit,
        offset: offset,
      });

      // Get share counts for each document
      const shareCounts = await Promise.all(
        fetchedDocuments.map(async (document: DBDocument) => {
          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(memoryShares)
            .where(eq(memoryShares.memoryId, document.id));
          return {
            id: document.id,
            count: count[0].count,
            isPublic: document.isPublic,
          };
        })
      );

      userDocuments = fetchedDocuments.map((document: DBDocument) => {
        const shareInfo = shareCounts.find((s) => s.id === document.id);
        return {
          ...document,
          status: document.isPublic ? "public" : shareInfo?.count ? "shared" : "private",
          sharedWithCount: shareInfo?.count || 0,
        };
      });
    }

    // If no specific type is requested or texts are requested
    if (!fileType || fileType === "text") {
      const fetchedNotes = await db.query.notes.findMany({
        where: eq(notes.ownerId, allUserRecord.id),
        orderBy: desc(notes.createdAt),
        limit: limit,
        offset: offset,
      });

      // Get share counts for each note
      const shareCounts = await Promise.all(
        fetchedNotes.map(async (note: DBNote) => {
          const count = await db
            .select({ count: sql<number>`count(*)` })
            .from(memoryShares)
            .where(eq(memoryShares.memoryId, note.id));
          return {
            id: note.id,
            count: count[0].count,
            isPublic: note.isPublic,
          };
        })
      );

      userNotes = fetchedNotes.map((note: DBNote) => {
        const shareInfo = shareCounts.find((s) => s.id === note.id);
        return {
          ...note,
          status: note.isPublic ? "public" : shareInfo?.count ? "shared" : "private",
          sharedWithCount: shareInfo?.count || 0,
        };
      });
    }

    console.log("Fetched memories:", {
      page,
      limit,
      offset,
      imagesCount: userImages.length,
      documentsCount: userDocuments.length,
      notesCount: userNotes.length,
    });

    return NextResponse.json({
      images: userImages,
      documents: userDocuments,
      notes: userNotes,
      hasMore: userImages.length + userDocuments.length + userNotes.length === limit,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
