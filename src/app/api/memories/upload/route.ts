import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { allUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fileTypeFromBuffer } from "file-type";
import { storeInDatabase, uploadFileToStorage, MAX_FILE_SIZE, isAcceptedMimeType, getMemoryType } from "./utils";

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    if (!(uploadedFile instanceof File)) {
      // Browser's File interface check
      return NextResponse.json({ error: "Invalid file upload" }, { status: 400 });
    }

    // Validate file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Get actual file type
    const buffer = await uploadedFile.arrayBuffer();
    const fileType = await fileTypeFromBuffer(Buffer.from(buffer));

    if (!fileType || !isAcceptedMimeType(fileType.mime)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // Upload file to storage
    const uploadedUrl = await uploadFileToStorage(uploadedFile);

    // Build common metadata
    const commonMetadata = {
      uploadedAt: new Date().toISOString(),
      originalName: uploadedFile.name,
      size: uploadedFile.size,
      mimeType: fileType.mime,
    };

    // Get the user's all_users entry
    const [allUserEntry] = await db.select().from(allUsers).where(eq(allUsers.userId, session.user.id)).limit(1);

    if (!allUserEntry) {
      return NextResponse.json({ error: "User not found in all_users table" }, { status: 404 });
    }

    // Store in database
    const result = await storeInDatabase({
      type: getMemoryType(fileType.mime),
      ownerId: allUserEntry.id,
      url: uploadedUrl,
      file: uploadedFile,
      metadata: commonMetadata,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
