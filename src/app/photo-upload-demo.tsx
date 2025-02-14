"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function PhotoUploadDemo() {
  const { data: session } = useSession();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = () => {
    if (!session) {
      setShowAuthModal(true);
      return;
    }
    // Handle saving for logged-in users
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <Image
          src={previewUrl || "/default-avatar.png"}
          alt="Preview"
          width={128}
          height={128}
          className="rounded-full object-cover"
        />
        <label
          htmlFor="photo-upload-demo"
          className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:opacity-90"
        >
          <Camera className="w-5 h-5 text-white" />
          <input id="photo-upload-demo" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
        </label>
      </div>

      {previewUrl && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">Looking good!</h2>
          <Button onClick={handleSave}>{session ? "Save Photo" : "Sign in to Save"}</Button>
        </div>
      )}
    </div>
  );
}
