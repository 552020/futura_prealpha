import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, desc } from "drizzle-orm";
// import { files, photos, texts, Photo, File, Text } from "@/db/schema";
import { images, documents, notes } from "@/db/schema";
import { DBImage, DBDocument, DBNote } from "@/db/schema";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const fileType = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    let userImages: DBImage[] = [];
    let userDocuments: DBDocument[] = [];
    let userNotes: DBNote[] = [];

    // If no specific type is requested or photos are requested
    if (!fileType || fileType === "photo") {
      userImages = await db.query.images.findMany({
        where: eq(images.userId, session.user.id),
        orderBy: desc(images.createdAt), // Simple recent-first sorting
        limit: limit,
      });
    }

    // If no specific type is requested or files are requested
    if (!fileType || fileType === "file") {
      userDocuments = await db.query.documents.findMany({
        where: eq(documents.userId, session.user.id),
        orderBy: desc(documents.createdAt), // Simple recent-first sorting
        limit: limit,
      });
    }

    // If no specific type is requested or texts are requested
    if (!fileType || fileType === "text") {
      userNotes = await db.query.notes.findMany({
        where: eq(notes.userId, session.user.id),
        orderBy: desc(notes.createdAt), // Simple recent-first sorting
        limit: limit,
      });
    }

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
