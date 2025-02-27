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
import { File, Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FileUploadProps {
  className?: string;
  onFileSaved?: (data: {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: string;
    createdAt: string;
  }) => void;
}

export function FileUpload({ className, onFileSaved }: FileUploadProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const session = useSession();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (session.status !== "authenticated") {
      toast({
        title: "Authentication required",
        description: "You must be signed in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", session.data.user.id);

      const response = await fetch("/api/save-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file.");
      }

      const data = await response.json();

      toast({
        title: "File uploaded",
        description: "Your file has been added to your vault.",
      });

      // Call the callback if it exists
      if (onFileSaved) {
        onFileSaved(data);
      }

      // Reset form
      setSelectedFile(null);

      // Clear the file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Something went wrong",
        description: "Failed to upload your file. Please try again.",
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
          <File className="w-5 h-5" />
          <span>Upload a File</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isSubmitting}
          />
          <label
            htmlFor="file-upload"
            className="block w-full p-12 border-2 border-dashed rounded-lg hover:border-primary cursor-pointer transition-colors"
          >
            <div className="flex flex-col items-center justify-center text-muted-foreground">
              {selectedFile ? (
                <>
                  <File className="w-8 h-8 mb-2" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2" />
                  <span>Click to select a file</span>
                </>
              )}
            </div>
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
            "Upload File"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
