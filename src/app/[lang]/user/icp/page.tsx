"use client";

import { useAuthGuard } from "@/utils/authentication";
import { Loader2 } from "lucide-react";

export default function ICPPage() {
  const { isAuthorized, isLoading } = useAuthGuard();

  if (!isAuthorized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">Hello ICP</h1>
      <p className="text-gray-600 dark:text-gray-400">This is the ICP page. Content will be added here.</p>
    </div>
  );
}
