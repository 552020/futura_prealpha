"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuthGuard } from "@/utils/authentication";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Edit, Globe, Lock, ImageIcon, Trash2, Maximize2, Eye, EyeOff } from "lucide-react";
import { galleryService } from "@/services/gallery";
import { GalleryWithItems } from "@/types/gallery";

const USE_MOCK_DATA = true;

export default function GalleryViewPage() {
  const { id } = useParams();
  const { isAuthorized, isLoading: authLoading } = useAuthGuard();
  const [gallery, setGallery] = useState<GalleryWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthorized && id) {
      loadGallery();
    }
  }, [isAuthorized, id]);

  const loadGallery = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await galleryService.getGallery(id as string, USE_MOCK_DATA);
      setGallery(result.gallery);
    } catch (err) {
      console.error("Error loading gallery:", err);
      setError("Failed to load gallery");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseLightbox = () => {
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && gallery) {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : gallery.items.length - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && gallery) {
      setSelectedImageIndex(selectedImageIndex < gallery.items.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  const handleDeleteGallery = () => {
    // TODO: Implement delete gallery functionality
    console.log("Delete gallery:", gallery?.id);
  };

  const handleFullScreenView = () => {
    // TODO: Implement full screen view functionality
    console.log("Enter full screen view");
  };

  const handleTogglePrivacy = () => {
    // TODO: Implement privacy toggle functionality
    console.log("Toggle privacy for gallery:", gallery?.id);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">You need to be logged in to view this gallery</p>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Gallery not found</h2>
          <p className="text-muted-foreground mb-6">{error || "This gallery doesn't exist"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-light">{gallery.title}</h1>
                <Badge variant="outline" className="text-xs font-normal">
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
              {gallery.description && <p className="text-muted-foreground text-sm mt-1">{gallery.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={handleFullScreenView}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleTogglePrivacy}>
                {gallery.isPublic ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteGallery}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Grid */}
      <div className="container mx-auto px-6 py-8">
        {gallery.items && gallery.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gallery.items.map((item, index) => (
              <div
                key={item.id}
                className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleImageClick(index)}
              >
                {item.memory.url && !failedImages.has(item.memory.url) ? (
                  <div className="w-full h-full relative">
                    <img
                      src={item.memory.url}
                      alt={item.memory.title || `Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(item.memory.url!)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-2" />
                      <span className="text-sm">Photo {index + 1}</span>
                      {failedImages.has(item.memory.url!) && (
                        <span className="text-xs text-muted-foreground/70 mt-1">Failed to load</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold mb-2">No photos in this gallery yet</h3>
            <p className="text-muted-foreground mb-6">Add photos to this gallery to see them here.</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              ✕
            </button>

            {/* Navigation buttons */}
            <button
              onClick={handlePreviousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              ‹
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              ›
            </button>

            {/* Image */}
            <div className="max-w-4xl max-h-full p-8">
              <div className="bg-muted rounded-lg p-8 text-center">
                <ImageIcon className="h-32 w-32 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  Photo {selectedImageIndex + 1} of {gallery.items.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
