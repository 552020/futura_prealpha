import { Badge } from "@/components/ui/badge";

export type StorageStatus = "icp" | "neon";

interface StorageStatusBadgeProps {
  status: StorageStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StorageStatusBadge({ status, size = "sm", className = "" }: StorageStatusBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
  };

  return (
    <Badge variant="secondary" className={`${sizeClasses[size]} font-mono ${className}`}>
      {status.toUpperCase()}
    </Badge>
  );
}

// Mock data for testing
export const mockStorageStatuses = {
  gallery: {
    storedInICP: { status: "icp" as const },
    storedInNeon: { status: "neon" as const },
  },
  memory: {
    storedInICP: { status: "icp" as const },
    storedInNeon: { status: "neon" as const },
  },
};

// Helper function to determine storage status from gallery data
export function getGalleryStorageStatus(gallery: any): StorageStatus {
  // If gallery has storageStatus from our API
  if (gallery.storageStatus) {
    return gallery.storageStatus.status === "stored_forever" ? "icp" : "neon";
  }

  // Fallback: check if gallery has any ICP storage indicators
  if (gallery.icpComplete || gallery.storedInICP) {
    return "icp";
  }

  return "neon";
}

// Helper function to determine storage status from memory data
export function getMemoryStorageStatus(memory: any): StorageStatus {
  // If memory has storageStatus from our API
  if (memory.storageStatus) {
    return memory.storageStatus.status === "stored_forever" ? "icp" : "neon";
  }

  // Fallback: check if memory has any ICP storage indicators
  if (memory.icpComplete || memory.storedInICP) {
    return "icp";
  }

  return "neon";
}
