import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { memoryShares } from "@/db/schema";
import { findMemory } from "../../utils";

type ShareRequest = {
  type: "user" | "group";
  id: string;
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the memory first
    const memory = await findMemory(id);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    // Check ownership
    if (memory.data.userId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can share this memory" }, { status: 403 });
    }

    // Get user to share with from request body
    const shareRequest = (await request.json()) as ShareRequest;
    if (!shareRequest.id || !shareRequest.type) {
      return NextResponse.json({ error: "Invalid share request" }, { status: 400 });
    }

    // Create share record
    const [share] = await db
      .insert(memoryShares)
      .values({
        memoryId: id,
        memoryType: memory.type,
        ownerId: session.user.id,
        sharedWithType: shareRequest.type,
        sharedWithId: shareRequest.id,
        accessLevel: "read",
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: share,
    });
  } catch (error) {
    console.error("Error sharing memory:", error);
    return NextResponse.json({ error: "Failed to share memory" }, { status: 500 });
  }
}
