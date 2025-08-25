import {
  GalleryWithItems,
  FolderInfo,
  CreateGalleryRequest,
  GalleryListResponse,
  GalleryDetailResponse,
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

// Simple gallery service for demo
export const galleryService = {
  // Check if mock data should be used
  isMockDataEnabled: (useMockData: boolean = false): boolean => {
    return useMockData;
  },

  // List galleries
  listGalleries: async (useMockData: boolean = false): Promise<GalleryListResponse> => {
    trackEvent("gallery_list_requested");

    if (useMockData) {
      return {
        galleries: mockGalleries,
        hasMore: false,
        totalCount: mockGalleries.length,
      };
    }

    // Real API call would go here
    const response = await fetch("/api/galleries");
    return response.json();
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

    // Real API call would go here
    const response = await fetch(`/api/galleries/${id}`);
    return response.json();
  },

  // Create gallery
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

    // Real API call would go here
    const response = await fetch("/api/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  },

  // Get folders with images for gallery creation
  getFoldersWithImages: async (useMockData: boolean = false): Promise<FolderInfo[]> => {
    trackEvent("folders_requested");

    if (useMockData) {
      return mockFolders;
    }

    // Real API call would go here
    const response = await fetch("/api/galleries/from-folder");
    return response.json();
  },
};
