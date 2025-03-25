import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { allUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { storeInDatabase, uploadFileToStorage, validateFile } from "./utils";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Validate file
    const validationResult = await validateFile(file);
    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Upload file to storage
    const url = await uploadFileToStorage(file);

    // Get user from all_users table
    const [user] = await db.select().from(allUsers).where(eq(allUsers.id, session.user.id));

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Store in database
    const result = await storeInDatabase({
      type: validationResult.fileType!.mime.includes("image/") ? "image" : "document",
      ownerId: user.id,
      url,
      file,
      metadata: validationResult.metadata!,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
