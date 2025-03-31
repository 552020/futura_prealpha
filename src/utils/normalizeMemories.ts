import { Memory } from "@/types/memory";

interface RawMemoryData {
  images: Array<{
    id: string;
    title?: string;
    description?: string;
    createdAt: string;
    url: string;
  }>;
  documents: Array<{
    id: string;
    title?: string;
    description?: string;
    createdAt: string;
    url: string;
    mimeType: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
}

export const normalizeMemories = (data: RawMemoryData): Memory[] => {
  const getDocumentType = (mime: string): "video" | "audio" | "unknown" => {
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "unknown";
  };

  return [
    ...data.images.map((img) => ({
      id: img.id,
      type: "image" as const,
      title: img.title || "Untitled Image",
      description: img.description,
      createdAt: img.createdAt,
      thumbnail: img.url,
    })),
    ...data.documents
      .filter((doc) => getDocumentType(doc.mimeType) !== "unknown")
      .map((doc) => ({
        id: doc.id,
        type: getDocumentType(doc.mimeType) as "video" | "audio",
        title: doc.title || "Untitled File",
        description: doc.description,
        createdAt: doc.createdAt,
        thumbnail: doc.mimeType.startsWith("video/") ? doc.url : undefined,
      })),
    ...data.notes.map((note) => ({
      id: note.id,
      type: "note" as const,
      title: note.title,
      description: note.content.substring(0, 100) + "...",
      createdAt: note.createdAt,
      content: note.content,
    })),
  ];
};
