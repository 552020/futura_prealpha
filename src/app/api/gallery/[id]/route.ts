import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, and } from "drizzle-orm";
import { galleries, allUsers, galleryShares } from "@/db/schema";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the allUserId for the authenticated user
    const allUserRecord = await db.query.allUsers.findFirst({
      where: eq(allUsers.userId, session.user.id),
    });

    if (!allUserRecord) {
      console.error("No allUsers record found for user:", session.user.id);
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const galleryId = id;

    // Check if user has access to this gallery
    // User can access if:
    // 1. They own the gallery
    // 2. The gallery is shared with them directly
    // 3. The gallery is shared with a group they're in
    // 4. The gallery is shared with their relationship type

    // First check if user owns the gallery
    const ownedGallery = await db.query.galleries.findFirst({
      where: and(eq(galleries.id, galleryId), eq(galleries.ownerId, allUserRecord.id)),
    });

    if (ownedGallery) {
      console.log("User owns gallery:", ownedGallery);
      return NextResponse.json({ gallery: ownedGallery });
    }

    // For now, implement simple direct user sharing check
    // TODO: Add group and relationship sharing logic
    const sharedGallery = await db.query.galleries.findFirst({
      where: eq(galleries.id, galleryId),
    });

    if (sharedGallery) {
      // Check if gallery is shared with this user
      const shareRecord = await db.query.galleryShares.findFirst({
        where: and(
          eq(galleryShares.galleryId, galleryId),
          eq(galleryShares.sharedWithType, "user"),
          eq(galleryShares.sharedWithId, allUserRecord.id)
        ),
      });

      if (shareRecord) {
        console.log("User has shared access to gallery:", sharedGallery);
        return NextResponse.json({ gallery: sharedGallery });
      }
    }

    // If we get here, user doesn't have access
    return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json({ error: "Failed to fetch gallery" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the allUserId for the authenticated user
    const allUserRecord = await db.query.allUsers.findFirst({
      where: eq(allUsers.userId, session.user.id),
    });

    if (!allUserRecord) {
      console.error("No allUsers record found for user:", session.user.id);
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const galleryId = id;
    const body = await request.json();
    const { title, description, isPublic } = body;

    // Check if gallery exists and user owns it
    const existingGallery = await db.query.galleries.findFirst({
      where: and(eq(galleries.id, galleryId), eq(galleries.ownerId, allUserRecord.id)),
    });

    if (!existingGallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    // Update gallery
    const updatedGallery = await db
      .update(galleries)
      .set({
        title: title !== undefined ? title : existingGallery.title,
        description: description !== undefined ? description : existingGallery.description,
        isPublic: isPublic !== undefined ? isPublic : existingGallery.isPublic,
        updatedAt: new Date(),
      })
      .where(eq(galleries.id, galleryId))
      .returning();

    console.log("Updated gallery:", updatedGallery[0]);

    return NextResponse.json({
      gallery: updatedGallery[0],
    });
  } catch (error) {
    console.error("Error updating gallery:", error);
    return NextResponse.json({ error: "Failed to update gallery" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the allUserId for the authenticated user
    const allUserRecord = await db.query.allUsers.findFirst({
      where: eq(allUsers.userId, session.user.id),
    });

    if (!allUserRecord) {
      console.error("No allUsers record found for user:", session.user.id);
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    const galleryId = id;

    // Check if gallery exists and user owns it
    const existingGallery = await db.query.galleries.findFirst({
      where: and(eq(galleries.id, galleryId), eq(galleries.ownerId, allUserRecord.id)),
    });

    if (!existingGallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    // Delete gallery (cascade will handle gallery_items)
    await db.delete(galleries).where(eq(galleries.id, galleryId));

    console.log("Deleted gallery:", galleryId);

    return NextResponse.json({
      message: "Gallery deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gallery:", error);
    return NextResponse.json({ error: "Failed to delete gallery" }, { status: 500 });
  }
}
