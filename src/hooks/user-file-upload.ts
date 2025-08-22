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

      const data = await uploadFile(file, isOnboarding, existingUserId);
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
      console.log("🎯 Starting folder upload process in mode 'folder'...");
      const files = event.target.files;
      if (!files) return;

      console.log("🎯 Files:", files);

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

      // Create one temporary user for the entire folder
      let folderUserId: string | undefined;
      if (isOnboarding) {
        try {
          const response = await fetch("/api/users/folder", { method: "POST" });
          const userData = await response.json();
          folderUserId = userData.id;
          console.log("👤 Created folder user:", folderUserId);
        } catch (error) {
          console.error("❌ Failed to create folder user:", error);
        }
      }

      // Process all files in parallel
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          await processSingleFile(file, true, folderUserId); // Skip success callback, use existing user
          return { success: true, file };
        } catch (error) {
          console.error(`❌ Failed to upload ${file.name}:`, error);
          return { success: false, file, error };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result) => result.success).length;

      // Update context with total count
      if (isOnboarding && successfulUploads > 0) {
        updateUserData({
          uploadedFileCount: successfulUploads,
        });
      }

      // Call success once after all files are processed
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      console.log(`⏱️ Folder upload completed in ${totalTime} seconds`);
      onSuccess?.();
      setIsLoading(false);
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
      await processSingleFile(file);
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
