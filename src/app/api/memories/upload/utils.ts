import { db } from "@/db/db";
import { DBDocument, DBImage, documents, images } from "@/db/schema";
import { put } from "@vercel/blob";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";

// Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
// Self written notes are dealt in another route
export const ACCEPTED_MIME_TYPES = {
  image: [
    "image/jpeg", // .jpg, .jpeg
    "image/png", // .png
    "image/gif", // .gif
    "image/webp", // .webp
    "image/tiff", // .tiff
  ],
  document: [
    "application/pdf", // .pdf
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
  ],
} as const;

export type UploadResponse = {
  type: "image" | "document";
  data: DBImage | DBDocument;
};

export type AcceptedMimeType =
  | (typeof ACCEPTED_MIME_TYPES.image)[number]
  | (typeof ACCEPTED_MIME_TYPES.document)[number];

export function isAcceptedMimeType(mime: string): mime is AcceptedMimeType {
  return [...ACCEPTED_MIME_TYPES.image, ...ACCEPTED_MIME_TYPES.document].includes(mime as AcceptedMimeType);
}

export function getMemoryType(mime: AcceptedMimeType): "document" | "image" {
  return ACCEPTED_MIME_TYPES.image.includes(mime as (typeof ACCEPTED_MIME_TYPES.image)[number]) ? "image" : "document";
}

export async function uploadFileToStorage(file: File, existingBuffer?: Buffer): Promise<string> {
  const buffer = existingBuffer || Buffer.from(await file.arrayBuffer());
  const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

  const { url } = await put(`uploads/${Date.now()}-${safeFileName}`, buffer, {
    access: "public",
    contentType: file.type,
  });

  return url;
}

export async function storeInDatabase(params: {
  type: "document" | "image";
  ownerId: string;
  url: string;
  file: File;
  metadata: {
    uploadedAt: string;
    originalName: string;
    size: number;
    mimeType: AcceptedMimeType;
  };
}) {
  const { type, ownerId, url, file, metadata } = params;

  // Generate a secure code for the owner
  const ownerSecureCode = crypto.randomUUID();

  if (type === "image") {
    const [image] = await db
      .insert(images)
      .values({
        ownerId,
        url,
        title: file.name.split(".")[0],
        isPublic: false,
        metadata,
        ownerSecureCode,
      })
      .returning();
    return { type: "image", data: image };
  } else {
    const [document] = await db
      .insert(documents)
      .values({
        ownerId,
        url,
        title: file.name.split(".")[0],
        mimeType: metadata.mimeType,
        size: metadata.size.toString(),
        isPublic: false,
        metadata,
        ownerSecureCode,
      })
      .returning();
    return { type: "document", data: document };
  }
}

export type FileValidationResult = {
  isValid: boolean;
  error?: string;
  fileType?: { mime: AcceptedMimeType };
  metadata?: {
    uploadedAt: string;
    originalName: string;
    size: number;
    mimeType: AcceptedMimeType;
  };
  buffer?: Buffer;
};

export async function validateFile(file: File): Promise<FileValidationResult> {
  // Check if it's a File instance
  if (!(file instanceof File)) {
    return { isValid: false, error: "Invalid file upload" };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: "File too large" };
  }

  // Get actual file type
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileType = await fileTypeFromBuffer(buffer);

  if (!fileType || !isAcceptedMimeType(fileType.mime)) {
    return { isValid: false, error: "Unsupported file type" };
  }

  // Build common metadata
  const metadata = {
    uploadedAt: new Date().toISOString(),
    originalName: file.name,
    size: file.size,
    mimeType: fileType.mime,
  };

  return {
    isValid: true,
    fileType: { mime: fileType.mime as AcceptedMimeType },
    metadata,
    buffer,
  };
}
