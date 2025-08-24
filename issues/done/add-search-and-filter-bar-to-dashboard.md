# Add SearchAndFilterBar Component to Dashboard

## Current State

The dashboard currently has no search, filtering, or view mode functionality. Users can only browse through their memories without the ability to search, filter by type, sort, or change view modes.

## Problem

Users need comprehensive search and filtering capabilities in the dashboard to efficiently manage and find specific items, especially as their memory collection grows. The current dashboard lacks the sophisticated search interface that exists in the gallery.

## Solution

Create a reusable `SearchAndFilterBar` component and integrate it into the dashboard, bringing the complete search and filtering experience from the gallery page.

## Requirements

### SearchAndFilterBar Features to Add

1. **Search Bar**

   - Beautiful search input with search icon
   - Placeholder text: "Search memories, tags, or descriptions..."
   - Real-time search as user types
   - Clean, elegant design matching the dashboard aesthetic

2. **Type Filter Dropdown**

   - Filter by memory type (All Types, Images, Videos, Documents, Audio)
   - Dropdown with filter icon and chevron
   - Responsive design

3. **Sort Dropdown**

   - Sort options (Newest First, Oldest First, Most Viewed, Favorites First)
   - Dropdown with calendar icon and chevron
   - Configurable sort options

4. **View Mode Toggle**

   - Grid/List view toggle
   - Segmented control with icons
   - Optional feature (can be disabled)

5. **Search Functionality**

   - Search through memory titles
   - Search through memory descriptions
   - Search through tags (if available)
   - Case-insensitive search
   - Instant filtering of results

6. **UI Integration**
   - Position prominently in dashboard header
   - Maintain existing dashboard layout and styling
   - Responsive design for mobile and desktop
   - Smooth animations and transitions

### Implementation Details

- Create reusable `SearchAndFilterBar` component
- Extract all search/filter logic from gallery
- Make component configurable (show/hide features)
- Integrate with current dashboard memory display
- Update memory filtering logic
- Maintain existing pagination/infinite scroll if present
- Keep existing memory card design and functionality

### Complete SearchAndFilterBar Code from Gallery

```tsx
// State management
const [searchQuery, setSearchQuery] = useState("");
const [filterType, setFilterType] = useState<string>("all");
const [sortBy, setSortBy] = useState<string>("newest");
const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

// Filtering and sorting logic
const filteredMemories = useMemo(() => {
  let filtered = [...memories];

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

  // Sort results
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
}, [memories, searchQuery, filterType, sortBy]);

// Complete SearchAndFilterBar JSX
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
</div>;
```

**Required imports:**

```tsx
import { Search, Filter, Calendar, Grid3X3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
```

### User Experience

- **Comprehensive Search**: Full search, filter, sort, and view capabilities
- **Efficient**: Find and organize memories quickly
- **Intuitive**: All controls work as expected with instant results
- **Consistent**: Same experience across the app
- **Flexible**: Configurable features based on needs

## Technical Tasks

1. Create `SearchAndFilterBar` component
2. Extract all search/filter logic from gallery
3. Make component configurable and reusable
4. Integrate with dashboard memory display
5. Update memory filtering and sorting logic
6. Test all functionality with existing memory data
7. Ensure responsive design works correctly
8. Update any existing memory fetching logic to support filtering

## Success Criteria

- `SearchAndFilterBar` component is created and reusable
- Dashboard has full search, filter, sort, and view capabilities
- All features work on both desktop and mobile
- No performance degradation with large memory collections
- Consistent styling with existing dashboard design
- Component can be easily reused in other parts of the app

## Notes

- This is for the **family vertical** (dashboard/vault)
- Should feel integrated with existing dashboard functionality
- Component should be generic enough for future reuse
- Consider making view mode toggle optional/configurable
