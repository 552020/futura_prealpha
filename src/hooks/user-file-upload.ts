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
  const { addFile: addOnboardingFile, updateUserData, setCurrentStep } = useOnboarding();
  const { data: session } = useSession();

  // const { addFile: addVaultFile } = useVault(); // Future implementation

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("🎯 Starting client-side upload process...");
    console.log("📄 File selected:", {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    });

    try {
      setIsLoading(true);

      if (file.size > 50 * 1024 * 1024) {
        console.error("❌ File too large");
        throw new Error("File too large");
      }

      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);
      console.log("🖼️ Created temporary preview URL");

      // Determine which endpoint to use based on session status
      const endpoint = session ? "/api/memories/upload" : "/api/memories/upload/onboarding";
      console.log("🎯 Using endpoint:", endpoint);

      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      console.log("📤 Sending file to server...");

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      console.log("📥 Received server response:", {
        status: response.status,
        statusText: response.statusText,
      });

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        console.error("❌ Server returned error:", data);
        throw new Error(data.error || "Upload failed");
      }

      // Update user data with IDs
      if (isOnboarding) {
        console.log("👤 Updating user data with:", {
          allUserId: data.ownerId,
          memoryId: data.id,
        });

        updateUserData({
          allUserId: data.ownerId,
          isTemporary: !session,
          memoryId: data.id,
        });

        // Add file to context without user data
        console.log("📝 Adding file to onboarding context");
        addOnboardingFile({
          url,
          file,
          uploadedAt: new Date(),
          memoryId: data.id,
          fileType: file.type,
        });

        // Set the current step to user-info after successful upload
        console.log("🔄 Setting current step to user-info");
        setCurrentStep("user-info");
      }

      console.log("✅ Upload process completed successfully");
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

      console.error("❌ Upload error:", error);
      toast({
        variant: "destructive",
        title,
        description,
      });
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
