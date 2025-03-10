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

    //TODO: Store the actual file,
    // atm the DB is designed only to store "records" aka "entries"
    const photoUrl = "https://placehold.co/600x400";

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
