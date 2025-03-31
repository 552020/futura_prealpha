"use client";

import { useEffect, useState } from "react";
import { MemoryActions } from "@/components/memory/MemoryActions";
import { Button } from "@/components/ui/button";
import { Loader2, Image, Video, FileText, Music } from "lucide-react";
import { useAuthGuard } from "@/utils/authentication";

interface Memory {
  id: string;
  type: "image" | "video" | "note" | "audio";
  title: string;
  description?: string;
  createdAt: string;
  url?: string;
  content?: string;
  mimeType?: string;
}

export default function MemoryDetailPage({ params }: { params: { id: string } }) {
  const { isAuthorized, isAuthenticated, isTemporaryUser, userId, redirectToSignIn } = useAuthGuard();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthorized) {
      redirectToSignIn();
    }
  }, [isAuthorized, redirectToSignIn]);

  useEffect(() => {
    if (isAuthorized && userId) {
      fetchMemory();
    }
  }, [isAuthorized, userId, params.id]);

  const fetchMemory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/memories/${params.id}`);
      if (!response.ok) throw new Error("Failed to fetch memory");

      const data = await response.json();
      setMemory(data);
    } catch (error) {
      console.error("Error fetching memory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/memories/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete memory");

      // Redirect back to vault page
      window.location.href = "/vault";
    } catch (error) {
      console.error("Error deleting memory:", error);
    }
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share memory:", params.id);
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold text-red-600">Memory not found</h1>
        <p className="mt-2">The memory you're looking for doesn't exist or you don't have access to it.</p>
      </div>
    );
  }

  const getIcon = () => {
    switch (memory.type) {
      case "image":
        return <Image className="h-8 w-8" />;
      case "video":
        return <Video className="h-8 w-8" />;
      case "note":
        return <FileText className="h-8 w-8" />;
      case "audio":
        return <Music className="h-8 w-8" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {getIcon()}
          <h1 className="text-3xl font-bold">{memory.title}</h1>
        </div>
        <MemoryActions id={memory.id} onDelete={handleDelete} onShare={handleShare} />
      </div>
      <div className="rounded-lg border p-6">
        {memory.type === "image" && memory.url && (
          <img src={memory.url} alt={memory.title} className="mx-auto max-h-[600px] rounded-lg" />
        )}
        {memory.type === "video" && memory.url && (
          <video controls className="mx-auto max-h-[600px] rounded-lg">
            <source src={memory.url} type={memory.mimeType} />
            Your browser does not support the video tag.
          </video>
        )}
        {memory.type === "audio" && memory.url && (
          <audio controls className="mx-auto w-full">
            <source src={memory.url} type={memory.mimeType} />
            Your browser does not support the audio tag.
          </audio>
        )}
        {memory.type === "note" && (
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{memory.content}</p>
          </div>
        )}
        {memory.description && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold">Description</h2>
            <p className="mt-2">{memory.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
