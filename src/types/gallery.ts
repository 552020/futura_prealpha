import { Memory } from "./memory";
import { DBGallery, DBGalleryItem } from "@/db/schema";

// Gallery with items - extends existing DB types
export interface GalleryWithItems extends DBGallery {
  items: (DBGalleryItem & { memory: Memory })[];
  imageCount: number;
  isOwner: boolean;
}

// Gallery creation request
export interface CreateGalleryRequest {
  type: "from-folder" | "from-memories";
  folderName?: string;
  memories?: Array<{ id: string; type: string }>;
  title: string;
  description?: string;
  isPublic?: boolean;
}

// Gallery update request
export interface UpdateGalleryRequest {
  title?: string;
  description?: string;
  isPublic?: boolean;
}

// Folder information for gallery creation
export interface FolderInfo {
  name: string;
  imageCount: number;
  previewImages: string[];
  hasImages: boolean;
}

// Gallery responses
export interface GalleryListResponse {
  galleries: GalleryWithItems[];
  hasMore: boolean;
  totalCount: number;
}

export interface GalleryDetailResponse {
  gallery: GalleryWithItems;
  items: (DBGalleryItem & { memory: Memory })[];
  itemsCount: number;
}
