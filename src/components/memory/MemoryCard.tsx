"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Image as ImageIcon, FileText, Music, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShareDialog } from "./ShareDialog";
import { Memory } from "@/types/memory";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MemoryStatus } from "./MemoryStatus";
import { cn } from "@/lib/utils";

interface MemoryCardProps {
  memory: Memory & { status: "private" | "shared" | "public"; sharedWithCount?: number };
  onDelete?: (id: string) => void;
  onShare?: () => void;
  onClick?: (memory: Memory) => void;
  className?: string;
}

export function MemoryCard({ memory, onDelete, onShare, onClick, className }: MemoryCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(memory.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const getIcon = () => {
    switch (memory.type) {
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all hover:shadow-md",
          onClick && "cursor-pointer",
          className
        )}
        onClick={() => onClick?.(memory)}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <h3 className="font-semibold leading-none tracking-tight">{memory.title}</h3>
          </div>
          <MemoryStatus status={memory.status} sharedWithCount={memory.sharedWithCount} />
        </CardHeader>
        <CardContent>
          {memory.type === "image" && memory.thumbnail && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={memory.thumbnail}
                alt={memory.title || "Memory image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          {memory.type === "note" && memory.content && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{memory.content}</p>
          )}
          {memory.type === "audio" && (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <Music className="h-4 w-4" />
              <span className="text-sm">Audio file</span>
            </div>
          )}
          {memory.type === "video" && memory.thumbnail && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <video src={memory.thumbnail} className="h-full w-full object-cover" poster={memory.thumbnail} />
            </div>
          )}
          {memory.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{memory.description}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
            >
              Share
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteDialogOpen(true);
              }}
            >
              Delete
            </Button>
          )}
        </CardFooter>
      </Card>

      {onDelete && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Memory</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this memory? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
