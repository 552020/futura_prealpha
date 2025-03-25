import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { allUsers, temporaryUsers } from "@/db/schema";
import { storeInDatabase, uploadFileToStorage, validateFile } from "../utils";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Validate file
    const validationResult = await validateFile(file);
    if (!validationResult.isValid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    // Upload file to storage
    const url = await uploadFileToStorage(file);

    // Create temporary user and store memory in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create temporary user with minimal required fields
      const [temporaryUser] = await tx
        .insert(temporaryUsers)
        .values({
          secureCode: crypto.randomUUID(), // This will be replaced with a proper secure code
          secureCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          role: "inviter",
          registrationStatus: "pending",
        })
        .returning();

      // 2. Create all_users entry
      const [user] = await tx
        .insert(allUsers)
        .values({
          type: "temporary" as const,
          temporaryUserId: temporaryUser.id,
        })
        .returning();

      // 3. Store memory
      const memoryResult = await storeInDatabase({
        type: validationResult.fileType!.mime.includes("image/") ? "image" : "document",
        ownerId: user.id,
        url,
        file,
        metadata: validationResult.metadata!,
      });

      return {
        ...memoryResult,
        temporaryUserId: temporaryUser.id,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error uploading file during onboarding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
