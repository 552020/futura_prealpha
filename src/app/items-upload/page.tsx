"use client";

import { useSession } from "next-auth/react";

export default function ItemsUpload() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Upload Your Digital Legacy</h1>

      <div className="max-w-2xl mx-auto">
        <p className="text-lg mb-6 text-muted-foreground">
          Upload photos and other digital items that you want to preserve forever.
        </p>

        {/* Upload section will go here */}
      </div>
    </div>
  );
}
