import { MemoryCard } from "./MemoryCard";
import { Memory } from "@/types/memory";

interface MemoryGridProps {
  memories: Memory[];
  onDelete: (id: string) => Promise<void>;
  onShare: (id: string) => void;
  onClick: (memory: Memory) => void;
}

export function MemoryGrid({ memories, onDelete, onShare, onClick }: MemoryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {memories.map((memory) => (
        <div key={memory.id} onClick={() => onClick(memory)} className="cursor-pointer">
          <MemoryCard
            {...memory}
            onDelete={async () => {
              await onDelete(memory.id);
            }}
            onShare={() => {
              onShare(memory.id);
            }}
          />
        </div>
      ))}
    </div>
  );
}
