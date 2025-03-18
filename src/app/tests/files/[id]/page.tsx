import { auth } from "@/auth";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { files, photos, texts } from "@/db/schema";
import { notFound } from "next/navigation";
import FileDetailEditor from "./file-detail-editor";

// Server component to handle data fetching
export default async function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Get the authenticated user
  const session = await auth();
  if (!session || !session.user) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-6">File Details</h1>
        <div className="bg-yellow-50 text-yellow-800 p-4 rounded mb-6">You must be logged in to view file details</div>
      </div>
    );
  }

  // Await params to resolve the Promise
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Try to find in photos
  const photo = await db.query.photos.findFirst({
    where: eq(photos.id, id),
  });

  if (photo) {
    // Verify access
    if (photo.userId !== session.user.id && !photo.isPublic) {
      return (
        <div className="p-8 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
          <div className="bg-red-50 text-red-800 p-4 rounded">You don&apos;t have permission to view this file</div>
        </div>
      );
    }

    return <FileDetailEditor fileDetails={{ type: "photo", data: photo }} />;
  }

  // Try to find in files
  const file = await db.query.files.findFirst({
    where: eq(files.id, id),
  });

  if (file) {
    // Verify access
    if (file.userId !== session.user.id) {
      return (
        <div className="p-8 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
          <div className="bg-red-50 text-red-800 p-4 rounded">You don&apos;t have permission to view this file</div>
        </div>
      );
    }

    return <FileDetailEditor fileDetails={{ type: "file", data: file }} />;
  }

  // Try to find in texts
  const text = await db.query.texts.findFirst({
    where: eq(texts.id, id),
  });

  if (text) {
    // Verify access
    if (text.userId !== session.user.id) {
      return (
        <div className="p-8 max-w-xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Access Denied</h1>
          <div className="bg-red-50 text-red-800 p-4 rounded">You don&apos;t have permission to view this file</div>
        </div>
      );
    }

    return <FileDetailEditor fileDetails={{ type: "text", data: text }} />;
  }

  // If we get here, the file doesn't exist
  return notFound();
}
