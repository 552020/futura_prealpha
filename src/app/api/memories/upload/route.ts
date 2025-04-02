import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { allUsers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { storeInDatabase, uploadFileToStorage, validateFile, isAcceptedMimeType, getMemoryType } from "./utils";

export async function POST(request: Request) {
  try {
    console.log("🚀 Starting upload process...");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const providedAllUserId = formData.get("userId") as string;

    // Get user either from session or from provided allUserId
    let allUserId: string;
    const session = await auth();

    if (session?.user?.id) {
      console.log("👤 Looking up authenticated user in users table...");
      // First get the user from users table
      const [permanentUser] = await db.select().from(users).where(eq(users.id, session.user.id));
      console.log("Found permanent user:", { userId: permanentUser?.id });

      if (!permanentUser) {
        console.error("❌ Permanent user not found");
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Then get their allUserId
      const [allUserRecord] = await db.select().from(allUsers).where(eq(allUsers.userId, permanentUser.id));
      console.log("Found all_users record:", { allUserId: allUserRecord?.id });

      if (!allUserRecord) {
        console.error("❌ No all_users record found for permanent user");
        return NextResponse.json({ error: "User record not found" }, { status: 404 });
      }

      allUserId = allUserRecord.id;
    } else if (providedAllUserId) {
      console.log("👤 Using provided allUserId for temporary user...");
      // For temporary users, directly check the allUsers table
      const [tempUser] = await db.select().from(allUsers).where(eq(allUsers.id, providedAllUserId));
      console.log("Found temporary user:", { allUserId: tempUser?.id, type: tempUser?.type });

      if (!tempUser || tempUser.type !== "temporary") {
        console.error("❌ Valid temporary user not found");
        return NextResponse.json({ error: "Invalid temporary user" }, { status: 404 });
      }

      allUserId = tempUser.id;
    } else {
      console.error("❌ No valid user identification provided");
      return NextResponse.json({ error: "User identification required" }, { status: 401 });
    }

    // Validate file
    const validationResult = await validateFile(file);
    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    if (!isAcceptedMimeType(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Upload file to storage
    const url = await uploadFileToStorage(file);

    // Store in database using the allUserId
    const result = await storeInDatabase({
      type: getMemoryType(file.type),
      ownerId: allUserId,
      url,
      file,
      metadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
      },
    });

    console.log("✅ Upload successful:", {
      type: result.type,
      ownerId: result.data.ownerId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Error uploading file:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
