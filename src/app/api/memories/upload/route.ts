import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { DBDocument, DBImage, documents, images } from "@/db/schema";
import { put } from "@vercel/blob";
import { fileTypeFromBuffer } from "file-type";
// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// Self written notes are dealt in another route
const ACCEPTED_MIME_TYPES = {
  images: [
    "image/jpeg", // .jpg, .jpeg
    "image/png", // .png
    "image/webp", // .webp
    "image/tiff", // .tif, .tiff
  ],
  documents: [
    // PDF
    "application/pdf", // .pdf

    // Microsoft Office
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx

    // OpenDocument
    "application/vnd.oasis.opendocument.text", // .odt

    // Plain text and markdown
    "text/plain", // .txt
    "text/markdown", // .md
    "text/x-markdown", // .md

    // Org mode
    "text/x-org", // .org

    // Archives
    "application/zip", // .zip
    "application/x-zip-compressed",
  ],
} as const;

type UploadResponse =
  | { error: string; status?: number }
  | {
      type: "image" | "document";
      data: DBImage | DBDocument;
      status?: number;
    };

type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES.images)[number] | (typeof ACCEPTED_MIME_TYPES.documents)[number];

function isAcceptedMimeType(mime: string): mime is AcceptedMimeType {
  return [...ACCEPTED_MIME_TYPES.images, ...ACCEPTED_MIME_TYPES.documents].includes(mime as AcceptedMimeType);
}

type MemoryMetadata = {
  uploadedAt: string;
  originalName: string;
  size: number;
  mimeType: AcceptedMimeType;
};

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 } as UploadResponse);
  }

  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    if (!(uploadedFile instanceof File)) {
      // Browser's File interface check
      return NextResponse.json({ error: "Invalid file upload" }, { status: 400 } as UploadResponse);
    }

    // Validate file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 } as UploadResponse);
    }

    // Get actual file type
    const buffer = await uploadedFile.arrayBuffer();
    const fileType = await fileTypeFromBuffer(Buffer.from(buffer));

    if (!fileType || !isAcceptedMimeType(fileType.mime)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 } as UploadResponse);
    }

    // Upload file to storage
    const uploadedUrl = await uploadToStorage(uploadedFile);

    // Build common metadata
    const commonMetadata = {
      uploadedAt: new Date().toISOString(),
      originalName: uploadedFile.name,
      size: uploadedFile.size,
      mimeType: fileType.mime,
    };

    // Store in database based on file type
    const result: UploadResponse = await storeInDatabase({
      type: getMemoryType(fileType.mime as AcceptedMimeType),
      userId: session.user.id,
      url: uploadedUrl,
      file: uploadedFile,
      metadata: commonMetadata as MemoryMetadata,
    });

    return NextResponse.json(result, { status: result.status });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 } as UploadResponse
    );
  }
}

function getMemoryType(mime: AcceptedMimeType): "document" | "image" {
  return ACCEPTED_MIME_TYPES.images.includes(mime as (typeof ACCEPTED_MIME_TYPES.images)[number])
    ? "image"
    : "document";
}
// / We renamed this cause it was conflicting with the File type of the database schema
// async function uploadFileToStorage(file: File): Promise<string> {
async function uploadToStorage(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

  const { url } = await put(`uploads/${Date.now()}-${safeFileName}`, buffer, {
    access: "public",
    contentType: file.type,
  });

  return url;
}

async function storeInDatabase(params: {
  type: "document" | "image";
  userId: string;
  url: string;
  file: File;
  metadata: MemoryMetadata;
}): Promise<UploadResponse> {
  const { type, userId, url, file, metadata } = params;

  return await db.transaction(async (tx) => {
    if (type === "image") {
      const [image] = await tx
        .insert(images)
        .values({
          userId,
          url,
          title: file.name.split(".")[0],
          isPublic: false,
          metadata,
        })
        .returning();
      return { type: "image", data: image };
    } else {
      const [document] = await tx
        .insert(documents)
        .values({
          userId,
          url,
          title: file.name.split(".")[0],
          mimeType: metadata.mimeType,
          size: metadata.size.toString(),
          isPublic: false,
          metadata,
        })
        .returning();
      return { type: "document", data: document };
    }
  });
}
