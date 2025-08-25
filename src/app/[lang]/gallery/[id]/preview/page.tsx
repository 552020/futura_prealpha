"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/utils/authentication";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download, Share2, Globe } from "lucide-react";
import { galleryService } from "@/services/gallery";
import { GalleryWithItems } from "@/types/gallery";

// Gallery Preview Header Component
function GalleryPreviewPageHeader({
  gallery,
  onExitPreview,
  onDownload,
  onShare,
}: {
  gallery: GalleryWithItems;
  onExitPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitPreview}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Preview
          </Button>
          <div className="text-gray-900 dark:text-white">
            <h1 className="text-lg font-semibold">{gallery.title}</h1>
            {gallery.description && <p className="text-sm text-gray-600 dark:text-gray-300">{gallery.description}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

// Gallery Hero Cover Component
function GalleryHeroCover({
  gallery,
  failedImages,
  onSkipCover,
  onImageError,
  onExitPreview,
  onDownload,
  onShare,
}: {
  gallery: GalleryWithItems;
  failedImages: Set<string>;
  onSkipCover: () => void;
  onImageError: (url: string) => void;
  onExitPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <div className="relative w-full h-screen bg-black">
      {/* Cover image */}
      {gallery.items[0]?.memory.url && !failedImages.has(gallery.items[0].memory.url) ? (
        <img
          src={gallery.items[0].memory.url}
          alt={gallery.items[0].memory.title || "Gallery Cover"}
          className="w-full h-full object-cover"
          onError={() => onImageError(gallery.items[0].memory.url!)}
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="h-32 w-32 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
            <h1 className="text-2xl font-semibold mb-2">{gallery.title}</h1>
            {gallery.description && <p className="text-gray-300">{gallery.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// Sticky Header Component (separate from hero)
function StickyHeader({
  gallery,
  onExitPreview,
  onDownload,
  onShare,
}: {
  gallery: GalleryWithItems;
  onExitPreview: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  return (
    <div className="sticky top-0 -mt-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto h-16 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-gray-900 dark:text-white min-w-0">
            <h1 className="text-lg font-semibold truncate">{gallery.title}</h1>
            {gallery.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{gallery.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExitPreview}
              className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Exit Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => console.log("Publish gallery")}
              className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Publish
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}

// Gallery Grid Component
function GalleryGrid({
  gallery,
  failedImages,
  onImageClick,
  onImageError,
}: {
  gallery: GalleryWithItems;
  failedImages: Set<string>;
  onImageClick: (index: number) => void;
  onImageError: (url: string) => void;
}) {
  return (
    <div className="px-6 pb-8">
      {gallery.items && gallery.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {gallery.items.map((item, index) => (
            <div
              key={item.id}
              className="aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(index)}
            >
              {item.memory.url && !failedImages.has(item.memory.url) ? (
                <div className="w-full h-full relative">
                  <img
                    src={item.memory.url}
                    alt={item.memory.title || `Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => onImageError(item.memory.url!)}
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <div className="h-16 w-16 mb-2 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📷</span>
                    </div>
                    <span className="text-sm">Photo {index + 1}</span>
                    {failedImages.has(item.memory.url!) && (
                      <span className="text-xs text-gray-500 mt-1">Failed to load</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-white">
          <h3 className="text-xl font-semibold mb-2">No photos in this gallery yet</h3>
          <p className="text-gray-300 mb-6">Add photos to this gallery to see them here.</p>
        </div>
      )}
    </div>
  );
}

const USE_MOCK_DATA = true;

export default function GalleryPreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthorized, isLoading: authLoading } = useAuthGuard();
  const [gallery, setGallery] = useState<GalleryWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [showCover, setShowCover] = useState(true);

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

  const handleExitPreview = () => {
    router.push(`/gallery/${id}`);
  };

  const handleSkipCover = () => {
    setShowCover(false);
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download current image");
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share current image");
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex !== null) {
        switch (e.key) {
          case "Escape":
            handleCloseLightbox();
            break;
          case "ArrowLeft":
            handlePreviousImage();
            break;
          case "ArrowRight":
            handleNextImage();
            break;
        }
      } else {
        switch (e.key) {
          case "Escape":
            handleExitPreview();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-center text-gray-900 dark:text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-950">
        <div className="text-center text-gray-900 dark:text-white">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">You need to be logged in to view this gallery</p>
          <Button onClick={handleExitPreview} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (error || !gallery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error || "Gallery not found"}</p>
          <Button onClick={handleExitPreview} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-950">
      {/* Hero Cover Section */}
      {showCover && gallery && gallery.items.length > 0 && (
        <GalleryHeroCover
          gallery={gallery}
          failedImages={failedImages}
          onSkipCover={handleSkipCover}
          onImageError={handleImageError}
          onExitPreview={handleExitPreview}
          onDownload={handleDownload}
          onShare={handleShare}
        />
      )}

      {/* Sticky Header */}
      <StickyHeader
        gallery={gallery}
        onExitPreview={handleExitPreview}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {/* Photo Grid */}
      <div className="pt-16">
        <GalleryGrid
          gallery={gallery}
          failedImages={failedImages}
          onImageClick={handleImageClick}
          onImageError={handleImageError}
        />
      </div>

      {/* Lightbox */}
      {selectedImageIndex !== null && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={handleCloseLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation buttons */}
            <button
              onClick={handlePreviousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2"
            >
              <ChevronRight className="h-8 w-8" />
            </button>

            {/* Image */}
            <div className="max-w-5xl max-h-full p-8">
              {gallery.items[selectedImageIndex]?.memory.url &&
              !failedImages.has(gallery.items[selectedImageIndex].memory.url!) ? (
                <img
                  src={gallery.items[selectedImageIndex].memory.url}
                  alt={gallery.items[selectedImageIndex].memory.title || `Photo ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="bg-gray-800 rounded-lg p-8 text-center">
                  <div className="h-32 w-32 mx-auto mb-4 bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-4xl">📷</span>
                  </div>
                  <p className="text-lg text-gray-300">
                    Photo {selectedImageIndex + 1} of {gallery.items.length}
                  </p>
                </div>
              )}
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {selectedImageIndex + 1} of {gallery.items.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
