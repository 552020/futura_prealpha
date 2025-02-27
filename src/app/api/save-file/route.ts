import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { files } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "File and user ID are required" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the file to your storage service (e.g., S3)
    // 2. Get the URL of the uploaded file
    // For this example, we'll use a placeholder URL
    const fileUrl = "https://placeholder.com/file.pdf"; // Replace with actual upload logic

    // Save the file record to the database
    const [newFile] = await db
      .insert(files)
      .values({
        userId,
        url: fileUrl,
        filename: file.name,
        mimeType: file.type,
        size: file.size.toString(),
        isPublic: true,
      })
      .returning();

    return NextResponse.json(newFile);
  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
