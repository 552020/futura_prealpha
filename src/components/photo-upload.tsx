"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  className?: string;
  onPhotoSaved?: (data: { id: string; url: string; createdAt: string }) => void;
}

export function PhotoUpload({ className, onPhotoSaved }: PhotoUploadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const session = useSession();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clear previous preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    // Create new preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (session.status !== "authenticated") {
      toast({
        title: "Authentication required",
        description: "You must be signed in to upload photos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("userId", session.data.user.id);

      const response = await fetch("/api/save-photo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload photo.");
      }

      const data = await response.json();

      toast({
        title: "Photo uploaded",
        description: "Your photo has been added to your vault.",
      });

      // Call the callback if it exists
      if (onPhotoSaved) {
        onPhotoSaved(data);
      }

      // Reset form
      setSelectedFile(null);
      setPreview(null);

      // Clear the file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to upload your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          <span>Upload a Photo</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
            disabled={isSubmitting}
          />
          <label
            htmlFor="photo-upload"
            className="block w-full aspect-video border-2 border-dashed rounded-lg hover:border-primary cursor-pointer transition-colors"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Image className="w-8 h-8 mb-2" />
                <span>Click to select a photo</span>
              </div>
            )}
          </label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleUpload} disabled={isSubmitting || !selectedFile}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Photo"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
