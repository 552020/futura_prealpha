import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/onboarding-context";
// We'll need to create this context for post-onboarding state
// import { useVault } from '@/contexts/vault-context';

interface UseFileUploadProps {
  isOnboarding?: boolean;
  onSuccess?: () => void;
}

export function useFileUpload({
  isOnboarding = false,
  onSuccess,
}: UseFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addFile: addOnboardingFile, setCurrentStep } = useOnboarding();

  // const { addFile: addVaultFile } = useVault(); // Future implementation

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      if (file.size > 50 * 1024 * 1024) {
        throw new Error("File too large");
      }

      const url = URL.createObjectURL(file);

      const fileData = {
        url,
        file,
        uploadedAt: new Date(),
      };

      if (isOnboarding) {
        addOnboardingFile(fileData);
        setCurrentStep("profile");
        toast({
          title: "File uploaded successfully!",
          description: "Your first memory has been saved.",
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
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Please try uploading again.",
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
