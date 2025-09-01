"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image, Lock, Globe } from "lucide-react";
import { GalleryWithItems } from "@/types/gallery";
import { StorageStatusBadge, getGalleryStorageStatus } from "@/components/storage-status-badge";

interface GalleryCardProps {
  gallery: GalleryWithItems;
  onClick: (gallery: GalleryWithItems) => void;
}

export function GalleryCard({ gallery, onClick }: GalleryCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={() => onClick(gallery)}>
      <div className="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
        {/* Cover image placeholder */}
        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <Image className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-lg line-clamp-1">{gallery.title}</h3>
          <div className="flex items-center gap-2">
            <StorageStatusBadge status={getGalleryStorageStatus(gallery)} />
            <Badge variant={gallery.isPublic ? "default" : "secondary"}>
              {gallery.isPublic ? (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              )}
            </Badge>
          </div>
        </div>
        {gallery.description && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">{gallery.description}</p>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Image className="h-4 w-4" aria-hidden="true" />
            <span>{gallery.imageCount} images</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(gallery.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
