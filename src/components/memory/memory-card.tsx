"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ImageIcon, Video, Share2, Trash2, File, Pencil, Music, Folder } from "lucide-react";
import { Memory } from "@/types/memory";
import { MemoryStatus } from "./memory-status";
import { MemoryStorageBadge } from "@/components/memory-storage-badge";
import Image from "next/image";
import { shortenTitle } from "@/lib/utils";

interface MemoryCardProps {
  memory: Memory & {
    status: "private" | "shared" | "public";
    sharedWithCount?: number;
    sharedBy?: string;
  };
  onClick: (memory: Memory) => void;
  onShare: (memoryId: string) => void;
  onDelete: (memoryId: string) => void;
  onEdit: (memoryId: string) => void;
  viewMode?: "grid" | "list";
}

export function MemoryCard({ memory, onClick, onShare, onDelete, onEdit, viewMode = "grid" }: MemoryCardProps) {
  if (viewMode === "list") {
    return (
      <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => onClick(memory)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {memory.type === "image" ? (
                <ImageIcon className="h-8 w-8" />
              ) : memory.type === "video" ? (
                <Video className="h-8 w-8" />
              ) : memory.type === "note" ? (
                <FileText className="h-8 w-8" />
              ) : memory.type === "document" ? (
                <File className="h-8 w-8" />
              ) : memory.type === "audio" ? (
                <Music className="h-8 w-8" />
              ) : memory.type === "folder" ? (
                <Folder className="h-8 w-8" />
              ) : (
                <FileText className="h-8 w-8" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate" title={memory.title}>
                {shortenTitle(memory.title)}
              </h3>
              {memory.description && <p className="text-sm text-muted-foreground truncate">{memory.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <MemoryStatus
                status={memory.status}
                sharedWithCount={memory.sharedWithCount}
                sharedBy={memory.sharedBy}
              />
              {memory.type !== "folder" && (
                <MemoryStorageBadge memoryId={memory.id} memoryType={memory.type} size="xs" />
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(memory.id);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
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
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md flex flex-col h-full"
      onClick={() => onClick(memory)}
    >
      <CardContent className="px-2 pt-4 pb-2 flex-1">
        {/* Preview section */}
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
          {memory.type === "image" && memory.thumbnail ? (
            <Image
              src={memory.thumbnail}
              alt={memory.title || "Memory image"}
              fill={true}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : memory.type === "video" ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Video className="h-16 w-16 mb-2" />
              <span className="text-sm">Video</span>
            </div>
          ) : memory.type === "audio" ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Music className="h-16 w-16 mb-2" />
              <span className="text-sm">Audio</span>
            </div>
          ) : memory.type === "document" ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <File className="h-16 w-16 mb-2" />
              <span className="text-sm">Document</span>
            </div>
          ) : memory.type === "note" ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-16 w-16 mb-2" />
              <span className="text-sm">Note</span>
            </div>
          ) : memory.type === "folder" ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <Folder className="h-16 w-16 mb-2" />
              <span className="text-sm">{memory.itemCount || 0} items</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              <FileText className="h-16 w-16 mb-2" />
              <span className="text-sm">File</span>
            </div>
          )}

          {/* Storage Status Badge - positioned in top-right corner */}
          {memory.type !== "folder" && (
            <div className="absolute top-1 right-1 z-10">
              <MemoryStorageBadge memoryId={memory.id} memoryType={memory.type} size="xs" className="shadow-sm" />
            </div>
          )}
        </div>

        <h3 className="mt-2 text-sm font-medium truncate" title={memory.title}>
          {shortenTitle(memory.title)}
        </h3>
        {memory.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{memory.description}</p>}
      </CardContent>
      <CardFooter className="p-2">
        <div className="flex w-full items-center justify-between">
          {/* Left side - 2 items */}
          <div className="flex items-center gap-3">
            {/* Document type icon */}
            <div className="flex-shrink-0">
              {memory.type === "image" ? (
                <ImageIcon className="h-4 w-4" />
              ) : memory.type === "video" ? (
                <Video className="h-4 w-4" />
              ) : memory.type === "note" ? (
                <FileText className="h-4 w-4" />
              ) : memory.type === "document" ? (
                <File className="h-4 w-4" />
              ) : memory.type === "audio" ? (
                <Music className="h-4 w-4" />
              ) : memory.type === "folder" ? (
                <Folder className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>

            {/* Visibility status */}
            <MemoryStatus status={memory.status} sharedWithCount={memory.sharedWithCount} sharedBy={memory.sharedBy} />
          </div>

          {/* Right side - 3 action buttons */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(memory.id);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
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
        </div>
      </CardFooter>
    </Card>
  );
}
