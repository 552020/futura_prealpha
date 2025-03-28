"use client";

import { type MemoryWithType } from "@/app/api/memories/utils/memory";
import Image from "next/image";
import { Button } from "./ui/button";
import { Download, Edit, Trash } from "lucide-react";
import { useState } from "react";
import type { DBImage, DBDocument, DBNote } from "@/db/schema";

interface MemoryViewerProps {
  memory: MemoryWithType;
  isOwner: boolean;
  accessLevel: "read" | "write";
}

export function MemoryViewer({ memory, isOwner }: MemoryViewerProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/memories/${memory.data.id}/download`);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = memory.data.title || "memory";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading memory:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this memory?")) return;

    try {
      const response = await fetch(`/api/memories/${memory.data.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      // Redirect to home or show success message
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting memory:", error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{memory.data.title}</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          {isOwner && (
            <>
              <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Memory Content */}
      <div className="mt-4">
        {memory.type === "image" && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image
              src={(memory.data as DBImage).url}
              alt={(memory.data as DBImage).title || "Shared memory"}
              fill
              className="object-cover"
            />
          </div>
        )}

        {memory.type === "document" && (
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Document Type: {(memory.data as DBDocument).mimeType}</p>
            <p className="text-sm text-muted-foreground">Size: {(memory.data as DBDocument).size}</p>
          </div>
        )}

        {memory.type === "note" && (
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground">{(memory.data as DBNote).content}</p>
          </div>
        )}

        {(memory.data as DBImage | DBDocument).description && (
          <p className="mt-4 text-muted-foreground">{(memory.data as DBImage | DBDocument).description}</p>
        )}
      </div>
    </div>
  );
}
