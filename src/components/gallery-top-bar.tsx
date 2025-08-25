"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Calendar, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GalleryWithItems } from "@/types/gallery";

interface GalleryTopBarProps {
  galleries: GalleryWithItems[];
  onFilteredGalleriesChange: (filteredGalleries: GalleryWithItems[]) => void;
  showViewToggle?: boolean;
  onViewModeChange?: (mode: "grid" | "list") => void;
  viewMode?: "grid" | "list";
  className?: string;
  showCreateButton?: boolean;
  onCreateGallery?: () => void;
}

export function GalleryTopBar({
  galleries,
  onFilteredGalleriesChange,
  showViewToggle = true,
  onViewModeChange,
  viewMode = "grid",
  className = "",
  showCreateButton = true,
  onCreateGallery,
}: GalleryTopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filtering and sorting logic
  const filteredGalleries = useMemo(() => {
    let filtered = [...galleries];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (gallery) =>
          gallery.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          gallery.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type (public/private)
    if (filterType !== "all") {
      filtered = filtered.filter((gallery) => (filterType === "public" ? gallery.isPublic : !gallery.isPublic));
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        case "most-images":
          return (b.imageCount || 0) - (a.imageCount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [galleries, searchQuery, filterType, sortBy]);

  // Notify parent component of filtered results
  useEffect(() => {
    onFilteredGalleriesChange(filteredGalleries);
  }, [filteredGalleries, onFilteredGalleriesChange]);

  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      {/* Top row: Create button and View toggle */}
      <div className="flex justify-between items-center gap-4">
        {/* Create button and Admin actions */}
        <div className="flex gap-2">
          {showCreateButton && <Button onClick={onCreateGallery}>Create Gallery</Button>}
        </div>

        {/* View Mode Toggle */}
        {showViewToggle && onViewModeChange && (
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Bottom row: Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search galleries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Type Filter */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Galleries</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="most-images">Most Images</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
