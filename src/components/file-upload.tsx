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
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <File className="w-5 h-5" />
          Upload a File
        </CardTitle>
        <CardDescription>
          Share a document, PDF, or other file from your device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <input
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isSubmitting}
          />
          <label
            htmlFor="file-upload"
            className="group relative block w-full cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 text-center transition-colors hover:border-primary">
              {selectedFile ? (
                <>
                  <File className="mx-auto h-10 w-10 text-muted-foreground/80" />
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground/80" />
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="font-medium">
                      Drop your file here or click to browse
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Support for documents, PDFs, and more
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
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
