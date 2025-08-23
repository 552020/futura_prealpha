import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useSession } from "next-auth/react";
import { uploadFile } from "@/services/upload";
// We'll need to create this context for post-onboarding state
// import { useVault } from '@/contexts/vault-context';

type UploadMode = "folder" | "files";

interface UseFileUploadProps {
  mode?: UploadMode;
  isOnboarding?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useFileUpload({ isOnboarding = false, mode = "folder", onSuccess, onError }: UseFileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { addFile: addOnboardingFile, updateUserData, setCurrentStep } = useOnboarding();
  const { data: session } = useSession();

  // const { addFile: addVaultFile } = useVault(); // Future implementation

  const fileInputRef = useRef<HTMLInputElement>(null);

  //   const handleUploadClick = () => {
  //     fileInputRef.current?.click();
  //   };

  //   const handleFolderUploadClick = () => {
  //     const el = fileInputRef.current;
  //     if (!el) return;

  //     el.setAttribute("webkitdirectory", "");
  //     el.setAttribute("directory", "");
  //     el.multiple = true;

  //     el.click();
  //   };

  const handleUploadClick = () => {
    const el = fileInputRef.current;
    if (!el) return;

    // reset to file mode first
    el.removeAttribute("webkitdirectory");
    el.removeAttribute("directory");
    el.multiple = false;

    if (mode === "folder") {
      el.setAttribute("webkitdirectory", "");
      el.setAttribute("directory", "");
      el.multiple = true;
    }

    el.click();
  };

  const checkFileSize = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      console.error("❌ File too large");
      throw new Error("File too large");
    }
  };

  const updateOnboardingContext = (data: { data: { ownerId: string; id: string } }, file: File, url: string) => {
    console.log("👤 Updating user data with:", {
      allUserId: data.data.ownerId,
      memoryId: data.data.id,
    });

    updateUserData({
      allUserId: data.data.ownerId,
      isTemporary: !session,
      memoryId: data.data.id,
    });

    // Add file to context without user data
    const fileToAdd = {
      url,
      file,
      uploadedAt: new Date(),
      memoryId: data.data.id,
      fileType: file.type,
    };
    console.log("📝 Adding file to onboarding context:", fileToAdd);
    addOnboardingFile(fileToAdd);

    // Set the next step based on authentication status
    if (session) {
      console.log("🔄 Setting current step to share (authenticated user)");
      setCurrentStep("share");
    } else {
      console.log("🔄 Setting current step to user-info (unauthenticated user)");
      setCurrentStep("user-info");
    }
  };

  const processSingleFile = async (file: File, skipSuccess = false, existingUserId?: string) => {
    try {
      checkFileSize(file);

      // Create a temporary URL for preview
      const url = URL.createObjectURL(file);
      console.log("🖼️ Created temporary preview URL");

      const data = await uploadFile(file, isOnboarding, existingUserId, mode);
      console.log("📦 Response data:", data);

      if (isOnboarding) {
        updateOnboardingContext(data, file, url);
      }

      console.log("✅ Upload process completed successfully");
      if (!skipSuccess) {
        onSuccess?.();
      }
    } catch (error) {
      console.log("🔍 Caught error in processSingleFile:", error);
      console.log("🔍 Error message:", error instanceof Error ? error.message : String(error));

      let title = "Something went wrong";
      let description = "Please try uploading again.";

      if (error instanceof Error && error.message === "File too large") {
        title = "File too large";
        description = "Please upload a file smaller than 50MB.";
      }

      if (error instanceof Error && error.message === "Invalid file type") {
        title = "Invalid file type";
        description =
          "Please upload an image (JPEG, PNG, GIF, WebP), video (MP4, MOV, AVI, WebM), or document (PDF, DOC, TXT, MD).";
      }

      console.error("❌ Upload error:", error);
      console.log("🔍 Showing toast with:", { title, description });

      toast({
        variant: "destructive",
        title,
        description,
      });

      if (onError) {
        onError(error as Error);
      }
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (mode == "folder") {
      const startTime = Date.now();
      console.log("Starting folder upload process in mode 'folder'...");
      const files = event.target.files;
      if (!files) return;

      console.log(`Found ${files.length} files in folder`);

      // Check file count limit
      if (files.length > 25) {
        toast({
          variant: "destructive",
          title: "Too many files",
          description: "Please select a folder with 25 files or fewer.",
        });
        return;
      }

      setIsLoading(true);

      try {
        // Send all files to folder endpoint in single request
        const formData = new FormData();
        Array.from(files).forEach((file) => {
          formData.append("file", file);
        });

        console.log("Sending folder to server...");
        const response = await fetch("/api/memories/upload/onboarding/folder", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Folder upload response:", data);

        if (!response.ok) {
          throw new Error(data.error || "Folder upload failed");
        }

        // Update context with results
        if (isOnboarding && data.successfulUploads > 0) {
          console.log("📝 Updating onboarding context with folder upload results:", {
            successfulUploads: data.successfulUploads,
            allUserId: data.userId,
            memoryId: data.results?.[0]?.memoryId,
          });

          updateUserData({
            uploadedFileCount: data.successfulUploads,
            allUserId: data.userId, // Use the userId from the response
            memoryId: data.results?.[0]?.memoryId, // Use first result's memory ID
          });

          // Set the next step based on authentication status
          if (session) {
            console.log("🔄 Setting current step to share (authenticated user)");
            setCurrentStep("share");
          } else {
            console.log("🔄 Setting current step to user-info (unauthenticated user)");
            setCurrentStep("user-info");
          }
        }

        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        console.log(`Folder upload completed in ${totalTime} seconds`);
        onSuccess?.();
      } catch (error) {
        console.error("Folder upload error:", error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Please try again.",
        });
        if (onError) {
          onError(error as Error);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (mode == "files") {
      console.log("🎯 Starting client-side upload process in mode 'files'...");

      const file = event.target.files?.[0];
      if (!file) return;

      console.log("🎯 Starting client-side upload process...");
      console.log("📄 File selected:", {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });

      setIsLoading(true);
      await processSingleFile(file, false, undefined);
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
