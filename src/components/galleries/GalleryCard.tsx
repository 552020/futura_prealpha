"use client";

import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GalleryWithItems } from "@/types/gallery";
import { formatDistanceToNow } from "date-fns";
import { Eye, Edit, Share2, Image as ImageIcon, Lock, Globe, Calendar, User } from "lucide-react";

interface GalleryCardProps {
  gallery: GalleryWithItems;
  onClick?: () => void;
  onEdit?: (gallery: GalleryWithItems) => void;
  onShare?: (gallery: GalleryWithItems) => void;
  onView?: (gallery: GalleryWithItems) => void;
  className?: string;
}

export function GalleryCard({ gallery, onClick, onEdit, onShare, onView, className = "" }: GalleryCardProps) {
  // Get thumbnail from first gallery item
  const thumbnail = gallery.items?.[0]?.memory?.url || gallery.items?.[0]?.memory?.thumbnail;

  // Format date
  const formattedDate = formatDistanceToNow(new Date(gallery.createdAt), { addSuffix: true });

  // Get item count
  const itemCount = gallery.items?.length || gallery.imageCount || 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on action buttons
    if ((e.target as HTMLElement).closest("[data-action-button]")) {
      return;
    }
    onClick?.();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(gallery);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(gallery);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView?.(gallery);
  };

  return (
    <TooltipProvider>
      <Card
        className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${className}`}
        onClick={handleCardClick}
      >
        {/* Thumbnail */}
        <CardHeader className="p-0 relative">
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={gallery.title}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}

            {/* Overlay with action buttons */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      data-action-button
                      size="sm"
                      variant="secondary"
                      onClick={handleView}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View Gallery</TooltipContent>
                </Tooltip>

                {gallery.isOwner && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        data-action-button
                        size="sm"
                        variant="secondary"
                        onClick={handleEdit}
                        className="bg-white/90 hover:bg-white text-black"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Gallery</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      data-action-button
                      size="sm"
                      variant="secondary"
                      onClick={handleShare}
                      className="bg-white/90 hover:bg-white text-black"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share Gallery</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Privacy badge */}
            <div className="absolute top-2 right-2">
              <Badge variant={gallery.isPublic ? "default" : "secondary"} className="text-xs">
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

            {/* Item count badge */}
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                <ImageIcon className="h-3 w-3 mr-1" />
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {gallery.title}
            </h3>
            {gallery.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{gallery.description}</p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            {gallery.ownerId && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Owner</span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={handleView}>
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              {gallery.isOwner && (
                <Button size="sm" variant="ghost" onClick={handleEdit}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
            <Button size="sm" variant="ghost" onClick={handleShare}>
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}
