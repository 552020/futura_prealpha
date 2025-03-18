import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, desc } from "drizzle-orm";
import { files, photos, texts, Photo, File, Text } from "@/db/schema";

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
    let userPhotos: Photo[] = [];
    let userFiles: File[] = [];
    let userTexts: Text[] = [];

    // If no specific type is requested or photos are requested
    if (!fileType || fileType === "photo") {
      userPhotos = await db.query.photos.findMany({
        where: eq(photos.userId, session.user.id),
        orderBy: desc(photos.createdAt), // Simple recent-first sorting
        limit: limit,
      });
    }

    // If no specific type is requested or files are requested
    if (!fileType || fileType === "file") {
      userFiles = await db.query.files.findMany({
        where: eq(files.userId, session.user.id),
        orderBy: desc(files.createdAt), // Simple recent-first sorting
        limit: limit,
      });
    }

    // If no specific type is requested or texts are requested
    if (!fileType || fileType === "text") {
      userTexts = await db.query.texts.findMany({
        where: eq(texts.userId, session.user.id),
        orderBy: desc(texts.createdAt), // Simple recent-first sorting
        limit: limit,
      });
    }

    return NextResponse.json({
      photos: userPhotos,
      files: userFiles,
      texts: userTexts,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}
