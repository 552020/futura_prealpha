import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image, Lock, Globe } from "lucide-react";
import { GalleryWithItems } from "@/types/gallery";
import { StorageStatusBadge, getGalleryStorageStatus } from "@/components/storage-status-badge";

interface GalleryGridProps {
  galleries: GalleryWithItems[];
  onGalleryClick: (gallery: GalleryWithItems) => void;
  viewMode?: "grid" | "list";
}

export function GalleryGrid({ galleries, onGalleryClick, viewMode = "grid" }: GalleryGridProps) {
  if (galleries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Image className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No galleries yet</h3>
        <p className="text-muted-foreground mb-6">Create your first gallery to start organizing your photos</p>
      </div>
    );
  }

  const gridClasses =
    viewMode === "list"
      ? "grid grid-cols-1 gap-4"
      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

  return (
    <div className={gridClasses}>
      {galleries.map((gallery) => (
        <Card
          key={gallery.id}
          className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
          onClick={() => onGalleryClick(gallery)}
        >
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
      ))}
    </div>
  );
}
