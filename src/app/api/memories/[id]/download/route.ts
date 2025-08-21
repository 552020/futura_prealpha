import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { documents, images, notes } from "@/db/schema";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // Get the authenticated user
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the file ID from the URL params - properly awaiting the promise
  const params = await context.params;
  const { id } = params;

  console.log(`Download requested for file ID: ${id}`);

  try {
    // First check if it's a photo
    const image = await db.query.images.findFirst({
      where: eq(images.id, id),
    });

    if (image) {
      // Verify this photo belongs to the user or is publicly accessible
      if (image.ownerId !== session.user.id && !image.isPublic) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      console.log(`Found photo with URL: ${image.url}`);

      // Handle remote URLs (starting with http or https)
      if (image.url.startsWith("http")) {
        try {
          const response = await fetch(image.url);
          if (!response.ok) throw new Error(`Failed to fetch ${image.url}`);

          const buffer = Buffer.from(await response.arrayBuffer());
          const fileResponse = new NextResponse(new Uint8Array(buffer));

          // Set the content type based on the URL extension or a default
          const ext = path.extname(image.url).toLowerCase();
          const contentType =
            ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg";

          fileResponse.headers.set("Content-Type", contentType);
          fileResponse.headers.set("Content-Disposition", `attachment; filename="${path.basename(image.url)}"`);

          return fileResponse;
        } catch (fetchError) {
          console.error("Error fetching remote image:", fetchError);
          return new Response("Error fetching remote file", { status: 502 });
        }
      }

      // For local files, try multiple possible paths
      const possiblePaths = [
        // If URL starts with /, it's relative to public directory
        image.url.startsWith("/") ? path.join(process.cwd(), "public", image.url.substring(1)) : null,
        // Direct path (as stored)
        path.join(process.cwd(), "uploads", path.basename(image.url)),
        // Path in public directory
        path.join(process.cwd(), "public", image.url),
        // Path in public/images directory
        path.join(process.cwd(), "public/images", path.basename(image.url)),
        // Absolute path as is
        image.url,
      ].filter(Boolean) as string[];

      // Try each path
      for (const filePath of possiblePaths) {
        try {
          console.log(`Trying path: ${filePath}`);
          await fs.access(filePath);

          // If we get here, the file exists
          const fileBuffer = await fs.readFile(filePath);

          // Determine content type based on file extension
          const ext = path.extname(filePath).toLowerCase();
          const contentType =
            ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg";

          const response = new NextResponse(new Uint8Array(fileBuffer));
          response.headers.set("Content-Type", contentType);
          response.headers.set("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);

          return response;
        } catch {
          // File doesn't exist at this path, continue to next
          console.log(`File not found at: ${filePath}`);
        }
      }

      // If we get here, we couldn't find the file at any location
      console.error(`Could not find file at any of these locations: ${possiblePaths.join(", ")}`);
      return new Response("File not found", { status: 404 });
    }

    // Check if it's a regular file - similar approach as photos
    const document = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (document) {
      // Verify this document belongs to the user or is publicly accessible
      if (document.ownerId !== session.user.id && !document.isPublic) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      console.log(`Found file: ${document.title}, URL: ${document.url}`);

      // Handle remote URLs
      if (document.url.startsWith("http")) {
        try {
          const response = await fetch(document.url);
          if (!response.ok) throw new Error(`Failed to fetch ${document.url}`);

          const buffer = Buffer.from(await response.arrayBuffer());
          const fileResponse = new NextResponse(new Uint8Array(buffer));

          fileResponse.headers.set("Content-Type", document.mimeType || "application/octet-stream");
          fileResponse.headers.set("Content-Disposition", `attachment; filename="${document.title}"`);

          return fileResponse;
        } catch (fetchError) {
          console.error("Error fetching remote file:", fetchError);
          return new Response("Error fetching remote file", { status: 502 });
        }
      }

      // For local files, try multiple possible paths
      const possiblePaths = [
        document.url.startsWith("/") ? path.join(process.cwd(), "public", document.url.substring(1)) : null,
        path.join(process.cwd(), "uploads", path.basename(document.url)),
        path.join(process.cwd(), "public", document.url),
        path.join(process.cwd(), "public/files", path.basename(document.url)),
        document.url,
      ].filter(Boolean) as string[];

      // Try each path
      for (const filePath of possiblePaths) {
        try {
          console.log(`Trying path: ${filePath}`);
          await fs.access(filePath);

          // If we get here, the file exists
          const fileBuffer = await fs.readFile(filePath);

          const response = new NextResponse(new Uint8Array(fileBuffer));
          response.headers.set("Content-Type", document.mimeType || "application/octet-stream");
          response.headers.set("Content-Disposition", `attachment; filename="${document.title}"`);

          return response;
        } catch {
          // File doesn't exist at this path, continue to next
          console.log(`File not found at: ${filePath}`);
        }
      }

      // If we get here, we couldn't find the file at any location
      console.error(`Could not find file at any of these locations: ${possiblePaths.join(", ")}`);
      return new Response("File not found", { status: 404 });
    }

    // Handle text - this should work without file path issues
    const note = await db.query.notes.findFirst({
      where: eq(notes.id, id),
    });

    if (note) {
      // Verify this note belongs to the user or is publicly accessible
      if (note.ownerId !== session.user.id && !note.isPublic) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Return text data as a file download
      const noteContent = note.content;
      const response = new NextResponse(noteContent);
      response.headers.set("Content-Type", "text/plain");
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(note.title || "note.txt")}"`
      );

      return response;
    }

    // If we get here, no matching item was found
    return new Response("File not found", { status: 404 });
  } catch (error) {
    console.error("Error retrieving file:", error);
    return new Response("Server error", { status: 500 });
  }
}
