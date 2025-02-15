"use client";

import { useSession } from "next-auth/react";
import { COPY_VARIATIONS } from "./_copy/variations";

export default function ItemsUpload() {
  const { data: session } = useSession();

  const copy = COPY_VARIATIONS.LEAVE_ONE_ITEM;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold mb-8 tracking-tight">{copy.title}</h1>

      <div className="max-w-2xl mx-auto">
        <p className="text-xl sm:text-2xl mb-12 text-muted-foreground">{copy.subtitle}</p>

        {/* Upload section will go here */}
      </div>
    </div>
  );
}
