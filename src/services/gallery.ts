import {
  GalleryWithItems,
  FolderInfo,
  CreateGalleryRequest,
  GalleryListResponse,
  GalleryDetailResponse,
  UpdateGalleryRequest,
} from "@/types/gallery";
import { generatedGalleries, getGeneratedGallery } from "@/app/[lang]/gallery/generated-gallery-data";

// Analytics tracking shim for future implementation
const trackEvent = (event: string, properties?: Record<string, unknown>): void => {
  console.log("Gallery Analytics:", { event, properties, timestamp: new Date().toISOString() });
};

// Mock data for development - now using generated data
const mockGalleries: GalleryWithItems[] = generatedGalleries;

const mockFolders: FolderInfo[] = [
  {
    name: "Vacation Photos",
    imageCount: 15,
    previewImages: ["/mock/gallery/Amazing_Bridge_05.webp", "/mock/gallery/Beautiful_Festival_39.webp"],
    hasImages: true,
  },
  {
    name: "Wedding 2024",
    imageCount: 25,
    previewImages: ["/mock/gallery/Beautiful_Wedding_16.webp", "/mock/gallery/Gorgeous_Celebration_31.webp"],
    hasImages: true,
  },
];

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Gallery service with real API integration
export const galleryService = {
  // Check if mock data should be used
  isMockDataEnabled: (useMockData: boolean = false): boolean => {
    return useMockData;
  },

  // List galleries
  listGalleries: async (
    page: number = 1,
    limit: number = 12,
    useMockData: boolean = false
  ): Promise<GalleryListResponse> => {
    trackEvent("gallery_list_requested", { page, limit });

    if (useMockData) {
      return {
        galleries: mockGalleries,
        hasMore: false,
        totalCount: mockGalleries.length,
      };
    }

    try {
      const response = await fetch(`/api/galleries?page=${page}&limit=${limit}`);
      return await handleApiResponse(response);
    } catch (error) {
      console.error("Error listing galleries:", error);
      throw new Error("Failed to load galleries");
    }
  },

  // Get single gallery
  getGallery: async (id: string, useMockData: boolean = false): Promise<GalleryDetailResponse> => {
    trackEvent("gallery_viewed", { galleryId: id });

    if (useMockData) {
      const gallery = getGeneratedGallery(id);
      if (!gallery) {
        throw new Error("Gallery not found");
      }

      return {
        gallery,
        items: gallery.items,
        itemsCount: gallery.imageCount,
      };
    }

    try {
      const response = await fetch(`/api/galleries/${id}`);
      return await handleApiResponse(response);
    } catch (error) {
      console.error("Error getting gallery:", error);
      throw new Error("Failed to load gallery");
    }
  },

  // Create gallery from folder
  createGalleryFromFolder: async (
    folderName: string,
    title?: string,
    description?: string,
    isPublic: boolean = false,
    useMockData: boolean = false
  ): Promise<GalleryWithItems> => {
    trackEvent("gallery_created_from_folder", { folderName, title });

    if (useMockData) {
      const newGallery: GalleryWithItems = {
        id: `mock-gallery-${Date.now()}`,
        title: title || `Gallery from ${folderName}`,
        description: description || `Gallery created from folder: ${folderName}`,
        isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "mock-user-1",
        items: [],
        imageCount: 0,
        isOwner: true,
      };
      return newGallery;
    }

    try {
      const request: CreateGalleryRequest = {
        type: "from-folder",
        folderName,
        title: title || `Gallery from ${folderName}`,
        description: description || `Gallery created from folder: ${folderName}`,
        isPublic,
      };

      const response = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result = await handleApiResponse(response);
      return result.gallery;
    } catch (error) {
      console.error("Error creating gallery from folder:", error);
      throw new Error("Failed to create gallery from folder");
    }
  },

  // Create gallery from memories
  createGalleryFromMemories: async (
    memories: Array<{ id: string; type: string }>,
    title?: string,
    description?: string,
    isPublic: boolean = false,
    useMockData: boolean = false
  ): Promise<GalleryWithItems> => {
    trackEvent("gallery_created_from_memories", { memoriesCount: memories.length, title });

    if (useMockData) {
      const newGallery: GalleryWithItems = {
        id: `mock-gallery-${Date.now()}`,
        title: title || "Custom Gallery",
        description: description || "Gallery created from selected memories",
        isPublic,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "mock-user-1",
        items: [],
        imageCount: memories.length,
        isOwner: true,
      };
      return newGallery;
    }

    try {
      const request: CreateGalleryRequest = {
        type: "from-memories",
        memories,
        title: title || "Custom Gallery",
        description: description || "Gallery created from selected memories",
        isPublic,
      };

      const response = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result = await handleApiResponse(response);
      return result.gallery;
    } catch (error) {
      console.error("Error creating gallery from memories:", error);
      throw new Error("Failed to create gallery from memories");
    }
  },

  // Create gallery (legacy function - now uses the specific functions above)
  createGallery: async (request: CreateGalleryRequest, useMockData: boolean = false): Promise<GalleryWithItems> => {
    trackEvent("gallery_created", { type: request.type });

    if (useMockData) {
      const newGallery: GalleryWithItems = {
        id: `mock-gallery-${Date.now()}`,
        title: request.title,
        description: request.description || "",
        isPublic: request.isPublic || false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: "mock-user-1",
        items: [],
        imageCount: 0,
        isOwner: true,
      };
      return newGallery;
    }

    try {
      const response = await fetch("/api/galleries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const result = await handleApiResponse(response);
      return result.gallery;
    } catch (error) {
      console.error("Error creating gallery:", error);
      throw new Error("Failed to create gallery");
    }
  },

  // Update gallery
  updateGallery: async (
    id: string,
    updates: UpdateGalleryRequest,
    useMockData: boolean = false
  ): Promise<GalleryWithItems> => {
    trackEvent("gallery_updated", { galleryId: id, updates });

    if (useMockData) {
      const gallery = getGeneratedGallery(id);
      if (!gallery) {
        throw new Error("Gallery not found");
      }

      return {
        ...gallery,
        ...updates,
        updatedAt: new Date(),
      };
    }

    try {
      const response = await fetch(`/api/galleries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const result = await handleApiResponse(response);
      return result.gallery;
    } catch (error) {
      console.error("Error updating gallery:", error);
      throw new Error("Failed to update gallery");
    }
  },

  // Delete gallery
  deleteGallery: async (id: string, useMockData: boolean = false): Promise<void> => {
    trackEvent("gallery_deleted", { galleryId: id });

    if (useMockData) {
      // Mock deletion - just return success
      return;
    }

    try {
      const response = await fetch(`/api/galleries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting gallery:", error);
      throw new Error("Failed to delete gallery");
    }
  },

  // Share gallery
  shareGallery: async (
    id: string,
    shareData: { sharedWithType: string; sharedWithId: string },
    useMockData: boolean = false
  ): Promise<void> => {
    trackEvent("gallery_shared", { galleryId: id, shareData });

    if (useMockData) {
      // Mock sharing - just return success
      return;
    }

    try {
      const response = await fetch(`/api/galleries/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error sharing gallery:", error);
      throw new Error("Failed to share gallery");
    }
  },

  // Get folders with images for gallery creation
  getFoldersWithImages: async (useMockData: boolean = false): Promise<FolderInfo[]> => {
    trackEvent("folders_requested");

    if (useMockData) {
      return mockFolders;
    }

    try {
      // Note: This endpoint doesn't exist yet, so we'll need to create it
      // For now, we'll use a placeholder that returns empty array
      // TODO: Create `/api/galleries/folders` endpoint
      const response = await fetch("/api/galleries/folders");
      return await handleApiResponse(response);
    } catch (error) {
      console.error("Error getting folders:", error);
      // Return empty array instead of throwing for now
      return [];
    }
  },
};
