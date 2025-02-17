"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Plus, Share2, ChevronLeft, ChevronRight, FileText, Music, Video, Archive, File } from "lucide-react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { useState } from "react";

/**
 * Profile Component Redesign
 *
 * Changes from social media style to digital vault:
 * 1. Removed Avatar (redundant with header)
 * 2. Changed title to emphasize personal archive nature
 * 3. Added consistent Plus button (matching upload page)
 * 4. Simplified layout to focus on memories
 *
 * Current vs New:
 * - Was: Social-style profile with avatar and generic title
 * - Now: Personal vault emphasizing the private, archival nature
 */

interface ProfileProps {
  isOnboarding?: boolean;
  uploadedFile?: {
    url: string;
    file: File;
  } | null;
}

export function Profile({ isOnboarding = false }: ProfileProps) {
  const { files, currentStep } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(files.length - 1);
  const currentFile = files[currentIndex];

  const getFileIcon = (type: string) => {
    if (type.startsWith("text/") || type.includes("pdf")) return <FileText size={48} />;
    if (type.startsWith("audio/")) return <Music size={48} />;
    if (type.startsWith("video/")) return <Video size={48} />;
    if (type.includes("zip") || type.includes("rar")) return <Archive size={48} />;
    return <File size={48} />;
  };

  const navigateMemory = (direction: "prev" | "next") => {
    if (direction === "prev" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === "next" && currentIndex < files.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8">
      {/* Header with memory count */}
      <div className="mb-16 flex justify-between items-center">
        <h2 className="text-3xl font-bold">Your Digital Vault</h2>
        {files.length > 0 && (
          <span className="text-muted-foreground">
            Memory {currentIndex + 1} of {files.length}
          </span>
        )}
      </div>

      {/* Memory Display */}
      <div className="w-full">
        <Card className="aspect-square w-full max-w-2xl mx-auto overflow-hidden relative">
          {currentFile ? (
            <div className="w-full h-full">
              {currentFile.file.type.startsWith("image/") ? (
                <Image
                  src={currentFile.url}
                  alt="Your memory"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                  {getFileIcon(currentFile.file.type)}
                  <div className="text-center">
                    <p className="font-medium">{currentFile.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentFile.file.type.split("/")[1].toUpperCase()}
                      {" • "}
                      {Math.round(currentFile.file.size / 1024)}KB
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Added {new Date(currentFile.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Your vault awaits its first memory</p>
            </div>
          )}

          {/* Navigation arrows */}
          {files.length > 1 && (
            <>
              <button
                onClick={() => navigateMemory("prev")}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => navigateMemory("next")}
                disabled={currentIndex === files.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <div
          role="button"
          tabIndex={0}
          className="w-14 h-14 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
        >
          <Plus size={32} />
        </div>
        <div
          role="button"
          tabIndex={0}
          className="w-14 h-14 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
        >
          <Share2 size={32} />
        </div>
      </div>

      {/* Celebration Layer */}
      {isOnboarding && currentFile && currentStep === "profile" && (
        <Card className="mt-8 p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">First Memory Secured! 🔒</h3>
          <p className="text-muted-foreground">Your digital vault has received its first treasure.</p>
        </Card>
      )}
    </div>
  );
}
