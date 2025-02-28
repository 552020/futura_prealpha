"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";

interface PhotoUploadProps {
  className?: string;
  onPhotoSaved?: (data: {
    id: string;
    url: string;
    filename: string;
    createdAt: string;
  }) => void;
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
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Upload a Photo
        </CardTitle>
        <CardDescription>
          Share an image or photo from your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
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
            className="group relative block w-full cursor-pointer"
          >
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 transition-colors hover:border-primary ${
                preview ? "p-2" : "px-6 py-10"
              }`}
            >
              {preview ? (
                <Image
                  src={preview}
                  alt="Photo preview"
                  className="rounded-md max-h-[300px] w-auto object-contain"
                />
              ) : (
                <>
                  <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/80" />
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="font-medium">
                      Drop your photo here or click to browse
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Supports JPG, PNG and GIF files
                    </span>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isSubmitting || !selectedFile}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Upload Photo
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
