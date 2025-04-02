"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ImageIcon, Video, Share2, Trash2, File } from "lucide-react";
import { Memory } from "@/types/memory";
import { MemoryStatus } from "./MemoryStatus";
import Image from "next/image";

interface MemoryCardProps {
  memory: Memory & {
    status: "private" | "shared" | "public";
    sharedWithCount?: number;
    sharedBy?: string;
  };
  onClick: (memory: Memory) => void;
  onShare: (memoryId: string) => void;
  onDelete: (memoryId: string) => void;
}

export function MemoryCard({ memory, onClick, onShare, onDelete }: MemoryCardProps) {
  return (
    <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => onClick(memory)}>
      <CardHeader className="p-4">
        <MemoryStatus status={memory.status} sharedWithCount={memory.sharedWithCount} sharedBy={memory.sharedBy} />
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          {memory.type === "image" ? (
            <ImageIcon className="h-5 w-5" />
          ) : memory.type === "video" ? (
            <Video className="h-5 w-5" />
          ) : memory.type === "note" ? (
            <FileText className="h-5 w-5" />
          ) : memory.type === "document" ? (
            <File className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
          <h3 className="font-medium">{memory.title}</h3>
        </div>
        {memory.description && <p className="mt-2 text-sm text-muted-foreground">{memory.description}</p>}
        {memory.type === "image" && memory.thumbnail && (
          <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-lg">
            <Image
              src={memory.thumbnail}
              alt={memory.title || "Memory image"}
              fill={true}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4">
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onShare(memory.id);
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(memory.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
