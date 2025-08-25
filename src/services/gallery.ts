import {
  GalleryWithItems,
  FolderInfo,
  CreateGalleryRequest,
  GalleryListResponse,
  GalleryDetailResponse,
} from "@/types/gallery";

// Analytics tracking shim for future implementation
const trackEvent = (event: string, properties?: Record<string, unknown>): void => {
  console.log("Gallery Analytics:", { event, properties, timestamp: new Date().toISOString() });
};

// Mock data for development
const mockGalleries: GalleryWithItems[] = [
  {
    id: "mock-gallery-1",
    title: "Wedding Photos",
    description: "Beautiful moments from our special day",
    isPublic: true,
    createdAt: new Date("2024-01-15T10:00:00Z"),
    updatedAt: new Date("2024-01-15T10:00:00Z"),
    ownerId: "mock-user-1",
    items: [],
    imageCount: 25,
    isOwner: true,
  },
  {
    id: "mock-gallery-2",
    title: "Family Vacation",
    description: "Summer memories with the family",
    isPublic: false,
    createdAt: new Date("2024-01-10T14:30:00Z"),
    updatedAt: new Date("2024-01-10T14:30:00Z"),
    ownerId: "mock-user-1",
    items: [],
    imageCount: 12,
    isOwner: true,
  },
];

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
      const gallery = mockGalleries.find((g) => g.id === id);
      if (!gallery) {
        throw new Error("Gallery not found");
      }
      return {
        gallery,
        items: [],
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
