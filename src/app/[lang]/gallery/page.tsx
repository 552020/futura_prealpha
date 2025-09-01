"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuthGuard } from "@/utils/authentication";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Image, Lock, Globe } from "lucide-react";
import { galleryService } from "@/services/gallery";
import { GalleryWithItems } from "@/types/gallery";
import { GalleryTopBar } from "@/components/gallery-top-bar";
import RequireAuth from "@/components/require-auth";
import { StorageStatusBadge, getGalleryStorageStatus } from "@/components/storage-status-badge";
import { CreateGalleryModal } from "@/components/galleries/CreateGalleryModal";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { ErrorState } from "@/components/common/error-state";

// Mock data flag for development
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA_GALLERY === "true";

export default function GalleryPage() {
  const params = useParams();
  const lang = params.lang as string;
  const { isAuthorized, isLoading: authLoading } = useAuthGuard();

  const [galleries, setGalleries] = useState<GalleryWithItems[]>([]);
  const [filteredGalleries, setFilteredGalleries] = useState<GalleryWithItems[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isAuthorized) {
      loadGalleries();
    }
  }, [isAuthorized]);

  const loadGalleries = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await galleryService.listGalleries(1, 12, USE_MOCK_DATA);
      setGalleries(result.galleries);
      setFilteredGalleries(result.galleries);
    } catch (err) {
      console.error("Error loading galleries:", err);
      setError("Failed to load galleries");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryClick = (gallery: GalleryWithItems) => {
    // Navigate to gallery view
    window.location.href = `/${lang}/gallery/${gallery.id}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGalleryCreated = (_galleryId: string) => {
    // Reload galleries to show the new one
    loadGalleries();
  };

  const handleFilteredGalleriesChange = (filtered: GalleryWithItems[]) => {
    setFilteredGalleries(filtered);
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
  };

  if (!isAuthorized || authLoading) {
    // Show loading spinner only while status is loading
    if (authLoading) {
      return <LoadingSpinner fullScreen text="Loading..." />;
    }

    // Show access denied for unauthenticated users
    return <RequireAuth />;
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading galleries..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Something went wrong"
        message={error}
        onRetry={loadGalleries}
        retryText="Try Again"
        fullScreen
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="container mx-auto px-6 py-4">
        <GalleryTopBar
          galleries={galleries}
          onFilteredGalleriesChange={handleFilteredGalleriesChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          onCreateGallery={() => setShowCreateModal(true)}
        />
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-6">
        {filteredGalleries.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No galleries yet</h3>
            <p className="text-muted-foreground mb-6">Create your first gallery to start organizing your photos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGalleries.map((gallery) => (
              <Card
                key={gallery.id}
                className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => handleGalleryClick(gallery)}
              >
                <div className="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                  {/* Cover image placeholder */}
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
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
                      {/* eslint-disable-next-line jsx-a11y/alt-text */}
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
        )}
      </div>

      {/* Create Gallery Modal */}
      <CreateGalleryModal
        trigger={<Button className="hidden">Create Gallery</Button>}
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onGalleryCreated={handleGalleryCreated}
      />
    </div>
  );
}
