import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { files, photos, texts } from "@/db/schema";
import fs from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

// Add these type definitions at the top of the file
type FileMetadata = {
  originalName?: string;
  encoding?: string;
  description?: string;
  size?: number;
  format?: string;
  permissions?: {
    sharePassword?: string;
    shareId?: string;
    expiresAt?: string;
    sharedWith?: string[];
  };
  customFields?: Record<string, string | number | boolean | null>;
};

type PhotoUpdateData = {
  url?: string;
  caption?: string;
  isPublic?: boolean;
  metadata?: FileMetadata;
};

type FileUpdateData = {
  url?: string;
  filename?: string;
  mimeType?: string;
  size?: string;
  isPublic?: boolean;
  metadata?: FileMetadata;
};

// Define a specific TextMetadata type that matches the database schema
type TextMetadata = {
  tags?: string[];
  mood?: string;
  location?: string;
  dateOfMemory?: string;
  recipients?: string[];
  unlockDate?: string;
};

// Update the TextUpdateData type to use the correct metadata type
type TextUpdateData = {
  title?: string;
  content?: string;
  isPublic?: boolean;
  metadata?: TextMetadata;
};

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Await the params to resolve the Promise
  const { id } = await context.params;

  console.log("Request method:", request.method);

  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: "File ID is required" }, { status: 400 });
  }

  try {
    // Try to find the file in files table
    let file = await db.query.files.findFirst({
      where: eq(files.id, id),
    });

    // If not in files, check photos table
    if (!file) {
      const photo = await db.query.photos.findFirst({
        where: eq(photos.id, id),
      });

      if (photo) {
        file = {
          id: photo.id,
          userId: photo.userId,
          url: photo.url,
          isPublic: photo.isPublic,
          createdAt: photo.createdAt,
          metadata: {
            originalName: `photo_${photo.id}.jpg`,
            encoding: "binary",
            description: photo.caption || "Photo",
          },
          filename: `photo_${photo.id}.jpg`,
          mimeType: "image/jpeg",
          size: (photo.metadata?.size || 0).toString(),
        };
      }
    }

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check if user has permission
    if (file.userId !== session.user.id && !file.isPublic) {
      // Check if file is shared with this user
      const hasAccess = await checkUserHasAccess(id, session.user.id);
      if (!hasAccess) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Redirect to the file URL
    return NextResponse.redirect(file.url);
  } catch (error) {
    console.error("Error retrieving file:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}

async function checkUserHasAccess(fileId: string, userId: string): Promise<boolean> {
  // This will be implemented when you add sharing functionality
  console.log("checkUserHasAccess", fileId, userId);
  return false;
}

// Handler for deleting a file
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Get the authenticated user
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the file ID
  const params = await context.params;
  const { id } = params;

  try {
    // Try to find in photos
    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, id),
    });

    if (photo) {
      // Verify ownership
      if (photo.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Try to delete the actual file if it's local
      if (!photo.url.startsWith("http")) {
        try {
          // Try multiple possible paths
          const possiblePaths = [
            photo.url.startsWith("/") ? path.join(process.cwd(), "public", photo.url.substring(1)) : null,
            path.join(process.cwd(), "uploads", path.basename(photo.url)),
            path.join(process.cwd(), "public", photo.url),
            photo.url,
          ].filter(Boolean) as string[];

          for (const filePath of possiblePaths) {
            try {
              await fs.access(filePath);
              await fs.unlink(filePath);
              console.log(`Deleted file at: ${filePath}`);
              break; // Stop if we successfully deleted the file
            } catch {
              // Continue to the next path if this one doesn't exist
              console.log(`Could not delete file at: ${filePath}`);
            }
          }
        } catch (fileError) {
          console.error("Error deleting file:", fileError);
          // Continue anyway to delete the database record
        }
      }

      // Delete from database
      await db.delete(photos).where(eq(photos.id, id)).execute();

      return NextResponse.json({
        success: true,
        message: "Photo deleted successfully",
      });
    }

    // Try to find and delete a regular file
    const file = await db.query.files.findFirst({
      where: eq(files.id, id),
    });

    if (file) {
      // Verify ownership
      if (file.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Try to delete the actual file if it's local
      if (!file.url.startsWith("http")) {
        try {
          // Try multiple possible paths
          const possiblePaths = [
            file.url.startsWith("/") ? path.join(process.cwd(), "public", file.url.substring(1)) : null,
            path.join(process.cwd(), "uploads", path.basename(file.url)),
            path.join(process.cwd(), "public", file.url),
            file.url,
          ].filter(Boolean) as string[];

          for (const filePath of possiblePaths) {
            try {
              await fs.access(filePath);
              await fs.unlink(filePath);
              console.log(`Deleted file at: ${filePath}`);
              break; // Stop if we successfully deleted the file
            } catch {
              // Continue to the next path if this one doesn't exist
              console.log(`Could not delete file at: ${filePath}`);
            }
          }
        } catch (fileError) {
          console.error("Error deleting file:", fileError);
          // Continue anyway to delete the database record
        }
      }

      // Delete from database
      await db.delete(files).where(eq(files.id, id)).execute();

      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    }

    // Try to find and delete text
    const text = await db.query.texts.findFirst({
      where: eq(texts.id, id),
    });

    if (text) {
      // Verify ownership
      if (text.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Delete from database
      await db.delete(texts).where(eq(texts.id, id)).execute();

      return NextResponse.json({
        success: true,
        message: "Text deleted successfully",
      });
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH handler for updating files
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Get the authenticated user
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the file ID
  const params = await context.params;
  const { id } = params;

  try {
    // Check content type to determine if it's a file upload or metadata update
    const contentType = request.headers.get("content-type") || "";
    let formData;
    let jsonData;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload + metadata update
      formData = await request.formData();
    } else {
      // Handle metadata-only update
      jsonData = await request.json();
    }

    // Try to find in photos
    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, id),
    });

    if (photo) {
      // Verify ownership
      if (photo.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Prepare update data
      const updateData: PhotoUpdateData = {};

      // Handle file replacement if present
      let newUrl = photo.url;
      if (formData && formData.has("file")) {
        const file = formData.get("file") as File;
        if (file) {
          // Upload new file to Vercel Blob
          const filename = `${uuidv4()}-${file.name}`;
          const blob = await put(filename, file, {
            access: "public",
          });
          newUrl = blob.url;
          updateData.url = newUrl;

          // Update size and format in metadata
          updateData.metadata = {
            ...photo.metadata,
            size: file.size,
            format: file.type.split("/")[1],
          };
        }
      }

      // Handle metadata updates
      const metadataSource = formData || jsonData;
      if (metadataSource) {
        // Caption
        if (metadataSource.has?.("caption") || metadataSource.caption) {
          const caption = metadataSource.get?.("caption") || metadataSource.caption;
          updateData.caption = caption;
        }

        // isPublic flag
        if (metadataSource.has?.("isPublic") !== undefined || metadataSource.isPublic !== undefined) {
          const isPublic = metadataSource.get?.("isPublic") === "true" || metadataSource.isPublic === true;
          updateData.isPublic = isPublic;
        }

        // Any additional metadata
        if (metadataSource.has?.("metadata") || metadataSource.metadata) {
          const additionalMetadata = metadataSource.get?.("metadata") || metadataSource.metadata;
          if (typeof additionalMetadata === "string") {
            try {
              const parsedMetadata = JSON.parse(additionalMetadata);
              updateData.metadata = {
                ...photo.metadata,
                ...parsedMetadata,
              };
            } catch (e) {
              console.error("Error parsing metadata:", e);
            }
          } else if (typeof additionalMetadata === "object") {
            updateData.metadata = {
              ...photo.metadata,
              ...additionalMetadata,
            };
          }
        }
      }

      // Update the photo
      if (Object.keys(updateData).length > 0) {
        const [updatedPhoto] = await db.update(photos).set(updateData).where(eq(photos.id, id)).returning();

        return NextResponse.json({
          success: true,
          type: "photo",
          data: updatedPhoto,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "No updates provided",
          },
          { status: 400 }
        );
      }
    }

    // Try to find in files
    const file = await db.query.files.findFirst({
      where: eq(files.id, id),
    });

    if (file) {
      // Verify ownership
      if (file.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Prepare update data
      const updateData: FileUpdateData = {};

      // Handle file replacement if present
      let newUrl = file.url;
      if (formData && formData.has("file")) {
        const newFile = formData.get("file") as File;
        if (newFile) {
          // Upload new file to Vercel Blob
          const filename = `${uuidv4()}-${newFile.name}`;
          const blob = await put(filename, newFile, {
            access: "public",
          });
          newUrl = blob.url;
          updateData.url = newUrl;
          updateData.mimeType = newFile.type;
          updateData.size = newFile.size.toString();

          // Update filename if different
          if (formData.has("filename")) {
            updateData.filename = formData.get("filename") as string;
          } else {
            updateData.filename = newFile.name;
          }
        }
      } else {
        // Handle filename update without file replacement
        if ((formData && formData.has("filename")) || (jsonData && jsonData.filename)) {
          const filename = formData?.get("filename") || jsonData.filename;
          updateData.filename = filename;
        }
      }

      // Handle metadata updates
      const metadataSource = formData || jsonData;
      if (metadataSource) {
        // isPublic flag
        if (metadataSource.has?.("isPublic") !== undefined || metadataSource.isPublic !== undefined) {
          const isPublic = metadataSource.get?.("isPublic") === "true" || metadataSource.isPublic === true;
          updateData.isPublic = isPublic;
        }

        // Any additional metadata
        if (metadataSource.has?.("metadata") || metadataSource.metadata) {
          const additionalMetadata = metadataSource.get?.("metadata") || metadataSource.metadata;
          if (typeof additionalMetadata === "string") {
            try {
              const parsedMetadata = JSON.parse(additionalMetadata);
              updateData.metadata = {
                ...file.metadata,
                ...parsedMetadata,
              };
            } catch (e) {
              console.error("Error parsing metadata:", e);
            }
          } else if (typeof additionalMetadata === "object") {
            updateData.metadata = {
              ...file.metadata,
              ...additionalMetadata,
            };
          }
        }
      }

      // Update the file
      if (Object.keys(updateData).length > 0) {
        const [updatedFile] = await db.update(files).set(updateData).where(eq(files.id, id)).returning();

        return NextResponse.json({
          success: true,
          type: "file",
          data: updatedFile,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "No updates provided",
          },
          { status: 400 }
        );
      }
    }

    // Try to find in texts
    const text = await db.query.texts.findFirst({
      where: eq(texts.id, id),
    });

    if (text) {
      // Verify ownership
      if (text.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Prepare update data
      const updateData: TextUpdateData = {};

      // Handle text content updates
      const metadataSource = formData || jsonData;
      if (metadataSource) {
        // Title
        if (metadataSource.has?.("title") || metadataSource.title) {
          updateData.title = metadataSource.get?.("title") || metadataSource.title;
        }

        // Content
        if (metadataSource.has?.("content") || metadataSource.content) {
          updateData.content = metadataSource.get?.("content") || metadataSource.content;
        }

        // isPublic flag
        if (metadataSource.has?.("isPublic") !== undefined || metadataSource.isPublic !== undefined) {
          const isPublic = metadataSource.get?.("isPublic") === "true" || metadataSource.isPublic === true;
          updateData.isPublic = isPublic;
        }

        // Any additional metadata
        if (metadataSource.has?.("metadata") || metadataSource.metadata) {
          const additionalMetadata = metadataSource.get?.("metadata") || metadataSource.metadata;
          if (typeof additionalMetadata === "string") {
            try {
              const parsedMetadata = JSON.parse(additionalMetadata) as TextMetadata;
              updateData.metadata = {
                ...text.metadata,
                ...parsedMetadata,
              } as TextMetadata;
            } catch (e) {
              console.error("Error parsing metadata:", e);
            }
          } else if (typeof additionalMetadata === "object") {
            updateData.metadata = {
              ...text.metadata,
              ...additionalMetadata,
            } as TextMetadata;
          }
        }
      }

      // Update the text
      if (Object.keys(updateData).length > 0) {
        const [updatedText] = await db.update(texts).set(updateData).where(eq(texts.id, id)).returning();

        return NextResponse.json({
          success: true,
          type: "text",
          data: updatedText,
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "No updates provided",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
