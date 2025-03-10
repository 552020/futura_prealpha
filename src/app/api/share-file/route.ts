import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { files, photos, texts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { resourceType, resourceId, shareWith, expiresAt } =
      await request.json();

    // Explicitly define the type for resourceType
    type ResourceType = "file" | "photo" | "text";
    const validResourceTypes: ResourceType[] = ["file", "photo", "text"];

    if (!validResourceTypes.includes(resourceType as ResourceType)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

    const table = {
      file: files,
      photo: photos,
      text: texts,
    } as const; // Use 'as const' to infer the type of the table object

    const selectedTable = table[resourceType as ResourceType]; // Cast resourceType to ResourceType

    const sharedWithData = {
      userId: shareWith.userId,
      email: shareWith.email,
      sharedAt: new Date().toISOString(),
      expiresAt: expiresAt,
    };

    // Update the metadata.sharedWith array using PostgreSQL array operations
    await db
      .update(selectedTable)
      .set({
        metadata: sql`jsonb_set(
          CASE 
            WHEN metadata->>'sharedWith' IS NULL 
            THEN jsonb_set(metadata, '{sharedWith}', '[]') 
            ELSE metadata 
          END,
          '{sharedWith}',
          COALESCE(metadata->'sharedWith', '[]'::jsonb) || ${JSON.stringify(
            sharedWithData
          )}::jsonb
        )`,
      })
      .where(eq(selectedTable.id, resourceId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Share error:", error);
    return NextResponse.json(
      { error: "Failed to share resource" },
      { status: 500 }
    );
  }
}
