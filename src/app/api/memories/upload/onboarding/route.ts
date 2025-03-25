import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { allUsers, temporaryUsers } from "@/db/schema";
import { storeInDatabase, uploadFileToStorage, validateFile } from "../utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    // Validate file
    let validationResult;
    try {
      console.log("Validating file...");
      validationResult = await validateFile(file);
      if (!validationResult.isValid) {
        console.error("File validation failed:", validationResult.error);
        return NextResponse.json({ error: validationResult.error }, { status: 400 });
      }
      console.log("File validation successful");
    } catch (validationError) {
      console.error("Validation error:", validationError);
      return NextResponse.json(
        {
          error: "File validation failed",
          step: "validation",
          details: validationError instanceof Error ? validationError.message : String(validationError),
        },
        { status: 500 }
      );
    }

    // Upload file to storage
    let url;
    try {
      console.log("Uploading file to storage...");
      url = await uploadFileToStorage(file, validationResult.buffer);
      console.log("File uploaded successfully to:", url);
    } catch (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        {
          error: "File upload failed",
          step: "upload",
          details: uploadError instanceof Error ? uploadError.message : String(uploadError),
        },
        { status: 500 }
      );
    }

    // Database operations
    try {
      console.log("Creating temporary user...");
      // 1. Create temporary user
      const [temporaryUser] = await db
        .insert(temporaryUsers)
        .values({
          secureCode: crypto.randomUUID(),
          secureCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          role: "inviter",
          registrationStatus: "pending",
        })
        .returning();
      console.log("Temporary user created:", temporaryUser.id);

      console.log("Creating all_users entry...");
      // 2. Create all_users entry
      const [user] = await db
        .insert(allUsers)
        .values({
          type: "temporary" as const,
          temporaryUserId: temporaryUser.id,
        })
        .returning();
      console.log("All users entry created:", user.id);

      console.log("Storing memory in database...");
      // 3. Store memory
      const memoryResult = await storeInDatabase({
        type: validationResult.fileType!.mime.includes("image/") ? "image" : "document",
        ownerId: user.id,
        url,
        file,
        metadata: validationResult.metadata!,
      });
      console.log("Memory stored successfully");

      return NextResponse.json({
        ...memoryResult,
        temporaryUserId: temporaryUser.id,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        {
          error: "Database operation failed",
          step: "database",
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        step: "unknown",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
