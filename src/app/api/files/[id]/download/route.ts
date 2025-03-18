import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { files, photos, texts } from "@/db/schema";
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
    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, id),
    });

    if (photo) {
      // Verify this photo belongs to the user or is publicly accessible
      if (photo.userId !== session.user.id && !photo.isPublic) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      console.log(`Found photo with URL: ${photo.url}`);

      // Handle remote URLs (starting with http or https)
      if (photo.url.startsWith("http")) {
        try {
          const response = await fetch(photo.url);
          if (!response.ok) throw new Error(`Failed to fetch ${photo.url}`);

          const buffer = Buffer.from(await response.arrayBuffer());
          const fileResponse = new NextResponse(buffer);

          // Set the content type based on the URL extension or a default
          const ext = path.extname(photo.url).toLowerCase();
          const contentType =
            ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : ext === ".webp" ? "image/webp" : "image/jpeg";

          fileResponse.headers.set("Content-Type", contentType);
          fileResponse.headers.set("Content-Disposition", `attachment; filename="${path.basename(photo.url)}"`);

          return fileResponse;
        } catch (fetchError) {
          console.error("Error fetching remote image:", fetchError);
          return new Response("Error fetching remote file", { status: 502 });
        }
      }

      // For local files, try multiple possible paths
      const possiblePaths = [
        // If URL starts with /, it's relative to public directory
        photo.url.startsWith("/") ? path.join(process.cwd(), "public", photo.url.substring(1)) : null,
        // Direct path (as stored)
        path.join(process.cwd(), "uploads", path.basename(photo.url)),
        // Path in public directory
        path.join(process.cwd(), "public", photo.url),
        // Path in public/images directory
        path.join(process.cwd(), "public/images", path.basename(photo.url)),
        // Absolute path as is
        photo.url,
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

          const response = new NextResponse(fileBuffer);
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
    const file = await db.query.files.findFirst({
      where: eq(files.id, id),
    });

    if (file) {
      // Verify ownership
      if (file.userId !== session.user.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      console.log(`Found file: ${file.filename}, URL: ${file.url}`);

      // Handle remote URLs
      if (file.url.startsWith("http")) {
        try {
          const response = await fetch(file.url);
          if (!response.ok) throw new Error(`Failed to fetch ${file.url}`);

          const buffer = Buffer.from(await response.arrayBuffer());
          const fileResponse = new NextResponse(buffer);

          fileResponse.headers.set("Content-Type", file.mimeType || "application/octet-stream");
          fileResponse.headers.set("Content-Disposition", `attachment; filename="${file.filename}"`);

          return fileResponse;
        } catch (fetchError) {
          console.error("Error fetching remote file:", fetchError);
          return new Response("Error fetching remote file", { status: 502 });
        }
      }

      // For local files, try multiple possible paths
      const possiblePaths = [
        file.url.startsWith("/") ? path.join(process.cwd(), "public", file.url.substring(1)) : null,
        path.join(process.cwd(), "uploads", path.basename(file.url)),
        path.join(process.cwd(), "public", file.url),
        path.join(process.cwd(), "public/files", path.basename(file.url)),
        file.url,
      ].filter(Boolean) as string[];

      // Try each path
      for (const filePath of possiblePaths) {
        try {
          console.log(`Trying path: ${filePath}`);
          await fs.access(filePath);

          // If we get here, the file exists
          const fileBuffer = await fs.readFile(filePath);

          const response = new NextResponse(fileBuffer);
          response.headers.set("Content-Type", file.mimeType || "application/octet-stream");
          response.headers.set("Content-Disposition", `attachment; filename="${file.filename}"`);

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
    const text = await db.query.texts.findFirst({
      where: eq(texts.id, id),
    });

    if (text) {
      // Verify this text belongs to the user
      if (text.userId !== session.user.id) {
        return new Response("Access denied", { status: 403 });
      }

      // Return text data as a file download
      const textContent = text.content;
      const response = new NextResponse(textContent);
      response.headers.set("Content-Type", "text/plain");
      response.headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(text.title || "text.txt")}"`
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
