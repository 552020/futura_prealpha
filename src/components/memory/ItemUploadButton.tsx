import { useState } from "react";
import { Plus, Loader2, Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/user-file-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// interface ItemUploadButtonProps {
//   isOnboarding?: boolean;
//   variant?: "button" | "icon" | "large-icon" | "native";
//   onSuccess?: () => void;
//   onError?: (error: Error) => void;
// }

type UploadMode = "folder" | "files";

interface ItemUploadButtonProps {
  mode?: UploadMode; // NEW
  isOnboarding?: boolean;
  variant?: "button" | "icon" | "large-icon" | "native" | "album-button" | "one-shot-button";
  onSuccess?: () => void;
  onError?: (e: Error) => void;
}

/**
 * TODO: Refactor component structure for better readability
 *
 * Current issues:
 * - Multiple return statements scattered throughout renderTrigger()
 * - Main return is confusing (always reached but unclear intent)
 * - Logic mixed between file handling and UI rendering
 *
 * Proposed improvements:
 * - Single return with conditional rendering
 * - Separate components for native vs custom variants
 * - Clearer separation of concerns
 *
 * The idea of different upload button shapes based on context is good:
 * - "large-icon": Big circular button for prominent upload areas (onboarding, vault)
 * - "icon": Small icon for inline uploads
 * - "button": Standard button with text
 * - "native": Browser's default file input
 *
 * TODO: Fix TypeScript overcomplication for webkitdirectory/directory attributes
 * - Current workaround: {...({} as any)} bypasses type checking
 * - Better approach: Extend HTML input interface or use proper type definitions
 * - This is just TypeScript being overly strict about experimental attributes
 */
export function ItemUploadButton({
  mode = "folder",
  isOnboarding = false,
  variant = "button",
  onSuccess,
  onError,
}: ItemUploadButtonProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { isLoading, fileInputRef, handleUploadClick, handleFileChange } = useFileUpload({
    isOnboarding,
    mode,
    onSuccess: () => {
      setShowUploadDialog(false);
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const renderTrigger = () => {
    // Test toast on click
    const handleClick = () => {
      //   toast({
      //     title: "Test",
      //     description: "Toast is working",
      //   });
      handleUploadClick();
    };
    if (variant === "native") {
      return (
        <input
          type="file"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          multiple={false}
          accept="image/*,video/*,audio/*"
        />
      );
    }

    switch (variant) {
      case "large-icon":
        return (
          <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => e.key === "Enter" && handleClick()}
            className="w-20 h-20 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
          >
            {isLoading ? <Loader2 size={72} className="animate-spin" /> : <Plus size={72} />}
          </div>
        );
      case "icon":
        return (
          <Button variant="ghost" size="icon" onClick={handleUploadClick} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        );
      default:
        return (
          <Button onClick={handleUploadClick} disabled={isLoading} className="gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Memory
          </Button>
        );
      case "album-button":
        return (
          <button
            onClick={handleClick}
            className="px-6 py-3 rounded-lg font-medium transition-all bg-black text-white dark:bg-white dark:text-black"
          >
            Album
          </button>
        );
      case "one-shot-button":
        return (
          <button
            onClick={handleClick}
            className="px-6 py-3 rounded-lg font-medium transition-all bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            One Shot
          </button>
        );
    }
  };

  return (
    <>
      {/* Hidden file input - only needed for non-native variants */}
      {variant !== "native" && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
          accept="image/*,video/*,audio/*"
        />
      )}

      {/* Upload trigger */}
      {renderTrigger()}

      {/* Upload Dialog - shown while uploading */}
      {variant !== "native" && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uploading Memory</DialogTitle>
              <DialogDescription>Please wait while we upload your memory...</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
