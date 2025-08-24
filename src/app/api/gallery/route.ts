import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq, desc } from "drizzle-orm";
import { galleries, allUsers } from "@/db/schema";

export async function GET(request: NextRequest) {
  // Returns all galleries owned by the authenticated user
  // A gallery is a collection of memories (images, videos, documents, notes, audio)
  // Each gallery can contain the same memory multiple times (unlike folders)
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    console.log("Fetching galleries for:", {
      sessionUserId: session.user.id,
      allUserId: allUserRecord.id,
      page,
      limit,
      offset,
    });

    // Fetch user's galleries
    const userGalleries = await db.query.galleries.findMany({
      where: eq(galleries.ownerId, allUserRecord.id),
      orderBy: desc(galleries.createdAt),
      limit: limit,
      offset: offset,
    });

    console.log("Fetched galleries:", {
      page,
      limit,
      offset,
      galleriesCount: userGalleries.length,
    });

    return NextResponse.json({
      galleries: userGalleries,
      hasMore: userGalleries.length === limit,
    });
  } catch (error) {
    console.error("Error listing galleries:", error);
    return NextResponse.json({ error: "Failed to list galleries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, isPublic = false } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Create new gallery
    const newGallery = await db
      .insert(galleries)
      .values({
        ownerId: allUserRecord.id,
        title,
        description,
        isPublic,
      })
      .returning();

    console.log("Created gallery:", newGallery[0]);

    return NextResponse.json(
      {
        gallery: newGallery[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating gallery:", error);
    return NextResponse.json({ error: "Failed to create gallery" }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ error: "Gallery API temporarily disabled" }, { status: 503 });
}
