"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Globe, Lock, ImageIcon } from "lucide-react";
import { galleryService } from "@/services/gallery";
import { GalleryWithItems } from "@/types/gallery";

// Mock data flag for development - same pattern as dashboard
const USE_MOCK_DATA = true;

export default function PublicGalleryPage() {
  const { id } = useParams();
  const [gallery, setGallery] = useState<GalleryWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      loadGallery();
    }
  }, [id]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await galleryService.getGallery(id as string, USE_MOCK_DATA);

      // Check if gallery is public
      if (!result.gallery.isPublic) {
        setError("This gallery is private");
        return;
      }

      setGallery(result.gallery);
    } catch (err) {
      console.error("Error loading gallery:", err);
      setError("Failed to load gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    // TODO: Will be implemented in task 6 (ImageLightbox component)
    console.log("Image clicked:", index);
  };

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Gallery not found</h2>
          <p className="text-muted-foreground mb-6">{error || "This gallery doesn't exist or is not public"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <h1 className="text-2xl font-light">{gallery.title}</h1>
                <Badge variant="outline" className="text-xs font-normal">
                  <Globe className="h-3 w-3 mr-1" />
                  Public Gallery
                </Badge>
              </div>
              {gallery.description && <p className="text-muted-foreground text-sm mt-1">{gallery.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="container mx-auto px-6 py-8 min-w-0">
        {gallery.items && gallery.items.length > 0 ? (
          <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gallery.items.map((item, index) => (
              <div
                key={item.id}
                className="min-w-0 aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(index)}
              >
                {item.memory.url && !failedImages.has(item.memory.url) ? (
                  <div className="w-full h-full relative min-w-0">
                    <img
                      src={item.memory.url}
                      alt={item.memory.title || `Photo ${index + 1}`}
                      className="block w-full h-full max-w-full object-cover"
                      onError={() => handleImageError(item.memory.url!)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center min-w-0">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-2" />
                      <span className="text-sm break-words">Photo {index + 1}</span>
                      {failedImages.has(item.memory.url!) && (
                        <span className="text-xs text-muted-foreground/70 mt-1 break-words">Failed to load</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No photos in this gallery</h3>
            <p className="text-muted-foreground mb-6">This gallery is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}
