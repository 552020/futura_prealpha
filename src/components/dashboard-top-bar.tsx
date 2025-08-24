"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, Calendar, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Memory as BaseMemory } from "@/types/memory";
import { ItemUploadButton } from "@/components/memory/ItemUploadButton";

// Extended Memory interface for gallery with additional properties
interface ExtendedMemory extends BaseMemory {
  tags?: string[];
  isFavorite?: boolean;
  views?: number;
}

interface SearchAndFilterBarProps {
  memories: ExtendedMemory[];
  onFilteredMemoriesChange: (filteredMemories: ExtendedMemory[]) => void;
  showViewToggle?: boolean;
  onViewModeChange?: (mode: "grid" | "list") => void;
  viewMode?: "grid" | "list";
  className?: string;
  showUploadButtons?: boolean;
  onUploadSuccess?: () => void;
  onUploadError?: (error: Error) => void;
}

export function DashboardTopBar({
  memories,
  onFilteredMemoriesChange,
  showViewToggle = true,
  onViewModeChange,
  viewMode = "grid",
  className = "",
  showUploadButtons = false,
  onUploadSuccess,
  onUploadError,
}: SearchAndFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Filtering and sorting logic
  const filteredMemories = useMemo(() => {
    let filtered = [...memories];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (memory) =>
          memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memory.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memory.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((memory) => memory.type === filterType);
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "most-viewed":
          return (b.views || 0) - (a.views || 0);
        case "favorites":
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [memories, searchQuery, filterType, sortBy]);

  // Notify parent component of filtered results
  useEffect(() => {
    onFilteredMemoriesChange(filteredMemories);
  }, [filteredMemories, onFilteredMemoriesChange]);

  return (
    <div className={`mb-6 space-y-4 ${className}`}>
      {/* Top row: Upload buttons and View toggle */}
      <div className="flex justify-between items-center gap-4">
        {/* Upload buttons */}
        {showUploadButtons && (
          <div className="flex gap-2">
            <ItemUploadButton
              mode="folder"
              variant="dashboard-add-folder"
              onSuccess={onUploadSuccess}
              onError={onUploadError}
            />
            <ItemUploadButton
              mode="files"
              variant="dashboard-add-file"
              onSuccess={onUploadSuccess}
              onError={onUploadError}
            />
          </div>
        )}

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
            placeholder="Search memories, tags, or descriptions..."
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
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
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
            <SelectItem value="most-viewed">Most Viewed</SelectItem>
            <SelectItem value="favorites">Favorites First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
