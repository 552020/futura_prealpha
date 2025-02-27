import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { photos } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get("photo") as File;
    const userId = formData.get("userId") as string;

    if (!photo || !userId) {
      return NextResponse.json(
        { error: "Photo and user ID are required" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the photo to your storage service (e.g., S3, Cloudinary)
    // 2. Get the URL of the uploaded photo
    // For this example, we'll use a placeholder URL
    const photoUrl = "https://placeholder.com/image.jpg"; // Replace with actual upload logic

    // Save the photo record to the database
    const [newPhoto] = await db
      .insert(photos)
      .values({
        userId,
        url: photoUrl,
        isPublic: true,
      })
      .returning();

    return NextResponse.json(newPhoto);
  } catch (error) {
    console.error("Error saving photo:", error);
    return NextResponse.json(
      { error: "Failed to save photo" },
      { status: 500 }
    );
  }
}
