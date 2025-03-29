"use client";

import "@/app/[lang]/globals.css";
import { SessionProvider } from "next-auth/react";
import { PostHogProvider } from "@/components/posthog-provider";

export default function TestsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Test Pages</h1>
        <p>Test pages are only available in development mode.</p>
      </div>
    );
  }

  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
