import { normalizeMemories } from "@/utils/normalizeMemories";
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

export interface FetchMemoriesResponse extends RawMemoryData {
  hasMore: boolean;
}

export interface NormalizedMemory extends Memory {
  status: "private" | "shared" | "public";
  sharedWithCount?: number;
}

export const fetchMemories = async (page: number): Promise<FetchMemoriesResponse> => {
  const response = await fetch(`/api/memories?page=${page}`);

  if (!response.ok) {
    throw new Error("Failed to fetch memories");
  }

  return response.json();
};

export interface FetchAndNormalizeResult {
  memories: NormalizedMemory[];
  hasMore: boolean;
}

export const fetchAndNormalizeMemories = async (page: number): Promise<FetchAndNormalizeResult> => {
  const data = await fetchMemories(page);

  const normalizedMemories = normalizeMemories({
    images: data.images,
    documents: data.documents,
    notes: data.notes,
    videos: data.videos || [],
  }).map((memory) => ({
    ...memory,
    status: "private" as const, // Default to private for user's own memories
    sharedWithCount: 0, // Default to 0 for user's own memories
  }));

  return {
    memories: normalizedMemories,
    hasMore: data.hasMore,
  };
};

export const deleteMemory = async (id: string): Promise<void> => {
  const response = await fetch(`/api/memories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete memory");
  }
};

export const memoryActions = {
  delete: deleteMemory,

  share: async (id: string) => {
    // TODO: Implement share logic
    console.log("Sharing memory:", id);
  },

  navigate: (memory: Memory, lang: string, segment: string) => {
    return `/${lang}/${segment}/dashboard/${memory.id}`;
  },
};
