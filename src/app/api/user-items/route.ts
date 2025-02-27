import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { texts, photos, files } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const [userTexts, userPhotos, userFiles] = await Promise.all([
      db.select().from(texts).where(eq(texts.userId, userId)),
      db.select().from(photos).where(eq(photos.userId, userId)),
      db.select().from(files).where(eq(files.userId, userId)),
    ]);

    return NextResponse.json({
      texts: userTexts,
      photos: userPhotos,
      files: userFiles,
    });
  } catch (error) {
    console.error("Error fetching user items:", error);
    return NextResponse.json(
      { error: "Failed to fetch user items" },
      { status: 500 }
    );
  }
}
