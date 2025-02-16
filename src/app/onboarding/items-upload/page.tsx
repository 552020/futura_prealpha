"use client";

import { useSession } from "next-auth/react";
import { COPY_VARIATIONS } from "./_copy/variations";
import { Plus } from "lucide-react";
import { useRef, useState, useEffect } from "react";

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
export default function ItemsUpload() {
  const { data: session } = useSession();
  if (session) {
    console.log(session);
  }
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
    if (!file) return;

    // Create a URL for the file in memory
    const url = URL.createObjectURL(file);
    setUploadedFile({ url, file });

    // Optional: Clean up the old URL if it exists
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.url);
    }
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
