"use client";

import { useEffect, useState, useCallback, use } from "react";
import { MemoryGrid } from "@/components/memory/memory-grid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useAuthGuard } from "@/utils/authentication";
import { normalizeMemories } from "@/utils/normalizeMemories";
import { Memory } from "@/types/memory";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import RequireAuth from "@/components/auth/require-auth";

export default function SharedMemoriesPage({ params }: { params: Promise<{ lang: string }> }) {
  // Unwrap params using React.use()
  const { lang } = use(params);

  const { isAuthorized, isTemporaryUser, userId, isLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [memories, setMemories] = useState<
    (Memory & { status: "private" | "shared" | "public"; sharedWithCount?: number; sharedBy?: string })[]
  >([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { ref } = useInView();

  // Log route parameters for debugging
  // console.log("Rendering SharedMemoriesPage", { lang, isAuthorized, userId });

  const fetchMemories = useCallback(async () => {
    const timestamp = new Date().toISOString();
    try {
      // console.log("🔄 FETCH SHARED MEMORIES - Starting fetch:", {
      //   page: currentPage,
      //   timestamp,
      //   lang,
      // });

      const response = await fetch(`/api/memories/shared?page=${currentPage}`);
      if (!response.ok) {
        throw new Error("Failed to fetch shared memories");
      }

      const data = await response.json();
      // console.log("✅ FETCH SHARED MEMORIES - Success:", {
      //   imagesCount: data.images.length,
      //   documentsCount: data.documents.length,
      //   notesCount: data.notes.length,
      //   hasMore: data.hasMore,
      //   timestamp,
      // });

      const normalizedMemories = normalizeMemories({
        images: data.images,
        documents: data.documents,
        notes: data.notes,
        videos: data.videos || [],
      }).map((memory) => ({
        ...memory,
        status: "shared" as const,
        sharedWithCount: 1, // Since this is the shared memories page, each memory is shared with the current user
        sharedBy: memory.ownerName || "Unknown", // Add the sharer's name
      }));

      setMemories((prev) => {
        if (currentPage === 1) return normalizedMemories;
        return [...prev, ...normalizedMemories];
      });
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("❌ FETCH SHARED MEMORIES ERROR:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp,
      });
      toast({
        title: "Error",
        description: "Failed to load shared memories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMemories(false);
    }
  }, [currentPage, toast]);

  // Removed automatic redirect - now handled by RequireAuth component in render

  useEffect(() => {
    if (isAuthorized && userId) {
      fetchMemories();
    }
  }, [isAuthorized, userId, fetchMemories]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
        if (!isLoadingMemories && hasMore) {
          setCurrentPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoadingMemories, hasMore]);

  const handleDelete = async (id: string) => {
    try {
      // Check if this is a folder item
      if (id.startsWith("folder-")) {
        const folderName = id.replace("folder-", "");
        const response = await fetch(`/api/memories?folder=${encodeURIComponent(folderName)}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete folder");

        setMemories((prev) => prev.filter((memory) => memory.id !== id));
        toast({
          title: "Success",
          description: `Folder "${folderName}" and all its contents deleted successfully.`,
        });
      } else {
        // Handle individual memory deletion
        const response = await fetch(`/api/memories/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error("Failed to delete memory");

        setMemories((prev) => prev.filter((memory) => memory.id !== id));
        toast({
          title: "Success",
          description: "Memory deleted successfully.",
        });
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
      toast({
        title: "Error",
        description: "Failed to delete memory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    // Refresh the memories list to show any new shares
    fetchMemories();
  };

  const handleMemoryClick = (memory: Memory) => {
    router.push(`/${lang}/shared/${memory.id}`);
  };

  if (!isAuthorized || isLoading) {
    // Show loading spinner only while status is loading
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    // Show access denied for unauthenticated users
    return <RequireAuth />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="mb-8 text-3xl font-bold">Shared Memories</h1>

      {isTemporaryUser && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-4 text-yellow-800">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium">Temporary Account</h3>
              <div className="mt-2 text-sm">
                <p>
                  You are currently using a temporary account. Your memories will be saved, but you need to complete the
                  signup process within 7 days to keep your account and all your memories.
                </p>
                <p className="mt-2">After 7 days, your account and all memories will be automatically deleted.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No shared memories yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            When someone shares a memory with you, it will appear here.
          </p>
        </div>
      ) : (
        <MemoryGrid memories={memories} onDelete={handleDelete} onShare={handleShare} onClick={handleMemoryClick} />
      )}

      {/* Loading indicator */}
      {isLoadingMemories && (
        <div className="mt-8 flex justify-center" ref={ref}>
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
}
