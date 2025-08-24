import { Memory } from "@/types/memory";
import { MemoryCard } from "./MemoryCard";

interface MemoryGridProps {
  memories: (Memory & { status: "private" | "shared" | "public"; sharedWithCount?: number })[];
  onDelete?: (id: string) => void;
  onShare?: () => void;
  onEdit?: (id: string) => void;
  onClick?: (memory: Memory) => void;
  viewMode?: "grid" | "list";
}

export function MemoryGrid({ memories, onDelete, onShare, onEdit, onClick, viewMode = "grid" }: MemoryGridProps) {
  return (
    <div
      className={
        viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-4"
      }
    >
      {memories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onDelete={onDelete || (() => {})}
          onShare={onShare || (() => {})}
          onEdit={onEdit || (() => {})}
          onClick={onClick || (() => {})}
          viewMode={viewMode}
        />
      ))}
    </div>
  );
}
