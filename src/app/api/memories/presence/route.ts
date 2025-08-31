import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { getMemoryPresenceById } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const memoryType = searchParams.get("type");
    const memoryId = searchParams.get("id");

    // Validate memoryId exists and has valid UUID format
    if (!memoryId) {
      return NextResponse.json({ error: "Missing required parameter: id" }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(memoryId)) {
      return NextResponse.json({ error: "Invalid memoryId format. Must be a valid UUID" }, { status: 400 });
    }

    // Validate memory type
    if (!memoryType) {
      return NextResponse.json({ error: "Missing required parameter: type" }, { status: 400 });
    }

    const validMemoryTypes = ["image", "video", "note", "document", "audio"];
    if (!validMemoryTypes.includes(memoryType)) {
      return NextResponse.json(
        { error: `Invalid memory type. Must be one of: ${validMemoryTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Query the memory_presence view
    const result = await db.execute(getMemoryPresenceById(memoryId, memoryType));

    // Handle raw database result format
    const rows = (result as { rows?: unknown[] })?.rows || [];

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Memory not found or no presence data available" }, { status: 404 });
    }

    const presenceData = rows[0] as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: {
        memoryId: presenceData.memory_id,
        memoryType: presenceData.memory_type,
        // Storage presence flags
        metaNeon: presenceData.meta_neon,
        assetBlob: presenceData.asset_blob,
        metaIcp: presenceData.meta_icp,
        assetIcp: presenceData.asset_icp,
        // Computed storage status
        storageStatus: {
          neon: presenceData.meta_neon,
          blob: presenceData.asset_blob,
          icp: presenceData.meta_icp && presenceData.asset_icp,
          icpPartial: presenceData.meta_icp || presenceData.asset_icp,
        },
        // Overall status summary
        overallStatus:
          presenceData.meta_icp && presenceData.asset_icp
            ? "stored_forever"
            : presenceData.meta_icp || presenceData.asset_icp
            ? "partially_stored"
            : "web2_only",
      },
    });
  } catch (error) {
    console.error("Error querying memory presence:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
