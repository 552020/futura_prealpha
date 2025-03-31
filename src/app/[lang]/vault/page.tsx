"use client";

import { useEffect, useState, useCallback } from "react";
import { MemoryGrid } from "@/components/memory/MemoryGrid";
import { Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { useAuthGuard } from "@/utils/authentication";
import { normalizeMemories } from "@/utils/normalizeMemories";
import { Memory } from "@/types/memory";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { MemoryUpload } from "@/components/memory/MemoryUpload";

export default function VaultPage() {
  const { isAuthorized, isTemporaryUser, userId, redirectToSignIn, isLoading } = useAuthGuard();
  const router = useRouter();
  const { toast } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoadingMemories, setIsLoadingMemories] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { ref } = useInView();

  const fetchMemories = useCallback(async () => {
    const timestamp = new Date().toISOString();
    try {
      console.group(`🎯 FETCH MEMORIES [${timestamp}]`);
      console.log("Starting fetch:", {
        requestedPage: currentPage,
        currentPageRef: currentPage,
        limit: 12,
        existingMemories: memories.length,
      });

      setIsLoadingMemories(true);
      const response = await fetch(`/api/memories?page=${currentPage}&limit=12`);

      console.log("API Response:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        timestamp: new Date().toISOString(),
      });

      if (!response.ok) throw new Error("Failed to fetch memories");

      const data = await response.json();
      console.log("Raw data from API:", data);

      const newMemories = normalizeMemories(data);
      console.log("Normalized memories:", {
        count: newMemories.length,
        firstMemory: newMemories[0],
        lastMemory: newMemories[newMemories.length - 1],
      });

      // Update memories based on whether this is a reset (page 1) or pagination
      if (currentPage === 1) {
        setMemories(newMemories);
        console.log("Reset memories with page 1 data");
      } else {
        setMemories((prev) => {
          const updated = [...prev, ...newMemories];
          console.log("Appended new memories:", {
            previousCount: prev.length,
            newCount: updated.length,
            added: newMemories.length,
          });
          return updated;
        });
      }

      setHasMore(newMemories.length === 12);
      console.log("Pagination update:", {
        hasMore: newMemories.length === 12,
        nextPage: currentPage + 1,
      });
      console.groupEnd();
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
  }, [currentPage]);

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
      const response = await fetch(`/api/memories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete memory");

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
    router.push(`/vault/${memory.id}`);
  };

  const handleUploadSuccess = () => {
    console.log("🎉 UPLOAD SUCCESS - Resetting and refreshing memories...");
    setCurrentPage(1);
    setMemories([]);
    setHasMore(true);
    fetchMemories();
    toast({
      title: "Success",
      description: "Memory uploaded successfully!",
    });
  };

  const handleUploadError = (error: Error) => {
    console.error("❌ UPLOAD ERROR:", error);
    toast({
      title: "Error",
      description: "Failed to upload memory. Please try again.",
      variant: "destructive",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Memory Vault</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {memories.length} {memories.length === 1 ? "memory" : "memories"}
          </p>
        </div>
        <MemoryUpload onSuccess={handleUploadSuccess} onError={handleUploadError} />
      </div>
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
          <MemoryUpload variant="large-icon" onSuccess={handleUploadSuccess} onError={handleUploadError} />
        </div>
      ) : (
        <MemoryGrid memories={memories} onDelete={handleDelete} onShare={handleShare} onClick={handleMemoryClick} />
      )}
      <div ref={ref} className="mt-8 flex justify-center">
        {isLoadingMemories && <Loader2 className="h-8 w-8 animate-spin" />}
      </div>
    </div>
  );
}
