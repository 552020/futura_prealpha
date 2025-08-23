"use client";

import { useEffect, useState, useCallback } from "react";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useAuthGuard } from "@/utils/authentication";
import { Memory } from "@/types/memory";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ItemUploadButton } from "@/components/memory/ItemUploadButton";
import { useParams } from "next/navigation";
import { fetchAndNormalizeMemories, deleteMemory, memoryActions, type NormalizedMemory } from "@/services/memories";

export default function VaultPage() {
  const { isAuthorized, isTemporaryUser, userId, redirectToSignIn, isLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [memories, setMemories] = useState<NormalizedMemory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { ref } = useInView();
  const params = useParams();

  const fetchMemories = useCallback(async () => {
    const timestamp = new Date().toISOString();
    try {
      console.log("🔄 FETCH MEMORIES - Starting fetch:", {
        page: currentPage,
        timestamp,
      });

      const result = await fetchAndNormalizeMemories(currentPage);

      console.log("✅ FETCH MEMORIES - Success:", {
        memoriesCount: result.memories.length,
        hasMore: result.hasMore,
        timestamp,
      });

      setMemories((prev) => {
        if (currentPage === 1) return result.memories;
        return [...prev, ...result.memories];
      });
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("❌ FETCH MEMORIES ERROR:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        timestamp,
      });
      toast({
        title: "Error",
        description: "Failed to load memories. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMemories(false);
    }
  }, [currentPage, toast]);

  useEffect(() => {
    if (!isAuthorized) {
      redirectToSignIn();
    }
  }, [isAuthorized, redirectToSignIn]);

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
      await deleteMemory(id);
      setMemories((prev) => prev.filter((memory) => memory.id !== id));
      toast({
        title: "Success",
        description: "Memory deleted successfully.",
      });
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
    const path = memoryActions.navigate(memory, params.lang as string, params.segment as string);
    router.push(path);
  };

  const handleUploadSuccess = () => {
    // Refresh the memories list to show the new memory
    fetchMemories();
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: "Error",
      description: error.message || "Failed to upload memory",
      variant: "destructive",
    });
  };

  if (!isAuthorized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="mb-8 text-3xl font-bold">Your Dashboard</h1>

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
          <h3 className="text-lg font-medium">No memories yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start by uploading your first memory. You can add images, videos, audio files, or write notes.
          </p>
          <ItemUploadButton variant="large-icon" onSuccess={handleUploadSuccess} onError={handleUploadError} />
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
