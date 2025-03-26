import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { memoryShares, relationship, familyRelationship, allUsers, users, temporaryUsers } from "@/db/schema";
import { findMemory } from "../../utils";
import { eq, and } from "drizzle-orm";
import { sendInvitationEmail, sendSharedMemoryEmail } from "@/app/api/memories/utils";
import type { RelationshipType, FamilyRelationshipRole } from "@/db/schema";
import crypto from "crypto";

// Dummy function for generating secure code
function generateSecureCode(): string {
  return crypto.randomUUID();
}

type ShareTarget = {
  type: "user" | "group";
  allUserId?: string; // For user type
  groupId?: string; // For group type
};

type RelationshipInfo = {
  type: RelationshipType;
  familyRole?: FamilyRelationshipRole; // Only if type is "family"
  note?: string;
};

type ShareRequest = {
  target: ShareTarget;
  relationship?: RelationshipInfo;
  sendEmail?: boolean;
  isInviteeNew?: boolean;
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: memoryId } = await context.params;

  const session = await auth();
  const isOnboarding = !session?.user?.id;

  try {
    // Find the memory first
    const memory = await findMemory(memoryId);
    if (!memory) {
      return NextResponse.json({ error: "Memory not found" }, { status: 404 });
    }

    const body = (await request.json()) as ShareRequest;
    const { target, relationship: relationshipInfo, sendEmail = false, isInviteeNew = false } = body;

    if (target.type === "group") {
      // TODO: Implement group sharing
      return NextResponse.json({ error: "Group sharing not implemented" }, { status: 501 });
    }

    // For onboarding users, we need to check if they exist in allUsers and are temporary
    if (isOnboarding) {
      const user = await db.query.allUsers.findFirst({
        where: eq(allUsers.id, target.allUserId!),
      });

      if (!user || user.type !== "temporary") {
        return NextResponse.json({ error: "Invalid onboarding user" }, { status: 401 });
      }
    }

    // Get the owner's allUserId
    let ownerAllUserId: string;
    if (isOnboarding) {
      ownerAllUserId = target.allUserId!;
    } else {
      const owner = await db.query.allUsers.findFirst({
        where: eq(allUsers.userId, session.user.id),
      });
      if (!owner) {
        return NextResponse.json({ error: "Owner not found" }, { status: 404 });
      }
      ownerAllUserId = owner.id;
    }

    // Check ownership
    if (memory.data.ownerId !== ownerAllUserId) {
      return NextResponse.json({ error: "Only the owner can share this memory" }, { status: 403 });
    }

    // Check if target user exists in allUsers
    const targetUser = await db.query.allUsers.findFirst({
      where: eq(allUsers.id, target.allUserId!),
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Get user's email based on type
    let userEmail: string | undefined;
    if (targetUser.type === "user" && targetUser.userId) {
      const permanentUser = await db.query.users.findFirst({
        where: eq(users.id, targetUser.userId),
      });
      userEmail = permanentUser?.email ?? undefined;
    } else if (targetUser.type === "temporary" && targetUser.temporaryUserId) {
      const temporaryUser = await db.query.temporaryUsers.findFirst({
        where: eq(temporaryUsers.id, targetUser.temporaryUserId),
      });
      userEmail = temporaryUser?.email ?? undefined;
    }

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 404 });
    }

    // Create share record
    const [share] = await db
      .insert(memoryShares)
      .values({
        memoryId: memoryId,
        memoryType: memory.type,
        ownerId: memory.data.ownerId,
        sharedWithType: target.type,
        sharedWithId: target.type === "user" ? target.allUserId! : target.groupId!,
        inviteeSecureCode: generateSecureCode(), // For invitee to access the memory
      })
      .returning();

    // Create relationship if provided
    if (relationshipInfo && target.type === "user") {
      await createRelationship(memory.data.ownerId, target.allUserId!, relationshipInfo);
    }

    // Generate magic links for both owner and invitee
    const ownerMagicLink = `${process.env.NEXT_PUBLIC_APP_URL}/memories/${memoryId}/shared?code=${memory.data.ownerSecureCode}`;
    const inviteeMagicLink = `${process.env.NEXT_PUBLIC_APP_URL}/memories/${memoryId}/shared?code=${share.inviteeSecureCode}`;

    // Send email if requested
    if (sendEmail && target.type === "user") {
      if (isInviteeNew) {
        await sendInvitationEmail(userEmail, memory, memory.data.ownerId, { useTemplate: true });
      } else {
        await sendSharedMemoryEmail(userEmail, memory, memory.data.ownerId, inviteeMagicLink, { useTemplate: true });
      }
    }

    return NextResponse.json({
      share,
      ownerMagicLink,
      inviteeMagicLink,
    });
  } catch (error) {
    console.error("Error sharing memory:", error);
    return NextResponse.json({ error: "Failed to share memory" }, { status: 500 });
  }
}

async function createRelationship(
  userId: string,
  relatedUserId: string,
  relationshipInfo: NonNullable<ShareRequest["relationship"]>
) {
  // Check if relationship already exists
  const existingRelationship = await db.query.relationship.findFirst({
    where: and(eq(relationship.userId, userId), eq(relationship.relatedUserId, relatedUserId)),
  });

  if (existingRelationship) {
    return existingRelationship;
  }

  // Create new relationship
  const [newRelationship] = await db
    .insert(relationship)
    .values({
      userId,
      relatedUserId,
      type: relationshipInfo.type,
      note: relationshipInfo.note,
      status: "pending",
      createdAt: new Date(),
    })
    .returning();

  // If it's a family relationship, create the family relationship record
  if (relationshipInfo.type === "family" && relationshipInfo.familyRole) {
    await db.insert(familyRelationship).values({
      relationshipId: newRelationship.id,
      familyRole: relationshipInfo.familyRole,
      relationshipClarity: "fuzzy", // Default to fuzzy as per schema
      createdAt: new Date(),
      // sharedAncestorId: null, // Can be updated later when resolved
    });
  }

  return newRelationship;
}
