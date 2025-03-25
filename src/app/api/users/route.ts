import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { allUsers, temporaryUsers } from "@/db/schema";

// POST /api/users
// We use this endpoint to create only temporary users, normal users will be created by the sign-in success callback

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    // Create a temporary user
    const [temporaryUser] = await db
      .insert(temporaryUsers)
      .values({
        name,
        email,
        role: "invitee",
        secureCode: crypto.randomUUID(), // We'll use this for email verification
        secureCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      .returning();

    // Create an allUsers entry
    const [allUser] = await db
      .insert(allUsers)
      .values({
        type: "temporary",
        temporaryUserId: temporaryUser.id,
      })
      .returning();

    return NextResponse.json({
      user: temporaryUser,
      allUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
