import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useSession } from "next-auth/react";
// We'll need to create this context for post-onboarding state
// import { useVault } from '@/contexts/vault-context';

interface UseFileUploadProps {
  isOnboarding?: boolean;
  onSuccess?: () => void;
}

export function useFileUpload({ isOnboarding = false, onSuccess }: UseFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addFile: addOnboardingFile, updateUserData } = useOnboarding();
  const { data: session } = useSession();

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

      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);

      // Determine which endpoint to use based on session status
      const endpoint = session ? "/api/memories/upload" : "/api/memories/upload/onboarding";

      // Upload file
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Update user data with IDs
      if (isOnboarding) {
        updateUserData({
          allUserId: data.data.ownerId,
          isTemporary: !session,
        });

        // Add file to context without user data
        addOnboardingFile({
          url,
          file,
          uploadedAt: new Date(),
          memoryId: data.data.id,
          fileType: file.type,
        });
      }

      toast({
        title: "Memory uploaded!",
        description: "Your memory was successfully saved.",
      });
      onSuccess?.();
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
