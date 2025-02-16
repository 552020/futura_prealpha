import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Plus, Share2 } from "lucide-react";

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

export function Profile({ isOnboarding = false, uploadedFile = null }: ProfileProps) {
  return (
    <div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8">
      {/* Header - No button */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold">Your Digital Vault</h2>
      </div>

      {/* Memory Display */}
      <div className="w-full">
        <Card className="aspect-square w-full max-w-2xl mx-auto overflow-hidden relative">
          {uploadedFile ? (
            <Image
              src={uploadedFile.url}
              alt="Your memory"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground">Your vault awaits its first memory</p>
            </div>
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
      {isOnboarding && uploadedFile && (
        <Card className="mt-8 p-6 text-center">
          <h3 className="text-xl font-semibold mb-4">First Memory Secured! 🔒</h3>
          <p className="text-muted-foreground">Your digital vault has received its first treasure.</p>
        </Card>
      )}
    </div>
  );
}
