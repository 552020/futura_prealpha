import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, desc } from "drizzle-orm";
// import { files, photos, texts, Photo, File, Text } from "@/db/schema";
import { images, documents, notes, allUsers } from "@/db/schema";
import { DBImage, DBDocument, DBNote } from "@/db/schema";

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

    console.log("Fetching memories for:", {
      sessionUserId: session.user.id,
      allUserId: allUserRecord.id,
      page,
      limit,
      offset,
    });

    let userImages: DBImage[] = [];
    let userDocuments: DBDocument[] = [];
    let userNotes: DBNote[] = [];

    // If no specific type is requested or photos are requested
    if (!fileType || fileType === "photo") {
      userImages = await db.query.images.findMany({
        where: eq(images.ownerId, allUserRecord.id),
        orderBy: desc(images.createdAt),
        limit: limit,
        offset: offset,
      });
    }

    // If no specific type is requested or files are requested
    if (!fileType || fileType === "file") {
      userDocuments = await db.query.documents.findMany({
        where: eq(documents.ownerId, allUserRecord.id),
        orderBy: desc(documents.createdAt),
        limit: limit,
        offset: offset,
      });
    }

    // If no specific type is requested or texts are requested
    if (!fileType || fileType === "text") {
      userNotes = await db.query.notes.findMany({
        where: eq(notes.ownerId, allUserRecord.id),
        orderBy: desc(notes.createdAt),
        limit: limit,
        offset: offset,
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
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
