"use client";

import { useSession } from "next-auth/react";
import { COPY_VARIATIONS } from "./_copy/variations";
import { Plus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useInterface } from "@/contexts/interface-context";
import { useRouter } from "next/navigation";
export default function ItemsUpload() {
  const { data: session } = useSession();
  if (session) {
    console.log(session);
  }
  const router = useRouter();
  const { setMode } = useInterface();
  const copy = COPY_VARIATIONS.LEAVE_ONE_ITEM;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    file: File;
  } | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      // User probably just cancelled the file picker
      // No need for error feedback in this case
      return;
    }

    // Create a URL for the file in memory
    const url = URL.createObjectURL(file);
    console.log("const url = URL.createObjectURL(file);");
    console.log(url);
    setUploadedFile({ url, file });

    // Optional: Clean up the old URL if it exists
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
    }

    // TODO: Show success feedback (toast/notification)
    // TODO: Add loading state during transition

    // Switch to app interface mode
    setMode("app");
    // Navigate to profile with file data
    router.push(`/onboarding/profile?fileUrl=${url}&fileName=${file.name}`);
  };

  // Clean up URL when component unmounts
  useEffect(() => {
    return () => {
      if (uploadedFile) {
        URL.revokeObjectURL(uploadedFile.url);
      }
    };
  }, [uploadedFile]);

  return (
    <div className="w-full max-w-[95%] sm:max-w-[90%] lg:max-w-[85%] mx-auto px-4 py-8 flex flex-col gap-16">
      {/* Title and subtitle container */}
      <div className="max-w-4xl">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">{copy.title}</h1>
        <p className="text-xl sm:text-2xl text-muted-foreground">{copy.subtitle}</p>
      </div>

      {/* Hidden file input */}
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple={false} />

      {/* Upload button container */}
      <div className="flex justify-center">
        <div
          role="button"
          tabIndex={0}
          onClick={handleUploadClick}
          onKeyDown={(e) => e.key === "Enter" && handleUploadClick()}
          className="w-20 h-20 rounded-full bg-black hover:bg-white dark:bg-white dark:hover:bg-black flex items-center justify-center cursor-pointer text-white hover:text-black dark:text-black dark:hover:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-all"
        >
          <Plus size={72} />
        </div>
      </div>
    </div>
  );
}

/**
 * Note on Layout Choice:
 * We're using a fluid layout (w-full + max-w-[percentage]) instead of Tailwind's container.
 * While container would be easier to maintain with its fixed breakpoints,
 * we opted for fluid design to create a more immersive, modern experience.
 * This better suits our visual-heavy, emotional content.
 *
 * Alternative using container would be:
 * <div className="container mx-auto px-4 py-8 flex flex-col gap-16">
 */

/**
 * Note on Button Choice:
 * We initially tried using shadcn's Button component, but it was overriding
 * Lucide React's Plus icon size. Instead, we're using a custom div with button role
 * to maintain full control over the icon size while keeping the interactive
 * and accessible aspects of a button.
 */

/** Note on the File object we get
 *
 * const file = event.target.files?.[0]
 *
 * 1. event.target.files is a FileList object:
 *    - Similar to an array but not exactly an array
 *    - Contains selected files from input
 *    - We use [0] because multiple={false} on input
 *
 * 2. The ?. (optional chaining):
 *    - Safely handles if files is null/undefined
 *    - Returns undefined instead of throwing error
 *
 * 3. The resulting 'file' is a File object containing:
 *    - file.name: Original filename
 *    - file.size: Size in bytes
 *    - file.type: MIME type (e.g., "image/jpeg")
 *    - file.lastModified: Timestamp
 *    - The actual file data/content in memory
 *
 * 4. This is not just a path/reference:
 *    - It's the complete file in memory
 *    - Ready for preview or upload
 *    - Can be used with URL.createObjectURL()
 */

/** Note on URL.createObjectURL
 *
 * const url = URL.createObjectURL(file)
 *
 * 1. Creates a temporary URL pointing to the file in memory
 *    - Format: "blob:http://localhost:3000/1234-5678-9abc"
 *    - URL is valid only in current browser session
 *
 * 2. Used for:
 *    - Creating image previews
 *    - Video playback
 *    - File downloads
 *
 * 3. Memory Management:
 *    - Each URL created takes up memory
 *    - Must be released with URL.revokeObjectURL()
 *    - We do this cleanup:
 *      - When a new file is selected
 *      - When component unmounts
 */
