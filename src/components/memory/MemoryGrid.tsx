import { Memory } from "@/types/memory";
import { MemoryCard } from "./MemoryCard";

interface MemoryGridProps {
  memories: (Memory & { status: "private" | "shared" | "public"; sharedWithCount?: number })[];
  onDelete?: (id: string) => void;
  onShare?: () => void;
  onClick?: (memory: Memory) => void;
  className?: string;
}

export function MemoryGrid({ memories, onDelete, onShare, onClick, className }: MemoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {memories.map((memory) => (
        <MemoryCard key={memory.id} memory={memory} onDelete={onDelete} onShare={onShare} onClick={onClick} />
      ))}
    </div>
  );
}
