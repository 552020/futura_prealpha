"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuthGuard } from "@/utils/authentication";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, Edit, Globe, Lock, ImageIcon, Trash2, Eye, EyeOff, Maximize2, HardDrive } from "lucide-react";
import { galleryService } from "@/services/gallery";
import { GalleryWithItems } from "@/types/gallery";
import { ForeverStorageProgressModal } from "@/components/galleries/ForeverStorageProgressModal";

// Mock data flag for development - same pattern as dashboard
// const USE_MOCK_DATA = true;
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA_GALLERY === "true";

export default function GalleryViewPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthorized, isLoading: authLoading } = useAuthGuard();
  const [gallery, setGallery] = useState<GalleryWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showForeverStorageModal, setShowForeverStorageModal] = useState(false);

  const loadGallery = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    if (isAuthorized && id) {
      loadGallery();
    }
  }, [isAuthorized, id, loadGallery]);

  // Auto-open modal if returning from II linking flow
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldOpen = searchParams?.get("storeForever") === "1";
    if (shouldOpen) {
      setShowForeverStorageModal(true);
      // Clean the query param to avoid reopening on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("storeForever");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  const handleImageClick = (index: number) => {
    // Navigate to preview page with the specific image index
    router.push(`/gallery/${id}/preview?image=${index}`);
  };

  const handleImageError = useCallback((imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  }, []);

  const handleDeleteGallery = async () => {
    if (!gallery || !confirm("Are you sure you want to delete this gallery? This action cannot be undone.")) {
      return;
    }

    try {
      setIsDeleting(true);
      await galleryService.deleteGallery(gallery.id, USE_MOCK_DATA);
      router.push("/gallery");
    } catch (err) {
      console.error("Error deleting gallery:", err);
      setError("Failed to delete gallery");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFullScreenView = () => {
    router.push(`/gallery/${id}/preview`);
  };

  const handleTogglePrivacy = async () => {
    if (!gallery) return;

    try {
      setIsUpdating(true);
      const updatedGallery = await galleryService.updateGallery(
        gallery.id,
        { isPublic: !gallery.isPublic },
        USE_MOCK_DATA
      );
      setGallery(updatedGallery);
    } catch (err) {
      console.error("Error updating gallery privacy:", err);
      setError("Failed to update gallery privacy");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditGallery = () => {
    // TODO: Navigate to edit page or open edit modal
    console.log("Edit gallery:", gallery?.id);
  };

  const handleStoreForever = () => {
    setShowForeverStorageModal(true);
  };

  const handleForeverStorageSuccess = async (result: {
    success: boolean;
    galleryId: string;
    icpGalleryId: string;
    timestamp: string;
  }) => {
    console.log("Gallery stored forever successfully:", result);
    // Refresh gallery data to show updated storage status
    await loadGallery();
  };

  const handleForeverStorageError = (error: Error) => {
    console.error("Error storing gallery forever:", error);
    setError("Failed to store gallery forever");
  };

  const handleShareGallery = () => {
    // TODO: Implement share functionality
    console.log("Share gallery:", gallery?.id);
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
        <div className="container mx-auto px-6 py-4 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between min-w-0">
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
            <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
              <Button variant="outline" size="sm" onClick={handleFullScreenView}>
                <Maximize2 className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareGallery}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleTogglePrivacy} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Updating...
                  </>
                ) : gallery.isPublic ? (
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
              <Button variant="outline" size="sm" onClick={handleEditGallery}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStoreForever}
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Store Forever
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteGallery} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
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
                    <Image
                      src={item.memory.url}
                      alt={item.memory.title || `Photo ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(item.memory.url!)}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
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
            <h3 className="text-xl font-semibold mb-2">No photos in this gallery yet</h3>
            <p className="text-muted-foreground mb-6">Add photos to this gallery to see them here.</p>
          </div>
        )}
      </div>

      {/* Forever Storage Modal */}
      {gallery && (
        <ForeverStorageProgressModal
          isOpen={showForeverStorageModal}
          onClose={() => setShowForeverStorageModal(false)}
          gallery={gallery}
          onSuccess={handleForeverStorageSuccess}
          onError={handleForeverStorageError}
        />
      )}
    </div>
  );
}
