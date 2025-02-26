import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { texts } from "@/db/schema";

// Define the POST method for this API route
export async function POST(req: Request) {
  try {
    const body = await req.json(); // Read the request body
    const { userId, title, content } = body;

    // Basic validation
    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Insert into database
    await db.insert(texts).values({
      userId,
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Text saved successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving text:", error);
    return NextResponse.json(
      { error: "Failed to save text." },
      { status: 500 }
    );
  }
}
