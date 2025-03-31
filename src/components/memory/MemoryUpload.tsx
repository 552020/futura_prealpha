import { useState } from "react";
import { Plus, Loader2, Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/user-file-upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MemoryUploadProps {
  isOnboarding?: boolean;
  variant?: "button" | "icon" | "large-icon" | "native";
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function MemoryUpload({ isOnboarding = false, variant = "button", onSuccess, onError }: MemoryUploadProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { isLoading, fileInputRef, handleUploadClick, handleFileChange } = useFileUpload({
    isOnboarding,
    onSuccess: () => {
      setShowUploadDialog(false);
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const renderTrigger = () => {
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
            onClick={handleUploadClick}
            onKeyDown={(e) => e.key === "Enter" && handleUploadClick()}
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
