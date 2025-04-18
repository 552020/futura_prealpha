import { db } from "@/db/db";
import { documents, images, notes, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DBDocument, DBImage, DBNote, DBVideo } from "@/db/schema";
import type { MemoryType } from "@/db/schema";

export type MemoryWithType = {
  type: MemoryType;
  data: DBDocument | DBImage | DBNote | DBVideo;
};

/**
 * Finds a memory by ID across all memory types (document, image, note, video)
 * @param id The ID of the memory to find
 * @returns The memory with its type, or null if not found
 */
export async function findMemory(id: string): Promise<MemoryWithType | null> {
  const document = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });
  if (document) return { type: "document", data: document };

  const image = await db.query.images.findFirst({
    where: eq(images.id, id),
  });
  if (image) return { type: "image", data: image };

  const note = await db.query.notes.findFirst({
    where: eq(notes.id, id),
  });
  if (note) return { type: "note", data: note };

  const video = await db.query.videos.findFirst({
    where: eq(videos.id, id),
  });
  if (video) return { type: "video", data: video };

  return null;
}
