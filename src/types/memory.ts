export interface Memory {
  id: string;
  type: "image" | "video" | "note" | "audio" | "document";
  title: string;
  description?: string;
  createdAt: string;
  thumbnail?: string;
  content?: string;
  url?: string;
  mimeType?: string;
  ownerId?: string;
  ownerName?: string;
}
