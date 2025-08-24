"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuthGuard } from "@/utils/authentication";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Grid3X3, List, Calendar, Heart, Eye, Download, Share2 } from "lucide-react";
import { TawkChatWrapper } from "@/components/tawk-chat-wrapper";

interface Memory {
  id: string;
  title: string;
  description?: string;
  type: "image" | "video" | "document" | "audio";
  url: string;
  thumbnail?: string;
  createdAt: string;
  tags: string[];
  isFavorite: boolean;
  views: number;
}

export default function GalleryPage() {
  const { isAuthorized, isLoading } = useAuthGuard();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Sample data using generated test images
  const sampleMemories: Memory[] = useMemo(
    () => [
      {
        id: "1",
        title: "Beautiful Sunset",
        description: "A stunning sunset captured during golden hour",
        type: "image",
        url: "/gallery/Beautiful_Sunset_01.webp",
        thumbnail: "/gallery/Beautiful_Sunset_01.webp",
        createdAt: "2023-08-15",
        tags: ["sunset", "nature", "golden-hour"],
        isFavorite: true,
        views: 45,
      },
      {
        id: "2",
        title: "Amazing Mountain",
        description: "Breathtaking mountain landscape with snow peaks",
        type: "image",
        url: "/gallery/Amazing_Mountain_02.webp",
        thumbnail: "/gallery/Amazing_Mountain_02.webp",
        createdAt: "2023-06-10",
        tags: ["mountain", "landscape", "snow"],
        isFavorite: true,
        views: 128,
      },
      {
        id: "3",
        title: "Stunning Ocean",
        description: "Crystal clear ocean waters on a perfect day",
        type: "image",
        url: "/gallery/Stunning_Ocean_03.webp",
        thumbnail: "/gallery/Stunning_Ocean_03.webp",
        createdAt: "2023-05-20",
        tags: ["ocean", "water", "nature"],
        isFavorite: false,
        views: 23,
      },
      {
        id: "4",
        title: "Gorgeous Forest",
        description: "Lush green forest with morning mist",
        type: "image",
        url: "/gallery/Gorgeous_Forest_04.webp",
        thumbnail: "/gallery/Gorgeous_Forest_04.webp",
        createdAt: "2023-04-05",
        tags: ["forest", "nature", "mist"],
        isFavorite: true,
        views: 67,
      },
      {
        id: "5",
        title: "Wonderful Garden",
        description: "Colorful flowers blooming in spring",
        type: "image",
        url: "/gallery/Wonderful_Garden_05.webp",
        thumbnail: "/gallery/Wonderful_Garden_05.webp",
        createdAt: "2023-03-12",
        tags: ["garden", "flowers", "spring"],
        isFavorite: false,
        views: 34,
      },
      {
        id: "6",
        title: "Fantastic Landscape",
        description: "Rolling hills and valleys in the countryside",
        type: "image",
        url: "/gallery/Fantastic_Landscape_06.webp",
        thumbnail: "/gallery/Fantastic_Landscape_06.webp",
        createdAt: "2023-02-28",
        tags: ["landscape", "hills", "countryside"],
        isFavorite: false,
        views: 19,
      },
      {
        id: "7",
        title: "Incredible Portrait",
        description: "Professional portrait photography session",
        type: "image",
        url: "/gallery/Incredible_Portrait_07.webp",
        thumbnail: "/gallery/Incredible_Portrait_07.webp",
        createdAt: "2023-01-15",
        tags: ["portrait", "photography", "professional"],
        isFavorite: true,
        views: 89,
      },
      {
        id: "8",
        title: "Spectacular Architecture",
        description: "Modern architectural masterpiece",
        type: "image",
        url: "/gallery/Spectacular_Architecture_08.webp",
        thumbnail: "/gallery/Spectacular_Architecture_08.webp",
        createdAt: "2023-01-10",
        tags: ["architecture", "modern", "design"],
        isFavorite: false,
        views: 56,
      },
    ],
    []
  );

  // Filter and sort memories
  const filteredMemories = useMemo(() => {
    let filtered = sampleMemories;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (memory) =>
          memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memory.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          memory.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((memory) => memory.type === filterType);
    }

    // Sort memories
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "most-viewed":
          return b.views - a.views;
        case "favorites":
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [sampleMemories, searchQuery, filterType, sortBy]);

  const toggleFavorite = useCallback((memoryId: string) => {
    // TODO: Implement favorite toggle
    console.log("Toggle favorite for memory:", memoryId);
  }, []);

  const handleDownload = useCallback((memory: Memory) => {
    // TODO: Implement download functionality
    console.log("Download memory:", memory.title);
  }, []);

  const handleShare = useCallback((memory: Memory) => {
    // TODO: Implement share functionality
    console.log("Share memory:", memory.title);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your gallery...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-4">You need to be logged in to view your gallery.</p>
          <Button>Sign In</Button>
        </div>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "video":
        return "🎥";
      case "document":
        return "📄";
      case "audio":
        return "🎵";
      default:
        return "📁";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "image":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "video":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "document":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "audio":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Gallery</h1>
        <p className="text-muted-foreground">
          {filteredMemories.length} of {sampleMemories.length} memories
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
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
            <SelectTrigger className="w-full sm:w-48">
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
            <SelectTrigger className="w-full sm:w-48">
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

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Memories Grid/List */}
      {filteredMemories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-xl font-semibold mb-2">No memories found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || filterType !== "all"
              ? "Try adjusting your search or filters"
              : "Start by uploading your first memory"}
          </p>
          {!searchQuery && filterType === "all" && <Button>Upload Memory</Button>}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"
          }
        >
          {filteredMemories.map((memory) => (
            <Card key={memory.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                {viewMode === "grid" ? (
                  // Grid View
                  <div className="space-y-3">
                    {/* Thumbnail */}
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                      {memory.thumbnail ? (
                        <img
                          src={memory.thumbnail}
                          alt={memory.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          {getTypeIcon(memory.type)}
                        </div>
                      )}

                      {/* Overlay Actions */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" onClick={() => handleDownload(memory)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleShare(memory)}>
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Favorite Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                        onClick={() => toggleFavorite(memory.id)}
                      >
                        <Heart
                          className={`h-4 w-4 ${memory.isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
                        />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-sm line-clamp-2">{memory.title}</h3>
                        <Badge className={`text-xs ${getTypeColor(memory.type)}`}>{memory.type}</Badge>
                      </div>

                      {memory.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{memory.description}</p>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          <span>{memory.views}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {memory.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{memory.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // List View
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {memory.thumbnail ? (
                        <img src={memory.thumbnail} alt={memory.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          {getTypeIcon(memory.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{memory.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getTypeColor(memory.type)}`}>{memory.type}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => toggleFavorite(memory.id)}>
                            <Heart className={`h-4 w-4 ${memory.isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                          </Button>
                        </div>
                      </div>

                      {memory.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{memory.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{memory.views}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDownload(memory)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleShare(memory)}>
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>

                      {/* Tags */}
                      {memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {memory.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Support */}
      <TawkChatWrapper />
    </div>
  );
}
