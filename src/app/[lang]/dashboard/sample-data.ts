import { Memory } from "@/types/memory";

// Extended Memory interface for dashboard with status information
interface DashboardMemory extends Memory {
  status: "private" | "shared" | "public";
  sharedWithCount?: number;
  sharedBy?: string;
  metadata?: {
    originalPath?: string;
    folderName?: string;
  };
}

export const sampleDashboardMemories: DashboardMemory[] = [
  {
    id: "1",
    title: "Family Vacation Photo",
    description: "Beautiful sunset at the beach during our summer vacation",
    type: "image",
    url: "/mock/dashboard/images/test_image_1.webp",
    thumbnail: "/mock/dashboard/images/test_image_1.webp",
    createdAt: "2024-01-15T10:30:00Z",
    status: "private",
    metadata: {
      originalPath: "Family Vacation/beach_sunset.jpg",
      folderName: "Family Vacation",
    },
  },
  {
    id: "2",
    title: "Wedding Ceremony Video",
    description: "The magical moment when we said our vows",
    type: "video",
    url: "/mock/dashboard/video/test_video_1.mp4",
    createdAt: "2024-01-10T14:20:00Z",
    status: "shared",
    sharedWithCount: 3,
    metadata: {
      originalPath: "Wedding Photos/ceremony/vows_moment.mp4",
      folderName: "Wedding Photos",
    },
  },
  {
    id: "3",
    title: "Important Meeting Notes",
    description: "Key points from the quarterly business review",
    type: "note",
    url: "/mock/dashboard/notes/test_note_1.txt",
    createdAt: "2024-01-08T09:15:00Z",
    status: "public",
    metadata: {
      originalPath: "Work Documents/meetings/q4_review.txt",
      folderName: "Work Documents",
    },
  },
  {
    id: "4",
    title: "Contract Document",
    description: "Signed agreement for the new project",
    type: "document",
    url: "/mock/dashboard/documents/test_document_1.md",
    createdAt: "2024-01-05T16:45:00Z",
    status: "shared",
    sharedWithCount: 1,
  },
  {
    id: "5",
    title: "Shared Memory from John",
    description: "Photo from our hiking trip last weekend",
    type: "image",
    url: "/mock/dashboard/images/test_image_2.webp",
    thumbnail: "/mock/dashboard/images/test_image_2.webp",
    createdAt: "2024-01-12T11:00:00Z",
    status: "shared",
    sharedBy: "John Doe",
  },
  {
    id: "6",
    title: "Public Event Photos",
    description: "Community celebration photos",
    type: "image",
    url: "/mock/dashboard/images/test_image_3.webp",
    thumbnail: "/mock/dashboard/images/test_image_3.webp",
    createdAt: "2024-01-03T18:30:00Z",
    status: "public",
  },
  {
    id: "7",
    title:
      "This is an extremely long memory title that should test how the card handles very long titles and whether they get truncated properly in the UI",
    description: "Short description",
    type: "video",
    url: "/mock/dashboard/video/test_video_2.mp4",
    createdAt: "2024-01-02T12:00:00Z",
    status: "shared",
    sharedWithCount: 2,
  },
  {
    id: "8",
    title: "Audio Recording",
    description:
      "This is a very long description that should test how the memory card handles lengthy descriptions. It contains multiple sentences and should demonstrate whether the footer stays properly aligned at the bottom regardless of the description length. The description should wrap to multiple lines and we want to see if the layout remains consistent across all cards in the grid.",
    type: "audio",
    url: "/mock/dashboard/audio/test_audio_1.mp3",
    createdAt: "2024-01-01T09:00:00Z",
    status: "private",
  },
  {
    id: "9",
    title: "Document File",
    description: "",
    type: "document",
    url: "/mock/dashboard/documents/test_document_2.md",
    createdAt: "2023-12-30T15:45:00Z",
    status: "shared",
    sharedWithCount: 1,
  },
  {
    id: "10",
    title:
      "Another extremely long memory title that demonstrates how the truncation works with different types of content and ensures the UI remains clean and readable even with very lengthy titles",
    description: "Normal description",
    type: "note",
    url: "/mock/dashboard/notes/test_note_1.txt",
    createdAt: "2023-12-29T10:15:00Z",
    status: "public",
  },
];
