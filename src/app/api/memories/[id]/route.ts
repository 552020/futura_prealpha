import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { documents, images, notes } from "@/db/schema";
import type { DBImage, DBDocument, DBNote } from "@/db/schema";
import { findMemory } from "@/app/api/memories/utils";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  console.log("Request method:", request.method);

  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  try {
    const memory = await findMemory(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return await handleMemoryAccess(memory.data, session.user.id);
  } catch (error) {
    console.error("Error retrieving memory:", error);
    return NextResponse.json({ error: "Failed to retrieve memory" }, { status: 500 });
  }
}

async function handleMemoryAccess(memory: DBDocument | DBImage | DBNote, userId: string): Promise<NextResponse> {
  // Check if user has permission
  if (memory.userId !== userId && !memory.isPublic) {
    const hasAccess = await checkUserHasAccess(memory.id, userId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  // Return the full memory data
  return NextResponse.json({
    success: true,
    data: memory,
    type: "content" in memory ? "note" : "url" in memory ? "image" : "document",
  });
}

async function checkUserHasAccess(memoryId: string, userId: string): Promise<boolean> {
  // This will be implemented when you add sharing functionality
  console.log("checkUserHasAccess", memoryId, userId);
  return false;
}

// Handler for deleting a file
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memory = await findMemory(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    // Check ownership only
    if (memory.data.userId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can delete this memory" }, { status: 403 });
    }

    switch (memory.type) {
      case "document":
        await db.delete(documents).where(eq(documents.id, id));
        break;
      case "image":
        await db.delete(images).where(eq(images.id, id));
        break;
      case "note":
        await db.delete(notes).where(eq(notes.id, id));
        break;
    }

    return NextResponse.json({
      success: true,
      message: `${memory.type} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}

// async function checkMemoryAccess(memory: DBDocument | DBImage | DBNote, userId: string): Promise<boolean> {
//   // Direct ownership
//   if (memory.userId === userId) return true;

//   // Check shared access (if implemented)
//   // const hasSharedAccess = await checkSharedAccess(memory.id, userId);
//   // return hasSharedAccess;

//   return false;
// }

// PATCH handler for updating files
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const memory = await findMemory(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    // Check ownership
    if (memory.data.userId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can modify this memory" }, { status: 403 });
    }

    // Get only the changed fields from request
    const updates = await request.json();

    // Update based on memory type
    switch (memory.type) {
      case "document": {
        const { title, description, isPublic, metadata } = updates;
        const [updated] = await db
          .update(documents)
          .set({ title, description, isPublic, metadata })
          .where(eq(documents.id, id))
          .returning();
        return NextResponse.json({ success: true, data: updated });
      }
      case "image": {
        const { title, description, caption, isPublic, metadata } = updates;
        const [updated] = await db
          .update(images)
          .set({ title, description, caption, isPublic, metadata })
          .where(eq(images.id, id))
          .returning();
        return NextResponse.json({ success: true, data: updated });
      }
      case "note": {
        const { title, content, isPublic, metadata } = updates;
        const [updated] = await db
          .update(notes)
          .set({ title, content, isPublic, metadata })
          .where(eq(notes.id, id))
          .returning();
        return NextResponse.json({ success: true, data: updated });
      }
    }
  } catch (error) {
    console.error("Error updating memory:", error);
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
  }
}
