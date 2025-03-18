import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { files, photos, texts } from "@/db/schema";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const uploadedFileUrl = await uploadFileToStorage(file);

    // Determine file type
    const mimeType = file.type;
    let result;

    if (mimeType.startsWith("image/")) {
      // It's a photo
      result = await db
        .insert(photos)
        .values({
          userId: session.user.id,
          url: uploadedFileUrl,
          isPublic: true,
          metadata: {
            size: file.size,
            format: mimeType.split("/")[1],
          },
        })
        .returning();

      return NextResponse.json({ type: "photo", data: result[0] });
    } else if (
      mimeType === "text/plain" ||
      mimeType === "application/rtf" ||
      mimeType === "application/msword" ||
      mimeType.includes("document")
    ) {
      // It's likely a text document
      const content = await file.text();

      result = await db
        .insert(texts)
        .values({
          userId: session.user.id,
          title: file.name.split(".")[0],
          content: content,
          isPublic: true,
          metadata: {
            tags: [],
          },
        })
        .returning();

      return NextResponse.json({ type: "text", data: result[0] });
    } else {
      // It's a generic file
      result = await db
        .insert(files)
        .values({
          userId: session.user.id,
          url: uploadedFileUrl,
          filename: file.name,
          mimeType: mimeType,
          size: file.size.toString(),
          isPublic: true,
          metadata: {
            originalName: file.name,
          },
        })
        .returning();

      return NextResponse.json({ type: "file", data: result[0] });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}

// You'll need to implement this function based on your chosen storage solution
async function uploadFileToStorage(file: File): Promise<string> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Sanitize filename to remove special characters
  const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

  // Upload to Vercel Blob - returns a URL
  const { url } = await put(`uploads/${Date.now()}-${safeFileName}`, buffer, {
    access: "public",
    contentType: file.type,
  });

  return url;
}
