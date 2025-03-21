import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { documents, images, notes } from "@/db/schema";
import { put } from "@vercel/blob";
// import { type Photo, type Text, type File } from "@/db/schema";
import { type DBImage, type DBDocument, type DBNote } from "@/db/schema";

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
};

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    if (!(uploadedFile instanceof File)) {
      // Browser's File interface check
      return NextResponse.json({ error: "Invalid file upload" }, { status: 400 });
    }

    // Validate file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Validate MIME type
    const mimeType = uploadedFile.type;
    if (!ACCEPTED_MIME_TYPES.images.includes(mimeType) && !ACCEPTED_MIME_TYPES.documents.includes(mimeType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    // TODO: verify manually mime type

    // Determine and validate file type
    let fileType: "image" | "note" | "document";

    if (ACCEPTED_MIME_TYPES.images.includes(mimeType)) {
      fileType = "image";
    } else if (ACCEPTED_MIME_TYPES.documents.includes(mimeType)) {
      fileType = "document";
      // } else if (ACCEPTED_MIME_TYPES.documents.includes(mimeType)) {
      //   fileType = "note";
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const uploadedFileUrl = await uploadFileToStorage(uploadedFile);

    // Common metadata
    const commonMetadata = {
      uploadedAt: new Date().toISOString(),
      originalName: uploadedFile.name,
      size: uploadedFile.size,
      mimeType: mimeType,
    };

    // Construct the appropriate record based on file type
    let record;
    if (ACCEPTED_MIME_TYPES.images.includes(mimeType)) {
      record = {
        type: "image" as const,
        data: {
          userId: session.user.id,
          url: uploadedFileUrl,
          isPublic: false,
          metadata: {
            ...commonMetadata,
            format: mimeType.split("/")[1],
          },
        },
      };
    } else {
      record = {
        type: "document" as const,
        data: {
          userId: session.user.id,
          url: uploadedFileUrl,
          title: uploadedFile.name.split(".")[0],
          description: null,
          mimeType: mimeType,
          size: uploadedFile.size.toString(),
          isPublic: false,
          metadata: {
            ...commonMetadata,
          },
        },
      };
    }

    try {
      const result = await db.transaction(async (tx) => {
        if (record.type === "image") {
          const photoResult = await tx.insert(images).values(record.data).returning();
          return { type: "image", data: photoResult[0] };
        } else if (record.type === "document") {
          const documentResult = await tx.insert(documents).values(record.data).returning();
          return { type: "document", data: documentResult[0] };
          //   case "file":
          //     const fileResult = await tx
          //       .insert(files)
          //       .values({
          //         userId: session.user.id,
          //         url: uploadedFileUrl,
          //         filename: uploadedFile.name,
          //         mimeType: mimeType,
          //         userId: session.user.id,
          //         title: uploadedFile.name.split(".")[0],
          //         content: content,
          //         isPublic: true,
          //         metadata: {
          //           ...commonMetadata,
          //           wordCount: content.split(/\s+/).length,
          //           encoding: "utf-8",
          //         },
          //       })
          //       .returning();
          //     return { type: "file", data: fileResult[0], id: fileResult[0].id };

          //   case "file":
          //     const fileResult = await tx
          //       .insert(files)
          //       .values({
          //         userId: session.user.id,
          //         url: uploadedFileUrl,
          //         filename: uploadedFile.name,
          //         mimeType: mimeType,
          //         size: uploadedFile.size.toString(),
          //         isPublic: true,
          //         metadata: {
          //           ...commonMetadata,
          //         },
          //       })
          //       .returning();
          //     return { type: "file", data: fileResult[0], id: fileResult[0].id };
        }
      });

      return NextResponse.json(result);
    } catch (error) {
      console.error("Database operation failed:", error);
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Upload error:", error);

    if (error instanceof TypeError) {
      return NextResponse.json({ error: "Invalid file format" }, { status: 400 });
    }

    if (error && typeof error === "object" && "code" in error && error.code === "LIMIT_FILE_SIZE") {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
// let result;

// if (mimeType.startsWith("image/")) {
//   // It's a photo
//   result = await db
//     .insert(photos)
//     .values({
//       userId: session.user.id,
//       url: uploadedFileUrl,
//       isPublic: true,
//       metadata: {
//         size: file.size,
//         format: mimeType.split("/")[1],
//       },
//     })
//     .returning();

//   return NextResponse.json({ type: "photo", data: result[0] });
// } else if (
//   mimeType === "text/plain" ||
//   mimeType === "application/rtf" ||
//   mimeType === "application/msword" ||
//   mimeType.includes("document")
// ) {
//   // It's likely a text document
//   const content = await file.text();

//   result = await db
//     .insert(texts)
//     .values({
//       userId: session.user.id,
//       title: file.name.split(".")[0],
//       content: content,
//       isPublic: true,
//       metadata: {
//         tags: [],
//       },
//     })
//     .returning();

//       return NextResponse.json({ type: "text", data: result[0] });
//     } else {
//       // It's a generic file
//       result = await db
//         .insert(files)
//         .values({
//           userId: session.user.id,
//           url: uploadedFileUrl,
//           filename: file.name,
//           mimeType: mimeType,
//           size: file.size.toString(),
//           isPublic: true,
//           metadata: {
//             originalName: file.name,
//           },
//         })
//         .returning();

//       return NextResponse.json({ type: "file", data: result[0] });
//     }
//   } catch (error) {
//     console.error("Upload error:", error);
//     return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
//   }
// }

// We renamed this cause it was conflicting with the File type of the database schema
// async function uploadFileToStorage(file: File): Promise<string> {
async function uploadFileToStorage(file: globalThis.File): Promise<string> {
  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Sanitize filename to remove special characters
  const safeFileName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, "_");

  // Upload to Vercel Blob - returns a URL
  const { url } = await put(`uploads/${Date.now()}-${safeFileName}`, buffer, {
    access: "public",
    contentType: file.type,
  });

  return url;
}
