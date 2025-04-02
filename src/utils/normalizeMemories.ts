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
  videos: Array<{
    id: string;
    title: string;
    description?: string;
    createdAt: string;
    url: string;
    mimeType: string;
  }>;
}

export const normalizeMemories = (data: RawMemoryData): Memory[] => {
  return [
    ...data.images.map((img) => ({
      id: img.id,
      type: "image" as const,
      title: img.title || "Untitled Image",
      description: img.description,
      createdAt: img.createdAt,
      thumbnail: img.url,
    })),
    ...data.videos.map((video) => ({
      id: video.id,
      type: "video" as const,
      title: video.title || "Untitled Video",
      description: video.description,
      createdAt: video.createdAt,
      thumbnail: video.url,
      url: video.url,
      mimeType: video.mimeType,
    })),
    ...data.documents.map((doc) => ({
      id: doc.id,
      type: "document" as const,
      title: doc.title || "Untitled Document",
      description: doc.description,
      createdAt: doc.createdAt,
      url: doc.url,
      mimeType: doc.mimeType,
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
