"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

interface MemoryCardProps extends Memory {
  onDelete: (id: string) => void;
  onShare?: () => void;
}

export function MemoryCard({
  id,
  type,
  title,
  description,
  createdAt,
  thumbnail,
  content,
  onDelete,
  onShare,
}: MemoryCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = () => {
    onDelete(id);
    setIsDeleteDialogOpen(false);
  };

  const getIcon = () => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-6 w-6" />;
      case "video":
        return <Video className="h-6 w-6" />;
      case "note":
        return <FileText className="h-6 w-6" />;
      case "audio":
        return <Music className="h-6 w-6" />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all hover:shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIcon()}
              <div>
                <h3 className="font-semibold truncate">{title || "Untitled"}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className={`flex gap-2 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}>
              <ShareDialog memoryId={id} onShare={onShare} />
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {type === "image" && thumbnail && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={thumbnail}
                alt={title || "Memory image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
          {type === "note" && content && <p className="line-clamp-3 text-sm text-muted-foreground">{content}</p>}
          {type === "audio" && (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <Music className="h-4 w-4" />
              <span className="text-sm">Audio file</span>
            </div>
          )}
          {type === "video" && thumbnail && (
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
              <video src={thumbnail} className="h-full w-full object-cover" poster={thumbnail} />
            </div>
          )}
          {description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{description}</p>}
        </CardContent>
      </Card>

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
    </>
  );
}
