import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Gallery API temporarily disabled" }, { status: 503 });
}

export async function PUT() {
  return NextResponse.json({ error: "Gallery API temporarily disabled" }, { status: 503 });
}
