import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { documents, images, notes } from "@/db/schema";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import type { DBImage, DBDocument, DBNote, MemoryType } from "@/db/schema";

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
    let memory = await findMemory(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    return await handleMemoryAccess(memory.data, session.user.id);
  } catch (error) {
    console.error("Error retrieving memory:", error);
    return NextResponse.json({ error: "Failed to retrieve memory" }, { status: 500 });
  }
}

type MemoryWithType = {
  type: MemoryType; // Using the existing MemoryType from schema
  data: DBDocument | DBImage | DBNote;
};

async function findMemory(id: string): Promise<MemoryWithType | null> {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (document) return { type: "document", data: document };

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });
  if (image) return { type: "image", data: image };

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, id),
  });
  if (note) return { type: "note", data: note };

  return null;
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

async function checkMemoryAccess(memory: DBDocument | DBImage | DBNote, userId: string): Promise<boolean> {
  // Direct ownership
  if (memory.userId === userId) return true;

  // Check shared access (if implemented)
  // const hasSharedAccess = await checkSharedAccess(memory.id, userId);
  // return hasSharedAccess;

  return false;
}

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
