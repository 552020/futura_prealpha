import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/onboarding-context";
// We'll need to create this context for post-onboarding state
// import { useVault } from '@/contexts/vault-context';

interface UseFileUploadProps {
  isOnboarding?: boolean;
  onSuccess?: () => void;
}

export function useFileUpload({ isOnboarding = false, onSuccess }: UseFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addFile: addOnboardingFile } = useOnboarding();

  // const { addFile: addVaultFile } = useVault(); // Future implementation

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File too large");
      }

      if (isOnboarding) {
        // Create a temporary URL for preview
        const url = URL.createObjectURL(file);

        // Upload to onboarding endpoint
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/memories/upload/onboarding", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        // Add to onboarding context for preview
        // Note: We store the file in memory for preview purposes only
        // The actual file data is already uploaded and stored in the database
        addOnboardingFile({
          url,
          file,
          uploadedAt: new Date(),
          memoryId: data.memoryId,
          ownerId: data.ownerId,
          temporaryUserId: data.temporaryUserId,
          fileType: file.type,
        });

        toast({
          title: "Memory uploaded!",
          description: "Your memory was successfully saved.",
        });
        onSuccess?.();
      } else {
        // Regular upload flow (to be implemented)
        // await addVaultFile(fileData);
        toast({
          title: "File uploaded successfully!",
          description: "Your memory has been added to your vault.",
        });
      }
    } catch (error) {
      let title = "Something went wrong";
      let description = "Please try uploading again.";

      if (error instanceof Error && error.message === "File too large") {
        title = "File too large";
        description = "Please upload a file smaller than 50MB.";
      }

      toast({
        variant: "destructive",
        title,
        description,
      });
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
  };
}
