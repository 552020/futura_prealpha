import { Memory } from "@/types/memory";

// Extended Memory interface for dashboard with status information
interface DashboardMemory extends Memory {
  status: "private" | "shared" | "public";
  sharedWithCount?: number;
  sharedBy?: string;
}

export const sampleDashboardMemories: DashboardMemory[] = [
  {
    id: "1",
    title: "Family Vacation Photo",
    description: "Beautiful sunset at the beach during our summer vacation",
    type: "image",
    url: "/mock/dashboard/images/family-vacation.jpg",
    thumbnail: "/mock/dashboard/images/family-vacation-thumb.jpg",
    createdAt: "2024-01-15T10:30:00Z",
    status: "private",
  },
  {
    id: "2",
    title: "Wedding Ceremony Video",
    description: "The magical moment when we said our vows",
    type: "video",
    url: "/mock/dashboard/video/wedding-ceremony.mp4",
    thumbnail: "/mock/dashboard/video/wedding-ceremony-thumb.jpg",
    createdAt: "2024-01-10T14:20:00Z",
    status: "shared",
    sharedWithCount: 3,
  },
  {
    id: "3",
    title: "Important Meeting Notes",
    description: "Key points from the quarterly business review",
    type: "note",
    url: "/mock/dashboard/text/meeting-notes.txt",
    createdAt: "2024-01-08T09:15:00Z",
    status: "public",
  },
  {
    id: "4",
    title: "Contract Document",
    description: "Signed agreement for the new project",
    type: "document",
    url: "/mock/dashboard/text/contract.pdf",
    thumbnail: "/mock/dashboard/text/contract-thumb.jpg",
    createdAt: "2024-01-05T16:45:00Z",
    status: "shared",
    sharedWithCount: 1,
  },
  {
    id: "5",
    title: "Shared Memory from John",
    description: "Photo from our hiking trip last weekend",
    type: "image",
    url: "/mock/dashboard/images/hiking-trip.jpg",
    thumbnail: "/mock/dashboard/images/hiking-trip-thumb.jpg",
    createdAt: "2024-01-12T11:00:00Z",
    status: "shared",
    sharedBy: "John Doe",
  },
  {
    id: "6",
    title: "Public Event Photos",
    description: "Community celebration photos",
    type: "image",
    url: "/mock/dashboard/images/community-event.jpg",
    thumbnail: "/mock/dashboard/images/community-event-thumb.jpg",
    createdAt: "2024-01-03T18:30:00Z",
    status: "public",
  },
];
