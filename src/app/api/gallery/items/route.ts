import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Gallery API temporarily disabled" }, { status: 503 });
}
