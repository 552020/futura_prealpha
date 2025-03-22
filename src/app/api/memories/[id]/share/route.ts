import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { familyRelationship, memoryShares, relationship } from "@/db/schema";
import { findMemory } from "../../utils";
import { MemoryWithType } from "../../utils";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { sendInvitationEmail, sendSharedMemoryEmail } from "@/app/api/memories/utils";
import type { RelationshipType, FamilyRelationshipRole } from "@/db/schema";

type ShareTarget = {
  type: "user" | "group";
  id?: string;
};

type ShareMethod = {
  type: "direct" | "email" | "link";
  email?: string;
  name?: string;
};

type RelationshipInfo = {
  type: RelationshipType;
  familyRole?: FamilyRelationshipRole; // Only if type is "family"
};

type ShareRequest = {
  target: ShareTarget;
  method: ShareMethod;
  relationship?: RelationshipInfo;
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

    const shareRequest = (await request.json()) as ShareRequest;

    // Handle sharing based on method
    switch (shareRequest.method.type) {
      case "direct":
        if (!shareRequest.target.id) {
          return NextResponse.json({ error: "Target ID is required for direct sharing" }, { status: 400 });
        }
        return await handleDirectShare(memory, shareRequest, session.user.id);

      case "email":
        if (!shareRequest.method.email) {
          return NextResponse.json({ error: "Email is required for email sharing" }, { status: 400 });
        }
        return await handleEmailShare(memory, shareRequest, session.user.id);

      case "link":
        return await handleLinkShare(memory, shareRequest, session.user.id);

      default:
        return NextResponse.json({ error: "Invalid share method" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error sharing memory:", error);
    return NextResponse.json({ error: "Failed to share memory" }, { status: 500 });
  }
}

async function handleDirectShare(memory: MemoryWithType, request: ShareRequest, ownerId: string) {
  // Check if target exists
  if (request.target.type === "user") {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.target.id!),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create share record
    const [share] = await db
      .insert(memoryShares)
      .values({
        memoryId: memory.data.id,
        memoryType: memory.type,
        ownerId,
        sharedWithType: "user",
        sharedWithId: request.target.id!,
        accessLevel: "read",
      })
      .returning();

    // Create relationship if provided
    if (request.relationship) {
      await createRelationship(ownerId, request.target.id!, request.relationship);
    }

    // Notify user about shared memory
    await notifyMemoryShared(user.email!, memory, ownerId);

    return NextResponse.json({ success: true, data: share });
  }

  if (request.target.type === "group") {
    // TODO: Implement group sharing
  }
}

async function createRelationship(userId: string, relatedUserId: string, relationshipInfo: RelationshipInfo) {
  // First create the base relationship
  const [baseRelationship] = await db
    .insert(relationship)
    .values({
      userId,
      relatedUserId,
      type: relationshipInfo.type,
      status: "pending",
      createdAt: new Date(),
      // note: could be added if needed
    })
    .returning();

  // If it's a family relationship, create the corresponding family relationship record
  if (relationshipInfo.type === "family" && relationshipInfo.familyRole) {
    await db.insert(familyRelationship).values({
      relationshipId: baseRelationship.id,
      familyRole: relationshipInfo.familyRole,
      relationshipClarity: "fuzzy", // Default to fuzzy as per schema
      createdAt: new Date(),
      // sharedAncestorId: null, // Can be updated later when resolved
    });
  }

  return baseRelationship;
}

async function notifyMemoryShared(email: string, memory: MemoryWithType, sharedById: string) {
  console.log("notifyMemoryShared", email, memory, sharedById);
  // Send notification email to existing user about shared memory
  // Different from invitation email
}

async function handleEmailShare(memory: MemoryWithType, request: ShareRequest, ownerId: string) {
  const email = request.method.email!;

  // Check if user with email exists
  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    // Create pending user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name: request.method.name || email.split("@")[0],
        registrationStatus: "pending",
        invitedBy: ownerId,
        invitedAt: new Date(),
      })
      .returning();

    user = newUser;

    // Send invitation email to new user
    await sendInvitationEmail(email, memory, ownerId);
  } else {
    // Notify existing user about shared memory
    await notifyMemoryShared(email, memory, ownerId);
  }

  // Create share record
  const [share] = await db
    .insert(memoryShares)
    .values({
      memoryId: memory.data.id,
      memoryType: memory.type,
      ownerId,
      sharedWithType: "user",
      sharedWithId: user.id,
      accessLevel: "read",
    })
    .returning();

  // Create relationship if provided
  if (request.relationship) {
    await createRelationship(ownerId, user.id, request.relationship);
  }

  return NextResponse.json({ success: true, data: share });
}

async function handleLinkShare(memory: MemoryWithType, request: ShareRequest, ownerId: string) {
  // Generate unique sharing token
  const shareToken = crypto.randomUUID();

  // Store share record with special type
  const [share] = await db
    .insert(memoryShares)
    .values({
      memoryId: memory.data.id,
      memoryType: memory.type,
      ownerId,
      sharedWithType: "link",
      sharedWithId: shareToken,
      accessLevel: "read",
    })
    .returning();

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareToken}`;

  // If name/email provided, send the link
  if (request.method.email) {
    await sendSharedMemoryEmail(request.method.email, memory, ownerId, shareUrl);
  }

  return NextResponse.json({
    success: true,
    data: { ...share, shareUrl },
  });
}
